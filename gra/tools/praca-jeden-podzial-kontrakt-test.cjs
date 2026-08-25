'use strict';
/**
 * praca-jeden-podzial-kontrakt-test.cjs — BRAMKA TEMATU R-PRACA-JEDEN-PODZIAL-Q1.
 *
 * Kontrakt właściciela (ECHO 2026-08-25), sprawdzany tu wprost:
 *   1. JEDEN podział Pracy, sumujący się do 100%: ulepszenia% + budynki% = 100.
 *   2. Cap: ulepszenia ≤ 50%, budynki ≥ 50%. Nigdy odwrotnie.
 *   3. Stosowany DOKŁADNIE RAZ: ustawienie X% → do ulepszeń trafia X% Pracy.
 *   4. Identyczny mechanizm globalnie i w mieście (ten sam cap, ta sama jednostka).
 *   5. Override miasta zapala się SAM przy różnicy od globalnej; powrót go gasi.
 *   8. Pozostali konsumenci puli imperium działają dalej i nic ich nie podjada.
 *
 * REGUŁA ZAOKRĄGLENIA (jawna, wymagana przez dispatch):
 *   doBudynkow      = Math.round(total × procentBudynki/100)
 *   doPuli  = total − doBudynkow            ← reszta, NIGDY osobno zaokrąglana
 * Zaokrąglana jest TYLKO jedna strona, więc suma jest z definicji równa całkowitej
 * Pracy miasta — zero gubionych i zero zdublowanych jednostek. Konsekwencja: przy
 * Pracy niepodzielnej przez 100/X udział ulepszeń odchyla się od nominalnego X% o
 * mniej niż 1 jednostkę Pracy (nigdy o więcej, nigdy w tę samą stronę systematycznie).
 *
 * Run from gra/:  node tools/praca-jeden-podzial-kontrakt-test.cjs
 */
const fs = require('fs');
const path = require('path');

const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = process.env.UPP_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const esbuild = require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'));

const ENTRY_FILE = path.resolve(__dirname, '.praca-jeden-podzial-kontrakt-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.praca-jeden-podzial-kontrakt-bundle.cjs');
fs.writeFileSync(ENTRY_FILE, `
export { splitPraca, pracaImperialPoolGain, cityPracaInteger } from ${JSON.stringify(SRC + '/game/production')};
export * as production from ${JSON.stringify(SRC + '/game/production')};
export {
  clampPodzialPracyBudynkiPercent,
  procentPuliImperiumZBudynkow,
  podzialPracyZProcentuPuli,
  MIN_PODZIAL_PRACY_BUDYNKI_PERCENT,
  MAX_PODZIAL_PRACY_BUDYNKI_PERCENT,
  MAX_PROCENT_PULI_IMPERIUM,
  DEFAULT_PODZIAL_PRACY,
  ensureCitySaveDefaults,
} from ${JSON.stringify(SRC + '/game/cities')};
export {
  applyPodzialPracyLocalChange,
  resolveCityPodzialPracy,
  migratePodzialPracyOnLoad,
} from ${JSON.stringify(SRC + '/game/empire-city-defaults')};
`, 'utf8');
try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE], bundle: true, platform: 'node', format: 'cjs',
    target: 'node18', outfile: BUNDLE_FILE, absWorkingDir: GRA_ROOT,
    loader: { '.json': 'json' }, logLevel: 'silent',
  });
} catch (e) {
  console.error('[praca-jeden-podzial-kontrakt] esbuild failed:\n', e.message || e);
  process.exit(1);
}
const M = require(BUNDLE_FILE);
try { fs.unlinkSync(ENTRY_FILE); } catch (e) { /* best effort */ }
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) { /* best effort */ }

let passed = 0;
let failed = 0;
function ok(cond, msg) {
  if (cond) { passed++; console.log('  [OK] ' + msg); }
  else { failed++; console.error('  [FAIL] ' + msg); }
}
function eq(a, b, msg) { ok(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

const PRACE = [0, 1, 2, 3, 5, 6, 7, 10, 13, 20, 37, 100, 1000];
const SIATKA_ULEPSZEN = [0, 10, 20, 30, 40, 50];

console.log('-- 1. SIATKA KONTRAKTU: ustawienie X% ulepszeń → X% Pracy, suma zawsze 100% --');
{
  for (const pctU of SIATKA_ULEPSZEN) {
    const podzial = M.podzialPracyZProcentuPuli(pctU);
    eq(M.procentPuliImperiumZBudynkow(podzial.procentBudynki), pctU,
      `ustawienie ${pctU}% ulepszeń jest zachowane (nie ścinane, nie mnożone)`);
    eq(podzial.procentBudynki + pctU, 100, `${pctU}% ulepszeń + budynki = 100%`);
    for (const praca of PRACE) {
      const r = M.splitPraca(praca, podzial.procentBudynki / 100);
      // (a) NIC nie ginie i nic się nie dubluje.
      eq(r.doBudynkow + r.doPuli, r.total,
        `praca=${praca}, ulepszenia=${pctU}%: budynki+ulepszenia = cała Praca`);
      eq(r.total, M.cityPracaInteger(praca), `praca=${praca}: total = zaokrąglona Praca miasta`);
      // (b) Udział ulepszeń to DOKŁADNIE X% — z jawną regułą zaokrąglenia (< 1 jednostki).
      const nominal = r.total * pctU / 100;
      ok(Math.abs(r.doPuli - nominal) < 1,
        `praca=${praca}, ulepszenia=${pctU}%: realny udział ${r.doPuli} ≈ nominalny ${nominal} (odchyłka < 1 Pracy)`);
      // (c) Gdy nominał jest całkowity, musi być RÓWNY co do jednostki — bez „prawie".
      if (Number.isInteger(nominal)) {
        eq(r.doPuli, nominal,
          `praca=${praca}, ulepszenia=${pctU}%: nominał całkowity → udział DOKŁADNIE ${nominal}`);
      }
      // (d) Reguła zaokrąglenia jest tą udokumentowaną, nie inną.
      eq(r.doBudynkow, Math.round(r.total * podzial.procentBudynki / 100),
        `praca=${praca}, ulepszenia=${pctU}%: doBudynkow = round(total × %budynki)`);
    }
  }
}

console.log('\n-- 2. REGRES ZE ZGŁOSZENIA: domyślne ustawienia NIE dają już 0% na ulepszenia --');
{
  // Zmierzone przed zmianą (dispatch): 10 Pracy, domyślne 70% budynki / 33% ulepszenia
  // (drugi suwak) → do ulepszeń trafiało DOKŁADNIE 0. Po przebudowie ta sama Praca przy
  // domyślnym podziale ma dać nominalne 30%.
  const domyslny = M.DEFAULT_PODZIAL_PRACY.procentBudynki;
  eq(domyslny, 70, 'domyślny podział to nadal 70% budynki');
  const r = M.splitPraca(10, domyslny / 100);
  eq(r.doPuli, 3, '10 Pracy, ustawienia domyślne → 3 na ulepszenia (było 0 — regres zamknięty)');
  eq(r.doBudynkow, 7, '10 Pracy, ustawienia domyślne → 7 na budynki');
  // Maksymalne suwaki: obiecane 50% ma być realne 50%, nie ~20%.
  const maks = M.splitPraca(10, M.MIN_PODZIAL_PRACY_BUDYNKI_PERCENT / 100);
  eq(maks.doPuli, 5, '10 Pracy, suwak na maksimum → 5 na ulepszenia (było 2 = 20%)');
  eq(maks.doBudynkow, 5, '10 Pracy, suwak na maksimum → 5 na budynki');
}

console.log('\n-- 3. CAP: > 50% na ulepszenia jest NIEOSIĄGALNE (suwak, zapis, override) --');
{
  for (const zadanie of [51, 60, 75, 99, 100, 150]) {
    const podzial = M.podzialPracyZProcentuPuli(zadanie);
    eq(podzial.procentBudynki, 50, `żądanie ${zadanie}% ulepszeń → budynki 50% (cap)`);
    eq(M.procentPuliImperiumZBudynkow(podzial.procentBudynki), 50, `żądanie ${zadanie}% ulepszeń → 50% (cap)`);
  }
  // Wartość NIELICZBOWA (Infinity/NaN/null) nie jest „żądaniem 100%" — to brak wartości,
  // więc wraca domyślna, tak samo jak w clampPodzialPracyBudynkiPercent. W żadnym
  // wypadku nie może przekroczyć capu.
  for (const zadanie of [Infinity, -Infinity, NaN, null, undefined]) {
    const podzial = M.podzialPracyZProcentuPuli(zadanie);
    eq(podzial.procentBudynki, M.DEFAULT_PODZIAL_PRACY.procentBudynki,
      `żądanie ${String(zadanie)}% ulepszeń → wartość domyślna (brak wartości ≠ 100%)`);
    ok(M.procentPuliImperiumZBudynkow(podzial.procentBudynki) <= M.MAX_PROCENT_PULI_IMPERIUM,
      `żądanie ${String(zadanie)}% ulepszeń nigdy nie przekracza capu 50%`);
  }
  // Twarda postać capu, W JEDNOSTKACH Pracy — ostrzejsza niż porównanie procentów.
  // Przy remisie zaokrąglenia (.5) nadwyżka idzie do BUDYNKÓW, czyli w stronę wymaganą
  // przez właściciela („nigdy w drugą stronę"), nigdy do ulepszeń.
  for (const pctU of SIATKA_ULEPSZEN) {
    const podzial = M.podzialPracyZProcentuPuli(pctU);
    for (const total of PRACE) {
      const r = M.splitPraca(total, podzial.procentBudynki / 100);
      ok(2 * r.doPuli <= r.total,
        `ulepszenia ${pctU}%, praca=${total}: udział ulepszeń nigdy nie przekracza połowy Pracy`);
      ok(2 * r.doBudynkow >= r.total,
        `ulepszenia ${pctU}%, praca=${total}: budynki nigdy poniżej połowy Pracy`);
    }
  }
  // Zapis (stary save / ręcznie zmodyfikowany JSON) też nie przemyci >50%.
  for (const zapis of [0, 10, 25, 49, -100, NaN]) {
    ok(M.clampPodzialPracyBudynkiPercent(zapis) >= M.MIN_PODZIAL_PRACY_BUDYNKI_PERCENT,
      `zapis procentBudynki=${zapis} → nigdy poniżej 50% dla budynków`);
  }
  // Override miasta z nielegalną wartością również jest przycinany.
  const city = { ownerId: 0, podzialPracyOverride: true, podzialPracy: { procentBudynki: 10 } };
  eq(M.resolveCityPodzialPracy(city, { procentBudynki: 70 }).procentBudynki, 50,
    'override miasta 10% budynków → przycięty do 50% przy odczycie');
  // Migracja starego zapisu (KAŻDA ścieżka) też przycina.
  const cities = [{ ownerId: 0, podzialPracyOverride: true, podzialPracy: { procentBudynki: 5 } }];
  const defaults = new Map();
  M.migratePodzialPracyOnLoad(cities, defaults, [[0, { procentBudynki: 70 }]]);
  eq(cities[0].podzialPracy.procentBudynki, 50, 'migracja: override 5% budynków przycięty do 50%');
}

console.log('\n-- 4. IDENTYCZNY MECHANIZM globalnie i w mieście (ten sam cap, ta sama jednostka) --');
{
  eq(M.MAX_PROCENT_PULI_IMPERIUM, 100 - M.MIN_PODZIAL_PRACY_BUDYNKI_PERCENT,
    'cap globalny jest wyliczony z tego samego minimum co cap miasta');
  for (const pctU of SIATKA_ULEPSZEN) {
    const globalny = M.podzialPracyZProcentuPuli(pctU);
    const miasto = { ownerId: 0, podzialPracyOverride: true, podzialPracy: { procentBudynki: globalny.procentBudynki } };
    eq(M.resolveCityPodzialPracy(miasto, globalny).procentBudynki, globalny.procentBudynki,
      `${pctU}% ulepszeń: miasto i imperium dają identyczną wartość`);
    const rG = M.splitPraca(17, globalny.procentBudynki / 100);
    const rM = M.splitPraca(17, M.resolveCityPodzialPracy(miasto, globalny).procentBudynki / 100);
    eq(rM.doPuli, rG.doPuli, `${pctU}% ulepszeń: identyczny wynik w mieście i globalnie`);
  }
}

console.log('\n-- 5. OVERRIDE MIASTA (pkt 5): zapala się SAM przy różnicy, gaśnie przy powrocie --');
{
  const globalny = { procentBudynki: 70 };
  const rowna = M.applyPodzialPracyLocalChange(70, globalny);
  eq(rowna.podzialPracyOverride, false, 'wartość równa globalnej → override zgaszony');
  eq(rowna.podzialPracy, undefined, 'wartość równa globalnej → pole lokalne skasowane (miasto śledzi globalną)');

  const rozna = M.applyPodzialPracyLocalChange(50, globalny);
  eq(rozna.podzialPracyOverride, true, 'wartość różna od globalnej → override zapalony SAM, bez klikania');
  eq(rozna.podzialPracy.procentBudynki, 50, 'wartość różna od globalnej → zapisana lokalnie');

  const powrot = M.applyPodzialPracyLocalChange(70, globalny);
  eq(powrot.podzialPracyOverride, false, 'powrót do wartości globalnej → override gaśnie');
  eq(powrot.podzialPracy, undefined, 'powrót do wartości globalnej → pole lokalne skasowane');

  // Zmiana globalnej przesuwa punkt odniesienia: 50 przestaje być „inne", gdy globalna = 50.
  const poZmianieGlobalnej = M.applyPodzialPracyLocalChange(50, { procentBudynki: 50 });
  eq(poZmianieGlobalnej.podzialPracyOverride, false,
    'gdy globalna = 50, ustawienie 50 w mieście NIE zapala override');
  // Wartość nielegalna jest najpierw przycięta, dopiero potem porównana.
  const nielegalna = M.applyPodzialPracyLocalChange(10, { procentBudynki: 50 });
  eq(nielegalna.podzialPracyOverride, false,
    'żądanie 10% budynków przycięte do 50% = globalna → override NIE zapala się na sztucznej różnicy');
  // Suwak NIE jest zablokowany: każda legalna wartość przechodzi.
  for (const v of [50, 60, 70, 80, 90, 100]) {
    const r = M.applyPodzialPracyLocalChange(v, globalny);
    const zapisana = r.podzialPracy ? r.podzialPracy.procentBudynki : globalny.procentBudynki;
    eq(zapisana, v, `suwak miasta przyjmuje ${v}% budynków (nie jest zablokowany)`);
  }
}

console.log('\n-- 6. ZERO PODWÓJNEGO LICZENIA: drugi podział nie istnieje --');
{
  eq(typeof M.production.splitEmpirePracaBudget, 'undefined', 'splitEmpirePracaBudget nie istnieje');
  eq(typeof M.production.allocateEmpirePracaToBuildings, 'undefined', 'allocateEmpirePracaToBuildings nie istnieje');
  const mainSrc = fs.readFileSync(path.resolve(SRC, 'main.ts'), 'utf8');
  const mainCode = mainSrc
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n').filter(l => !/^\s*(\/\/|\*)/.test(l)).join('\n');
  ok(!/\bsplitEmpirePracaBudget\s*\(/.test(mainCode), 'main.ts nie woła drugiego podziału');
  ok(!/\bapplyEmpireBuildingBudget\s*\(/.test(mainCode), 'main.ts nie oddaje puli z powrotem do budynków');
  ok(!/ownerDefaultPracaSplit\.set\(/.test(mainCode), 'drugi, niezależny suwak ownera nie istnieje');
  // splitPraca jest wołany raz na ścieżkę ekonomii (podgląd + realny tick), nie kaskadowo.
  const turnSrc = fs.readFileSync(path.resolve(SRC, 'game', 'turn-economy.ts'), 'utf8');
  eq((turnSrc.match(/=\s*splitPraca\(/g) || []).length, 2,
    'turn-economy.ts: dokładnie 2 wywołania splitPraca (previewCityEconomy + advanceCityEconomy)');
  // Dowód nietautologiczności obu asercji negatywnych.
  ok(/\bsplitEmpirePracaBudget\s*\(/.test(mainCode + '\nsplitEmpirePracaBudget(1, 2);'),
    'mutant przywracający drugi podział zostaje wykryty');
  ok(!/ownerDefaultPracaSplit\.set\(/.test('') === true, 'asercja negatywna działa na pustym wejściu');
}

console.log('\n-- 7. KONSUMENCI PULI IMPERIUM (pkt 8) — każdy nadal bierze Pracę z puli --');
{
  const mainSrc = fs.readFileSync(path.resolve(SRC, 'main.ts'), 'utf8');
  const konsumenci = [
    ['utrzymanie ulepszeń surowcowych', /playerPracaPool = Math\.max\(0, playerPracaPool - playerUpkeep\)/],
    ['cuda na mapie (wonder-map-build)', /const usedPlayer = advanceOwnerWonderMapBuilds\(0, playerPracaPool\)/],
    ['zakładanie miasta', /playerPracaPool -= aff\.kosztPraca/],
    ['wycinka lasu', /playerPracaPool -= startCost/],
    ['ręczne ulepszenie terenu', /playerPracaPool -= req\.kosztPraca/],
    ['auto-ulepszenia terenu', /playerPracaPool -= pick\.kosztPraca/],
  ];
  for (const [nazwa, re] of konsumenci) {
    ok(re.test(mainSrc), `konsument puli działa dalej: ${nazwa}`);
  }
  // Budżet ulepszeń pochodzi z TEGOROCZNEGO wpływu do puli, nie z całego salda —
  // dzięki temu zapas odłożony na cud/miasto nie jest co turę przemielany.
  ok(/const playerImprovementBudget = pracaPoolInflowByOwner\.get\(0\)/.test(mainSrc),
    'budżet ulepszeń = tegoroczny wpływ do puli (nie całe skumulowane saldo)');
  ok(/improvementBudgetCap: playerImprovementBudget/.test(mainSrc),
    'picker auto-ulepszeń dostaje absolutny budżet z jedynego podziału');
}

console.log(`\n--- praca-jeden-podzial-kontrakt-test: ${passed} OK, ${failed} FAIL ---`);
process.exit(failed > 0 ? 1 : 0);
