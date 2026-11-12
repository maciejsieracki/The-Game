// R-RUSTPORT-P6-POWER-AKUMULATORY-WIRING-Q1: generator wektorow sekwencji zdarzen gry (wygrana bitwy, zdobycie barbarzyncow, eliminacja) dla adaptera PlayableState; wejscie: power_raw_for_owner.
// Generator WYKONUJE kod z pinu (nie transkrypcje reki):
//   * gra/src/game/power-objective.ts -> battlePowerPointsFromDefeatedEnemy (wyciete po nazwie, wykonane);
//   * gra/src/game/capital-capture.ts -> barbarianCapturedPowerGain (wyciete po nazwie, wykonane);
//   * gra/src/main.ts -> dokladne instrukcje akumulatorow, wyciete po tresci linii i wykonane z WOLNYMI
//     zmiennymi jako danymi: zapis zwyciezcy (battlePowerPtsByOwner.set, main.ts:34490), blok zdobyczy
//     (if (powerGain > 0) ... zdobyczePowerByOwner.set, main.ts:35674-35675), usuniecie po eliminacji
//     (battlePowerPtsByOwner.delete main.ts:35399, zdobyczePowerByOwner.delete main.ts:35410).
// Straznik SHA-256: generator odmawia pracy, gdy pliki pinu roznia sie od zapisanych skrotow.
// Zdarzenia (bitwa / zdobycie / eliminacja) sa generowane deterministycznie (LCG). Wartosci NaN/Infinity
// w wejsciach i wyjsciach sa kodowane jako napisy "NaN" / "Infinity" / "-Infinity" (JSON nie ma tych liczb).
// Klucze wlascicieli: przestrzen Rust (1..3); akumulatory nie zaleza od numeracji (klucz = identyfikator).
//
// Uzycie (WEB_ROOT = `git archive 07d2fbd72 gra/src gra/data | tar -x -C <katalog>`, poza repo; Node 22):
//   node rust-port/engine/tests/p6_power_acc_wiring_gen.mjs <WEB_ROOT> > rust-port/engine/tests/p6_power_acc_wiring_vectors/vectors.json

import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { stripTypeScriptTypes } from 'node:module';

const [WEB_ROOT] = process.argv.slice(2);
if (!WEB_ROOT) throw new Error('uzycie: gen.mjs <WEB_ROOT>');
const SRC = path.join(WEB_ROOT, 'gra', 'src');
const PIN = '07d2fbd72f758705f8e1d59cc4968027ffbafe75';

const EXPECTED_SHA256 = {
  'game/power-objective.ts': '58eb5b5524935363dcf9835444d78fb874fddffc46dc109c14848e7eda5f0af9',
  'game/capital-capture.ts': '2716765911b2e083cb984d7f4e265e7fb55f0ad865cdc50dc5e27add8e373f81',
  'main.ts': 'e80f9cb41d513b92846972a19f2760e08eb4247d6a9b344526d8bc71bd7d5f19',
};

function readGuarded(rel) {
  const text = readFileSync(path.join(SRC, rel), 'utf8');
  const sha = createHash('sha256').update(text).digest('hex');
  if (sha !== EXPECTED_SHA256[rel]) throw new Error(`strazik SHA-256 ${rel}: ${sha} != ${EXPECTED_SHA256[rel]} (pin ${PIN})`);
  return text.split('\n');
}

// Wycinek funkcji po nazwie: od deklaracji do domykajacego nawiasu o tym samym wcieciu.
function extractFn(lines, name) {
  const re = new RegExp(`^\\s*(export )?function ${name}\\(`);
  const hits = lines.map((l, idx) => (re.test(l) ? idx : -1)).filter(idx => idx >= 0);
  if (hits.length !== 1) throw new Error(`funkcja ${name}: oczekiwano 1 deklaracji, jest ${hits.length}`);
  const start = hits[0];
  const indent = lines[start].match(/^\s*/)[0];
  let end = start + 1;
  while (lines[end] !== indent + '}') end++;
  return lines.slice(start, end + 1).join('\n').replace(/^(\s*)export /, '$1');
}

// Pojedyncza instrukcja z main.ts: dokladnie jedna linia o podanej tresci (bez wiodacych spacji).
function extractLine(lines, text) {
  const hits = lines.map((l, idx) => (l.trim() === text ? idx : -1)).filter(idx => idx >= 0);
  if (hits.length !== 1) throw new Error(`linia "${text}": oczekiwano 1 wystapienia, jest ${hits.length}`);
  return { idx: hits[0], text: lines[hits[0]].trim() };
}

const powerLines = readGuarded('game/power-objective.ts');
const captureLines = readGuarded('game/capital-capture.ts');
const mainLines = readGuarded('main.ts');

// Kontrola kontekstu: wywolania z pinu, ktore wykonujemy, musza stac w swoich blokach.
const battleSetLine = extractLine(mainLines, 'battlePowerPtsByOwner.set(winOid, (battlePowerPtsByOwner.get(winOid) ?? 0) + pts);');
if (!mainLines.slice(battleSetLine.idx - 6, battleSetLine.idx).some(l => l.includes('if (winOid !== undefined) {'))) {
  throw new Error('zapis bitwy poza blokiem `if (winOid !== undefined)`');
}
const captureIfIdx = mainLines.findIndex(l => l.trim() === 'if (powerGain > 0) {');
if (captureIfIdx < 0 || mainLines[captureIfIdx + 1].trim() !== 'zdobyczePowerByOwner.set(newOwner, (zdobyczePowerByOwner.get(newOwner) ?? 0) + powerGain);') {
  throw new Error('blok zdobyczy: niespodziewana tresc main.ts');
}
const captureBlock = mainLines.slice(captureIfIdx, captureIfIdx + 3).map(l => l.trim()).join('\n');
const elimBattle = extractLine(mainLines, 'battlePowerPtsByOwner.delete(ownerId);').text;
const elimZdobycze = extractLine(mainLines, 'zdobyczePowerByOwner.delete(ownerId);').text;

const battlePointsSrc = extractFn(powerLines, 'battlePowerPointsFromDefeatedEnemy');
const barbSrc = extractFn(captureLines, 'barbarianCapturedPowerGain');
const code = stripTypeScriptTypes(
  `function __mk() {\n${battlePointsSrc}\n${barbSrc}\nreturn { battlePowerPointsFromDefeatedEnemy, barbarianCapturedPowerGain };\n}`,
  { mode: 'strip' },
);
const web = new Function(`${code}\nreturn __mk();`)();

// Wykonanie instrukcji main.ts z wolnymi zmiennymi jako parametrami (mapy stanu weba).
const applyBattleSet = new Function('battlePowerPtsByOwner', 'winOid', 'pts', battleSetLine.text);
const applyCapture = new Function('zdobyczePowerByOwner', 'powerGain', 'newOwner', captureBlock.replace(/\s+/g, ' '));
const applyElimBattle = new Function('battlePowerPtsByOwner', 'ownerId', elimBattle);
const applyElimZdobycze = new Function('zdobyczePowerByOwner', 'ownerId', elimZdobycze);

// Deterministyczny generator (LCG).
let seed = 0x7a3c2026;
const rnd = () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
};
const pick = arr => arr[Math.floor(rnd() * arr.length)];

const OWNERS = [1, 2, 3];
const ENEMY_M = [0, 0.4, 0.99, 1, 3.7, 12, 99.99, 250.5, -3, NaN, Infinity, -Infinity, 1e6];
const LOSTS = [0, 1, 2.5, 12, 100.75, 480, -3, NaN, Infinity, -Infinity];

const enc = v => (Number.isNaN(v) ? 'NaN' : v === Infinity ? 'Infinity' : v === -Infinity ? '-Infinity' : v);

function battleEvent() {
  const winner = pick(OWNERS);
  const enemy = pick(ENEMY_M);
  return { kind: 'battle', winner, enemy_m: enc(enemy), _enemy: enemy };
}
function captureEvent() {
  const newOwner = pick(OWNERS);
  const lost = pick(LOSTS);
  const barb = rnd() < 0.3;
  return { kind: 'capture', new_owner: newOwner, lost_power: enc(lost), barb_captor: barb, _lost: lost };
}
function elimEvent() {
  return { kind: 'elim', owner: pick(OWNERS) };
}

// Stan weba: mapy Map<owner, number> jak w main.ts.
function runWeb(events) {
  const battle = new Map();
  const zdobycze = new Map();
  for (const ev of events) {
    if (ev.kind === 'battle') {
      const pts = web.battlePowerPointsFromDefeatedEnemy(ev._enemy);
      applyBattleSet(battle, ev.winner, pts);
    } else if (ev.kind === 'capture') {
      const powerGain = web.barbarianCapturedPowerGain(ev._lost, ev.barb_captor);
      applyCapture(zdobycze, powerGain, ev.new_owner);
    } else {
      applyElimBattle(battle, ev.owner);
      applyElimZdobycze(zdobycze, ev.owner);
    }
  }
  return { battle, zdobycze };
}

function stripInternal(events) {
  return events.map(({ _enemy, _lost, ...rest }) => rest);
}

const cases = [];
function addCase(kind, events) {
  const { battle, zdobycze } = runWeb(events);
  for (const owner of OWNERS) {
    cases.push({
      kind,
      owner,
      events: stripInternal(events),
      expect_bitwy_pkt: enc(battle.get(owner) ?? 0),
      expect_zdobycze: enc(zdobycze.get(owner) ?? 0),
    });
  }
}

// 1) Same bitwy (60 sekwencji x 3 wlasciciele): wiele wygranych, rozne zwyciezce i sumy przegranych.
for (let i = 0; i < 60; i++) {
  const events = Array.from({ length: 1 + Math.floor(rnd() * 6) }, battleEvent);
  addCase('bitwy', events);
}
// 2) Same zdobycze (60 sekwencji).
for (let i = 0; i < 60; i++) {
  const events = Array.from({ length: 1 + Math.floor(rnd() * 6) }, captureEvent);
  addCase('zdobycze', events);
}
// 3) Mieszane: bitwy, zdobycze i eliminacje (40 sekwencji).
for (let i = 0; i < 40; i++) {
  const events = Array.from({ length: 2 + Math.floor(rnd() * 8) }, () => {
    const r = rnd();
    return r < 0.4 ? battleEvent() : r < 0.8 ? captureEvent() : elimEvent();
  });
  addCase('mieszane', events);
}

const out = {
  pin: PIN,
  sources: EXPECTED_SHA256,
  note: 'expect_* = wynik wykonania kodu weba (wyciete funkcje + instrukcje main.ts); NaN/Infinity jako napisy',
  cases,
};
process.stdout.write(JSON.stringify(out, null, 1) + '\n');
