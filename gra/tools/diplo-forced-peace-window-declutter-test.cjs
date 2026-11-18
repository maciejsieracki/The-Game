'use strict';
/**
 * diplo-forced-peace-window-declutter-test.cjs -- R-WEB-UI-DIPLO-FORCED-PEACE-WINDOW-DECLUTTER-TOOLTIPS-Q1 (2026-11-18).
 *
 * Polecenie właściciela: na planszach dyplomacji zostają tylko najważniejsze informacje, wyliczenia trafiają do
 * tooltipów. Nic nie jest usuwane, tylko ukrywane w tooltipach.
 *
 *   (B1) tekst widoczny (whyShort, termsShort) nie zawiera wyliczeń (tur, zmienionych miast, %/turę, karencji, zaufania, zapłaty);
 *   (B2) pełne teksty (why, terms) nadal zawierają wyliczenia — nic nie zginęło z treści;
 *   (B3) terms = termsShort + szczegóły; tytuł, partner i przycisk bez zmian;
 *   (S1) źródło okna: widoczne są text.whyShort i text.termsShort, a pełne teksty idą przez detailTipAttr (title);
 *   (S2) okno nadal bez zamknięcia klikiem w tło i z blokadą Esc; jedyny przycisk = akceptacja;
 *   (S3) zakres dymka hudTitleTooltip obejmuje .civ-diplo-modal-overlay (okno jest montowane na body);
 *   (M)  mutacje w pamięci (bez zapisu plików): wyliczenie z powrotem inline i usunięty tooltip muszą czerwienić S1.
 *
 * Uruchomienie: node tools/diplo-forced-peace-window-declutter-test.cjs   # exit 0 = zielone
 * DOM/Chromium: NIE ZMIERZONO w tym teście (wymaga żywej gry; patrz raport).
 */
const fs = require('fs');
const path = require('path');

const GRA_ROOT = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'));
const SRC = path.resolve(GRA_ROOT, 'src');
const TAG = `${process.pid}`;
const ENTRY = path.resolve(__dirname, `.declutter-${TAG}-entry.ts`);
const BUNDLE = path.resolve(__dirname, `.declutter-${TAG}-bundle.cjs`);

const results = [];
const chk = (name, ok, extra) => results.push({ name, ok: !!ok, extra });

function loadView() {
  fs.writeFileSync(ENTRY, `export * as V from ${JSON.stringify(path.join(SRC, 'game', 'war-weariness-view.ts'))};\n`);
  try {
    esbuild.buildSync({ entryPoints: [ENTRY], bundle: true, format: 'cjs', platform: 'node', outfile: BUNDLE, logLevel: 'silent' });
  } finally {
    try { fs.unlinkSync(ENTRY); } catch (_) { /* ignore */ }
  }
  delete require.cache[BUNDLE];
  const m = require(BUNDLE);
  try { fs.unlinkSync(BUNDLE); } catch (_) { /* ignore */ }
  return m.V;
}

function behaviour(V) {
  const t = V.forcedPeaceModalTextPl({ otherName: 'Rzym', humanIsLoser: true, cityNames: ['Ateny', 'Sparta'], levelPct: 100, turnsAtWar: 40, citiesChanged: 2, lockTurns: 30 });
  const visibleWhy = t.whyShort;
  const visibleTerms = t.termsShort;
  chk('B1 whyShort: jedno zdanie z procentem, bez wyliczeń', /100%/.test(visibleWhy) && !/tur|miast|zmieniło|za każdą|PN|karencj|Zaufani/.test(visibleWhy), visibleWhy);
  chk('B1 termsShort: tylko warunki (oddajesz miasta)', visibleTerms === 'Oddajesz: Ateny, Sparta.', visibleTerms);
  chk('B1 termsShort bez wymiany miast', V.forcedPeaceModalTextPl({ otherName: 'Rzym', humanIsLoser: false, cityNames: [] }).termsShort === 'Pokój bez wymiany miast.');
  chk('B2 why nadal zawiera liczbę tur i zmienione miasta', /40 tur/.test(t.why) && /zmieniło właściciela: 2/.test(t.why), t.why);
  chk('B2 why zawiera formułę zmęczenia (2,5% / 10%)', /Zmęczenie rośnie o 2,5% za każdą turę/.test(t.why) && /10% za każde miasto/.test(t.why), t.why);
  chk('B2 terms zawiera karencję i zaufanie po pokoju', /Po pokoju karencja: 30 tur\./.test(t.terms) && /Zaufanie po pokoju: 20\./.test(t.terms), t.terms);
  chk('B3 terms = termsShort + szczegóły', t.terms.startsWith(visibleTerms + ' '), t.terms);
  chk('B3 why = pełny tekst (dłuższy niż whyShort)', t.why.length > t.whyShort.length && t.why.includes('Nie da się odrzucić'), t.why);
  chk('B3 przycisk bez zmian', t.acceptLabel === 'Akceptuję warunki pokoju');
  chk('B3 tytuł i partner bez zmian', t.title === 'Pokój wymuszony' && t.lead === 'Wojna z Rzym osiągnęła 100% zmęczenia — pokój wymuszony.', t.lead);
}

/** Sprawdza źródło okna. Zwraca listę niezaliczonych kontroli (pusta = zielone). */
function checkWindowSource(ui, hud) {
  const fails = [];
  const start = ui.indexOf('export function showForcedPeaceModal(');
  const end = start >= 0 ? ui.indexOf('/** @deprecated', start) : -1;
  const body = start >= 0 && end > start ? ui.slice(start, end) : '';
  if (!/esc\(text\.whyShort\)/.test(body)) fails.push('S1 widoczne „dlaczego” = text.whyShort');
  if (!/esc\(text\.termsShort\)/.test(body)) fails.push('S1 widoczne warunki = text.termsShort');
  if (/esc\(text\.why\)|esc\(text\.terms\)/.test(body)) fails.push('S1 wyliczenia NIE mogą być inline (esc(text.why) / esc(text.terms))');
  if (!/detailTipAttr\(\[text\.why\]\)/.test(body)) fails.push('S1 tooltip „dlaczego” = detailTipAttr([text.why])');
  if (!/detailTipAttr\(\[text\.terms\]\)/.test(body)) fails.push('S1 tooltip warunków = detailTipAttr([text.terms])');
  if (!/Klik w tło NIE zamyka/.test(ui)) fails.push('S2 brak zamknięcia klikiem w tło (komentarz kontraktu)');
  if (!/blockEsc/.test(body) || !/e\.key !== 'Escape'/.test(ui)) fails.push('S2 blokada Esc');
  if (!/cd-forced-peace-ok/.test(body)) fails.push('S2 jedyny przycisk akceptacji');
  if (!/'\.civ-diplo-modal-overlay',/.test(hud)) fails.push('S3 hudTitleTooltip: zakres .civ-diplo-modal-overlay');
  return fails;
}

function sourceChecks() {
  const ui = fs.readFileSync(path.join(SRC, 'ui', 'diplomacyAudience.ts'), 'utf8');
  const hud = fs.readFileSync(path.join(SRC, 'ui', 'hudTitleTooltip.ts'), 'utf8');
  const real = checkWindowSource(ui, hud);
  chk('S1-S3 źródło okna zgodne z DECLUTTER-WINDOW', real.length === 0, real);

  // (M) mutanty w pamięci: każdy musi czerwienić kontrolę
  const mutInline = ui.replace('esc(text.whyShort)', 'esc(text.why)');
  chk('M1 mutant: wyliczenie z powrotem inline czerwieni kontrolę', mutInline !== ui && checkWindowSource(mutInline, hud).length > 0);
  const mutTerms = ui.replace('esc(text.termsShort)', 'esc(text.terms)');
  chk('M2 mutant: pełne warunki inline czerwieni kontrolę', mutTerms !== ui && checkWindowSource(mutTerms, hud).length > 0);
  const mutTip = ui.replace("'<p' + detailTipAttr([text.why]) + '>'", "'<p>'");
  chk('M3 mutant: brak tooltipa „dlaczego” czerwieni kontrolę', mutTip !== ui && checkWindowSource(mutTip, hud).length > 0);
  const mutHud = hud.replace("'.civ-diplo-modal-overlay',", '');
  chk('M4 mutant: brak zakresu dymka dla okna czerwieni kontrolę', mutHud !== hud && checkWindowSource(ui, mutHud).length > 0);
}

let V = null;
try {
  V = loadView();
  behaviour(V);
} catch (e) {
  chk('ładowanie war-weariness-view (esbuild)', false, String((e && e.message) || e));
}
sourceChecks();

let pass = 0;
let fail = 0;
for (const r of results) {
  if (r.ok) { pass++; console.log('  OK   ' + r.name); }
  else { fail++; console.log('  FAIL ' + r.name + (r.extra !== undefined ? ' :: ' + JSON.stringify(r.extra) : '')); }
}
console.log(`diplo-forced-peace-window-declutter-test: PASS=${pass} FAIL=${fail}`);
process.exit(fail === 0 ? 0 : 1);
