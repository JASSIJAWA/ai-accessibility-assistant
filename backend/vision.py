"""
Vision AI Module — Enhanced with Visiona-inspired spatial intelligence.

Features:
  - YOLOv8 object detection
  - Known-size distance estimation (meters + steps)
  - Spatial positioning (left/ahead/right)
  - Scene change detection (only narrate when scene changes)
  - Smart grouping ("3 chairs on your left")
  - Priority scoring (closest/most dangerous first)
  - Emotion recognition (DeepFace)
  - Scene summary generation for TTS narration
"""

import cv2
import numpy as np
import base64
import time
from collections import Counter
from ultralytics import YOLO

# Lazy-load DeepFace to speed up startup
_deepface = None

def get_deepface():
    global _deepface
    if _deepface is None:
        from deepface import DeepFace
        _deepface = DeepFace
    return _deepface


# Load YOLO11 medium model (much more accurate than v8 small)
# Downloads automatically on first run (~50MB)
yolo_model = YOLO("yolo11m.pt")


# ─── Known real-world heights (meters) for calibrated distance estimation ───
# Source: Visiona AI spec — known object dimensions for focal-length estimation
KNOWN_HEIGHTS_M = {
    "person": 1.70, "bicycle": 1.10, "car": 1.50, "motorcycle": 1.10,
    "bus": 3.00, "truck": 3.50, "traffic light": 0.70, "fire hydrant": 0.50,
    "stop sign": 0.75, "bench": 0.85, "cat": 0.30, "dog": 0.50,
    "chair": 0.85, "couch": 0.85, "dining table": 0.75, "toilet": 0.40,
    "tv": 0.50, "laptop": 0.25, "cell phone": 0.14, "book": 0.25,
    "bottle": 0.25, "cup": 0.12, "backpack": 0.50, "umbrella": 1.00,
    "suitcase": 0.70, "refrigerator": 1.70, "oven": 0.85, "microwave": 0.30,
    "door": 2.00, "potted plant": 0.40, "bed": 0.60, "clock": 0.30,
}

# Approximate camera focal length in pixels (calibrated for typical phone camera at 640px height)
# Formula: focal_px = (known_height_px * known_distance_m) / known_height_m
# Calibrated: person at 3m fills ~300px in a 640px frame → focal = (300*3)/1.7 ≈ 530
FOCAL_LENGTH_PX = 530.0

# Fallback: bounding-box-ratio distance table (for objects without known sizes)
RATIO_TO_STEPS = [
    (0.70, 1), (0.50, 2), (0.35, 3), (0.25, 5),
    (0.15, 8), (0.10, 12), (0.05, 15),
]

# Scene memory for change detection
_last_scene_key = ""
_last_scene_time = 0.0


def decode_frame(base64_data: str) -> np.ndarray:
    """Decode a base64-encoded image string into an OpenCV frame."""
    if "," in base64_data:
        base64_data = base64_data.split(",")[1]
    img_bytes = base64.b64decode(base64_data)
    img_array = np.frombuffer(img_bytes, dtype=np.uint8)
    frame = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
    return frame


def estimate_distance(label: str, box_height: float, frame_height: float) -> dict:
    """
    Estimate distance using known object sizes (focal-length method) or
    bounding-box ratio fallback. Returns meters and steps.
    """
    known_h = KNOWN_HEIGHTS_M.get(label)

    if known_h and box_height > 10:
        # Focal length formula: distance = (real_height * focal_length) / pixel_height
        distance_m = (known_h * FOCAL_LENGTH_PX) / box_height
        distance_m = max(0.3, min(distance_m, 20.0))  # Clamp to reasonable range
    else:
        # Fallback: ratio-based estimation
        ratio = box_height / frame_height if frame_height > 0 else 0
        distance_m = 0.5  # default very close
        for r, steps in RATIO_TO_STEPS:
            if ratio > r:
                distance_m = steps * 0.75  # 1 step ≈ 0.75m
                break
        else:
            distance_m = 12.0  # Far away

    steps = max(1, round(distance_m / 0.75))
    return {
        "distance_m": round(distance_m, 1),
        "distance_steps": steps,
    }


def get_position(box_center_x: float, frame_width: float) -> str:
    """Determine if object is on the left, center, or right of the frame."""
    ratio = box_center_x / frame_width if frame_width > 0 else 0.5
    if ratio < 0.33:
        return "on your left"
    elif ratio < 0.66:
        return "ahead"
    else:
        return "on your right"


def get_urgency(distance_steps: int) -> str:
    """Classify urgency based on distance."""
    if distance_steps <= 2:
        return "critical"   # Very close — collision risk
    elif distance_steps <= 5:
        return "warning"    # Close — be careful
    elif distance_steps <= 10:
        return "info"       # Nearby — awareness
    else:
        return "background" # Far — low priority


def detect_objects(frame: np.ndarray, conf_threshold: float = 0.45) -> list:
    """
    Run YOLOv8 object detection with calibrated spatial awareness.
    """
    h, w = frame.shape[:2]
    results = yolo_model(frame, verbose=False, conf=conf_threshold)
    detections = []

    for result in results:
        for box in result.boxes:
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            confidence = float(box.conf[0])
            class_id = int(box.cls[0])
            label = yolo_model.names[class_id]

            box_center_x = (x1 + x2) / 2
            box_height = y2 - y1

            dist = estimate_distance(label, box_height, h)
            position = get_position(box_center_x, w)
            urgency = get_urgency(dist["distance_steps"])

            detections.append({
                "label": label,
                "confidence": round(confidence, 2),
                "box": {
                    "x1": round(x1), "y1": round(y1),
                    "x2": round(x2), "y2": round(y2),
                },
                "position": position,
                "distance_m": dist["distance_m"],
                "distance_steps": dist["distance_steps"],
                "urgency": urgency,
            })

    # Sort by distance (closest first)
    detections.sort(key=lambda d: d["distance_steps"])
    return detections


def build_scene_narration(objects: list, emotions: list) -> dict:
    """
    Build an intelligent scene narration for TTS.
    Groups objects, prioritizes by distance, builds natural speech.
    Returns: {narration: str, scene_key: str, changed: bool}
    """
    global _last_scene_key, _last_scene_time

    if not objects and not emotions:
        return {"narration": "", "scene_key": "", "changed": False}

    parts = []

    # ── Group objects by label+position to avoid repetition ──
    # e.g., "3 chairs on your left" instead of "chair, chair, chair"
    groups = {}
    for obj in objects:
        key = f"{obj['label']}_{obj['position']}"
        if key not in groups:
            groups[key] = {
                "label": obj["label"],
                "position": obj["position"],
                "closest_steps": obj["distance_steps"],
                "closest_m": obj["distance_m"],
                "urgency": obj["urgency"],
                "count": 0,
            }
        groups[key]["count"] += 1
        # Keep track of the closest one
        if obj["distance_steps"] < groups[key]["closest_steps"]:
            groups[key]["closest_steps"] = obj["distance_steps"]
            groups[key]["closest_m"] = obj["distance_m"]
            groups[key]["urgency"] = obj["urgency"]

    # Sort groups by closest distance
    sorted_groups = sorted(groups.values(), key=lambda g: g["closest_steps"])

    # Build speech for top 5 groups
    for g in sorted_groups[:5]:
        label = g["label"]
        count = g["count"]
        steps = g["closest_steps"]
        pos = g["position"]
        urgency = g["urgency"]

        # Pluralize
        name = f"{count} {label}s" if count > 1 else label

        # Build distance phrase
        if urgency == "critical":
            parts.append(f"Caution! {name} very close, {pos}")
        elif urgency == "warning":
            parts.append(f"{name} about {steps} steps {pos}")
        else:
            parts.append(f"{name} {pos}")

    # ── Emotions ──
    if emotions:
        emo = emotions[0]
        if emo.get("confidence", 0) > 60:
            parts.append(f"person looks {emo['emotion']}")

    narration = ". ".join(parts) + "." if parts else ""

    # ── Scene change detection ──
    # Build a simplified key from object labels + rough positions
    scene_key = "|".join(
        f"{g['label']}:{g['count']}:{g['position']}:{g['closest_steps']}"
        for g in sorted_groups[:5]
    )

    now = time.time()
    changed = (scene_key != _last_scene_key) or (now - _last_scene_time > 8.0)

    if changed:
        _last_scene_key = scene_key
        _last_scene_time = now

    return {
        "narration": narration,
        "scene_key": scene_key,
        "changed": changed,
    }


def detect_emotions(frame: np.ndarray) -> list:
    """Detect faces and their emotions using DeepFace."""
    try:
        DeepFace = get_deepface()
    except Exception as e:
        # DeepFace may fail due to protobuf/tensorflow conflicts — don't crash pipeline
        print(f"⚠️ DeepFace unavailable: {e}", flush=True)
        return []
    try:
        results = DeepFace.analyze(
            frame,
            actions=["emotion"],
            enforce_detection=True,
            silent=True,
            detector_backend="ssd",
        )

        emotions = []
        for face in results:
            dominant = face.get("dominant_emotion", "unknown")
            confidence = face.get("emotion", {}).get(dominant, 0)
            region = face.get("region", {})

            emotions.append({
                "emotion": dominant,
                "confidence": round(confidence, 1),
                "box": {
                    "x": region.get("x", 0),
                    "y": region.get("y", 0),
                    "w": region.get("w", 0),
                    "h": region.get("h", 0),
                }
            })

        return emotions
    except ValueError as e:
        if "Face could not be detected" not in str(e):
            print(f"Emotion detection error: {e}")
        return []
    except Exception as e:
        print(f"Emotion detection error: {e}")
        return []


def process_frame(base64_data: str) -> dict:
    """
    Main processing pipeline:
    1. Decode the base64 frame
    2. Run object detection with spatial awareness
    3. Run emotion recognition
    4. Build scene narration
    5. Return everything as JSON
    """
    start_t = time.time()

    frame = decode_frame(base64_data)
    if frame is None:
        return {"error": "Failed to decode frame"}

    h, w = frame.shape[:2]

    objects = detect_objects(frame)
    emotions = detect_emotions(frame)
    narration = build_scene_narration(objects, emotions)

    elapsed = round((time.time() - start_t) * 1000)
    obj_summary = ", ".join(f"{o['label']}({o['distance_steps']}steps)" for o in objects[:3])
    print(f"Frame {elapsed}ms | {len(objects)} objects [{obj_summary}] | {len(emotions)} faces | changed={narration['changed']}", flush=True)

    return {
        "frame_size": {"width": w, "height": h},
        "objects": objects,
        "emotions": emotions,
        "narration": narration["narration"],
        "scene_changed": narration["changed"],
        "object_count": len(objects),
        "face_count": len(emotions),
    }
