import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Schedule = sequelize.define(
  "Schedule",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    practitionerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users", // refers to User table
        key: "id",
      },
    },

    patientId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
    },

    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    timeSlot: {
      type: DataTypes.ENUM('morning', 'afternoon', 'evening'),
      allowNull: false,
      comment: 'morning: 8AM-12PM, afternoon: 12PM-5PM, evening: 5PM-8PM'
    },

    status: {
      type: DataTypes.ENUM(
        "available",
        "booked",
        "reschedule_requested",
        "completed",
        "cancelled"
      ),
      defaultValue: "available",
      allowNull: false,
    },

    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    // Optional fields for reschedule
    rescheduleDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    rescheduleTimeSlot: {
      type: DataTypes.ENUM('morning', 'afternoon', 'evening'),
      allowNull: true,
    },

    reason: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    // fields for notifications
    reminderSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    completionNotified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "schedules",
    timestamps: true,
  }
);

// Note: Associations are handled in models/index.js to avoid circular imports

export default Schedule;