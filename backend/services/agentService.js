/**
 * Agent Service
 * Handles communication between the Express backend and the Python AI Agent Microservice,
 * with seamless in-process Groq fallback for high reliability.
 */

const Groq = require("groq-sdk");

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "https://astra-ai-service.onrender.com";

/**
 * Direct Groq LLM invocation (fallback if AI Microservice is cold-starting / offline)
 */
const generateDirectGroqDebrief = async (payload) => {
    if (!process.env.GROQ_API_KEY) return null;
    try {
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const distance_km = (payload.distance_meters / 1000).toFixed(2);
        const minutes = Math.floor(payload.duration_seconds / 60);
        const seconds = payload.duration_seconds % 60;

        const systemPrompt = `You are an Elite Running and Athletic Performance Coach.
Your goal is to review the athlete's completed run telemetry, provide constructive feedback on pacing and stamina, give recovery advice, and suggest their next workout target.

Tone: Professional, encouraging, data-driven, and focused on athletic progression and injury prevention.
Output format: You MUST return ONLY valid JSON matching this exact schema:
{
  "headline": "Short summary title of the workout",
  "performance_rating": "Grade for the workout: S, A, B, C, or D",
  "pacing_analysis": "2-3 sentences analyzing pace, effort, and stamina",
  "recovery_advice": "Actionable recovery recommendation (hydration, rest, stretching)",
  "next_workout_target": "Suggested goal or workout for their next run"
}`;

        const userPrompt = `Workout Data for Athlete:
- Name: ${payload.username}
- Total Distance: ${distance_km} km
- Total Duration: ${minutes} mins ${seconds} secs
- Average Pace: ${payload.pace}
- Current Running Streak: ${payload.current_streak} consecutive days`;

        const modelName = process.env.GROQ_MODEL || "qwen/qwen3.8-27b";
        const completion = await groq.chat.completions.create({
            model: modelName,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
            response_format: { type: "json_object" },
            temperature: 0.7,
            max_tokens: 500,
        });

        const raw = completion.choices[0]?.message?.content;
        if (!raw) return null;
        const data = JSON.parse(raw);
        return {
            headline: data.headline || "Workout Completed",
            performanceRating: data.performance_rating || "A",
            pacingAnalysis: data.pacing_analysis || "Consistent effort sustained throughout the workout.",
            recoveryAdvice: data.recovery_advice || "Hydrate and allow proper rest before your next session.",
            nextWorkoutTarget: data.next_workout_target || "Maintain steady consistency on your next run.",
            generatedAt: new Date(),
        };
    } catch (err) {
        console.warn("[AgentService] Direct Groq fallback error:", err.message);
        return null;
    }
};

/**
 * Request a Tactical Coach debrief from the Python AI Service.
 * 
 * @param {Object} telemetry
 * @param {string} telemetry.username
 * @param {number} telemetry.distance_meters
 * @param {number} telemetry.duration_seconds
 * @param {string} telemetry.pace
 * @param {number} telemetry.current_streak
 * @returns {Promise<Object>} Structured Coach debrief or fallback
 */
const generateCoachDebrief = async ({ username, distance_meters, duration_seconds, pace, current_streak }) => {
    const payload = {
        username: username || "Athlete",
        distance_meters: Math.round(Number(distance_meters) || 0),
        duration_seconds: Math.round(Number(duration_seconds) || 0),
        pace: pace || "0:00 min/km",
        current_streak: Number(current_streak) || 0,
    };

    // If distance is under 10 meters, do not invoke LLMs; return motivation prompt
    if (payload.distance_meters < 10) {
        return {
            headline: "Distance Too Short",
            performanceRating: "D",
            pacingAnalysis: "You logged less than 10 meters before halting. You should push harder and log a meaningful distance before tactical telemetry can be evaluated!",
            recoveryAdvice: "Lace up your boots and get back out there. Every conquest requires sustained movement.",
            nextWorkoutTarget: "Try harder! Complete at least 500 meters or 5 minutes of continuous running to unlock full tactical analysis.",
            generatedAt: new Date(),
        };
    }

    try {
        const controller = new AbortController();
        // 40-second timeout to allow for Render cold starts if sleeping
        const timeoutId = setTimeout(() => controller.abort(), 40000);

        const response = await fetch(`${AI_SERVICE_URL}/api/agents/coach-debrief`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text();
            console.warn(`[AgentService] AI microservice returned status ${response.status}: ${errorText}`);
            const directGroqResult = await generateDirectGroqDebrief(payload);
            return directGroqResult || getFallbackDebrief(payload);
        }

        const data = await response.json();
        return {
            headline: data.headline || "Mission Completed",
            performanceRating: data.performance_rating || "A",
            pacingAnalysis: data.pacing_analysis || "Consistent effort sustained throughout the sector.",
            recoveryAdvice: data.recovery_advice || "Hydrate immediately and perform gentle lower-body stretches.",
            nextWorkoutTarget: data.next_workout_target || "Maintain steady tempo on your next training session.",
            generatedAt: new Date(),
        };
    } catch (error) {
        console.warn(`[AgentService] Could not reach AI service at ${AI_SERVICE_URL} (${error.message}). Attempting direct Groq fallback...`);
        const directGroqResult = await generateDirectGroqDebrief(payload);
        return directGroqResult || getFallbackDebrief(payload);
    }
};

/**
 * Static fallback debrief only when both AI service and Groq API are unreachable
 */
const getFallbackDebrief = ({ distance_meters = 0, pace = "" }) => {
    const distKm = (distance_meters / 1000).toFixed(2);
    return {
        headline: `Solid ${distKm}km Tactical Recon`,
        performanceRating: distance_meters >= 5000 ? "S" : distance_meters >= 3000 ? "A" : "B",
        pacingAnalysis: `You completed ${distKm} km at an average pace of ${pace}. Good pacing consistency maintained.`,
        recoveryAdvice: "Hydrate with electrolytes, stretch your calves and hamstrings, and allow adequate rest before your next run.",
        nextWorkoutTarget: "Aim to expand your territorial coverage and increase distance by 10% on your next outing.",
        generatedAt: new Date(),
    };
};

module.exports = {
    generateCoachDebrief,
    AI_SERVICE_URL,
};
