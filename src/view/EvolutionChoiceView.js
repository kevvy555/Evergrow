import { Container, Graphics, Text, TextStyle } from 'https://cdn.jsdelivr.net/npm/pixi.js@8.6.6/dist/pixi.mjs';

export class EvolutionChoiceView extends Container {
  constructor(onChoose) {
    super();
    this.onChoose = onChoose;
    this.choice = null;
    this.screenSize = { width: 360, height: 720 };
    this.visible = false;
    this.eventMode = 'none';
  }

  show(choice) { this.choice = choice; this.visible = Boolean(choice); this.eventMode = choice ? 'static' : 'none'; this.#render(); }
  hide() { this.choice = null; this.visible = false; this.eventMode = 'none'; this.removeChildren().forEach((child) => child.destroy({ children: true })); }
  resize(width, height) { this.screenSize = { width, height }; if (this.visible) this.#render(); }

  #render() {
    this.removeChildren().forEach((child) => child.destroy({ children: true }));
    if (!this.choice) return;
    const { width, height } = this.screenSize;
    const landscape = width > height;
    const panelWidth = Math.min(landscape ? 720 : 430, width - 24);
    const panelHeight = Math.min(landscape ? 265 : 330, height - 18);
    const x = (width - panelWidth) / 2;
    const y = Math.max(9, (height - panelHeight) / 2);

    const shade = new Graphics().rect(0, 0, width, height).fill({ color: 0x020711, alpha: 0.78 });
    shade.eventMode = 'static';
    const panel = new Graphics().roundRect(x, y, panelWidth, panelHeight, 24).fill({ color: 0x0b1930, alpha: 0.98 }).stroke({ color: 0xb58cff, alpha: 0.55, width: 2 });
    const title = this.#text(this.choice.title.toUpperCase(), 18, 900); title.anchor.set(0.5, 0); title.position.set(width / 2, y + 18);
    const subtitle = this.#text('Choose one permanent evolution', 11, 600, 0xaec3da); subtitle.anchor.set(0.5, 0); subtitle.position.set(width / 2, y + 47);
    this.addChild(shade, panel, title, subtitle);

    if (landscape) this.#renderLandscapeOptions(x, y, panelWidth, panelHeight);
    else this.#renderPortraitOptions(x, y, panelWidth);
  }

  #renderPortraitOptions(x, y, panelWidth) {
    this.choice.options.forEach((option, index) => {
      const cardY = y + 78 + index * 112;
      const cardWidth = panelWidth - 32;
      this.#addOptionCard(option, x + 16, cardY, cardWidth, 96);
    });
  }

  #renderLandscapeOptions(x, y, panelWidth, panelHeight) {
    const gap = 12;
    const cardWidth = (panelWidth - 44 - gap) / 2;
    const cardHeight = Math.max(145, panelHeight - 88);
    this.choice.options.forEach((option, index) => {
      const cardX = x + 16 + index * (cardWidth + gap);
      this.#addOptionCard(option, cardX, y + 72, cardWidth, cardHeight);
    });
  }

  #addOptionCard(option, x, y, width, height) {
    const card = new Container(); card.position.set(x, y);
    const bg = new Graphics().roundRect(0, 0, width, height, 18).fill({ color: 0xffffff, alpha: 0.07 }).stroke({ color: 0xffffff, alpha: 0.1, width: 1 });
    const icon = this.#text(option.icon, 27, 700); icon.position.set(14, 12);
    const name = this.#text(option.name, 14, 900); name.position.set(52, 12);
    const choose = this.#button('CHOOSE', width - 82, 10, () => this.onChoose(option.id));
    const desc = this.#text(option.description, 10, 600, 0xc9d8e8); desc.position.set(14, 51); desc.style.wordWrap = true; desc.style.wordWrapWidth = Math.max(110, width - 28);
    card.addChild(bg, icon, name, choose, desc); this.addChild(card);
  }

  #button(label, x, y, action) {
    const root = new Container(); root.position.set(x, y);
    const bg = new Graphics().roundRect(0, 0, 72, 27, 14).fill({ color: 0x8b6cff, alpha: 0.9 });
    const text = this.#text(label, 9, 900); text.anchor.set(0.5); text.position.set(36, 13.5);
    root.addChild(bg, text); root.eventMode = 'static'; root.cursor = 'pointer'; root.on('pointertap', action); return root;
  }

  #text(text, size, weight, fill = 0xffffff) {
    return new Text({ text, style: new TextStyle({ fontSize: size, fontWeight: weight, fill }) });
  }
}
