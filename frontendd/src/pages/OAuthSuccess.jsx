import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// Helper to parse query params
function getQueryParams(search) {
  return Object.fromEntries(new URLSearchParams(search));
}

const OAuthSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = getQueryParams(location.search);
    const { role, token } = params;
    if (token) {
      localStorage.setItem("token", token);
    }
    // Redirect based on role
    if (role === "practitioner") navigate("/practitioner-dashboard");
    else if (role === "patient") navigate("/patient-dashboard");
    else navigate("/");
  }, [location, navigate]);

  return <div>Logging you in...</div>;
};

export default OAuthSuccess;
