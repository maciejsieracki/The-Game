# R-WEB-ADMIN-PANSTWO-PANEL-AND-NAMES-Q1 — raport Operatora (runda 3/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ADMIN-PANSTWO-PANEL-AND-NAMES-Q1 (#327)
GOAL: (1) panel Państwa pokazuje administratora państwa i jego stan; (2) w tekstach gracza tylko „administrator państwa” (ulepszenia, całe Państwo) i „administrator miasta” (budynki w jednym mieście), bez starej nazwy i bez mieszania zakresów.
BAZA: kandydat 7fa2da030 (FC r2 + obrona r3). Kod tej rundy: c7d5c9677 (4 pliki, tylko napisy i wiki).

## ZMIANY/COMMIT
- c7d5c9677 — rozszerzenie allowlisty DODATKU r3, tylko napisy:
  - docs/encyklopedia/pojecia/administrator-ulepszen.md: tytuł „Administrator państwa”, Wiki-S (jedna osoba na całe Państwo, auto-ulepszenia we wszystkich miastach Państwa), Wiki-M (chip „Administrator państwa”, przycisk „Administrator państwa +”), zakres „w danym/tym mieście” → „we wszystkich miastach Państwa”, „Administratorzy” — nazwa państwa. Id `administrator-ulepszen` i marker `{{ikona-administratora-ulepszen}}` bez zmian (linki i testy ikon).
  - docs/encyklopedia/indeks.md:131: wpis „Administrator państwa” (link do pliku bez zmiany ścieżki).
  - gra/data/ui-params.json:311: „Możesz zatrudniać administratora państwa i administratorów miast (koszt ze skarbca państwa); …” — tylko napis opcji.
  - gra/src/data/wikiBundle.json: 1 linia, wygenerowana przez `node gra/tools/bundle-wiki-for-game.cjs` (wynik: „22 rozdz. + 174 haseł”); `git diff --stat` na tym pliku: 1 linia, bez dryfu poza nazwami.
- Kod gra/src (main.ts, ui/, game/) i testy gra/tools: BEZ ZMIAN w tej rundzie. Stan po r1–r2 już spełnia skany (patrz TESTY). Pięć testów z r3 (admin-panstwo-city-gate, administrators-wizard, improvement-administrator, live-verify-administrator-panel, live-verify-improvement-administrator) nie zawiera już starej nazwy (skan `grep -i` = 0 trafień), więc nie wymagały edycji asercji.
- Pliki zmieniane przez testy przeglądarkowe (zrzuty PNG w dyspozycje/.../R-WEB-UI-IMPROVEMENT-ADMIN-TOOLTIP-Q1/evidence) przywrócone `git checkout` — nie są częścią commita.
- `git diff --check`: bez uwag. `git add` tylko 4 ścieżki (nie -A).

## TESTY (surowe wyniki, na c7d5c9677, uruchomione w gra/ po `npm ci --ignore-scripts`: NPMCI_EXIT=0)
- `node node_modules/typescript/bin/tsc --noEmit` → TSC_EXIT=0 (bez wyjścia).
- `node tools/logic-test.cjs` → „LOGIC OK (213/213)”, exit 0.
- `node tools/tech-tree-test.cjs` → „tech-tree-test: 20 pass, 0 fail”, exit 0.
- `node tools/research-test.cjs` → „PASSED: 33 / FAILED: 0 / TOTAL: 33”, „ALL GREEN”, exit 0.
- `node tools/unit-replace-test.cjs` → „WSZYSTKIE TESTY ZIELONE (21/21)”, exit 0.
- `node tools/combat-test.cjs` → „COMBAT TEST: 6/6 pass”, exit 0.
- `node tools/admin-panstwo-panel-names-test.cjs` → „trafienia: 0”, „admin-panstwo-panel-names-test: 24 pass, 0 fail”, exit 0. Mutacje realne (cityPanel.ts, buildModeHud.ts) wykrywane i przywracane bajt po bajcie.
- Skan starej nazwy (`administrator\S* ulepsze(ń|n) `) w docs/encyklopedia, gra/src/data/wikiBundle.json, gra/data, gra/tools → 0 trafień.
- `node tools/admin-panstwo-city-gate-test.cjs` → „RESULT: 36 passed, 0 failed”, exit 0.
- `node tools/improvement-administrator-test.cjs` → „59 passed, 0 failed”, exit 0.
- `node tools/administrators-wizard-test.cjs` → „58 passed, 0 failed”, exit 0.
- `node tools/administrator-panel-real-render-test.cjs` (Chromium) → „48 PASS / 0 FAIL”, exit 0.
- `node tools/improvement-admin-tooltip-real-render-test.cjs` (Chromium) → „14 pass, 0 fail”, exit 0.
- `node tools/administrator-icon-everywhere-render-test.cjs` (Chromium) → „24 PASS, 0 FAIL”, exit 0.
- NIE_ZMIERZONO: live-verify-administrator-panel.cjs i live-verify-improvement-administrator.cjs — wymagają żywej gry z działającym serwerem (poza zakresem tej sesji); nie uruchamiano. Ich asercje nie zawierają starej nazwy (skan).

## WYNIK KRYTERIÓW KOŃCA (DODATEK r3)
- tsc 0 — SPEŁNIONE.
- 5 bramek z surowym wyjściem — SPEŁNIONE (213/213, 20/0, 33/0, 21/21, 6/6).
- admin-panstwo-panel-names-test 0 FAIL — SPEŁNIONE (24/0).
- 0 trafień starej nazwy w gra/src (non-comment), gra/data, gra/tools, docs/encyklopedia i wikiBundle — SPEŁNIONE (patrz ZAŁOŻENIE 1 dla komentarzy).
- mutacja starej nazwy czerwieni test — SPEŁNIONE (sekcja 3 testu, mutacje realne).
- administrator-panel-real-render, improvement-administrator, administrators-wizard, admin-panstwo-city-gate — 0 FAIL — SPEŁNIONE.
- Chromium tooltip/icon — SPEŁNIONE (14/0, 24/0). live-verify — NIE_ZMIERZONO (z powodem jw.).

## BLOKADY
Brak blokad technicznych. Dwie pozycje do decyzji FC/orkiestratora (poza allowlistą r3, nie zmieniane):
1. docs/encyklopedia/pojecia/administrator-miasta.md:29 — „**Opcja „Administratorzy”:** administratorów (miast i ulepszeń terenu) włączasz…”. Nie zawiera frazy „administrator ulepszeń”, więc nie łamie kryterium, ale miesza zakresy (ulepszenia terenu to administrator państwa). Propozycja: zmienić na „administratorów miast i państwa” w tym pliku (wymaga dopisania do allowlisty) i regeneracji wikiBundle.
2. Komentarze kodu ze starą nazwą (np. main.ts:8875, 10208, 10386–10387, 10343; city-administrator.ts; administratorIcon.ts:32) — zgodnie z testem (isCommentLine) nie są tekstem dla gracza; nie zmieniane.

## RUNDY
Runda 3/5 (Operator, HAIKU). Poprzednie: r1 (a0c19494a / 4872980e0), r2 (2c6b0d33a / 7fa2da030 obrona). Zarzuty FC r2 Z1 (wiki) i Z3 (ui-params) — usunięte w tej rundzie; Z4 — zgodnie z decyzją (lider państwa hardcoded, liczby z JSON sprawdzane); Z5 (testy poza allowlistą) — nieaktualne, testy nie zawierają starej nazwy.

## ZAŁOŻENIA (luki rozstrzygnięte w raporcie)
1. Kryterium „0 trafień w gra/src” rozumiem jako: linie niebędące komentarzem (zgodnie z isCommentLine w teście). Komentarze ze starą nazwą pozostają historyczne.
2. Wiki-M w indeksie/hasle: „w panelu ulepszeń (tryb budowy 🔨)” — miejsce zatrudnienia wg testów live-verify-improvement-administrator i buildModeHud (przycisk „Administrator państwa +/✓”), a stan państwa w panelu Państwa.
3. Plik `administrator-ulepszen.md` i jego id pozostają (zmiana pliku złamałaby linki i marker ikony).

## NASTĘPNY KROK
Evaluator → Final Control na c7d5c9677 (kod = commit c7d5c9677; raport ten commit). Decyzja orkiestratora: czy domknąć pozycję 1 (administrator-miasta.md) w tym tematu czy jako osobny R-WEB-*.

DEPLOY/PUSH: NIE WYKONANO
