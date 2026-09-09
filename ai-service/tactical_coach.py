import os
import json
from typing import Optional
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from groq import AsyncGroq

# 1. Load environment variables
load_dotenv()

# 2. Initialize Async Groq client
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
groq_client = AsyncGroq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None


# ==========================================
# 3. INPUT SCHEMA
# ==========================================
class RunnerTelemetryInput(BaseModel):
    """Telemetry data collected from the runner's completed run"""
    username: str = Field(default="Athlete", description="Name of the runner")
    distance_meters: float = Field(..., description="Total distance in meters (e.g. 5200 for 5.2km)")
    duration_seconds: int = Field(..., description="Total duration of the run in seconds")
    pace: Optional[str] = Field(default="N/A", description="Average pace per kilometer (e.g. '5:20 min/km')")
    current_streak: int = Field(default=0, description="Consecutive running streak in days")


# ==========================================
# 4. OUTPUT SCHEMA
# ==========================================
class CoachDebriefOutput(BaseModel):
    """Structured fitness feedback produced by the Running Coach Agent."""
    headline: str = Field(..., description="Short summary title of the workout")
    performance_rating: str = Field(..., description="Grade for the workout: S, A, B, C, or D")
    pacing_analysis: str = Field(..., description="2-3 sentences analyzing pace, effort, and stamina")
    recovery_advice: str = Field(..., description="Actionable recovery recommendation (hydration, rest, stretching)")
    next_workout_target: str = Field(..., description="Suggested goal or workout for their next run")


# ==========================================
# 5. AGENT REASONING FUNCTION
# ==========================================
async def run_running_coach(telemetry: RunnerTelemetryInput) -> CoachDebriefOutput:
    """Executes the AI Running Coach against the athlete's workout telemetry."""
    if not groq_client:
        raise ValueError("GROQ_API_KEY is not configured in ai-service/.env")

    distance_km = round(telemetry.distance_meters / 1000, 2)
    minutes = telemetry.duration_seconds // 60
    seconds = telemetry.duration_seconds % 60

    system_prompt = f"""
You are an Elite Running and Athletic Performance Coach.
Your goal is to review the athlete's completed run telemetry, provide constructive feedback on pacing and stamina, give recovery advice, and suggest their next workout target.

Tone: Professional, encouraging, data-driven, and focused on athletic progression and injury prevention.
Output format: You MUST return ONLY valid JSON matching this exact schema:
{json.dumps(CoachDebriefOutput.model_json_schema(), indent=2)}
"""

    user_prompt = f"""
Workout Data for Athlete:
- Name: {telemetry.username}
- Total Distance: {distance_km} km
- Total Duration: {minutes} mins {seconds} secs
- Average Pace: {telemetry.pace}
- Current Running Streak: {telemetry.current_streak} consecutive days
"""

    model_name = os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b")
    completion = await groq_client.chat.completions.create(
        model=model_name,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        response_format={"type": "json_object"},
        temperature=0.7,
        max_tokens=500
    )

    raw_json = completion.choices[0].message.content or "{}"
    return CoachDebriefOutput.model_validate_json(raw_json)
