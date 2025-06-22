import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

function HomePage() {
  return (
    <div className="home-wrapper">
      {/* Nav bar */}
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
        {/* Image */}
        <motion.img
          src="/llama.jpg"
          alt="Llama"
          className="hero-img"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        />

        <div className="hero-text">
          {/* Header text */}
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            Master Your<br />Communication<br />Skills
          </motion.h1>

          {/* Sub text */}
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            Improve your speaking through<br />interactive role-play scenarios
          </motion.p>

          {/* Button */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.85 }}
          >
            <Link href="/scenarios" legacyBehavior>
              <a className="hero-button">Get Started</a>
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
