import test from 'node:test';
import assert from 'node:assert/strict';
import { WorldState } from '../src/model/WorldState.js';
import { ClusterFinder } from '../src/systems/ClusterFinder.js';
import { PerkSystem } from '../src/systems/PerkSystem.js';
import { MergeSystem } from '../src/systems/MergeSystem.js';
import { GrowthSystem } from '../src/systems/GrowthSystem.js';
import { FlowSystem } from '../src/systems/FlowSystem.js';
import { BloomSystem } from '../src/systems/BloomSystem.js';
import { WeatherSystem } from '../src/systems/WeatherSystem.js';
import { SparkSystem } from '../src/systems/SparkSystem.js';
import { ResonanceSystem } from '../src/systems/ResonanceSystem.js';
import { MutationSystem } from '../src/systems/MutationSystem.js';
import { WonderSystem } from '../src/systems/WonderSystem.js';
import { IdentitySystem } from '../src/systems/IdentitySystem.js';
import { HarmonySystem } from '../src/systems/HarmonySystem.js';
import { WishSystem } from '../src/systems/WishSystem.js';
import { CelebrationSystem } from '../src/systems/CelebrationSystem.js';
import { EvolutionSystem } from '../src/systems/EvolutionSystem.js';
import { GoalSystem } from '../src/systems/GoalSystem.js';
import { HintSystem } from '../src/systems/HintSystem.js';
import { TurnSystem } from '../src/systems/TurnSystem.js';

function createGame(random = () => 0) {
  const world = new WorldState();
  const clusters = new ClusterFinder(world);
  const perks = new PerkSystem(world);
  const merge = new MergeSystem(world, clusters, perks);
  const weather = new WeatherSystem(world);
  const growth = new GrowthSystem(world, merge, weather);
  const flow = new FlowSystem(world, perks);
  const bloom = new BloomSystem(world, perks);
  const spark = new SparkSystem(world, merge, perks, random, weather);
  const resonance = new ResonanceSystem(world, merge);
  const mutation = new MutationSystem(world);
  const wonder = new WonderSystem(world);
  const identity = new IdentitySystem(world);
  const harmony = new HarmonySystem(world);
  const wishes = new WishSystem(world);
  const celebration = new CelebrationSystem(world);
  const evolution = new EvolutionSystem(world);
  const goals = new GoalSystem(world);
  const hints = new HintSystem(world, clusters);
  const turns = new TurnSystem(world, {
    growthSystem: growth,
    sparkSystem: spark,
    resonanceSystem: resonance,
    mutationSystem: mutation,
    wonderSystem: wonder,
    identitySystem: identity,
    harmonySystem: harmony,
    flowSystem: flow,
    wishSystem: wishes,
    celebrationSystem: celebration,
    weatherSystem: weather,
    bloomSystem: bloom,
    evolutionSystem: evolution,
    goalSystem: goals,
  });
  return { world, clusters, perks, merge, weather, growth, flow, bloom, spark, resonance, mutation, wonder, identity, harmony, wishes, celebration, evolution, goals, hints, turns };
}

function setCluster(world, cells, level = 0, variant = null) {
  for (const [x, y] of cells) world.setCell(x, y, variant ? { level, variant } : { level });
}
test('Rain grows a Tree when tapping beside existing nature', () => {
  const { world, growth } = createGame();
  world.weatherId = 'rain';
  world.weatherTurns = 3;
  world.setCell(2, 2, { level: 1 });
  const events = growth.growAt(3, 2);
  assert.equal(world.getCell(3, 2).level, 1);
  assert.equal(events[0].type, 'spawn');
});

test('Rain does not boost isolated growth', () => {
  const { world, growth } = createGame();
  world.weatherId = 'rain';
  world.weatherTurns = 3;
  growth.growAt(7, 12);
  assert.equal(world.getCell(7, 12).level, 0);
});

test('Golden Hour awards deterministic bonus score for merges', () => {
  const { world, weather } = createGame();
  world.weatherId = 'golden_hour';
  world.weatherTurns = 2;
  const events = [{ type: 'merge', toLevel: 2, chain: 1 }];
  weather.apply(events, { wasActive: true, weatherId: 'golden_hour' });
  assert.equal(world.score, 10);
  assert.equal(world.weatherTurns, 1);
  assert.ok(events.some((event) => event.type === 'weatherBonus' && event.bonus === 10));
});

test('weather sequence starts deterministically once Nature exists', () => {
  const { world, weather } = createGame();
  world.discoveredLevel = 2;
  world.taps = 20;
  const first = [];
  weather.apply(first, { wasActive: false, weatherId: null });
  assert.equal(world.weatherId, 'rain');
  assert.equal(world.weatherTurns, 6);
  assert.equal(world.weatherEventsExperienced, 1);
  assert.ok(first.some((event) => event.type === 'weatherStart' && event.weatherId === 'rain'));

  world.weatherTurns = 1;
  const ending = [];
  weather.apply(ending, { wasActive: true, weatherId: 'rain' });
  assert.equal(world.weatherId, null);
  world.taps = world.nextWeatherAt;
  const second = [];
  weather.apply(second, { wasActive: false, weatherId: null });
  assert.equal(world.weatherId, 'golden_hour');
});

test('Starlight turns a collected Life Spark into Radiant life', () => {
  const { world, spark } = createGame();
  world.weatherId = 'starlight';
  world.weatherTurns = 3;
  world.activeSpark = { x: 0, y: 0 };
  const events = spark.consumeAt(0, 0);
  assert.equal(world.getCell(0, 0).variant, 'radiant');
  assert.equal(world.radiantsCreated, 1);
  assert.equal(world.masteryRadiantsCreated, 0);
  assert.ok(events.some((event) => event.type === 'radiantBorn' && event.source === 'starlight'));
});

test('Starlight Radiants do not consume mastery Radiant milestones', () => {
  const { world, spark, mutation } = createGame();
  world.weatherId = 'starlight';
  world.weatherTurns = 3;
  world.activeSpark = { x: 0, y: 0 };
  spark.consumeAt(0, 0);
  world.perfectMerges = 2;
  world.setCell(4, 4, { level: 2 });
  mutation.apply([{ type: 'perfectMerge', x: 4, y: 4 }]);
  assert.equal(world.radiantsCreated, 2);
  assert.equal(world.masteryRadiantsCreated, 1);
  assert.equal(world.getCell(4, 4).variant, 'radiant');
});

test('a settlement beside nature becomes a persistent Harmony district', () => {
  const { world, harmony } = createGame();
  world.setCell(4, 4, { level: 3 });
  world.setCell(5, 4, { level: 1 });
  const events = [];
  harmony.apply(events);
  assert.equal(world.getCell(4, 4).harmony, true);
  assert.equal(world.harmonyDistricts, 1);
  assert.ok(events.some((event) => event.type === 'harmonyFormed' && event.reward > 0));
});

test('Harmony identity survives settlement evolution', () => {
  const { world, merge } = createGame();
  world.discoveredLevel = 4;
  world.setCell(2, 2, { level: 3, harmony: true });
  world.setCell(2, 3, { level: 3 });
  world.setCell(3, 2, { level: 3 });
  const events = merge.resolveFrom(2, 2);
  assert.equal(world.getCell(2, 2).level, 4);
  assert.equal(world.getCell(2, 2).harmony, true);
  assert.ok(events.some((event) => event.type === 'harmonyInherited'));
});

test('a settlement offers a contextual Garden wish', () => {
  const { world, wishes } = createGame();
  world.discoveredLevel = 3;
  world.taps = 20;
  world.setCell(4, 4, { level: 3 });
  const events = [];
  wishes.maybeOffer(events);
  assert.equal(world.activeWish.id, 'garden');
  assert.deepEqual({ x: world.activeWish.x, y: world.activeWish.y }, { x: 4, y: 4 });
  assert.ok(events.some((event) => event.type === 'wishOffered'));
});

test('Garden wish completes when nature is grown beside its settlement', () => {
  const { world, wishes } = createGame();
  world.setCell(4, 4, { level: 3 });
  world.activeWish = { id: 'garden', x: 4, y: 4, offeredAt: 10 };
  world.setCell(5, 4, { level: 1 });
  const events = [];
  wishes.evaluate(events);
  assert.equal(world.activeWish, null);
  assert.equal(world.wishesCompleted, 1);
  assert.equal(world.communityJoy, 1);
  assert.ok(events.some((event) => event.type === 'wishComplete'));
});

test('every second fulfilled wish starts a Festival', () => {
  const { world, wishes } = createGame();
  world.setCell(4, 4, { level: 3 });
  world.activeWish = { id: 'spark', x: 4, y: 4, offeredAt: 10 };
  world.wishesCompleted = 1;
  world.communityJoy = 1;
  const events = [{ type: 'sparkCollected', x: 1, y: 1, bonus: 30 }];
  wishes.evaluate(events);
  assert.equal(world.wishesCompleted, 2);
  assert.equal(world.communityJoy, 0);
  assert.equal(world.festivalTurns, 4);
  assert.equal(world.festivalsTriggered, 1);
  assert.ok(events.some((event) => event.type === 'festivalStart'));
});

test('Festival turns reward successful merge turns without consuming the start turn', () => {
  const { world, celebration } = createGame();
  world.festivalTurns = 2;
  const turn = celebration.prepareTurn();
  const events = [{ type: 'merge', toLevel: 1, chain: 1 }];
  celebration.apply(events, turn);
  assert.equal(world.festivalTurns, 1);
  assert.equal(world.score, 35);
  assert.ok(events.some((event) => event.type === 'festivalBonus' && event.bonus === 35));
});

test('Harmony, wishes and Festivals feed Bloom through plain events', () => {
  const { world, bloom } = createGame();
  const events = [
    { type: 'harmonyFormed', bloomEnergy: 16 },
    { type: 'wishComplete', bloomEnergy: 18 },
    { type: 'festivalBonus', bloomEnergy: 5 },
  ];
  bloom.apply(events, false);
  assert.equal(world.bloomEnergy, 39);
});

test('v4 saves load safely with v5 living-world defaults', () => {
  const world = new WorldState({ version: 4, cells: [], score: 50, taps: 25, perfectMerges: 4, radiantsCreated: 2 });
  assert.equal(world.weatherId, null);
  assert.equal(world.weatherTurns, 0);
  assert.equal(world.activeWish, null);
  assert.equal(world.wishesCompleted, 0);
  assert.equal(world.festivalTurns, 0);
  assert.equal(world.harmonyDistricts, 0);
  assert.equal(world.masteryRadiantsCreated, 2);
});

test('v5 state round-trips living-world state and Harmony cell identity', () => {
  const world = new WorldState();
  world.setCell(3, 3, { level: 4, harmony: true });
  world.weatherId = 'rain';
  world.weatherTurns = 4;
  world.weatherIndex = 2;
  world.weatherEventsExperienced = 2;
  world.activeWish = { id: 'local_merge', x: 3, y: 3, offeredAt: 20 };
  world.wishesCompleted = 2;
  world.communityJoy = 2;
  world.festivalTurns = 3;
  world.festivalsTriggered = 1;
  world.harmonyDistricts = 2;
  const restored = new WorldState(world.toJSON());
  assert.equal(restored.getCell(3, 3).harmony, true);
  assert.equal(restored.weatherId, 'rain');
  assert.equal(restored.weatherTurns, 4);
  assert.equal(restored.weatherEventsExperienced, 2);
  assert.equal(restored.activeWish.id, 'local_merge');
  assert.equal(restored.wishesCompleted, 2);
  assert.equal(restored.communityJoy, 2);
  assert.equal(restored.festivalTurns, 3);
  assert.equal(restored.harmonyDistricts, 2);
});

test('new settlements receive deterministic persistent names', () => {
  const { world, identity } = createGame();
  world.setCell(4, 4, { level: 3 });
  const events = [];
  identity.apply(events);
  assert.equal(world.getCell(4, 4).settlementName, 'Willow');
  assert.equal(world.settlementNameIndex, 1);
  assert.ok(events.some((event) => event.type === 'settlementNamed' && event.name === 'Willow'));
});

test('settlement names survive evolution', () => {
  const { world, merge } = createGame();
  world.discoveredLevel = 4;
  world.setCell(2, 2, { level: 3, settlementName: 'Willow' });
  world.setCell(2, 3, { level: 3, settlementName: 'Ember' });
  world.setCell(3, 2, { level: 3, settlementName: 'Haven' });
  merge.resolveFrom(2, 2);
  assert.equal(world.getCell(2, 2).settlementName, 'Willow');
});

test('settlement wishes expose the persistent place name', () => {
  const { world, wishes } = createGame();
  world.setCell(4, 4, { level: 3, settlementName: 'Willow' });
  world.activeWish = { id: 'local_merge', x: 4, y: 4, settlementName: 'Willow', offeredAt: 20 };
  assert.equal(wishes.getCurrentWish().settlementName, 'Willow');
});
