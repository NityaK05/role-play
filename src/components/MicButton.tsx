import React, { useRef, useState, useEffect } from 'react';
import sfxMapJson from '../../public/sfxMap.json';
import styles from '../styles/MicButton.module.css';

// Whitelist of allowed SFX cues (real sounds only)
const ALLOWED_SFX: string[] = ['chuckles', 'laughs', 'coughs', 'sighs', 'clears throat'];

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
  aiThinking?: boolean;
  onMicClick?: () => void;
  onUserAudioBlob?: (audio: Blob) => void; // NEW PROP
}

const SILENCE_THRESHOLD = 0.025; // Less sensitive to quiet speech (lower = more tolerant, was 0.04)
const SILENCE_DURATION = 1800; // Much longer stop after silence (ms), was 600

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
  aiThinking,
  onMicClick,
  onUserAudioBlob,
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
  const [clicked, setClicked] = useState(false);

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

  // Remove auto-record when listening is true
  useEffect(() => {
    // Only auto-record if listening is true, user explicitly started it, and AI is NOT speaking
    if (listening && !aiSpeaking && !userSpeaking && !loading && !isRecordingRef.current) {
      isRecordingRef.current = true;
      handleRecord().finally(() => {
        isRecordingRef.current = false;
      });
    }
    // If listening is turned off, or AI is speaking, stop any ongoing recording
    if ((!listening || aiSpeaking) && mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listening, aiSpeaking, userSpeaking, loading]);

  const handleRecord = async () => {
    if (!session || loading || aiSpeaking) return; // Prevent recording if AI is speaking
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
        // Send audio to backend for AWS Transcribe STT
        if (onUserAudioBlob) onUserAudioBlob(audioBlob); // Pass blob up for LiveFeedbackSpectrum
        const formData = new FormData();
        formData.append('file', audioBlob, 'audio.webm');
        let sttData;
        try {
          const sttRes = await fetch('/api/transcribe', {
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
          setLoading(false);
          onAiSpeechEnd();
          return;
        }
        // Update transcript in UI
        try {
          const transcriptRes = await fetch(`/api/session/${session.id}/transcript?format=json`);
          const transcript = await transcriptRes.json();
          onTranscriptUpdate(transcript);
        } catch {}
        let sfxMap: Record<string, string> = {};
        try {
          sfxMap = sfxMapJson;
        } catch {}
        // Play AI audio (if available)
        if (sendData.audioUrl) {
          // Play SFX cues in order as they appear in aiText
          let aiText = sendData.aiText || '';
          let sfxCues: string[] = (sendData.sfxCues || []).filter((cue: string) => ALLOWED_SFX.includes(cue));
          // Split aiText by [SFX:cue] markers
          const parts = aiText.split(/\[SFX:([^\]]+)\]/i);
          const playNext = async (idx: number) => {
            if (idx >= parts.length) {
              setMicLevel(0);
              onAiSpeechEnd();
              return;
            }
            if (idx % 2 === 0) {
              // Even: TTS text (skip if empty or just whitespace)
              const text = parts[idx].trim();
              if (text) {
                try {
                  const audio = new Audio(sendData.audioUrl);
                  audio.onplay = () => setMicLevel(0.7);
                  audio.onended = () => playNext(idx + 1);
                  audio.onerror = (e) => {
                    setMicLevel(0);
                    onAiSpeechEnd();
                  };
                  audio.volume = 1.0;
                  const playPromise = audio.play();
                  if (playPromise && playPromise.catch) {
                    playPromise.catch(() => {
                      setMicLevel(0);
                      onAiSpeechEnd();
                    });
                  }
                } catch {
                  setMicLevel(0);
                  onAiSpeechEnd();
                }
                return;
              } else {
                playNext(idx + 1);
                return;
              }
            } else {
              // Odd: SFX cue (never read out loud, only play if in whitelist)
              const cue = parts[idx].trim().toLowerCase();
              if (!ALLOWED_SFX.includes(cue)) {
                playNext(idx + 1);
                return;
              }
              const sfxUrl = sfxMap[cue];
              if (sfxUrl) {
                const sfxAudio = new Audio(sfxUrl);
                sfxAudio.onended = () => playNext(idx + 1);
                sfxAudio.play();
                return;
              } else {
                playNext(idx + 1);
                return;
              }
            }
          };
          playNext(0);
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
              try {
                const audio = new Audio(ttsUrl);
                audio.onplay = () => setMicLevel(0.7); // Simulate AI voice pulse
                audio.onended = () => {
                  setMicLevel(0);
                  onAiSpeechEnd();
                  URL.revokeObjectURL(ttsUrl);
                };
                audio.onerror = () => {
                  setMicLevel(0);
                  onAiSpeechEnd();
                  URL.revokeObjectURL(ttsUrl);
                };
                audio.volume = 1.0;
                const playPromise = audio.play();
                if (playPromise && playPromise.catch) {
                  playPromise.catch(() => {
                    setMicLevel(0);
                    onAiSpeechEnd();
                    URL.revokeObjectURL(ttsUrl);
                  });
                }
              } catch {
                setMicLevel(0);
                onAiSpeechEnd();
                URL.revokeObjectURL(ttsUrl);
              }
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
      };
      recorder.start();
    } catch (err) {
      stopMicLevel();
      onUserSpeechEnd();
      setLoading(false);
    }
  };

  // Pulse style based on micLevel and speaking state
  let pulseScale = 1;
  let pulseShadow = 'none';
  if (clicked) {
    pulseScale = 1.18;
    pulseShadow = '0 0 48px 18px rgba(210,180,140,0.35)';
  } else if (userSpeaking && !aiThinking) {
    pulseScale = 1 + Math.min(micLevel * 5, 1.25);
    pulseShadow = micLevel > 0.03 ? `0 0 ${28 + micLevel * 80}px 12px rgba(210,180,140,${0.22 + micLevel * 0.6})` : 'none';
  } else if (aiSpeaking && !aiThinking) {
    const t = Date.now() / 600;
    const aiLevel = 0.12 + 0.08 * Math.sin(t) + 0.04 * Math.sin(t * 2.1);
    pulseScale = 1 + aiLevel * 2.2;
    pulseShadow = `0 0 ${36 + aiLevel * 60}px 12px rgba(210,180,140,${0.22 + aiLevel * 0.5})`;
  }

  // Only start listening when mic is clicked and AI is NOT speaking
  const handleMicButtonClick = () => {
    if (aiSpeaking) return; // Prevent listening if AI is speaking
    setClicked(true);
    if (onMicClick) onMicClick();
    setTimeout(() => setClicked(false), 180); // Animation duration
  };

  // Ensure loading is always reset after AI speaks
  useEffect(() => {
    if (!aiSpeaking) {
      setLoading(false);
    }
  }, [aiSpeaking]);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        className={`rounded-full w-36 h-36 flex items-center justify-center bg-brown text-beige text-5xl shadow-lg transition-all duration-150 ${(userSpeaking || aiSpeaking) && !aiThinking ? 'mic-pulse' : ''} ${clicked ? styles['mic-clicked'] : ''}`}
        style={{ transform: `scale(${pulseScale})`, boxShadow: pulseShadow, outline: clicked ? '4px solid #D2B48C' : 'none', outlineOffset: '4px' }}
        disabled={disabled || loading}
        aria-label="Microphone"
        onClick={handleMicButtonClick}
      >
        <span role="img" aria-label="mic">🎤</span>
      </button>
    </div>
  );
};

export default MicButton;