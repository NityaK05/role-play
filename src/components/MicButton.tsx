import React, { useRef, useState, useEffect } from 'react';

interface MicButtonProps {
  aiSpeaking: boolean;
  userSpeaking: boolean;
  disabled: boolean;
  listening: boolean;
  onUserSpeechStart: () => void;
  onUserSpeechEnd: () => void;
  onAiSpeechStart: () => void;
  onAiSpeechEnd: () => void;
  onTranscriptUpdate: (t: any[]) => void;
  session: any;
}

const SILENCE_THRESHOLD = 0.02; // More sensitive to quiet speech
const SILENCE_DURATION = 1800; // Wait longer before stopping (ms)

const MicButton: React.FC<MicButtonProps> = ({
  aiSpeaking,
  userSpeaking,
  disabled,
  listening,
  onUserSpeechStart,
  onUserSpeechEnd,
  onAiSpeechStart,
  onAiSpeechEnd,
  onTranscriptUpdate,
  session,
}) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const [loading, setLoading] = useState(false);
  const isRecordingRef = useRef(false);
  const [micLevel, setMicLevel] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Mic level animation and VAD
  const startMicLevel = (stream: MediaStream, recorder: MediaRecorder) => {
    if (!audioContextRef.current) audioContextRef.current = new window.AudioContext();
    const ctx = audioContextRef.current;
    if (sourceRef.current) sourceRef.current.disconnect();
    sourceRef.current = ctx.createMediaStreamSource(stream);
    if (analyserRef.current) analyserRef.current.disconnect();
    analyserRef.current = ctx.createAnalyser();
    analyserRef.current.fftSize = 256;
    sourceRef.current.connect(analyserRef.current);
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    let silenceMs = 0;
    let lastActive = Date.now();
    const update = () => {
      analyserRef.current!.getByteTimeDomainData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const val = (dataArray[i] - 128) / 128;
        sum += val * val;
      }
      const rms = Math.sqrt(sum / dataArray.length);
      setMicLevel(rms);
      if (rms > SILENCE_THRESHOLD) {
        lastActive = Date.now();
      }
      // If silence detected for SILENCE_DURATION, stop recording
      if (Date.now() - lastActive > SILENCE_DURATION && recorder.state === 'recording') {
        recorder.stop();
        return;
      }
      rafRef.current = requestAnimationFrame(update);
    };
    update();
  };
  const stopMicLevel = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setMicLevel(0);
  };

  // Auto-record when listening is true and AI is not speaking
  useEffect(() => {
    if (listening && !aiSpeaking && !userSpeaking && !loading && !isRecordingRef.current) {
      isRecordingRef.current = true;
      handleRecord().finally(() => {
        isRecordingRef.current = false;
      });
    }
    // If listening is turned off, stop any ongoing recording
    if (!listening && mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listening, aiSpeaking]);

  const handleRecord = async () => {
    if (!session || loading) return;
    setLoading(true);
    try {
      onUserSpeechStart();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new window.MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunks.current = [];
      startMicLevel(stream, recorder);
      recorder.ondataavailable = (e) => audioChunks.current.push(e.data);
      recorder.onstop = async () => {
        stopMicLevel();
        stream.getTracks().forEach((track) => track.stop());
        onUserSpeechEnd();
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        // Send audio to backend for Whisper STT
        const formData = new FormData();
        formData.append('file', audioBlob, 'audio.webm');
        let sttData;
        try {
          const sttRes = await fetch('/api/whisper', {
            method: 'POST',
            body: formData,
          });
          sttData = await sttRes.json();
        } catch (err) {
          setLoading(false);
          return;
        }
        const text = sttData.text;
        if (!text) {
          setLoading(false);
          return;
        }
        // Send text to backend for AI response
        onAiSpeechStart();
        let sendData;
        try {
          const sendRes = await fetch('/api/sendExchange', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: session.id, text }),
          });
          sendData = await sendRes.json();
        } catch (err) {
          onAiSpeechEnd();
          setLoading(false);
          return;
        }
        // Update transcript in UI
        try {
          const transcriptRes = await fetch(`/api/session/${session.id}/transcript?format=json`);
          const transcript = await transcriptRes.json();
          onTranscriptUpdate(transcript);
        } catch {}
        // Play AI audio (if available)
        if (sendData.audioUrl) {
          const audio = new Audio(sendData.audioUrl);
          audio.onplay = () => setMicLevel(0.7); // Simulate AI voice pulse
          audio.onended = () => {
            setMicLevel(0);
            onAiSpeechEnd();
          };
          audio.play();
        } else if (sendData.aiText) {
          // Fallback: call TTS from frontend
          try {
            const ttsRes = await fetch('/api/tts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: sendData.aiText }),
            });
            if (ttsRes.ok) {
              const ttsBlob = await ttsRes.blob();
              const ttsUrl = URL.createObjectURL(ttsBlob);
              const audio = new Audio(ttsUrl);
              audio.onplay = () => setMicLevel(0.7); // Simulate AI voice pulse
              audio.onended = () => {
                setMicLevel(0);
                onAiSpeechEnd();
                URL.revokeObjectURL(ttsUrl);
              };
              audio.play();
            } else {
              setMicLevel(0);
              onAiSpeechEnd();
            }
          } catch {
            setMicLevel(0);
            onAiSpeechEnd();
          }
        } else {
          setMicLevel(0);
          onAiSpeechEnd();
        }
        setLoading(false);
        // If continuous listening, auto-restart after AI finishes
        if (listening) {
          setTimeout(() => {
            if (listening && !aiSpeaking) {
              isRecordingRef.current = true;
              handleRecord().finally(() => {
                isRecordingRef.current = false;
              });
            }
          }, 500); // short delay to avoid overlap
        }
      };
      recorder.start();
      // REMOVE fixed timeout: let VAD handle stopping
    } catch (err) {
      stopMicLevel();
      onUserSpeechEnd();
      setLoading(false);
    }
  };

  // Pulse style based on micLevel
  const pulseScale = 1 + micLevel * 4; // More extreme scaling
  const pulseShadow = micLevel > 0.05 ? `0 0 ${24 + micLevel * 40}px 8px rgba(210,180,140,${0.2 + micLevel * 0.7})` : 'none';

  return (
    <button
      className={`rounded-full w-24 h-24 flex items-center justify-center bg-brown text-beige text-3xl shadow-lg transition-all ${userSpeaking || aiSpeaking ? 'mic-pulse' : ''}`}
      style={{ transform: `scale(${pulseScale})`, boxShadow: pulseShadow }}
      disabled={disabled || loading}
      aria-label="Microphone"
      onClick={() => handleRecord()}
    >
      <span role="img" aria-label="mic">🎤</span>
    </button>
  );
};

export default MicButton;
