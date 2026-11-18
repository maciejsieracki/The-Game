# R-WEB-UI-CITY-UPGRADE-ALL-BUTTON-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (UI, nowa funkcja)
TEMAT: R-WEB-UI-CITY-UPGRADE-ALL-BUTTON-Q1
GOAL: w nagłówku sekcji „Ulepsz” panelu miasta przycisk „Ulepsz wszystko”, który dodaje do kolejki wszystkie aktywne ulepszenia tą samą ścieżką co pojedynczy „Ulepsz”.
ZMIANY-COMMIT: `gra/src/ui/cityPanel.ts` (jedyny zmieniony plik; baza 2d2c425f80babc40d257be3324e88f1d898d9000). SHA commita w polu sha zwróconym przez Operatora.
- `addItem` zwraca `boolean` (true = dodano) i przyjmuje `silent` (pomija rerender).
- Nowa `enqueueActiveUpgradeRows(city, items)`: wywołuje `addItem(..., {upgrade: true, silent: true})` dla każdej aktywnej pozycji w kolejności listy; Kup nie jest wołane.
- Nagłówek „Ulepsz” w `renderBuildList`: wiersz flex z napisem i przyciskiem `Ulepsz wszystko` (`btn btn-sm btn-b`). Aktywne = `buildingCanBuildNow` (ta sama wartość, którą dostaje przycisk Ulepsz wiersza). Przycisk wyłączony z tooltipem przy 0 aktywnych.
- Po kliknięciu: jeden `rerender()`; komunikat „Dodano do kolejki: N ulepszeń” (albo „Brak ulepszeń do dodania”) pokazany w następnym renderze (module-level `pendingUpgradeAllMsg`, bo panel jest odtwarzany).
- Brak zmian w produkcji, kosztach, danych JSON, main.ts, ai*.ts.

TESTY:
- `npx tsc --noEmit` (gra/): exit 0.
- `node tools/logic-test.cjs`: LOGIC OK (213/213).
- `node tools/tech-tree-test.cjs`: 20 pass, 0 fail.
- `node tools/research-test.cjs`: PASSED 33 / FAILED 0 / TOTAL 33.
- `node tools/unit-replace-test.cjs`: exit 0 (wszystkie [OK]).
- `node tools/combat-test.cjs`: PASS, All sanity checks passed.
- `node tools/upgrade-budynki-test.cjs` (istniejący test ulepszeń): 60 pass, 1 fail. TEN SAM wynik na bazowym cityPanel.ts (bez zmian Operatora) — niezwiązana regresja zastana w bazie (`stale palisade completion preserves only stronger wall tier and Citadel`), NIE wprowadzona tym tematem.
- NIE_ZMIERZONO: nowy test zachowania (N aktywnych → N w kolejce, pominięcie nieaktywnych, brak Kup, brak dubli przy ponownym kliku) — NIE napisany w tej rundzie.
- NIE_ZMIERZONO: mutacja w kopii pliku (test czerwieniejący) — brak testu, więc brak mutacji.
- NIE_ZMIERZONO: zrzuty PRZED/PO z żywego Chromium (dowody/) — nie wykonane.
- `npm ci --ignore-scripts` wykonane w worktree (bez `npm run build/dev`).

BLOKADY:
- Brak testu behawioralnego i brak dowodu wizualnego. Wygląd przycisku nie został zweryfikowany; kod jest typowany i przechodzi bramki, ale zachowanie kliknięcia w UI NIE ZOSTAŁO ZMIERZONE.
- Zastana regresja `upgrade-budynki-test` (1 fail) — do osobnego tematu.

RUNDY: 1/5
NASTĘPNY KROK: runda 2 (Operator): napisać `gra/tools/city-upgrade-all-button-test.cjs` (jsdom lub Chromium, hak do renderBuildList/cityPanel) z przypadkami z GOAL (3), wykonać mutację w kopii (usunięcie wywołania `enqueueActiveUpgradeRows`) i zapisać zrzuty PRZED/PO do `dowody/`; potem Evaluator.
DEPLOY/PUSH: NIE WYKONANO
