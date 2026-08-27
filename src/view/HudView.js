import { Container, Graphics, Text, TextStyle } from 'https://cdn.jsdelivr.net/npm/pixi.js@8.6.6/dist/pixi.mjs';
import { ENTITY_DEFINITIONS } from '../core/config.js';

export class HudView extends Container {
  constructor(world, progression, onReset) {
    super();
    this.world = world;
    this.progression = progression;
    this.onReset = onReset;
    this.background = new Graphics();
    this.title = this.#text('EVERGROW', 26, 900);
    this.stage = this.#text('', 13, 700);
    this.score = this.#text('', 17, 800);
    this.population = this.#text('', 13, 600);
    this.next = this.#text('', 13, 600);
    this.hint = this.#text('Tap empty land. Put 3 matching things together.', 12, 500);
    this.reset = this.#makeButton('New world', onReset);
    this.addChild(this.background, this.title, this.stage, this.score, this.population, this.next, this.hint, this.reset);
  }

  resize(width) {
    this.background.clear().roundRect(10, 10, width - 20, 126, 24).fill({ color: 0x07111f, alpha: 0.76 }).stroke({ color: 0xffffff, alpha: 0.08, width: 1 });
    this.title.position.set(26, 22);
    this.stage.position.set(27, 56);
    this.score.position.set(26, 78);
    this.population.position.set(Math.max(170, width * 0.46), 81);
    this.next.position.set(26, 105);
    this.hint.position.set(26, 142);
    this.reset.position.set(width - 116, 24);
    this.render();
  }

  render() {
    const current = ENTITY_DEFINITIONS[this.world.discoveredLevel];
    this.stage.text = `${current?.emoji ?? '🌱'} ${this.progression.getCurrentStage()} · Best chain ${this.world.bestChain}×`;
    this.score.text = `✨ ${this.world.score.toLocaleString()}`;
    this.population.text = `👥 ${this.progression.getPopulation().toLocaleString()}`;
    this.next.text = `Next discovery: ${this.progression.getNextDiscovery()}`;
  }

  #text(text, size, weight) {
    return new Text({ text, style: new TextStyle({ fontSize: size, fontWeight: weight, fill: 0xf8fbff }) });
  }

  #makeButton(label, action) {
    const root = new Container();
    const bg = new Graphics().roundRect(0, 0, 92, 34, 17).fill({ color: 0xffffff, alpha: 0.1 });
    const text = new Text({ text: label, style: new TextStyle({ fontSize: 12, fontWeight: '700', fill: 0xffffff }), anchor: 0.5 });
    text.position.set(46, 17);
    root.addChild(bg, text);
    root.eventMode = 'static';
    root.cursor = 'pointer';
    root.on('pointertap', action);
    return root;
  }
}
