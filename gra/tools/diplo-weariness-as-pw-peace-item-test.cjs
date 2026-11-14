'use strict';
/**
 * diplo-weariness-as-pw-peace-item-test.cjs -- R-WEB-DIPLO-WEARINESS-AS-PW-PEACE-ITEM-Q1.
 *
 *   (a) tabela z propozycji: C=500, tury wojny 10..16 bez strat -> Z = 0/14/56/125/222/347/500 (krzywa kwadratowa);
 *   (b) spojnosc tabela <-> decyzja AI: dla tur 10..20 i 3 mnoznikow ceny: bezwarunkowy koniec zmeczenia AI
 *       (wearinessUnconditionalEndDue) <=> R = C - Z = 0;
 *   (c) przy L >= progKoncaZmeczenia: Z = C, R = 0 (bilans 0, nie omija tabeli);
 *   (d) brak rabatu 60%: wearinessPeacePriceFactor nieobecny w src, rabatCenyPokojuMax nieobecny w JSON i TS;
 *   (e) wiazanie: diplomacy-proposals.ts liczy Z przez wearinessPeaceItemPw i odejmuje Z od wymaganej ceny (R = C - Z).
 */
const fs = require('fs');
const path = require('path');

const GRA_ROOT = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'));
const SRC = path.resolve(GRA_ROOT, 'src');
const J = (p) => JSON.stringify(path.join(SRC, p));
const ENTRY = path.resolve(__dirname, `.pwitem-${process.pid}-entry.ts`);
const BUNDLE = path.resolve(__dirname, `.pwitem-${process.pid}-bundle.cjs`);
fs.writeFileSync(ENTRY, `export * as W from ${J('game/war-weariness')};`, 'utf8');
try {
  esbuild.buildSync({
    entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: BUNDLE,
    absWorkingDir: GRA_ROOT, logLevel: 'silent', resolveExtensions: ['.ts', '.js', '.json'],
  });
} finally { try { fs.unlinkSync(ENTRY); } catch (e) { /* ignore */ } }
const W = require(BUNDLE).W;
try { fs.unlinkSync(BUNDLE); } catch (e) { /* ignore */ }

let pass = 0;
let fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL: ' + m); } };
const eq = (a, b, m) => ok(a === b, `${m} (got ${a}, want ${b})`);
const levelAt = (turns, lost = 0) => W.warWearinessLevel({ turnsAtWar: turns, lostCitiesTotal: lost });

// (a) tabela
const tabela = [0, 14, 56, 125, 222, 347, 500];
for (let t = 10; t <= 16; t++) {
  eq(W.wearinessPeaceItemPw(500, levelAt(t)), tabela[t - 10], `(a) tura ${t}: Z dla C=500`);
}

// (b) + (c) spojnosc
const mnozniki = [0.7, 1.0, 1.5];
const progKonca = W.WAR_WEARINESS_PARAMS.zmeczenie.progKoncaZmeczenia;
eq(progKonca, 0.8, '(f) progKoncaZmeczenia = 0,8');
for (const m of mnozniki) {
  const C = Math.round(500 * m);
  for (let t = 10; t <= 20; t++) {
    const L = levelAt(t);
    const Z = W.wearinessPeaceItemPw(C, L);
    const R = Math.max(0, C - Z);
    const bezwarunkowy = W.wearinessUnconditionalEndDue(L);
    ok(bezwarunkowy === (R === 0), `(b) m=${m} tura ${t}: bezwarunkowy=${bezwarunkowy} ale R=${R}`);
    if (L >= progKonca) {
      eq(Z, C, `(c) m=${m} tura ${t}: przy L>=0,8 Z=C`);
      eq(R, 0, `(c) m=${m} tura ${t}: przy L>=0,8 R=0 (bilans 0)`);
    }
  }
}

// (d) brak rabatu 60%
const wwSrc = fs.readFileSync(path.join(SRC, 'game/war-weariness.ts'), 'utf8');
const paramsSrc = fs.readFileSync(path.join(GRA_ROOT, 'data/war-weariness-params.json'), 'utf8');
ok(!/wearinessPeacePriceFactor/.test(wwSrc), '(d) funkcja rabatu wearinessPeacePriceFactor usunieta');
ok(!/"rabatCenyPokojuMax"\s*:/.test(paramsSrc) && !/rabatCenyPokojuMax\s*:/.test(wwSrc), '(d) klucz rabatCenyPokojuMax nieobecny w JSON i typie TS');

// (e) wiazanie w diplomacy-proposals.ts i ai.ts
const propSrc = fs.readFileSync(path.join(SRC, 'game/diplomacy-proposals.ts'), 'utf8');
ok(/wearinessPeaceItemPw\(cenaPokojuPn, wearyLevel\)/.test(propSrc), '(e) bramka R5 liczy Z przez wearinessPeaceItemPw');
ok(/basePn = Math\.max\(0, cenaPokojuPn - wearyPwItem\)/.test(propSrc), '(e) wymagana cena = C - Z (reszta do miasta)');
const aiSrc = fs.readFileSync(path.join(SRC, 'game/ai.ts'), 'utf8');
ok(/wearinessUnconditionalEndDue\(wearyLevel\)/.test(aiSrc) && /return wearinessPeaceX\(level, P\) >= 1;/.test(fs.readFileSync(path.join(SRC, 'game/war-weariness.ts'), 'utf8')), '(b) ai.ts: bezwarunkowy pokoj wiazany z wearinessUnconditionalEndDue = wearinessPeaceX(L) >= 1 (ta sama funkcja x co tabela PW)');

console.log(`diplo-weariness-as-pw-peace-item-test: PASS=${pass} FAIL=${fail}`);
process.exit(fail ? 1 : 0);
