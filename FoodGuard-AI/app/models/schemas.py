from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime


class DietaryPreference(str, Enum):
    VEGETARIAN = "vegetarian"
    VEGAN = "vegan"
    NON_VEGETARIAN = "non_vegetarian"
    KETO = "keto"
    PALEO = "paleo"
    GLUTEN_FREE = "gluten_free"
    DAIRY_FREE = "dairy_free"


class HealthCondition(str, Enum):
    DIABETES = "diabetes"
    HYPERTENSION = "hypertension"
    WEIGHT_LOSS = "weight_loss"
    HEART_DISEASE = "heart_disease"
    NONE = "none"


# ==================== Meal Recommendation ====================
class MealRecommendRequest(BaseModel):
    ingredients: List[str] = Field(..., min_length=1, description="List of available ingredients")
    # Free-form strings (not strict enums) so saved user preferences like
    # "omnivore" / "pescatarian" / a cuisine name pass through instead of 422-ing.
    dietary_preference: Optional[str] = None
    health_condition: Optional[str] = None
    cuisine_preference: Optional[str] = None
    expiring_items: Optional[List[str]] = None

    @field_validator("dietary_preference", "health_condition", "cuisine_preference", mode="before")
    @classmethod
    def _blank_none_to_null(cls, value):
        if value is None:
            return None
        if isinstance(value, str) and value.strip().lower() in {"", "none", "null", "omnivore"}:
            return None
        return value


class MealSuggestion(BaseModel):
    name: str
    calories: int
    protein: float
    carbs: float
    fats: float
    reasoning: str
    recipe_id: Optional[int] = None
    image: Optional[str] = None
    uses_expiring: bool = False
    health_note: Optional[str] = None
    used_ingredients: List[str] = []
    missed_ingredients: List[str] = []


class MealRecommendResponse(BaseModel):
    success: bool
    meals: List[MealSuggestion]
    used_groq: bool
    refined_by_gemini: bool
    error: Optional[str] = None


# ==================== Nutrition Analysis ====================
class NutritionAnalysisRequest(BaseModel):
    food_items: List[str] = Field(..., min_length=1, description="List of food items to analyze")


class NutritionAnalysisResponse(BaseModel):
    success: bool
    total_calories: int
    macros: Dict[str, float]
    health_score: int = Field(..., ge=0, le=100)
    warning_flags: List[str]
    detailed_breakdown: List[Dict[str, Any]]
    error: Optional[str] = None


# ==================== Expiry Insights ====================
class InventoryItem(BaseModel):
    name: str
    quantity: str
    expiry_date: str
    category: Optional[str] = None


class ExpiryInsightsRequest(BaseModel):
    inventory_items: List[InventoryItem] = Field(..., min_length=1)


class ExpiryItem(BaseModel):
    name: str
    days_until_expiry: int
    urgency: str
    suggestion: str


class ExpiryInsightsResponse(BaseModel):
    success: bool
    expiring_soon: List[ExpiryItem]
    waste_risk_score: int = Field(..., ge=0, le=100)
    smart_suggestions: List[str]
    prioritized_list: List[Dict[str, Any]]
    error: Optional[str] = None


# ==================== Dashboard Summary ====================
class DashboardItem(BaseModel):
    name: str
    category: str
    quantity: str
    expiry_date: Optional[str] = None
    consumed_count: int = 0
    wasted_count: int = 0


class DashboardSummaryRequest(BaseModel):
    inventory: List[DashboardItem]
    user_health_goals: Optional[str] = None


class DashboardSummaryResponse(BaseModel):
    success: bool
    waste_reduction_summary: Dict[str, Any]
    health_summary: Dict[str, Any]
    top_consumed: List[Dict[str, Any]]
    top_wasted: List[Dict[str, Any]]
    weekly_recommendations: List[str]
    error: Optional[str] = None


# ==================== OCR Receipt ====================
class OCRReceiptRequest(BaseModel):
    image_url: Optional[str] = None
    image_data: Optional[str] = None  # Base64 encoded image


class OCRItem(BaseModel):
    name: str
    quantity: Optional[str] = None
    category: Optional[str] = None
    estimated_expiry: Optional[str] = None
    confidence: float = 1.0


class OCRReceiptResponse(BaseModel):
    success: bool
    items: List[OCRItem]
    raw_text: Optional[str] = None
    error: Optional[str] = None


# ==================== BMI & Health Engine ====================
class HealthProfileRequest(BaseModel):
    weight_kg: float = Field(..., gt=0, le=500)
    height_cm: float = Field(..., gt=0, le=300)
    age: int = Field(..., ge=1, le=120)
    gender: str
    activity_level: str
    health_goals: Optional[List[str]] = None


class HealthRuleResult(BaseModel):
    bmi: float
    bmi_category: str
    daily_calories: int
    macro_distribution: Dict[str, float]
    health_alerts: List[str]
    recommendations: List[str]


class HealthProfileResponse(BaseModel):
    success: bool
    bmi_result: HealthRuleResult
    error: Optional[str] = None


# ==================== AI Chatbot ====================
class ChatMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str


class ChatbotRequest(BaseModel):
    messages: List[ChatMessage]
    current_inventory: Optional[List[Dict[str, Any]]] = None
    user_context: Optional[Dict[str, Any]] = None


class ChatbotResponse(BaseModel):
    success: bool
    response: str
    suggestions: Optional[List[str]] = None
    error: Optional[str] = None


# ==================== Health Check ====================
class HealthCheckResponse(BaseModel):
    status: str
    groq_api: bool
    gemini_api: bool
    timestamp: str


# ==================== Scan Receipt (Gemini Vision OCR) ====================
class ReceiptItem(BaseModel):
    name: str
    quantity: Optional[str] = None
    unit: Optional[str] = None
    category: Optional[str] = None
    estimated_expiry_days: int = 7
    confidence: float = 0.8


class ScanReceiptRequest(BaseModel):
    image_data: Optional[str] = None  # Base64-encoded image (no data URI prefix)
    image_url: Optional[str] = None
    mime_type: str = "image/jpeg"


class ScanReceiptResponse(BaseModel):
    success: bool
    items: List[ReceiptItem]
    raw_text: Optional[str] = None
    error: Optional[str] = None


# ==================== Nutrition Analyze (CalorieNinjas + Groq) ====================
class FoodItemInput(BaseModel):
    name: str
    quantity_grams: Optional[float] = None


class NutritionAnalyzeRequest(BaseModel):
    food_items: List[FoodItemInput] = Field(..., min_length=1)


class NutritionAnalyzeResponse(BaseModel):
    success: bool
    totals: Dict[str, float]
    health_score: int = Field(..., ge=0, le=10)
    tips: List[str]
    daily_targets: Dict[str, float]
    breakdown: List[Dict[str, Any]]
    source: str = "calorieninjas"
    error: Optional[str] = None


# ==================== Condition-Based Meal Plan ====================
class ConditionMealPlanRequest(BaseModel):
    condition: str
    available_ingredients: List[str] = []
    days: int = Field(default=7, ge=1, le=7)


class ConditionMealPlanResponse(BaseModel):
    success: bool
    condition: str
    week_plan: List[Dict[str, Any]]
    error: Optional[str] = None


# ==================== Expiry Tips ====================
class ExpiringItemInput(BaseModel):
    name: str
    days_left: int


class ExpiryTipsRequest(BaseModel):
    expiring_items: List[ExpiringItemInput] = Field(..., min_length=1)


class ExpiryTip(BaseModel):
    item_name: str
    days_left: int
    tip: str
    suggested_recipe: Optional[str] = None


class ExpiryTipsResponse(BaseModel):
    success: bool
    tips: List[ExpiryTip]
    error: Optional[str] = None


# ==================== Weekly Wastage Report ====================
class WastageItemInput(BaseModel):
    name: str
    quantity: Optional[float] = 1
    value_pkr: Optional[float] = 0
    category: Optional[str] = None


class WastageReportRequest(BaseModel):
    expired_items: List[WastageItemInput] = []
    expiring_soon: List[WastageItemInput] = []


class WastageReportResponse(BaseModel):
    success: bool
    total_waste_kg: float
    estimated_loss_pkr: float
    waste_by_category: Dict[str, Any]
    recommendations: List[str]
    weekly_trend: List[Dict[str, Any]]
    error: Optional[str] = None