export const EVOLUTION_CHOICES = Object.freeze([
  Object.freeze({
    id: 'nature',
    triggerLevel: 2,
    title: 'Your world is evolving',
    options: Object.freeze([
      Object.freeze({ id: 'deep_roots', icon: '🌿', name: 'Deep Roots', description: 'Perfect Merges fill Bloom 50% faster.' }),
      Object.freeze({ id: 'bright_sparks', icon: '✨', name: 'Bright Sparks', description: 'Life Sparks arrive 3 taps sooner and give +30 score.' }),
    ]),
  }),
  Object.freeze({
    id: 'civilization',
    triggerLevel: 4,
    title: 'Shape your civilization',
    options: Object.freeze([
      Object.freeze({ id: 'flow_state', icon: '🔥', name: 'Flow State', description: 'Flow score bonuses are doubled.' }),
      Object.freeze({ id: 'precision', icon: '💎', name: 'Precision', description: 'Perfect Merge score bonuses are doubled.' }),
    ]),
  }),
]);
