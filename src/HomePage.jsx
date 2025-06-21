import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

function HomePage() {
  return (
    <div className="home-wrapper">
      <nav className="navbar">
        <div className="logo">
          <img src="/Logo2.png" alt="Logo" className="logo-icon" />
          <span>Yappa</span>
        </div>
      </nav>

      <div className="hero-content">
        <img src="/llama.jpg" alt="Llama" className="hero-img" />
        <div className="hero-text">
          <h1>Master Your<br />Communication<br />Skills</h1>
          <p>Improve your speaking through<br />interactive role-play scenarios</p>
          <Link to="/scenarios" className="hero-button">Get Started</Link>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
