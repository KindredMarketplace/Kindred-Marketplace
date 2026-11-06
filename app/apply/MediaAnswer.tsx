'use client';

/**
 * MediaAnswer — record a video/audio answer in the browser, or upload a file.
 *
 * Uses getUserMedia + MediaRecorder so the applicant records in place. While
 * recording video you see a live (mirrored) preview of yourself; while
 * recording audio you see a live waveform of your voice, so it's obvious it's
 * working. Falls back to file upload. Produces a File via onChange.
 *
 * getUserMedia needs HTTPS or localhost — both fine here.
 */

import { useEffect, useRef, useState } from 'react';

const MAX_SECONDS = 180; // 3 minutes

type Mode = 'choose' | 'recording' | 'preview';
type Kind = 'video' | 'audio';

export function MediaAnswer({
  value,
  onChange,
  disabled,
}: {
  value: File | null;
  onChange: (f: File | null) => void;
  disabled?: boolean;
}) {
  const [mode, setMode] = useState<Mode>('choose');
  const [recordingKind, setRecordingKind] = useState<Kind>('video');
  const [previewKind, setPreviewKind] = useState<Kind>('video');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const liveVideoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Audio visualizer
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const levelsRef = useRef<number[]>([]);
  const lastSampleRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      teardownAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Attach the live camera feed once the <video> is on screen.
  useEffect(() => {
    if (mode === 'recording' && recordingKind === 'video' && liveVideoRef.current && streamRef.current) {
      liveVideoRef.current.srcObject = streamRef.current;
      liveVideoRef.current.play().catch(() => {});
    }
  }, [mode, recordingKind]);

  // Run the audio waveform while recording audio.
  useEffect(() => {
    if (mode === 'recording' && recordingKind === 'audio') {
      drawWaveform();
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, recordingKind]);

  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  function teardownAudioGraph() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    analyserRef.current = null;
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
  }

  function teardownAll() {
    stopStream();
    teardownAudioGraph();
    if (timerRef.current) clearInterval(timerRef.current);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }

  function clearPreview() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  }

  function setupAudioGraph(stream: MediaStream) {
    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser); // no connection to destination — avoids echo
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
    } catch {
      // Visualizer is a nicety; recording still works without it.
    }
  }

  function drawWaveform() {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const buffer = new Uint8Array(analyser.fftSize);
    levelsRef.current = [];
    lastSampleRef.current = 0;

    const BAR = 3; // bar width
    const GAP = 2; // gap between bars
    const STEP = BAR + GAP;
    const SAMPLE_MS = 70; // how often a new bar is captured

    const render = (now: number) => {
      rafRef.current = requestAnimationFrame(render);

      const { width, height } = canvas;
      const maxBars = Math.floor(width / STEP);

      // Sample loudness on a fixed cadence so bars march left -> right like a
      // voice memo, instead of twitching in place. Older bars scroll off.
      if (now - lastSampleRef.current >= SAMPLE_MS) {
        analyser.getByteTimeDomainData(buffer);
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
          const v = (buffer[i] - 128) / 128; // -1..1
          sum += v * v;
        }
        const rms = Math.sqrt(sum / buffer.length); // 0..~1
        levelsRef.current.push(Math.min(1, rms * 2.2)); // gain up a touch
        if (levelsRef.current.length > maxBars) levelsRef.current.shift();
        lastSampleRef.current = now;
      }

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#2C7A7B'; // deepteal
      const levels = levelsRef.current;
      const mid = height / 2;
      for (let i = 0; i < levels.length; i++) {
        const x = i * STEP;
        const barH = Math.max(2, levels[i] * (height - 6));
        ctx.fillRect(x, mid - barH / 2, BAR, barH);
      }
    };
    rafRef.current = requestAnimationFrame(render);
  }

  async function startRecording(kind: Kind) {
    setError(null);
    clearPreview();
    onChange(null);
    chunksRef.current = [];
    setRecordingKind(kind);

    try {
      const stream = await navigator.mediaDevices.getUserMedia(
        kind === 'video' ? { video: { facingMode: 'user' }, audio: true } : { audio: true },
      );
      streamRef.current = stream;

      if (kind === 'audio') setupAudioGraph(stream);

      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const type = recorder.mimeType || (kind === 'video' ? 'video/webm' : 'audio/webm');
        const blob = new Blob(chunksRef.current, { type });
        const ext = type.includes('mp4') ? (kind === 'video' ? 'mp4' : 'm4a') : 'webm';
        const file = new File([blob], `answer.${ext}`, { type });
        setPreviewUrl(URL.createObjectURL(blob));
        setPreviewKind(kind);
        onChange(file);
        setMode('preview');
        stopStream();
        teardownAudioGraph();
      };

      recorder.start();
      setMode('recording');
      setElapsed(0);
      timerRef.current = setInterval(() => {
        setElapsed((s) => {
          if (s + 1 >= MAX_SECONDS) {
            stopRecording();
            return MAX_SECONDS;
          }
          return s + 1;
        });
      }, 1000);
    } catch {
      setError(
        'We couldn\u2019t reach your camera or microphone. Check your browser\u2019s permissions, or upload a file instead.',
      );
      setMode('choose');
      stopStream();
    }
  }

  function stopRecording() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
  }

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (!f) return;
    clearPreview();
    const kind: Kind = f.type.startsWith('audio/') ? 'audio' : 'video';
    setPreviewKind(kind);
    setPreviewUrl(URL.createObjectURL(f));
    onChange(f);
    setMode('preview');
  }

  function reset() {
    clearPreview();
    onChange(null);
    setElapsed(0);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setMode('choose');
  }

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,audio/*"
        className="hidden"
        onChange={handleUpload}
      />

      {mode === 'choose' && (
        <div className="grid grid-cols-3 gap-2">
          <RecordButton label="Record video" icon="🎥" onClick={() => startRecording('video')} disabled={disabled} />
          <RecordButton label="Record audio" icon="🎙️" onClick={() => startRecording('audio')} disabled={disabled} />
          <RecordButton
            label="Upload a file"
            icon="📁"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
          />
        </div>
      )}

      {mode === 'recording' && (
        <div className="rounded-xl border border-ink/15 bg-white p-3">
          {recordingKind === 'video' ? (
            <video
              ref={liveVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full rounded-lg bg-black aspect-video object-cover [transform:scaleX(-1)]"
            />
          ) : (
            <div className="rounded-lg bg-ink/5 p-3">
              <canvas ref={canvasRef} width={600} height={96} className="w-full h-24" />
            </div>
          )}
          <div className="mt-3 flex items-center justify-between">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-coral">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-coral animate-pulse" />
              Recording · {fmt(elapsed)} <span className="text-ink/40 font-normal">/ 3:00 max</span>
            </span>
            <button
              type="button"
              onClick={stopRecording}
              className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-cream hover:bg-ink/90"
            >
              Stop
            </button>
          </div>
        </div>
      )}

      {mode === 'preview' && (
        <div className="rounded-xl border border-ink/15 bg-white p-3">
          {previewKind === 'audio' ? (
            <audio controls src={previewUrl ?? undefined} className="w-full" />
          ) : (
            <video controls src={previewUrl ?? undefined} className="w-full rounded-lg bg-black max-h-72" />
          )}
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-sage inline-flex items-center gap-1.5">
              <span>✓</span> {value?.name?.startsWith('answer.') ? 'Recorded' : 'Ready'}
            </span>
            <button
              type="button"
              onClick={reset}
              disabled={disabled}
              className="text-sm text-ink/60 hover:text-ink underline"
            >
              Redo / pick another
            </button>
          </div>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-coral">{error}</p>}
    </div>
  );
}

function RecordButton({
  label,
  icon,
  onClick,
  disabled,
}: {
  label: string;
  icon: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-ink/15 bg-white px-3 py-4 text-center transition hover:border-teal hover:bg-sage/5 disabled:opacity-60"
    >
      <span className="text-xl">{icon}</span>
      <span className="text-xs font-medium text-ink/80">{label}</span>
    </button>
  );
}
