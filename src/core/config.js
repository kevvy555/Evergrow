export const GAME_CONFIG = Object.freeze({
  title: 'Evergrow',
  version: '0.1.0',
  grid: Object.freeze({ columns: 9, rows: 12 }),
  saveKey: 'evergrow.save.v1',
  mergeCount: 3,
  maxLevel: 6,
  tapEnergy: 1,
  autosaveMs: 1500,
});

export const ENTITY_DEFINITIONS = Object.freeze([
  { level: 0, key: 'sprout', name: 'Sprout', emoji: '🌱', score: 1, stage: 'Life' },
  { level: 1, key: 'tree', name: 'Tree', emoji: '🌳', score: 5, stage: 'Life' },
  { level: 2, key: 'grove', name: 'Grove', emoji: '🌲', score: 20, stage: 'Nature' },
  { level: 3, key: 'village', name: 'Village', emoji: '🏠', score: 100, stage: 'People' },
  { level: 4, key: 'town', name: 'Town', emoji: '🏘️', score: 500, stage: 'Civilization' },
  { level: 5, key: 'city', name: 'City', emoji: '🏙️', score: 2500, stage: 'Civilization' },
  { level: 6, key: 'starport', name: 'Starport', emoji: '🚀', score: 12500, stage: 'Space' },
]);
