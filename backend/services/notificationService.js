import {
  twilioClient,
  twilioPhoneNumber,
} from "../config/twilio.js";

import {
  emailTransporter,
  emailFrom,
} from "../config/email.js";

// =========================================================
// SEND SMS
// =========================================================

export const sendSms = async (to, body) => {
  try {
    if (!to) {
      throw new Error(
        "Phone number is required"
      );
    }

    if (!twilioClient) {
      throw new Error(
        "Twilio client is not configured"
      );
    }

    const message =
      await twilioClient.messages.create({
        body,
        from: twilioPhoneNumber,
        to,
      });

    console.log(
      `📱 SMS sent to ${to}: ${message.sid}`
    );

    return message;
  } catch (error) {
    console.error(
      "❌ Error sending SMS:",
      error.message
    );

    throw error;
  }
};

// =========================================================
// SEND EMAIL
// =========================================================

export const sendEmail = async (
  to,
  subject,
  text
) => {
  try {
    if (!to) {
      throw new Error(
        "Email address is required"
      );
    }

    if (!emailTransporter) {
      throw new Error(
        "Email transporter is not configured"
      );
    }

    const info =
      await emailTransporter.sendMail({
        from: emailFrom,
        to,
        subject,
        text,
      });

    console.log(
      `📧 Email sent to ${to}: ${info.messageId}`
    );

    return info;
  } catch (error) {
    console.error(
      "❌ Error sending email:",
      error.message
    );

    throw error;
  }
};

// =========================================================
// APPOINTMENT REMINDER
// =========================================================

export const sendAppointmentReminder = async (
  schedule,
  patient,
  practitioner
) => {
  try {
    if (!schedule?.date) {
      throw new Error(
        "Appointment date is missing"
      );
    }

    const dateStr =
      new Date(
        schedule.date
      ).toLocaleString("en-IN");

    // =======================================================
    // PATIENT MESSAGE
    // =======================================================

    const patientMessage =
      `Reminder: You have a Panchakarma therapy ` +
      `appointment scheduled on ${dateStr}.`;

    // Patient SMS
    if (patient?.phone) {
      try {
        await sendSms(
          patient.phone,
          patientMessage
        );
      } catch (error) {
        console.error(
          "❌ Patient SMS notification failed:",
          error.message
        );
      }
    }

    // Patient Email
    if (patient?.email) {
      try {
        await sendEmail(
          patient.email,
          "Appointment Reminder",
          patientMessage
        );
      } catch (error) {
        console.error(
          "❌ Patient email notification failed:",
          error.message
        );
      }
    }

    // =======================================================
    // PRACTITIONER MESSAGE
    // =======================================================

    const practitionerMessage =
      `Reminder: You have a Panchakarma therapy ` +
      `session with patient ${
        patient?.name || "Patient"
      } on ${dateStr}.`;

    // Practitioner SMS
    if (practitioner?.phone) {
      try {
        await sendSms(
          practitioner.phone,
          practitionerMessage
        );
      } catch (error) {
        console.error(
          "❌ Practitioner SMS notification failed:",
          error.message
        );
      }
    }

    // Practitioner Email
    if (practitioner?.email) {
      try {
        await sendEmail(
          practitioner.email,
          "Session Reminder",
          practitionerMessage
        );
      } catch (error) {
        console.error(
          "❌ Practitioner email notification failed:",
          error.message
        );
      }
    }

    return true;
  } catch (error) {
    console.error(
      "❌ Appointment reminder failed:",
      error.message
    );

    return false;
  }
};

// =========================================================
// COMPLETION NOTIFICATION
// =========================================================

export const sendCompletionNotification = async (
  schedule,
  patient
) => {
  try {
    if (!schedule?.date) {
      throw new Error(
        "Appointment date is missing"
      );
    }

    const dateStr =
      new Date(
        schedule.date
      ).toLocaleString("en-IN");

    const message =
      `Your Panchakarma therapy session on ` +
      `${dateStr} has been marked as completed.`;

    // =======================================================
    // PATIENT SMS
    // =======================================================

    if (patient?.phone) {
      try {
        await sendSms(
          patient.phone,
          message
        );
      } catch (error) {
        console.error(
          "❌ Completion SMS failed:",
          error.message
        );
      }
    }

    // =======================================================
    // PATIENT EMAIL
    // =======================================================

    if (patient?.email) {
      try {
        await sendEmail(
          patient.email,
          "Session Completed",
          message
        );
      } catch (error) {
        console.error(
          "❌ Completion email failed:",
          error.message
        );
      }
    }

    return true;
  } catch (error) {
    console.error(
      "❌ Completion notification failed:",
      error.message
    );

    return false;
  }
};