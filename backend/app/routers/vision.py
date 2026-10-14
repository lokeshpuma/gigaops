"""
VisionQC Router
Inference endpoint for AI battery cell surface & weld defect detection.
Uses ONNX Runtime for CPU-optimized low-latency inference.
"""

import os
import io
import time
import json
import base64
from typing import Dict, Any, Optional, List
from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from fastapi.responses import JSONResponse
import numpy as np
from PIL import Image
import onnxruntime as ort

router = APIRouter(prefix="/api/vision", tags=["vision"])

MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
ONNX_PATH = os.path.join(MODELS_DIR, "defect_model.onnx")
PT_PATH = os.path.join(MODELS_DIR, "defect_model.pt")
SAMPLES_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static", "samples")

CLASSES = ["pristine_pass", "defect_scratch", "defect_weld_spatter", "defect_pinhole"]
CLASS_LABELS = {
    "pristine_pass": "Pristine (Pass - No Anomalies)",
    "defect_scratch": "Electrode Surface Scratch",
    "defect_weld_spatter": "Tab Laser Weld Spatter",
    "defect_pinhole": "Calendering Pinhole Micro-Void",
}

# Lazy-loaded session
_onnx_session: Optional[ort.InferenceSession] = None

def get_session() -> ort.InferenceSession:
    global _onnx_session
    if _onnx_session is None:
        if not os.path.exists(ONNX_PATH):
            raise RuntimeError(f"ONNX defect model not found at {ONNX_PATH}. Run training script first.")
        opts = ort.SessionOptions()
        opts.intra_op_num_threads = 2
        opts.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
        _onnx_session = ort.InferenceSession(ONNX_PATH, sess_options=opts, providers=["CPUExecutionProvider"])
    return _onnx_session

def preprocess_image(image: Image.Image) -> np.ndarray:
    """
    Standardize image for DefectClassifier:
    Resize 224x224, RGB, normalize ImageNet mean/std, layout [1, 3, 224, 224] float32
    """
    img = image.convert("RGB").resize((224, 224), Image.Resampling.BILINEAR)
    arr = np.array(img).astype(np.float32) / 255.0  # [224, 224, 3]

    # Normalize
    mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
    std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
    arr = (arr - mean) / std

    # Transpose to [3, 224, 224] and add batch dimension -> [1, 3, 224, 224]
    arr = np.transpose(arr, (2, 0, 1))
    tensor = np.expand_dims(arr, axis=0)
    return tensor.astype(np.float32)

def detect_anomaly_bbox(image: Image.Image, is_defective: bool) -> Optional[Dict[str, int]]:
    """
    Compute anomaly bounding box coordinates for defect highlight in UI.
    Analyzes local gradient contrast variance.
    """
    if not is_defective:
        return None

    img_gray = image.convert("L").resize((128, 128))
    arr = np.array(img_gray, dtype=np.float32)
    # Calculate gradient magnitude
    gy, gx = np.gradient(arr)
    mag = np.hypot(gx, gy)
    
    # Threshold upper 92nd percentile
    threshold = np.percentile(mag, 92)
    mask = mag > threshold
    y_indices, x_indices = np.where(mask)

    orig_w, orig_h = image.size
    scale_x = orig_w / 128.0
    scale_y = orig_h / 128.0

    if len(x_indices) > 0 and len(y_indices) > 0:
        x_min = max(0, int(np.min(x_indices) * scale_x) - 10)
        y_min = max(0, int(np.min(y_indices) * scale_y) - 10)
        x_max = min(orig_w, int(np.max(x_indices) * scale_x) + 10)
        y_max = min(orig_h, int(np.max(y_indices) * scale_y) + 10)
        return {
            "x": x_min,
            "y": y_min,
            "width": max(30, x_max - x_min),
            "height": max(30, y_max - y_min),
        }
    return {
        "x": int(orig_w * 0.25),
        "y": int(orig_h * 0.25),
        "width": int(orig_w * 0.5),
        "height": int(orig_h * 0.5),
    }

def softmax(logits: np.ndarray) -> np.ndarray:
    exp = np.exp(logits - np.max(logits))
    return exp / np.sum(exp)

@router.post("/predict")
async def predict_defect(
    file: Optional[UploadFile] = File(None),
    image_base64: Optional[str] = Form(None)
) -> Dict[str, Any]:
    """
    Run VisionQC inference on uploaded image or webcam frame.
    Returns pass/reject verdict, confidence score, defect class, and localization bbox.
    """
    start_time = time.perf_counter()
    image_bytes = None

    if file is not None:
        image_bytes = await file.read()
    elif image_base64:
        # Strip header if data URI (data:image/jpeg;base64,...)
        if "," in image_base64:
            image_base64 = image_base64.split(",", 1)[1]
        try:
            image_bytes = base64.b64decode(image_base64)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid base64 image data")
    else:
        raise HTTPException(status_code=400, detail="No image provided. Upload a file or send image_base64.")

    try:
        image = Image.open(io.BytesIO(image_bytes))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Cannot decode image file: {str(e)}")

    # Preprocess
    input_tensor = preprocess_image(image)

    # ONNX Inference
    session = get_session()
    input_name = session.get_inputs()[0].name
    outputs = session.run(None, {input_name: input_tensor})
    logits = outputs[0][0]
    probs = softmax(logits)

    top_idx = int(np.argmax(probs))
    top_class = CLASSES[top_idx]
    confidence = float(probs[top_idx])

    is_reject = (top_class != "pristine_pass")
    verdict = "reject" if is_reject else "pass"
    defect_class_human = CLASS_LABELS.get(top_class) if is_reject else None

    # Anomaly Bounding Box
    bbox = detect_anomaly_bbox(image, is_reject)

    inference_duration_ms = round((time.perf_counter() - start_time) * 1000.0, 2)

    prob_breakdown = {
        CLASS_LABELS[c]: round(float(probs[i]), 4)
        for i, c in enumerate(CLASSES)
    }

    return {
        "verdict": verdict,
        "confidence": round(confidence, 4),
        "confidence_pct": round(confidence * 100.0, 1),
        "defect_class": defect_class_human,
        "raw_class": top_class,
        "probabilities": prob_breakdown,
        "bounding_box": bbox,
        "inference_time_ms": inference_duration_ms,
        "model_architecture": "ConvNet-B4 ONNX Optimized (1.4M parameters)",
        "inspection_gate": "Gigafactory AI-Vision Quality Control Station #4",
        "action_taken": "Forwarded to Formation & Aging" if verdict == "pass" else "Diverted to Automated Scrap/Rework Staging",
    }

@router.get("/samples")
async def list_sample_images() -> List[Dict[str, Any]]:
    """
    Returns curated gallery of known battery inspection samples for one-click testing.
    """
    manifest_path = os.path.join(SAMPLES_DIR, "manifest.json")
    if os.path.exists(manifest_path):
        with open(manifest_path, "r") as f:
            return json.load(f)
    return [
        {"id": "sample-pass-1", "label": "Pristine 4680 Foil A", "defect_type": "pristine_pass", "expected": "pass"},
        {"id": "sample-pass-2", "label": "Pristine Laser Weld", "defect_type": "pristine_pass", "expected": "pass"},
        {"id": "sample-scratch-1", "label": "Electrode Surface Scratch", "defect_type": "defect_scratch", "expected": "reject"},
        {"id": "sample-weld-1", "label": "Tab Laser Weld Spatter", "defect_type": "defect_weld_spatter", "expected": "reject"},
        {"id": "sample-pinhole-1", "label": "Calendering Pinhole Void", "defect_type": "defect_pinhole", "expected": "reject"},
        {"id": "sample-scratch-2", "label": "Deep Casing Score Mark", "defect_type": "defect_scratch", "expected": "reject"},
    ]
