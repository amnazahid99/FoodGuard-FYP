from fastapi import APIRouter, HTTPException, status
from app.models.schemas import ExpiryTipsRequest, ExpiryTipsResponse, ExpiryTip
from app.services.groq_service import groq_service
from app.services.prompt_engine import prompt_engine
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ai/expiry-tips", tags=["Smart Expiry Alerts"])


@router.post("", response_model=ExpiryTipsResponse)
async def expiry_tips(request: ExpiryTipsRequest):
    """Generate a usage tip + recipe idea for each expiring item."""
    try:
        items = [i.model_dump() for i in request.expiring_items]
        res = await groq_service.generate_json(prompt_engine.build_expiry_tips_prompt(items))

        tips = []
        if res["success"]:
            for t in res["content"].get("tips", []):
                try:
                    tips.append(ExpiryTip(
                        item_name=t.get("item_name", "item"),
                        days_left=int(t.get("days_left", 0)),
                        tip=t.get("tip", ""),
                        suggested_recipe=t.get("suggested_recipe"),
                    ))
                except Exception as e:
                    logger.warning(f"Failed to parse expiry tip: {e}")

        # Fallback if AI returned nothing usable
        if not tips:
            for i in request.expiring_items:
                tips.append(ExpiryTip(
                    item_name=i.name,
                    days_left=i.days_left,
                    tip=f"Use {i.name} soon — it expires in {i.days_left} day(s).",
                    suggested_recipe=None,
                ))

        return ExpiryTipsResponse(success=True, tips=tips)

    except Exception as e:
        logger.exception(f"Error in expiry-tips: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
