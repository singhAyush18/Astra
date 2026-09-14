const { verifyToken } = require("../services/tokenservice");
const User = require("../models/User");

const auth = async (req, res, next) => {
    const token = req.cookies?.token;

    try {
        if (!token) {
            return res.status(401).json({
                message: "No token provided"
            });
        }

        const decoded = verifyToken(token);
        req.user = decoded;

        // Verify account is not permanently banned
        if (decoded?.id) {
            const userDoc = await User.findById(decoded.id).select("isBanned banReason");
            if (userDoc?.isBanned) {
                res.clearCookie("token");
                return res.status(403).json({
                    success: false,
                    isBanned: true,
                    message: userDoc.banReason || "Your account has been permanently banned from the realm for Anti-Cheat violations."
                });
            }
        }

        next();
    } catch (error) {
        return res.status(401).json({
            message: "Invalid token",
        });
    }
};

module.exports = auth;
