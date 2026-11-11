'use strict';
/**
 * building-cards-top5-test.cjs — R-WEB-BUILDING-CARDS-TOP5-IMPLEMENT-Q1 (część D/E).
 *
 * Na REALNYM adapterze (`buildingAdapter.ts`), REALNYM resolverze (`registry.ts`) i REALNYM
 * rendererze (`renderer.ts`), zbundlowanych esbuildem i uruchomionych w prawdziwym Chromium
 * (Playwright) — wzorzec `tech-cards-top5-test.cjs` (etap 1) — sprawdza dla KAŻDEGO z 43
 * budynków `buildings.json`:
 *   [A] dane: `data/building-cards-top5.json` ma wpis dla każdego budynku, brak osieroconych,
 *       generator `gen-building-cards-top5.cjs --check` zgodny z plikiem; `ukryty` dokładnie
 *       dla budynków niedostępnych (suppressed / epokaWejscia > 3 — production.ts:966);
 *       Top1 każdego budynku ma `rodzaj: 'efekt'` (decyzja (3));
 *   [B] sekcja „Top 5” stoi BEZPOŚREDNIO po Rysie historycznym, ma 1–5 pozycji zgodnych
 *       z danymi (tytuł + zdanie), Top1 nie jest warunkiem/rozbudową; brak dawnego „Top 3”;
 *   [C] „Co możesz teraz zrobić” stoi BEZPOŚREDNIO po Top 5, ma 1–3 zdania
 *       „<czynność>, aby <korzyść>.” złożone dokładnie z danych; zakazane frazy
 *       („jeśli spełnisz ich wymagania”, „na odpowiednim złożu”, …) nieobecne;
 *   [D] efekty martwe z ANALIZY §8 (`_martweFrazy` w korektach) nieobecne w treści karty
 *       (poza Rysem historycznym); fallback na dawne `top3` użyty 0/44 razy; reszta
 *       kolejności sekcji nietknięta (Charakterystyka → Plony → Koszty → Poziomy);
 *   [E] przypadki szczególne: Mennica Top1 ×1,5 + handel→pieniądz; Koszary — bramka
 *       rekrutacji wojska epoki Brązu i Żelaza (production.ts:1068-1076); Akwedukt — limit
 *       ludności 20; Trybunał i Pałace I–III — −30% korupcji (FALA 560); Garnizon — Milicja;
 *   [F] budynki ukryte (Wielka odlewnia, Wielka Kuźnia, Teatr): resolver i
 *       `buildEntityCardData` zwracają null (brak karty), adapter wołany wprost nie daje
 *       Top 5 ani CMZ.
 *   [G] ZAKRES / ZNANY STAN (obrona r1, zarzut 2 Evaluatora): [B]–[F] sprawdzają WYŁĄCZNIE
 *       wynik adaptera (`buildingAdapter` + `renderEntityCard`). Prawdziwa karta w grze
 *       (`cityPanel.ts` `buildBuildingDetailCardViaEntityCard`) dokleja do niej kafelek
 *       „Technologie” (`appendTechDetailBlock`: wiersz „Odblokowuje budynek” i „Uwagi tech”
 *       z `tech.json` przez `playerFacingNote`). `cityPanel.ts` nie daje się bundlować
 *       w izolacji (precedens: building-detail-card-entitycard-migration-test.cjs), więc [G]
 *       (1) kotwiczy to okablowanie w źródle, (2) liczy treść tych wierszy z PRAWDZIWEGO
 *       `playerFacingNote` (wycinek źródła cityPanel.ts, esbuild transform) i `tech.json`,
 *       (3) porównuje trafienia fraz martwych z listą ZNANY_STAN_HOST. Lista to jawny,
 *       NIENAPRAWIONY stan poza allowlistą tego tematu (wymaga zmiany cityPanel.ts) —
 *       nowe trafienie = FAIL (regres), zniknięcie trafienia = FAIL „zaktualizuj listę”.
 * Opcjonalnie `--screens <katalog>` zapisuje zrzuty PNG 6 kart (Mennica, Koszary, Trybunał,
 * Akwedukt, Garnizon, Warsztat oblężniczy). Ikony brandAssets są zastąpione stubem (jak
 * w pozostałych testach kart) — zrzut pokazuje treść i układ, nie grafikę ikon.
 *
 * Usage (z gra/): node tools/building-cards-top5-test.cjs [--screens <dir>]
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[building-cards-top5-test] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const STUB_DIR = path.resolve(__dirname, '.stubs');
const BRAND_ASSETS_STUB = path.resolve(STUB_DIR, 'entity-card-contract-brandAssets-stub.ts');
const SCIENCE_OWL_STUB = path.resolve(STUB_DIR, 'entity-card-contract-scienceOwlIcon-stub.ts');
const ENTRY = path.resolve(__dirname, '.building-cards-top5-entry.ts');
const OUTFILE = path.resolve(__dirname, '.building-cards-top5-bundle.cjs');
const FALLBACK_CHROME = process.env.BUILD_CARDS_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const SCREEN_IDS = ['mennica', 'koszary', 'trybunal', 'akwedukt', 'garnizon', 'warsztat_oblezniczy', 'mury', 'mury_kamienne'];
const EXPECTED_HIDDEN = ['wielka_odlewnia', 'wielka_kuznia', 'teatr'];

const screensArgIdx = process.argv.indexOf('--screens');
const SCREENS_DIR = screensArgIdx > -1 ? path.resolve(process.argv[screensArgIdx + 1]) : null;

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
  try { return await chromium.launch({ headless: true, executablePath: process.env.BUILD_CARDS_CHROME || undefined }); }
  catch (e) {
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

const BANNED = [
  'jeśli spełnisz ich wymagania', 'jeśli spełniasz ich wymagania', 'na odpowiednim złożu',
  'NIE_USTALONO', 'niedostępn',
];
/** Dalsza kolejność sekcji po CMZ — nietknięta względem bazy (dispatch C). */
const TAIL_ORDER = ['characteristics', 'yield', 'cost-build', 'cost-upkeep', 'levels'];

async function main() {
  // ---- [A] dane ---------------------------------------------------------------------------
  const buildings = JSON.parse(fs.readFileSync(path.join(GRA, 'data/buildings.json'), 'utf8'));
  const cards = JSON.parse(fs.readFileSync(path.join(GRA, 'data/building-cards-top5.json'), 'utf8'));
  const korekty = JSON.parse(fs.readFileSync(path.join(__dirname, 'gen-building-cards-top5.korekty.json'), 'utf8'));
  const martwe = korekty._martweFrazy || {};
  const cardKeys = Object.keys(cards).filter((k) => !k.startsWith('_'));
  check('[A] buildings.json ma 44 budynki', buildings.length === 44, buildings.length);
  const missing = buildings.map((b) => b.id).filter((id) => !cards[id]);
  check('[A] każdy budynek ma wpis w building-cards-top5.json (44/44)', missing.length === 0, missing);
  const orphans = cardKeys.filter((k) => !buildings.some((b) => b.id === k));
  check('[A] brak osieroconych wpisów w building-cards-top5.json', orphans.length === 0, orphans);
  const gen = spawnSync(process.execPath, [path.join(__dirname, 'gen-building-cards-top5.cjs'), '--check'], { encoding: 'utf8' });
  check('[A] gen-building-cards-top5.cjs --check: dane zgodne z generatorem', gen.status === 0, (gen.stderr || gen.stdout).trim());
  const hiddenData = cardKeys.filter((k) => cards[k].ukryty === true).sort();
  check('[A] ukryte dokładnie 3 niedostępne (Wielka odlewnia, Wielka Kuźnia, Teatr)',
    JSON.stringify(hiddenData) === JSON.stringify([...EXPECTED_HIDDEN].sort()), hiddenData);
  const deadByRule = buildings.filter((b) => b.suppressed === true || (Number(b.epokaWejscia) || 1) > 3).map((b) => b.id).sort();
  check('[A] `ukryty` == reguła suppressed / epokaWejscia > 3 (production.ts:966)',
    JSON.stringify(hiddenData) === JSON.stringify(deadByRule), { hiddenData, deadByRule });
  for (const id of cardKeys) {
    const c = cards[id];
    if (c.ukryty) continue;
    check(`[A] ${id}: Top1 rodzaj = efekt (warunek/rozbudowa nigdy Top1)`, c.top5[0] && c.top5[0].rodzaj === 'efekt', c.top5[0]);
    check(`[A] ${id}: rodzaje pozycji z dozwolonego zbioru`, c.top5.every((i) => ['efekt', 'warunek', 'rozbudowa'].includes(i.rodzaj)), c.top5.map((i) => i.rodzaj));
    check(`[A] ${id}: CMZ 1–3 zdania`, c.cmz.length >= 1 && c.cmz.length <= 3, c.cmz.length);
  }
  const top3Kept = buildings.filter((b) => Array.isArray(b.top3)).length;
  check('[A] pole `top3` w buildings.json zachowane (inne konsumenty: emporion-building-test)', top3Kept === 44, top3Kept);

  // ---- [G] kafelek „Technologie” hosta (cityPanel.ts) — ZNANY STAN poza allowlistą ----------
  {
    const cp = fs.readFileSync(path.join(GRA, 'src/ui/cityPanel.ts'), 'utf8');
    const hostStart = cp.indexOf('function buildBuildingDetailCardViaEntityCard(');
    const hostBody = hostStart > -1 ? cp.slice(hostStart, cp.indexOf('\n}\n', hostStart)) : '';
    check('[G] kotwica: host karty budynku dokleja appendTechDetailBlock(…, def.techUnlock)',
      hostBody.includes('appendTechDetailBlock(techBody, data, def.techUnlock)'));
    const tdStart = cp.indexOf('function appendTechDetailBlock(');
    const tdBody = tdStart > -1 ? cp.slice(tdStart, cp.indexOf('\n}\n', tdStart)) : '';
    check('[G] kotwica: kafelek pokazuje „Odblokowuje budynek” i „Uwagi tech” = playerFacingNote(t.Uwagi)',
      tdBody.includes("'Odblokowuje budynek'") && tdBody.includes('playerFacingNote(t.Uwagi)'));
    const a = cp.indexOf('function isEmptyDataVal(');
    const pf = cp.indexOf('function playerFacingNote(');
    const js = esbuild.transformSync(cp.slice(a, cp.indexOf('\n}\n', pf) + 3)
      + '\nmodule.exports = { playerFacingNote, isEmptyDataVal };', { loader: 'ts', format: 'cjs' }).code;
    const mod = { exports: {} };
    new Function('module', 'exports', js)(mod, mod.exports);
    const { playerFacingNote, isEmptyDataVal } = mod.exports;
    // R-WEB-CITYPANEL-TECH-TILE-DEAD-EFFECTS-Q1: kafelek przechodzi przez WSPÓLNY filtr
    // (techDeadEffects.ts) — bundlujemy go do CJS w pamięci, tak jak cityPanel go używa.
    const dead = esbuild.buildSync({
      entryPoints: [path.join(GRA, 'src/ui/entityCards/techDeadEffects.ts')], bundle: true, format: 'cjs',
      platform: 'node', write: false, absWorkingDir: GRA, logLevel: 'silent',
    }).outputFiles[0].text;
    const deadMod = { exports: {} };
    new Function('module', 'exports', 'require', dead)(deadMod, deadMod.exports, require);
    const { filterDeadEffectText } = deadMod.exports;
    const techRaw = JSON.parse(fs.readFileSync(path.join(GRA, 'data/tech.json'), 'utf8'));
    const techs = Array.isArray(techRaw) ? techRaw : techRaw.technologie;
    const hits = new Set();
    for (const b of buildings) {
      if (cards[b.id].ukryty) continue;
      const t = techs.find((x) => x.Technologia === b.techUnlock);
      if (!t) continue;
      // Wartości tak, jak je pokazuje kafelek po filtrze efektów martwych (ten sam filtr co karta odkrycia).
      const rows = {
        'Odblokowuje budynek': filterDeadEffectText(t['Odblokowuje budynek'], t.Technologia),
        'Wymaga budynek': filterDeadEffectText(t['wymagany budynek'], t.Technologia),
        'Surowiec (tech)': filterDeadEffectText(t['Dostęp do surowca.'], t.Technologia),
        'Odblokowuje surowiec': filterDeadEffectText(t['Odblokowuje surowiec.'], t.Technologia),
        'Odblokowuje pole': filterDeadEffectText(t['Odblokowuje ulepszenie terenu'], t.Technologia),
        'Uwagi tech': filterDeadEffectText(playerFacingNote(t.Uwagi), t.Technologia),
      };
      for (const [k, v] of Object.entries(rows)) {
        if (!v || isEmptyDataVal(v)) continue;
        for (const f of new Set([...(martwe[b.id] || []), ...(martwe['*'] || [])])) {
          if (String(v).includes(f)) hits.add(`${b.id}|${b.techUnlock}|${k}|${f}`);
        }
      }
    }
    // Stan po R-WEB-CARDS-RESOURCE-PURPOSE-Q1 (DODATEK 1, decyzja właściciela ABC 2026-11-09):
    // wpisy `_martweFrazy` warsztat_oblezniczy („Katapult”) i akademia_wojskowa („elit”) były BŁĘDEM
    // DANYCH (Katapulta to realna jednostka odblokowywana przez Warsztat oblężniczy —
    // buildings.json:1637-1639, cities.ts:845-851; „elitarne” to realna bramka jednostek) — usunięte
    // z gen-building-cards-top5.korekty.json. Teraz karta budynku i kafelek „Technologie” pokazują to
    // samo, a ZNANY STAN jest PUSTY: każde nowe trafienie frazy martwej w kafelku to regres.
    // (Teatr/Filozofia ukryty wspólnym filtrem techDeadEffects.ts od R-WEB-CITYPANEL-TECH-TILE-DEAD-EFFECTS-Q1.)
    const ZNANY_STAN_HOST = [];
    check('[G] `_martweFrazy` nie zawiera już fałszywych wpisów Katapult/elit (DODATEK 1)',
      !(martwe.warsztat_oblezniczy || []).includes('Katapult') && !(martwe.akademia_wojskowa || []).includes('elit'),
      { warsztat_oblezniczy: martwe.warsztat_oblezniczy, akademia_wojskowa: martwe.akademia_wojskowa });
    check('[G] karta Akademii wojskowej nie zawiera frazy „elit” (kafelek i karta spójne)',
      !JSON.stringify(cards.akademia_wojskowa).includes('elit'));
    for (const h of [...hits].sort()) console.log('ZNANY STAN (host cityPanel, poza allowlistą): ' + h);
    const nowe = [...hits].filter((h) => !ZNANY_STAN_HOST.includes(h));
    const zniknely = ZNANY_STAN_HOST.filter((h) => !hits.has(h));
    check('[G] brak NOWYCH fraz martwych w kafelku „Technologie” hosta (regres)', nowe.length === 0, nowe);
    check('[G] znany stan aktualny (gdy cityPanel naprawiony — zaktualizuj ZNANY_STAN_HOST)', zniknely.length === 0, zniknely);
  }

  // ---- bundle + przeglądarka ---------------------------------------------------------------
  fs.writeFileSync(ENTRY, [
    "import { renderEntityCard, buildEntityCardData, ENTITY_CARD_CSS } from '../src/ui/entityCards/renderer.ts';",
    "import { buildingAdapter } from '../src/ui/entityCards/buildingAdapter.ts';",
    "import { resolveBuildingRow } from '../src/ui/entityCards/registry.ts';",
    "import buildingsData from '../data/buildings.json';",
    'window.__renderEntityCard = renderEntityCard;',
    'window.__buildEntityCardData = buildEntityCardData;',
    'window.__ENTITY_CARD_CSS = ENTITY_CARD_CSS;',
    'window.__buildingAdapter = buildingAdapter;',
    'window.__resolveBuildingRow = resolveBuildingRow;',
    'window.__buildings = buildingsData;',
    '',
  ].join('\n'), 'utf8');
  await esbuild.build({
    entryPoints: [ENTRY], bundle: true, platform: 'browser', format: 'iife', target: 'es2020',
    outfile: OUTFILE, absWorkingDir: GRA, loader: { '.ts': 'ts' }, plugins: [stubPlugin], logLevel: 'silent',
  });

  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 760, height: 900 }, deviceScaleFactor: 1 });
  const consoleErrors = [];
  page.on('pageerror', (e) => consoleErrors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  await page.setContent('<html><body style="margin:0;background:#0b0e14;color:#e8e0c8;font-family:Segoe UI,Tahoma,sans-serif"><div id="root" style="width:660px;padding:16px"></div></body></html>');
  await page.addScriptTag({ content: fs.readFileSync(OUTFILE, 'utf8') });
  await page.evaluate(() => {
    const style = document.createElement('style');
    style.textContent = window.__ENTITY_CARD_CSS;
    document.head.appendChild(style);
  });

  const rendered = await page.evaluate(() => {
    const out = {};
    for (const row of window.__buildings) {
      const data = window.__buildingAdapter(row, {});
      const card = window.__renderEntityCard(data);
      document.getElementById('root').appendChild(card);
      const body = card.querySelector('.entity-card-body');
      const orderedKeys = Array.from(body.children).map((c) =>
        c.classList.contains('entity-card-historia') ? '__historia__' : c.getAttribute('data-section-key'));
      const top5 = Array.from(card.querySelectorAll('[data-section-key="top5"] .entity-card-top3-item')).map((it) => ({
        tytul: (it.querySelector('.entity-card-top3-title') || {}).textContent || '',
        zdanie: (it.querySelector('.entity-card-top3-text') || {}).textContent || '',
      }));
      const headingOf = (key) => {
        const h = card.querySelector(`[data-section-key="${key}"] .entity-card-section-heading-label`)
          || card.querySelector(`[data-section-key="${key}"] .entity-card-section-heading`);
        return h ? h.textContent.trim() : null;
      };
      const cmz = Array.from(card.querySelectorAll('[data-section-key="actions"] .entity-card-prose')).map((p) => p.textContent);
      const actionRowsAll = card.querySelectorAll('[data-section-key="actions"] .entity-card-row, [data-section-key="actions"] .entity-card-prose').length;
      out[row.id] = {
        orderedKeys, top5, cmz, actionRowsAll,
        top5Heading: headingOf('top5'),
        actionsHeading: headingOf('actions'),
        hasTop3Section: !!card.querySelector('[data-section-key="top3"]'),
        hasHistoria: !!card.querySelector('.entity-card-historia'),
        // Tekst karty BEZ Rysu historycznego — proza historyczna legalnie mówi np. o katapultach.
        text: (() => { const c = card.cloneNode(true); c.querySelectorAll('.entity-card-historia').forEach((h) => h.remove()); return c.textContent; })(),
        resolverNull: window.__resolveBuildingRow(row.id) == null,
        cardDataNull: window.__buildEntityCardData('building', row.id) == null,
      };
      card.remove();
    }
    return out;
  });

  let fallbackUsed = 0;
  for (const b of buildings) {
    const id = b.id;
    const exp = cards[id];
    const r = rendered[id];
    if (!exp || !r) { check(`[B] ${id}: wyrenderowano kartę z wpisem danych`, false); continue; }
    if (exp.ukryty) {
      // ---- [F] ukryte ----
      check(`[F] ${id}: resolver zwraca null (karta ukryta)`, r.resolverNull);
      check(`[F] ${id}: buildEntityCardData('building') zwraca null (karta ukryta)`, r.cardDataNull);
      check(`[F] ${id}: adapter wołany wprost — brak Top 5 i CMZ`, !r.orderedKeys.includes('top5') && !r.orderedKeys.includes('actions') && !r.hasTop3Section, r.orderedKeys);
      continue;
    }
    check(`[F] ${id}: widoczny budynek ma kartę (resolver != null)`, !r.resolverNull && !r.cardDataNull);
    // ---- [B] Top 5 ----
    check(`[B] ${id}: karta ma Rys historyczny`, r.hasHistoria);
    const hi = r.orderedKeys.indexOf('__historia__');
    check(`[B] ${id}: sekcja „Top 5” BEZPOŚREDNIO po Rysie historycznym`, hi > -1 && r.orderedKeys[hi + 1] === 'top5', r.orderedKeys);
    check(`[B] ${id}: tytuł sekcji = „Top 5”`, r.top5Heading === 'Top 5', r.top5Heading);
    check(`[B] ${id}: brak dawnej sekcji „Top 3”`, !r.hasTop3Section && !r.orderedKeys.includes('top3'));
    check(`[B] ${id}: Top 5 ma 1–5 pozycji`, r.top5.length >= 1 && r.top5.length <= 5, r.top5.length);
    check(`[B] ${id}: Top 5 zgodne z danymi (tytuł + zdanie, kolejność)`,
      JSON.stringify(r.top5) === JSON.stringify(exp.top5.map((i) => ({ tytul: i.tytul, zdanie: i.zdanie }))),
      { got: r.top5, exp: exp.top5 });
    check(`[B] ${id}: każda pozycja ma tytuł i jedno zdanie`,
      r.top5.every((i) => i.tytul.trim() !== '' && i.zdanie.trim() !== ''
        // jedno zdanie = brak końca zdania, po którym zaczyna się kolejne (skróty „np.”/„maks.” dozwolone)
        && !/[.!?]\s+[A-ZĄĆĘŁŃÓŚŹŻ]/.test(i.zdanie.trim())), r.top5);
    check(`[B] ${id}: Top1 nie jest warunkiem/rozbudową/wymaganiem`,
      r.top5[0] && !/^(Warunek|Rozbudowa|Otwiera|Wymaga)\b/.test(r.top5[0].tytul), r.top5[0]);
    // ---- [C] CMZ ----
    check(`[C] ${id}: „Co możesz teraz zrobić” BEZPOŚREDNIO po Top 5`,
      r.orderedKeys[r.orderedKeys.indexOf('top5') + 1] === 'actions', r.orderedKeys);
    check(`[C] ${id}: tytuł sekcji = „Co możesz teraz zrobić”`, r.actionsHeading === 'Co możesz teraz zrobić', r.actionsHeading);
    check(`[C] ${id}: CMZ 1–3 zdania`, r.cmz.length >= 1 && r.cmz.length <= 3, r.cmz);
    const cmzDataBad = exp.cmz.filter((c) => {
      const cz = String(c.czynnosc || '').trim();
      const ko = String(c.korzysc || '').trim();
      return !cz || !ko || cz === ko
        || cz.split(/\s+/).length < 2 || ko.split(/\s+/).length < 2
        || !/^[A-ZĄĆĘŁŃÓŚŹŻ]/.test(cz)
        || /(^|\s)(aby|w celu|żeby)(\s|$)/i.test(cz)
        || /^(aby|w celu|żeby|jeśli)(\s|$)/i.test(ko)
        || /[,.]$/.test(cz) || /\.$/.test(ko);
    });
    check(`[C] ${id}: dane CMZ — czynność i korzyść niepuste, różne, bez spójnika i interpunkcji szablonu`, cmzDataBad.length === 0, cmzDataBad);
    check(`[C] ${id}: każde zdanie CMZ = „<czynność>, aby <korzyść>.” złożone dokładnie z danych`,
      r.cmz.length === exp.cmz.length
        && r.cmz.every((s, i) => s.trim() === `${exp.cmz[i].czynnosc.trim()}, aby ${exp.cmz[i].korzysc.trim()}.`),
      { got: r.cmz, exp: exp.cmz });
    check(`[C] ${id}: CMZ tylko z danych (brak dodatkowych wierszy)`, r.actionRowsAll === exp.cmz.length, r.actionRowsAll);
    for (const ban of BANNED) check(`[C/D] ${id}: brak frazy „${ban}”`, !r.text.includes(ban), ban);
    // ---- [D] martwe efekty + reszta kolejności ----
    for (const f of [...(martwe[id] || []), ...(martwe['*'] || [])]) {
      check(`[D] ${id}: efekt martwy/niedostępny „${f}” nieobecny na karcie`, !r.text.includes(f), f);
    }
    const tail = r.orderedKeys.slice(r.orderedKeys.indexOf('actions') + 1);
    check(`[D] ${id}: dalsza kolejność sekcji nietknięta (Charakterystyka → Plony → Koszty → Poziomy)`,
      JSON.stringify(tail) === JSON.stringify(TAIL_ORDER.filter((k) => tail.includes(k))) && tail[0] === 'characteristics', tail);
    check(`[D] ${id}: pierwsze sekcje = Wymagania → Opis → Rys (indeksy 0/1/2)`,
      JSON.stringify(r.orderedKeys.slice(0, 3)) === JSON.stringify(['requirements', 'description', '__historia__']), r.orderedKeys.slice(0, 4));
    if (!exp.top5 || exp.top5.length === 0) fallbackUsed++;
  }
  check('[D] fallback na dawne `top3` użyty 0/44 razy', fallbackUsed === 0, fallbackUsed);

  // ---- [E] przypadki szczególne ------------------------------------------------------------
  const R = (id) => rendered[id];
  const all = (id) => R(id).top5.map((i) => i.tytul + ' ' + i.zdanie).join(' | ');
  const t1 = (id) => R(id).top5[0].tytul + ' ' + R(id).top5[0].zdanie;
  check('[E] Mennica: Top1 z „×1,5”', /^×1,5\b/.test(R('mennica').top5[0].tytul), R('mennica').top5[0]);
  // R-WEB-TERMINOLOGY-TRADE-VS-TAX-Q1: podatek z pól i budynków to nie handel — Top1 mówi „podatek”.
  check('[E] Mennica: Top1 = podatek → pieniądz (mnoży podatek miast, część trafia w pieniądz; bez „handlu”)',
    /podat/.test(t1('mennica')) && /pieniądz/.test(t1('mennica')) && !/handl|handel/.test(t1('mennica')), R('mennica').top5[0]);
  check('[E] Koszary: Top1 = bramka rekrutacji wojska epoki Brązu i Żelaza',
    /Rekrutacja/.test(R('koszary').top5[0].tytul) && /Brązu i Żelaza/.test(t1('koszary')), R('koszary').top5[0]);
  check('[E] Koszary: CMZ mówi o rekrutacji wojska epoki Brązu i Żelaza', R('koszary').cmz.some((s) => /rekrutować wojsko epoki Brązu i Żelaza/.test(s)), R('koszary').cmz);
  check('[E] Akwedukt: Top1 = limit ludności 20', /Limit ludności/.test(R('akwedukt').top5[0].tytul) && /20/.test(R('akwedukt').top5[0].tytul), R('akwedukt').top5[0]);
  check('[E] Akwedukt: CMZ — limit ludności do 20', R('akwedukt').cmz.some((s) => /limit ludności miasta do 20/.test(s)), R('akwedukt').cmz);
  check('[E] Trybunał: Top1 = −30% korupcji (FALA 560)', /^−30% korupcji/.test(R('trybunal').top5[0].tytul), R('trybunal').top5[0]);
  check('[E] Trybunał: +17 pkt Prawa nadal w Top 5', /\+17 pkt Prawa/.test(all('trybunal')), all('trybunal'));
  check('[E] Trybunał: CMZ — obniżenie korupcji o 30%', R('trybunal').cmz.some((s) => /korupcję w mieście o 30%/.test(s)), R('trybunal').cmz);
  for (const id of ['palac', 'palac_ii', 'palac_iii']) {
    check(`[E] ${id}: pozycja „−30% korupcji” w Top 5`, R(id).top5.some((i) => /^−30% korupcji/.test(i.tytul)), R(id).top5);
  }
  check('[E] Pretorium: brak nieaktualnego „Jedyny — obok Sądu”', !/Jedyny/.test(R('pretorium').text), all('pretorium'));
  check('[E] Garnizon: Top1 = Milicja (1 obrońca na mieszkańca)', /^Milicja: 1 obrońca na mieszkańca/.test(R('garnizon').top5[0].tytul), R('garnizon').top5[0]);
  check('[E] Warsztat oblężniczy: Top1 = +10% parametrów jednostek; Katapulta na karcie (DODATEK 1: realna jednostka, karta = kafelek)',
    /^\+10% parametrów jednostek/.test(R('warsztat_oblezniczy').top5[0].tytul) && /Katapult/.test(cards.warsztat_oblezniczy.cmz[0].korzysc), R('warsztat_oblezniczy').top5[0]);
  check('[E] Asymilacja kultury z dopiskiem „podbite miasta” (założenie Q6-A) na każdej karcie',
    buildings.filter((b) => !cards[b.id].ukryty).every((b) => R(b.id).top5.filter((i) => /^Asymilacja kultury/.test(i.tytul)).every((i) => /podbite miasta/.test(i.tytul))));
  check('[E] Targowisko: zamiana Pracy na podatek (tylko gracz, założenie Q7-A)', /Zamiana Pracy na podatek/.test(all('targowisko')) && /tylko gracz/.test(all('targowisko')), all('targowisko'));

  // ---- zrzuty (część E dispatchu) ------------------------------------------------------------
  if (SCREENS_DIR) {
    fs.mkdirSync(SCREENS_DIR, { recursive: true });
    for (const id of SCREEN_IDS) {
      await page.evaluate((bid) => {
        const root = document.getElementById('root');
        root.innerHTML = '';
        const row = window.__buildings.find((b) => b.id === bid);
        root.appendChild(window.__renderEntityCard(window.__buildingAdapter(row, {})));
      }, id);
      const file = path.join(SCREENS_DIR, `${id}.png`);
      await page.locator('#root').screenshot({ path: file });
      console.log('screen: ' + path.relative(process.cwd(), file));
    }
  }

  check('brak błędów konsoli/pageerror', consoleErrors.length === 0, consoleErrors);
  await browser.close();
  try { fs.unlinkSync(ENTRY); } catch (_e) { /* noop */ }
  try { fs.unlinkSync(OUTFILE); } catch (_e) { /* noop */ }
  console.log(`[building-cards-top5-test] ${pass} pass, ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
