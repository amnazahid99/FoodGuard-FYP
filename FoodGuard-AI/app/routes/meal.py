from fastapi import APIRouter, HTTPException, status
from app.models.schemas import (
    MealRecommendRequest,
    MealRecommendResponse,
    MealSuggestion
)
from app.services.groq_service import groq_service
from app.services.external_apis import spoonacular_service
from app.services.prompt_engine import prompt_engine
import logging
import hashlib
import json

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ai/recommend-meals", tags=["Meal Recommendations"])

# Simple in-memory cache (use Redis in production)
meal_cache = {}


def get_cache_key(ingredients: list, dietary: str = None, health: str = None, cuisine: str = None) -> str:
    key_str = f"{','.join(sorted(ingredients))}:{dietary}:{health}:{cuisine}"
    return hashlib.md5(key_str.encode()).hexdigest()


def _uses_expiring(used_ingredients: list, expiring: list) -> bool:
    if not expiring:
        return False
    exp = {e.lower() for e in expiring}
    for ing in used_ingredients:
        il = (ing or "").lower()
        if any(e in il or il in e for e in exp):
            return True
    return False


async def _from_spoonacular(request: MealRecommendRequest):
    """Build suggestions from Spoonacular recipes enriched with Groq nutrition. None on failure."""
    sp = await spoonacular_service.find_by_ingredients(request.ingredients, number=5)
    if not sp["success"] or not sp.get("recipes"):
        return None

    recipes = sp["recipes"]
    titles = [r.get("title", "") for r in recipes]

    enrich_prompt = f"""For each recipe title below, estimate calories (integer), protein/carbs/fats in grams (float, 1 decimal) and a one-line health_note for someone with health condition: {request.health_condition or 'none'} and dietary preference: {request.dietary_preference or 'none'}.

Titles: {json.dumps(titles)}

Return ONLY JSON (no markdown):
{{"meals":[{{"name":"<title>","calories":500,"protein":20.0,"carbs":40.0,"fats":15.0,"health_note":"..."}}]}}"""
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
        ))
    return meals


async def _from_groq(request: MealRecommendRequest):
    """Pure-LLM meal generation fallback."""
    prompt = prompt_engine.build_meal_recommendation_prompt(
        ingredients=request.ingredients,
        dietary_preference=request.dietary_preference,
        health_condition=request.health_condition,
        cuisine_preference=request.cuisine_preference,
    )
    res = await groq_service.generate_json(prompt)
    if not res["success"]:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                            detail=f"Groq API error: {res.get('error')}")
    data = res["content"]
    if isinstance(data, dict):
        data = data.get("meals", [])

    meals = []
    for m in (data or [])[:5]:
        try:
            meals.append(MealSuggestion(
                name=m.get("name", "Meal"),
                calories=int(m.get("calories", 0) or 0),
                protein=float(m.get("protein", 0) or 0),
                carbs=float(m.get("carbs", 0) or 0),
                fats=float(m.get("fats", 0) or 0),
                reasoning=m.get("reasoning", ""),
                uses_expiring=_uses_expiring(request.ingredients, request.expiring_items),
                health_note=m.get("reasoning"),
                used_ingredients=request.ingredients,
            ))
        except Exception as e:
            logger.warning(f"Failed to parse meal: {e}")
    return meals


@router.post("", response_model=MealRecommendResponse)
async def recommend_meals(request: MealRecommendRequest):
    """
    Generate up to 5 meal suggestions from available ingredients.
    Uses Spoonacular for real recipes (enriched by Groq) when configured, else pure Groq.
    """
    try:
        cache_key = get_cache_key(
            request.ingredients,
            request.dietary_preference,
            request.health_condition,
            request.cuisine_preference,
        )
        if cache_key in meal_cache:
            logger.info("Returning cached meal recommendations")
            return MealRecommendResponse(**meal_cache[cache_key])

        meals = None
        if spoonacular_service.enabled:
            try:
                meals = await _from_spoonacular(request)
            except Exception as e:
                logger.warning(f"Spoonacular path failed, falling back to Groq: {e}")
        used_spoonacular = meals is not None
        if not meals:
            meals = await _from_groq(request)

        response_data = {
            "success": True,
            "meals": [m.model_dump() for m in meals[:5]],
            "used_groq": True,
            "refined_by_gemini": False,
        }
        meal_cache[cache_key] = response_data
        return MealRecommendResponse(**response_data)

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error in meal recommendation: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
