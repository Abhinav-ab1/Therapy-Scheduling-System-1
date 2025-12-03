import React from "react";

const DifferentiatorSection = () => {
  return (
    <section className="differentiator-section" id="our-platform">
      <div className="container">
        <div className="section-header">
          <span className="subtitle">Why We're Different</span>
          <h2>Built for trust, transparency, and technology</h2>
          <p>
            We directly address the most critical issues in the Panchakarma
            industry.
          </p>
        </div>
        <div className="card-grid">
          <div className="feature-card">
            <div className="icon-box">
              <i className="fas fa-tasks"></i>
            </div>
            <h3>Streamlined Management</h3>
            <p>
              No more manual scheduling or documentation. Our software automates
              workflows for both patients and practitioners.
            </p>
          </div>
          <div className="feature-card">
            <div className="icon-box">
              <i className="fas fa-shield-alt"></i>
            </div>
            <h3>Vetted Expertise & Quality</h3>
            <p>
              Ensure standardized, high-quality care with a platform built to
              support certified practitioners and ethical practices.
            </p>
          </div>
          <div className="feature-card">
            <div className="icon-box">
              <i className="fas fa-user-friends"></i>
            </div>
            <h3>Patient-Centric Experience</h3>
            <p>
              Our intuitive mobile-first design makes it easy for patients to
              manage their journey from anywhere.
            </p>
          </div>
          <div className="feature-card">
            <div className="icon-box">
              <i className="fas fa-cloud"></i>
            </div>
            <h3>Digital-First Administration</h3>
            <p>
              Our cloud-based system digitizes health records, prescriptions,
              and billing, eliminating human error and paper.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DifferentiatorSection;
