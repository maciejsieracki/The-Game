/**
 * Podgląd UI karty jednostki w panelu bocznym (mini + rozszerzona).
 * Uruchom z gra/: node tools/preview-unit-side-panel-screenshots.cjs
 */
const esbuild = require('esbuild');
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const os = require('os');

const GRA = path.resolve(__dirname, '..');
const ROOT = path.resolve(GRA, '..');
const OUT = path.join(ROOT, 'docs/ux/preview-unit-panel');
// --- P-BRAMKA-WSPOLDZIELONY-DIST-TMPDIR-Q1: katalogi/pliki tymczasowe unikalne per przebieg ---
// Stala nazwa pod os.tmpdir() jest wspoldzielona przez KAZDY rownolegly przebieg (takze
// uruchomiony z innego worktree). Skutek dziala w obie strony: raz falszywy CZERWONY
// (jeden bieg czysci drugiemu katalog w locie), raz falszywy ZIELONY (dwa biegi mierza
// ten sam artefakt, wiec "parytet" jest artefaktem kolizji, nie dowodem). Sufiks
// per-proces to rozlacza; asercje i progi bramki pozostaja nietkniete.
const TMPDIR_RUN_ID = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
// Unikalnosc BEZ sprzatania zamienilaby kolizje w staly wyciek dysku (brak miejsca to
// ta sama klasa problemu z drugiej strony), wiec kasujemy WLASNE artefakty tego biegu.
// Dopasowanie po TMPDIR_RUN_ID nie moze trafic w cudzy katalog. Zrzuty/podglady
// zostaja na dysku celowo — sa DOWODEM wizualnym (R-PROC-AUTOBOT.md §9 pkt 6).
process.on('exit', () => {
  // `require` lokalnie: hak musi dzialac takze w plikach, ktore nie maja `fs`/`path`
  // w zasiegu modulu — inaczej ReferenceError wpada w catch i sprzatanie milczy.
  const nfs = require('fs'); const npath = require('path'); const nos = require('os');
  try {
    for (const ent of nfs.readdirSync(nos.tmpdir())) {
      if (!ent.includes(TMPDIR_RUN_ID)) continue;
      if (/shots|preview|zrzut/i.test(ent)) continue;
      try { nfs.rmSync(npath.join(nos.tmpdir(), ent), { recursive: true, force: true }); } catch { /* best-effort */ }
    }
  } catch { /* best-effort */ }
});
const TMP = path.join(os.tmpdir(), `civ-unit-panel-preview-${TMPDIR_RUN_ID}`);
const BUNDLE = path.join(TMP, 'unit-panel-preview-bundle.cjs');
const STUB_DIR = path.join(__dirname, '.stubs');
const STUB_BRAND = path.join(STUB_DIR, 'brandAssets-preview-stub.ts');

function ensureBrandStub() {
  fs.mkdirSync(STUB_DIR, { recursive: true });
  if (!fs.existsSync(STUB_BRAND)) {
    fs.writeFileSync(
      STUB_BRAND,
      [
        "export function brandIconSvg() { return ''; }",
        "export function mapResourceIconSvg() { return ''; }",
        "export function terrainIconSvg() { return ''; }",
        "export function unitIconSvg() { return '🏹'; }",
      ].join('\n'),
      'utf8',
    );
  }
}

const stubBrandAssetsPlugin = {
  name: 'stub-brand-assets-preview',
  setup(build) {
    build.onResolve({ filter: /[/\\]icons[/\\]brandAssets/ }, () => ({ path: STUB_BRAND }));
  },
};

async function writePreviewHtml() {
  fs.mkdirSync(TMP, { recursive: true });
  ensureBrandStub();
  await esbuild.build({
    entryPoints: [path.join(GRA, 'tools/.unit-panel-preview-entry.ts')],
    outfile: BUNDLE,
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'es2020',
    absWorkingDir: GRA,
    plugins: [stubBrandAssetsPlugin],
    logLevel: 'silent',
  });
  const preview = require(BUNDLE);
  const miniPath = path.join(TMP, 'mini.html');
  const expandedPath = path.join(TMP, 'expanded.html');
  fs.writeFileSync(miniPath, preview.buildPreviewDocument(preview.buildMiniHtml()));
  fs.writeFileSync(expandedPath, preview.buildPreviewDocument(preview.buildExpandedHtml()));
  return { miniPath, expandedPath };
}

async function shot(page, name, htmlFile) {
  const file = path.join(OUT, name);
  const url = `file://${htmlFile.replace(/\\/g, '/')}`;
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  await page.waitForSelector('.sp-ctx-card', { timeout: 15000 });
  const card = page.locator('.sp-ctx-card').first();
  await card.screenshot({ path: file, type: 'png' });
  console.log('OK', name);
  return file;
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const { miniPath, expandedPath } = await writePreviewHtml();

  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-dev-shm-usage'],
  });
  const page = await browser.newPage({
    viewport: { width: 400, height: 720 },
    deviceScaleFactor: 2,
  });

  try {
    const p1 = await shot(page, '01_mini.png', miniPath);
    const p2 = await shot(page, '02_expanded.png', expandedPath);
    console.log('\nZapisano:');
    console.log(p1);
    console.log(p2);
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
