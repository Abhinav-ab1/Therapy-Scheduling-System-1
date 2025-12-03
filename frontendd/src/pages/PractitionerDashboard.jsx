import React, { useState, useEffect } from "react";
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
import { Line } from "react-chartjs-2";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "../styles/PractitionerDashboard.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

// Time slots definition - 4-hour blocks
const TIME_SLOTS = {
  'morning': '8AM - 12PM',
  'afternoon': '12PM - 5PM',
  'evening': '5PM - 8PM'
};

// 2-hour intervals within each 4-hour block
const TIME_INTERVALS = {
  'morning': {
    'morning_early': '8AM - 10AM',
    'morning_late': '10AM - 12PM'
  },
  'afternoon': {
    'afternoon_early': '12PM - 2PM',
    'afternoon_late': '3PM - 5PM'
  },
  'evening': {
    'evening_early': '5PM - 6:30PM',
    'evening_late': '6:30PM - 8PM'
  }
};

const PractitionerDashboard = ({ user, setUser }) => {
  const [schedules, setSchedules] = useState([]);
  const [newSlotDate, setNewSlotDate] = useState("");
  const [newSlotTimeSlot, setNewSlotTimeSlot] = useState("");
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState("");
  
  // Helper to build fetch options (supports both token and session)
  const buildFetchOptions = (opts = {}) => {
    const headers = opts.headers ?? {};
    if (!headers["Content-Type"] && opts.body) headers["Content-Type"] = "application/json";

    // Try token first, then fall back to session
    const token = localStorage.getItem("token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return {
      credentials: "include", // keep cookie/session compatibility
      ...opts,
      headers,
    };
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      const res = await fetch(`${API}/api/schedules/practitioner`, buildFetchOptions());
      if (res.ok) {
        const data = await res.json();
        setSchedules(data);
      } else {
        console.error("Failed to fetch schedules:", res.statusText);
      }
    } catch (err) {
      console.error("fetchSchedules error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    if (!newSlotDate || !newSlotTimeSlot) {
      setShowSuccess("❌ Please select both date and time slot");
      setTimeout(() => setShowSuccess(""), 3000);
      return;
    }

    try {
      const res = await fetch(`${API}/api/schedules/create-slot`, buildFetchOptions({
        method: "POST",
        body: JSON.stringify({ date: newSlotDate, timeSlot: newSlotTimeSlot }),
      }));
      
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to create slot");
      
      setShowSuccess("✅ New 4-hour availability block created successfully!");
      setNewSlotDate("");
      setNewSlotTimeSlot("");
      await fetchSchedules(); // refresh schedules immediately
      setTimeout(() => setShowSuccess(""), 3000);
    } catch (err) {
      console.error("handleCreateSlot error:", err);
      setShowSuccess(`❌ ${err.message}`);
      setTimeout(() => setShowSuccess(""), 3000);
    }
  };

  const handleApprove = async (id) => {
    try {
      const res = await fetch(`${API}/api/schedules/approve-reschedule`, buildFetchOptions({
        method: "POST",
        body: JSON.stringify({ scheduleId: id }),
      }));
      
      if (res.ok) {
        setShowSuccess("✅ Reschedule approved");
        fetchSchedules();
        setTimeout(() => setShowSuccess(""), 3000);
      } else {
        const data = await res.json();
        throw new Error(data?.message || "Failed to approve reschedule");
      }
    } catch (err) {
      console.error("handleApprove error:", err);
      setShowSuccess(`❌ ${err.message}`);
      setTimeout(() => setShowSuccess(""), 3000);
    }
  };

  const handleReject = async (id) => {
    try {
      const res = await fetch(`${API}/api/schedules/reject-reschedule`, buildFetchOptions({
        method: "POST",
        body: JSON.stringify({ scheduleId: id }),
      }));
      
      if (res.ok) {
        setShowSuccess("✅ Reschedule rejected");
        fetchSchedules();
        setTimeout(() => setShowSuccess(""), 3000);
      } else {
        const data = await res.json();
        throw new Error(data?.message || "Failed to reject reschedule");
      }
    } catch (err) {
      console.error("handleReject error:", err);
      setShowSuccess(`❌ ${err.message}`);
      setTimeout(() => setShowSuccess(""), 3000);
    }
  };

  const handleComplete = async (id) => {
    try {
      const res = await fetch(`${API}/api/schedules/mark-completed`, buildFetchOptions({
        method: "POST",
        body: JSON.stringify({ scheduleId: id }),
      }));
      
      if (res.ok) {
        setShowSuccess("✅ Appointment marked as completed");
        fetchSchedules();
        setTimeout(() => setShowSuccess(""), 3000);
      } else {
        const data = await res.json();
        throw new Error(data?.message || "Failed to mark as completed");
      }
    } catch (err) {
      console.error("handleComplete error:", err);
      setShowSuccess(`❌ ${err.message}`);
      setTimeout(() => setShowSuccess(""), 3000);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
  localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/login";
  };

  const formatSlotDisplay = (schedule) => {
    const date = new Date(schedule.date).toLocaleDateString();
    const timeSlotLabel = TIME_SLOTS[schedule.timeSlot] || schedule.timeSlot;
    
    // For practitioners, show the full 4-hour slot, but note if a specific interval was booked
    let display = `${date} - ${timeSlotLabel}`;
    if (schedule.bookedInterval) {
      // Get the interval label from our mapping
      const intervalLabel = getIntervalLabel(schedule.timeSlot, schedule.bookedInterval);
      display += ` (Patient booked: ${intervalLabel})`;
    } else if (schedule.notes && schedule.notes.includes("Booked for interval:")) {
      const intervalMatch = schedule.notes.match(/Booked for interval: (.+)/);
      if (intervalMatch) {
        display += ` (Patient chose: ${intervalMatch[1]})`;
      }
    }
    return display;
  };

  const getIntervalLabel = (timeSlot, intervalKey) => {
    if (TIME_INTERVALS[timeSlot] && TIME_INTERVALS[timeSlot][intervalKey]) {
      return TIME_INTERVALS[timeSlot][intervalKey];
    }
    return intervalKey; // fallback to the key itself
  };

  if (loading) return <div className="p-8 text-center">Loading dashboard...</div>;

  const completed = schedules.filter((s) => s.status === "completed").length;
  const upcoming = schedules.filter((s) => s.status === "booked").length;
  const rescheduleRequests = schedules.filter(
    (s) => s.status === "reschedule_requested"
  );

  // dates for calendar highlights
  const upcomingDates = schedules
    .filter((s) => s.status === "booked")
    .map((s) => new Date(s.date));

  const chartData = {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    datasets: [
      {
        label: "Sessions Completed",
        data: [2, 3, 4, completed],
        borderColor: "#50b89b",
        backgroundColor: "rgba(80, 184, 155, 0.2)",
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointBackgroundColor: "#50b89b",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, ticks: { stepSize: 1 } },
    },
  };

  return (
    <main className="dashboard-container">
      <header className="dashboard-header">
        <div className="welcome-section">
          <span className="welcome-text">Welcome back,</span>
          <h1 className="user-name">{user?.name || user?.username || "Practitioner"}</h1>
          <p className="user-email">{user?.email}</p>
        </div>
        <div className="header-actions">
          <div className="profile-pic-container">
            <img src="/doctor.png" alt="Profile" className="profile-pic" />
          </div>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* Success/Error Messages */}
      {showSuccess && (
        <div className={`alert-message ${showSuccess.includes("❌") ? "alert-error" : "alert-success"}`}>
          {showSuccess}
        </div>
      )}

      {/* Top Cards */}
      <section className="top-cards-section">
        <div className="card card-session">
          <div className="card-content">
            <h3>Upcoming Sessions</h3>
            <p>{upcoming} booked</p>
            {/* Calendar here */}
            <Calendar
              tileContent={({ date }) => {
                const match = upcomingDates.find(
                  (d) => d.toDateString() === date.toDateString()
                );
                if (match) {
                  const appt = schedules.find(
                    (s) =>
                      new Date(s.date).toDateString() === date.toDateString() &&
                      s.status === "booked"
                  );
                  return (
                    <span className="calendar-badge">
                      {appt?.patient?.name || appt?.patient?.username || "Patient"}
                    </span>
                  );
                }
                return null;
              }}
            />
          </div>
        </div>

        <div className="card card-progress">
          <div className="card-content">
            <div className="progress-header">
              <i className="fas fa-arrow-up"></i>
              <h3>Progress</h3>
            </div>
            <div className="progress-bar-container">
              <div
                className="progress-bar"
                style={{
                  width: `${(completed / (completed + upcoming || 1)) * 100}%`,
                }}
              ></div>
            </div>
            <p>{completed} complete</p>
          </div>
        </div>

        <div className="card card-notifications">
          <div className="card-content">
            <div className="notif-header">
              <i className="fas fa-bell"></i>
              <h3>Reschedule Requests</h3>
            </div>
            <p>{rescheduleRequests.length} pending</p>
          </div>
        </div>
      </section>

      <section className="main-content">
        <div className="left-column">
          <div className="card card-quick-stats">
            <h3>Quick Stats</h3>
            <Line data={chartData} options={chartOptions} />
            <div className="stats-summary">
              <div className="stat">
                <span className="stat-value">{completed}</span>
                <span className="stat-label">Completed</span>
              </div>
              <div className="stat">
                <span className="stat-value">{upcoming}</span>
                <span className="stat-label">Upcoming</span>
              </div>
            </div>
          </div>

          <div className="card card-create-slot">
            <h3>Create 4-Hour Availability Block</h3>
            <p className="slot-info">
              Patients can book specific 2-hour intervals within your 4-hour blocks:<br/>
              • Morning (8AM-12PM): 8-10AM or 10AM-12PM<br/>
              • Afternoon (12-5PM): 12-2PM or 3-5PM<br/>
              • Evening (5-8PM): 5-6:30PM or 6:30-8PM
            </p>
            <form onSubmit={handleCreateSlot}>
              <label>Select Date:</label>
              <input
                type="date"
                value={newSlotDate}
                onChange={(e) => setNewSlotDate(e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
                required
              />
              
              <label>Select 4-Hour Time Block:</label>
              <select
                value={newSlotTimeSlot}
                onChange={(e) => setNewSlotTimeSlot(e.target.value)}
                required
              >
                <option value="">-- Choose Time Block --</option>
                {Object.entries(TIME_SLOTS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label} (4-hour block)
                  </option>
                ))}
              </select>
              
              <button type="submit" className="btn-submit">Create Availability Block</button>
            </form>
          </div>
        </div>

        <div className="right-column">
          <div className="card card-reschedule">
            <h3>Reschedule Requests</h3>
            {rescheduleRequests.length > 0 ? (
              rescheduleRequests.map((req) => (
                <div key={req.id} className="reschedule-item">
                  <p>
                    <strong>Patient:</strong> {req.patient?.name || req.patient?.username || "Unknown"}<br/>
                    <strong>Current:</strong> {formatSlotDisplay(req)}<br/>
                    <strong>Requested:</strong> {new Date(req.rescheduleDate).toLocaleDateString()} - {
                      req.rescheduleInterval 
                        ? getIntervalLabel(req.rescheduleTimeSlot, req.rescheduleInterval)
                        : TIME_SLOTS[req.rescheduleTimeSlot] || req.rescheduleTimeSlot
                    }<br/>
                    {req.reason && <><strong>Reason:</strong> {req.reason}</>}
                  </p>
                  <div className="reschedule-actions">
                    <button 
                      onClick={() => handleApprove(req.id)}
                      className="btn-approve"
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => handleReject(req.id)}
                      className="btn-reject"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p>No reschedule requests.</p>
            )}
          </div>

          <div className="card card-appointments">
            <h3>All Appointments</h3>
            <div className="appointments-scroll">
              {schedules.length === 0 ? (
                <p className="slot-info">No appointments yet.</p>
              ) : (
                schedules.map((s) => (
                  <div key={s.id} className="appointment-item">
                    <p>
                      <strong>{formatSlotDisplay(s)}</strong><br/>
                      Patient: {s.patient ? (s.patient.name || s.patient.username) : "Available slot"}<br/>
                      Status: <span className={`status status-${s.status}`}>({s.status})</span>
                      {s.notes && <><br/>Notes: {s.notes}</>}
                    </p>
                    {s.status === "booked" && (
                      <button 
                        onClick={() => handleComplete(s.id)}
                        className="btn-complete"
                      >
                        Mark Completed
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};
export default PractitionerDashboard;