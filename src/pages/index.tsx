import ScenarioSetupForm from '../components/ScenarioSetupForm';
import MicButton from '../components/MicButton';
import TranscriptSidebar from '../components/TranscriptSidebar';
import { useState, useEffect } from 'react';

export default function Home() {
  // State for session, transcript, and UI
  const [session, setSession] = useState<any>(null);
  const [transcript, setTranscript] = useState<any[]>([]);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [userSpeaking, setUserSpeaking] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [listening, setListening] = useState(false);

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

  const handleSessionStart = (sessionObj: any) => {
    setSession(sessionObj);
    setListening(true);
  };

  return (
    <div className="min-h-screen flex bg-black text-brown">
      {/* Scenario Setup Panel */}
      <aside className="w-1/4 bg-beige p-6 flex flex-col justify-between">
        <ScenarioSetupForm onStart={handleSessionStart} />
      </aside>
      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-8 relative">
        <div className="flex-1 flex flex-col items-center justify-center">
          <MicButton
            aiSpeaking={aiSpeaking}
            userSpeaking={userSpeaking}
            disabled={!session}
            listening={listening}
            onUserSpeechStart={() => setUserSpeaking(true)}
            onUserSpeechEnd={() => setUserSpeaking(false)}
            onAiSpeechStart={() => setAiSpeaking(true)}
            onAiSpeechEnd={() => setAiSpeaking(false)}
            onTranscriptUpdate={setTranscript}
            session={session}
          />
        </div>
        {feedback && (
          <div className="mt-8 p-4 bg-tan text-black rounded shadow max-w-lg">
            <h2 className="font-bold mb-2">Feedback</h2>
            <p>{feedback}</p>
          </div>
        )}
        {session && (
          <button className="mt-4 bg-brown text-beige rounded px-4 py-2" onClick={handleFeedback}>
            Get Feedback
          </button>
        )}
      </main>
      {/* Transcript Sidebar */}
      <aside className="w-1/4 bg-tan p-4 overflow-y-auto">
        <TranscriptSidebar transcript={transcript} session={session} />
      </aside>
    </div>
  );
}
