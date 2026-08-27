import { GAME_CONFIG } from '../core/config.js';
import { allNeighbours } from '../utils/grid.js';

export class HarmonySystem {
  constructor(world) { this.world = world; }

  apply(events) {
    const candidates = [...this.world.cells.values()]
      .filter((entity) => entity.level >= GAME_CONFIG.wishes.settlementMinLevel && !entity.harmony)
      .sort((a, b) => (b.level - a.level) || (a.y - b.y) || (a.x - b.x));

    for (const entity of candidates) {
      if (!this.#hasNatureNeighbour(entity.x, entity.y)) continue;
      this.world.setCell(entity.x, entity.y, { ...entity, harmony: true });
      this.world.harmonyDistricts += 1;
      const reward = GAME_CONFIG.harmony.baseReward + Math.max(0, entity.level - 3) * GAME_CONFIG.harmony.levelReward;
      this.world.addScore(reward);
      events.push({
        type: 'harmonyFormed',
        x: entity.x,
        y: entity.y,
        level: entity.level,
        reward,
        bloomEnergy: GAME_CONFIG.bloom.harmonyEnergy,
        name: entity.settlementName ?? null,
      });
    }
    return events;
  }

  #hasNatureNeighbour(x, y) {
    return allNeighbours(x, y, this.world.columns, this.world.rows).some((cell) => {
      const entity = this.world.getCell(cell.x, cell.y);
      return entity && entity.level >= 1 && entity.level <= 2;
    });
  }
}
