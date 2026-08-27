export class FlowSystem {
  constructor(world, perkSystem) { this.world = world; this.perkSystem = perkSystem; }
  apply(events) {
    const merges = events.filter((event) => event.type === 'merge');
    if (merges.length === 0) { this.world.setFlow(0); return events; }
    const flow = this.world.flow + 1;
    this.world.setFlow(flow);
    const chain = Math.max(...merges.map((event) => event.chain));
    const bonus = flow * chain * 5 * this.perkSystem.flowBonusMultiplier;
    this.world.addScore(bonus);
    events.push({ type: 'flow', value: flow, chain, bonus });
    return events;
  }
}
