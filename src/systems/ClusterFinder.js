import { allNeighbours, cellKey } from '../utils/grid.js';

export class ClusterFinder {
  constructor(world) {
    this.world = world;
  }

  findConnected(startX, startY, level) {
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
