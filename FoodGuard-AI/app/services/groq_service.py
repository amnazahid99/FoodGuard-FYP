import httpx
import json
import logging
from typing import Optional, Dict, Any
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class GroqService:
    """Service for Groq API integration for fast LLM inference."""

    def __init__(self):
        self.api_key = settings.groq_api_key
        self.base_url = "https://api.groq.com/openai/v1"
        self.default_model = "llama-3.3-70b-versatile"
        self.timeout = 30.0

    async def generate(
        self,
        prompt: str,
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2048
    ) -> Dict[str, Any]:
        """
        Generate completion using Groq API.

        Args:
            prompt: The input prompt
            model: Model to use (defaults to llama-3.1-70b-versatile)
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate

        Returns:
            Dict containing the generated text or error
        """
        model = model or self.default_model

        if not self.api_key:
            return {"success": False, "error": "GROQ_API_KEY not configured"}

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": model,
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "temperature": temperature,
            "max_tokens": max_tokens
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout, trust_env=False) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=payload
                )

                if response.status_code == 200:
                    result = response.json()
                    return {
                        "success": True,
                        "content": result["choices"][0]["message"]["content"],
                        "model": model,
                        "usage": result.get("usage", {})
                    }
                else:
                    error_msg = f"Groq API error: {response.status_code} - {response.text}"
                    logger.error(error_msg)
                    return {
                        "success": False,
                        "error": error_msg
                    }

        except httpx.TimeoutException:
            logger.error("Groq API timeout")
            return {
                "success": False,
                "error": "Request timeout"
            }
        except Exception as e:
            logger.exception(f"Groq API exception: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }

    async def generate_json(
        self,
        prompt: str,
        model: Optional[str] = None,
        temperature: float = 0.3,
        max_tokens: int = 2048
    ) -> Dict[str, Any]:
        """
        Generate JSON output using Groq API.
        Adds JSON formatting instructions to the prompt.
        """
        json_prompt = f"""{prompt}

IMPORTANT: Respond ONLY with valid JSON. No markdown formatting, no code blocks, no additional text. The JSON must be parseable by json.loads()."""

        result = await self.generate(
            prompt=json_prompt,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens
        )

        if result["success"]:
            content = result["content"].strip()
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
                result["content"] = parsed
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse JSON: {e}")
                result["success"] = False
                result["error"] = "Invalid JSON response"

        return result


    async def generate_with_image(
        self,
        prompt: str,
        image_data: str,
        model: Optional[str] = "meta-llama/llama-4-scout-17b-16e-instruct",
        temperature: float = 0.3,
        max_tokens: int = 2048,
        mime_type: str = "image/jpeg"
    ) -> Dict[str, Any]:
        """
        Generate completion with image input using Groq's vision model.

        Args:
            prompt: The input prompt
            image_data: Base64 encoded image data
            model: Model to use (must support vision)
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate

        Returns:
            Dict containing the generated text or error
        """
        if not self.api_key:
            return {"success": False, "error": "GROQ_API_KEY not configured"}

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": model,
            "messages": [
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
            "temperature": temperature,
            "max_tokens": max_tokens
        }

        try:
            async with httpx.AsyncClient(timeout=60.0, trust_env=False) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=payload
                )

                if response.status_code == 200:
                    result = response.json()
                    return {
                        "success": True,
                        "text": result["choices"][0]["message"]["content"],
                        "model": model,
                        "usage": result.get("usage", {})
                    }
                else:
                    error_msg = f"Groq API error: {response.status_code} - {response.text}"
                    logger.error(error_msg)
                    return {
                        "success": False,
                        "error": error_msg
                    }

        except httpx.TimeoutException:
            logger.error("Groq API timeout")
            return {
                "success": False,
                "error": "Request timeout"
            }
        except Exception as e:
            logger.exception(f"Groq API exception: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }


# Singleton instance
groq_service = GroqService()