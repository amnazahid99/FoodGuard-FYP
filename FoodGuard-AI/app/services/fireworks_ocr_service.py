from typing import Any, Dict, Optional

from app.services.fireworks_service import fireworks_service


class FireworksOCRService:
    async def generate_with_image(
        self,
        prompt: str,
        image_b64: str,
        mime_type: str = "image/jpeg",
    ) -> Dict[str, Any]:
        return await fireworks_service.generate_with_image(
            prompt,
            image_b64,
            mime_type=mime_type,
            temperature=0.2,
            max_tokens=2048,
            timeout=90.0,
            retries=3,
        )


fireworks_ocr_service = FireworksOCRService()
