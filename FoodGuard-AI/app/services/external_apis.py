"""
Third-party food data API clients: Spoonacular (recipes) and CalorieNinjas (nutrition).
Both degrade gracefully: if the API key is missing or the call fails, they return
{"success": False, ...} so callers can fall back to LLM-only behaviour.
"""
import httpx
import logging
from typing import Any, Dict, List
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class SpoonacularService:
    """Recipe search/details via Spoonacular."""

    def __init__(self):
        self.api_key = settings.spoonacular_api_key
        self.base_url = "https://api.spoonacular.com"
        self.timeout = 20.0

    @property
    def enabled(self) -> bool:
        return bool(self.api_key)

    async def find_by_ingredients(self, ingredients: List[str], number: int = 5) -> Dict[str, Any]:
        """Find recipes that use the given ingredients."""
        if not self.enabled:
            return {"success": False, "error": "Spoonacular API key not configured"}

        params = {
            "ingredients": ",".join(ingredients),
            "number": number,
            "ranking": 2,           # maximise used ingredients / minimise missing
            "ignorePantry": "true",
            "apiKey": self.api_key,
        }
        try:
            async with httpx.AsyncClient(timeout=self.timeout, trust_env=False) as client:
                resp = await client.get(f"{self.base_url}/recipes/findByIngredients", params=params)
                if resp.status_code == 200:
                    return {"success": True, "recipes": resp.json()}
                logger.error(f"Spoonacular error {resp.status_code}: {resp.text[:200]}")
                return {"success": False, "error": f"Spoonacular {resp.status_code}"}
        except Exception as e:
            logger.warning(f"Spoonacular request failed: {e}")
            return {"success": False, "error": str(e)}

    async def recipe_information(self, recipe_id: int) -> Dict[str, Any]:
        """Fetch full details for a single recipe."""
        if not self.enabled:
            return {"success": False, "error": "Spoonacular API key not configured"}
        params = {"includeNutrition": "true", "apiKey": self.api_key}
        try:
            async with httpx.AsyncClient(timeout=self.timeout, trust_env=False) as client:
                resp = await client.get(f"{self.base_url}/recipes/{recipe_id}/information", params=params)
                if resp.status_code == 200:
                    return {"success": True, "recipe": resp.json()}
                return {"success": False, "error": f"Spoonacular {resp.status_code}"}
        except Exception as e:
            logger.warning(f"Spoonacular recipe info failed: {e}")
            return {"success": False, "error": str(e)}


class CalorieNinjasService:
    """Nutrition lookups via CalorieNinjas."""

    def __init__(self):
        self.api_key = settings.calorieninjas_api_key
        self.base_url = "https://api.calorieninjas.com/v1"
        self.timeout = 20.0

    @property
    def enabled(self) -> bool:
        return bool(self.api_key)

    async def nutrition(self, query: str) -> Dict[str, Any]:
        """Return nutrition items for a free-text food query (e.g. '2 eggs and toast')."""
        if not self.enabled:
            return {"success": False, "error": "CalorieNinjas API key not configured"}
        try:
            async with httpx.AsyncClient(timeout=self.timeout, trust_env=False) as client:
                resp = await client.get(
                    f"{self.base_url}/nutrition",
                    params={"query": query},
                    headers={"X-Api-Key": self.api_key},
                )
                if resp.status_code == 200:
                    return {"success": True, "items": resp.json().get("items", [])}
                logger.error(f"CalorieNinjas error {resp.status_code}: {resp.text[:200]}")
                return {"success": False, "error": f"CalorieNinjas {resp.status_code}"}
        except Exception as e:
            logger.warning(f"CalorieNinjas request failed: {e}")
            return {"success": False, "error": str(e)}


# Singleton instances
spoonacular_service = SpoonacularService()
calorieninjas_service = CalorieNinjasService()
