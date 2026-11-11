'use strict';
/**
 * fortifications-upgrade-chain-ui-test.cjs -- R-WEB-FORTIFICATIONS-UPGRADE-CHAIN-IMPL-Q1 (2026-11-11).
 * Test DOM w PRAWDZIWYM Chromium (Playwright), realny renderBuildList z cityPanel.ts i dane realne buildings.json:
 *  - palisada stoi -> sekcja "Ulepsz" zawiera "Ulepsz -> Mury kamienne" i "Ulepsz -> Mury ceglane" (przeskok z palisady),
 *    a w sekcji "Buduj" NIE ma zadnego etapu lancucha (ani palisady);
 *  - mury kamienne stoja -> w "Ulepsz" tylko "Ulepsz -> Mury ceglane";
 *  - nic z lancucha nie stoi -> wszystkie trzy w "Buduj" (przeskok od zera), sekcja "Ulepsz" bez wierszy lancucha;
 *  - awans w kolejce -> zadnych kolejnych etapow na liscie (blokada kolejki);
 *  - karta szczegolow awansu: poprzednik, koszt jako liczby, bez surowych id.
 * Zrzuty: tools/_fort-chain-shots (lub FORT_SHOTS_DIR).
 *
 * Usage (z gra/): node tools/fortifications-upgrade-chain-ui-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[fortifications-upgrade-chain-ui-test] playwright missing (npm ci --ignore-scripts w gra/)');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const BRAND_STUB = path.resolve(__dirname, '.stubs', 'recruit-list-visibility-ui-brandAssets-stub.ts');
const ENTRY = path.resolve(__dirname, '.fort-chain-ui-entry.ts');
const OUTFILE = path.resolve(__dirname, '.fort-chain-ui-bundle.js');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const cityPanelSrc = fs.readFileSync(path.join(GRA, 'src', 'ui', 'cityPanel.ts'), 'utf8');
const chipCssLines = cityPanelSrc.split('\n').filter(l => l.startsWith('.civ-cs .bld-infocard-chip'));
if (chipCssLines.length < 2) { console.error('nie znaleziono CSS chipa w cityPanel.ts'); process.exit(1); }

const stubPlugin = {
  name: 'stub-brand-assets',
  setup(build) { build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: BRAND_STUB })); },
};
const importGlobPlugin = {
  name: 'import-meta-glob-empty',
  setup(build) {
    build.onLoad({ filter: /\/src\/.*\.ts$/ }, async args => {
      const c = await fs.promises.readFile(args.path, 'utf8');
      if (!c.includes('import.meta.glob')) return undefined;
      return { contents: c.replace(/import\.meta\.glob\(/g, '((..._g) => ({}))('), loader: 'ts' };
    });
  },
};
const svgRawPlugin = {
  name: 'svg-raw',
  setup(build) {
    build.onResolve({ filter: /\?raw$/ }, args => ({
      path: path.resolve(args.resolveDir, args.path.replace(/\?raw$/, '')),
      namespace: 'svg-raw',
    }));
    build.onLoad({ filter: /.*/, namespace: 'svg-raw' }, args => ({
      contents: 'export default ' + JSON.stringify(fs.readFileSync(args.path, 'utf8')) + ';',
      loader: 'js',
    }));
  },
};

let pass = 0, fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
}
async function launchBrowser() {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}
const SHOTS = process.env.FORT_SHOTS_DIR || path.resolve(__dirname, '_fort-chain-shots');
fs.mkdirSync(SHOTS, { recursive: true });

async function main() {
  fs.writeFileSync(ENTRY, [
    "import { configureCityPanel, renderBuildList } from '../src/ui/cityPanel.ts';",
    "import unitsJson from '../data/units.json';",
    "import buildingsJson from '../data/buildings.json';",
    'window.__api = { configureCityPanel, renderBuildList, units: unitsJson, buildings: buildingsJson };',
    '',
  ].join('\n'), 'utf8');
  await esbuild.build({
    entryPoints: [ENTRY], bundle: true, platform: 'browser', format: 'iife',
    target: 'es2020', outfile: OUTFILE, absWorkingDir: GRA,
    loader: { '.ts': 'ts', '.json': 'json' }, plugins: [stubPlugin, importGlobPlugin, svgRawPlugin], logLevel: 'silent',
  });
  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 560, height: 640 } });
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e)));
  await page.setContent('<body style="background:#1b1b22;color:#e6e6e6;font:14px sans-serif"><div class="civ-cs" id="root" style="width:520px"></div></body>');
  await page.addStyleTag({ content: chipCssLines.join('\n') });
  await page.addScriptTag({ content: fs.readFileSync(OUTFILE, 'utf8') });
  if (await page.evaluate(() => !window.__api)) {
    throw new Error('bundle nie zainicjowal window.__api; bledy strony: ' + JSON.stringify(pageErrors.slice(0, 3)).slice(0, 400));
  }

  const render = async (built, queue) => page.evaluate(({ built, queue }) => {
    const A = window.__api;
    const data = { units: A.units, buildings: A.buildings, civs: [], tech: [] };
    const techs = ['Obróbka drewna', 'Murarstwo', 'Budownictwo'];
    const city = { id: 'm1', name: 'Start', q: 0, r: 0, ownerId: 0, population: 3, surowce: { drewno: 2000, kamien: 2000, cegla: 2000 } };
    A.configureCityPanel({
      data,
      getTreasury: () => 5000,
      getCities: () => [city],
      getEpoch: () => 3,
      getUnlockedTechs: () => techs,
      getBuiltBuildingIds: () => built,
      getEmpireBuiltIds: () => built,
      getEmpireStock: () => ({ drewno: 2000, kamien: 2000, cegla: 2000 }),
      getCapitalCityId: () => city.id,
      getCityHasCoastOrRiver: () => true,
      getProduction: () => ({ kolejka: queue, postep: 0 }),
      onPurchaseBuilding: () => {},
    });
    const mount = document.getElementById('root');
    mount.innerHTML = '';
    A.renderBuildList(mount, city, data, { praca: 30 });
    const scroll = mount.querySelector('.list-scroll') || mount;
    let section = 'buduj';
    const out = { buduj: [], ulepsz: [] };
    for (const ch of [...scroll.children]) {
      if (!ch.classList.contains('bld-compact-row')) {
        const t = (ch.textContent || '').trim();
        if (t === 'Ulepsz') section = 'ulepsz';
        else if (/zablokowane|Podgl/.test(t)) section = 'inne';
        continue;
      }
      if (section === 'inne') continue;
      out[section].push({
        name: ch.querySelector('.bld-compact-name')?.textContent || '',
        btn: [...ch.querySelectorAll('button')].map(b => b.textContent).join('|'),
      });
    }
    return out;
  }, { built, queue });

  const CHAIN_NAMES = ['Palisada drewniana', 'Mury kamienne', 'Mury ceglane'];
  const inBuduj = r => r.buduj.map(x => x.name).filter(n => CHAIN_NAMES.includes(n));
  const upNames = r => r.ulepsz.map(x => x.name);

  console.log('\n-- palisada stoi --');
  const r1 = await render(['palisada'], []);
  console.log('  buduj(lancuch):', JSON.stringify(inBuduj(r1)), ' ulepsz:', JSON.stringify(upNames(r1)));
  check('U1: sekcja "Ulepsz" zawiera "Ulepsz → Mury kamienne"', upNames(r1).includes('Ulepsz → Mury kamienne'), upNames(r1));
  check('U2: sekcja "Ulepsz" zawiera przeskok "Ulepsz → Mury ceglane"', upNames(r1).includes('Ulepsz → Mury ceglane'), upNames(r1));
  check('U3: w sekcji "Buduj" brak etapow lancucha (ani palisady)', inBuduj(r1).length === 0, inBuduj(r1));
  const upRow = r1.ulepsz.find(x => x.name === 'Ulepsz → Mury kamienne');
  check('U4: przycisk wiersza awansu to "Ulepsz"', !!upRow && /Ulepsz/.test(upRow.btn), upRow);
  await page.screenshot({ path: path.join(SHOTS, '01-palisada-stoi-sekcja-ulepsz.png') });

  const hov = await page.evaluate(async () => {
    const rows = [...document.querySelectorAll('.bld-compact-row')];
    const row = rows.find(r => (r.querySelector('.bld-compact-name')?.textContent || '') === 'Ulepsz → Mury kamienne');
    if (!row) return { found: false };
    row.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    row.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    await new Promise(r => setTimeout(r, 700));
    const card = document.getElementById('civ-hover-detail-float');
    return { found: true, hasCard: !!card, text: card ? (card.textContent || '').slice(0, 700) : '' };
  });
  console.log('  karta awansu:', JSON.stringify(hov));
  check('U5: hover na awansie otwiera karte szczegolow', hov.found === true && hov.hasCard === true, hov);
  if (hov.hasCard) {
    check('U6: karta pokazuje poprzednika (Palisada)', /Palisad/.test(hov.text), hov.text);
    check('U7: karta bez surowych id (mury_kamienne / palisada)', !/mury_kamienne|\bpalisada\b/.test(hov.text), hov.text);
    check('U8: koszt jako liczby (160)', /160/.test(hov.text), hov.text);
  }
  await page.screenshot({ path: path.join(SHOTS, '02-awans-karta-kosztu.png') });

  console.log('\n-- mury kamienne stoja --');
  const r2 = await render(['mury_kamienne'], []);
  console.log('  buduj(lancuch):', JSON.stringify(inBuduj(r2)), ' ulepsz:', JSON.stringify(upNames(r2)));
  check('U9: tylko awans na Mury ceglane w "Ulepsz"', upNames(r2).filter(n => /^Ulepsz → /.test(n)).join() === 'Ulepsz → Mury ceglane', upNames(r2));
  check('U10: "Buduj" bez etapow lancucha', inBuduj(r2).length === 0, inBuduj(r2));
  check('U10b: awans poziomu (L1->L2) rozroznialny od awansu etapu: etykieta "... → poz. N", nie goly "Mury kamienne"', upNames(r2).some(n => /^Mury kamienne → poz(\.|iom) 2/.test(n)) && !upNames(r2).includes('Mury kamienne'), upNames(r2));
  await page.screenshot({ path: path.join(SHOTS, '03-kamienne-stoja.png') });

  console.log('\n-- nic z lancucha nie stoi --');
  const r3 = await render([], []);
  console.log('  buduj(lancuch):', JSON.stringify(inBuduj(r3)), ' ulepsz:', JSON.stringify(upNames(r3)));
  check('U11: od zera wszystkie trzy w "Buduj" (przeskok)', CHAIN_NAMES.every(n => inBuduj(r3).includes(n)), inBuduj(r3));
  check('U12: od zera brak wierszy awansu lancucha w "Ulepsz"', !upNames(r3).some(n => /^Ulepsz → /.test(n)), upNames(r3));
  await page.screenshot({ path: path.join(SHOTS, '04-od-zera-buduj.png') });

  console.log('\n-- awans w kolejce --');
  const r4 = await render(['palisada'], [{ kind: 'budynek', id: 'mury_kamienne', nazwa: 'x', koszt: 35 }]);
  console.log('  buduj(lancuch):', JSON.stringify(inBuduj(r4)), ' ulepsz:', JSON.stringify(upNames(r4)));
  check('U13: gdy awans czeka w kolejce, brak kolejnych etapow lancucha', upNames(r4).filter(n => /^Ulepsz → Mury/.test(n)).length === 0 && inBuduj(r4).length === 0, { u: upNames(r4), b: inBuduj(r4) });

  console.log('\nBledy strony: ' + pageErrors.length);
  pageErrors.slice(0, 5).forEach(e => console.log('  ' + e.slice(0, 200)));
  check('U14: brak bledow strony', pageErrors.length === 0, pageErrors.slice(0, 2));
  await browser.close();
  console.log('\n' + pass + ' passed, ' + fail + ' failed');
  if (fail > 0) process.exitCode = 1;
}
main().catch(e => { console.error('[fortifications-upgrade-chain-ui-test] ERROR', e); process.exitCode = 1; })
  .finally(() => {
    for (const f of [ENTRY, OUTFILE]) { try { fs.unlinkSync(f); } catch (_) { /* ignore */ } }
    process.exit(process.exitCode || 0);
  });
