'use strict';
/**
 * endgate-lever-baseline-test.cjs — R-WEB-ENDGATE-RATION-LEVER-Q1 (tag ENDGATELEVER).
 *
 * Dźwignia „obniżka racji żywności” (suwak-zywnosc) w bramce „Zakończ turę” mierzy zysk spichlerza
 * po wyzerowaniu racji. Automat (Dodatek 3: najpierw automat, potem gracz) już obniża racje do limitu
 * Spichlerza, a jego zysk siedzi w `_nnsAutoSpichlerzDelta`. Baza pomiaru dźwigni MUSI więc być
 * prognozą PO reakcji automatu — inaczej ten sam zysk liczy się dwa razy i komunikat obiecuje
 * obniżkę, której suwak (zablokowany na limicie) nie wykona.
 *
 * Test wiązania (main.ts — nie da się zaimportować, więc sprawdzamy kod źródłowy):
 *  (a) przypisanie _nnsRacjeZysk odejmuje od fZero prognozę PO automacie (forecast + _nnsAutoSpichlerzDelta),
 *  (b) stara baza (bez korekty automatu) NIE występuje już w przypisaniu,
 *  (c) korekta używa ?? 0 (brak reakcji automatu = baza bez zmian),
 *  (d) wywołanie dźwigni nadal trafia do bramki jako suwakZywnosc (kontrakt c2-testu).
 *  (e) funkcja bramki decideEndTurnGate: dźwignia racji o zysku 0 NIE pojawia się w liście dźwigni.
 *
 * Mutacja: cofnięcie poprawki (stara baza) musi czerwienić (a)/(b).
 * Run: node tools/endgate-lever-baseline-test.cjs
 */
const fs = require('fs');
const path = require('path');

const GRA_ROOT = path.resolve(__dirname, '..');
const MAIN = path.resolve(GRA_ROOT, 'src', 'main.ts');
const src = fs.readFileSync(MAIN, 'utf8');

let pass = 0;
let fail = 0;
function ok(cond, name) {
  if (cond) { pass++; } else { fail++; console.log('FAIL: ' + name); }
}

const przypisanie = src.split('\n').find(l => l.includes('_nnsRacjeZysk = Math.max(0, fZero.spichlerzPo'));

// (a) baza = prognoza po automacie
ok(!!przypisanie && /fZero\.spichlerzPo\s*-\s*\(\s*_nnsHumanForecast\.spichlerzPo\s*\+\s*\(\s*_nnsAutoSpichlerzDelta\s*\?\?\s*0\s*\)\s*\)/.test(przypisanie || ''),
  '(a) _nnsRacjeZysk mierzy od prognozy PO automacie (forecast + _nnsAutoSpichlerzDelta ?? 0)');

// (b) stara baza nie występuje
ok(!/_nnsRacjeZysk\s*=\s*Math\.max\(0,\s*fZero\.spichlerzPo\s*-\s*_nnsHumanForecast\.spichlerzPo\)/.test(src),
  '(b) stara baza bez korekty automatu usunięta');

// (c) ?? 0 jest w wyrażeniu (brak automatu = baza bez zmian) — sprawdzone w (a)
ok(/_nnsAutoSpichlerzDelta\s*\?\?\s*0/.test(przypisanie || ''), '(c) brak reakcji automatu = baza bez zmian (?? 0)');

// (d) kontrakt: dźwignia trafia do bramki jako suwakZywnosc
ok(/suwakZywnosc:\s*_nnsRacjeZysk/.test(src), '(d) _nnsRacjeZysk przekazywane do bramki jako suwakZywnosc');

// (e) zysk 0 nie tworzy dźwigni w bramce — zachowanie decideEndTurnGate (esbuild bundle)
try {
  const esbuild = require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'));
  const ENTRY = path.resolve(__dirname, '.endgate-lever-baseline-entry.ts');
  const BUNDLE = path.resolve(__dirname, '.endgate-lever-baseline-bundle.cjs');
  fs.writeFileSync(ENTRY, "export { decideEndTurnGate } from '../src/game/no-negative-stocks';\n", 'utf8');
  esbuild.buildSync({ entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', outfile: BUNDLE, logLevel: 'silent' });
  const M = require(BUNDLE);
  const proj = (sp) => ({ turn: 16, skarbiecObecny: 50, skarbiecPo: 50, spichlerzObecny: 0, spichlerzPo: sp });
  // Po automacie spichlerz -6, dźwignia racji 0 → nie ma jej w liście dźwigni.
  const g = M.decideEndTurnGate(proj(-6), 0, 0, { suwakZywnosc: 0 });
  ok(!g.dzwignie.some(d => d.id === 'suwak-zywnosc'), '(e) zysk racji 0 nie tworzy dźwigni suwak-zywnosc');
  fs.rmSync(ENTRY, { force: true });
  fs.rmSync(BUNDLE, { force: true });
} catch (err) {
  ok(false, '(e) bundle bramki: ' + (err && err.message));
}

console.log(`endgate-lever-baseline-test: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
