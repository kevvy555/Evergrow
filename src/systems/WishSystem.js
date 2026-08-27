import { GAME_CONFIG } from '../core/config.js';
import { WISH_DEFINITIONS, getWishDefinition } from '../core/wishDefinitions.js';
import { allNeighbours } from '../utils/grid.js';

export class WishSystem {
  constructor(world) { this.world = world; }

  getCurrentWish() {
    if (!this.world.activeWish) return null;
    const definition = getWishDefinition(this.world.activeWish.id);
    if (!definition) return null;
    const target = this.world.getCell(this.world.activeWish.x, this.world.activeWish.y);
    return { ...definition, ...this.world.activeWish, settlementName: target?.settlementName ?? this.world.activeWish.settlementName ?? null };
  }

  evaluate(events) {
    const wish = this.getCurrentWish();
    if (!wish) return events;
    this.#retargetIfNeeded();
    const current = this.getCurrentWish();
    if (!current || !this.#isComplete(current, events)) return events;

    this.world.addScore(current.reward);
    this.world.wishesCompleted += 1;
    this.world.communityJoy += 1;
    this.world.activeWish = null;
    this.world.nextWishAt = this.world.taps + GAME_CONFIG.wishes.interval;
    events.push({
      type: 'wishComplete',
      wishId: current.id,
      icon: current.icon,
      label: current.label,
      x: current.x,
      y: current.y,
      reward: current.reward,
      bloomEnergy: GAME_CONFIG.bloom.wishEnergy,
    });

    if (this.world.communityJoy >= GAME_CONFIG.wishes.festivalEvery) {
      this.world.communityJoy = 0;
      this.world.festivalTurns = GAME_CONFIG.festival.turns;
      this.world.festivalsTriggered += 1;
      events.push({ type: 'festivalStart', turns: this.world.festivalTurns, x: current.x, y: current.y });
    }
    return events;
  }

  maybeOffer(events) {
    if (this.world.activeWish || this.world.discoveredLevel < GAME_CONFIG.wishes.settlementMinLevel || this.world.taps < this.world.nextWishAt) return events;
    const settlements = this.#settlements();
    if (settlements.length === 0) return events;

    const startIndex = this.world.wishesCompleted % WISH_DEFINITIONS.length;
    for (let offset = 0; offset < WISH_DEFINITIONS.length; offset += 1) {
      const definition = WISH_DEFINITIONS[(startIndex + offset) % WISH_DEFINITIONS.length];
      const target = this.#targetFor(definition.id, settlements);
      if (!target) continue;
      this.world.activeWish = { id: definition.id, x: target.x, y: target.y, settlementName: target.settlementName ?? null, offeredAt: this.world.taps };
      events.push({ type: 'wishOffered', wishId: definition.id, icon: definition.icon, label: definition.label, x: target.x, y: target.y });
      break;
    }
    return events;
  }

  #settlements() {
    return [...this.world.cells.values()]
      .filter((entity) => entity.level >= GAME_CONFIG.wishes.settlementMinLevel)
      .sort((a, b) => (b.level - a.level) || (a.y - b.y) || (a.x - b.x));
  }

  #targetFor(wishId, settlements) {
    if (wishId === 'garden') return settlements.find((settlement) => !this.#hasNatureNeighbour(settlement.x, settlement.y)) ?? null;
    const index = this.world.wishesCompleted % settlements.length;
    return settlements[index];
  }

  #retargetIfNeeded() {
    const wish = this.world.activeWish;
    if (!wish) return;
    const entity = this.world.getCell(wish.x, wish.y);
    if (entity && entity.level >= GAME_CONFIG.wishes.settlementMinLevel) return;
    const target = this.#settlements()[0];
    if (target) this.world.activeWish = { ...wish, x: target.x, y: target.y, settlementName: target.settlementName ?? null };
  }

  #isComplete(wish, events) {
    if (wish.id === 'garden') return this.#hasNatureNeighbour(wish.x, wish.y);
    if (wish.id === 'local_merge') return events.some((event) => event.type === 'merge' && this.#distance(event.x, event.y, wish.x, wish.y) <= 2);
    if (wish.id === 'perfect') return events.some((event) => event.type === 'perfectMerge' && this.#distance(event.x, event.y, wish.x, wish.y) <= 3);
    if (wish.id === 'spark') return events.some((event) => event.type === 'sparkCollected');
    return false;
  }

  #hasNatureNeighbour(x, y) {
    return allNeighbours(x, y, this.world.columns, this.world.rows).some((cell) => {
      const entity = this.world.getCell(cell.x, cell.y);
      return entity && entity.level >= 1 && entity.level <= 2;
    });
  }

  #distance(ax, ay, bx, by) { return Math.max(Math.abs(ax - bx), Math.abs(ay - by)); }
}
