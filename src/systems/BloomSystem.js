import { GAME_CONFIG } from '../core/config.js';

export class BloomSystem {
  constructor(world, perkSystem) { this.world = world; this.perkSystem = perkSystem; }
  prepareTurn() { return { wasActive: this.world.bloomTurns > 0, spawnLevel: this.world.bloomTurns > 0 ? GAME_CONFIG.bloom.spawnLevel : 0 }; }

  apply(events, wasActive) {
    let gain = 0;
    for (const event of events) {
      if (event.type === 'merge') gain += GAME_CONFIG.bloom.mergeBaseEnergy + event.toLevel * GAME_CONFIG.bloom.mergeLevelEnergy;
      if (event.type === 'perfectMerge') gain += Math.round(GAME_CONFIG.bloom.perfectEnergy * this.perkSystem.perfectBloomMultiplier);
      if (event.type === 'sparkCollected') gain += GAME_CONFIG.bloom.sparkEnergy;
    }

    if (wasActive) {
      this.world.bloomTurns = Math.max(0, this.world.bloomTurns - 1);
      this.world.bloomEnergy = Math.min(GAME_CONFIG.bloom.threshold, this.world.bloomEnergy + gain);
      if (this.world.bloomTurns === 0) events.push({ type: 'bloomEnd' });
      return events;
    }

    this.world.bloomEnergy = Math.min(GAME_CONFIG.bloom.threshold, this.world.bloomEnergy + gain);
    if (this.world.bloomEnergy >= GAME_CONFIG.bloom.threshold) {
      this.world.bloomEnergy = 0;
      this.world.bloomTurns = GAME_CONFIG.bloom.turns;
      this.world.bloomsTriggered += 1;
      events.push({ type: 'bloomStart', turns: this.world.bloomTurns });
    }
    return events;
  }
}
