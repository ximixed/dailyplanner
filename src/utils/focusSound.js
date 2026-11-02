// Web Audio API synthesized ringtones for the Focus Timer
// Generates realistic, high-quality mobile phone timer ringtones with zero external audio assets

let audioCtx = null;
let activeLoopTimer = null;
let autoStopTimer = null;
let activeGainNodes = [];

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function unlockAudio() {
  try {
    const ctx = getAudioContext();
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
  } catch {
    // Ignore audio unlock error
  }
}

/**
 * Play a single note with bell/marimba harmonics and natural decay
 */
function playTone({ ctx, freq, startTime, duration = 0.35, type = "sine", gain = 0.3, harmonics = true }) {
  if (!ctx) return;

  const now = startTime;
  const masterGain = ctx.createGain();
  masterGain.connect(ctx.destination);
  masterGain.gain.setValueAtTime(0, now);
  masterGain.gain.linearRampToValueAtTime(gain, now + 0.015);
  masterGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  activeGainNodes.push(masterGain);

  // Fundamental oscillator
  const osc1 = ctx.createOscillator();
  osc1.type = type;
  osc1.frequency.setValueAtTime(freq, now);
  osc1.connect(masterGain);
  osc1.start(now);
  osc1.stop(now + duration);

  // Overtone harmonic for rich acoustic marimba/chime body
  if (harmonics) {
    const osc2 = ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(freq * 2, now);
    const harmGain = ctx.createGain();
    harmGain.gain.setValueAtTime(gain * 0.25, now);
    harmGain.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.7);
    osc2.connect(harmGain);
    harmGain.connect(ctx.destination);
    osc2.start(now);
    osc2.stop(now + duration * 0.7);
    activeGainNodes.push(harmGain);
  }
}

export const RINGTONE_OPTIONS = [
  { id: "marimba", label: "📱 Marimba Chime (Phone Default)", loopDuration: 2200 },
  { id: "digital", label: "⏰ Digital Alarm (Classic Beep)",  loopDuration: 2000 },
  { id: "radar",   label: "📡 Radar Pulse",                   loopDuration: 1800 },
  { id: "bell",    label: "🔔 Gentle Bell Chime",             loopDuration: 2500 },
];

/**
 * Plays one pattern cycle of the selected ringtone
 */
export function playPattern(soundId = "marimba", volume = 0.7) {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime + 0.05;
  const vol = Math.max(0.1, Math.min(1, volume));

  switch (soundId) {
    case "digital": {
      // Classic phone double-beep pattern: beep-beep, beep-beep!
      const beeps = [
        { f: 880,  t: 0.00, d: 0.10 },
        { f: 880,  t: 0.14, d: 0.10 },
        { f: 880,  t: 0.36, d: 0.10 },
        { f: 1175, t: 0.50, d: 0.22 },
      ];
      beeps.forEach(b => {
        playTone({
          ctx,
          freq: b.f,
          startTime: now + b.t,
          duration: b.d,
          type: "square",
          gain: vol * 0.22,
          harmonics: false,
        });
      });
      break;
    }

    case "radar": {
      // Modern rhythmic dual-pulse radar chime
      const pulses = [
        { f: 1200, t: 0.00, d: 0.15 },
        { f: 1600, t: 0.20, d: 0.25 },
        { f: 1200, t: 0.55, d: 0.15 },
        { f: 1600, t: 0.75, d: 0.35 },
      ];
      pulses.forEach(p => {
        playTone({
          ctx,
          freq: p.f,
          startTime: now + p.t,
          duration: p.d,
          type: "sine",
          gain: vol * 0.35,
          harmonics: true,
        });
      });
      break;
    }

    case "bell": {
      // Soothing singing bell chime with warm harmonic overtone
      const bellNotes = [
        { f: 587.33, t: 0.00, d: 1.2 }, // D5
        { f: 880.00, t: 0.35, d: 1.4 }, // A5
        { f: 1174.66, t: 0.70, d: 1.6 }, // D6
      ];
      bellNotes.forEach(b => {
        playTone({
          ctx,
          freq: b.f,
          startTime: now + b.t,
          duration: b.d,
          type: "sine",
          gain: vol * 0.32,
          harmonics: true,
        });
      });
      break;
    }

    case "marimba":
    default: {
      // Warm, melodic mobile phone marimba ringtone
      // Ascending arpeggio C5 -> E5 -> G5 -> C6 followed by cheerful cadence
      const notes = [
        { f: 523.25, t: 0.00, d: 0.32 }, // C5
        { f: 659.25, t: 0.15, d: 0.32 }, // E5
        { f: 783.99, t: 0.30, d: 0.35 }, // G5
        { f: 1046.5, t: 0.45, d: 0.55 }, // C6
        { f: 783.99, t: 0.75, d: 0.30 }, // G5
        { f: 1046.5, t: 0.90, d: 0.65 }, // C6
      ];
      notes.forEach(n => {
        playTone({
          ctx,
          freq: n.f,
          startTime: now + n.t,
          duration: n.d,
          type: "triangle",
          gain: vol * 0.38,
          harmonics: true,
        });
      });
      break;
    }
  }
}

/**
 * Starts continuous ringtone looping when the timer ends
 */
export function startRingtone({ soundId = "marimba", volume = 0.7, onAutoStop } = {}) {
  stopRingtone();
  unlockAudio();

  const option = RINGTONE_OPTIONS.find(o => o.id === soundId) || RINGTONE_OPTIONS[0];
  const interval = option.loopDuration || 2200;

  // Play immediate first cycle
  playPattern(soundId, volume);

  // Repeat every cycle
  activeLoopTimer = setInterval(() => {
    playPattern(soundId, volume);
  }, interval);

  // Automatically silence after 30 seconds if unattended (like a phone timer screen timeout)
  autoStopTimer = setTimeout(() => {
    stopRingtone();
    onAutoStop?.();
  }, 30000);
}

/**
 * Stop and silence all ringing immediately
 */
export function stopRingtone() {
  if (activeLoopTimer) {
    clearInterval(activeLoopTimer);
    activeLoopTimer = null;
  }
  if (autoStopTimer) {
    clearTimeout(autoStopTimer);
    autoStopTimer = null;
  }

  // Fade out any currently sustaining sounds
  if (audioCtx) {
    const now = audioCtx.currentTime;
    activeGainNodes.forEach(g => {
      try {
        g.gain.cancelScheduledValues(now);
        g.gain.setValueAtTime(g.gain.value, now);
        g.gain.linearRampToValueAtTime(0.0001, now + 0.05);
      } catch {
        // Node might have already finished
      }
    });
  }
  activeGainNodes = [];
}
