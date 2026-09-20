import React from "react";
import { Link, useNavigate } from "react-router-dom";

const Header = ({ user, setUser }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    if (setUser) {
      setUser(null);
    }

    navigate("/");
  };

  const goToDashboard = () => {
    if (user?.role === "practitioner") {
      navigate("/practitioner-dashboard");
    } else {
      navigate("/patient-dashboard");
    }
  };

  return (
    <header className="main-header">

      <div className="container nav-container">

        {/* =================================================
            LOGO
        ================================================= */}

        <Link
          to="/"
          className="logo"
          style={{
            textDecoration: "none",
            color: "inherit",
          }}
        >

          <img
            src="/logon.png"
            alt="AyurSutra Logo"
            className="logo-img"
          />

          AyurSutra

        </Link>

        {/* =================================================
            NAVIGATION
        ================================================= */}

        <nav className="main-nav">

          <ul>

            <li>
              <Link to="/">
                Home
              </Link>
            </li>

            <li>
              <a href="#our-platform">
                Our Platform
              </a>
            </li>

            <li>
              <a href="#about-panchakarma">
                About Panchakarma
              </a>
            </li>

          </ul>

        </nav>

        {/* =================================================
            ACTIONS
        ================================================= */}

        <div className="nav-actions">

          {!user ? (

            <>
              <Link
                to="/register"
                className="btn btn-demo"
              >
                Register
              </Link>

              <Link
                to="/login"
                className="btn btn-login"
              >
                Login
              </Link>
            </>

          ) : (

            <>

              <button
                type="button"
                className="btn btn-demo"
                onClick={goToDashboard}
              >
                Dashboard
              </button>

              <button
                type="button"
                className="btn btn-login"
                onClick={handleLogout}
              >
                Logout
              </button>

            </>

          )}

        </div>

      </div>

    </header>
  );
};

export default Header;