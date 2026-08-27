export const WEATHER_DEFINITIONS = Object.freeze([
  Object.freeze({ id: 'rain', icon: '🌧️', name: 'Rain', turns: 6, description: 'Nature beside nature grows stronger.' }),
  Object.freeze({ id: 'golden_hour', icon: '🌤️', name: 'Golden Hour', turns: 5, description: 'Merges shine for bonus score.' }),
  Object.freeze({ id: 'starlight', icon: '🌠', name: 'Starlight', turns: 5, description: 'Life Sparks become Radiant.' }),
]);

export function getWeatherDefinition(id) {
  return WEATHER_DEFINITIONS.find((weather) => weather.id === id) ?? null;
}

export const DAY_PHASES = Object.freeze([
  Object.freeze({ id: 'dawn', icon: '🌅', name: 'Dawn' }),
  Object.freeze({ id: 'day', icon: '☀️', name: 'Day' }),
  Object.freeze({ id: 'dusk', icon: '🌇', name: 'Dusk' }),
  Object.freeze({ id: 'night', icon: '🌙', name: 'Night' }),
]);

export function getDayPhase(taps, phaseLength) {
  const index = Math.floor(Math.max(0, taps) / phaseLength) % DAY_PHASES.length;
  return DAY_PHASES[index];
}
