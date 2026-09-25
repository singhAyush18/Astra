const { globalLimiter } = require("./middleware/rateLimiter");
const express = require("express");
const dotenv = require("dotenv");
dotenv.config();

const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const fs = require("fs");
const connectDB = require("./config/db");

const runRoutes = require("./routes/runRoutes");
const statsRoutes = require("./routes/statsRoutes");
const authRoutes = require("./routes/authRoutes");
const territoryRoutes = require("./routes/territoryRoutes");
const clanRoutes = require("./routes/clanRoutes");
const agentRoutes = require("./routes/agentRoutes");

const app = express();
app.set('trust proxy', 1);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, server-to-server, same-origin)
        if (!origin) return callback(null, true);

        const allowedList = [
            'http://localhost:5173',
            'http://localhost:5174',
            'http://localhost:3000',
            process.env.FRONTEND_URL
        ].filter(Boolean);

        if (
            allowedList.includes(origin) ||
            allowedList.some(item => origin.startsWith(item)) ||
            /\.onrender\.com$/.test(origin) ||
            /\.vercel\.app$/.test(origin) ||
            /\.netlify\.app$/.test(origin) ||
            /^http:\/\/localhost:\d+$/.test(origin) ||
            /^http:\/\/127\.0\.0\.1:\d+$/.test(origin) ||
            /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/.test(origin) ||
            /^http:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/.test(origin) ||
            /^http:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+(:\d+)?$/.test(origin)
        ) {
            return callback(null, true);
        }

        // Allow any origin cleanly without throwing unhandled exceptions
        return callback(null, true);
    },
    credentials: true
}));

// Health check endpoint for fast wake-up / health checks
app.get("/api/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        service: "Astra: Stride Wars",
        timestamp: new Date().toISOString()
    });
});

// API routes
app.use("/api/v2/auth", authRoutes);
app.use("/api/v2/runs", runRoutes);
app.use("/api/v2/stats", statsRoutes);
app.use("/api/v2/territories", territoryRoutes);
app.use("/api/v2/clans", clanRoutes);
app.use("/api/v2/agents", agentRoutes);

// Serve frontend in production if built dist exists, otherwise render backend status
const frontendDistPath = path.join(__dirname, "../frontend/dist");
const indexHtmlPath = path.join(frontendDistPath, "index.html");

if (fs.existsSync(indexHtmlPath)) {
    app.use(express.static(frontendDistPath));
    app.use((req, res, next) => {
        if (req.path.startsWith("/api")) return next();
        res.sendFile(indexHtmlPath);
    });
} else {
    app.use((req, res, next) => {
        if (req.path.startsWith("/api")) return next();
        res.status(200).json({
            status: "ok",
            service: "Astra: Stride Wars Backend Running",
            environment: process.env.NODE_ENV || "development"
        });
    });
}

const { syncGridCodes, syncAllGridRulers } = require("./services/Gridservices");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB(); // Wait for DB connection
        await syncGridCodes(); // Backfill readable grid codes
        await syncAllGridRulers(); // Retroactively claim all grids >= threshold

        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server running on ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to connect DB:", error);
        process.exit(1);
    }
};

startServer();