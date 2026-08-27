import test from 'node:test';
import assert from 'node:assert/strict';
import { WorldState } from '../src/model/WorldState.js';
import { MergeSystem } from '../src/systems/MergeSystem.js';
import { GrowthSystem } from '../src/systems/GrowthSystem.js';

function createGame() {
  const world = new WorldState();
  const merge = new MergeSystem(world);
  const growth = new GrowthSystem(world, merge);
  return { world, growth, merge };
}

test('an empty tap creates a sprout and score', () => {
  const { world, growth } = createGame();
  const events = growth.tap(2, 2);
  assert.equal(world.getCell(2, 2).level, 0);
  assert.equal(world.score, 1);
  assert.equal(world.taps, 1);
  assert.equal(events[0].type, 'spawn');
});

test('three connected sprouts merge into a tree', () => {
  const { world, merge } = createGame();
  world.setCell(2, 2, { level: 0 });
  world.setCell(3, 2, { level: 0 });
  world.setCell(2, 3, { level: 0 });

  const events = merge.resolveFrom(2, 2);
  assert.equal(events.length, 1);
  assert.equal(world.getCell(2, 2).level, 1);
  assert.equal(world.discoveredLevel, 1);
});

test('merge resolution can cascade through multiple levels', () => {
  const { world, merge } = createGame();
  world.setCell(4, 4, { level: 0 });
  world.setCell(4, 5, { level: 0 });
  world.setCell(5, 4, { level: 0 });
  world.setCell(3, 4, { level: 1 });
  world.setCell(3, 5, { level: 1 });

  const events = merge.resolveFrom(4, 4);
  assert.equal(events.length, 2);
  assert.equal(world.getCell(4, 4).level, 2);
  assert.equal(world.bestChain, 2);
  assert.equal(world.discoveredLevel, 2);
});

test('world state round-trips through JSON', () => {
  const { world } = createGame();
  world.setCell(1, 1, { level: 3 });
  world.score = 123;
  world.taps = 9;
  const restored = new WorldState(world.toJSON());
  assert.equal(restored.getCell(1, 1).level, 3);
  assert.equal(restored.score, 123);
  assert.equal(restored.taps, 9);
});

test('new worlds use the expanded 9x16 play area', () => {
  const { world } = createGame();
  assert.equal(world.columns, 9);
  assert.equal(world.rows, 16);
});
