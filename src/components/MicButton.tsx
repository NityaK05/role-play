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

  // Only start listening when mic is clicked
  const handleMicButtonClick = () => {
    setClicked(true);
    if (onMicClick) onMicClick();
    setTimeout(() => setClicked(false), 180); // Animation duration
  };

  // Remove ALL auto-recording: only start when mic is clicked
  useEffect(() => {
    // Only start recording if listening is true, user explicitly started it, and mic was clicked
    // Remove any auto-recording on mount, session start, or prop change
    // (No-op unless handleMicButtonClick triggers listening)
    // If listening is turned off, stop any ongoing recording
    if (!listening && mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listening, aiSpeaking, userSpeaking, loading]);

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
          console.log('Fetched transcript:', transcript);
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
          let sfxIdx = 0;
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
                  audio.onplay = () => {
                    setMicLevel(0.7);
                    console.log('AI audio playback started');
                  };
                  audio.onended = () => {
                    console.log('AI audio playback ended');
                    playNext(idx + 1);
                  };
                  audio.onerror = (e) => {
                    console.error('AI audio playback error', e);
                    playNext(idx + 1);
                  };
                  await audio.play().catch((err) => {
                    console.error('AI audio play() promise rejected', err);
                    playNext(idx + 1);
                  });
                  return;
                } catch (err) {
                  console.error('AI audio playback exception', err);
                  playNext(idx + 1);
                  return;
                }
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
                sfxAudio.onerror = () => playNext(idx + 1);
                sfxAudio.play().catch(() => playNext(idx + 1));
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
              console.log('TTS audio blob size:', ttsBlob.size);
              if (ttsBlob.size === 0) {
                setMicLevel(0);
                onAiSpeechEnd();
                console.error('TTS returned empty audio blob');
                return;
              }
              const ttsUrl = URL.createObjectURL(ttsBlob);
              try {
                const audio = new Audio(ttsUrl);
                audio.onplay = () => {
                  setMicLevel(0.7); // Simulate AI voice pulse
                  console.log('Fallback TTS audio playback started');
                };
                audio.onended = () => {
                  setMicLevel(0);
                  onAiSpeechEnd();
                  URL.revokeObjectURL(ttsUrl);
                  console.log('Fallback TTS audio playback ended');
                };
                audio.onerror = (e) => {
                  setMicLevel(0);
                  onAiSpeechEnd();
                  URL.revokeObjectURL(ttsUrl);
                  console.error('Fallback TTS audio playback error', e);
                };
                await audio.play().catch((err) => {
                  setMicLevel(0);
                  onAiSpeechEnd();
                  URL.revokeObjectURL(ttsUrl);
                  console.error('Fallback TTS audio play() promise rejected', err);
                });
              } catch (err) {
                setMicLevel(0);
                onAiSpeechEnd();
                URL.revokeObjectURL(ttsUrl);
                console.error('Fallback TTS audio playback exception', err);
              }
            } else {
              setMicLevel(0);
              onAiSpeechEnd();
              const errText = await ttsRes.text();
              console.error('TTS fetch failed', ttsRes.status, errText);
            }
          } catch (err) {
            setMicLevel(0);
            onAiSpeechEnd();
            console.error('TTS fetch exception', err);
          }
        } else {
          setMicLevel(0);
          onAiSpeechEnd();
        }
        setLoading(false);
        // Remove auto-restart after AI finishes (unless you want continuous mode)
        // If you want continuous mode, gate this behind a user setting or explicit toggle
        // if (listening) {
        //   setTimeout(() => {
        //     if (listening && !aiSpeaking) {
        //       isRecordingRef.current = true;
        //       handleRecord().finally(() => {
        //         isRecordingRef.current = false;
        //       });
        //     }
        //   }, 4000);
        // }
      };
      recorder.start();
      // REMOVE fixed timeout: let VAD handle stopping
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
    // Softer, more natural pulse for user: scale and shadow increase gently with volume
    pulseScale = 1 + Math.min(micLevel * 5, 1.25); // less dramatic scaling
    pulseShadow = micLevel > 0.03 ? `0 0 ${28 + micLevel * 80}px 12px rgba(210,180,140,${0.22 + micLevel * 0.6})` : 'none';
  } else if (aiSpeaking && !aiThinking) {
    // Smooth, gentle pulse for AI: no sudden jumps
    const t = Date.now() / 600;
    const aiLevel = 0.12 + 0.08 * Math.sin(t) + 0.04 * Math.sin(t * 2.1);
    pulseScale = 1 + aiLevel * 2.2;
    pulseShadow = `0 0 ${36 + aiLevel * 60}px 12px rgba(210,180,140,${0.22 + aiLevel * 0.5})`;
  }

  return (
    <button
      className={`rounded-full w-36 h-36 flex items-center justify-center bg-brown text-beige text-5xl shadow-lg transition-all duration-150 ${(userSpeaking || aiSpeaking) && !aiThinking ? 'mic-pulse' : ''} ${clicked ? styles['mic-clicked'] : ''}`}
      style={{ transform: `scale(${pulseScale})`, boxShadow: pulseShadow, outline: clicked ? '4px solid #D2B48C' : 'none', outlineOffset: '4px' }}
      disabled={disabled || loading}
      aria-label="Microphone"
      onClick={handleMicButtonClick}
    >
      <span role="img" aria-label="mic">🎤</span>
    </button>
  );
};

export default MicButton;

