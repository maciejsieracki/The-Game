// ============================================================================
// filePlayer.ts — odtwarzacz plików mp3: JEDEN silnik (createPlaylist),
// DWIE niezależne playlisty (własny stan, własna PARA <audio> A/B, różna
// reguła powtórzeń):
//
//   - eraMusicPlaylist — muzyka tła rozgrywki, KUMULATYWNA po epokach (kamień;
//     od brązu kamień+brąz; od żelaza kamień+brąz+żelazo — patrz eraTierUrls()
//     / setEraMusicTier(); awans epoki dołącza utwory, nie przerywa grającego):
//     shuffle + KAŻDY UTWÓR 3x POD RZĄD, potem następny.
//     Sterowana przez router epok w muzyka-antyczna.ts (usesFilePlayer()).
//   - introPlaylist — muzyka ekranów PRZED rozgrywką: menu główne, wybór
//     cywilizacji, ustawienia (utwory z ./utwory/intro/): shuffle + KAŻDY
//     UTWÓR DOKŁADNIE 1x, potem następny (różnorodność > długość — ekran
//     startowy ogląda się kilkanaście sekund). Sterowana wprost z main.ts
//     (resumeIntroMusic() / stopIntroMusic() w muzyka-antyczna.ts), bo nie
//     zależy od epoki/nastroju gry — gra "poza" systemem era x mood.
//     Milknie dokładnie w chwili startu rozgrywki (patrz startGameMusic()
//     w main.ts).
//
//   UWAGA: TRZECI kanał audio (odgłosy natury — ptaki/wiatr/woda) NIE żyje
//   tutaj mimo katalogu ./utwory/natura/ (celowo pusty, zostawiony na
//   przyszłość) — właściciel zmienił decyzję 2026-07-20: zamiast plików,
//   ten kanał napędza WYŁĄCZNIE syntezę Web Audio (composeKamien(...,
//   onlyNature=true) w muzyka-antyczna.ts, patrz sekcja "AMBIENCE" w tamtym
//   pliku: startAmbience()/stopAmbience()/setAmbienceVolume()). Ten moduł
//   (filePlayer.ts) nie ma z nim nic wspólnego.
//
//   Decyzje właściciela: KANAL-PRACA.md 2026-07-20 (kamień) + rozszerzenie
//   tego samego dnia (intro) + crossfade tego samego dnia (zgłoszenie: między
//   utworami słychać ~1 s ciszy — 'ended' reaguje za późno). Oba tory dzielą
//   tę samą krzywą głośności i te same preferencje (musicPrefs) — patrz
//   setMusicVolume()/stopMusic() w muzyka-antyczna.ts, które celują w OBIE
//   playlisty.
//
// MECHANIZM: HTMLAudioElement (<audio>), NIE AudioContext + decodeAudioData.
// Uzasadnienie pamięci:
//   - 22 pliki x ~26-31 s @192 kbps zdekodowane do Float32 PCM zajęłyby
//     rzędu 200+ MB RAM jednocześnie (44100 Hz x 2 kanały x 4 B x ~30 s x 22).
//     <audio> odtwarza spod data: URI strumieniowo — bez trzymania
//     zdekodowanego PCM w pamięci JS.
//
// CROSSFADE (CROSSFADE_SEC = 1.5 s, JEDNA stała u góry pliku — dostrajalna
// jedną liczbą po odsłuchu): każda playlista trzyma DWA na przemian używane
// elementy <audio> (A/B, indeks 0/1) — jeden element nie odtworzy dwóch
// nagrań naraz. Zamiast czekać na zdarzenie 'ended' (przychodzi dokładnie w
// chwili ciszy — stąd zgłoszona ~sekundowa dziura), playlista monitoruje co
// 100 ms `currentTime` względem `duration` aktywnego elementu; gdy zostanie
// ≤CROSSFADE_SEC do końca, startuje NASTĘPNY utwór na DRUGIM elemencie i
// przez CROSSFADE_SEC płynnie przenika: głośność wychodzącego 1->0, wchodzącego
// 0->1, krzywą equal-power (cos/sin tego samego kąta, cos²+sin²=1 — suma
// głośności stała). Bez tego liniowe ściszanie dwóch nieskorelowanych
// sygnałów naraz dałoby słyszalny dołek w połowie — ten sam zabieg co
// "fade sqrt (equal-power dla nieskorelowanego szumu)" w renderWiatr()
// (muzyka-antyczna.ts), inna tylko realizacja (cos/sin zamiast sqrt, bo tu
// przenikają się DWA sygnały, nie jeden zanikający na krawędzi segmentu).
// Dotyczy KAŻDEJ zmiany utworu — także między powtórzeniami TEGO SAMEGO
// utworu (kamień gra każdy 3x pod rząd = 2 dodatkowe przenikania w playliście
// kamienia). `duration` bywa NaN, zanim wczytają się metadane — monitor to
// sprawdza (Number.isFinite) i czeka do kolejnego ticku; osobny nasłuch
// 'loadedmetadata' na każdym elemencie od razu odpytuje ponownie, żeby nie
// czekać niepotrzebnie do następnego ticku co 100 ms. Zdarzenie 'ended'
// ZOSTAJE jako AWARYJNE zabezpieczenie (natychmiastowy skok bez przenikania
// na tym samym elemencie) — na wypadek, gdyby monitorowanie zawiodło (np.
// throttling karty w tle, zbyt długo NaN).
// STOP: fade-out ~0.4 s (STOP_FADE_SEC, liniowy w amplitudzie — przy stopie
// gaśnie tylko JEDEN aktywny sygnał, equal-power nie jest tu potrzebne, ten
// sam zabieg co linearRampToValueAtTime w EngineAudio.fadeOutAndDispose()
// w muzyka-antyczna.ts) zamiast twardego cięcia w pół dźwięku, potem
// zwolnienie zasobów obu elementów A/B.
// GŁOŚNOŚĆ: suwak użytkownika (setVolume) to POZIOM DOCELOWY — crossfade i
// stop-fade mnożą przez niego proporcjonalnie w KAŻDYM ticku (nie raz, na
// starcie), więc zmiana suwaka w trakcie przenikania nie powoduje przeskoku:
// kolejny tick po prostu przelicza od nowej wartości.
//   - Autoplay: obie playlisty startują WYŁĄCZNIE w odpowiedzi na gest
//     użytkownika (kamień: startGameMusic() w main.ts po kliknięciu "Nowa
//     gra"/"Wczytaj"; intro: resumeIntroMusic() w main.ts, wołane z wnętrza
//     handlerów kliknięć menu, z fallbackiem na pierwszy gest w dokumencie
//     dla samego pierwszego pokazania menu na starcie strony). Kolejne
//     odtworzenia (z crossfade albo z awaryjnego 'ended', już bez
//     bezpośredniego gestu) przeglądarki traktują jako kontynuację już
//     odblokowanej sesji audio strony — dokładnie ten sam mechanizm, dzięki
//     któremu silnik syntezy planuje kolejne AudioBufferSourceNode bez
//     ponownego gestu.
//
// API modułu (używane WYŁĄCZNIE przez muzyka-antyczna.ts):
//   eraMusicPlaylist, introPlaylist — obiekty FilePlaylist:
//     hasTracks() / start() / startWithFadeIn(fadeMs) / stop() / setVolume(v: 0..1) / isPlaying()
// ============================================================================

import civMusicManifest from '../../data/civ-music.json';
import { resolveCivDiplomacyTracks } from './civMusic';
import type { CivMusicManifest } from './civMusic';

/** Długość przenikania między utworami (i między powtórzeniami tego samego
 *  utworu) — JEDNA stała, dostrajalna po odsłuchu. Właściciel: "po sekundzie"
 *  było za krótko/za ostro dla ambientu; 1,5 s brzmi płynniej. */
const CROSSFADE_SEC = 1.5;

/** Fade-out przy stop() (wyłącznik / przejście menu->gra / zmiana epoki) —
 *  krótszy niż crossfade, bo to zanikanie JEDNEGO sygnału, nie przenikanie
 *  dwóch. */
const STOP_FADE_SEC = 0.4;

/** Krok pętli monitorującej postęp aktywnego utworu (poza crossfade) oraz
 *  krok ramp (podczas crossfade / stop-fade) — 40 ms daje płynne ~25 aktualizacji/s. */
const MONITOR_STEP_MS = 100;
const RAMP_STEP_MS = 40;

export interface FilePlaylist {
  hasTracks(): boolean;
  start(): void;
  /**
   * Jak start(), ale pierwszy utwór startuje OD RAZU przy głośności 0 i
   * liniowo podgłaśnia się do poziomu docelowego (setVolume) przez `fadeMs`.
   * Zastosowanie: pierwsze uruchomienie playlisty intro na starcie strony
   * (patrz resumeIntroMusic() w main.ts, parametr menu.muzyka_fade_in_ms w
   * ui-params.json). No-op, jeśli już gra albo brak plików (jak start()).
   */
  startWithFadeIn(fadeMs: number): void;
  stop(onStopped?: () => void): void;
  setVolume(v: number): void;
  isPlaying(): boolean;
  /** Cofa playlistę na początek (kolejka od nowa, w tym utwory otwierające
   *  `leadCount`). No-op, gdy playlista gra. Użycie: muzyka cywilizacji w
   *  dyplomacji — każde otwarcie rozmowy zaczyna od przywitania. */
  rewind(): void;
  /** Podmienia pulę utworów NA ŻYWO (playlista kumulatywna epok). Utwory,
   *  które już były w puli, zachowują miejsce w bieżącej turze; NOWE
   *  wsiadają w losowe miejsca jeszcze niezagranej reszty tury (shuffle
   *  zachowany). Grający utwór NIE jest przerywany — dogrywa się (z resztą
   *  powtórzeń) nawet wtedy, gdy nowa pula już go nie zawiera. */
  setTracks(urls: readonly string[]): void;
  /** Aktualna pula (kopia) — diagnostyka/testy. */
  getTracks(): readonly string[];
}

/** Ta sama krzywa percepcyjna głośności co suwak w silniku syntezy (patrz
 *  volCurve w muzyka-antyczna.ts) — osobna kopia celowa: ten moduł ma zero
 *  zależności od Web Audio / silnika syntezy (i odwrotnie). */
function volCurve(v: number): number {
  return Math.pow(Math.max(0, Math.min(1, v)), 1.6);
}

/** Fisher-Yates. */
function shuffle(arr: readonly number[]): number[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i] as number;
    a[i] = a[j] as number;
    a[j] = tmp;
  }
  return a;
}

/** Nowe tasowanie kolejności utworów (indeksy 0..trackCount-1). Jeśli podano
 *  indeks ostatniego utworu z POPRZEDNIEJ tury (avoidFirst), gwarantuje, że
 *  nie wypadnie on jako pierwszy w nowej — inaczej gracz usłyszałby ten sam
 *  kawałek 2x (intro) albo 6x (kamień: 3x koniec + 3x nowy początek) pod
 *  rząd na styku dwóch tasowań. Reguła właściciela, patrz nagłówek pliku. */
function buildShuffledQueue(trackCount: number, avoidFirst: number | null): number[] {
  const idx = Array.from({ length: trackCount }, (_, i) => i);
  const q = shuffle(idx);
  if (avoidFirst !== null && q.length > 1 && q[0] === avoidFirst) {
    const j = 1 + Math.floor(Math.random() * (q.length - 1));
    const tmp = q[0] as number;
    q[0] = q[j] as number;
    q[j] = tmp;
  }
  return q;
}

/** Tworzy niezależną playlistę plikową (własny stan, własna para <audio> A/B
 *  do crossfade). repeatsPerTrack: ile razy z rzędu gra każdy utwór, zanim
 *  playlista przejdzie do następnego (kamień: 3, intro: 1) — KAŻDE z tych
 *  przejść, także między powtórzeniami, przenika (patrz nagłówek pliku).
 *  kolejnosc: 'losowa' (domyślnie) tasuje przy każdej turze; 'stala' gra
 *  zawsze w kolejności podanej w trackUrls — decyzja właściciela C-MUZ-Q6=A
 *  dla intro (dramaturgia menu: spokojne otwarcie, mocne zamknięcie).
 *  leadCount: pierwsze N utworów (indeksy 0..N-1) gra JEDNORAZOWO na początku
 *  (np. przywitanie cywilizacji); kolejne tury pętlą już tylko po pozostałych
 *  (pętla negocjacji; 'losowa' tasuje wtedy tylko ogon). Gdy ogon pusty —
 *  pętla po całości (lead jest ignorowany). */
function createPlaylist(
  initialUrls: readonly string[],
  repeatsPerTrack: number,
  kolejnosc: 'losowa' | 'stala' = 'losowa',
  leadCount = 0,
): FilePlaylist {
  // Pula utworów jest zmienna TYLKO dla playlisty kumulatywnej (setTracks);
  // pozostałe playlisty nigdy jej nie ruszają.
  let trackUrls: readonly string[] = initialUrls;
  const els: [HTMLAudioElement | null, HTMLAudioElement | null] = [null, null];
  let activeIdx: 0 | 1 = 0;
  let queue: number[] = [];
  let queuePos = 0;
  let repeatsLeft = repeatsPerTrack;
  let playing = false;
  let volume01 = 0.8;

  let monitorTimer: number | null = null;
  let stopFadeTimer: number | null = null;

  let crossfading = false;
  let crossfadeTimer: number | null = null;
  let crossfadeT0 = 0;
  let crossfadeDur = CROSSFADE_SEC;
  let crossfadeFromIdx: 0 | 1 = 0;
  let crossfadeToIdx: 0 | 1 = 1;

  // Stan startWithFadeIn() — patrz definicja niżej.
  let startFadeTimer: number | null = null;
  let startFadeT0 = 0;
  let startFadeDurSec = 0;
  let startFadeActive = false;

  function hasTracks(): boolean { return trackUrls.length > 0; }

  /** Efektywna liczba utworów otwierających (grane raz). */
  const lead = leadCount > 0 && leadCount < trackUrls.length ? leadCount : 0;

  /** Nowa kolejka. first=true: pierwsza tura (lead + ogon); inaczej wyłącznie
   *  ogon (pętla). lastPlayed: indeks ostatniego utworu poprzedniej tury. */
  function newQueue(first: boolean, lastPlayed: number | null): number[] {
    const from = first ? 0 : lead;
    const idx = Array.from({ length: trackUrls.length - from }, (_, i) => from + i);
    if (kolejnosc === 'stala') return idx;
    if (lead === 0) return buildShuffledQueue(trackUrls.length, lastPlayed);
    const headLen = first ? lead : 0;
    const tail = buildShuffledQueue(trackUrls.length - lead, lastPlayed !== null && lastPlayed >= lead ? lastPlayed - lead : null)
      .map((i) => i + lead);
    return [...idx.slice(0, headLen), ...tail];
  }

  function currentUrl(): string | null {
    const i = queue[queuePos];
    return i === undefined ? null : (trackUrls[i] ?? null);
  }

  /** Wybiera NASTĘPNY utwór: kolejne powtórzenie tego samego (repeatsLeft>0)
   *  albo przejście dalej w kolejce + ew. nowe tasowanie po jej wyczerpaniu.
   *  Czysta mutacja stanu (queuePos/repeatsLeft/queue) — BEZ odtwarzania;
   *  współdzielona przez wczesny crossfade (monitor) i awaryjny fallback
   *  'ended'. Dokładny odpowiednik dawnego advance()/onEnded() z PRZED
   *  wprowadzenia crossfade. */
  function selectNext(): void {
    repeatsLeft--;
    if (repeatsLeft > 0) return; // ten sam utwór, kolejne powtórzenie
    queuePos++;
    repeatsLeft = repeatsPerTrack;
    if (queuePos >= queue.length) {
      const lastOfOldQueue = queue[queue.length - 1] ?? null;
      queue = newQueue(false, lastOfOldQueue);
      queuePos = 0;
    }
  }

  function clearMonitor(): void {
    if (monitorTimer !== null) { window.clearInterval(monitorTimer); monitorTimer = null; }
  }

  function clearCrossfadeTimer(): void {
    if (crossfadeTimer !== null) { window.clearInterval(crossfadeTimer); crossfadeTimer = null; }
  }

  function clearStopFade(): void {
    if (stopFadeTimer !== null) { window.clearInterval(stopFadeTimer); stopFadeTimer = null; }
  }

  /** Anuluje rampę startWithFadeIn() — wołane na początku stop(). */
  function clearStartFade(): void {
    if (startFadeTimer !== null) { window.clearInterval(startFadeTimer); startFadeTimer = null; }
    startFadeActive = false;
  }

  /** Liniowa rampa 0→poziom docelowy (volCurve(volume01)) podczas startWithFadeIn(). */
  function startFadeStep(): void {
    if (!playing || !startFadeActive) return;
    const u = Math.min(1, (performance.now() - startFadeT0) / 1000 / startFadeDurSec);
    const base = volCurve(volume01);
    const el = els[activeIdx];
    if (el) el.volume = base * u;
    if (u >= 1) clearStartFade();
  }

  // Referencje do handlerów per-slot (A/B) — trzymane, żeby releaseEl() mógł
  // je zdjąć przez removeEventListener (closure literal w addEventListener
  // nie da się tak usunąć — trzeba tej samej referencji funkcji).
  const endedHandlers: [(() => void) | null, (() => void) | null] = [null, null];
  const errorHandlers: [(() => void) | null, (() => void) | null] = [null, null];
  const metaHandlers: [(() => void) | null, (() => void) | null] = [null, null];

  function ensureEl(idx: 0 | 1): HTMLAudioElement {
    let el = els[idx];
    if (el) return el;
    el = new Audio();
    el.preload = 'auto';
    el.volume = 0;
    const onEndedH = (): void => onEnded(idx);
    const onErrorH = (): void => onError(idx);
    // Metadane (w tym `duration`, bywa NaN do tego momentu) — dla danych
    // spod data: URI ładują się niemal natychmiast, ale monitorTick i tak
    // zabezpiecza się osobno (Number.isFinite); ten nasłuch tylko przyspiesza
    // pierwsze sprawdzenie, żeby nie czekać do kolejnego ticku co 100 ms.
    const onMetaH = (): void => {
      if (idx === activeIdx && playing && !crossfading) monitorTick();
    };
    el.addEventListener('ended', onEndedH);
    el.addEventListener('error', onErrorH);
    el.addEventListener('loadedmetadata', onMetaH);
    endedHandlers[idx] = onEndedH;
    errorHandlers[idx] = onErrorH;
    metaHandlers[idx] = onMetaH;
    els[idx] = el;
    return el;
  }

  /** Odtwarza `url` na elemencie `idx` od zera, głośność = poziom docelowy
   *  (crossfade-start ją zaraz nadpisuje na 0 — patrz beginCrossfade). */
  function playOn(idx: 0 | 1, url: string): void {
    const el = ensureEl(idx);
    el.src = url;
    el.currentTime = 0;
    el.volume = volCurve(volume01);
    void el.play().catch(() => {
      // Przeglądarka wstrzymała odtwarzanie — reset playing, żeby start() mógł ponowić.
      playing = false;
    });
  }

  /** AWARYJNY fallback: monitorowanie zawiodło i utwór naprawdę się skończył
   *  (throttling karty w tle, `duration` zbyt długo NaN itp.) — natychmiastowy
   *  skok BEZ przenikania na tym samym elemencie, dokładnie jak przed
   *  wprowadzeniem crossfade. Guard na `crossfading`: gdy przenikanie już
   *  trwa, 'ended' na elemencie WYCHODZĄCYM jest oczekiwane i nieszkodliwe
   *  (rampStep go i tak wygasza/pauzuje) — bez tego guardu doszłoby do
   *  PODWÓJNEGO selectNext() dla tego samego przejścia. */
  function onEnded(idx: 0 | 1): void {
    if (!playing || crossfading || idx !== activeIdx) return;
    selectNext();
    const url = currentUrl();
    if (!url) return;
    playOn(idx, url);
  }

  function onError(idx: 0 | 1): void {
    // Uszkodzony/brakujący plik — nie blokuj playlisty, graj dalej (bez
    // przenikania — sytuacja awaryjna jak wyżej).
    if (!playing) return;
    const isIncomingCrossfade = crossfading && idx === crossfadeToIdx;
    if (idx !== activeIdx && !isIncomingCrossfade) return;
    if (isIncomingCrossfade) {
      clearCrossfadeTimer();
      crossfading = false;
      const fromEl = els[crossfadeFromIdx];
      if (fromEl) fromEl.pause();
    }
    selectNext();
    const url = currentUrl();
    if (!url) return;
    playOn(idx, url);
  }

  /** Równy krok equal-power (cos/sin tego samego kąta, cos²+sin²=1) —
   *  wywoływany co RAMP_STEP_MS podczas przenikania. */
  function crossfadeStep(): void {
    const u = Math.min(1, (performance.now() - crossfadeT0) / 1000 / crossfadeDur);
    const base = volCurve(volume01); // poziom docelowy, przeliczany co tick
    const ang = u * (Math.PI / 2);
    const fromEl = els[crossfadeFromIdx];
    const toEl = els[crossfadeToIdx];
    if (fromEl) fromEl.volume = base * Math.cos(ang);
    if (toEl) toEl.volume = base * Math.sin(ang);
    if (u >= 1) {
      clearCrossfadeTimer();
      if (fromEl) fromEl.pause();
      activeIdx = crossfadeToIdx;
      crossfading = false;
    }
  }

  /** Startuje przenikanie do NASTĘPNEGO utworu na drugim elemencie A/B.
   *  fadeDur: długość przenikania — zwykle CROSSFADE_SEC, przycięta dla
   *  utworów krótszych niż 2x CROSSFADE_SEC (nie powinno się zdarzyć przy
   *  realnych ~26-31 s nagraniach, ale zabezpieczenie tanie). */
  function beginCrossfade(fadeDur: number): void {
    if (!playing || crossfading) return;
    selectNext();
    const url = currentUrl();
    if (!url) return; // nie powinno się zdarzyć przy hasTracks()===true
    const fromIdx = activeIdx;
    const toIdx: 0 | 1 = fromIdx === 0 ? 1 : 0;
    playOn(toIdx, url);
    const toEl = els[toIdx];
    if (toEl) toEl.volume = 0; // start od ciszy — rampStep podniesie do celu
    crossfading = true;
    crossfadeFromIdx = fromIdx;
    crossfadeToIdx = toIdx;
    crossfadeDur = Math.max(0.05, fadeDur);
    crossfadeT0 = performance.now();
    clearCrossfadeTimer();
    crossfadeTimer = window.setInterval(crossfadeStep, RAMP_STEP_MS);
  }

  /** Sprawdza, czy do końca aktywnego utworu zostało ≤CROSSFADE_SEC — jeśli
   *  tak, startuje przenikanie. `duration` bywa NaN, zanim wczytają się
   *  metadane (Number.isFinite chroni przed liczeniem na NaN — patrz
   *  nagłówek pliku); w takim wypadku po prostu czekamy na kolejny tick
   *  (albo na 'loadedmetadata', który odpytuje wcześniej). */
  function monitorTick(): void {
    if (!playing || crossfading) return;
    const el = els[activeIdx];
    if (!el) return;
    const dur = el.duration;
    if (!Number.isFinite(dur) || dur <= 0) return;
    const fadeDur = Math.min(CROSSFADE_SEC, dur * 0.4);
    const remain = dur - el.currentTime;
    if (remain <= fadeDur) beginCrossfade(fadeDur);
  }

  /** Startuje playlistę (no-op, jeśli już gra albo brak plików — hasTracks()).
   *  Pierwszy utwór gra natychmiast (bez przenikania — nie ma z czego). */
  function start(): void {
    if (!hasTracks() || playing) return;
    clearStopFade(); // gdyby start() trafił w trakcie fade-out po stop()
    playing = true;
    if (queue.length === 0) {
      queue = newQueue(true, null);
      queuePos = 0;
      repeatsLeft = repeatsPerTrack;
    }
    activeIdx = 0;
    const url = currentUrl();
    if (url) playOn(0, url);
    clearMonitor();
    monitorTimer = window.setInterval(monitorTick, MONITOR_STEP_MS);
  }

  /** Jak start(), ale pierwszy utwór gra od razu przy głośności 0 i liniowo
   *  podgłaśnia się do poziomu docelowego przez `fadeMs` (patrz interfejs). */
  function startWithFadeIn(fadeMs: number): void {
    if (!hasTracks() || playing) return;
    clearStopFade();
    clearStartFade();
    playing = true;
    if (queue.length === 0) {
      queue = newQueue(true, null);
      queuePos = 0;
      repeatsLeft = repeatsPerTrack;
    }
    activeIdx = 0;
    const url = currentUrl();
    if (url) {
      const el = ensureEl(0);
      el.src = url;
      el.currentTime = 0;
      el.volume = 0;
      void el.play().catch(() => {
        playing = false;
        clearStartFade();
      });
    }
    clearMonitor();
    monitorTimer = window.setInterval(monitorTick, MONITOR_STEP_MS);
    const durSec = Math.max(0, fadeMs) / 1000;
    if (url && durSec > 0) {
      startFadeActive = true;
      startFadeT0 = performance.now();
      startFadeDurSec = durSec;
      startFadeTimer = window.setInterval(startFadeStep, RAMP_STEP_MS);
    } else if (url) {
      const el = els[0];
      if (el) el.volume = volCurve(volume01);
    }
  }

  /** Zatrzymuje playlistę: fade-out ~STOP_FADE_SEC (liniowy — gaśnie tylko
   *  jeden aktywny sygnał, równoległy podczas crossfade — oba), potem
   *  zwalnia zasoby OBU elementów A/B. Pozycja w playliście ZOSTAJE —
   *  kolejny start() wraca do tego samego utworu z zapamiętaną liczbą
   *  pozostałych powtórzeń. */
  function stop(onStopped?: () => void): void {
    playing = false;
    clearMonitor();
    clearCrossfadeTimer();
    crossfading = false;
    clearStopFade();
    clearStartFade();
    const a = els[0];
    const b = els[1];
    if (!a && !b) { onStopped?.(); return; } // nigdy nie odtwarzano / już zwolnione
    const startVolA = a ? a.volume : 0;
    const startVolB = b ? b.volume : 0;
    const t0 = performance.now();
    stopFadeTimer = window.setInterval(() => {
      const u = Math.min(1, (performance.now() - t0) / 1000 / STOP_FADE_SEC);
      const k = 1 - u;
      if (a) a.volume = startVolA * k;
      if (b) b.volume = startVolB * k;
      if (u >= 1) {
        clearStopFade();
        releaseEl(0);
        releaseEl(1);
        onStopped?.();
      }
    }, RAMP_STEP_MS);
  }

  function releaseEl(idx: 0 | 1): void {
    const el = els[idx];
    if (!el) return;
    el.pause();
    const eh = endedHandlers[idx], erh = errorHandlers[idx], mh = metaHandlers[idx];
    if (eh) el.removeEventListener('ended', eh);
    if (erh) el.removeEventListener('error', erh);
    if (mh) el.removeEventListener('loadedmetadata', mh);
    el.removeAttribute('src');
    el.load();
    els[idx] = null;
    endedHandlers[idx] = null;
    errorHandlers[idx] = null;
    metaHandlers[idx] = null;
  }

  /** Głośność 0..1 (surowa, krzywa percepcyjna nakładana wewnątrz modułu) —
   *  poziom DOCELOWY: crossfade/stop-fade go odczytują na bieżąco w każdym
   *  ticku, więc zmiana suwaka w trakcie przenikania nie powoduje przeskoku
   *  (patrz crossfadeStep/nagłówek pliku). Poza przenikaniem stosuje się
   *  natychmiast do aktywnego elementu. */
  function setVolume(v: number): void {
    volume01 = Math.max(0, Math.min(1, v));
    if (startFadeActive) {
      startFadeStep();
      return;
    }
    if (!crossfading) {
      const el = els[activeIdx];
      if (el) el.volume = volCurve(volume01);
    }
  }

  function isPlaying(): boolean { return playing; }

  function rewind(): void {
    if (playing) return;
    queue = [];
    queuePos = 0;
    repeatsLeft = repeatsPerTrack;
  }

  /** Podmiana puli na żywo — patrz FilePlaylist.setTracks. Dedupe po URL;
   *  kolejka (reszta tury) przemapowana po URL-ach, nowe utwory wstawione w
   *  losowe miejsca reszty tury. Nie dotyka elementów <audio> ani crossfade. */
  function setTracks(next: readonly string[]): void {
    const nu = Array.from(new Set(next));
    const old = trackUrls;
    if (nu.length === old.length && nu.every((u, i) => u === old[i])) return;
    const oldSet = new Set(old);
    const idxOf = new Map<string, number>();
    nu.forEach((u, i) => idxOf.set(u, i));
    const curUrl = currentUrl();
    const tail: number[] = [];
    for (const qi of queue.slice(queuePos + 1)) {
      const u = old[qi];
      const ni = u === undefined ? undefined : idxOf.get(u);
      if (ni !== undefined) tail.push(ni);
    }
    const fresh: number[] = [];
    nu.forEach((u, i) => { if (!oldSet.has(u)) fresh.push(i); });
    for (const f of shuffle(fresh)) {
      tail.splice(Math.floor(Math.random() * (tail.length + 1)), 0, f);
    }
    trackUrls = nu;
    if (queue.length === 0) return; // jeszcze nie startowała — kolejka powstanie z nowej puli
    const curIdx = curUrl === null ? undefined : idxOf.get(curUrl);
    if (curIdx !== undefined) {
      queue = [curIdx, ...tail];
      queuePos = 0;
    } else if (playing) {
      // Grający utwór wypadł z puli (zmniejszenie) — dogrywa się; selectNext()
      // z repeatsLeft=1 i queuePos=-1 przejdzie na pierwszy element reszty.
      queue = tail;
      queuePos = -1;
      repeatsLeft = 1;
    } else {
      queue = [];
      queuePos = 0;
      repeatsLeft = repeatsPerTrack;
    }
  }

  function getTracks(): readonly string[] { return trackUrls.slice(); }

  return { hasTracks, start, startWithFadeIn, stop, setVolume, isPlaying, rewind, setTracks, getTracks };
}

// ---------------------------------------------------------------------------
// Odkrycie plików — import.meta.glob z Vite (eager + import:'default' daje
// bezpośrednio URL, data: URI, bo vite.config.ts ma assetsInlineLimit
// ustawiony na "zawsze inline'uj"). Wzorzec identyczny jak w
// ui/icons/brandAssets.ts (svgBySuffix). Kolejność kluczy posortowana
// (deterministyczna) — samo odtwarzanie i tak tasuje losowo; dorzucenie
// kolejnego utworu do katalogu wystarczy, zero zmian w kodzie.
// ---------------------------------------------------------------------------

// AUDIO W PLIKACH-SASIADACH (R-WEB-BUILD-SPLIT-AUDIO-SIDECAR-Q1): w buildzie bajty mp3 leza w audio-pack-N.js obok
// HTML (rejestr window.__CIV_AUDIO__). Gdy pliku-sasiada brak, modul zasobu zwraca pusty URL — odrzucamy go tu,
// wiec brakujaca muzyka to po prostu pusta playlista (cichy fallback, zero bledow). W dev (Vite) URL-e sa pelne.
function dropEmptyUrls(rec: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of Object.keys(rec)) {
    const u = rec[k];
    if (typeof u === 'string' && u !== '') out[k] = u;
  }
  return out;
}

const kamienModules = dropEmptyUrls(import.meta.glob('./utwory/kamien/*.mp3', {
  eager: true,
  import: 'default',
}) as Record<string, string>);
const KAMIEN_URLS: readonly string[] = Object.keys(kamienModules).sort()
  .map((k) => kamienModules[k] as string);

const zelazoModules = dropEmptyUrls(import.meta.glob('./utwory/zelazo/*.mp3', {
  eager: true,
  import: 'default',
}) as Record<string, string>);
const ZELAZO_URLS: readonly string[] = Object.keys(zelazoModules).sort()
  .map((k) => zelazoModules[k] as string);

const brazModules = dropEmptyUrls(import.meta.glob('./utwory/braz/*.mp3', {
  eager: true,
  import: 'default',
}) as Record<string, string>);
const BRAZ_URLS: readonly string[] = Object.keys(brazModules).sort()
  .map((k) => brazModules[k] as string);

const introModules = dropEmptyUrls(import.meta.glob('./utwory/intro/*.mp3', {
  eager: true,
  import: 'default',
}) as Record<string, string>);
// Intro: STAŁA kolejność (decyzja właściciela C-MUZ-Q6=A) — dramaturgia menu:
// spokojne otwarcie, energiczne zamknięcie. Nowy utwór dorzucony do katalogu
// NIE wskoczy sam we właściwe miejsce — dopisz go tutaj.
const INTRO_KOLEJNOSC: readonly string[] = [
  'Prayer_of_the_Sun_Stone',
  'Dawn_of_the_Architect',
  'Seven_Hills_Rising',
  'Ascent_to_Zenith',
];
const INTRO_URLS: readonly string[] = INTRO_KOLEJNOSC
  .map((nazwa) => Object.keys(introModules).find((k) => k.includes(nazwa)))
  .filter((k): k is string => Boolean(k))
  .map((k) => introModules[k] as string);

// OVERLAY kontekstowy — muzyka paneli na czas ich otwarcia (dyplomacja / pre-battle).
// Dyplomacja: fallback w ./utwory/dyplomacja/*.mp3 (1 utwór, pętla); per-cywilizacja
// w ./utwory/dyplomacja/<civId>/ (stała kolejność, 3× pod rząd każdy utwór — patrz
// DYPLOMACJA_CIV_TRACK_ORDER). Wybór po civId w diplomacyPlaylistForCiv().
const dyplomacjaModules = dropEmptyUrls(import.meta.glob('./utwory/dyplomacja/*.mp3', {
  eager: true,
  import: 'default',
}) as Record<string, string>);
const DYPLOMACJA_URLS: readonly string[] = Object.keys(dyplomacjaModules).sort()
  .map((k) => dyplomacjaModules[k] as string);

// Per-cywilizacja: ./utwory/dyplomacja/<civId>/*.mp3 — stała kolejność, 3× pod rząd
// każdy utwór, potem następny (A×3 → B×3 → A×3…), crossfade między przejściami.
const dyplomacjaCivModules = dropEmptyUrls(import.meta.glob('./utwory/dyplomacja/*/*.mp3', {
  eager: true,
  import: 'default',
}) as Record<string, string>);

/** Kolejność utworów per civId (klucz = typCywilizacji / ikonaId z civs.json). */
const DYPLOMACJA_CIV_TRACK_ORDER: Readonly<Record<string, readonly string[]>> = {
  rzymianie: ['Imperial_Accord', 'Portico_of_the_Consul'],
};

function civIdFromDyplomacjaPath(path: string): string | null {
  const m = path.match(/\/dyplomacja\/([^/]+)\//);
  return m?.[1] ?? null;
}

function buildCivDiplomacyUrls(civId: string): readonly string[] {
  const keys = Object.keys(dyplomacjaCivModules).filter(
    (k) => civIdFromDyplomacjaPath(k) === civId,
  );
  const order = DYPLOMACJA_CIV_TRACK_ORDER[civId];
  if (order) {
    return order
      .map((nazwa) => keys.find((k) => k.includes(nazwa)))
      .filter((k): k is string => Boolean(k))
      .map((k) => dyplomacjaCivModules[k] as string);
  }
  return keys.sort().map((k) => dyplomacjaCivModules[k] as string);
}

const civDiplomacyPlaylistCache = new Map<string, FilePlaylist>();

// MUZYKA CYWILIZACJI (przywitanie + negocjacje): manifest data/civ-music.json,
// pliki w ./utwory/dyplomacja/_civ/<civId>/ (podkatalog `_civ` celowo poza
// globem `dyplomacja/*/*.mp3` powyżej). Logika wyboru: civMusic.ts (czysta).
const civMusicModules = dropEmptyUrls(import.meta.glob('./utwory/dyplomacja/_civ/*/*.mp3', {
  eager: true,
  import: 'default',
}) as Record<string, string>);
const CIV_MUSIC_AVAILABLE: Record<string, string> = {};
for (const k of Object.keys(civMusicModules)) {
  const m = k.match(/\/_civ\/([^/]+)\/([^/]+)$/);
  if (m) CIV_MUSIC_AVAILABLE[`${m[1]}/${m[2]}`] = civMusicModules[k] as string;
}
const civMusicPlaylistCache = new Map<string, FilePlaylist>();

function getCivMusicPlaylist(civId: string): FilePlaylist | null {
  try {
    // Wybór przy KAŻDYM otwarciu rozmowy (rotacja listy przywitań); playlista
    // cache'owana po zestawie URL-i, więc każde przywitanie ma własną playlistę.
    const sel = resolveCivDiplomacyTracks(civMusicManifest as CivMusicManifest, civId, CIV_MUSIC_AVAILABLE, DYPLOMACJA_URLS);
    if (!sel) return null;
    const key = `${sel.leadCount}|${sel.urls.join('|')}`;
    let pl = civMusicPlaylistCache.get(key) ?? null;
    if (!pl) {
      pl = createPlaylist(sel.urls, 1, 'losowa', sel.leadCount);
      civMusicPlaylistCache.set(key, pl);
    }
    return pl;
  } catch {
    return null; // bezpieczny fallback na dotychczasowy dźwięk dyplomacji
  }
}

function getOrCreateCivDiplomacyPlaylist(civId: string): FilePlaylist | null {
  const cached = civDiplomacyPlaylistCache.get(civId);
  if (cached) return cached.hasTracks() ? cached : null;
  const urls = buildCivDiplomacyUrls(civId);
  if (urls.length === 0) return null;
  const pl = createPlaylist(urls, 3, 'stala');
  civDiplomacyPlaylistCache.set(civId, pl);
  return pl;
}

const preBattleModules = dropEmptyUrls(import.meta.glob('./utwory/prebattle/*.mp3', {
  eager: true,
  import: 'default',
}) as Record<string, string>);
const PREBATTLE_URLS: readonly string[] = Object.keys(preBattleModules).sort()
  .map((k) => preBattleModules[k] as string);

const bitwaModules = dropEmptyUrls(import.meta.glob('./utwory/bitwa/*.mp3', {
  eager: true,
  import: 'default',
}) as Record<string, string>);
const BITWA_URLS: readonly string[] = Object.keys(bitwaModules).sort()
  .map((k) => bitwaModules[k] as string);

const zwyciestwoModules = dropEmptyUrls(import.meta.glob('./utwory/zwyciestwo/*.mp3', {
  eager: true,
  import: 'default',
}) as Record<string, string>);
const ZWYCIESTWO_URLS: readonly string[] = Object.keys(zwyciestwoModules).sort()
  .map((k) => zwyciestwoModules[k] as string);

const porazkaModules = dropEmptyUrls(import.meta.glob('./utwory/porazka/*.mp3', {
  eager: true,
  import: 'default',
}) as Record<string, string>);
const PORAZKA_URLS: readonly string[] = Object.keys(porazkaModules).sort()
  .map((k) => porazkaModules[k] as string);

/** Pula utworów epoki MUZYKI (1=kamień, 2=brąz, 3=żelazo) — KUMULATYWNA:
 *  tier 1 = kamień; tier 2 = kamień + brąz; tier 3 = kamień + brąz + żelazo
 *  (katalog utwory/zelazo/ może nie istnieć — wtedy tier 3 = tier 2; gdy
 *  pojawią się w nim mp3, dołączą bez zmian w kodzie). Bez duplikatów. */
export function eraTierUrls(tier: number): readonly string[] {
  const all: string[] = [...KAMIEN_URLS];
  if (tier >= 2) all.push(...BRAZ_URLS);
  if (tier >= 3) all.push(...ZELAZO_URLS);
  return Array.from(new Set(all));
}

/** Muzyka tła rozgrywki: JEDNA playlista kumulatywna po epokach (shuffle +
 *  3x pod rząd, crossfade 1,5 s — parametry bez zmian). Awans epoki woła
 *  setEraMusicTier(): nowe utwory dołączają do puli, bieżący nie jest
 *  przerywany. */
export const eraMusicPlaylist: FilePlaylist = createPlaylist(eraTierUrls(1), 3);

/** Ustawia epokę muzyki (1..3, inne wartości przycięte) = przebudowa puli. */
export function setEraMusicTier(tier: number): void {
  eraMusicPlaylist.setTracks(eraTierUrls(Math.max(1, Math.min(3, Math.floor(tier)))));
}

/** Intro (ekrany przed rozgrywką): shuffle + 1x, z crossfade 1,5 s. */
export const introPlaylist: FilePlaylist = createPlaylist(INTRO_URLS, 1, 'stala');

/** Dyplomacja (fallback): 1 utwór, pętla póki panel audiencji otwarty. */
export const dyplomacjaPlaylist: FilePlaylist = createPlaylist(DYPLOMACJA_URLS, 1, 'stala');

/** Wybiera playlistę dyplomacji: per-civ gdy są utwory, inaczej wspólny fallback. */
export function diplomacyPlaylistForCiv(civId: string | undefined): FilePlaylist {
  if (civId) {
    const music = getCivMusicPlaylist(civId);
    if (music) { music.rewind(); return music; } // każde otwarcie rozmowy od przywitania

    const civPl = getOrCreateCivDiplomacyPlaylist(civId);
    if (civPl) return civPl;
  }
  return dyplomacjaPlaylist;
}

/** Wszystkie playlisty dyplomacji (fallback + per-civ) — do setVolume(). */
export function allDiplomacyPlaylists(): readonly FilePlaylist[] {
  const music = [...civMusicPlaylistCache.values()];
  return [dyplomacjaPlaylist, ...civDiplomacyPlaylistCache.values(), ...music];
}

/** Pre-battle: 1 utwór, pętla póki nakładka przedbitewna otwarta. */
export const preBattlePlaylist: FilePlaylist = createPlaylist(PREBATTLE_URLS, 1, 'stala');

/** Bitwa właściwa: 1 utwór, pętla póki trwa scena bitwy. */
export const bitwaPlaylist: FilePlaylist = createPlaylist(BITWA_URLS, 1, 'stala');

/** Ekran zwycięstwa (bitwa wygrana przez gracza): 1 utwór, pętla póki ekran otwarty. */
export const zwyciestwoPlaylist: FilePlaylist = createPlaylist(ZWYCIESTWO_URLS, 1, 'stala');

/** Ekran porażki (bitwa przegrana przez gracza): 1 utwór, pętla póki ekran otwarty. */
export const porazkaPlaylist: FilePlaylist = createPlaylist(PORAZKA_URLS, 1, 'stala');
