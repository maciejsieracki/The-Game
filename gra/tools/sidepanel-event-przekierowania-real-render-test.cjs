'use strict';
/**
 * sidepanel-event-przekierowania-real-render-test.cjs
 *
 * TEMAT: P-WYDARZENIA-AUDYT-PRZEKIEROWANIA-Q1.
 *
 * ZGŁOSZENIE (właściciel, 2026-08-22): „każde wydarzenie powinno być zweryfikowane, czy nie
 * prowadzi do jakiegoś większego opisu lub miejsca. To jest audyt do zrobienia. Część rzeczy
 * jest ogólna i informacyjna, ale część wydarzeń powinna być przekierowana do innych miejsc."
 *
 * STAN PRZED: karta NIE-blokująca panelu WYDARZENIA wyglądała IDENTYCZNIE niezależnie od tego,
 * czy kliknięcie coś robi. Trzy rodziny (`war-*`, `elim-cs-*`, `border-march-*`) miały już
 * handler w `onEventClick`, ale ZERO afordancji — gracz nie miał jak się dowiedzieć, że karta
 * gdzieś prowadzi (obejściem był tekst wpisany w subtitle: „kliknij po szczegóły"). Reszta kart
 * (chatka, szlak handlowy, auto-racje, awans epoki) miała `cursor:pointer` i nie robiła NIC.
 *
 * STAN PO: karta NIE-blokująca dostaje widoczny skrót („Panel miasta →", „Spichlerz →", …)
 * DOKŁADNIE wtedy, gdy silnik potwierdzi gotowe, ISTNIEJĄCE miejsce docelowe dla tego
 * konkretnego zdarzenia (`sidePanelEventLinkFor` w main.ts — jedno źródło dla afordancji i dla
 * akcji). Karta bez celu dostaje `sp-no-link` + `cursor:default` i zostaje czysto informacyjna.
 *
 * DLACZEGO ŻYWA, ZBUDOWANA GRA, A NIE SAM TEST JEDNOSTKOWY (C-001):
 * pytanie właściciela brzmi „czy to PROWADZI do jakiegoś miejsca". Rozstrzyga to wyłącznie
 * faktyczne kliknięcie w faktycznie wyrenderowaną kartę w faktycznie zbudowanej grze, po którym
 * faktycznie otwiera się właściwy panel. Test ładuje artefakt `vite build` (single-file
 * `index.html`, `?playtest=mapa` — ten sam wzorzec co `tools/sidepanel-hud-deadzone-test.cjs`),
 * inscenizuje karty hakiem `window.__sidePanelLinkTestDebug` (wzorzec `__eraTestDebug`), klika
 * je PRAWDZIWĄ myszą i czyta stan otwartych widoków WŁASNYMI predykatami gry
 * (`isCityPanelOpen`, `isEmpireDetailPanelOpen`, `isTechTreeViewOpen`, `isDiploListHudOpen`) —
 * nie zgadywaniem po klasach CSS. NIE MA dev servera — wyłącznie produkt budowania.
 *
 * DLACZEGO TEST NIE JEST TAUTOLOGIĄ: cztery kontrole NEGATYWNE, w tym dwie sprawdzające
 * warstwę RUNTIME, a nie sam prefiks id:
 *   (N1) `eot-hint-*`      — generyczne zdarzenie końca tury: brak skrótu (kategoria „czysto
 *                            informacyjna" z audytu);
 *   (N2) `edu-veteran-...` — porada „kliknij obcą jednostkę": brak skrótu;
 *   (N3) `border-march-*` BEZ zapamiętanego heksu — rodzina MA miejsce docelowe, ale ten wpis
 *                            nie ma celu → skrót się NIE pokazuje (dowód, że decyduje runtime);
 *   (N4) `trade-lost-*` wskazujący na NIEISTNIEJĄCE miasto → jw., brak skrótu.
 * Gdyby afordancja szła po samym prefiksie id, (N3) i (N4) zapaliłyby się na czerwono.
 *
 * Usage (z gra/): node tools/sidepanel-event-przekierowania-real-render-test.cjs
 *   --shots <katalog>   zrzut panelu z kartami skrótów do <katalog>/przekierowania-po.png
 *   --dist <katalog>    użyj gotowego katalogu vite build zamiast budować go w teście
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const argOf = (flag) => {
  const i = process.argv.indexOf(flag);
  return i > -1 ? process.argv[i + 1] : null;
};
const SHOTS = argOf('--shots');
const DIST_ARG = argOf('--dist');
const OUT_DIR = DIST_ARG !== null ? path.resolve(DIST_ARG) : path.join(GRA_DIR, 'dist-sp-przekierowania-test');
const OUT_HTML = 'file://' + path.join(OUT_DIR, 'index.html') + '?playtest=mapa';

let pass = 0;
let fail = 0;
function assert(label, cond, detail) {
  if (cond) { pass++; console.log('  OK   ' + label); }
  else { fail++; console.error('  FAIL ' + label + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
}
const wait = (ms) => new Promise(r => setTimeout(r, ms));

function buildBundle() {
  if (DIST_ARG !== null) { console.log('[przekierowania-test] uzywam gotowego dist: ' + OUT_DIR); return; }
  console.log('[przekierowania-test] vite build (C-001: produkt budowania, zero dev servera)...');
  execSync(
    `node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(path.relative(GRA_DIR, OUT_DIR))} --emptyOutDir`,
    { cwd: GRA_DIR, stdio: 'pipe' },
  );
  if (!fs.existsSync(path.join(OUT_DIR, 'index.html'))) throw new Error('Build nie wyprodukowal index.html w ' + OUT_DIR);
  console.log('[przekierowania-test] build OK.');
}

async function launchBrowser(chromium) {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    console.log('[przekierowania-test] domyslny Chromium niedostepny, fallback na ' + FALLBACK_CHROME);
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

async function gotoPlaytestMapa(page) {
  await page.goto(OUT_HTML, { waitUntil: 'load', timeout: 180000 });
  await page.waitForSelector('.civ-hud, .civ-ux-frame, .civ-cs', { timeout: 180000 });
  for (let i = 0; i < 120; i++) {
    if (await page.locator('text=Tworzenie świata').count() === 0) break;
    await wait(1000);
  }
  await page.waitForFunction(() => window.__sidePanelLinkTestDebug !== undefined, { timeout: 60000 });
  await wait(1500);
}

/** Karty inscenizowane w panelu. `expect` = etykieta skrotu albo null (karta bez celu). */
const VILLAGE_Q = -3;
const VILLAGE_R = 7;
const BORDER_Q = 5;
const BORDER_R = -2;

function seedPlan(playerCityId) {
  return [
    { id: 'elim-cs-12-7', icon: '🏴', title: 'ELIMINACJA: Sumerowie · miasto-państwo',
      subtitle: 'Wchłonięta dyplomatycznie — kliknij po szczegóły', kind: 'diplo', negative: true,
      expect: 'Szczegóły', view: 'civElimModal' },
    { id: 'war-12-0-3', icon: '⚔', title: 'Wypowiedzieliśmy wojnę: Egipt',
      subtitle: 'W stanie wojny z: Egipt, Rzym', kind: 'enemy',
      expect: 'Dyplomacja', view: 'diploList' },
    { id: 'trade-new-12-r1', icon: '🧭', title: 'Nowy szlak handlowy',
      subtitle: 'Ateny ↔ Memfis (Egipt) · +6 złota/turę', kind: 'city',
      expect: 'Panel miasta', view: 'cityPanel', tradeCity: playerCityId },
    { id: 'auto-ration-t12', icon: '🍎', title: 'Automatycznie obniżono racje żywnościowe',
      subtitle: 'Ateny: Obfite → Normalne', kind: 'enemy', negative: true,
      expect: 'Spichlerz', view: 'empirePanel' },
    { id: 'era-12-1', icon: '🏛', title: 'Nowa epoka: Brązu',
      subtitle: 'Twoje imperium wkracza w nową epokę.', kind: 'science',
      expect: 'Drzewo technologii', view: 'techTree' },
    { id: `village-12-${VILLAGE_Q}-${VILLAGE_R}`, icon: '💰', title: 'Odkryto chatkę',
      subtitle: 'Chatka (skarb): +45 złota', kind: 'city',
      expect: 'Pokaż na mapie', view: 'camera', hex: { q: VILLAGE_Q, r: VILLAGE_R } },
    { id: 'border-march-violated', icon: '⚠️', title: 'Granice naruszone',
      subtitle: 'Twoje granice naruszone — Egipt: −2 pkt Zaufania/turę', kind: 'diplo',
      expect: 'Pokaż na mapie', view: 'camera', borderTarget: { q: BORDER_Q, r: BORDER_R },
      hex: { q: BORDER_Q, r: BORDER_R } },
    // --- kontrole NEGATYWNE (patrz naglowek pliku, N1-N4) -----------------------------
    { id: 'eot-hint-12-0', icon: 'ℹ️', title: '',
      subtitle: 'Wyrąb lasu zakończony — +20 produkcji', kind: 'info', expect: null },
    { id: 'edu-veteran-enemy-q3', icon: '★', title: 'Doświadczeni wojownicy',
      subtitle: 'Wrogie ★/★★/★★★ — premia do walki. Kliknij obcą jednostkę po pełną kartę.',
      kind: 'info', expect: null },
    { id: 'border-march-trespassing', icon: '⚠️', title: 'Jednostka na cudzym terenie',
      subtitle: 'Twoja jednostka na cudzym terenie (Egipt)', kind: 'diplo', expect: null },
    { id: 'trade-lost-12-r9', icon: '⛓️', title: 'Szlak handlowy zerwany',
      subtitle: 'Nieistniejące ↔ Memfis (Egipt) — miasto zniknęło', kind: 'city',
      expect: null, tradeCity: 'city-ktore-nie-istnieje-w-tej-partii' },
  ];
}

async function seed(page, plan) {
  await page.evaluate((plan) => {
    const dbg = window.__sidePanelLinkTestDebug;
    for (const p of plan) {
      if (p.borderTarget) dbg.setBorderMarchTarget(p.id, p.borderTarget.q, p.borderTarget.r);
      if (p.tradeCity) dbg.setTradeCity(p.id, p.tradeCity);
    }
    dbg.setCivElimDetails('elim-cs-12-7', 'Sumerowie · miasto-państwo',
      'Skarbiec, nauka i 2 tech(y) przejęte. Zdobycze Power: +18.');
    dbg.seedEvents(plan.map(p => ({
      id: p.id, icon: p.icon, title: p.title, subtitle: p.subtitle, kind: p.kind,
      ...(p.negative ? { negative: true } : {}),
    })));
  }, plan);
  await wait(600);
}

/** Odczyt karty z ŻYWEGO DOM-u: czy ma skrot, jaka etykiete, jaki kursor. */
async function readCards(page, plan) {
  return page.evaluate((plan) => {
    const out = {};
    for (const p of plan) {
      const card = document.querySelector('.civ-side-panel .sp-event[data-id="' + p.id + '"]');
      if (card === null) { out[p.id] = { missing: true }; continue; }
      const cta = card.querySelector('.sp-goto-cta');
      out[p.id] = {
        cta: cta === null ? null : (cta.textContent || '').replace(/\s+/g, ' ').trim(),
        ctaVisible: cta === null ? false : cta.getBoundingClientRect().width > 0,
        noLinkCls: card.classList.contains('sp-no-link'),
        cursor: getComputedStyle(card).cursor,
        role: card.getAttribute('role'),
        tabindex: card.getAttribute('tabindex'),
        blocking: card.classList.contains('sp-blocking'),
      };
    }
    return out;
  }, plan);
}

/**
 * Prawdziwy klik myszą w kartę. Panel WYDARZENIA jest scrollowalny (`.sp-scroll`,
 * `max-height:100%`) — przy kilkunastu kartach dalsze wypadają poza widoczny obszar, a
 * `boundingBox()` zwraca wtedy prostokąt SPOZA panelu i „klik" trafia w canvas. Dlatego:
 * najpierw `scrollIntoViewIfNeeded`, a potem WERYFIKACJA `document.elementFromPoint` w
 * dokładnym punkcie kliku — bez niej kontrole negatywne (sekcja C) byłyby fałszywie zielone
 * (nic się nie otworzyło, bo klik w ogóle nie doszedł do karty).
 * Zwraca `{ hit:true }` tylko gdy punkt kliku faktycznie należy do TEJ karty.
 */
async function clickCard(page, id) {
  const sel = '.civ-side-panel .sp-event[data-id="' + id + '"]';
  const loc = page.locator(sel);
  if (await loc.count() === 0) return { hit: false, why: 'brak karty w DOM' };
  await loc.scrollIntoViewIfNeeded();
  await wait(150);
  const box = await loc.boundingBox();
  if (box === null) return { hit: false, why: 'brak boundingBox' };
  // Klik w LEWĄ część karty (ikona/tekst), z dala od ✕ i od pigułki skrótu przy prawej krawędzi.
  const cx = box.x + 26;
  const cy = box.y + box.height / 2;
  const at = await page.evaluate(({ cx, cy, id }) => {
    const el = document.elementFromPoint(cx, cy);
    const card = el === null ? null : el.closest('.sp-event[data-id]');
    return { tag: el === null ? null : el.tagName, cardId: card === null ? null : card.getAttribute('data-id'), want: id };
  }, { cx, cy, id });
  if (at.cardId !== id) return { hit: false, why: 'punkt kliku nie nalezy do karty', at };
  await page.mouse.click(cx, cy);
  await wait(700);
  return { hit: true };
}

async function main() {
  let chromium;
  try { ({ chromium } = require('playwright')); }
  catch (e) { console.error('[przekierowania-test] playwright missing — npm i -D playwright'); process.exit(1); }

  buildBundle();

  // --- (0) statyczne kotwice w zrodle: jedno zrodlo prawdy istnieje i jest uzywane -----
  console.log('\n-- (0) kotwice w zrodle --');
  const linkSrc = fs.readFileSync(path.join(GRA_DIR, 'src', 'game', 'side-panel-event-link.ts'), 'utf8');
  const mainSrc = fs.readFileSync(path.join(GRA_DIR, 'src', 'main.ts'), 'utf8');
  const hudSrc = fs.readFileSync(path.join(GRA_DIR, 'src', 'ui', 'sidePanelHud.ts'), 'utf8');
  assert('(0a) renderer rysuje skrot wylacznie z config.getEventLink (brak wlasnej listy prefiksow)',
    /const link = config\.getEventLink\?\.\(ev\) \?\? null;/.test(hudSrc) && !/border-march-/.test(hudSrc));
  assert('(0b) main.ts karmi afordancje TA SAMA funkcja co onEventClick',
    /getEventLink: \(ev\) => \(ev\.blocking === true \? null : sidePanelEventLinkFor\(ev\.id\)\)/.test(mainSrc)
    && /if \(openSidePanelEventLink\(id\)\) return;/.test(mainSrc));
  assert('(0c) modul linkow nie zna zdarzen czysto informacyjnych (eot-hint / edu-veteran)',
    !/\['eot-hint-'/.test(linkSrc) && !/\['edu-veteran/.test(linkSrc));
  const built = fs.readFileSync(path.join(OUT_DIR, 'index.html'), 'utf8');
  assert('(0d) artefakt vite build niesie regule CSS skrotu (.sp-goto-cta) i klase .sp-no-link',
    built.includes('sp-goto-cta') && built.includes('sp-no-link'));

  const browser = await launchBrowser(chromium);
  const consoleErrors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
    page.on('pageerror', (e) => consoleErrors.push('[pageerror] ' + e.message));

    await gotoPlaytestMapa(page);
    const playerCity = await page.evaluate(() => window.__sidePanelLinkTestDebug.firstPlayerCity());
    assert('(0e) partia playtest ma miasto gracza (cel skrotu „Panel miasta")', playerCity !== null, playerCity);
    if (playerCity === null) throw new Error('brak miasta gracza — nie da sie zainscenizowac karty szlaku');

    const plan = seedPlan(playerCity.id);
    await seed(page, plan);

    // --- (A) afordancja: skrot dokladnie tam, gdzie jest miejsce docelowe --------------
    console.log('\n-- (A) afordancja na kartach --');
    const cards = await readCards(page, plan);
    for (const p of plan) {
      const c = cards[p.id];
      if (c === undefined || c.missing) { assert('(A) karta ' + p.id + ' wyrenderowana', false, c); continue; }
      if (p.expect === null) {
        assert('(A-) ' + p.id + ': BRAK skrotu (karta czysto informacyjna)',
          c.cta === null && c.noLinkCls === true, c);
        assert('(A-) ' + p.id + ': kursor NIE udaje klikalnosci (cursor:default)',
          c.cursor === 'default', c);
        assert('(A-) ' + p.id + ': nie wchodzi w kolejnosc Tab (brak role/tabindex)',
          c.role === null && c.tabindex === null, c);
      } else {
        assert('(A+) ' + p.id + ': widoczny skrot „' + p.expect + ' →"',
          c.cta === p.expect + ' →' && c.ctaVisible === true, c);
        assert('(A+) ' + p.id + ': karta ze skrotem zostaje klikalna i osiagalna z klawiatury',
          c.noLinkCls === false && c.cursor === 'pointer' && c.role === 'button' && c.tabindex === '0', c);
      }
    }

    if (SHOTS !== null) {
      fs.mkdirSync(SHOTS, { recursive: true });
      const target = await page.$('.civ-side-panel');
      if (target) await target.screenshot({ path: path.join(SHOTS, 'przekierowania-po.png') });
    }

    // --- (B) klik faktycznie otwiera wlasciwy, ISTNIEJACY widok ------------------------
    console.log('\n-- (B) klik -> wlasciwy widok (predykaty samej gry) --');
    for (const p of plan.filter(x => x.expect !== null)) {
      await page.evaluate(() => window.__sidePanelLinkTestDebug.closeAll());
      await wait(300);
      if (p.view === 'camera') {
        const before = await page.evaluate(() => window.__sidePanelLinkTestDebug.cameraTarget());
        const want = await page.evaluate((h) => window.__sidePanelLinkTestDebug.hexToWorld(h.q, h.r), p.hex);
        const clicked = await clickCard(page, p.id);
        const after = await page.evaluate(() => window.__sidePanelLinkTestDebug.cameraTarget());
        assert('(B) ' + p.id + ': klik przeniosl kamere na heks zdarzenia (' + p.hex.q + ',' + p.hex.r + ')',
          clicked.hit && Math.abs(after.x - want.x) < 0.5 && Math.abs(after.z - want.z) < 0.5,
          { clicked, before, after, want });
        continue;
      }
      const clicked = await clickCard(page, p.id);
      const views = await page.evaluate(() => window.__sidePanelLinkTestDebug.openViews());
      assert('(B) ' + p.id + ': klik otworzyl widok „' + p.view + '"',
        clicked.hit && views[p.view] === true, { clicked, views });
      if (p.view === 'cityPanel') {
        assert('(B) ' + p.id + ': otwarty jest panel MIASTA GRACZA konczacego szlak',
          views.cityPanelCityId === playerCity.id, { got: views.cityPanelCityId, want: playerCity.id });
      }
      if (p.view === 'diploList') {
        assert('(B) ' + p.id + ': lista dyplomacji otwarta na filtrze „wojny"',
          views.diploListFilter === 'war', views);
      }
    }

    // --- (C) kontrole negatywne: klik w karte bez celu NIC nie otwiera -----------------
    console.log('\n-- (C) kontrole negatywne: klik nie otwiera niczego --');
    for (const p of plan.filter(x => x.expect === null)) {
      await page.evaluate(() => window.__sidePanelLinkTestDebug.closeAll());
      await wait(250);
      const clicked = await clickCard(page, p.id);
      const views = await page.evaluate(() => window.__sidePanelLinkTestDebug.openViews());
      const anyOpen = views.cityPanel || views.diploList || views.empirePanel || views.techTree || views.civElimModal;
      assert('(C) ' + p.id + ': klik w karte bez miejsca docelowego nie otwiera zadnego widoku',
        clicked.hit && anyOpen === false, { clicked, views });
      const link = await page.evaluate((id) => window.__sidePanelLinkTestDebug.linkFor(id), p.id);
      assert('(C) ' + p.id + ': resolver zwraca null (dowod runtime, nie tylko brak CTA w DOM)',
        link === null, link);
    }

    // --- (D) karty BLOKUJACE poza zakresem tematu — nietkniete --------------------------
    console.log('\n-- (D) karty blokujace nietkniete --');
    await page.evaluate(() => window.__sidePanelLinkTestDebug.closeAll());
    await page.evaluate(() => {
      window.__sidePanelLinkTestDebug.seedEvents([{
        id: 'revolt-testcity', icon: '🔥', title: 'Bunt: Ateny',
        subtitle: 'Migracja mieszkańców', kind: 'city', blocking: true,
      }]);
    });
    await wait(600);
    const blk = await page.evaluate(() => {
      const c = document.querySelector('.civ-side-panel .sp-event[data-id="revolt-testcity"]');
      if (c === null) return { missing: true };
      return {
        expanded: c.classList.contains('sp-expanded'),
        badge: (c.querySelector('.sp-badge-decision')?.textContent || '').trim(),
        openBtn: (c.querySelector('[data-sp-open]')?.textContent || '').trim(),
        goto: c.querySelector('.sp-goto-cta') !== null,
        noLink: c.classList.contains('sp-no-link'),
      };
    });
    assert('(D) karta blokujaca zachowuje badge „Wymaga decyzji" i przycisk „Otworz →"',
      blk.expanded === true && blk.badge === 'Wymaga decyzji' && blk.openBtn === 'Otwórz →', blk);
    assert('(D) karta blokujaca NIE dostala ani skrotu informacyjnego, ani klasy sp-no-link',
      blk.goto === false && blk.noLink === false, blk);

    assert('(E) zero bledow konsoli/JS przez caly przebieg', consoleErrors.length === 0, consoleErrors.slice(0, 5));
  } finally {
    await browser.close();
  }

  console.log('\nsidepanel-event-przekierowania-real-render-test: ' + pass + ' pass, ' + fail + ' fail');
  if (SHOTS !== null) console.log('Zrzut: ' + path.join(SHOTS, 'przekierowania-po.png'));
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
