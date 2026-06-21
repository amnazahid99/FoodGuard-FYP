import json
from typing import Dict, Any, List, Optional


class PromptEngine:
    """Engine for creating structured prompts for AI services."""

    @staticmethod
    def build_meal_recommendation_prompt(
        ingredients: List[str],
        dietary_preference: Optional[str] = None,
        health_condition: Optional[str] = None,
        cuisine_preference: Optional[str] = None,
        expiring_items: Optional[List[str]] = None,
        inventory_items: Optional[List[Dict[str, Any]]] = None,
        health_profile: Optional[Dict[str, Any]] = None,
        units: Optional[str] = None,
        expiring_warn_days: Optional[int] = 3,
    ) -> str:
        """
        Build prompt for meal recommendation.
        """
        dietary_text = f"\nDietary preference (must respect): {dietary_preference}" if dietary_preference else ""
        health_text = f"\nHealth condition (tailor meals for this): {health_condition}" if health_condition else ""
        cuisine_text = f"\nPreferred cuisine (STRICTLY use ONLY this cuisine for every meal — {cuisine_preference})" if cuisine_preference else ""
        expiring_text = f"\nPrioritize these expiring inventory items (within {expiring_warn_days} days of expiry) and use at least one where sensible: {', '.join(expiring_items)}" if expiring_items else ""
        inventory_text = f"\nActive inventory JSON: {json.dumps(inventory_items or [])}" if inventory_items else ""
        profile = health_profile or {}
        profile_text = f"""
User health profile:
- Units: {units or profile.get('units') or 'metric'}
- Daily calorie target: {profile.get('daily_calories') or 'not specified'}
- Macro targets: {profile.get('macros') or 'not specified'}
- Health goal: {profile.get('health_goal') or 'not specified'}
- Activity level: {profile.get('activity_level') or 'not specified'}
- BMI: {profile.get('bmi') or 'not specified'}"""

        return f"""You are a professional nutritionist and AI chef. Generate 5 personalized meal recommendations based on available inventory.

Available ingredients: {', '.join(ingredients)}
{dietary_text}
{health_text}
{cuisine_text}
{expiring_text}
{inventory_text}
{profile_text}

Rules:
1. Respect dietary preference and health condition.
2. Prioritize expiring inventory items and reduce food waste.
3. Use inventory names in used_ingredients/missed_ingredients.
4. Return ONLY valid JSON, no markdown, no code fences.

Return a JSON object with this exact structure:
{{
  "meals": [
    {{
      "name": "Meal Name",
      "calories": 500,
      "protein": 25.0,
      "carbs": 50.0,
      "fats": 15.0,
      "difficulty": "Easy",
      "cuisine": "Pakistani",
      "match_score": 85,
      "used_ingredients": ["chicken", "spinach"],
      "missed_ingredients": ["olive oil"],
      "uses_expiring": true,
      "health_note": "Fits the selected dietary and health constraints.",
      "reasoning": "Why this meal fits the user's needs.",
      "ingredients": ["chicken", "spinach", "olive oil"],
      "instructions": ["Cook chicken until done.", "Add spinach and serve."]
    }}
  ]
}}"""

    @staticmethod
    def build_nutrition_analysis_prompt(food_items: List[str]) -> str:
        """
        Build prompt for nutrition analysis.
        """
        return f"""You are a professional nutritionist. Analyze the nutritional content of these food items.

Food items: {', '.join(food_items)}

For each item, estimate calories, protein (g), carbs (g), and fats (g).
Calculate total nutrition and provide a health score (0-100).

Return ONLY a JSON object (no markdown, no code blocks) with this exact structure:
{{
  "total_calories": 1500,
  "macros": {{"protein": 50.0, "carbs": 150.0, "fats": 60.0}},
  "health_score": 75,
  "warning_flags": ["high sodium", "high sugar"],
  "detailed_breakdown": [
    {{"item": "chicken breast", "calories": 165, "protein": 31.0, "carbs": 0.0, "fats": 3.6}},
    ...
  ]
}}

Warning flags should include: "high sodium", "high sugar", "high saturated fat", "high cholesterol", "low fiber", "low protein"."""

    @staticmethod
    def build_expiry_insights_prompt(inventory_items: List[Dict[str, Any]]) -> str:
        """
        Build prompt for expiry insights.
        """
        items_json = json.dumps(inventory_items)

        return f"""You are a food waste reduction expert. Analyze these inventory items for expiry insights.

Inventory items (JSON):
{items_json}

For each item, determine:
- days_until_expiry: Days remaining until expiry (negative if expired)
- urgency: "critical" (< 2 days), "high" (2-5 days), "medium" (5-7 days), "low" (> 7 days)
- suggestion: Smart usage suggestion (what to cook, how to store, etc.)

Return ONLY a JSON object (no markdown, no code blocks) with this exact structure:
{{
  "expiring_soon": [
    {{"name": "milk", "days_until_expiry": 2, "urgency": "high", "suggestion": "Use in pancakes or creamy soups"}},
    ...
  ],
  "waste_risk_score": 65,
  "smart_suggestions": [
    "Use expiring items first in your meal planning",
    "Consider freezing items with > 5 days left",
    ...
  ],
  "prioritized_list": [
    {{"name": "milk", "priority": 1, "reason": "Expiring in 2 days"}},
    ...
  ]
}}"""

    @staticmethod
    def build_dashboard_summary_prompt(
        inventory: List[Dict[str, Any]],
        user_health_goals: Optional[str] = None
    ) -> str:
        """
        Build prompt for dashboard summary.
        """
        inventory_json = json.dumps(inventory)
        goals_text = f"\nUser health goals: {user_health_goals}" if user_health_goals else ""

        return f"""You are a food management AI expert. Generate comprehensive dashboard insights based on user inventory.

Inventory data (JSON):
{inventory_json}
{goals_text}

Analyze the inventory and provide insights in this exact JSON structure (no markdown, no code blocks):
{{
  "waste_reduction_summary": {{
    "items_at_risk": 5,
    "potential_waste_value": "$15",
    "items_to_use_first": ["milk", "eggs"],
    "tips": ["Plan meals around expiring items", "Freeze what you can't use"]
  }},
  "health_summary": {{
    "balanced_items": 8,
    "missing_categories": ["vegetables", "protein"],
    "health_score": 70,
    "recommendations": ["Add more leafy greens", "Include more protein sources"]
  }},
  "top_consumed": [
    {{"name": "rice", "count": 10}},
    {{"name": "chicken", "count": 8}}
  ],
  "top_wasted": [
    {{"name": "milk", "count": 3, "reason": "expired before use"}}
  ],
  "weekly_recommendations": [
    "Use 3 items expiring this week",
    "Restock vegetables and fruits",
    "Try 2 new healthy recipes"
  ]
}}"""

    @staticmethod
    def build_validation_prompt(
        data: Dict[str, Any],
        validation_type: str
    ) -> str:
        """
        Build validation prompt for Gemini refinement.
        """
        data_json = json.dumps(data, indent=2)

        return f"""You are a food safety and nutrition expert. Validate and refine this {validation_type} data.

Data to validate:
{data_json}

Return a JSON object with validation results:
{{
  "is_valid": true/false,
  "refined_data": {{...}},
  "reasoning": "explanation",
  "confidence_score": 85
}}"""


    @staticmethod
    def build_ocr_prompt() -> str:
        """
        Build prompt for OCR receipt scanning.
        """
        return """You are a receipt scanning expert. Analyze this receipt image and extract all purchasable food items.

For each item, provide:
1. name: The item name (e.g., "Whole Milk", "Organic Eggs")
2. quantity: The quantity if visible (e.g., "1 gallon", "1 dozen")
3. category: Food category (dairy, produce, meat, bakery, frozen, beverages, pantry, snacks, other)
4. estimated_expiry: Estimated expiry date if perceivable (e.g., "2024-01-15", "7 days")
5. confidence: How confident you are in the reading (0.0 to 1.0)

Return ONLY a JSON object with this exact structure:
{
  "items": [
    {"name": "Whole Milk", "quantity": "1 gallon", "category": "dairy", "estimated_expiry": "7 days", "confidence": 0.95},
    ...
  ]
}"""

    @staticmethod
    def build_receipt_parse_prompt(raw_text: str) -> str:
        """
        Build prompt to parse raw OCR text into structured items.
        """
        return f"""Parse this receipt text and extract food items.

Receipt text:
{raw_text}

For each food item found, provide:
1. name: The item name
2. quantity: The quantity if visible
3. category: Food category (dairy, produce, meat, bakery, frozen, beverages, pantry, snacks, other)
4. estimated_expiry: Estimated shelf life (e.g., "7 days", "2 weeks", "1 month")
5. confidence: How confident you are (0.0 to 1.0)

Return ONLY a JSON object:
{{
  "items": [
    {{"name": "...", "quantity": "...", "category": "...", "estimated_expiry": "...", "confidence": 0.8}},
    ...
  ]
}}"""

    @staticmethod
    def build_health_recommendations_prompt(
        bmi: float,
        bmi_category: str,
        daily_calories: int,
        activity_level: str,
        health_goals: List[str]
    ) -> str:
        """
        Build prompt for AI-enhanced health recommendations.
        """
        goals_text = ", ".join(health_goals) if health_goals else "maintain health"

        return f"""You are a health and nutrition expert. Provide personalized health recommendations.

User Profile:
- BMI: {bmi} ({bmi_category})
- Daily caloric needs: {daily_calories} calories
- Activity level: {activity_level}
- Health goals: {goals_text}

Provide recommendations and health alerts in this exact JSON structure:
{{
  "recommendations": [
    "Specific recommendation 1",
    "Specific recommendation 2",
    ...
  ],
  "health_alerts": [
    "Alert 1 if applicable",
    "Alert 2 if applicable"
  ]
}}

Focus on practical, actionable advice specific to this user's profile."""

    @staticmethod
    def build_chatbot_prompt(
        system_prompt: str,
        conversation_history: List[Dict[str, str]],
        inventory_context: str = "",
        user_context: str = ""
    ) -> str:
        """
        Build prompt for chatbot conversation.
        """
        history_text = "\n".join([
            f"{msg['role'].capitalize()}: {msg['content']}"
            for msg in conversation_history[-6:]  # Last 6 messages
        ])

        return f"""{system_prompt}

{user_context}
{inventory_context}

Conversation history:
{history_text}

User: {conversation_history[-1]['content'] if conversation_history else 'Hello'}

Provide a helpful, concise response. If suggesting recipes or meals, include brief reasoning."""

    @staticmethod
    def build_condition_meal_plan_prompt(
        condition: str,
        available_ingredients: List[str],
        days: int = 7,
        dietary_preference: Optional[str] = None,
        cuisine_preference: Optional[str] = None,
        units: Optional[str] = None,
        health_profile: Optional[Dict[str, Any]] = None,
        inventory_items: Optional[List[Dict[str, Any]]] = None,
        expiring_warn_days: Optional[int] = 3,
    ) -> str:
        """Build prompt for a condition-appropriate multi-day meal plan."""
        ingredients_text = ", ".join(available_ingredients) if available_ingredients else "common pantry staples"
        dietary_text = f"\nDietary preference (must respect): {dietary_preference}" if dietary_preference else ""
        cuisine_text = f"\nPreferred cuisine (STRICTLY use ONLY this cuisine for every meal — {cuisine_preference})" if cuisine_preference else ""
        units_text = f"\nMeasurement units: {units or 'metric'}"
        profile = health_profile or {}
        profile_text = f"""
User health profile:
- Daily calorie target: {profile.get('daily_calories') or 'not specified'}
- Macro targets: {profile.get('macros') or 'not specified'}
- Health goal: {profile.get('health_goal') or 'not specified'}
- Activity level: {profile.get('activity_level') or 'not specified'}
- BMI: {profile.get('bmi') or 'not specified'}"""
        inventory_text = f"\nActive inventory JSON: {json.dumps(inventory_items or [])}" if inventory_items else ""
        return f"""You are a clinical dietitian. Create a complete {days}-day meal plan tailored for a person with this health condition: {condition}.
Available ingredients: {ingredients_text}
{dietary_text}
{cuisine_text}
{units_text}
Expiring items threshold: items within {expiring_warn_days} days of expiry should be prioritised.
{profile_text}
{inventory_text}

Rules:
1. Strictly adhere to the health condition and dietary preference.
2. Prioritize expiring inventory items where sensible.
3. Each day must include breakfast, lunch, dinner, and an optional snack.
4. Every meal must include calories, protein, carbs, fats, ingredients, and step-by-step instructions.
5. Return ONLY valid JSON, no markdown, no code fences.

Return a JSON object with this exact structure:
{{
  "week_plan": [
    {{
      "day": "Day 1",
      "breakfast": {{"name": "...", "calories": 350, "protein": 18, "carbs": 55, "fats": 10, "ingredients": ["..."], "instructions": ["..."], "cuisine": "...", "difficulty": "Easy"}},
      "lunch": {{"name": "...", "calories": 500, "protein": 30, "carbs": 60, "fats": 16, "ingredients": ["..."], "instructions": ["..."], "cuisine": "...", "difficulty": "Medium"}},
      "dinner": {{"name": "...", "calories": 550, "protein": 32, "carbs": 65, "fats": 18, "ingredients": ["..."], "instructions": ["..."], "cuisine": "...", "difficulty": "Medium"}},
      "snack": {{"name": "...", "calories": 150, "protein": 8, "carbs": 20, "fats": 5, "ingredients": ["..."], "instructions": ["Prepare as a snack."], "cuisine": "...", "difficulty": "Easy"}}
    }}
  ]
}}"""

    @staticmethod
    def build_expiry_tips_prompt(expiring_items: List[Dict[str, Any]]) -> str:
        """Build prompt for per-item expiry usage tips."""
        items_json = json.dumps(expiring_items)
        return f"""You are a food waste reduction expert. For each expiring item, give one short usage tip and one quick recipe idea.

Expiring items (JSON, with days_left):
{items_json}

Return ONLY a JSON object (no markdown, no code blocks):
{{
  "tips": [
    {{"item_name": "milk", "days_left": 2, "tip": "Use in a smoothie or bechamel before it turns", "suggested_recipe": "Creamy mushroom pasta"}}
  ]
}}
Include one entry per input item, preserving the days_left value."""

    @staticmethod
    def build_nutrition_tips_prompt(totals: Dict[str, Any], health_score: int) -> str:
        """Build prompt for personalized nutrition tips from aggregated totals."""
        totals_json = json.dumps(totals)
        return f"""You are a registered dietitian. Based on this day's nutrition totals and a health score of {health_score}/10, give 2-3 short, actionable nutrition tips.

Totals (JSON): {totals_json}

Return ONLY a JSON object (no markdown, no code blocks):
{{"tips": ["tip 1", "tip 2", "tip 3"]}}"""

    @staticmethod
    def build_wastage_report_prompt(
        expired_items: List[Dict[str, Any]],
        expiring_soon: List[Dict[str, Any]],
        total_waste_kg: float,
        estimated_loss_pkr: float
    ) -> str:
        """Build prompt for weekly wastage analysis + recommendations."""
        return f"""You are a food-waste analytics advisor. Analyse this household/business waste data.

Expired this period (JSON): {json.dumps(expired_items)}
Expiring soon (JSON): {json.dumps(expiring_soon)}
Computed totals: total_waste_kg={total_waste_kg}, estimated_loss_pkr={estimated_loss_pkr}

Return ONLY a JSON object (no markdown, no code blocks):
{{
  "summary": "1-2 sentence analysis of the waste pattern",
  "waste_by_category": {{"dairy": 2, "produce": 5}},
  "recommendations": ["specific action 1", "specific action 2", "specific action 3"],
  "discount_suggestions": [
    {{"item": "milk", "suggested_discount_pct": 30, "reason": "expires in 2 days"}}
  ]
}}"""


# Singleton instance
prompt_engine = PromptEngine()