from fastapi import APIRouter, HTTPException, status
from app.models.schemas import WastageReportRequest, WastageReportResponse
from app.services.groq_service import groq_service
from app.services.prompt_engine import prompt_engine
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ai/wastage-report", tags=["Waste Prediction"])


@router.post("", response_model=WastageReportResponse)
async def wastage_report(request: WastageReportRequest):
    """Compute waste totals and generate AI analysis + reduction recommendations."""
    try:
        expired = [i.model_dump() for i in request.expired_items]
        soon = [i.model_dump() for i in request.expiring_soon]

        total_waste_kg = round(sum(float(i.get("quantity", 0) or 0) for i in expired), 2)
        estimated_loss = round(sum(float(i.get("value_pkr", 0) or 0) for i in expired), 2)

        # Computed category tally (AI may refine below)
        cat: dict = {}
        for i in expired:
            c = i.get("category") or "other"
            cat[c] = cat.get(c, 0) + 1

        recommendations = []
        try:
            res = await groq_service.generate_json(
                prompt_engine.build_wastage_report_prompt(
                    expired, soon, total_waste_kg, estimated_loss
                ),
                max_tokens=2048,
            )
            if res["success"]:
                d = res["content"]
                recommendations = d.get("recommendations", [])
                if d.get("waste_by_category"):
                    cat = d["waste_by_category"]
        except Exception as e:
            logger.warning(f"Wastage AI analysis failed: {e}")

        if not recommendations:
            recommendations = [
                "Plan meals around items nearing expiry.",
                "Buy perishables in smaller, more frequent quantities.",
                "Freeze surplus before it expires.",
            ]

        weekly_trend = [{"week": "This week", "waste_kg": total_waste_kg, "loss_pkr": estimated_loss}]

        return WastageReportResponse(
            success=True,
            total_waste_kg=total_waste_kg,
            estimated_loss_pkr=estimated_loss,
            waste_by_category=cat,
            recommendations=recommendations,
            weekly_trend=weekly_trend,
        )

    except Exception as e:
        logger.exception(f"Error in wastage-report: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
