import { GAME_CONFIG, ENTITY_DEFINITIONS } from '../core/config.js';

export class MergeSystem {
  constructor(world, clusterFinder) {
    this.world = world;
    this.clusterFinder = clusterFinder;
  }

  resolveFrom(originX, originY) {
    const events = [];
    let chain = 0;
    const cursor = { x: originX, y: originY };

    while (true) {
      const source = this.world.getCell(cursor.x, cursor.y);
      if (!source || source.level >= GAME_CONFIG.maxLevel) break;

      const cluster = this.clusterFinder.findConnected(cursor.x, cursor.y, source.level);
      if (cluster.length < GAME_CONFIG.mergeCount) break;

      const consumed = cluster.slice(0, GAME_CONFIG.mergeCount);
      for (const cell of consumed) this.world.clearCell(cell.x, cell.y);

      const nextLevel = source.level + 1;
      const wasNewDiscovery = nextLevel > this.world.discoveredLevel;
      const definition = ENTITY_DEFINITIONS[nextLevel];

      this.world.setCell(cursor.x, cursor.y, { level: nextLevel });
      this.world.discover(nextLevel);
      this.world.addScore(definition.score);
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

      if (wasNewDiscovery) {
        this.world.addScore(definition.discoveryBonus);
        events.push({
          type: 'discovery',
          x: cursor.x,
          y: cursor.y,
          level: nextLevel,
          bonus: definition.discoveryBonus,
        });
      }
    }

    if (chain > 0) this.world.recordChain(chain);
    return events;
  }
}
