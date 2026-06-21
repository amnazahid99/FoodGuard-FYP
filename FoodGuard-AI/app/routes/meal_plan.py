from fastapi import APIRouter, HTTPException, status
from app.models.schemas import ConditionMealPlanRequest, ConditionMealPlanResponse
from app.services.groq_service import groq_service
from app.services.fireworks_service import fireworks_service
from app.services.prompt_engine import prompt_engine
import logging
import json

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ai/condition-meal-plan", tags=["Condition Meal Plan"])


def normalize_list(value):
    if isinstance(value, list):
        return value
    if isinstance(value, str) and value.strip():
        return [value]
    return []


def normalize_plan(week_plan, available_ingredients):
    meal_keys = ["breakfast", "lunch", "dinner"]
    normalized = []
    fallback_ingredient = available_ingredients[0] if available_ingredients else "balanced ingredients"
    for index in range(7):
        source = week_plan[index] if index < len(week_plan) else {}
        if not isinstance(source, dict):
            source = {}
        day = {"day": source.get("day") or f"Day {index + 1}"}
        for key in meal_keys:
            meal = source.get(key) or {}
            if not isinstance(meal, dict):
                meal = {}
            day[key] = {
                "name": meal.get("name") or f"{key.title()} with {fallback_ingredient}",
                "calories": meal.get("calories") or 0,
                "protein": meal.get("protein") or 0,
                "carbs": meal.get("carbs") or 0,
                "fats": meal.get("fats", meal.get("fat")) or 0,
                "ingredients": normalize_list(meal.get("ingredients")) or [fallback_ingredient],
                "instructions": normalize_list(meal.get("instructions")) or [f"Prepare {fallback_ingredient} safely for {key}."],
                "cuisine": meal.get("cuisine") or "",
                "difficulty": meal.get("difficulty") or "",
            }
        if source.get("snack") or source.get("snacks"):
            snack = source.get("snack") or source.get("snacks")
            if not isinstance(snack, dict):
                snack = {}
            day["snack"] = {
                "name": snack.get("name") or "Healthy snack",
                "calories": snack.get("calories") or 0,
                "protein": snack.get("protein") or 0,
                "carbs": snack.get("carbs") or 0,
                "fats": snack.get("fats", snack.get("fat")) or 0,
                "ingredients": normalize_list(snack.get("ingredients")) or [fallback_ingredient],
                "instructions": normalize_list(snack.get("instructions")) or [f"Prepare {fallback_ingredient} as a snack."],
                "cuisine": snack.get("cuisine") or "",
                "difficulty": snack.get("difficulty") or "",
            }
        normalized.append(day)
    return normalized


@router.post("", response_model=ConditionMealPlanResponse)
async def condition_meal_plan(request: ConditionMealPlanRequest):
    """Generate a condition-appropriate 7-day meal plan."""
    try:
        prompt = prompt_engine.build_condition_meal_plan_prompt(
            condition=request.condition,
            available_ingredients=request.available_ingredients,
            days=request.days,
            dietary_preference=request.dietary_preference,
            cuisine_preference=request.cuisine_preference,
            units=request.units,
            health_profile=request.health_profile,
            inventory_items=request.inventory_items,
            expiring_warn_days=request.expiring_warn_days,
        )
        content = None
        if fireworks_service.enabled:
            try:
                res = await fireworks_service.generate_json(prompt, max_tokens=6144, timeout=90.0)
                if res["success"]:
                    raw = res["content"]
                    if isinstance(raw, str):
                        try:
                            raw = json.loads(raw)
                        except json.JSONDecodeError:
                            raw = {}
                    if isinstance(raw, dict):
                        content = raw.get("week_plan", raw.get("weekPlan"))
            except Exception as exc:
                logger.warning(f"Fireworks meal-plan failed, falling back to Groq: {exc}")
        if content is None:
            res = await groq_service.generate_json(prompt, max_tokens=6144, timeout=90.0)
            if not res["success"]:
                raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                                    detail=f"AI error: {res.get('error')}")
            raw = res["content"] if isinstance(res["content"], dict) else {}
            content = raw.get("week_plan", raw.get("weekPlan"))
        week_plan = normalize_plan(content or [], request.available_ingredients)
        return ConditionMealPlanResponse(
            success=True, condition=request.condition, week_plan=week_plan
        )

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception(f"Error in condition-meal-plan: {exc}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))
