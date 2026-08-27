import test from 'node:test';
import assert from 'node:assert/strict';
import { WorldState } from '../src/model/WorldState.js';
import { ClusterFinder } from '../src/systems/ClusterFinder.js';
import { PerkSystem } from '../src/systems/PerkSystem.js';
import { MergeSystem } from '../src/systems/MergeSystem.js';
import { GrowthSystem } from '../src/systems/GrowthSystem.js';
import { FlowSystem } from '../src/systems/FlowSystem.js';
import { BloomSystem } from '../src/systems/BloomSystem.js';
import { SparkSystem } from '../src/systems/SparkSystem.js';
import { ResonanceSystem } from '../src/systems/ResonanceSystem.js';
import { MutationSystem } from '../src/systems/MutationSystem.js';
import { WonderSystem } from '../src/systems/WonderSystem.js';
import { EvolutionSystem } from '../src/systems/EvolutionSystem.js';
import { GoalSystem } from '../src/systems/GoalSystem.js';
import { HintSystem } from '../src/systems/HintSystem.js';
import { TurnSystem } from '../src/systems/TurnSystem.js';

function createGame(random = () => 0) {
  const world = new WorldState();
  const clusters = new ClusterFinder(world);
  const perks = new PerkSystem(world);
  const merge = new MergeSystem(world, clusters, perks);
  const growth = new GrowthSystem(world, merge);
  const flow = new FlowSystem(world, perks);
  const bloom = new BloomSystem(world, perks);
  const spark = new SparkSystem(world, merge, perks, random);
  const resonance = new ResonanceSystem(world, merge);
  const mutation = new MutationSystem(world);
  const wonder = new WonderSystem(world);
  const evolution = new EvolutionSystem(world);
  const goals = new GoalSystem(world);
  const hints = new HintSystem(world, clusters);
  const turns = new TurnSystem(world, {
    growthSystem: growth,
    sparkSystem: spark,
    resonanceSystem: resonance,
    mutationSystem: mutation,
    wonderSystem: wonder,
    flowSystem: flow,
    bloomSystem: bloom,
    evolutionSystem: evolution,
    goalSystem: goals,
  });
  return { world, clusters, perks, merge, growth, flow, bloom, spark, resonance, mutation, wonder, evolution, goals, hints, turns };
}

function setCluster(world, cells, level = 0, variant = null) {
  for (const [x, y] of cells) world.setCell(x, y, variant ? { level, variant } : { level });
}

test('empty turn creates a Sprout outside Bloom', () => {
  const { world, turns } = createGame();
  turns.tap(2, 2);
  assert.equal(world.getCell(2, 2).level, 0);
  assert.equal(world.taps, 1);
});

test('normal three cluster merges', () => {
  const { world, merge } = createGame();
  setCluster(world, [[1, 1], [1, 2], [2, 1]]);
  const events = merge.resolveFrom(1, 1);
  assert.equal(world.getCell(1, 1).level, 1);
  assert.equal(events.some((event) => event.type === 'perfectMerge'), false);
});

test('four connected items create a Perfect Merge reward and expose overflow', () => {
  const { world, merge } = createGame();
  setCluster(world, [[1, 1], [1, 2], [2, 1], [2, 2]]);
  const events = merge.resolveFrom(1, 1);
  const perfect = events.find((event) => event.type === 'perfectMerge');
  assert.equal(world.perfectMerges, 1);
  assert.equal(perfect.clusterSize, 4);
  assert.deepEqual(perfect.overflow, [{ x: 2, y: 2 }]);
  assert.ok(perfect.bonus > 0);
});

test('precision perk doubles Perfect Merge score bonus', () => {
  const a = createGame();
  const b = createGame();
  b.world.addPerk('precision');
  for (const game of [a, b]) setCluster(game.world, [[1, 1], [1, 2], [2, 1], [2, 2]]);
  const first = a.merge.resolveFrom(1, 1).find((event) => event.type === 'perfectMerge').bonus;
  const second = b.merge.resolveFrom(1, 1).find((event) => event.type === 'perfectMerge').bonus;
  assert.equal(second, first * 2);
});

test('Resonance promotes Perfect Merge overflow pieces', () => {
  const { world, merge, resonance } = createGame();
  setCluster(world, [[1, 1], [1, 2], [2, 1], [2, 2]]);
  const events = merge.resolveFrom(1, 1);
  resonance.apply(events);
  assert.equal(world.getCell(2, 2).level, 1);
  assert.equal(world.resonancePromotions, 1);
  assert.ok(events.some((event) => event.type === 'resonance' && event.x === 2 && event.y === 2));
});

test('Resonance can create an automatic secondary merge', () => {
  const { world, merge, resonance } = createGame();
  world.discoveredLevel = 2;
  setCluster(world, [[1, 1], [1, 2], [2, 1], [2, 2]], 0);
  world.setCell(3, 2, { level: 1 });
  const events = merge.resolveFrom(1, 1);
  resonance.apply(events);
  assert.equal(world.getCell(2, 2).level, 2);
  assert.ok(events.filter((event) => event.type === 'merge').length >= 2);
});

test('Resonance preserves a Radiant overflow variant while promoting it', () => {
  const { world, merge, resonance } = createGame();
  setCluster(world, [[1, 1], [1, 2], [2, 1]]);
  world.setCell(2, 2, { level: 0, variant: 'radiant' });
  const events = merge.resolveFrom(1, 1);
  resonance.apply(events);
  assert.equal(world.getCell(2, 2).level, 1);
  assert.equal(world.getCell(2, 2).variant, 'radiant');
});

test('every second Perfect Merge earns a deterministic Radiant entity', () => {
  const { world, mutation } = createGame();
  world.perfectMerges = 2;
  world.setCell(4, 4, { level: 2 });
  const events = [{ type: 'perfectMerge', x: 4, y: 4 }];
  mutation.apply(events);
  assert.equal(world.radiantsCreated, 1);
  assert.equal(world.getCell(4, 4).variant, 'radiant');
  assert.ok(events.some((event) => event.type === 'radiantBorn'));
});

test('Radiant entities burst for extra score when consumed by a merge', () => {
  const { world, merge } = createGame();
  world.discoveredLevel = 1;
  world.setCell(1, 1, { level: 0, variant: 'radiant' });
  world.setCell(1, 2, { level: 0 });
  world.setCell(2, 1, { level: 0 });
  const scoreBefore = world.score;
  const events = merge.resolveFrom(1, 1);
  const radiant = events.find((event) => event.type === 'radiantMerge');
  assert.equal(world.radiantsConsumed, 1);
  assert.ok(radiant.bonus > 0);
  assert.ok(world.score > scoreBefore);
  assert.equal(world.getCell(1, 1).variant, undefined);
});

test('Radiant bursts contribute Bloom energy', () => {
  const { world, bloom } = createGame();
  const events = [{ type: 'radiantMerge', bloomEnergy: 25 }];
  bloom.apply(events, false);
  assert.equal(world.bloomEnergy, 25);
});

test('adjacent Tree and Grove reveal the first hidden Wonder once', () => {
  const { world, wonder } = createGame();
  world.setCell(2, 2, { level: 1 });
  world.setCell(3, 2, { level: 2 });
  const events = [];
  wonder.evaluate(events);
  assert.equal(world.hasWonder('ancient_woodland'), true);
  assert.equal(events[0].type, 'wonderDiscovered');
  const score = world.score;
  wonder.evaluate([]);
  assert.equal(world.score, score);
  assert.equal(world.discoveredWonders.length, 1);
});

test('Wonder discoveries feed the Bloom meter', () => {
  const { world, wonder, bloom } = createGame();
  world.setCell(2, 2, { level: 1 });
  world.setCell(3, 2, { level: 2 });
  const events = [];
  wonder.evaluate(events);
  bloom.apply(events, false);
  assert.equal(world.bloomEnergy, 12);
});

test('only one hidden Wonder is revealed per turn', () => {
  const { world, wonder } = createGame();
  world.setCell(1, 1, { level: 1 });
  world.setCell(2, 1, { level: 2 });
  world.setCell(3, 1, { level: 3 });
  const events = [];
  wonder.evaluate(events);
  assert.equal(events.filter((event) => event.type === 'wonderDiscovered').length, 1);
  assert.equal(world.discoveredWonders.length, 1);
});

test('Bloom fills from merges and starts at threshold', () => {
  const { world, bloom } = createGame();
  world.bloomEnergy = 145;
  const events = [{ type: 'merge', toLevel: 1, chain: 1 }];
  bloom.apply(events, false);
  assert.equal(world.bloomsTriggered, 1);
  assert.equal(world.bloomTurns, 5);
  assert.ok(events.some((event) => event.type === 'bloomStart'));
});

test('Bloom turns make normal growth spawn Trees', () => {
  const { world, turns } = createGame();
  world.bloomTurns = 2;
  world.goalIndex = 99;
  turns.tap(4, 4);
  assert.equal(world.getCell(4, 4).level, 1);
  assert.equal(world.bloomTurns, 1);
});

test('deep roots increases Perfect Merge Bloom energy', () => {
  const a = createGame();
  const b = createGame();
  b.world.addPerk('deep_roots');
  a.bloom.apply([{ type: 'perfectMerge' }], false);
  b.bloom.apply([{ type: 'perfectMerge' }], false);
  assert.ok(b.world.bloomEnergy > a.world.bloomEnergy);
});

test('consecutive merge turns build Flow', () => {
  const { world, turns } = createGame();
  world.discoveredLevel = 1;
  world.goalIndex = 99;
  setCluster(world, [[1, 1], [1, 2]], 0);
  turns.tap(2, 1);
  assert.equal(world.flow, 1);
  setCluster(world, [[5, 5], [5, 6]], 0);
  turns.tap(6, 5);
  assert.equal(world.flow, 2);
  assert.equal(world.bestFlow, 2);
});

test('a non-merge turn resets current Flow but preserves best Flow', () => {
  const { world, turns } = createGame();
  world.flow = 3;
  world.bestFlow = 3;
  turns.tap(0, 0);
  assert.equal(world.flow, 0);
  assert.equal(world.bestFlow, 3);
});

test('flow state doubles Flow score reward', () => {
  const a = createGame();
  const b = createGame();
  b.world.addPerk('flow_state');
  const first = [{ type: 'merge', chain: 1 }];
  const second = [{ type: 'merge', chain: 1 }];
  a.flow.apply(first);
  b.flow.apply(second);
  assert.equal(second.find((event) => event.type === 'flow').bonus, first.find((event) => event.type === 'flow').bonus * 2);
});

test('Life Spark still appears on schedule', () => {
  const { world, turns } = createGame(() => 0);
  world.nextSparkAt = 1;
  const events = turns.tap(8, 17);
  assert.ok(events.some((event) => event.type === 'sparkAppeared'));
  assert.deepEqual(world.activeSpark, { x: 0, y: 0 });
});

test('bright sparks makes the next Spark sooner and more valuable', () => {
  const { world, spark } = createGame();
  world.addPerk('bright_sparks');
  world.activeSpark = { x: 0, y: 0 };
  world.taps = 10;
  const events = spark.consumeAt(0, 0);
  assert.equal(world.nextSparkAt, 19);
  assert.equal(events.find((event) => event.type === 'sparkCollected').bonus, 60);
});

test('primed pairs are exposed as merge hints', () => {
  const { world, hints } = createGame();
  world.setCell(3, 3, { level: 1 });
  world.setCell(4, 3, { level: 1 });
  const primed = hints.getPrimedCellKeys();
  assert.equal(primed.has('3,3'), true);
  assert.equal(primed.has('4,3'), true);
});

test('Grove discovery queues the first evolution choice', () => {
  const { world, evolution } = createGame();
  world.discoveredLevel = 2;
  const events = [];
  evolution.evaluate(events);
  assert.equal(world.pendingEvolutionChoiceId, 'nature');
  assert.ok(events.some((event) => event.type === 'evolutionChoice'));
});

test('choosing an evolution perk persists and clears blocking choice', () => {
  const { world, evolution } = createGame();
  world.discoveredLevel = 2;
  evolution.evaluate([]);
  const events = evolution.choose('bright_sparks');
  assert.equal(world.hasPerk('bright_sparks'), true);
  assert.equal(world.pendingEvolutionChoiceId, null);
  assert.ok(events.some((event) => event.type === 'evolutionChosen'));
});

test('pending evolution choice blocks board turns until resolved', () => {
  const { world, turns } = createGame();
  world.pendingEvolutionChoiceId = 'nature';
  const events = turns.tap(0, 0);
  assert.equal(world.taps, 0);
  assert.equal(world.getCell(0, 0), null);
  assert.equal(events[0].type, 'choiceRequired');
});

test('two-level merge cascades still work', () => {
  const { world, merge } = createGame();
  world.discoveredLevel = 2;
  for (const [x, y, level] of [[4, 4, 0], [4, 5, 0], [5, 4, 0], [3, 4, 1], [3, 5, 1]]) world.setCell(x, y, { level });
  const events = merge.resolveFrom(4, 4);
  assert.equal(events.filter((event) => event.type === 'merge').length, 2);
  assert.equal(world.getCell(4, 4).level, 2);
  assert.equal(world.bestChain, 2);
});

test('v3 saves load safely with v4 discovery state defaults', () => {
  const world = new WorldState({ version: 3, cells: [], score: 12, taps: 4, discoveredLevel: 1, perfectMerges: 2 });
  assert.equal(world.resonancePromotions, 0);
  assert.deepEqual(world.discoveredWonders, []);
  assert.equal(world.radiantsCreated, 0);
  assert.equal(world.radiantsConsumed, 0);
});

test('v4 state round-trips Resonance, Wonders and Radiant cell variants', () => {
  const { world } = createGame();
  world.setCell(1, 1, { level: 3, variant: 'radiant' });
  world.resonancePromotions = 4;
  world.discoveredWonders = ['ancient_woodland'];
  world.radiantsCreated = 2;
  world.radiantsConsumed = 1;
  const restored = new WorldState(world.toJSON());
  assert.equal(restored.getCell(1, 1).variant, 'radiant');
  assert.equal(restored.resonancePromotions, 4);
  assert.deepEqual(restored.discoveredWonders, ['ancient_woodland']);
  assert.equal(restored.radiantsCreated, 2);
  assert.equal(restored.radiantsConsumed, 1);
});

test('board remains 9x18', () => {
  const { world } = createGame();
  assert.equal(world.columns, 9);
  assert.equal(world.rows, 18);
});
