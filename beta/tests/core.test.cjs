const {test} = require('node:test');
const assert = require('node:assert/strict');
const HK = require('../core.js');
test('migrates v1 campaign without losing heroes, scenes, or journal',()=>{
  const old={name:'Family',heroes:[{id:'h',player:'Kid',name:'Knight',hp:2,maxHp:3,active:true,melee:2}],enemies:[],adventures:[{id:'a',title:'Book',scenes:[{name:'Cave',notes:'Secret'}]}],journal:[{title:'Session',body:'Treasure'}],encounter:{name:'Battle',round:2,turn:'Monsters',foes:[],log:[]}};
  const next=HK.backup({app:'hero-kids-gm',version:1,data:old});assert.equal(next.heroes[0].hp,2);assert.equal(next.adventures[0].scenes[0].notes,'Secret');assert.equal(next.journal[0].body,'Treasure');assert.equal(next.encounter.round,2);assert.equal(next.schema,2);
});
test('rejects incomplete and future backups before replacement',()=>{
  assert.throws(()=>HK.backup({app:'hero-kids-gm',data:{heroes:[]}}));assert.throws(()=>HK.backup({app:'other',data:HK.blank()}));assert.throws(()=>HK.backup({app:'hero-kids-gm',version:99,data:HK.blank()}));
});
test('clamps health/stats and normalizes one active hero per player',()=>{
  const data=HK.blank();data.heroes=[HK.character({name:'A',player:' Kid ',active:true,hp:100,maxHp:3,melee:100},true),HK.character({name:'B',player:'kid',active:true,maxHp:3},true)];const next=HK.normalize(data);assert.equal(next.heroes[0].hp,3);assert.equal(next.heroes[0].melee,10);assert.equal(next.heroes.filter(h=>h.active).length,1);
});
test('player projection contains no GM notes, journal, or player identity',()=>{
  const data=HK.blank();data.heroes=[HK.character({name:'Public hero',player:'Private player',active:true,maxHp:3,notes:'PRIVATE HERO'},true)];data.enemies=[HK.character({name:'Secret upcoming enemy',maxHp:1})];data.encounter.note='PRIVATE SCENE';data.journal=[{body:'PRIVATE JOURNAL'}];data.adventures=[{notes:'PRIVATE ADVENTURE'}];const projection=JSON.stringify(HK.project(data));assert.match(projection,/Public hero/);assert.doesNotMatch(projection,/PRIVATE|Private player|Secret upcoming enemy|notes|journal|adventures/);
});
test('display switches hide selected information',()=>{
  const data=HK.blank();data.heroes=[HK.character({name:'Knight',active:true},true)];data.encounter.foes=[HK.character({name:'Foe'})];data.dice={attack:[6],defense:[1]};Object.assign(data.display,{showParty:false,showEnemies:false,showRound:false,showDice:false});const out=HK.project(data);assert.deepEqual(out.heroes,[]);assert.deepEqual(out.enemies,[]);assert.equal(out.dice,null);assert.equal(out.showRound,false);
});
test('highest dice determine hit, attacker wins tie, physical values are validated',()=>{
  assert.equal(HK.compare([1,5],[4,4,4]),true);assert.equal(HK.compare([4],[4]),true);assert.equal(HK.compare([3],[6]),false);assert.throws(()=>HK.compare([0],[1]));assert.throws(()=>HK.compare([2.5],[1]));assert.throws(()=>HK.compare([],[1]));for(const n of HK.roll(20))assert.ok(n>=1&&n<=6);
});
