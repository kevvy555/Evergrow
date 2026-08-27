import { Container, Graphics, Text, TextStyle } from 'https://cdn.jsdelivr.net/npm/pixi.js@8.6.6/dist/pixi.mjs';
import { ENTITY_DEFINITIONS, GAME_CONFIG } from '../core/config.js';

export class HudView extends Container {
  constructor(world, progression, goalSystem, actions) {
    super(); this.world=world;this.progression=progression;this.goalSystem=goalSystem;this.actions=actions;
    this.background=new Graphics();this.bloomTrack=new Graphics();this.bloomFill=new Graphics();
    this.title=this.#text('EVERGROW',20,900);this.version=this.#text(`v${GAME_CONFIG.version}`,10,700,0x91a9c2);this.stage=this.#text('',11,700);this.flow=this.#text('',11,800,0xffcf66);this.score=this.#text('',12,800);this.population=this.#text('',11,650);this.goal=this.#text('',11,650,0xdbeafe);this.bloomLabel=this.#text('',9,800,0xf3b6ff);
    this.journal=this.#makeButton('📖',()=>this.actions.openJournal(),30);this.feedback=this.#makeButton('🔊',()=>{this.actions.toggleFeedback();this.render();},30);this.reset=this.#makeButton('New world',()=>this.actions.reset(),82);
    this.flow.anchor.set(0.5,0);this.score.anchor.set(0.5,0);this.population.anchor.set(1,0);this.bloomLabel.anchor.set(1,0);
    this.addChild(this.background,this.bloomTrack,this.bloomFill,this.title,this.version,this.stage,this.flow,this.score,this.population,this.goal,this.bloomLabel,this.journal,this.feedback,this.reset);
  }
  resize(width){const panelX=6,panelY=6,panelH=92,hudH=102;this.background.clear().roundRect(panelX,panelY,Math.max(1,width-panelX*2),panelH,18).fill({color:0x07111f,alpha:0.82}).stroke({color:0xffffff,alpha:0.08,width:1});
    this.title.position.set(16,11);this.version.position.set(120,17);const resetX=width-90,feedbackX=resetX-34,journalX=feedbackX-34;this.journal.position.set(journalX,10);this.feedback.position.set(feedbackX,10);this.reset.position.set(resetX,10);
    this.stage.position.set(16,41);this.flow.position.set(width*0.42,41);this.score.position.set(width*0.66,41);this.population.position.set(width-16,41);this.goal.position.set(16,64);this.bloomLabel.position.set(width-16,65);
    const bx=16,by=85,bw=Math.max(20,width-32),bh=5;this.bloomBar={x:bx,y:by,width:bw,height:bh};this.bloomTrack.clear().roundRect(bx,by,bw,bh,3).fill({color:0xffffff,alpha:0.08});this.render();return hudH;}
  render(){const current=ENTITY_DEFINITIONS[this.world.discoveredLevel],goal=this.goalSystem.getCurrentGoal();this.stage.text=`${current?.emoji??'🌱'} ${this.progression.getCurrentStage()} · chain ${this.world.bestChain}×`;this.flow.text=this.world.flow>0?`🔥 ${this.world.flow}× FLOW`:'🔥 —';this.score.text=`✨ ${this.world.score.toLocaleString()}`;this.population.text=`👥 ${this.progression.getPopulation().toLocaleString()}`;this.goal.text=goal?`🎯 ${goal.label} · +${goal.reward.toLocaleString()}`:'🎯 Launch goals complete';this.bloomLabel.text=this.world.bloomTurns>0?`🌸 BLOOM ${this.world.bloomTurns}`:`🌸 ${Math.floor(this.world.bloomEnergy)}%`;this.#renderBloom();this.feedback.setLabel(this.actions.feedbackEnabled()?'🔊':'🔇');}
  #renderBloom(){if(!this.bloomBar)return;const {x,y,width,height}=this.bloomBar,progress=this.world.bloomTurns>0?1:this.world.bloomEnergy/GAME_CONFIG.bloom.threshold;this.bloomFill.clear().roundRect(x,y,Math.max(2,width*Math.min(1,progress)),height,3).fill({color:this.world.bloomTurns>0?0xf2a7ff:0x9a72ff,alpha:0.95});}
  #text(text,size,weight,fill=0xf8fbff){return new Text({text,style:new TextStyle({fontSize:size,fontWeight:weight,fill})});}
  #makeButton(label,action,width){const root=new Container(),bg=new Graphics().roundRect(0,0,width,30,15).fill({color:0xffffff,alpha:0.1}),text=this.#text(label,10,700);text.anchor.set(0.5);text.position.set(width/2,15);root.addChild(bg,text);root.eventMode='static';root.cursor='pointer';root.on('pointertap',action);root.setLabel=v=>{text.text=v;};return root;}
}
