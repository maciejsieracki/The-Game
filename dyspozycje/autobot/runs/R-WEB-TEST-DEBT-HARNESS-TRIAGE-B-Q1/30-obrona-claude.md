# R-WEB-TEST-DEBT-HARNESS-TRIAGE-B-Q1 — obrona (odpowiedzi na zarzuty Evaluatora)

STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS
TEMAT: R-WEB-TEST-DEBT-HARNESS-TRIAGE-B-Q1
GOAL: na każdy zarzut Evaluatora odpowiedzieć PRZYJMUJĘ (poprawka + dowód + commit) albo ODRZUCAM (dowód); zostawić `gra/src` i `gra/data` nietknięte.
BAZA: d59bd7a5a5e988f3c315d5a4f865dccb9d80a4c4 (origin/main, ancestor OK); kandydat startowy 0c24487a37a7d0c92f01b094a2dfc48b5016b8ed.
KOD OBRONY: e84b5798d3bf1709b3e1ff17ae07cd6f9460ab54 (tylko `gra/tools/*.cjs`; `git diff origin/main -- gra/src gra/data` = PUSTY).

## Odpowiedzi na zarzuty

1. **recruit-list-order-by-era — PRZYJMUJĘ (klasa a, fixture/sonda).** Odtworzone: `18 pass / 1 fail` przed poprawką, dowód: `cityPanel.ts:9569` tworzy dla `noInnerScroll` węzeł `div.unit-recruit-list-full`, a sonda szukała `.list-scroll`. Poprawka: sonda szuka `.list-scroll, .unit-recruit-list-full` i sprawdza „pierwszy wiersz w liście bez wewnętrznego przewijania” (`scrollTop === 0` oraz `scrollHeight <= clientHeight + 1`). Wynik po poprawce: `=== recruit-list-order-by-era-test: 18 pass, 0 fail ===`, exit 0. Mutacja: NIE WYKONANO (zmiana tylko selektora i warunku; brak mutacji dla tej poprawki w tej rundzie).

2. **recruitment-panel-compact-row — PRZYJMUJĘ (klasa a, przyczyna ZBADANA).** Przyczyna z dowodem: fixture to Grecja (`grecy`), epoka 3, wszystkie techy odblokowane. `purchasableUnits` (`src/game/production.ts` ~1205–1214) ukrywa jednostkę ogólną, gdy `civHasReplacementFor` widzi narodową jednostkę z `W zamian za` = ta jednostka. W `units.json` dla Grecji są trzy takie relacje: Falanga → zastępuje Włócznik; Wojownik mykeński → zastępuje Wojownik z mieczem i tarczą; Rydwan mykeński → zastępuje Rydwan konny. Zmierzona lista 9 wierszy: Konnica, Hieros Lochos (Święty Zastęp), Falanga, Thorakites, Rydwan mykeński, Wojownik mykeński, Galera, Procarz, Zwiadowca. 9 + 3 ukryte = 12, czyli dawny próg 12 był nieaktualny (zachowanie zamierzone, nie błąd kodu). Poprawka w teście: próg wierszy 12 → 9 (z komentarzem o trzech zastąpieniach), K2 `first13Visible >= min(12, rowCount)`, K5 `rowCount >= 9`. Wynik: `exit 0`, 39 PASS (przed: `exit 1`, 9 wierszy, K2 9/12, K5 `rowCount 9`). Mutacja: NIE WYKONANO.

3. **tech-discovery-badge-diorama — PRZYJMUJĘ część (c1, klasa a); ODRZUCAM redukcję B2 (klasa b, do orkiestratora).**
   - c1 (`=== 190` dla domyślnej karty budynku): PRZYJĘTE jako nieaktualne. `renderer.ts:1252` ma regułę `.entity-card-building .entity-card-diorama{height:auto;...}` z commita `dacae1798` („fix: integrate building and recruitment card fixes”, własny test `building-card-overlap-real-render-test`). Zmierzone 209 px to wysokość z treści, nie stała 190. Nowa asercja: reguła `height:auto` jest w `ENTITY_CARD_CSS` i wysokość karty ≠ 226 px sceny popupu (`techDiscoveryNotice.ts:889`). Wynik: c1 PASS.
   - B2 `[Hutnictwo żelaza] kind:preview`: pozostaje CZERWONE. Dowód: `worst 7 px` (limit 4 px, `GROUND_EDGE_TOLERANCE_PX`); przecięcie z elipsą gruntu: „Podgląd technologii” 120×7 px i „Informacja” 58×7 px. To defekt układu w `gra/src` (`techDiscoveryNotice.ts`, odznaki `tdn-badge`, ~325–333), nie asercja przestarzała: tolerancja ≤4 px jest zapisana w nagłówku testu jako intencja. Naprawa w `src` jest poza zakresem tematu (zakaz `gra/src`), więc klasa (b), bez poprawki. Wynik: `62 PASS, 1 FAIL` (przed: `61 PASS, 2 FAIL`).

4. **szczescie-przebudowa-skali — PRZYJMUJĘ inwentaryzację (klasa a dla liczności; klasa e dla sum epok).** Różnica 41 → 44 jest w pełni wyjaśniona przez `git log`:
   - `918e59933` (R-BUDYNEK-GARNIZON-NOWY-Q1, 2026-09-06) dodał `garnizon` (epoka 1) — to jest brakujące +1 względem stanu 41 z `04660f9d1` (moment napisania testu); stan w `a53bda0af` = 42.
   - `0bf194d76` dodał `mury_kamienne` (epoka 1), `c80f39cf0` dodał `emporion` (epoka 2) — 42 + 2 = 44.
   - Wszystkie trzy mają `dajeSzczescie=false` w `buildings.json`, więc trafiły do grupy NIE (zero szczęścia). Poprawka: lista NIE 22 → 25 (z komentarzem o trzech commitach), katalog 41 → 44. Asercja 2a (każdy NIE daje dokładnie 0) nadal działa dla nowych pozycji. Wynik: `532 OK, 3 FAIL` (przed: `516 OK, 4 FAIL`).
   - Pozostałe 3 FAIL (`2b`: komplet 11/23/31 vs zmierzone 12/24/32): to cele właściciela z `BALANS-SZCZESCIE-SKALOWANIE-EPOK.md`, nie wynik kodu. Czy nowe budynki wchodzą do „kompletu” — decyzja właściciela (klasa e). NIE ZMIENIANO.

5. **tsc i pięć bramek referencyjnych — PRZYJMUJĘ, uruchomione (ZMIERZONO).** Surowe wyniki w worktree po commicie `e84b5798d`:
   - `node ./node_modules/typescript/bin/tsc --noEmit` → exit 0 (log pusty poza zerowym kodem);
   - `node tools/logic-test.cjs` → `LOGIC OK (213/213)`, exit 0;
   - `node tools/tech-tree-test.cjs` → `tech-tree-test: 20 pass, 0 fail`, exit 0;
   - `node tools/research-test.cjs` → `PASSED: 33 / FAILED: 0 / TOTAL: 33`, exit 0;
   - `node tools/unit-replace-test.cjs` → `WSZYSTKIE TESTY ZIELONE (21/21)`, exit 0;
   - `node tools/combat-test.cjs` → `COMBAT TEST: 6/6 pass`, exit 0.

6. **newgame-menu-reorder-layout-test (mutacja „zabrakło czasu”) — ZAAKCEPTOWANE jako NIE WYKONANO, bez poprawki w tym temacie.** Nie dotykałem tego testu w tej rundzie; wynik (exit 0, 6 konfiguracji) przyjmuję z raportu Evaluatora, bez nowej mutacji. Commit `ae600d5ed` nie był przeze mnie weryfikowany. Mutacja NIE WYKONANO.

7. **Uboczny efekt PNG w `R-WEB-NEWGAME-MENU-REORDER-Q1/evidence` — PRZYJMUJĘ jako ostrzeżenie dla integratora.** W tej rundzie nie uruchamiałem tego testu. Moje uruchomienia (compact-row, recruit-list, tech-discovery, szczescie) nie zmieniły żadnego pliku poza czterema `gra/tools/*.cjs`: `git status` po nich pokazuje tylko te cztery pliki (przed commitem), a PNG-ów nie ma. Nie sprawdziłem `git diff --check` po uruchomieniach z PNG, bo ten test nie był uruchamiany.

## Zmiany (commit `e84b5798d`)
- `gra/tools/recruit-list-order-by-era-test.cjs` — selektor kontenera panelu Armii + warunek bez przewijania.
- `gra/tools/recruitment-panel-compact-row-test.cjs` — próg 12 → 9 z uzasadnieniem (3 zastąpienia narodowe), K2/K5.
- `gra/tools/tech-discovery-badge-diorama-test.cjs` — c1 zgodne z regułą `height:auto` budynku; B2 bez zmian.
- `gra/tools/szczescie-przebudowa-skali-test.cjs` — lista NIE +3 pozycje (garnizon, mury_kamienne, emporion), katalog 41 → 44.

## Wynik końcowy testów (po poprawkach, surowe)
| test | przed | po |
|---|---|---|
| recruit-list-order-by-era-test | exit 1 (17/1) | exit 0 (18/0) |
| recruitment-panel-compact-row-test | exit 1 (9 wierszy) | exit 0 (39 PASS) |
| tech-discovery-badge-diorama-test | exit 1 (61/2) | exit 1 (62/1) — B2 klasa (b) |
| szczescie-przebudowa-skali-test | exit 1 (516/4) | exit 1 (532/3) — 2b klasa (e) |

## Klasy po obronie (część B, 9 testów)
- (a) naprawione w tym temacie: recruit-list-order-by-era (sonda), recruitment-panel-compact-row (liczba ukrytych zastąpień), tech-discovery c1 (reguła budynku), szczescie inwentaryzacja (+3 pozycje).
- (b) do orkiestratora, bez poprawki: tech-discovery B2 (odznaka 120 px, przecięcie 7 px z elipsą gruntu; limit 4 px). Repro: `node tools/tech-discovery-badge-diorama-test.cjs` (linia B2, `worst 7`).
- (e) decyzja właściciela: szczescie 2b (komplet 11/23/31 vs 12/24/32 — czy nowe budynki wchodzą do kompletu).
- Mutacje: NIE WYKONANO dla wszystkich czterech poprawek (klasa a, asercje jednoznaczne; brak czasu na pełne mutacje w tej rundzie).

## Pozostałe uwagi
- Nie wykonywano `npm run build`/`dev`; `gra/node_modules` zainstalowane `npm ci` w tym worktree (nieśledzone); `gra/` build nie był potrzebny.
- Nie ma plików do sprzątania w katalogu głównym repo; logi są w `/tmp/triageB-defense-*.log` (do sprzątania przez orkiestratora).

RUNDY: 2/5 (runda 1 = Operator, runda 2 = obrona; zarzuty Evaluatora r1 obsłużone)
NASTĘPNY KROK: Evaluator (ponowna ocena: 4 testy po poprawkach; B2 tech-discovery i 2b szczescie jako klasy b/e do orkiestratora); potem integracja orkiestratora.
DEPLOY/PUSH: NIE WYKONANO
