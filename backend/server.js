require('dns').setDefaultResultOrder('ipv4first');
const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const connectDB = require("./config/db");

const runRoutes = require("./routes/runRoutes");
const statsRoutes = require("./routes/statsRoutes");
const authRoutes = require("./routes/authRoutes");
const territoryRoutes = require("./routes/territoryRoutes");
const clanRoutes = require("./routes/clanRoutes");

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:5174',
        process.env.FRONTEND_URL
    ].filter(Boolean),
    credentials: true
}));

// API routes
app.use("/api/v2/auth", authRoutes);
app.use("/api/v2/runs", runRoutes);
app.use("/api/v2/stats", statsRoutes);
app.use("/api/v2/territories", territoryRoutes);
app.use("/api/v2/clans", clanRoutes);

// Serve frontend in production
if (process.env.NODE_ENV === "production") {
    // Serve static files from the Vite build output
    app.use(express.static(path.join(__dirname, "../frontend/dist")));

    // SPA catch-all: any non-API route returns index.html
    app.get("/{*path}", (req, res) => {
        res.sendFile(path.join(__dirname, "../frontend/dist", "index.html"));
    });
} else {
    // Health check for local dev
    app.get("/", (req, res) => {
        res.send("Runner's Arc Backend Running");
    });
}

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB(); // Wait for DB connection

        app.listen(PORT, () => {
            console.log(`Server running on ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to connect DB:", error);
        process.exit(1);
    }
};

startServer();