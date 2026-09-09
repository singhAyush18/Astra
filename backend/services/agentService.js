/**
 * Agent Service
 * Handles communication between the Express backend and the Python AI Agent Microservice.
 */

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";

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

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000); // 12-second timeout

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
            return getFallbackDebrief(payload);
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
        console.warn(`[AgentService] Could not reach AI service at ${AI_SERVICE_URL}:`, error.message);
        return getFallbackDebrief(payload);
    }
};

/**
 * Offline / Fallback debrief when AI service is warming up or unreachable
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
