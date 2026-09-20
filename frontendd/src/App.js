import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Home from "./pages/Home";
import BookDemo from "./pages/BookDemo";
import Login from "./components/Login.jsx";
import PatientDashboard from "./pages/PatientDashboard";
import PractitionerDashboard from "./pages/PractitionerDashboard";
import OAuthSuccess from "./pages/OAuthSuccess";

import "./styles/globals.css";

const API =
  process.env.REACT_APP_API_URL || "http://localhost:5000";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // =========================================================
  // COMMON FETCH OPTIONS
  // =========================================================

  const buildFetchOptions = (options = {}) => {
    const token = localStorage.getItem("token");

    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return {
      ...options,
      headers,
      credentials: "include",
    };
  };

  // =========================================================
  // CHECK LOGIN WHEN APPLICATION STARTS
  // =========================================================

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        // -----------------------------------------------------
        // If token + user are already stored
        // -----------------------------------------------------

        if (token && storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);

            if (parsedUser && parsedUser.role) {
              setUser(parsedUser);
              setLoading(false);
              return;
            }
          } catch (error) {
            console.log("Invalid stored user");
          }

          localStorage.removeItem("user");
        }

        // -----------------------------------------------------
        // Otherwise ask backend who is logged in
        // -----------------------------------------------------

        if (token) {
          const response = await fetch(
            `${API}/api/auth/me`,
            buildFetchOptions({
              method: "GET",
            })
          );

          if (response.ok) {
            const data = await response.json();

            const userData = data.user || data;

            if (userData) {
              setUser(userData);
              localStorage.setItem(
                "user",
                JSON.stringify(userData)
              );
            }
          } else {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Authentication check failed:", error);

        localStorage.removeItem("token");
        localStorage.removeItem("user");

        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // =========================================================
  // LOGIN / LOGOUT USER UPDATE
  // =========================================================

  const handleUserUpdate = (userData) => {
    setUser(userData);

    if (userData) {
      localStorage.setItem(
        "user",
        JSON.stringify(userData)
      );
    } else {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    }
  };

  // =========================================================
  // LOADING SCREEN
  // =========================================================

  if (loading) {
    return (
      <div className="loading-screen">
        <div>
          <h2>Loading AyurSutra...</h2>
          <p>Please wait</p>
        </div>
      </div>
    );
  }

  // =========================================================
  // APPLICATION
  // =========================================================

  return (
    <Router>
      <div className="App">

        <Routes>

          {/* =================================================
              PUBLIC HOME
          ================================================= */}

          <Route
            path="/"
            element={
              <Home
                user={user}
                setUser={handleUserUpdate}
              />
            }
          />

          {/* =================================================
              REGISTER
          ================================================= */}

          <Route
            path="/register"
            element={
              <BookDemo
                setUser={handleUserUpdate}
              />
            }
          />

          {/* Keep old route working */}
          <Route
            path="/book-demo"
            element={
              <BookDemo
                setUser={handleUserUpdate}
              />
            }
          />

          {/* =================================================
              LOGIN
          ================================================= */}

          <Route
            path="/login"
            element={
              user ? (
                <Navigate
                  to={
                    user.role === "practitioner"
                      ? "/practitioner-dashboard"
                      : "/patient-dashboard"
                  }
                  replace
                />
              ) : (
                <Login
                  setUser={handleUserUpdate}
                />
              )
            }
          />

          {/* =================================================
              PATIENT DASHBOARD
          ================================================= */}

          <Route
            path="/patient-dashboard"
            element={
              user && user.role === "patient" ? (
                <PatientDashboard
                  user={user}
                  setUser={handleUserUpdate}
                />
              ) : (
                <Navigate
                  to="/login"
                  replace
                />
              )
            }
          />

          {/* =================================================
              PRACTITIONER DASHBOARD
          ================================================= */}

          <Route
            path="/practitioner-dashboard"
            element={
              user && user.role === "practitioner" ? (
                <PractitionerDashboard
                  user={user}
                  setUser={handleUserUpdate}
                />
              ) : (
                <Navigate
                  to="/login"
                  replace
                />
              )
            }
          />

          {/* =================================================
              GOOGLE OAUTH
          ================================================= */}

          <Route
            path="/oauth-success"
            element={
              <OAuthSuccess
                setUser={handleUserUpdate}
              />
            }
          />

          {/* =================================================
              UNKNOWN URL
          ================================================= */}

          <Route
            path="*"
            element={
              <Navigate
                to="/"
                replace
              />
            }
          />

        </Routes>

      </div>
    </Router>
  );
}

export default App;