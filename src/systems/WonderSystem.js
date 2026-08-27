import { GAME_CONFIG } from '../core/config.js';
import { WONDER_DEFINITIONS } from '../core/wonderDefinitions.js';
import { allNeighbours } from '../utils/grid.js';

export class WonderSystem {
  constructor(world) { this.world = world; }

  evaluate(events) {
    let discovered = 0;
    for (const wonder of WONDER_DEFINITIONS) {
      if (discovered >= GAME_CONFIG.wonders.maxDiscoveriesPerTurn) break;
      if (this.world.hasWonder(wonder.id)) continue;
      const match = this.#findMatch(wonder.levels[0], wonder.levels[1]);
      if (!match) continue;
      this.world.discoverWonder(wonder.id);
      this.world.addScore(wonder.reward);
      discovered += 1;
      events.push({
        type: 'wonderDiscovered',
        wonderId: wonder.id,
        icon: wonder.icon,
        name: wonder.name,
        reward: wonder.reward,
        bloomEnergy: wonder.bloomEnergy,
        cells: match,
      });
    }
    return events;
  }

  #findMatch(levelA, levelB) {
    for (const entity of this.world.cells.values()) {
      if (entity.level !== levelA) continue;
      const neighbour = allNeighbours(entity.x, entity.y, this.world.columns, this.world.rows)
        .map((cell) => this.world.getCell(cell.x, cell.y))
        .find((candidate) => candidate?.level === levelB);
      if (neighbour) return [{ x: entity.x, y: entity.y }, { x: neighbour.x, y: neighbour.y }];
    }
    return null;
  }
}
