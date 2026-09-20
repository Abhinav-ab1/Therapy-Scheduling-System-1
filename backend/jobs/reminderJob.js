import cron from "node-cron";
import Schedule from "../models/schedule.js";
import {
  sendSms,
  sendEmail,
} from "../services/notificationService.js";

// =========================================================
// REMINDER CRON JOB
// Runs every 15 minutes
// =========================================================

cron.schedule("*/15 * * * *", async () => {
  console.log("⏰ Running reminder cron job...");

  try {
    const now = new Date();

    const oneHourLater = new Date(
      now.getTime() + 60 * 60 * 1000
    );

    // =======================================================
    // FIND BOOKED APPOINTMENTS IN NEXT 1 HOUR
    // =======================================================

    const upcomingAppointments =
      await Schedule.find({
        status: "booked",

        date: {
          $gte: now,
          $lte: oneHourLater,
        },

        reminderSent: false,
      })
        .populate(
          "patientId",
          "name email phone"
        )
        .populate(
          "practitionerId",
          "name email phone"
        );

    console.log(
      `📅 Found ${upcomingAppointments.length} appointment(s) needing reminders.`
    );

    // =======================================================
    // SEND REMINDERS
    // =======================================================

    for (const appointment of upcomingAppointments) {
      try {
        const appointmentDate =
          new Date(appointment.date);

        const message =
          `Reminder: You have a Panchakarma therapy appointment ` +
          `scheduled for ${appointmentDate.toLocaleString(
            "en-IN"
          )}.`;

        const patient =
          appointment.patientId;

        const practitioner =
          appointment.practitionerId;

        // ===================================================
        // PATIENT NOTIFICATION
        // ===================================================

        if (patient) {
          if (patient.phone) {
            try {
              await sendSms(
                patient.phone,
                message
              );

              console.log(
                `📱 SMS reminder sent to patient: ${patient.email}`
              );
            } catch (error) {
              console.error(
                "❌ Patient SMS failed:",
                error.message
              );
            }
          }

          if (patient.email) {
            try {
              await sendEmail(
                patient.email,
                "Appointment Reminder",
                message
              );

              console.log(
                `📧 Email reminder sent to patient: ${patient.email}`
              );
            } catch (error) {
              console.error(
                "❌ Patient email failed:",
                error.message
              );
            }
          }
        }

        // ===================================================
        // PRACTITIONER NOTIFICATION
        // ===================================================

        if (practitioner) {
          if (practitioner.phone) {
            try {
              await sendSms(
                practitioner.phone,
                message
              );

              console.log(
                `📱 SMS reminder sent to practitioner: ${practitioner.email}`
              );
            } catch (error) {
              console.error(
                "❌ Practitioner SMS failed:",
                error.message
              );
            }
          }

          if (practitioner.email) {
            try {
              await sendEmail(
                practitioner.email,
                "Appointment Reminder",
                message
              );

              console.log(
                `📧 Email reminder sent to practitioner: ${practitioner.email}`
              );
            } catch (error) {
              console.error(
                "❌ Practitioner email failed:",
                error.message
              );
            }
          }
        }

        // ===================================================
        // MARK REMINDER AS SENT
        // ===================================================

        appointment.reminderSent = true;

        await appointment.save();

        console.log(
          `✅ Reminder completed for schedule ${appointment._id}`
        );
      } catch (error) {
        console.error(
          `❌ Failed to process reminder for schedule ${appointment._id}:`,
          error.message
        );
      }
    }
  } catch (error) {
    console.error(
      "❌ Reminder cron job failed:",
      error.message
    );
  }
});

console.log(
  "✅ Appointment reminder cron job initialized"
);