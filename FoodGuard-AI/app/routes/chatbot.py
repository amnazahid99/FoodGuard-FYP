from fastapi import APIRouter, HTTPException, status
from app.models.schemas import (
    ChatbotRequest,
    ChatbotResponse
)
from app.services.groq_service import groq_service
from app.services.gemini_service import gemini_service
from app.services.prompt_engine import prompt_engine
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ai/chatbot", tags=["AI Chatbot"])

# System prompt for FoodGuard chatbot
SYSTEM_PROMPT = """You are FoodGuard's AI Assistant, a helpful and knowledgeable assistant focused on food, nutrition, and health.

Your expertise includes:
- Food storage and shelf life
- Nutritional information and healthy eating
- Meal planning and recipes
- Managing food inventory
- General health and wellness tips

Be concise, friendly, and practical. Provide actionable advice.
When appropriate, suggest recipes or meal ideas based on available ingredients."""


@router.post("", response_model=ChatbotResponse)
async def chat_with_foodguard(request: ChatbotRequest):
    """
    Conversational AI chatbot for food and nutrition queries.
    Maintains conversation history for contextual responses.
    """
    try:
        # Build conversation context
        conversation_history = []
        for msg in request.messages:
            conversation_history.append({
                "role": msg.role,
                "content": msg.content
            })

        # Add inventory context if provided
        inventory_context = ""
        if request.current_inventory:
            items = [f"{item.get('name', 'Unknown')} (expires: {item.get('expiry_date', 'unknown')})"
                    for item in request.current_inventory[:10]]
            inventory_context = f"\nUser's current inventory: {', '.join(items)}"

        # Add user context if provided
        user_context_str = ""
        if request.user_context:
            prefs = []
            if request.user_context.get("dietary_preference"):
                prefs.append(f"Dietary: {request.user_context['dietary_preference']}")
            if request.user_context.get("health_condition"):
                prefs.append(f"Health: {request.user_context['health_condition']}")
            if prefs:
                user_context_str = "\n" + ", ".join(prefs)

        # Build the chat prompt
        prompt = prompt_engine.build_chatbot_prompt(
            system_prompt=SYSTEM_PROMPT,
            conversation_history=conversation_history,
            inventory_context=inventory_context,
            user_context=user_context_str
        )

        # Generate response using Groq for speed
        result = await groq_service.generate(prompt)

        if not result["success"]:
            # Try Gemini as fallback
            logger.warning("Groq failed, trying Gemini fallback")
            gemini_result = await gemini_service.generate(prompt)

            if not gemini_result["success"]:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=f"AI service error: {gemini_result.get('error')}"
                )

            response_text = gemini_result.get("text", "I apologize, but I couldn't generate a response at this time.")
            used_fallback = True
        else:
            response_text = result.get("text", "I apologize, but I couldn't generate a response at this time.")
            used_fallback = False

        # Generate contextual suggestions
        suggestions = generate_suggestions(response_text, request.messages)

        return ChatbotResponse(
            success=True,
            response=response_text,
            suggestions=suggestions
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error in chatbot: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


def generate_suggestions(response: str, messages: list) -> list:
    """Generate contextual suggestions based on the response."""
    suggestions = []

    response_lower = response.lower()

    if "recipe" in response_lower or "cook" in response_lower:
        suggestions.append("Get meal recommendations")
        suggestions.append("View my inventory")

    if "nutrition" in response_lower or "calories" in response_lower:
        suggestions.append("Analyze nutrition")

    if "expir" in response_lower or "shelf" in response_lower:
        suggestions.append("Check expiry insights")

    if "health" in response_lower or "weight" in response_lower:
        suggestions.append("Calculate my BMI")

    # Always offer these
    suggestions.append("Start a new conversation")

    return suggestions[:4]  # Limit to 4 suggestions