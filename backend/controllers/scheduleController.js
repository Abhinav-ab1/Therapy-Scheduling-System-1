import { User, Schedule } from "../models/index.js";
import { Op } from "sequelize";

// Define time slots
const TIME_SLOTS = {
  'morning': { label: '8AM - 12PM', startTime: 8, endTime: 12 },
  'afternoon': { label: '12PM - 5PM', startTime: 12, endTime: 17 },
  'evening': { label: '5PM - 8PM', startTime: 17, endTime: 20 }
};

// Helper function to create date with time slot
const createSlotDateTime = (date, timeSlot) => {
  const slotDate = new Date(date);
  const slot = TIME_SLOTS[timeSlot];
  if (!slot) throw new Error('Invalid time slot');
  
  slotDate.setHours(slot.startTime, 0, 0, 0);
  return slotDate;
};

// Helper function to get time slot from date
const getTimeSlotFromDate = (date) => {
  const hour = new Date(date).getHours();
  if (hour >= 8 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 20) return 'evening';
  return null;
};

// Patient - Book appointment (handles both existing slots and custom booking)
export const bookAppointment = async (req, res) => {
  try {
    const { scheduleId, practitionerId, date, timeSlot, interval } = req.body;
    const patientId = req.user.id;

    // If scheduleId is provided, book existing slot
    if (scheduleId) {
      const schedule = await Schedule.findByPk(scheduleId);
      if (!schedule || schedule.status !== "available") {
        return res.status(400).json({ message: "Slot not available" });
      }

      // Store the specific interval patient selected (optional)
      schedule.patientId = patientId;
      schedule.status = "booked";
      if (interval) {
        schedule.notes = `Booked for interval: ${interval}`;
      }
      await schedule.save();

      const populated = await Schedule.findByPk(schedule.id, {
        include: [
          { model: User, as: "practitioner", attributes: ["id", "name", "email"] },
          { model: User, as: "patient", attributes: ["id", "name", "email"] },
        ],
      });

      return res.json({
        message: "Appointment booked successfully",
        schedule: populated,
      });
    }

    // If practitionerId, date, and timeSlot are provided, create and book new slot
    if (practitionerId && date && timeSlot) {
      if (!TIME_SLOTS[timeSlot]) {
        return res.status(400).json({ message: "Invalid time slot" });
      }

      const slotDateTime = createSlotDateTime(date, timeSlot);

      // Check if practitioner exists
      const practitioner = await User.findByPk(practitionerId);
      if (!practitioner || practitioner.role !== "practitioner") {
        return res.status(400).json({ message: "Invalid practitioner" });
      }

      // Check for conflicting appointments (same date and time slot)
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const existingSlot = await Schedule.findOne({
        where: {
          practitionerId,
          date: {
            [Op.gte]: startOfDay,
            [Op.lte]: endOfDay
          },
          timeSlot,
          status: ["booked", "available"]
        }
      });

      if (existingSlot) {
        return res.status(400).json({ message: "Time slot already exists or is booked" });
      }

      // Create and book the slot
      const newSlot = await Schedule.create({
        practitionerId,
        patientId,
        date: slotDateTime,
        timeSlot,
        status: "booked",
      });

      const populated = await Schedule.findByPk(newSlot.id, {
        include: [
          { model: User, as: "practitioner", attributes: ["id", "name", "email"] },
          { model: User, as: "patient", attributes: ["id", "name", "email"] },
        ],
      });

      return res.json({
        message: "Custom appointment booked successfully",
        schedule: populated,
      });
    }

    return res.status(400).json({ message: "Either scheduleId or practitionerId+date+timeSlot required" });
  } catch (error) {
    console.error("bookAppointment error:", error);
    res.status(500).json({ message: "Error booking appointment" });
  }
};

// Patient - Request reschedule
export const requestReschedule = async (req, res) => {
  try {
    const { scheduleId, newDate, newTimeSlot, reason } = req.body;
    const patientId = req.user.id;

    const schedule = await Schedule.findByPk(scheduleId);
    if (!schedule || schedule.patientId !== patientId) {
      return res.status(403).json({ message: "Unauthorized request" });
    }

    if (schedule.status !== "booked") {
      return res.status(400).json({ message: "Can only reschedule booked appointments" });
    }

    if (!TIME_SLOTS[newTimeSlot]) {
      return res.status(400).json({ message: "Invalid time slot" });
    }

    const newSlotDateTime = createSlotDateTime(newDate, newTimeSlot);

    schedule.status = "reschedule_requested";
    schedule.rescheduleDate = newSlotDateTime;
    schedule.rescheduleTimeSlot = newTimeSlot;
    schedule.reason = reason || null;
    await schedule.save();

    const populated = await Schedule.findByPk(schedule.id, {
      include: [
        { model: User, as: "practitioner", attributes: ["id", "name", "email"] },
        { model: User, as: "patient", attributes: ["id", "name", "email"] },
      ],
    });

    res.json({ message: "Reschedule request sent", schedule: populated });
  } catch (error) {
    console.error("requestReschedule error:", error);
    res.status(500).json({ message: "Error requesting reschedule" });
  }
};

// Patient - Cancel appointment
export const cancelAppointment = async (req, res) => {
  try {
    const { scheduleId } = req.body;
    const patientId = req.user.id;

    const schedule = await Schedule.findByPk(scheduleId);
    if (!schedule || schedule.patientId !== patientId) {
      return res.status(403).json({ message: "Unauthorized request" });
    }

    if (schedule.status !== "booked" && schedule.status !== "reschedule_requested") {
      return res.status(400).json({ message: "Cannot cancel this appointment" });
    }

    schedule.patientId = null;
    schedule.status = "available";
    schedule.notes = "Appointment cancelled by patient";
    schedule.rescheduleDate = null;
    schedule.rescheduleTimeSlot = null;
    schedule.reason = null;
    await schedule.save();

    res.json({ message: "Appointment cancelled", schedule });
  } catch (error) {
    console.error("cancelAppointment error:", error);
    res.status(500).json({ message: "Error cancelling appointment" });
  }
};

// Practitioner - Create slot
export const createSlot = async (req, res) => {
  try {
    const { date, timeSlot } = req.body;
    const practitionerId = req.user.id;

    if (!TIME_SLOTS[timeSlot]) {
      return res.status(400).json({ message: "Invalid time slot" });
    }

    const slotDateTime = createSlotDateTime(date, timeSlot);

    // Check if slot already exists at this time
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const existingSlot = await Schedule.findOne({
      where: {
        practitionerId,
        date: {
          [Op.gte]: startOfDay,
          [Op.lte]: endOfDay
        },
        timeSlot
      }
    });

    if (existingSlot) {
      return res.status(400).json({ message: "Slot already exists for this time" });
    }

    const newSlot = await Schedule.create({
      practitionerId,
      date: slotDateTime,
      timeSlot,
      status: "available",
    });

    const populated = await Schedule.findByPk(newSlot.id, {
      include: [{ model: User, as: "practitioner", attributes: ["id", "name"] }],
    });

    res.json({ message: "Slot created", schedule: populated });
  } catch (error) {
    console.error("createSlot error:", error);
    res.status(500).json({ message: "Error creating slot" });
  }
};

// Practitioner - Approve reschedule
export const approveReschedule = async (req, res) => {
  try {
    const { scheduleId } = req.body;
    const practitionerId = req.user.id;

    const schedule = await Schedule.findByPk(scheduleId);
    if (!schedule || schedule.status !== "reschedule_requested") {
      return res.status(400).json({ message: "No reschedule request found" });
    }

    // Verify this is the practitioner's appointment
    if (schedule.practitionerId !== practitionerId) {
      return res.status(403).json({ message: "Unauthorized action" });
    }

    // Check if the new time slot is available
    const newDate = schedule.rescheduleDate;
    const newTimeSlot = schedule.rescheduleTimeSlot;
    
    const startOfDay = new Date(newDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(newDate);
    endOfDay.setHours(23, 59, 59, 999);

    const conflictingSlot = await Schedule.findOne({
      where: {
        practitionerId,
        date: {
          [Op.gte]: startOfDay,
          [Op.lte]: endOfDay
        },
        timeSlot: newTimeSlot,
        status: ["booked", "available"],
        id: { [Op.ne]: scheduleId } // Exclude current schedule
      }
    });

    if (conflictingSlot) {
      return res.status(400).json({ message: "New time slot is not available" });
    }

    schedule.date = schedule.rescheduleDate;
    schedule.timeSlot = schedule.rescheduleTimeSlot;
    schedule.status = "booked";
    schedule.notes = "Reschedule approved";
    schedule.rescheduleDate = null;
    schedule.rescheduleTimeSlot = null;
    schedule.reason = null;
    await schedule.save();

    const populated = await Schedule.findByPk(schedule.id, {
      include: [
        { model: User, as: "practitioner", attributes: ["id", "name", "email"] },
        { model: User, as: "patient", attributes: ["id", "name", "email"] },
      ],
    });

    res.json({ message: "Reschedule approved", schedule: populated });
  } catch (error) {
    console.error("approveReschedule error:", error);
    res.status(500).json({ message: "Error approving reschedule" });
  }
};

// Practitioner - Reject reschedule
export const rejectReschedule = async (req, res) => {
  try {
    const { scheduleId } = req.body;
    const practitionerId = req.user.id;

    const schedule = await Schedule.findByPk(scheduleId);
    if (!schedule || schedule.status !== "reschedule_requested") {
      return res.status(400).json({ message: "No reschedule request found" });
    }

    // Verify this is the practitioner's appointment
    if (schedule.practitionerId !== practitionerId) {
      return res.status(403).json({ message: "Unauthorized action" });
    }

    schedule.rescheduleDate = null;
    schedule.rescheduleTimeSlot = null;
    schedule.reason = null;
    schedule.status = "booked";
    schedule.notes = "Reschedule rejected by practitioner";
    await schedule.save();

    const populated = await Schedule.findByPk(schedule.id, {
      include: [
        { model: User, as: "practitioner", attributes: ["id", "name", "email"] },
        { model: User, as: "patient", attributes: ["id", "name", "email"] },
      ],
    });

    res.json({ message: "Reschedule rejected", schedule: populated });
  } catch (error) {
    console.error("rejectReschedule error:", error);
    res.status(500).json({ message: "Error rejecting reschedule" });
  }
};

// Practitioner - Mark appointment completed
export const markCompleted = async (req, res) => {
  try {
    const { scheduleId } = req.body;
    const practitionerId = req.user.id;

    const schedule = await Schedule.findByPk(scheduleId);
    if (!schedule || schedule.status !== "booked") {
      return res.status(400).json({ message: "Appointment not in progress" });
    }

    // Verify this is the practitioner's appointment
    if (schedule.practitionerId !== practitionerId) {
      return res.status(403).json({ message: "Unauthorized action" });
    }

    schedule.status = "completed";
    schedule.completionNotified = true;
    await schedule.save();

    res.json({ message: "Appointment marked as completed", schedule });
  } catch (error) {
    console.error("markCompleted error:", error);
    res.status(500).json({ message: "Error marking appointment completed" });
  }
};

// Admin - Get all schedules
export const getAllSchedules = async (req, res) => {
  try {
    const schedules = await Schedule.findAll({
      include: [
        { model: User, as: "practitioner", attributes: ["id", "name", "email"] },
        { model: User, as: "patient", attributes: ["id", "name", "email"] },
      ],
      order: [["date", "ASC"]],
    });

    res.json(schedules);
  } catch (error) {
    console.error("getAllSchedules error:", error);
    res.status(500).json({ message: "Error fetching schedules" });
  }
};

// Admin - Delete schedule
export const deleteSchedule = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    
    const schedule = await Schedule.findByPk(scheduleId);
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    await Schedule.destroy({ where: { id: scheduleId } });

    res.json({ message: "Schedule deleted" });
  } catch (error) {
    console.error("deleteSchedule error:", error);
    res.status(500).json({ message: "Error deleting schedule" });
  }
};

// Practitioner Dashboard - My schedules
export const getPractitionerSchedules = async (req, res) => {
  try {
    const practitionerId = req.user.id;

    const schedules = await Schedule.findAll({
      where: { practitionerId },
      include: [
        { model: User, as: "patient", attributes: ["id", "name", "email"] },
      ],
      order: [["date", "ASC"]],
    });

    res.json(schedules);
  } catch (error) {
    console.error("getPractitionerSchedules error:", error);
    res.status(500).json({ message: "Error fetching practitioner schedules" });
  }
};

// Patient Dashboard - My appointments
export const getPatientSchedules = async (req, res) => {
  try {
    const patientId = req.user.id;

    const schedules = await Schedule.findAll({
      where: { patientId },
      include: [
        { model: User, as: "practitioner", attributes: ["id", "name", "email"] },
      ],
      order: [["date", "ASC"]],
    });

    res.json(schedules);
  } catch (error) {
    console.error("getPatientSchedules error:", error);
    res.status(500).json({ message: "Error fetching patient schedules" });
  }
};

// Get available slots (public or filtered by practitioner)
export const getAvailableSlots = async (req, res) => {
  try {
    const { practitionerId } = req.query;

    const where = { status: "available" };
    if (practitionerId) where.practitionerId = practitionerId;

    const slots = await Schedule.findAll({
      where,
      include: [{ model: User, as: "practitioner", attributes: ["id", "name", "email"] }],
      order: [["date", "ASC"]],
    });

    res.json(slots);
  } catch (err) {
    console.error("getAvailableSlots error:", err);
    res.status(500).json({ message: "Error fetching slots" });
  }
};

// Get available time slots for reference
export const getTimeSlots = async (req, res) => {
  try {
    res.json(TIME_SLOTS);
  } catch (error) {
    console.error("getTimeSlots error:", error);
    res.status(500).json({ message: "Error fetching time slots" });
  }
};