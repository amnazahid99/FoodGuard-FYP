from fastapi import APIRouter, HTTPException, status
from app.models.schemas import ScanReceiptRequest, ScanReceiptResponse, ReceiptItem
from app.services.gemini_service import gemini_service
from app.services.fireworks_ocr_service import fireworks_ocr_service
from app.services.groq_service import groq_service
import logging
import base64
import json

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ai/scan-receipt", tags=["OCR Receipt"])

OCR_PROMPT = """You are an expert receipt scanner. Extract every grocery / food item from this receipt image.

For each item provide:
- name: cleaned, human-readable item name
- quantity: numeric amount as a string (e.g. "1", "500"); null if unknown
- unit: e.g. "pcs", "g", "kg", "L", "ml", "dozen"; null if unknown
- category: one of dairy, produce, meat, bakery, frozen, beverages, pantry, snacks, other
- estimated_expiry_days: integer estimate of shelf life from purchase date

Return ONLY valid JSON (no markdown, no code fences):
{"items":[{"name":"Whole Milk","quantity":"1","unit":"L","category":"dairy","estimated_expiry_days":7}]}

If the image is not a readable receipt, return {"items":[]}."""


def _clean_json(text: str) -> str:
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()


@router.post("", response_model=ScanReceiptResponse)
async def scan_receipt(request: ScanReceiptRequest):
    """Scan a grocery receipt image with Gemini Vision and extract items."""
    try:
        image_b64 = None
        mime = request.mime_type or "image/jpeg"

        if request.image_data:
            image_b64 = request.image_data.strip()
            # Strip data URI prefix if present (data:image/png;base64,....)
            if image_b64.startswith("data:") and "," in image_b64:
                header, image_b64 = image_b64.split(",", 1)
                if "image/" in header:
                    mime = header.split(":")[1].split(";")[0]
        elif request.image_url:
            import httpx
            async with httpx.AsyncClient(timeout=30.0, trust_env=False) as client:
                resp = await client.get(request.image_url)
                if resp.status_code != 200:
                    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                        detail="Could not fetch image from URL")
                image_b64 = base64.b64encode(resp.content).decode("utf-8")
                mime = resp.headers.get("content-type", mime)
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail="Provide image_data or image_url")

        # Prefer Fireworks (stronger OCR model) when its key is set; otherwise
        # fall back to Groq's vision model so a single GROQ_API_KEY powers OCR too.
        if getattr(fireworks_ocr_service, "client", None):
            result = await fireworks_ocr_service.generate_with_image(OCR_PROMPT, image_b64, mime_type=mime)
        else:
            result = await groq_service.generate_with_image(OCR_PROMPT, image_b64, mime_type=mime)
        if not result["success"]:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                                detail=f"OCR error: {result.get('error')}")

        raw = result.get("text", "")
        try:
            data = json.loads(_clean_json(raw))
        except json.JSONDecodeError:
            logger.error("OCR returned non-JSON output")
            return ScanReceiptResponse(success=True, items=[], raw_text=raw)

        items_data = data.get("items", data) if isinstance(data, dict) else data
        items = []
        for it in (items_data or []):
            try:
                qty = it.get("quantity")
                items.append(ReceiptItem(
                    name=it.get("name", "Unknown"),
                    quantity=str(qty) if qty is not None else None,
                    unit=it.get("unit"),
                    category=it.get("category"),
                    estimated_expiry_days=int(it.get("estimated_expiry_days", 7) or 7),
                    confidence=float(it.get("confidence", 0.85)),
                ))
            except Exception as e:
                logger.warning(f"Failed to parse receipt item: {e}")

        return ScanReceiptResponse(success=True, items=items, raw_text=raw)

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error in scan-receipt: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
