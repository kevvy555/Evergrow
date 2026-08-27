export const GOAL_DEFINITIONS = Object.freeze([
  { id: 'tree', label: 'Discover a Tree', type: 'discovery', target: 1, reward: 25 },
  { id: 'spark', label: 'Collect a Life Spark', type: 'sparks', target: 1, reward: 60 },
  { id: 'flow', label: 'Reach a 2× Flow streak', type: 'bestFlow', target: 2, reward: 100 },
  { id: 'grove', label: 'Discover a Grove', type: 'discovery', target: 2, reward: 150 },
  { id: 'chain', label: 'Trigger a 2× chain', type: 'bestChain', target: 2, reward: 250 },
  { id: 'village', label: 'Found a Village', type: 'discovery', target: 3, reward: 500 },
  { id: 'town', label: 'Grow a Town', type: 'discovery', target: 4, reward: 1500 },
  { id: 'city', label: 'Build a City', type: 'discovery', target: 5, reward: 5000 },
  { id: 'starport', label: 'Reach the stars', type: 'discovery', target: 6, reward: 15000 },
]);
