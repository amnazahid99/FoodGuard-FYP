from fastapi import APIRouter, HTTPException, status
from app.models.schemas import (
    DashboardSummaryRequest,
    DashboardSummaryResponse
)
from app.services.groq_service import groq_service
from app.services.prompt_engine import prompt_engine
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ai/dashboard-summary", tags=["Dashboard Summary"])


@router.post("", response_model=DashboardSummaryResponse)
async def get_dashboard_summary(request: DashboardSummaryRequest):
    """
    Generate AI-powered dashboard insights from full user inventory.
    Returns waste reduction, health summary, and weekly recommendations.
    """
    try:
        # Convert inventory items to dict format for prompt
        inventory = [item.model_dump() for item in request.inventory]

        # Build prompt
        prompt = prompt_engine.build_dashboard_summary_prompt(
            inventory=inventory,
            user_health_goals=request.user_health_goals
        )

        # Generate with Groq
        result = await groq_service.generate_json(prompt)

        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"API error: {result.get('error')}"
            )

        data = result["content"]

        response_data = {
            "success": True,
            "waste_reduction_summary": data.get("waste_reduction_summary", {}),
            "health_summary": data.get("health_summary", {}),
            "top_consumed": data.get("top_consumed", []),
            "top_wasted": data.get("top_wasted", []),
            "weekly_recommendations": data.get("weekly_recommendations", [])
        }

        return DashboardSummaryResponse(**response_data)

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error in dashboard summary: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )