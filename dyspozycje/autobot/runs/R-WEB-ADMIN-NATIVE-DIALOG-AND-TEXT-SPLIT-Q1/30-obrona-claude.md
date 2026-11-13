# R-WEB-ADMIN-NATIVE-DIALOG-AND-TEXT-SPLIT-Q1 — obrona Operatora (runda 1, odpowiedź na zarzuty Evaluatora)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ADMIN-NATIVE-DIALOG-AND-TEXT-SPLIT-Q1
GOAL: Zatrudnienie i zwolnienie administratora bez natywnego okna przeglądarki; teksty administratora ulepszeń i miasta rozdzielone; koszt zatrudnienia i brak zwrotu widoczne w panelu (zgodnie z DODATKIEM orkiestratora).
BAZA: f0853a6cc (origin/main). Kandydat Operatora: 17b1b401d. Poprawka obrony: 9cd5ef5b8.
ZMIANY-COMMIT: 9cd5ef5b8 — `gra/src/ui/administratorPanel.ts` (1 linia: koszt jednorazowy i nie wraca), `gra/tools/administrator-panel-real-render-test.cjs` (+3 asercje A11e–A11g). Brak zmian w mechanice.

## Odpowiedzi na zarzuty Evaluatora

### Zarzut 1 (koszt i brak zwrotu tylko po zatrudnieniu) — PRZYJMUJĘ
- Stan przed poprawką: zdanie „koszt zatrudnienia nie wraca” było tylko w gałęzi `m.hired` (`effectRows`, `data-adm-effect="dismiss"`). W stanie niezatrudnionym koszt był pokazany (`data-adm-cost`, „Zatrudnienie (jednorazowo)”), ale bez informacji o braku zwrotu.
- Poprawka: w `gra/src/ui/administratorPanel.ts` (gałąź niezatrudniony, `data-adm-effect="after"`) dopisane zdanie: „Koszt zatrudnienia jest jednorazowy i po zwolnieniu nie wraca.” Liczba wierszy efektów bez zmian.
- Dowód: nowe asercje renderowane w Chromium `A11e` (ulepszenia) i `A11f` (miasto) — oba PASS, sprawdzają `/nie wraca/` w `[data-adm-effects]` przed kliknięciem „Zatrudnij”.
- Uwaga: klik „Zatrudnij” nadal wydaje Pieniądz bez okna potwierdzenia (wymóg: brak natywnego okna). Potwierdzeniem jest przycisk w panelu, a koszt i brak zwrotu są opisane przed kliknięciem.

### Zarzut 2 (test tekstu miasta tylko statyczny) — PRZYJMUJĘ
- Dodane w `gra/tools/administrator-panel-real-render-test.cjs` (blok po A11d): `A11g` sprawdza WYRENDEROWANY `[data-adm-lead]` administratora miasta: zawiera „budynku administracyjnego” i nie zawiera „ulepszani/wycink/farm”. PASS.
- Statyczny test `admin-hire-no-native-dialog-test.cjs` pozostaje (wykrywa mutacje źródła), ale nie jest już jedynym dowodem dla tekstu miasta.
- Zakres reguły B (bonusRows) nadal obejmuje tylko pierwszy `return` w gałęzi ulepszeń; dla wyrenderowanego ulepszeń działa asercja A3 (bez produkcji/podatków/korupcji/budynków).

### Zarzut 3 (zwolnienie jednoetapowe, bez potwierdzenia w grze) — ODRZUCAM (wybór operatora, dispatch to dopuszcza)
- Dowód: dispatch (GOAL a) i DODATEK orkiestratora (Zwolnienie): „potwierdzenie ma być w grze … albo wyłącznie przycisk „Zwolnij” z jednoznacznym tekstem; wybór z uzasadnieniem w raporcie”.
- Wybór: wyłącznie przycisk „Zwolnij” (czerwony, w panelu, widoczny w stanie zatrudnionym), a treść panelu przed kliknięciem mówi „koszt zatrudnienia nie wraca” (asercja A13b PASS w Chromium: `beforeDismiss.warnsNoRefund === true`).
- Uzasadnienie: dodatkowe okno potwierdzenia w grze (istniejący komponent) dublowałoby przycisk w panelu; dispatch pozwala na wariant bez okna. Ryzyko UX (jednym kliknięciem) zgłaszam jako decyzję właściciela, nie zmieniam kodu.

### Zarzut 4 (dispatch nieobecny na origin/main; PNG nadpisane przez testy) — PRZYJMUJĘ jako informację
- Dispatch i DODATEK są na gałęzi `claude/sprawdzenie-funkcjonalnosci-ek4ra0` (potwierdzone `git show`).
- KOREKTA (po sprawdzeniu git status): test `improvement-admin-tooltip-real-render-test.cjs` nadpisał 3 zrzuty `R-WEB-UI-IMPROVEMENT-ADMIN-TOOLTIP-Q1/evidence/*.png` mimo braku `ADM_PANEL_SHOTS_DIR`. Przywrócono je `git checkout` przed commitem; w commitach obrony nie ma zmian PNG (`git status` czysty poza kodem i raportem). Wcześniejsza wersja tego punktu, twierdząca że zrzuty są nietknięte, była błędna.

## TESTY (dokładne wyniki z surowego wyjścia, na 9cd5ef5b8)

- `npx tsc --noEmit` — exit 0 (oddzielnie sprawdzony kod wyjścia, nie tail).
- `node tools/logic-test.cjs` — exit 0; ostatnia linia: `PASS  [213] cityfix: pop1 territory radius is 5 (B min start)`.
- `node tools/tech-tree-test.cjs` — exit 0; `tech-tree-test: 20 pass, 0 fail`.
- `node tools/research-test.cjs` — exit 0; `PASSED: 33 / FAILED: 0 / TOTAL: 33`.
- `node tools/unit-replace-test.cjs` — exit 0; ostatnia linia: `[OK] cross-type melee matrix passes for all 15 civilizations; no ranged/mount/siege/civilian/naval leak`.
- `node tools/combat-test.cjs` — exit 0; `All sanity checks passed.`
- `node tools/admin-hire-no-native-dialog-test.cjs` — exit 0; `== WSZYSTKO ZIELONE ==` (reguły A–D + 5 mutacji wykryte).
- `node tools/administrator-panel-real-render-test.cjs` (Chromium) — exit 0; `52 PASS / 0 FAIL` (w tym nowe A11e, A11f, A11g; A11d = 0 natywnych okien; E8/E9 mutacje window.confirm czerwienią test).
- `node tools/improvement-administrator-test.cjs` — exit 0; `59 passed, 0 failed`.
- `node tools/city-administrator-test.cjs` — exit 0; `119 passed, 0 failed`.
- `node tools/admin-panstwo-panel-names-test.cjs` — exit 0; `26 pass, 0 fail`.
- `node tools/improvement-admin-tooltip-real-render-test.cjs` (Chromium) — exit 0; `14 pass, 0 fail`.

Brak `window.confirm`/`alert`/`prompt` w `gra/src/ui/administratorPanel.ts` (potwierdzone regułą A w teście statycznym).

## BLOKADY
- Brak.

## NIE_ZMIERZONO
- Prawdziwy tryb pełnoekranowy w przeglądarce użytkownika (Chromium headless nasłuchuje zdarzeń `dialog`; wizualnego wyjścia z pełnego ekranu nie sprawdzono).
- Pełny przepływ w uruchomionej grze (testy używają mocków hooks dla `openAdministratorPanel`).
- Zachowanie `buildModeHud.ts` i `cityPanel.ts` w przeglądzie teksów (nie zmieniano w tej rundzie; wcześniejsze wyniki z 17b1b401d nie były kwestionowane zarzutami).

## RUNDY
1/5 (obrona). Ostatni werdykt Evaluatora: PASS-WITH-NOTES, zarzuty 1–4 jak wyżej.

## UWAGI-DLA-ORKIESTRATORA
- Zwolnienie administratora jednym kliknięciem „Zwolnij” bez potwierdzenia w grze: decyzja właściciela (ryzyko UX, nieodwracalne).
- Poza zakresem (nie ruszane): natywne okna `main.ts:9367`, `main.ts:25930`, `saveLoadDialog.ts:346`, `empireDetailPanel.ts:1529`, `cityPanel.ts:12135` — osobny temat.
- Repo: w worktree wykonano `npm ci --ignore-scripts` w `gra/` (node_modules, ignorowane przez git). Nie uruchamiano `npm run build/dev`.

## NASTĘPNY KROK
Evaluator r2 na 9cd5ef5b8 (sprawdzenie zarzutów 1–2 i odpowiedzi 3–4), potem Final Control.

DEPLOY/PUSH: NIE WYKONANO
