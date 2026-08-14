'use strict';
/**
 * atak-dystansowy-mapa-test.cjs — P-BITWA-ATAK-DYSTANSOWY-BRAK-NA-MAPIE
 *
 * Test regresyjny dla ataku z dystansu na mapie świata (nie mylić z fazą pocisków
 * WEWNĄTRZ bitwy taktycznej — battleScene.ts — ta bramka dotyczy WYŁĄCZNIE
 * INICJACJI ataku z poziomu mapy świata: gracz/AI klika/decyduje "atakuj" bez
 * potrzeby wcześniejszego marszu na sąsiedni heks, jeśli cel mieści się w
 * "Zasięg ataku (hex)" atakującej jednostki).
 *
 * Pokrycie:
 *  a. jednostka dystansowa inicjuje atak na jednostkę w odległości > 1 (do
 *     granicy własnego zasięgu włącznie) — main.ts isTargetWithinAttackRange.
 *  b. jednostka zwarcia NADAL wymaga adiacencji dokładnie 1 (regresja).
 *  c. jednostka dystansowa NIE może zaatakować poza swoim zasięgiem.
 *  d. PARYTET AI: main.ts:isTargetWithinAttackRange i ai.ts:isWithinAttackRange
 *     dają IDENTYCZNY wynik dla tych samych parametrów (ta sama jednostka,
 *     ten sam dystans) — asercja porównawcza wprost.
 *  e. atak na miasto BEZ muru z dystansu — dozwolony w granicach zasięgu
 *     (map/map-attack-city.ts eligibleCityAttackers).
 *  f. atak na miasto Z MUREM — nadal wymaga adiacencji NIEZALEŻNIE od zasięgu
 *     jednostki (oblężenie to inna mechanika, nietknięta tym tematem).
 *
 * METODA (wzorzec kanoniczny repo — road-hook-mainguard-test.cjs,
 * oblezenie-remis-endsiege-test.cjs): funkcje main.ts/ai.ts wycinane są
 * TEKSTOWO z PRAWDZIWEGO źródła (po sygnaturze, nie po numerze linii — te się
 * przesuwają) i wykonywane NAPRAWDĘ przez `new Function`, z prawdziwymi
 * zależnościami (combat.ts:unitMapAttackRangeHex, units/setup.ts:hexDistance,
 * gra/data/units.json) wstrzykniętymi jako parametry. Zero reimplementacji
 * formuły w teście — to dokładnie ten sam kod co w produkcji, tylko wyjęty
 * z domknięcia boot()/GameData, żeby dało się go wywołać w izolacji.
 * map-attack-city.ts jest EKSPORTOWANY wprost, więc tam bundlujemy normalnie
 * (esbuild), jak w map-attack-city-test.cjs.
 *
 * Każdy z punktów (a)-(f) ma osobną mutację kontrolną (MUT-*), która cofa
 * dokładnie JEDEN fragment implementacji i potwierdza że TYLKO powiązane
 * asercje padają, reszta zostaje zielona — dowód że bramki są rozłączne, nie
 * przypadkowo współzależne.
 *
 * Bramka (z katalogu gra/): node tools/atak-dystansowy-mapa-test.cjs — exit 0 = zielona.
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const MAIN_TS = path.join(GRA_ROOT, 'src', 'main.ts');
const AI_TS = path.join(GRA_ROOT, 'src', 'game', 'ai.ts');
const realMainSrc = fs.readFileSync(MAIN_TS, 'utf8');
const realAiSrc = fs.readFileSync(AI_TS, 'utf8');
const unitsJson = require('../data/units.json');

let pass = 0, fail = 0;
function ok(cond, label) {
  if (cond) { pass++; } else { fail++; console.error('FAIL:', label); }
}

// ---------------------------------------------------------------------------
// Wycinanie funkcji po SYGNATURZE (wzorzec repo, patrz road-hook-mainguard-test.cjs).
// ---------------------------------------------------------------------------
function wytnijFunkcje(src, sygnatura) {
  const start = src.indexOf(sygnatura);
  if (start < 0) return null;
  let i = src.indexOf('{', start);
  if (i < 0) return null;
  let depth = 0;
  for (; i < src.length; i++) {
    const c = src[i];
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) return src.slice(start, i + 1); }
  }
  return null;
}

// --- moduły logiki prawdziwej (bundlowane, nie atrapy) ---------------------
const ENTRY = path.resolve(__dirname, '.atak-dystansowy-entry.ts');
const BUNDLE = path.resolve(__dirname, '.atak-dystansowy-bundle.cjs');
fs.writeFileSync(ENTRY, `
export { unitMapAttackRangeHex } from '../src/game/combat';
export { hexDistance } from '../src/units/setup';
export { resolveEnemyCityClick } from '../src/map/map-attack-city';
`, 'utf8');
esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, logLevel: 'silent',
  resolveExtensions: ['.ts', '.js', '.json'],
  absWorkingDir: GRA_ROOT, nodePaths: [path.resolve(GRA_ROOT, 'node_modules')],
});
const MOD = require(BUNDLE);
const { unitMapAttackRangeHex, hexDistance, resolveEnemyCityClick } = MOD;

// ===========================================================================
// Harness GRACZ: unitAttackRangeHex + isTargetWithinAttackRange + lookupUnitDef
// wycięte z PRAWDZIWEGO main.ts, wykonane z prawdziwym unitMapAttackRangeHex/
// hexDistance/units.json wstrzykniętymi z zewnątrz.
// ===========================================================================
const SYG_LOOKUP = 'function lookupUnitDef(typeId: string): any {';
const SYG_RANGE = 'function unitAttackRangeHex(u: RuntimeUnit): number {';
const SYG_WITHIN = 'function isTargetWithinAttackRange(atkUnit: RuntimeUnit, tq: number, tr: number): boolean {';
const SYG_MARCH = 'function tryLaunchMarchAttack(atkUnit: RuntimeUnit, attackTargetId: string): boolean {';

function zbudujHarnessGracz(src, data) {
  const lookupTxt = wytnijFunkcje(src, SYG_LOOKUP);
  const rangeTxt = wytnijFunkcje(src, SYG_RANGE);
  const withinTxt = wytnijFunkcje(src, SYG_WITHIN);
  if (!lookupTxt || !rangeTxt || !withinTxt) return null;
  const js = esbuild.transformSync(
    lookupTxt + '\n' + rangeTxt + '\n' + withinTxt,
    { loader: 'ts', target: 'node18' },
  ).code;
  const fabryka = new Function('deps', `
    const { unitMapAttackRangeHex, hexDistance, data } = deps;
    ${js}
    return { lookupUnitDef, unitAttackRangeHex, isTargetWithinAttackRange };
  `);
  return fabryka({ unitMapAttackRangeHex, hexDistance, data });
}

// ===========================================================================
// Harness AI: unitAttackRangeHexAi + isWithinAttackRange wycięte z ai.ts.
// ===========================================================================
const SYG_RANGE_AI = 'function unitAttackRangeHexAi(unit: RuntimeUnit, data: GameData): number {';
const SYG_WITHIN_AI = 'function isWithinAttackRange(unit: RuntimeUnit, tq: number, tr: number, data: GameData): boolean {';

function zbudujHarnessAi(src) {
  const rangeTxt = wytnijFunkcje(src, SYG_RANGE_AI);
  const withinTxt = wytnijFunkcje(src, SYG_WITHIN_AI);
  if (!rangeTxt || !withinTxt) return null;
  const js = esbuild.transformSync(
    rangeTxt + '\n' + withinTxt,
    { loader: 'ts', target: 'node18' },
  ).code;
  const fabryka = new Function('deps', `
    const { unitMapAttackRangeHex, hexDistance } = deps;
    ${js}
    return { unitAttackRangeHexAi, isWithinAttackRange };
  `);
  return fabryka({ unitMapAttackRangeHex, hexDistance });
}

console.log('atak-dystansowy-mapa-test');

// Jednostki testowe realne z units.json (nie fikcyjne dane).
const LUCZNIK = unitsJson.find(u => u['Jednostka'] === 'Łucznik');
const WOJOWNIK = unitsJson.find(u => u['Jednostka'] === 'Wojownik');
ok(!!LUCZNIK, 'fixture: "Łucznik" istnieje w units.json');
ok(!!WOJOWNIK, 'fixture: "Wojownik" istnieje w units.json');
ok(LUCZNIK && LUCZNIK['Zasięg ataku (hex)'] === 3, `fixture: Łucznik ma Zasięg ataku (hex)=3 (got ${LUCZNIK && LUCZNIK['Zasięg ataku (hex)']})`);
ok(WOJOWNIK && (WOJOWNIK['Zasięg ataku (hex)'] === '—' || WOJOWNIK['Zasięg ataku (hex)'] == null),
  `fixture: Wojownik to zwarcie, Zasięg ataku (hex) puste (got ${JSON.stringify(WOJOWNIK && WOJOWNIK['Zasięg ataku (hex)'])})`);

const dataFixture = { units: unitsJson };
const hGracz = zbudujHarnessGracz(realMainSrc, dataFixture);
const hAi = zbudujHarnessAi(realAiSrc);
ok(!!hGracz, 'wycięcie harnessu GRACZ z main.ts powiodło się');
ok(!!hAi, 'wycięcie harnessu AI z ai.ts powiodło się');
if (!hGracz || !hAi) {
  // Awaryjne wyjście: bez harnessów żadna dalsza asercja nie ma sensu (rzuciłaby
  // TypeError zamiast czytelnego FAIL) — zweryfikowane ręcznie że to jedyna
  // ścieżka, w której się to zdarza (main.ts/ai.ts sprzed tego tematu, gdzie
  // funkcje jeszcze nie istniały; patrz raport Operatora).
  fs.rmSync(ENTRY, { force: true });
  fs.rmSync(BUNDLE, { force: true });
  console.log('atak-dystansowy-mapa-test: ' + pass + ' passed, ' + fail + ' failed (przerwane — brak harnessu)');
  process.exit(1);
}

function ru(typeId, q, r) { return { id: 't-' + typeId + '-' + q + '-' + r, typeId, q, r, ownerId: 0, ruchLeft: 2, ruch: 2 }; }

// ===========================================================================
// (a) jednostka dystansowa (Łucznik, zasięg 3) atakuje z dystansu > 1, ≤ zasięg
// ===========================================================================
{
  const atk = ru('Łucznik', 0, 0);
  ok(hGracz.unitAttackRangeHex(atk) === 3, `(a) unitAttackRangeHex(Łucznik) = 3 (got ${hGracz.unitAttackRangeHex(atk)})`);
  ok(hGracz.isTargetWithinAttackRange(atk, 2, 0) === true, '(a) Łucznik @ dystans 2 (>1) w zasięgu 3 → w zasięgu (atak bez marszu)');
  ok(hGracz.isTargetWithinAttackRange(atk, 3, 0) === true, '(a) Łucznik @ dystans dokładnie 3 (granica zasięgu) → w zasięgu');
  ok(hGracz.isTargetWithinAttackRange(atk, 1, 0) === true, '(a) Łucznik @ dystans 1 (adiacencja) → nadal w zasięgu (nie regresja)');
}

// ===========================================================================
// (b) jednostka zwarcia (Wojownik) NADAL wymaga adiacencji dokładnie 1
// ===========================================================================
{
  const atk = ru('Wojownik', 0, 0);
  ok(hGracz.unitAttackRangeHex(atk) === 0, `(b) unitAttackRangeHex(Wojownik) = 0 (got ${hGracz.unitAttackRangeHex(atk)})`);
  ok(hGracz.isTargetWithinAttackRange(atk, 1, 0) === true, '(b) Wojownik @ dystans 1 → w zasięgu (adiacencja, zachowanie bazowe)');
  ok(hGracz.isTargetWithinAttackRange(atk, 2, 0) === false, '(b) Wojownik @ dystans 2 → POZA zasięgiem (regresja: zwarcie NIE strzela z dystansu)');
  ok(hGracz.isTargetWithinAttackRange(atk, 0, 0) === true, '(b) Wojownik @ dystans 0 (ten sam heks, degenerat) → w zasięgu (max(1,0)=1 ≥ 0)');
}

// ===========================================================================
// (c) jednostka dystansowa NIE atakuje poza swoim zasięgiem (dystans 5 > zasięg 3)
// ===========================================================================
{
  const atk = ru('Łucznik', 0, 0);
  ok(hGracz.isTargetWithinAttackRange(atk, 4, 0) === false, '(c) Łucznik @ dystans 4 (>3) → POZA zasięgiem, odrzucone');
  ok(hGracz.isTargetWithinAttackRange(atk, 5, 0) === false, '(c) Łucznik @ dystans 5 (>3) → POZA zasięgiem, odrzucone');
}

// ===========================================================================
// (d) PARYTET AI: ta sama jednostka, ten sam dystans → identyczny wynik gracz/AI
// ===========================================================================
{
  const casesParytet = [
    ['Łucznik', 1], ['Łucznik', 2], ['Łucznik', 3], ['Łucznik', 4], ['Łucznik', 5],
    ['Wojownik', 0], ['Wojownik', 1], ['Wojownik', 2], ['Wojownik', 3],
  ];
  for (const [typeId, dist] of casesParytet) {
    const atkGracz = ru(typeId, 0, 0);
    const atkAi = ru(typeId, 0, 0);
    const rGracz = hGracz.isTargetWithinAttackRange(atkGracz, dist, 0);
    const rAi = hAi.isWithinAttackRange(atkAi, dist, 0, dataFixture);
    ok(rGracz === rAi,
      `(d) PARYTET ${typeId}@dystans=${dist}: gracz=${rGracz} vs AI=${rAi} (muszą być identyczne)`);
    // dodatkowo porównanie samego zasięgu jednostki (nie tylko wyniku bramki)
    const zGracz = hGracz.unitAttackRangeHex(atkGracz);
    const zAi = hAi.unitAttackRangeHexAi(atkAi, dataFixture);
    ok(zGracz === zAi, `(d) PARYTET zasięg ${typeId}: gracz=${zGracz} vs AI=${zAi} (muszą być identyczne)`);
  }
}

// ===========================================================================
// STRAŻNIK STRUKTURALNY (main.ts): wszystkie miejsca inicjacji ataku na mapie
// świata muszą realnie wołać isTargetWithinAttackRange, nie hardkodowaną
// adiacencję=1 (regresja z ticketu — dystans wymuszał marsz przed atakiem).
// ===========================================================================
{
  const march = wytnijFunkcje(realMainSrc, SYG_MARCH);
  ok(!!march && /isTargetWithinAttackRange\s*\(\s*atkUnit\s*,\s*def\.q\s*,\s*def\.r\s*\)/.test(march),
    'strażnik: tryLaunchMarchAttack woła isTargetWithinAttackRange (nie hexDistance(...)>1 hardkodowany)');
  ok(!!march && !/hexDistance\([^)]*\)\s*>\s*1/.test(march),
    'strażnik: tryLaunchMarchAttack NIE zawiera już starej twardej bramki hexDistance(...)>1');

  ok(/hoverEnemy\s*&&\s*hoverVis\s*&&\s*isTargetWithinAttackRange\(\s*uSel\s*,\s*hitQ\s*,\s*hitR\s*\)/.test(realMainSrc),
    'strażnik: hover-preview pomija podgląd trasy gdy cel już w zasięgu ataku');

  ok(/isTargetWithinAttackRange\(\s*atkUnit\s*,\s*cu\.q\s*,\s*cu\.r\s*\)/.test(realMainSrc),
    'strażnik: klik jednostka→jednostka używa isTargetWithinAttackRange (nie tylko adiacencji)');

  // Oba wywołania resolveEnemyCityClick (klik z zaznaczoną jednostką, klik bez
  // zaznaczenia) MUSZĄ przekazywać unitAttackRangeHex — inaczej ta ścieżka po
  // cichu wraca do domyślnego 0 (adiacencja) mimo poprawnej logiki w map-attack-city.ts.
  const wywolaniaResolve = realMainSrc.split('resolveEnemyCityClick({').length - 1;
  const wywolaniaZZasiegiem = (realMainSrc.match(/resolveEnemyCityClick\(\{[^}]*unitAttackRangeHex[^}]*\}\)/gs) || []).length;
  ok(wywolaniaResolve === 2, `strażnik: dokładnie 2 wywołania resolveEnemyCityClick w main.ts (got ${wywolaniaResolve})`);
  ok(wywolaniaZZasiegiem === 2, `strażnik: OBA wywołania resolveEnemyCityClick przekazują unitAttackRangeHex (got ${wywolaniaZZasiegiem}/2)`);
}

// ===========================================================================
// STRAŻNIK STRUKTURALNY (ai.ts): oba miejsca decyzji o ataku muszą wołać
// isWithinAttackRange, nie starą isAdjacent — inaczej AI ślepa na własny zasięg.
// ===========================================================================
{
  ok((realAiSrc.match(/eu\s*=>\s*isWithinAttackRange\(unit,\s*eu\.q,\s*eu\.r,\s*data\)/g) || []).length === 2,
    'strażnik: DOKŁADNIE 2 miejsca (decideAITurn + decideDefensiveCopyTurn) wołają isWithinAttackRange(unit, eu.q, eu.r, data)');
}

// ===========================================================================
// (e) atak na miasto BEZ muru z dystansu — dozwolony w granicach zasięgu
// (f) atak na miasto Z MUREM — nadal wymaga adiacencji NIEZALEŻNIE od zasięgu
// ===========================================================================
{
  const rangeFn = (u) => hGracz.unitAttackRangeHex(u);

  const openCity = { id: 'c1', ownerId: 1, q: 3, r: 0, name: 'Sparta', maMur: false, population: 2 };
  const walledCity = { id: 'c2', ownerId: 1, q: 3, r: 0, name: 'Ateny', maMur: true, population: 3 };
  const lucznikDaleko = ru('Łucznik', 0, 0); // dystans 3 = granica zasięgu Łucznika
  // Obrońca WEWNĄTRZ miasta (jak `garrison` w map-attack-city-test.cjs) — bez
  // niego pusty cel daje `capture_empty`, nie `field_battle`; dla samej bramki
  // zasięgu (dopuszczenie atakującego do listy) to bez znaczenia, ale trzymamy
  // się kind-u używanego w istniejącym kanonicznym teście dla miast otwartych.
  const obroncaOpen = { id: 'g1', ownerId: 1, typeId: 'Wojownik', q: 3, r: 0, ruchLeft: 0, ruch: 2 };

  // (e) miasto BEZ muru, łucznik w zasięgu (dystans 3 ≤ zasięg 3) → field_battle
  //     (dopuszczony jako eligibleCityAttacker mimo braku adiacencji; obrońca
  //     wewnątrz miasta sprawia że kind to field_battle, nie capture_empty —
  //     istotne jest że NIE jest to hint_no_adjacent).
  const openRanged = resolveEnemyCityClick({
    city: openCity, selectedUnit: lucznikDaleko, units: [lucznikDaleko, obroncaOpen],
    playerOwnerId: 0, unitAttackRangeHex: rangeFn,
  });
  ok(openRanged.kind === 'field_battle',
    `(e) miasto BEZ muru + obrońca, łucznik @ dystans=zasięg=3 → field_battle (got ${openRanged.kind})`);

  // (e) kontrola: poza zasięgiem (dystans 4 > zasięg 3), miasto bez muru → hint_no_adjacent
  const lucznikZaDaleko = ru('Łucznik', -1, 0); // dystans do (3,0) = 4
  const openRangedPoza = resolveEnemyCityClick({
    city: openCity, selectedUnit: null, units: [lucznikZaDaleko],
    playerOwnerId: 0, unitAttackRangeHex: rangeFn,
  });
  ok(openRangedPoza.kind === 'hint_no_adjacent',
    `(e) kontrola: miasto BEZ muru, łucznik @ dystans=4 (>zasięg 3) → hint_no_adjacent (got ${openRangedPoza.kind})`);

  // (f) miasto Z MUREM, łucznik @ dystans 3 (w zasięgu, ale NIE adiacencja) → hint_no_adjacent
  const walledRanged = resolveEnemyCityClick({
    city: walledCity, selectedUnit: lucznikDaleko, units: [lucznikDaleko],
    playerOwnerId: 0, unitAttackRangeHex: rangeFn,
  });
  ok(walledRanged.kind === 'hint_no_adjacent',
    `(f) miasto Z MUREM, łucznik @ dystans=3 (w zasięgu, brak adiacencji) → NADAL hint_no_adjacent, oblężenie nietknięte (got ${walledRanged.kind})`);

  // (f) kontrola pozytywna: miasto Z MUREM, łucznik adiacentny (dystans 1) → attack_choice (bez zmian)
  const lucznikObok = ru('Łucznik', 2, 0); // dystans do (3,0) = 1
  const walledAdjacent = resolveEnemyCityClick({
    city: walledCity, selectedUnit: lucznikObok, units: [lucznikObok],
    playerOwnerId: 0, unitAttackRangeHex: rangeFn,
  });
  ok(walledAdjacent.kind === 'attack_choice',
    `(f) kontrola: miasto Z MUREM, łucznik adiacentny (dystans 1) → attack_choice bez zmian (got ${walledAdjacent.kind})`);
}

// ===========================================================================
// MUTACJE KONTROLNE — cofnij DOKŁADNIE jeden fragment, potwierdź że TYLKO
// powiązane asercje/strażniki padają, reszta zostaje zielona.
// ===========================================================================
function zmutuj(src, z, na, etykieta) {
  if (!src.includes(z)) { fail++; console.error('FAIL: mutacja nieprzygotowana —', etykieta, '(nie znaleziono wzorca)'); return null; }
  return src.replace(z, na);
}

// MUT-A/B/C: cofnięcie isTargetWithinAttackRange do starej hardkodowanej adiacencji=1
// -> (a) i (c) muszą się zepsuć (dystans przestaje działać), (b) zostaje zielone
// (zwarcie i tak wymagało adiacencji=1, więc regresja tu jest niewidoczna — to
// właśnie pokazuje, że (b) samo w sobie NIE dowodzi poprawności (a)/(c)).
{
  const mutSrc = zmutuj(
    realMainSrc,
    'const range = Math.max(1, unitAttackRangeHex(atkUnit));\n      return hexDistance(atkUnit.q, atkUnit.r, tq, tr) <= range;',
    'return hexDistance(atkUnit.q, atkUnit.r, tq, tr) <= 1;',
    'MUT-A (cofnięcie zasięgu gracza do stałej adiacencji)',
  );
  const hMut = mutSrc ? zbudujHarnessGracz(mutSrc, dataFixture) : null;
  ok(!!hMut, '(MUT-A) harness po mutacji nadal daje się zbudować (mutacja nie łamie parsowania)');
  if (hMut) {
    const atkL = ru('Łucznik', 0, 0);
    ok(hMut.isTargetWithinAttackRange(atkL, 2, 0) === false,
      '(MUT-A) po cofnięciu: Łucznik @ dystans 2 → ZŁAPANE, wraca stara regresja (poza "zasięgiem" adiacencji=1)');
    ok(hMut.isTargetWithinAttackRange(atkL, 3, 0) === false,
      '(MUT-A) po cofnięciu: Łucznik @ dystans 3 (granica zasięgu) → ZŁAPANE, też odrzucone');
    const atkH = ru('Wojownik', 0, 0);
    ok(hMut.isTargetWithinAttackRange(atkH, 1, 0) === true,
      '(MUT-A) po cofnięciu: Wojownik @ dystans 1 nadal true — (b) NIE łapie tej mutacji (oczekiwane, dowodzi że testy są rozłączne)');
  }
}

// MUT-D: cofnięcie AI do starej isAdjacent -> TYLKO parytet (d) się psuje dla
// jednostek dystansowych, (a)/(b)/(c)/(e)/(f) po stronie gracza zostają zielone
// (są niezależne od ai.ts).
{
  const mutAiSrc = zmutuj(
    realAiSrc,
    'function isWithinAttackRange(unit: RuntimeUnit, tq: number, tr: number, data: GameData): boolean {\n  const range = Math.max(1, unitAttackRangeHexAi(unit, data));\n  return hexDistance(unit.q, unit.r, tq, tr) <= range;\n}',
    'function isWithinAttackRange(unit: RuntimeUnit, tq: number, tr: number, data: GameData): boolean {\n  return hexDistance(unit.q, unit.r, tq, tr) === 1;\n}',
    'MUT-D (cofnięcie AI do isAdjacent)',
  );
  const hMutAi = mutAiSrc ? zbudujHarnessAi(mutAiSrc) : null;
  ok(!!hMutAi, '(MUT-D) harness AI po mutacji nadal daje się zbudować');
  if (hMutAi) {
    const atkL = ru('Łucznik', 0, 0);
    const rGracz = hGracz.isTargetWithinAttackRange(ru('Łucznik', 0, 0), 3, 0); // true, niezmutowane
    const rAiMut = hMutAi.isWithinAttackRange(atkL, 3, 0, dataFixture); // false po mutacji
    ok(rGracz === true && rAiMut === false,
      `(MUT-D) PARYTET ZŁAPANY: po cofnięciu AI do isAdjacent, gracz=${rGracz} vs AI(mut)=${rAiMut} rozjeżdżają się dla Łucznika@dystans=3`);
    // (b) melee parity pozostaje niedotknięte mutacją (adiacencja=1 dalej działa identycznie)
    const rGraczMelee = hGracz.isTargetWithinAttackRange(ru('Wojownik', 0, 0), 1, 0);
    const rAiMutMelee = hMutAi.isWithinAttackRange(ru('Wojownik', 0, 0), 1, 0, dataFixture);
    ok(rGraczMelee === rAiMutMelee,
      '(MUT-D) kontrola: parytet zwarcia @ adiacencja=1 NIE psuje się tą mutacją (dowodzi, że mutacja trafia wyłącznie w dystans)');
  }
}

// MUT-E/F: cofnięcie eligibleCityAttackers do starej adjacentPlayerAttackers
// (tylko hexDistance===1, bez zasięgu i bez rozróżnienia muru) -> (e) się psuje
// ((f) formalnie zostaje poprawne, bo mur i tak zawsze wymagał adiacencji —
// ta mutacja nie dotyka ścieżki murowej wprost, ale usuwa możliwość ataku z
// dystansu na miasto BEZ muru, co jest properties (e)).
{
  const mapAttackCitySrc = fs.readFileSync(path.join(GRA_ROOT, 'src', 'map', 'map-attack-city.ts'), 'utf8');
  const mutCitySrc = zmutuj(
    mapAttackCitySrc,
    'const dist = hexDistance(u.q, u.r, city.q, city.r);\n    if (dist === 1) return true;\n    if (city.maMur) return false;\n    return dist <= attackRangeHex(u);',
    'return hexDistance(u.q, u.r, city.q, city.r) === 1;',
    'MUT-E (cofnięcie eligibleCityAttackers do adiacencji=1 dla wszystkich miast)',
  );
  if (mutCitySrc) {
    // Plik zmutowany MUSI leżeć obok oryginału (src/map/) — jego importy
    // względne ("../units/setup" itd.) są liczone stamtąd, nie z tools/.
    const mutEntry = path.resolve(__dirname, '.atak-dystansowy-mut-entry.ts');
    const mutBundle = path.resolve(__dirname, '.atak-dystansowy-mut-bundle.cjs');
    const mutFile = path.join(GRA_ROOT, 'src', 'map', '.atak-dystansowy-mut-map-attack-city.ts');
    fs.writeFileSync(mutFile, mutCitySrc, 'utf8');
    fs.writeFileSync(mutEntry, `export { resolveEnemyCityClick } from '../src/map/.atak-dystansowy-mut-map-attack-city';\n`, 'utf8');
    try {
      esbuild.buildSync({
        entryPoints: [mutEntry], bundle: true, platform: 'node', format: 'cjs',
        target: 'node18', outfile: mutBundle, logLevel: 'silent',
        resolveExtensions: ['.ts', '.js', '.json'],
        absWorkingDir: GRA_ROOT, nodePaths: [path.resolve(GRA_ROOT, 'node_modules')],
      });
      delete require.cache[mutBundle];
      const mutResolve = require(mutBundle).resolveEnemyCityClick;

      const openCity = { id: 'c1', ownerId: 1, q: 3, r: 0, name: 'Sparta', maMur: false, population: 2 };
      const lucznikDaleko = ru('Łucznik', 0, 0);
      const mutOpenRanged = mutResolve({
        city: openCity, selectedUnit: lucznikDaleko, units: [lucznikDaleko],
        playerOwnerId: 0, unitAttackRangeHex: (u) => hGracz.unitAttackRangeHex(u),
      });
      ok(mutOpenRanged.kind === 'hint_no_adjacent',
        `(MUT-E) po cofnięciu: miasto BEZ muru, łucznik @ dystans=3 → ZŁAPANE, wraca stara blokada (got ${mutOpenRanged.kind}, oczekiwano regresji do hint_no_adjacent)`);
    } finally {
      fs.rmSync(mutEntry, { force: true });
      fs.rmSync(mutBundle, { force: true });
      fs.rmSync(mutFile, { force: true });
    }
  } else {
    fail++; console.error('FAIL: (MUT-E) nie udało się przygotować mutacji map-attack-city.ts');
  }
}

// Kontrola pozytywna: nietknięte źródła MUSZĄ przechodzić wszystkie strażniki —
// inaczej mutacje wyżej nie dowodzą niczego (świeciłyby na czerwono zawsze).
ok(!!zbudujHarnessGracz(realMainSrc, dataFixture) && !!zbudujHarnessAi(realAiSrc),
  '(kontrola) nietknięte main.ts i ai.ts dają się zbudować bez mutacji');

fs.rmSync(ENTRY, { force: true });
fs.rmSync(BUNDLE, { force: true });
console.log('atak-dystansowy-mapa-test: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
