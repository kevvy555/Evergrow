const PASS_THROUGH = Object.freeze({
  prepareTurn: () => ({ wasActive: false, weatherId: null }),
  apply: (events) => events,
  evaluate: (events) => events,
  maybeOffer: (events) => events,
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
    }, systems);
  }

  tap(x, y) {
    if (this.world.pendingEvolutionChoiceId) {
      return [{ type: 'choiceRequired', choiceId: this.world.pendingEvolutionChoiceId }];
    }

    this.world.incrementTaps();
    const bloomTurn = this.bloomSystem.prepareTurn();
    const weatherTurn = this.weatherSystem.prepareTurn();
    const festivalTurn = this.celebrationSystem.prepareTurn();

    let events = this.sparkSystem.consumeAt(x, y);
    if (!events) events = this.growthSystem.growAt(x, y, { spawnLevel: bloomTurn.spawnLevel });

    this.resonanceSystem.apply(events);
    this.mutationSystem.apply(events);
    this.wonderSystem.evaluate(events);
    this.identitySystem.apply(events);
    this.harmonySystem.apply(events);
    this.flowSystem.apply(events);
    this.wishSystem.evaluate(events);
    this.celebrationSystem.apply(events, festivalTurn);
    this.weatherSystem.apply(events, weatherTurn);
    this.bloomSystem.apply(events, bloomTurn.wasActive);
    this.wishSystem.maybeOffer(events);
    this.evolutionSystem.evaluate(events);
    this.goalSystem.evaluate(events);
    events.push(...this.sparkSystem.maybeSpawn());
    return events;
  }
}
