// backend/routes/scheduleRoutes.js
import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import checkRole from "../middleware/roleMiddleware.js";
import {
  bookAppointment,
  requestReschedule,
  cancelAppointment,
  createSlot,
  approveReschedule,
  rejectReschedule,
  markCompleted,
  getAllSchedules,
  deleteSchedule,
  getPractitionerSchedules,
  getPatientSchedules,
  getAvailableSlots,
  getTimeSlots,
} from "../controllers/scheduleController.js";

const router = express.Router();

// ------------------ Public/General ------------------
router.get("/available", getAvailableSlots); // Allow both logged-in and public access
router.get("/time-slots", getTimeSlots); // Get available time slots

// ------------------ Patient ------------------
router.post("/book", authMiddleware, checkRole(["patient"]), bookAppointment);
router.post("/book-custom", authMiddleware, checkRole(["patient"]), bookAppointment); // Use same handler for now
router.post("/reschedule", authMiddleware, checkRole(["patient"]), requestReschedule);
router.post("/cancel", authMiddleware, checkRole(["patient"]), cancelAppointment);
router.get("/patient", authMiddleware, checkRole(["patient"]), getPatientSchedules);

// ---------------- Practitioner ----------------
router.post("/create-slot", authMiddleware, checkRole(["practitioner"]), createSlot);
router.post("/approve-reschedule", authMiddleware, checkRole(["practitioner"]), approveReschedule);
router.post("/reject-reschedule", authMiddleware, checkRole(["practitioner"]), rejectReschedule);
router.post("/mark-completed", authMiddleware, checkRole(["practitioner"]), markCompleted);
router.get("/practitioner", authMiddleware, checkRole(["practitioner"]), getPractitionerSchedules);

// ------------------- Admin -------------------
router.get("/all", authMiddleware, checkRole(["admin"]), getAllSchedules);
router.delete("/:scheduleId", authMiddleware, checkRole(["admin"]), deleteSchedule);

export default router;