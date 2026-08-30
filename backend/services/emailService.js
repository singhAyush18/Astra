const nodemailer = require('nodemailer');
const crypto = require('crypto');
const dns = require('dns').promises;

async function createTransporter() {
    let host = 'smtp.gmail.com';
    try {
        const lookupResult = await dns.lookup('smtp.gmail.com', { family: 4 });
        if (lookupResult && lookupResult.address) {
            host = lookupResult.address;
        }
    } catch (err) {
        console.warn('DNS lookup fallback to default hostname:', err.message);
    }

    return nodemailer.createTransport({
        host: host,
        port: 465,
        secure: true, // SSL
        tls: {
            servername: 'smtp.gmail.com' // Validates TLS certificate against Gmail hostname
        },
        auth: {
            user: process.env.EMAIL_USER?.trim(),
            pass: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s+/g, '') : '',
        },
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 20000,
    });
}

async function sendVerificationEmail(email, token) {
    const transporter = await createTransporter();
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
