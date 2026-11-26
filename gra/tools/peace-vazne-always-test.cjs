'use strict';
/**
 * peace-vazne-always-test.cjs -- R-WEB-UI-DIPLO-PEACE-CONCLUDED-VAZNE-ALWAYS-Q1.
 * Decyzja wlasciciela 2026-11-18 (wariant A): kazdy pokoj z udzialem gracza zostawia dokladnie JEDEN wpis
 * „Wazne” (warEventLog) z nazwa cywilizacji; pokoj AI<->AI bez gracza nie dodaje wpisu.
 *
 * Czesc BEHAWIORALNA: realna funkcja logPeaceVazne z main.ts (wyciagnieta z zrodla, przetranspilowana TS->JS,
 * uruchomiona na atrapach ME/warEventLog/turn). Sprawdza: gracz w parze -> 1 wpis; AI<->AI -> 0 wpisow;
 * powtorne wolanie w tej samej turze dla tej pary -> nadal 1 wpis (brak duplikatow).
 *
 * Czesc STATYCZNA (wiring 4 sciezek zawarcia pokoju z graczem): w main.ts kazda sciezka z pokojem gracza
 * wola logPeaceVazne albo zapisuje wpis o tym samym zdarzeniu (forced-peace-, truce-peace-):
 *   (P1) oferta gracza przyjeta przez AI (applyProposalOutcome, cywAction 'pokoj'),
 *   (P2) oferta AI przyjeta przez gracza ze stolu/inboxa (resolvePendingDiplomacy, zaproponuj_pokoj),
 *   (P3) pokoj wymuszony 100% zmeczenia (forced-peace-<tura>-<para>),
 *   (P4) koniec rozejmu -> pokoj (truce-peace-<tura>-<para>) oraz odpowiedz gracza na oferte konca rozejmu (P2).
 *   (P5) rozmowa gracz<->gracz (respondToHumanProposal, zaproponuj_pokoj) -> logPeaceVazne.
 *
 * Mutacja: kopia zrodla bez wpisu w sciezce P2 i P5 -> test musi czerwiec.
 *
 *   node tools/peace-vazne-always-test.cjs   # exit 0 = wszystko zielone i mutanty wykryte
 */
const fs = require('fs');
const path = require('path');

const GRA_ROOT = path.resolve(__dirname, '..');
const MAIN = path.join(GRA_ROOT, 'src', 'main.ts');

function loadTs() {
  const candidates = [
    path.join(GRA_ROOT, 'node_modules', 'typescript'),
    '/opt/node22/lib/node_modules/typescript',
  ];
  for (const c of candidates) {
    try { return require(c); } catch (_) { /* next */ }
  }
  throw new Error('brak typescript (npm i w gra/)');
}
const ts = loadTs();

/** Wyciaga zrodlo funkcji `function NAME(` z tekstu (ze zbalansowanymi nawiasami). */
function extractFunction(src, name) {
  const start = src.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`brak funkcji ${name}`);
  const open = src.indexOf('{', src.indexOf(')', start));
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) return src.slice(start, i + 1); }
  }
  throw new Error(`niedomkniety ${name}`);
}

/** Zwraca tresc bloku `if (<cond>) { ... }` (pierwsze wystapienie po podanym markerze). */
function blockAfter(src, marker) {
  const at = src.indexOf(marker);
  if (at < 0) return null;
  const open = src.indexOf('{', at);
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) return src.slice(open, i + 1); }
  }
  return null;
}

let failures = 0;
const ok = (cond, msg) => {
  if (cond) console.log(`  OK  ${msg}`);
  else { failures++; console.log(`  FAIL ${msg}`); }
};

// ---------- Czesc behawioralna: logPeaceVazne ----------
function behaviour(src) {
  const js = ts.transpileModule(extractFunction(src, 'logPeaceVazne'), {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
  }).outputText;
  const fnSrc = js.replace(/^\s*"use strict";?/m, '').trim();
  const state = { turn: 7, me: 0, warEventLog: [] };
  const labels = { 1: 'Alfa', 2: 'Beta', 3: 'Gamma' };
  // `turn` jest wolne w logPeaceVazne: podajemy je przez obiekt z getterem (with, tryb sloppy).
  const factory = new Function(
    'ME', 'diploPairKey', 'ownerDiploLabel', 'warEventLog', 'trimWarEventLog', 'scope',
    `with (scope) { return (${fnSrc.replace(/^function logPeaceVazne/, 'function')}); }`,
  );
  const scope = { get turn() { return state.turn; } };
  const logPeaceVazne = factory(
    () => state.me,
    (a, b) => `${Math.min(a, b)}-${Math.max(a, b)}`,
    (id) => labels[id],
    state.warEventLog,
    () => {},
    scope,
  );
  return { logPeaceVazne, state };
}

console.log('[1] logPeaceVazne (zachowanie)');
{
  const src = fs.readFileSync(MAIN, 'utf8');
  const { logPeaceVazne, state } = behaviour(src);
  logPeaceVazne(0, 1, 'Pokój zawarty: ', 'test gracz-AI');
  ok(state.warEventLog.length === 1, 'para gracz<->AI: 1 wpis');
  ok(state.warEventLog[0].title === 'Pokój zawarty: Alfa', 'tytul z nazwa cywilizacji (bez surowego ID)');
  logPeaceVazne(1, 0, 'Pokój zawarty: ', 'ta sama para w odwrotnej kolejnosci');
  ok(state.warEventLog.length === 1, 'powtorka tej samej pary w tej turze: nadal 1 wpis (dedup)');
  logPeaceVazne(1, 2, 'Pokój zawarty: ', 'AI<->AI');
  ok(state.warEventLog.length === 1, 'para AI<->AI (bez gracza): 0 nowych wpisow');
  state.turn = 8;
  logPeaceVazne(0, 2, 'Pokój zawarty: ', 'kolejna tura');
  ok(state.warEventLog.length === 2, 'ta sama para w nowej turze: nowy wpis');
}

// ---------- Czesc statyczna: wiring sciezek P1-P5 ----------
function wiring(src) {
  const problems = [];
  // P1: applyProposalOutcomeImpl, cywAction 'pokoj'
  const p1 = blockAfter(src, "} else if (cywAction === 'pokoj') {");
  if (!p1 || !/logPeaceVazne\(\s*proposerId\s*,\s*responderId/.test(p1)) problems.push('P1 oferta gracza przyjeta przez AI bez logPeaceVazne');
  // P2: resolvePendingDiplomacy, zaproponuj_pokoj
  const p2 = blockAfter(src, "if (p.cmdType === 'zaproponuj_pokoj') {\n          // PEACEVAZNE");
  if (!p2 || !/logPeaceVazne\(\s*ME\(\)\s*,\s*p\.ownerId/.test(p2)) problems.push('P2 oferta AI przyjeta przez gracza bez logPeaceVazne');
  // P3: wymuszony pokoj 100%
  // (sprawdzane jest, ze warunek deduplikacji i unshift stoja bezposrednio za evId, wiec usuniecie wpisu lub zamiana warunku na `false` czerwieni test)
  // (po PEACEVAZNE: jedyny wpis pokoju wymuszonego = logPeaceVazne w acceptPendingForcedPeace; bez osobnego wpisu forced-peace-<tura>)
  const p3 = blockAfter(src, 'function acceptPendingForcedPeace(): void {');
  if (!p3 || !/logPeaceVazne\(\s*p\.loser\s*,\s*p\.winner/.test(p3)) problems.push('P3 akceptacja pokoju wymuszonego bez logPeaceVazne');
  if (/forced-peace-\$\{turn\}/.test(src)) problems.push('P3 zduplikowany wpis forced-peace-<tura>');
  // P4: koniec rozejmu -> pokoj (finalizePeace z truce-peace)
  if (!/const evId = `truce-peace-\$\{turn\}-\$\{diploPairKey\(proposerId, responderId\)\}`;\s*if \(!warEventLog\.some\(e => e\.id === evId\)\) \{\s*warEventLog\.unshift\(/.test(src)) problems.push('P4 brak wpisu truce-peace');
  // P5: rozmowa gracz<->gracz
  const p5 = blockAfter(src, "if (p.cmd.type === 'zaproponuj_pokoj') {\n        // P21c");
  if (!p5 || !/logPeaceVazne\(\s*p\.fromOwnerId\s*,\s*p\.toOwnerId/.test(p5)) problems.push('P5 rozmowa gracz<->gracz bez logPeaceVazne');
  // Bramka gracza w logPeaceVazne (AI<->AI bez wpisu) i dedup po id
  const lp = extractFunction(src, 'logPeaceVazne');
  if (!/if \(a !== ME\(\) && b !== ME\(\)\) return;/.test(lp)) problems.push('logPeaceVazne bez bramki gracza');
  if (!/warEventLog\.some\(e => e\.id === evId\)\) return;/.test(lp)) problems.push('logPeaceVazne bez deduplikacji');
  return problems;
}

console.log('[2] wiring sciezek pokoju z graczem (P1-P5)');
const mainSrc = fs.readFileSync(MAIN, 'utf8');
const wiringProblems = wiring(mainSrc);
ok(wiringProblems.length === 0, `realny main.ts: wszystkie sciezki pokryte${wiringProblems.length ? ' — ' + wiringProblems.join('; ') : ''}`);

console.log('[3] mutacje (kopia zrodla) -> test musi wykryc');
const mutants = [
  {
    name: 'M1 usuniety wpis P2 (oferta AI przyjeta przez gracza)',
    from: "            logPeaceVazne(\n              ME(), p.ownerId, 'Pokój zawarty: ',",
    to: "            void(\n              ME(), p.ownerId, 'Pokój zawarty: ',",
  },
  {
    name: 'M2 usuniety wpis P5 (rozmowa gracz<->gracz)',
    from: "        logPeaceVazne(p.fromOwnerId, p.toOwnerId, 'Pokój zawarty: ', 'Propozycja pokoju przyjęta w rozmowie dyplomatycznej');",
    to: "        void(p.fromOwnerId, p.toOwnerId, 'Pokój zawarty: ', 'Propozycja pokoju przyjęta w rozmowie dyplomatycznej');",
  },
  {
    name: 'M3 usuniety wpis P3 (akceptacja pokoju wymuszonego bez logPeaceVazne)',
    from: "      logPeaceVazne(p.loser, p.winner, 'Pokój zawarty: ',",
    to: "      void(p.loser, p.winner, 'Pokój zawarty: ',",
  },
  {
    name: 'M4 usuniety wpis P1 (oferta gracza przyjeta przez AI)',
    from: "logPeaceVazne(proposerId, responderId, 'Pokój zawarty: ', 'Propozycja pokoju przyjęta przez stronę (wpis stołu)');",
    to: "void(proposerId, responderId, 'Pokój zawarty: ', 'Propozycja pokoju przyjęta przez stronę (wpis stołu)');",
  },
  {
    name: 'M5 usuniety wpis P4 (koniec rozejmu -> pokoj: warunek -> false)',
    from: "            if (!warEventLog.some(e => e.id === evId)) {\n              warEventLog.unshift({\n                id: evId, icon: '⚔', title: 'Rozejm przeszedł w pokój: '",
    to: "            if (false) {\n              warEventLog.unshift({\n                id: evId, icon: '⚔', title: 'Rozejm przeszedł w pokój: '",
  },
];
for (const m of mutants) {
  if (!mainSrc.includes(m.from)) {
    failures++;
    console.log(`  FAIL ${m.name}: fragment nie istnieje w main.ts (mutant nieprzeprowadzony)`);
    continue;
  }
  const copy = mainSrc.replace(m.from, m.to);
  const probs = wiring(copy);
  ok(probs.length > 0, `${m.name} wykryty`);
}

console.log(failures === 0 ? 'WYNIK: ZIELONE' : `WYNIK: CZERWONE (${failures})`);
process.exit(failures === 0 ? 0 : 1);
