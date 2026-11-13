'use strict';
/**
 * administrator-icon-everywhere-render-test.cjs
 *
 * TEMAT: R-WEB-UI-ADMINISTRATOR-ICON-EVERYWHERE-Q1 (runda 2).
 *
 * Test BEHAWIORALNY w Chromium na PRAWDZIWYCH funkcjach renderujących:
 *  A. Helper ikony + wartości (administratorIcon.ts): administratorUpkeepValueHtml(n) daje
 *     ikonę SVG i tekst „−n”; zero daje „—” (bez ikony). administratorChipInnerHtml daje ten sam
 *     komponent dla chipa miasta i chipa administratora ulepszeń (klasa .civ-adm-ic, rozmiar).
 *  B. Wiersz „Utrzymanie administratorów (to miasto)” w bilansie miasta (appendCitySkarbiecBalance,
 *     cityPanel.ts) w wyrenderowanym DOM: z administratorem -> ikona SVG + „−2”; z wartością 0
 *     (np. opcja „Administratorzy” wyłączona) -> „—” i zero ikon administratora w tym wierszu.
 *  C. Wiersz „Utrzymanie administratorów” w podsumowaniu imperium (cityEconMiniSkarbiec,
 *     empireDetailPanel.ts): ikona + kwota; przy 0 brak ikony.
 *  D. Civpedia: markdownToHtml z znacznikiem {{ikona-administratora}} /
 *     {{ikona-administratora-ulepszen}} zamienia go na ikonę (bez surowego tekstu znacznika).
 *  E. Układ: wiersz bilansu miasta nie przepełnia poziomo kontenera przy 520 px.
 *
 * OFF = snapshot bez wartości (undefined), tak jak main.ts przy administratorsEnabled=false: wiersze nie są
 * dodawane. Test NIE przełącza prawdziwej opcji kreatora (to robi gra; patrz main.ts).
 *
 * NIE objęte tym testem (NIE_ZMIERZONO): chip nagłówka miasta (renderTopBarGarrison, prywatna
 * funkcja), przycisk „Administrator ulepszeń +” i test mutacyjny.
 *
 * Opcjonalnie: ADM_ICON_SHOTS_DIR=<katalog> — zrzuty panelu.
 * Uruchomienie (z gra/): node tools/administrator-icon-everywhere-render-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[administrator-icon-everywhere] playwright missing — npm ci, then install Chromium');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const UI_DIR = path.resolve(GRA, 'src', 'ui');
const ENTRY = path.resolve(__dirname, '.administrator-icon-everywhere-entry.ts');
const OUTFILE = path.resolve(__dirname, '.administrator-icon-everywhere-bundle.cjs');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const SHOTS_DIR = process.env.ADM_ICON_SHOTS_DIR ? path.resolve(process.env.ADM_ICON_SHOTS_DIR) : null;
const PANEL_WIDTH_PX = 520;

let pass = 0;
let fail = 0;
function check(name, condition, detail) {
  if (condition) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + detail : '')); }
}

const exposeSpecs = {
  'cityPanel.ts': [
    'appendCitySkarbiecBalance as __appendCitySkarbiecBalance',
    'ensureStyles as __ensureCityPanelStyles',
  ],
  'empireDetailPanel.ts': [
    'cityEconMiniSkarbiec as __cityEconMiniSkarbiec',
    'ensureStyles as __ensureEmpireStyles',
  ],
};

function makeExposePlugin() {
  return {
    name: 'expose-administrator-icon-everywhere',
    setup(build) {
      build.onLoad({ filter: /(cityPanel|empireDetailPanel)\.ts$/ }, (args) => {
        const base = path.basename(args.path);
        if (path.resolve(path.dirname(args.path)) !== UI_DIR) return null;
        const specs = exposeSpecs[base];
        if (!specs) return null;
        return {
          contents: fs.readFileSync(args.path, 'utf8') + [
            '', 'export {', ...specs.map((s) => '  ' + s + ','), '};', '',
          ].join('\n'),
          loader: 'ts',
          resolveDir: path.dirname(args.path),
        };
      });
    },
  };
}

function listSvgs(dir, prefix, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) listSvgs(file, prefix + entry.name + '/', out);
    else if (entry.name.endsWith('.svg')) out[prefix + entry.name] = fs.readFileSync(file, 'utf8');
  }
  return out;
}

// Te same drobne adaptery Vite co w innych testach renderu (pliki SVG i moduły źródłowe są prawdziwe).
const viteCompatPlugin = {
  name: 'vite-compat',
  setup(build) {
    build.onResolve({ filter: /\?raw$/ }, (args) => ({
      path: path.resolve(args.resolveDir, args.path.replace(/\?raw$/, '')),
      namespace: 'raw-file',
    }));
    build.onLoad({ filter: /.*/, namespace: 'raw-file' }, (args) => ({
      contents: fs.readFileSync(args.path, 'utf8'),
      loader: 'text',
    }));
    build.onLoad({ filter: /brandAssets\.ts$/ }, (args) => {
      const expected = path.resolve(GRA, 'src', 'ui', 'icons', 'brandAssets.ts');
      if (path.resolve(args.path) !== expected) return null;
      const source = fs.readFileSync(args.path, 'utf8').replace(
        /import\.meta\.glob\('\.\/brand\/\*\*\/\*\.svg',\s*\{[\s\S]*?\}\)/,
        JSON.stringify(listSvgs(path.resolve(GRA, 'src', 'ui', 'icons', 'brand'), './brand/', {})),
      );
      return { contents: source, loader: 'ts', resolveDir: path.dirname(args.path) };
    });
    build.onLoad({ filter: /\.ts$/ }, (args) => {
      const source = fs.readFileSync(args.path, 'utf8');
      if (!source.includes('import.meta.glob')) return null;
      return {
        contents: 'const __viteGlobStub = () => ({});\n' + source.replace(/import\.meta\.glob/g, '__viteGlobStub'),
        loader: 'ts',
        resolveDir: path.dirname(args.path),
      };
    });
  },
};

async function launchBrowser() {
  try { return await chromium.launch({ headless: true }); }
  catch (error) {
    console.log('[administrator-icon-everywhere] default Chromium unavailable, trying', FALLBACK_CHROME);
    return chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

async function screenshot(page, name) {
  if (!SHOTS_DIR) return;
  fs.mkdirSync(SHOTS_DIR, { recursive: true });
  await page.screenshot({ path: path.join(SHOTS_DIR, name), fullPage: true });
}

async function main() {
  fs.writeFileSync(ENTRY, [
    "import * as CP from '../src/ui/cityPanel.ts';",
    "import * as EP from '../src/ui/empireDetailPanel.ts';",
    "import { administratorUpkeepValueHtml, administratorChipInnerHtml } from '../src/ui/icons/administratorIcon.ts';",
    "import { markdownToHtml } from '../src/ui/markdownLite.ts';",
    'const cp = CP as any;',
    'const ep = EP as any;',
    'window.__T = {',
    '  configureCityPanel: CP.configureCityPanel,',
    '  appendCitySkarbiecBalance: cp.__appendCitySkarbiecBalance,',
    '  ensureCityPanelStyles: cp.__ensureCityPanelStyles,',
    '  ensureEmpireStyles: ep.__ensureEmpireStyles,',
    '  cityEconMiniSkarbiec: ep.__cityEconMiniSkarbiec,',
    '  administratorUpkeepValueHtml,',
    '  administratorChipInnerHtml,',
    '  markdownToHtml,',
    '};',
    '',
  ].join('\n'), 'utf8');

  await esbuild.build({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'browser',
    format: 'iife',
    target: 'es2020',
    outfile: OUTFILE,
    absWorkingDir: GRA,
    loader: { '.ts': 'ts' },
    plugins: [viteCompatPlugin, makeExposePlugin()],
    logLevel: 'silent',
  });

  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 560, height: 900 } });
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(String(error)));
  page.on('console', (message) => { if (message.type() === 'error') pageErrors.push(message.text()); });

  try {
    await page.setContent('<!DOCTYPE html><html><head><meta charset="utf-8"><style>'
      + '*{margin:0;padding:0;box-sizing:border-box;}'
      + 'body{background:#0b0f16;color:#eee;font-family:"Segoe UI",Tahoma,sans-serif;padding:16px;}'
      + '#stage{display:flex;flex-direction:column;gap:12px;align-items:flex-start;}'
      + '</style></head><body><main id="stage"></main></body></html>');
    await page.addScriptTag({ content: fs.readFileSync(OUTFILE, 'utf8') });

    const res = await page.evaluate(({ panelWidth }) => {
      const T = window.__T;
      T.ensureCityPanelStyles();
      T.ensureEmpireStyles();
      const out = {};
      const stage = document.getElementById('stage');
      stage.style.width = panelWidth + 'px';

      // A. helper
      const upk2 = T.administratorUpkeepValueHtml(2);
      const upk0 = T.administratorUpkeepValueHtml(0);
      out.helperHasIcon = /class="civ-adm-ic /.test(upk2) && /<svg/.test(upk2);
      out.helperText = upk2.replace(/<[^>]+>/g, '').trim();
      out.helperZero = upk0;
      const chipCity = T.administratorChipInnerHtml('city', true, 'Administrator');
      const chipImp = T.administratorChipInnerHtml('improvements', false, 'Administrator ulepszeń');
      out.chipCityHasIcon = /data-adm-icon="city"/.test(chipCity) && /is-ok/.test(chipCity);
      out.chipImpHasIcon = /data-adm-icon="improvements"/.test(chipImp) && /is-idle/.test(chipImp) && /civ-adm-ic-pick/.test(chipImp);
      out.chipSameSize = (chipCity.match(/<svg[^>]*width="(\d+)"/) || [])[1] === (chipImp.match(/<svg[^>]*width="(\d+)"/) || [])[1];
      out.chipCityLabel = chipCity.replace(/<[^>]+>/g, '').trim();
      out.chipImpLabel = chipImp.replace(/<[^>]+>/g, '').trim();

      // B. wiersz bilansu miasta z administratorem / bez (OFF)
      const mkCity = (adm) => {
        T.configureCityPanel({
          getCityMoneySnap: () => ({
            doSkarbca: 3, pieniadzBrutto: 10, wealthMnoznik: 1, handelZeSzlakow: 0,
            utrzymanieBudynkow: 1, utrzymanieSurowcowBudynkow: {}, utrzymanieGarnizonu: 0, nauka: 0,
            utrzymanieAdministratora: adm,
          }),
        });
        const mount = document.createElement('div');
        mount.style.width = panelWidth + 'px';
        stage.appendChild(mount);
        T.appendCitySkarbiecBalance(mount, { id: 'c1', name: 'Test', ownerId: 0 });
        return mount;
      };
      const rowOf = (mount) => {
        const lbl = Array.from(mount.querySelectorAll('.city-money-lbl'))
          .find(e => (e.textContent || '').indexOf('Utrzymanie administratorów') === 0);
        return lbl ? lbl.parentElement.querySelector('.city-money-val') : null;
      };
      const mOn = mkCity(2);
      const vOn = rowOf(mOn);
      out.cityRowFound = !!vOn;
      out.cityRowIcon = !!(vOn && vOn.querySelector('.civ-adm-ic svg'));
      out.cityRowText = vOn ? vOn.textContent.trim() : '';
      // ON bez zatrudnionego administratora (wartosc 0): wiersz z „—”, bez ikony.
      const mZero = mkCity(0);
      const vZero = rowOf(mZero);
      out.cityZeroFound = !!vZero;
      out.cityZeroIcons = vZero ? vZero.querySelectorAll('.civ-adm-ic').length : -1;
      out.cityZeroText = vZero ? vZero.textContent.trim() : '';
      // OFF (opcja „Administratorzy” wyłączona = snap bez wartości): BRAK wiersza.
      const mOff = mkCity(undefined);
      const vOff = rowOf(mOff);
      out.cityOffFound = !!vOff;
      out.cityOffIcons = vOff ? vOff.querySelectorAll('.civ-adm-ic').length : -1;
      out.cityOffText = vOff ? vOff.textContent.trim() : '';
      out.cityOverflow = mOn.scrollWidth <= mOn.clientWidth + 1;
      out.cityZeroHtmlLeak = vZero ? /</.test(vZero.textContent) : true;

      // C. podsumowanie imperium
      const econMount = (adm) => {
        const html = T.cityEconMiniSkarbiec(
          [{ name: 'Miasto', pieniadz: 5, utrzymanieBudynkow: 1 }],
          { bogactwoUtrzymanieAdministratorow: adm, bogactwo: 100, bogactwoRate: 1 },
        );
        const m = document.createElement('div');
        m.style.width = panelWidth + 'px';
        m.innerHTML = html;
        stage.appendChild(m);
        return m;
      };
      const eOn = econMount(4);
      const eRow = Array.from(eOn.querySelectorAll('div')).find(d => (d.textContent || '').indexOf('Utrzymanie administratorów') === 0 && d.querySelector('.civ-adm-ic'));
      out.empireRowIcon = !!eRow;
      out.empireRowText = eRow ? eRow.textContent.replace(/\s+/g, ' ').trim() : '';
      const eZero = econMount(0);
      const eRowZero = Array.from(eZero.querySelectorAll('div')).find(d => (d.textContent || '').indexOf('Utrzymanie administratorów') === 0);
      out.empireZeroIcons = eRowZero ? eRowZero.querySelectorAll('.civ-adm-ic').length : -1;
      // OFF: podsumowanie imperium bez wiersza administratora.
      const eOff = econMount(undefined);
      out.empireOffRowFound = Array.from(eOff.querySelectorAll('div')).some(d => (d.textContent || '').indexOf('Utrzymanie administratorów') === 0);

      // D. Civpedia
      const md = T.markdownToHtml('**{{ikona-administratora}} Administrator miasta** to osoba.\n\n**{{ikona-administratora-ulepszen}} Administrator ulepszeń** to osoba.');
      out.wikiCityIcon = /civ-adm-ic/.test(md) && !/\{\{ikona-administratora\}\}/.test(md);
      out.wikiImpIcon = /civ-adm-ic-pick/.test(md) && !/\{\{ikona-administratora-ulepszen\}\}/.test(md);
      out.wikiRaw = /\{\{/.test(md);
      out.stageHeight = document.body.scrollHeight;
      return out;
    }, { panelWidth: PANEL_WIDTH_PX });

    await screenshot(page, 'administrator-icon-everywhere.png');

    check('A: helper administratorUpkeepValueHtml(2) ma ikonę SVG', res.helperHasIcon);
    check('A: helper tekst „−2”', res.helperText === '−2', res.helperText);
    check('A: helper dla 0 zwraca „—” (bez ikony)', res.helperZero === '—', res.helperZero);
    check('A: chip miasta ma data-adm-icon=city i stan ok', res.chipCityHasIcon);
    check('A: chip ulepszeń ma data-adm-icon=improvements, stan idle i kilof', res.chipImpHasIcon);
    check('A: oba chipy mają ikonę tego samego rozmiaru', res.chipSameSize);
    check('A: etykiety chipów (wykrzyknik stanu „idle” nie liczy się do etykiety)', res.chipCityLabel === 'Administrator' && res.chipImpLabel.replace(/^!/, '') === 'Administrator ulepszeń', res.chipCityLabel + ' / ' + res.chipImpLabel);
    check('B: wiersz bilansu miasta znaleziony', res.cityRowFound);
    check('B: wiersz miasta z administratorem ma ikonę SVG', res.cityRowIcon);
    check('B: wiersz miasta z administratorem pokazuje „−2”', /−2/.test(res.cityRowText), res.cityRowText);
    check('B: wiersz miasta ON/0 znaleziony', res.cityZeroFound);
    check('B: wiersz miasta ON/0 bez ikony administratora', res.cityZeroIcons === 0, String(res.cityZeroIcons));
    check('B: wiersz miasta ON/0 pokazuje „—”', res.cityZeroText === '—', res.cityZeroText);
    check('B: OFF (opcja wyłączona): BRAK wiersza „Utrzymanie administratorów” w bilansie miasta', !res.cityOffFound);
    check('B: brak poziomego przepełnienia bilansu miasta (520 px)', res.cityOverflow);
    check('B: brak surowego HTML w wierszu przy 0', !res.cityZeroHtmlLeak);
    check('C: podsumowanie imperium: wiersz z ikoną administratora', res.empireRowIcon);
    check('C: podsumowanie imperium: kwota „−4”', /−4/.test(res.empireRowText), res.empireRowText);
    check('C: podsumowanie imperium ON/0: bez ikony administratora', res.empireZeroIcons === 0, String(res.empireZeroIcons));
    check('C: OFF (opcja wyłączona): BRAK wiersza w podsumowaniu imperium', !res.empireOffRowFound);
    check('D: Civpedia {{ikona-administratora}} zamieniona na ikonę', res.wikiCityIcon);
    check('D: Civpedia {{ikona-administratora-ulepszen}} zamieniona na ikonę z kilofem', res.wikiImpIcon);
    check('D: Civpedia bez surowego znacznika {{', !res.wikiRaw);
    check('brak błędów strony', pageErrors.length === 0, pageErrors.slice(0, 3).join(' | '));
  } finally {
    await browser.close();
  }

  console.log(`\nadministrator-icon-everywhere: ${pass} PASS, ${fail} FAIL`);
  if (fail > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
