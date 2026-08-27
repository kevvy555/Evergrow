import { EVOLUTION_CHOICES } from '../core/evolutionDefinitions.js';

export class EvolutionSystem {
  constructor(world) { this.world = world; }
  getPendingChoice() { return EVOLUTION_CHOICES.find((choice) => choice.id === this.world.pendingEvolutionChoiceId) ?? null; }

  evaluate(events) {
    if (this.world.pendingEvolutionChoiceId) return events;
    const choice = EVOLUTION_CHOICES.find((candidate) => this.world.discoveredLevel >= candidate.triggerLevel && !this.world.evolutionChoicesCompleted.includes(candidate.id));
    if (choice) {
      this.world.pendingEvolutionChoiceId = choice.id;
      events.push({ type: 'evolutionChoice', choiceId: choice.id });
    }
    return events;
  }

  choose(optionId) {
    const choice = this.getPendingChoice();
    if (!choice) return [];
    const option = choice.options.find((candidate) => candidate.id === optionId);
    if (!option) throw new Error(`Invalid evolution option: ${optionId}`);
    this.world.addPerk(option.id);
    this.world.evolutionChoicesCompleted.push(choice.id);
    this.world.pendingEvolutionChoiceId = null;
    return [{ type: 'evolutionChosen', choiceId: choice.id, optionId: option.id, name: option.name, icon: option.icon }];
  }
}
