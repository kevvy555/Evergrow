import { ENTITY_DEFINITIONS } from '../core/config.js';
import { allNeighbours } from '../utils/grid.js';

export class GrowthSystem {
  constructor(world, mergeSystem) {
    this.world = world;
    this.mergeSystem = mergeSystem;
  }

  growAt(x, y) {
    const events = [];
    const occupied = this.world.getCell(x, y);

    if (!occupied) {
      this.#spawnSprout(x, y, events);
    } else {
      const emptyNeighbour = this.#nearestEmptyNeighbour(x, y);
      if (emptyNeighbour) {
        x = emptyNeighbour.x;
        y = emptyNeighbour.y;
        this.#spawnSprout(x, y, events);
      } else {
        events.push({ type: 'pulse', x, y, level: occupied.level });
      }
    }

    events.push(...this.mergeSystem.resolveFrom(x, y));
    return events;
  }

  #spawnSprout(x, y, events) {
    this.world.setCell(x, y, { level: 0 });
    this.world.addScore(ENTITY_DEFINITIONS[0].score);
    events.push({ type: 'spawn', x, y, level: 0 });
  }

  #nearestEmptyNeighbour(x, y) {
    const neighbours = allNeighbours(x, y, this.world.columns, this.world.rows);
    return neighbours.find((cell) => !this.world.getCell(cell.x, cell.y)) ?? null;
  }
}
