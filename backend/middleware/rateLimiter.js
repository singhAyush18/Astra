const rateLimit = require("express-rate-limit");



/**
 * Standard helper to format rate limit response messages
 */
const createLimiter = ({ windowMs, max, message }) => {
    return rateLimit({
        windowMs,
        max,
        standardHeaders: true, // Return standard `RateLimit-*` headers
        legacyHeaders: false,   // Disable the `X-RateLimit-*` headers
        message: {
            success: false,
            message: message || "Too many requests. Please slow down and try again later.",
        },
        handler: (req, res, next, options) => {
            res.status(options.statusCode).json(options.message);
        }
    });
};

// 1. Global API Limiter (Protects server from general DDoS/flooding)
// 300 requests per 15 minutes per IP
const globalLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: "Too many requests from this IP. Please try again after 15 minutes."
});

// 2. Strict Auth Limiter (Protects login, register, password reset from brute force)
// 10 attempts per 15 minutes per IP
const authLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: "Too many authentication attempts. Please try again after 15 minutes."
});

// 3. AI / Heavy Service Limiter (Protects LLM API quota from spam)
// 20 requests per 15 minutes per IP
const aiLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: "AI Tactical Coach quota exceeded. Please wait a few minutes before requesting more debriefs."
});

// 4. Run Creation Limiter (Prevents spamming completed runs)
// 30 run saves per hour per IP
const runLimiter = createLimiter({
    windowMs: 60 * 60 * 1000,
    max: 30,
    message: "Too many runs submitted. Please try again in an hour."
});

module.exports = {
    globalLimiter,
    authLimiter,
    aiLimiter,
    runLimiter,
};

