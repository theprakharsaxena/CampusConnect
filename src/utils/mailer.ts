import nodemailer from "nodemailer";
import { config } from "../config";

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.port === 465,
  requireTLS: true, // fail if STARTTLS not available
  auth:
    config.smtp.user && config.smtp.pass
      ? {
          user: config.smtp.user,
          pass: config.smtp.pass,
        }
      : undefined,
});

export const sendVerificationEmail = async (
  email: string,
  code: string,
): Promise<void> => {
  if (!config.smtp.host) {
    throw new Error(
      "SMTP is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS.",
    );
  }

  await transporter.sendMail({
    from: config.smtp.from,
    to: email,
    subject: "CampusConnect Email Verification Code",
    text: `Your CampusConnect verification code is ${code}. It expires in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h2>CampusConnect Email Verification</h2>
        <p>Your verification code is:</p>
        <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${code}</p>
        <p>This code expires in 10 minutes.</p>
      </div>
    `,
  });
};

export const sendPasswordResetEmail = async (
  email: string,
  resetToken: string,
): Promise<void> => {
  if (!config.smtp.host) {
    throw new Error(
      "SMTP is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS.",
    );
  }

  await transporter.sendMail({
    from: config.smtp.from,
    to: email,
    subject: "CampusConnect Password Reset",
    text: `Your password reset code is: ${resetToken}\n\nThis code expires in 1 hour. If you did not request a password reset, please ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h2>CampusConnect Password Reset</h2>
        <p>You requested a password reset. Use the code below to reset your password:</p>
        <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${resetToken}</p>
        <p>This code expires in 1 hour.</p>
        <p style="color: #666;">If you did not request this, please ignore this email.</p>
      </div>
    `,
  });
};
