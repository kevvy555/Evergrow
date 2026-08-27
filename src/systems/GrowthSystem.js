import { ENTITY_DEFINITIONS } from '../core/config.js';
import { allNeighbours } from '../utils/grid.js';

export class GrowthSystem {
  constructor(world, mergeSystem) { this.world = world; this.mergeSystem = mergeSystem; }

  growAt(x, y, { spawnLevel = 0 } = {}) {
    const events = [];
    const occupied = this.world.getCell(x, y);
    if (!occupied) {
      this.#spawn(x, y, spawnLevel, events);
    } else {
      const emptyNeighbour = this.#nearestEmptyNeighbour(x, y);
      if (emptyNeighbour) {
        x = emptyNeighbour.x;
        y = emptyNeighbour.y;
        this.#spawn(x, y, spawnLevel, events);
      } else {
        events.push({ type: 'pulse', x, y, level: occupied.level });
      }
    }
    events.push(...this.mergeSystem.resolveFrom(x, y));
    return events;
  }

  #spawn(x, y, level, events) {
    const definition = ENTITY_DEFINITIONS[level];
    const wasNewDiscovery = level > this.world.discoveredLevel;
    this.world.setCell(x, y, { level });
    this.world.addScore(definition.score);
    events.push({ type: 'spawn', x, y, level });
    if (wasNewDiscovery) {
      this.world.discover(level);
      this.world.addScore(definition.discoveryBonus);
      events.push({ type: 'discovery', x, y, level, bonus: definition.discoveryBonus });
    }
  }

  #nearestEmptyNeighbour(x, y) {
    return allNeighbours(x, y, this.world.columns, this.world.rows).find((cell) => !this.world.getCell(cell.x, cell.y)) ?? null;
  }
}
