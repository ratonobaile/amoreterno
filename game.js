'use strict';
/* ====== CONFIG EDITÁVEL: nomes, textos, dedicatória ====== */
const CFG={title:'Entre Dois Mundos',names:{her:'Ela',me:'Eu'},
 story:{intro:'Duas jornadas, um só destino. Comece pela floresta.',
  her_end:'Ela atravessou a floresta e encontrou um portal. Do outro lado, alguém a espera… (edite este texto em CFG.story)',
  me_end:'Os caminhos se cruzaram. Dedicatória: escreva aqui a sua mensagem. (edite em CFG.story)'},
 goals:{her:'Chegue ao portal no fim da floresta',me:'Atravesse as ruínas até o encontro'}};
if(window.CFG_EXT)Object.assign(CFG,CFG_EXT);
const W=320,H=192,T=16,KEY='entre-dois-mundos-save';
const $=s=>document.querySelector(s),cv=$('#cv'),x=cv.getContext('2d');
/* ====== PERSONAGENS (valores independentes) ====== */
const CH={
 her:{col:'#e86fa0',melee:'Katanas',hp:5,spd:95,acc:800,jmp:295,gr:720,cd:.26,rng:22,dmg:1},
 me:{col:'#5aa0e8',melee:'Adagas',hp:5,spd:105,acc:900,jmp:300,gr:720,cd:.18,rng:15,dmg:1}};
/* ====== SPRITESHEETS: ajuste fw/fh/n/dur/ox/oy conforme sua arte ====== */
const ANIMS=['idle','run','jump','fall','attack','hurt','nidle','nrun'],SPR={};
for(const c in CH){SPR[c]={};ANIMS.forEach(a=>SPR[c][a]=Object.assign({src:`assets/characters/${c}/${a}.png`,fw:32,fh:32,n:4,dur:.12,loop:a!=='attack'&&a!=='death',scale:1,ox:16,oy:32,img:null,ok:false},(window.SPRCFG&&SPRCFG[c]&&SPRCFG[c][a])||{}));}
const FXW=new Image(),FXF=new Image();FXW.src='assets/fx_water.png';FXF.src='assets/fx_fire.png';
const ENIMG={};for(const t in(window.ENCFG||{})){const i=new Image();ENIMG[t]={...ENCFG[t],img:i,ok:false};i.onload=()=>{ENIMG[t].ok=true};i.src=`assets/enemies/${t}.png`}
function drawEn(e,s,px,py){const f=Math.floor(G.t/.15)%s.n;x.save();x.translate(px+e.w/2,py+e.h);x.scale(e.dir>0?1:-1,1);if(e.hurt>0)x.globalAlpha=.6;x.drawImage(s.img,f*s.fw,0,s.fw,s.fh,-s.fw/2,-s.fh,s.fw,s.fh);x.restore()}
let TT,TB,SL;const mkI=s=>{const i=new Image();i.src='assets/'+s;return i};const TI={her:[mkI('tile_top.png'),mkI('tile_body.png'),mkI('slab.png')],me:[mkI('tile_top_me.png'),mkI('tile_body_me.png'),mkI('slab_me.png')]};
const BG=new Image(),GL=new Image();BG.src='assets/bg_forest.png';GL.src='assets/glasses.png';
function loadSprites(){for(const c in SPR)for(const a in SPR[c]){const s=SPR[c][a],i=new Image();i.onload=()=>{s.ok=i.naturalWidth>0};i.onerror=()=>{s.ok=false};i.src=s.src;s.img=i;}}
/* ====== INIMIGOS ====== */
const EN={slime:{hp:2,dmg:1,w:12,h:10,spd:40,sight:90,col:'#5c5'},wolf:{hp:3,dmg:1,w:20,h:12,spd:90,sight:140,col:'#999'},
 orc:{hp:5,dmg:2,w:14,h:22,spd:40,sight:100,col:'#585'},bat:{hp:2,dmg:1,w:12,h:8,spd:60,sight:130,fly:1,col:'#a5a'},
 archer:{hp:3,dmg:1,w:10,h:24,spd:40,sight:160,rng:1,keep:70,fire:1.6,col:'#ddd'},mage:{hp:3,dmg:1,w:10,h:24,spd:35,sight:160,rng:1,keep:80,fire:2,col:'#85f'}};
/* ====== FASES (dados). tiles: 1 sólido, 2 plataforma, 3 espinho ====== */
const LV={
 her:{w:80,sky:['#7ec8e8','#d6f0c8'],hill:['#4a9a5a','#2f7a45'],gaps:[[20,23],[44,49]],plats:[[12,7,4],[26,7,3],[33,6,4],[52,7,4],[58,6,3]],spikes:[[37,9],[38,9]],cp:[40,66],goal:77,mp:[[43,9,3,48,35]],dr:[[74,5,5,'a']],sw:[[60,5,'a']],
  ents:[['slime',10],['slime',28],['wolf',34],['bat',38],['wolf',56],['bat',60],['archer',66],['slime',62],['archer',72]],items:[['glasses',34,5],['gem',13,6],['gem',27,6],['gem',53,6],['gem',59,5]]},
 me:{w:90,sky:['#2a2050','#6a4a7a'],hill:['#3a2f5a','#241c40'],gaps:[[14,17],[28,33],[52,55],[64,71]],plats:[[10,7,3],[22,7,3],[29,6,4],[45,7,4],[60,7,3],[75,7,4]],spikes:[[40,9],[41,9],[42,9]],cp:[36,62],goal:87,mp:[[63,8,3,70,38]],dr:[[84,5,5,'b']],sw:[[61,6,'b']],
  ents:[['bat',18],['orc',24],['bat',30],['wolf',38],['mage',47],['archer',58],['orc',76],['slime',82],['mage',85]],items:[['glasses',30,5],['gem',11,6],['gem',23,6],['gem',46,6],['gem',60,6]]}};
function buildLevel(d){const g=[];for(let y=0;y<12;y++)g.push(new Array(d.w).fill(0));
 for(let i=0;i<d.w;i++){if(d.gaps.some(([a,b])=>i>=a&&i<=b))continue;g[10][i]=1;g[11][i]=1;}
 d.plats.forEach(([px,py,l])=>{for(let i=0;i<l;i++)g[py][px+i]=2});d.spikes.forEach(([sx,sy])=>g[sy][sx]=3);return g;}
/* ====== SAVE ====== */
const defSave=()=>({saveVersion:1,campaign:'her',done:{her:false,me:false},glasses:{her:false,me:false},cp:{her:0,me:0},set:{touch:'auto',op:.7,size:1}});
function loadSave(){try{const r=JSON.parse(localStorage.getItem(KEY));if(r&&r.saveVersion===1&&r.done&&r.glasses&&r.cp&&r.set&&CH[r.campaign])return r}catch(e){}return defSave()}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
let S=loadSave();
/* ====== ÁUDIO (Web Audio, sons gerados) ====== */
let AC;function sfx(f,d=.08,ty='square',v=.04){try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();const o=AC.createOscillator(),g=AC.createGain(),t=AC.currentTime;o.type=ty;o.frequency.value=f;g.gain.setValueAtTime(v*(S.set.sfx??1),t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(AC.destination);o.start();o.stop(t+d)}catch(e){}}
/* ====== ENTRADA (teclado + toque usam o mesmo estado) ====== */
const inp={l:0,r:0,jump:0,atk:0},edge={},HELD=['l','r','jump','atk'];
function setK(k,v){if(HELD.includes(k)){if(k==='jump'&&v&&!inp.jump)edge.jump=1;inp[k]=v?1:0}else if(v)edge[k]=1}
function releaseAll(){HELD.forEach(k=>inp[k]=0);document.querySelectorAll('#touch .dn').forEach(b=>b.classList.remove('dn'))}
const ACT={l:'Esquerda',r:'Direita',jump:'Pular',atk:'Atacar',swap:'Trocar arma',skill:'Habilidade',act:'Interagir'},DEF={l:'KeyA',r:'KeyD',jump:'Space',atk:'KeyJ',swap:'KeyQ',skill:'KeyK',act:'KeyE'};
function keymap(){const k=S.set.keys||{},m={ArrowLeft:'l',ArrowRight:'r'};for(const a in DEF)m[k[a]||DEF[a]]=a;return m}
let KM=keymap();
addEventListener('keydown',e=>{if(e.code==='Escape'){if(!e.repeat)UI.pause();return}const k=KM[e.code];if(!k)return;e.preventDefault();if(e.repeat)return;setK(e.shiftKey&&k==='skill'?'fire':k,1)});
addEventListener('keyup',e=>{const k=KM[e.code];if(k&&HELD.includes(k))setK(k,0)});
addEventListener('blur',releaseAll);document.addEventListener('visibilitychange',()=>{releaseAll();if(document.hidden)UI.pause(1)});
document.querySelectorAll('#touch button').forEach(b=>{const k=b.dataset.k;
 const up=()=>{b.classList.remove('dn');if(HELD.includes(k))setK(k,0)};
 b.addEventListener('pointerdown',e=>{e.preventDefault();try{b.setPointerCapture(e.pointerId)}catch(_){}b.classList.add('dn');if(k==='pause')UI.pause();else setK(k,1)});
 ['pointerup','pointercancel','lostpointercapture'].forEach(ev=>b.addEventListener(ev,up));b.addEventListener('contextmenu',e=>e.preventDefault())});
/* ====== ESTADO / UTIL ====== */
const G={scene:'menu',paused:false,cam:0,t:0};let shake=0,toastT;
const ov=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
const tile=(tx,ty)=>tx<0||tx>=G.d.w?1:(ty<0||ty>=12?0:G.grid[ty][tx]);
function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>e.classList.remove('on'),2200)}
function burst(px,py,c,n=8){for(let i=0;i<n&&G.pt.length<200;i++)G.pt.push({x:px,y:py,vx:(Math.random()-.5)*120,vy:(Math.random()-.8)*100,l:.4+Math.random()*.3,c})}
/* ====== FÍSICA: colisão por eixo, tiles ====== */
function moveBody(b,dt){b.onGround=false;b.hitWall=false;b.rideP=null;b.x+=b.vx*dt;
 let x0=Math.floor(b.x/T),x1=Math.floor((b.x+b.w-.01)/T),y0=Math.floor(b.y/T),y1=Math.floor((b.y+b.h-.01)/T);
 if(b.vx)for(let ty=y0;ty<=y1;ty++)for(let tx=x0;tx<=x1;tx++)if(tile(tx,ty)===1){b.x=b.vx>0?tx*T-b.w:(tx+1)*T;b.vx=0;b.hitWall=true}
 const pb=b.y+b.h;b.y+=b.vy*dt;
 x0=Math.floor(b.x/T);x1=Math.floor((b.x+b.w-.01)/T);y0=Math.floor(b.y/T);y1=Math.floor((b.y+b.h-.01)/T);
 for(let ty=y0;ty<=y1;ty++)for(let tx=x0;tx<=x1;tx++){const t=tile(tx,ty);
  if(t===1||(t===2&&b.vy>=0&&pb<=ty*T+1)){if(b.vy>0){b.y=ty*T-b.h;b.onGround=true;b.vy=0}else if(t===1&&b.vy<0){b.y=(ty+1)*T;b.vy=0}}}
 if(b.vy>=0&&G.mp)for(const m of G.mp)if(pb<=m.y+2&&b.y+b.h>=m.y&&b.x+b.w>m.x&&b.x<m.x+m.w){b.y=m.y-b.h;b.vy=0;b.onGround=true;b.rideP=m}}
/* ====== CRIAÇÃO DE FASE ====== */
function mkEn(t,tx,ty){const d=EN[t];return{t,...d,x:tx*T,y:(ty??(d.fly?4:9))*T,ox:tx*T,vx:0,vy:0,dir:-1,hurt:0,dead:0,cd:1,ph:Math.random()*6,state:'idle'}}
function startLevel(c){const d=LV[c];G.c=c;G.d=d;G.grid=buildLevel(d);const sx=S.cp[c]||2;
 G.p={x:sx*T,y:8*T,w:10,h:26,vx:0,vy:0,face:1,hp:CH[c].hp,en:100,wpn:0,cd:0,inv:0,swing:null,combo:0,ct:0,coy:0,jb:0,neo:S.glasses[c],tf:0,at:0,scd:0,el:c==='me'?'fire':'water',hurtT:0,anim:'idle'};
 G.respX=sx;G.doors=(d.dr||[]).map(([dx,dy,h,id])=>{for(let i=0;i<h;i++)G.grid[dy+i][dx]=1;return{x:dx,y:dy,h,id,open:0}});G.sw=(d.sw||[]).map(([sx2,sy,id])=>({x:sx2*T,y:sy*T,id,on:0}));G.talk=((CFG.talk&&CFG.talk[c])||[]).map(([a,b])=>({x:a,t:b,d:0}));G.mp=(d.mp||[]).map(([a,b,c,e,s])=>({x:a*T,y:b*T,w:c*T,h:6,min:a*T,max:e*T,vx:s,dx:0}));G.en=d.ents.map(([t,ex,ey])=>mkEn(t,ex,ey));
 G.items=d.items.filter(i=>!(i[0]==='glasses'&&S.glasses[c])).map(([t,ix,iy])=>({t,x:ix*T,y:iy*T,w:12,h:12}));
 G.pr=[];G.pt=[];G.gems=0;G.cps=d.cp.map(cx=>({x:cx,on:sx>=cx}));G.cam=0;G.scene='play';G.paused=false;G.t=0;G.done=false;toast(CFG.goals[c])}
/* ====== COMBATE ====== */
function attack(){const p=G.p,c=CH[G.c];
 if(p.wpn===0){p.combo=p.ct>0?(p.combo%3)+1:1;p.ct=.5;p.swing={t:0,hit:new Set(),n:p.combo};p.cd=c.cd;sfx(300+p.combo*80,.07,'sawtooth')}
 else{p.cd=.35;G.pr.push({x:p.x+p.w/2,y:p.y+5,vx:p.face*240,w:6,h:3,dmg:1,life:.8,c:'#ffe',type:'bullet'});sfx(700,.05,'square');burst(p.x+p.w/2+p.face*8,p.y+5,'#ff8',3)}}
function skill(type){const p=G.p;if(p.scd>0||p.en<20)return;p.en-=20;p.scd=.35;
 const f=type==='fire';p.el=type;G.pr.push({x:p.x+p.w/2,y:p.y+5,vx:p.face*(f?150:180),w:f?9:8,h:6,dmg:f?2:1,life:1,c:f?'#f84':'#4cf',type,burn:f});sfx(f?160:520,.15,f?'sawtooth':'sine',.06)}
function dmgEnemy(e,d,kx,burn,stun){if(e.dead)return;e.hp-=d;e.hurt=stun||.2;e.vx=kx;if(!e.fly)e.vy=-60;if(burn)e.burn=2;burst(e.x+e.w/2,e.y+e.h/2,e.col,6);sfx(200,.06,'square');
 if(e.hp<=0){e.dead=.5;G.gems++;burst(e.x+e.w/2,e.y+e.h/2,'#fff',12)}}
function hurtP(d,dir){const p=G.p;if(p.inv>0)return;p.hp-=d;p.inv=1;p.vx=dir*110;p.vy=-110;p.hurtT=.25;shake=3;sfx(120,.2,'sawtooth',.06);
 if(p.hp<=0){toast('Derrotado! Voltando ao checkpoint');respawn(1)}}
function respawn(full){const p=G.p;p.x=G.respX*T;p.y=8*T;p.vx=p.vy=0;p.inv=1.5;if(full)p.hp=CH[G.c].hp}
function interact(){const p=G.p;for(const s of G.sw)if(!s.on&&Math.abs(s.x-p.x)<22&&Math.abs(s.y-p.y)<32){s.on=1;for(const dr of G.doors)if(dr.id===s.id){dr.open=1;for(let i=0;i<dr.h;i++)G.grid[dr.y+i][dr.x]=0}sfx(500,.3,'triangle');toast('Porta aberta!');return}for(const it of G.items){if(it.t==='glasses'&&Math.abs(it.x-p.x)<26&&Math.abs(it.y-p.y)<26){it.got=1;S.glasses[G.c]=true;p.neo=true;p.tf=.9;persist();burst(p.x+5,p.y+5,'#fff',30);sfx(880,.4,'triangle',.06);toast('Óculos do Neo! +1 dano corpo a corpo, energia 2x');return}}}
function complete(){G.scene='story';music(0);const c=G.c;S.done[c]=true;if(c==='her'){S.campaign='me';S.cp.me=0}persist();sfx(660,.5,'triangle');
 pn(`<h2>${CFG.names[c]} — fase concluída</h2><p>Itens: ${G.gems}</p><p>${CFG.story[c+'_end']}</p>${bt(c==='her'?'Ir para a campanha 2':'Créditos','UI.next()')}`)}
/* ====== UPDATE ====== */
function update(dt){const p=G.p,c=CH[G.c],d=G.d;G.t+=dt;for(const m of G.mp){m.x+=m.vx*dt;m.dx=m.vx*dt;if(m.x>m.max){m.x=m.max;m.vx=-Math.abs(m.vx)}if(m.x<m.min){m.x=m.min;m.vx=Math.abs(m.vx)}}if(p.rideP)p.x+=p.rideP.dx;for(const t of G.talk)if(!t.d&&p.x>t.x*T){t.d=1;toast(t.t)}
 const ax=inp.r-inp.l,tgt=ax*c.spd,a=c.acc*(p.onGround?1:.65)*dt;
 if(p.hurtT>0)p.hurtT-=dt;else p.vx=p.vx<tgt?Math.min(tgt,p.vx+a):Math.max(tgt,p.vx-a);
 if(ax&&!p.swing)p.face=ax;
 p.coy=p.onGround?.1:p.coy-dt;if(edge.jump)p.jb=.1;p.jb-=dt;
 if(p.jb>0&&p.coy>0){p.vy=-c.jmp;p.coy=0;p.jb=0;sfx(440,.08)}
 if(!inp.jump&&p.vy<-90)p.vy=-90;
 p.vy=Math.min(400,p.vy+c.gr*dt);moveBody(p,dt);
 p.cd-=dt;p.inv-=dt;p.scd-=dt;p.ct-=dt;p.tf=Math.max(0,p.tf-dt);p.en=Math.min(100,p.en+(p.neo?16:8)*dt);
 if(edge.swap){p.wpn^=1;toast(p.wpn?'Pistola':c.melee)}
 if(inp.atk&&p.cd<=0&&!p.swing)attack();
 if(edge.skill)skill('water');if(edge.fire)skill('fire');if(edge.act)interact();
 if(p.swing){const s=p.swing;s.t+=dt;if(s.t>.04&&s.t<.16){const r=c.rng+(s.n===3?6:0),hb={x:p.face>0?p.x+p.w:p.x-r,y:p.y-1,w:r,h:p.h+2};
  for(const e of G.en)if(!e.dead&&!s.hit.has(e)&&ov(hb,e)){s.hit.add(e);dmgEnemy(e,c.dmg+(p.neo?1:0)+(s.n===3?1:0),p.face*90,p.el==='fire')}}
  if(s.t>.22)p.swing=null}
 for(const e of G.en){if(e.dead){e.dead-=dt;continue}
  if(e.burn>0){e.burn-=dt;e.bt=(e.bt||0)+dt;if(e.bt>.5){e.bt=0;dmgEnemy(e,1,0);if(e.dead)continue}burst(e.x+e.w/2,e.y,'#f84',1)}
  const dx=p.x-e.x,ad=Math.abs(dx),see=ad<e.sight&&Math.abs(p.y-e.y)<70;
  if(e.hurt>0){e.hurt-=dt;e.vx*=.92;e.state='hurt'}
  else if(e.fly){e.state=see?'chase':'patrol';if(see){e.dir=dx>0?1:-1;e.vx=e.dir*e.spd;e.vy=(p.y-e.y)*1.2}else{if(Math.abs(e.x-e.ox)>60)e.dir=e.x>e.ox?-1:1;e.vx=e.dir*e.spd*.5;e.vy=Math.sin(G.t*2+e.ph)*20}}
  else if(e.t==='slime'){if(see)e.dir=dx>0?1:-1;e.state=see?'chase':'patrol';e.cd-=dt;if(e.onGround){e.vx=0;if(e.cd<=0){e.vy=-130;e.vx=e.dir*e.spd*1.4;e.cd=1}}if(e.hitWall)e.dir*=-1}
  else if(see){e.dir=dx>0?1:-1;if(e.rng){e.state='attack';e.vx=ad<e.keep?-e.dir*e.spd:(ad>e.keep+40?e.dir*e.spd:0);e.cd-=dt;
    if(e.cd<=0){e.cd=e.fire;G.pr.push({x:e.x+e.w/2,y:e.y+4,vx:e.dir*130,w:6,h:4,dmg:1,hostile:1,life:2,c:e.t==='mage'?'#c6f':'#ddd'});sfx(260,.1)}}
   else{e.state='chase';e.vx=e.dir*e.spd}}
  else{e.state='patrol';e.vx=e.dir*e.spd*.4;if(e.hitWall)e.dir*=-1}
  if(e.fly){e.x+=e.vx*dt;e.y+=e.vy*dt}
  else{e.vy=Math.min(400,e.vy+700*dt);moveBody(e,dt);
   if(e.onGround&&e.state!=='hurt'&&e.t!=='slime'&&tile(Math.floor((e.x+(e.dir>0?e.w+2:-2))/T),Math.floor((e.y+e.h+2)/T))===0){e.vx=0;if(e.state==='patrol')e.dir*=-1}
   if(e.hitWall&&e.state==='patrol')e.dir*=-1;if(e.y>H+40)e.dead=.01}
  if(ov(e,p))hurtP(e.dmg,e.x<p.x?1:-1)}
 G.en=G.en.filter(e=>!(e.dead&&e.dead<=0));
 for(const q of G.pr){q.x+=q.vx*dt;q.life-=dt;if(tile(Math.floor(q.x/T),Math.floor(q.y/T))===1){q.life=0;burst(q.x,q.y,q.c,3)}
  if(q.hostile){if(ov(q,p)){hurtP(q.dmg,q.vx>0?1:-1);q.life=0}}
  else for(const e of G.en)if(!e.dead&&ov(q,e)){dmgEnemy(e,q.dmg,q.vx>0?(q.type==='water'?160:80):(q.type==='water'?-160:-80),q.burn,q.type==='water'?.6:.2);q.life=0;burst(q.x,q.y,q.c,8);break}
  if(Math.random()<.5&&(q.type==='fire'||q.type==='water'))burst(q.x,q.y,q.c,1)}
 G.pr=G.pr.filter(q=>q.life>0);
 for(const it of G.items){if(it.got)continue;if(it.t==='gem'&&ov(it,p)){it.got=1;G.gems++;sfx(900,.08,'triangle');burst(it.x+6,it.y+6,'#ff6',6)}
  if(it.t==='glasses'&&Math.abs(it.x-p.x)<26&&Math.abs(it.y-p.y)<26&&!G.hinted){G.hinted=1;toast('Pressione E para pegar os óculos')}}
 G.items=G.items.filter(i=>!i.got);
 if(tile(Math.floor((p.x+5)/T),Math.floor((p.y+p.h-1)/T))===3){hurtP(1,-p.face);p.vy=-150}
 if(p.y>H+30){p.hp--;if(p.hp<=0){respawn(1);toast('Derrotado! Voltando ao checkpoint')}else respawn(0)}
 for(const k of G.cps)if(!k.on&&Math.abs(p.x-k.x*T)<20){k.on=true;G.respX=k.x;S.cp[G.c]=k.x;persist();toast('Progresso salvo');sfx(600,.2,'triangle')}
 if(!G.done&&p.x>d.goal*T){G.done=true;complete()}
 for(const q of G.pt){q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=200*dt;q.l-=dt}G.pt=G.pt.filter(q=>q.l>0);
 const tc=p.x+p.w/2-W/2+p.face*20;G.cam+=(tc-G.cam)*Math.min(1,dt*6);G.cam=Math.max(0,Math.min(d.w*T-W,G.cam));shake=Math.max(0,shake-dt*10)}
/* ====== RENDER ====== */
function drawPlayer(p){const c=CH[G.c],sp=SPR[G.c];
 const an=p.hurtT>0?'hurt':p.swing?'attack':!p.onGround?(p.vy<0?'jump':'fall'):Math.abs(p.vx)>10?'run':'idle';
 if(an!==p.anim){p.anim=an;p.at=0}p.at+=1/60;const s=(p.neo&&sp['n'+an]&&sp['n'+an].ok)?sp['n'+an]:sp[an];
 if(p.inv>0&&Math.floor(G.t*20)%2)return;
 const fx=Math.round(p.x+p.w/2),fy=Math.round(p.y+p.h);
 if(s.ok){const f=s.loop?Math.floor(p.at/s.dur)%s.n:Math.min(s.n-1,Math.floor(p.at/s.dur));x.save();x.translate(fx,fy);x.scale(p.face*s.scale,s.scale);x.drawImage(s.img,f*s.fw,0,s.fw,s.fh,-s.ox,-s.oy,s.fw,s.fh);x.restore()}
 else{const px=Math.round(p.x),py=Math.round(p.y);if(p.neo){x.fillStyle='#111';x.fillRect(px-1,py+5,p.w+2,10)}
  x.fillStyle=c.col;x.fillRect(px,py+5,p.w,9);x.fillStyle='#f1c9a0';x.fillRect(px+1,py,8,6);
  if(p.neo){x.fillStyle='#000';x.fillRect(px+(p.face>0?3:1),py+2,6,2)}else{x.fillStyle='#000';x.fillRect(px+(p.face>0?6:3),py+2,1,2)}
  x.fillStyle='#fff';x.fillRect(px+(p.face>0?p.w:-3),py+8,3,1);x.fillStyle='#fff8';x.fillRect(px,py-4,p.w,1)}
 if(p.tf>0){x.fillStyle=`rgba(255,255,255,${p.tf})`;x.fillRect(Math.round(p.x)-3,Math.round(p.y)-3,16,20)}
 if(p.swing&&p.swing.t>.03&&p.swing.t<.18){x.strokeStyle=p.el==='fire'?'#fa3':'#6ff';x.lineWidth=3;x.beginPath();x.arc(p.x+p.w/2+p.face*8,p.y+7,c.rng*.6,p.face>0?-1.2:Math.PI-1.2+2.4*0,p.face>0?1.2:Math.PI+1.2);x.stroke()}}
function render(){x.imageSmoothingEnabled=false;[TT,TB,SL]=TI[G.c]||TI.her;const d=G.d||LV.her,g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,d.sky[0]);g.addColorStop(1,d.sky[1]);x.fillStyle=g;x.fillRect(0,0,W,H);
 const cam=Math.round(G.cam||0);const useBG=G.c==='her'&&BG.complete&&BG.naturalWidth;if(useBG){x.drawImage(BG,-Math.round((G.cam||0)/Math.max(1,d.w*T-W)*(BG.naturalWidth-W)),0);if(G.c==='me'){x.fillStyle='rgba(30,10,70,.6)';x.fillRect(0,0,W,H)}}else [[.2,d.hill[0],110,40],[.5,d.hill[1],140,30]].forEach(([f,col,b,a])=>{x.fillStyle=col;x.beginPath();x.moveTo(0,H);for(let i=0;i<=W;i+=8)x.lineTo(i,b-Math.abs(Math.sin((i+cam*f)/(40+f*60)))*a);x.lineTo(W,H);x.fill()});
 if(G.scene==='final'){drawFinal();return}if(G.c==='me'&&G.grid)ruins(cam);if(!G.p||G.scene==='menu'&&!G.grid)return;
 x.save();x.translate(-cam+Math.round((Math.random()-.5)*shake),0);const gc=G.c==='her'?['#5d6b55','#4f8a3a']:['#4a4458','#7a6f90'];
 for(let tx=Math.floor(cam/T);tx<=Math.floor(cam/T)+21;tx++)for(let ty=0;ty<12;ty++){const t=tile(tx,ty);if(!t||tx>=d.w)continue;const px=tx*T,py=ty*T;
  if(t===1&&(tile(tx,ty-1)!==1?TT:TB).naturalWidth){x.drawImage(tile(tx,ty-1)!==1?TT:TB,px,py)}else if(t===2&&SL.naturalWidth){x.drawImage(SL,px,py)}else if(t===1){x.fillStyle=gc[0];x.fillRect(px,py,T,T);if(tile(tx,ty-1)!==1){x.fillStyle=gc[1];x.fillRect(px,py,T,4)}}
  else if(t===2){x.fillStyle=gc[0];x.fillRect(px,py,T,5);x.fillStyle=gc[1];x.fillRect(px,py,T,2)}
  else{x.fillStyle='#ddd';for(let i=0;i<3;i++){x.beginPath();x.moveTo(px+i*5+1,py+T);x.lineTo(px+i*5+4,py+6);x.lineTo(px+i*5+7,py+T);x.fill()}}}
 for(const m of G.mp)for(let i=0;i<m.w/T;i++){if(SL.naturalWidth)x.drawImage(SL,Math.round(m.x+i*T),Math.round(m.y)-1);else{x.fillStyle='#775';x.fillRect(Math.round(m.x+i*T),Math.round(m.y),T,6)}}
 for(const dr of G.doors)if(!dr.open){x.fillStyle='#6b4a2f';x.fillRect(dr.x*T,dr.y*T,T,dr.h*T);x.fillStyle='#c9a15a';for(let i=0;i<dr.h;i++)x.fillRect(dr.x*T+2,(dr.y+i)*T+3,12,2)}
 for(const s of G.sw){x.fillStyle='#432';x.fillRect(s.x+2,s.y+12,12,4);x.fillStyle=s.on?'#4f4':'#f55';x.fillRect(s.x+7,s.y+(s.on?8:4),3,8)}
 for(const k of G.cps){x.fillStyle='#543';x.fillRect(k.x*T+6,9*T-18,2,18);x.fillStyle=k.on?'#4f4':'#f55';x.fillRect(k.x*T+8,9*T-18,8,6)}
 const gx=d.goal*T;x.fillStyle=`hsl(${(G.t*120)%360},80%,65%)`;x.fillRect(gx,8*T-8,12,40);x.fillStyle='#fff6';x.fillRect(gx+3,8*T-4,6,32);
 for(const it of G.items){const by=it.y+Math.sin(G.t*4)*2;if(it.t==='gem'){x.fillStyle='#ff6';x.fillRect(it.x+3,by+3,6,6)}else if(GL.complete&&GL.naturalWidth)x.drawImage(GL,Math.round(it.x-4),Math.round(by),20,GL.naturalHeight);else{x.fillStyle='#000';x.fillRect(it.x,by+3,12,4)}}
 for(const e of G.en){const px=Math.round(e.x),py=Math.round(e.y);if(e.dead&&Math.floor(G.t*30)%2)continue;const es=ENIMG[e.t];if(es&&es.ok)drawEn(e,es,px,py);else{x.fillStyle=e.hurt>0?'#fff':e.col;x.fillRect(px,py,e.w,e.h);x.fillStyle='#000';x.fillRect(px+(e.dir>0?e.w-4:2),py+2,2,2)}
  if(e.burn>0){x.fillStyle='#f84';x.fillRect(px+2,py-3,e.w-4,3)}if(e.hp>0&&e.hp<EN[e.t].hp){x.fillStyle='#f33';x.fillRect(px,py-5,e.w*e.hp/EN[e.t].hp,2)}}
 drawPlayer(G.p);
 for(const q of G.pr){const im=q.type==='water'?FXW:q.type==='fire'?FXF:null;if(im&&im.complete&&im.naturalWidth){x.save();x.translate(Math.round(q.x+q.w/2),Math.round(q.y+q.h/2));if(q.vx<0)x.scale(-1,1);x.drawImage(im,-im.naturalWidth/2,-im.naturalHeight/2);x.restore()}else{x.fillStyle=q.c;x.fillRect(Math.round(q.x),Math.round(q.y),q.w,q.h)}}
 for(const q of G.pt){x.fillStyle=q.c;x.fillRect(Math.round(q.x),Math.round(q.y),2,2)}
 x.restore();hud()}
function hud(){const p=G.p,c=CH[G.c];for(let i=0;i<c.hp;i++){x.fillStyle=i<p.hp?'#e33':'#411';x.fillRect(6+i*10,6,8,8)}
 x.fillStyle='#000a';x.fillRect(5,17,52,6);x.fillStyle='#4cf';x.fillRect(6,18,50*p.en/100,4);
 x.fillStyle='#fff';x.font='bold 8px monospace';tx(p.wpn?'Pistola':c.melee,6,34);tx('Itens '+G.gems+(p.neo?'  Neo':''),6,44);
 tx(CFG.names[G.c],W-6-x.measureText(CFG.names[G.c]).width,12)}
/* ====== INTERFACE ====== */
const bt=(l,f)=>`<button class="bt" onclick="${f}">${l}</button>`;
function pn(h){const o=$('#ov');o.innerHTML=`<div class="pn">${h}</div>`;o.style.display='flex';const b=o.querySelector('.bt');if(b)b.focus()}
function hide(){$('#ov').style.display='none'}
const CTRL='<ul><li>A/D ou setas: mover · Espaço: pular</li><li>J: atacar · Q: trocar arma</li><li>K: água · Shift+K: fogo</li><li>E: interagir · Esc: pausar</li></ul>';
const UI={
 menu(){G.scene='menu';G.paused=false;music(0);const has=localStorage.getItem(KEY);
  pn(`<h1>${CFG.title}</h1><p>${CFG.story.intro}</p>${has?bt('Continuar',"UI.go(S.campaign,1)"):''}${bt('Novo jogo',"UI.fresh()")}${bt('Campanha: '+CFG.names.her,"UI.go('her')")}${bt('Campanha: '+CFG.names.me,"UI.go('me')")}${bt('Controles',"UI.ctrl()")}${bt('Configurações',"UI.cfg()")}${bt('Teste de sprites',"UI.sprites()")}${bt('Apagar progresso',"UI.wipe()")}`)},
 go(c,keep){if(!keep){S.cp[c]=0}S.campaign=c;persist();hide();startLevel(c);music(1)},
 fresh(){S=defSave();persist();UI.go('her')},
 ctrl(){pn(`<h2>Controles</h2>${CTRL}<p>No celular, use os botões na tela.</p>${bt('Alterar teclas','UI.keys()')}${bt('Voltar',G.scene==='play'?'UI.pause()':'UI.menu()')}`)},
 cfg(){const s=S.set;pn(`<h2>Configurações</h2><label>Controles touch <select onchange="S.set.touch=this.value;persist();applyTouch()">${['auto','on','off'].map(v=>`<option ${s.touch===v?'selected':''}>${v}</option>`).join('')}</select></label><label>Opacidade <input type="range" min=".3" max="1" step=".1" value="${s.op}" oninput="S.set.op=+this.value;persist();applyTouch()"></label><label>Tamanho <input type="range" min=".8" max="1.4" step=".1" value="${s.size}" oninput="S.set.size=+this.value;persist();applyTouch()"></label><label>Música <input type='range' min='0' max='1' step='.1' value='${s.mus??.5}' oninput='S.set.mus=+this.value;persist();music(G.scene==="play"&&!G.paused)'></label><label>Efeitos <input type='range' min='0' max='1' step='.1' value='${s.sfx??1}' oninput='S.set.sfx=+this.value;persist()'></label>${bt('Voltar',G.scene==='play'?'UI.pause()':'UI.menu()')}`)},
 sprites(){const o=a=>a.map(v=>`<option>${v}</option>`).join('');pn(`<h2>Teste de sprites</h2><canvas id='tc' width='160' height='96' style='width:100%;image-rendering:pixelated'></canvas><label>Personagem <select id='tcc'>${o(['her','me'])}</select></label><label>Animação <select id='tca'>${o(ANIMS)}</select></label><label>Escala <input id='tcs' type='range' min='1' max='4' value='2'></label><p>Verde = hitbox 10x26. Ajuste fw/fh/n/dur/ox/oy em spritecfg.js.</p>${bt('Voltar','UI.menu()')}`);testLoop()},
 keys(){const k=S.set.keys||{};pn(`<h2>Teclas</h2>${Object.keys(ACT).map(a=>bt(ACT[a]+': '+(k[a]||DEF[a]),`UI.bind('${a}')`)).join('')}${bt('Restaurar padrão',"S.set.keys={};persist();KM=keymap();UI.keys()")}${bt('Voltar','UI.ctrl()')}`)},
 bind(a){toast('Pressione a nova tecla (Esc cancela)');addEventListener('keydown',e=>{e.preventDefault();e.stopImmediatePropagation();if(e.code!=='Escape'){S.set.keys=S.set.keys||{};S.set.keys[a]=e.code;persist();KM=keymap()}UI.keys()},{once:true,capture:true})},
 wipe(){if(confirm('Apagar todo o progresso?')){localStorage.removeItem(KEY);S=defSave();UI.menu()}},
 pause(auto){if(G.scene!=='play')return;if(G.paused&&!auto){G.paused=false;hide();music(1);return}if(auto&&G.paused)return;G.paused=true;releaseAll();music(0);
  pn(`<h2>Pausado</h2>${bt('Retomar','UI.pause()')}${bt('Reiniciar fase',"UI.go(G.c,1)")}${bt('Controles','UI.ctrl()')}${bt('Configurações','UI.cfg()')}${bt('Menu principal','UI.menu()')}`)},
 next(){hide();if(G.c==='her')UI.go('me');else final()}};
function applyTouch(){const s=S.set,show=s.touch==='on'||(s.touch==='auto'&&matchMedia('(pointer:coarse)').matches);$('#touch').style.display=show?'block':'none';document.body.classList.toggle('touch',show);
 document.documentElement.style.setProperty('--op',s.op);document.documentElement.style.setProperty('--sz',s.size)}
function fit(){let s=Math.min(innerWidth/W,innerHeight/H);if(s>=2)s=Math.floor(s);cv.style.width=W*s+'px';cv.style.height=H*s+'px'}
addEventListener('resize',fit);addEventListener('orientationchange',()=>{fit();releaseAll()});
/* ====== LOOP ====== */
let last=0;function loop(ts){const dt=Math.min(.033,(ts-last)/1000||0);last=ts;
 try{if(G.scene==='play'&&!G.paused)update(dt);if(G.scene==='final'){G.fin.t+=dt;if(G.fin.t>6&&!G.fin.done){G.fin.done=1;pn(`<h1>Fim</h1><p>${CFG.story.me_end}</p><p>Obrigado por jogar ${CFG.title}.</p>${bt('Menu','UI.menu()')}`)}}render()}catch(e){console.error(e)}
 for(const k in edge)delete edge[k];requestAnimationFrame(loop)}
/* ====== TESTE INTERNO: __game.selfTest() no console ====== */
function selfTest(){const r=[];startLevel('her');const p=G.p;p.y=0;for(let i=0;i<180;i++){p.vy+=12;moveBody(p,1/60)}
 r.push(['pouso no chão',p.onGround&&Math.abs(p.y+p.h-10*T)<1]);const e=mkEn('slime',5),h=e.hp;dmgEnemy(e,1,0);r.push(['dano em inimigo',e.hp===h-1]);
 r.push(['save válido',loadSave().saveVersion===1]);G.scene='menu';console.table(r);return r}
window.__game={G,S:()=>S,selfTest};
loadSprites();applyTouch();fit();UI.menu();requestAnimationFrame(loop);

function tx(s,a,b){x.lineWidth=2;x.strokeStyle='#000';x.strokeText(s,a,b);x.fillText(s,a,b)}

var musT,mi=0;const SC={her:[261,329,392,329,293,349,440,349],me:[220,262,330,262,196,247,294,247]};
function music(on){clearInterval(musT);if(!on||!(S.set.mus??.5))return;musT=setInterval(()=>{const n=SC[G.c]||SC.her,m=S.set.mus??.5;sfx(n[mi%8],.18,'triangle',.05*m);if(mi%8===0)sfx(n[0]/2,.6,'sine',.07*m);mi++},230)}
function testLoop(){const c=$('#tc');if(!c)return;const t=c.getContext('2d');t.imageSmoothingEnabled=false;t.fillStyle='#335';t.fillRect(0,0,160,96);const sc=+$('#tcs').value,s=SPR[$('#tcc').value][$('#tca').value];
 if(s.ok){const f=Math.floor(performance.now()/1000/s.dur)%s.n;t.drawImage(s.img,f*s.fw,0,s.fw,s.fh,80-s.ox*sc,80-s.oy*sc,s.fw*sc,s.fh*sc)}else{t.fillStyle='#fff';t.font='8px monospace';t.fillText('sem arte: '+s.src,4,12)}
 t.strokeStyle='#0f0';t.strokeRect(80-5*sc,80-26*sc,10*sc,26*sc);requestAnimationFrame(testLoop)}

function ruins(cam){x.fillStyle='#e8e0c0';x.beginPath();x.arc(262,34,14,0,7);x.fill();x.fillStyle='#fff';for(let i=0;i<30;i++)x.fillRect((i*97)%W,(i*53)%80,1,1);
 [[.15,'#2c2450',60],[.35,'#1c1636',85]].forEach(([f,c,hb])=>{x.fillStyle=c;const o=cam*f;for(let i=0;i<8;i++){const n=Math.floor(o/64)+i,px=i*64-(o%64),k=(n*7+3)%5,ch=hb+k*9;x.fillRect(px+22,H-ch,12,ch);x.fillRect(px+19,H-ch,18,4);if(k%2===0)x.fillRect(px+22,H-ch-6,66,6);if(k===3)x.fillRect(px+8,H-ch+30,40,3)}})}
function final(){G.scene='final';G.fin={t:0,done:0};G.c='her';music(1)}
function drawFinal(){const t=G.fin.t,k=Math.min(1,t/4);x.imageSmoothingEnabled=false;if(BG.naturalWidth)x.drawImage(BG,-12,0);else{x.fillStyle='#7ec8e8';x.fillRect(0,0,W,H)}
 for(let i=0;i<20;i++){x.drawImage(TI.her[0],i*16,160);x.drawImage(TI.her[1],i*16,176)}
 [['her',24+k*112,1],['me',296-k*112,-1]].forEach(([c,px,dir])=>{const s=(S.glasses[c]&&SPR[c].nrun.ok)?SPR[c].nrun:SPR[c].run;if(!s.ok){x.fillStyle=CH[c].col;x.fillRect(px-5,134,10,26);return}
  const f=k<1?Math.floor(t/s.dur)%s.n:0;x.save();x.translate(px,160);x.scale(dir,1);x.drawImage(s.img,f*s.fw,0,s.fw,s.fh,-s.ox,-s.oy,s.fw,s.fh);x.restore()});
 if(k>=1){x.fillStyle='#f55';x.font='bold 14px monospace';for(let i=0;i<4;i++)tx('♥',148+i*8+Math.sin(t*3+i)*5,118-((t*20+i*13)%48))}}
