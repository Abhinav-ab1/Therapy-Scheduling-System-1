import mongoose from "mongoose";

const scheduleSchema = new mongoose.Schema(
  {
    practitionerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    date: {
      type: Date,
      required: true,
    },

    timeSlot: {
      type: String,
      enum: ["morning", "afternoon", "evening"],
      required: true,
    },

    status: {
      type: String,
      enum: [
        "available",
        "booked",
        "reschedule_requested",
        "completed",
        "cancelled",
      ],
      default: "available",
    },

    notes: {
      type: String,
      default: null,
    },

    rescheduleDate: {
      type: Date,
      default: null,
    },

    rescheduleTimeSlot: {
      type: String,
      enum: ["morning", "afternoon", "evening"],
      default: null,
    },

    reason: {
      type: String,
      default: null,
    },

    reminderSent: {
      type: Boolean,
      default: false,
    },

    completionNotified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Schedule = mongoose.model("Schedule", scheduleSchema);

export default Schedule;