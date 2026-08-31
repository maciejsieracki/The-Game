'use strict';
/**
 * muzyka-era-live-e2e-test.cjs — R-MUZYKA-ERA-LIVE-E2E-Q1 (Operator Sonnet 5,
 * 2026-08-31, worktree izolowany).
 *
 * KONTEKST: Final Control retroaktywnego audytu `P-AUDYT-RETRO-MUZYKA-BRAZ-KROK10-Q1`
 * (Zarzut #1) ustalił, że dotychczasowy live-test Playwright (`era-change-toast-live-test.cjs`)
 * potwierdza WYŁĄCZNIE warstwę toast/karta technologii przy przejściu epoki — NIGDY warstwę
 * audio (stan `<audio>`/aktywnej playlisty pliku). Dodatkowo sandbox `?playtest=mapa`
 * (`doStartPlaytestMapaSwiata`, main.ts) hardkoduje `player.era = 2` od startu, więc naturalna
 * ścieżka wywołania `setEra()` od Kamienia jest w tym sandboksie no-opem.
 *
 * TA BRAMKA domyka lukę: realny `vite build`, realny headless Chromium (`?playtest=mapa`),
 * REALNY `setEra()` silnika muzyki (`audio/muzyka-antyczna.ts`) wołany PRZEZ nowy hak
 * `window.__musicEraTestDebug` (main.ts, ten sam wzorzec co `__eraTestDebug`) — hak WYŁĄCZNIE
 * woła już istniejące, eksportowane funkcje silnika (`setEra`, `getEra`, `isMusicPlaying`,
 * `startMusic`), zero reimplementacji.
 *
 * POZIOM SZCZEGÓŁOWOŚCI „który plik/playlista faktycznie gra": moduł muzyki nie eksportuje
 * per-playlist introspekcji (`kamienPlaylist`/`brazPlaylist` są prywatne modułowi, `FilePlaylist`
 * eksportuje tylko `hasTracks/start/startWithFadeIn/stop/setVolume/isPlaying`, bez per-instancji
 * dostępu z main.ts) — zamiast dotykać `filePlayer.ts`/`muzyka-antyczna.ts` (zakazane bezwzględnie
 * w allowlist tego tematu), TEN TEST instrumentuje konstruktor `window.Audio` z poziomu Playwright
 * (`page.addInitScript`, PRZED załadowaniem gry) i przechwytuje KAŻDE realne wywołanie `.play()`/
 * `.pause()`/przypisanie `.src` na realnych `HTMLAudioElement` utworzonych przez filePlayer.ts.
 * To jest czysta OBSERWACJA prawdziwych efektów ubocznych realnego kodu — nie reimplementuje
 * `setEra`/`activeFilePlaylist`, nie zgaduje po CSS/DOM.
 *
 * Pokrycie:
 *  A. Bootstrap ?playtest=mapa dobiega końca (świat gotowy) zanim cokolwiek mierzymy.
 *  B. Stan startowy: sandbox startuje w Brązie (player.era=2 hardkodowane) — moduł muzyki
 *     faktycznie gra playlistę Brązu (isMusicPlaying, getEra()===2, >=1 realny play() na
 *     pliku z katalogu utwory/braz/).
 *  C. Realny `setEra(1)` (Brąz->Kamień) przez hak: getEra()===1, playlista Brązu faktycznie
 *     .pause()/zatrzymana (audio probe), NOWY realny play() na pliku z utwory/kamien/.
 *  D. Realny `setEra(2)` z powrotem (Kamień->Brąz): getEra()===2, playlista Kamienia
 *     zatrzymana, NOWY play() na pliku z utwory/braz/.
 *  E. Mutation-testing (zakaz tautologii, kryterium końca 3): tymczasowa mutacja źródła
 *     `setEra()` w `audio/muzyka-antyczna.ts` (branża plik->plik przestaje wołać
 *     `prevPlaylist.stop()`) — zbudowana OSOBNO, test na zmutowanym bundlu CZERWIENIEJE na
 *     asercji "poprzednia playlista zatrzymana", mutacja cofnięta, dowód obu przebiegów wklejony
 *     w raporcie.
 *  F. Zero console.error / pageerror w trakcie scenariusza.
 *
 * Bramka (z katalogu gra/): node tools/muzyka-era-live-e2e-test.cjs — exit 0 = zielona.
 * Tryb mutacyjny (używany WYŁĄCZNIE ręcznie przy dowodzie, nie w normalnym uruchomieniu bramki):
 *   MUZYKA_ERA_MUTATE=1 node tools/muzyka-era-live-e2e-test.cjs
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const OUT_DIR = path.join(GRA_DIR, 'dist-muzyka-era-live-e2e-test');
const OUT_HTML = 'file://' + path.join(OUT_DIR, 'index.html') + '?playtest=mapa';
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MUTATE = process.env.MUZYKA_ERA_MUTATE === '1';

let pass = 0;
let fail = 0;
function assert(label, cond, detail) {
  if (cond) {
    pass++;
    console.log(`  OK  ${label}`);
  } else {
    fail++;
    console.error(` FAIL ${label}` + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : ''));
  }
}

const SRC_MUZYKA = path.join(GRA_DIR, 'src', 'audio', 'muzyka-antyczna.ts');

/** Mutacja E (kryterium końca 3): w gałęzi "playlista plikowa -> INNA playlista plikowa"
 *  usuwa DOKŁADNIE jedno wywołanie `prevPlaylist.stop();` (ta sama linia co w scenariuszu C/C'
 *  jednostkowym) — poprzednia playlista przestaje się zatrzymywać przy zmianie epoki. */
function applyMutation() {
  const src = fs.readFileSync(SRC_MUZYKA, 'utf8');
  const anchor = '    // playlista plikowa -> INNA playlista plikowa (kamień<->brąz) —\n'
    + '    // przełączenie natychmiastowe, bez crossfade próbek (jak w pozostałych\n'
    + '    // przejściach cross-mode powyżej — inny tor odtwarzania niż respawn()).\n'
    + '    prevPlaylist.stop();\n';
  if (!src.includes(anchor)) throw new Error('applyMutation: kotwica nie znaleziona (źródło się zmieniło?)');
  const mutated = src.replace(anchor, anchor.replace('    prevPlaylist.stop();\n', '    // MUTACJA-TEST: prevPlaylist.stop(); usunięte celowo\n'));
  fs.writeFileSync(SRC_MUZYKA, mutated, 'utf8');
  return src; // oryginał do przywrócenia
}

function buildBundle() {
  console.log('[muzyka-era-live-e2e-test] budowanie bundla (vite build, wyłącznie dozwolona komenda z CLAUDE.md)...');
  execSync(
    `node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(path.relative(GRA_DIR, OUT_DIR))} --emptyOutDir`,
    { cwd: GRA_DIR, stdio: 'pipe' },
  );
  if (!fs.existsSync(path.join(OUT_DIR, 'index.html'))) {
    throw new Error('Build nie wyprodukował index.html w ' + OUT_DIR);
  }
  console.log('[muzyka-era-live-e2e-test] build OK.');
}

async function launchBrowser(chromium) {
  try {
    return await chromium.launch({ headless: true });
  } catch (e) {
    console.log('[muzyka-era-live-e2e-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({
      headless: true,
      executablePath: FALLBACK_CHROME,
      args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
    });
  }
}

async function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

/** Instrumentacja `window.Audio` WSTRZYKNIĘTA Z PLAYWRIGHT przed załadowaniem strony —
 *  obserwuje realne HTMLAudioElement tworzone przez filePlayer.ts. Zero zmian w kodzie gry:
 *  to czysty monkey-patch globalnego konstruktora z poziomu testu (page.addInitScript).
 *
 * DLACZEGO PO INSTANCJACH, NIE PO ŚCIEŻCE PLIKU: build (`vite-plugin-singlefile`) inline'uje
 * WSZYSTKIE mp3 jako `data:audio/mpeg;base64,...` — po zbudowaniu `.src` NIE zawiera już
 * "utwory/kamien"/"utwory/braz" (zweryfikowane realnie na tym bundlu), więc rozróżnienie po
 * treści ścieżki jest niewykonalne na zbudowanej grze. Zamiast tego wykorzystujemy fakt z
 * filePlayer.ts (`ensureEl`/`releaseEl`): każda playlista trzyma WŁASNĄ parę elementów
 * `<audio>` (A/B), tworzoną leniwie przy pierwszym użyciu i ZWALNIANĄ (`el.pause()` +
 * `removeAttribute('src')` + `el.load()`, referencja wyzerowana) przy `stop()` po
 * ~STOP_FADE_SEC. Więc: (1) `kamienPlaylist` i `brazPlaylist` NIGDY nie dzielą tej samej
 * instancji `Audio`, (2) po `stop()`+ponownym `start()` tej samej playlisty (nasz scenariusz
 * D wraca do brązu) instancje są tworzone NA NOWO (świeże `id` z licznika). Nadajemy każdej
 * skonstruowanej instancji rosnące `id` i logujemy `construct`/`play`/`pause` z tym `id` —
 * test na tej podstawie odróżnia „ta sama zatrzymana playlista" od „nowa, inna playlista
 * faktycznie zaczęła grać", bez znajomości treści pliku. */
const AUDIO_PROBE_INIT_SCRIPT = `
(() => {
  const events = [];
  window.__audioProbe = { events };
  const RealAudio = window.Audio;
  let nextId = 0;
  class ProbedAudio extends RealAudio {
    constructor(...args) {
      super(...args);
      const id = nextId++;
      events.push({ type: 'construct', id, t: performance.now() });
      const origPlay = this.play.bind(this);
      this.play = function (...a) {
        events.push({ type: 'play', id, t: performance.now() });
        return origPlay(...a);
      };
      const origPause = this.pause.bind(this);
      this.pause = function (...a) {
        events.push({ type: 'pause', id, t: performance.now() });
        return origPause(...a);
      };
    }
  }
  window.Audio = ProbedAudio;
})();
`;

async function gotoPlaytestMapa(page) {
  await page.addInitScript(AUDIO_PROBE_INIT_SCRIPT);
  await page.goto(OUT_HTML, { waitUntil: 'load', timeout: 120000 });
  await page.waitForSelector('.civ-hud, .civ-ux-frame, .civ-cs', { timeout: 120000 });
  for (let i = 0; i < 90; i++) {
    const overlayCount = await page.locator('text=Tworzenie świata').count();
    if (overlayCount === 0) break;
    await wait(1000);
  }
  // Ten sam wzorzec twardego czekania co era-change-toast-live-test.cjs (bootstrap
  // dobiega końca asynchronicznie już po zniknięciu overlayu w tym środowisku).
  await page.waitForFunction(
    () => !!window.__eraTestDebug && window.__eraTestDebug.getWorldState().citiesLen > 0
      && window.__eraTestDebug.getWorldState().turn === 1,
    undefined,
    { timeout: 120000 },
  );
  await wait(300);
}

function idsWithEvent(events, type, afterT, minId) {
  const set = new Set();
  for (const e of events) {
    if (e.type !== type) continue;
    if (afterT !== undefined && e.t <= afterT) continue;
    if (minId !== undefined && e.id < minId) continue;
    set.add(e.id);
  }
  return set;
}
function maxConstructedId(events) {
  let m = -1;
  for (const e of events) if (e.type === 'construct' && e.id > m) m = e.id;
  return m;
}
function lastEventT(events) {
  let m = 0;
  for (const e of events) if (e.t > m) m = e.t;
  return m;
}

async function runScenario(chromium, { mutated }) {
  const browser = await launchBrowser(chromium);
  const consoleErrors = [];
  const local = { pass: 0, fail: 0 };
  function localAssert(label, cond, detail) {
    if (mutated) {
      // W trybie zmutowanym raportujemy do stdout z prefiksem [MUTOWANY], ale NIE liczymy
      // do głównego pass/fail bramki -- to osobny przebieg dowodowy (kryterium końca 3),
      // uruchamiany ręcznie z MUZYKA_ERA_MUTATE=1, nie częścią normalnej zielonej bramki.
      console.log(`  [MUTOWANY] ${cond ? 'OK  ' : 'FAIL'} ${label}` + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : ''));
      if (cond) local.pass++; else local.fail++;
    } else {
      assert(label, cond, detail);
    }
  }

  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    page.on('pageerror', (err) => consoleErrors.push('[pageerror] ' + err.message));

    console.log('\n-- A. Bootstrap ?playtest=mapa dobiega końca --');
    await gotoPlaytestMapa(page);
    const world0 = await page.evaluate(() => window.__eraTestDebug.getWorldState());
    localAssert('bootstrap zakończony: citiesLen>0', world0.citiesLen > 0, world0);

    console.log('\n-- B. Stan startowy: sandbox startuje w Brązie, playlista Brązu faktycznie gra --');
    const start = await page.evaluate(() => ({
      era: window.__musicEraTestDebug.getEra(),
      playing: window.__musicEraTestDebug.isMusicPlaying(),
    }));
    localAssert('B. getEra()===2 (playtest=mapa hardkoduje player.era=2 -> setEra(2) w startGameMusic)', start.era === 2, start);
    localAssert('B. isMusicPlaying()===true', start.playing === true, start);
    const probe0 = await page.evaluate(() => window.__audioProbe);
    const brazIds = idsWithEvent(probe0.events, 'play');
    localAssert('B. co najmniej 1 realny play() (playlista brązu wystartowała)', brazIds.size >= 1, probe0.events);
    const tCheckpointB = lastEventT(probe0.events);
    const maxIdCheckpointB = maxConstructedId(probe0.events);

    console.log('\n-- C. Realny setEra(1): Brąz -> Kamień --');
    await page.evaluate(() => window.__musicEraTestDebug.setEra(1));
    await wait(900);
    const afterToKamien = await page.evaluate(() => ({
      era: window.__musicEraTestDebug.getEra(),
      playing: window.__musicEraTestDebug.isMusicPlaying(),
    }));
    localAssert('C. getEra()===1 po realnym setEra(1)', afterToKamien.era === 1, afterToKamien);
    localAssert('C. isMusicPlaying() nadal true (playlista dalej gra, tylko inna)', afterToKamien.playing === true, afterToKamien);
    const probe1 = await page.evaluate(() => window.__audioProbe);
    const pausedBrazIds = idsWithEvent(probe1.events, 'pause', tCheckpointB);
    let anyBrazPaused = false;
    for (const id of pausedBrazIds) if (brazIds.has(id)) anyBrazPaused = true;
    localAssert('C. poprzednia playlista (brąz, instancje ' + JSON.stringify([...brazIds]) + ') faktycznie zatrzymana (pause() zaobserwowane po setEra(1))', anyBrazPaused, probe1.events);
    const kamienIds = idsWithEvent(probe1.events, 'play', tCheckpointB, maxIdCheckpointB + 1);
    localAssert('C. NOWA (dotąd nieistniejąca) instancja <audio> faktycznie zagrała po setEra(1) — inna playlista, nie ta sama', kamienIds.size >= 1, { probe: probe1.events, maxIdCheckpointB });
    const tCheckpointC = lastEventT(probe1.events);
    const maxIdCheckpointC = maxConstructedId(probe1.events);

    console.log('\n-- D. Realny setEra(2) z powrotem: Kamień -> Brąz --');
    await page.evaluate(() => window.__musicEraTestDebug.setEra(2));
    await wait(900);
    const afterToBraz = await page.evaluate(() => ({
      era: window.__musicEraTestDebug.getEra(),
      playing: window.__musicEraTestDebug.isMusicPlaying(),
    }));
    localAssert('D. getEra()===2 po realnym setEra(2)', afterToBraz.era === 2, afterToBraz);
    localAssert('D. isMusicPlaying() nadal true', afterToBraz.playing === true, afterToBraz);
    const probe2 = await page.evaluate(() => window.__audioProbe);
    const pausedKamienIds = idsWithEvent(probe2.events, 'pause', tCheckpointC);
    let anyKamienPaused = false;
    for (const id of pausedKamienIds) if (kamienIds.has(id)) anyKamienPaused = true;
    localAssert('D. playlista kamienia (instancje ' + JSON.stringify([...kamienIds]) + ') faktycznie zatrzymana po powrocie do brązu', anyKamienPaused, probe2.events);
    const brazIds2 = idsWithEvent(probe2.events, 'play', tCheckpointC, maxIdCheckpointC + 1);
    localAssert('D. NOWA instancja <audio> faktycznie zagrała po setEra(2) (brąz wraca ze świeżymi elementami po releaseEl w stop())', brazIds2.size >= 1, { probe: probe2.events, maxIdCheckpointC });

    console.log('\n-- F. Konsola czysta --');
    localAssert('zero console.error / pageerror w całym scenariuszu', consoleErrors.length === 0, consoleErrors);
    if (consoleErrors.length) console.error('   konsola:', consoleErrors.join(' | '));

    await page.close();
  } finally {
    await browser.close();
  }

  try { fs.rmSync(OUT_DIR, { recursive: true, force: true }); } catch (e) { /* nieistotne */ }
  return local;
}

async function main() {
  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch (e) {
    console.error('[muzyka-era-live-e2e-test] playwright nie znaleziony. Uruchom z gra/ (npm i już zrobione).');
    process.exit(1);
  }

  if (MUTATE) {
    console.log('[muzyka-era-live-e2e-test] TRYB MUTACYJNY -- mutuję źródło, oczekuję CZERWONEGO wyniku na asercjach C/pause(braz).');
    const original = applyMutation();
    let result;
    try {
      buildBundle();
      result = await runScenario(chromium, { mutated: true });
    } finally {
      fs.writeFileSync(SRC_MUZYKA, original, 'utf8');
      console.log('[muzyka-era-live-e2e-test] źródło przywrócone do oryginału.');
    }
    console.log(`\n[MUTOWANY PRZEBIEG] ${result.pass} pass, ${result.fail} fail`);
    // Oczekiwany wynik mutacji: co najmniej 1 fail (pause(braz) po setEra(1) nie zaobserwowane).
    process.exit(result.fail > 0 ? 0 : 1);
  }

  buildBundle();
  const result = await runScenario(chromium, { mutated: false });
  void result;

  console.log(`\n${pass} pass · ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('[muzyka-era-live-e2e-test] błąd:', e);
  try { fs.rmSync(OUT_DIR, { recursive: true, force: true }); } catch (_) { /* nieistotne */ }
  try {
    // Bezpieczeństwo: jeśli błąd wystąpił w trybie mutacyjnym po applyMutation() ale przed
    // przywróceniem (np. build rzucił), spróbuj przywrócić z git, żeby nie zostawić repo brudnego.
    if (MUTATE) execSync('git checkout -- src/audio/muzyka-antyczna.ts', { cwd: GRA_DIR, stdio: 'pipe' });
  } catch (_) { /* nieistotne */ }
  process.exit(1);
});
