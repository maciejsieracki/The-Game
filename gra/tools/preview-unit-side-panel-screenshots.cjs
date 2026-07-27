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
const TMP = path.join(os.tmpdir(), 'civ-unit-panel-preview');
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
