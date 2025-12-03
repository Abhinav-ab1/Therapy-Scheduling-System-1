import nodemailer from "nodemailer";

export const emailTransporter = nodemailer.createTransport({
  service: "SendGrid",
  auth: {
    user: "kQ9AfbxLSyKu_J-qd1ZU9w", 
    pass: process.env.SENDGRID_API_KEY,
  },
});

export const emailFrom = process.env.EMAIL_FROM;
