# R-WEB-ADMIN-PANSTWO-PANEL-AND-NAMES-Q1 — raport Operatora (runda 2/5)

STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-WEB-ADMIN-PANSTWO-PANEL-AND-NAMES-Q1 (#327)
GOAL: (1) panel Państwa pokazuje administratora państwa i jego stan; (2) w tekstach gracza tylko „administrator państwa” (ulepszenia, całe Państwo) i „administrator miasta” (budynki w mieście), bez starej nazwy „administrator ulepszeń”.
BAZA: kandydat 2c6b0d33a0281c586102eb2f65d1108d9d4178d0 (origin/main, runda 1 + obrona r2).
KOD RUNDY 2: 11f9d198b (commit z kodem, tylko jawne ścieżki, bez `git add -A`). Raport: commit po nim (czubek pracy = SHA z pola sha).

## ZMIANY / COMMIT
Commit 11f9d198b — zmiana wyłącznie napisów i asercji na napisy (bez reguł, kosztów, progów, liczb w JSON):
- gra/src/main.ts — powiadomienia administratora państwa (ok. 10222–10225: „Administrator państwa odszedł / nie pracuje / wrócił do pracy”, zakres: państwo), komentarz 10343, 7× `showHintMessage('Wymaga administratora państwa')` (27127–27213), powiadomienie migracyjne (47870–47876: „Auto-ulepszenia terenu wymagają administratora państwa”).
- gra/src/game/auto-build-gate.ts:112 — AUTO_IMPROVE_NEEDS_ADMINISTRATOR_HINT = „Auto-ulepszenia terenu wymagają działającego administratora państwa (jeden na całe Państwo)” (usunięto „w tym mieście”, zgodnie z zasadą zakresu).
- gra/src/game/city-administrator.ts:189 — „Państwo ma już administratora państwa” (blokada zatrudnienia to stan państwa: `ownerHasStateImprovementAdministrator`, linia 422).
- gra/data/city-administrator-params.json — pole `opis_gracza` (administrator_ulepszen): „Administrator państwa (jeden na całe Państwo) pozwala wyłącznie na automatyczne ulepszanie terenu we wszystkich miastach Państwa …” (liczby bez zmian); notatka `_opis` (linia 23): tylko nazwa w tekście „administrator państwa nie ma budynku administracyjnego”.
- Testy przeglądarkowe (asercje na napisy): gra/tools/administrator-panel-real-render-test.cjs (A2 i [data] — asercja na zakres państwa zamiast JSON „w tym mieście”; etykiety), gra/tools/improvement-admin-tooltip-real-render-test.cjs (regex podpowiedzi: „wymagają działającego administratora państwa (jeden na całe Państwo).”), gra/tools/administrator-icon-everywhere-render-test.cjs (etykiety chipów).
- Poza wprost wymienioną allowlistą (patrz BLOKADY 2): gra/tools/admin-panstwo-city-gate-test.cjs, administrators-wizard-test.cjs, improvement-administrator-test.cjs, live-verify-administrator-panel.cjs, live-verify-improvement-administrator.cjs — zmieniono WYŁĄCZNIE opisy testów (labele `ok(...)`) i asercje na napisy w live-verify; logika testów nietknięta.
- gra/tools/admin-panstwo-panel-names-test.cjs — skan rozszerzony o wszystkie gra/tools/*.cjs (poza sobą) oraz data/city-administrator-params.json i src/data/wikiBundle.json.
- Nie zmieniano: reguł administratora, kosztów, progów, auto-ulepszeń, WERSJE.md, gra-robocza/, rust-port/, nazw kluczy JSON (`administrator_ulepszen`), wikiBundle.json (patrz BLOKADY 1).
- Pliki dowodowe dyspozycje/.../R-WEB-UI-IMPROVEMENT-ADMIN-TOOLTIP-Q1/evidence/*.png, nadpisywane przez uruchomiony test przeglądarkowy, przywrócone `git checkout` (NIE są w commicie).

## TESTY (surowe wyniki, kod 11f9d198b, uruchomione w gra/)
- `npm ci --ignore-scripts` → NPMCI_EXIT=0 (tylko ostrzeżenia audytu).
- `node node_modules/typescript/bin/tsc --noEmit` → TSC_EXIT=0 (bez wyjścia).
- `node tools/logic-test.cjs` → „LOGIC OK (213/213)”, exit 0.
- `node tools/tech-tree-test.cjs` → „tech-tree-test: 20 pass, 0 fail”, exit 0.
- `node tools/research-test.cjs` → „PASSED: 33 / FAILED: 0 / TOTAL: 33”, „ALL GREEN”, exit 0.
- `node tools/unit-replace-test.cjs` → „[unit-replace-test] WSZYSTKIE TESTY ZIELONE (21/21)”, exit 0.
- `node tools/combat-test.cjs` → „COMBAT TEST: 6/6 pass”, exit 0.
- `node tools/admin-panstwo-panel-names-test.cjs` → „admin-panstwo-panel-names-test: 23 pass, 1 fail”, exit 1. Jedyny FAIL: „brak starej nazwy „administrator ulepszeń” w tekstach gry (trafienia: 1 — src/data/wikiBundle.json:1)”. Wszystkie pozostałe asercje PASS, w tym: mutacja realna stara nazwa w cityPanel.ts i buildModeHud.ts wykrywana, przywrócenie bajt po bajcie PASS, skan gra/src, gra/data i gra/tools bez trafień poza wikiBundle.
- Testy przeglądarkowe (Chromium, headless, uruchomione w tej sesji):
  - `administrator-panel-real-render-test.cjs` → „48 PASS / 0 FAIL”, exit 0 (w r1 kod: 46/2; dwie asercje zaktualizowane, patrz ZAŁOŻENIA 6).
  - `improvement-admin-tooltip-real-render-test.cjs` → „14 pass, 0 fail”, exit 0.
  - `administrator-icon-everywhere-render-test.cjs` → „24 PASS, 0 FAIL”, exit 0.
- Testy node z zmienionymi labelami: `admin-panstwo-city-gate-test` → „36 passed, 0 failed”; `improvement-administrator-test` → „59 passed, 0 failed”; `administrators-wizard-test` → „58 passed, 0 failed” (wszystkie exit 0).
- NIE_ZMIERZONO: `live-verify-administrator-panel.cjs`, `live-verify-improvement-administrator.cjs` — wymagają żywej gry (nie uruchamiano); zmieniono w nich tylko napisy asercji.
- NIE_ZMIERZONO: render panelu Państwa w żywej grze (poza testem przeglądarkowym powyżej).
- `git diff --check` → bez uwag; `git status` po zmianach: tylko pliki z listy ZMIAN.

## WYNIK KRYTERIÓW KOŃCA
- tsc 0 — SPEŁNIONE.
- 5 bramek (logic 213/213, tech-tree 20/0, research 33/0, unit-replace 21/21, combat 6/6) — SPEŁNIONE.
- admin-panstwo-panel-names-test 0 FAIL — NIESPEŁNIONE: 1 FAIL (wikiBundle.json, 10 wystąpień starej nazwy w jednej linii JSON; patrz BLOKADY 1).
- mutacja starej nazwy w pliku czerwieni test — SPEŁNIONE (mutacje realne w cityPanel.ts, buildModeHud.ts; skan obejmuje gra/src, gra/data, gra/tools).
- trzy testy przeglądarkowe — SPEŁNIONE (PASS, patrz wyżej).
- raport 10-operator-claude.md z SHA i listą zmienionych napisów — SPEŁNIONE (niniejszy plik).

## LISTA ZMIENIONYCH NAPISÓW (stara → nowa)
- „Administrator ulepszeń odszedł / nie pracuje / wrócił do pracy” → „Administrator państwa odszedł / nie pracuje / wrócił do pracy” (main.ts, zdarzenia wojenne).
- „koniec służby administratora ulepszeń” / „utrzymanie administratora ulepszeń” → „… administratora państwa” (main.ts).
- „Wymaga administratora ulepszeń” (8 miejsc: 7× showHintMessage, 1× buildModeHud/cityPanel już w r1) → „Wymaga administratora państwa”.
- „Auto-ulepszenia terenu wymagają administratora ulepszeń” (tytuł, podpowiedź) → „… administratora państwa”.
- „Auto-ulepszenia terenu w tym mieście wymagają działającego administratora ulepszeń” (auto-build-gate.ts) → „Auto-ulepszenia terenu wymagają działającego administratora państwa (jeden na całe Państwo)”.
- „Miasto ma już administratora ulepszeń” (city-administrator.ts) → „Państwo ma już administratora państwa”.
- opis_gracza (JSON) „Administrator ulepszeń pozwala wyłącznie … w tym mieście” → „Administrator państwa (jeden na całe Państwo) … we wszystkich miastach Państwa”.
- Pozostają bez zmian (zakres miasta, poprawne): „administrator miasta”, „Administrator miasta”, „Zatrudnić administratora (miasta) w mieście X?”.

## BLOKADY (wymagają decyzji orkiestratora)
1. gra/src/data/wikiBundle.json — 10 wystąpień starej nazwy (linia 1). Źródło to docs/encyklopedia/pojecia/administrator-ulepszen.md (tytuł i treść) oraz docs/encyklopedia/indeks.md (wpis linkowy); oba pliki są POZA allowlistą (DODATEK wskazuje wikiBundle tylko „przez istniejący skrypt generacji”, a skrypt gra/tools/bundle-wiki-for-game.cjs czyta docs/encyklopedia). Bez zmiany md regeneracja zostawi stary tekst, a ręczna edycja wikiBundle jest zakazana. Wymagana decyzja: (A) dopisać do allowlisty docs/encyklopedia/pojecia/administrator-ulepszen.md i docs/encyklopedia/indeks.md, po czym Operator r3 zmienia nazwę w md i regeneruje wikiBundle (`node gra/tools/bundle-wiki-for-game.cjs`); albo (B) zaakceptować names-test 1 FAIL jako znany dług i wydzielić temat R-WEB-ADMIN-NAMES-WIKI-Q1. Uwaga: regeneracja może wnieść niezwiązane zmiany, jeśli wikiBundle nie jest zsynchronizowany z docs — nie sprawdzono (poza zakresem r2).
2. Zakres poza wprost wymienioną allowlistą: pięć plików testowych w gra/tools (admin-panstwo-city-gate-test, administrators-wizard-test, improvement-administrator-test, live-verify-administrator-panel, live-verify-improvement-administrator). Zmiany to wyłącznie napisy opisów testów i asercje na napisy. Bez nich kryterium „0 trafień w gra/tools” nie jest spełnialne. Proszę o akceptację (lub wydzielenie).
3. Tekst gracza w gra/src/main.ts i silniku zmieniono także w linii komentarza 10343 (komentarz na końcu linii z kodem). Komentarze całych linii (`//`, `*`) pozostają historyczne, np. main.ts:8875, 10208, 10386–10387 oraz komentarze w city-administrator.ts. Skan testu ich nie liczy (założenie: komentarze nie są tekstem gracza).
4. Ryzyka do potwierdzenia: panel wyboru administratora państwa nie pokazuje już opisu JSON w wersji „w tym mieście” (zgodnie z zaakceptowanym Z4 z r1) — potwierdzić.

## ZAŁOŻENIA (luki rozstrzygnięte w raporcie)
1. Zakres: napisy „administrator ulepszeń” dotyczą stanu państwa (`ownerHasWorkingStateImprovementAdministrator`), więc każdy z nich → „administrator państwa”, a wiersz „W tym mieście” usunięto z podpowiedzi auto-ulepszeń.
2. Powiadomienia zdarzeń (main.ts ~10222) zachowują prefiks nazwy miasta (`${ch.city.name}:`), bo zdarzenie dotyczy konkretnego miasta, którego auto-ulepszenia są wstrzymane; sam tytuł mówi o administratorze państwa.
3. Blokada zatrudnienia „ma_administratora” w city-administrator.ts dotyczy stanu państwa (linia 422), stąd „Państwo ma już administratora państwa”.
4. Klucz JSON `administrator_ulepszen` pozostawiono (zmiana klucza byłaby zmianą kodu, nie napisu).
5. Pole `_opis` w JSON (linia 23) — zmieniono tylko słowo w notatce, nie pole opis_gracza; wymagane dla kryterium „0 trafień w gra/data”.
6. Dwie asercje r1 w administrator-panel-real-render-test (A2 i [data]) sprawdzały stary opis JSON „w tym mieście” w panelu Państwa. Zmieniono je na asercję zakresu państwa („Administrator państwa to jedna osoba na całe Państwo”, „dla wszystkich miast Państwa”, brak „w tym mieście”). Zgodne z zatwierdzonym zakresem, bez osłabiania progów.

## TABELA NAPISÓW DLA WŁAŚCICIELA
Nazwy zatwierdzone: „administrator państwa” (ulepszenia, zasięg całego Państwa) i „administrator miasta” (budynki w mieście). Wszystkie teksty gracza w gra/src/ui, gra/src/main.ts (linie wymienione wyżej), gra/src/game/auto-build-gate.ts, gra/src/game/city-administrator.ts i gra/data/city-administrator-params.json używają tych nazw; stara nazwa pozostaje tylko w wikiBundle.json (BLOKADA 1) i w komentarzach kodu.

## RUNDY
2/5 (Operator, HAIKU). Runda 1 (bed6f969d, kod 4872980e0) i obrona r2 (a0c19494a / 2c6b0d33a) — historia w git.

## NASTĘPNY KROK
Decyzja orkiestratora w sprawie BLOKAD 1–2 (wiki: A albo B; allowlista tools: akceptacja). Po decyzji: Operator r3 (jeśli A) albo Evaluator → Final Control na 11f9d198b.

DEPLOY/PUSH: NIE WYKONANO
