import cron from "node-cron";
import { Op } from "sequelize";
import Schedule from "../models/schedule.js";
import User from "../models/users.js";
import { sendSms, sendEmail } from "../services/notificationService.js";

// Runs every 15 minutes
cron.schedule("*/15 * * * *", async () => {
  console.log("Running reminder cron job...");

  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

  // Fetch appointments happening in the next hour
  const upcoming = await Schedule.findAll({
    where: {
      status: "booked",
      date: { [Op.between]: [now, oneHourLater] },
    },
  });

  for (const appt of upcoming) {
    const patient = await User.findByPk(appt.patientId);
    const practitioner = await User.findByPk(appt.practitionerId);

    const message = `Reminder: You have an appointment at ${appt.date.toLocaleString()}`;

    if (patient) {
      if (patient.phone) await sendSms(patient.phone, message);
      if (patient.email) await sendEmail(patient.email, "Appointment Reminder", message);
    }

    if (practitioner) {
      if (practitioner.phone) await sendSms(practitioner.phone, message);
      if (practitioner.email) await sendEmail(practitioner.email, "Appointment Reminder", message);
    }
  }
});
