// src/ScenarioPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ScenarioPage.css';
import { motion } from "framer-motion";

function ScenarioPage() {
  const navigate = useNavigate();
  const [scenarioTitle, setScenarioTitle] = useState('');
  const [scenarioType, setScenarioType] = useState('');
  const [yourRole, setYourRole] = useState('');
  const [aiRole, setAiRole] = useState('');
  const [contextObjectives, setContextObjectives] = useState('');
  const [formality, setFormality] = useState('Neutral');

  const startSimulation = () => {
    const title = scenarioTitle.trim() || 'Practice Session';
    localStorage.setItem('sessionTitle', title);
    navigate('/Simulation');
  };

  return (
    
    <div className="scenario-wrapper">
        
      <motion.header
        className="header"
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0 }}
      >
        <div className="logo">
            <img src="/Logo2.png" alt="Logo" className="logo-icon" />
            <span>Yappa</span>
        </div>
      </motion.header>

        <motion.div
        className="setup-container"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.4 }}
        >
        <h1 className="setup-title">Create Your Scenario</h1>
        <p className="setup-subtitle">Configure your role-play simulation</p>

        <motion.div
            className="form-section"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.5 }}
        >
            <label className="form-label">Scenario Title</label>
            <input type="text" className="form-input" value={scenarioTitle} onChange={(e) => setScenarioTitle(e.target.value)} placeholder="Enter a title…" />
        </motion.div>

        <motion.div
            className="form-section"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.6 }}
        >
            <label className="form-label">Scenario Type</label>
            <input type="text" className="form-input" value={scenarioType} onChange={(e) => setScenarioType(e.target.value)} placeholder="Enter a type…" />
        </motion.div>

        <motion.div
            className="form-grid"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.7 }}
        >
            <div className="form-section">
            <label className="form-label">Your Role</label>
            <input type="text" className="form-input" value={yourRole} onChange={(e) => setYourRole(e.target.value)} placeholder="e.g., Employee" />
            </div>
            <div className="form-section">
            <label className="form-label">AI's Role</label>
            <input type="text" className="form-input" value={aiRole} onChange={(e) => setAiRole(e.target.value)} placeholder="e.g., Manager" />
            </div>
        </motion.div>

        <motion.div
            className="form-section"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.8 }}
        >
            <label className="form-label">Context & Objectives</label>
            <textarea className="form-textarea" value={contextObjectives} onChange={(e) => setContextObjectives(e.target.value)} placeholder="Goals, challenges, etc." />
        </motion.div>

        <motion.div
            className="form-section"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.9 }}
        >
            <label className="form-label">Formality Level</label>
            <select className="form-select" value={formality} onChange={(e) => setFormality(e.target.value)}>
            <option value="Casual">Casual</option>
            <option value="Neutral">Neutral</option>
            <option value="Formal">Formal</option>
            </select>
        </motion.div>

        <motion.div
            className="form-navigation"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 1.00 }}
        >
            <button className="nav-btn prev-btn" onClick={() => navigate("/")}> Previous </button>
            <button className="nav-btn start-btn" onClick={startSimulation}>Start Simulation</button>
        </motion.div>
        </motion.div>
    </div>
  );
}

export default ScenarioPage;