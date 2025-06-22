// src/ScenarioPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ScenarioPage.css';

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
      <header className="header">
        <div className="logo">
            <img src="/Logo2.png" alt="Logo" className="logo-icon" />
            <span>Yappa</span>
        </div>
      </header>
        <button className="history-btn" onClick={() => alert('History not implemented yet')}>Previous Conversations</button>

      <div className="setup-container">
        <h1 className="setup-title">Create Your Scenario</h1>
        <p className="setup-subtitle">Configure your role-play simulation</p>

        <div className="form-section">
          <label className="form-label">Scenario Title</label>
          <input type="text" className="form-input" value={scenarioTitle} onChange={(e) => setScenarioTitle(e.target.value)} placeholder="Enter a title…" />
        </div>

        <div className="form-section">
          <label className="form-label">Scenario Type</label>
          <input type="text" className="form-input" value={scenarioType} onChange={(e) => setScenarioType(e.target.value)} placeholder="Enter a type…" />
        </div>

        <div className="form-grid">
          <div className="form-section">
            <label className="form-label">Your Role</label>
            <input type="text" className="form-input" value={yourRole} onChange={(e) => setYourRole(e.target.value)} placeholder="e.g., Employee" />
          </div>
          <div className="form-section">
            <label className="form-label">AI's Role</label>
            <input type="text" className="form-input" value={aiRole} onChange={(e) => setAiRole(e.target.value)} placeholder="e.g., Manager" />
          </div>
        </div>

        <div className="form-section">
          <label className="form-label">Context & Objectives</label>
          <textarea className="form-textarea" value={contextObjectives} onChange={(e) => setContextObjectives(e.target.value)} placeholder="Goals, challenges, etc." />
        </div>

        <div className="form-section">
          <label className="form-label">Formality Level</label>
          <select className="form-select" value={formality} onChange={(e) => setFormality(e.target.value)}>
            <option value="Casual">Casual</option>
            <option value="Neutral">Neutral</option>
            <option value="Formal">Formal</option>
          </select>
        </div>

        <div className="form-navigation">
          <button className="nav-btn prev-btn" onClick={() => navigate("/")}> Previous </button>
          <button className="nav-btn start-btn" onClick={startSimulation}>Start Simulation</button>
        </div>
      </div>
    </div>
  );
}

export default ScenarioPage;
