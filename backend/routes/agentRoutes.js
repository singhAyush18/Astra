const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { generateCoachDebrief, AI_SERVICE_URL } = require("../services/agentService");

/**
 * Health check / status for AI Agent service bridge
 */
router.get("/status", async (req, res) => {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const aiRes = await fetch(`${AI_SERVICE_URL}/`, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (aiRes.ok) {
            const data = await aiRes.json();
            return res.status(200).json({
                success: true,
                serviceUrl: AI_SERVICE_URL,
                agentService: data,
            });
        }
        return res.status(502).json({
            success: false,
            message: `AI service returned status ${aiRes.status}`,
            serviceUrl: AI_SERVICE_URL,
        });
    } catch (err) {
        return res.status(503).json({
            success: false,
            message: "AI service unreachable",
            serviceUrl: AI_SERVICE_URL,
            error: err.message,
        });
    }
});

/**
 * Direct Coach Debrief endpoint for custom telemetry / testing
 */
router.post("/coach-debrief", auth, async (req, res) => {
    try {
        const { distance_meters, duration_seconds, pace, current_streak } = req.body;
        const username = req.user?.username || "Athlete";

        const debrief = await generateCoachDebrief({
            username,
            distance_meters,
            duration_seconds,
            pace,
            current_streak,
        });

        res.status(200).json({
            success: true,
            data: debrief,
        });
    } catch (err) {
        console.error("Agent route error:", err);
        res.status(500).json({
            success: false,
            message: "Error processing agent request",
        });
    }
});

module.exports = router;
