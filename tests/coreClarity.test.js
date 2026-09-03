import test from 'node:test';
import assert from 'node:assert/strict';
import { GAME_CONFIG } from '../src/core/config.js';
import { WorldState } from '../src/model/WorldState.js';
import { FeatureGateSystem } from '../src/systems/FeatureGateSystem.js';
import { ClusterFinder } from '../src/systems/ClusterFinder.js';
import { PerkSystem } from '../src/systems/PerkSystem.js';
import { MergeSystem } from '../src/systems/MergeSystem.js';
import { GrowthSystem } from '../src/systems/GrowthSystem.js';
import { HintSystem } from '../src/systems/HintSystem.js';
import { TapBoostSystem } from '../src/systems/TapBoostSystem.js';
import { CoachSystem } from '../src/systems/CoachSystem.js';
import { TurnSystem } from '../src/systems/TurnSystem.js';

function createGame() {
  const world = new WorldState();
  const features = new FeatureGateSystem(world);
  const clusters = new ClusterFinder(world);
  const perks = new PerkSystem(world);
  const merge = new MergeSystem(world, clusters, perks, features);
  const growth = new GrowthSystem(world, merge);
  const hints = new HintSystem(world, clusters);
  const tapBoost = new TapBoostSystem(world, features);
  const coach = new CoachSystem(world, hints, features);
  const turns = new TurnSystem(world, {
    growthSystem: growth,
    featureGateSystem: features,
    tapBoostSystem: tapBoost,
    goalSystem: { evaluate: (events) => events },
  });
  return { world, features, merge, hints, coach, turns };
}

test('occupied taps never create a piece somewhere else or advance play time', () => {
  const { world, turns } = createGame();
  turns.tap(2, 2);
  const before = world.cells.size;
  const events = turns.tap(2, 2);
  assert.equal(world.cells.size, before);
  assert.equal(world.taps, 1);
  assert.ok(events.some((event) => event.type === 'blocked'));
});

test('three touching sprouts produce an explicit Tree merge', () => {
  const { world, turns } = createGame();
  turns.tap(1, 1);
  turns.tap(1, 2);
  const events = turns.tap(2, 1);
  assert.equal(world.getCell(2, 1).level, 1);
  assert.ok(events.some((event) => event.type === 'merge' && event.fromLevel === 0 && event.toLevel === 1));
});

test('two matching touching pieces produce a clear 2/3 coach prompt', () => {
  const { coach, turns } = createGame();
  turns.tap(1, 1);
  turns.tap(2, 1);
  assert.match(coach.getCorePrompt(), /2\/3/);
  assert.match(coach.getCorePrompt(), /glow/);
});

test('advanced systems unlock progressively instead of appearing immediately', () => {
  const { world, features } = createGame();
  assert.equal(features.isUnlocked('spark'), false);
  assert.equal(features.isUnlocked('bloom'), false);
  assert.equal(features.isUnlocked('weather'), false);
  world.discoveredLevel = 1;
  assert.equal(features.isUnlocked('tapBoost'), true);
  assert.equal(features.isUnlocked('flow'), true);
  assert.equal(features.isUnlocked('spark'), false);
  world.discoveredLevel = 2;
  assert.equal(features.isUnlocked('spark'), true);
  assert.equal(features.isUnlocked('bloom'), true);
  assert.equal(features.isUnlocked('weather'), false);
  world.discoveredLevel = 3;
  assert.equal(features.isUnlocked('weather'), true);
  assert.equal(features.isUnlocked('livingWorld'), true);
});

test('first accidental four-sprout cluster does not introduce Perfect Merge before Tree is learned', () => {
  const { world, merge } = createGame();
  for (const [x, y] of [[1, 1], [1, 2], [2, 1], [2, 2]]) world.setCell(x, y, { level: 0 });
  const events = merge.resolveFrom(1, 1);
  assert.equal(events.some((event) => event.type === 'perfectMerge'), false);
});

test('Perfect Merge becomes available after the basic Tree rule is learned', () => {
  const { world, merge } = createGame();
  world.discoveredLevel = 1;
  for (const [x, y] of [[1, 1], [1, 2], [2, 1], [2, 2]]) world.setCell(x, y, { level: 0 });
  const events = merge.resolveFrom(1, 1);
  assert.equal(events.some((event) => event.type === 'perfectMerge'), true);
});

test('six valid taps charge a deterministic Tap Boost and the next empty tap plants a Tree', () => {
  const { world, turns } = createGame();
  world.discoveredLevel = 1;
  for (let i = 0; i < GAME_CONFIG.tapBoost.threshold; i += 1) turns.tap(i, 10);
  assert.equal(world.tapCharge, GAME_CONFIG.tapBoost.threshold);
  const events = turns.tap(8, 17);
  assert.equal(world.getCell(8, 17).level, 1);
  assert.equal(world.tapCharge, 0);
  assert.equal(world.tapBoostsUsed, 1);
  assert.ok(events.some((event) => event.type === 'tapBoostUsed'));
});

test('v5 saves load with safe v6 clarity defaults', () => {
  const world = new WorldState({ version: 5, cells: [], score: 5, taps: 9, discoveredLevel: 2 });
  assert.equal(world.tapCharge, 0);
  assert.equal(world.tapBoostsUsed, 0);
  assert.equal(world.toJSON().version, 6);
});
