import { Container, Graphics, Text, TextStyle } from 'https://cdn.jsdelivr.net/npm/pixi.js@8.6.6/dist/pixi.mjs';
import { ENTITY_DEFINITIONS } from '../core/config.js';
import { cellKey } from '../utils/grid.js';

const COLORS = [0x6dd56d, 0x2f9e44, 0x1f7a3f, 0xe0a458, 0xc8873f, 0x7f8fa6, 0x6c63ff];

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

  resize(width, height, hudHeight = 98) {
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
    const backdrop = new Graphics()
      .roundRect(originX - 4, originY - 4, cellSize * visualColumns + 8, cellSize * visualRows + 8, 22)
      .fill({ color: 0x10243f, alpha: 0.92 })
      .stroke({ color: 0x5ea6d8, alpha: 0.18, width: 1 });
    this.board.addChild(backdrop);

    for (let y = 0; y < this.world.rows; y += 1) {
      for (let x = 0; x < this.world.columns; x += 1) {
        const { px, py } = this.#cellPosition(x, y);
        const isPrimed = primed.has(cellKey(x, y));
        const isSpark = this.world.activeSpark?.x === x && this.world.activeSpark?.y === y;
        const tile = new Graphics()
          .roundRect(px + 2, py + 2, cellSize - 4, cellSize - 4, Math.max(7, cellSize * 0.16))
          .fill({ color: (x + y) % 2 === 0 ? 0x16324f : 0x183854, alpha: 0.9 });

        if (isPrimed) {
          tile.stroke({ color: 0x7dff9b, alpha: 0.72, width: Math.max(1, cellSize * 0.045) });
        }
        if (isSpark) {
          tile.stroke({ color: 0xffdc73, alpha: 0.95, width: Math.max(2, cellSize * 0.07) });
        }

        tile.eventMode = 'static';
        tile.cursor = 'pointer';
        tile.on('pointertap', () => this.onTap(x, y));
        this.board.addChild(tile);

        if (isSpark) this.#drawSpark(px, py, cellSize);
        const entity = this.world.getCell(x, y);
        if (entity) this.#drawEntity(entity, px, py, cellSize, isPrimed);
      }
    }
  }

  play(events) {
    this.renderWorld();
    for (const event of events) {
      if (event.type === 'merge') {
        this.#burst(event.x, event.y, event.chain);
        this.#particleBurst(event.x, event.y, COLORS[event.toLevel]);
      }
      if (event.type === 'spawn') this.#pop(event.x, event.y);
      if (event.type === 'pulse') this.#pulse(event.x, event.y);
      if (event.type === 'discovery') this.#announcement(`NEW DISCOVERY  ${ENTITY_DEFINITIONS[event.level].emoji} ${ENTITY_DEFINITIONS[event.level].name}`, `+${event.bonus}`);
      if (event.type === 'goalComplete') this.#announcement('GOAL COMPLETE!', `+${event.reward}`);
      if (event.type === 'sparkCollected') {
        this.#particleBurst(event.x, event.y, 0xffdc73, 14);
        this.#floatingLabel(event.x, event.y, `✦ LIFE SPARK +${event.bonus}`, 0xffdc73);
      }
      if (event.type === 'sparkAppeared') this.#floatingLabel(event.x, event.y, '✦ LIFE SPARK', 0xffdc73);
      if (event.type === 'flow' && event.value >= 2) this.#floatingLabelFromScreen(`🔥 ${event.value}× FLOW  +${event.bonus}`, 0xffcf66);
    }
  }

  #cellPosition(x, y) {
    const { cellSize, originX, originY, transpose } = this.layout;
    const visualX = transpose ? y : x;
    const visualY = transpose ? x : y;
    return {
      px: originX + visualX * cellSize,
      py: originY + visualY * cellSize,
    };
  }

  #drawEntity(entity, px, py, cellSize, isPrimed) {
    const def = ENTITY_DEFINITIONS[entity.level];
    const container = new Container();
    container.position.set(px + cellSize / 2, py + cellSize / 2);

    const halo = new Graphics()
      .circle(0, 0, cellSize * (isPrimed ? 0.4 : 0.35))
      .fill({ color: isPrimed ? 0x7dff9b : COLORS[entity.level], alpha: isPrimed ? 0.28 : 0.22 });
    container.addChild(halo);

    const text = new Text({
      text: def.emoji,
      style: new TextStyle({ fontSize: Math.floor(cellSize * 0.54), align: 'center' }),
      anchor: 0.5,
    });
    container.addChild(text);
    container.eventMode = 'none';
    this.board.addChild(container);
    this.entityViews.set(`${entity.x},${entity.y}`, container);
  }

  #drawSpark(px, py, cellSize) {
    const glow = new Graphics()
      .circle(px + cellSize / 2, py + cellSize / 2, cellSize * 0.34)
      .fill({ color: 0xffdc73, alpha: 0.16 });
    const symbol = new Text({
      text: '✦',
      style: new TextStyle({ fontSize: Math.floor(cellSize * 0.56), fontWeight: '800', fill: 0xffdc73 }),
      anchor: 0.5,
    });
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

  #announcement(title, subtitle) {
    const { originX, originY, cellSize, transpose } = this.layout;
    const visualColumns = transpose ? this.world.rows : this.world.columns;
    const visualRows = transpose ? this.world.columns : this.world.rows;
    const x = originX + visualColumns * cellSize / 2;
    const y = originY + visualRows * cellSize * 0.35;
    const group = new Container();
    group.position.set(x, y);
    const bg = new Graphics().roundRect(-145, -30, 290, 62, 20).fill({ color: 0x07111f, alpha: 0.9 }).stroke({ color: 0xffe49a, alpha: 0.45, width: 1 });
    const heading = new Text({ text: title, style: new TextStyle({ fontSize: 17, fontWeight: '900', fill: 0xffffff }), anchor: 0.5 });
    heading.position.y = -8;
    const reward = new Text({ text: subtitle, style: new TextStyle({ fontSize: 13, fontWeight: '800', fill: 0xffdc73 }), anchor: 0.5 });
    reward.position.y = 14;
    group.addChild(bg, heading, reward);
    this.effects.addChild(group);
    group.scale.set(0.75);
    this.#animate(70, (life) => {
      group.scale.set(Math.min(1, 0.75 + life * 0.04));
      group.alpha = life < 48 ? 1 : Math.max(0, 1 - (life - 48) / 22);
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
