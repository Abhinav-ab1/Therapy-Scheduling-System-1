import React, {
  useEffect,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import { Line } from "react-chartjs-2";

import Calendar from "react-calendar";

import "react-calendar/dist/Calendar.css";

import "../styles/PatientDashboard.css";

import AIChatbot from "../AIChatbot";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const API =
  process.env.REACT_APP_API_URL ||
  "http://localhost:5000";

// ======================================================
// TIME SLOTS
// ======================================================

const TIME_SLOTS = {
  morning: "8AM - 12PM",
  afternoon: "12PM - 5PM",
  evening: "5PM - 8PM",
};

// ======================================================
// ID HELPER
// Works with MongoDB _id and old id format
// ======================================================

const getId = (object) => {
  if (!object) return null;

  return object._id || object.id || null;
};

// ======================================================
// PATIENT DASHBOARD
// ======================================================

const PatientDashboard = ({
  user,
  setUser,
}) => {

  const navigate = useNavigate();

  // --------------------------------------------------
  // State
  // --------------------------------------------------

  const [practitioners, setPractitioners] =
    useState([]);

  const [selectedPractitioner, setSelectedPractitioner] =
    useState(null);

  const [availableSlots, setAvailableSlots] =
    useState([]);

  const [patientSchedules, setPatientSchedules] =
    useState([]);

  const [bookingDate, setBookingDate] =
    useState("");

  const [bookingTimeSlot, setBookingTimeSlot] =
    useState("");

  const [bookingMsg, setBookingMsg] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  // Reschedule modal
  const [showRescheduleModal, setShowRescheduleModal] =
    useState(false);

  const [rescheduleAppointment, setRescheduleAppointment] =
    useState(null);

  const [rescheduleDate, setRescheduleDate] =
    useState("");

  const [rescheduleTimeSlot, setRescheduleTimeSlot] =
    useState("");

  const [rescheduleReason, setRescheduleReason] =
    useState("");

  // ==================================================
  // FETCH OPTIONS
  // ==================================================

  const buildFetchOptions = (options = {}) => {

    const headers = {
      ...(options.headers || {}),
    };

    if (
      options.body &&
      !headers["Content-Type"]
    ) {
      headers["Content-Type"] =
        "application/json";
    }

    const token =
      localStorage.getItem("token");

    if (token) {
      headers["Authorization"] =
        `Bearer ${token}`;
    }

    return {
      ...options,
      credentials: "include",
      headers,
    };
  };

  // ==================================================
  // SAFE JSON
  // ==================================================

  const safeJson = async (response) => {

    const text = await response.text();

    if (!text) {
      return null;
    }

    try {
      return JSON.parse(text);
    } catch (error) {
      console.error(
        "Server returned non-JSON:",
        text
      );

      throw new Error(
        "Server returned invalid response"
      );
    }
  };

  // ==================================================
  // INITIAL LOAD
  // ==================================================

  useEffect(() => {
    loadAll();
  }, []);

  // ==================================================
  // LOAD EVERYTHING
  // ==================================================

  const loadAll = async () => {

    setLoading(true);

    try {

      // ----------------------------------------------
      // Get users
      // ----------------------------------------------

      const usersResponse =
        await fetch(
          `${API}/api/auth/users`,
          buildFetchOptions({
            method: "GET",
          })
        );

      // ----------------------------------------------
      // Get patient appointments
      // ----------------------------------------------

      const schedulesResponse =
        await fetch(
          `${API}/api/schedules/patient`,
          buildFetchOptions({
            method: "GET",
          })
        );

      // ----------------------------------------------
      // Parse users
      // ----------------------------------------------

      let usersData = [];

      if (usersResponse.ok) {
        usersData =
          await safeJson(usersResponse);
      }

      // ----------------------------------------------
      // Parse schedules
      // ----------------------------------------------

      let schedulesData = [];

      if (schedulesResponse.ok) {
        schedulesData =
          await safeJson(schedulesResponse);
      }

      // ----------------------------------------------
      // Ensure arrays
      // ----------------------------------------------

      if (!Array.isArray(usersData)) {
        usersData = [];
      }

      if (!Array.isArray(schedulesData)) {
        schedulesData = [];
      }

      // ----------------------------------------------
      // Only practitioners
      // ----------------------------------------------

      const practitionerList =
        usersData.filter(
          (u) =>
            u.role === "practitioner"
        );

      setPractitioners(
        practitionerList
      );

      setPatientSchedules(
        schedulesData
      );

      // ----------------------------------------------
      // Refresh available slots
      // ----------------------------------------------

      if (selectedPractitioner) {

        const practitionerId =
          getId(
            selectedPractitioner
          );

        if (practitionerId) {
          await fetchAvailableSlots(
            practitionerId
          );
        }
      }

    } catch (error) {

      console.error(
        "loadAll error:",
        error
      );

    } finally {

      setLoading(false);
    }
  };

  // ==================================================
  // FETCH AVAILABLE SLOTS
  // ==================================================

  const fetchAvailableSlots =
    async (practitionerId) => {

      try {

        setAvailableSlots([]);

        const url =
          new URL(
            `${API}/api/schedules/available`
          );

        if (practitionerId) {

          url.searchParams.append(
            "practitionerId",
            practitionerId
          );
        }

        const response =
          await fetch(
            url.toString(),
            buildFetchOptions({
              method: "GET",
            })
          );

        if (!response.ok) {

          console.error(
            "Available slots request failed:",
            response.status
          );

          setAvailableSlots([]);

          return;
        }

        const data =
          await safeJson(response);

        setAvailableSlots(
          Array.isArray(data)
            ? data
            : []
        );

      } catch (error) {

        console.error(
          "fetchAvailableSlots error:",
          error
        );

        setAvailableSlots([]);
      }
    };

  // ==================================================
  // SELECT PRACTITIONER
  // ==================================================

  const handlePractitionerSelect =
    async (event) => {

      const practitionerId =
        event.target.value;

      const practitioner =
        practitioners.find(
          (p) =>
            String(getId(p)) ===
            String(practitionerId)
        );

      setSelectedPractitioner(
        practitioner || null
      );

      if (practitioner) {

        await fetchAvailableSlots(
          getId(practitioner)
        );

      } else {

        setAvailableSlots([]);
      }
    };

  // ==================================================
  // FORMAT SLOT
  // ==================================================

  const formatSlotDisplay =
    (schedule) => {

      if (!schedule) {
        return "";
      }

      const date =
        new Date(
          schedule.date
        ).toLocaleDateString();

      const timeSlotLabel =
        TIME_SLOTS[
          schedule.timeSlot
        ] ||
        schedule.timeSlot ||
        "";

      // If custom interval exists
      if (
        schedule.notes &&
        schedule.notes.includes(
          "Booked for interval:"
        )
      ) {

        const match =
          schedule.notes.match(
            /Booked for interval: (.+)/
          );

        if (match) {

          return `${date} - ${match[1]}`;
        }
      }

      return `${date} - ${timeSlotLabel}`;
    };

  // ==================================================
  // BOOK EXISTING SLOT
  // ==================================================

  const handleBookSlot =
    async (scheduleId) => {

      if (!scheduleId) {
        setBookingMsg(
          "Invalid schedule ID"
        );

        return;
      }

      try {

        const response =
          await fetch(
            `${API}/api/schedules/book`,
            buildFetchOptions({
              method: "POST",

              body: JSON.stringify({
                scheduleId,
              }),
            })
          );

        const data =
          await safeJson(response);

        if (!response.ok) {

          throw new Error(
            data?.message ||
              "Booking failed"
          );
        }

        setBookingMsg(
          "Slot booked successfully!"
        );

        await refreshAfterChange();

      } catch (error) {

        console.error(
          "Book slot error:",
          error
        );

        setBookingMsg(
          `Error: ${error.message}`
        );

      } finally {

        setTimeout(
          () => setBookingMsg(""),
          3000
        );
      }
    };

  // ==================================================
  // BOOK CUSTOM SLOT
  // ==================================================

  const handleBookCustom =
    async (event) => {

      event.preventDefault();

      if (!selectedPractitioner) {

        setBookingMsg(
          "Please select a practitioner first"
        );

        setTimeout(
          () => setBookingMsg(""),
          3000
        );

        return;
      }

      if (
        !bookingDate ||
        !bookingTimeSlot
      ) {

        setBookingMsg(
          "Please select both date and time slot"
        );

        setTimeout(
          () => setBookingMsg(""),
          3000
        );

        return;
      }

      try {

        const practitionerId =
          getId(
            selectedPractitioner
          );

        const response =
          await fetch(
            `${API}/api/schedules/book-custom`,
            buildFetchOptions({
              method: "POST",

              body: JSON.stringify({
                practitionerId,
                date: bookingDate,
                timeSlot:
                  bookingTimeSlot,
              }),
            })
          );

        const data =
          await safeJson(response);

        if (!response.ok) {

          throw new Error(
            data?.message ||
              "Booking failed"
          );
        }

        setBookingMsg(
          "Custom appointment booked successfully!"
        );

        setBookingDate("");

        setBookingTimeSlot("");

        await refreshAfterChange();

      } catch (error) {

        console.error(
          "Book custom error:",
          error
        );

        setBookingMsg(
          `Error: ${error.message}`
        );

      } finally {

        setTimeout(
          () => setBookingMsg(""),
          3000
        );
      }
    };

  // ==================================================
  // REFRESH AFTER BOOK/CANCEL/RESCHEDULE
  // ==================================================

  const refreshAfterChange =
    async () => {

      try {

        const response =
          await fetch(
            `${API}/api/schedules/patient`,
            buildFetchOptions({
              method: "GET",
            })
          );

        if (response.ok) {

          const data =
            await safeJson(response);

          setPatientSchedules(
            Array.isArray(data)
              ? data
              : []
          );
        }

        if (selectedPractitioner) {

          await fetchAvailableSlots(
            getId(
              selectedPractitioner
            )
          );
        }

      } catch (error) {

        console.error(
          "refreshAfterChange error:",
          error
        );
      }
    };

  // ==================================================
  // OPEN RESCHEDULE MODAL
  // ==================================================

  const openRescheduleModal =
    (appointment) => {

      setRescheduleAppointment(
        appointment
      );

      setRescheduleDate("");

      setRescheduleTimeSlot("");

      setRescheduleReason("");

      setShowRescheduleModal(true);
    };

  // ==================================================
  // CLOSE RESCHEDULE MODAL
  // ==================================================

  const closeRescheduleModal =
    () => {

      setShowRescheduleModal(
        false
      );

      setRescheduleAppointment(
        null
      );
    };

  // ==================================================
  // SUBMIT RESCHEDULE
  // ==================================================

  const handleRescheduleSubmit =
    async (event) => {

      event.preventDefault();

      if (
        !rescheduleDate ||
        !rescheduleTimeSlot
      ) {

        setBookingMsg(
          "Please select both new date and time slot"
        );

        setTimeout(
          () => setBookingMsg(""),
          3000
        );

        return;
      }

      try {

        const scheduleId =
          getId(
            rescheduleAppointment
          );

        const response =
          await fetch(
            `${API}/api/schedules/reschedule`,
            buildFetchOptions({
              method: "POST",

              body: JSON.stringify({
                scheduleId,

                newDate:
                  rescheduleDate,

                newTimeSlot:
                  rescheduleTimeSlot,

                reason:
                  rescheduleReason,
              }),
            })
          );

        const data =
          await safeJson(response);

        if (!response.ok) {

          throw new Error(
            data?.message ||
              "Reschedule request failed"
          );
        }

        setBookingMsg(
          "Reschedule request sent successfully!"
        );

        closeRescheduleModal();

        await refreshAfterChange();

      } catch (error) {

        console.error(
          "Reschedule error:",
          error
        );

        setBookingMsg(
          `Error: ${error.message}`
        );

      } finally {

        setTimeout(
          () => setBookingMsg(""),
          3000
        );
      }
    };

  // ==================================================
  // CANCEL APPOINTMENT
  // ==================================================

  const handleCancelAppointment =
    async (scheduleId) => {

      const confirmed =
        window.confirm(
          "Are you sure you want to cancel this appointment?"
        );

      if (!confirmed) {
        return;
      }

      try {

        const response =
          await fetch(
            `${API}/api/schedules/cancel`,
            buildFetchOptions({
              method: "POST",

              body: JSON.stringify({
                scheduleId,
              }),
            })
          );

        const data =
          await safeJson(response);

        if (!response.ok) {

          throw new Error(
            data?.message ||
              "Cancel failed"
          );
        }

        setBookingMsg(
          "Appointment cancelled successfully"
        );

        await refreshAfterChange();

      } catch (error) {

        console.error(
          "Cancel appointment error:",
          error
        );

        setBookingMsg(
          `Error: ${error.message}`
        );

      } finally {

        setTimeout(
          () => setBookingMsg(""),
          3000
        );
      }
    };

  // ==================================================
  // LOGOUT
  // ==================================================

  const handleLogout =
    () => {

      localStorage.removeItem(
        "token"
      );

      localStorage.removeItem(
        "user"
      );

      setUser(null);

      navigate("/login");
    };

  // ==================================================
  // STATISTICS
  // ==================================================

  const completed =
    patientSchedules.filter(
      (schedule) =>
        schedule.status ===
        "completed"
    ).length;

  const upcoming =
    patientSchedules.filter(
      (schedule) =>
        schedule.status ===
        "booked"
    ).length;

  const progressTotal =
    completed + upcoming;

  const progressPercentage =
    progressTotal === 0
      ? 0
      : (completed /
          progressTotal) *
        100;

  // ==================================================
  // CHART
  // ==================================================

  const chartData = {

    labels: [
      "Week 1",
      "Week 2",
      "Week 3",
      "Week 4",
    ],

    datasets: [
      {
        label: "Sessions",

        data: [
          0,
          0,
          upcoming,
          completed,
        ],

        borderColor: "#50b89b",

        backgroundColor:
          "rgba(80,184,155,0.2)",

        fill: true,
      },
    ],
  };

  // ==================================================
  // LOADING
  // ==================================================

  if (loading) {

    return (
      <div className="p-8 text-center">
        Loading dashboard...
      </div>
    );
  }

  // ==================================================
  // UI
  // ==================================================

  return (
    <main className="dashboard-container">

      {/* ==================================================
          HEADER
      ================================================== */}

      <header className="dashboard-header">

        <div className="welcome-section">

          <span className="welcome-text">
            Welcome
          </span>

          <h1 className="user-name">
            {user?.name ||
              user?.username ||
              "Patient"}
          </h1>

          <p className="user-email">
            {user?.email}
          </p>

        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
          }}
        >

          <button
            className="logout-btn"
            onClick={() =>
              navigate("/")
            }
          >
            Home
          </button>

          <button
            className="logout-btn"
            onClick={handleLogout}
          >
            Logout
          </button>

        </div>

      </header>

      {/* ==================================================
          TOP CARDS
      ================================================== */}

      <section className="top-cards-section">

        <div className="card card-session">

          <div className="card-content">

            <h3>
              Upcoming Therapy Sessions
            </h3>

            <p>
              {upcoming} scheduled
            </p>

          </div>

        </div>

        <div className="card card-progress">

          <div className="card-content">

            <h3>
              Progress
            </h3>

            <div className="progress-bar-container">

              <div
                className="progress-bar"
                style={{
                  width: `${progressPercentage}%`,
                }}
              />

            </div>

            <p>
              {completed} complete
            </p>

          </div>

        </div>

        <div className="card card-notifications">

          <div className="card-content">

            <h3>
              Notifications
            </h3>

            <p>
              —
            </p>

          </div>

        </div>

      </section>

      {/* ==================================================
          MAIN CONTENT
      ================================================== */}

      <section className="main-content">

        {/* ==================================================
            LEFT COLUMN
        ================================================== */}

        <div className="left-column">

          {/* QUICK STATS */}

          <div className="card card-quick-stats">

            <h3>
              Quick Stats
            </h3>

            <Line
              data={chartData}
              options={{
                responsive: true,
              }}
            />

          </div>

          {/* BOOKING */}

          <div className="card card-book-slot">

            <h3>
              Book a Therapy Session
            </h3>

            {/* PRACTITIONER */}

            <label>
              Choose Practitioner
            </label>

            <select
              value={
                getId(
                  selectedPractitioner
                ) || ""
              }
              onChange={
                handlePractitionerSelect
              }
            >

              <option value="">
                -- Select practitioner --
              </option>

              {practitioners.map(
                (practitioner) => {

                  const id =
                    getId(
                      practitioner
                    );

                  const displayName =
                    practitioner.name ||
                    practitioner.fullName ||
                    practitioner.username ||
                    "Practitioner";

                  return (
                    <option
                      key={id}
                      value={id}
                    >
                      {displayName}
                    </option>
                  );
                }
              )}

            </select>

            {/* AVAILABLE SLOTS */}

            <div className="available-slots-section">

              <h4>
                Available Slots
              </h4>

              {availableSlots.length ===
                0 && (
                <p className="slot-info">
                  {selectedPractitioner
                    ? "No slots available"
                    : "Select a practitioner to view available slots"}
                </p>
              )}

              <ul className="slot-list">

                {availableSlots.map(
                  (slot) => {

                    const slotId =
                      getId(slot);

                    return (
                      <li
                        key={slotId}
                        className="slot-item"
                      >

                        <span>
                          {formatSlotDisplay(
                            slot
                          )}
                        </span>

                        <button
                          className="btn-book"
                          onClick={() =>
                            handleBookSlot(
                              slotId
                            )
                          }
                        >
                          Book
                        </button>

                      </li>
                    );
                  }
                )}

              </ul>

            </div>

            <hr className="section-divider" />

            {/* CUSTOM BOOKING */}

            <form
              onSubmit={
                handleBookCustom
              }
              className="custom-booking-form"
            >

              <label>
                Or create custom appointment
              </label>

              <input
                type="date"
                value={bookingDate}
                onChange={(event) =>
                  setBookingDate(
                    event.target.value
                  )
                }
                min={
                  new Date()
                    .toISOString()
                    .slice(0, 10)
                }
                required
              />

              <select
                value={
                  bookingTimeSlot
                }
                onChange={(event) =>
                  setBookingTimeSlot(
                    event.target.value
                  )
                }
                required
              >

                <option value="">
                  -- Select Time Slot --
                </option>

                {Object.entries(
                  TIME_SLOTS
                ).map(
                  ([key, label]) => (
                    <option
                      key={key}
                      value={key}
                    >
                      {label}
                    </option>
                  )
                )}

              </select>

              <button
                type="submit"
                className="btn-book"
              >
                Book Custom Slot
              </button>

            </form>

            {/* MESSAGE */}

            {bookingMsg && (
              <div className="success-message">
                {bookingMsg}
              </div>
            )}

          </div>

        </div>

        {/* ==================================================
            RIGHT COLUMN
        ================================================== */}

        <div className="right-column">

          <div className="card card-calendar">

            <h3>
              Your Upcoming Sessions
            </h3>

            <Calendar
              tileContent={({
                date,
              }) => {

                const match =
                  patientSchedules.find(
                    (schedule) => {

                      const sameDate =
                        new Date(
                          schedule.date
                        ).toDateString() ===
                        date.toDateString();

                      return (
                        sameDate &&
                        schedule.status ===
                          "booked"
                      );
                    }
                  );

                if (!match) {
                  return null;
                }

                const practitioner =
                  match.practitioner;

                return (
                  <div className="calendar-badge">

                    {practitioner?.name ||
                      practitioner?.username ||
                      "Practitioner"}

                  </div>
                );
              }}
            />

            {/* ==================================================
                APPOINTMENTS
            ================================================== */}

            <div className="appointments-list-section">

              <h4>
                My Appointments
              </h4>

              {patientSchedules.length ===
                0 ? (

                <p className="slot-info">
                  No appointments
                </p>

              ) : (

                patientSchedules.map(
                  (schedule) => {

                    const scheduleId =
                      getId(schedule);

                    const practitioner =
                      schedule.practitioner;

                    return (
                      <div
                        key={scheduleId}
                        className="appointment-item"
                      >

                        <p>

                          {formatSlotDisplay(
                            schedule
                          )}

                          {" — "}

                          {practitioner?.name ||
                            practitioner?.username ||
                            "Practitioner"}

                          {" "}

                          <span
                            className={`status status-${schedule.status}`}
                          >
                            ({schedule.status})
                          </span>

                        </p>

                        {/* BOOKED */}

                        {schedule.status ===
                          "booked" && (

                          <div className="appointment-actions">

                            <button
                              onClick={() =>
                                openRescheduleModal(
                                  schedule
                                )
                              }
                              className="btn-reschedule"
                            >
                              Reschedule
                            </button>

                            <button
                              onClick={() =>
                                handleCancelAppointment(
                                  scheduleId
                                )
                              }
                              className="btn-cancel"
                            >
                              Cancel
                            </button>

                          </div>
                        )}

                        {/* RESCHEDULE REQUEST */}

                        {schedule.status ===
                          "reschedule_requested" && (

                          <div className="reschedule-info">

                            <p>
                              <small>

                                Reschedule requested for:

                                {" "}

                                {schedule.rescheduleDate
                                  ? new Date(
                                      schedule.rescheduleDate
                                    ).toLocaleDateString()
                                  : "N/A"}

                                {" - "}

                                {TIME_SLOTS[
                                  schedule
                                    .rescheduleTimeSlot
                                ] ||
                                  schedule.rescheduleTimeSlot ||
                                  "N/A"}

                              </small>
                            </p>

                            {schedule.reason && (
                              <p>
                                <small>
                                  Reason:{" "}
                                  {schedule.reason}
                                </small>
                              </p>
                            )}

                          </div>
                        )}

                      </div>
                    );
                  }
                )
              )}

            </div>

          </div>

        </div>

      </section>

      {/* ==================================================
          RESCHEDULE MODAL
      ================================================== */}

      {showRescheduleModal && (

        <div className="modal-overlay">

          <div className="modal-content">

            <div className="modal-header">

              <h3>
                Reschedule Appointment
              </h3>

              <button
                className="modal-close"
                onClick={
                  closeRescheduleModal
                }
              >
                ×
              </button>

            </div>

            <form
              onSubmit={
                handleRescheduleSubmit
              }
            >

              {/* CURRENT */}

              <div className="form-group">

                <label>
                  Current Appointment:
                </label>

                <p>
                  {rescheduleAppointment
                    ? formatSlotDisplay(
                        rescheduleAppointment
                      )
                    : "N/A"}
                </p>

              </div>

              {/* DATE */}

              <div className="form-group">

                <label>
                  New Date:
                </label>

                <input
                  type="date"
                  value={
                    rescheduleDate
                  }
                  onChange={(event) =>
                    setRescheduleDate(
                      event.target.value
                    )
                  }
                  min={
                    new Date()
                      .toISOString()
                      .slice(0, 10)
                  }
                  required
                />

              </div>

              {/* TIME SLOT */}

              <div className="form-group">

                <label>
                  New Time Slot:
                </label>

                <select
                  value={
                    rescheduleTimeSlot
                  }
                  onChange={(event) =>
                    setRescheduleTimeSlot(
                      event.target.value
                    )
                  }
                  required
                >

                  <option value="">
                    -- Select Time Slot --
                  </option>

                  {Object.entries(
                    TIME_SLOTS
                  ).map(
                    ([key, label]) => (

                      <option
                        key={key}
                        value={key}
                      >
                        {label}
                      </option>

                    )
                  )}

                </select>

              </div>

              {/* REASON */}

              <div className="form-group">

                <label>
                  Reason (optional):
                </label>

                <textarea
                  value={
                    rescheduleReason
                  }
                  onChange={(event) =>
                    setRescheduleReason(
                      event.target.value
                    )
                  }
                  placeholder="Please provide a reason for rescheduling..."
                  rows="3"
                />

              </div>

              {/* BUTTONS */}

              <div className="modal-actions">

                <button
                  type="button"
                  onClick={
                    closeRescheduleModal
                  }
                  className="btn-secondary"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn-primary"
                >
                  Send Request
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* ==================================================
          AYURSUTRA AI ASSISTANT
      ================================================== */}

      <AIChatbot />

    </main>
  );
};

export default PatientDashboard;