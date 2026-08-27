import { GAME_CONFIG } from '../core/config.js';

export class MutationSystem {
  constructor(world) { this.world = world; }

  apply(events) {
    const targetCreated = Math.floor(this.world.perfectMerges / GAME_CONFIG.radiant.everyPerfectMerges);
    let due = targetCreated > this.world.radiantsCreated ? 1 : 0;
    if (due === 0 || !events.some((event) => event.type === 'perfectMerge')) return events;

    const candidates = this.#candidateCells(events);
    for (const candidate of candidates) {
      if (due <= 0) break;
      const entity = this.world.getCell(candidate.x, candidate.y);
      if (!entity || entity.variant === 'radiant') continue;
      this.world.setCell(candidate.x, candidate.y, { ...entity, variant: 'radiant' });
      this.world.radiantsCreated += 1;
      due -= 1;
      events.push({ type: 'radiantBorn', x: candidate.x, y: candidate.y, level: entity.level });
    }
    return events;
  }

  #candidateCells(events) {
    const seen = new Set();
    const cells = [];
    const add = (x, y) => {
      const key = `${x},${y}`;
      if (seen.has(key)) return;
      seen.add(key);
      const entity = this.world.getCell(x, y);
      if (entity) cells.push({ x, y, level: entity.level });
    };

    for (const event of events) if (event.type === 'resonance') add(event.x, event.y);
    for (const event of events) if (event.type === 'merge') add(event.x, event.y);
    for (const entity of this.world.cells.values()) add(entity.x, entity.y);
    cells.sort((a, b) => b.level - a.level || a.y - b.y || a.x - b.x);
    return cells;
  }
}
