'use strict';
/**
 * trybunal-card-happiness-display-test.cjs — R-WEB-TRYBUNAL-CARD-HAPPINESS-DISPLAY-Q1.
 *
 * DIAGNOZA (potwierdzona tym testem): silnik (economy.ts::buildingHappinessAtLevel) daje
 * budynkowi `dajeSzczescie: true` ryczałt +1 PLUS `baza/przyrost.zadowolenie`. Karta budynku
 * w sekcji „Plony i efekty” pokazywała tylko surowe `baza/przyrost` (Trybunał: „+1” na L1,
 * choć silnik daje +2, a na L2 „+2” zamiast +3), a dla budynków bez `baza.zadowolenie`
 * (Targowisko, Port, Stela) nie pokazywała wiersza wcale. Top 5 Trybunału („+2 Szczęścia”,
 * „W epoce Żelaza … +3 Szczęścia”) zgadza się z silnikiem — rozbieżna była karta, nie silnik.
 * Naprawa dotyczy WYŁĄCZNIE wyświetlania (buildingAdapter.ts); liczby silnika i danych bez zmian.
 *
 * Test na REALNYM adapterze (`buildingAdapter.ts`) i REALNYM rendererze, zbundlowanych esbuildem
 * i uruchomionych w Chromium (Playwright, file-less setContent):
 *   [E] silnik: Trybunał L1=2, L2=3 (ryczałt +1 + zadowolenie); Świątynia, Spichlerz,
 *       Kamienne kręgi, Targowisko — wartości z buildingHappinessAtLevel (kontrola spójności);
 *   [K] karta: dla KAŻDEGO budynku dajeSzczescie=true i KAŻDEGO poziomu 1..maksPoziom wiersz
 *       „Zadowolenie” w „Plony i efekty” == buildingHappinessAtLevel (DOM, nie tylko adapter);
 *       skala „Zadowolenie — skala poziomów” == silnik na każdym poziomie;
 *   [T] Trybunał: pozycja Top 5 „+1 pieniądza i +2 Szczęścia” zgodna z wierszem karty (L1=+2);
 *   [N] regres: budynek bez Szczęścia (dajeSzczescie=false, np. Mury) nie dostaje wiersza
 *       „Zadowolenie”; wiersz „Podatek” (dawniej „Pieniądz”) Trybunału nadal +1 na L1 (bez zmian);
 *   [D] zakres: w danych nie ma budynku dajeSzczescie=false z niezerowym baza/przyrost.zadowolenie
 *       (inaczej adapter cicho pomijałby dane) — tylko kontrola, bez zmiany danych.
 *
 * Usage (z gra/): node tools/trybunal-card-happiness-display-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[trybunal-card-happiness-display-test] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const STUB_DIR = path.resolve(__dirname, '.stubs');
const BRAND_ASSETS_STUB = path.resolve(STUB_DIR, 'entity-card-contract-brandAssets-stub.ts');
const SCIENCE_OWL_STUB = path.resolve(STUB_DIR, 'entity-card-contract-scienceOwlIcon-stub.ts');
const ENTRY = path.resolve(__dirname, '.trybunal-card-happiness-entry.ts');
const OUTFILE = path.resolve(__dirname, '.trybunal-card-happiness-bundle.cjs');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const SAMPLE_IDS = ['trybunal', 'swiatynia', 'spichlerz', 'kamienne_kregi', 'targowisko'];

const stubPlugin = {
  name: 'stub-icons',
  setup(build) {
    build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: BRAND_ASSETS_STUB }));
    build.onResolve({ filter: /icons\/scienceOwlIcon$/ }, () => ({ path: SCIENCE_OWL_STUB }));
  },
};

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

async function launchBrowser() {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

/** Liczba z początku tekstu typu „+2 pkt/turę (…)” albo „L1: +2 · L2: +3”. */
function firstSigned(text) {
  const m = /([+-]?\d+)/.exec(text || '');
  return m ? Number(m[1]) : NaN;
}

async function main() {
  const buildings = JSON.parse(fs.readFileSync(path.join(GRA, 'data/buildings.json'), 'utf8'));
  const byId = Object.fromEntries(buildings.map((b) => [b.id, b]));

  // [D] kontrola danych: brak „ukrytego” zadowolenia poza dajeSzczescie.
  const hiddenYield = buildings.filter((b) => b.dajeSzczescie !== true
    && ((b.baza && b.baza.zadowolenie) || (b.przyrost && b.przyrost.zadowolenie)));
  check('[D] brak budynku dajeSzczescie=false z niezerowym zadowolenie (silnik zeruje, adapter nie ma czego pokazać)',
    hiddenYield.length === 0, hiddenYield.map((b) => b.id));

  // ---- bundle -------------------------------------------------------------------------------
  fs.writeFileSync(ENTRY, [
    "import { renderEntityCard, buildEntityCardData, ENTITY_CARD_CSS } from '../src/ui/entityCards/renderer.ts';",
    "import { buildingAdapter } from '../src/ui/entityCards/buildingAdapter.ts';",
    "import { buildingHappinessAtLevel, buildingGivesHappiness } from '../src/game/economy.ts';",
    "import { buildingLevelForEpoch } from '../src/game/production.ts';",
    "import buildingsData from '../data/buildings.json';",
    'window.__renderEntityCard = renderEntityCard;',
    'window.__buildEntityCardData = buildEntityCardData;',
    'window.__ENTITY_CARD_CSS = ENTITY_CARD_CSS;',
    'window.__buildingAdapter = buildingAdapter;',
    'window.__buildingHappinessAtLevel = buildingHappinessAtLevel;',
    'window.__buildingGivesHappiness = buildingGivesHappiness;',
    'window.__buildingLevelForEpoch = buildingLevelForEpoch;',
    'window.__buildings = buildingsData;',
    '',
  ].join('\n'), 'utf8');

  try {
    await esbuild.build({
      entryPoints: [ENTRY], bundle: true, platform: 'browser', format: 'iife', target: 'es2020',
      outfile: OUTFILE, absWorkingDir: GRA, loader: { '.ts': 'ts' }, plugins: [stubPlugin], logLevel: 'silent',
    });

    const browser = await launchBrowser();
    try {
      const page = await browser.newPage({ viewport: { width: 760, height: 900 }, deviceScaleFactor: 1 });
      const consoleErrors = [];
      page.on('pageerror', (e) => consoleErrors.push(String(e)));
      page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
      await page.setContent('<html><body style="margin:0"><div id="root" style="width:660px;padding:16px"></div></body></html>');
      await page.addScriptTag({ content: fs.readFileSync(OUTFILE, 'utf8') });
      await page.evaluate(() => {
        const style = document.createElement('style');
        style.textContent = window.__ENTITY_CARD_CSS;
        document.head.appendChild(style);
      });

      // Dla każdego budynku i każdego poziomu: wiersze „Plony i efekty” z DOM oraz wartości silnika.
      const result = await page.evaluate(() => {
        const out = {};
        const yieldRowsOf = (card) => {
          const sec = card.querySelector('[data-section-key="yield"]');
          if (!sec) return null;
          return Array.from(sec.querySelectorAll('.entity-card-row')).map((r) => ({
            label: (r.querySelector('.entity-card-row-key') || {}).textContent || '',
            value: (r.querySelector('.entity-card-row-value') || {}).textContent || '',
          }));
        };
        const top5Of = (card) => Array.from(card.querySelectorAll('[data-section-key="top5"] .entity-card-top3-item')).map((it) => ({
          tytul: (it.querySelector('.entity-card-top3-title') || {}).textContent || '',
          zdanie: (it.querySelector('.entity-card-top3-text') || {}).textContent || '',
        }));
        for (const b of window.__buildings) {
          const levels = [];
          const maks = Math.max(1, Number(b.maksPoziom) || 1);
          for (let lvl = 1; lvl <= maks; lvl++) {
            const city = { hasCity: true, displayLevel: lvl, buildCostPace: 'niski', difficulty: 'normal', ownerId: 0 };
            const data = window.__buildingAdapter(b, { city });
            const card = window.__renderEntityCard(data);
            document.getElementById('root').appendChild(card);
            levels.push({
              level: lvl,
              engine: window.__buildingHappinessAtLevel(b, lvl),
              happy: window.__buildingGivesHappiness(b),
              yieldRows: yieldRowsOf(card),
              top5: top5Of(card),
            });
            card.remove();
          }
          out[b.id] = { levels, maks };
        }
        return out;
      });

      // [E] silnik — wartości referencyjne.
      const eng = (id, lvl) => (result[id] && result[id].levels[lvl - 1] ? result[id].levels[lvl - 1].engine : NaN);
      check('[E] Trybunał L1 Szczęście silnika = 2 (ryczałt +1 + zadowolenie 1)', eng('trybunal', 1) === 2, eng('trybunal', 1));
      check('[E] Trybunał L2 Szczęście silnika = 3', eng('trybunal', 2) === 3, eng('trybunal', 2));
      check('[E] Świątynia L1 = 3', eng('swiatynia', 1) === 3, eng('swiatynia', 1));
      check('[E] Spichlerz L1 = 5', eng('spichlerz', 1) === 5, eng('spichlerz', 1));
      check('[E] Kamienne kręgi L1 = 2', eng('kamienne_kregi', 1) === 2, eng('kamienne_kregi', 1));
      check('[E] Targowisko L1 = 1 (sam ryczałt, zero zadowolenia w danych)', eng('targowisko', 1) === 1, eng('targowisko', 1));

      // [K] karta == silnik na każdym poziomie, dla każdego budynku dajeSzczescie=true.
      for (const id of SAMPLE_IDS.concat(buildings.filter((b) => b.dajeSzczescie === true).map((b) => b.id))) {
        const r = result[id];
        if (!r) { check(`[K] ${id}: wyrenderowano kartę`, false); continue; }
        if (!byId[id].dajeSzczescie) continue;
        for (const L of r.levels) {
          const row = (L.yieldRows || []).find((x) => x.label === 'Zadowolenie');
          check(`[K] ${id} L${L.level}: wiersz „Zadowolenie” w „Plony i efekty” istnieje`, !!row, L.yieldRows);
          if (row) {
            check(`[K] ${id} L${L.level}: „Zadowolenie” karty (${row.value}) == silnik (${L.engine})`,
              firstSigned(row.value) === L.engine, { value: row.value, engine: L.engine });
          }
        }
        // Skala poziomów: każda wartość wg silnika (gdy budynek ma >1 poziom i wartość się zmienia).
        const scaleRow = (r.levels[0].yieldRows || []).find((x) => x.label === 'Zadowolenie — skala poziomów');
        const engineVals = r.levels.map((L) => L.engine);
        const varies = engineVals.some((v) => v !== engineVals[0]);
        if (r.maks > 1 && varies) {
          check(`[K] ${id}: skala poziomów „Zadowolenie” istnieje`, !!scaleRow, r.levels[0].yieldRows);
          if (scaleRow) {
            const parts = scaleRow.value.split('·').map((s) => firstSigned(s.replace(/^\s*L\d+:/, '')));
            check(`[K] ${id}: skala poziomów == silnik ${JSON.stringify(engineVals)}`,
              JSON.stringify(parts) === JSON.stringify(engineVals), { value: scaleRow.value, engineVals });
          }
        } else {
          check(`[K] ${id}: brak zbędnej skali poziomów (wartość stała)`, !scaleRow, scaleRow);
        }
      }

      // [T] Trybunał: Top 5 („+2 Szczęścia” na L1) zgodne z wierszem karty L1.
      const tryL1 = result.trybunal.levels[0];
      const tryTop = tryL1.top5.find((t) => t.tytul.includes('Szczęścia'));
      check('[T] Trybunał Top 5 zawiera pozycję „+1 pieniądza i +2 Szczęścia”',
        !!tryTop && tryTop.tytul.includes('+2 Szczęścia'), tryL1.top5);
      const tryZad = (tryL1.yieldRows || []).find((x) => x.label === 'Zadowolenie');
      const topSzczescie = tryTop ? /\+(\d+) Szczęścia/.exec(tryTop.tytul) : null;
      check('[T] Trybunał: wiersz karty „Zadowolenie” L1 = +2 (zgodnie z Top 5 i silnikiem)',
        !!tryZad && !!topSzczescie && firstSigned(tryZad.value) === 2 && Number(topSzczescie[1]) === 2,
        { tryZad, tryTop });

      // [N] regres: wartość z `baza.pieniadz` Trybunału nadal +1 na L1; budynek bez Szczęścia bez wiersza.
      // R-WEB-CARDS-RESOURCE-PURPOSE-Q1 (DODATEK 3): wiersz nazywa się teraz „Podatek” (baza.pieniadz zasila podatek).
      const tryPien = (tryL1.yieldRows || []).find((x) => x.label === 'Podatek');
      check('[N] Trybunał „Podatek” (baza.pieniadz) L1 nadal +1 (bez regresu)', !!tryPien && firstSigned(tryPien.value) === 1, tryPien);
      const noHappy = buildings.find((b) => b.dajeSzczescie !== true && b.id === 'mury')
        || buildings.find((b) => b.dajeSzczescie !== true);
      if (noHappy) {
        const rows = result[noHappy.id].levels[0].yieldRows || [];
        check(`[N] ${noHappy.id} (dajeSzczescie=false) nie ma wiersza „Zadowolenie”`,
          !rows.some((x) => x.label === 'Zadowolenie'), rows);
      }

      check('konsola bez błędów JS', consoleErrors.length === 0, consoleErrors.slice(0, 5));
    } finally {
      await browser.close();
    }
  } finally {
    try { fs.unlinkSync(ENTRY); } catch (_e) { /* noop */ }
    try { fs.unlinkSync(OUTFILE); } catch (_e) { /* noop */ }
  }

  console.log(`trybunal-card-happiness-display-test: PASS ${pass}, FAIL ${fail}`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error('[trybunal-card-happiness-display-test] crashed:', e && e.stack || e);
  process.exit(1);
});
