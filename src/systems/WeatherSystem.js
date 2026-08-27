import { GAME_CONFIG, ENTITY_DEFINITIONS } from '../core/config.js';
import { WEATHER_DEFINITIONS, getWeatherDefinition } from '../core/weatherDefinitions.js';
import { allNeighbours } from '../utils/grid.js';

export class WeatherSystem {
  constructor(world) { this.world = world; }

  get active() { return getWeatherDefinition(this.world.weatherId); }
  prepareTurn() { return { wasActive: this.world.weatherTurns > 0, weatherId: this.world.weatherId }; }

  adjustSpawnLevel(x, y, baseLevel) {
    if (this.world.weatherId !== 'rain' || baseLevel > 0) return baseLevel;
    const nearNature = allNeighbours(x, y, this.world.columns, this.world.rows)
      .some((cell) => {
        const entity = this.world.getCell(cell.x, cell.y);
        return entity && entity.level >= 1 && entity.level <= 2;
      });
    return nearNature ? 1 : baseLevel;
  }

  getSparkVariant() {
    return this.world.weatherId === 'starlight' ? 'radiant' : null;
  }

  apply(events, { wasActive, weatherId }) {
    if (wasActive && weatherId === 'golden_hour') this.#applyGoldenHour(events);

    if (wasActive) {
      this.world.weatherTurns = Math.max(0, this.world.weatherTurns - 1);
      if (this.world.weatherTurns === 0) {
        const ended = getWeatherDefinition(weatherId);
        this.world.weatherId = null;
        this.world.nextWeatherAt = this.world.taps + GAME_CONFIG.weather.clearTurns;
        if (ended) events.push({ type: 'weatherEnd', weatherId: ended.id, icon: ended.icon, name: ended.name });
      }
      return events;
    }

    if (!this.world.weatherId && this.world.discoveredLevel >= 2 && this.world.taps >= this.world.nextWeatherAt) {
      const weather = WEATHER_DEFINITIONS[this.world.weatherIndex % WEATHER_DEFINITIONS.length];
      this.world.weatherIndex += 1;
      this.world.weatherId = weather.id;
      this.world.weatherTurns = weather.turns;
      this.world.weatherEventsExperienced += 1;
      events.push({ type: 'weatherStart', weatherId: weather.id, icon: weather.icon, name: weather.name, description: weather.description, turns: weather.turns });
    }
    return events;
  }

  #applyGoldenHour(events) {
    const merges = events.filter((event) => event.type === 'merge');
    if (merges.length === 0) return;
    const bonus = Math.round(merges.reduce((sum, event) => sum + ENTITY_DEFINITIONS[event.toLevel].score, 0) * GAME_CONFIG.weather.goldenMergeMultiplier);
    if (bonus <= 0) return;
    this.world.addScore(bonus);
    events.push({ type: 'weatherBonus', weatherId: 'golden_hour', bonus });
  }
}
