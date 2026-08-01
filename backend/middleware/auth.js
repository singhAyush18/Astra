const {verifyToken} = require ("../services/tokenservice");

const auth = (req,res,next) => {
    const authHeader = req.headers.authorization;
    try {
        if(!authHeader){
            return res.status(401).json({
                message : "No token provided"
            });
        }
        const token = authHeader.split(" ")[1];
        const decoded = verifyToken(token);
        req.user = decoded;
        next();
    }catch(error){
        return res.status(401).json({
            message : "Invalid token",
            
        });
    }
}
module.exports = auth;