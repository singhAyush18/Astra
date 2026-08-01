const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

const connectDB = require("./config/db");

const runRoutes = require("./routes/runRoutes");
const statsRoutes = require("./routes/statsRoutes");
const authRoutes = require("./routes/authRoutes");
const territoryRoutes = require ("./routes/territoryRoutes");
const clanRoutes = require("./routes/clanRoutes");
dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
    res.send("Runner's Arc Backend Running"); 
});

app.use("/api/auth", authRoutes);
app.use("/api/runs", runRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/territories", territoryRoutes);
app.use("/api/clans", clanRoutes);

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