'use strict';
/**
 * diplo-tooltip-duplicate-rows-test.cjs -- R-WEB-UI-DIPLO-TOOLTIP-DUPLICATE-ROWS-Q1.
 *
 * Tooltip bilansu okna traktatu pokazywał wiersz „Dopłata traktatu" (D) i wiersz „Podział PW pokoju"
 * DWUKROTNIE. Przyczyna zmierzona: plainTextWithTitles dokładała do tekstu elementu jego atrybut title,
 * a te wiersze mają title równy swojemu tekstowi (<div title="X">X</div> -> "X · X").
 *
 * Asercje:
 *   (T1) tooltip bilansu z dopłatą traktatu i podziałem PW: wiersz D występuje dokładnie 1 raz;
 *   (T2) tooltip: wiersz podziału PW występuje dokładnie 1 raz;
 *   (U1) plainTextWithTitles: title innej treści ZOSTAJE (tekst · tytuł);
 *   (U2) plainTextWithTitles: title równy tekstowi nie dubluje;
 *   (U3) plainTextWithTitles: title zawarty w tekście elementu jest pomijany;
 *   (M)  mutacja w pamięci (plugin esbuild, bez zapisu plików): stara wersja plainTextWithTitles
 *        musi dać D==2 i podział==2.
 *
 * Bez plików tymczasowych: esbuild stdin + write:false, bundle wykonywany w pamięci.
 * Run: node tools/diplo-tooltip-duplicate-rows-test.cjs   # exit 0 = zielone
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const UI = path.resolve(GRA, 'src', 'ui');
const TIP_FILE = path.resolve(UI, 'diplomacyTipText.ts');

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
}

const OLD_PLAIN_WITH_TITLES = `export function plainTextWithTitles(html: string): string {
  const titles = Array.from(html.matchAll(/ title="([^"]*)"/g))
    .map(m => plainTextFromHtml(m[1] ?? ''))
    .filter(t => t.length > 0);
  return [plainTextFromHtml(html), ...titles].filter(t => t.length > 0).join(' · ');
}`;

/** Buduje moduł renderów w pamięci; mutate=true podmienia plainTextWithTitles na wersję sprzed poprawki. */
async function build(mutate) {
  const entry = `export { renderPnBalancePanelHtml } from './diplomacyAcceptanceBalance';\n`
    + `export { plainTextWithTitles } from './diplomacyTipText';\n`;
  const plugins = mutate ? [{
    name: 'mutate-tip-text',
    setup(b) {
      b.onLoad({ filter: /diplomacyTipText\.ts$/ }, () => {
        const src = fs.readFileSync(TIP_FILE, 'utf8');
        const start = src.indexOf('export function plainTextWithTitles');
        const end = src.indexOf('\n}', start) + 2;
        if (start < 0 || end < 2) throw new Error('mutacja: nie znaleziono plainTextWithTitles');
        return { contents: src.slice(0, start) + OLD_PLAIN_WITH_TITLES + src.slice(end), loader: 'ts' };
      });
    },
  }] : [];
  const out = await esbuild.build({
    stdin: { contents: entry, resolveDir: UI, loader: 'ts', sourcefile: 'diplo-tooltip-entry.ts' },
    bundle: true, platform: 'node', format: 'cjs', target: 'node18', write: false,
    absWorkingDir: GRA, loader: { '.ts': 'ts', '.json': 'json' }, logLevel: 'silent', plugins,
  });
  const code = out.outputFiles[0].text;
  const mod = { exports: {} };
  new Function('module', 'exports', 'require', code)(mod, mod.exports, require);
  return mod.exports;
}

const decode = s => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const tooltipText = html => Array.from(html.matchAll(/ title="([^"]*)"/g)).map(m => decode(m[1])).join('\n');
const count = (s, needle) => s.split(needle).length - 1;

/** Dane jak dla oferty traktatu AI->gracz z dopłatą D i podziałem PW (fixture). */
function treatyFixture() {
  const side = { offerPn: 40, demandPn: 0, fairMinPn: 40, balancePn: 0, mode: 'treaty' };
  return {
    actionLabel: 'Przemarsz',
    direction: 'incoming',
    myOfferPn: 40,
    theirOfferPn: 0,
    theirBalance: side,
    myBalance: side,
    canAccept: true,
    responderPreview: {
      accepted: true,
      pwBalance: 0,
      treatyPayment: { label: 'złoto 40', coveredPn: 40, shortfallPn: 0, full: true },
      treatyPowerSplit: {
        playerPower: 100, otherPower: 80, r: 1.25, S: 60, W: 40, D: 20, dAfterRelief: 20, playerStronger: false,
      },
    },
  };
}

async function countRows(M) {
  const html = M.renderPnBalancePanelHtml(treatyFixture());
  const tip = tooltipText(html);
  return {
    html,
    D: count(tip, 'Dopłata traktatu:'),
    PW: count(tip, 'Podział PW pokoju wg mocy'),
  };
}

(async () => {
  const NEW = await build(false);
  const OLD = await build(true);

  const cur = await countRows(NEW);
  console.log('TOOLTIP PO (surowy): ' + tooltipText(cur.html));
  check('T1 wiersz Dopłata traktatu (D) == 1 w tooltipie', cur.D === 1, { D: cur.D });
  check('T2 wiersz Podział PW pokoju == 1 w tooltipie', cur.PW === 1, { PW: cur.PW });

  const pt = NEW.plainTextWithTitles;
  check('U1 title innej treści zostaje', pt('<div title="Inne wyjaśnienie">Tekst</div>') === 'Tekst · Inne wyjaśnienie', pt('<div title="Inne wyjaśnienie">Tekst</div>'));
  check('U2 title równy tekstowi nie dubluje', pt('<div title="A B">A B</div>') === 'A B', pt('<div title="A B">A B</div>'));
  check('U3 title zawarty w tekście pomijany', pt('<div title="Dopłata X">Dopłata X: 40</div>') === 'Dopłata X: 40', pt('<div title="Dopłata X">Dopłata X: 40</div>'));

  const old = await countRows(OLD);
  console.log('TOOLTIP PRZED (mutacja, surowy): ' + tooltipText(old.html));
  check('M mutacja (stara plainTextWithTitles) -> D==2 i podział==2', old.D === 2 && old.PW === 2, { D: old.D, PW: old.PW });

  console.log(`\nWYNIK: ${pass} PASS / ${fail} FAIL`);
  process.exit(fail === 0 ? 0 : 1);
})();
