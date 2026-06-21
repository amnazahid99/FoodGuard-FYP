import logging
from typing import Any, Dict, Optional

from app.services.fireworks_service import fireworks_service

logger = logging.getLogger(__name__)


class GeminiService:
    """Compatibility wrapper for the Fireworks API service."""

    @property
    def client(self):
        return fireworks_service if fireworks_service.enabled else None

    async def generate(
        self,
        prompt: str,
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> Dict[str, Any]:
        return await fireworks_service.generate(
            prompt,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
        )

    async def generate_json(
        self,
        prompt: str,
        model: Optional[str] = None,
        temperature: float = 0.3,
        max_tokens: int = 2048,
    ) -> Dict[str, Any]:
        return await fireworks_service.generate_json(
            prompt,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
        )

    async def validate_and_refine(
        self,
        content: str,
        validation_type: str = "nutrition",
    ) -> Dict[str, Any]:
        prompt = f"""You are a nutrition and food safety expert. Analyze and validate the following {validation_type} data.
        Provide refined feedback and corrections if needed.

        Data to analyze:
        {content}

        Return a JSON object with:
        - "is_valid": boolean
        - "refined_data": the corrected/improved data if needed
        - "reasoning": explanation of any changes made
        - "confidence_score": 0-100 confidence in the analysis
        """
        return await self.generate_json(prompt, temperature=0.4, max_tokens=2048)

    async def generate_with_image(
        self,
        prompt: str,
        image_data: str,
        mime_type: str = "image/jpeg",
        model: Optional[str] = None,
        temperature: float = 0.2,
        max_tokens: int = 2048,
    ) -> Dict[str, Any]:
        return await fireworks_service.generate_with_image(
            prompt,
            image_data,
            mime_type=mime_type,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
        )


gemini_service = GeminiService()
