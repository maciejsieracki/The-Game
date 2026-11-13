'use strict';

/** Live Chromium check for the science picker ETA noun inflection. */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const { chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'));

const GRA = path.resolve(__dirname, '..');
const RUN = path.resolve(GRA, '..', 'dyspozycje', 'autobot', 'runs', 'R-WEB-SCIENCE-PICKER-ETA-PL-Q1');
const ENTRY = path.resolve(__dirname, '.science-picker-eta-entry.ts');
const BUNDLE = path.resolve(__dirname, '.science-picker-eta-bundle.js');
const SHOT_DIR = process.argv[2] || path.join(RUN, 'evidence');
const PICKER = path.resolve(GRA, 'src', 'ui', 'sciencePicker.ts');
const MUTATE = process.env.SCIENCE_PICKER_ETA_MUTATE === '1';

const viteCompat = {
  name: 'vite-compat',
  setup(build) {
    build.onResolve({ filter: /\?raw$/ }, (args) => ({
      path: path.resolve(args.resolveDir, args.path.replace(/\?raw$/, '')),
      namespace: 'raw-file',
    }));
    build.onLoad({ filter: /.*/, namespace: 'raw-file' }, (args) => ({
      contents: fs.readFileSync(args.path, 'utf8'), loader: 'text',
    }));
    build.onLoad({ filter: /\.ts$/ }, (args) => {
      let source = fs.readFileSync(args.path, 'utf8');
      if (path.resolve(args.path) === PICKER && MUTATE) {
        // Deliberate mutant: every plural gets `tur`; the live renderer assertions must kill it.
        source = source.replace(
          'lastOne >= 2 && lastOne <= 4 && !(lastTwo >= 12 && lastTwo <= 14)',
          'false && lastOne >= 2 && lastOne <= 4 && !(lastTwo >= 12 && lastTwo <= 14)',
        );
      }
      if (!source.includes('import.meta.glob')) {
        return path.resolve(args.path) === PICKER ? { contents: source, loader: 'ts', resolveDir: path.dirname(args.path) } : null;
      }
      return {
        contents: 'const __viteGlobStub = () => ({});\n' + source.replace(/import\.meta\.glob/g, '__viteGlobStub'),
        loader: 'ts', resolveDir: path.dirname(args.path),
      };
    });
  },
};

function check(name, condition, detail) {
  if (condition) console.log(`PASS: ${name}`);
  else {
    console.error(`FAIL: ${name}${detail === undefined ? '' : ` — ${JSON.stringify(detail)}`}`);
    failures++;
  }
}

let failures = 0;
async function main() {
  fs.mkdirSync(SHOT_DIR, { recursive: true });
  fs.writeFileSync(ENTRY, [
    "import { configureSciencePicker, showSciencePicker, refreshSciencePickerIfOpen, techToSlug } from '../src/ui/sciencePicker.ts';",
    'window.__configureSciencePicker = configureSciencePicker;',
    'window.__showSciencePicker = showSciencePicker;',
    'window.__refreshSciencePickerIfOpen = refreshSciencePickerIfOpen;',
    'window.__techToSlug = techToSlug;',
  ].join('\n'), 'utf8');

  try {
    await esbuild.build({
      entryPoints: [ENTRY], bundle: true, platform: 'browser', format: 'iife',
      target: 'es2020', outfile: BUNDLE, absWorkingDir: GRA,
      loader: { '.ts': 'ts' }, plugins: [viteCompat], logLevel: 'silent',
    });
    let browser;
    try { browser = await chromium.launch({ headless: true }); }
    catch (error) {
      console.log('[science-picker-eta-real-render-test] Playwright Chromium missing; using system Chromium.');
      browser = await chromium.launch({ headless: true, executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
    }
    try {
      const page = await browser.newPage({ viewport: { width: 1240, height: 840 } });
      const pageErrors = [];
      page.on('pageerror', e => pageErrors.push(String(e)));
      await page.setContent('<!doctype html><html><head></head><body></body></html>');
      await page.addScriptTag({ content: fs.readFileSync(BUNDLE, 'utf8') });
      await page.evaluate(() => {
        const targetId = window.__techToSlug('Łowiectwo');
        window.__etaState = { pula: 23, targetId, kosztCelu: 100, postepFraction: 0.23, turnsLeft: 1 };
        const techs = ['Łowiectwo', 'Rolnictwo', 'Obróbka drewna', 'Oswojenie zwierząt']
          .map(window.__techToSlug);
        window.__configureSciencePicker({
          getResearchState: () => window.__etaState,
          getResearchedTechs: () => [],
          getAvailableTechs: () => techs,
        });
        window.__showSciencePicker(0);
      });
      const cases = [[0, '<1 tury'], [1, '1 tura'], [2, '2 tury'], [5, '5 tur'], [12, '12 tur'], [21, '21 tur'], [22, '22 tury']];
      let screenshotTaken = false;
      for (const [count, expected] of cases) {
        const out = await page.evaluate((turnsLeft) => {
          window.__etaState = { ...window.__etaState, turnsLeft };
          window.__refreshSciencePickerIfOpen();
          return {
            eta: document.querySelector('.cs-eta')?.textContent?.trim() ?? null,
            hint: document.querySelector('.cs-prog-hint')?.textContent?.replace(/\s+/g, ' ').trim() ?? null,
            pool: document.querySelectorAll('.cs-prog-row')[1]?.textContent?.replace(/\s+/g, ' ').trim() ?? null,
            bar: document.querySelector('.cs-bar-fill')?.getAttribute('style') ?? null,
            target: document.querySelector('.cs-prog-row strong.cs-val')?.textContent?.trim() ?? null,
          };
        }, count);
        check(`${count} uses ${expected} in both rendered ETA locations`,
          out.eta === `ETA: ${expected}` && out.hint?.includes(`ETA: ${expected}`), out);
        check(`${count} preserves target, pool, and progress output`,
          out.target === 'Łowiectwo' && out.pool?.replace(/\s+/g, '') === 'Pula:23/100PN'
          && out.bar === 'width:23%', out);
        if (count === 1 && !screenshotTaken && !MUTATE) {
          await page.screenshot({ path: path.join(SHOT_DIR, 'science-picker-eta-1-tura.png'), fullPage: true });
          screenshotTaken = true;
        }
      }
      const nullState = await page.evaluate(() => {
        window.__etaState = null;
        window.__refreshSciencePickerIfOpen();
        return {
          prompt: document.querySelector('.cs-prog-row')?.textContent?.replace(/\s+/g, ' ').trim() ?? null,
          eta: document.querySelector('.cs-eta')?.textContent ?? null,
          hint: document.querySelector('.cs-prog-hint')?.textContent ?? null,
          bar: document.querySelector('.cs-bar-fill')?.getAttribute('style') ?? null,
        };
      });
      check('null state keeps the selection prompt and empty 0% bar with no ETA',
        nullState.prompt?.includes('Wybierz technologię') && nullState.eta === null
        && nullState.hint === null && nullState.bar === 'width:0%', nullState);
      check('live page has no uncaught renderer errors', pageErrors.length === 0, pageErrors);
    } finally {
      await browser.close();
    }
  } finally {
    for (const p of [ENTRY, BUNDLE]) if (fs.existsSync(p)) fs.unlinkSync(p);
  }
  console.log(`\n[science-picker-eta-real-render-test] ${failures === 0 ? 'PASS' : 'FAIL'} (${failures} failed)`);
  process.exitCode = failures === 0 ? 0 : 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
