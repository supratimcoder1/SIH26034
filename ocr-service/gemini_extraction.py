import os
import io
import json
import asyncio
import logging
import cv2
import numpy as np
import truststore
truststore.inject_into_ssl()

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union
from google import genai
from google.genai import types
from google.genai import errors
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger("uvicorn.error")

MODELS_IN_ORDER = ["gemini-3.5-flash", "gemini-3-flash-preview", "gemini-2.5-flash"]

PROMPT = """
You are an expert Legal Metrology compliance AI. Look at this product label image.
Extract the following declarations exactly as they appear on the package. 
For each declaration, if you find it, output its value. If not, output null.
For MRP, check if it's inclusive of all taxes.
Crucially, for each found declaration, cite the specific LMPC rule matched from "The Legal Metrology (Package Commodities) Rules, 2011.pdf".
If you cannot detect font sizes exactly, set requires_physical_inspection to true instead of guessing.
"""

class ExtractedField(BaseModel):
    value: Optional[str] = Field(default=None, description="The extracted text or numerical value, or null if not found")
    rule_cited: Optional[str] = Field(default=None, description="The specific LMPC rule cited from the 2011 rules")

class Detection(BaseModel):
    text: str = Field(description="The raw text detected")
    bbox_height_mm: Optional[float] = Field(default=None, description="The bounding box height in mm, if available")
    bbox: Optional[List[List[float]]] = Field(default=None, description="Bounding box coordinates")

class GeminiExtractionSchema(BaseModel):
    mrp: Optional[ExtractedField] = None
    unit_sale_price: Optional[ExtractedField] = None
    net_quantity: Optional[ExtractedField] = None
    net_quantity_prohibited_practice: Optional[str] = None
    manufacturing_date: Optional[ExtractedField] = None
    expiry_date: Optional[ExtractedField] = None
    consumer_care: Optional[ExtractedField] = None
    manufacturer_packer_importer: Optional[ExtractedField] = None
    country_of_origin: Optional[ExtractedField] = None
    generic_name: Optional[ExtractedField] = None
    requires_physical_inspection: bool = Field(default=False, description="Set to true if font sizes cannot be exactly detected from the image")
    detections: List[Detection] = Field(default_factory=list)

async def gemini_extract_entities(image: np.ndarray, pixels_per_cm: Optional[float] = None) -> dict:
    client = genai.Client()
    
    # encode image to JPEG
    is_success, buffer = cv2.imencode(".jpg", cv2.cvtColor(image, cv2.COLOR_RGB2BGR))
    if not is_success:
        raise ValueError("Failed to encode image to JPEG.")
    image_bytes = buffer.tobytes()

    last_error = None
    parsed_data = None

    for model_name in MODELS_IN_ORDER:
        for attempt in range(3):
            try:
                logger.info(f"Invoking Gemini model: {model_name} (attempt {attempt + 1}/3)...")
                response = await client.aio.models.generate_content(
                    model=model_name,
                    contents=[
                        types.Part.from_bytes(data=image_bytes, mime_type='image/jpeg'),
                        PROMPT
                    ],
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=GeminiExtractionSchema,
                        temperature=0.1,
                    )
                )
                if response and response.text:
                    try:
                        parsed_data = json.loads(response.text)
                        logger.info(f"Successfully extracted declarations using {model_name}.")
                        break
                    except Exception as json_err:
                        logger.warning(f"Failed to parse JSON from {model_name}: {json_err}")
            except (errors.APIError, errors.ServerError, Exception) as exc:
                last_error = exc
                logger.warning(f"{model_name} attempt {attempt + 1} failed: {exc}")
                await asyncio.sleep(1.0 * (attempt + 1))
        
        if parsed_data is not None:
            break

    if parsed_data is None:
        logger.error(f"All Gemini models failed: {last_error}")
        parsed_data = {}

    def _field(extracted_field):
        if not extracted_field or extracted_field.get("value") is None:
            return {"value": None, "rule_cited": None, "status": "not_detected"}
        return {
            "value": extracted_field.get("value"),
            "rule_cited": extracted_field.get("rule_cited"),
            "status": "found"
        }

    result = {
        "mrp": _field(parsed_data.get("mrp")),
        "unit_sale_price": _field(parsed_data.get("unit_sale_price")),
        "net_quantity": _field(parsed_data.get("net_quantity")),
        "net_quantity_prohibited_practice": {"value": parsed_data.get("net_quantity_prohibited_practice"), "status": "found" if parsed_data.get("net_quantity_prohibited_practice") else "not_detected"},
        "manufacturing_date": _field(parsed_data.get("manufacturing_date")),
        "expiry_date": _field(parsed_data.get("expiry_date")),
        "consumer_care": _field(parsed_data.get("consumer_care")),
        "manufacturer_packer_importer": _field(parsed_data.get("manufacturer_packer_importer")),
        "country_of_origin": _field(parsed_data.get("country_of_origin")),
        "generic_name": _field(parsed_data.get("generic_name")),
        "requires_physical_inspection": parsed_data.get("requires_physical_inspection", False),
        "detections": parsed_data.get("detections", [])
    }
    
    return result
