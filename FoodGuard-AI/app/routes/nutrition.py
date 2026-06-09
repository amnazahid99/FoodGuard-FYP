from fastapi import APIRouter, HTTPException, status
from app.models.schemas import (
    NutritionAnalysisRequest,
    NutritionAnalysisResponse
)
from app.services.groq_service import groq_service
from app.services.prompt_engine import prompt_engine
import logging
import hashlib

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ai/nutrition-analysis", tags=["Nutrition Analysis"])

# Simple in-memory cache
nutrition_cache = {}


def get_cache_key(food_items: list) -> str:
    """Generate cache key for nutrition analysis."""
    key_str = ",".join(sorted(food_items))
    return hashlib.md5(key_str.encode()).hexdigest()


@router.post("", response_model=NutritionAnalysisResponse)
async def analyze_nutrition(request: NutritionAnalysisRequest):
    """
    Analyze nutritional content of food items.
    Returns total calories, macros, health score, and warning flags.
    """
    try:
        # Check cache
        cache_key = get_cache_key(request.food_items)
        if cache_key in nutrition_cache:
            logger.info("Returning cached nutrition analysis")
            return NutritionAnalysisResponse(**nutrition_cache[cache_key])

        # Build prompt
        prompt = prompt_engine.build_nutrition_analysis_prompt(request.food_items)

        # Generate with Groq (fast inference)
        result = await groq_service.generate_json(prompt)

        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"API error: {result.get('error')}"
            )

        data = result["content"]

        # Validate response structure
        response_data = {
            "success": True,
            "total_calories": data.get("total_calories", 0),
            "macros": data.get("macros", {"protein": 0.0, "carbs": 0.0, "fats": 0.0}),
            "health_score": data.get("health_score", 50),
            "warning_flags": data.get("warning_flags", []),
            "detailed_breakdown": data.get("detailed_breakdown", [])
        }

        # Cache the result
        nutrition_cache[cache_key] = response_data

        return NutritionAnalysisResponse(**response_data)

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error in nutrition analysis: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )