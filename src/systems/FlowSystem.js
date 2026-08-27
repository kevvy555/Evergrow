export class FlowSystem {
  constructor(world) {
    this.world = world;
  }

  apply(events) {
    const merges = events.filter((event) => event.type === 'merge');
    if (merges.length === 0) {
      this.world.setFlow(0);
      return events;
    }

    const flow = this.world.flow + 1;
    this.world.setFlow(flow);
    const deepestChain = Math.max(...merges.map((event) => event.chain));
    const bonus = flow * deepestChain * 5;
    this.world.addScore(bonus);
    events.push({ type: 'flow', value: flow, chain: deepestChain, bonus });
    return events;
  }
}
