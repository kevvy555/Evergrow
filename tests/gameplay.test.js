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
import { EvolutionSystem } from '../src/systems/EvolutionSystem.js';
import { GoalSystem } from '../src/systems/GoalSystem.js';
import { TurnSystem } from '../src/systems/TurnSystem.js';

function createGame(random = () => 0) {
  const world = new WorldState(); const clusters = new ClusterFinder(world); const perks = new PerkSystem(world);
  const merge = new MergeSystem(world, clusters, perks); const growth = new GrowthSystem(world, merge); const flow = new FlowSystem(world, perks);
  const bloom = new BloomSystem(world, perks); const spark = new SparkSystem(world, merge, perks, random); const evolution = new EvolutionSystem(world); const goals = new GoalSystem(world);
  const turns = new TurnSystem(world, growth, spark, flow, bloom, evolution, goals);
  return { world, clusters, perks, merge, growth, flow, bloom, spark, evolution, goals, turns };
}

test('normal three cluster merges', () => { const { world, merge } = createGame(); world.setCell(1,1,{level:0}); world.setCell(1,2,{level:0}); world.setCell(2,1,{level:0}); const events = merge.resolveFrom(1,1); assert.equal(world.getCell(1,1).level,1); assert.equal(events.some((event) => event.type === 'perfectMerge'), false); });
test('four connected items create a Perfect Merge reward', () => { const { world, merge } = createGame(); for (const [x,y] of [[1,1],[1,2],[2,1],[2,2]]) world.setCell(x,y,{level:0}); const events=merge.resolveFrom(1,1); assert.equal(world.perfectMerges,1); assert.ok(events.some((event)=>event.type==='perfectMerge'&&event.clusterSize===4&&event.bonus>0)); });
test('precision perk doubles Perfect Merge score bonus', () => { const a=createGame(),b=createGame(); b.world.addPerk('precision'); for(const game of [a,b]) for(const [x,y] of [[1,1],[1,2],[2,1],[2,2]]) game.world.setCell(x,y,{level:0}); const first=a.merge.resolveFrom(1,1).find((event)=>event.type==='perfectMerge').bonus, second=b.merge.resolveFrom(1,1).find((event)=>event.type==='perfectMerge').bonus; assert.equal(second,first*2); });
test('Bloom fills from merges and starts at threshold', () => { const {world,bloom}=createGame(); world.bloomEnergy=95; const events=[{type:'merge',toLevel:1,chain:1}]; bloom.apply(events,false); assert.equal(world.bloomsTriggered,1); assert.equal(world.bloomTurns,6); assert.ok(events.some((event)=>event.type==='bloomStart')); });
test('Bloom turns make normal growth spawn Trees', () => { const {world,turns}=createGame(); world.bloomTurns=2; world.goalIndex=99; turns.tap(4,4); assert.equal(world.getCell(4,4).level,1); assert.equal(world.bloomTurns,1); });
test('deep roots increases Perfect Merge Bloom energy', () => { const a=createGame(),b=createGame(); b.world.addPerk('deep_roots'); const event=[{type:'perfectMerge'}]; a.bloom.apply([...event],false); b.bloom.apply([...event],false); assert.ok(b.world.bloomEnergy>a.world.bloomEnergy); });
test('Grove discovery queues the first evolution choice', () => { const {world,evolution}=createGame(); world.discoveredLevel=2; const events=[]; evolution.evaluate(events); assert.equal(world.pendingEvolutionChoiceId,'nature'); assert.ok(events.some((event)=>event.type==='evolutionChoice')); });
test('choosing an evolution perk persists and clears blocking choice', () => { const {world,evolution}=createGame(); world.discoveredLevel=2; evolution.evaluate([]); const events=evolution.choose('bright_sparks'); assert.equal(world.hasPerk('bright_sparks'),true); assert.equal(world.pendingEvolutionChoiceId,null); assert.ok(events.some((event)=>event.type==='evolutionChosen')); });
test('pending evolution choice blocks board turns until resolved', () => { const {world,turns}=createGame(); world.pendingEvolutionChoiceId='nature'; const events=turns.tap(0,0); assert.equal(world.taps,0); assert.equal(world.getCell(0,0),null); assert.equal(events[0].type,'choiceRequired'); });
test('bright sparks makes the next Spark sooner and more valuable', () => { const {world,spark}=createGame(); world.addPerk('bright_sparks'); world.activeSpark={x:0,y:0}; world.taps=10; const events=spark.consumeAt(0,0); assert.equal(world.nextSparkAt,19); assert.equal(events.find((event)=>event.type==='sparkCollected').bonus,60); });
test('flow state doubles Flow score reward', () => { const a=createGame(),b=createGame(); b.world.addPerk('flow_state'); const first=[{type:'merge',chain:1}],second=[{type:'merge',chain:1}]; a.flow.apply(first); b.flow.apply(second); assert.equal(second.find((event)=>event.type==='flow').bonus,first.find((event)=>event.type==='flow').bonus*2); });
test('v2 saves load safely with v3 reward state defaults', () => { const world=new WorldState({version:2,cells:[],score:12,taps:4,discoveredLevel:1}); assert.equal(world.bloomEnergy,0); assert.deepEqual(world.perks,[]); assert.equal(world.perfectMerges,0); assert.equal(world.pendingEvolutionChoiceId,null); });
test('v3 state round-trips Bloom, mastery and evolution', () => { const {world}=createGame(); world.bloomEnergy=44; world.bloomTurns=3; world.bloomsTriggered=2; world.perfectMerges=5; world.addPerk('deep_roots'); world.evolutionChoicesCompleted.push('nature'); const restored=new WorldState(world.toJSON()); assert.equal(restored.bloomEnergy,44); assert.equal(restored.bloomTurns,3); assert.equal(restored.bloomsTriggered,2); assert.equal(restored.perfectMerges,5); assert.equal(restored.hasPerk('deep_roots'),true); assert.deepEqual(restored.evolutionChoicesCompleted,['nature']); });
test('empty turn still creates a sprout outside Bloom', () => { const {world,turns}=createGame(); turns.tap(2,2); assert.equal(world.getCell(2,2).level,0); assert.equal(world.taps,1); });
test('Life Spark still appears on schedule', () => { const {world,turns}=createGame(()=>0); world.nextSparkAt=1; const events=turns.tap(8,17); assert.ok(events.some((event)=>event.type==='sparkAppeared')); assert.deepEqual(world.activeSpark,{x:0,y:0}); });
test('two-level merge cascades still work', () => { const {world,merge}=createGame(); world.discoveredLevel=2; for(const [x,y,level] of [[4,4,0],[4,5,0],[5,4,0],[3,4,1],[3,5,1]]) world.setCell(x,y,{level}); const events=merge.resolveFrom(4,4); assert.equal(events.filter((event)=>event.type==='merge').length,2); assert.equal(world.getCell(4,4).level,2); assert.equal(world.bestChain,2); });
test('new Perfect Merge and Bloom goals advance normally', () => { const {world,goals}=createGame(); world.goalIndex=4; world.perfectMerges=1; let events=[]; goals.evaluate(events); assert.equal(world.goalIndex,5); world.bloomsTriggered=1; events=[]; goals.evaluate(events); assert.equal(world.goalIndex,6); });
test('board remains 9x18', () => { const {world}=createGame(); assert.equal(world.columns,9); assert.equal(world.rows,18); });
