"""
Astra Tactical Running Coach Agent
Microservice agent responsible for analyzing athlete workout telemetry,
incorporating historical training context, and generating structured
athletic debriefs and pacing insights using Groq LLMs.
"""

import os
import re
import json
import logging
from typing import Optional, List, Dict, Any
import httpx
from dotenv import load_dotenv
from pydantic import BaseModel, Field, ValidationError
from groq import AsyncGroq

# 1. Load environment variables
load_dotenv()

# Set up module logger
logger = logging.getLogger("tactical_coach")
if not logger.handlers:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")

# Astra API configuration for cross-service context
ASTRA_API_BASE = os.getenv("ASTRA_API_BASE", "https://astra-backend-6cyt.onrender.com")


# =====================================================================
# 2. CLIENT MANAGEMENT
# =====================================================================
_groq_client: Optional[AsyncGroq] = None


def get_groq_client(api_key: Optional[str] = None) -> AsyncGroq:
    """
    Retrieves or lazily initializes the AsyncGroq client.
    Raises ValueError if GROQ_API_KEY is not configured.
    """
    global _groq_client
    resolved_key = api_key or os.getenv("GROQ_API_KEY")
    if not resolved_key:
        raise ValueError("GROQ_API_KEY is not configured in the environment or ai-service/.env")

    if _groq_client is None or getattr(_groq_client, "api_key", None) != resolved_key:
        _groq_client = AsyncGroq(api_key=resolved_key)

    return _groq_client


# =====================================================================
# 3. INPUT & OUTPUT SCHEMAS
# =====================================================================
class RunnerTelemetryInput(BaseModel):
    """Telemetry data collected from the runner's completed run."""
    username: str = Field(default="Athlete", description="Name of the runner")
    distance_meters: float = Field(..., ge=0, description="Total distance in meters (e.g. 5200 for 5.2km)")
    duration_seconds: int = Field(..., ge=0, description="Total duration of the run in seconds")
    pace: Optional[str] = Field(default="N/A", description="Average pace per kilometer (e.g. '5:20 min/km')")
    current_streak: int = Field(default=0, ge=0, description="Consecutive running streak in days")


class CoachDebriefOutput(BaseModel):
    """Structured fitness feedback produced by the Tactical Running Coach Agent."""
    headline: str = Field(..., description="Short summary title of the workout")
    performance_rating: str = Field(..., description="Grade for the workout: S, A, B, C, or D")
    pacing_analysis: str = Field(..., description="2-3 sentences analyzing pace, effort, and stamina")
    recovery_advice: str = Field(..., description="Actionable recovery recommendation (hydration, rest, stretching)")
    next_workout_target: str = Field(..., description="Suggested goal or workout for their next run")


# =====================================================================
# 4. EXTERNAL DATA / TOOL HELPERS
# =====================================================================
async def get_past_runs(username: str, limit: int = 3) -> List[Dict[str, Any]]:
    """
    Fetches a user's recent runs from Astra's API.
    Gracefully returns an empty list if unavailable so the debrief is never blocked.
    """
    if not username or username.lower() == "athlete":
        return []

    url = os.getenv("ASTRA_RUNS_URL", f"{ASTRA_API_BASE}/api/v2/runs")
    params = {"username": username, "limit": limit}

    try:
        async with httpx.AsyncClient(timeout=1.0) as client:
            response = await client.get(url, params=params)
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    return data[:limit]
                if isinstance(data, dict):
                    runs = data.get("data", {}).get("runs") or data.get("runs") or []
                    return runs[:limit]
    except httpx.HTTPError as exc:
        logger.debug("Failed to fetch run history from %s: %s", url, exc)
    except Exception as exc:
        logger.debug("Unexpected error fetching past runs: %s", exc)

    return []


# =====================================================================
# 5. RUNNING COACH AGENT CLASS
# =====================================================================
class RunningCoachAgent:
    """
    Agent responsible for analyzing athlete workout telemetry, integrating
    historical training context, and producing structured coaching debriefs.
    """

    DEFAULT_MODEL = "qwen/qwen3.8-27b"

    def __init__(
        self,
        groq_client: Optional[AsyncGroq] = None,
        model_name: Optional[str] = None
    ):
        self._groq_client = groq_client
        self.model_name = model_name or os.getenv("GROQ_MODEL", self.DEFAULT_MODEL)

    @property
    def client(self) -> AsyncGroq:
        """Retrieves or lazily initializes the AsyncGroq client."""
        if self._groq_client is not None:
            return self._groq_client
        return get_groq_client()

    @staticmethod
    def _clean_json_response(raw_text: str) -> str:
        """Strips markdown code blocks, backticks, or outer text to isolate valid JSON."""
        text = raw_text.strip()
        code_block_match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
        if code_block_match:
            return code_block_match.group(1).strip()
        first_brace = text.find("{")
        last_brace = text.rfind("}")
        if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
            return text[first_brace : last_brace + 1].strip()
        return text

    def _generate_fallback_debrief(self, telemetry: RunnerTelemetryInput) -> CoachDebriefOutput:
        """Generates a deterministic debrief when AI generation parsing encounters issues."""
        distance_km = round(telemetry.distance_meters / 1000, 2)
        if distance_km >= 10:
            rating = "S"
            headline = "Endurance Mastery Achieved"
            target = "Focus on zone 2 aerobic maintenance on your next run."
        elif distance_km >= 5:
            rating = "A"
            headline = "Solid Strategic Effort"
            target = "Aim for negative splits or interval tempo pacing next session."
        elif distance_km >= 3:
            rating = "B"
            headline = "Mission Distance Secured"
            target = "Gradually increase total distance by 5-10% next session."
        else:
            rating = "C"
            headline = "Sprint Completed"
            target = "Extend total workout duration to build aerobic base."

        return CoachDebriefOutput(
            headline=headline,
            performance_rating=rating,
            pacing_analysis=(
                f"Completed {distance_km}km at an average pace of {telemetry.pace}. "
                "Maintained consistent forward momentum with solid exertion control."
            ),
            recovery_advice="Rehydrate with electrolyte fluids and execute 10 minutes of dynamic quad and calf stretching.",
            next_workout_target=target,
        )

    async def debrief(self, telemetry: RunnerTelemetryInput) -> CoachDebriefOutput:
        """Executes the AI Running Coach against the athlete's workout telemetry."""
        distance_km = round(telemetry.distance_meters / 1000, 2)
        minutes = telemetry.duration_seconds // 60
        seconds = telemetry.duration_seconds % 60

        # Optional tool call: pull past run history
        past_runs = await get_past_runs(telemetry.username)
        history_context = ""
        if past_runs:
            formatted_runs = []
            for r in past_runs:
                dist = r.get("distance_km") or (round(r.get("distance_meters", 0) / 1000, 2) if "distance_meters" in r else None)
                dur = r.get("duration_seconds")
                if dist is not None and dur is not None:
                    formatted_runs.append(f"- {dist}km in {dur}s")
            if formatted_runs:
                history_context = "Recent run history for this athlete:\n" + "\n".join(formatted_runs) + "\n\n"

        schema_json = json.dumps(CoachDebriefOutput.model_json_schema(), indent=2)

        system_prompt = (
            "You are an Elite Running and Athletic Performance Coach for the Astra platform.\n"
            "Your goal is to review the athlete's completed run telemetry, provide constructive feedback on pacing and stamina, "
            "give recovery advice, and suggest their next workout target.\n\n"
            f"{history_context}"
            "Tone: Professional, encouraging, data-driven, and focused on athletic progression and injury prevention.\n"
            "Output format: You MUST return ONLY valid JSON matching this exact JSON schema:\n"
            f"{schema_json}"
        )

        user_prompt = (
            "Workout Data for Athlete:\n"
            f"- Name: {telemetry.username}\n"
            f"- Total Distance: {distance_km} km ({telemetry.distance_meters} m)\n"
            f"- Total Duration: {minutes} mins {seconds} secs ({telemetry.duration_seconds} s)\n"
            f"- Average Pace: {telemetry.pace}\n"
            f"- Current Running Streak: {telemetry.current_streak} consecutive days"
        )

        try:
            client = self.client
            completion = await client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.7,
                max_tokens=900
            )

            raw_content = completion.choices[0].message.content or "{}"
            cleaned_json = self._clean_json_response(raw_content)
            return CoachDebriefOutput.model_validate_json(cleaned_json)

        except (ValidationError, json.JSONDecodeError) as parse_err:
            logger.warning("Agent JSON parsing failed (%s). Falling back to rule-based debrief.", parse_err)
            return self._generate_fallback_debrief(telemetry)
        except Exception as exc:
            logger.error("Agent execution failed: %s", exc)
            raise ValueError(f"Groq API call failed: {exc}") from exc


# =====================================================================
# 6. EXPORTED FUNCTION FOR COMPATIBILITY
# =====================================================================
_default_agent = RunningCoachAgent()


async def run_running_coach(telemetry: RunnerTelemetryInput) -> CoachDebriefOutput:
    """
    Executes the AI Running Coach against the athlete's workout telemetry.
    Exported for FastAPI server and backward compatibility.
    """
    return await _default_agent.debrief(telemetry)