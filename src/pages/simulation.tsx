import React, { useEffect, useState } from "react";
import { useRouter } from 'next/router';
import TranscriptSidebar from "../components/TranscriptSidebar";
import MicButton from "../components/MicButton";
import LiveFeedbackSpectrum from "../components/LiveFeedbackSpectrum";
import { motion } from "framer-motion";

export default function SimulationPage() {
  const router = useRouter();
  const { sessionId } = router.query;
  const [sessionTitle, setSessionTitle] = useState("Practice Session");
  const [duration, setDuration] = useState(0);
  const [paused, setPaused] = useState(false);
  const [started, setStarted] = useState(false);
  const [intervalId, setIntervalId] = useState<any>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [showConversation, setShowConversation] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [transcript, setTranscript] = useState<any[]>([]);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [userSpeaking, setUserSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  // State for feedback spectrum and AI thinking
  const [showFeedbackSpectrum, setShowFeedbackSpectrum] = useState(false);
  const [overallFeedback, setOverallFeedback] = useState<any>(null);

  // Fetch session data if sessionId is present
  useEffect(() => {
    if (sessionId && !session) {
      fetch(`/api/session/${sessionId}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) {
            setSession(data);
            // Check all possible title fields in order of priority
            setSessionTitle(
              data.scenarioTitle ||
              data.sessionTitle ||
              data.title ||
              data.name ||
              "Practice Session"
            );
          } else {
            setSession({ id: sessionId });
          }
        });
      fetch(`/api/session/${sessionId}/transcript?format=json`)
        .then(res => res.ok ? res.json() : [])
        .then(data => {
          setTranscript(Array.isArray(data) ? data : []);
        });
    }
  }, [sessionId, session]);

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
    if (intervalId) clearInterval(intervalId);
  };

  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;

  let sessionStatus = "Ready";
  if (showSummary) {
    sessionStatus = "Ended";
  } else if (started && paused) {
    sessionStatus = "Paused";
  } else if (started && !paused) {
    sessionStatus = "Active";
  }

  // --- MicButton logic for robot icon ---
  // We'll use the MicButton logic but render the button as the robot icon
  const handleUserSpeechStart = () => {
    setUserSpeaking(true);
    setShowFeedbackSpectrum(true); // Show feedback only when user is speaking
  };
  const handleUserSpeechEnd = () => {
    setUserSpeaking(false);
    setShowFeedbackSpectrum(false); // Hide feedback when user stops speaking
    setAiThinking(true); // Show AI is thinking popup after user finishes speaking
  };
  const handleAiSpeechStart = () => {
    setAiSpeaking(true);
    setShowFeedbackSpectrum(false); // Hide feedback when AI is speaking
    setAiThinking(false); // Hide AI is thinking popup when AI starts speaking
  };
  const handleAiSpeechEnd = () => {
    setAiSpeaking(false);
  };
  const handleTranscriptUpdate = (t: any[]) => setTranscript(t);
  const handleMicClick = () => setListening((l) => !l);
  const handleUserAudioBlob = (blob: Blob) => setAudioBlob(blob);

  // AI waiting icon (spinner)
  const AIWaitingIcon = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
      <span className="ai-waiting-spinner" style={{
        width: 24, height: 24, border: '3px solid #a29bfe', borderTop: '3px solid transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite'
      }} />
      <span style={{ color: '#a29bfe', fontWeight: 500 }}>AI is preparing a response…</span>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }`}</style>
    </div>
  );

  // Remove all setShowAiThinking and showAiThinking useState logic
  // useEffect(() => {
  //   if (!userSpeaking && aiThinking && !aiSpeaking) {
  //     setShowAiThinking(true);
  //   } else {
  //     setShowAiThinking(false);
  //   }
  // }, [userSpeaking, aiThinking, aiSpeaking]);

  // Use the derived showAiThinking variable for the indicator
  const showAiThinking = aiThinking && !userSpeaking && !aiSpeaking;

  return (
    <div className="min-h-screen flex bg-black text-brown">

      <div className="main-content">
        <motion.header
          className="header"
          style={{ width: '100vw', left: 0, right: 0, position: 'fixed', top: 0, zIndex: 200 }}
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0 }}
        >
          <div className="header-left">
            <div className="logo">
              <img src="/Logo2.png" alt="Logo" className="logo-icon" />
              <span>Yappa</span>
            </div>
            <div className="session-info">{sessionTitle}</div>
            <div className="status-indicator">
              <div className="status-dot"></div>
              {sessionStatus}
            </div>
          </div>
          <div className="header-right">
            <button className="home-btn" onClick={() => router.push('/')}>Home</button>
          </div>
        </motion.header>
        <div style={{ height: '96px' }} /> {/* Spacer to move session title lower */}

        <div className="content" style={{ position: 'relative', width: '100%' }}>
          {/* MicButton as the main mic icon, centered and clickable */}
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            style={{ cursor: 'pointer', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: 140, left: 32 }}
          >
            {/* AI is thinking... pulsing text, moved higher */}
            {showAiThinking && (
              <div style={{ position: 'absolute', top: -64, left: 0, right: 0, textAlign: 'center', width: '100%' }}>
                <span style={{ color: '#a29bfe', opacity: 0.7, fontWeight: 500, fontSize: 18, animation: 'pulse 1.2s infinite' }}>
                  AI is thinking...
                </span>
                <style>{`@keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }`}</style>
              </div>
            )}
            <MicButton
              aiSpeaking={aiSpeaking}
              userSpeaking={userSpeaking}
              disabled={!session}
              listening={listening}
              onUserSpeechStart={handleUserSpeechStart}
              onUserSpeechEnd={handleUserSpeechEnd}
              onAiSpeechStart={handleAiSpeechStart}
              onAiSpeechEnd={handleAiSpeechEnd}
              onTranscriptUpdate={handleTranscriptUpdate}
              session={session}
              aiThinking={aiThinking}
              onMicClick={handleMicClick}
              onUserAudioBlob={handleUserAudioBlob}
            />
          </motion.div>

          {/* AI waiting spinner */}
          {aiThinking && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, justifyContent: 'center', left: 32, position: 'relative' }}>
              <span className="ai-waiting-spinner" style={{
                width: 24, height: 24, border: '3px solid #a29bfe', borderTop: '3px solid transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite'
              }} />
              <span style={{ color: '#a29bfe', fontWeight: 500 }}>AI is preparing a response…</span>
              <style>{`@keyframes spin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }`}</style>
            </div>
          )}

          <motion.h1
            className="title"
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            style={{ position: 'relative', left: 32 }}
          >
            {sessionTitle}
          </motion.h1>

          <motion.p
            className="description"
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.6 }}
            style={{ position: 'relative', left: 32 }}
          >
            I'm ready to help you practice your future situations and provide realistic responses based on your scenario setup.
          </motion.p>

          <motion.div
            className="controls"
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.8 }}
            style={{ position: 'relative', left: 32 }}
          >
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'center' }}>
              <button className="control-btn start-pause-btn" onClick={toggleSession}>
                {started && !paused ? "⏸" : "▶"}
              </button>
              <button className="control-btn retry-btn" onClick={resetSession}>
                <img src="/Redo.png" alt="R" className="icons" />
              </button>
            </div>
          </motion.div>
        </div>

        {/* LiveFeedbackSpectrum above the sidebar */}
        {showFeedbackSpectrum && (
          <div style={{ width: 350, margin: '32px auto 0 auto' }}>
            <LiveFeedbackSpectrum audioBlob={audioBlob} />
          </div>
        )}
        {!showFeedbackSpectrum && overallFeedback && (
          <div style={{ width: 350, margin: '32px auto 0 auto' }}>
            <div style={{ background: '#222', borderRadius: 12, padding: 16, boxShadow: '0 2px 12px #0008', minWidth: 220, color: '#fff' }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Speech Analytics (last segment)</div>
              <div style={{ marginBottom: 10 }}>Pitch: <b>{Math.round((overallFeedback.pitch ?? 0) * 100)}%</b></div>
              <div style={{ marginBottom: 10 }}>Tone: <b>{Math.round((overallFeedback.tone ?? 0) * 100)}%</b></div>
              <div style={{ marginBottom: 10 }}>Clarity: <b>{Math.round((overallFeedback.clarity ?? 0) * 100)}%</b></div>
              <div style={{ marginBottom: 10 }}>Pace: <b>{Math.round((overallFeedback.pace ?? 0) * 100)}%</b></div>
            </div>
          </div>
        )}

        {/* Analytics-only sidebar moved to top right */}
        <div style={{ position: 'fixed', top: 32, right: 32, width: 350, zIndex: 100 }}>
          <motion.div
            className="sidebar-section"
            style={{ textAlign: 'right' }}
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h3 className="sidebar-title" style={{ textAlign: 'right' }}>Session Analytics</h3>
            <div className="analytics-grid" style={{ justifyItems: 'end' }}>
              <div className="metric">
                <div className="metric-header" style={{ justifyContent: 'flex-start', display: 'flex', gap: 8, marginLeft: 0 }}>
                  <span className="metric-label" style={{ fontWeight: 500, color: '#888' }}>Duration</span>
                  <span className="metric-value">{minutes}:{seconds.toString().padStart(2, '0')}</span>
                </div>
                <div className="metric-bar" style={{ marginLeft: 0 }}>
                  <div className="metric-bar-fill" style={{ width: "100%" }}></div>
                </div>
              </div>
            </div>
          </motion.div>
          <div style={{ marginTop: '3.5rem', maxHeight: 320, overflowY: 'auto' }}>
            <TranscriptSidebar transcript={transcript} session={session} />
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
              <button className="transcript-btn" onClick={() => setShowTranscript(true)}>📄 View Transcript</button>
              <button className="new-session-btn" onClick={() => router.push('/scenarios')}>✨ New Session</button>
            </div>
            <div className="summary-popup">
              <button className="close-btn" onClick={() => setShowSummary(false)}>✕</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
