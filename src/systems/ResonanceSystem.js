import { GAME_CONFIG, ENTITY_DEFINITIONS } from '../core/config.js';

export class ResonanceSystem {
  constructor(world, mergeSystem) {
    this.world = world;
    this.mergeSystem = mergeSystem;
  }

  apply(events) {
    const queue = events.filter((event) => event.type === 'perfectMerge');
    let cursor = 0;
    let promotions = 0;

    while (cursor < queue.length && promotions < GAME_CONFIG.resonance.maxPromotionsPerTurn) {
      const perfect = queue[cursor];
      cursor += 1;
      for (const cell of perfect.overflow ?? []) {
        if (promotions >= GAME_CONFIG.resonance.maxPromotionsPerTurn) break;
        const entity = this.world.getCell(cell.x, cell.y);
        if (!entity || entity.level !== perfect.fromLevel) continue;

        const nextLevel = perfect.toLevel;
        const definition = ENTITY_DEFINITIONS[nextLevel];
        const variant = entity.variant;
        this.world.setCell(cell.x, cell.y, variant ? { level: nextLevel, variant } : { level: nextLevel });
        this.world.addScore(definition.score);
        this.world.resonancePromotions += 1;
        promotions += 1;
        events.push({ type: 'resonance', x: cell.x, y: cell.y, fromLevel: perfect.fromLevel, toLevel: nextLevel, score: definition.score });

        const cascades = this.mergeSystem.resolveFrom(cell.x, cell.y);
        if (cascades.length > 0) {
          events.push(...cascades);
          queue.push(...cascades.filter((event) => event.type === 'perfectMerge'));
        }
      }
    }
    return events;
  }
}
