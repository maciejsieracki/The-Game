#!/usr/bin/env node
// R-WEB-DOCS-JSON-DESCRIPTIONS-SYNC-Q1 (zadanie #371) — test spójności OPISÓW w danych JSON z kodem.
//
// Zakres: gra/data/war-weariness-params.json i gra/data/diplomacy-tick-params.json.
//  (a) wartości nie-opisowe (klucze bez prefiksu `_`) są identyczne jak w wersji bazowej (git show BASE);
//      zmiany tematu dotyczą wyłącznie kluczy `_*` (w tym `_uwaga*`).
//  (b) liczby zapisane w `_wzor` (pelneTur, progi, progiStopni, maxMiastNaPokoj, procenty) zgadzają się
//      z polami liczbowymi obok; mutacja pola czerwieni test.
//  (c) fakty z kodu, na których opierają się teksty `_uwaga*` / `_progi`, nadal obowiązują.
//
// Użycie (z katalogu gra/):  node tools/json-descriptions-sync-test.cjs

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const GRA = path.resolve(__dirname, '..');
const REPO = path.resolve(GRA, '..');
const BASE = 'f196422ef';
const WAR_JSON = 'gra/data/war-weariness-params.json';
const DIP_JSON = 'gra/data/diplomacy-tick-params.json';

let pass = 0;
let fail = 0;
function check(name, ok, detail) {
  if (ok) {
    pass++;
    console.log('PASS: ' + name);
  } else {
    fail++;
    console.log('FAIL: ' + name + (detail ? ' — ' + detail : ''));
  }
}

function readRepoText(rel) {
  return fs.readFileSync(path.join(REPO, rel), 'utf8');
}

function readBaseText(rel) {
  return execFileSync('git', ['show', BASE + ':' + rel], { cwd: REPO, encoding: 'utf8' });
}

// Usuwa wszystkie klucze zaczynające się od `_` (rekurencyjnie) — zostają wartości nie-opisowe.
function stripUnderscore(v) {
  if (Array.isArray(v)) return v.map(stripUnderscore);
  if (v && typeof v === 'object') {
    const out = {};
    for (const k of Object.keys(v)) {
      if (k.startsWith('_')) continue;
      out[k] = stripUnderscore(v[k]);
    }
    return out;
  }
  return v;
}

function sameJson(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

// Liczba zapisana jako `etykieta=wartość` (przecinek dziesiętny) w tekście opisu.
function labelledNumber(text, label) {
  const m = text.match(new RegExp(label + '=([0-9]+(?:,[0-9]+)?)'));
  return m ? parseFloat(m[1].replace(',', '.')) : null;
}

// Procent zapisany jako `etykieta=wartość (NN%` w tekście opisu.
function labelledPercent(text, label) {
  const m = text.match(new RegExp(label + '=[0-9]+(?:,[0-9]+)? \\((\\d+)%'));
  return m ? parseInt(m[1], 10) : null;
}

// Porównuje liczby z `_wzor` z polami obok. Zwraca listę niezgodności (pusta = zgodne).
function checkWearinessDescriptions(json) {
  const bad = [];
  const z = json.zmeczenie || {};
  const p = json.przegrywajacy || {};
  const wz = String(z._wzor || '');
  const wp = String(p._wzor || '');

  const numChecks = [
    [wz, 'pelneTur', z.pelneTur],
    [wz, 'wagaStratMiasta', z.wagaStratMiasta],
    [wz, 'progChetnosci', z.progChetnosci],
    [wz, 'progWzajemnyPokoj', z.progWzajemnyPokoj],
    [wz, 'progKoncaZmeczenia', z.progKoncaZmeczenia],
    [wz, 'pelneTur', z.pelneTur], // (maxMiastNaPokoj usuniety: jedna cena, minimum miast)
  ];
  for (const [text, label, field] of numChecks) {
    const got = labelledNumber(text, label);
    if (got === null) bad.push(label + ': brak liczby w opisie');
    else if (Math.abs(got - field) > 1e-9) bad.push(label + ': opis ' + got + ' vs pole ' + field);
  }

  for (const label of ['progChetnosci', 'progWzajemnyPokoj', 'progKoncaZmeczenia']) {
    const field = z[label];
    const pct = labelledPercent(wz, label);
    if (pct === null) bad.push(label + ': brak procentu w opisie');
    else if (pct !== Math.round(field * 100)) bad.push(label + ': procent w opisie ' + pct + '% vs pole ' + field);
  }

  const mStopnie = wp.match(/progiStopni=([^;(]+)/);
  if (!mStopnie) {
    bad.push('progiStopni: brak listy w opisie');
  } else {
    const opis = mStopnie[1].split('/').map(s => parseFloat(s.trim().replace(',', '.')));
    const pole = Array.isArray(p.progiStopni) ? p.progiStopni : [];
    const same = opis.length === pole.length && opis.every((v, i) => Math.abs(v - pole[i]) <= 1e-9);
    if (!same) bad.push('progiStopni: opis [' + opis.join(', ') + '] vs pole [' + pole.join(', ') + ']');
  }

  const progi = String(z._progi || '');
  if (!progi.includes('progWzajemnyPokoj') || !progi.includes('progKoncaZmeczenia')) {
    bad.push('_progi: brak nazwy jednego z dwóch progów 0,8');
  }
  return bad;
}

function deepClone(v) {
  return JSON.parse(JSON.stringify(v));
}

// ---------------------------------------------------------------------------
// (a) JSON poprawny; wartości nie-opisowe zgodne z bazą
// ---------------------------------------------------------------------------
let warCur = null;
let dipCur = null;
try {
  warCur = JSON.parse(readRepoText(WAR_JSON));
  dipCur = JSON.parse(readRepoText(DIP_JSON));
  check('a0: oba pliki JSON parsują się poprawnie', true);
} catch (e) {
  check('a0: oba pliki JSON parsują się poprawnie', false, String(e && e.message));
}

if (warCur && dipCur) {
  for (const [rel, cur] of [[WAR_JSON, warCur], [DIP_JSON, dipCur]]) {
    let base = null;
    try {
      base = JSON.parse(readBaseText(rel));
    } catch (e) {
      check('a1: ' + rel + ' — wersja bazowa ' + BASE + ' dostępna przez git show', false, String(e && e.message));
      continue;
    }
    // R-WEB-DIPLO-TRUST-WAR-N6-CLEANUP-Q1: martwe pole p6.kryzysTurDoWojny usunięte celowo (N z profilu wojny).
    // Jedyny dozwolony ubytek wobec wersji bazowej; reszta wartości musi być identyczna.
    if (rel === DIP_JSON && base && base.p6 && 'kryzysTurDoWojny' in base.p6) delete base.p6.kryzysTurDoWojny;
    // R-WEB-DIPLO-WEARINESS-AS-PW-PEACE-ITEM-Q1 (ABC 2026-11-14): rabat ceny pokoju (rabatCenyPokojuMax, _rabat) USUNIĘTY
    // celowo — zmęczenie wojną jest pozycją PW (wearinessPeaceItemPw). Jedyny dozwolony ubytek w war-weariness-params.json.
    if (rel === WAR_JSON && base && base.czlowiek && 'rabatCenyPokojuMax' in base.czlowiek) {
      delete base.czlowiek.rabatCenyPokojuMax;
    }
    // DIPLO-WAR-WEARINESS-40-TURNS-FORCED-PEACE-AT-100-Q1 (ABC właściciela 2026-11-16): celowe zmiany wobec bazy —
    // pełne zmęczenie po 40 turach (było 20) i nowy próg pokoju wymuszonego progWymuszonyPokoj=1,0. Reszta bez zmian.
    let curCmp = cur;
    // R-WEB-DIPLO-PEACE-PRICE-DECAY-WITH-WEARINESS-Q1 (decyzja wlasciciela 2026-11-17): celowe zmiany wobec bazy — NOWA sekcja cenaPokoju
    // (cenaStartPn 6000) oraz USUNIETE parametry limitu/mnoznikow oferty i progu 3 miast (jedna cena, minimum miast):
    // przegrywajacy.{mnozniStopni, mnoznikNaOdrzucenie, maxMiastNaPokoj, minMiastPoOddaniu}. Reszta wartosci musi byc identyczna.
    if (rel === WAR_JSON && base && base.przegrywajacy) {
      for (const k of ['mnozniStopni', 'mnoznikNaOdrzucenie', 'maxMiastNaPokoj', 'minMiastPoOddaniu']) delete base.przegrywajacy[k];
      curCmp = JSON.parse(JSON.stringify(cur));
      delete curCmp.cenaPokoju;
      // R-WEB-DIPLO-PEACE-PW-POWER-RATIO-IMPL-Q1 (ABC 2026-11-18): sekcja pwPrzezMoc (mianownikMin) — nowa, celowa.
      // R-WEB-DIPLO-PEACE-LAST-STAGE-GOLD-ORES-Q1 (ABC właściciela 2026-11-18): sekcja ogonPokoju (kolejnosc) — nowa, celowa.
      // R-WEB-TEST-DEBT-Q14 (D2): pola dodane przez te decyzje były niewyjaśnione w teście (przyczyna FAIL a1).
      delete curCmp.pwPrzezMoc;
      delete curCmp.ogonPokoju;
    }
    if (rel === WAR_JSON && base && base.zmeczenie) {
      base.zmeczenie.pelneTur = 40;
      curCmp = JSON.parse(JSON.stringify(curCmp));
      if (curCmp.zmeczenie) delete curCmp.zmeczenie.progWymuszonyPokoj;
    }
    check('a1: ' + rel + ' — wartości bez prefiksu _ równe wersji bazowej ' + BASE + ' (+ celowe: pelneTur 40, progWymuszonyPokoj)',
      sameJson(stripUnderscore(curCmp), stripUnderscore(base)));
  }
}

// ---------------------------------------------------------------------------
// (b) liczby w _wzor zgodne z polami; mutacje czerwienią test
// ---------------------------------------------------------------------------
if (warCur) {
  const bad = checkWearinessDescriptions(warCur);
  check('b1: liczby w _wzor / _progi zgodne z polami (war-weariness-params.json)', bad.length === 0, bad.join('; '));

  const m1 = deepClone(warCur);
  m1.zmeczenie.pelneTur = 21;
  check('b2: mutacja pelneTur 20->21 czerwieni test', checkWearinessDescriptions(m1).length > 0);

  const m2 = deepClone(warCur);
  m2.przegrywajacy.progiStopni[1] = 0.5;
  check('b3: mutacja progiStopni[1] 0,45->0,5 czerwieni test', checkWearinessDescriptions(m2).length > 0);

  const m3 = deepClone(warCur);
  m3.zmeczenie.progKoncaZmeczenia = 0.9;
  check('b4: mutacja progKoncaZmeczenia 0,8->0,9 (bez zmiany opisu) czerwieni test',
    checkWearinessDescriptions(m3).length > 0);

  const m4 = deepClone(warCur);
  m4.zmeczenie.pelneTur = 50;
  check('b5: mutacja pelneTur 40->50 (bez zmiany opisu) czerwieni test', checkWearinessDescriptions(m4).length > 0);
}

// ---------------------------------------------------------------------------
// (c) fakty z kodu cytowane w opisach
// ---------------------------------------------------------------------------
const wwSrc = readRepoText('gra/src/game/war-weariness.ts');
const brakeSrc = readRepoText('gra/src/game/diplomacy-tick-war-brake.ts');
const mainSrc = readRepoText('gra/src/main.ts');
const srcDir = path.join(REPO, 'gra', 'src');

// R-WEB-DIPLO-WEARINESS-AS-PW-PEACE-ITEM-Q1: jedna funkcja konca zmeczenia — progKoncaZmeczenia czyta wearinessPeaceX,
// a wearinessUnconditionalEndDue = wearinessPeaceX(...) >= 1 (dawna forma `level >= P.zmeczenie.progKoncaZmeczenia` nieaktualna).
check('c1: progKoncaZmeczenia czytane przez widok (war-weariness-view.ts); pokój wymuszony = wearinessForcedPeaceDue (progWymuszonyPokoj, war-weariness.ts)',
  readRepoText('gra/src/game/war-weariness-view.ts').includes('P.zmeczenie.progKoncaZmeczenia')
  && wwSrc.includes('return level >= P.zmeczenie.progWymuszonyPokoj;')
  && !wwSrc.includes('wearinessUnconditionalEndDue'));
check('c2: progWzajemnyPokoj czytane w warunku wyjścia awaryjnego (war-weariness.ts)',
  wwSrc.includes('lvl >= P.zmeczenie.progWzajemnyPokoj'));
check('c3: wyjście awaryjne wymaga odrzuceniaDoKapitulacji (war-weariness.ts)',
  wwSrc.includes('st.rejectedOffers >= P.przegrywajacy.odrzuceniaDoKapitulacji'));
check('c4: cena pokoju = jedna funkcja wearinessPeaceCashPn (war-weariness.ts); limit miast wg stopnia i mnozniki oferty usuniete',
  wwSrc.includes('export function wearinessPeaceCashPn(') && !wwSrc.includes('stageCityLimit') && !wwSrc.includes('offerMultiplier'));
check('c5: plan oferty zmeczenia tylko miasta (planCityPeacePayment w diplomacy-ai-forced-peace.ts)',
  readRepoText('gra/src/game/diplomacy-ai-forced-peace.ts').includes("a.kind === 'miasto' && !a.forbidden"));
check('c6: flaga pakietu domyślnie true (DIPLO_TICK_WAR_BRAKE_ENABLED_DEFAULT, diplomacy-tick-war-brake.ts)',
  brakeSrc.includes('export const DIPLO_TICK_WAR_BRAKE_ENABLED_DEFAULT = true;'));
check('c7: main.ts nadpisuje kryzysTurDoWojny wartością w.n (profil wojny)',
  mainSrc.includes('{ ...diploTickP6, kryzysTurDoWojny: w.n }'));

// Pole flagaDomyslna nie jest czytane przez żaden plik gra/src.
let flagaRead = false;
(function scan(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) scan(full);
    else if (/\.(ts|tsx|js|cjs|mjs)$/.test(ent.name) && fs.readFileSync(full, 'utf8').includes('flagaDomyslna')) flagaRead = true;
  }
})(srcDir);
check('c8: pole flagaDomyslna nie jest czytane przez kod gra/src', !flagaRead);

if (dipCur) {
  // R-WEB-DIPLO-TRUST-WAR-N6-CLEANUP-Q1: pole p6.kryzysTurDoWojny i jego _uwaga usunięte z JSON (N z profilu wojny).
  check('c9: diplomacy-tick-params.json ma _uwagaFlagaDomyslna, a p6 nie ma kryzysTurDoWojny ani _uwagaKryzysTurDoWojny',
    typeof dipCur._uwagaFlagaDomyslna === 'string' && !('kryzysTurDoWojny' in dipCur.p6) && !('_uwagaKryzysTurDoWojny' in dipCur.p6));
}

// c10: zakres N hamulca wojny z civ-matrix.json (ten sam wzór co diplomacy-war-peace-profile.ts:188) i N=6 dla profilu bez wiersza
// (wzór z diplomacy-war-peace-profile.ts:143). Opis _uwagaKryzysTurDoWojny musi podawać te liczby.
if (dipCur) {
  const brakeP = JSON.parse(readRepoText('gra/data/diplomacy-war-peace-params.json')).hamulecRelacji;
  const matrixRows = JSON.parse(readRepoText('gra/data/civ-matrix.json')).cywilizacje || [];
  const clampN = (dip) => Math.min(brakeP.maxN, Math.max(brakeP.minN, Math.round(brakeP.bazaN - brakeP.wagaProgWojny * dip)));
  const ns = matrixRows
    .map((c) => (c.params || c)['dip_prog_wojny'])
    .filter((v) => typeof v === 'number')
    .map(clampN);
  const nMin = Math.min(...ns);
  const nMax = Math.max(...ns);
  // Zakres N z profilu zapisany w Civpedii (docs/encyklopedia/pojecia/wypowiedzenie-wojny.md), nie w JSON.
  const civWojna = readRepoText('docs/encyklopedia/pojecia/wypowiedzenie-wojny.md');
  check('c10: N profilu bez wiersza macierzy = 6 (wzór z diplomacy-war-peace-profile.ts:143)',
    clampN(5) === 6);
  check('c10: Civpedia podaje zakres N od ' + brakeP.minN + ' do ' + brakeP.maxN + ' tur (granice hamulecRelacji)',
    ns.length > 0 && civWojna.includes('od ' + brakeP.minN + ' do ' + brakeP.maxN + ' tur'));
}

console.log('');
console.log('json-descriptions-sync-test: ' + pass + ' pass / ' + fail + ' fail');
process.exit(fail === 0 ? 0 : 1);
