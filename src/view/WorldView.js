import { Container, Graphics, Text, TextStyle } from 'https://cdn.jsdelivr.net/npm/pixi.js@8.6.6/dist/pixi.mjs';
import { ENTITY_DEFINITIONS, GAME_CONFIG } from '../core/config.js';
import { getDayPhase, getWeatherDefinition } from '../core/weatherDefinitions.js';
import { cellKey } from '../utils/grid.js';

const COLORS = [0x6dd56d, 0x2f9e44, 0x1f7a3f, 0xe0a458, 0xc8873f, 0x7f8fa6, 0x6c63ff];
const RADIANT = 0xffdf70;
const RESONANCE = 0x7ce8ff;
const HARMONY = 0x86f7b2;
const FESTIVAL = 0xff8ed8;
const PHASE_COLORS = Object.freeze({ dawn: 0x1d3850, day: 0x123a54, dusk: 0x302f51, night: 0x09172d });

export class WorldView extends Container {
  constructor(world, hintSystem, onTap) {
    super();
    this.world = world;
    this.hintSystem = hintSystem;
    this.onTap = onTap;
    this.board = new Container();
    this.effects = new Container();
    this.addChild(this.board, this.effects);
    this.layout = { cellSize: 44, originX: 0, originY: 0, transpose: false };
    this.entityViews = new Map();
  }

  resize(width, height, hudHeight = 102) {
    const margin = 8;
    const availableWidth = Math.max(1, width - margin * 2);
    const availableHeight = Math.max(1, height - hudHeight - margin);
    const transpose = width > height;
    const visualColumns = transpose ? this.world.rows : this.world.columns;
    const visualRows = transpose ? this.world.columns : this.world.rows;
    const cellSize = Math.max(12, Math.floor(Math.min(
      availableWidth / visualColumns,
      availableHeight / visualRows,
    )));
    const boardWidth = cellSize * visualColumns;
    const boardHeight = cellSize * visualRows;

    this.layout = {
      cellSize,
      originX: Math.floor((width - boardWidth) / 2),
      originY: Math.floor(hudHeight + (availableHeight - boardHeight) / 2),
      transpose,
    };
    this.renderWorld();
  }

  renderWorld() {
    this.board.removeChildren().forEach((child) => child.destroy({ children: true }));
    this.entityViews.clear();

    const { cellSize, originX, originY, transpose } = this.layout;
    const visualColumns = transpose ? this.world.rows : this.world.columns;
    const visualRows = transpose ? this.world.columns : this.world.rows;
    const primed = this.hintSystem.getPrimedCellKeys();
    const bloomActive = this.world.bloomTurns > 0;
    const phase = getDayPhase(this.world.taps, GAME_CONFIG.dayCycle.phaseLength);
    const backdrop = new Graphics()
      .roundRect(originX - 4, originY - 4, cellSize * visualColumns + 8, cellSize * visualRows + 8, 22)
      .fill({ color: bloomActive ? 0x253154 : PHASE_COLORS[phase.id], alpha: 0.95 })
      .stroke({ color: bloomActive ? 0xf2a7ff : 0x5ea6d8, alpha: bloomActive ? 0.38 : 0.18, width: bloomActive ? 2 : 1 });
    this.board.addChild(backdrop);

    // First pass: interactive terrain tiles.
    for (let y = 0; y < this.world.rows; y += 1) {
      for (let x = 0; x < this.world.columns; x += 1) {
        const { px, py } = this.#cellPosition(x, y);
        const isPrimed = primed.has(cellKey(x, y));
        const isSpark = this.world.activeSpark?.x === x && this.world.activeSpark?.y === y;
        const tile = new Graphics()
          .roundRect(px + 2, py + 2, cellSize - 4, cellSize - 4, Math.max(7, cellSize * 0.16))
          .fill({ color: (x + y) % 2 === 0 ? (bloomActive ? 0x233d5b : 0x16324f) : (bloomActive ? 0x29415d : 0x183854), alpha: 0.9 });
        if (isPrimed) tile.stroke({ color: 0x7dff9b, alpha: 0.72, width: Math.max(1, cellSize * 0.045) });
        if (isSpark) tile.stroke({ color: 0xffdc73, alpha: 0.95, width: Math.max(2, cellSize * 0.07) });
        tile.eventMode = 'static';
        tile.cursor = 'pointer';
        tile.on('pointertap', () => this.onTap(x, y));
        this.board.addChild(tile);
      }
    }

    // Roads and moving traffic sit above terrain but below buildings.
    this.#drawRoads(cellSize);

    // Second pass: world objects and local status.
    for (let y = 0; y < this.world.rows; y += 1) {
      for (let x = 0; x < this.world.columns; x += 1) {
        const { px, py } = this.#cellPosition(x, y);
        const isPrimed = primed.has(cellKey(x, y));
        const isSpark = this.world.activeSpark?.x === x && this.world.activeSpark?.y === y;
        if (isSpark) this.#drawSpark(px, py, cellSize);
        const entity = this.world.getCell(x, y);
        if (entity) this.#drawEntity(entity, px, py, cellSize, isPrimed);
        if (this.world.activeWish?.x === x && this.world.activeWish?.y === y) this.#drawWishBubble(px, py, cellSize);
      }
    }

    // Weather is a light atmospheric overlay, so it remains readable above the world.
    this.#drawWeather(cellSize, visualColumns, visualRows);
  }

  play(events) {
    this.renderWorld();
    for (const event of events) {
      if (event.type === 'merge') {
        this.#burst(event.x, event.y, event.chain);
        this.#particleBurst(event.x, event.y, COLORS[event.toLevel]);
      }
      if (event.type === 'perfectMerge') {
        this.#floatingLabel(event.x, event.y, `💎 PERFECT +${event.bonus}`, 0xb9f6ff);
        this.#particleBurst(event.x, event.y, 0xb9f6ff, 12);
      }
      if (event.type === 'resonance') {
        this.#floatingLabel(event.x, event.y, '⚡ RESONANCE', RESONANCE);
        this.#particleBurst(event.x, event.y, RESONANCE, 8);
      }
      if (event.type === 'radiantBorn') this.#particleBurst(event.x, event.y, RADIANT, 16);
      if (event.type === 'radiantMerge') {
        this.#particleBurst(event.x, event.y, RADIANT, 18);
        this.#floatingLabel(event.x, event.y, `✦ RADIANT BURST +${event.bonus}`, RADIANT);
      }
      if (event.type === 'wonderDiscovered') for (const cell of event.cells ?? []) this.#particleBurst(cell.x, cell.y, 0xc8a7ff, 10);
      if (event.type === 'spawn') this.#pop(event.x, event.y);
      if (event.type === 'pulse') this.#pulse(event.x, event.y);
      if (event.type === 'sparkCollected') {
        this.#particleBurst(event.x, event.y, 0xffdc73, 14);
        this.#floatingLabel(event.x, event.y, `✦ LIFE SPARK +${event.bonus}`, 0xffdc73);
      }
      if (event.type === 'sparkAppeared') this.#floatingLabel(event.x, event.y, '✦ LIFE SPARK', 0xffdc73);
      if (event.type === 'flow' && event.value >= 2) this.#floatingLabelFromScreen(`🔥 ${event.value}× FLOW +${event.bonus}`, 0xffcf66);
      if (event.type === 'harmonyFormed') {
        this.#particleBurst(event.x, event.y, HARMONY, 14);
        this.#floatingLabel(event.x, event.y, `♥ HARMONY +${event.reward}`, HARMONY);
      }
      if (event.type === 'wishOffered') this.#floatingLabel(event.x, event.y, `💬 ${event.icon} WISH`, 0xdbeafe);
      if (event.type === 'wishComplete') {
        this.#particleBurst(event.x, event.y, HARMONY, 12);
        this.#floatingLabel(event.x, event.y, `😊 WISH +${event.reward}`, HARMONY);
      }
      if (event.type === 'festivalBonus') this.#floatingLabelFromScreen(`🎉 FESTIVAL +${event.bonus}`, FESTIVAL);
      if (event.type === 'weatherBonus') this.#floatingLabelFromScreen(`🌤️ GOLDEN +${event.bonus}`, 0xffd27a);
      if (event.type === 'weatherEnd') this.#floatingLabelFromScreen(`${event.icon} ${event.name} passes`, 0xb6cbe0);
      if (event.type === 'festivalEnd') this.#floatingLabelFromScreen('🎉 Festival rests…', 0xffb6df);
      if (event.type === 'bloomEnd') this.#floatingLabelFromScreen('🌸 Bloom rests…', 0xf2a7ff);
      if (event.type === 'goalComplete') this.#floatingLabelFromScreen(`🎯 GOAL +${event.reward}`, 0xffdc73);
    }

    const headline = this.#headline(events);
    if (headline) this.#announcement(headline.title, headline.subtitle, headline.tertiary);
  }

  #headline(events) {
    const priorities = [
      ['evolutionChosen', (event) => ({ title: `EVOLVED ${event.icon}`, subtitle: event.name, tertiary: 'Permanent world trait' })],
      ['wonderDiscovered', (event) => ({ title: `WONDER DISCOVERED ${event.icon}`, subtitle: event.name, tertiary: `+${event.reward}` })],
      ['festivalStart', (event) => ({ title: '🎉 WORLD FESTIVAL!', subtitle: `${event.turns} celebration turns`, tertiary: 'Merges earn community bonuses' })],
      ['radiantBorn', (event) => ({ title: '✦ RADIANT LIFE', subtitle: `${ENTITY_DEFINITIONS[event.level].emoji} ${ENTITY_DEFINITIONS[event.level].name}`, tertiary: event.source === 'starlight' ? 'Born under Starlight' : 'Earned through mastery' })],
      ['discovery', (event) => ({ title: `NEW DISCOVERY ${ENTITY_DEFINITIONS[event.level].emoji}`, subtitle: ENTITY_DEFINITIONS[event.level].name, tertiary: `+${event.bonus}` })],
      ['bloomStart', (event) => ({ title: '🌸 WORLD BLOOM!', subtitle: `${event.turns} empowered taps`, tertiary: 'Trees from every tap' })],
      ['wishComplete', (event) => ({ title: `😊 WISH FULFILLED ${event.icon}`, subtitle: event.label, tertiary: `+${event.reward}` })],
      ['harmonyFormed', (event) => ({ title: '♥ HARMONY DISTRICT', subtitle: event.name ? `${event.name} thrives with nature` : 'Nature and people thrive together', tertiary: 'This identity now persists' })],
      ['settlementNamed', (event) => ({ title: `🏡 ${event.name}`, subtitle: 'A new place has found its name', tertiary: 'Its identity will grow with it' })],
      ['weatherStart', (event) => ({ title: `${event.icon} ${event.name.toUpperCase()}`, subtitle: event.description, tertiary: `${event.turns} turns` })],
    ];
    for (const [type, format] of priorities) {
      const event = events.find((candidate) => candidate.type === type);
      if (event) return format(event);
    }
    return null;
  }

  #cellPosition(x, y) {
    const { cellSize, originX, originY, transpose } = this.layout;
    const visualX = transpose ? y : x;
    const visualY = transpose ? x : y;
    return { px: originX + visualX * cellSize, py: originY + visualY * cellSize };
  }

  #drawEntity(entity, px, py, cellSize, isPrimed) {
    const def = ENTITY_DEFINITIONS[entity.level];
    const radiant = entity.variant === 'radiant';
    const container = new Container();
    container.position.set(px + cellSize / 2, py + cellSize / 2);

    const halo = new Graphics()
      .circle(0, 0, cellSize * (radiant ? 0.43 : isPrimed ? 0.4 : 0.35))
      .fill({ color: radiant ? RADIANT : isPrimed ? 0x7dff9b : COLORS[entity.level], alpha: radiant ? 0.34 : isPrimed ? 0.28 : 0.22 });
    container.addChild(halo);

    if (radiant) {
      const ring = new Graphics().circle(0, 0, cellSize * 0.39).stroke({ color: RADIANT, alpha: 0.9, width: Math.max(1, cellSize * 0.045) });
      container.addChild(ring);
    }

    const text = new Text({
      text: def.emoji,
      style: new TextStyle({ fontSize: Math.floor(cellSize * 0.54), align: 'center' }),
      anchor: 0.5,
    });
    container.addChild(text);

    if (radiant) {
      const star = new Text({ text: '✦', style: new TextStyle({ fontSize: Math.max(9, Math.floor(cellSize * 0.22)), fontWeight: '900', fill: RADIANT }), anchor: 0.5 });
      star.position.set(cellSize * 0.23, -cellSize * 0.25);
      container.addChild(star);
    }

    if (entity.harmony) {
      const heart = new Text({ text: '♥', style: new TextStyle({ fontSize: Math.max(8, Math.floor(cellSize * 0.2)), fontWeight: '900', fill: HARMONY }), anchor: 0.5 });
      heart.position.set(-cellSize * 0.25, cellSize * 0.25);
      container.addChild(heart);
    }

    if (entity.level >= 3) this.#drawLifeMotes(container, entity, cellSize);
    if (entity.level >= 3 && this.world.festivalTurns > 0) this.#drawFestivalConfetti(container, entity, cellSize);
    container.eventMode = 'none';
    this.board.addChild(container);
    this.entityViews.set(`${entity.x},${entity.y}`, container);
  }

  #drawLifeMotes(container, entity, cellSize) {
    const count = Math.min(3, entity.level - 2);
    const phase = this.world.taps * 0.42 + entity.x * 0.71 + entity.y * 0.39;
    for (let i = 0; i < count; i += 1) {
      const angle = phase + i * (Math.PI * 2 / count);
      const radius = cellSize * (0.25 + i * 0.04);
      const mote = new Graphics().circle(Math.cos(angle) * radius, Math.sin(angle) * radius, Math.max(1, cellSize * 0.028)).fill({ color: 0xffffff, alpha: 0.55 });
      container.addChild(mote);
    }
  }

  #drawRoads(cellSize) {
    const drawn = new Set();
    for (const entity of this.world.cells.values()) {
      if (entity.level < 3) continue;
      for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [-1, 1]]) {
        const other = this.world.getCell(entity.x + dx, entity.y + dy);
        if (!other || other.level < 3) continue;
        const key = `${entity.x},${entity.y}:${other.x},${other.y}`;
        if (drawn.has(key)) continue;
        drawn.add(key);
        const a = this.#worldPoint(entity.x, entity.y);
        const b = this.#worldPoint(other.x, other.y);
        const road = new Graphics().moveTo(a.x, a.y).lineTo(b.x, b.y).stroke({ color: 0xd4c59b, alpha: 0.14, width: Math.max(1, cellSize * 0.08) });
        this.board.addChild(road);
        const progress = ((this.world.taps * 0.13 + entity.x * 0.17 + entity.y * 0.11) % 1);
        const traffic = new Graphics().circle(a.x + (b.x - a.x) * progress, a.y + (b.y - a.y) * progress, Math.max(1, cellSize * 0.025)).fill({ color: 0xffe49a, alpha: 0.72 });
        this.board.addChild(traffic);
      }
    }
  }

  #drawWeather(cellSize, visualColumns, visualRows) {
    const weather = getWeatherDefinition(this.world.weatherId);
    if (!weather) return;
    const { originX, originY } = this.layout;
    const width = cellSize * visualColumns;
    const height = cellSize * visualRows;
    if (weather.id === 'rain') {
      for (let i = 0; i < 18; i += 1) {
        const x = originX + ((i * 37 + this.world.taps * 19) % Math.max(1, width));
        const y = originY + ((i * 53 + this.world.taps * 11) % Math.max(1, height));
        const drop = new Graphics().moveTo(x, y).lineTo(x - 4, y + 9).stroke({ color: 0x8fd8ff, alpha: 0.22, width: 1 });
        this.board.addChild(drop);
      }
    } else if (weather.id === 'golden_hour') {
      const glow = new Graphics().circle(originX + width * 0.82, originY + height * 0.16, Math.max(18, cellSize * 1.4)).fill({ color: 0xffc96b, alpha: 0.08 });
      this.board.addChild(glow);
    } else if (weather.id === 'starlight') {
      for (let i = 0; i < 16; i += 1) {
        const x = originX + ((i * 43 + 17) % Math.max(1, width));
        const y = originY + ((i * 67 + this.world.taps * 3) % Math.max(1, height));
        const star = new Graphics().circle(x, y, Math.max(1, cellSize * 0.025)).fill({ color: 0xd8e8ff, alpha: 0.42 });
        this.board.addChild(star);
      }
    }
  }

  #drawWishBubble(px, py, cellSize) {
    const bubble = new Text({ text: '💬', style: new TextStyle({ fontSize: Math.max(11, Math.floor(cellSize * 0.28)) }), anchor: 0.5 });
    bubble.position.set(px + cellSize * 0.73, py + cellSize * 0.22);
    this.board.addChild(bubble);
  }

  #drawFestivalConfetti(container, entity, cellSize) {
    const colors = [0xff8ed8, 0xffd86b, 0x86f7b2];
    for (let i = 0; i < 3; i += 1) {
      const phase = this.world.taps * 0.8 + entity.x * 0.4 + entity.y * 0.6 + i * 2.1;
      const dot = new Graphics().circle(Math.cos(phase) * cellSize * 0.34, -cellSize * 0.32 + Math.sin(phase) * cellSize * 0.1, Math.max(1, cellSize * 0.025)).fill({ color: colors[i], alpha: 0.8 });
      container.addChild(dot);
    }
  }

  #drawSpark(px, py, cellSize) {
    const glow = new Graphics().circle(px + cellSize / 2, py + cellSize / 2, cellSize * 0.34).fill({ color: 0xffdc73, alpha: 0.16 });
    const symbol = new Text({ text: '✦', style: new TextStyle({ fontSize: Math.floor(cellSize * 0.56), fontWeight: '800', fill: 0xffdc73 }), anchor: 0.5 });
    symbol.position.set(px + cellSize / 2, py + cellSize / 2);
    this.board.addChild(glow, symbol);
  }

  #worldPoint(x, y) {
    const { cellSize } = this.layout;
    const { px, py } = this.#cellPosition(x, y);
    return { x: px + cellSize / 2, y: py + cellSize / 2 };
  }

  #pop(x, y) {
    const point = this.#worldPoint(x, y);
    const ring = new Graphics().circle(0, 0, 8).stroke({ color: 0xffffff, width: 3, alpha: 0.8 });
    ring.position.copyFrom(point);
    this.effects.addChild(ring);
    this.#animate(14, (life) => {
      ring.scale.set(1 + life * 0.08);
      ring.alpha = Math.max(0, 1 - life / 14);
    }, () => ring.destroy());
  }

  #pulse(x, y) {
    const view = this.entityViews.get(`${x},${y}`);
    if (!view) return;
    view.scale.set(1.15);
    setTimeout(() => { if (!view.destroyed) view.scale.set(1); }, 110);
  }

  #burst(x, y, chain) {
    const point = this.#worldPoint(x, y);
    const label = new Text({
      text: chain > 1 ? `${chain}× CHAIN!` : 'MERGE!',
      style: new TextStyle({ fontSize: chain > 1 ? 24 : 18, fontWeight: '800', fill: 0xfff2a8, stroke: { color: 0x101828, width: 4 } }),
      anchor: 0.5,
    });
    label.position.set(point.x, point.y - 10);
    this.effects.addChild(label);
    this.#animate(42, (life, delta) => {
      label.y -= delta * 1.2;
      label.scale.set(1 + Math.sin(Math.min(life, 5)) * 0.06);
      label.alpha = Math.max(0, 1 - life / 42);
    }, () => label.destroy());
  }

  #particleBurst(x, y, color, count = 9) {
    const point = this.#worldPoint(x, y);
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
      const speed = 1.4 + Math.random() * 2.2;
      const particle = new Graphics().circle(0, 0, 2 + Math.random() * 3).fill({ color, alpha: 0.9 });
      particle.position.copyFrom(point);
      this.effects.addChild(particle);
      this.#animate(25 + Math.random() * 12, (life, delta, maxLife) => {
        particle.x += Math.cos(angle) * speed * delta;
        particle.y += Math.sin(angle) * speed * delta + life * 0.018;
        particle.alpha = Math.max(0, 1 - life / maxLife);
      }, () => particle.destroy());
    }
  }

  #announcement(title, subtitle = '', tertiary = '') {
    const { originX, originY, cellSize, transpose } = this.layout;
    const visualColumns = transpose ? this.world.rows : this.world.columns;
    const visualRows = transpose ? this.world.columns : this.world.rows;
    const x = originX + visualColumns * cellSize / 2;
    const y = originY + visualRows * cellSize * 0.35;
    const group = new Container();
    group.position.set(x, y);
    const bg = new Graphics().roundRect(-146, -37, 292, 76, 20).fill({ color: 0x07111f, alpha: 0.92 }).stroke({ color: 0xffe49a, alpha: 0.45, width: 1 });
    const heading = new Text({ text: title, style: new TextStyle({ fontSize: 16, fontWeight: '900', fill: 0xffffff }), anchor: 0.5 });
    heading.position.y = -16;
    const secondary = new Text({ text: subtitle, style: new TextStyle({ fontSize: 12, fontWeight: '800', fill: 0xffdc73 }), anchor: 0.5 });
    secondary.position.y = 5;
    const third = new Text({ text: tertiary, style: new TextStyle({ fontSize: 10, fontWeight: '700', fill: 0xb6cbe0 }), anchor: 0.5 });
    third.position.y = 23;
    group.addChild(bg, heading, secondary, third);
    this.effects.addChild(group);
    group.scale.set(0.75);
    this.#animate(78, (life) => {
      group.scale.set(Math.min(1, 0.75 + life * 0.04));
      group.alpha = life < 54 ? 1 : Math.max(0, 1 - (life - 54) / 24);
    }, () => group.destroy({ children: true }));
  }

  #floatingLabel(x, y, text, color) {
    const point = this.#worldPoint(x, y);
    const label = this.#effectText(text, color, 14);
    label.position.set(point.x, point.y - 8);
    this.effects.addChild(label);
    this.#animate(36, (life, delta) => {
      label.y -= delta * 0.8;
      label.alpha = Math.max(0, 1 - life / 36);
    }, () => label.destroy());
  }

  #floatingLabelFromScreen(text, color) {
    const { originX, originY, cellSize, transpose } = this.layout;
    const visualColumns = transpose ? this.world.rows : this.world.columns;
    const label = this.#effectText(text, color, 15);
    label.position.set(originX + visualColumns * cellSize / 2, originY + 18);
    this.effects.addChild(label);
    this.#animate(32, (life, delta) => {
      label.y += delta * 0.35;
      label.alpha = Math.max(0, 1 - life / 32);
    }, () => label.destroy());
  }

  #effectText(text, color, size) {
    return new Text({
      text,
      style: new TextStyle({ fontSize: size, fontWeight: '900', fill: color, stroke: { color: 0x07111f, width: 4 } }),
      anchor: 0.5,
    });
  }

  #animate(maxLife, update, complete) {
    let life = 0;
    const tick = (ticker) => {
      const delta = ticker.deltaTime;
      life += delta;
      update(life, delta, maxLife);
      if (life >= maxLife) {
        this.removeTicker?.(tick);
        complete();
      }
    };
    this.emit('effect', tick);
  }
}
