import { GAME_CONFIG } from '../core/config.js';
import { SETTLEMENT_NAMES } from '../core/settlementNames.js';

export class IdentitySystem {
  constructor(world) { this.world = world; }

  apply(events) {
    const unnamed = [...this.world.cells.values()]
      .filter((entity) => entity.level >= GAME_CONFIG.wishes.settlementMinLevel && !entity.settlementName)
      .sort((a, b) => (b.level - a.level) || (a.y - b.y) || (a.x - b.x));

    for (const entity of unnamed) {
      const name = SETTLEMENT_NAMES[this.world.settlementNameIndex % SETTLEMENT_NAMES.length];
      this.world.settlementNameIndex += 1;
      this.world.setCell(entity.x, entity.y, { ...entity, settlementName: name });
      events.push({ type: 'settlementNamed', x: entity.x, y: entity.y, level: entity.level, name });
    }
    return events;
  }
}
