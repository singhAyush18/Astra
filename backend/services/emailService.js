const crypto = require('crypto');

async function sendVerificationEmail(email, token) {
    const rawUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const baseUrl = rawUrl.trim().replace(/[\r\n\t]+/g, '').replace(/\/+$/, '');
    const cleanToken = token.trim().replace(/[\r\n\t]+/g, '');
    const verificationUrl = `${baseUrl}/verify-email?token=${encodeURIComponent(cleanToken)}`;
    const apiKey = process.env.BREVO_API_KEY;

    if (!apiKey) {
        throw new Error('BREVO_API_KEY is not configured in environment variables.');
    }

    const senderEmail = process.env.EMAIL_USER?.trim() || 'singhayush3547@gmail.com';

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'api-key': apiKey.trim(),
            'content-type': 'application/json',
        },
        body: JSON.stringify({
            sender: {
                name: 'Runnn',
                email: senderEmail,
            },
            to: [
                {
                    email: email.trim(),
                },
            ],
            subject: 'Verify your Runnn account',
            htmlContent: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
                    <h2>Welcome to Runnn! 🏃</h2>
                    <p>Click the link below to verify your email address and activate your account:</p>
                    <p style="margin: 24px 0;">
                        <a href="${verificationUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                            Verify Email
                        </a>
                    </p>
                    <p style="color: #666; font-size: 14px;">This link will expire in 24 hours.</p>
                </div>
            `,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Brevo API Error Response:', errorData);
        throw new Error(`Brevo send error: ${response.status} - ${errorData.message || JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log('Verification email sent successfully via Brevo:', data);
    return data;
}

function generateVerificationToken() {
    return crypto.randomBytes(32).toString('hex');
}
async function sendPasswordResetEmail(email, token) {
    const rawUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const baseUrl = rawUrl.trim().replace(/[\r\n\t]+/g, '').replace(/\/+$/, '');
    const cleanToken = token.trim().replace(/[\r\n\t]+/g, '');
    const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(cleanToken)}`;
    const apiKey = process.env.BREVO_API_KEY;

    if (!apiKey) {
        throw new Error('BREVO_API_KEY is not configured in environment variables.');
    }

    const senderEmail = process.env.EMAIL_USER?.trim() || 'singhayush3547@gmail.com';

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'api-key': apiKey.trim(),
            'content-type': 'application/json',
        },
        body: JSON.stringify({
            sender: {
                name: 'Runnn',
                email: senderEmail,
            },
            to: [
                {
                    email: email.trim(),
                },
            ],
            subject: 'Reset your Runnn Password',
            htmlContent: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
                    <h2>Password Reset Request 🔐</h2>
                    <p>We received a request to reset your password for your Runnn account.</p>
                    <p>Click the button below to set a new password:</p>
                    <p style="margin: 24px 0;">
                        <a href="${resetUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                            Reset Password
                        </a>
                    </p>
                    <p style="color: #666; font-size: 14px;">This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
                </div>
            `,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Brevo API Error Response:', errorData);
        throw new Error(`Brevo send error: ${response.status} - ${errorData.message || JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log('Password reset email sent successfully via Brevo:', data);
    return data;
}


module.exports = { sendVerificationEmail, generateVerificationToken, sendPasswordResetEmail };
