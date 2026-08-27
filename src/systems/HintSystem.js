import { GAME_CONFIG } from '../core/config.js';
import { cellKey } from '../utils/grid.js';

export class HintSystem {
  constructor(world, clusterFinder) {
    this.world = world;
    this.clusterFinder = clusterFinder;
  }

  getPrimedCellKeys() {
    const primed = new Set();
    const visited = new Set();

    for (const entity of this.world.cells.values()) {
      const key = cellKey(entity.x, entity.y);
      if (visited.has(key) || entity.level >= GAME_CONFIG.maxLevel) continue;

      const cluster = this.clusterFinder.findConnected(entity.x, entity.y, entity.level);
      for (const cell of cluster) visited.add(cellKey(cell.x, cell.y));
      if (cluster.length !== GAME_CONFIG.mergeCount - 1) continue;
      for (const cell of cluster) primed.add(cellKey(cell.x, cell.y));
    }

    return primed;
  }
}
