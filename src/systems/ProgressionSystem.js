import { ENTITY_DEFINITIONS } from '../core/config.js';

export class ProgressionSystem {
  constructor(world) {
    this.world = world;
  }

  getCurrentStage() {
    return ENTITY_DEFINITIONS[this.world.discoveredLevel]?.stage ?? 'Life';
  }

  getNextDiscovery() {
    const next = ENTITY_DEFINITIONS[this.world.discoveredLevel + 1];
    return next ? `${next.emoji} ${next.name}` : '🌌 The stars are waiting';
  }

  getPopulation() {
    let population = 0;
    for (const entity of this.world.cells.values()) {
      if (entity.level === 3) population += 12;
      if (entity.level === 4) population += 80;
      if (entity.level === 5) population += 500;
      if (entity.level === 6) population += 2000;
    }
    return population;
  }
}
