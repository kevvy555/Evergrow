export class FeedbackService {
  constructor() { this.enabled = true; this.audioContext = null; }
  toggle() { this.enabled = !this.enabled; return this.enabled; }

  handle(events) {
    if (!this.enabled || events.length === 0) return;
    const wonder = events.find((event) => event.type === 'wonderDiscovered');
    const radiantBorn = events.find((event) => event.type === 'radiantBorn');
    const radiantMerge = events.find((event) => event.type === 'radiantMerge');
    const evolution = events.find((event) => event.type === 'evolutionChosen');
    const bloom = events.find((event) => event.type === 'bloomStart');
    const perfect = events.find((event) => event.type === 'perfectMerge');
    const resonance = events.find((event) => event.type === 'resonance');
    const discovery = events.find((event) => event.type === 'discovery');
    const goal = events.find((event) => event.type === 'goalComplete');
    const spark = events.find((event) => event.type === 'sparkCollected');
    const merges = events.filter((event) => event.type === 'merge');

    if (wonder) { this.#tones([294, 440, 587, 740], 0.07); this.#vibrate([18, 18, 30, 18, 42]); }
    else if (radiantBorn) { this.#tones([659, 831, 988], 0.06); this.#vibrate([10, 12, 28]); }
    else if (radiantMerge) { this.#tones([392, 659, 988], 0.065); this.#vibrate([14, 16, 34]); }
    else if (evolution) { this.#tones([330, 440, 554, 659], 0.065); this.#vibrate([18, 20, 28, 24, 36]); }
    else if (bloom) { this.#tones([261, 392, 523, 659], 0.06); this.#vibrate([20, 24, 45]); }
    else if (perfect) { this.#tones([523, 659, 784], 0.06); this.#vibrate([12, 18, 30]); }
    else if (resonance) { this.#tones([440, 587], 0.045); this.#vibrate(16); }
    else if (discovery) { this.#tones([392, 523, 659], 0.075); this.#vibrate([18, 30, 30]); }
    else if (goal) { this.#tones([440, 554, 659], 0.065); this.#vibrate([12, 22, 20]); }
    else if (spark) { this.#tones([659, 784], 0.055); this.#vibrate(22); }
    else if (merges.length > 0) {
      const chain = Math.max(...merges.map((event) => event.chain));
      this.#tone(300 + chain * 90, 0.045, 0.04);
      this.#vibrate(Math.min(24, 8 + chain * 4));
    } else if (events.some((event) => event.type === 'spawn')) this.#tone(210, 0.018, 0.025);
  }

  #getAudioContext() {
    if (typeof window === 'undefined') return null;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    if (!this.audioContext) this.audioContext = new AudioContext();
    if (this.audioContext.state === 'suspended') this.audioContext.resume().catch(() => {});
    return this.audioContext;
  }

  #tone(frequency, gainValue, duration, delay = 0) {
    const context = this.#getAudioContext();
    if (!context) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = context.currentTime + delay;
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.01);
  }

  #tones(frequencies, gain) { frequencies.forEach((frequency, index) => this.#tone(frequency, gain, 0.12, index * 0.07)); }
  #vibrate(pattern) { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(pattern); }
}
