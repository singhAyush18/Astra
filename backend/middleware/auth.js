const { verifyToken } = require("../services/tokenservice");

const auth = (req, res, next) => {
    // Check cookie first, fallback to Authorization header (for cross-origin deployments)
    const token = req.cookies?.token || 
        (req.headers.authorization?.startsWith('Bearer ') 
            ? req.headers.authorization.split(' ')[1] 
            : null);

    try {
        if (!token) {
            return res.status(401).json({
                message: "No token provided"
            });
        }

        const decoded = verifyToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            message: "Invalid token",
        });
    }
}

module.exports = auth;
