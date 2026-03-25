let sharedCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!sharedCtx || sharedCtx.state === "closed") {
      sharedCtx = new AudioContext();
    }
    return sharedCtx;
  } catch {
    return null;
  }
}

export function playAlarmSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const resume = ctx.state === "suspended" ? ctx.resume() : Promise.resolve();
    resume
      .then(() => {
        const now = ctx.currentTime;

        // Layer 1: sawtooth sweep
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = "sawtooth";
        osc1.frequency.setValueAtTime(220, now);
        osc1.frequency.exponentialRampToValueAtTime(880, now + 0.3);
        osc1.frequency.exponentialRampToValueAtTime(110, now + 0.6);
        osc1.frequency.exponentialRampToValueAtTime(660, now + 0.9);
        osc1.frequency.exponentialRampToValueAtTime(165, now + 1.2);
        gain1.gain.setValueAtTime(0.35, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 1.5);

        // Layer 2: square glitch
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = "square";
        osc2.frequency.setValueAtTime(440, now);
        osc2.frequency.setValueAtTime(880, now + 0.15);
        osc2.frequency.setValueAtTime(330, now + 0.3);
        osc2.frequency.setValueAtTime(990, now + 0.45);
        osc2.frequency.setValueAtTime(220, now + 0.6);
        osc2.frequency.setValueAtTime(770, now + 0.75);
        osc2.frequency.setValueAtTime(110, now + 0.9);
        gain2.gain.setValueAtTime(0.2, now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now);
        osc2.stop(now + 1.5);

        // Distortion/noise burst
        const bufferSize = ctx.sampleRate * 0.05;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * 0.4;
        }
        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = noiseBuffer;
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.4, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        noiseSource.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        noiseSource.start(now);
      })
      .catch(() => {});
  } catch {
    // Silently handle autoplay policy errors
  }
}

export function playResolutionChime(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const resume = ctx.state === "suspended" ? ctx.resume() : Promise.resolve();
    resume
      .then(() => {
        const now = ctx.currentTime;
        const tones = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        tones.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + i * 0.18);
          gain.gain.setValueAtTime(0, now + i * 0.18);
          gain.gain.linearRampToValueAtTime(0.3, now + i * 0.18 + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.18 + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.18);
          osc.stop(now + i * 0.18 + 0.4);
        });
      })
      .catch(() => {});
  } catch {
    // Silently handle autoplay policy errors
  }
}

export function playNotificationChime(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const resume = ctx.state === "suspended" ? ctx.resume() : Promise.resolve();
    resume
      .then(() => {
        const now = ctx.currentTime;

        // Sine tone
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(880, now);
        osc1.frequency.exponentialRampToValueAtTime(1320, now + 0.15);
        gain1.gain.setValueAtTime(0, now);
        gain1.gain.linearRampToValueAtTime(0.3, now + 0.04);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.5);

        // Triangle layer
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = "triangle";
        osc2.frequency.setValueAtTime(1100, now);
        gain2.gain.setValueAtTime(0, now);
        gain2.gain.linearRampToValueAtTime(0.15, now + 0.04);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now);
        osc2.stop(now + 0.5);
      })
      .catch(() => {});
  } catch {
    // Silently handle autoplay policy errors
  }
}
