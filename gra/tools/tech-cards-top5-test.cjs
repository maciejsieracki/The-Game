'use strict';
/**
 * tech-cards-top5-test.cjs — R-WEB-TECH-CARDS-TOP5-IMPLEMENT-Q1 (część D/E).
 *
 * Na REALNYM adapterze (`technologyAdapter.ts`) i REALNYM rendererze (`renderer.ts`),
 * zbundlowanych esbuildem i uruchomionych w prawdziwym Chromium (Playwright) — ten sam wzorzec
 * co `karta-technologia-uklad-real-render-test.cjs` — sprawdza dla KAŻDEGO z 32 odkryć:
 *   [A] dane: `data/tech-cards-top5.json` ma wpis dla każdego odkrycia z `tech.json`, brak
 *       osieroconych; generator `gen-tech-cards-top5.cjs --check` zgodny z plikiem;
 *   [B] sekcja „Top 5 korzyści” istnieje i stoi BEZPOŚREDNIO po Rysie historycznym, ma 1–5
 *       pozycji zgodnych z danymi (tytuł + zdanie); wyjątek jawny: Astronomia (0 realnych
 *       efektów — jej jedyny efekt jest martwy i ukryty, decyzje Q2/Q3 właściciela);
 *   [C] „Co możesz teraz zrobić” = zdania CZYNNOŚĆ → KORZYŚĆ złożone dokładnie z pól
 *       `czynnosc`/`korzysc` (pola niepuste, różne, frazy ≥2 słowa, bez spójnika w polach);
 *       zero szablonów „masła maślanego” i zero wiersza „Nie oznacza”;
 *   [D] efekty martwe (`ukryte`) nie pojawiają się w żadnej sekcji karty, brak słowa
 *       „niedostępn”; fallback na dawne szablony użyty 0 razy;
 *   [E] przypadki szczególne: Mennica ×1,50 + podatek; Top1 Matematyki i Obróbki żelaza =
 *       „Otwiera drogę do …”; ulepszenia z `terrain-improvements.json` (Kopalnie, Stadnina);
 *       sekcja „Cuda” z oznaczeniem narodowy/wyścig.
 * Opcjonalnie `--screens <katalog>` zapisuje zrzuty PNG 6 kart (Waluta, Wojskowość,
 * Brązownictwo, Astronomia, Medycyna, Matematyka). Ikony brandAssets są w teście zastąpione
 * stubem (jak w pozostałych testach kart) — zrzut pokazuje treść i układ, nie grafikę ikon.
 *
 * Usage (z gra/): node tools/tech-cards-top5-test.cjs [--screens <dir>]
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[tech-cards-top5-test] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const STUB_DIR = path.resolve(__dirname, '.stubs');
const BRAND_ASSETS_STUB = path.resolve(STUB_DIR, 'entity-card-contract-brandAssets-stub.ts');
const SCIENCE_OWL_STUB = path.resolve(STUB_DIR, 'entity-card-contract-scienceOwlIcon-stub.ts');
const ENTRY = path.resolve(__dirname, '.tech-cards-top5-entry.ts');
const OUTFILE = path.resolve(__dirname, '.tech-cards-top5-bundle.cjs');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const SCREEN_TECHS = ['Waluta', 'Wojskowość', 'Brązownictwo', 'Astronomia', 'Medycyna', 'Matematyka'];

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
const warnings = [];
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

const BANNED = [
  'Nie oznacza', 'jeśli spełniasz ich wymagania', 'jeśli spełnisz ich wymagania',
  'na odpowiednim złożu', 'Wybierz dalszy kierunek badań', 'Sprawdź dostęp do surowca',
  'niedostępn',
];

async function main() {
  // ---- [A] dane ---------------------------------------------------------------------------
  const techs = JSON.parse(fs.readFileSync(path.join(GRA, 'data/tech.json'), 'utf8')).technologie;
  const cards = JSON.parse(fs.readFileSync(path.join(GRA, 'data/tech-cards-top5.json'), 'utf8'));
  const cardKeys = Object.keys(cards).filter((k) => !k.startsWith('_'));
  check('[A] tech.json ma 32 odkrycia', techs.length === 32, techs.length);
  const missing = techs.map((t) => t.Technologia).filter((n) => !cards[n]);
  check('[A] każde odkrycie z tech.json ma wpis w tech-cards-top5.json (32/32)', missing.length === 0, missing);
  const orphans = cardKeys.filter((k) => !techs.some((t) => t.Technologia === k));
  check('[A] brak osieroconych wpisów w tech-cards-top5.json', orphans.length === 0, orphans);
  const gen = spawnSync(process.execPath, [path.join(__dirname, 'gen-tech-cards-top5.cjs'), '--check'], { encoding: 'utf8' });
  check('[A] gen-tech-cards-top5.cjs --check: dane zgodne z generatorem', gen.status === 0, (gen.stderr || gen.stdout).trim());
  const tdnSrc = fs.readFileSync(path.join(GRA, 'src/ui/techDiscoveryNotice.ts'), 'utf8');
  check('[A] techDiscoveryNotice.ts (ścieżka zapasowa) bez wiersza „Nie oznacza”', !tdnSrc.includes("'Nie oznacza'"));
  check('[A] techDiscoveryNotice.ts czyta CMZ z tych samych danych (techCardContentOf)', tdnSrc.includes('techCardContentOf('));

  // ---- bundle + przeglądarka ---------------------------------------------------------------
  fs.writeFileSync(ENTRY, [
    "import { renderEntityCard, ENTITY_CARD_CSS } from '../src/ui/entityCards/renderer.ts';",
    "import { technologyAdapter } from '../src/ui/entityCards/technologyAdapter.ts';",
    "import techData from '../data/tech.json';",
    'window.__renderEntityCard = renderEntityCard;',
    'window.__ENTITY_CARD_CSS = ENTITY_CARD_CSS;',
    'window.__technologyAdapter = technologyAdapter;',
    'window.__techs = techData.technologie;',
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
    for (const row of window.__techs) {
      const data = window.__technologyAdapter(row);
      const card = window.__renderEntityCard(data);
      document.getElementById('root').appendChild(card);
      const body = card.querySelector('.entity-card-body');
      const orderedKeys = Array.from(body.children).map((c) =>
        c.classList.contains('entity-card-historia') ? '__historia__' : c.getAttribute('data-section-key'));
      const sectionText = (key) => {
        const s = card.querySelector(`[data-section-key="${key}"]`);
        return s ? s.textContent : '';
      };
      const top5 = Array.from(card.querySelectorAll('[data-section-key="top5"] .entity-card-top3-item')).map((it) => ({
        tytul: (it.querySelector('.entity-card-top3-title') || {}).textContent || '',
        zdanie: (it.querySelector('.entity-card-top3-text') || {}).textContent || '',
      }));
      const cmz = Array.from(card.querySelectorAll('[data-section-key="actions"] .entity-card-prose')).map((p) => p.textContent);
      const actionRowsAll = card.querySelectorAll('[data-section-key="actions"] .entity-card-row, [data-section-key="actions"] .entity-card-prose').length;
      const labels = {};
      for (const key of ['buildings', 'units', 'improvements', 'wonders', 'next', 'econ']) {
        labels[key] = Array.from(card.querySelectorAll(`[data-section-key="${key}"] .entity-card-row-key, [data-section-key="${key}"] .entity-card-row-action-text`))
          .map((e) => e.textContent.trim());
      }
      const wondersRows = Array.from(card.querySelectorAll('[data-section-key="wonders"] .entity-card-row')).map((r) => r.textContent.trim());
      out[row.Technologia] = {
        orderedKeys, top5, cmz, actionRowsAll, labels, wondersRows,
        // Fallback (dawne szablony) renderuje wiersze z plakietką `.entity-card-row-badge`.
        actionBadges: card.querySelectorAll('[data-section-key="actions"] .entity-card-row-badge').length,
        hasHistoria: !!card.querySelector('.entity-card-historia'),
        // Tekst karty BEZ Rysu historycznego — proza historyczna legalnie używa słów typu
        // „niedostępne” (Wymiana, Brązownictwo…), a zakaz dotyczy treści mechaniki.
        text: (() => { const c = card.cloneNode(true); c.querySelectorAll('.entity-card-historia').forEach((h) => h.remove()); return c.textContent; })(),
        econText: sectionText('econ'),
      };
      card.remove();
    }
    return out;
  });

  let fallbackUsed = 0;
  for (const t of techs) {
    const name = t.Technologia;
    const exp = cards[name];
    const r = rendered[name];
    if (!exp || !r) { check(`[B] ${name}: wyrenderowano kartę z wpisem danych`, false); continue; }
    // [B] Top 5
    check(`[B] ${name}: karta ma Rys historyczny`, r.hasHistoria);
    if (exp.top5.length === 0) {
      check(`[B] ${name}: WYJĄTEK — 0 realnych efektów (tylko Astronomia), sekcja Top 5 nie jest renderowana`,
        name === 'Astronomia' && !r.orderedKeys.includes('top5'), { name, keys: r.orderedKeys });
    } else {
      const hi = r.orderedKeys.indexOf('__historia__');
      check(`[B] ${name}: sekcja „Top 5 korzyści” BEZPOŚREDNIO po Rysie historycznym`,
        hi > -1 && r.orderedKeys[hi + 1] === 'top5', r.orderedKeys);
      check(`[B] ${name}: Top 5 ma 1–5 pozycji`, r.top5.length >= 1 && r.top5.length <= 5, r.top5.length);
      check(`[B] ${name}: Top 5 zgodne z danymi (tytuł + zdanie, kolejność)`,
        JSON.stringify(r.top5) === JSON.stringify(exp.top5.map((i) => ({ tytul: i.tytul, zdanie: i.zdanie }))),
        { got: r.top5, exp: exp.top5 });
      check(`[B] ${name}: każda pozycja Top 5 ma tytuł i jedno zdanie`,
        r.top5.every((i) => i.tytul.trim() !== '' && i.zdanie.trim() !== ''), r.top5);
      check(`[B] ${name}: brak NIE_USTALONO na karcie`, !r.text.includes('NIE_USTALONO'));
    }
    // [C] CMZ
    if (exp.cmz.length === 0) {
      check(`[C] ${name}: brak CMZ w danych ⇒ brak wierszy „Co możesz teraz zrobić”`, r.actionRowsAll === 0, r.actionRowsAll);
    } else {
      check(`[C] ${name}: CMZ zgodne z danymi (liczba zdań)`, r.cmz.length === exp.cmz.length, { got: r.cmz, exp: exp.cmz });
      // Obrona r1 (Z5): sam regex „aby” jest tautologiczny (cmzSentence() zawsze wstawia „, aby ”),
      // więc ochronę dają asercje na DANYCH i dokładne złożenie zdania z obu pól.
      const cmzDataBad = exp.cmz.filter((c) => {
        const cz = String(c.czynnosc || '').trim();
        const ko = String(c.korzysc || '').trim();
        return !cz || !ko || cz === ko
          || cz.split(/\s+/).length < 2 || ko.split(/\s+/).length < 2 // czynność i korzyść to frazy, nie pojedyncze słowa
          || !/^[A-ZĄĆĘŁŃÓŚŹŻ]/.test(cz) // czynność zaczyna zdanie
          || /(^|\s)(aby|w celu|żeby)(\s|$)/i.test(cz) // spójnik należy do szablonu, nie do czynności
          || /^(aby|w celu|żeby)(\s|$)/i.test(ko) // brak „aby aby”
          || /[,.]$/.test(cz) || /\.$/.test(ko); // interpunkcję dokłada szablon
      });
      check(`[C] ${name}: dane CMZ — czynność i korzyść niepuste, różne, bez spójnika i interpunkcji szablonu`,
        cmzDataBad.length === 0, cmzDataBad);
      check(`[C] ${name}: każde zdanie CMZ = „<czynność>, aby <korzyść>.” złożone dokładnie z danych`,
        r.cmz.length === exp.cmz.length
          && r.cmz.every((s, i) => s.trim() === `${exp.cmz[i].czynnosc.trim()}, aby ${exp.cmz[i].korzysc.trim()}.`),
        { got: r.cmz, exp: exp.cmz });
      check(`[C] ${name}: CMZ tylko z danych (brak dodatkowych wierszy szablonu)`, r.actionRowsAll === exp.cmz.length, r.actionRowsAll);
    }
    if (r.actionBadges > 0) fallbackUsed++;
    // [C]/[D] zakazane frazy
    for (const b of BANNED) check(`[C/D] ${name}: brak frazy „${b}”`, !r.text.includes(b), b);
    // [D] ukryte
    for (const u of exp.ukryte) {
      for (const [key, labs] of Object.entries(r.labels)) {
        check(`[D] ${name}: efekt martwy „${u}” ukryty w sekcji ${key}`, !labs.some((l) => l === u || l.startsWith(u + ' ')), labs);
      }
      check(`[D] ${name}: efekt martwy „${u}” nieobecny w Zmianach ekonomicznych`, !r.econText.includes(u));
    }
  }
  check('[D] fallback na dawne szablony CMZ użyty 0/32 razy', fallbackUsed === 0, fallbackUsed);
  if (fallbackUsed > 0) warnings.push(`fallback CMZ dla ${fallbackUsed} odkryć`);

  // ---- [E] przypadki szczególne ------------------------------------------------------------
  const waluta = rendered['Waluta'];
  // R-WEB-TERMINOLOGY-TRADE-VS-TAX-Q1: Mennica mnoży PODATEK (nie „handel”) — oczekiwanie zaktualizowane
  // do nowej terminologii (asercja nie osłabiona: nadal wymaga ×1,50 i nazwanego strumienia).
  check('[E] Waluta: pozycja Mennicy z „×1,50” i „podatek” (bez „handel”)',
    waluta.top5.some((i) => /Mennica/.test(i.tytul) && (i.tytul + ' ' + i.zdanie).includes('×1,50')
      && /podat/.test(i.tytul + ' ' + i.zdanie) && !/handl|handel/.test(i.tytul + ' ' + i.zdanie)), waluta.top5);
  check('[E] Waluta: Top1 = Mennica ×1,50', /^Mennica: ×1,50/.test(waluta.top5[0].tytul), waluta.top5[0]);
  for (const n of ['Matematyka', 'Obróbka żelaza']) {
    check(`[E] ${n}: Top1 = jawne „Otwiera drogę do …” (Q7 właściciela)`, /^Otwiera drogę do /.test(rendered[n].top5[0].tytul), rendered[n].top5[0]);
  }
  check('[E] Filozofia: Teatr (suppressed) ukryty', !rendered['Filozofia'].labels.buildings.includes('Teatr') && !rendered['Filozofia'].text.includes('Teatr'));
  check('[E] Obróbka żelaza: Wielka odlewnia/Wielka Kuźnia (epoka 4) ukryte',
    !/Wielka odlewnia|Wielka Kuźnia/.test(rendered['Obróbka żelaza'].text), rendered['Obróbka żelaza'].labels.buildings);
  check('[E] Astronomia: brak Obserwatorium na karcie', !rendered['Astronomia'].text.includes('Obserwatorium'));
  check('[E] Brązownictwo: Ulepszenia z terrain-improvements.json (Kopalnia miedzi + Kopalnia cyny)',
    ['Kopalnia miedzi', 'Kopalnia cyny'].every((n) => rendered['Brązownictwo'].labels.improvements.includes(n)), rendered['Brązownictwo'].labels.improvements);
  check('[E] Hutnictwo żelaza: Kopalnia żelaza na karcie', rendered['Hutnictwo żelaza'].labels.improvements.includes('Kopalnia żelaza'), rendered['Hutnictwo żelaza'].labels.improvements);
  check('[E] Jeździectwo: Stadnina na karcie', rendered['Jeździectwo'].labels.improvements.includes('Stadnina'), rendered['Jeździectwo'].labels.improvements);
  check('[E] Obróbka drewna i Murarstwo: Posterunek (bramka AND) na obu kartach',
    rendered['Obróbka drewna'].labels.improvements.includes('Posterunek (Strażnica)') && rendered['Murarstwo'].labels.improvements.includes('Posterunek (Strażnica)'));
  check('[E] Wymiana: Cuda — Pałac Weiyang oznaczony jako cud narodowy Chińczyków',
    rendered['Wymiana'].wondersRows.some((t) => t.includes('Pałac Weiyang') && t.includes('Cud narodowy: Chińczycy') && t.includes('maks. 1 na świecie')), rendered['Wymiana'].wondersRows);
  check('[E] Mistycyzm: Cuda — Wyrocznia oznaczona jako wyścig',
    rendered['Mistycyzm'].wondersRows.some((t) => t.includes('Wyrocznia') && t.includes('Wyścig')), rendered['Mistycyzm'].wondersRows);
  check('[E] Żegluga: kolejność sekcji z Top 5 i Cudami',
    JSON.stringify(rendered['Żegluga'].orderedKeys) === JSON.stringify(['requirements', 'characteristics', '__historia__', 'top5', 'actions', 'buildings', 'units', 'improvements', 'wonders', 'next', 'econ']),
    rendered['Żegluga'].orderedKeys);

  // ---- zrzuty (część E dispatchu) ------------------------------------------------------------
  if (SCREENS_DIR) {
    fs.mkdirSync(SCREENS_DIR, { recursive: true });
    for (const name of SCREEN_TECHS) {
      await page.evaluate((n) => {
        const root = document.getElementById('root');
        root.innerHTML = '';
        const row = window.__techs.find((t) => t.Technologia === n);
        root.appendChild(window.__renderEntityCard(window.__technologyAdapter(row)));
      }, name);
      const file = path.join(SCREENS_DIR, `${name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l').replace(/\s+/g, '-').toLowerCase()}.png`);
      await page.locator('#root').screenshot({ path: file });
      console.log('screen: ' + path.relative(process.cwd(), file));
    }
  }

  check('brak błędów konsoli/pageerror', consoleErrors.length === 0, consoleErrors);
  await browser.close();
  try { fs.unlinkSync(ENTRY); } catch (_e) { /* noop */ }
  try { fs.unlinkSync(OUTFILE); } catch (_e) { /* noop */ }
  if (warnings.length) console.log('WARN: ' + warnings.join('; '));
  console.log(`[tech-cards-top5-test] ${pass} pass, ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
