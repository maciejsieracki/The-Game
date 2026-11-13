'use strict';
/**
 * ai-losing-war-asks-peace-vs-player-test.cjs — R-WEB-AI-LOSING-WAR-ASKS-PEACE-VS-PLAYER-Q1.
 *
 * Zgloszenie wlasciciela (2026-11-08): przegrywajaca AI (Harappa, moc 3127 vs 46079, rw = 0.0635) nie prosi gracza
 * o pokoj. Przyczyna: decideAIDiplomacy dla rw <= ~0.15 i >= 3 miast emituje `oferuj_miasto_za_pokoj` i robi
 * `continue` (zastepuje trybut i zwykla propozycje pokoju), a lancuch dispatchu AI->gracz w main.ts (`else if (targetId === 0)`)
 * nie kierowal tej komendy na stol negocjacji -- komenda ginela po cichu.
 *
 * Test 1 (zachowanie ai.ts): scenariusz Harappy; AI emituje dokladnie jedna komende pokojowa wobec gracza
 *   (miasto / trybut / pokoj) w kazdym stanie wojny >= minTurWojny; tabela uzasadnia, ktore komendy MUSI obsluzyc main.ts.
 * Test 2 (mapowanie): aiCommandToPendingProposal(oferuj_miasto_za_pokoj) -> actionId 'pokoj' + giveItems miasto.
 * Test 3 (main.ts, zrodlo): kazda komenda pokojowa emitowana przez decideAIDiplomacy wobec gracza ma galaz w lancuchu
 *   dispatchu; mutant (usuniecie galezi miasta) musi byc wykryty.
 * Test 4 (regresja par): war-weariness AI<->AI (runWarWearinessTick) bez zmian -- tylko pary AI, plik nietkniety.
 *
 * Run: node tools/ai-losing-war-asks-peace-vs-player-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(GRA, 'src', '.ai-losing-war-peace-entry.ts');
const BUNDLE = path.resolve(__dirname, '.ai-losing-war-peace-bundle.cjs');
const MAIN_TS = path.resolve(GRA, 'src', 'main.ts');

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
}

/** Typy komend pokojowych AI->gracz, ktore musza miec galaz w lancuchu dispatchu main.ts. */
function dispatchCoverage(mainSrc, cmdTypes) {
  const anchor = mainSrc.indexOf("} else if (targetId === 0) {\n                      if (cmd.type === 'zaproponuj_pokoj') {");
  if (anchor < 0) return { anchorFound: false, missing: cmdTypes.slice() };
  const chain = mainSrc.slice(anchor, anchor + 4000);
  const missing = [];
  for (const t of cmdTypes) {
    const re = new RegExp("cmd\\.type === '" + t + "'[^{]*\\{\\s*(?://[^\\n]*\\n\\s*)*enqueueDiplomacyPendingFromCmd\\(ownerId, cmd\\)");
    if (!re.test(chain)) missing.push(t);
  }
  return { anchorFound: true, missing };
}

async function main() {
  fs.writeFileSync(ENTRY, [
    "export { decideAIDiplomacy } from './game/ai';",
    "export { TypCywilizacji } from './types/player';",
    "export { aiCommandToPendingProposal } from './game/diplomacy-proposals';",
    '',
  ].join('\n'), 'utf8');
  try {
    await esbuild.build({
      entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: BUNDLE,
      absWorkingDir: GRA, loader: { '.ts': 'ts', '.json': 'json' }, logLevel: 'silent',
    });
    const m = require(BUNDLE);

    // ---- Test 1: scenariusz Harappa (zrzut wlasciciela) ----
    const rw = 3127 / (3127 + 46079);
    check('rw scenariusza = 0.0635', Math.abs(rw - 0.0635) < 0.001, rw);
    const decide = (t, gold, nCities, extra) => {
      const miasta = Array.from({ length: nCities }, (_, i) => ({ cityId: 'c' + i, cityPn: 800, zakazane: i === 0 }));
      return m.decideAIDiplomacy({
        myPlayerId: '1', agresja: 0.5, currentTurn: t, myTypCywilizacji: m.TypCywilizacji.Harappa,
        skarbiecGold: gold, miastaAI: miasta,
        relacje: [Object.assign({
          partnerId: '0', relation: { zaufanie: 0, respekt: 29, status: 'wojna' }, respektWzgledny: rw, stanWojny: true,
          turnsAtWar: t, lostCitiesInWar: 0, turnsSinceCityChange: t, armyHealthShare: 0.9, peaceLocked: false,
        }, extra || {})],
      });
    };
    const PEACE_TYPES = new Set(['oferuj_miasto_za_pokoj', 'oferuj_trybut_za_pokoj', 'zaproponuj_pokoj']);
    const seenTypes = new Set();
    let everyStateHasOneCmd = true;
    const gaps = [];
    for (const t of [3, 8, 20, 60, 150]) {
      for (const gold of [0, 500]) {
        for (const nc of [2, 6]) {
          const cmds = decide(t, gold, nc).filter(c => c.targetId === '0');
          const peace = cmds.filter(c => PEACE_TYPES.has(c.type));
          peace.forEach(c => seenTypes.add(c.type));
          if (peace.length !== 1) { everyStateHasOneCmd = false; gaps.push({ t, gold, nc, n: peace.length }); }
        }
      }
    }
    check('(1) Harappa: w kazdym stanie wojny >= 3 tur AI emituje dokladnie 1 komende pokojowa wobec gracza', everyStateHasOneCmd, gaps);
    check('(1) Harappa z >= 3 miastami: komenda pokojowa to oferuj_miasto_za_pokoj (zastepuje trybut i pokoj)',
      decide(20, 500, 6).some(c => c.type === 'oferuj_miasto_za_pokoj')
      && !decide(20, 500, 6).some(c => c.type === 'oferuj_trybut_za_pokoj' || c.type === 'zaproponuj_pokoj'));
    check('(1) Harappa z 2 miastami i zlotem: trybut', decide(20, 500, 2).some(c => c.type === 'oferuj_trybut_za_pokoj'));
    check('(1) Harappa z 2 miastami bez zlota: zaproponuj_pokoj', decide(20, 0, 2).some(c => c.type === 'zaproponuj_pokoj'));
    check('(1) obserwowane typy komend obejmuja miasto, trybut i pokoj', seenTypes.size === 3, Array.from(seenTypes));

    // ---- Test 2: mapowanie komendy miasta na propozycje stolu ----
    const cityCmd = decide(20, 0, 6).find(c => c.type === 'oferuj_miasto_za_pokoj');
    const conv = m.aiCommandToPendingProposal(cityCmd, 1, 0, 20);
    check('(2) oferuj_miasto_za_pokoj -> actionId pokoj z giveItems miasto',
      !!conv && conv.actionId === 'pokoj' && conv.payload.giveItems && conv.payload.giveItems[0].typ === 'miasto', conv);

    // ---- Test 3: lancuch dispatchu w main.ts ----
    const mainSrc = fs.readFileSync(MAIN_TS, 'utf8');
    const types = Array.from(seenTypes);
    const cov = dispatchCoverage(mainSrc, types);
    check('(3) main.ts: kotwica lancucha dispatchu AI->gracz znaleziona', cov.anchorFound);
    check('(3) main.ts: kazda komenda pokojowa AI->gracz ma galaz enqueueDiplomacyPendingFromCmd', cov.missing.length === 0, cov.missing);
    // mutant: usuniecie galezi miasta musi byc wykryte
    const mutated = mainSrc.replace("cmd.type === 'oferuj_miasto_za_pokoj' || cmd.type === 'zada_miasto_za_pokoj'", "false");
    check('(3) mutant: usuniecie galezi miasta zmienia zrodlo', mutated !== mainSrc);
    const covMut = dispatchCoverage(mutated, types);
    check('(3) mutant: brak galezi miasta jest WYKRYTY przez test', covMut.missing.includes('oferuj_miasto_za_pokoj'), covMut);

    // ---- Test 4: war-weariness AI<->AI nietkniety ----
    const ww = fs.readFileSync(path.resolve(GRA, 'src', 'game', 'war-weariness.ts'), 'utf8');
    check('(4) war-weariness.ts: tick nadal tylko dla par AI (pairs: Pary AI<->AI)', /Pary AI↔AI aktualnie w wojnie/.test(ww));
  } finally {
    try { fs.unlinkSync(ENTRY); } catch (_) { /* ok */ }
    try { fs.unlinkSync(BUNDLE); } catch (_) { /* ok */ }
  }
  console.log('\nWYNIK: ' + pass + ' PASS / ' + fail + ' FAIL');
  process.exit(fail === 0 ? 0 : 1);
}

main().catch(e => { console.error(e); try { fs.unlinkSync(ENTRY); } catch (_) {} try { fs.unlinkSync(BUNDLE); } catch (_) {} process.exit(2); });
