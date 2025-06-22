import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './HomePage';
import ScenarioPage from './ScenarioPage';
import ChatPage from './ChatPage';
import SimulationPage from './Simulation';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/scenarios" element={<ScenarioPage />} />
        <Route path="/simulation" element={<SimulationPage />} />
      </Routes>
    </Router>
  );
}

export default App;
