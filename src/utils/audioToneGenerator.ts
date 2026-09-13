// Simple Web Audio API tone/ambient generator so sample audio tracks have real audible playback in the browser
let audioCtx: AudioContext | null = null;
let currentOscillator: OscillatorNode | null = null;
let currentGain: GainNode | null = null;

export function playSampleAudioTrackTone(onEnded?: () => void): { stop: () => void } {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      return { stop: () => {} };
    }
    if (!audioCtx || audioCtx.state === "closed") {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    // Gentle warm chime frequency (F#3 / C#4 harmonics)
    osc.type = "sine";
    osc.frequency.setValueAtTime(220, audioCtx.currentTime); // A3
    osc.frequency.exponentialRampToValueAtTime(330, audioCtx.currentTime + 1.5); // E4
    osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 3.0); // A4

    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.12, audioCtx.currentTime + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 6.0);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 6.0);

    osc.onended = () => {
      onEnded?.();
    };

    currentOscillator = osc;
    currentGain = gain;

    return {
      stop: () => {
        try {
          osc.stop();
          osc.disconnect();
        } catch {
          // ignore
        }
      },
    };
  } catch (err) {
    console.warn("AudioContext not supported or blocked by autoplay policy:", err);
    return { stop: () => {} };
  }
}
