const nodemailer = require('nodemailer');
const env = require('../config/env');
const logger = require('../utils/logger');

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: {
        user: env.smtp.user,
        pass: env.smtp.pass,
      },
      pool: true,
      maxConnections: 5,
      tls: {
        rejectUnauthorized: false
      }
    });
  }
  return transporter;
}

function buildOTPTemplate(otp, userName, subject, expiryMinutes) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.10);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e3a5f 0%,#2563eb 100%);padding:36px 48px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:2px;">JOB NEST CRM</h1>
              <p style="margin:6px 0 0;color:#93c5fd;font-size:13px;letter-spacing:1px;">SECURE AUTHENTICATION</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px 48px;">
              <p style="margin:0 0 8px;color:#111827;font-size:16px;font-weight:600;">Hello, ${userName}</p>
              <p style="margin:0 0 28px;color:#6b7280;font-size:14px;line-height:1.7;">
                We received a request to ${subject.toLowerCase().includes('reset') ? 'reset your password' : 'sign in to your account'}.
                Use the OTP below to proceed. This code is valid for <strong>${expiryMinutes} minutes</strong>.
              </p>
              <!-- OTP Box -->
              <div style="background:#eff6ff;border:2px dashed #2563eb;border-radius:10px;padding:28px;text-align:center;margin:0 0 28px;">
                <p style="margin:0 0 10px;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:3px;font-weight:600;">Your One-Time Password</p>
                <span style="font-size:44px;font-weight:800;color:#1e3a5f;letter-spacing:14px;font-family:'Courier New',monospace;">${otp}</span>
                <p style="margin:14px 0 0;color:#9ca3af;font-size:12px;">Expires in ${expiryMinutes} minutes · Do not share this code</p>
              </div>
              <!-- Security note -->
              <div style="background:#fefce8;border-left:4px solid #f59e0b;border-radius:4px;padding:14px 18px;margin:0 0 24px;">
                <p style="margin:0;color:#92400e;font-size:13px;line-height:1.5;">
                  <strong>Security Notice:</strong> JOB NEST CRM will never ask for your OTP via phone or email reply.
                  If you did not request this, please ignore this email — your account is safe.
                </p>
              </div>
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
              <p style="margin:0;color:#d1d5db;font-size:12px;text-align:center;">
                &copy; ${new Date().getFullYear()} JOB NEST CRM &bull; All rights reserved
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

async function sendOTPEmail(to, otp, userName) {
  const expiryMinutes = Math.floor(env.otpExpirySeconds / 60);
  const subject = 'JOB NEST CRM Login OTP';

  try {
    const info = await getTransporter().sendMail({
      from: `"JOB NEST CRM" <${env.smtp.user}>`,
      to,
      subject,
      html: buildOTPTemplate(otp, userName, subject, expiryMinutes),
    });
    logger.info(`OTP email sent to ${to}`, { messageId: info.messageId });
  } catch (err) {
    logger.error(`Failed to send OTP email to ${to}`, { message: err.message });
    throw Object.assign(new Error('Failed to send OTP email. Please try again.'), { statusCode: 503 });
  }
}

function buildCredentialsTemplate(adminId, tempPassword, companyName, adminName, type = 'create_tenant', email = '') {
  let subtitle = 'WORKSPACE PROVISIONED';
  let bodyText = `Your workspace for <strong>${companyName}</strong> has been successfully created. Here are your administrator login credentials:`;
  let idLabel = 'Admin ID:';

  if (type === 'reset_tenant') {
    subtitle = 'CREDENTIALS RESET';
    bodyText = `Your administrator login credentials for <strong>${companyName}</strong> have been updated. Here are your new credentials:`;
    idLabel = 'Admin ID:';
  } else if (type === 'create_user') {
    subtitle = 'ACCOUNT CREATED';
    bodyText = `You have been added to the <strong>${companyName}</strong> workspace. Here are your login credentials:`;
    idLabel = 'Login ID:';
  } else if (type === 'reset_user') {
    subtitle = 'PASSWORD RESET';
    bodyText = `Your password for the <strong>${companyName}</strong> workspace has been successfully reset. Here are your new login credentials:`;
    idLabel = 'Login ID:';
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Job Nest CRM Credentials</title>
</head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.10);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e3a5f 0%,#2563eb 100%);padding:36px 48px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:2px;">JOB NEST CRM</h1>
              <p style="margin:6px 0 0;color:#93c5fd;font-size:13px;letter-spacing:1px;">${subtitle}</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px 48px;">
              <p style="margin:0 0 8px;color:#111827;font-size:16px;font-weight:600;">Hello, ${adminName}</p>
              <p style="margin:0 0 20px;color:#6b7280;font-size:14px;line-height:1.7;">
                ${bodyText}
              </p>
              <!-- Credentials Box -->
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:20px;margin:0 0 24px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  ${email ? `
                  <tr>
                    <td style="padding:6px 0;font-size:13px;color:#64748b;font-weight:600;" width="140">Email:</td>
                    <td style="padding:6px 0;font-size:13px;color:#0f172a;font-family:monospace;font-weight:700;">${email}</td>
                  </tr>` : ''}
                  <tr>
                    <td style="padding:6px 0;font-size:13px;color:#64748b;font-weight:600;" width="140">${idLabel}</td>
                    <td style="padding:6px 0;font-size:13px;color:#0f172a;font-family:monospace;font-weight:700;">${adminId}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;font-size:13px;color:#64748b;font-weight:600;">Password:</td>
                    <td style="padding:6px 0;font-size:13px;color:#0f172a;font-family:monospace;font-weight:700;">${tempPassword}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;font-size:13px;color:#64748b;font-weight:600;">Portal URL:</td>
                    <td style="padding:6px 0;font-size:13px;color:#2563eb;font-weight:700;"><a href="http://localhost:3000/auth/login" style="color:#2563eb;text-decoration:none;">http://localhost:3000/auth/login</a></td>
                  </tr>
                </table>
              </div>
              
              <div style="background:#eff6ff;border-left:4px solid #2563eb;border-radius:4px;padding:14px 18px;margin:0 0 24px;">
                <p style="margin:0 0 8px;color:#1e3a8a;font-size:13px;line-height:1.5;">
                  <strong>Sign In:</strong> You can log in using either your Registered Email or your Login ID / Employee ID.
                </p>
                <p style="margin:0;color:#1e3a8a;font-size:13px;line-height:1.5;">
                  <strong>First-time Sign In:</strong> For security reasons, please change your password immediately after logging in.
                </p>
              </div>
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
              <p style="margin:0;color:#d1d5db;font-size:12px;text-align:center;">
                &copy; ${new Date().getFullYear()} JOB NEST CRM &bull; All rights reserved
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

async function sendPasswordResetEmail(to, otp, userName) {
  const expiryMinutes = Math.floor(env.otpExpirySeconds / 60);
  const subject = 'JOB NEST CRM - Password Reset OTP';

  try {
    const info = await getTransporter().sendMail({
      from: `"JOB NEST CRM" <${env.smtp.user}>`,
      to,
      subject,
      html: buildOTPTemplate(otp, userName, subject, expiryMinutes),
    });
    logger.info(`Password reset email sent to ${to}`, { messageId: info.messageId });
  } catch (err) {
    logger.error(`Failed to send password reset email to ${to}`, { message: err.message });
    throw Object.assign(new Error('Failed to send reset email. Please try again.'), { statusCode: 503 });
  }
}

async function sendCredentialsEmail(to, adminId, tempPassword, companyName, adminName, type = 'create_tenant') {
  let subject = 'JOB NEST CRM - Workspace Credentials';
  if (type === 'create_tenant') {
    subject = 'JOB NEST CRM - Workspace Created';
  } else if (type === 'reset_tenant') {
    subject = 'JOB NEST CRM - Admin Password Reset';
  } else if (type === 'create_user') {
    subject = 'Welcome to JOB NEST CRM';
  } else if (type === 'reset_user') {
    subject = 'JOB NEST CRM - Password Reset';
  }

  try {
    const info = await getTransporter().sendMail({
      from: `"JOB NEST CRM" <${env.smtp.user}>`,
      to,
      subject,
      html: buildCredentialsTemplate(adminId, tempPassword, companyName, adminName, type, to),
    });
    logger.info(`Credentials email sent to ${to} with type ${type}`, { messageId: info.messageId });
  } catch (err) {
    logger.error(`Failed to send credentials email to ${to}`, { message: err.message });
    throw Object.assign(new Error('Failed to send credentials email. Please try again.'), { statusCode: 503 });
  }
}

module.exports = { sendOTPEmail, sendPasswordResetEmail, sendCredentialsEmail };
