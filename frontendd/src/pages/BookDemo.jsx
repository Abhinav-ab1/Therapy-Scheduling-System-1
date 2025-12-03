import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HashLink as Link } from "react-router-hash-link";
import "../styles/BookDemo.css";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

const BookDemo = ({ setUser }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    email: "",
    phone: "",
    dob: "",
    password: "",
    role: "patient",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.name || !formData.email || !formData.password) {
      setError("Please fill required fields");
      return;
    }

    try {
      const res = await fetch(`${API}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: formData.name + (formData.surname ? ` ${formData.surname}` : ""),
          email: formData.email,
          password: formData.password,
          role: formData.role,
          phone: formData.phone,
          dob: formData.dob,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Registration failed");
        return;
      }

      const user = data.user ?? data;
      if (setUser && user) setUser(user);

      if (user?.role === "practitioner") navigate("/practitioner-dashboard");
      else navigate("/patient-dashboard");
    } catch (err) {
      console.error("Registration error:", err);
      setError("Network error. Try again.");
    }
  };

  return (
    <div>
      <header className="main-header">
        <div className="header-container">
          <div className="logo">AyurSutra</div>
          <nav className="main-nav">
            <ul>
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>
                <Link to="/#our-platform">Features</Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main className="content-container">
        <div className="demo-card">
          <div className="form-section">
            <h1>
              Experience AyurSutra -<br />
              Register Yourself
            </h1>

            {error && <p style={{ color: "crimson" }}>{error}</p>}

            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <input
                  type="text"
                  name="name"
                  placeholder="Name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
                <input
                  type="text"
                  name="surname"
                  placeholder="Surname"
                  value={formData.surname}
                  onChange={handleChange}
                />
              </div>

              <div className="form-row">
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-row">
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              {/* 🔹 cleaned DOB field */}
              <div className="form-row date-row">
                <input
                  type="text"
                  id="dob"
                  name="dob"
                  className="date-input"
                  value={formData.dob}
                  onChange={handleChange}
                  placeholder="Date Of Birth"
                  onFocus={(e) => (e.target.type = "date")}
                  onBlur={(e) => !e.target.value && (e.target.type = "text")}
                />
              </div>

              <div className="form-row password-row">
                <input
                  type="password"
                  id="password"
                  name="password"
                  className="password-input"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                  required
                />
              </div>

              <div style={{ margin: "1rem 0" }}>
                <label style={{ marginRight: 12 }}>
                  <input
                    type="radio"
                    name="role"
                    value="patient"
                    checked={formData.role === "patient"}
                    onChange={handleChange}
                  />{" "}
                  Patient
                </label>
                <label>
                  <input
                    type="radio"
                    name="role"
                    value="practitioner"
                    checked={formData.role === "practitioner"}
                    onChange={handleChange}
                  />{" "}
                  Practitioner
                </label>
              </div>

              <button type="submit" className="btn btn-primary">
                Register / Book Demo
              </button>
            </form>
          </div>
          <div className="illustration-section"></div>
        </div>
      </main>
    </div>
  );
};

export default BookDemo;
