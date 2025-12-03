import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Login.css";
import googleIcon from "../assets/search.png";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

const Login = ({ setUser }) => {
  const [activeRole, setActiveRole] = useState("patient");
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleRoleChange = (role) => {
    setActiveRole(role);
    setError("");
  };

  const handleChange = (e) => {
    setFormData((s) => ({ ...s, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // important for sessions
        body: JSON.stringify({ ...formData, role: activeRole }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Login failed");
        return;
      }

      // Store token in localStorage if present
      if (data.token) {
        localStorage.setItem("token", data.token);
      } //ye change kiya h

      const user = data.user ?? data;
      setUser(user);

      if (user.role === "practitioner") navigate("/practitioner-dashboard");
      else navigate("/patient-dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setError("Network error. Try again.");
    }
  };

  const handleGoogleLogin = () => {
    // Backend should handle OAuth start; role can be passed as query param
    window.location.href = `${API}/api/auth/google?role=${activeRole}`;
  };

  return (
    <div className="login-page">
      <header className="page-header">
        <Link to="/" className="logo">
          AyurSutra
        </Link>
      </header>

      <div className="login-container">
        <div className="login-card">
          <h1>AyurSutra</h1>

          <div className="role-selector">
            <div
              className={`role-button ${activeRole === "patient" ? "active" : ""}`}
              onClick={() => handleRoleChange("patient")}
            >
              Login as Patient
            </div>
            <div
              className={`role-button ${activeRole === "practitioner" ? "active" : ""}`}
              onClick={() => handleRoleChange("practitioner")}
            >
              Login as Practitioner
            </div>
          </div>

          {error && <p style={{ color: "crimson", marginBottom: 12 }}>{error}</p>}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <span className="input-icon">
                <i className="fas fa-envelope" />
              </span>
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-group">
              <span className="input-icon">
                <i className="fas fa-lock" />
              </span>
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className="login-btn">
              Login
            </button>
          </form>

          <div className="divider">
            <span className="divider-text">or</span>
          </div>

          <button type="button" className="google-login-btn" onClick={handleGoogleLogin}>
            <img src={googleIcon} alt="Google icon" className="google-icon" />
            Login with Google
          </button>

          <div className="links" style={{ justifyContent: "center" }}>
            <Link to="/register" className="link">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
