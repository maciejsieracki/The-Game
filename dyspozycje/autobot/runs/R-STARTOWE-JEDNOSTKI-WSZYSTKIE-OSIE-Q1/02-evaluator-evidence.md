# Evidence — 02 Evaluator — R-STARTOWE-JEDNOSTKI-WSZYSTKIE-OSIE-Q1

KANBAN_CARD: t_af4dfeb8
TEMAT: R-STARTOWE-JEDNOSTKI-WSZYSTKIE-OSIE-Q1
PROCESS_PHASE: evaluator
RUN_ID: 10
STATUS: PASS-WITH-NOTES
REVIEW_OUTCOME: APPROVED

## 1. Niezależny readback diffu

Przejrzano aktualny diff względem `HEAD=8e5e81255449bc98c9674c6a6e5505d408b343fc` oraz ścieżki wywołań w `gra/src/main.ts`. Zmiany produktu/testów:

- `gra/data/ai-params.json`: hard `trudnosc_poziom3_startowe_jednostki` `0 -> 2`.
- `gra/src/game/ai-difficulty-bonus.ts`: gracz `1/2/3 -> 2/1/0`; obce PM pozostaje `2/1/0`, PM typu gracza pozostaje `0/1/2`.
- `gra/src/game/ai.ts`: fallback hard `startoweJednostki` `0 -> 2`; fallback hard `startoweMiasta` pozostaje `1`.
- Testy aktualizują kontrakt i live izolację bundla; bez zmian w `gra/src/main.ts`.

Odczytane call-site'y `main.ts` są rozdzielone: rywale PM typu gracza przez `_menuCityStateDifficulty`, player/foreign przez `_menuDifficulty`, major AI przez `planMajorAiDifficultyStartBonuses`. Guard pierwszego miasta jest per owner/fotel i chroni przed drugim foundingiem.

`git diff --check`: exit `0`. Nie ma zmian poza allowlistą; dwa raporty evaluatora są artefaktami dozwolonego katalogu runu. Brak commit/push/PR/merge/deploy.

## 2. Autoritative input

Plik: `/home/ubuntu/.hermes/attachments/The-Game-startowe-jednostki-do-korekty.xlsx`

SHA-256: `e04a427c5f761b19471b11855a236f280949b9b3be04682c09fcec2f03739cce`

Odczyt XML potwierdza:

- gracz, główna trudność: `easy=2`, `normal=1`, `hard=0`;
- główne AI, główna trudność: dodatkowe `easy=0`, `normal=1`, `hard=2`;
- obce PM, główna trudność: `easy=2`, `normal=1`, `hard=0`;
- PM typu gracza, osobny suwak: `easy=0`, `normal=1`, `hard=2`;
- hard AI: `+1` miasto i istniejący zamiennik jednostkowy przy braku legalnego miejsca.

## 3. Weryfikacja testowa

Wszystkie polecenia uruchomiono z `gra/`.

- Syntax checks: exit `0`.
- `ai-difficulty-bonus-test.cjs`: `90 passed, 0 failed`.
- `city-state-start-units-test.cjs`: `16 PASS, 0 FAIL`.
- `ai-balans-step5-test.cjs`: `18 passed, 0 failed`.
- `city-state-cluster-diff-test.cjs`: `31 passed, 0 failed`.
- `miasta-zbyt-blisko-test.cjs`: 20 map; 23281 plan pairs + 25463 runtime-order pairs; 0 violations.
- `tsc --noEmit`: exit `0`.

## 4. Niezależna weryfikacja live

Chromium: `/home/ubuntu/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`.

`city-state-start-units-live-test.cjs`: `25 pass, 0 fail`; trzy pełne generacje (`hard`, `normal`, `easy`) przy stałym `cityStateDifficulty=normal`. Wynik player capital `0/1/2`, foreign city-state `0/1/2`, same-type city-state `1/1/1`; zero console/page errors.

`starting-army-first-city-live-test.cjs`: `13 pass, 0 fail`; dwa różne human seats i start hexes, pierwszy founding obu foteli, dokładnie jeden unit na każdy fotel przy `normal`, drugi founding fotela 1 bez nowego unit, zero Chromium JS errors.

## 5. Anty-samooszukanie i baseline

W tymczasowej kopii umieszczonej wewnątrz `gra/` zmieniono tylko `playerStartUnitCount` na dawny mutant `easy=1`, `normal=2`, `hard=3`, zachowując `src/`, `data/` i rozwiązywanie `node_modules`. `ai-difficulty-bonus-test.cjs` zakończył się `87 passed, 3 failed`, exit `1`; trzy oczekiwania tabeli gracza zabiły mutanta. Tymczasowy katalog został usunięty.

Szeroki `ai-test.cjs` na aktualnym worktree dał `291 passed, 4 failed` (T2S-b, T2S-b2, T10b). To samo polecenie na czystym archiwum `HEAD:gra` dało identyczny output i identyczny SHA-256 wyniku, więc failures są reprodukowalnym baseline'em handlu/dyplomacji, nie skutkiem tej zmiany.

## 6. Konkluzja

Kryteria kontraktu są spełnione. Głos evaluatora: PASS-WITH-NOTES / APPROVED. Brak blokady; następna bramka to Final Control, bez działań publikacyjnych.
