import io
import cv2
import numpy as np
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from paddleocr import PaddleOCR
from typing import Dict, Any

app = FastAPI(title="PaddleOCR Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize PaddleOCR model (downloads automatically on first run)
# We disable mkldnn because Paddle 3.x PIR has a known bug with oneDNN on Windows for some models
ocr = PaddleOCR(use_angle_cls=True, lang='en', enable_mkldnn=False)

def _decode_image(payload: bytes) -> np.ndarray:
    arr = np.frombuffer(payload, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(status_code=422, detail="Invalid image format.")
    return img

@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "healthy"}

@app.post("/extract-text")
async def extract_text(file: UploadFile = File(...)) -> Dict[str, Any]:
    if file.size and file.size > 20 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large")
    
    payload = await file.read()
    if not payload:
        raise HTTPException(status_code=422, detail="Empty image.")
    
    image = _decode_image(payload)
    
    # Run PaddleOCR (processing in memory, image is never saved to disk)
    result = ocr.ocr(image)
    
    extracted_text = []
    if result and result[0]:
        # Handle new Paddle 3.x OCRResult format (dict-like)
        if hasattr(result[0], "get") and result[0].get("rec_texts"):
            extracted_text = result[0]["rec_texts"]
        elif "rec_texts" in result[0]:
            extracted_text = result[0]["rec_texts"]
        else:
            # Fallback for old PaddleOCR format
            try:
                for line in result[0]:
                    if len(line) > 1 and len(line[1]) > 0:
                        text = line[1][0]
                        extracted_text.append(text)
            except Exception:
                pass
            
    return {
        "status": "success",
        "extracted_text": "\n".join(extracted_text)
    }
