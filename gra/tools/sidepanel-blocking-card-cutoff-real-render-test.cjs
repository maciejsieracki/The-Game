'use strict';
/**
 * sidepanel-blocking-card-cutoff-real-render-test.cjs
 * P-DYPLO-KARTA-DECYZJI-DISMISS-UCIETY-Q1 (Operator Opus 5, effort medium, runda 1).
 *
 * ZGŁOSZENIE (właściciel, 2026-09-04, zrzut panelu bocznego z kartą „Wymaga decyzji"):
 * „Ta opcja zamknięcia czy odsunięcia na później decyzji dyplomatycznej niestety jest zakryta
 * i nie da się jej włączyć. Coś się popsuło. Lepszy byłby krzyżyk w górnym rogu, żeby można
 * było to po prostu wyłączyć."
 *
 * CO DOKŁADNIE DOWODZI TA BRAMKA (kryteria 1-4 dispatchu, każde ŻYWYM POMIAREM w zbudowanej
 * grze w Chromium — nie odczytem CSS, nie jsdom):
 *  A. GEOMETRIA (kryterium 1). Panel boczny jest zmuszony do braku miejsca: NISKI viewport +
 *     realna, długa karta dyplomatyczna + komplet kart informacyjnych, tak że `.sp-scroll`
 *     FAKTYCZNIE przewija (scrollHeight > clientHeight — asercja A1 pilnuje, żeby scenariusz
 *     nie był pusty; na dużym viewporcie bug nie ujawnia się nawet bez fixu i test dałby
 *     fałszywy PASS). W tych warunkach mierzone jest, czy karta blokująca jest UCIĘTA:
 *     `card.scrollHeight > card.clientHeight` to bezpośredni, binarny wykrywacz obcięcia
 *     (karta ma `overflow:hidden`, więc treść wystająca poza jej box jest niewidoczna),
 *     a `.sp-action-bar` musi w całości mieścić się w prostokącie karty i w widocznym
 *     obszarze `.sp-scroll`.
 *  B. „✕" (kryterium 1+2): istnieje w NAGŁÓWKU karty (nie w stopce), jest w prawym górnym
 *     rogu, jego środek jest FAKTYCZNIE trafialny (`document.elementFromPoint`), ma ten sam
 *     `title`/`aria-label` co wzorzec z kart informacyjnych, jest FOKUSOWALNY z klawiatury
 *     (`tabindex="0"`/`role="button"` — usunięty stąd link był natywnym <button>, więc bez
 *     tego zmiana byłaby regresem dostępności), a Enter (scen. A) i klik (scen. B) naprawdę
 *     chowają kartę. Przysługuje kartom o MIĘKKIM, jednoturowym dismissie — nie `prod-empty-*`.
 *  C. „OTWÓRZ →" (kryterium 3): na realnej karcie `prod-empty-<id_miasta>` (id prawdziwego
 *     miasta gracza, routing main.ts po prefiksie) klik w „Otwórz →" otwiera REALNY panel
 *     miasta — czytane predykatami gry (`__sidePanelLinkTestDebug.openViews()`), nie klasami CSS.
 *     Ta sama karta dowodzi (C2), że `prod-empty-*` NIE dostaje „✕": main.ts dismissuje ją
 *     WIELOTUROWO (odcisk opcji produkcji), więc „✕" byłby tam zmianą rozgrywkową poza GOAL.
 *  R. Karta buntu (`revolt-*`): ma „✕" ORAZ „Zignoruj — bunt potrwa dalej" — i to nie jest
 *     duplikat do usunięcia: etykieta linku niesie skutek, którego nie ma w tytule ani
 *     podtytule karty (R3), a po fixie geometrii dwuelementowa stopka mieści się w karcie (R4).
 *  D. Karty informacyjne (kryterium 4): `.sp-close` bez zmian — ten sam `title`/`aria-label`,
 *     klik nadal chowa kartę.
 *  E. Zero błędów konsoli/JS przez cały przebieg.
 *
 * DOWÓD NIETAUTOLOGICZNOŚCI (R-PROC-AUTOBOT §9 pkt 6a) — LISTA ZMIERZONA, nie deklarowana
 * (korekta z rundy 1, obrona: poprzedni zapis „A2/A3/A4" był nieprawdziwy — A4 zostaje
 * ZIELONE, bo ściśnięta karta nadal mieści się w oknie przewijania, a czerwienieją asercje
 * pominięte w tamtym opisie). Mutacja: usuń z `src/ui/sidePanelHud.ts` `min-height:min-content;
 * flex-shrink:0;` z reguły `.sp-event.sp-blocking.sp-expanded`, przebuduj bundel, przywróć
 * źródło, uruchom bramkę na zmutowanym dist. Czerwienieje wtedy DOKŁADNIE 12 asercji
 * (przebieg 2026-09-04: „35 pass, 12 fail", exit 1):
 *   A1, A2, A3, A5, B2, B3, B5, BB4, BB6, C1, C3, R4
 * (A1: po skurczeniu karty panel przestaje w ogóle przewijać; A2/B2: cardScrollH 207 vs
 * clientH 24 i 165 vs 0 — karta fizycznie ucięta; A3/B3: dolna krawędź stopki 363,8 poza
 * kartą kończącą się na 184; A5/B5/C3: „Otwórz →" przykryty — elementFromPoint zwraca
 * `sp-sub`, klik wpada w timeout; BB4/BB6: „✕" nietrafialny, więc klik nie zamyka karty;
 * C1: to samo na prod-empty; R4: to samo na karcie buntu). ZIELONE zostają m.in. A4/B4
 * (ściśnięta karta nadal mieści się w oknie przewijania — dlatego NIE jest to detektor
 * ucięcia) oraz wszystkie kotwice statyczne (0*), bo mutacja nie tyka źródła w chwili
 * pomiaru. Cała bramka kończy się CZYSTYM podsumowaniem pass/fail: każdy klik idzie przez
 * `tryClick`/try-catch, więc nietrafialny element daje FAIL, nie nieobsłużony TimeoutError.
 *
 * DLACZEGO SEEDOWANE KARTY, NIE ŻYWA OFERTA Z AI: gra nie ma haka testowego wstrzykującego
 * wpis do `pendingDiplomacyInbox`/`negotiationTable`, a allowlista tematu zabrania zmian w
 * `main.ts`. Karty seedowane są istniejącym hakiem `__sidePanelLinkTestDebug.seedEvents()`
 * z DOKŁADNIE tym samym kształtem, jaki produkuje `collectTurnEvents()` w main.ts dla obu
 * źródeł kart blokujących dyplomatycznych (patrz stałe REAL_* niżej — `title` =
 * 'Dyplomacja: ' + civName, `subtitle` = diploPendingTitle(cmdType) + ' — ' + powod AI,
 * albo negotiationSummary(...) + ' (runda x/y)'), więc renderowana karta ma tę samą
 * wysokość co produkcyjna. Kotwica statyczna (krok 0) pilnuje, żeby ten kształt nie
 * rozjechał się z main.ts.
 *
 * Bramka (z katalogu gra/): node tools/sidepanel-blocking-card-cutoff-real-render-test.cjs
 *   --shots <katalog>   zrzuty karty (dowód wizualny do raportu)
 *   --dist <katalog>    użyj gotowego katalogu vite build zamiast budować go w teście
 */
const fs = require('fs');
const os = require('os');
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
// C-001: build idzie do katalogu POZA drzewem repo (OneDrive blokuje unlink w gra/dist).
// --- P-BRAMKA-WSPOLDZIELONY-DIST-TMPDIR-Q1: katalogi/pliki tymczasowe unikalne per przebieg ---
// Stala nazwa pod os.tmpdir() jest wspoldzielona przez KAZDY rownolegly przebieg (takze
// uruchomiony z innego worktree). Skutek dziala w obie strony: raz falszywy CZERWONY
// (jeden bieg czysci drugiemu katalog w locie), raz falszywy ZIELONY (dwa biegi mierza
// ten sam artefakt, wiec "parytet" jest artefaktem kolizji, nie dowodem). Sufiks
// per-proces to rozlacza; asercje i progi bramki pozostaja nietkniete.
const TMPDIR_RUN_ID = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
// Unikalnosc BEZ sprzatania zamienilaby kolizje w staly wyciek dysku (brak miejsca to
// ta sama klasa problemu z drugiej strony), wiec kasujemy WLASNE artefakty tego biegu.
// Dopasowanie po TMPDIR_RUN_ID nie moze trafic w cudzy katalog. Zrzuty/podglady
// zostaja na dysku celowo — sa DOWODEM wizualnym (R-PROC-AUTOBOT.md §9 pkt 6).
process.on('exit', () => {
  // `require` lokalnie: hak musi dzialac takze w plikach, ktore nie maja `fs`/`path`
  // w zasiegu modulu — inaczej ReferenceError wpada w catch i sprzatanie milczy.
  const nfs = require('fs'); const npath = require('path'); const nos = require('os');
  try {
    for (const ent of nfs.readdirSync(nos.tmpdir())) {
      if (!ent.includes(TMPDIR_RUN_ID)) continue;
      if (/shots|preview|zrzut/i.test(ent)) continue;
      try { nfs.rmSync(npath.join(nos.tmpdir(), ent), { recursive: true, force: true }); } catch { /* best-effort */ }
    }
  } catch { /* best-effort */ }
});
const OUT_DIR = DIST_ARG !== null ? path.resolve(DIST_ARG) : path.join(os.tmpdir(), `civ-dist-sp-cutoff-test-${TMPDIR_RUN_ID}`);
const OUT_HTML = 'file://' + path.join(OUT_DIR, 'index.html') + '?playtest=mapa';

// Realny kształt karty dyplomatycznej z main.ts (collectTurnEvents, pętla po
// pendingDiplomacyInbox): title 'Dyplomacja: ' + civName, subtitle diploPendingTitle(cmdType)
// + ' — ' + reason (reason = `powod` z komendy AI, pełne zdanie). Najdłuższy realny wariant.
const REAL_DIPLO_ID = 'diplo-pend-3-zaproponuj_handel_surowiec-12-0';
const REAL_DIPLO_TITLE = 'Dyplomacja: Egipt';
const REAL_DIPLO_SUB = 'Propozycja handlu surowcem — Nasze kopalnie dają nadwyżkę miedzi, '
  + 'a wasze spichlerze pękają w szwach; wymiana wzmocni oba nasze ludy przed nadchodzącą zimą.';
// Realny kształt karty ze stołu negocjacyjnego (negotiationSummary + ' (runda x/y)').
const REAL_NEGOT_ID = 'negot-granice-0-3-t12-1';
const REAL_NEGOT_TITLE = 'Dyplomacja: Rzym';
const REAL_NEGOT_SUB = 'Wspólna walka z barbarzyńcami i przemarsz — 3 tury (runda 2/3)';

let pass = 0;
let fail = 0;
function assert(label, cond, detail) {
  if (cond) { pass++; console.log('  OK   ' + label); }
  else { fail++; console.error('  FAIL ' + label + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** Klik, ktory NIGDY nie wysypuje bramki nieobsluzonym TimeoutError Playwrighta.
 * Gdy element jest nietrafialny (dokladnie to, co robi mutant z przywroconym bugiem
 * ucieca: nadwyzka karty przykryta sasiadami), zwracamy komunikat, a wolajacy raportuje
 * czysty FAIL — bramka konczy sie normalnym podsumowaniem pass/fail, nie stack trace'em. */
async function tryClick(page, sel) {
  try { await page.locator(sel).click({ timeout: 8000 }); return null; }
  catch (e) { return String(e && e.message ? e.message : e).split('\n')[0]; }
}

function buildBundle() {
  if (DIST_ARG !== null) { console.log('[sp-cutoff-test] uzywam gotowego dist: ' + OUT_DIR); return; }
  console.log('[sp-cutoff-test] vite build (C-001: binarka vite, nigdy npm run build)...');
  execSync(
    `node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(OUT_DIR)} --emptyOutDir`,
    { cwd: GRA_DIR, stdio: 'pipe' },
  );
  if (!fs.existsSync(path.join(OUT_DIR, 'index.html'))) throw new Error('Build nie wyprodukowal index.html w ' + OUT_DIR);
  console.log('[sp-cutoff-test] build OK.');
}

async function launchBrowser(chromium) {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    console.log('[sp-cutoff-test] domyslny Chromium niedostepny, fallback na ' + FALLBACK_CHROME);
    return await chromium.launch({
      headless: true,
      executablePath: FALLBACK_CHROME,
      args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
    });
  }
}

async function gotoPlaytestMapa(page) {
  await page.goto(OUT_HTML, { waitUntil: 'load', timeout: 180000 });
  await page.waitForSelector('.civ-hud, .civ-ux-frame, .civ-cs', { timeout: 180000 });
  for (let i = 0; i < 120; i++) {
    if (await page.locator('text=Tworzenie świata').count() === 0) break;
    await wait(1000);
  }
  await page.waitForFunction(
    () => !!window.__sidePanelLinkTestDebug && !!window.__eraTestDebug
      && window.__eraTestDebug.getWorldState().citiesLen > 0,
    undefined,
    { timeout: 180000 },
  );
  await wait(500);
}

/** Komplet realnych pomiarów geometrii karty blokującej — jeden odczyt z żywego DOM-u. */
async function measureBlockingCard(page, id) {
  return page.evaluate((id) => {
    const scroll = document.querySelector('.civ-side-panel .sp-scroll');
    const card = document.querySelector('.civ-side-panel .sp-event[data-id="' + id + '"]');
    if (scroll === null || card === null) return { missing: true };
    const bar = card.querySelector('.sp-action-bar');
    const openBtn = card.querySelector('[data-sp-open]');
    const closeEl = card.querySelector('.sp-close');
    const r = (el) => {
      if (el === null) return null;
      const b = el.getBoundingClientRect();
      return { top: b.top, bottom: b.bottom, left: b.left, right: b.right, w: b.width, h: b.height };
    };
    const hitAt = (el) => {
      if (el === null) return null;
      const b = el.getBoundingClientRect();
      const hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
      if (hit === null) return 'null';
      return hit === el ? 'self' : (el.contains(hit) ? 'descendant' : (hit.className || hit.tagName));
    };
    return {
      missing: false,
      expanded: card.classList.contains('sp-expanded'),
      // Bezpośredni wykrywacz obciecia: karta ma overflow:hidden, wiec kazda nadwyzka
      // scrollHeight nad clientHeight to tresc FIZYCZNIE niewidoczna dla gracza.
      cardScrollH: card.scrollHeight,
      cardClientH: card.clientHeight,
      scrollScrollH: scroll.scrollHeight,
      scrollClientH: scroll.clientHeight,
      cardRect: r(card),
      barRect: r(bar),
      openRect: r(openBtn),
      closeRect: r(closeEl),
      scrollRect: r(scroll),
      openText: (openBtn?.textContent || '').trim(),
      closeText: (closeEl?.textContent || '').trim(),
      closeTitle: closeEl?.getAttribute('title') ?? null,
      closeAria: closeEl?.getAttribute('aria-label') ?? null,
      closeDismissId: closeEl?.getAttribute('data-dismiss') ?? null,
      closeInHeader: closeEl !== null && closeEl.closest('.sp-blk-body') !== null,
      closeTabindex: closeEl?.getAttribute('tabindex') ?? null,
      closeRole: closeEl?.getAttribute('role') ?? null,
      closeCount: card.querySelectorAll('.sp-close').length,
      closeHit: hitAt(closeEl),
      openHit: hitAt(openBtn),
      titleText: (card.querySelector('.sp-title')?.textContent || '').trim(),
      subText: (card.querySelector('.sp-sub')?.textContent || '').trim(),
      ignoreRect: r(card.querySelector('.sp-action-ignore')),
      ignoreHit: hitAt(card.querySelector('.sp-action-ignore')),
      ignoreTag: card.querySelector('.sp-action-ignore')?.tagName ?? null,
      ignoreBtns: Array.from(card.querySelectorAll('.sp-action-ignore'))
        .map((b) => (b.textContent || '').replace(/\s+/g, ' ').trim()),
    };
  }, id);
}

/** Kilka realnych kart informacyjnych — zapełniają panel, żeby zabrakło miejsca. */
function fillerInfoEvents(n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push({
      id: 'filler-' + i,
      icon: '⚔️',
      title: 'Wojna: Sumerowie',
      subtitle: 'Nasze oddziały starły się z wrogiem pod murami miasta (' + i + ').',
      kind: 'enemy',
      blocking: false,
    });
  }
  return out;
}

async function main() {
  let chromium;
  try { ({ chromium } = require('playwright')); }
  catch (e) { console.error('[sp-cutoff-test] playwright missing — npm i -D playwright'); process.exit(1); }

  buildBundle();

  console.log('\n-- (0) kotwice statyczne: ksztalt seedowanej karty = ksztalt produkcyjny --');
  const mainSrc = fs.readFileSync(path.join(GRA_DIR, 'src', 'main.ts'), 'utf8');
  const hudSrc = fs.readFileSync(path.join(GRA_DIR, 'src', 'ui', 'sidePanelHud.ts'), 'utf8');
  assert('(0a) collectTurnEvents buduje karte pendingDiplomacyInbox jako blocking kind:diplo z title "Dyplomacja: "+civName i subtitle diploPendingTitle+reason',
    /for \(const p of pendingDiplomacyInbox\) \{[\s\S]{0,400}title: 'Dyplomacja: ' \+ p\.civName,[\s\S]{0,200}subtitle: diploPendingTitle\(p\.cmdType\)[\s\S]{0,200}kind: 'diplo',[\s\S]{0,60}blocking: true,/.test(mainSrc));
  assert('(0b) collectTurnEvents buduje karte negotiationTable jako blocking kind:diplo z subtitle negotiationSummary + runda',
    /for \(const n of negotiationTable\) \{[\s\S]{0,500}subtitle: negotiationSummary\(n, true\)[\s\S]{0,200}kind: 'diplo',[\s\S]{0,60}blocking: true,/.test(mainSrc));
  assert('(0c) fix geometrii jest w regule .sp-blocking.sp-expanded (min-height:min-content + flex-shrink:0)',
    /sp-event\.sp-blocking\.sp-expanded\{[\s\S]{0,3000}min-height:min-content;flex-shrink:0;/.test(hudSrc));
  assert('(0d) renderer karty blokujacej ma "✕" (.sp-close z data-dismiss) w naglowku .sp-blk-body, przed .sp-action-bar',
    /sp-blk-body[\s\S]{0,4000}class="sp-close" role="button" tabindex="0" data-dismiss=[\s\S]{0,400}sp-action-bar/.test(hudSrc));
  assert('(0e) zdublowany link "Odloz na pozniej" (data-sp-ignore na karcie diplo) usuniety z RENDERU (wzmianka w komentarzu historycznym dozwolona)',
    !/data-sp-ignore="[^"]*">Odłóż na później</.test(hudSrc));
  assert('(0f) link buntu "Zignoruj — bunt potrwa dalej" NIETKNIETY (nie jest duplikatem ✕)',
    /data-sp-ignore="' \+ ev\.id \+ '">Zignoruj — bunt potrwa dalej<\/button>/.test(hudSrc));
  // (0g) zarzut Evaluatora 1: main.ts obsluguje 'prod-empty-' WLASNA galezia (fingerprint,
  // dismiss wieloturowy) PRZED galezia miekkiego dismissu — kotwica pilnuje, ze przeslanka
  // bramki hasSoftOneTurnDismissEvent nadal odpowiada faktycznemu main.ts.
  assert('(0g) main.ts: "prod-empty-" ma wlasna galez dismissu (prodEmptyDismissFp) PRZED dismissedSidePanelEventIds',
    /id\.startsWith\('prod-empty-'\)[\s\S]{0,400}prodEmptyDismissFp\.set\([\s\S]{0,300}dismissedSidePanelEventIds\.add\(id\)/.test(mainSrc));
  assert('(0h) render bramkuje "✕" karty blokujacej przez hasSoftOneTurnDismissEvent i daje mu tabindex/role',
    /hasSoftOneTurnDismissEvent\(ev\)[\s\S]{0,200}class="sp-close" role="button" tabindex="0" data-dismiss=/.test(hudSrc));
  assert('(0i) listener .sp-close[data-dismiss] obsluguje Enter/Spacje (klawiaturowa sciezka zamkniecia)',
    /sp-close\[data-dismiss\]'\)\.forEach[\s\S]{0,2500}addEventListener\('keydown'[\s\S]{0,900}'Enter'[\s\S]{0,500}onEventDismiss/.test(hudSrc));

  const browser = await launchBrowser(chromium);
  const consoleErrors = [];

  try {
    // =============== (A)+(B) geometria + „✕" na realnej karcie dyplomatycznej ===============
    // NISKI viewport — dokladnie warunek z REGULY PRZECIW SAMOOSZUKIWANIU dispatchu.
    for (const scen of [
      { label: 'A', id: REAL_DIPLO_ID, title: REAL_DIPLO_TITLE, sub: REAL_DIPLO_SUB, vh: 700, fillers: 4 },
      { label: 'B', id: REAL_NEGOT_ID, title: REAL_NEGOT_TITLE, sub: REAL_NEGOT_SUB, vh: 640, fillers: 4 },
    ]) {
      console.log('\n-- (' + scen.label + ') karta ' + scen.id + ', viewport 1280x' + scen.vh + ' --');
      const page = await browser.newPage({ viewport: { width: 1280, height: scen.vh } });
      page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(scen.label + ': ' + m.text()); });
      page.on('pageerror', (e) => consoleErrors.push(scen.label + ': [pageerror] ' + e.message));
      try {
        await gotoPlaytestMapa(page);
        await page.evaluate(({ id, title, sub, fillers }) => {
          window.__sidePanelLinkTestDebug.seedEvents([
            { id, icon: '🤝', title, subtitle: sub, kind: 'diplo', blocking: true },
            ...fillers,
          ]);
        }, { id: scen.id, title: scen.title, sub: scen.sub, fillers: fillerInfoEvents(scen.fillers) });
        await wait(600);

        const m = await measureBlockingCard(page, scen.id);
        assert('(' + scen.label + '0) karta wyrenderowana i rozwinieta', m.missing === false && m.expanded === true, m);
        if (m.missing) { await page.close(); continue; }

        // --- A1: scenariusz FAKTYCZNIE ma za malo miejsca (inaczej PASS bylby pusty) ---
        assert('(' + scen.label + '1) panel .sp-scroll faktycznie przewija (za malo miejsca) — scenariusz nie jest pusty',
          m.scrollScrollH > m.scrollClientH + 1,
          { scrollScrollH: m.scrollScrollH, scrollClientH: m.scrollClientH });

        // --- A2: karta NIE jest ucieta (bezposredni wykrywacz) ---
        assert('(' + scen.label + '2) karta NIE jest ucieta: card.scrollHeight <= card.clientHeight',
          m.cardScrollH <= m.cardClientH + 1,
          { cardScrollH: m.cardScrollH, cardClientH: m.cardClientH });

        // --- A3: cala stopka akcji miesci sie w prostokacie karty ---
        assert('(' + scen.label + '3) cala .sp-action-bar miesci sie w karcie (dolna krawedz stopki <= dolna krawedz karty)',
          m.barRect !== null && m.barRect.h > 0 && m.barRect.bottom <= m.cardRect.bottom + 1,
          { barRect: m.barRect, cardRect: m.cardRect });

        // --- A4: cala karta widoczna w oknie przewijania, bez przewijania ---
        assert('(' + scen.label + '4) cala karta miesci sie w widocznym obszarze .sp-scroll (bez przewijania)',
          m.cardRect.top >= m.scrollRect.top - 1 && m.cardRect.bottom <= m.scrollRect.bottom + 1,
          { cardRect: m.cardRect, scrollRect: m.scrollRect });

        // --- A5: przycisk glownej akcji w calosci widoczny i trafialny ---
        assert('(' + scen.label + '5) "Otworz ->" w calosci w karcie i trafialny (elementFromPoint)',
          m.openText === 'Otwórz →' && m.openRect !== null && m.openRect.bottom <= m.cardRect.bottom + 1
          && (m.openHit === 'self' || m.openHit === 'descendant'),
          { openText: m.openText, openRect: m.openRect, openHit: m.openHit });

        // --- B1..B4: „✕" ---
        assert('(' + scen.label + 'B1) "✕" istnieje w NAGLOWKU karty (.sp-blk-body), nie w stopce akcji',
          m.closeText === '✕' && m.closeInHeader === true && m.closeDismissId === scen.id,
          { closeText: m.closeText, closeInHeader: m.closeInHeader, closeDismissId: m.closeDismissId });
        assert('(' + scen.label + 'B2) "✕" ma ten sam title/aria-label co wzorzec kart informacyjnych',
          m.closeTitle === 'Zamknij' && m.closeAria === 'Zamknij powiadomienie',
          { closeTitle: m.closeTitle, closeAria: m.closeAria });
        assert('(' + scen.label + 'B3) "✕" jest w PRAWYM GORNYM rogu karty (<=30px od gory, <=30px od prawej krawedzi)',
          m.closeRect !== null
          && (m.closeRect.top - m.cardRect.top) <= 30 && (m.closeRect.top - m.cardRect.top) >= 0
          && (m.cardRect.right - m.closeRect.right) <= 30 && (m.cardRect.right - m.closeRect.right) >= 0,
          { closeRect: m.closeRect, cardRect: m.cardRect });
        assert('(' + scen.label + 'B4) srodek "✕" jest FAKTYCZNIE trafialny (nic go nie przykrywa)',
          m.closeHit === 'self' || m.closeHit === 'descendant', { closeHit: m.closeHit });
        assert('(' + scen.label + 'B5) na karcie dyplomatycznej NIE ma juz zdublowanego linku "Odloz na pozniej"',
          m.ignoreBtns.length === 0, m.ignoreBtns);
        // B7: usuniety link byl natywnym <button> (Tab+Enter). „✕" musi byc rownie dostepny
        // z klawiatury, inaczej zmiana jest regresem dostepnosci wzgledem 5cbe910c.
        assert('(' + scen.label + 'B7) "✕" karty blokujacej jest FOKUSOWALNY (tabindex=0, role=button)',
          m.closeTabindex === '0' && m.closeRole === 'button',
          { closeTabindex: m.closeTabindex, closeRole: m.closeRole });

        if (SHOTS !== null) {
          fs.mkdirSync(SHOTS, { recursive: true });
          const target = await page.$('.civ-side-panel .sp-event[data-id="' + scen.id + '"]');
          if (target) await target.screenshot({ path: path.join(SHOTS, scen.label + '-karta-blokujaca.png') });
          const panel = await page.$('.civ-side-panel');
          if (panel) await panel.screenshot({ path: path.join(SHOTS, scen.label + '-panel.png') });
          await page.screenshot({ path: path.join(SHOTS, scen.label + '-viewport.png') });
        }

        // --- B6: „✕" faktycznie chowa karte w tej turze. Scenariusz A robi to KLAWIATURA
        // (focus + Enter — dowod, ze sciezka klawiaturowa zamkniecia nie zginela z usunietym
        // <button data-sp-ignore>), scenariusz B mysza. Cala interakcja w try/catch: gdy
        // element jest nietrafialny (np. w mutancie z przywroconym bugiem), bramka ma
        // zaraportowac czysty FAIL, a nie wysypac sie nieobsluzonym TimeoutError Playwrighta.
        const closeSel = '.civ-side-panel .sp-event[data-id="' + scen.id + '"] .sp-close';
        const viaKeyboard = scen.label === 'A';
        let closeErr = null;
        try {
          if (viaKeyboard) {
            await page.locator(closeSel).focus({ timeout: 8000 });
            const focused = await page.evaluate((sel) => document.activeElement === document.querySelector(sel), closeSel);
            assert('(' + scen.label + 'B6a) "✕" faktycznie przyjmuje fokus z klawiatury', focused === true);
            await page.keyboard.press('Enter');
          } else {
            await page.locator(closeSel).click({ timeout: 8000 });
          }
        } catch (e) { closeErr = String(e && e.message ? e.message : e).split('\n')[0]; }
        await wait(400);
        const after = closeErr !== null ? { missing: false, closeErr } : await measureBlockingCard(page, scen.id);
        assert('(' + scen.label + 'B6) ' + (viaKeyboard ? 'Enter na sfokusowanym "✕"' : 'klik w "✕"')
          + ' ukryl karte z listy "Wymaga decyzji" w tej turze',
          closeErr === null && after.missing === true, after);
        if (SHOTS !== null) {
          const panel = await page.$('.civ-side-panel');
          if (panel) await panel.screenshot({ path: path.join(SHOTS, scen.label + '-po-kliknieciu-krzyzyka.png') });
        }
      } finally {
        await page.close();
      }
    }

    // =============== (C) „OTWORZ ->" nadal otwiera realny widok + (D) karty informacyjne ===============
    console.log('\n-- (C) "Otworz ->" na realnej karcie prod-empty + (D) regresja kart informacyjnych --');
    const page = await browser.newPage({ viewport: { width: 1280, height: 520 } });
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push('C/D: ' + m.text()); });
    page.on('pageerror', (e) => consoleErrors.push('C/D: [pageerror] ' + e.message));
    try {
      await gotoPlaytestMapa(page);
      const city = await page.evaluate(() => window.__sidePanelLinkTestDebug.firstPlayerCity());
      assert('(C0) znaleziono realne miasto gracza do testu "Otworz ->"', city !== null, city);
      const prodId = 'prod-empty-' + (city ? city.id : 'x');
      await page.evaluate(({ prodId, cityName, fillers }) => {
        window.__sidePanelLinkTestDebug.seedEvents([
          { id: prodId, icon: '⚙️', title: 'Produkcja: ' + cityName, subtitle: 'Kolejka produkcji jest pusta — wybierz, co budować.', kind: 'city', blocking: true },
          ...fillers,
        ]);
      }, { prodId, cityName: city ? city.name : '', fillers: fillerInfoEvents(8) });
      await wait(600);

      const mProd = await measureBlockingCard(page, prodId);
      assert('(C1) karta prod-empty rozwinieta, nie ucieta, ze stopka w calosci w karcie',
        mProd.missing === false && mProd.expanded === true
        && mProd.cardScrollH <= mProd.cardClientH + 1
        && mProd.barRect.bottom <= mProd.cardRect.bottom + 1, mProd);
      // C2 (runda 1, obrona — zarzut Evaluatora 1): karta `prod-empty-*` NIE dostaje „✕".
      // main.ts:19946-19954 obsluguje ten prefiks WLASNA galezia (prodEmptyDismissFp.set +
      // return) PRZED miekkim dismissem, a collectTurnEvents (:13854-13857) wznawia karte
      // dopiero przy zmianie productionOptionsFingerprint — dismiss jest WIELOTUROWY, wiec
      // „✕" bylby tam trwalym wyciszeniem blokujacego alertu, czyli zmiana ROZGRYWKOWA poza
      // GOAL (GOAL 4: „zmienia sie WYLACZNIE prezentacja"). Fix geometrii dziala tam mimo to.
      assert('(C2) karta prod-empty NIE ma "✕" (jej dismiss w main.ts jest wieloturowy — poza GOAL)',
        mProd.closeCount === 0, { closeCount: mProd.closeCount, closeText: mProd.closeText });

      const openErr = await tryClick(page, '.civ-side-panel .sp-event[data-id="' + prodId + '"] [data-sp-open]');
      await wait(900);
      const views = openErr !== null ? { openErr } : await page.evaluate(() => window.__sidePanelLinkTestDebug.openViews());
      assert('(C3) klik w "Otworz ->" otworzyl REALNY panel miasta (predykat gry isCityPanelOpen)',
        openErr === null && views.cityPanel === true && views.cityPanelCityId === (city ? city.id : null), views);
      await page.evaluate(() => window.__sidePanelLinkTestDebug.closeAll());
      await wait(400);

      // =============== (R) karta buntu: „✕" ORAZ „Zignoruj — bunt potrwa dalej" ===============
      // Runda 1, obrona — zarzut Evaluatora 4. Link buntu ZOSTAJE mimo tego samego handlera,
      // bo (a) jego etykieta niesie skutek, ktorego NIE ma nigdzie indziej na karcie
      // (main.ts:13843-13846 daje tylko title 'Bunt: <miasto>' i subtitle 'Migracja
      // mieszkancow'), (b) po fixie geometrii dwuelementowa stopka juz sie NIE tnie — i to
      // jest tu mierzone zywo, nie deklarowane w komentarzu.
      const revoltId = 'revolt-' + (city ? city.id : 'x');
      await page.evaluate(({ revoltId, cityName, fillers }) => {
        window.__sidePanelLinkTestDebug.seedEvents([
          { id: revoltId, icon: '🔥', title: 'Bunt: ' + cityName, subtitle: 'Migracja mieszkańców', kind: 'city', blocking: true },
          ...fillers,
        ]);
      }, { revoltId, cityName: city ? city.name : '', fillers: fillerInfoEvents(8) });
      await wait(600);
      const mRev = await measureBlockingCard(page, revoltId);
      assert('(R1) karta buntu ma "✕" w naglowku (jej dismiss w main.ts jest miekki, jednoturowy)',
        mRev.missing === false && mRev.closeText === '✕' && mRev.closeInHeader === true, mRev);
      assert('(R2) link buntu ZOSTAJE i jest natywnym <button> z pelna etykieta skutku',
        mRev.ignoreTag === 'BUTTON' && mRev.ignoreBtns.length === 1
        && mRev.ignoreBtns[0] === 'Zignoruj — bunt potrwa dalej', mRev.ignoreBtns);
      assert('(R3) etykieta linku niesie informacje, ktorej NIE ma w tytule ani podtytule karty (nie jest duplikatem "✕")',
        !mRev.titleText.includes('bunt potrwa') && !mRev.subText.includes('bunt potrwa'),
        { titleText: mRev.titleText, subText: mRev.subText });
      assert('(R4) mimo DWOCH sterowan stopka buntu sie NIE tnie: link w calosci w karcie i trafialny',
        mRev.cardScrollH <= mRev.cardClientH + 1
        && mRev.ignoreRect !== null && mRev.ignoreRect.bottom <= mRev.cardRect.bottom + 1
        && (mRev.ignoreHit === 'self' || mRev.ignoreHit === 'descendant')
        && (mRev.closeHit === 'self' || mRev.closeHit === 'descendant'), mRev);
      if (SHOTS !== null) {
        const panel = await page.$('.civ-side-panel');
        if (panel) await panel.screenshot({ path: path.join(SHOTS, 'R-karta-buntu.png') });
      }

      // (D) karty informacyjne — bez zmian
      const info = await page.evaluate(() => {
        const c = document.querySelector('.civ-side-panel .sp-event[data-id="filler-0"]');
        if (c === null) return { missing: true };
        const x = c.querySelector('.sp-close');
        return {
          missing: false,
          blocking: c.classList.contains('sp-blocking'),
          hasClose: x !== null,
          title: x?.getAttribute('title') ?? null,
          aria: x?.getAttribute('aria-label') ?? null,
          text: (x?.textContent || '').trim(),
        };
      });
      assert('(D1) karta informacyjna ma niezmieniony ✕ (title "Zamknij", aria-label "Zamknij powiadomienie")',
        info.missing === false && info.blocking === false && info.hasClose === true
        && info.title === 'Zamknij' && info.aria === 'Zamknij powiadomienie' && info.text === '✕', info);
      const infoErr = await tryClick(page, '.civ-side-panel .sp-event[data-id="filler-0"] .sp-close');
      await wait(400);
      const gone = await page.evaluate(() => document.querySelector('.civ-side-panel .sp-event[data-id="filler-0"]') === null);
      assert('(D2) klik w ✕ karty informacyjnej nadal ja chowa (zero regresji)',
        infoErr === null && gone === true, infoErr);
    } finally {
      await page.close();
    }

    assert('(E) zero bledow konsoli/JS przez caly przebieg', consoleErrors.length === 0, consoleErrors.slice(0, 5));
  } finally {
    await browser.close();
  }

  console.log('\nsidepanel-blocking-card-cutoff-real-render-test: ' + pass + ' pass, ' + fail + ' fail');
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
