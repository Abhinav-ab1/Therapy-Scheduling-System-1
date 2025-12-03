import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import BookDemo from "./pages/BookDemo";
import Login from "./components/Login.jsx";
import PatientDashboard from "./pages/PatientDashboard";
import PractitionerDashboard from "./pages/PractitionerDashboard";
import OAuthSuccess from "./pages/OAuthSuccess";
import "./styles/globals.css";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";



function AppContent() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/book-demo" element={<BookDemo />} />
        <Route path="/login" element={<Login />} />
        <Route path="/patient-dashboard" element={<PatientDashboard />} />
        <Route
          path="/practitioner-dashboard"
          element={<PractitionerDashboard />}
        />
        <Route path="/oauth-success" element={<OAuthSuccess />} />
      </Routes>
      {/* Chatbot removed */}
    </div>
  );
}


function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to build fetch options (supports both token and session)
  const buildFetchOptions = (opts = {}) => {
    const headers = opts.headers ?? {};
    if (!headers["Content-Type"]) headers["Content-Type"] = "application/json";

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

  // Check session when app loads
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // First, try to get user from localStorage if token exists
        const token = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");
        
        if (token && storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setLoading(false);
            return;
          } catch (e) {
            // Invalid stored user data, continue with API call
            localStorage.removeItem("user");
          }
        }

        // If no valid stored data, check with API
        const response = await fetch(`${API}/api/auth/me`, buildFetchOptions({
          method: "GET",
        }));

        if (response.ok) {
          const userData = await response.json();
          // auth route should return { user: {...} } or user object — handle both
          const userObj = userData.user ?? userData;
          setUser(userObj);
          
          // Store user data for future use
          if (userObj) {
            localStorage.setItem("user", JSON.stringify(userObj));
          }
        } else {
          // Clear any stale data
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        // Clear any stale data on error
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Handle user updates from child components
  const handleUserUpdate = (userData) => {
    setUser(userData);
    if (userData) {
      localStorage.setItem("user", JSON.stringify(userData));
    } else {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/book-demo" element={<BookDemo setUser={handleUserUpdate} />} />
          <Route path="/register" element={<BookDemo setUser={handleUserUpdate} />} />

          {/* Login route (redirect when already logged in) */}
          <Route
            path="/login"
            element={
              user ? (
                <Navigate to={user.role === "patient" ? "/patient-dashboard" : "/practitioner-dashboard"} replace />
              ) : (
                <Login setUser={handleUserUpdate} />
              )
            }
          />

          {/* Protected routes */}
          <Route
            path="/patient-dashboard"
            element={
              user?.role === "patient" ? (
                <PatientDashboard user={user} setUser={handleUserUpdate} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/practitioner-dashboard"
            element={
              user?.role === "practitioner" ? (
                <PractitionerDashboard user={user} setUser={handleUserUpdate} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;