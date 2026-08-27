import { GAME_CONFIG, ENTITY_DEFINITIONS } from '../core/config.js';
import { allNeighbours, cellKey } from '../utils/grid.js';

export class MergeSystem {
  constructor(world) {
    this.world = world;
  }

  resolveFrom(originX, originY) {
    const events = [];
    let chain = 0;
    let cursor = { x: originX, y: originY };

    while (true) {
      const source = this.world.getCell(cursor.x, cursor.y);
      if (!source || source.level >= GAME_CONFIG.maxLevel) break;

      const cluster = this.#connectedCluster(cursor.x, cursor.y, source.level);
      if (cluster.length < GAME_CONFIG.mergeCount) break;

      const consumed = cluster.slice(0, GAME_CONFIG.mergeCount);
      for (const cell of consumed) this.world.clearCell(cell.x, cell.y);

      const nextLevel = source.level + 1;
      this.world.setCell(cursor.x, cursor.y, { level: nextLevel });
      this.world.discover(nextLevel);
      this.world.addScore(ENTITY_DEFINITIONS[nextLevel].score);
      chain += 1;

      events.push({
        type: 'merge',
        x: cursor.x,
        y: cursor.y,
        fromLevel: source.level,
        toLevel: nextLevel,
        consumed,
        chain,
      });
    }

    if (chain > 0) this.world.recordChain(chain);
    return events;
  }

  #connectedCluster(startX, startY, level) {
    const queue = [{ x: startX, y: startY }];
    const visited = new Set();
    const cluster = [];

    while (queue.length > 0) {
      const cell = queue.shift();
      const key = cellKey(cell.x, cell.y);
      if (visited.has(key)) continue;
      visited.add(key);

      const entity = this.world.getCell(cell.x, cell.y);
      if (!entity || entity.level !== level) continue;
      cluster.push(cell);

      for (const next of allNeighbours(cell.x, cell.y, this.world.columns, this.world.rows)) {
        if (!visited.has(cellKey(next.x, next.y))) queue.push(next);
      }
    }

    cluster.sort((a, b) => {
      const ad = Math.abs(a.x - startX) + Math.abs(a.y - startY);
      const bd = Math.abs(b.x - startX) + Math.abs(b.y - startY);
      return ad - bd;
    });
    return cluster;
  }
}
