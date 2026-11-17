# 30-obrona-claude — R-WEB-UI-IMPROVEMENTS-LIST-ORDER-BY-TYPE-Q1 (runda 1, Obrona = Operator HAIKU)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-IMPROVEMENTS-LIST-ORDER-BY-TYPE-Q1
GOAL: lista ulepszeń terenu (panel budowy + podpowiedź heksa) w kolejności kanonicznej po 7 typach (22 pozycje), dostępne zawsze na górze; kolejność wyłącznie prezentacyjna.
BAZA: 6ddb8c2d2bafa971751d90d3de47a002bbe1e5f6 (origin/main), kandydat = commit obrony (SHA w polu sha wyniku).
Dispatch: oryginał tematu nie jest w origin/main; czytany z origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0 (`dyspozycje/autobot/runs/R-WEB-UI-IMPROVEMENTS-LIST-ORDER-BY-TYPE-Q1/00-dispatch.md`).

## Odpowiedzi na zarzuty Evaluatora (cde3039041738c4f604b982d6490b9ce985fea07)

- ZARZUT 1 (brak kandydata, diff pusty): PRZYJMUJĘ. Dostarczona zmiana kodu i testu w commitach obrony (diff względem bazy: 3 pliki zmienione + 1 nowy test, patrz ZMIANY-COMMIT). Baza 6ddb8c2d2 nadal = origin/main, zmiana jest ponad nią.
- ZARZUT 2 (brak 00-dispatch.md w origin/main): CZĘŚCIOWO PRZYJMUJĘ. Plik istnieje w gałęzi `claude/sprawdzenie-funkcjonalnosci-ek4ra0` (nie w main). Kryteria i allowlista zostały odczytane z tego pliku i użyte. Wniosek dla orkiestratora: dispatch trzeba wypchnąć do main przed kolejną rundą (to nie robię, bo push na main jest zakazany dla Operatora).
- ZARZUT 3 (brak testu i dowodu RED->GREEN): PRZYJMUJĘ. Dodano `gra/tools/improvements-list-order-test.cjs` (11 asercji) i wykonano mutację — patrz TESTY.

## Co zmieniono

1. `gra/src/game/terrain-improvements.ts`: stała `TERRAIN_IMPROVEMENT_CANONICAL_ORDER` (22 id w kolejności z dispatchu, grupy 1–7), `terrainImprovementOrderRank`, `sortTerrainImprovementsCanonical` (najpierw niezablokowane, potem kolejność kanoniczna; klucz spoza listy na koniec; stabilny; bez mutacji wejścia).
2. `gra/src/ui/buildModeHud.ts`: lista budowy ulepszeń terenu sortowana przez `sortTerrainImprovementsCanonical` zamiast samego `Number(locked)`; import dodany.
3. `gra/src/ui/hexContextTooltip.ts`: lista „możliwe ulepszenia” w podpowiedzi heksa iteruje kolejność kanoniczną zamiast kolejności JSON (limit 10 pozycji liczony już po sortowaniu).
4. `gra/tools/improvements-list-order-test.cjs`: nowy test (część A: kanon = 22 id, pokrycie JSON <-> kanon; część B: komparator).

Reguła „dostępne” nie została zmieniona (nadal `techUnlocked`/`lockHint`, czyli dzisiejszy mechanizm). Nie zmieniono kosztów, bonusów, techów, `units.json`, `WERSJE.md`, `gra-robocza/**`. Silnik i AI nie czytają tej kolejności (zmiana tylko w widoku budowy i tooltipie), więc wybory AI nie zmieniają się — NIE ZMIERZONO bezpośrednio (brak testu AI na tej zmianie; sprawdzone tylko tym, że zmieniona funkcja nie jest importowana przez `ai.ts`/`auto-improvements.ts`).

Nie zrobiono (poza zakresem tej rundy, do decyzji orkiestratora): punkt (5) dispatchu — hasło „Ulepszenia terenu” w Civpedii/wikiBundle nie zostało zmienione, `wikiBundle.json` nie był regenerowany; żywy zrzut Chromium (punkt d) — NIE ZMIERZONO.

## TESTY

- Nowy test: `ESBUILD_MODULE=<esbuild> node tools/improvements-list-order-test.cjs` -> `WYNIK: PASS=11 FAIL=0` (A1–A4, B1–B7).
- Mutacja (zamiana `farma`<->`irygacja` w stałej, przed przywróceniem): `FAIL A1 kanon = 22 id z dyspozycji ...`, `WYNIK: PASS=10 FAIL=1` -> test czerwony. Po przywróceniu pliku: `PASS=11 FAIL=0`. (RED->GREEN dowiedziony na zmianie kolejności dwóch pozycji.)
- Pozostałe bramki referencyjne (uruchomione w worktree przez `node_modules` wskazujący na zewnętrzną instalację esbuild/typescript/three w /tmp; patrz BLOKADY):
  - `tools/logic-test.cjs`: EXIT=0, `LOGIC OK (213/213)`
  - `tools/tech-tree-test.cjs`: EXIT=0, `tech-tree-test: 20 pass, 0 fail`
  - `tools/research-test.cjs`: EXIT=0, `PASSED: 33 / FAILED: 0 / TOTAL: 33`
  - `tools/unit-replace-test.cjs`: EXIT=0, `WSZYSTKIE TESTY ZIELONE (21/21)`
  - `tools/combat-test.cjs`: EXIT=0, `All sanity checks passed.`
- `tsc --noEmit -p gra/tsconfig.json`: 180 błędów (`error TS`) w całym projekcie; ŻADEN nie dotyczy `terrain-improvements.ts`, `buildModeHud.ts` ani `hexContextTooltip.ts`. Wynik bazowy (ta sama liczba na 6ddb8c2d2) NIE ZMIERZONO — brak czystego środowiska bazowego; błędy są środowiskowe (brak typów/zależności w scratch-instalacji).
- `git diff --check`: czysto.
- Chromium / zrzuty listy (punkt d): NIE ZMIERZONO (nie uruchomiono xvfb-run; brak zależności przeglądarkowych w tym środowisku).

## BLOKADY

- Brak `gra/node_modules` w worktree. Użyto zewnętrznej instalacji (typescript, esbuild, three) w katalogu /tmp/claude-0/imp-COqa/node_modules, podpiętej symlinkiem `gra/node_modules` (plik ignorowany przez git, NIE commitowany). Symlink do usunięcia przez orkiestratora przy sprzątaniu.
- Oryginalny 00-dispatch.md nie jest w origin/main (ZARZUT 2).
- Żywa weryfikacja w grze (Chromium) i Civpedia: NIE ZMIERZONO.

## RUNDY

1/5 (obrona po BLOCK Evaluatora r1).

## UWAGI-DLA-ORKIESTRATORA

- Pytanie właściciela o siłę bojownika (units.json) i „uczniów” nie jest częścią tego tematu i nie zostało tu sprawdzone; dane z raportu Evaluatora (Wojownik Kamień: Atak 6 / Uderzenie 4 / Przebicie 0 / HP 60 / Pancerz 4; Wojownik z toporem Brąz: Atak 8 / Uderzenie 6 / Przebicie 8 / HP 100 / Pancerz 2; brak jednostki „uczeń”) nie zostały przeze mnie zweryfikowane — NIE ZMIERZONO.
- Dispatch tematu do wypchnięcia na main (obecnie tylko na gałęzi claude/sprawdzenie-...).
- Sprzątanie: symlink `gra/node_modules` w worktree oraz katalog /tmp/claude-0/imp-COqa.

## NASTĘPNY KROK

Final Control (Sonnet) na commit obrony: sprawdzić `git merge-base --is-ancestor 6ddb8c2d2 <SHA>`, `git diff --stat` (oczekiwane: 3 pliki gra/src + 1 test gra/tools + raport), uruchomić test i bramki z sekcji TESTY, zaakceptować lub zwrócić zarzuty.

DEPLOY/PUSH: NIE WYKONANO
