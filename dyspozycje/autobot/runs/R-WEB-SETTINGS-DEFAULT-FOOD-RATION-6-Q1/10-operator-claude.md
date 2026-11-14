# R-WEB-SETTINGS-DEFAULT-FOOD-RATION-6-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-SETTINGS-DEFAULT-FOOD-RATION-6-Q1
GOAL: nowa gra startuje z domyślnym Wyżywieniem (racją) 6; nowe miasta bez własnego ustawienia dziedziczą 6. Wartość AI bez zmian (4).

## PRZED / PO

- PRZED: `DEFAULT_POZIOM_RACJI = 4` (`gra/src/game/population-growth-v85.ts`, jedno źródło prawdy dla gracza, AI i migracji). Fallback UI `getDef(ownerId) ?? 4` w `gra/src/ui/empireDetailPanel.ts` (suwak „DOMYŚLNE WYŻYWIENIE”). Nowe miasta dziedziczą owner default przez `seedCityOwnerDefaults` (main.ts).
- PO: gracz (owner 0 / `freshOwnerDefaultPoziomRacji()`) = 6; suwak fallback = `DEFAULT_POZIOM_RACJI` (6); nowe miasto gracza = 6 (dziedziczenie); AI = 4 (`DEFAULT_POZIOM_RACJI_AI`, `freshAiOwnerDefaultPoziomRacji()`); stare zapisy = 4 (`DEFAULT_POZIOM_RACJI_LEGACY`, bez zmian zachowania).

## ZMIANY (commit: patrz sekcja DEPLOY/PUSH i SHA w odpowiedzi)

Rozdzielenie wartości (dispatch: „rozdziel, AI = dotychczasowe”), bo jedna stała dzieliła gracza, AI i migrację:

- `gra/src/game/population-growth-v85.ts`: `DEFAULT_POZIOM_RACJI = 6` (gracz/nowa gra); nowe `DEFAULT_POZIOM_RACJI_AI = 4`, `DEFAULT_POZIOM_RACJI_LEGACY = 4` (migracja starych zapisów: `migrateProcentRozwojToPoziomRacji(undefined)` i „brak pola poziomRacji” → 4); helper `startowyPoziomRacjiDlaWlasciciela(ownerId)` (0 → 6, inne → 4).
- `gra/src/game/cities.ts`: `foundCity` / `foundCityAt` startują z `startowyPoziomRacjiDlaWlasciciela(ownerId)`; `DEFAULT_PROCENT_ROZWOJ_WYZYWIENIE` liczony z LEGACY (4), więc wartość legacy pola `procentRozwoj` pozostaje 67 (bez zmiany semantyki starych zapisów).
- `gra/src/game/empire-city-defaults.ts`: `freshAiOwnerDefaultPoziomRacji()` (= 4); fallbacki migracji `migratePoziomRacjiOnLoad` → LEGACY (4).
- `gra/src/main.ts` (wyjątek od ZAKAZU „main.ts jeśli da się uniknąć” — NIE dało się uniknąć: rozdział AI wymaga wskazania właściciela w 2 miejscach): import +1; inicjalizacja owner default dla AI start hexes (l.~6379) i dla właścicieli nieobecnych w mapie w `seedCityOwnerDefaults` (l.~6454) → `freshAiOwnerDefaultPoziomRacji()`. Gracze są zasiewani wcześniej z `humanOwnerIds` (l.~6339) i dalej dostają 6. Mechanika racji/spichlerza nietknięta.
- `gra/src/ui/empireDetailPanel.ts`: fallback suwaka `?? 4` → `?? DEFAULT_POZIOM_RACJI` (+ import). Limit suwaka (`WYZYWIENIE_MAX`, `WYZYWIENIE_STEP`) bez zmian.
- Testy: `gra/tools/mp-spawn-ration-test.cjs` (T1 AI owner 3 → 4 literal przez `DEFAULT_POZIOM_RACJI_AI`; T3 gracz owner 0 → 6; komentarze/etykiety zaktualizowane); `gra/tools/hotseat-ustawienia-kopiowane-test.cjs` l.143 (fotel 2: 4 → 6).
- NOWY test: `gra/tools/default-food-ration-test.cjs` (22 asercje): nowa gra gracza = 6, AI = 4, nowe miasto gracza = 6 / AI = 4 (realny `foundCityAt`), dziedziczenie i override (`resolveCityPoziomRacji`, `broadcastPoziomRacjiToOwnerCities`), stary zapis zachowuje swoje wartości (`migratePoziomRacjiOnLoad` bez zmiany miast 4 i 2, legacy → 4).

NIE zmieniono: AI (wartość 4), mechanika racji/spichlerza, limit suwaka, Auto-Żywienie (przycisk zostaje jak jest), `gra/data/*.json` (wartość nie była w danych — stała w kodzie), `docs/encyklopedia/**` (grep nie znalazł żadnego opisu wartości domyślnej Wyżywienia, więc nic do zsynchronizowania), wikiBundle (brak zmian w dokumentacji → nie regenerowano; zgodnie z zasadą regeneracja tylko narzędziem, gdy są zmiany docs).

Historyczne dokumenty decyzji z wartością 4 (`docs/decyzje/B-WYZYWIENIE-SLIDER-2026-07-30.md`, `docs/decyzje/P-MP-SPAWN-WYZYWIENIE.md`, `docs/MACIEJ-GOTOWE.md`) zostawiono jako zapis historyczny — NIE_ZMIERZONO, czy FC wymaga ich aktualizacji.

## TESTY (liczby z surowego wyjścia, uruchomione w worktree na 157657977 + zmiany)

- `npx tsc --noEmit` (po `npm ci` w `gra/`, 71 pakietów): exit 0, 0 linii wyjścia (0 błędów).
- Bramki referencyjne (R-PROC-AUTOBOT §6):
  - `node tools/logic-test.cjs` → `LOGIC OK (213/213)`, exit 0
  - `node tools/tech-tree-test.cjs` → `tech-tree-test: 20 pass, 0 fail`, exit 0
  - `node tools/research-test.cjs` → `PASSED: 33 / FAILED: 0 / TOTAL: 33`, exit 0
  - `node tools/unit-replace-test.cjs` → `WSZYSTKIE TESTY ZIELONE (21/21)`, exit 0
  - `node tools/combat-test.cjs` → `All sanity checks passed.`, exit 0
  - `node tools/unit-power-test.cjs` → `6 pass, 0 fail`, exit 0
- Powiązane z tematem:
  - `node tools/default-food-ration-test.cjs` → `22 passed, 0 failed`, exit 0 (NOWY)
  - `node tools/empire-city-defaults-test.cjs` → `53 pass, 0 fail`, exit 0
  - `node tools/mp-spawn-ration-test.cjs` → `16 passed, 0 failed`, exit 0
  - `node tools/population-growth-v85-test.cjs` → `50 passed, 0 failed`, exit 0
  - `node tools/spichlerz-panel-food-parity-test.cjs` → exit 0
  - `node tools/ai-major-economy-test.cjs` → exit 0
  - `node tools/population-growth-v85-bonus-test.cjs` → exit 0
- Dowód mutacyjny nowego testu: przywrócenie `DEFAULT_POZIOM_RACJI = 4` (= stan bazowy dla gracza) → `16 passed, 6 failed` (FAIL T1a, T1b, T1c, T3b, T3c, T4a); wartość przywrócona do 6 i zweryfikowana grep-em. Czerwony na bazie: stan bazowy ma 4, więc asercje „= 6” czerwienią się tak samo jak w mutacji.
- `git diff --check`: czysty (exit 0). `git status`: tylko zamierzone pliki (7 zmodyfikowanych + 1 nowy plik testu + raport).
- NIE_ZMIERZONO: `node tools/hotseat-ustawienia-kopiowane-test.cjs` (test przeglądarkowy Playwright) → exit 1, `locator.click: Timeout 30000ms exceeded` — nie zbadano, czy to regresja tematu, czy stały błąd infrastruktury na bazie (nie uruchomiono testu na czystej bazie). Zmiana w tym teście (4 → 6 dla fotela 2) jest zgodna z kodem, ale wynik nie jest zielony.
- NIE_ZMIERZONO: realna weryfikacja w Chromium (zrzut panelu „Domyślne wyżywienie” pokazującego 6, nowa gra → nowe miasto = 6). Operator nie zbudował gry (`vite --outDir /tmp/<własny>`) ani nie uruchomił sesji przeglądarkowej w tej rundzie — to zadanie Evaluatora/FC.
- NIE_ZMIERZONO: pełny przebieg `ai-buduje-budynki-test`, `mgla-sciezka-inwariant-test`, `map-gen-regression-test` (nie są bramkami tego tematu; nie uruchamiano).

## BLOKADY

- Brak zablokowanych wymagań. Uwaga (nie blokuje): wejście `main.ts` (2 linie + import) — konieczne dla rozdziału AI, opisane wyżej.
- Ryzyko do oceny przez Evaluatora: `resolveCityPoziomRacji` fallback (`empire-city-defaults.ts:486`) nadal zwraca `DEFAULT_POZIOM_RACJI` (= 6) gdy brak wszystkiego — to ścieżka awaryjna bez właściciela; pozostawiona bez zmian (test `empire-city-defaults-test` T269-273 tego oczekuje).
- Ryzyko do oceny: `seedCityOwnerDefaults` przypisuje AI-właściciela nieobecnego w mapie wartość 4; gdy w hotseat pojawi się właściciel-człowiek spoza `humanOwnerIds`, dostanie 4 zamiast 6 (założenie: takiego przypadku nie ma; gracze są zasiewani z `humanOwnerIds`).
- Ryzyko do oceny: przejęcie miasta (main.ts ~9248) dla właściciela bez wpisu w mapie używa `freshOwnerDefaultPoziomRacji()` (= 6). Zostawiono, bo po zasiewie właściciele AI mają wpis.

## RUNDY

1/5. Brak FAIL/BLOCK w tej rundzie (rundy startowej Operatora).

## LUKI ROZSTRZYGNIĘTE ZAŁOŻENIEM

- Założenie A: „nowe miasta dziedziczą 6” realizuje mechanizm `seedCityOwnerDefaults` (owner default), a `foundCityAt` startuje z wartością właściciela (0 → 6). Hotseat-owner ≠ 0 startuje pure-funkcję z 4, ale w grze jest nadpisywany przez seed do jego domyślnego (6).
- Założenie B: „AI = dotychczasowe” = AI owner default, AI founded city i migracja owners-bez-wpisu zachowują 4.
- Założenie C: stary zapis nie jest migrowany — zapisane `ownerDefaultPoziomRacji` i jawne `poziomRacji` miast są wczytywane bez zmian (test T5).
- Założenie D: `DEFAULT_PROCENT_ROZWOJ_WYZYWIENIE` (legacy) pozostaje 67, bo to pole nie jest już czytane jako źródło racji (`poziomRacji` ma pierwszeństwo).

## NASTĘPNY KROK

Evaluator (SONNET): zweryfikować w Chromium (build `vite --outDir /tmp/<własny> --emptyOutDir`, nowa gra → panel „Domyślne wyżywienie” = 6, nowe miasto gracza = 6, miasto AI = 4, wczytanie starego zapisu nie zmienia wartości) i rozstrzygnąć NIE_ZMIERZONO z sekcji TESTY (hotseat-test: czy regresja). Potem Final Control.

## UWAGI-DLA-ORKIESTRATORA

- Znalezisko poza zakresem (nie działano): `docs/decyzje/B-WYZYWIENIE-SLIDER-2026-07-30.md` i `docs/decyzje/P-MP-SPAWN-WYZYWIENIE.md` opisują wartość domyślną 4 jako kanon — dokumenty historyczne; orkiestrator decyduje, czy dopisać adnotację „zastąpione 2026-11-14”.
- Znalezisko: `gra/tools/hotseat-ustawienia-kopiowane-test.cjs` wykonuje się w Playwright i kończy się timeoutem na `locator.click` — warto ustalić, czy to stan bazowy (osobny temat infra), zanim ktokolwiek uzna wynik za regresję tego tematu.
- Dług Rust: REPIN domyślnych wartości (`DEFAULT_POZIOM_RACJI` 4→6, AI pozostaje 4) — do odnotowania w planie REPIN.
- Środowisko: w worktree wykonano `npm ci` w `gra/` (katalog `node_modules` ignorowany przez git, nie wchodzi do commita). Do sprzątania po FC.

DEPLOY/PUSH: NIE WYKONANO
