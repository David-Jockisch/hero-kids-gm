'use strict';
const display = document.querySelector('#display'), status = document.querySelector('#displayStatus');
const escapeHtml = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const params = new URLSearchParams(location.hash.slice(1));
const values = data => (Array.isArray(data)?data:Object.values(data||{})).slice(0,200);
document.body.classList.toggle('stage',new URLSearchParams(location.search).get('mode')==='stage');
let lastUpdate = 0, previous = '', received = false;
function show(data) {
  if(!data || data.version!==1) return;
  lastUpdate=Date.now(); received=true;
  status.textContent='';
  document.body.classList.toggle('blank',Boolean(data.hidden));
  const signature=JSON.stringify(data);if(signature===previous)return;previous=signature;
  const card = x => `<article class="display-card ${x.hp===0?'knocked-out':''}"><small>${escapeHtml(x.role)}</small><h3>${escapeHtml(x.name)}</h3><div class="health" aria-label="${Number(x.hp)||0} health">${Array.from({length:Math.min(30,Math.max(1,Number(x.maxHp)||1))},(_,i)=>`<i class="${i<x.hp?'on':''}"></i>`).join('')}</div><span class="hp-number">${Number(x.hp)||0} / ${Number(x.maxHp)||1} HP</span>${x.hp===0?'<div class="condition">Knocked out</div>':''}${x.condition?`<div class="condition">${escapeHtml(x.condition)}</div>`:''}</article>`;
  const dice = data.dice, freshDice = dice&&Date.now()-dice.at<60000;
  display.innerHTML=`<header class="table-heading"><div class="table-title"><small>${escapeHtml(data.campaign)}</small><h1>${escapeHtml(data.encounter)}</h1></div>${data.showRound?`<div class="round"><strong>${Number(data.round)||1}</strong><span>ROUND<br>${escapeHtml(data.turn)}’ turn</span></div>`:''}</header>${data.announcement?`<div class="announcement">${escapeHtml(data.announcement)}</div>`:''}${freshDice?`<div class="result"><small>${escapeHtml(dice.label)}</small><div class="dice">${values(dice.attack).slice(0,20).map(n=>`<span class="die">${Number(n)||1}</span>`).join('')}<span class="dice-divider"></span>${values(dice.defense).slice(0,20).map(n=>`<span class="die">${Number(n)||1}</span>`).join('')}</div><strong>${escapeHtml(dice.result)}</strong></div>`:''}<div class="enemies">${values(data.enemies).map(card).join('')}</div><div class="table-party">${values(data.heroes).map(card).join('')}</div>`;
}
let latest;
function receive(data) {latest=data;show(data);}
setInterval(()=>{if(latest?.dice&&Date.now()-latest.dice.at>60000){latest={...latest,dice:null};show(latest);}if(received&&Date.now()-lastUpdate>45000)status.textContent='Waiting for updates · last table state shown';},5000);
if(location.hash==='#preview') {
  try{const channel=new BroadcastChannel('hero-kids-display-v2');channel.onmessage=e=>{if(e.data?.type==='snapshot')receive(e.data.data);};channel.postMessage({type:'request'});setInterval(()=>channel.postMessage({type:'request'}),10000);}catch{status.textContent='This browser does not support the local preview. Use the Firebase display link.';}
} else if(params.get('owner')&&params.get('room')) {
  import('./table-link.mjs').then(async module=>{await module.watchDisplay(params.get('owner'),params.get('room'),receive,message=>status.textContent=message);}).catch(()=>status.textContent='Unable to connect. Check the internet connection and refresh this OBS source.');
} else {status.textContent='Open a display link from the GM app’s Player display screen.';}
