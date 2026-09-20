// jobs/completionJob.js

import cron from "node-cron";
import Schedule from "../models/schedule.js";
import {
  sendSms,
  sendEmail,
} from "../services/notificationService.js";

// =========================================================
// COMPLETION CRON JOB
// Runs every 30 minutes
// =========================================================

cron.schedule("*/30 * * * *", async () => {
  console.log("⏰ Running completion job...");

  try {
    const now = new Date();

    // =======================================================
    // FIND PAST BOOKED APPOINTMENTS
    // =======================================================

    const pastAppointments = await Schedule.find({
      status: "booked",

      date: {
        $lt: now,
      },
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
      `📅 Found ${pastAppointments.length} past appointment(s).`
    );

    // =======================================================
    // PROCESS EACH APPOINTMENT
    // =======================================================

    for (const appointment of pastAppointments) {
      try {
        const appointmentDate =
          new Date(appointment.date);

        const message =
          `Your Panchakarma therapy appointment on ` +
          `${appointmentDate.toLocaleString(
            "en-IN"
          )} has been marked as completed.`;

        const patient =
          appointment.patientId;

        const practitioner =
          appointment.practitionerId;

        // ===================================================
        // PATIENT NOTIFICATION
        // ===================================================

        if (patient) {
          // SMS
          if (patient.phone) {
            try {
              await sendSms(
                patient.phone,
                message
              );

              console.log(
                `📱 Completion SMS sent to patient: ${patient.email}`
              );
            } catch (error) {
              console.error(
                "❌ Patient SMS failed:",
                error.message
              );
            }
          }

          // Email
          if (patient.email) {
            try {
              await sendEmail(
                patient.email,
                "Appointment Completed",
                message
              );

              console.log(
                `📧 Completion email sent to patient: ${patient.email}`
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
          // SMS
          if (practitioner.phone) {
            try {
              await sendSms(
                practitioner.phone,
                message
              );

              console.log(
                `📱 Completion SMS sent to practitioner: ${practitioner.email}`
              );
            } catch (error) {
              console.error(
                "❌ Practitioner SMS failed:",
                error.message
              );
            }
          }

          // Email
          if (practitioner.email) {
            try {
              await sendEmail(
                practitioner.email,
                "Appointment Completed",
                message
              );

              console.log(
                `📧 Completion email sent to practitioner: ${practitioner.email}`
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
        // UPDATE APPOINTMENT STATUS
        // ===================================================

        appointment.status = "completed";

        await appointment.save();

        console.log(
          `✅ Appointment ${appointment._id} marked as completed.`
        );
      } catch (error) {
        console.error(
          `❌ Failed to process appointment ${appointment._id}:`,
          error.message
        );
      }
    }
  } catch (error) {
    console.error(
      "❌ Completion cron job failed:",
      error.message
    );
  }
});

// =========================================================
// JOB INITIALIZED
// =========================================================

console.log(
  "✅ Appointment completion cron job initialized"
);