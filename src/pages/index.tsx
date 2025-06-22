import ScenarioSetupForm from '../components/ScenarioSetupForm';
import MicButton from '../components/MicButton';
import TranscriptSidebar from '../components/TranscriptSidebar';
import LiveFeedbackSpectrum from '../components/LiveFeedbackSpectrum';
import { useState, useEffect } from 'react';

export default function Home() {
  // State for session, transcript, and UI
  const [session, setSession] = useState<any>(null);
  const [transcript, setTranscript] = useState<any[]>([]);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [userSpeaking, setUserSpeaking] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [listening, setListening] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const [userAudioBlob, setUserAudioBlob] = useState<Blob | null>(null);

  useEffect(() => {
    if (!session) return;
    // Optionally, fetch transcript from backend on session change
    setTranscript([]);
    setFeedback('');
  }, [session]);

  // Add feedback request handler
  const handleFeedback = async () => {
    if (!session) return;
    const res = await fetch('/api/generateFeedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: session.id }),
    });
    const data = await res.json();
    if (data.feedback) setFeedback(data.feedback);
  };

  // Remove auto-listening on session start
  const handleSessionStart = (sessionObj: any) => {
    setSession(sessionObj);
    setListening(false); // Only start listening when mic is clicked
  };

  // Handler for mic click to start listening (allow at any time after session start)
  const handleMicClick = () => {
    if (session && !listening && !aiThinking && !aiSpeaking) {
      setListening(true);
    }
  };

  // Wrap MicButton AI thinking logic
  const handleUserSpeechEnd = () => {
    setUserSpeaking(false);
    setAiThinking(true);
  };
  const handleAiSpeechStart = () => {
    setAiThinking(false);
    setAiSpeaking(true);
  };
  const handleAiSpeechEnd = () => {
    setAiThinking(false);
    setAiSpeaking(false);
  };

  // Show AI thinking when AI is generating a response and not userSpeaking or aiSpeaking
  const showAiThinking = aiThinking && !userSpeaking && !aiSpeaking;

  return (
    <div className="min-h-screen flex bg-black text-brown">
      {/* AI thinking indicator */}
      <div className="fixed top-0 left-0 w-full flex justify-center z-50 pointer-events-none">
        {showAiThinking && (
          <span className="text-tan bg-black bg-opacity-70 px-4 py-2 rounded-b shadow text-base font-medium animate-pulse transition-all duration-300">AI is thinking...</span>
        )}
      </div>
      {/* Scenario Setup Panel */}
      <aside className="w-1/4 bg-beige p-6 flex flex-col justify-between">
        <ScenarioSetupForm onStart={handleSessionStart} />
      </aside>
      {/* Main Chat Area */}
      <main className="flex-1 flex items-center justify-center p-8 relative">
        {/* Centered microphone icon only, fixed to viewport */}
        <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
          <MicButton
            aiSpeaking={aiSpeaking}
            userSpeaking={userSpeaking}
            disabled={!session || aiThinking}
            listening={listening}
            onUserSpeechStart={() => setUserSpeaking(true)}
            onUserSpeechEnd={handleUserSpeechEnd}
            onAiSpeechStart={handleAiSpeechStart}
            onAiSpeechEnd={handleAiSpeechEnd}
            onTranscriptUpdate={setTranscript}
            session={session}
            aiThinking={aiThinking}
            onMicClick={handleMicClick}
            onUserAudioBlob={setUserAudioBlob} // Pass audio blob to spectrum
          />
        </div>
        {/* Feedback and other content in normal flow, not centered */}
        {feedback && (
          <div className="mt-8 w-full max-w-xl mx-auto z-0">
            <div className="bg-beige text-brown rounded shadow p-4">
              <h3 className="font-bold mb-2">Feedback</h3>
              <div>{feedback}</div>
            </div>
          </div>
        )}
      </main>
      {/* Transcript Sidebar */}
      <aside className="w-1/4 bg-tan p-4 overflow-y-auto">
        <TranscriptSidebar transcript={transcript} session={session} />
      </aside>
      {/* Place the live feedback spectrum floating at bottom right */}
      <LiveFeedbackSpectrum audioBlob={userAudioBlob} />
    </div>
  );
}
