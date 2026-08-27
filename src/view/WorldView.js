import { Container, Graphics, Text, TextStyle } from 'https://cdn.jsdelivr.net/npm/pixi.js@8.6.6/dist/pixi.mjs';
import { ENTITY_DEFINITIONS } from '../core/config.js';

const COLORS = [0x6dd56d, 0x2f9e44, 0x1f7a3f, 0xe0a458, 0xc8873f, 0x7f8fa6, 0x6c63ff];

export class WorldView extends Container {
  constructor(world, onTap) {
    super();
    this.world = world;
    this.onTap = onTap;
    this.board = new Container();
    this.effects = new Container();
    this.addChild(this.board, this.effects);
    this.layout = { cellSize: 44, originX: 0, originY: 0 };
    this.entityViews = new Map();
  }

  resize(width, height, hudHeight = 150) {
    const availableWidth = width - 24;
    const availableHeight = height - hudHeight - 36;
    const cellSize = Math.floor(Math.min(
      availableWidth / this.world.columns,
      availableHeight / this.world.rows,
      72,
    ));
    const boardWidth = cellSize * this.world.columns;
    const boardHeight = cellSize * this.world.rows;
    this.layout = {
      cellSize,
      originX: Math.floor((width - boardWidth) / 2),
      originY: Math.floor(hudHeight + (availableHeight - boardHeight) / 2),
    };
    this.renderWorld();
  }

  renderWorld() {
    this.board.removeChildren().forEach((child) => child.destroy({ children: true }));
    this.entityViews.clear();

    const { cellSize, originX, originY } = this.layout;
    const backdrop = new Graphics()
      .roundRect(originX - 8, originY - 8, cellSize * this.world.columns + 16, cellSize * this.world.rows + 16, 30)
      .fill({ color: 0x10243f, alpha: 0.92 })
      .stroke({ color: 0x5ea6d8, alpha: 0.18, width: 1 });
    this.board.addChild(backdrop);

    for (let y = 0; y < this.world.rows; y += 1) {
      for (let x = 0; x < this.world.columns; x += 1) {
        const px = originX + x * cellSize;
        const py = originY + y * cellSize;
        const tile = new Graphics()
          .roundRect(px + 2, py + 2, cellSize - 4, cellSize - 4, Math.max(7, cellSize * 0.16))
          .fill({ color: (x + y) % 2 === 0 ? 0x16324f : 0x183854, alpha: 0.9 });
        tile.eventMode = 'static';
        tile.cursor = 'pointer';
        tile.on('pointertap', () => this.onTap(x, y));
        this.board.addChild(tile);

        const entity = this.world.getCell(x, y);
        if (entity) this.#drawEntity(entity, px, py, cellSize);
      }
    }
  }

  play(events) {
    this.renderWorld();
    for (const event of events) {
      if (event.type === 'merge') this.#burst(event.x, event.y, event.chain);
      if (event.type === 'spawn') this.#pop(event.x, event.y);
      if (event.type === 'pulse') this.#pulse(event.x, event.y);
    }
  }

  #drawEntity(entity, px, py, cellSize) {
    const def = ENTITY_DEFINITIONS[entity.level];
    const container = new Container();
    container.position.set(px + cellSize / 2, py + cellSize / 2);

    const halo = new Graphics()
      .circle(0, 0, cellSize * 0.35)
      .fill({ color: COLORS[entity.level], alpha: 0.22 });
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

  #worldPoint(x, y) {
    const { cellSize, originX, originY } = this.layout;
    return {
      x: originX + x * cellSize + cellSize / 2,
      y: originY + y * cellSize + cellSize / 2,
    };
  }

  #pop(x, y) {
    const point = this.#worldPoint(x, y);
    const ring = new Graphics().circle(0, 0, 8).stroke({ color: 0xffffff, width: 3, alpha: 0.8 });
    ring.position.copyFrom(point);
    this.effects.addChild(ring);
    let life = 0;
    const tick = (ticker) => {
      life += ticker.deltaTime;
      ring.scale.set(1 + life * 0.08);
      ring.alpha = Math.max(0, 1 - life / 14);
      if (life >= 14) {
        this.removeTicker?.(tick);
        ring.destroy();
      }
    };
    this.emit('effect', tick);
  }

  #pulse(x, y) {
    const view = this.entityViews.get(`${x},${y}`);
    if (!view) return;
    view.scale.set(1.15);
    setTimeout(() => view.scale.set(1), 110);
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
    let life = 0;
    const tick = (ticker) => {
      life += ticker.deltaTime;
      label.y -= ticker.deltaTime * 1.2;
      label.scale.set(1 + Math.sin(Math.min(life, 5)) * 0.06);
      label.alpha = Math.max(0, 1 - life / 42);
      if (life >= 42) {
        this.removeTicker?.(tick);
        label.destroy();
      }
    };
    this.emit('effect', tick);
  }
}
