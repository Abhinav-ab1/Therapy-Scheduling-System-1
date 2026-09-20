import nodemailer from "nodemailer";

export const emailTransporter = nodemailer.createTransport({
  service: "SendGrid",
  auth: {
    user: process.env.SENDGRID_USER || "apikey",
    pass: process.env.SENDGRID_API_KEY,
  },
});

export const emailFrom = process.env.EMAIL_FROM;