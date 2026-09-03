import { GAME_CONFIG } from '../core/config.js';

export class TapBoostSystem {
  constructor(world, featureGateSystem) {
    this.world = world;
    this.features = featureGateSystem;
  }

  prepareTurn({ suppressed = false } = {}) {
    const ready = this.features.isUnlocked('tapBoost')
      && this.world.tapCharge >= GAME_CONFIG.tapBoost.threshold
      && !suppressed;
    return { ready, spawnLevel: ready ? GAME_CONFIG.tapBoost.spawnLevel : 0 };
  }

  apply(events, turn) {
    const tapSpawn = events.find((event) => event.type === 'spawn' && event.source === 'tap');
    if (!tapSpawn) return events;

    if (turn.ready) {
      this.world.tapCharge = 0;
      this.world.tapBoostsUsed += 1;
      events.push({ type: 'tapBoostUsed', x: tapSpawn.x, y: tapSpawn.y, level: tapSpawn.level });
    } else if (this.features.isUnlocked('tapBoost')) {
      this.world.tapCharge = Math.min(GAME_CONFIG.tapBoost.threshold, this.world.tapCharge + 1);
    }
    return events;
  }
}
