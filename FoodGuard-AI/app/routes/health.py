from fastapi import APIRouter, HTTPException, status
from app.models.schemas import (
    HealthProfileRequest,
    HealthProfileResponse,
    HealthRuleResult
)
from app.services.groq_service import groq_service
from app.services.prompt_engine import prompt_engine
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ai/health-profile", tags=["BMI & Health Engine"])


def calculate_bmi(weight_kg: float, height_cm: float) -> float:
    """Calculate BMI."""
    height_m = height_cm / 100
    return round(weight_kg / (height_m * height_m), 1)


def get_bmi_category(bmi: float) -> str:
    """Get BMI category."""
    if bmi < 18.5:
        return "underweight"
    elif bmi < 25:
        return "normal"
    elif bmi < 30:
        return "overweight"
    else:
        return "obese"


def calculate_daily_calories(weight_kg: float, height_cm: float, age: int, gender: str, activity_level: str) -> int:
    """Calculate BMR and daily calories using Mifflin-St Jeor equation."""
    # BMR calculation
    if gender.lower() == "male":
        bmr = (10 * weight_kg) + (6.25 * height_cm) - (5 * age) + 5
    else:
        bmr = (10 * weight_kg) + (6.25 * height_cm) - (5 * age) - 161

    # Activity multiplier
    activity_multipliers = {
        "sedentary": 1.2,
        "light": 1.375,
        "moderate": 1.55,
        "active": 1.725,
        "very_active": 1.9
    }

    multiplier = activity_multipliers.get(activity_level.lower(), 1.2)
    return int(bmr * multiplier)


def get_macro_distribution(bmi_category: str, health_goals: list = None) -> dict:
    """Get macro distribution based on BMI and health goals."""
    goals = health_goals or []

    if "weight_loss" in goals:
        return {"protein": 35.0, "carbs": 30.0, "fats": 35.0}
    elif "weight_gain" in goals:
        return {"protein": 30.0, "carbs": 45.0, "fats": 25.0}
    elif bmi_category == "overweight" or bmi_category == "obese":
        return {"protein": 30.0, "carbs": 35.0, "fats": 35.0}
    else:
        # Standard balanced diet
        return {"protein": 25.0, "carbs": 45.0, "fats": 30.0}


def generate_health_alerts(bmi: float, bmi_category: str, age: int) -> list:
    """Generate health alerts based on profile."""
    alerts = []

    if bmi_category == "underweight":
        alerts.append("Consider increasing caloric intake for healthy weight gain")
    elif bmi_category == "overweight":
        alerts.append("Monitor portion sizes and increase physical activity")
    elif bmi_category == "obese":
        alerts.append("Consult a healthcare provider for weight management support")

    if age > 50:
        alerts.append("Ensure adequate calcium and vitamin D intake")

    return alerts


@router.post("", response_model=HealthProfileResponse)
async def calculate_health_profile(request: HealthProfileRequest):
    """
    Calculate BMI, daily caloric needs, and provide health recommendations.
    Uses rule-based calculations enhanced with AI insights.
    """
    try:
        # Calculate BMI
        bmi = calculate_bmi(request.weight_kg, request.height_cm)
        bmi_category = get_bmi_category(bmi)

        # Calculate daily calories
        daily_calories = calculate_daily_calories(
            request.weight_kg,
            request.height_cm,
            request.age,
            request.gender,
            request.activity_level
        )

        # Get macro distribution
        macro_distribution = get_macro_distribution(
            bmi_category,
            request.health_goals
        )

        # Generate basic alerts
        health_alerts = generate_health_alerts(bmi, bmi_category, request.age)

        # Get AI-enhanced recommendations
        ai_recommendations = []
        try:
            prompt = prompt_engine.build_health_recommendations_prompt(
                bmi=bmi,
                bmi_category=bmi_category,
                daily_calories=daily_calories,
                activity_level=request.activity_level,
                health_goals=request.health_goals or []
            )

            result = await groq_service.generate_json(prompt)

            if result["success"]:
                content = result["content"]
                ai_recommendations = content.get("recommendations", [])
                # Also update alerts from AI
                ai_alerts = content.get("health_alerts", [])
                for alert in ai_alerts:
                    if alert not in health_alerts:
                        health_alerts.append(alert)
        except Exception as e:
            logger.warning(f"AI recommendations failed, using defaults: {e}")

        # If no AI recommendations, provide defaults
        if not ai_recommendations:
            if bmi_category == "underweight":
                ai_recommendations = [
                    "Focus on nutrient-dense foods like nuts, avocados, and lean proteins",
                    "Consider strength training to build muscle mass"
                ]
            elif bmi_category == "normal":
                ai_recommendations = [
                    "Maintain current activity levels for optimal health",
                    "Continue balanced nutrition with variety of foods"
                ]
            elif bmi_category == "overweight":
                ai_recommendations = [
                    "Increase protein intake to support satiety",
                    "Limit processed foods and added sugars",
                    "Aim for 150 minutes of moderate exercise per week"
                ]
            else:  # obese
                ai_recommendations = [
                    "Start with low-impact exercises like walking or swimming",
                    "Keep a food journal to track eating patterns",
                    "Consult a nutritionist for personalized meal plans"
                ]

        bmi_result = HealthRuleResult(
            bmi=bmi,
            bmi_category=bmi_category,
            daily_calories=daily_calories,
            macro_distribution=macro_distribution,
            health_alerts=health_alerts,
            recommendations=ai_recommendations
        )

        return HealthProfileResponse(
            success=True,
            bmi_result=bmi_result
        )

    except Exception as e:
        logger.exception(f"Error in health profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )