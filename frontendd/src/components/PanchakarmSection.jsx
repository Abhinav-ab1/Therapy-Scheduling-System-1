import React from "react";

const PanchakarmSection = () => {
  return (
    <section className="panchakarma-section" id="about-panchakarma">
      <div className="container two-column-grid">
        <div className="left-column">
          <h2>What is Panchakarma?</h2>
          <p>
            Panchakarma is an ancient Ayurvedic therapy renowned for its
            profound detoxification and rejuvenation capabilities. It's more
            than just a cleanse; it's a meticulously designed process that works
            to eliminate deep-seated toxins (Ama) from the body, rebalancing
            your unique constitutional energies (Doshas – Vata, Pitta, Kapha).
            This personalized approach is a cornerstone of traditional Ayurvedic
            healing, aiming to restore your body's natural harmony and vital
            energy.
          </p>
          <ul className="benefit-list">
            <li>
              <i className="fas fa-check-circle"></i> Deep Cellular Detox:
              Eliminates toxins at a cellular level, fostering profound
              cleansing.
            </li>
            <li>
              <i className="fas fa-check-circle"></i> Boosted Immunity:
              Strengthens your body's natural defense mechanisms against
              illness.
            </li>
            <li>
              <i className="fas fa-check-circle"></i> Enhanced Digestion:
              Rekindles metabolic fire (Agni) for improved nutrient absorption.
            </li>
            <li>
              <i className="fas fa-check-circle"></i> Mental Clarity & Calm:
              Reduces stress, anxiety, and promotes a serene mental state.
            </li>
            <li>
              <i className="fas fa-check-circle"></i> Balanced Hormones:
              Supports endocrine function, contributing to overall hormonal
              health.
            </li>
            <li>
              <i className="fas fa-check-circle"></i> Anti-Aging Effects:
              Rejuvenates tissues, promoting longevity and vitality.
            </li>
          </ul>
        </div>
        <div className="right-column">
          <h3>The Five Foundational Actions</h3>
          <div className="action-card">
            <img src="/1.png" alt="Vamana treatment" />
            <div className="card-content">
              <h4>
                Vamana{" "}
                <span className="action-subtitle">(Therapeutic Emesis)</span>
              </h4>
              <p>
                A controlled procedure to remove accumulated Kapha toxins from
                the respiratory and upper gastrointestinal tracts.
              </p>
            </div>
          </div>
          <div className="action-card">
            <img src="/2.png" alt="Virechana treatment" />
            <div className="card-content">
              <h4>
                Virechana <span className="action-subtitle">(Purgation)</span>
              </h4>
              <p>
                Herbal purgation to cleanse the liver, gallbladder, and small
                intestine, primarily addressing Pitta imbalances.
              </p>
            </div>
          </div>
          <div className="action-card">
            <img src="/3.png" alt="Basti treatment" />
            <div className="card-content">
              <h4>
                Basti <span className="action-subtitle">(Medicated Enema)</span>
              </h4>
              <p>
                Considered the most important Panchakarma therapy, it cleanses
                the colon and balances Vata dosha effectively.
              </p>
            </div>
          </div>
          <div className="action-card">
            <img src="/4.png" alt="Nasya treatment" />
            <div className="card-content">
              <h4>
                Nasya{" "}
                <span className="action-subtitle">(Nasal Administration)</span>
              </h4>
              <p>
                Herbal oils or powders administered nasally to cleanse and clear
                toxins from the head and sinus regions.
              </p>
            </div>
          </div>
          <div className="action-card">
            <img src="/5.png" alt="Raktamokshana treatment" />
            <div className="card-content">
              <h4>
                Raktamokshana{" "}
                <span className="action-subtitle">(Bloodletting)</span>
              </h4>
              <p>
                A specialized therapy for purifying the blood, beneficial in
                specific skin conditions and inflammatory issues.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PanchakarmSection;
