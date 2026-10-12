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

async function sendPasswordChangeOtp(email, otpCode) {
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
                name: 'Astra: Stride Wars',
                email: senderEmail,
            },
            to: [
                {
                    email: email.trim(),
                },
            ],
            subject: 'Security Verification Code - Astra',
            htmlContent: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; background: #0a0a1a; color: #e8e0d0; border-radius: 12px; border: 1px solid rgba(212, 175, 55, 0.3);">
                    <h2 style="color: #d4af37; margin-bottom: 8px;">Astra: Security Verification 🛡️</h2>
                    <p style="color: #a09880; font-size: 15px;">You requested to change your account password. Use the verification code below to authorize this change:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #ffd700; background: rgba(212, 175, 55, 0.15); padding: 14px 28px; border-radius: 8px; border: 1px solid #d4af37; display: inline-block;">
                            ${otpCode}
                        </span>
                    </div>
                    <p style="color: #ff6b6b; font-size: 13px;">This code will expire in <strong>10 minutes</strong>.</p>
                    <p style="color: #6b6360; font-size: 12px; border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 12px;">
                        If you did not request to change your password, please secure your account immediately.
                    </p>
                </div>
            `,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Brevo API Error Response (OTP):', errorData);
        throw new Error(`Brevo send error: ${response.status} - ${errorData.message || JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log('Password change OTP email sent successfully via Brevo:', data);
    return data;
}

async function sendTerritoryAttackedEmail(email, rulerName, territoryName, rivalName, rivalXp) {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) return null;

    const rawUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const baseUrl = rawUrl.trim().replace(/[\r\n\t]+/g, '').replace(/\/+$/, '');
    const territoryUrl = `${baseUrl}/territories`;
    const senderEmail = process.env.EMAIL_USER?.trim() || 'singhayush3547@gmail.com';

    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': apiKey.trim(),
                'content-type': 'application/json',
            },
            body: JSON.stringify({
                sender: { name: 'Astra: Stride Wars', email: senderEmail },
                to: [{ email: email.trim() }],
                subject: `⚔️ WAR DISPATCH: Your Territory '${territoryName}' is Under Attack!`,
                htmlContent: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; background: #0a0a1a; color: #e8e0d0; border-radius: 12px; border: 1px solid rgba(212, 175, 55, 0.4);">
                        <div style="text-align: center; margin-bottom: 20px;">
                            <span style="font-size: 40px;">⚔️</span>
                            <h2 style="color: #ffd700; margin: 8px 0; font-size: 22px; text-transform: uppercase; letter-spacing: 2px;">War Alert: Frontier Breached!</h2>
                        </div>
                        <p style="color: #ffffff; font-size: 16px;">Hail, Ruler <strong>${rulerName}</strong>,</p>
                        <p style="color: #d1c7b7; font-size: 14px; line-height: 1.6;">
                            Rival runner <strong style="color: #ff6b6b;">${rivalName}</strong> has marched directly through your kingdom holding <strong style="color: #ffd700;">${territoryName}</strong>, seizing <strong style="color: #00f2fe;">+${rivalXp} influence</strong>!
                        </p>
                        <div style="background: rgba(255, 77, 77, 0.15); border: 1px solid rgba(255, 77, 77, 0.4); border-radius: 8px; padding: 14px; margin: 20px 0; text-align: center;">
                            <p style="margin: 0; color: #ff8585; font-size: 14px; font-weight: bold;">
                                ⚠️ If your influence is eclipsed, your crown will be usurped!
                            </p>
                        </div>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${territoryUrl}" style="background: linear-gradient(135deg, #d4af37, #b8860b); color: #000000; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block; letter-spacing: 1px; box-shadow: 0 4px 15px rgba(212, 175, 55, 0.4);">
                                🛡️ DEFEND YOUR DOMINION
                            </a>
                        </div>
                        <p style="color: #716b60; font-size: 12px; text-align: center; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 14px;">
                            Astra: Stride Wars Tactical Recon Engine
                        </p>
                    </div>
                `,
            }),
        });
        return response.ok;
    } catch (err) {
        console.error('Failed to send territory attacked email:', err);
        return false;
    }
}

async function sendTerritoryUsurpedEmail(email, rulerName, territoryName, rivalName) {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) return null;

    const rawUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const baseUrl = rawUrl.trim().replace(/[\r\n\t]+/g, '').replace(/\/+$/, '');
    const territoryUrl = `${baseUrl}/territories`;
    const senderEmail = process.env.EMAIL_USER?.trim() || 'singhayush3547@gmail.com';

    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': apiKey.trim(),
                'content-type': 'application/json',
            },
            body: JSON.stringify({
                sender: { name: 'Astra: Stride Wars', email: senderEmail },
                to: [{ email: email.trim() }],
                subject: `👑 CROWN USURPED: ${rivalName} has seized '${territoryName}'!`,
                htmlContent: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; background: #0a0a1a; color: #e8e0d0; border-radius: 12px; border: 1px solid rgba(255, 77, 77, 0.5);">
                        <div style="text-align: center; margin-bottom: 20px;">
                            <span style="font-size: 40px;">🏴‍☠️</span>
                            <h2 style="color: #ff4d4d; margin: 8px 0; font-size: 22px; text-transform: uppercase; letter-spacing: 2px;">Domain Dethroned!</h2>
                        </div>
                        <p style="color: #ffffff; font-size: 16px;">Commander <strong>${rulerName}</strong>,</p>
                        <p style="color: #d1c7b7; font-size: 14px; line-height: 1.6;">
                            Your banner has fallen. Rival warlord <strong style="color: #ff6b6b;">${rivalName}</strong> has surpassed your influence and claimed rightful dominion over <strong style="color: #ffd700;">${territoryName}</strong>!
                        </p>
                        <div style="background: rgba(212, 175, 55, 0.1); border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 8px; padding: 14px; margin: 20px 0; text-align: center;">
                            <p style="margin: 0; color: #ffd700; font-size: 14px;">
                                ⚔️ Lace your shoes and run through this sector to reclaim what is yours!
                            </p>
                        </div>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${territoryUrl}" style="background: linear-gradient(135deg, #e11d48, #be123c); color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block; letter-spacing: 1px; box-shadow: 0 4px 15px rgba(225, 29, 72, 0.4);">
                                ⚔️ RECLAIM YOUR KINGDOM
                            </a>
                        </div>
                        <p style="color: #716b60; font-size: 12px; text-align: center; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 14px;">
                            Astra: Stride Wars Tactical Recon Engine
                        </p>
                    </div>
                `,
            }),
        });
        return response.ok;
    } catch (err) {
        console.error('Failed to send territory usurped email:', err);
        return false;
    }
}

async function sendStreakDangerEmail(email, userName, currentStreak) {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) return null;

    const rawUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const baseUrl = rawUrl.trim().replace(/[\r\n\t]+/g, '').replace(/\/+$/, '');
    const runUrl = `${baseUrl}/run`;
    const senderEmail = process.env.EMAIL_USER?.trim() || 'singhayush3547@gmail.com';

    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': apiKey.trim(),
                'content-type': 'application/json',
            },
            body: JSON.stringify({
                sender: { name: 'Astra: Stride Wars', email: senderEmail },
                to: [{ email: email.trim() }],
                subject: `🔥 STREAK DANGER: Your ${currentStreak}-Day Flame is About to Die!`,
                htmlContent: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; background: #0a0a1a; color: #e8e0d0; border-radius: 12px; border: 1px solid rgba(255, 110, 50, 0.4);">
                        <div style="text-align: center; margin-bottom: 20px;">
                            <span style="font-size: 44px;">🔥</span>
                            <h2 style="color: #ff7844; margin: 8px 0; font-size: 22px; text-transform: uppercase; letter-spacing: 2px;">Your Flame Flickers!</h2>
                        </div>
                        <p style="color: #ffffff; font-size: 16px;">Runner <strong>${userName}</strong>,</p>
                        <p style="color: #d1c7b7; font-size: 14px; line-height: 1.6;">
                            You have fought hard for your glorious <strong style="color: #ffd700;">${currentStreak}-day running streak</strong>. But midnight approaches, and you have not logged a single stride today!
                        </p>
                        <div style="background: rgba(255, 120, 50, 0.15); border: 1px solid rgba(255, 120, 50, 0.4); border-radius: 8px; padding: 14px; margin: 20px 0; text-align: center;">
                            <p style="margin: 0; color: #ff9f75; font-size: 15px; font-weight: bold;">
                                ⏳ Log at least 1 kilometer before midnight to keep your streak burning!
                            </p>
                        </div>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${runUrl}" style="background: linear-gradient(135deg, #f97316, #ea580c); color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block; letter-spacing: 1px; box-shadow: 0 4px 15px rgba(249, 115, 22, 0.4);">
                                🏃 START RUN NOW & SAVE STREAK
                            </a>
                        </div>
                        <p style="color: #716b60; font-size: 12px; text-align: center; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 14px;">
                            Astra: Stride Wars Daily Sentinel
                        </p>
                    </div>
                `,
            }),
        });
        return response.ok;
    } catch (err) {
        console.error('Failed to send streak danger email:', err);
        return false;
    }
}

async function sendAbsenceWarningEmail(email, userName, daysInactive) {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) return null;

    const rawUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const baseUrl = rawUrl.trim().replace(/[\r\n\t]+/g, '').replace(/\/+$/, '');
    const runUrl = `${baseUrl}/run`;
    const senderEmail = process.env.EMAIL_USER?.trim() || 'singhayush3547@gmail.com';

    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': apiKey.trim(),
                'content-type': 'application/json',
            },
            body: JSON.stringify({
                sender: { name: 'Astra: Stride Wars', email: senderEmail },
                to: [{ email: email.trim() }],
                subject: `🏰 RULER MISSING: The Realm Awaits Your Return!`,
                htmlContent: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; background: #0a0a1a; color: #e8e0d0; border-radius: 12px; border: 1px solid rgba(212, 175, 55, 0.35);">
                        <div style="text-align: center; margin-bottom: 20px;">
                            <span style="font-size: 40px;">🏰</span>
                            <h2 style="color: #ffd700; margin: 8px 0; font-size: 22px; text-transform: uppercase; letter-spacing: 2px;">The Realm Is Dormant!</h2>
                        </div>
                        <p style="color: #ffffff; font-size: 16px;">Conqueror <strong>${userName}</strong>,</p>
                        <p style="color: #d1c7b7; font-size: 14px; line-height: 1.6;">
                            It has been <strong style="color: #ffd700;">${daysInactive} days</strong> since your last march. In your absence, rival warlords are scouting your sectors and preparing siege lines.
                        </p>
                        <div style="background: rgba(212, 175, 55, 0.1); border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 8px; padding: 14px; margin: 20px 0; text-align: center;">
                            <p style="margin: 0; color: #ffd700; font-size: 14px;">
                                🛡️ Return to the battlefield. Level up, earn XP, and expand your kingdom dominion!
                            </p>
                        </div>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${runUrl}" style="background: linear-gradient(135deg, #d4af37, #b8860b); color: #000000; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block; letter-spacing: 1px; box-shadow: 0 4px 15px rgba(212, 175, 55, 0.4);">
                                🏃 MARCH ONCE MORE
                            </a>
                        </div>
                        <p style="color: #716b60; font-size: 12px; text-align: center; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 14px;">
                            Astra: Stride Wars Kingdom Sentinel
                        </p>
                    </div>
                `,
            }),
        });
        return response.ok;
    } catch (err) {
        console.error('Failed to send absence warning email:', err);
        return false;
    }
}

module.exports = { 
    sendVerificationEmail, 
    generateVerificationToken, 
    sendPasswordResetEmail,
    sendPasswordChangeOtp,
    sendTerritoryAttackedEmail,
    sendTerritoryUsurpedEmail,
    sendStreakDangerEmail,
    sendAbsenceWarningEmail,
};
