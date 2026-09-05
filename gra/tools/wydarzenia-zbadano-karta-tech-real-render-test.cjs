'use strict';
/**
 * wydarzenia-zbadano-karta-tech-real-render-test.cjs
 *
 * TEMAT: P-WYDARZENIA-ZBADANO-KLIK-KARTA-TECH-Q1 — obie części zgłoszenia właściciela:
 *
 *  (A) „Komunikat, na przykład, zbadano rolnictwo; jeżeli się naciśnie, powinno
 *      przekierowywać do karty technologii, która została zbadana, a niestety się nie dzieje."
 *  (B) „naciskam na szczegóły, na przykład o obozie łowieckim, ekran się wytwarza, ale nie
 *      pojawia się obok, tylko pod spodem. Powinno się pojawić obok."
 *
 * R-TECH-KARTA-BOCZNA-KLIK-WIERSZ-REGRES-Q1 (regresja dwoch niedopasowanych commitow —
 * 57006261 wireSideCardLinks + 5b05773c caly-wiersz-przyciskiem — rozszerza scenariusze (B)):
 *  (B6) klik w LEWA CZESC wiersza „Obóz łowiecki" (etykieta, NIE przycisk „Szczegóły →") MUSI
 *       dawac IDENTYCZNY efekt jak klik w przycisk — karta BOCZNA obok, zero
 *       `.entity-card-backdrop`. Przed naprawa ten klik omijal capture-listener
 *       `wireSideCardLinks` (lapal tylko `button[data-entity-kind]`) i trafial w delegowany
 *       bąbelkowy listener `renderer.ts` -> `openDialog()` (karta pod spodem hosta 940 < 520).
 *  (B7) overflow karty bocznej PRZY TYPOWYCH SZEROKOSCIACH (1280/1440/1920 px) — pomiar
 *       `getBoundingClientRect().right <= window.innerWidth` ORAZ (RUNDA 2, po zarzucie
 *       Evaluatora) przepelnienie TRESCI karty `scrollHeight > clientHeight`. Sam prostokat
 *       NIE rozstrzyga: karta ma `max-height:calc(100vh-36px)` + `overflow:auto`, wiec
 *       miesci sie w viewporcie takze z pelnym dev-notem — zmierzone.
 *  (B7-K) KONTROLA NEGATYWNA (B7): oryginalny dev-note (czytany z `oboz_lowiecki.uwagi`)
 *       wstrzykniety do wyrenderowanego wiersza „Warunek" MUSI odwrocic metryke. Bez tego
 *       (B7) nie dowodzi zwiazku przyczynowego skrocenia `warunek` z domknieciem overflow.
 *  (B8) kryterium 5 ZYWO, nie tylko na JSON: `Farma` (Rolnictwo), `Trzoda`/`Owce`/`Lama`
 *       (Oswojenie zwierząt) — widoczny wiersz „Warunek" bez sygnatury notatki
 *       deweloperskiej i bez przepelnienia karty.
 *
 * DLACZEGO ŻYWA, ZBUDOWANA GRA (C-001), A NIE jsdom:
 *  - (A) rozstrzyga wyłącznie faktyczne kliknięcie MYSZĄ w faktycznie wyrenderowaną kartę
 *    panelu WYDARZENIA, po którym faktycznie otwiera się karta WŁAŚCIWEJ technologii.
 *    Precedens tej serii: `KRYTYCZNE: przyciski akcji karty technologii nie działają` —
 *    handlery BYŁY podpięte, a klik i tak nie dochodził (`.tdn-back` przechwytywało hit-test).
 *  - (B) to defekt czysto stackingowy: jsdom nie robi layoutu ani `elementFromPoint`, więc
 *    „obie karty są w DOM" przechodziłoby ZARÓWNO przed, jak i po naprawie. Rozstrzyga
 *    wyłącznie `getBoundingClientRect()` obu kart naraz + hit-test w ich środkach.
 *  - Lekcja `P-PROC-HARNESS-NIEPELNA-SCENA-Q1`: test NIE montuje fragmentu DOM bez rodziców.
 *    Cała scena to zbudowany artefakt `vite build` (`?playtest=mapa`) z prawdziwym hostem,
 *    prawdziwym panelem bocznym, prawdziwym stosem Esc i prawdziwymi kontekstami stackowania.
 *
 * DOWÓD NIETAUTOLOGICZNOŚCI — kontrole NEGATYWNE sprawdzające warstwę RUNTIME, nie prefiks id:
 *   (N1) `tech-done-12-nie_ma_takiej_technologii` — POPRAWNY prefiks rodziny, ale slug nie
 *        rozwija się w istniejącą technologię → BRAK skrótu, klik = no-op;
 *   (N2) `tech-done-12` (sam prefiks, bez tury i sluga) → jw.;
 *   (N3) dawna, generyczna karta `eot-hint-*` z tekstem „Zbadano: …" → nadal BEZ skrótu
 *        (id hintu nie niesie tożsamości technologii — to jest cała diagnoza (A));
 *   (N4) `tech-done-12-rolnictwo` po kliknięciu ✕ znika i NIE otwiera karty technologii.
 * Gdyby afordancja szła po samym prefiksie, (N1) i (N2) byłyby czerwone.
 *
 * Usage (z gra/): node tools/wydarzenia-zbadano-karta-tech-real-render-test.cjs
 *   --dist <katalog>   użyj gotowego katalogu vite build zamiast budować go w teście
 *   --shots <katalog>  zrzuty pomocnicze
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const argOf = (flag) => { const i = process.argv.indexOf(flag); return i > -1 ? process.argv[i + 1] : null; };
const SHOTS = argOf('--shots');
const DIST_ARG = argOf('--dist');
const OUT_DIR = DIST_ARG !== null ? path.resolve(DIST_ARG) : path.join(require('os').tmpdir(), 'civ-zbadano-karta-tech-dist');
const OUT_HTML = 'file://' + path.join(OUT_DIR, 'index.html') + '?playtest=mapa';

let pass = 0, fail = 0;
function assert(label, cond, detail) {
  if (cond) { pass++; console.log('  OK   ' + label); }
  else { fail++; console.error('  FAIL ' + label + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
}
const wait = (ms) => new Promise(r => setTimeout(r, ms));

/** R-TECH-KARTA-BOCZNA-KLIK-WIERSZ-REGRES-Q1, RUNDA 2 — ladunek kontroli negatywnej (B7-K).
 * NIE zaszyty na sztywno w tescie: to DOKLADNIE ten tekst, ktory przed naprawa siedzial w
 * `oboz_lowiecki.warunek` i byl renderowany graczowi — dzis zyje w nierenderowanym polu
 * `uwagi` (wzorzec P-TECH-UWAGI-WYCIEK-CITYPANEL-Q1). Czytamy go z danych, wiec kontrola
 * nie moze sie rozjechac z rzeczywistoscia przy kolejnych edycjach. */
const OBOZ_LOWIECKI_WARUNEK_ORIGIN_MAIN = (() => {
  const j = JSON.parse(fs.readFileSync(path.join(GRA_DIR, 'data', 'terrain-improvements.json'), 'utf8'));
  return String((j.oboz_lowiecki || {}).uwagi || '');
})();

function buildBundle() {
  if (DIST_ARG !== null) { console.log('[zbadano-test] uzywam gotowego dist: ' + OUT_DIR); return; }
  console.log('[zbadano-test] vite build (C-001: produkt budowania, zero dev servera)...');
  execSync(`node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(OUT_DIR)} --emptyOutDir`,
    { cwd: GRA_DIR, stdio: 'pipe' });
  if (!fs.existsSync(path.join(OUT_DIR, 'index.html'))) throw new Error('Build nie wyprodukowal index.html w ' + OUT_DIR);
}

async function launchBrowser(chromium) {
  try { return await chromium.launch({ headless: true }); }
  catch (e) { return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] }); }
}

async function gotoPlaytestMapa(page) {
  await page.goto(OUT_HTML, { waitUntil: 'load', timeout: 180000 });
  await page.waitForSelector('.civ-hud, .civ-ux-frame, .civ-cs', { timeout: 180000 });
  for (let i = 0; i < 120; i++) {
    if (await page.locator('text=Tworzenie świata').count() === 0) break;
    await wait(1000);
  }
  await page.waitForFunction(() => window.__sidePanelLinkTestDebug !== undefined && window.__eraTestDebug !== undefined, { timeout: 60000 });
  await wait(1500);
}

/** Realny klik MYSZĄ w kartę panelu WYDARZENIA, z weryfikacja hit-testu (panel jest
 * scrollowalny — bez tego kontrole negatywne byłyby falszywie zielone, bo klik by nie doszedl). */
async function clickCard(page, id, opts) {
  const sel = '.civ-side-panel .sp-event[data-id="' + id + '"]' + (opts && opts.sub ? ' ' + opts.sub : '');
  const loc = page.locator(sel);
  if (await loc.count() === 0) return { hit: false, why: 'brak elementu w DOM: ' + sel };
  await loc.scrollIntoViewIfNeeded();
  await wait(150);
  const box = await loc.boundingBox();
  if (box === null) return { hit: false, why: 'brak boundingBox' };
  const cx = (opts && opts.sub) ? box.x + box.width / 2 : box.x + 26;
  const cy = box.y + box.height / 2;
  const at = await page.evaluate(({ cx, cy }) => {
    const el = document.elementFromPoint(cx, cy);
    const card = el === null ? null : el.closest('.sp-event[data-id]');
    return { tag: el === null ? null : el.tagName, cls: el === null ? '' : String(el.className),
      cardId: card === null ? null : card.getAttribute('data-id') };
  }, { cx, cy });
  if (at.cardId !== id) return { hit: false, why: 'punkt kliku nie nalezy do karty', at };
  if (opts && opts.sub && !at.cls.includes(opts.subCls)) return { hit: false, why: 'punkt kliku nie trafia w ' + opts.sub, at };
  await page.mouse.click(cx, cy);
  await wait(700);
  return { hit: true, at };
}

async function readCard(page, id) {
  return page.evaluate((id) => {
    const c = document.querySelector('.civ-side-panel .sp-event[data-id="' + id + '"]');
    if (c === null) return { missing: true };
    const cta = c.querySelector('.sp-goto-cta');
    return {
      cta: cta === null ? null : (cta.textContent || '').replace(/\s+/g, ' ').trim(),
      ctaVisible: cta === null ? false : cta.getBoundingClientRect().width > 0,
      noLinkCls: c.classList.contains('sp-no-link'),
      cursor: getComputedStyle(c).cursor,
      role: c.getAttribute('role'), tabindex: c.getAttribute('tabindex'),
      hasDismiss: c.querySelector('.sp-close[data-dismiss]') !== null,
      text: (c.textContent || '').replace(/\s+/g, ' ').trim(),
    };
  }, id);
}

/** Stan karty technologii (modal `techDiscoveryNotice`) — tytul H2 = ktora technologia. */
async function techCardState(page) {
  return page.evaluate(() => {
    const host = document.getElementById('civ-tech-discovery-notice-host');
    const card = host === null ? null : host.querySelector('.tdn-entity-card-v2');
    const h2 = card === null ? null : card.querySelector('h2');
    return { open: host !== null, title: h2 === null ? null : (h2.textContent || '').trim() };
  });
}

/** Pomiar OBU kart naraz (wymog dyspozycji: rect + hit-test, zrzut tylko uzupelniajaco). */
async function measureBothCards(page) {
  return page.evaluate(() => {
    const rect = (el) => { if (el === null) return null; const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
      return { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1),
        right: +r.right.toFixed(1), bottom: +r.bottom.toFixed(1), zIndex: cs.zIndex, position: cs.position,
        display: cs.display, visibility: cs.visibility, opacity: cs.opacity }; };
    const titleAtCenter = (el) => { if (el === null) return null; const r = el.getBoundingClientRect();
      const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      if (hit === null) return null;
      const owner = hit.closest('.entity-card');
      const h2 = owner === null ? null : owner.querySelector('h2');
      return h2 === null ? null : (h2.textContent || '').trim(); };
    const host = document.getElementById('civ-tech-discovery-notice-host');
    const techCard = host === null ? null : host.querySelector('.tdn-entity-card-v2');
    const sideCard = host === null ? null : host.querySelector('.tdn-side-card');
    const h2 = (el) => { if (el === null) return null; const n = el.querySelector('h2'); return n === null ? null : (n.textContent || '').trim(); };
    return {
      hostRect: rect(host),
      tech: { rect: rect(techCard), title: h2(techCard), hitTitle: titleAtCenter(techCard) },
      side: { rect: rect(sideCard), title: h2(sideCard), hitTitle: titleAtCenter(sideCard) },
      // Regresja (B): karta szczegolu NIE MOZE juz lezec w osobnym, nizszym hoscie.
      strayBackdrops: document.querySelectorAll('.entity-card-backdrop').length,
      viewport: { w: window.innerWidth, h: window.innerHeight },
    };
  });
}

/** R-TECH-KARTA-BOCZNA-KLIK-WIERSZ-REGRES-Q1, RUNDA 2 — POMIAR ROZSTRZYGAJACY dla (B7).
 *
 * DLACZEGO SAM `rect.right/bottom <= viewport` NIE WYSTARCZA (zarzut Evaluatora, runda 2):
 * `#civ-tech-discovery-notice-host .entity-card` ma w CSS `max-height:calc(100vh - 36px)`
 * oraz `overflow:auto` (techDiscoveryNotice.ts, ensureEntityCardOverrideStyles), a karta
 * satelita dodatkowo sztywne `width:min(434px,96vw)`. Prostokat karty jest wiec PRZYCIETY
 * do viewportu ZAWSZE — niezaleznie od dlugosci tresci. Zmierzone (Chromium 1440x1000,
 * ten sam build, wstrzykniety oryginalny dev-note 1021 znakow): rect.bottom 982 <= 1000,
 * czyli asercja rect-owa jest ZIELONA takze dla stanu SPRZED naprawy — nie rozroznia go.
 *
 * ROZROZNIA dopiero przepelnienie TRESCI wewnatrz karty (`scrollHeight > clientHeight`):
 *   krotki `warunek` (stan wysylany): wiersz „Warunek" 19 px, karta 768 px, scroll 0;
 *   dev-note 1021 zn. (stan przed):   wiersz „Warunek" 304 px, karta przycieta do 962 px
 *                                     przy scrollHeight 1052 → 90 px tresci PONIZEJ krawedzi.
 * To jest dokladnie to, co widzial wlasciciel („karta wychodzi poza zakres ekranu"):
 * nie prostokat poza viewportem, tylko tresc nie mieszczaca sie w karcie. */
async function measureSideCardOverflow(page) {
  return page.evaluate(() => {
    const host = document.getElementById('civ-tech-discovery-notice-host');
    const side = host === null ? null : host.querySelector('.tdn-side-card');
    if (side === null) return { missing: true };
    const rows = Array.from(side.querySelectorAll('.entity-card-row'));
    const wr = rows.find((r) => {
      const k = r.querySelector('.entity-card-row-key');
      return k !== null && (k.textContent || '').trim() === 'Warunek';
    }) || null;
    return {
      cardClientH: side.clientHeight, cardScrollH: side.scrollHeight,
      cardClientW: side.clientWidth, cardScrollW: side.scrollWidth,
      overflowsY: side.scrollHeight > side.clientHeight + 1,
      overflowsX: side.scrollWidth > side.clientWidth + 1,
      warunekRowH: wr === null ? null : +wr.getBoundingClientRect().height.toFixed(1),
      warunekText: wr === null ? null : (wr.textContent || '').replace(/\s+/g, ' ').trim(),
    };
  });
}

/** Tekst wiersza „Warunek" w KAZDEJ otwartej karcie encji (technologii i satelity) —
 * do (B8): kontrola, ze gracz nie widzi surowej notatki deweloperskiej. */
async function readWarunekRows(page) {
  return page.evaluate(() => {
    const host = document.getElementById('civ-tech-discovery-notice-host');
    if (host === null) return [];
    return Array.from(host.querySelectorAll('.entity-card')).map((card) => {
      const h2 = card.querySelector('h2');
      const rows = Array.from(card.querySelectorAll('.entity-card-row'));
      const wr = rows.find((r) => {
        const k = r.querySelector('.entity-card-row-key');
        return k !== null && (k.textContent || '').trim() === 'Warunek';
      }) || null;
      const val = wr === null ? null : wr.querySelector('.entity-card-row-value');
      return {
        title: h2 === null ? null : (h2.textContent || '').trim(),
        warunek: val === null ? null : (val.textContent || '').replace(/\s+/g, ' ').trim(),
      };
    });
  });
}

/** Sygnatura NOTATKI DEWELOPERSKIEJ w tekscie widzianym przez gracza (ten sam wzorzec co
 * audyt kryterium 5 dispatchu): ID tematu, „ECHO", „właściciel", „RUNDA n", „COFNIĘTY",
 * data ISO. Zadne z nich nie ma prawa pojawic sie w polu `Warunek` na karcie gracza. */
const DEVNOTE_RE = /\b[A-Z]-[A-ZŁŚŻŹĆŃÓĘĄ0-9-]+-Q\d|ECHO|właściciel|RUNDA \d|COFNIĘT|\d{4}-\d{2}-\d{2}/;

function assertTwoCardsVisible(m, label) {
  const t = m.tech.rect, s = m.side.rect;
  assert(label + ': obie karty w DOM z NIEZEROWA powierzchnia',
    t !== null && s !== null && t.w > 0 && t.h > 0 && s.w > 0 && s.h > 0, m);
  if (t === null || s === null) return;
  const overlap = !(t.right <= s.x || s.right <= t.x || t.bottom <= s.y || s.bottom <= t.y);
  assert(label + ': prostokaty kart NIE zachodza na siebie', overlap === false, { tech: t, side: s });
  const inView = (r) => r.x >= 0 && r.y >= 0 && r.right <= m.viewport.w + 0.5 && r.bottom <= m.viewport.h + 0.5;
  assert(label + ': ZADNA karta nie lezy poza viewportem', inView(t) && inView(s), { tech: t, side: s, viewport: m.viewport });
  assert(label + ': hit-test w srodku KAZDEJ karty trafia w TE karte (zadna nie jest zaslonieta)',
    m.tech.hitTitle === m.tech.title && m.side.hitTitle === m.side.title, m);
  assert(label + ': karta szczegolu NIE jest w osobnym .entity-card-backdrop (z-index 520 < 940)',
    m.strayBackdrops === 0, { strayBackdrops: m.strayBackdrops });
}

/** R-TECH-KARTA-BOCZNA-KLIK-WIERSZ-REGRES-Q1 (B6) — realny klik MYSZA w LEWA CZESC wiersza
 * (etykiete `.entity-card-row-key`, NIE w przycisk „Szczegóły →" po prawej). Hit-test
 * potwierdza ZANIM klikniemy, ze punkt faktycznie nalezy do `.entity-card-row-key` i NIE
 * jest wewnatrz `button[data-entity-kind]` — bez tego test bylby tautologiczny (moglby
 * przypadkiem trafiac w ten sam przycisk co (B1) i nic by nie rozstrzygal). */
async function clickRowLabel(page, rowSel) {
  const row = page.locator(rowSel);
  if (await row.count() === 0) return { hit: false, why: 'brak wiersza w DOM: ' + rowSel };
  const keyEl = row.locator('.entity-card-row-key');
  if (await keyEl.count() === 0) return { hit: false, why: 'brak .entity-card-row-key w wierszu' };
  const b = await keyEl.boundingBox();
  if (b === null) return { hit: false, why: 'brak boundingBox etykiety' };
  const cx = b.x + Math.min(8, b.width / 2);
  const cy = b.y + b.height / 2;
  const at = await page.evaluate(({ cx, cy }) => {
    const el = document.elementFromPoint(cx, cy);
    if (el === null) return null;
    return {
      inButton: el.closest('button[data-entity-kind]') !== null,
      inKey: el.closest('.entity-card-row-key') !== null,
      rowId: (el.closest('.entity-card-row[data-row-entity-kind]') || {}).getAttribute
        ? el.closest('.entity-card-row[data-row-entity-kind]').getAttribute('data-row-entity-id') : null,
    };
  }, { cx, cy });
  if (at === null || at.inKey !== true) {
    return { hit: false, why: 'punkt kliku NIE trafia czysto w etykiete wiersza (albo trafia w przycisk)', at };
  }
  await page.mouse.click(cx, cy);
  await wait(700);
  return { hit: true, at };
}

/** Rozwin sekcje akordeonu REALNYM klikiem (tak jak gracz), jesli jest zwinieta. */
async function expandSection(page, sectionKey) {
  const head = page.locator('#civ-tech-discovery-notice-host [data-section-key="' + sectionKey + '"] .entity-card-section-head');
  if (await head.count() === 0) return false;
  const open = await page.evaluate((k) => {
    const s = document.querySelector('#civ-tech-discovery-notice-host [data-section-key="' + k + '"]');
    return s === null ? null : s.getAttribute('data-open');
  }, sectionKey);
  if (open === '1') return true;
  const b = await head.boundingBox();
  if (b === null) return false;
  await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
  await wait(400);
  return true;
}

async function main() {
  let chromium;
  try { ({ chromium } = require('playwright')); }
  catch (e) { console.error('[zbadano-test] playwright missing — npm i -D playwright'); process.exit(1); }

  buildBundle();

  // --- (0) kotwice w zrodle -----------------------------------------------------------
  console.log('\n-- (0) kotwice w zrodle --');
  const mainSrc = fs.readFileSync(path.join(GRA_DIR, 'src', 'main.ts'), 'utf8');
  const tdnSrc = fs.readFileSync(path.join(GRA_DIR, 'src', 'ui', 'techDiscoveryNotice.ts'), 'utf8');
  assert('(0a) emiter auto-research tworzy dedykowana karte tech-done-<tura>-<slug>, nie goly hint',
    /const techEvId = 'tech-done-' \+ turn \+ '-' \+ techToSlug\(done\.id\);/.test(mainSrc));
  assert('(0b) afordancja i akcja stoja na TYM SAMYM resolverze (techDoneEventTechName)',
    /function techDoneEventLinkFor[\s\S]{0,200}techDoneEventTechName/.test(mainSrc)
    && /function openTechDoneEventLink[\s\S]{0,200}techDoneEventTechName/.test(mainSrc));
  // Kolejnosc rozstrzygania MUSI byc lustrzana miedzy afordancja a klikiem — inaczej karta
  // moglaby pokazac skrot jednej rodziny, a klik wykonac akcje drugiej.
  assert('(0c) kolejnosc rodzin w getEventLink i w onEventClick jest LUSTRZANA (audyt -> tech-done)',
    /getEventLink: \(ev\) => \(ev\.blocking === true \? null : sidePanelEventLinkFor\(ev\.id\)\) \?\? techDoneEventLinkFor\(ev\.id\),/.test(mainSrc)
    && mainSrc.indexOf('if (openSidePanelEventLink(id)) return;') < mainSrc.indexOf('if (openTechDoneEventLink(id)) return;'));
  assert('(0d) klik w link krzyzowy karty technologii jest przechwytywany w fazie CAPTURE',
    /wireSideCardLinks[\s\S]{0,1400}\}, true\);/.test(tdnSrc));
  assert('(0e) karta szczegolu montuje sie do wspolnej sceny hosta, nie przez openEntityCard(dialog)',
    /stage\.appendChild\(sideCard\);/.test(tdnSrc));
  const built = fs.readFileSync(path.join(OUT_DIR, 'index.html'), 'utf8');
  assert('(0f) artefakt vite build niesie scene obu kart (.tdn-stage/.tdn-side-card)',
    built.includes('tdn-stage') && built.includes('tdn-side-card'));

  const browser = await launchBrowser(chromium);
  const consoleErrors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
    page.on('pageerror', (e) => consoleErrors.push('[pageerror] ' + e.message));
    await gotoPlaytestMapa(page);

    // ================= CZESC (A) =====================================================
    // DWIE technologie zbadane w JEDNEJ turze — dokladnie ryzyko z dyspozycji
    // (emiter modala uzywa step.completed[length-1]; klik MUSI otwierac SWOJA technologie).
    const T1 = { slug: 'rolnictwo', name: 'Rolnictwo', koszt: 40 };
    const T2 = { slug: 'owiectwo', name: 'Łowiectwo', koszt: 55 };
    const plan = [
      { id: 'tech-done-12-' + T1.slug, icon: '🔬', title: 'Zbadano: ' + T1.name, subtitle: '−40 nauki', kind: 'science', expectTech: T1.name },
      { id: 'tech-done-12-' + T2.slug, icon: '🔬', title: 'Zbadano: ' + T2.name, subtitle: '−55 nauki', kind: 'science', expectTech: T2.name },
      // rodziny z audytu przekierowan — regresja (dyspozycja, punkt e)
      { id: 'war-12-0-3', icon: '⚔', title: 'Wypowiedzieliśmy wojnę: Egipt', subtitle: 'W stanie wojny z: Egipt', kind: 'enemy', expectCta: 'Dyplomacja', view: 'diploList' },
      { id: 'elim-cs-12-7', icon: '🏴', title: 'ELIMINACJA: Sumerowie', subtitle: 'Wchłonięta dyplomatycznie', kind: 'diplo', expectCta: 'Szczegóły', view: 'civElimModal' },
      { id: 'border-march-violated', icon: '⚠️', title: 'Granice naruszone', subtitle: 'Egipt: −2 Zaufania/turę', kind: 'diplo', expectCta: 'Pokaż na mapie', view: 'camera', hex: { q: 5, r: -2 } },
      // kontrole negatywne
      { id: 'tech-done-12-nie_ma_takiej_technologii', icon: '🔬', title: 'Zbadano: Fikcja', subtitle: '−1 nauki', kind: 'science', expectCta: null },
      { id: 'tech-done-12', icon: '🔬', title: 'Zbadano: (bez sluga)', subtitle: '−1 nauki', kind: 'science', expectCta: null },
      { id: 'eot-hint-12-0', icon: 'ℹ️', title: '', subtitle: 'Zbadano: Rolnictwo (-40 nauki)', kind: 'info', expectCta: null },
    ];
    await page.evaluate(() => window.__sidePanelLinkTestDebug.setBorderMarchTarget('border-march-violated', 5, -2));
    await page.evaluate(() => window.__sidePanelLinkTestDebug.setCivElimDetails('elim-cs-12-7', 'Sumerowie', 'Szczegóły eliminacji.'));
    await page.evaluate((p) => window.__sidePanelLinkTestDebug.seedEvents(p.map(x => ({ id: x.id, icon: x.icon, title: x.title, subtitle: x.subtitle, kind: x.kind }))), plan);
    await wait(700);

    console.log('\n-- (A1) afordancja karty „Zbadano" --');
    for (const p of plan) {
      const c = await readCard(page, p.id);
      if (c.missing) { assert('(A1) karta ' + p.id + ' wyrenderowana', false, c); continue; }
      const wantCta = p.expectTech !== undefined ? 'Karta technologii' : (p.expectCta ?? null);
      if (wantCta === null) {
        assert('(A1-) ' + p.id + ': BRAK skrotu (runtime nie potwierdzil celu)', c.cta === null && c.noLinkCls === true, c);
        assert('(A1-) ' + p.id + ': cursor NIE udaje klikalnosci', c.cursor === 'default', c);
        assert('(A1-) ' + p.id + ': poza kolejnoscia Tab', c.role === null && c.tabindex === null, c);
      } else {
        assert('(A1+) ' + p.id + ': widoczny skrot „' + wantCta + ' →"', c.cta === wantCta + ' →' && c.ctaVisible === true, c);
        assert('(A1+) ' + p.id + ': klikalna i osiagalna z klawiatury', c.noLinkCls === false && c.cursor === 'pointer' && c.role === 'button' && c.tabindex === '0', c);
      }
      assert('(A1) ' + p.id + ': karta ma krzyzyk ✕', c.hasDismiss === true, c);
    }
    for (const p of plan.filter(x => x.expectTech !== undefined)) {
      const link = await page.evaluate((id) => window.__sidePanelLinkTestDebug.linkFor(id), p.id);
      assert('(A1) ' + p.id + ': resolver rodzin audytu NIE przejmuje tej karty (osobny resolver)', link === null, link);
    }

    console.log('\n-- (A2) REALNY klik mysza -> karta WLASCIWEJ technologii --');
    for (const p of plan.filter(x => x.expectTech !== undefined)) {
      await page.evaluate(() => { document.getElementById('civ-tech-discovery-notice-host')?.remove(); });
      await page.evaluate(() => window.__sidePanelLinkTestDebug.closeAll());
      await wait(300);
      const clicked = await clickCard(page, p.id);
      const st = await techCardState(page);
      assert('(A2) ' + p.id + ': klik OTWORZYL karte technologii', clicked.hit && st.open === true, { clicked, st });
      assert('(A2) ' + p.id + ': otwarta karta dotyczy „' + p.expectTech + '" (a NIE ostatniej zbadanej)',
        st.title === p.expectTech, { got: st.title, want: p.expectTech, clicked });
    }
    // Ta sama karta po odswiezeniu panelu — resolver jest bezstanowy (id jest jedynym nosnikiem),
    // wiec karta nie „wygasa" (wymog 4 dyspozycji).
    await page.evaluate(() => { document.getElementById('civ-tech-discovery-notice-host')?.remove(); });
    await page.evaluate((p) => window.__sidePanelLinkTestDebug.seedEvents(p.map(x => ({ id: x.id, icon: x.icon, title: x.title, subtitle: x.subtitle, kind: x.kind }))), plan);
    await wait(600);
    {
      const clicked = await clickCard(page, 'tech-done-12-' + T1.slug);
      const st = await techCardState(page);
      assert('(A2) karta dziala TAKZE po odswiezeniu panelu (przerysowanie listy)', clicked.hit && st.open && st.title === T1.name, { clicked, st });
    }
    {
      // id z DOWOLNEJ tury rozwiazuje sie tak samo — brak stanu per-tura (wymog 4).
      const l1 = await page.evaluate(() => window.__sidePanelLinkTestDebug.linkFor('tech-done-1-rolnictwo'));
      const l999 = await page.evaluate(() => window.__sidePanelLinkTestDebug.linkFor('tech-done-999-rolnictwo'));
      assert('(A2) resolver rodzin audytu nadal nie zna tech-done (rozdzial odpowiedzialnosci)', l1 === null && l999 === null, { l1, l999 });
    }

    console.log('\n-- (A3) ✕ zamyka zdarzenie i NIE otwiera karty --');
    await page.evaluate(() => { document.getElementById('civ-tech-discovery-notice-host')?.remove(); });
    await wait(200);
    {
      const id = 'tech-done-12-' + T2.slug;
      const clicked = await clickCard(page, id, { sub: '.sp-close[data-dismiss]', subCls: 'sp-close' });
      await wait(500);
      const st = await techCardState(page);
      const gone = await page.evaluate((i) => document.querySelector('.civ-side-panel .sp-event[data-id="' + i + '"]') === null, id);
      assert('(A3) klik w ✕ trafil w krzyzyk (hit-test)', clicked.hit === true, clicked);
      assert('(A3) ✕ usunal karte zdarzenia z panelu', gone === true);
      assert('(A3) ✕ NIE otworzyl karty technologii', st.open === false, st);
    }

    console.log('\n-- (A4) kontrole negatywne: klik w karte bez celu nic nie otwiera --');
    for (const p of plan.filter(x => x.expectCta === null)) {
      await page.evaluate(() => { document.getElementById('civ-tech-discovery-notice-host')?.remove(); });
      await page.evaluate(() => window.__sidePanelLinkTestDebug.closeAll());
      await wait(250);
      const clicked = await clickCard(page, p.id);
      const st = await techCardState(page);
      const views = await page.evaluate(() => window.__sidePanelLinkTestDebug.openViews());
      const anyOpen = views.cityPanel || views.diploList || views.empirePanel || views.techTree || views.civElimModal;
      assert('(A4) ' + p.id + ': klik NIE otwiera karty technologii ani zadnego innego widoku',
        clicked.hit && st.open === false && anyOpen === false, { clicked, st, views });
    }

    console.log('\n-- (A5) trzy rodziny z audytu przekierowan nadal dzialaja --');
    for (const p of plan.filter(x => x.view !== undefined)) {
      await page.evaluate(() => { document.getElementById('civ-tech-discovery-notice-host')?.remove(); });
      await page.evaluate(() => window.__sidePanelLinkTestDebug.closeAll());
      await wait(250);
      if (p.view === 'camera') {
        const want = await page.evaluate((h) => window.__sidePanelLinkTestDebug.hexToWorld(h.q, h.r), p.hex);
        const clicked = await clickCard(page, p.id);
        const after = await page.evaluate(() => window.__sidePanelLinkTestDebug.cameraTarget());
        assert('(A5) ' + p.id + ': klik nadal przenosi kamere na heks zdarzenia',
          clicked.hit && Math.abs(after.x - want.x) < 0.5 && Math.abs(after.z - want.z) < 0.5, { clicked, after, want });
        continue;
      }
      const clicked = await clickCard(page, p.id);
      const views = await page.evaluate(() => window.__sidePanelLinkTestDebug.openViews());
      assert('(A5) ' + p.id + ': klik nadal otwiera widok „' + p.view + '"', clicked.hit && views[p.view] === true, { clicked, views });
    }
    if (SHOTS !== null) {
      fs.mkdirSync(SHOTS, { recursive: true });
      await page.evaluate((p) => window.__sidePanelLinkTestDebug.seedEvents(p.map(x => ({ id: x.id, icon: x.icon, title: x.title, subtitle: x.subtitle, kind: x.kind }))), plan);
      await wait(500);
      const el = await page.$('.civ-side-panel');
      if (el) await el.screenshot({ path: path.join(SHOTS, 'zbadano-panel-po.png') });
    }

    // ================= CZESC (B) =====================================================
    console.log('\n-- (B1) „Szczegoly →" otwiera karte ulepszenia OBOK karty technologii --');
    await page.evaluate(() => window.__sidePanelLinkTestDebug.closeAll());
    await page.evaluate(() => { document.getElementById('civ-tech-discovery-notice-host')?.remove(); });
    await page.evaluate(() => window.__eraTestDebug.openTechCompletion('Łowiectwo'));
    await wait(700);
    assert('(B1) karta technologii „Łowiectwo" otwarta', (await techCardState(page)).title === 'Łowiectwo');
    await expandSection(page, 'improvements');
    const impLink = page.locator('#civ-tech-discovery-notice-host [data-entity-kind="improvement"][data-entity-id="oboz_lowiecki"]');
    assert('(B1) wiersz „Obóz łowiecki" ma link „Szczegóły →"', await impLink.count() === 1);
    {
      const b = await impLink.boundingBox();
      const at = await page.evaluate((bb) => { const e = document.elementFromPoint(bb.x + bb.width / 2, bb.y + bb.height / 2);
        return e === null ? null : e.tagName + '|' + String(e.className) + '|' + e.getAttribute('data-entity-id'); }, b);
      assert('(B1) hit-test: punkt kliku faktycznie nalezy do linku „Szczegóły →"',
        at !== null && at.includes('oboz_lowiecki'), at);
      await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
      await wait(800);
    }
    let m = await measureBothCards(page);
    assert('(B1) karta technologii NIE zostala zamknieta', m.tech.title === 'Łowiectwo', m.tech);
    assert('(B1) obok pojawila sie karta „Obóz łowiecki"', m.side.title === 'Obóz łowiecki', m.side);
    assertTwoCardsVisible(m, '(B1) 1600x1000');
    if (SHOTS !== null) await page.screenshot({ path: path.join(SHOTS, 'obie-karty-1600.png') });

    console.log('\n-- (B2) zamkniecie karty szczegolu zostawia karte technologii --');
    {
      const closeBtn = page.locator('#civ-tech-discovery-notice-host .tdn-side-card .tdn-entity-close');
      assert('(B2) karta szczegolu ma wlasny ✕', await closeBtn.count() === 1);
      const b = await closeBtn.boundingBox();
      await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
      await wait(500);
      const after = await measureBothCards(page);
      assert('(B2) karta szczegolu zamknieta', after.side.rect === null, after.side);
      assert('(B2) karta technologii NADAL otwarta i widoczna',
        after.tech.rect !== null && after.tech.rect.w > 0 && after.tech.title === 'Łowiectwo', after.tech);
      assert('(B2) hit-test w srodku karty technologii trafia w nia', after.tech.hitTitle === 'Łowiectwo', after.tech);
    }

    console.log('\n-- (B3) Esc zamyka najpierw szczegol, potem technologie --');
    {
      await expandSection(page, 'improvements');
      const b = await impLink.boundingBox();
      await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
      await wait(600);
      assert('(B3) karta szczegolu znowu otwarta', (await measureBothCards(page)).side.title === 'Obóz łowiecki');
      await page.keyboard.press('Escape');
      await wait(400);
      const m1 = await measureBothCards(page);
      assert('(B3) 1. Esc zamknal TYLKO karte szczegolu', m1.side.rect === null && m1.tech.title === 'Łowiectwo', m1);
      await page.keyboard.press('Escape');
      await wait(400);
      const m2 = await measureBothCards(page);
      assert('(B3) 2. Esc zamknal karte technologii', m2.tech.rect === null && m2.hostRect === null, m2);
    }

    console.log('\n-- (B4) zamkniecie karty technologii zamyka OBIE --');
    {
      await page.evaluate(() => window.__eraTestDebug.openTechCompletion('Łowiectwo'));
      await wait(600);
      await expandSection(page, 'improvements');
      const b = await impLink.boundingBox();
      await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
      await wait(600);
      assert('(B4) obie karty otwarte przed zamknieciem', (await measureBothCards(page)).side.title === 'Obóz łowiecki');
      const closeTech = page.locator('#civ-tech-discovery-notice-host .tdn-entity-card-v2 .tdn-entity-close');
      const cb = await closeTech.boundingBox();
      await page.mouse.click(cb.x + cb.width / 2, cb.y + cb.height / 2);
      await wait(500);
      const after = await measureBothCards(page);
      assert('(B4) ✕ karty technologii zamknal OBIE karty', after.hostRect === null && after.tech.rect === null && after.side.rect === null, after);
    }

    console.log('\n-- (B5) WASKIE OKNO (prog 1160 px): obie karty NADAL widoczne --');
    {
      await page.setViewportSize({ width: 1000, height: 950 });
      await wait(400);
      await page.evaluate(() => window.__eraTestDebug.openTechCompletion('Łowiectwo'));
      await wait(600);
      await expandSection(page, 'improvements');
      const b = await impLink.boundingBox();
      await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
      await wait(800);
      const mn = await measureBothCards(page);
      assert('(B5) ponizej progu karta technologii i karta szczegolu SA OBIE w DOM',
        mn.tech.title === 'Łowiectwo' && mn.side.title === 'Obóz łowiecki', mn);
      assertTwoCardsVisible(mn, '(B5) 1000x950');
      assert('(B5) ponizej progu uklad jest PIONOWY (jedna pod druga), nie podmiana',
        mn.tech.rect !== null && mn.side.rect !== null && mn.side.rect.y >= mn.tech.rect.bottom - 0.5,
        { tech: mn.tech.rect, side: mn.side.rect });
      if (SHOTS !== null) await page.screenshot({ path: path.join(SHOTS, 'obie-karty-1000.png') });
      await page.setViewportSize({ width: 1600, height: 1000 });
      await wait(300);
    }

    console.log('\n-- (B6) klik w LEWA CZESC wiersza „Obóz łowiecki" (etykieta, NIE przycisk) --');
    {
      await page.evaluate(() => window.__sidePanelLinkTestDebug.closeAll());
      await page.evaluate(() => { document.getElementById('civ-tech-discovery-notice-host')?.remove(); });
      await page.evaluate(() => window.__eraTestDebug.openTechCompletion('Łowiectwo'));
      await wait(600);
      await expandSection(page, 'improvements');
      const rowSel = '#civ-tech-discovery-notice-host .entity-card-row[data-row-entity-kind="improvement"][data-row-entity-id="oboz_lowiecki"]';
      assert('(B6) wiersz „Obóz łowiecki" ma fallback data-row-entity-* (P-CIVPEDIA-KARTY-CALY-WIERSZ-PRZYCISKIEM-Q1)',
        await page.locator(rowSel).count() === 1);
      const clicked = await clickRowLabel(page, rowSel);
      assert('(B6) hit-test PRZED klikiem: punkt trafia czysto w etykiete, NIE w przycisk „Szczegóły →"',
        clicked.hit === true, clicked);
      const mb6 = await measureBothCards(page);
      assert('(B6) klik w etykiete otworzyl karte technologii NIEZAMKNIETA', mb6.tech.title === 'Łowiectwo', mb6.tech);
      assert('(B6) klik w etykiete otworzyl karte „Obóz łowiecki" OBOK (nie pod spodem)', mb6.side.title === 'Obóz łowiecki', mb6.side);
      assertTwoCardsVisible(mb6, '(B6) klik w etykiete wiersza');
      assert('(B6) regresja: zero .entity-card-backdrop (dawny dialog pod hostem 940<520)',
        mb6.strayBackdrops === 0, { strayBackdrops: mb6.strayBackdrops });
    }

    console.log('\n-- (B7) overflow karty bocznej przy typowych szerokosciach (1280/1440/1920) --');
    for (const w of [1280, 1440, 1920]) {
      await page.evaluate(() => window.__sidePanelLinkTestDebug.closeAll());
      await page.evaluate(() => { document.getElementById('civ-tech-discovery-notice-host')?.remove(); });
      await page.setViewportSize({ width: w, height: 1000 });
      await wait(300);
      await page.evaluate(() => window.__eraTestDebug.openTechCompletion('Łowiectwo'));
      await wait(600);
      await expandSection(page, 'improvements');
      const b = await impLink.boundingBox();
      await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
      await wait(700);
      const mw = await measureBothCards(page);
      assert('(B7) ' + w + 'px: obie karty otwarte („Łowiectwo" + „Obóz łowiecki")',
        mw.tech.title === 'Łowiectwo' && mw.side.title === 'Obóz łowiecki', mw);
      assert('(B7) ' + w + 'px: karta technologii MIESCI SIE w viewport (rect.right <= innerWidth), zmierzone',
        mw.tech.rect !== null && mw.tech.rect.right <= mw.viewport.w + 0.5, { rect: mw.tech.rect, viewport: mw.viewport });
      assert('(B7) ' + w + 'px: karta boczna MIESCI SIE w viewport (rect.right <= innerWidth), zmierzone',
        mw.side.rect !== null && mw.side.rect.right <= mw.viewport.w + 0.5, { rect: mw.side.rect, viewport: mw.viewport });
      assertTwoCardsVisible(mw, '(B7) ' + w + 'px');
      // POMIAR ROZSTRZYGAJACY (patrz komentarz przy measureSideCardOverflow): karta ma
      // max-height + overflow:auto, wiec o „wychodzeniu poza ekran" decyduje przepelnienie
      // TRESCI, nie prostokat. To jest ta czesc (B7), ktora faktycznie rozroznia stan
      // przed/po skroceniu pola `warunek`.
      const ov = await measureSideCardOverflow(page);
      assert('(B7) ' + w + 'px: tresc karty bocznej MIESCI SIE w karcie (scrollHeight <= clientHeight), zmierzone',
        ov.missing !== true && ov.overflowsY === false, ov);
      assert('(B7) ' + w + 'px: brak przepelnienia poziomego tresci karty bocznej',
        ov.missing !== true && ov.overflowsX === false, ov);
      assert('(B7) ' + w + 'px: wiersz „Warunek" to KROTKIE zdanie gracza (<= 60 px wysokosci), nie sciana tekstu',
        ov.warunekRowH !== null && ov.warunekRowH <= 60, { warunekRowH: ov.warunekRowH, warunekText: ov.warunekText });
      assert('(B7) ' + w + 'px: „Warunek" bez sygnatury notatki deweloperskiej (ID tematu/ECHO/właściciel/RUNDA/data)',
        typeof ov.warunekText === 'string' && DEVNOTE_RE.test(ov.warunekText) === false, ov.warunekText);
    }

    // ---- (B7-K) KONTROLA NEGATYWNA pomiaru (B7): czy on w ogole potrafi sczerwieniec? ----
    // Bez tej kontroli (B7) bylby tautologiczny: Evaluator rundy 2 wykazal, ze poprzednia,
    // czysto prostokatna wersja (B7) przechodzila TAK SAMO po przywroceniu pelnego dev-notu,
    // wiec NIE dowodzila zwiazku przyczynowego „skrocenie `warunek` domyka overflow".
    // Tu wstrzykujemy ORYGINALNY tekst `oboz_lowiecki.warunek` (stan origin/main, 1021 zn.)
    // do JUZ WYRENDEROWANEGO wiersza „Warunek" tej samej karty, w tym samym buildzie —
    // eksperyment A/B na jednej scenie. Jesli metryka jest rozstrzygajaca, MUSI sie odwrocic.
    console.log('\n-- (B7-K) kontrola negatywna: wstrzykniety dev-note MUSI zlamac te sama metryke --');
    {
      await page.setViewportSize({ width: 1440, height: 1000 });
      await wait(300);
      await page.evaluate(() => window.__sidePanelLinkTestDebug.closeAll());
      await page.evaluate(() => { document.getElementById('civ-tech-discovery-notice-host')?.remove(); });
      await page.evaluate(() => window.__eraTestDebug.openTechCompletion('Łowiectwo'));
      await wait(600);
      await expandSection(page, 'improvements');
      const b = await impLink.boundingBox();
      await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
      await wait(700);
      const okBefore = await measureSideCardOverflow(page);
      assert('(B7-K) punkt wyjscia: stan wysylany NIE przepelnia karty', okBefore.overflowsY === false, okBefore);
      assert('(B7-K) ladunek kontrolny = realny dev-note (>= 800 zn., sygnatura obecna), czytany z `uwagi`',
        OBOZ_LOWIECKI_WARUNEK_ORIGIN_MAIN.length >= 800 && DEVNOTE_RE.test(OBOZ_LOWIECKI_WARUNEK_ORIGIN_MAIN),
        { len: OBOZ_LOWIECKI_WARUNEK_ORIGIN_MAIN.length });
      const injected = await page.evaluate((txt) => {
        const host = document.getElementById('civ-tech-discovery-notice-host');
        const side = host === null ? null : host.querySelector('.tdn-side-card');
        if (side === null) return false;
        const wr = Array.from(side.querySelectorAll('.entity-card-row')).find((r) => {
          const k = r.querySelector('.entity-card-row-key');
          return k !== null && (k.textContent || '').trim() === 'Warunek';
        });
        if (wr === undefined) return false;
        const val = wr.querySelector('.entity-card-row-value');
        if (val === null) return false;
        val.textContent = txt;
        return true;
      }, OBOZ_LOWIECKI_WARUNEK_ORIGIN_MAIN);
      assert('(B7-K) udalo sie wstrzyknac oryginalny dev-note w wiersz „Warunek"', injected === true);
      await wait(400);
      const broken = await measureSideCardOverflow(page);
      assert('(B7-K) metryka ROZROZNIA: z dev-notem tresc karty PRZEPELNIA sie (scrollHeight > clientHeight)',
        broken.overflowsY === true, broken);
      assert('(B7-K) metryka ROZROZNIA: z dev-notem wiersz „Warunek" pęcznieje > 60 px',
        broken.warunekRowH !== null && broken.warunekRowH > 60, { przed: okBefore.warunekRowH, po: broken.warunekRowH });
      assert('(B7-K) metryka ROZROZNIA: z dev-notem „Warunek" niesie sygnature notatki deweloperskiej',
        DEVNOTE_RE.test(broken.warunekText || '') === true, (broken.warunekText || '').slice(0, 90));
      // Sprzatanie: karta z wstrzyknietym tekstem nie moze wyciec do (B8)/(E).
      await page.evaluate(() => { document.getElementById('civ-tech-discovery-notice-host')?.remove(); });
      await wait(200);
    }

    // ---- (B8) kryterium 5 ZYWO: pozostale naprawione wpisy `warunek`, realnie na ekranie ----
    // Kryterium 5 dispatchu (audyt + naprawa POZOSTALYCH wpisow `warunek`) bylo dotad
    // dowodzone wylacznie na JSON. Tu jest dowod ZYWY, ta sama sciezka co (B1)/(B6):
    // karta technologii → sekcja „Ulepszenia terenu" → klik w wiersz → karta boczna.
    console.log('\n-- (B8) zywy dowod kryterium 5: `Warunek` bez dev-notu dla pozostalych ulepszen --');
    for (const p of [
      { tech: 'Rolnictwo', id: 'farma', title: 'Farma' },
      { tech: 'Oswojenie zwierząt', id: 'bydlo', title: 'Trzoda' },
      { tech: 'Oswojenie zwierząt', id: 'owce', title: 'Owce' },
      { tech: 'Oswojenie zwierząt', id: 'lama', title: 'Lama' },
    ]) {
      await page.evaluate(() => window.__sidePanelLinkTestDebug.closeAll());
      await page.evaluate(() => { document.getElementById('civ-tech-discovery-notice-host')?.remove(); });
      await page.evaluate((t) => window.__eraTestDebug.openTechCompletion(t), p.tech);
      await wait(600);
      await expandSection(page, 'improvements');
      const sel = '#civ-tech-discovery-notice-host [data-entity-kind="improvement"][data-entity-id="' + p.id + '"]';
      const loc = page.locator(sel);
      assert('(B8) ' + p.id + ': wiersz osiagalny z karty „' + p.tech + '"', await loc.count() === 1);
      if (await loc.count() !== 1) continue;
      const bb = await loc.boundingBox();
      await page.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2);
      await wait(700);
      const rows = await readWarunekRows(page);
      const card = rows.find((r) => r.title === p.title) || null;
      assert('(B8) ' + p.id + ': karta boczna „' + p.title + '" otwarta z wierszem „Warunek"',
        card !== null && typeof card.warunek === 'string' && card.warunek.length > 0, rows);
      if (card === null || typeof card.warunek !== 'string') continue;
      assert('(B8) ' + p.id + ': widoczny „Warunek" BEZ sygnatury notatki deweloperskiej',
        DEVNOTE_RE.test(card.warunek) === false, card.warunek);
      const ov = await measureSideCardOverflow(page);
      assert('(B8) ' + p.id + ': tresc karty bocznej miesci sie w karcie (scrollHeight <= clientHeight)',
        ov.missing !== true && ov.overflowsY === false, ov);
    }
    await page.evaluate(() => { document.getElementById('civ-tech-discovery-notice-host')?.remove(); });
    await page.setViewportSize({ width: 1600, height: 1000 });
    await wait(300);

    console.log('\n-- (E) brak bledow konsoli/JS --');
    assert('(E) zero bledow konsoli/JS przez caly przebieg', consoleErrors.length === 0, consoleErrors.slice(0, 5));
  } finally {
    await browser.close();
  }

  console.log('\nwydarzenia-zbadano-karta-tech-real-render-test: ' + pass + ' pass, ' + fail + ' fail');
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
