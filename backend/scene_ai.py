"""
Scene AI — Gemini Vision API for intelligent scene understanding.

Uses google.genai SDK with gemini-3.8-flash model.
Sends camera frames + YOLO detection context every ~8 seconds.
Handles rate limits with automatic backoff and recovery.
"""

import os
import time
import base64
import threading
from typing import Optional, List

_client = None
_last_call_time = 0.0
_last_description = ""
_lock = threading.Lock()
_initialized = False

# Start at 8s interval, increases on rate limit, resets on success
_current_interval = 8.0
MIN_INTERVAL = 8.0
MAX_INTERVAL = 60.0  # Back off up to 1 minute
_rate_limited_until = 0.0  # Timestamp when rate limit expires

SCENE_PROMPT = """You are a real-time navigation assistant for a blind person. Their phone camera is pointing forward.

DETECTED OBJECTS (from AI object detection):
{detections}

Using BOTH the image AND the detection data above, give a 2-3 sentence spoken guide. Rules:

1. START with the nearest obstacle/hazard and its exact position (use the detection data)
2. Describe the overall scene context (room type, outdoor, hallway, etc.)
3. Mention anything the camera sees that the object detector missed (text on signs, open doors, stairs, edges, wet floor, cables on ground)
4. Use EXACT distances from the detection data (e.g. "chair 1.5 meters on your left")
5. If something is closer than 1.5 meters, say "CAREFUL" or "WATCH OUT"
6. Speak naturally as if guiding a friend — short, clear sentences
7. Don't say "I see" or "In this image" — talk directly to the person
8. Don't repeat every object — focus on what MATTERS for safe navigation
9. If nothing dangerous is nearby, describe the path ahead briefly

Example: "Careful, chair about 1 meter on your left. You're in a living room, clear path ahead to the doorway about 4 meters away."
Example: "Two people ahead, about 3 meters. You're on a sidewalk, the road is to your right."
Example: "Path is clear. You're in a hallway, there's a door at the end about 5 meters ahead." """


def _get_client():
    global _client, _initialized
    if _initialized:
        return _client

    _initialized = True

    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key:
        try:
            from dotenv import load_dotenv
            load_dotenv()
            api_key = os.environ.get("GEMINI_API_KEY", "")
        except ImportError:
            pass

    if not api_key:
        print("⚠️  GEMINI_API_KEY not set. Scene AI disabled.")
        return None

    try:
        from google import genai
        _client = genai.Client(api_key=api_key)
        print("✅ Gemini Scene AI initialized (gemini-3.8-flash)")
        return _client
    except Exception as e:
        print(f"❌ Failed to initialize Gemini: {e}")
        return None


def _format_detections(objects: List[dict]) -> str:
    """Format YOLO detections into text context for Gemini."""
    if not objects:
        return "No objects detected by YOLO."

    lines = []
    for obj in objects[:8]:
        label = obj.get("label", "unknown")
        dist = obj.get("distance_m", "?")
        pos = obj.get("position", "ahead")
        urgency = obj.get("urgency", "info")
        prefix = "⚠️ VERY CLOSE: " if urgency == "critical" else ""
        lines.append(f"- {prefix}{label} at {dist}m {pos}")

    return "\n".join(lines)


def describe_scene(frame_base64: str, objects: List[dict] = None) -> Optional[str]:
    """
    Send a frame + YOLO detections to Gemini for scene understanding.
    Rate-limited with automatic backoff on errors.
    """
    global _last_call_time, _last_description, _current_interval, _rate_limited_until

    now = time.time()

    # If rate limited, wait it out
    if now < _rate_limited_until:
        return None

    if now - _last_call_time < _current_interval:
        return None

    client = _get_client()
    if client is None:
        return None

    with _lock:
        if now - _last_call_time < _current_interval:
            return None
        _last_call_time = now

    try:
        from google.genai import types

        if "," in frame_base64:
            frame_base64 = frame_base64.split(",")[1]

        image_bytes = base64.b64decode(frame_base64)

        det_text = _format_detections(objects or [])
        prompt = SCENE_PROMPT.format(detections=det_text)

        response = client.models.generate_content(
            model="gemini-3.8-flash",
            contents=[
                prompt,
                types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
            ],
            config=types.GenerateContentConfig(
                max_output_tokens=120,
                temperature=0.2,
            ),
        )

        description = response.text.strip()
        _last_description = description

        # Success — reset interval to normal
        _current_interval = MIN_INTERVAL
        print(f"🧠 Gemini: {description[:100]}...", flush=True)
        return description

    except Exception as e:
        error_str = str(e).lower()

        if "429" in str(e) or "rate" in error_str or "quota" in error_str or "resource" in error_str:
            # Rate limited — back off
            _current_interval = min(_current_interval * 2, MAX_INTERVAL)
            _rate_limited_until = now + _current_interval
            print(f"⚠️ Gemini rate limited. Backing off to {_current_interval:.0f}s", flush=True)
        else:
            print(f"❌ Gemini API error: {e}", flush=True)

        return None


def get_last_description() -> str:
    return _last_description
