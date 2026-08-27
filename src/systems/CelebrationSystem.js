import { GAME_CONFIG } from '../core/config.js';

export class CelebrationSystem {
  constructor(world) { this.world = world; }
  prepareTurn() { return { wasActive: this.world.festivalTurns > 0 }; }

  apply(events, { wasActive }) {
    if (!wasActive) return events;
    const mergeCount = events.filter((event) => event.type === 'merge').length;
    if (mergeCount > 0) {
      const bonus = mergeCount * GAME_CONFIG.festival.mergeBonus;
      this.world.addScore(bonus);
      events.push({ type: 'festivalBonus', bonus, bloomEnergy: GAME_CONFIG.bloom.festivalEnergy * mergeCount });
    }
    this.world.festivalTurns = Math.max(0, this.world.festivalTurns - 1);
    if (this.world.festivalTurns === 0) events.push({ type: 'festivalEnd' });
    return events;
  }
}
