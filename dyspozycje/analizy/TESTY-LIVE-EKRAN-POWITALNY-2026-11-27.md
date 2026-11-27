# Testy live a ekran powitalny / bramka „Zakończ turę” — pomiar (2026-11-27)

Temat: R-WEB-LIVE-TESTS-WELCOME-GATE-Q1 (tag LIVEGATE), runda 1/5, Operator HAIKU 5.5.
Baza: origin/main `6319eaf662d6055490a37f5f580f9c81d2feec58`.
Zakres pracy: tylko testy i dokumentacja. Zero zmian w `gra/src` i `gra/data`. Helper `gra/tools/_live-ready.cjs` ani żaden `*-test.cjs` NIE został zmieniony.

## Wynik w skrócie

- **Ekran powitalny nie blokował żadnego z 26 zmierzonych testów.** We wszystkich 26 logach zero trafień `civ-welcome` i zero komunikatów Playwright typu „intercepts pointer events”.
- Dlatego **nie było czego przepinać na helper**. Żaden test nie został zmieniony, a skrypt migracyjny nie powstał.
- Główne przyczyny niepowodzeń w próbce: TIMEOUT (przekroczone 280 s), `endTurn` nie ustabilizował się w ~60 s, czekanie na kreator `.civ-newgame .start`, brakujące wejście konfiguracyjne (env / plik request) i asercje scenariuszy.
- Mutacja helpera (task 5 dispatchu) **NIE WYKONANA**: nie ma testu zablokowanego ekranem, na którym dałoby się ją pokazać czerwoną.

## 1. Inwentaryzacja (zakres: `gra/tools/*-test.cjs`)

Liczby z `grep` na katalogu `gra/tools` (stan 6319eaf66).

| Miara | Liczba |
|---|---|
| Wszystkie pliki `*-test.cjs` | 1571 |
| Pliki z `chromium` / `playwright` / `launch(` (kandydaci „live”) | 369 |
| Z kliknięciem w UI (`page.click`, `.click(`, `page.mouse`) | 169 |
| Bez kliknięcia (odczyt DOM / `evaluate`, bez akcji UI) | 200 |
| Wzmianka o „Zakończ turę” / `end-turn` / `endTurn` | 35 |
| Z kliknięciem przycisku końca tury (próbka 25) | 25 |
| Używają haka `civTest` (`?civTest=1`, `__nnsMeasureDebug`) | 55 |
| Czekają na kreator `.civ-newgame` (start przez UI kreatora) | 19 |
| Obsługują ekran powitalny (`closeCivWelcome` / `civ-welcome`) | 5 |
| Używają helpera bramki (`prepareEndTurnGate` / `_live-ready`) | 2 |

Pogrupowanie wg sposobu startu gry (orientacyjnie, z grepów; NIE ZMIERZONO dla pełnej liczby 369):

- **hak civTest** (`?civTest=1`, `startGame` przez `__nnsMeasureDebug`): ok. 55 plików.
- **kreator** (klik przez `.civ-newgame .start`): ok. 19 plików.
- **bez UI** (tylko odczyt DOM / logika w przeglądarce, bez kliku): ok. 200 plików, w tym część z własnym buildem przez `vite`.
- **ekran powitalny** (test sam obsługuje `#civ-welcome-screen-root`): 5 plików.

Uwaga: 194 pliki wzmiankują `vite` (często jako własny build w teście), co jest sprzeczne z zasadą „build poza testem”. To tylko dopasowanie tekstowe, NIE ZMIERZONO, ile z nich faktycznie buduje.

## 2. Pomiar (próbka 26 testów)

Próbka: wszystkie 25 testów z kliknięciem w przycisk końca tury (lista z inwentaryzacji) plus `end-turn-gate-live-test.cjs` (test bramki, zmierzony osobno). Build bazowy: `vite build` z `6319eaf66`, zapisany poza repo. Każdy test z timeoutem 280 s (procesy równoległe, po 4 naraz). Zapis `WORLD_GEN_DIST` i `--dist` zgodnie z sygnaturą danego testu.

Klasyfikacja: PASS / FAIL z powodem „ekran powitalny” / FAIL z innym powodem / TIMEOUT / crash Chromium.

Wynik „przed” = wynik na bazie `6319eaf66` z niezmienionymi testami. Wynik „po” dla każdego testu: **bez zmian (NIE NAPRAWIANO)**, ponieważ żaden test nie był blokowany ekranem.

| Test | Start | Wynik przed | Wynik po | Powód (z logu) |
|---|---|---|---|---|
| build-panel-ulepszenia-scroll-real-render-test | bez hooka | PASS (rc 0, 33 s) | bez zmian | — |
| defeat-screen-summary-live-test | argv (build) | TIMEOUT (280 s) | bez zmian | przekroczony czas, brak wyniku |
| diplo-forced-peace-pending-live-paths-test | civTest | PASS (rc 0, 208 s) | bez zmian | — (klik „Zakończ turę” przy pending: zablokowany zgodnie z oczekiwaniem) |
| diplo-peace-auto-stale-offer-live-test | civTest | PASS (rc 0, 208 s, PASS=15 FAIL=0) | bez zmian | — |
| diplo-truce-live-test | civTest | TIMEOUT (280 s) | bez zmian | `endTurn` nie ustabilizował się; zamknięcie strony w trakcie |
| end-turn-block-event-live-test | civTest | FAIL inny powód (rc 1, 191 s) | bez zmian | scenariusze z bramki; część PASS (np. blokada przy skarbcu <0), część FAIL — szczegóły w logu, NIE ZMIERZONO pełnej listy |
| end-turn-gameplay-runtime-test | bez hooka (env) | FAIL inny powód (rc 1, 2 s) | bez zmian | brak pliku żądania `WORLD_GEN_REQUEST_FILE` (konfiguracja, nie gra) |
| end-turn-input-stability-test | bez hooka | FAIL inny powód (rc 1, 2 s) | bez zmian | błąd Playwright na starcie (linia 288), NIE ZMIERZONO szczegółowo |
| era-change-toast-live-test | bez hooka | FAIL inny powód (rc 1, 237 s) | bez zmian | `endTurnInProgress` nie przeszedł z true do false w 60 s |
| forced-war-iron-player-target-live-test | bez hooka | FAIL inny powód (rc 1, 228 s) | bez zmian | `fast-forward: endTurn #1 nie ustabilizował się` |
| forced-war-player-no-contact-live-test | bez hooka | FAIL inny powód (rc 1, 235 s) | bez zmian | jw. |
| forced-war-player-target-live-test | bez hooka | FAIL inny powód (rc 1, 224 s) | bez zmian | jw. |
| general-quick-follow-action-test | bez hooka | FAIL inny powód (rc 1, 2 s) | bez zmian | asercja logiki (`expected true`), bez przeglądarki w akcji |
| hotseat-drugi-fotel-tura-test | kreator | FAIL inny powód (rc 2, 187 s) | bez zmian | czekanie na `.civ-newgame .start` (start kreatora nie pojawił się) |
| hotseat-dyplo-kontakt-per-fotel-test | kreator | FAIL inny powód (rc 2, 187 s) | bez zmian | jw. |
| hotseat-etap6a-input-noop-test | bez hooka | TIMEOUT (280 s) | bez zmian | przekroczony czas; log wskazuje, że test pracował do końca limitu |
| hotseat-etap8-dyplomacja-dane-test | kreator | FAIL inny powód (rc 2, 236 s) | bez zmian | czekanie na `.civ-newgame .start` |
| hotseat-etap8-dyplomacja-ui-test | kreator | FAIL inny powód (rc 2, 243 s) | bez zmian | czekanie na `.civ-newgame .start` |
| improvement-build-highlight-lifecycle-live-test | bez hooka | FAIL inny powód (rc 1, 3 s) | bez zmian | ENOENT pliku konfiguracji w ścieżce `/workspace/...` (środowisko testu) |
| live-nns-gate-smoke-test | civTest | TIMEOUT (280 s) | bez zmian | przekroczony czas |
| perf-large-empire-stress-live-test | argv (build) | FAIL inny powód (rc 1, 5 s) | bez zmian | kotwica transformacji `advanceCityEconomy` nieznaleziona (asercja seedera) |
| perf-late-game-interaction-live-test | bez hooka | FAIL inny powód (rc 1, 162 s) | bez zmian | strażnik harnessu: źródło zmieniło się w trakcie builda |
| sidepanel-diplo-dismiss-real-render-test | argv (--dist) | TIMEOUT (280 s) | bez zmian | `endTurn` nie zakończył się w czasie (A6: `endTurnInProgress` bez zmiany) |
| war-era-counter-live-test | bez hooka | TIMEOUT (280 s) | bez zmian | przekroczony czas |
| war-rules-multiwar-live-test | argv (build) | TIMEOUT (280 s) | bez zmian | czekanie na `.civ-hud, .civ-ux-frame, .civ-cs` (HUD nie pojawił się w czasie) |
| end-turn-gate-live-test | civTest | FAIL inny powód (rc 1, 204 s) | bez zmian | 2/9 PASS; scenariusze a–c na t1 i t11: `netMax=0` (brak dźwigni podatku w stanie startowym) i brak blokady; NIE ZMIERZONO, czy to stan startu, czy zachowanie bramki |

Podsumowanie próbki (26):

| Klasa | Liczba | Testy |
|---|---|---|
| PASS | 3 | build-panel, diplo-forced-peace-pending, diplo-peace-auto-stale |
| FAIL z powodem „ekran powitalny/bramka” | **0** | — |
| FAIL z innym powodem | 12 | end-turn-block-event, end-turn-gameplay-runtime, end-turn-input-stability, era-change-toast, forced-war-iron, forced-war-no-contact, forced-war-target, general-quick-follow, improvement-build, perf-large-empire, perf-late-game, end-turn-gate |
| Brak kreatora (`.civ-newgame .start`) | 4 | hotseat-drugi, hotseat-dyplo, hotseat-etap8-dane, hotseat-etap8-ui |
| TIMEOUT (280 s) | 7 | defeat-screen, diplo-truce, hotseat-etap6a, live-nns-gate-smoke, sidepanel-diplo, war-era-counter, war-rules-multiwar |
| Crash Chromium (SIGSEGV / Target crashed) | 0 | nie zaobserwowano w tej próbce |

Razem: 3 + 12 + 4 + 7 = 26 testów (każdy w jednej klasie). Przypisanie oparte na ostatnim powodzie w logu; NIE ZMIERZONO szczegółowo dla end-turn-block-event i end-turn-input-stability.

## 3. Naprawa

Nie wykonano. Powód: w próbce nie ma testu blokowanego ekranem powitalnym ani bramką, więc wspólny helper nie ma czego naprawiać. Istniejący helper `closeCivWelcome` (już używany przez 2 testy) pozostał bez zmian.

Dla pozostałych klas usterek (TIMEOUT, brak kreatora, `endTurn` nie ustabilizowany) helper ekranu powitalnego nie jest właściwym narzędziem. Kandydaci na osobne tematy (bez naprawy w tym temacie):

- KANDYDAT-1: `endTurn` nie ustabilizował się w 60 s w headless (`forced-war-*`, `era-change-toast`, `sidepanel-diplo`, `diplo-truce`). Sprawdzić czas tury w SwiftShader i ustawienie `setFast`.
- KANDYDAT-2: czekanie na `.civ-newgame .start` w 4 testach hotseat. Sprawdzić, czy selektor kreatora nadal istnieje w buildzie.
- KANDYDAT-3: `end-turn-gate-live-test` — scenariusze a–c startują z `netMax=0`. To może być stan startu testu, a nie błąd gry. Wymaga osobnej analizy (NIE ZMIERZONO przyczyny).
- KANDYDAT-4: TIMEOUT 280 s bez przyczyny w logu (7 testów). Wydłużenie limitu nie jest tu oceniane.

## 4. Mutacja

NIE WYKONANA. Kryterium „helper bez dismissWelcome → wybrany test czerwony” wymaga testu, który dziś zależy od zamknięcia ekranu. Brak takiego testu w próbce. Mutacji nie wymuszono sztucznie, żeby nie fałszować wyniku.

## 5. Zasada maksymalnego poziomu

Testy z próbki uruchomiono z domyślnymi ustawieniami harnessu (seed 11 / 4242 w zależności od testu). NIE ZMIERZONO na poziomie maksymalnym suwaków (np. Praca na ulepszenia 100%, najwyższa trudność). Poziom uznany za maksymalny: NIEJEDNOZNACZNE w tym temacie — testy nie wystawiają wspólnego suwaka; wyniki nie mogą być przypisane do poziomu maksymalnego.

## 6. Ograniczenia pomiaru

- Ekran powitalny pojawia się przy pierwszym kontakcie z cywilizacją. Testy w próbce mogły zakończyć się przed tym kontaktem. Zero trafień nie dowodzi, że ekran nie blokuje testów w późniejszych turach. NIE ZMIERZONO dla tur po pierwszym kontakcie.
- Pozostałe ok. 340 testów z listy kandydatów NIE ZMIERZONO (poza próbką).
- Kompilacja: `node ./node_modules/vite/bin/vite.js build` z `gra/`, wyjście poza repo. Build bazowy znajduje się w katalogu roboczym poza repo i został usunięty po pomiarze.
