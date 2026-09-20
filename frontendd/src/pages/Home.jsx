import React from "react";

import Header from "../components/Header";
import Hero from "../components/Hero";
import DifferentiatorSection from "../components/DifferentiatorSection";
import PanchakarmSection from "../components/PanchakarmSection";
import AIChatbot from "../AIChatbot";

import "../styles/Home.css";

import bg from "../assets/bg.png";

const Home = ({ user, setUser }) => {
  return (
    <div
      className="home"
      style={{
        backgroundImage: `url(${bg})`,
      }}
    >
      <Header
        user={user}
        setUser={setUser}
      />

      <main>
        <Hero />

        <DifferentiatorSection />

        <PanchakarmSection />
      </main>

      {/* AyurSutra AI Assistant */}
      <AIChatbot />
    </div>
  );
};

export default Home;