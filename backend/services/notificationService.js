import { twilioClient, twilioPhoneNumber } from "../config/twilio.js";
import { emailTransporter, emailFrom } from "../config/email.js";

// Send SMS
export const sendSms = async (to, body) => {
  try {
    const message = await twilioClient.messages.create({
      body,
      from: twilioPhoneNumber,
      to,
    });
    console.log(` SMS sent to ${to}: ${message.sid}`);
    return message;
  } catch (error) {
    console.error(" Error sending SMS:", error.message);
    throw error;
  }
};

// Send Email (flexible)
export const sendEmail = async (to, subject, text) => {
  try {
    const info = await emailTransporter.sendMail({
      from: emailFrom,
      to,
      subject,
      text,
    });
    console.log(` Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(" Error sending Email:", error.message);
    throw error;
  }
};

// Send appointment reminder
export const sendAppointmentReminder = async (schedule, patient, practitioner) => {
  const dateStr = new Date(schedule.date).toLocaleString();

  // Patient notification
  if (patient?.phone) {
    await sendSms(patient.phone, `Reminder: You have an appointment on ${dateStr}.`);
  } else if (patient?.email) {
    await sendEmail(patient.email, "Appointment Reminder", `Reminder: You have an appointment scheduled on ${dateStr}.`);
  }

  // Practitioner notification
  if (practitioner?.phone) {
    await sendSms(practitioner.phone, `Reminder: You have a session with patient ${patient?.name || patient?.id} on ${dateStr}.`);
  } else if (practitioner?.email) {
    await sendEmail(practitioner.email, "Session Reminder", `Reminder: You have a session with patient ${patient?.name || patient?.id} on ${dateStr}.`);
  }
};

// Send completion notification
export const sendCompletionNotification = async (schedule, patient) => {
  const dateStr = new Date(schedule.date).toLocaleString();

  if (patient?.phone) {
    await sendSms(patient.phone, `Your session on ${dateStr} has been marked as completed.`);
  } else if (patient?.email) {
    await sendEmail(patient.email, "Session Completed", `Your session on ${dateStr} has been marked as completed.`);
  }
};
