export class FeedbackService {
  constructor() { this.enabled = true; this.audioContext = null; }
  toggle() { this.enabled = !this.enabled; return this.enabled; }

  handle(events) {
    if (!this.enabled || events.length === 0) return;
    const evolution = events.find((event) => event.type === 'evolutionChosen');
    const wonder = events.find((event) => event.type === 'wonderDiscovered');
    const festival = events.find((event) => event.type === 'festivalStart');
    const harmony = events.find((event) => event.type === 'harmonyFormed');
    const wish = events.find((event) => event.type === 'wishComplete');
    const weather = events.find((event) => event.type === 'weatherStart');
    const bloom = events.find((event) => event.type === 'bloomStart');
    const radiant = events.find((event) => event.type === 'radiantBorn');
    const perfect = events.find((event) => event.type === 'perfectMerge');
    const discovery = events.find((event) => event.type === 'discovery');
    const goal = events.find((event) => event.type === 'goalComplete');
    const spark = events.find((event) => event.type === 'sparkCollected');
    const merges = events.filter((event) => event.type === 'merge');

    if (evolution) { this.#tones([330, 440, 554, 659], 0.065); this.#vibrate([18, 20, 28, 24, 36]); }
    else if (wonder) { this.#tones([392, 587, 740, 880], 0.06); this.#vibrate([14, 16, 22, 18, 30]); }
    else if (festival) { this.#tones([392, 494, 587, 784], 0.06); this.#vibrate([12, 14, 18, 14, 26]); }
    else if (harmony) { this.#tones([349, 440, 523], 0.055); this.#vibrate([10, 16, 24]); }
    else if (wish) { this.#tones([440, 554, 659], 0.055); this.#vibrate([10, 14, 20]); }
    else if (weather) { this.#tones(this.#weatherTones(weather.weatherId), 0.035); this.#vibrate(10); }
    else if (bloom) { this.#tones([261, 392, 523, 659], 0.06); this.#vibrate([20, 24, 45]); }
    else if (radiant) { this.#tones([523, 659, 784], 0.06); this.#vibrate([12, 18, 30]); }
    else if (perfect) { this.#tones([523, 659, 784], 0.06); this.#vibrate([12, 18, 30]); }
    else if (discovery) { this.#tones([392, 523, 659], 0.075); this.#vibrate([18, 30, 30]); }
    else if (goal) { this.#tones([440, 554, 659], 0.065); this.#vibrate([12, 22, 20]); }
    else if (spark) { this.#tones([659, 784], 0.055); this.#vibrate(22); }
    else if (merges.length > 0) {
      const chain = Math.max(...merges.map((event) => event.chain));
      this.#tone(300 + chain * 90, 0.045, 0.04);
      this.#vibrate(Math.min(24, 8 + chain * 4));
    } else if (events.some((event) => event.type === 'spawn')) this.#tone(210, 0.018, 0.025);
  }

  #weatherTones(id) {
    if (id === 'rain') return [294, 349];
    if (id === 'golden_hour') return [440, 554, 659];
    return [523, 698, 880];
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
