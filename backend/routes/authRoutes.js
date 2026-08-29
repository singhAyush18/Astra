const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

const {register, login, logout, verifyEmail, resendVerification, updateProfile} = require("../controllers/authController");
router.post("/register", register);
router.post("/login", login);
router.post("/logout", auth, logout);
router.get("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);
router.put("/profile", auth, updateProfile);
module.exports = router;