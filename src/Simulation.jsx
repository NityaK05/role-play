// SimulationPage.jsx
import React, { useEffect, useState } from "react";
import "./Simulation.css";
import TranscriptPopUp from "./TranscriptPopUp";

export default function SimulationPage() {
  const [sessionTitle, setSessionTitle] = useState("Practice Session");
  const [duration, setDuration] = useState(0);
  const [paused, setPaused] = useState(false);
  const [started, setStarted] = useState(false);
  const [intervalId, setIntervalId] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [showConversation, setShowConversation] = useState(false);
   const [showTranscript, setShowTranscript] = useState(false);

   const transcriptData = [
        {
        sender: "Manager",
        timestamp: "10:54:53 PM",
        text: "Thank you for the practice session. Good luck with your real negotiation!"
        },
    ];  



    
  useEffect(() => {
    const title = localStorage.getItem("sessionTitle") || "Practice Session";
    setSessionTitle(title);
  }, []);

  useEffect(() => {
    if (!paused && started) {
      const id = setInterval(() => setDuration((d) => d + 1), 1000);
      setIntervalId(id);
      return () => clearInterval(id);
    }
  }, [paused, started]);

  const toggleSession = () => {
    if (!started) {
      setStarted(true);
      setPaused(false);
    } else {
      setPaused((prev) => !prev);
    }
  };

  const resetSession = () => {
    setDuration(0);
    setStarted(false);
    setPaused(false);
    clearInterval(intervalId);
  };

  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;

  return (
    <div className="container">
      <div className="main-content">
        <header className="header">
          <div className="header-left">
            <div className="logo">
            <img src="/Logo2.png" alt="Logo" className="logo-icon" />
            <span>Yappa</span>
            </div>
            <div className="session-info">{sessionTitle}</div>
            <div className="status-indicator">
              <div className="status-dot"></div>
              Ready
            </div>
          </div>
          <div className="header-right">
            <button className="home-btn" onClick={() => window.location.href = '/'}>Home</button>
          </div>
        </header>

        <div className="content">
          <div className="avatar">
            <div className="robot-icon">🎤</div>
          </div>
          <h1 className="title">Ready to Practice</h1>
          <p className="description">
            I'm ready to help you practice your _____. I'll play the role of ____ and provide realistic responses based on your scenario setup.
          </p>
          <div className="controls">
            <button className="control-btn start-pause-btn" onClick={toggleSession}>
              {started && !paused ? "⏸" : "▶"}
            </button>
            <button className="control-btn end-btn" onClick={() => setShowSummary(true)}>⏹</button>
            <button className="control-btn retry-btn" onClick={resetSession}>🔁</button>
          </div>
        </div>
        {showSummary && (
  <div className="session-summary">
    <h2>🎉 Session Complete!</h2>
    <p>Great job practicing! Your conversation has been saved and you can review the transcript to see how you performed.</p>

    <div className="summary-stats">
      <div>
        <h3>0:{String(seconds).padStart(2, '0')}</h3>
        <p>Duration</p>
      </div>
      <div>
        <h3>85%</h3>
        <p>Confidence</p>
      </div>
      <div>
        <h3>92%</h3>
        <p>Clarity</p>
      </div>
      <div>
        <h3>1</h3>
        <p>Messages</p>
      </div>
    </div>

    
    <div className="summary-buttons">
      <button className="transcript-btn"onClick={() => setShowTranscript(true)}>📄 View Transcript</button>
      <button className="new-session-btn" onClick={() => window.location.href = '/scenarios'}>✨ New Session</button>
    </div>
    <div className="summary-popup">
        <button className="close-btn" onClick={() => setShowSummary(false)}>✕</button>
    </div>
  </div>
)}
      </div>

      <div className="sidebar">
        <div className="sidebar-section">
          <h3 className="sidebar-title">Session Analytics</h3>
          <div className="analytics-grid">
            <div className="metric">
              <div className="metric-header">
                <span className="metric-label">Duration</span>
                <span className="metric-value">{minutes}:{seconds.toString().padStart(2, '0')}</span>
              </div>
              <div className="metric-bar">
                <div className="metric-bar-fill" style={{ width: "100%" }}></div>
              </div>
            </div>
            <div className="metric">
              <div className="metric-header">
                <span className="metric-label">Confidence</span>
                <span className="metric-value">85%</span>
              </div>
              <div className="metric-bar">
                <div className="metric-bar-fill" style={{ width: "85%" }}></div>
              </div>
            </div>
            <div className="metric">
              <div className="metric-header">
                <span className="metric-label">Clarity</span>
                <span className="metric-value">92%</span>
              </div>
              <div className="metric-bar">
                <div className="metric-bar-fill" style={{ width: "92%" }}></div>
              </div>
            </div>
            <div className="metric">
              <div className="metric-header">
                <span className="metric-label">Tone</span>
                <span className="metric-value">Professional</span>
              </div>
              <div className="metric-bar">
                <div className="metric-bar-fill" style={{ width: "70%" }}></div>
              </div>
            </div>
            <div className="metric">
              <div className="metric-header">
                <span className="metric-label">Pace</span>
                <span className="metric-value">Moderate</span>
              </div>
              <div className="metric-bar">
                <div className="metric-bar-fill" style={{ width: "60%" }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="sidebar-section">
          <h3 className="sidebar-title">Key Goals</h3>
          <div className="goal-card">
            <div className="goal-priority">HIGH</div>
            <div className="goal-title">Present salary research</div>
            <div className="goal-description">Support your request with market data and industry benchmarks.</div>
          </div>
          <div className="goal-card">
            <div className="goal-priority" style={{ background: '#a855f7' }}>MEDIUM</div>
            <div className="goal-title">Highlight achievements</div>
            <div className="goal-description">Mention specific contributions and measurable results.</div>
          </div>
        </div>
      </div>
      {!showConversation && (
        <button className="conversation-btn" onClick={() => setShowConversation(true)}>
            💬
        </button>
            )}

        {showConversation && (
        <div className="conversation-popup">
            <button className="close-btn" onClick={() => setShowConversation(false)}>✕</button>
            {/* Replace with your actual conversation content */}
            <div className="conversation-content">
            <p>This is your conversation transcript or live chat area.</p>
            </div>
        </div>
        )}
        {showTranscript && (
  <TranscriptPopUp
    transcript={transcriptData}
    onClose={() => setShowTranscript(false)}
  />
)}
    </div>
  );
}
