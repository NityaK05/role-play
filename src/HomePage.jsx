import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';
import { motion } from "framer-motion";

function HomePage() {
  return (
    <div className="home-wrapper">
      
      {/* Drop in the nav bar */}
      <motion.nav
        className="navbar"
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="logo">
          <img src="/Logo2.png" alt="Logo" className="logo-icon" />
          <span>Yappa</span>
        </div>
      </motion.nav>

      <div className="hero-content">

        {/* Drop in the image */}
        <motion.img
          src="/llama.jpg"
          alt="Llama"
          className="hero-img"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        />

        <div className="hero-text">
          {/* Drop in the header text */}
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            Master Your<br />Communication<br />Skills
          </motion.h1>

          {/* Drop in the sub text */}
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            Improve your speaking through<br />interactive role-play scenarios
          </motion.p>

          {/* Drop in the button */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.85 }}
          >
            <Link to="/scenarios" className="hero-button">Get Started</Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
