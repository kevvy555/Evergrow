import { GOAL_DEFINITIONS } from '../core/goalDefinitions.js';

export class GoalSystem {
  constructor(world) {
    this.world = world;
  }

  getCurrentGoal() {
    return GOAL_DEFINITIONS[this.world.goalIndex] ?? null;
  }

  evaluate(events) {
    const goal = this.getCurrentGoal();
    if (!goal || !this.#isComplete(goal)) return events;

    this.world.addScore(goal.reward);
    this.world.goalIndex += 1;
    events.push({ type: 'goalComplete', goalId: goal.id, label: goal.label, reward: goal.reward });
    return events;
  }

  #isComplete(goal) {
    switch (goal.type) {
      case 'discovery': return this.world.discoveredLevel >= goal.target;
      case 'sparks': return this.world.sparksCollected >= goal.target;
      case 'bestFlow': return this.world.bestFlow >= goal.target;
      case 'bestChain': return this.world.bestChain >= goal.target;
      default: return false;
    }
  }
}
