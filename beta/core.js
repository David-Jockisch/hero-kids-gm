(function (root) {
  'use strict';
  const text = (v, max = 2000) => typeof v === 'string' ? v.slice(0, max) : '';
  const integer = (v, min = 0, max = 99, fallback = min) => Number.isFinite(Number(v)) ? Math.max(min, Math.min(max, Math.trunc(Number(v)))) : fallback;
  const id = () => globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now().toString(36);
  const list = (v, limit = 200) => Array.isArray(v) ? v.slice(0, limit) : [];
  const blankEncounter = () => ({id:id(), name:'A new encounter', round:1, turn:'Heroes', foes:[], log:[], note:''});
  const blank = () => ({schema:2, name:'Our Family Adventure', heroes:[], enemies:[], adventures:[], journal:[], encounter:blankEncounter(), dice:null, display:{showParty:true, showEnemies:true, showRound:true, showDice:true, announcement:'', hidden:false}});
  function character(v, hero = false) {
    if (!v || typeof v !== 'object') throw Error('A character record is invalid.');
    const maxHp = integer(v.maxHp, 1, 30, 3);
    const c = {id:text(v.id, 80) || id(), name:text(v.name, 100) || 'Unnamed adventurer', role:text(v.role, 80), maxHp, hp:integer(v.hp ?? maxHp, 0, maxHp), notes:text(v.notes, 10000), condition:text(v.condition, 80), color:['sage','ochre','blue','rose','violet'].includes(v.color) ? v.color : 'sage'};
    for (const key of ['melee','ranged','magic','defense']) c[key] = integer(v[key], 0, 10);
    if (hero) {c.player = text(v.player, 80); c.active = Boolean(v.active);}
    return c;
  }
  function normalize(v) {
    if (!v || typeof v !== 'object' || !Array.isArray(v.heroes) || !Array.isArray(v.enemies) || !Array.isArray(v.adventures) || !Array.isArray(v.journal) || !v.encounter || !Array.isArray(v.encounter.foes)) throw Error('This is not a complete Hero Kids campaign. Your current campaign has not been replaced.');
    if (v.schema && v.schema > 2) throw Error('This backup needs a newer version of the app.');
    const base = blank(), e = v.encounter;
    base.name = text(v.name, 100) || base.name;
    base.heroes = list(v.heroes).map(x => character(x, true));
    const activePlayers = new Set();
    for (const h of base.heroes) {const p = h.player.trim().toLowerCase(); if (h.active && activePlayers.has(p)) h.active = false; if (h.active) activePlayers.add(p);}
    base.enemies = list(v.enemies).map(x => character(x));
    base.adventures = list(v.adventures, 100).map(a => ({id:text(a.id,80)||id(), title:text(a.title,150)||'Untitled adventure', notes:text(a.notes,30000), status:['Not started','In progress','Completed'].includes(a.status)?a.status:'Not started', scenes:list(a.scenes).map(s=>({id:text(s.id,80)||id(),name:text(s.name,150)||'Untitled scene',notes:text(s.notes,30000)}))}));
    base.journal = list(v.journal,1000).map(j=>({id:text(j.id,80)||id(),title:text(j.title,150),body:text(j.body,30000),date:text(j.date,100)}));
    base.encounter = {id:text(e.id,80)||id(),name:text(e.name,150)||'A new encounter',round:integer(e.round,1,999),turn:e.turn==='Monsters'?'Monsters':'Heroes',note:text(e.note,30000),foes:list(e.foes,100).map(x=>character(x)),log:list(e.log,100).filter(x=>x&&typeof x==='object').map(x=>({id:text(x.id,80)||id(),message:text(x.message,300),time:text(x.time,40)}))};
    const d = v.display || {};
    base.display = {showParty:d.showParty!==false,showEnemies:d.showEnemies!==false,showRound:d.showRound!==false,showDice:d.showDice!==false,announcement:text(d.announcement,200),hidden:Boolean(d.hidden)};
    if (v.dice && typeof v.dice === 'object') base.dice = {label:text(v.dice.label,100),attack:list(v.dice.attack,20).map(x=>integer(x,1,6)),defense:list(v.dice.defense,20).map(x=>integer(x,1,6)),result:text(v.dice.result,100),at:integer(v.dice.at,0,Number.MAX_SAFE_INTEGER)};
    return base;
  }
  function backup(value) {
    if (value?.app !== 'hero-kids-gm') throw Error('Choose a Hero Kids backup file.');
    if (value.version > 2) throw Error('This backup needs a newer version of the app.');
    return normalize(value.data);
  }
  function project(db) {
    const card = x => ({id:x.id,name:x.name,role:x.role,hp:x.hp,maxHp:x.maxHp,condition:x.condition,color:x.color});
    return {version:1,campaign:db.name,encounter:db.encounter.name,round:db.encounter.round,turn:db.encounter.turn,heroes:db.display.showParty?db.heroes.filter(h=>h.active).map(card):[],enemies:db.display.showEnemies?db.encounter.foes.map(card):[],showRound:db.display.showRound,dice:db.display.showDice?db.dice:null,announcement:db.display.announcement,hidden:db.display.hidden};
  }
  const roll = count => Array.from({length:integer(count,1,20)},()=>Math.floor(Math.random()*6)+1);
  const compare = (attack, defense) => {
    if (![attack,defense].every(x=>Array.isArray(x)&&x.length&&x.every(n=>Number.isInteger(n)&&n>=1&&n<=6))) throw Error('Enter a highest die from 1 to 6 for both sides.');
    return Math.max(...attack) >= Math.max(...defense);
  };
  const api = {id,text,integer,blankEncounter,blank,character,normalize,backup,project,roll,compare};
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.HK = api;
})(typeof window === 'undefined' ? globalThis : window);
