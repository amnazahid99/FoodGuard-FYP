from fastapi import APIRouter, HTTPException, status
from app.models.schemas import ScanReceiptRequest, ScanReceiptResponse, ReceiptItem
from app.services.groq_service import groq_service
from app.services.fireworks_service import fireworks_service
import logging
import base64
import json
import re

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ai/scan-receipt", tags=["OCR Receipt"])

OCR_PROMPT = """You are an expert receipt scanner. Extract every grocery / food item from this receipt image.

CRITICAL RULES:
1. Respond with ONLY a valid JSON object. No text before it, no text after it, no explanations, no markdown, no code blocks, no formatting.
2. If you cannot read the receipt or it is not a grocery receipt, return exactly: {"items": []}
3. Do NOT include: receipt numbers, store IDs, tax lines, payment methods, totals, or subtotals.
4. Do NOT include conversational text or explanations.

JSON structure (must match exactly):
{"items": [{"name": "string", "quantity": "string", "unit": "string", "category": "dairy|produce|meat|bakery|frozen|beverages|pantry|snacks|other", "estimated_expiry_days": number, "confidence": number}]}

Field rules:
- name: cleaned, human-readable item name
- quantity: numeric amount as a string (e.g. "1", "500") or null
- unit: e.g. "pcs", "g", "kg", "L", "ml", "dozen" or null
- category: one of dairy, produce, meat, bakery, frozen, beverages, pantry, snacks, other
- estimated_expiry_days: integer estimate of shelf life from purchase date
- confidence: number between 0.0 and 1.0

Your response must begin with { and end with }. Nothing else."""

ALLOWED_MIME_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
BASE64_RE = re.compile(r"^[A-Za-z0-9+/]+={0,2}$")


def _clean_json(text: str) -> str:
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    text = text.strip()
    start = text.find('{')
    end = text.rfind('}')
    if start != -1 and end != -1 and end > start:
        text = text[start:end + 1]
    return text.strip()


def _validate_image(image_b64: str, mime: str) -> None:
    mime = (mime or "image/jpeg").lower()
    if mime == "image/jpg":
        mime = "image/jpeg"
    if mime not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only jpg, jpeg, png, and webp images are allowed.",
        )
    if not image_b64 or not BASE64_RE.fullmatch(image_b64.strip()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image data must be valid base64.",
        )
    try:
        base64.b64decode(image_b64, validate=True)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image data must be valid base64.",
        ) from exc


@router.post("", response_model=ScanReceiptResponse)
async def scan_receipt(request: ScanReceiptRequest):
    """Scan a grocery receipt image and extract items."""
    try:
        image_b64 = None
        mime = request.mime_type or "image/jpeg"

        if request.image_data:
            image_b64 = request.image_data.strip()
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

        _validate_image(image_b64, mime)
        if mime == "image/jpg":
            mime = "image/jpeg"

        # Try Fireworks first for OCR (vision model)
        fireworks_error = None
        if fireworks_service.enabled:
            result = await fireworks_service.generate_with_image(
                OCR_PROMPT,
                image_b64,
                mime_type=mime,
                timeout=90.0,
                retries=3,
            )
            if not result["success"]:
                fireworks_error = result.get("error")
                logger.warning(f"Fireworks OCR failed: {fireworks_error}. Falling back to Groq.")
                result = await groq_service.generate_with_image(
                    OCR_PROMPT,
                    image_b64,
                    mime_type=mime,
                    timeout=90.0,
                    retries=2,
                )
        else:
            result = await groq_service.generate_with_image(
                OCR_PROMPT,
                image_b64,
                mime_type=mime,
                timeout=90.0,
                retries=2,
            )

        if not result["success"]:
            error_detail = result.get('error', 'Unknown error')
            # Provide more helpful message based on common issues
            if fireworks_error:
                error_detail = f"OCR service unavailable. Both Fireworks and Groq vision models failed. Fireworks: {fireworks_error[:100]}. Groq: {error_detail[:100]}"
            elif "model" in error_detail.lower() and ("not found" in error_detail.lower() or "decommissioned" in error_detail.lower()):
                error_detail = f"OCR vision model unavailable: {error_detail}. Please check your API keys have access to vision models."
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=error_detail,
            )

        raw = result.get("content", "") or result.get("text", "") or ""
        try:
            data = json.loads(_clean_json(raw))
        except json.JSONDecodeError:
            logger.error("OCR returned non-JSON output")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="OCR failed to parse the model response.",
            )

        items_data = data.get("items", data) if isinstance(data, dict) else data
        if isinstance(items_data, dict):
            items_data = items_data.get("items", [])
        if not isinstance(items_data, list):
            items_data = []
        items = []
        for it in items_data:
            try:
                if not isinstance(it, dict):
                    continue
                qty = it.get("quantity")
                confidence = float(it.get("confidence", 0.85) or 0.85)
                items.append(ReceiptItem(
                    name=it.get("name", "Unknown"),
                    quantity=str(qty) if qty is not None else None,
                    unit=it.get("unit"),
                    category=it.get("category"),
                    estimated_expiry_days=int(it.get("estimated_expiry_days", 7) or 7),
                    confidence=max(0.0, min(1.0, confidence)),
                ))
            except Exception as exc:
                logger.warning(f"Failed to parse receipt item: {exc}")

        return ScanReceiptResponse(success=True, items=items, raw_text=raw)

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception(f"Error in scan-receipt: {exc}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))
