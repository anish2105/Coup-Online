let isMuted = localStorage.getItem('coup_muted') === 'true';

export const getMutedState = (): boolean => isMuted;

export const setMutedState = (mute: boolean) => {
  isMuted = mute;
  localStorage.setItem('coup_muted', mute ? 'true' : 'false');
};

const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return null;
  return new AudioCtx();
};

const playSynthTone = (
  freqs: number[],
  duration: number,
  type: OscillatorType = 'sine',
  glide = false,
  volume = 0.08
) => {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  // Resume context if suspended (browser security policy)
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.type = type;
  
  const now = ctx.currentTime;
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(volume, now + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  if (freqs.length === 1) {
    osc.frequency.setValueAtTime(freqs[0], now);
  } else if (freqs.length > 1) {
    if (glide) {
      osc.frequency.setValueAtTime(freqs[0], now);
      osc.frequency.exponentialRampToValueAtTime(freqs[freqs.length - 1], now + duration);
    } else {
      // Arpeggio
      const step = duration / freqs.length;
      freqs.forEach((freq, idx) => {
        osc.frequency.setValueAtTime(freq, now + idx * step);
      });
    }
  }

  osc.start(now);
  osc.stop(now + duration);
};

// Play nice Mario-style coin chime
export const playCoinSound = () => {
  playSynthTone([987.77, 1318.51], 0.25, 'square', false, 0.05); // B5 then E6
};

// Play card draw whoosh sound
export const playCardDrawSound = () => {
  playSynthTone([150, 600], 0.15, 'triangle', true, 0.1);
};

// Play action declaration rise
export const playActionSound = () => {
  playSynthTone([440, 880], 0.2, 'sawtooth', true, 0.04);
};

// Play block shield sound
export const playBlockSound = () => {
  playSynthTone([600, 300], 0.3, 'triangle', true, 0.08);
};

// Play stealing swoosh
export const playStealSound = () => {
  playSynthTone([600, 150], 0.25, 'sine', true, 0.1);
};

// Play Coup / Assassinate explosion boom
export const playCoupSound = () => {
  playSynthTone([120, 40], 0.6, 'sawtooth', true, 0.15);
};

// Play challenge fail buzzer
export const playChallengeSound = () => {
  playSynthTone([180, 150, 180, 150], 0.4, 'sawtooth', false, 0.08);
};

// Play winning chime
export const playWinSound = () => {
  playSynthTone([523.25, 659.25, 783.99, 1046.50], 0.5, 'sine', false, 0.08);
};
