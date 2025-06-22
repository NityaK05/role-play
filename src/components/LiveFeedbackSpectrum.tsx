import React, { useEffect, useRef, useState } from 'react';

interface LiveFeedbackSpectrumProps {
  audioBlob: Blob | null;
}

const SPECTRUM_LABELS = [
  { key: 'pitch', label: 'Pitch' },
  { key: 'tone', label: 'Tone' },
  { key: 'clarity', label: 'Clarity' },
  { key: 'pace', label: 'Pace' },
];

const LiveFeedbackSpectrum: React.FC<LiveFeedbackSpectrumProps> = ({ audioBlob }) => {
  const [metrics, setMetrics] = useState({ pitch: 0, tone: 0, clarity: 0, pace: 0 });
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Live audio analysis using microphone
  useEffect(() => {
    let stream: MediaStream;
    let ctx: AudioContext;
    let analyser: AnalyserNode;
    let dataArray: Float32Array;
    let rafId: number;

    const analyze = () => {
      if (!analyser) return;
      analyser.getFloatTimeDomainData(dataArray);
      // --- Pitch (autocorrelation) ---
      let maxCorr = 0, bestLag = 0;
      for (let lag = 40; lag < 400; lag++) {
        let corr = 0;
        for (let i = 0; i < dataArray.length - lag; i++) {
          corr += dataArray[i] * dataArray[i + lag];
        }
        if (corr > maxCorr) {
          maxCorr = corr;
          bestLag = lag;
        }
      }
      const sampleRate = ctx.sampleRate;
      const pitch = bestLag ? sampleRate / bestLag : 0;
      // --- Pace (syllable rate, rough) ---
      let zeroCrossings = 0;
      for (let i = 1; i < dataArray.length; i++) {
        if ((dataArray[i - 1] < 0 && dataArray[i] > 0) || (dataArray[i - 1] > 0 && dataArray[i] < 0)) {
          zeroCrossings++;
        }
      }
      const pace = zeroCrossings / dataArray.length * 10; // rough syllable rate
      // --- Clarity (RMS energy) ---
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) sum += dataArray[i] * dataArray[i];
      const rms = Math.sqrt(sum / dataArray.length);
      const clarity = Math.min(1, rms * 8);
      // --- Tone (spectral centroid, rough) ---
      const fft = new Float32Array(analyser.frequencyBinCount);
      analyser.getFloatFrequencyData(fft);
      let centroid = 0, total = 0;
      for (let i = 0; i < fft.length; i++) {
        const mag = Math.pow(10, fft[i] / 10);
        centroid += i * mag;
        total += mag;
      }
      const tone = total ? centroid / total / fft.length : 0;
      setMetrics({
        pitch: Math.min(1, pitch / 400),
        tone: Math.min(1, tone),
        clarity,
        pace: Math.min(1, pace / 2),
      });
      rafId = requestAnimationFrame(analyze);
    };

    navigator.mediaDevices.getUserMedia({ audio: true }).then((s) => {
      stream = s;
      ctx = new window.AudioContext();
      audioContextRef.current = ctx;
      sourceRef.current = ctx.createMediaStreamSource(stream);
      analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;
      sourceRef.current.connect(analyser);
      dataArray = new Float32Array(analyser.fftSize);
      rafId = requestAnimationFrame(analyze);
    });
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (audioContextRef.current) audioContextRef.current.close();
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000, background: '#222', borderRadius: 12, padding: 16, boxShadow: '0 2px 12px #0008', minWidth: 220 }}>
      {SPECTRUM_LABELS.map((s, i) => (
        <div key={s.key} style={{ marginBottom: 10 }}>
          <div style={{ color: '#fff', fontSize: 14, marginBottom: 2 }}>{s.label}</div>
          <div style={{ background: '#444', borderRadius: 6, height: 12, width: 160, overflow: 'hidden' }}>
            <div style={{ height: 12, borderRadius: 6, background: '#D2B48C', width: `${Math.round(metrics[s.key as keyof typeof metrics] * 100)}%`, transition: 'width 0.2s' }} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default LiveFeedbackSpectrum;