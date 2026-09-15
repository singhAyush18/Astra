const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { generateToken } = require("../services/tokenservice");
const { 
    sendVerificationEmail, 
    sendPasswordResetEmail, 
    generateVerificationToken,
    sendPasswordChangeOtp 
} = require("../services/emailService");
const { syncUserStreak } = require("./gamificationController");

// Validation helpers
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,128}$/;

const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validate email format
        if (!email || !emailRegex.test(email.trim())) {
            return res.status(400).json({
                success: false,
                message: "Invalid email format",
            });
        }

        // Validate username
        if (!username || !usernameRegex.test(username)) {
            return res.status(400).json({
                success: false,
                message:
                    "Username must be 3-20 characters (letters, numbers, underscores only)",
            });
        }

        // Validate password strength
        if (!password || !passwordRegex.test(password)) {
            return res.status(400).json({
                success: false,
                message:
                    "Password must be 8-128 chars with at least one uppercase, one lowercase, one number, and one special character (@$!%*?&)",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Check for existing user — differentiate email vs username
        const existingUser = await User.findOne({
            $or: [{ email: normalizedEmail }, { username }],
        });

        if (existingUser) {
            if (existingUser.email === normalizedEmail) {
                return res.status(409).json({
                    success: false,
                    message: "Email already registered",
                });
            }
            if (existingUser.username === username) {
                return res.status(409).json({
                    success: false,
                    message: "Username already taken",
                });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = generateVerificationToken();

        const user = await User.create({
            username,
            email: normalizedEmail,
            password: hashedPassword,
            verificationToken,
            verificationTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });

        await sendVerificationEmail(normalizedEmail, verificationToken);

        res.status(201).json({
            success: true,
            message: "Registration successful. Please check your email to verify your account.",
        });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({
            success: false,
            message: "Error during registration",
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate email format
        if (!email || !emailRegex.test(email.trim())) {
            return res.status(400).json({
                success: false,
                message: "Invalid email format",
            });
        }

        // Validate password is provided
        if (!password) {
            return res.status(400).json({
                success: false,
                message: "Password is required",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        if (user.isBanned) {
            return res.status(403).json({
                success: false,
                isBanned: true,
                message: user.banReason || "Your account has been permanently banned for Anti-Cheat violations.",
            });
        }

        // Check if account is temporarily locked due to failed login attempts
        if (user.lockUntil && user.lockUntil > new Date()) {
            const minutesLeft = Math.max(1, Math.ceil((user.lockUntil - new Date()) / (60 * 1000)));
            return res.status(429).json({
                success: false,
                isLocked: true,
                message: `Account temporarily locked due to too many failed attempts. Try again in ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}.`,
            });
        }

        if (!user.isVerified) {
            return res.status(403).json({
                success: false,
                message: "Please verify your email before logging in. Check your inbox for the verification link.",
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
            let errMsg = "Invalid email or password";

            if (user.failedLoginAttempts >= 5) {
                // Lock account for 15 minutes
                user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
                user.failedLoginAttempts = 0;
                errMsg = "Too many failed login attempts. Your account has been temporarily locked for 15 minutes.";
            } else {
                const remaining = 5 - user.failedLoginAttempts;
                errMsg = `Invalid email or password. ${remaining} attempt${remaining > 1 ? 's' : ''} remaining before temporary account lock.`;
            }

            await user.save();

            return res.status(400).json({
                success: false,
                message: errMsg,
            });
        }

        // Reset failed login attempts and lock on successful login
        if (user.failedLoginAttempts > 0 || user.lockUntil) {
            user.failedLoginAttempts = 0;
            user.lockUntil = null;
            await user.save();
        }

        const token = generateToken(user);

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000
        });

        await syncUserStreak(user);

        res.status(200).json({
            success: true,
            message: "Login successful",
            user: {
                id: user._id,
                _id: user._id,
                username: user.username,
                email: user.email,
                level: user.level,
                xp: user.xp,
                currentStreak: user.currentStreak,
                longestStreak: user.longestStreak,
                profilePicture: user.profilePicture,
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            success: false,
            message: "Error during login",
        });
    }
};

const logout = async (req, res) => {
    // JWT is stateless — the client must discard the token.
    // This endpoint exists so the frontend has a clean API call
    // to confirm logout and perform any future server-side cleanup
    // (e.g. token blacklisting, audit logging).
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    });
    res.status(200).json({
        success: true,
        message: "Logged out successfully",
    });
};

const verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: "Verification token is required",
            });
        }

        const user = await User.findOne({
            verificationToken: token,
            verificationTokenExpiry: { $gt: new Date() },
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired verification link",
            });
        }

        user.isVerified = true;
        user.verificationToken = null;
        user.verificationTokenExpiry = null;
        await user.save();

        res.status(200).json({
            success: true,
            message: "Email verified successfully. You can now log in.",
        });
    } catch (error) {
        console.error("Verification error:", error);
        res.status(500).json({
            success: false,
            message: "Error verifying email",
        });
    }
};

const resendVerification = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || !emailRegex.test(email.trim())) {
            return res.status(400).json({
                success: false,
                message: "Invalid email format",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            // Don't reveal whether the email exists
            return res.status(200).json({
                success: true,
                message: "If that email is registered, a new verification link has been sent.",
            });
        }

        if (user.isVerified) {
            return res.status(400).json({
                success: false,
                message: "Email is already verified",
            });
        }

        const verificationToken = generateVerificationToken();
        user.verificationToken = verificationToken;
        user.verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await user.save();

        await sendVerificationEmail(normalizedEmail, verificationToken);

        res.status(200).json({
            success: true,
            message: "If that email is registered, a new verification link has been sent.",
        });
    } catch (error) {
        console.error("Resend verification error:", error);
        res.status(500).json({
            success: false,
            message: "Error resending verification email",
        });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { username, profilePicture } = req.body;
        const userId = req.user.id; // From auth middleware

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Handle Username update
        if (username && username !== user.username) {
            if (!usernameRegex.test(username)) {
                return res.status(400).json({
                    success: false,
                    message: "Username must be 3-20 characters (letters, numbers, underscores only)",
                });
            }

            const existingUser = await User.findOne({ username });
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: "Username already taken",
                });
            }
            user.username = username;
        }

        // Handle Profile Picture update (including removal if passed as null/empty)
        if (profilePicture !== undefined) {
            user.profilePicture = profilePicture;
        }

        await user.save();
        await syncUserStreak(user);

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: {
                id: user._id,
                _id: user._id,
                username: user.username,
                email: user.email,
                level: user.level,
                xp: user.xp,
                currentStreak: user.currentStreak,
                longestStreak: user.longestStreak,
                profilePicture: user.profilePicture,
            },
        });

    } catch (error) {
        console.error("Update profile error:", error);
        res.status(500).json({
            success: false,
            message: "Error updating profile",
        });
    }
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || !emailRegex.test(email.trim())) {
            return res.status(400).json({
                success: false,
                message: "Invalid email format",
            });
        }

        const trimmedEmail = email.trim();
        const user = await User.findOne({ 
            email: { $regex: new RegExp(`^${trimmedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } 
        });

        if (!user) {
            return res.status(200).json({
                success: true,
                message: "If an account with that email exists, a password reset link has been sent.",
            });
        }

        const resetToken = generateVerificationToken();
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await user.save();

        await sendPasswordResetEmail(user.email, resetToken);

        res.status(200).json({
            success: true,
            message: "If an account with that email exists, a password reset link has been sent.",
        });
    } catch (error) {
        console.error("Forgot password error:", error);
        res.status(500).json({
            success: false,
            message: "Error processing password reset request",
        });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: "Reset token is required",
            });
        }

        if (!newPassword || !passwordRegex.test(newPassword)) {
            return res.status(400).json({
                success: false,
                message: "Password must be 8-128 chars with at least one uppercase, one lowercase, one number, and one special character (@$!%*?&)",
            });
        }

        const cleanToken = token.trim();
        const user = await User.findOne({
            resetPasswordToken: cleanToken,
            resetPasswordExpires: { $gt: new Date() },
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired password reset link",
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save();

        res.status(200).json({
            success: true,
            message: "Password reset successful! You can now log in with your new password.",
        });
    } catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({
            success: false,
            message: "Error resetting password",
        });
    }
};

const requestPasswordChangeOtp = async (req, res) => {
    try {
        const { currentPassword } = req.body;
        const userId = req.user.id;

        if (!currentPassword) {
            return res.status(400).json({
                success: false,
                message: "Current password is required to request a verification code",
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Incorrect current password",
            });
        }

        // Generate a cryptographically secure 6-digit numeric OTP code
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        user.passwordChangeOtp = otpCode;
        user.passwordChangeOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        await user.save();

        await sendPasswordChangeOtp(user.email, otpCode);

        res.status(200).json({
            success: true,
            message: `Verification code sent to ${user.email.replace(/(.{2})(.*)(?=@)/, '$1***')}`,
        });
    } catch (error) {
        console.error("Request password change OTP error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to send verification code. Please try again.",
        });
    }
};

const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, otpCode } = req.body;
        const userId = req.user.id;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Both current password and new password are required",
            });
        }

        if (!otpCode || !otpCode.trim()) {
            return res.status(400).json({
                success: false,
                message: "Email verification code is required",
            });
        }

        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({
                success: false,
                message: "Password must be 8-128 chars with at least one uppercase, one lowercase, one number, and one special character (@$!%*?&)",
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Incorrect current password",
            });
        }

        // Verify OTP code and expiry
        if (
            !user.passwordChangeOtp ||
            !user.passwordChangeOtpExpires ||
            user.passwordChangeOtpExpires < new Date()
        ) {
            return res.status(400).json({
                success: false,
                message: "Verification code has expired. Please request a new code.",
            });
        }

        if (user.passwordChangeOtp !== otpCode.trim()) {
            return res.status(400).json({
                success: false,
                message: "Invalid verification code. Please check your email.",
            });
        }

        const isSame = await bcrypt.compare(newPassword, user.password);
        if (isSame) {
            return res.status(400).json({
                success: false,
                message: "New password must be different from current password",
            });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        user.passwordChangeOtp = null;
        user.passwordChangeOtpExpires = null;
        await user.save();

        res.status(200).json({
            success: true,
            message: "Password changed successfully!",
        });
    } catch (error) {
        console.error("Change password error:", error);
        res.status(500).json({
            success: false,
            message: "Error changing password",
        });
    }
};

module.exports = { 
    register, 
    login, 
    logout, 
    verifyEmail, 
    resendVerification, 
    updateProfile,
    forgotPassword,
    resetPassword,
    requestPasswordChangeOtp,
    changePassword,
};