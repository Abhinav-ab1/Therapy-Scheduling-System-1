import { User, Schedule } from "../models/index.js";


// =====================================================
// TIME SLOTS
// =====================================================

const TIME_SLOTS = {
  morning: {
    label: "8AM - 12PM",
    startTime: 8,
    endTime: 12,
  },

  afternoon: {
    label: "12PM - 5PM",
    startTime: 12,
    endTime: 17,
  },

  evening: {
    label: "5PM - 8PM",
    startTime: 17,
    endTime: 20,
  },
};


// =====================================================
// HELPER: CREATE DATE WITH TIME SLOT
// =====================================================

const createSlotDateTime = (date, timeSlot) => {
  const slot = TIME_SLOTS[timeSlot];

  if (!slot) {
    throw new Error("Invalid time slot");
  }

  const slotDate = new Date(date);

  slotDate.setHours(slot.startTime, 0, 0, 0);

  return slotDate;
};


// =====================================================
// HELPER: GET START AND END OF DAY
// =====================================================

const getDayRange = (date) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return {
    startOfDay,
    endOfDay,
  };
};


// =====================================================
// PATIENT - BOOK APPOINTMENT
// =====================================================

export const bookAppointment = async (req, res) => {
  try {
    const {
      scheduleId,
      practitionerId,
      date,
      timeSlot,
      interval,
    } = req.body;

    const patientId = req.user.id;


    // -------------------------------------------------
    // OPTION 1: BOOK EXISTING SLOT
    // -------------------------------------------------

    if (scheduleId) {
      const schedule = await Schedule.findById(scheduleId);

      if (!schedule) {
        return res.status(404).json({
          message: "Schedule not found",
        });
      }

      if (schedule.status !== "available") {
        return res.status(400).json({
          message: "Slot not available",
        });
      }


      schedule.patientId = patientId;
      schedule.status = "booked";


      if (interval) {
        schedule.notes = `Booked for interval: ${interval}`;
      }


      await schedule.save();


      const populatedSchedule = await Schedule.findById(schedule._id)
        .populate(
          "practitionerId",
          "name email"
        )
        .populate(
          "patientId",
          "name email"
        );


      return res.json({
        message: "Appointment booked successfully",
        schedule: populatedSchedule,
      });
    }


    // -------------------------------------------------
    // OPTION 2: CREATE CUSTOM APPOINTMENT
    // -------------------------------------------------

    if (practitionerId && date && timeSlot) {

      if (!TIME_SLOTS[timeSlot]) {
        return res.status(400).json({
          message: "Invalid time slot",
        });
      }


      const slotDateTime = createSlotDateTime(
        date,
        timeSlot
      );


      // Check practitioner
      const practitioner = await User.findById(
        practitionerId
      );


      if (
        !practitioner ||
        practitioner.role !== "practitioner"
      ) {
        return res.status(400).json({
          message: "Invalid practitioner",
        });
      }


      // Check same day
      const { startOfDay, endOfDay } =
        getDayRange(date);


      const existingSlot = await Schedule.findOne({
        practitionerId,
        date: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
        timeSlot,
        status: {
          $in: ["booked", "available"],
        },
      });


      if (existingSlot) {
        return res.status(400).json({
          message:
            "Time slot already exists or is booked",
        });
      }


      // Create appointment
      const newSlot = await Schedule.create({
        practitionerId,
        patientId,
        date: slotDateTime,
        timeSlot,
        status: "booked",
      });


      const populatedSchedule =
        await Schedule.findById(newSlot._id)
          .populate(
            "practitionerId",
            "name email"
          )
          .populate(
            "patientId",
            "name email"
          );


      return res.json({
        message:
          "Custom appointment booked successfully",
        schedule: populatedSchedule,
      });
    }


    return res.status(400).json({
      message:
        "Either scheduleId or practitionerId+date+timeSlot required",
    });

  } catch (error) {

    console.error(
      "bookAppointment error:",
      error
    );

    res.status(500).json({
      message: "Error booking appointment",
    });
  }
};


// =====================================================
// PATIENT - REQUEST RESCHEDULE
// =====================================================

export const requestReschedule = async (
  req,
  res
) => {

  try {

    const {
      scheduleId,
      newDate,
      newTimeSlot,
      reason,
    } = req.body;

    const patientId = req.user.id;


    const schedule =
      await Schedule.findById(scheduleId);


    if (!schedule) {
      return res.status(404).json({
        message: "Schedule not found",
      });
    }


    if (
      schedule.patientId?.toString() !==
      patientId.toString()
    ) {
      return res.status(403).json({
        message: "Unauthorized request",
      });
    }


    if (schedule.status !== "booked") {
      return res.status(400).json({
        message:
          "Can only reschedule booked appointments",
      });
    }


    if (!TIME_SLOTS[newTimeSlot]) {
      return res.status(400).json({
        message: "Invalid time slot",
      });
    }


    const newSlotDateTime =
      createSlotDateTime(
        newDate,
        newTimeSlot
      );


    schedule.status =
      "reschedule_requested";

    schedule.rescheduleDate =
      newSlotDateTime;

    schedule.rescheduleTimeSlot =
      newTimeSlot;

    schedule.reason =
      reason || null;


    await schedule.save();


    const populatedSchedule =
      await Schedule.findById(schedule._id)
        .populate(
          "practitionerId",
          "name email"
        )
        .populate(
          "patientId",
          "name email"
        );


    res.json({
      message: "Reschedule request sent",
      schedule: populatedSchedule,
    });

  } catch (error) {

    console.error(
      "requestReschedule error:",
      error
    );

    res.status(500).json({
      message:
        "Error requesting reschedule",
    });
  }
};


// =====================================================
// PATIENT - CANCEL APPOINTMENT
// =====================================================

export const cancelAppointment = async (
  req,
  res
) => {

  try {

    const { scheduleId } = req.body;

    const patientId = req.user.id;


    const schedule =
      await Schedule.findById(scheduleId);


    if (!schedule) {
      return res.status(404).json({
        message: "Schedule not found",
      });
    }


    if (
      schedule.patientId?.toString() !==
      patientId.toString()
    ) {
      return res.status(403).json({
        message: "Unauthorized request",
      });
    }


    if (
      schedule.status !== "booked" &&
      schedule.status !==
        "reschedule_requested"
    ) {
      return res.status(400).json({
        message:
          "Cannot cancel this appointment",
      });
    }


    schedule.patientId = null;

    schedule.status = "available";

    schedule.notes =
      "Appointment cancelled by patient";

    schedule.rescheduleDate = null;

    schedule.rescheduleTimeSlot = null;

    schedule.reason = null;


    await schedule.save();


    const populatedSchedule =
      await Schedule.findById(schedule._id)
        .populate(
          "practitionerId",
          "name email"
        )
        .populate(
          "patientId",
          "name email"
        );


    res.json({
      message: "Appointment cancelled",
      schedule: populatedSchedule,
    });

  } catch (error) {

    console.error(
      "cancelAppointment error:",
      error
    );

    res.status(500).json({
      message:
        "Error cancelling appointment",
    });
  }
};


// =====================================================
// PRACTITIONER - CREATE SLOT
// =====================================================

export const createSlot = async (
  req,
  res
) => {

  try {

    const {
      date,
      timeSlot,
    } = req.body;

    const practitionerId =
      req.user.id;


    if (!TIME_SLOTS[timeSlot]) {
      return res.status(400).json({
        message: "Invalid time slot",
      });
    }


    const slotDateTime =
      createSlotDateTime(
        date,
        timeSlot
      );


    const {
      startOfDay,
      endOfDay,
    } = getDayRange(date);


    // Check existing slot
    const existingSlot =
      await Schedule.findOne({
        practitionerId,

        date: {
          $gte: startOfDay,
          $lte: endOfDay,
        },

        timeSlot,
      });


    if (existingSlot) {
      return res.status(400).json({
        message:
          "Slot already exists for this time",
      });
    }


    const newSlot =
      await Schedule.create({

        practitionerId,

        date: slotDateTime,

        timeSlot,

        status: "available",

      });


    const populatedSchedule =
      await Schedule.findById(newSlot._id)
        .populate(
          "practitionerId",
          "name email"
        );


    res.json({
      message: "Slot created",
      schedule: populatedSchedule,
    });

  } catch (error) {

    console.error(
      "createSlot error:",
      error
    );

    res.status(500).json({
      message:
        "Error creating slot",
    });
  }
};


// =====================================================
// PRACTITIONER - APPROVE RESCHEDULE
// =====================================================

export const approveReschedule = async (
  req,
  res
) => {

  try {

    const { scheduleId } =
      req.body;

    const practitionerId =
      req.user.id;


    const schedule =
      await Schedule.findById(
        scheduleId
      );


    if (
      !schedule ||
      schedule.status !==
        "reschedule_requested"
    ) {
      return res.status(400).json({
        message:
          "No reschedule request found",
      });
    }


    if (
      schedule.practitionerId.toString() !==
      practitionerId.toString()
    ) {
      return res.status(403).json({
        message:
          "Unauthorized action",
      });
    }


    const newDate =
      schedule.rescheduleDate;

    const newTimeSlot =
      schedule.rescheduleTimeSlot;


    const {
      startOfDay,
      endOfDay,
    } = getDayRange(newDate);


    const conflictingSlot =
      await Schedule.findOne({

        practitionerId,

        date: {
          $gte: startOfDay,
          $lte: endOfDay,
        },

        timeSlot: newTimeSlot,

        status: {
          $in: [
            "booked",
            "available",
          ],
        },

        _id: {
          $ne: scheduleId,
        },

      });


    if (conflictingSlot) {
      return res.status(400).json({
        message:
          "New time slot is not available",
      });
    }


    schedule.date =
      schedule.rescheduleDate;

    schedule.timeSlot =
      schedule.rescheduleTimeSlot;

    schedule.status = "booked";

    schedule.notes =
      "Reschedule approved";

    schedule.rescheduleDate = null;

    schedule.rescheduleTimeSlot = null;

    schedule.reason = null;


    await schedule.save();


    const populatedSchedule =
      await Schedule.findById(schedule._id)
        .populate(
          "practitionerId",
          "name email"
        )
        .populate(
          "patientId",
          "name email"
        );


    res.json({
      message: "Reschedule approved",
      schedule: populatedSchedule,
    });

  } catch (error) {

    console.error(
      "approveReschedule error:",
      error
    );

    res.status(500).json({
      message:
        "Error approving reschedule",
    });
  }
};


// =====================================================
// PRACTITIONER - REJECT RESCHEDULE
// =====================================================

export const rejectReschedule = async (
  req,
  res
) => {

  try {

    const { scheduleId } =
      req.body;

    const practitionerId =
      req.user.id;


    const schedule =
      await Schedule.findById(
        scheduleId
      );


    if (
      !schedule ||
      schedule.status !==
        "reschedule_requested"
    ) {
      return res.status(400).json({
        message:
          "No reschedule request found",
      });
    }


    if (
      schedule.practitionerId.toString() !==
      practitionerId.toString()
    ) {
      return res.status(403).json({
        message:
          "Unauthorized action",
      });
    }


    schedule.rescheduleDate = null;

    schedule.rescheduleTimeSlot =
      null;

    schedule.reason = null;

    schedule.status = "booked";

    schedule.notes =
      "Reschedule rejected by practitioner";


    await schedule.save();


    const populatedSchedule =
      await Schedule.findById(schedule._id)
        .populate(
          "practitionerId",
          "name email"
        )
        .populate(
          "patientId",
          "name email"
        );


    res.json({
      message: "Reschedule rejected",
      schedule: populatedSchedule,
    });

  } catch (error) {

    console.error(
      "rejectReschedule error:",
      error
    );

    res.status(500).json({
      message:
        "Error rejecting reschedule",
    });
  }
};


// =====================================================
// PRACTITIONER - MARK COMPLETED
// =====================================================

export const markCompleted = async (
  req,
  res
) => {

  try {

    const { scheduleId } =
      req.body;

    const practitionerId =
      req.user.id;


    const schedule =
      await Schedule.findById(
        scheduleId
      );


    if (
      !schedule ||
      schedule.status !== "booked"
    ) {
      return res.status(400).json({
        message:
          "Appointment not in progress",
      });
    }


    if (
      schedule.practitionerId.toString() !==
      practitionerId.toString()
    ) {
      return res.status(403).json({
        message:
          "Unauthorized action",
      });
    }


    schedule.status =
      "completed";

    schedule.completionNotified =
      true;


    await schedule.save();


    const populatedSchedule =
      await Schedule.findById(schedule._id)
        .populate(
          "practitionerId",
          "name email"
        )
        .populate(
          "patientId",
          "name email"
        );


    res.json({
      message:
        "Appointment marked as completed",
      schedule: populatedSchedule,
    });

  } catch (error) {

    console.error(
      "markCompleted error:",
      error
    );

    res.status(500).json({
      message:
        "Error marking appointment completed",
    });
  }
};


// =====================================================
// ADMIN - GET ALL SCHEDULES
// =====================================================

export const getAllSchedules = async (
  req,
  res
) => {

  try {

    const schedules =
      await Schedule.find()
        .populate(
          "practitionerId",
          "name email"
        )
        .populate(
          "patientId",
          "name email"
        )
        .sort({
          date: 1,
        });


    res.json(schedules);

  } catch (error) {

    console.error(
      "getAllSchedules error:",
      error
    );

    res.status(500).json({
      message:
        "Error fetching schedules",
    });
  }
};


// =====================================================
// ADMIN - DELETE SCHEDULE
// =====================================================

export const deleteSchedule = async (
  req,
  res
) => {

  try {

    const { scheduleId } =
      req.params;


    const schedule =
      await Schedule.findById(
        scheduleId
      );


    if (!schedule) {
      return res.status(404).json({
        message:
          "Schedule not found",
      });
    }


    await Schedule.findByIdAndDelete(
      scheduleId
    );


    res.json({
      message: "Schedule deleted",
    });

  } catch (error) {

    console.error(
      "deleteSchedule error:",
      error
    );

    res.status(500).json({
      message:
        "Error deleting schedule",
    });
  }
};


// =====================================================
// PRACTITIONER - MY SCHEDULES
// =====================================================

export const getPractitionerSchedules =
  async (req, res) => {

    try {

      const practitionerId =
        req.user.id;


      const schedules =
        await Schedule.find({
          practitionerId,
        })
          .populate(
            "patientId",
            "name email"
          )
          .sort({
            date: 1,
          });


      res.json(schedules);

    } catch (error) {

      console.error(
        "getPractitionerSchedules error:",
        error
      );

      res.status(500).json({
        message:
          "Error fetching practitioner schedules",
      });
    }
  };


// =====================================================
// PATIENT - MY APPOINTMENTS
// =====================================================

export const getPatientSchedules =
  async (req, res) => {

    try {

      const patientId =
        req.user.id;


      const schedules =
        await Schedule.find({
          patientId,
        })
          .populate(
            "practitionerId",
            "name email"
          )
          .sort({
            date: 1,
          });


      res.json(schedules);

    } catch (error) {

      console.error(
        "getPatientSchedules error:",
        error
      );

      res.status(500).json({
        message:
          "Error fetching patient schedules",
      });
    }
  };


// =====================================================
// GET AVAILABLE SLOTS
// =====================================================

export const getAvailableSlots =
  async (req, res) => {

    try {

      const {
        practitionerId,
      } = req.query;


      const filter = {
        status: "available",
      };


      if (practitionerId) {
        filter.practitionerId =
          practitionerId;
      }


      const slots =
        await Schedule.find(filter)
          .populate(
            "practitionerId",
            "name email"
          )
          .sort({
            date: 1,
          });


      res.json(slots);

    } catch (error) {

      console.error(
        "getAvailableSlots error:",
        error
      );

      res.status(500).json({
        message:
          "Error fetching slots",
      });
    }
  };


// =====================================================
// GET TIME SLOTS
// =====================================================

export const getTimeSlots =
  async (req, res) => {

    try {

      res.json(TIME_SLOTS);

    } catch (error) {

      console.error(
        "getTimeSlots error:",
        error
      );

      res.status(500).json({
        message:
          "Error fetching time slots",
      });
    }
  };