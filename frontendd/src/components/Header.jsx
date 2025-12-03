import React from "react";
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="main-header">
      <div className="container nav-container">
        <div className="logo">
          <img src="/logon.png" alt="AyurSutra Logo" className="logo-img" />
          AyurSutra
        </div>
        <nav className="main-nav">
          <ul>
            <li>
              <a href="#hero">Home</a>
            </li>
            <li>
              <a href="#our-platform">Our Platform</a>
            </li>
            <li>
              <a href="#about-panchakarma">About Panchakarma</a>
            </li>
          </ul>
        </nav>
        <div className="nav-actions">
          <Link to="/book-demo" className="btn btn-demo">
            Register
          </Link>
          <Link to="/login" className="btn btn-login">
            Login
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
