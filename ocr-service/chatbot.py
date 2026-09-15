import os
import asyncio
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from google import genai
from dotenv import load_dotenv
import logging

load_dotenv()
logger = logging.getLogger("uvicorn.error")
router = APIRouter()

client = genai.Client()
from pathlib import Path

PDF_PATH = Path(__file__).parent.parent / "The Legal Metrology (Package Commodities) Rules, 2011.pdf"

class ChatRequest(BaseModel):
    message: str
    context: str | None = None

# Cache the uploaded file reference to avoid re-uploading
uploaded_file_cache = {}
pdf_lock = asyncio.Lock()

async def get_or_upload_pdf():
    async with pdf_lock:
        if "pdf" in uploaded_file_cache:
            file = uploaded_file_cache["pdf"]
            try:
                # client.files.get is blocking, run in threadpool
                return await asyncio.to_thread(client.files.get, name=file.name)
            except Exception:
                pass
                
        if not os.path.exists(PDF_PATH):
            raise HTTPException(status_code=500, detail="PDF rulebook not found")
            
        uploaded_file = await asyncio.to_thread(client.files.upload, file=str(PDF_PATH), config={'display_name': 'LMPC_Rules_2011'})
        
        while uploaded_file.state == "PROCESSING":
            await asyncio.sleep(2)
            uploaded_file = await asyncio.to_thread(client.files.get, name=uploaded_file.name)
            
        if uploaded_file.state == "FAILED":
            raise HTTPException(status_code=500, detail="Failed to process PDF")
            
        uploaded_file_cache["pdf"] = uploaded_file
        return uploaded_file

@router.post("/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        pdf_file = await get_or_upload_pdf()
        
        system_instruction = (
            "You are an expert Legal Metrology compliance assistant. "
            "Use the provided LMPC Rules 2011 document to answer the user's questions about rules and compliance reports. "
            "Be precise, cite the specific rules when relevant, and provide clear explanations."
        )
        
        contents = [pdf_file]
        if request.context:
            contents.append(f"Context: {request.context}")
        contents.append(request.message)
        
        response = await client.aio.models.generate_content(
            model="gemini-2.5-flash",
            contents=contents,
            config={"system_instruction": system_instruction}
        )
        
        return {"response": response.text}
        
    except Exception as e:
        logger.error(f"Chat endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
