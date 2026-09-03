import { ENTITY_DEFINITIONS } from '../core/config.js';

export class GrowthSystem {
  constructor(world, mergeSystem, weatherSystem = null) {
    this.world = world;
    this.mergeSystem = mergeSystem;
    this.weatherSystem = weatherSystem;
  }

  growAt(x, y, { spawnLevel = 0 } = {}) {
    const events = [];
    const occupied = this.world.getCell(x, y);
    if (occupied) {
      events.push(
        { type: 'pulse', x, y, level: occupied.level },
        { type: 'blocked', x, y, reason: 'occupied' },
      );
      return events;
    }

    const adjustedLevel = this.weatherSystem?.adjustSpawnLevel(x, y, spawnLevel) ?? spawnLevel;
    this.#spawn(x, y, adjustedLevel, events);
    events.push(...this.mergeSystem.resolveFrom(x, y));
    return events;
  }

  #spawn(x, y, level, events) {
    const definition = ENTITY_DEFINITIONS[level];
    const wasNewDiscovery = level > this.world.discoveredLevel;
    this.world.setCell(x, y, { level });
    this.world.addScore(definition.score);
    events.push({ type: 'spawn', source: 'tap', x, y, level });
    if (wasNewDiscovery) {
      this.world.discover(level);
      this.world.addScore(definition.discoveryBonus);
      events.push({ type: 'discovery', x, y, level, bonus: definition.discoveryBonus });
    }
  }
}
