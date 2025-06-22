import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface ScenarioSetupFormProps {
  onStart: (session: any) => void;
}

const defaultScenario = {
  scenarioType: '',
  userRole: '',
  aiRole: '',
  context: '',
  difficulty: 'Beginner',
  formality: 'Neutral',
  scenarioTitle: '',
};

const ScenarioSetupForm: React.FC<ScenarioSetupFormProps> = ({ onStart }) => {
  const [form, setForm] = useState(defaultScenario);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      setError('Microphone access is required for this app. Please allow mic access in your browser settings.');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/startSession', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.sessionId) {
        // Redirect to simulation page with sessionId in the URL
        if (typeof window !== 'undefined') {
          window.location.href = `/simulation?sessionId=${data.sessionId}`;
        }
      } else if (data.error) {
        setError('Failed to start session: ' + data.error);
      } else {
        setError('Unknown error starting session.');
      }
    } catch (err) {
      setError('Network error starting session.');
    }
    setLoading(false);
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
      <motion.form
        className="setup-container"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.4 }}
        onSubmit={handleSubmit}
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
          <input type="text" className="form-input" name="scenarioTitle" value={form.scenarioTitle} onChange={handleChange} placeholder="Enter a title…" />
        </motion.div>
        <motion.div
          className="form-section"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.6 }}
        >
          <label className="form-label">Scenario Type</label>
          <input type="text" className="form-input" name="scenarioType" value={form.scenarioType} onChange={handleChange} placeholder="Enter a type…" />
        </motion.div>
        <motion.div
          className="form-grid"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.7 }}
        >
          <div className="form-section">
            <label className="form-label">Your Role</label>
            <input type="text" className="form-input" name="userRole" value={form.userRole} onChange={handleChange} placeholder="e.g., Employee" />
          </div>
          <div className="form-section">
            <label className="form-label">AI's Role</label>
            <input type="text" className="form-input" name="aiRole" value={form.aiRole} onChange={handleChange} placeholder="e.g., Manager" />
          </div>
        </motion.div>
        <motion.div
          className="form-section"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.8 }}
        >
          <label className="form-label">Context & Objectives</label>
          <textarea className="form-textarea" name="context" value={form.context} onChange={handleChange} placeholder="Goals, challenges, etc." />
        </motion.div>
        <motion.div
          className="form-section"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.9 }}
        >
          <label className="form-label">Formality Level</label>
          <select className="form-select" name="formality" value={form.formality} onChange={handleChange}>
            <option value="Casual">Casual</option>
            <option value="Neutral">Neutral</option>
            <option value="Formal">Formal</option>
          </select>
        </motion.div>
        <motion.div
          className="form-section"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 1.0 }}
        >
          <label className="form-label">Difficulty</label>
          <select className="form-select" name="difficulty" value={form.difficulty} onChange={handleChange}>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </motion.div>
        {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
        <motion.div
          className="form-navigation"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 1.1 }}
        >
          {/* You can add navigation logic here if needed */}
          <button type="submit" className="nav-btn start-btn" disabled={loading}>
            {loading ? 'Starting...' : 'Start Simulation'}
          </button>
        </motion.div>
      </motion.form>
    </div>
  );
};

export default ScenarioSetupForm;
