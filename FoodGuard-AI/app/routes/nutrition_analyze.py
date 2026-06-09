from fastapi import APIRouter, HTTPException, status
from app.models.schemas import NutritionAnalyzeRequest, NutritionAnalyzeResponse
from app.services.external_apis import calorieninjas_service
from app.services.groq_service import groq_service
from app.services.prompt_engine import prompt_engine
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ai/analyze-nutrition", tags=["Nutrition Analyzer"])

DAILY_TARGETS = {
    "calories": 2000.0, "protein_g": 50.0, "carbs_g": 275.0, "fat_g": 70.0, "sodium_mg": 2300.0
}


def _health_score(totals: dict) -> int:
    """0-10 score: penalise excess sodium/fat/sugar, reward adequate protein."""
    score = 10
    if totals.get("sodium_mg", 0) > 2300:
        score -= 2
    if totals.get("fat_g", 0) > 75:
        score -= 2
    if totals.get("sugar_g", 0) > 50:
        score -= 2
    if totals.get("protein_g", 0) >= 50:
        score += 1
    return max(0, min(10, score))


@router.post("", response_model=NutritionAnalyzeResponse)
async def analyze_nutrition(request: NutritionAnalyzeRequest):
    """Aggregate nutrition for food items via CalorieNinjas, with Groq fallback + tips."""
    try:
        totals = {"calories": 0.0, "protein_g": 0.0, "carbs_g": 0.0,
                  "fat_g": 0.0, "sodium_mg": 0.0, "sugar_g": 0.0, "fiber_g": 0.0}
        breakdown = []
        used_api = False

        for fi in request.food_items:
            qty = f"{fi.quantity_grams}g " if fi.quantity_grams else ""
            query = f"{qty}{fi.name}".strip()
            res = await calorieninjas_service.nutrition(query)
            if res["success"] and res.get("items"):
                used_api = True
                for it in res["items"]:
                    cal = float(it.get("calories", 0) or 0)
                    p = float(it.get("protein_g", 0) or 0)
                    c = float(it.get("carbohydrates_total_g", 0) or 0)
                    f = float(it.get("fat_total_g", 0) or 0)
                    s = float(it.get("sodium_mg", 0) or 0)
                    sug = float(it.get("sugar_g", 0) or 0)
                    fib = float(it.get("fiber_g", 0) or 0)
                    totals["calories"] += cal
                    totals["protein_g"] += p
                    totals["carbs_g"] += c
                    totals["fat_g"] += f
                    totals["sodium_mg"] += s
                    totals["sugar_g"] += sug
                    totals["fiber_g"] += fib
                    breakdown.append({
                        "name": it.get("name", fi.name),
                        "calories": round(cal, 1), "protein_g": round(p, 1),
                        "carbs_g": round(c, 1), "fat_g": round(f, 1), "sodium_mg": round(s, 1),
                    })

        source = "calorieninjas"
        if not used_api:
            # Fallback: estimate with Groq
            source = "groq-estimate"
            names = [fi.name for fi in request.food_items]
            gres = await groq_service.generate_json(
                prompt_engine.build_nutrition_analysis_prompt(names)
            )
            if gres["success"]:
                d = gres["content"]
                m = d.get("macros", {})
                totals["calories"] = float(d.get("total_calories", 0) or 0)
                totals["protein_g"] = float(m.get("protein", 0) or 0)
                totals["carbs_g"] = float(m.get("carbs", 0) or 0)
                totals["fat_g"] = float(m.get("fats", 0) or 0)
                breakdown = d.get("detailed_breakdown", [])

        totals = {k: round(v, 1) for k, v in totals.items()}
        health_score = _health_score(totals)

        # Personalised tips (best effort)
        tips = []
        try:
            tres = await groq_service.generate_json(
                prompt_engine.build_nutrition_tips_prompt(totals, health_score)
            )
            if tres["success"]:
                tips = tres["content"].get("tips", [])
        except Exception as e:
            logger.warning(f"Nutrition tips failed: {e}")
        if not tips:
            tips = ["Balance your macros across the day.", "Watch sodium and added sugar intake."]

        return NutritionAnalyzeResponse(
            success=True, totals=totals, health_score=health_score,
            tips=tips, daily_targets=DAILY_TARGETS, breakdown=breakdown, source=source,
        )

    except Exception as e:
        logger.exception(f"Error in analyze-nutrition: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
