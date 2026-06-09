from fastapi import APIRouter, HTTPException, status
from app.models.schemas import ConditionMealPlanRequest, ConditionMealPlanResponse
from app.services.groq_service import groq_service
from app.services.prompt_engine import prompt_engine
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ai/condition-meal-plan", tags=["Condition Meal Plan"])


@router.post("", response_model=ConditionMealPlanResponse)
async def condition_meal_plan(request: ConditionMealPlanRequest):
    """Generate a condition-appropriate multi-day meal plan with Groq."""
    try:
        prompt = prompt_engine.build_condition_meal_plan_prompt(
            condition=request.condition,
            available_ingredients=request.available_ingredients,
            days=request.days,
        )
        res = await groq_service.generate_json(prompt, max_tokens=4096)
        if not res["success"]:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                                detail=f"AI error: {res.get('error')}")

        week_plan = res["content"].get("week_plan", [])
        return ConditionMealPlanResponse(
            success=True, condition=request.condition, week_plan=week_plan
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error in condition-meal-plan: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
