const { verifyToken } = require("../services/tokenservice");

const auth = (req, res, next) => {
    const token = req.cookies?.token;

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
