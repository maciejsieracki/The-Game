# R-MUZYKA-OPOZNIENIE — opóźnienie startu muzyki w menu głównym

**Status:** 🟢 ZDEPLOYOWANE FALA 18 (`2f928932`) · 2026-07-26  
**Ekran:** menu główne (pierwsze wejście na stronę w sesji)

## ECHO (cytat)
> Przesuń start muzyki w menu głównym o dwie, trzy sekundy, bo ścina początek, zanim się załaduje przeglądarka.

## Decyzja wdrożeniowa
- Nazwany parametr **`menu.muzyka_opoznienie_startu_ms`** = **2500 ms** w `gra/data/ui-params.json`.
- Opóźnienie dotyczy **wyłącznie pierwszego** startu playlisty intro w sesji strony (`introMusicStartedOnce` w `main.ts`).
- Kolejne powroty do menu (z gry, po bitwie itd.) → `startIntroMusic()` **bez** opóźnienia i **bez** fade-in (jak dotychczas).
- Crossfade między utworami intro oraz muzyka kontekstowa (epoka/nastrój) — **bez zmian**.

## Wiring (zweryfikowane 2026-08-05)

| Warstwa | Plik | Dowód |
|---------|------|-------|
| Parametr | `gra/data/ui-params.json` | `"muzyka_opoznienie_startu_ms": 2500` |
| Typ | `gra/src/ui/uiParams.ts` | `UiMenu.muzyka_opoznienie_startu_ms?: number` |
| Logika | `gra/src/main.ts` | `resumeIntroMusic()` L7769–7784: `if (!introMusicStartedOnce)` → `setTimeout(startFirst, delayMs)` → `startIntroMusicWithFadeIn(muzyka_fade_in_ms)` |
| Wejście | `gra/src/main.ts` | `openStartupMainMenu()` L14835 → `resumeIntroMusic()` |

## AC
- [x] Parametr 2500 ms w ui-params
- [x] Opóźnienie tylko przy pierwszym starcie menu w sesji
- [x] Powroty do menu bez opóźnienia
- [x] Fade-in pierwszego utworu (`muzyka_fade_in_ms` = 5000 ms) — osobny parametr, bez regresji

## NOTES — gotowość odtwarzacza (nie wdrożone)

Wpis w `WERSJE.md` (FALA 18) mówi o starcie „po gotowości odtwarzacza" — **w kodzie tego nie ma**.

Faktyczna implementacja to **stały timer** `setTimeout(2500)` przed `introPlaylist.startWithFadeIn()`. Odtwarzacz (`filePlayer.ts`) woła `el.play()` od razu po upływie opóźnienia; nie czeka na `canplay` / `loadeddata`.

**Dlaczego nie dodano teraz:** wymagałoby zmian w `filePlayer.ts` lub `resumeIntroMusic()` (🟡 cross-lane, Integrator). Stały bufor 2,5 s + fade-in 5 s rozwiązuje zgłoszenie „ucięty początek" w typowych warunkach.

**Follow-up (opcjonalny):** `max(delayMs, czas_do_canplay)` — start nie wcześniej niż 2500 ms **i** nie przed `canplaythrough` na pierwszym `<audio>`.

## AutoBot
Operator verify/close — bez deployu w tej sesji.
