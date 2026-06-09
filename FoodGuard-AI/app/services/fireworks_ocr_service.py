import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()


class FireworksOCRService:
    def __init__(self):
        # Guard construction: the OpenAI SDK raises if api_key is missing, which
        # would crash the whole service at import. Stay None until configured.
        self.api_key = os.getenv("FIREWORKS_API_KEY")
        self.client = (
            OpenAI(api_key=self.api_key, base_url="https://api.fireworks.ai/inference/v1")
            if self.api_key
            else None
        )

    async def generate_with_image(self, prompt: str, image_b64: str, mime_type: str = "image/jpeg"):
        if not self.client:
            return {"success": False, "error": "FIREWORKS_API_KEY not configured"}
        try:
            response = self.client.chat.completions.create(
                model="accounts/fireworks/models/kimi-k2p5",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": prompt,
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:{mime_type};base64,{image_b64}"
                                },
                            },
                        ],
                    }
                ],
                temperature=0,
            )

            text = response.choices[0].message.content.strip()

            return {
                "success": True,
                "text": text,
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e),
            }


fireworks_ocr_service = FireworksOCRService()