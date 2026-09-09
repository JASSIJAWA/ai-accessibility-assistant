"""
Vision AI Module
Handles object detection (YOLOv8) and emotion recognition (DeepFace).
Processes base64 frames received via WebSocket and returns detection results.
"""

import cv2
import numpy as np
import base64
from ultralytics import YOLO

# Lazy-load DeepFace to speed up startup
_deepface = None

def get_deepface():
    global _deepface
    if _deepface is None:
        from deepface import DeepFace
        _deepface = DeepFace
    return _deepface


# Load YOLOv8 nano model (fast + lightweight, perfect for real-time)
yolo_model = YOLO("yolov8n.pt")


def decode_frame(base64_data: str) -> np.ndarray:
    """Decode a base64-encoded image string into an OpenCV frame."""
    # Strip the data URL prefix if present (e.g., "data:image/jpeg;base64,")
    if "," in base64_data:
        base64_data = base64_data.split(",")[1]

    img_bytes = base64.b64decode(base64_data)
    img_array = np.frombuffer(img_bytes, dtype=np.uint8)
    frame = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
    return frame


def detect_objects(frame: np.ndarray, conf_threshold: float = 0.4) -> list:
    """
    Run YOLOv8 object detection on a frame.
    Returns a list of detections: [{label, confidence, box: {x1, y1, x2, y2}}]
    """
    results = yolo_model(frame, verbose=False, conf=conf_threshold)
    detections = []

    for result in results:
        for box in result.boxes:
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            confidence = float(box.conf[0])
            class_id = int(box.cls[0])
            label = yolo_model.names[class_id]

            detections.append({
                "label": label,
                "confidence": round(confidence, 2),
                "box": {
                    "x1": round(x1),
                    "y1": round(y1),
                    "x2": round(x2),
                    "y2": round(y2),
                }
            })

    return detections


def detect_emotions(frame: np.ndarray) -> list:
    """
    Detect faces and their emotions using DeepFace.
    Returns a list: [{emotion, confidence, box: {x, y, w, h}}]
    """
    DeepFace = get_deepface()
    try:
        results = DeepFace.analyze(
            frame,
            actions=["emotion"],
            enforce_detection=False,
            silent=True,
            detector_backend="mtcnn",  # More reliable face detector
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
    except Exception as e:
        print(f"Emotion detection error: {e}")
        return []


def process_frame(base64_data: str) -> dict:
    """
    Main processing pipeline:
    1. Decode the base64 frame
    2. Run object detection
    3. Run emotion recognition
    4. Return combined results as JSON
    """
    frame = decode_frame(base64_data)
    if frame is None:
        return {"error": "Failed to decode frame"}

    # Get frame dimensions for frontend coordinate mapping
    h, w = frame.shape[:2]

    objects = detect_objects(frame)
    emotions = detect_emotions(frame)

    return {
        "frame_size": {"width": w, "height": h},
        "objects": objects,
        "emotions": emotions,
        "object_count": len(objects),
        "face_count": len(emotions),
    }
