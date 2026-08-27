export const WISH_DEFINITIONS = Object.freeze([
  Object.freeze({ id: 'garden', icon: '🌿', label: 'Grow nature beside us', reward: 180 }),
  Object.freeze({ id: 'local_merge', icon: '🔨', label: 'Make a merge nearby', reward: 220 }),
  Object.freeze({ id: 'perfect', icon: '💎', label: 'Show us a Perfect Merge', reward: 300 }),
  Object.freeze({ id: 'spark', icon: '✦', label: 'Catch a Life Spark', reward: 260 }),
]);

export function getWishDefinition(id) {
  return WISH_DEFINITIONS.find((wish) => wish.id === id) ?? null;
}
