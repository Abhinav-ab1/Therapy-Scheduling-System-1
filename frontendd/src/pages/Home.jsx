import React from "react";
import Header from "../components/Header";
import Hero from "../components/Hero";
import DifferentiatorSection from "../components/DifferentiatorSection";
import PanchakarmSection from "../components/PanchakarmSection";
import "../styles/Home.css";
import bg from "../assets/bg.png"; //  import the image

const Home = () => {
  return (
    <div
      className="home"
      style={{ backgroundImage: `url(${bg})` }} //  use here
    >
      <Header />
      <main>
        <Hero />
        <DifferentiatorSection />
        <PanchakarmSection />
        
      </main>
    </div>
  );
};

export default Home;
