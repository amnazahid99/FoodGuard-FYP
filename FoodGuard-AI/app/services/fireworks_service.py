import asyncio
import logging
from typing import Any, Dict, List, Optional

import httpx
from app.core.config import get_settings

logger = logging.getLogger(__name__)


class FireworksService:
    def __init__(self) -> None:
        settings = get_settings()
        self.api_key = (settings.fireworks_api_key or "").strip()
        self.base_url = "https://api.fireworks.ai/inference/v1"
        self.default_model = "accounts/fireworks/models/kimi-k2p5"
        self.timeout = 45.0
        self.max_retries = 3

    @property
    def enabled(self) -> bool:
        return bool(self.api_key)

    def configure(self, api_key: str) -> None:
        self.api_key = (api_key or "").strip()

    async def _post_json(
        self,
        payload: Dict[str, Any],
        *,
        timeout: float,
        max_tokens: int,
        retries: int = 3,
    ) -> Dict[str, Any]:
        if not self.api_key:
            return {"success": False, "error": "Fireworks API key not configured"}

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        last_error = ""
        for attempt in range(retries + 1):
            try:
                async with httpx.AsyncClient(timeout=timeout, trust_env=False) as client:
                    response = await client.post(
                        f"{self.base_url}/chat/completions",
                        headers=headers,
                        json=payload,
                    )

                if response.status_code == 200:
                    result = response.json()
                    return {
                        "success": True,
                        "content": result["choices"][0]["message"]["content"],
                        "model": payload.get("model", self.default_model),
                        "usage": result.get("usage", {}),
                    }

                last_error = f"Fireworks API error: {response.status_code} - {response.text[:500]}"
                logger.error(last_error)

                if response.status_code in {429, 500, 502, 503, 504} and attempt < retries:
                    await asyncio.sleep(1.0 * (attempt + 1))
                    continue
                break
            except httpx.TimeoutException:
                last_error = "Fireworks API request timeout"
                logger.error(last_error)
                if attempt < retries:
                    await asyncio.sleep(1.0 * (attempt + 1))
                    continue
                break
            except Exception as exc:
                last_error = str(exc)
                logger.exception("Fireworks API exception")
                if attempt < retries:
                    await asyncio.sleep(1.0 * (attempt + 1))
                    continue
                break

        return {"success": False, "error": last_error or "Fireworks API request failed"}

    async def generate(
        self,
        prompt: str,
        *,
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
        timeout: float = 45.0,
        retries: int = 2,
    ) -> Dict[str, Any]:
        payload = {
            "model": model or self.default_model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        return await self._post_json(payload, timeout=timeout, max_tokens=max_tokens, retries=retries)

    async def generate_json(
        self,
        prompt: str,
        *,
        model: Optional[str] = None,
        temperature: float = 0.3,
        max_tokens: int = 2048,
        timeout: float = 45.0,
        retries: int = 2,
    ) -> Dict[str, Any]:
        json_prompt = f"""{prompt}

IMPORTANT: Respond ONLY with valid JSON. No markdown formatting, no code blocks, no additional text. The JSON must be parseable by json.loads()."""
        result = await self.generate(
            json_prompt,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            timeout=timeout,
            retries=retries,
        )
        return result

    async def generate_with_image(
        self,
        prompt: str,
        image_data: str,
        *,
        mime_type: str = "image/jpeg",
        model: Optional[str] = None,
        temperature: float = 0.2,
        max_tokens: int = 2048,
        timeout: float = 60.0,
        retries: int = 2,
    ) -> Dict[str, Any]:
        payload = {
            "model": model or self.default_model,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:{mime_type};base64,{image_data}"},
                        },
                    ],
                }
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        return await self._post_json(payload, timeout=timeout, max_tokens=max_tokens, retries=retries)


fireworks_service = FireworksService()
