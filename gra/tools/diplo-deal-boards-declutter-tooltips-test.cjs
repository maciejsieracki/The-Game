'use strict';
/**
 * diplo-deal-boards-declutter-tooltips-test.cjs -- R-WEB-UI-DIPLO-DEAL-BOARDS-DECLUTTER-TOOLTIPS-Q1 (R6).
 *
 * Plansza dyplomacji (panel Punkty Wymiany) pokazuje TYLKO liczby decyzyjne + krótki werdykt;
 * wyliczenia i wyjaśnienia (Relacja, fair min, bilans @ Relacji, traktat, szczegóły) istnieją
 * w atrybucie title (tooltip gry) — nic nie zostało usunięte, tylko ukryte.
 *
 * Asercje: (1) widoczny tekst nie zawiera wyjaśnień i jest krótki; (2) tooltip zawiera
 * dawne treści; (3) MUTACJA: kopia modułu, w której wyjaśnienie wraca do widocznego tekstu,
 * musi czerwienić asercję (1).
 *
 * Run: node tools/diplo-deal-boards-declutter-tooltips-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const UI = path.resolve(GRA, 'src', 'ui');
const SRC_MODULE = path.resolve(UI, 'diplomacyAcceptanceBalance.ts');
const PID = process.pid;

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
}

/** Buduje bundle renderów z podanego modułu (w katalogu ui, żeby importy względne działały). */
function buildRenderers(moduleFile, tag) {
  const base = path.basename(moduleFile, '.ts');
  const entry = path.resolve(UI, `.dip-declutter-entry-${tag}-${PID}.ts`);
  const bundle = path.resolve(__dirname, `.dip-declutter-${tag}-${PID}.cjs`);
  fs.writeFileSync(entry, [
    `export { renderPnBalancePanelFromBasket, renderPnBalancePanelForTreaty } from './${base}';`,
    '',
  ].join('\n'), 'utf8');
  try {
    esbuild.buildSync({
      entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
      outfile: bundle, absWorkingDir: GRA, loader: { '.ts': 'ts', '.json': 'json' }, logLevel: 'silent',
    });
  } finally {
    try { fs.unlinkSync(entry); } catch (_) { /* ok */ }
  }
  const M = require(bundle);
  try { fs.unlinkSync(bundle); } catch (_) { /* ok */ }
  return M;
}

const decode = s => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
/** Widoczny tekst: tagi usunięte (atrybuty title znikają razem z tagiem). */
const visibleText = html => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
/** Tekst tooltipów: wszystkie wartości atrybutu title. */
const tooltipText = html => Array.from(html.matchAll(/ title="([^"]*)"/g)).map(m => decode(m[1])).join('\n');

/** Wyjaśnienia, które NIE mogą wracać na planszę (R2/R3). */
const FORBIDDEN_ON_BOARD = [
  'fair min', 'PW @ Rel', 'Wpływ Relacji', 'WPŁYW RELACJI', 'Relacja z perspektywy',
  'Szczegóły:', 'SUMA oddaję', 'Traktat: Ty', 'Baza traktatu', 'Jeden bilans',
];
const MAX_BOARD_CHARS = 160;

function boardViolations(html) {
  const vis = visibleText(html);
  const out = [];
  for (const f of FORBIDDEN_ON_BOARD) if (vis.includes(f)) out.push('widoczne: ' + f);
  if (vis.length > MAX_BOARD_CHARS) out.push('widoczny tekst za długi: ' + vis.length);
  return out;
}

function runScenarios(M) {
  const basket = M.renderPnBalancePanelFromBasket(
    40, 10, 100, 'Wymiana', undefined,
    'SUMA oddaję: 40 PW · SUMA dostaję: 10 PW\nFair min (Rel 100): 12 PW\nSzczegóły: korzystna',
  );
  const treaty = M.renderPnBalancePanelForTreaty(
    50, 40, 10, 100, 'Sojusz', undefined, 'Traktat', 120, 100,
  );
  return { basket, treaty };
}

// ---- Wariant oryginalny (kod z dyspozycji) ----
const M = buildRenderers(SRC_MODULE, 'orig');
const { basket, treaty } = runScenarios(M);

check('koszyk: widoczne etykiety trzech pól PW zostają', ['My oddajemy', 'Bilans (Oni)', 'Oni oddają']
  .every(l => visibleText(basket).includes(l)), visibleText(basket));
check('koszyk: brak wyjaśnień poza tooltipem (widoczny tekst)', boardViolations(basket).length === 0,
  boardViolations(basket));
check('koszyk: tooltip liczby Bilans niesie wyliczenia (fair min, Rel, szczegóły)',
  /fair min/.test(tooltipText(basket)) && /PW @ Rel 100/.test(tooltipText(basket))
    && /Szczegóły: korzystna/.test(tooltipText(basket)) && /SUMA oddaję: 40 PW/.test(tooltipText(basket)),
  tooltipText(basket));
check('traktat: brak wyjaśnień poza tooltipem (widoczny tekst)', boardViolations(treaty).length === 0,
  boardViolations(treaty));
check('traktat: tooltip niesie treść traktatu i Relacji',
  /Relacja|Traktat/.test(tooltipText(treaty)) && tooltipText(treaty).length > 0,
  tooltipText(treaty));

// ---- Mutacja: wyjaśnienie wraca do widocznego tekstu, test MUSI czerwienieć ----
const orig = fs.readFileSync(SRC_MODULE, 'utf8');
const anchor = `'<span class="da-pn-bal-lbl">Bilans (Oni)</span>'`;
const mutCount = orig.split(anchor).length - 1;
check('mutacja: kotwica (etykieta Bilans (Oni)) występuje dokładnie raz', mutCount === 1, mutCount);
if (mutCount === 1) {
  const mutFile = path.resolve(UI, `.dip-declutter-mut-${PID}.ts`);
  const mutated = orig.replace(anchor,
    anchor + " + '<span class=\"da-pn-bal-meta\">Wpływ Relacji: fair min 12 PW · PW @ Rel 100</span>'");
  fs.writeFileSync(mutFile, mutated, 'utf8');
  let mutViol = [];
  try {
    const MM = buildRenderers(mutFile, 'mut');
    const r = runScenarios(MM);
    mutViol = boardViolations(r.basket);
  } finally {
    try { fs.unlinkSync(mutFile); } catch (_) { /* ok */ }
  }
  check('mutacja: wyjaśnienie wrócone na planszę czerwieni test (asercja widocznego tekstu)',
    mutViol.length > 0, mutViol);
}

console.log('');
console.log('diplo-deal-boards-declutter-tooltips-test: ' + pass + ' pass, ' + fail + ' fail');
process.exit(fail === 0 ? 0 : 1);
