import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import "../styles/PractitionerDashboard.css";

const API =
  process.env.REACT_APP_API_URL || "http://localhost:5000";

const TIME_SLOTS = {
  morning: "8 AM - 12 PM",
  afternoon: "12 PM - 5 PM",
  evening: "5 PM - 8 PM",
};

const PractitionerDashboard = ({ user, setUser }) => {
  const navigate = useNavigate();

  // =========================================================
  // STATE
  // =========================================================

  const [schedules, setSchedules] = useState([]);

  const [loading, setLoading] = useState(true);

  const [creatingSlot, setCreatingSlot] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);

  const [message, setMessage] = useState("");

  const [error, setError] = useState("");

  const [slotForm, setSlotForm] = useState({
    date: "",
    timeSlot: "",
  });

  const [currentMonth, setCurrentMonth] = useState(
    new Date()
  );

  // =========================================================
  // AUTHENTICATION
  // =========================================================

  const getToken = () => {
    return localStorage.getItem("token");
  };

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    if (setUser) {
      setUser(null);
    }

    navigate("/login", { replace: true });
  }, [navigate, setUser]);

  // =========================================================
  // AUTHENTICATED FETCH
  // =========================================================

  const authFetch = useCallback(
    async (url, options = {}) => {
      const token = getToken();

      if (!token) {
        throw new Error(
          "Your login session has expired. Please login again."
        );
      }

      const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      };

      const response = await fetch(url, {
        ...options,
        headers,
        credentials: "include",
      });

      // Token expired / invalid
      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        if (setUser) {
          setUser(null);
        }

        navigate("/login", { replace: true });

        throw new Error(
          "Your login session has expired. Please login again."
        );
      }

      return response;
    },
    [navigate, setUser]
  );

  // =========================================================
  // LOAD PRACTITIONER SCHEDULES
  // =========================================================

  const loadSchedules = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      // Prevent dashboard from calling protected API without token
      if (!token) {
        setError(
          "Authorization token is missing. Please login again."
        );

        logout();
        return;
      }

      const response = await authFetch(
        `${API}/api/schedules/practitioner`,
        {
          method: "GET",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load practitioner schedules"
        );
      }

      /*
        Backend may return either:

        [
          {...},
          {...}
        ]

        or:

        {
          schedules: [...]
        }
      */

      let scheduleData = [];

      if (Array.isArray(data)) {
        scheduleData = data;
      } else if (Array.isArray(data.schedules)) {
        scheduleData = data.schedules;
      } else if (Array.isArray(data.data)) {
        scheduleData = data.data;
      }

      setSchedules(scheduleData);
    } catch (err) {
      console.error(
        "Load practitioner schedules error:",
        err
      );

      setError(
        err.message || "Unable to load practitioner schedules"
      );
    } finally {
      setLoading(false);
    }
  }, [authFetch, logout]);

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    // Make sure the logged-in account is actually a practitioner
    if (user && user.role !== "practitioner") {
      navigate("/login", { replace: true });
      return;
    }

    loadSchedules();
  }, [user, navigate, loadSchedules]);

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = () => {
    logout();
  };

  // =========================================================
  // CREATE SLOT FORM
  // =========================================================

  const handleSlotChange = (e) => {
    const { name, value } = e.target;

    setSlotForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =========================================================
  // CREATE THERAPY SLOT
  // =========================================================

  const handleCreateSlot = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!slotForm.date) {
      setError("Please select a therapy date.");
      return;
    }

    if (!slotForm.timeSlot) {
      setError("Please select a time slot.");
      return;
    }

    try {
      setCreatingSlot(true);

      const response = await authFetch(
        `${API}/api/schedules/create-slot`,
        {
          method: "POST",
          body: JSON.stringify({
            date: slotForm.date,
            timeSlot: slotForm.timeSlot,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to create therapy slot"
        );
      }

      setMessage(
        "Therapy slot created successfully."
      );

      setSlotForm({
        date: "",
        timeSlot: "",
      });

      await loadSchedules();
    } catch (err) {
      console.error("Create slot error:", err);

      setError(
        err.message || "Unable to create therapy slot"
      );
    } finally {
      setCreatingSlot(false);
    }
  };

  // =========================================================
  // APPROVE RESCHEDULE
  // =========================================================

  const approveReschedule = async (scheduleId) => {
    if (!scheduleId) {
      setError("Invalid appointment.");
      return;
    }

    try {
      setActionLoading(true);
      setMessage("");
      setError("");

      const response = await authFetch(
        `${API}/api/schedules/approve-reschedule`,
        {
          method: "POST",
          body: JSON.stringify({
            scheduleId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to approve reschedule"
        );
      }

      setMessage(
        "Reschedule request approved successfully."
      );

      await loadSchedules();
    } catch (err) {
      console.error(
        "Approve reschedule error:",
        err
      );

      setError(
        err.message || "Unable to approve reschedule"
      );
    } finally {
      setActionLoading(false);
    }
  };

  // =========================================================
  // REJECT RESCHEDULE
  // =========================================================

  const rejectReschedule = async (scheduleId) => {
    if (!scheduleId) {
      setError("Invalid appointment.");
      return;
    }

    try {
      setActionLoading(true);
      setMessage("");
      setError("");

      const response = await authFetch(
        `${API}/api/schedules/reject-reschedule`,
        {
          method: "POST",
          body: JSON.stringify({
            scheduleId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to reject reschedule"
        );
      }

      setMessage(
        "Reschedule request rejected successfully."
      );

      await loadSchedules();
    } catch (err) {
      console.error(
        "Reject reschedule error:",
        err
      );

      setError(
        err.message || "Unable to reject reschedule"
      );
    } finally {
      setActionLoading(false);
    }
  };

  // =========================================================
  // MARK THERAPY COMPLETED
  // =========================================================

  const markCompleted = async (scheduleId) => {
    if (!scheduleId) {
      setError("Invalid appointment.");
      return;
    }

    try {
      setActionLoading(true);
      setMessage("");
      setError("");

      const response = await authFetch(
        `${API}/api/schedules/mark-completed`,
        {
          method: "POST",
          body: JSON.stringify({
            scheduleId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to complete therapy"
        );
      }

      setMessage(
        "Therapy marked as completed successfully."
      );

      await loadSchedules();
    } catch (err) {
      console.error(
        "Mark completed error:",
        err
      );

      setError(
        err.message || "Unable to complete therapy"
      );
    } finally {
      setActionLoading(false);
    }
  };

  // =========================================================
  // DATE HELPERS
  // =========================================================

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "-";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getTimeSlotLabel = (timeSlot) => {
    return TIME_SLOTS[timeSlot] || timeSlot || "-";
  };

  const getPatientName = (schedule) => {
    if (schedule?.patientId?.name) {
      return schedule.patientId.name;
    }

    return "Patient";
  };

  const getPatientEmail = (schedule) => {
    if (schedule?.patientId?.email) {
      return schedule.patientId.email;
    }

    return "No email";
  };

  // =========================================================
  // UPCOMING APPOINTMENT CHECK
  // =========================================================

  const isUpcoming = (schedule) => {
    if (!schedule?.date) {
      return false;
    }

    const appointmentDate = new Date(
      schedule.date
    );

    const now = new Date();

    if (Number.isNaN(appointmentDate.getTime())) {
      return false;
    }

    return (
      appointmentDate >= now &&
      (
        schedule.status === "booked" ||
        schedule.status === "reschedule_requested"
      )
    );
  };

  // =========================================================
  // AVAILABLE SLOTS
  // =========================================================

  const availableSlots = useMemo(() => {
    return schedules
      .filter(
        (schedule) =>
          schedule.status === "available"
      )
      .sort(
        (a, b) =>
          new Date(a.date) -
          new Date(b.date)
      );
  }, [schedules]);

  // =========================================================
  // BOOKED APPOINTMENTS
  // =========================================================

  const bookedAppointments = useMemo(() => {
    return schedules
      .filter(
        (schedule) =>
          schedule.status === "booked"
      )
      .sort(
        (a, b) =>
          new Date(a.date) -
          new Date(b.date)
      );
  }, [schedules]);

  // =========================================================
  // COMPLETED THERAPIES
  // =========================================================

  const completedAppointments = useMemo(() => {
    return schedules
      .filter(
        (schedule) =>
          schedule.status === "completed"
      )
      .sort(
        (a, b) =>
          new Date(b.date) -
          new Date(a.date)
      );
  }, [schedules]);

  // =========================================================
  // RESCHEDULE REQUESTS
  // =========================================================

  const rescheduleRequests = useMemo(() => {
    return schedules
      .filter(
        (schedule) =>
          schedule.status ===
          "reschedule_requested"
      )
      .sort(
        (a, b) =>
          new Date(a.date) -
          new Date(b.date)
      );
  }, [schedules]);

  // =========================================================
  // UPCOMING APPOINTMENTS
  // =========================================================

  const upcomingAppointments = useMemo(() => {
    return schedules
      .filter(isUpcoming)
      .sort(
        (a, b) =>
          new Date(a.date) -
          new Date(b.date)
      );
  }, [schedules]);

  // =========================================================
  // WEEKLY GRAPH DATA
  // =========================================================

  const weeklyData = useMemo(() => {
    const now = new Date();

    return [3, 2, 1, 0].map(
      (weekIndex) => {
        const end = new Date(now);

        end.setHours(
          23,
          59,
          59,
          999
        );

        end.setDate(
          now.getDate() -
            weekIndex * 7
        );

        const start = new Date(end);

        start.setHours(
          0,
          0,
          0,
          0
        );

        start.setDate(
          end.getDate() - 6
        );

        const count =
          completedAppointments.filter(
            (appointment) => {
              const date = new Date(
                appointment.date
              );

              return (
                date >= start &&
                date <= end
              );
            }
          ).length;

        return {
          label: `Week ${4 - weekIndex}`,
          count,
        };
      }
    );
  }, [completedAppointments]);

  const maxGraphValue = Math.max(
    ...weeklyData.map(
      (item) => item.count
    ),
    1
  );

  // =========================================================
  // CALENDAR
  // =========================================================

  const year =
    currentMonth.getFullYear();

  const month =
    currentMonth.getMonth();

  const firstDay = new Date(
    year,
    month,
    1
  ).getDay();

  const daysInMonth =
    new Date(
      year,
      month + 1,
      0
    ).getDate();

  const calendarDays = [];

  for (
    let i = 0;
    i < firstDay;
    i++
  ) {
    calendarDays.push(null);
  }

  for (
    let day = 1;
    day <= daysInMonth;
    day++
  ) {
    calendarDays.push(day);
  }

  const getAppointmentsForDay = (
    day
  ) => {
    if (!day) {
      return [];
    }

    return upcomingAppointments.filter(
      (appointment) => {
        const date = new Date(
          appointment.date
        );

        return (
          date.getFullYear() === year &&
          date.getMonth() === month &&
          date.getDate() === day
        );
      }
    );
  };

  const previousMonth = () => {
    setCurrentMonth(
      new Date(
        year,
        month - 1,
        1
      )
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(
        year,
        month + 1,
        1
      )
    );
  };

  // =========================================================
  // LOADING SCREEN
  // =========================================================

  if (loading) {
    return (
      <div className="practitioner-loading">
        <div className="loading-spinner"></div>

        <p>
          Loading practitioner dashboard...
        </p>
      </div>
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="practitioner-dashboard">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="practitioner-header">

        <div>
          <p className="welcome-small">
            Practitioner Dashboard
          </p>

          <h1>
            Dr. {user?.name || "Practitioner"}
          </h1>

          <p className="practitioner-email">
            {user?.email || ""}
          </p>
        </div>

        <div className="header-actions">

          <button
            className="home-btn"
            onClick={() => navigate("/")}
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

      {/* =====================================================
          SUCCESS MESSAGE
      ===================================================== */}

      {message && (
        <div className="success-message">
          {message}
        </div>
      )}

      {/* =====================================================
          ERROR MESSAGE
      ===================================================== */}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* =====================================================
          STAT CARDS
      ===================================================== */}

      <section className="stats-grid">

        <div className="stat-card">
          <div className="stat-icon">
            📅
          </div>

          <div>
            <p>Upcoming Therapies</p>

            <h2>
              {upcomingAppointments.length}
            </h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            🟢
          </div>

          <div>
            <p>Available Slots</p>

            <h2>
              {availableSlots.length}
            </h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            👥
          </div>

          <div>
            <p>Booked Therapies</p>

            <h2>
              {bookedAppointments.length}
            </h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            ✅
          </div>

          <div>
            <p>Completed Therapies</p>

            <h2>
              {completedAppointments.length}
            </h2>
          </div>
        </div>

      </section>

      {/* =====================================================
          GRAPH + CALENDAR
      ===================================================== */}

      <section className="dashboard-grid">

        {/* ===================================================
            THERAPY GRAPH
        =================================================== */}

        <div className="dashboard-card graph-card">

          <div className="card-header">

            <div>
              <h2>
                Therapies Given
              </h2>

              <p>
                Completed therapy sessions
                over the last 4 weeks
              </p>
            </div>

            <span className="card-number">
              {completedAppointments.length}
            </span>

          </div>

          <div className="bar-chart">

            {weeklyData.map(
              (week) => (
                <div
                  className="bar-column"
                  key={week.label}
                >

                  <span className="bar-value">
                    {week.count}
                  </span>

                  <div
                    className="bar"
                    style={{
                      height: `${Math.max(
                        (week.count /
                          maxGraphValue) *
                          180,
                        week.count > 0
                          ? 20
                          : 4
                      )}px`,
                    }}
                  ></div>

                  <span className="bar-label">
                    {week.label}
                  </span>

                </div>
              )
            )}

          </div>

        </div>

        {/* ===================================================
            UPCOMING CALENDAR
        =================================================== */}

        <div className="dashboard-card calendar-card">

          <div className="card-header">

            <div>
              <h2>
                Upcoming Therapies
              </h2>

              <p>
                Scheduled patient appointments
              </p>
            </div>

          </div>

          <div className="calendar-navigation">

            <button
              onClick={previousMonth}
              type="button"
            >
              ‹
            </button>

            <strong>
              {currentMonth.toLocaleDateString(
                "en-US",
                {
                  month: "long",
                  year: "numeric",
                }
              )}
            </strong>

            <button
              onClick={nextMonth}
              type="button"
            >
              ›
            </button>

          </div>

          <div className="calendar-weekdays">

            {[
              "Sun",
              "Mon",
              "Tue",
              "Wed",
              "Thu",
              "Fri",
              "Sat",
            ].map((day) => (
              <span key={day}>
                {day}
              </span>
            ))}

          </div>

          <div className="calendar-grid">

            {calendarDays.map(
              (day, index) => {
                const appointments =
                  getAppointmentsForDay(
                    day
                  );

                return (
                  <div
                    key={index}
                    className={`calendar-day ${
                      appointments.length > 0
                        ? "has-appointment"
                        : ""
                    }`}
                  >

                    {day && (
                      <>
                        <span>
                          {day}
                        </span>

                        {appointments.length >
                          0 && (
                          <div className="appointment-dot">
                            {appointments.length}
                          </div>
                        )}

                      </>
                    )}

                  </div>
                );
              }
            )}

          </div>

          {/* NEXT SESSIONS */}

          <div className="calendar-appointments">

            <h3>
              Next Sessions
            </h3>

            {upcomingAppointments.length ===
            0 ? (
              <p className="empty-text">
                No upcoming therapies.
              </p>
            ) : (
              upcomingAppointments
                .slice(0, 4)
                .map((appointment) => (
                  <div
                    className="mini-appointment"
                    key={
                      appointment._id ||
                      appointment.id
                    }
                  >

                    <div>
                      <strong>
                        {formatDate(
                          appointment.date
                        )}
                      </strong>

                      <span>
                        {getTimeSlotLabel(
                          appointment.timeSlot
                        )}
                      </span>
                    </div>

                    <div className="patient-name">
                      {getPatientName(
                        appointment
                      )}
                    </div>

                  </div>
                ))
            )}

          </div>

        </div>

      </section>

      {/* =====================================================
          CREATE THERAPY SLOT
      ===================================================== */}

      <section className="dashboard-card create-slot-card">

        <div className="card-header">

          <div>
            <h2>
              Create Therapy Slot
            </h2>

            <p>
              Add a new available Panchakarma
              therapy slot
            </p>
          </div>

        </div>

        <form
          className="slot-form"
          onSubmit={handleCreateSlot}
        >

          <div className="form-group">

            <label htmlFor="therapy-date">
              Therapy Date
            </label>

            <input
              id="therapy-date"
              type="date"
              name="date"
              value={slotForm.date}
              onChange={handleSlotChange}
              min={
                new Date()
                  .toISOString()
                  .split("T")[0]
              }
              required
            />

          </div>

          <div className="form-group">

            <label htmlFor="time-slot">
              Time Slot
            </label>

            <select
              id="time-slot"
              name="timeSlot"
              value={slotForm.timeSlot}
              onChange={handleSlotChange}
              required
            >

              <option value="">
                -- Select Time Slot --
              </option>

              <option value="morning">
                Morning — 8 AM - 12 PM
              </option>

              <option value="afternoon">
                Afternoon — 12 PM - 5 PM
              </option>

              <option value="evening">
                Evening — 5 PM - 8 PM
              </option>

            </select>

          </div>

          <button
            type="submit"
            className="create-slot-btn"
            disabled={creatingSlot}
          >
            {creatingSlot
              ? "Creating..."
              : "+ Create Therapy Slot"}
          </button>

        </form>

      </section>

      {/* =====================================================
          AVAILABLE SLOTS
      ===================================================== */}

      <section className="dashboard-card">

        <div className="card-header">

          <div>
            <h2>
              My Therapy Slots
            </h2>

            <p>
              Slots currently available
              for patients
            </p>
          </div>

          <span className="badge green">
            {availableSlots.length} Available
          </span>

        </div>

        {availableSlots.length === 0 ? (
          <div className="empty-state">

            <div className="empty-icon">
              📅
            </div>

            <h3>
              No available slots
            </h3>

            <p>
              Create a new therapy slot above.
            </p>

          </div>
        ) : (

          <div className="slot-list">

            {availableSlots.map(
              (slot) => (

                <div
                  className="slot-item"
                  key={
                    slot._id ||
                    slot.id
                  }
                >

                  <div className="slot-date">

                    <strong>
                      {formatDate(
                        slot.date
                      )}
                    </strong>

                    <span>
                      {getTimeSlotLabel(
                        slot.timeSlot
                      )}
                    </span>

                  </div>

                  <span className="status-badge available">
                    Available
                  </span>

                </div>

              )
            )}

          </div>

        )}

      </section>

      {/* =====================================================
          PATIENT APPOINTMENTS
      ===================================================== */}

      <section className="dashboard-card">

        <div className="card-header">

          <div>
            <h2>
              Patient Appointments
            </h2>

            <p>
              Therapies booked by your patients
            </p>
          </div>

          <span className="badge blue">
            {bookedAppointments.length} Booked
          </span>

        </div>

        {bookedAppointments.length ===
        0 ? (

          <div className="empty-state">

            <div className="empty-icon">
              👥
            </div>

            <h3>
              No booked therapies
            </h3>

            <p>
              Patient appointments will
              appear here.
            </p>

          </div>

        ) : (

          <div className="appointment-list">

            {bookedAppointments.map(
              (appointment) => (

                <div
                  className="appointment-item"
                  key={
                    appointment._id ||
                    appointment.id
                  }
                >

                  <div className="appointment-info">

                    <div className="patient-avatar">
                      {getPatientName(
                        appointment
                      )
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div>

                      <h3>
                        {getPatientName(
                          appointment
                        )}
                      </h3>

                      <p>
                        {getPatientEmail(
                          appointment
                        )}
                      </p>

                      <span>
                        {formatDate(
                          appointment.date
                        )}
                        {" • "}
                        {getTimeSlotLabel(
                          appointment.timeSlot
                        )}
                      </span>

                    </div>

                  </div>

                  <button
                    className="complete-btn"
                    onClick={() =>
                      markCompleted(
                        appointment._id ||
                          appointment.id
                      )
                    }
                    disabled={
                      actionLoading
                    }
                  >
                    {actionLoading
                      ? "Processing..."
                      : "✓ Mark Completed"}
                  </button>

                </div>

              )
            )}

          </div>

        )}

      </section>

      {/* =====================================================
          RESCHEDULE REQUESTS
      ===================================================== */}

      <section className="dashboard-card">

        <div className="card-header">

          <div>
            <h2>
              Reschedule Requests
            </h2>

            <p>
              Review requests from patients
            </p>
          </div>

          <span className="badge orange">
            {rescheduleRequests.length} Pending
          </span>

        </div>

        {rescheduleRequests.length ===
        0 ? (

          <div className="empty-state small">

            <h3>
              No pending requests
            </h3>

            <p>
              You have no reschedule requests.
            </p>

          </div>

        ) : (

          <div className="request-list">

            {rescheduleRequests.map(
              (request) => (

                <div
                  className="request-item"
                  key={
                    request._id ||
                    request.id
                  }
                >

                  <div>

                    <h3>
                      {getPatientName(
                        request
                      )}
                    </h3>

                    <p>
                      Current appointment:
                      {" "}
                      {formatDate(
                        request.date
                      )}
                      {" • "}
                      {getTimeSlotLabel(
                        request.timeSlot
                      )}
                    </p>

                    <p className="requested-time">
                      Requested:
                      {" "}
                      {request.rescheduleDate
                        ? formatDate(
                            request.rescheduleDate
                          )
                        : "-"}
                      {" • "}
                      {getTimeSlotLabel(
                        request.rescheduleTimeSlot
                      )}
                    </p>

                    {request.reason && (
                      <p className="reason">
                        Reason:{" "}
                        {request.reason}
                      </p>
                    )}

                  </div>

                  <div className="request-actions">

                    <button
                      className="approve-btn"
                      onClick={() =>
                        approveReschedule(
                          request._id ||
                            request.id
                        )
                      }
                      disabled={
                        actionLoading
                      }
                    >
                      ✓ Approve
                    </button>

                    <button
                      className="reject-btn"
                      onClick={() =>
                        rejectReschedule(
                          request._id ||
                            request.id
                        )
                      }
                      disabled={
                        actionLoading
                      }
                    >
                      ✕ Reject
                    </button>

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </section>

      {/* =====================================================
          THERAPY HISTORY
      ===================================================== */}

      <section className="dashboard-card">

        <div className="card-header">

          <div>
            <h2>
              Therapy History
            </h2>

            <p>
              Previously completed therapies
            </p>
          </div>

          <span className="badge purple">
            {completedAppointments.length}{" "}
            Completed
          </span>

        </div>

        {completedAppointments.length ===
        0 ? (

          <div className="empty-state small">

            <h3>
              No completed therapies yet
            </h3>

            <p>
              Completed patient sessions
              will appear here.
            </p>

          </div>

        ) : (

          <div className="history-list">

            {completedAppointments.map(
              (appointment) => (

                <div
                  className="history-item"
                  key={
                    appointment._id ||
                    appointment.id
                  }
                >

                  <div>

                    <strong>
                      {getPatientName(
                        appointment
                      )}
                    </strong>

                    <span>
                      {getPatientEmail(
                        appointment
                      )}
                    </span>

                  </div>

                  <div className="history-date">

                    <strong>
                      {formatDate(
                        appointment.date
                      )}
                    </strong>

                    <span>
                      {getTimeSlotLabel(
                        appointment.timeSlot
                      )}
                    </span>

                  </div>

                  <span className="status-badge completed">
                    Completed
                  </span>

                </div>

              )
            )}

          </div>

        )}

      </section>

    </div>
  );
};

export default PractitionerDashboard;