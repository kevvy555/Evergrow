import { Container, Graphics, Text, TextStyle } from 'https://cdn.jsdelivr.net/npm/pixi.js@8.6.6/dist/pixi.mjs';
import { ENTITY_DEFINITIONS, GAME_CONFIG } from '../core/config.js';
import { getDayPhase } from '../core/weatherDefinitions.js';

export class HudView extends Container {
  constructor(world, progression, goalSystem, wishSystem, weatherSystem, coachSystem, featureGateSystem, actions) {
    super();
    Object.assign(this, { world, progression, goalSystem, wishSystem, weatherSystem, coachSystem, featureGateSystem, actions });
    this.transientMessage = null;
    this.meterGeometry = { x: 16, y: 85, width: 100, height: 5 };

    this.background = new Graphics();
    this.meterTrack = new Graphics();
    this.meterFill = new Graphics();
    this.title = this.#text('EVERGROW', 20, 900);
    this.version = this.#text(`v${GAME_CONFIG.version}`, 10, 700, 0x91a9c2);
    this.stage = this.#text('', 11, 700);
    this.flow = this.#text('', 11, 800, 0xffcf66);
    this.score = this.#text('', 12, 800);
    this.population = this.#text('', 11, 650);
    this.context = this.#text('', 10, 750, 0xf2f7ff);
    this.meterLabel = this.#text('', 9, 800, 0xffd66b);
    this.journal = this.#makeButton('📖', () => this.actions.openJournal(), 30);
    this.feedback = this.#makeButton('🔊', () => { this.actions.toggleFeedback(); this.render(); }, 30);
    this.reset = this.#makeButton('New world', () => this.actions.reset(), 82);

    this.flow.anchor.set(0.5, 0);
    this.score.anchor.set(0.5, 0);
    this.population.anchor.set(1, 0);
    this.meterLabel.anchor.set(1, 0);
    this.addChild(
      this.background, this.meterTrack, this.meterFill, this.title, this.version, this.stage, this.flow,
      this.score, this.population, this.context, this.meterLabel, this.journal, this.feedback, this.reset,
    );
  }

  resize(width) {
    const panelX = 6;
    const panelY = 6;
    const panelHeight = 92;
    const hudHeight = 102;
    this.background
      .clear()
      .roundRect(panelX, panelY, Math.max(1, width - panelX * 2), panelHeight, 18)
      .fill({ color: 0x07111f, alpha: 0.86 })
      .stroke({ color: 0xffffff, alpha: 0.08, width: 1 });

    this.title.position.set(16, 11);
    this.version.position.set(120, 17);
    const resetX = width - 90;
    const feedbackX = resetX - 34;
    const journalX = feedbackX - 34;
    this.journal.position.set(journalX, 10);
    this.feedback.position.set(feedbackX, 10);
    this.reset.position.set(resetX, 10);

    this.stage.position.set(16, 41);
    this.flow.position.set(width * 0.42, 41);
    this.score.position.set(width * 0.66, 41);
    this.population.position.set(width - 16, 41);
    this.context.position.set(16, 64);
    this.meterLabel.position.set(width - 16, 65);

    this.meterGeometry = { x: 16, y: 85, width: Math.max(20, width - 32), height: 5 };
    this.render();
    return hudHeight;
  }

  play(events) {
    this.transientMessage = null;
    const blocked = events.find((event) => event.type === 'blocked');
    const merge = events.find((event) => event.type === 'merge');
    const boost = events.find((event) => event.type === 'tapBoostUsed');
    if (blocked) this.transientMessage = '⬜ That tile is occupied — tap an EMPTY tile';
    else if (boost) this.transientMessage = '⚡ TAP BOOST! Your tap planted a Tree instantly';
    else if (merge) {
      const from = ENTITY_DEFINITIONS[merge.fromLevel];
      const to = ENTITY_DEFINITIONS[merge.toLevel];
      this.transientMessage = `COMBO! 3 ${from.emoji} → ${to.emoji} ${to.name}`;
    }
  }

  render() {
    const current = ENTITY_DEFINITIONS[this.world.discoveredLevel];
    const training = this.featureGateSystem.isTraining;
    const goal = this.goalSystem.getCurrentGoal();
    const wish = this.wishSystem.getCurrentWish();
    const weather = this.weatherSystem.active;
    const day = getDayPhase(this.world.taps, GAME_CONFIG.dayCycle.phaseLength);
    const primedPrompt = this.coachSystem.getPrimedPrompt();

    if (training) {
      this.stage.text = `${current?.emoji ?? '🌱'} ${this.progression.getCurrentStage()} · LEARN THE COMBO`;
      this.flow.text = '';
      this.population.text = '';
    } else {
      const environment = weather ? `${day.icon} ${weather.icon}${this.world.weatherTurns}` : day.icon;
      this.stage.text = `${current?.emoji ?? '🌱'} ${this.progression.getCurrentStage()} · ${environment}`;
      this.flow.text = this.featureGateSystem.isUnlocked('flow') && this.world.flow > 0 ? `🔥 ${this.world.flow}× FLOW` : '';
      this.population.text = this.featureGateSystem.isUnlocked('livingWorld')
        ? `👥 ${this.progression.getPopulation().toLocaleString()}` : '';
    }

    this.score.text = `✨ ${this.world.score.toLocaleString()}`;
    this.context.text = this.transientMessage
      ?? (training ? this.coachSystem.getCorePrompt()
        : primedPrompt ?? (wish
          ? `💬 ${wish.settlementName ? `${wish.settlementName}: ` : ''}${wish.icon} ${wish.label}`
          : goal ? `🎯 ${goal.label}` : this.coachSystem.getCorePrompt()));

    this.#renderMeter();
    this.feedback.setLabel(this.actions.feedbackEnabled() ? '🔊' : '🔇');
  }

  #renderMeter() {
    const { x, y, width, height } = this.meterGeometry;
    this.meterTrack.clear();
    this.meterFill.clear();

    if (!this.featureGateSystem.isUnlocked('bloom')) {
      const boostText = this.coachSystem.getBoostText();
      this.meterLabel.text = boostText;
      if (!boostText) return;
      const progress = Math.min(1, this.world.tapCharge / GAME_CONFIG.tapBoost.threshold);
      this.meterTrack.roundRect(x, y, width, height, 3).fill({ color: 0xffffff, alpha: 0.08 });
      this.meterFill.roundRect(x, y, Math.max(2, width * progress), height, 3).fill({ color: 0xffc857, alpha: 0.96 });
      return;
    }

    const bloom = this.world.bloomTurns > 0
      ? `🌸 BLOOM ${this.world.bloomTurns}`
      : `🌸 ${Math.floor((this.world.bloomEnergy / GAME_CONFIG.bloom.threshold) * 100)}%`;
    const boost = this.coachSystem.getBoostText();
    const community = this.featureGateSystem.isUnlocked('livingWorld')
      ? (this.world.festivalTurns > 0 ? `🎉 ${this.world.festivalTurns}` : `😊 ${this.world.communityJoy}/${GAME_CONFIG.wishes.festivalEvery}`)
      : '';
    this.meterLabel.text = [community, boost, bloom].filter(Boolean).join('  ');

    const progress = this.world.bloomTurns > 0 ? 1 : this.world.bloomEnergy / GAME_CONFIG.bloom.threshold;
    this.meterTrack.roundRect(x, y, width, height, 3).fill({ color: 0xffffff, alpha: 0.08 });
    this.meterFill
      .roundRect(x, y, Math.max(2, width * Math.min(1, progress)), height, 3)
      .fill({ color: this.world.bloomTurns > 0 ? 0xf2a7ff : 0x9a72ff, alpha: 0.95 });
  }

  #text(text, size, weight, fill = 0xf8fbff) {
    return new Text({ text, style: new TextStyle({ fontSize: size, fontWeight: weight, fill }) });
  }

  #makeButton(label, action, width) {
    const root = new Container();
    const bg = new Graphics().roundRect(0, 0, width, 30, 15).fill({ color: 0xffffff, alpha: 0.1 });
    const text = this.#text(label, 10, 700);
    text.anchor.set(0.5);
    text.position.set(width / 2, 15);
    root.addChild(bg, text);
    root.eventMode = 'static';
    root.cursor = 'pointer';
    root.on('pointertap', action);
    root.setLabel = (value) => { text.text = value; };
    return root;
  }
}
