import React from "react";

const Hero = () => {
  return (
    <section className="hero-section" id="hero">
      <div className="hero-content">
        <span className="tagline">Ayurvedic Clinic Platform</span>
        <h1>
          AyurSutra – Panchakarma
          <br />
          Management Software
        </h1>
        <p>Your Comprehensive Digital Solution for Ayurvedic Clinics</p>
        <div className="hero-buttons">
          <a href="#our-platform" className="btn btn-secondary">
            Learn more
          </a>
        </div>
      </div>
    </section>
  );
};

export default Hero;
