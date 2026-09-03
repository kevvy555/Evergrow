const PASS_THROUGH = Object.freeze({
  prepareTurn: () => ({ wasActive: false, weatherId: null, spawnLevel: 0 }),
  apply: (events) => events,
  evaluate: (events) => events,
  maybeOffer: (events) => events,
  maybeSpawn: () => [],
  consumeAt: () => null,
});

export class TurnSystem {
  constructor(world, systems) {
    this.world = world;
    Object.assign(this, {
      weatherSystem: PASS_THROUGH,
      identitySystem: PASS_THROUGH,
      harmonySystem: PASS_THROUGH,
      wishSystem: PASS_THROUGH,
      celebrationSystem: PASS_THROUGH,
      resonanceSystem: PASS_THROUGH,
      mutationSystem: PASS_THROUGH,
      wonderSystem: PASS_THROUGH,
      flowSystem: PASS_THROUGH,
      bloomSystem: PASS_THROUGH,
      evolutionSystem: PASS_THROUGH,
      goalSystem: PASS_THROUGH,
      sparkSystem: PASS_THROUGH,
      featureGateSystem: null,
      tapBoostSystem: null,
    }, systems);
  }

  tap(x, y) {
    if (this.world.pendingEvolutionChoiceId) {
      return [{ type: 'choiceRequired', choiceId: this.world.pendingEvolutionChoiceId }];
    }

    const sparkHere = this.world.activeSpark?.x === x && this.world.activeSpark?.y === y;
    if (this.featureGateSystem && this.world.getCell(x, y) && !sparkHere) {
      const entity = this.world.getCell(x, y);
      return [
        { type: 'pulse', x, y, level: entity.level },
        { type: 'blocked', x, y, reason: 'occupied' },
      ];
    }

    this.world.incrementTaps();
    const bloomTurn = this.#enabled('bloom')
      ? this.bloomSystem.prepareTurn()
      : { wasActive: false, spawnLevel: 0 };
    const weatherTurn = this.#enabled('weather')
      ? this.weatherSystem.prepareTurn()
      : { wasActive: false, weatherId: null };
    const festivalTurn = this.#enabled('livingWorld')
      ? this.celebrationSystem.prepareTurn()
      : { wasActive: false };
    const boostTurn = this.tapBoostSystem?.prepareTurn({ suppressed: bloomTurn.spawnLevel > 0 })
      ?? { ready: false, spawnLevel: 0 };

    let events = this.sparkSystem.consumeAt(x, y);
    if (!events) {
      events = this.growthSystem.growAt(x, y, {
        spawnLevel: Math.max(bloomTurn.spawnLevel ?? 0, boostTurn.spawnLevel ?? 0),
      });
    }

    this.tapBoostSystem?.apply(events, boostTurn);
    if (this.#enabled('resonance')) this.resonanceSystem.apply(events);
    if (this.#enabled('radiant')) this.mutationSystem.apply(events);
    if (this.#enabled('wonders')) this.wonderSystem.evaluate(events);
    if (this.#enabled('livingWorld')) {
      this.identitySystem.apply(events);
      this.harmonySystem.apply(events);
    }
    if (this.#enabled('flow')) this.flowSystem.apply(events);
    if (this.#enabled('livingWorld')) {
      this.wishSystem.evaluate(events);
      this.celebrationSystem.apply(events, festivalTurn);
    }
    if (this.#enabled('weather')) this.weatherSystem.apply(events, weatherTurn);
    if (this.#enabled('bloom')) this.bloomSystem.apply(events, bloomTurn.wasActive);
    if (this.#enabled('livingWorld')) this.wishSystem.maybeOffer(events);
    if (this.#enabled('evolution')) this.evolutionSystem.evaluate(events);
    this.goalSystem.evaluate(events);
    if (this.#enabled('spark')) events.push(...this.sparkSystem.maybeSpawn());
    return events;
  }

  #enabled(featureId) {
    return !this.featureGateSystem || this.featureGateSystem.isUnlocked(featureId);
  }
}
