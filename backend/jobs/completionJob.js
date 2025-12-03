// jobs/completionJob.js
import cron from "node-cron";
import { Op } from "sequelize";
import Schedule from "../models/schedule.js";
import User from "../models/users.js";
import { sendSms, sendEmail } from "../services/notificationService.js";

// Runs every 30 minutes
cron.schedule("*/30 * * * *", async () => {
  console.log("Running completion job...");

  const now = new Date();

  // Find past booked appointments
  const pastAppointments = await Schedule.findAll({
    where: {
      status: "booked",
      date: { [Op.lt]: now },
    },
  });

  for (const appt of pastAppointments) {
    const patient = await User.findByPk(appt.patientId);
    const practitioner = await User.findByPk(appt.practitionerId);

    const message = `Your appointment on ${appt.date.toLocaleString()} has been marked as completed.`;

    if (patient) {
      if (patient.phone) await sendSms(patient.phone, message);
      if (patient.email) await sendEmail(patient.email, "Appointment Completed", message);
    }

    if (practitioner) {
      if (practitioner.phone) await sendSms(practitioner.phone, message);
      if (practitioner.email) await sendEmail(practitioner.email, "Appointment Completed", message);
    }

    // Update status
    appt.status = "completed";
    await appt.save();
  }
});
