import React, { useState } from 'react';

interface ScenarioSetupFormProps {
  onStart: (session: any) => void;
}

const defaultScenario = {
  scenarioType: 'Salary Negotiation',
  userRole: 'Employee',
  aiRole: 'Manager',
  context: 'Asking for a raise after delivering results',
  difficulty: 'Beginner',
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
      // Request mic permission and fail fast if denied
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
        onStart({ ...form, id: data.sessionId });
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
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <h2 className="font-bold text-lg mb-2">Scenario Setup</h2>
      <label>
        Scenario Type
        <input className="input" name="scenarioType" value={form.scenarioType} onChange={handleChange} />
      </label>
      <label>
        Your Role
        <input className="input" name="userRole" value={form.userRole} onChange={handleChange} />
      </label>
      <label>
        AI Role
        <input className="input" name="aiRole" value={form.aiRole} onChange={handleChange} />
      </label>
      <label>
        Context
        <textarea className="input" name="context" value={form.context} onChange={handleChange} />
      </label>
      <label>
        Difficulty
        <select className="input" name="difficulty" value={form.difficulty} onChange={handleChange}>
          <option>Beginner</option>
          <option>Intermediate</option>
          <option>Advanced</option>
        </select>
      </label>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <button type="submit" className="bg-brown text-beige rounded px-4 py-2 mt-4" disabled={loading}>
        {loading ? 'Starting...' : 'Start Session'}
      </button>
    </form>
  );
};

export default ScenarioSetupForm;
