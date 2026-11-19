'use strict';
/**
 * ai-ai-alliance-measure-hook-test.cjs -- R-WEB-AI-AI-ALLIANCES-E3-MEASURE-RUNNER-Q1: test haka odczytowego sojuszy AI↔AI.
 *
 * Test STATYCZNY (bez przeglądarki, bez bundla): sprawdza w gra/src/main.ts i gra/src/game/ai-ai-alliance-tick.ts, że:
 *  H1 hak `aiAiAllianceTickForTest.state` istnieje i wola aiAiAllianceMeasureState();
 *  H2 bramka tickAiAiAllianceRequests bez zmian (flaga = isAiAiAllianceTickEnabled);
 *  H3 wymuszenie wymaga ?civTest=1 (isCivTestEnabled) i flagi strony __civAiAllianceMeasureForce;
 *  H3b wymuszenie pomiaru ustawia nadpisanie przełącznika (setAiAiAllianceTickEnabledForTest) przy instalacji hooków civTest;
 *  H4 metrics().diag zawiera `sojusze: aiAiAllianceMeasureState()` (pole trafia do każdego wiersza jsonl);
 *  H5 planer liczy próby i odmowy (proby++ przed evaluate, odmowy++ przy accept=false) i zwraca je w wyniku;
 *  H6/H7 liczniki skumulowane w main.ts (aiAiAllianceProbyLacznie / OdmowyLacznie) są zasilane z planu.
 *  H8a/H8b liczenie sojuszy per cywilizacja (+1 na każdą stronę, tylko między owners);
 *  H9 liczenie wojen czyta diplomacyRelations.get (bez getDiploRelation, który tworzy relację).
 *  H10a-c histogram powodów odmów toru (planer -> skumulowany licznik -> diag.sojusze.powodyOdmow).
 *  H25 flaga `przestarzale` próby ostatniego kroku (tura kroku ≠ bieżąca tura gry) w hooku.
 *  H21-H24 pola odczytu próby w planerze (gotowość, Relacja, Zaufanie, wspólna granica, wspólny wróg) — dopasowanie tekstu.
 *  B1 (BEHAWIORALNY, esbuild z gra/node_modules): planer na znanych wejściach zwraca w probyDetale dokładnie
 *     wartości z pairInfo/sideOf (gotowość 0,7; Relacja 123; Zaufanie 45; respekt 33; siła 1,5; archetyp; flagi granicy,
 *     wspólnego wroga i sojusznika wroga). Mutant źródła tick, który zmienia tę wartość, MUSI czerwienić B1.
 * UWAGA: część H (mapowanie pomiar w main.ts, hak H18-H20) pozostaje STATYCZNA; zachowanie w grze potwierdza wyłącznie
 * bieg dymny (NIE ZMIERZONO w tym teście: brak przeglądarki i bundla gry).
 * Mutanty (kopia źródła w pamięci, NIE zapis na dysk): każdy usuwa/zamienia jedną z powyższych linii i MUSI czerwienić test.
 *
 * Wymaga Node + gra/node_modules (esbuild; `npm ci --ignore-scripts` w gra/). Exit 0 = wszystko zielone i mutanty wykryte.
 *   node tools/ai-ai-alliance-measure-hook-test.cjs
 */
const fs = require('fs');
const path = require('path');

const GRA_ROOT = path.resolve(__dirname, '..');
const MAIN = fs.readFileSync(path.resolve(GRA_ROOT, 'src', 'main.ts'), 'utf8');
const TICK = fs.readFileSync(path.resolve(GRA_ROOT, 'src', 'game', 'ai-ai-alliance-tick.ts'), 'utf8');

/** Reguły: [id, plik ('main'|'tick'), fragment, czego szukamy]. */
const CHECKS = [
  ['H1', 'main', 'state: (): ReturnType<typeof aiAiAllianceMeasureState> => aiAiAllianceMeasureState()'],
  ['H2', 'main', 'if (!isAiAiAllianceTickEnabled()) return;'],
  ['H3', 'main', 'return isCivTestEnabled(window.location.search) && (window as any).__civAiAllianceMeasureForce === true;'],
  ['H3b', 'main', 'if ((window as any).__civAiAllianceMeasureForce === true) setAiAiAllianceTickEnabledForTest(true);'],
  ['H4', 'main', 'sojusze: aiAiAllianceMeasureState(),'],
  ['H5a', 'tick', '    proby++;\n    const result = evaluate({'],
  ['H5b', 'tick', '    if (!result.accept) {\n      odmowy++;'],
  ['H5c', 'tick', 'return { accepted, treasuryPo: treasury, alliancesCountPo: counts, proby, odmowy, powodyOdmow, probyDetale };'],
  ['H10a', 'tick', "      powodyOdmow.set(powodKlucz, (powodyOdmow.get(powodKlucz) ?? 0) + 1);"],
  ['H10b', 'main', 'for (const [klucz, n] of plan.powodyOdmow) aiAiAllianceOdmowyPowody.set(klucz, (aiAiAllianceOdmowyPowody.get(klucz) ?? 0) + n);'],
  ['H10c', 'main', 'powodyOdmow: Array.from(aiAiAllianceOdmowyPowody.entries())'],
  ['H6', 'main', 'aiAiAllianceProbyLacznie += plan.proby;'],
  ['H7', 'main', 'aiAiAllianceOdmowyLacznie += plan.odmowy;'],
  ['H8a', 'main', 'if (ownerSet.has(a) && ownerSet.has(b)) {\n          liczba.set(a, (liczba.get(a) ?? 0) + 1);'],
  ['H8b', 'main', '          liczba.set(b, (liczba.get(b) ?? 0) + 1);\n        }'],
  ['H9', 'main', 'if (diplomacyRelations.get(`${owners[i]!}_${owners[j]!}`)?.status === \'wojna\') wojny++;'],
  // H11-H15 (runda obrony 2): pola zwracanego obiektu stanu muszą czytać realne liczniki/wyliczenia (nie stałe).
  ['H11', 'main', '        proby: aiAiAllianceProbyLacznie,'],
  ['H12', 'main', '        odmowy: aiAiAllianceOdmowyLacznie,'],
  ['H13', 'main', '        wojnyAiAi: wojny,'],
  ['H14', 'main', '        naCywilizacje: owners.map(oid => ({ owner: oid, n: liczba.get(oid) ?? 0 })),'],
  ['H15', 'main', '        sojuszeAiAi,\n        powodyOdmow:'],
  // H16-H20 (WILLINGNESS-MEASURE-Q1): dane próby (wejścia E1 + flagi) zapisywane z planera do haka, tylko odczyt.
  ['H16', 'tick', '    probyDetale.push({'],
  ['H17', 'tick', '      sojusznikWrogaCelu: sideT.allies.some(x => sideP.enemies.includes(x)),'],
  ['H18', 'main', 'aiAiAllianceOstatniaProby = { tura: turn, probki: plan.probyDetale };'],
  ['H19', 'main', 'pomiar: { respekt: rel.respekt, militaryRatio: dipCtx.militaryRatio, typ: String(aiOwnerCivMap.get(t) ?? \'\') },'],
  ['H20', 'main', 'probyOstatniaTura: aiAiAllianceOstatniaProby'],
  ['H25', 'main', 'przestarzale: aiAiAllianceOstatniaProby.tura !== turn,'],
  ['H21', 'tick', 'gotowosc: info.willingness,'],
  ['H22', 'tick', '      relacja: info.relacja,\n      zaufanie: info.zaufanie,\n      respekt: info.pomiar?.respekt ?? null,'],
  ['H23', 'tick', 'wspolnaGranica: info.sharesBorder,'],
  ['H24', 'tick', 'wspolnyWrog: sideP.enemies.some(x => sideT.enemies.includes(x)),'],
];

const esbuild = require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'));
const GAME_DIR = path.resolve(GRA_ROOT, 'src', 'game');

/** Buduje planer z tekstu źródła tick (esbuild, cjs) — ta sama ścieżka co ai-ai-alliance-tick-test. */
function loadPlanner(tickText) {
  const res = esbuild.buildSync({
    stdin: { contents: tickText, resolveDir: GAME_DIR, sourcefile: 'ai-ai-alliance-tick.ts', loader: 'ts' },
    bundle: true, format: 'cjs', platform: 'node', write: false, logLevel: 'silent',
  });
  const m = { exports: {} };
  new Function('module', 'exports', 'require', res.outputFiles[0].text)(m, m.exports, require);
  return m.exports;
}

/** B1: planer na znanych wejściach; zwraca nazwy pól probyDetale o wartości innej niż oczekiwana (pusta = zielono). */
function behaviorFails(tickText) {
  let M;
  try { M = loadPlanner(tickText); } catch (e) { return ['BUILD:' + String(e && e.message || e).slice(0, 60)]; }
  // Sojusznik proponenta (4) jest wrogiem celu (1) -> sojusznikWrogaProponenta musi być true (mutant na false czerwieni B1).
  const enemies = { 0: [2, 3], 1: [2, 4] };
  const allies = { 0: [4], 1: [3] };
  const r = M.planAiAiAllianceTickFull({
    turn: 8,
    owners: [0, 1],
    alliancesCount: new Map([[0, 0], [1, 0]]),
    pairPrefilter: () => true,
    pairInfo: () => ({
      hasAlliance: false, warStatus: 'pokoj', hasNap: false, sharesBorder: true,
      relacja: 123, zaufanie: 45, willingness: 0.7,
      pomiar: { respekt: 33, militaryRatio: 1.5, typ: 'zulus' },
    }),
    sideOf: (oid) => ({ power: 1000, treasuryGold: 0, allies: allies[oid] || [], enemies: enemies[oid] || [] }),
    treasury: new Map([[0, 500], [1, 500]]),
    evaluate: () => ({ accept: false, reason: 'test', paymentGold: 0, payer: null, parity: { S: 0, W: 0, D: 0, r: 1 } }),
  });
  const d = (r.probyDetale || []).find(x => x.proponent === 0 && x.cel === 1);
  if (!d) return ['brak-proby-0-1'];
  const oczekiwane = { gotowosc: 0.7, relacja: 123, zaufanie: 45, respekt: 33, militaryRatio: 1.5, typCelu: 'zulus',
    wspolnaGranica: true, wspolnyWrog: true, sojusznikWrogaCelu: true, sojusznikWrogaProponenta: true, accept: false };
  return Object.keys(oczekiwane).filter(k => d[k] !== oczekiwane[k]);
}


/** Mutanty: [id, plik, fragment do usunięcia/zamiany na pusty lub inny]. */
const MUTANTS = [
  ['M1 wymuszenie nie wlacza toru', 'main', 'if ((window as any).__civAiAllianceMeasureForce === true) setAiAiAllianceTickEnabledForTest(true);', ''],
  ['M2 brak pola sojusze w diag', 'main', 'sojusze: aiAiAllianceMeasureState(),', ''],
  ['M3 brak licznika odmów', 'tick', '      odmowy++;\n', ''],
  ['M4 brak licznika prób', 'tick', '    proby++;\n', ''],
  ['M5 liczenie per cywilizacja: +5 zamiast +1', 'main', 'liczba.set(a, (liczba.get(a) ?? 0) + 1);', 'liczba.set(a, (liczba.get(a) ?? 0) + 5);'],
  ['M5b brak liczenia per cywilizacja (strona b)', 'main', '          liczba.set(b, (liczba.get(b) ?? 0) + 1);', ''],
  ['M5c wojny przez getDiploRelation (mutacja)', 'main', 'if (diplomacyRelations.get(`${owners[i]!}_${owners[j]!}`)?.status === \'wojna\') wojny++;', 'if (getDiploRelation(owners[i]!, owners[j]!).status === \'wojna\') wojny++;'],
  ['M6 wymuszenie bez ?civTest', 'main', 'return isCivTestEnabled(window.location.search) && (window as any)', 'return (window as any)'],
  ['M7 bez zasilania licznika skumulowanego', 'main', 'aiAiAllianceOdmowyLacznie += plan.odmowy;', ''],
  ['M8 bez histogramu powodow w planerze', 'tick', "      powodyOdmow.set(powodKlucz, (powodyOdmow.get(powodKlucz) ?? 0) + 1);", ''],
  ['M9 bez zasilania histogramu skumulowanego', 'main', 'for (const [klucz, n] of plan.powodyOdmow) aiAiAllianceOdmowyPowody.set(klucz, (aiAiAllianceOdmowyPowody.get(klucz) ?? 0) + n);', ''],
  ['M10 proby w stanie = 0 (zerowanie licznika w odczycie)', 'main', '        proby: aiAiAllianceProbyLacznie,', '        proby: 0,'],
  ['M11 odmowy w stanie = 0', 'main', '        odmowy: aiAiAllianceOdmowyLacznie,', '        odmowy: 0,'],
  ['M12 wojnyAiAi w stanie = 0', 'main', '        wojnyAiAi: wojny,', '        wojnyAiAi: 0,'],
  ['M13 naCywilizacje zawsze zero', 'main', '        naCywilizacje: owners.map(oid => ({ owner: oid, n: liczba.get(oid) ?? 0 })),', '        naCywilizacje: owners.map(oid => ({ owner: oid, n: 0 })),'],
  ['M14 sojuszeAiAi w stanie = 0', 'main', '        sojuszeAiAi,\n        powodyOdmow:', '        sojuszeAiAi: 0,\n        powodyOdmow:'],
  ['M15 brak szczegółów prób w planerze', 'tick', '    probyDetale.push({', '    void ({'],
  ['M16 flaga sojusznika wroga zawsze false', 'tick', '      sojusznikWrogaCelu: sideT.allies.some(x => sideP.enemies.includes(x)),', '      sojusznikWrogaCelu: false,'],
  ['M17 brak zapisu ostatniego kroku w hooku', 'main', 'aiAiAllianceOstatniaProby = { tura: turn, probki: plan.probyDetale };', ''],
  ['M18 brak pomiaru respektu/siły w pairInfo', 'main', 'pomiar: { respekt: rel.respekt, militaryRatio: dipCtx.militaryRatio, typ: String(aiOwnerCivMap.get(t) ?? \'\') },', ''],
  ['M19 stan bez probyOstatniaTura', 'main', 'probyOstatniaTura: aiAiAllianceOstatniaProby', 'probyOstatniaTura: null'],
  // M20-M24: mutacje WARTOŚCI pól odczytu (dawniej przechodziły test statyczny) — wykrywa je B1 (behawioralny).
  ['M20 gotowość próby = 0', 'tick', 'gotowosc: info.willingness,', 'gotowosc: 0,'],
  ['M21 Relacja próby = 0', 'tick', '      relacja: info.relacja,\n      zaufanie: info.zaufanie,\n      respekt: info.pomiar?.respekt ?? null,', '      relacja: 0,\n      zaufanie: info.zaufanie,\n      respekt: info.pomiar?.respekt ?? null,'],
  ['M22 Zaufanie próby = 0', 'tick', '      relacja: info.relacja,\n      zaufanie: info.zaufanie,\n      respekt: info.pomiar?.respekt ?? null,', '      relacja: info.relacja,\n      zaufanie: 0,\n      respekt: info.pomiar?.respekt ?? null,'],
  ['M23 wspólna granica = false', 'tick', 'wspolnaGranica: info.sharesBorder,', 'wspolnaGranica: false,'],
  ['M24 wspólny wróg = false', 'tick', 'wspolnyWrog: sideP.enemies.some(x => sideT.enemies.includes(x)),', 'wspolnyWrog: false,'],
  ['M26 sojusznik wroga proponenta = false', 'tick', '      sojusznikWrogaProponenta: sideP.allies.some(x => sideT.enemies.includes(x)),', '      sojusznikWrogaProponenta: false,'],
  ['M25 przestarzałe zawsze false', 'main', 'przestarzale: aiAiAllianceOstatniaProby.tura !== turn,', 'przestarzale: false,'],
];

function src(kind, mainText, tickText) { return kind === 'main' ? mainText : tickText; }

/** Zwraca listę nazw nieprzechodzących reguł dla danych źródeł. */
function evaluate(mainText, tickText) {
  const failed = [];
  for (const [id, kind, frag] of CHECKS) {
    if (!src(kind, mainText, tickText).includes(frag)) failed.push(id);
  }
  return failed;
}

let fail = 0;
const ok = (c, msg) => { console.log((c ? 'PASS ' : 'FAIL ') + msg); if (!c) fail++; };

// 1) Stan rzeczywisty: wszystkie reguły zielone (statyczne) + B1 behawioralny na planerze.
const real = evaluate(MAIN, TICK);
ok(real.length === 0, `hak odczytowy: reguły H1..H25 zielone (nieprzechodzące: ${real.join(',') || 'brak'})`);
const realB = behaviorFails(TICK);
ok(realB.length === 0, `B1 behawioralny: probyDetale = wejścia (nieprzechodzące pola: ${realB.join(',') || 'brak'})`);

// 2) Domyślna flaga w danych pozostaje false (pomiar nie włącza toru w kodzie).
const params = JSON.parse(fs.readFileSync(path.resolve(GRA_ROOT, 'data', 'ai-ai-treaty-params.json'), 'utf8'));
ok(params.torSojuszyAktywny === false, 'torSojuszyAktywny w danych = false (flaga nie włączona w kodzie)');

// 3) Mutanty: każdy musi czerwienić test (a sam mutant musi zmienić źródło).
for (const [name, kind, frag, repl] of MUTANTS) {
  const text = kind === 'main' ? MAIN : TICK;
  if (!text.includes(frag)) { ok(false, `mutant ${name}: kotwica nieobecna w źródle`); continue; }
  const mutated = text.replace(frag, repl);
  const m = kind === 'main'
    ? evaluate(mutated, TICK)
    : evaluate(MAIN, mutated);
  // Mutant źródła tick: wykrywany także behawioralnie (B1) — to on łapie zmianę WARTOŚCI, nie tylko obecności tekstu.
  const b = kind === 'tick' ? behaviorFails(mutated) : [];
  ok(m.length > 0 || b.length > 0, `mutant ${name} wykryty (statyczne: ${m.join(',') || 'brak'}; B1: ${b.join(',') || 'brak'})`);
}

console.log(fail === 0 ? '\nWYNIK: ZIELONY' : `\nWYNIK: CZERWONY (${fail})`);
process.exit(fail === 0 ? 0 : 1);
