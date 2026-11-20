'use strict';
/**
 * diplomacy-audience-status-banner-real-render-test.cjs — R-WEB-UI-DIPLO-AUDIENCE-STATUS-BANNER-LABEL-Q1 (dowod w przegladarce).
 *
 * Renderuje PELNE okno audiencji (showDiplomacyAudience z prawdziwego src/ui/diplomacyAudience.ts) w headless Chromium
 * dla 3 stanow pary: POKOJ, WOJNA, ROZEJM. Stan formalny liczy resolveFormalDiplomaticStatus (ta sama funkcja co main.ts ~l.26243),
 * wejscie relationStatus = rel.status pary. Asercje: baner ma prefiks „Stan: ”, tooltip „to nie jest propozycja”,
 * przy wojnie nie ma „POKÓJ” w banerze. Zrzuty: runs/R-WEB-UI-DIPLO-AUDIENCE-STATUS-BANNER-LABEL-Q1/dowody/.
 *
 * Przegladarka: CHROMIUM_PATH (domyslnie /usr/bin/chromium), biblioteka playwright z gra/node_modules.
 * Usage (z gra/): node tools/diplomacy-audience-status-banner-real-render-test.cjs
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const { chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'));

const GRA = path.resolve(__dirname, '..');
const SHOT_DIR = path.resolve(GRA, '..', 'dyspozycje', 'autobot', 'runs',
  'R-WEB-UI-DIPLO-AUDIENCE-STATUS-BANNER-LABEL-Q1', 'dowody');
const CHROME = require('./_chrome-path.cjs').resolveChromePath(); // R-WEB-TEST-DEBT-Q12: CHROME_PATH -> CHROMIUM_PATH -> google-chrome -> chromium
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dip-audience-rr-'));
const ENTRY = path.join(tmp, 'entry.ts');
const BUNDLE = path.join(tmp, 'bundle.js');
const MUSIC = path.join(tmp, 'music.ts');

fs.writeFileSync(MUSIC, 'export function startDiplomacyMusic(){} export function stopDiplomacyMusic(){}\n', 'utf8');
fs.writeFileSync(ENTRY, [
  `export { showDiplomacyAudience, hideDiplomacyAudience } from ${JSON.stringify(path.join(GRA, 'src/ui/diplomacyAudience.ts'))};`,
  `export { resolveFormalDiplomaticStatus } from ${JSON.stringify(path.join(GRA, 'src/game/diplomacy-display.ts'))};`,
  '',
].join('\n'), 'utf8');

const stubAssets = {
  name: 'stub-assets',
  setup(build) {
    build.onResolve({ filter: /\?raw$/ }, (args) => ({
      path: path.resolve(args.resolveDir, args.path.replace(/\?raw$/, '')), namespace: 'stub-raw',
    }));
    build.onLoad({ filter: /.*/, namespace: 'stub-raw' }, () => ({ contents: '', loader: 'text' }));
    build.onResolve({ filter: /\.(svg|mp3|jpg|png|webp|ogg|wav)$/ }, (args) => ({ path: args.path, namespace: 'stub-empty' }));
    build.onLoad({ filter: /.*/, namespace: 'stub-empty' }, () => ({ contents: 'export default ""', loader: 'js' }));
    // Muzyka cywilizacji — poza zakresem tego testu (dzwiek).
    build.onResolve({ filter: /audio\/muzyka-antyczna$/ }, () => ({ path: MUSIC }));
  },
};

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

const TOOLTIP = 'Aktualny formalny stan umów między wami. To nie jest propozycja.';

const SCENARIOS = [
  { id: 'pokoj', rel: 'pokoj', truceUntilTurn: null, expectLbl: 'Stan: POKÓJ', tone: 'pokoj' },
  { id: 'wojna', rel: 'wojna', truceUntilTurn: null, expectLbl: 'Stan: WOJNA', tone: 'wojna' },
  { id: 'rozejm', rel: 'pokoj', truceUntilTurn: 15, expectLbl: 'Stan: POKÓJ', tone: 'pokoj', expectSub: 'Rozejm do tury 15' },
];

async function main() {
  console.log('diplomacy-audience-status-banner-real-render-test — start');
  await esbuild.build({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'browser',
    format: 'iife',
    globalName: 'DAR',
    target: 'es2020',
    outfile: BUNDLE,
    absWorkingDir: GRA,
    loader: { '.ts': 'ts', '.json': 'json' },
    define: { 'import.meta.glob': '__noGlob' },
    banner: { js: 'var __noGlob = function () { return {}; };' },
    logLevel: 'silent',
    plugins: [stubAssets],
  });

  fs.mkdirSync(SHOT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true, executablePath: CHROME, args: ['--no-sandbox'] });
  try {
    for (const sc of SCENARIOS) {
      const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
      const errors = [];
      page.on('pageerror', (e) => errors.push(String(e)));
      await page.setContent('<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#101218"></body></html>');
      await page.addScriptTag({ path: BUNDLE });
      const info = await page.evaluate((s) => {
        const DAR = window.DAR;
        const formalStatus = DAR.resolveFormalDiplomaticStatus({
          relationStatus: s.rel, allianceFormalKind: null, hasNap: false, hasTrade: false, contactEstablished: true,
        });
        const state = {
          playerTitle: 'Władca · Starożytność', playerCivName: 'Rzym', otherTitle: 'Przedstawiciel', otherCivName: 'Sumerowie',
          zaufanie: 26, respekt: 40, tier: 1, layer: 'full', contactEstablished: true,
          formalStatus, formalStatusDetail: { sinceTurns: 3 }, truceUntilTurn: s.truceUntilTurn, currentTurn: 10,
          actions: [
            { id: '2', label: 'Traktat handlowy', enabled: true, locked: false },
            { id: '6', label: 'Wspólna obrona', enabled: true, locked: false },
            { id: '9', label: 'Wypowiedzenie wojny', enabled: true, locked: false },
          ],
          pendingNegotiations: [],
        };
        DAR.showDiplomacyAudience({
          ownerId: 2, getState: () => state, onAction: () => {}, onBack: () => {}, backLabel: 'Wróć',
        });
        const lbl = document.querySelector('.da-banner .da-b-lbl');
        const banner = document.querySelector('.da-banner');
        return {
          lbl: lbl ? lbl.textContent : null,
          title: banner ? banner.getAttribute('title') : null,
          tone: banner ? banner.className : null,
          sub: document.querySelector('.da-banner .da-b-sub') ? document.querySelector('.da-banner .da-b-sub').textContent : null,
          bannerText: banner ? banner.textContent : null,
        };
      }, sc);
      await page.waitForTimeout(150);
      const shot = path.join(SHOT_DIR, 'audiencja-' + sc.id + '.png');
      await page.screenshot({ path: shot });
      console.log('zrzut: ' + shot);

      check(sc.id + ': baner ma etykietę „' + sc.expectLbl + '”', info.lbl === sc.expectLbl, info);
      check(sc.id + ': ton da-tone-' + sc.tone, !!info.tone && info.tone.includes('da-tone-' + sc.tone), info.tone);
      check(sc.id + ': tooltip „to nie jest propozycja”', info.title === TOOLTIP, info.title);
      if (sc.expectSub) check(sc.id + ': podpis „' + sc.expectSub + '”', !!info.sub && info.sub.includes(sc.expectSub), info.sub);
      if (sc.rel === 'wojna') check(sc.id + ': przy wojnie baner nie mówi „POKÓJ”', !/POK[ÓO]J/.test(info.bannerText), info.bannerText);
      check(sc.id + ': brak błędów strony', errors.length === 0, errors);
      await page.close();
    }
  } finally {
    await browser.close();
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  console.log('=== diplomacy-audience-status-banner-real-render-test: ' + pass + ' pass, ' + fail + ' fail ===');
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(2); });
