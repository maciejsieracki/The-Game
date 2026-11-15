'use strict';
/**
 * prebattle-weakened-warning-test.cjs
 *
 * R-WEB-BATTLE-WEAKENED-HUNGER-DEFICIT-WARNING-Q1 -- ostrzezenie w oknie przed bitwa
 * (preBattle) o osłabieniu jednostek strony przez głód wojska / deficyt Złota.
 *
 * Testuje CZYSTY modul gra/src/ui/battle-weakened-note.ts (bundle esbuild, bez DOM
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

/**
 * (h)-(k) Render w prawdziwej przegladarce (Chromium --dump-dom): buduje mala strone
 * z vite (ten sam pipeline co gra, bo preBattle.ts uzywa import.meta.glob i ?raw),
 * wola showPreBattle() z roznymi wartosciami `oslabienie` i sprawdza DOM okna.
 * Lapie mutacje w preBattle.ts (np. usuniecie linii `weakenedHtml +`), ktorych
 * test czystego modulu nie widzi. Wymaga Chromium: CHROMIUM_BIN albo chromium w PATH.
 * PREBATTLE_DOM_SKIP=1 pomija te sekcje (wtedy NIE_ZMIERZONO -- jawnie w raporcie).
 */
async function domChecks() {
  console.log('\n(h-k) render okna preBattle w Chromium (DOM)');
  if (process.env.PREBATTLE_DOM_SKIP === '1') {
    console.log('  [SKIP] PREBATTLE_DOM_SKIP=1 -- NIE_ZMIERZONO (render nie sprawdzony)');
    return;
  }
  const { execFileSync } = require('child_process');
  const { createRequire } = require('module');
  const { pathToFileURL } = require('url');
  const chromium = process.env.CHROMIUM_BIN || ['chromium', 'chromium-browser', 'google-chrome']
    .map(n => { try { return execFileSync('which', [n], { encoding: 'utf8' }).trim(); } catch { return ''; } })
    .find(Boolean);
  if (!chromium) {
    assert(false, 'brak Chromium (ustaw CHROMIUM_BIN) -- render okna niezweryfikowany');
    return;
  }
  const req = createRequire(path.join(GRA_ROOT, 'package.json'));
  const viteMod = await import(pathToFileURL(req.resolve('vite')).href);
  const build = viteMod.build || (viteMod.default && viteMod.default.build);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'prebattle-dom-'));
  try {
    const preBattleSrc = path.join(GRA_ROOT, 'src', 'ui', 'preBattle.ts');
    fs.writeFileSync(path.join(dir, 'entry.ts'),
      "import { showPreBattle } from " + JSON.stringify(preBattleSrc) + ";\n" +
      "const mode = new URLSearchParams(location.search).get('mode') || 'none';\n" +
      "const unit = (n: string) => ({ nazwa: n, kategoria: 'piechota', hp: 10, maxHp: 10, atak: 4, obrona: 2, ruch: 2, moc: 6, ilosc: 1 } as any);\n" +
      "const oslab: any = mode === 'hunger' ? { glodWojskaMult: 0.75 } : mode === 'both' ? { glodWojskaMult: 0.75, zlotoDeficytMult: 0.75 } : mode === 'gold' ? { zlotoDeficytMult: 0.75 } : undefined;\n" +
      "const info: any = { atakujacy: { nazwa: 'Gracz', cywilizacja: 'Rzym', ownerId: 0, units: [unit('Legion')], oslabienie: oslab },\n" +
      "  obronca: { nazwa: 'Barbarzyncy', ownerId: 9, isBarbarian: true, units: [unit('Wojownik')] },\n" +
      "  teren: 'Rownina', szanseAtkPct: 50, tura: 12, modyfikatory: [], warunki: [], prognoza: '', werdykt: '', canRetreat: true };\n" +
      "showPreBattle(info, { onAuto: () => {}, onBattlefield: () => {}, onCancel: () => {} }, { auto: false } as any);\n");
    fs.writeFileSync(path.join(dir, 'index.html'),
      '<!doctype html><html lang="pl"><head><meta charset="utf-8"></head><body><script type="module" src="./entry.ts"></script></body></html>\n');
    await build({
      root: dir, base: './', logLevel: 'error',
      build: { outDir: path.join(dir, 'dist'), emptyOutDir: true, minify: false },
      configFile: false,
    });
    const page = path.join(dir, 'dist', 'index.html');
    const dump = mode => {
      const url = pathToFileURL(page).href + '?mode=' + mode;
      return execFileSync(chromium, ['--headless', '--no-sandbox', '--disable-gpu',
        '--allow-file-access-from-files', '--virtual-time-budget=5000', '--dump-dom', url],
        { encoding: 'utf8', timeout: 120000, stdio: ['ignore', 'pipe', 'ignore'] });
    };
    const hunger = dump('hunger');
    const gold = dump('gold');
    const both = dump('both');
    const none = dump('none');
    const weakCount = html => (html.match(/class="pb-weak"/g) || []).length;
    console.log('  (h) glod wojska: pb-weak=' + weakCount(hunger));
    assert(weakCount(hunger) === 1 && hunger.includes('głód wojska −25% (poza pancerzem)'),
      'okno z glodem pokazuje ostrzezenie w DOM');
    console.log('  (i) deficyt zlota: pb-weak=' + weakCount(gold));
    assert(weakCount(gold) === 1 && gold.includes('deficyt złota −25% (poza pancerzem)'),
      'okno z deficytem zlota pokazuje ostrzezenie w DOM');
    console.log('  (i2) obie kary: pb-weak=' + weakCount(both));
    assert(weakCount(both) === 1 && both.includes('głód wojska −25%, deficyt złota −25%'),
      'okno z obiema karami pokazuje jedna linie z obiema pozycjami');
    console.log('  (j) bez kary: pb-weak=' + weakCount(none));
    assert(weakCount(none) === 0 && !none.includes('Osłabieni'),
      'okno bez kary nie pokazuje ostrzezenia (brak pb-weak)');
    assert(none.includes('Legion'), 'kontrola: okno w ogole sie renderuje (jednostka Legion w DOM)');
    console.log('  (k) barbarzyncy: strona barbarzyncow nie ma pb-weak (oslabienie nie jest ustawiane)');
    const barbBlock = hunger.slice(hunger.indexOf('Barbarzy'));
    assert(!barbBlock.includes('pb-weak'), 'blok barbarzyncow nie zawiera ostrzezenia');
  } finally {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* ignore */ }
  }
}

async function main() {
  console.log('== prebattle-weakened-warning-test ==');
  const mod = await bundleModule('src/ui/battle-weakened-note.ts');
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

  await domChecks();

  console.log('\n== WYNIK: ' + pass + ' OK, ' + fail + ' FAIL ==');
  if (fail > 0) process.exit(1);
}

main().catch(err => {
  console.error('[prebattle-weakened-warning-test] crashed:', err);
  process.exit(1);
});
