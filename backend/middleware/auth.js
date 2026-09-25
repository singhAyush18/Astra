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

        // Verify account status and single-session validity
        if (decoded?.id) {
            const userDoc = await User.findById(decoded.id).select("isBanned banReason sessionId");
            
            if (!userDoc) {
                res.clearCookie("token", {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    sameSite: "lax"
                });
                return res.status(401).json({
                    success: false,
                    message: "User account no longer exists."
                });
            }

            if (userDoc.isBanned) {
                res.clearCookie("token", {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    sameSite: "lax"
                });
                return res.status(403).json({
                    success: false,
                    isBanned: true,
                    message: userDoc.banReason || "Your account has been permanently banned from the realm for Anti-Cheat violations."
                });
            }

            // Enforce single-device session:
            // If user has a current sessionId set in DB and the token sessionId doesn't match,
            // it means the user logged in on another device.
            if (userDoc.sessionId && (!decoded.sessionId || userDoc.sessionId !== decoded.sessionId)) {
                res.clearCookie("token", {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    sameSite: "lax"
                });
                return res.status(401).json({
                    success: false,
                    sessionExpired: true,
                    message: "You have been logged out because this account was logged into from another device."
                });
            }
        }

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired session. Please log in again.",
        });
    }
};

module.exports = auth;
