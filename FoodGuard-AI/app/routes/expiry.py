from fastapi import APIRouter, HTTPException, status
from app.models.schemas import (
    ExpiryInsightsRequest,
    ExpiryInsightsResponse,
    ExpiryItem
)
from app.services.groq_service import groq_service
from app.services.prompt_engine import prompt_engine
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ai/expiry-insights", tags=["Expiry Insights"])


@router.post("", response_model=ExpiryInsightsResponse)
async def get_expiry_insights(request: ExpiryInsightsRequest):
    """
    Analyze inventory items with expiry dates.
    Returns expiring items, waste risk score, and usage suggestions.
    """
    try:
        # Convert inventory items to dict format for prompt
        inventory_items = [item.model_dump() for item in request.inventory_items]

        # Build prompt
        prompt = prompt_engine.build_expiry_insights_prompt(inventory_items)

        # Generate with Groq
        result = await groq_service.generate_json(prompt)

        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"API error: {result.get('error')}"
            )

        data = result["content"]

        # Parse expiring soon items
        expiring_soon = []
        for item_data in data.get("expiring_soon", []):
            try:
                item = ExpiryItem(
                    name=item_data.get("name", "Unknown"),
                    days_until_expiry=item_data.get("days_until_expiry", 0),
                    urgency=item_data.get("urgency", "medium"),
                    suggestion=item_data.get("suggestion", "")
                )
                expiring_soon.append(item)
            except Exception as e:
                logger.warning(f"Failed to parse expiry item: {e}")

        response_data = {
            "success": True,
            "expiring_soon": [e.model_dump() for e in expiring_soon],
            "waste_risk_score": data.get("waste_risk_score", 50),
            "smart_suggestions": data.get("smart_suggestions", []),
            "prioritized_list": data.get("prioritized_list", [])
        }

        return ExpiryInsightsResponse(**response_data)

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error in expiry insights: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )