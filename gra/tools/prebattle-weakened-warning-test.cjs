'use strict';
/**
 * prebattle-weakened-warning-test.cjs
 *
 * R-WEB-BATTLE-WEAKENED-HUNGER-DEFICIT-WARNING-Q1 -- ostrzezenie w oknie przed bitwa
 * (preBattle) o osłabieniu jednostek strony przez głód wojska / deficyt Złota.
 *
 * Testuje CZYSTY modul gra/src/game/battle-weakened-note.ts (bundle esbuild, bez DOM
 * i bez main.ts). Warunki:
 *   (a) strona z glodem wojska -> ostrzezenie "głód wojska −25%" (procent z mnoznika)
 *   (b) strona z deficytem Zlota -> ostrzezenie "deficyt złota −25%"
 *   (c) strona bez kary -> brak notatki, pusty tekst (okno nic nie pokazuje)
 *   (d) barbarzyncy -> nigdy (nawet gdy flagi true)
 *   (e) procent liczony z mnoznika, nie wpisany na sztywno (mnoznik 0,6 -> −40%)
 *   (f) obie kary naraz -> jedna linia z obiema pozycjami
 *   (g) tekst po polsku, bez surowych ID (np. "glod_wojska", "zloto_deficyt")
 *
 * Dowod mutacyjny: usuniecie warunku w buildWeakenedNote musi wywolac FAIL.
 *
 * Usage (z gra/): node tools/prebattle-weakened-warning-test.cjs
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch {
    console.error('[prebattle-weakened-warning-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const GRA_ROOT = path.resolve(__dirname, '..');

let pass = 0;
let fail = 0;
function assert(cond, msg) {
  if (cond) {
    pass++;
    console.log('  [OK]', msg);
  } else {
    fail++;
    console.error('  [FAIL]', msg);
  }
}

async function bundleModule(entryRel) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'prebattle-weakened-'));
  const outFile = path.join(tmpDir, 'bundle.cjs');
  try {
    await esbuild.build({
      entryPoints: [path.resolve(GRA_ROOT, entryRel)],
      bundle: true,
      format: 'cjs',
      platform: 'node',
      target: 'es2020',
      outfile: outFile,
      logLevel: 'silent',
    });
    const mod = { exports: {} };
    const src = fs.readFileSync(outFile, 'utf8');
    new Function('module', 'exports', 'require', src)(mod, mod.exports, require);
    return mod.exports;
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }
  }
}

const BASE = { hungry: false, goldDeficit: false, glodWojskaMult: 0.75, zlotoDeficytMult: 0.75, barbarian: false };

async function main() {
  console.log('== prebattle-weakened-warning-test ==');
  const mod = await bundleModule('src/game/battle-weakened-note.ts');
  const { buildWeakenedNote, weakenedNoteText, weakenedPercent } = mod;

  console.log('\n(a) strona z glodem wojska');
  const nHungry = buildWeakenedNote({ ...BASE, hungry: true });
  const tHungry = weakenedNoteText(nHungry);
  assert(nHungry !== undefined, 'notatka istnieje dla strony z glodem');
  assert(tHungry.includes('głód wojska −25%'), 'tekst zawiera "głód wojska −25%": ' + tHungry);
  assert(!tHungry.includes('deficyt'), 'brak wzmianki o deficycie, gdy jest tylko glod');

  console.log('\n(b) strona z deficytem Zlota');
  const nDef = buildWeakenedNote({ ...BASE, goldDeficit: true });
  const tDef = weakenedNoteText(nDef);
  assert(nDef !== undefined, 'notatka istnieje dla strony z deficytem');
  assert(tDef.includes('deficyt złota −25%'), 'tekst zawiera "deficyt złota −25%": ' + tDef);
  assert(!tDef.includes('głód'), 'brak wzmianki o glodzie, gdy jest tylko deficyt');

  console.log('\n(c) strona bez kary');
  const nNone = buildWeakenedNote({ ...BASE });
  assert(nNone === undefined, 'brak notatki bez kary');
  assert(weakenedNoteText(nNone) === '', 'pusty tekst bez kary');
  const nNoneFlags = buildWeakenedNote({ ...BASE, hungry: false, goldDeficit: false });
  assert(weakenedNoteText(nNoneFlags) === '', 'pusty tekst przy obu flagach false');

  console.log('\n(d) barbarzyncy nigdy');
  const nBarb = buildWeakenedNote({ ...BASE, hungry: true, goldDeficit: true, barbarian: true });
  assert(nBarb === undefined, 'barbarzyńca bez ostrzeżenia nawet przy flagach true');
  assert(weakenedNoteText(nBarb) === '', 'barbarzyńca: pusty tekst');

  console.log('\n(e) procent z mnoznika');
  assert(weakenedPercent(0.6) === 40, 'mnoznik 0,6 -> 40%');
  const n06 = buildWeakenedNote({ ...BASE, hungry: true, glodWojskaMult: 0.6 });
  assert(weakenedNoteText(n06).includes('−40%'), 'tekst z mnoznika 0,6 pokazuje −40%');

  console.log('\n(f) obie kary naraz');
  const nBoth = buildWeakenedNote({ ...BASE, hungry: true, goldDeficit: true });
  const tBoth = weakenedNoteText(nBoth);
  assert(tBoth.includes('głód wojska −25%') && tBoth.includes('deficyt złota −25%'), 'obie pozycje w jednym tekście: ' + tBoth);

  console.log('\n(g) tekst po polsku, bez surowych ID');
  assert(!/glod_wojska|zloto_deficyt|_stat_mult/.test(tBoth), 'brak surowych identyfikatorów parametrów');
  assert(tBoth.startsWith('Osłabieni: '), 'tekst zaczyna się od "Osłabieni: "');

  console.log('\n== WYNIK: ' + pass + ' OK, ' + fail + ' FAIL ==');
  if (fail > 0) process.exit(1);
}

main().catch(err => {
  console.error('[prebattle-weakened-warning-test] crashed:', err);
  process.exit(1);
});
