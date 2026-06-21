from fastapi import APIRouter, HTTPException, status
from app.models.schemas import (
    MealRecommendRequest,
    MealRecommendResponse,
    MealSuggestion
)
from app.services.groq_service import groq_service
from app.services.fireworks_service import fireworks_service
from app.services.external_apis import spoonacular_service
from app.services.prompt_engine import prompt_engine
import logging
import json

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ai/recommend-meals", tags=["Meal Recommendations"])


def _uses_expiring(used_ingredients: list, expiring: list) -> bool:
    if not expiring:
        return False
    exp = {e.lower() for e in expiring}
    for ing in used_ingredients:
        il = (ing or "").lower()
        if any(e in il or il in e for e in exp):
            return True
    return False


def _parse_groq_style_response(content, request):
    if isinstance(content, str):
        try:
            content = json.loads(content)
        except json.JSONDecodeError:
            content = {}
    if isinstance(content, dict):
        content = content.get("meals", [])
    if not isinstance(content, list):
        content = []
    meals = []
    for m in content[:5]:
        try:
            if not isinstance(m, dict):
                continue
            used = m.get("used_ingredients") or []
            missed = m.get("missed_ingredients") or []
            meals.append(MealSuggestion(
                name=m.get("name", "Meal"),
                calories=int(m.get("calories", 0) or 0),
                protein=float(m.get("protein", 0) or 0),
                carbs=float(m.get("carbs", 0) or 0),
                fats=float(m.get("fats", 0) or 0),
                reasoning=m.get("reasoning", "") or m.get("health_note", ""),
                uses_expiring=_uses_expiring(used or request.ingredients, request.expiring_items),
                health_note=m.get("health_note") or m.get("reasoning"),
                used_ingredients=used,
                missed_ingredients=missed,
                difficulty=m.get("difficulty"),
                cuisine=m.get("cuisine") or request.cuisine_preference,
                match_score=m.get("match_score"),
                ingredients=m.get("ingredients") or [*(used or []), *(missed or [])],
                instructions=m.get("instructions") or [],
            ))
        except Exception as exc:
            logger.warning(f"Failed to parse meal: {exc}")
    return meals


async def _from_spoonacular(request: MealRecommendRequest):
    """Build suggestions from Spoonacular recipes enriched with Groq nutrition."""
    sp = await spoonacular_service.find_by_ingredients(request.ingredients, number=5)
    if not sp["success"] or not sp.get("recipes"):
        return None

    recipes = sp["recipes"]
    titles = [r.get("title", "") for r in recipes]

    enrich_prompt = f"""For each recipe title below, estimate calories (integer), protein/carbs/fats in grams (float, 1 decimal), cuisine, difficulty, and a one-line health_note for someone with health condition: {request.health_condition or 'none'} and dietary preference: {request.dietary_preference or 'none'}.

Titles: {json.dumps(titles)}

Return ONLY JSON:
{{"meals":[{{"name":"<title>","calories":500,"protein":20.0,"carbs":40.0,"fats":15.0,"cuisine":"Pakistani","difficulty":"Medium","health_note":"..."}}]}}"""
    enrich = await groq_service.generate_json(enrich_prompt)
    enrich_map = {}
    if enrich["success"]:
        for m in enrich["content"].get("meals", []):
            enrich_map[(m.get("name", "")).lower()] = m

    meals = []
    for r in recipes:
        title = r.get("title", "Recipe")
        used = [u.get("name", "") for u in r.get("usedIngredients", [])]
        missed = [u.get("name", "") for u in r.get("missedIngredients", [])]
        e = enrich_map.get(title.lower(), {})
        note = e.get("health_note", "Uses ingredients you already have.")
        meals.append(MealSuggestion(
            name=title,
            calories=int(e.get("calories", 0) or 0),
            protein=float(e.get("protein", 0) or 0),
            carbs=float(e.get("carbs", 0) or 0),
            fats=float(e.get("fats", 0) or 0),
            reasoning=note,
            recipe_id=r.get("id"),
            image=r.get("image"),
            uses_expiring=_uses_expiring(used, request.expiring_items),
            health_note=note,
            used_ingredients=used,
            missed_ingredients=missed,
            difficulty=e.get("difficulty"),
            cuisine=e.get("cuisine") or request.cuisine_preference,
            match_score=round((len(used) / max(len(used) + len(missed), 1)) * 100, 1),
            ingredients=[*used, *missed],
            instructions=[],
        ))
    return meals


async def _from_groq(request: MealRecommendRequest):
    """Pure-LLM meal generation fallback."""
    prompt = prompt_engine.build_meal_recommendation_prompt(
        ingredients=request.ingredients,
        dietary_preference=request.dietary_preference,
        health_condition=request.health_condition,
        cuisine_preference=request.cuisine_preference,
        expiring_items=request.expiring_items,
        inventory_items=request.inventory_items,
        health_profile=request.health_profile,
        units=request.units,
        expiring_warn_days=request.expiring_warn_days,
    )
    res = await groq_service.generate_json(prompt, max_tokens=4096, timeout=60.0)
    if not res["success"]:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                            detail=f"Groq API error: {res.get('error')}")
    data = res["content"]
    if isinstance(data, dict):
        data = data.get("meals", [])
    if not isinstance(data, list):
        data = []

    meals = []
    for m in data[:5]:
        try:
            if not isinstance(m, dict):
                continue
            used = m.get("used_ingredients") or []
            missed = m.get("missed_ingredients") or []
            meals.append(MealSuggestion(
                name=m.get("name", "Meal"),
                calories=int(m.get("calories", 0) or 0),
                protein=float(m.get("protein", 0) or 0),
                carbs=float(m.get("carbs", 0) or 0),
                fats=float(m.get("fats", 0) or 0),
                reasoning=m.get("reasoning", "") or m.get("health_note", ""),
                uses_expiring=_uses_expiring(used or request.ingredients, request.expiring_items),
                health_note=m.get("health_note") or m.get("reasoning"),
                used_ingredients=used,
                missed_ingredients=missed,
                difficulty=m.get("difficulty"),
                cuisine=m.get("cuisine") or request.cuisine_preference,
                match_score=m.get("match_score"),
                ingredients=m.get("ingredients") or [*used, *missed],
                instructions=m.get("instructions") or [],
            ))
        except Exception as exc:
            logger.warning(f"Failed to parse meal: {exc}")
    return meals


@router.post("", response_model=MealRecommendResponse)
async def recommend_meals(request: MealRecommendRequest):
    """Generate up to 5 personalized meal suggestions from available ingredients."""
    try:
        meals = None
        if spoonacular_service.enabled:
            try:
                meals = await _from_spoonacular(request)
            except Exception as exc:
                logger.warning(f"Spoonacular path failed, trying Fireworks: {exc}")
        if not meals and fireworks_service.enabled:
            try:
                prompt = prompt_engine.build_meal_recommendation_prompt(
                    ingredients=request.ingredients,
                    dietary_preference=request.dietary_preference,
                    health_condition=request.health_condition,
                    cuisine_preference=request.cuisine_preference,
                    expiring_items=request.expiring_items,
                    inventory_items=request.inventory_items,
                    health_profile=request.health_profile,
                    units=request.units,
                    expiring_warn_days=request.expiring_warn_days,
                )
                res = await fireworks_service.generate_json(prompt, max_tokens=4096, timeout=60.0)
                if res["success"]:
                    meals = _parse_groq_style_response(res["content"], request)
            except Exception as exc:
                logger.warning(f"Fireworks path failed, falling back to Groq: {exc}")
        if not meals:
            meals = await _from_groq(request)

        response_data = {
            "success": True,
            "meals": [m.model_dump() for m in meals[:5]],
            "used_groq": True,
            "refined_by_gemini": False,
        }
        return MealRecommendResponse(**response_data)

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception(f"Error in meal recommendation: {exc}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))
