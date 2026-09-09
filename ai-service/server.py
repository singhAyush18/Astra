import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Import your Running Coach Agent and models
from tactical_coach import (
    run_running_coach,
    RunnerTelemetryInput,
    CoachDebriefOutput
)

# 1. Initialize FastAPI App
app = FastAPI(
    title="Astra AI Running Coach Service",
    description="Microservice providing AI-driven athletic debriefs powered by Groq LLaMA 3.3",
    version="1.0.0"
)

# 2. Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Health Check Route
@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "Astra AI Running Coach",
        "active_agent": "Tactical Running Coach"
    }

# 4. The Agent Endpoint
@app.post("/api/agents/coach-debrief", response_model=CoachDebriefOutput)
async def get_coach_debrief(telemetry: RunnerTelemetryInput):
    """
    Receives workout telemetry and returns structured AI coaching feedback.
    """
    try:
        debrief = await run_running_coach(telemetry)
        return debrief
    except Exception as error:
        print(f"Error executing Running Coach Agent: {error}")
        raise HTTPException(status_code=500, detail=str(error))


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    print(f"Starting Astra AI Agent Server on port {port}...")
    uvicorn.run("server:app", host="0.0.0.0", port=port, reload=True)
