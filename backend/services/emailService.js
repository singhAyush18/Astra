const nodemailer = require('nodemailer');
const crypto = require('crypto');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function sendVerificationEmail(email, token) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    await transporter.sendMail({
        from: `"Runnn" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Verify your Runnn account',
        html: `
            <h2>Welcome to Runnn! 🏃</h2>
            <p>Click the link below to verify your email:</p>
            <a href="${verificationUrl}">Verify Email</a>
            <p>This link expires in 24 hours.</p>
        `
    });
}

function generateVerificationToken() {
    return crypto.randomBytes(32).toString('hex');
}

module.exports = { sendVerificationEmail, generateVerificationToken };
