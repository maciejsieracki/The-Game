/**
 * Diagnostyka balansu POLE-BITWY — maciej_playtest (50 vs 25).
 * Symuluje: obrażenia TW, morale per salwa, cascade rout.
 */
const fs = require('fs');
const path = require('path');

const unitsPath = path.join(__dirname, '../data/units.json');
const paramsPath = path.join(__dirname, '../data/combat-params.json');
const units = JSON.parse(fs.readFileSync(unitsPath, 'utf8'));
const params = JSON.parse(fs.readFileSync(paramsPath, 'utf8'));
const TW = params.tw_v3;

function find(name) {
  return units.find(u => u.Jednostka === name);
}

function norm(v, fb) {
  if (v == null || v === '' || v === '—' || v === '---') return fb;
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : fb;
}

function hitChanceTw(atk, def, bonus = 0) {
  const raw = TW.hit_base + atk - def + bonus;
  return Math.max(TW.hit_min, Math.min(TW.hit_max, raw));
}

function rangeDamageTw(missile, armor) {
  return Math.max(1, missile - armor);
}

function moraleLossFromHit(dmg, maxHp) {
  return 100 * (dmg / Math.max(1, maxHp));
}

const luc = find('Łucznik');
const has = find('Hastati');
const fal = find('Falanga');

console.log('=== units.json TW stats ===');
for (const [label, u] of [['Lucznik', luc], ['Hastati', has], ['Falanga', fal]]) {
  if (!u) { console.log(label, 'NOT FOUND'); continue; }
  console.log(label, {
    health: u.health,
    missileAttack: u.missileAttack,
    meleeAttack: u.meleeAttack,
    meleeDefence: u.meleeDefence,
    armor: u.armor,
    pociski: u['Ilość pocisków'],
    moraleBaz: u['Morale bazowe'],
    flee: u['Morale ucieczki'],
    legacyAtakDyst: u['Atak dystansowy'],
  });
}

const lucMiss = norm(luc.missileAttack, 0);
const lucMelee = norm(luc.meleeAttack, 0);
const hasArmor = norm(has.armor, 0);
const hasDef = norm(has.meleeDefence, 0);
const hasHp = norm(has.health, 30);
const hasMorale = norm(has['Morale bazowe'], 100);
const hasFlee = norm(has['Morale ucieczki'], 25);

const dmgPerHit = rangeDamageTw(lucMiss, hasArmor);
const hitPct = hitChanceTw(lucMelee, hasDef);
const morPerHit = moraleLossFromHit(dmgPerHit, hasHp);
const hitsToRout = Math.ceil((hasMorale - hasFlee) / morPerHit);

console.log('\n=== Lucznik -> Hastati (1 strzał) ===');
console.log({ dmgPerHit, hitPct: hitPct + '%', morPerHit: morPerHit.toFixed(2), hitsToRoutOneUnit: hitsToRout });

// Salwa: N łuczników, każdy 1 strzał, focus fire na 1 cel (front line)
function salvoSim(nArchers, targetMorale, targetFlee, targetMaxHp, seed) {
  let morale = targetMorale;
  let hp = targetMaxHp;
  let hits = 0;
  let routs = 0;
  // deterministic expected value
  const expectedHits = nArchers * (hitPct / 100);
  const totalDmg = Math.round(expectedHits * dmgPerHit);
  hp -= totalDmg;
  const morLoss = nArchers * (hitPct / 100) * morPerHit;
  morale -= morLoss;
  if (morale <= targetFlee) routs = 1;
  return { expectedHits: expectedHits.toFixed(1), totalDmg, moraleLeft: morale.toFixed(1), routs };
}

console.log('\n=== Salwa (focus fire, expected value) ===');
for (const n of [5, 10, 20]) {
  const r = salvoSim(n, hasMorale, hasFlee, hasHp, 0);
  console.log(n + ' łuczników vs 1 Hastati:', r);
}

// Army morale: 50 units attacker, rout cascade
// Simplified: if 10 units rout (morale 0), army ratio
const atkUnits = 50;
const atkMoraleStart = 20 * norm(has['Morale bazowe'], 85) + 20 * norm(luc['Morale bazowe'], 40) + 10 * 50; // konnica ~50?
const rout10 = 10;
const ratioAfter10Rout = (atkMoraleStart - rout10 * 40) / atkMoraleStart; // rough
console.log('\n=== Army morale (uproszczone) ===');
console.log('Próg porażki armii: 25%');
console.log('Jeśli 10 jednostek ucieknie (morale 0), ratio ~', (ratioAfter10Rout * 100).toFixed(0) + '%');

// Monte Carlo: 10 defender archers, 1 turn, random hits on front hastati
console.log('\n=== Monte Carlo: 10 def łuczników, 20 celów Hastati, 1 tura ===');
let totalRouts = 0;
let totalHits = 0;
const TRIALS = 5000;
for (let t = 0; t < TRIALS; t++) {
  const hastati = Array.from({ length: 20 }, () => ({ hp: hasHp, morale: hasMorale }));
  let routCount = 0;
  for (let a = 0; a < 10; a++) {
    const target = hastati[Math.floor(Math.random() * 20)];
    if (Math.random() * 100 < hitPct) {
      totalHits++;
      target.hp -= dmgPerHit;
      target.morale -= morPerHit;
      if (target.morale <= hasFlee) {
        target.morale = 0;
        routCount++;
        // ally ripple -12 within radius (simplified: all allies)
        for (const h of hastati) {
          if (h.morale > 0) h.morale -= 12;
        }
      }
    }
  }
  const aliveMorale = hastati.filter(h => h.morale > hasFlee).reduce((s, h) => s + h.morale, 0);
  const startMorale = 20 * hasMorale;
  const ratio = aliveMorale / startMorale;
  if (ratio < 0.25 || routCount >= 5) totalRouts++;
}
console.log('Trials:', TRIALS, 'avg hits/salva:', (totalHits / TRIALS).toFixed(1));
console.log('Bitwa „złamana” (ratio<25% lub >=5 rout):', (100 * totalRouts / TRIALS).toFixed(1) + '%');

// Bundle check
const bundlePath = path.join(__dirname, '../../gra-robocza/Gra-podglad-POLE-BITWY.html');
if (fs.existsSync(bundlePath)) {
  const b = fs.readFileSync(bundlePath, 'utf8');
  const hasTw = b.includes('rangeDamageTw') || b.includes('rangeDamage(');
  const hasLegacy = b.includes('cuA.Atak');
  console.log('\n=== Bundle gra-robocza POLE-BITWY ===');
  console.log('TW rangeDamage in bundle:', hasTw);
  console.log('Legacy cuA.Atak:', hasLegacy);
  console.log('missileAttack:3 count:', (b.match(/missileAttack.:3/g) || []).length);
  console.log('Atak dystansowy.:35 count:', (b.match(/Atak dystansowy.:35/g) || []).length, '(legacy field in JSON — OK if unused)');
}
