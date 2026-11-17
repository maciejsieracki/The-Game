'use strict';
/**
 * diplo-weariness-as-pw-peace-item-test.cjs -- historycznie R-WEB-DIPLO-WEARINESS-AS-PW-PEACE-ITEM-Q1 (pozycja Z = round(C x x^2)).
 * R-WEB-DIPLO-PEACE-PRICE-DECAY-WITH-WEARINESS-Q1 (DR-2, decyzja wlasciciela 2026-11-17): pozycja Z i krzywa kwadratowa ZOSTALY USUNIETE;
 * test pilnuje ich NIEOBECNOSCI i JEDNEJ ceny pokoju wearinessPeaceCashPn(L) = round(6000 x (1 - L)) w kodzie produkcyjnym:
 *   (a) tabela ceny: L = 0 / 0,25 / 0,5 / 0,75 / 1,0 -> 6000 / 4500 / 3000 / 1500 / 0 (z funkcji, nie z pamieci);
 *   (b) monotonicznosc: cena nie rosnie z poziomem zmeczenia (tury 0..40); poziom clampowany do 0..1;
 *   (c) pokoj wymuszony = level >= progWymuszonyPokoj (1,0); 80% (progKoncaZmeczenia) NIE daje pokoju bezwarunkowego;
 *   (d) brak rabatu 60% (wearinessPeacePriceFactor, rabatCenyPokojuMax); brak funkcji Z i X;
 *   (e) wiazanie: diplomacy-proposals.ts i main.ts licza cene WYLACZNIE przez wearinessPeaceCashPn (bez odejmowania Z).
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

// (a) tabela ceny z funkcji
const tabela = [[0, 6000], [0.25, 4500], [0.5, 3000], [0.75, 1500], [1, 0]];
for (const [L, cena] of tabela) eq(W.wearinessPeaceCashPn(L), cena, `(a) L=${L}: cena`);
eq(W.wearinessPeaceCashPn(-1), 6000, '(a) poziom ujemny clampowany do 0');
eq(W.wearinessPeaceCashPn(5), 0, '(a) poziom > 1 clampowany do 1');

// (b) monotonicznosc po turach 0..40
let prev = Infinity;
let mono = true;
for (let t = 0; t <= 40; t++) { const c = W.wearinessPeaceCashPn(levelAt(t)); if (c > prev) mono = false; prev = c; }
ok(mono, '(b) cena pokoju nie rosnie z turami wojny (0..40)');
eq(W.wearinessPeaceCashPn(levelAt(40)), 0, '(b) tura 40 (L=1): cena 0');
ok(W.wearinessPeaceCashPn(levelAt(0)) > W.wearinessPeaceCashPn(levelAt(20)), '(b) tura 0 drozsza niz tura 20');

// (c) prog wymuszenia
const progKonca = W.WAR_WEARINESS_PARAMS.zmeczenie.progKoncaZmeczenia;
eq(progKonca, 0.8, '(c) progKoncaZmeczenia = 0,8 (skala widoku, nie pokoj bezwarunkowy)');
for (let t = 20; t <= 40; t++) {
  const L = levelAt(t);
  ok(W.wearinessForcedPeaceDue(L) === (L >= 1), `(c) tura ${t}: wymuszony=${W.wearinessForcedPeaceDue(L)} przy L=${L}`);
}

// (d) brak rabatu 60%, Z i X usuniete
const wwSrc = fs.readFileSync(path.join(SRC, 'game/war-weariness.ts'), 'utf8');
const paramsSrc = fs.readFileSync(path.join(GRA_ROOT, 'data/war-weariness-params.json'), 'utf8');
ok(!/wearinessPeacePriceFactor/.test(wwSrc), '(d) funkcja rabatu wearinessPeacePriceFactor usunieta');
ok(!/"rabatCenyPokojuMax"\s*:/.test(paramsSrc) && !/rabatCenyPokojuMax\s*:/.test(wwSrc), '(d) klucz rabatCenyPokojuMax nieobecny w JSON i typie TS');
ok(W.wearinessPeaceItemPw === undefined && W.wearinessPeaceX === undefined, '(d) funkcje Z (wearinessPeaceItemPw) i X (wearinessPeaceX) usuniete');

// (e) wiazanie w diplomacy-proposals.ts i ai.ts
const propSrc = fs.readFileSync(path.join(SRC, 'game/diplomacy-proposals.ts'), 'utf8');
ok(/const cenaPokojuPn = basePnCfg \* r5Gate\.priceMultiplier > 0 \? wearinessPeaceCashPn\(wearyLevel\) : 0;/.test(propSrc), '(e) bramka R5 liczy cene przez wearinessPeaceCashPn');
ok(/basePn = cenaWymaganaPn;/.test(propSrc) && !/wearinessPeaceItemPw/.test(propSrc), '(e) wymagana cena = cena pokoju (bez odejmowania Z)');
const aiSrc = fs.readFileSync(path.join(SRC, 'game/ai.ts'), 'utf8');
ok(!/wearinessUnconditionalEndDue/.test(aiSrc) && !/wearinessUnconditionalEndDue/.test(wwSrc), '(c) brak pokoju bezwarunkowego przy 80%');
ok(/wearinessForcedPeaceDue/.test(wwSrc) && /return level >= P\.zmeczenie\.progWymuszonyPokoj;/.test(wwSrc), '(c) war-weariness.ts: pokoj wymuszony = level >= progWymuszonyPokoj');

console.log(`diplo-weariness-as-pw-peace-item-test: PASS=${pass} FAIL=${fail}`);
process.exit(fail ? 1 : 0);
