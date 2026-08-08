const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

// Read keys from environment variables (preferred) or fallback to files
const privateKey = process.env.PRIVATE_KEY
    ? process.env.PRIVATE_KEY.replace(/\\n/g, "\n")
    : fs.readFileSync(path.join(__dirname, "../keys/private.pem"), "utf8");

const publicKey = process.env.PUBLIC_KEY
    ? process.env.PUBLIC_KEY.replace(/\\n/g, "\n")
    : fs.readFileSync(path.join(__dirname, "../keys/public.pem"), "utf8");

function generateToken(user){
    return jwt.sign({
        id : user.id,
        username : user.username,
        email : user.email
    },
    privateKey,
    {
        algorithm : "RS256",
        expiresIn : "30d"
    }
);
}
function verifyToken(token){
    return jwt.verify(
        token,
        publicKey,
        {
            algorithms : ["RS256"]
        }
    );
}

module.exports = {
    generateToken,
    verifyToken
}
