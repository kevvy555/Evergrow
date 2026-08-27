import test from 'node:test';
import assert from 'node:assert/strict';
import { WorldState } from '../src/model/WorldState.js';
import { ClusterFinder } from '../src/systems/ClusterFinder.js';
import { MergeSystem } from '../src/systems/MergeSystem.js';
import { GrowthSystem } from '../src/systems/GrowthSystem.js';
import { FlowSystem } from '../src/systems/FlowSystem.js';
import { SparkSystem } from '../src/systems/SparkSystem.js';
import { GoalSystem } from '../src/systems/GoalSystem.js';
import { HintSystem } from '../src/systems/HintSystem.js';
import { TurnSystem } from '../src/systems/TurnSystem.js';

function createGame(random = () => 0) {
  const world = new WorldState();
  const clusters = new ClusterFinder(world);
  const merge = new MergeSystem(world, clusters);
  const growth = new GrowthSystem(world, merge);
  const flow = new FlowSystem(world);
  const spark = new SparkSystem(world, merge, random);
  const goals = new GoalSystem(world);
  const hints = new HintSystem(world, clusters);
  const turns = new TurnSystem(world, growth, spark, flow, goals);
  return { world, growth, merge, flow, spark, goals, hints, turns };
}

test('an empty tap creates a sprout and score', () => {
  const { world, turns } = createGame();
  const events = turns.tap(2, 2);
  assert.equal(world.getCell(2, 2).level, 0);
  assert.equal(world.score, 1);
  assert.equal(world.taps, 1);
  assert.equal(events[0].type, 'spawn');
});

test('three connected sprouts merge into a tree and trigger discovery reward', () => {
  const { world, merge } = createGame();
  world.setCell(2, 2, { level: 0 });
  world.setCell(3, 2, { level: 0 });
  world.setCell(2, 3, { level: 0 });

  const events = merge.resolveFrom(2, 2);
  assert.equal(world.getCell(2, 2).level, 1);
  assert.equal(world.discoveredLevel, 1);
  assert.ok(events.some((event) => event.type === 'discovery'));
  assert.equal(world.score, 25);
});

test('merge resolution can cascade through multiple levels', () => {
  const { world, merge } = createGame();
  world.discoveredLevel = 2;
  world.setCell(4, 4, { level: 0 });
  world.setCell(4, 5, { level: 0 });
  world.setCell(5, 4, { level: 0 });
  world.setCell(3, 4, { level: 1 });
  world.setCell(3, 5, { level: 1 });

  const events = merge.resolveFrom(4, 4);
  const merges = events.filter((event) => event.type === 'merge');
  assert.equal(merges.length, 2);
  assert.equal(world.getCell(4, 4).level, 2);
  assert.equal(world.bestChain, 2);
});

test('consecutive merge turns build Flow and award escalating bonus score', () => {
  const { world, turns } = createGame();
  world.discoveredLevel = 1;
  world.goalIndex = 2;

  world.setCell(1, 1, { level: 0 });
  world.setCell(1, 2, { level: 0 });
  turns.tap(2, 1);
  assert.equal(world.flow, 1);

  world.setCell(5, 5, { level: 0 });
  world.setCell(5, 6, { level: 0 });
  const events = turns.tap(6, 5);
  assert.equal(world.flow, 2);
  assert.equal(world.bestFlow, 2);
  assert.ok(events.some((event) => event.type === 'flow' && event.value === 2));
});

test('a non-merge turn resets current Flow but preserves best Flow', () => {
  const { world, turns } = createGame();
  world.flow = 3;
  world.bestFlow = 3;
  turns.tap(0, 0);
  assert.equal(world.flow, 0);
  assert.equal(world.bestFlow, 3);
});

test('a Life Spark appears on schedule and tapping it creates a tree', () => {
  const { world, turns } = createGame(() => 0);
  world.nextSparkAt = 1;
  const firstEvents = turns.tap(8, 17);
  assert.ok(firstEvents.some((event) => event.type === 'sparkAppeared'));
  assert.deepEqual(world.activeSpark, { x: 0, y: 0 });

  const sparkEvents = turns.tap(0, 0);
  assert.equal(world.activeSpark, null);
  assert.equal(world.getCell(0, 0).level, 1);
  assert.equal(world.discoveredLevel, 1);
  assert.equal(world.sparksCollected, 1);
  assert.ok(sparkEvents.some((event) => event.type === 'sparkCollected'));
  assert.ok(sparkEvents.some((event) => event.type === 'discovery'));
});

test('primed pairs are exposed as merge hints', () => {
  const { world, hints } = createGame();
  world.setCell(3, 3, { level: 1 });
  world.setCell(4, 3, { level: 1 });
  const primed = hints.getPrimedCellKeys();
  assert.equal(primed.has('3,3'), true);
  assert.equal(primed.has('4,3'), true);
});

test('goals complete one at a time and award their reward', () => {
  const { world, goals } = createGame();
  world.discoveredLevel = 1;
  const events = [];
  goals.evaluate(events);
  assert.equal(world.goalIndex, 1);
  assert.equal(world.score, 25);
  assert.equal(events[0].type, 'goalComplete');
});

test('world state round-trips new reward state through JSON', () => {
  const { world } = createGame();
  world.setCell(1, 1, { level: 3 });
  world.score = 123;
  world.taps = 9;
  world.flow = 2;
  world.bestFlow = 4;
  world.goalIndex = 3;
  world.activeSpark = { x: 2, y: 2 };
  world.sparksCollected = 1;
  const restored = new WorldState(world.toJSON());
  assert.equal(restored.getCell(1, 1).level, 3);
  assert.equal(restored.score, 123);
  assert.equal(restored.taps, 9);
  assert.equal(restored.flow, 2);
  assert.equal(restored.bestFlow, 4);
  assert.equal(restored.goalIndex, 3);
  assert.deepEqual(restored.activeSpark, { x: 2, y: 2 });
  assert.equal(restored.sparksCollected, 1);
});

test('new worlds keep the 9x18 phone-first play area', () => {
  const { world } = createGame();
  assert.equal(world.columns, 9);
  assert.equal(world.rows, 18);
});
