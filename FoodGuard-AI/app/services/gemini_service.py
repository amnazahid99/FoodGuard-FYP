import httpx
import json
import logging
import os
from typing import Optional, Dict, Any
from openai import OpenAI

logger = logging.getLogger(__name__)


class GeminiService:
    """Service for Fireworks API integration (used as Gemini replacement in this project)."""

    def __init__(self):
        self.api_key = os.getenv("FIREWORKS_API_KEY") or os.getenv("GEMINI_API_KEY")
        self.base_url = "https://api.fireworks.ai/inference/v1"
        self.default_model = "accounts/fireworks/models/kimi-k2p5"
        self.timeout = 45.0
        self.client = OpenAI(api_key=self.api_key, base_url=self.base_url) if self.api_key else None

    async def generate(
        self,
        prompt: str,
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2048
    ) -> Dict[str, Any]:
        """
        Generate completion using Fireworks API.
        """
        model = model or self.default_model

        if not self.client:
            return {"success": False, "error": "Fireworks API key not configured"}

        try:
            response = self.client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                temperature=temperature,
                max_tokens=max_tokens,
            )

            return {
                "success": True,
                "content": response.choices[0].message.content,
                "model": model,
            }
        except Exception as e:
            logger.error(f"Fireworks API error: {e}")
            return {"success": False, "error": str(e)}

    async def generate_json(
        self,
        prompt: str,
        model: Optional[str] = None,
        temperature: float = 0.3,
        max_tokens: int = 2048
    ) -> Dict[str, Any]:
        """
        Generate JSON output using Fireworks API.
        """
        model = model or self.default_model

        json_prompt = f"""{prompt}

IMPORTANT: Respond ONLY with valid JSON. No markdown formatting, no code blocks, no additional text. The JSON must be parseable by json.loads()."""

        if not self.client:
            return {"success": False, "error": "Fireworks API key not configured"}

        try:
            response = self.client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": json_prompt}],
                temperature=temperature,
                max_tokens=max_tokens,
            )

            content = response.choices[0].message.content.strip()
            # Remove markdown code blocks if present
            if content.startswith("```json"):
                content = content[7:]
            elif content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
            content = content.strip()

            try:
                parsed = json.loads(content)
                return {
                    "success": True,
                    "content": parsed,
                    "model": model
                }
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse JSON: {e}")
                return {
                    "success": False,
                    "error": "Invalid JSON response"
                }
        except Exception as e:
            logger.exception(f"Fireworks API exception: {str(e)}")
            return {"success": False, "error": str(e)}

    async def validate_and_refine(
        self,
        content: str,
        validation_type: str = "nutrition"
    ) -> Dict[str, Any]:
        """
        Validate and refine content using Fireworks for reasoning.
        """
        prompt = f"""You are a nutrition and food safety expert. Analyze and validate the following {validation_type} data.
        Provide refined feedback and corrections if needed.

        Data to analyze:
        {content}

        Return a JSON with:
        - "is_valid": boolean
        - "refined_data": the corrected/improved data if needed
        - "reasoning": explanation of any changes made
        - "confidence_score": 0-100 confidence in the analysis
        """

        result = await self.generate_json(prompt, temperature=0.4, max_tokens=2048)
        return result

    async def generate_with_image(
        self,
        prompt: str,
        image_data: str,
        mime_type: str = "image/jpeg",
        model: Optional[str] = None,
        temperature: float = 0.2,
        max_tokens: int = 2048
    ) -> Dict[str, Any]:
        """
        Generate completion from an image using Fireworks vision capabilities.

        Args:
            prompt: The instruction prompt
            image_data: Base64-encoded image bytes (no data URI prefix)
            mime_type: Image MIME type (image/jpeg, image/png, ...)

        Returns:
            Dict with success + text (raw model output) or error.
        """
        model = model or "accounts/fireworks/models/kimi-k2p5"

        if not self.client:
            return {"success": False, "error": "Fireworks API key not configured"}

        try:
            response = self.client.chat.completions.create(
                model=model,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:{mime_type};base64,{image_data}"
                                }
                            }
                        ]
                    }
                ],
                temperature=temperature,
                max_tokens=max_tokens,
            )

            return {
                "success": True,
                "text": response.choices[0].message.content,
                "model": model
            }
        except Exception as e:
            logger.exception(f"Fireworks Vision API exception: {str(e)}")
            return {"success": False, "error": str(e)}


# Singleton instance
gemini_service = GeminiService()