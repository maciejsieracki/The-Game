'use strict';
/**
 * break-treaties-status-test.cjs — R-WEB-BREAK-TREATIES-STATUS-Q1 (tag BREAKTREATIES, #169).
 * Run from gra/:  ESBUILD_PATH=/abs/path/node_modules/esbuild node tools/break-treaties-status-test.cjs
 * (lub: npm install w gra/, wtedy ESBUILD_PATH nie jest potrzebne)
 *
 * Pytanie badawcze: czy po wypowiedzeniu wojny (breakTreatiesOnWar i jego wywołania w main.ts)
 * relacja pary może zostać w statusie „sojusz” / z żywą umową sojuszu lub handlu?
 *
 * Pokrywa:
 *  A) czysta logika (diplomacy-treaties.ts, bundle esbuild): po treatiesBrokenByWar + removeTreatiesById
 *     para nie ma żadnej umowy z BREAK_ON_WAR, niezależnie od kolejności stron (addTreaty sortuje);
 *     umowy innej pary przeżywają. Zbiór BREAK_ON_WAR jest CZYTANY ZE ŹRÓDŁA (diplomacy-treaties.ts),
 *     nie przepisany ręcznie;
 *  B) mutacja kontrolna A: bez usunięcia umów (identity) inwariant A PADA (test nie jest pusty);
 *  C) main.ts (text-check; main.ts nie jest ładowalny w node): breakTreatiesOnWar ma dokładnie
 *     6 wystąpień w kodzie (liczone po wystąpieniach, nie po liniach); dla każdego wywołania
 *     w tej samej parze (a,b) następuje applyDiploEventTracked(a,b,…,'wojna_wypowiedziana')
 *     i setDiploRelation(a,b,…), a odczyt relacji jest po wywołaniu;
 *  D) main.ts: w ciele breakTreatiesOnWar: dokładnie `const brokenIds = treatiesBrokenByWar(activeDeals, a, b);`,
 *     potem dokładnie `activeDeals = removeTreatiesById(activeDeals, brokenIds);` i żadnego return
 *     (poza `if (!brokenIds.length) return;`) ani przepisania brokenIds PRZED usunięciem umów;
 *     wyjście `if (opts?.bezKary) return;` dopiero PO usunięciu;
 *  E) mutacje czerwone main.ts (in-memory): każda MUSI być wykryta przez C/D.
 */
const fs = require('fs');
const path = require('path');
let esbuild;
for (const p of [process.env.ESBUILD_PATH, path.resolve(__dirname, '..', 'node_modules', 'esbuild')]) {
  if (!p) continue;
  try { esbuild = require(p); break; } catch (e) { /* next */ }
}
if (!esbuild) { console.error('esbuild not found (npm install w gra/ lub ESBUILD_PATH)'); process.exit(1); }

const SRC = path.resolve(__dirname, '..', 'src');
const ENTRY = path.resolve(__dirname, '.break-treaties-status-entry.ts');
const OUT = path.resolve(__dirname, '.break-treaties-status-bundle.cjs');
fs.writeFileSync(ENTRY, `
export { treatiesBrokenByWar, removeTreatiesById, addTreaty, dealsForPair } from ${JSON.stringify(SRC + '/game/diplomacy-treaties')};
export { RodzajTraktatu } from ${JSON.stringify(SRC + '/types/diplomacy')};
`);
try {
  esbuild.buildSync({ entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: OUT, logLevel: 'silent' });
} catch (e) { console.error(e.message || e); process.exit(1); }
const B = require(OUT);
fs.unlinkSync(ENTRY); fs.unlinkSync(OUT);

let pass = 0, fail = 0;
function ok(c, m) { if (c) { pass++; } else { fail++; console.error('FAIL: ' + m); } }

const R = B.RodzajTraktatu;

// Zbiór BREAK_ON_WAR czytany ze źródła (nie przepisany ręcznie). Tokeny: RodzajTraktatu.X lub 'literal'.
const DT_SRC = fs.readFileSync(path.resolve(SRC, 'game', 'diplomacy-treaties.ts'), 'utf8');
const breakM = DT_SRC.match(/const BREAK_ON_WAR[^=]*=\s*new Set\(\[([\s\S]*?)\]\);/);
ok(!!breakM, 'źródło: nie znaleziono deklaracji BREAK_ON_WAR w diplomacy-treaties.ts');
const breakTokens = breakM ? breakM[1].split(',').map(s => s.trim()).filter(Boolean) : [];
ok(breakTokens.length >= 8, `źródło: BREAK_ON_WAR ma ${breakTokens.length} tokenów (oczekiwano >= 8)`);
const BREAK_KINDS = new Set(breakTokens.map(t => {
  const mm = t.match(/^RodzajTraktatu\.(\w+)$/);
  if (mm) {
    ok(R[mm[1]] !== undefined, `źródło: RodzajTraktatu.${mm[1]} nierozpoznany w types/diplomacy`);
    return R[mm[1]];
  }
  const ms = t.match(/^'([^']+)'$/);
  if (ms) return ms[1];
  ok(false, `źródło: nieznany format tokenu BREAK_ON_WAR: ${t}`);
  return undefined;
}));
ok(BREAK_KINDS.size === breakTokens.length, 'źródło: wszystkie tokeny BREAK_ON_WAR rozpoznane');

const deal = (id, rodzaj, a, b) => ({ id, rodzaj, strony: [a, b], wygasaTura: null, zawartaTura: 1 });

// Stan po wypowiedzeniu wojny = to, co zostaje po treatiesBrokenByWar + removeTreatiesById (jak w main.ts).
function afterWar(state, a, b) {
  const ids = B.treatiesBrokenByWar(state, a, b);
  return B.removeTreatiesById(state, ids);
}
function pairLiveBreakKinds(state, a, b) {
  return B.dealsForPair(state, a, b).filter(d => BREAK_KINDS.has(d.rodzaj));
}

// A) inwariant czystej logiki, obie kolejności stron (addTreaty normalizuje strony)
let st = [];
st = B.addTreaty(st, deal('sojusz-1-2', R.SojuszWojskowy, 2, 1));
st = B.addTreaty(st, deal('handel-1-2', R.UmowaHandlowa, 1, 2));
st = B.addTreaty(st, deal('nap-1-2', R.PaktNieagresji, 1, 2));
st = B.addTreaty(st, deal('sojusz-1-3', R.SojuszWojskowy, 1, 3));
st = B.addTreaty(st, deal('handel-4-5', R.UmowaHandlowa, 4, 5));
ok(B.dealsForPair(st, 2, 1).length === 3, 'A: addTreaty normalizuje strony (kolejność 2,1 widoczna dla dealsForPair)');
ok(B.treatiesBrokenByWar(st, 2, 1).length === 3, 'A: treatiesBrokenByWar(2,1) zwraca 3 umowy pary (sojusz+handel+NAP)');
ok(B.treatiesBrokenByWar(st, 1, 2).length === 3, 'A: treatiesBrokenByWar(1,2) == (2,1)');
const after = afterWar(st, 1, 2);
ok(pairLiveBreakKinds(after, 1, 2).length === 0, 'A: po wojnie brak żywych umów BREAK_ON_WAR pary 1–2');
ok(pairLiveBreakKinds(after, 2, 1).length === 0, 'A: po wojnie brak żywych umów pary 2–1 (kolejność)');
ok(after.some(d => d.id === 'sojusz-1-3'), 'A: sojusz innej pary (1–3) przeżywa wojnę 1–2');
ok(after.some(d => d.id === 'handel-4-5'), 'A: handel innej pary (4–5) przeżywa wojnę 1–2');
ok(B.treatiesBrokenByWar(st, 7, 8).length === 0, 'A: para bez umów = pusta lista zerwań');
ok(BREAK_KINDS.has(R.SojuszWojskowy) && BREAK_KINDS.has(R.UmowaHandlowa), 'A: sojusz i handel są w zbiorze zrywanych (ze źródła)');

// B) mutacja kontrolna: brak usunięcia umów MUSI łamać inwariant A (test nie jest pusty)
ok(pairLiveBreakKinds(st, 1, 2).length > 0, 'B: mutacja identity wykryta (żywe umowy pary zostają)');

// C) + D) main.ts text-checks
const MAIN_PATH = path.resolve(SRC, 'main.ts');
const mainSrc = fs.readFileSync(MAIN_PATH, 'utf8');
const EXPECTED_PROD_CALLS = 6;
const ALLOWED_BODY_RETURN = 'if (!brokenIds.length) return;';

function isCommentLine(line) {
  const t = line.trim();
  return t.startsWith('//') || t.startsWith('*') || t.startsWith('/*');
}
const stripWs = s => s.replace(/\s+/g, '');

// Zwraca listę problemów; pusta lista = OK.
function checkMain(src) {
  const problems = [];
  const lines = src.split('\n');

  // C1) liczba WYSTĄPIEŃ (nie linii) wywołań + argumenty pary każdego wywołania
  let occ = 0;
  const sites = [];
  lines.forEach((l, i) => {
    if (isCommentLine(l) || /function breakTreatiesOnWar\(/.test(l)) return;
    const n = (l.match(/breakTreatiesOnWar\(/g) || []).length;
    if (!n) return;
    occ += n;
    const re = /breakTreatiesOnWar\(([^,]+),([^,]+),/g;
    let m;
    let parsed = 0;
    while ((m = re.exec(l))) {
      parsed++;
      sites.push({ i, a: stripWs(m[1]), b: stripWs(m[2]) });
    }
    if (parsed !== n) problems.push(`linia ${i + 1}: nie da się odczytać pary argumentów wszystkich wywołań`);
  });
  if (occ !== EXPECTED_PROD_CALLS) {
    problems.push(`liczba wystąpień breakTreatiesOnWar = ${occ}, oczekiwano ${EXPECTED_PROD_CALLS} (nowe wywołanie wymaga przeglądu statusu)`);
  }

  // C2) dla każdego wywołania: zdarzenie wojny i ustawienie relacji dotyczą TEJ SAMEJ pary
  for (const s of sites) {
    const win = stripWs(lines.slice(s.i, s.i + 10).join('\n'));
    const A = s.a, B2 = s.b;
    if (!win.includes(`applyDiploEventTracked(${A},${B2},`)) {
      problems.push(`wywołanie w linii ${s.i + 1}: applyDiploEventTracked nie dotyczy pary (${A},${B2}) w 10 liniach po wywołaniu`);
    }
    if (!win.includes(`getDiploRelation(${A},${B2}),'wojna_wypowiedziana'`)) {
      problems.push(`wywołanie w linii ${s.i + 1}: zdarzenie 'wojna_wypowiedziana' nie jest zdarzeniem pary (${A},${B2})`);
    }
    if (!win.includes(`setDiploRelation(${A},${B2},`)) {
      problems.push(`wywołanie w linii ${s.i + 1}: setDiploRelation nie ustawia pary (${A},${B2}) w 10 liniach po wywołaniu`);
    }
    if (!win.includes('getDiploRelation(')) {
      problems.push(`wywołanie w linii ${s.i + 1}: brak odczytu relacji`);
    }
  }

  // D) kolejność i treść ciała breakTreatiesOnWar
  const start = src.indexOf('function breakTreatiesOnWar(');
  if (start < 0) { problems.push('brak definicji breakTreatiesOnWar'); return problems; }
  const endMarker = src.indexOf('\n    }\n', start);
  const bodyLines = src.slice(start, endMarker).split('\n');
  const find = pred => bodyLines.findIndex(l => pred(l.trim()));
  const iBroken = find(t => t === 'const brokenIds = treatiesBrokenByWar(activeDeals, a, b);');
  const iRemove = find(t => t === 'activeDeals = removeTreatiesById(activeDeals, brokenIds);');
  const iBezKary = find(t => t === 'if (opts?.bezKary) return;');
  const iEvent = find(t => t.includes('applyDiploEventTracked(a, b, cur, ev)'));
  if (iBroken < 0) problems.push('breakTreatiesOnWar: brak dokładnej deklaracji brokenIds z treatiesBrokenByWar(activeDeals, a, b)');
  if (iRemove < 0) problems.push('breakTreatiesOnWar: brak dokładnego usunięcia umów removeTreatiesById(activeDeals, brokenIds)');
  if (iBroken >= 0 && iRemove >= 0) {
    if (!(iBroken < iRemove)) problems.push('breakTreatiesOnWar: usunięcie umów przed deklaracją brokenIds');
    for (let k = 0; k < iRemove; k++) {
      const t = bodyLines[k].trim();
      if (t === ALLOWED_BODY_RETURN) continue;
      if (/\breturn\b/.test(t)) problems.push(`breakTreatiesOnWar: return przed usunięciem umów (wiersz ciała ${k + 1}: ${t})`);
      if (k > iBroken && /brokenIds\s*=|brokenIds\.(filter|splice|pop|shift|push|length\s*=)|\.\.\.brokenIds/.test(t)) {
        problems.push(`breakTreatiesOnWar: brokenIds zmieniane przed usunięciem umów (wiersz ciała ${k + 1})`);
      }
    }
  }
  if (iBezKary < 0) problems.push('breakTreatiesOnWar: brak wczesnego wyjścia bezKary');
  if (iRemove >= 0 && iBezKary >= 0 && !(iRemove < iBezKary)) problems.push('breakTreatiesOnWar: bezKary wyjście PRZED usunięciem umów');
  if (iBezKary >= 0 && iEvent >= 0 && !(iBezKary < iEvent)) problems.push('breakTreatiesOnWar: zdarzenie kary przed wyjściem bezKary');
  return problems;
}

const realProblems = checkMain(mainSrc);
ok(realProblems.length === 0, 'C/D: main.ts spełnia inwarianty statusu wojny: ' + realProblems.join(' | '));

// E) mutacje czerwone (in memory). Każda MUSI dać niepusty wykaz problemów.
function mustFail(label, mutated) {
  ok(mutated !== mainSrc, `E: mutacja „${label}” zastosowana (wzorzec istnieje)`);
  const p = checkMain(mutated);
  ok(p.length > 0, `E: mutacja „${label}” NIE została wykryta`);
}
// Mutacje ograniczone do ciała breakTreatiesOnWar (identyczne linie istnieją też w innych miejscach main.ts).
function mutateBreakFn(src, fn) {
  const start = src.indexOf('function breakTreatiesOnWar(');
  const end = src.indexOf('\n    }\n', start);
  if (start < 0 || end < 0) throw new Error('brak ciała breakTreatiesOnWar');
  return src.slice(0, start) + fn(src.slice(start, end)) + src.slice(end);
}
const REMOVE_LINE = 'activeDeals = removeTreatiesById(activeDeals, brokenIds);';

// M1: usunięcie removeTreatiesById w ciele
mustFail('usunięcie removeTreatiesById', mutateBreakFn(mainSrc, b => b.replace(REMOVE_LINE, '')));

// M2: brak statusu wojny po casus belli (zdarzenie 'pokoj' zamiast 'wojna_wypowiedziana')
mustFail('brak statusu wojny po casus belli', mainSrc.replace(
  "applyDiploEventTracked(declarer, victim, getDiploRelation(declarer, victim), 'wojna_wypowiedziana'),",
  "applyDiploEventTracked(declarer, victim, getDiploRelation(declarer, victim), 'pokoj'),",
));

// M3: gracz wypowiada wojnę bez statusu wojny
mustFail('brak statusu wojny przy wypowiedzeniu przez gracza', mainSrc.replace(
  "breakTreatiesOnWar(ME(), ownerId, true);\n      applyAllianceObligationsOnWar(ME(), ownerId);\n      setDiploRelation(\n        ME(),\n        ownerId,\n        applyDiploEventTracked(ME(), ownerId, getDiploRelation(ME(), ownerId), 'wojna_wypowiedziana'),",
  "breakTreatiesOnWar(ME(), ownerId, true);\n      applyAllianceObligationsOnWar(ME(), ownerId);\n      setDiploRelation(\n        ME(),\n        ownerId,\n        applyDiploEventTracked(ME(), ownerId, getDiploRelation(ME(), ownerId), 'pokoj'),",
));

// M4: bezKary wyjście przed usunięciem umów
mustFail('bezKary przed usunięciem umów', mutateBreakFn(mainSrc, b => b
  .replace('if (opts?.bezKary) return;\n', '')
  .replace(REMOVE_LINE, 'if (opts?.bezKary) return;\n      ' + REMOVE_LINE)));

// ME: return dla AI przed usunięciem umów (wczesne wyjście dla breakerIsPlayer=false)
mustFail('return dla AI przed usunięciem umów', mutateBreakFn(mainSrc, b => b
  .replace(REMOVE_LINE, 'if (!breakerIsPlayer) return;\n      ' + REMOVE_LINE)));

// MF: filtr wyrzucający sojusze z brokenIds przed usunięciem
mustFail('filtr sojuszy z brokenIds', mutateBreakFn(mainSrc, b => b
  .replace(REMOVE_LINE, 'activeDeals = removeTreatiesById(activeDeals, brokenIds.filter(id => !activeDeals.some(d => d.id === id && d.rodzaj === RodzajTraktatu.SojuszWojskowy)));')));

// MB: joinAllyToWar — zdarzenie wojny dla odwróconej pary (allyId,mustDeclareWarOn)
mustFail('odwrócona para w joinAllyToWar', mainSrc.replace(
  "applyDiploEventTracked(allyId, mustDeclareWarOn, getDiploRelation(allyId, mustDeclareWarOn), 'wojna_wypowiedziana')",
  "applyDiploEventTracked(mustDeclareWarOn, allyId, getDiploRelation(mustDeclareWarOn, allyId), 'wojna_wypowiedziana')",
));

// MD: dwa wywołania breakTreatiesOnWar w jednej linii (liczenie wystąpień, nie linii)
mustFail('dwa wywołania w jednej linii', mainSrc.replace(
  'breakTreatiesOnWar(ME(), ownerId, true);',
  'breakTreatiesOnWar(ME(), ownerId, true); breakTreatiesOnWar(ME(), ownerId, true);',
));

console.log(`break-treaties-status-test: PASS=${pass} FAIL=${fail}`);
process.exit(fail === 0 ? 0 : 1);
