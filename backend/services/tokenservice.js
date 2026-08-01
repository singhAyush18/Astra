const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

const privateKey = fs.readFileSync(
    path.join(__dirname, "../keys/private.pem"),
    "utf8"
);
const publicKey = fs.readFileSync(
    path.join(__dirname, "../keys/public.pem"),
    "utf8"
);

function generateToken(user){
    return jwt.sign({
        id : user.id,
        username : user.username,
        email : user.email
    },
    privateKey,
    {
        algorithm : "RS256",
        expiresIn : "1d"
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