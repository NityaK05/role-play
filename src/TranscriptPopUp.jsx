import React from "react";
import "./TranscriptPopUp.css";

export default function TranscriptPopUp({ onClose, transcript }) {
  return (
    <div className="transcript-overlay">
      <div className="transcript-popup">
        <div className="transcript-header">
          <button className="close-btn" onClick={onClose}>✕</button>
          <h2>Conversation Transcript</h2>
        </div>
        <div className="transcript-content">
          {transcript.map((msg, index) => (
            <div className="message-bubble" key={index}>
              <div className="meta">
                <strong>{msg.sender}</strong> – {msg.timestamp}
              </div>
              <div className="text">{msg.text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
