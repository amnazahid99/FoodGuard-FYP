import asyncio
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

    async def _post_json(self, payload: Dict[str, Any], *, timeout: float, retries: int = 2) -> Dict[str, Any]:
        if not self.api_key:
            return {"success": False, "error": "GROQ_API_KEY not configured"}

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        last_error = ""
        for attempt in range(retries + 1):
            try:
                async with httpx.AsyncClient(timeout=timeout, trust_env=False) as client:
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
                        "model": payload.get("model", self.default_model),
                        "usage": result.get("usage", {}),
                    }

                last_error = f"Groq API error: {response.status_code} - {response.text[:500]}"
                logger.error(last_error)
                if response.status_code in {429, 500, 502, 503, 504} and attempt < retries:
                    await asyncio.sleep(1.0 * (attempt + 1))
                    continue
                break
            except httpx.TimeoutException:
                last_error = "Request timeout"
                logger.error(last_error)
                if attempt < retries:
                    await asyncio.sleep(1.0 * (attempt + 1))
                    continue
                break
            except Exception as exc:
                last_error = str(exc)
                logger.exception("Groq API exception")
                if attempt < retries:
                    await asyncio.sleep(1.0 * (attempt + 1))
                    continue
                break

        return {"success": False, "error": last_error or "Groq API request failed"}

    async def generate(
        self,
        prompt: str,
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
        timeout: Optional[float] = None,
        retries: int = 2,
    ) -> Dict[str, Any]:
        model = model or self.default_model
        payload = {
            "model": model,
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        return await self._post_json(payload, timeout=timeout or self.timeout, retries=retries)

    async def generate_json(
        self,
        prompt: str,
        model: Optional[str] = None,
        temperature: float = 0.3,
        max_tokens: int = 2048,
        timeout: Optional[float] = None,
        retries: int = 2,
    ) -> Dict[str, Any]:
        json_prompt = f"""{prompt}

IMPORTANT: Respond ONLY with valid JSON. No markdown formatting, no code blocks, no additional text. The JSON must be parseable by json.loads()."""

        result = await self.generate(
            prompt=json_prompt,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            timeout=timeout,
            retries=retries,
        )

        if result["success"]:
            content = result["content"].strip()
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
            except json.JSONDecodeError as exc:
                logger.error(f"Failed to parse JSON: {exc}")
                result["success"] = False
                result["error"] = "Invalid JSON response"

        return result

    async def generate_with_image(
        self,
        prompt: str,
        image_data: str,
        model: Optional[str] = "llama-3.2-11b-vision-instruct-preview",
        temperature: float = 0.3,
        max_tokens: int = 2048,
        mime_type: str = "image/jpeg",
        timeout: Optional[float] = None,
        retries: int = 2,
    ) -> Dict[str, Any]:
        if not self.api_key:
            return {"success": False, "error": "GROQ_API_KEY not configured"}

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
            "max_tokens": max_tokens,
        }

        return await self._post_json(payload, timeout=timeout or 60.0, retries=retries)


groq_service = GroqService()
