# 30 — Obrona Operatora r1 (odpowiedź na zarzuty Evaluatora)

STATUS: INTEGRATION_PENDING (poprawki zacommitowane; deploy/push nie wykonywane; integracja po Final Control)
DOMAIN: GAME
TEMAT: R-WEB-IRON-STUD-ADJACENCY-Q1
GOAL: stadnina poza złożem Konia (epoka Żelaza+) tylko na bezpośrednim sąsiedzie ZBUDOWANEJ własnej stadniny; złoże bez zmian; kolejka nie liczy się; parytet gracz/AI/tooltip; stare zapisy zachowane.
BAZA: 261e736de (origin/main). KANDYDAT Operatora startowy: 8f67bbcc4 (zarzuty dotyczą tego SHA).
ZMIANY/COMMIT: SHA końcowy w polu `sha` odpowiedzi orkiestratorowi (commit obrony: patrz `git log -1` na gałęzi roboczej). Allowlista obrony: `gra/tools/stadnina-iron-adjacency-test.cjs` (nowy case 5b), `gra/tools/stadnina-early-eras-ai-picker-test.cjs` (nowy case B2 + parametr `placed`), `gra/tools/stadnina-kon-koszt-live-test.cjs` (1 linia: etykieta asercji toast D). Kod `gra/src/**` NIE zmieniony (`git checkout` po mutacji — zero diffu w src). Brak WERSJE.md, brak gra-robocza/**, brak `git add -A`.

## Odpowiedzi na zarzuty

### Zarzut 1 (własność sąsiada nieudowodniona) — PRZYJMUJĘ
- Poprawka: case `(5b)` w `gra/tools/stadnina-iron-adjacency-test.cjs`. Cel (0,1) własny (w terytorium gracza), sąsiad (1,0) z zbudowaną stadniną, ale należący do obcego właściciela (ownerId 1, poza terytorium gracza). Oczekiwane: NIE. Kontrola: ta sama stadnina w terytorium gracza -> TAK. Dodatkowo asercja na `hasBuiltOwnStudNeighbor`.
- Dowód mutacyjny (surowy wynik): usunięcie `isHexInPlayerTerritoryForState` z `hasBuiltOwnStudNeighbor` (tymczasowo w `src/map/improvement-build.ts`, potem `git checkout --`):
  - przed poprawką testu: mutacja przeżywała (wg Evaluatora 34 OK / 0 FAIL);
  - po poprawce: `[FAIL] cel (0,1) własny, stadnina sąsiada (1,0) w obcym terytorium -> NIE (własność sąsiada)`, `[FAIL] hasBuiltOwnStudNeighbor: obca stadnina sąsiada nie wlicza się (cel własny)`, wynik `=== stadnina-iron-adjacency: 35 OK, 2 FAIL ===`. Mutacja czerwieni.
- Stan bez mutacji po poprawce: `=== stadnina-iron-adjacency: 37 OK, 0 FAIL ===`, exit 0.

### Zarzut 2 (osłabione pokrycie live) — CZĘŚCIOWO PRZYJĘTY, dodatnia ścieżka live ODRZUCONA w tej rundzie
- Fakt: `stadnina-kon-koszt-live-test.cjs` po kandydacie uruchomiony w przeglądarce (Chromium 1194, uruchomienie foreground): `19 pass · 0 fail`, exit 0 (dwa przebiegi: przed i po zmianie etykiety). Sekcje C/D z odmową bez sąsiada przechodzą na realnym `commitBuildRequest`.
- PRZYJĘTE: etykieta asercji toast D była myląca (tekst `"masz 0"`, a sprawdzane `includes('obok')`). Zmieniona na uczciwą etykietę; kwota magazynu w D NIE jest weryfikowana bezpośrednio (NIE_ZMIERZONO).
- ODRZUCONE w tej rundzie: dopisanie w przeglądarce sekcji dodatniej (budowa obok już zbudowanej stadniny + realne odjęcie 50 koni w `commitBuildRequest`). Powód: wymaga wyszukania w grze heksu sąsiedniego do stadniny z zachowaniem warunków terenu/terytorium/bez obywateli, a nie ma na to dowodu zebranego w tej rundzie; dopisanie nieprzetestowanej sekcji live byłoby zgłoszeniem bez dowodu. Luka pozostaje otwarta jako NIE_ZMIERZONO w live; pokrycie silnikowe dodatnie: `stadnina-iron-adjacency-test.cjs` (1)-(4), (7), oraz AI case B2. Decyzja dla Final Control: czy wymagać dodatniego przypadku live przed READY_FOR_DEPLOY.

### Zarzut 3 (brak dodatniego testu AI i testu bez łańcucha; koszt wydajności; kosmetyka komunikatu) — CZĘŚCIOWO PRZYJĘTY
- PRZYJĘTE (test AI dodatni + brak łańcucha): nowy case `(B2)` w `gra/tools/stadnina-early-eras-ai-picker-test.cjs`. Scenariusz: epoka 3, magazyn 50, zbudowana stadnina `1,0` w promieniu miasta `0,0`. Wynik (surowy): `pickAutoImprovements [0,0 0,1 1,-1 1,1 10,1 2,-1 2,0]`, `decideAITurn [same]`. Asercje: >=1 stadnina poza złożem (automat: 6, decideAITurn: 6) i każda stadnina poza złożem na BEZPOŚREDNIM sąsiedzie `1,0` (brak heksu w odległości 2 = brak łańcucha). Wynik: `=== 23 OK, 0 FAIL ===`, exit 0.
  - Uwaga procesowa: pierwsza wersja case B2 używała stadniny `9,0` przy forcie `10,0` i dawała 0 wyborów (w tym scenariuszu AI nie zaproponowało żadnego heksu sąsiada; przyczyna nie została zbadana do końca, prawdopodobnie zasięg kandydatów automatu ograniczony promieniem miasta; zbadane tylko to, że kwalifikator w izolacji (`buildImprovementQualifier`) dawał true dla sąsiadów (9,0)). Zmieniono scenariusz na stadninę w promieniu miasta; test nie został osłabiony.
- NIE_ZMIERZONO (koszt wydajności): `hasBuiltOwnStudNeighbor` przy każdym odświeżeniu tooltipu (main.ts) nie został zmierzony; nie dodano pomiaru.
- ODRZUCONE (kosmetyka komunikatu `getStadninaBuildBlockReason` w epoce 3+): tekst zawsze wspomina sąsiada, nawet gdy brakuje tylko koni. Nie zmieniono: to zmiana treści UI, która nie wpływa na regułę (test E sprawdza tylko próg magazynu i brak sugestii magazynu w epokach 1-2). Do decyzji Final Control/właściciela, czy doprecyzować tekst.

## Testy (surowe wyniki, obrona, po wszystkich zmianach)
- `node ./node_modules/typescript/bin/tsc --noEmit`: exit 0 (w `gra/`, node_modules z `npm ci --ignore-scripts`).
- `node tools/stadnina-iron-adjacency-test.cjs`: `=== stadnina-iron-adjacency: 37 OK, 0 FAIL ===`, exit 0.
- Mutacja (własność sąsiada usunięta z `hasBuiltOwnStudNeighbor`): `35 OK, 2 FAIL`, czerwona; src przywrócony `git checkout --`.
- `node tools/stadnina-early-eras-ai-picker-test.cjs`: `23 OK, 0 FAIL`, exit 0.
- `node tools/stadnina-kon-koszt-live-test.cjs` (Chromium, vite build): `19 pass · 0 fail`, exit 0 (dwa przebiegi).
- `git diff --check`: czysto (brak wyjścia).
- Pozostałe bramki referencyjne i legacy: NIE_ZMIERZONO w tej rundzie (src nie zmieniony względem kandydata, który Evaluator zmierzył jako zielony; zmiany obrony dotyczą wyłącznie plików testowych).

## Dług i uwagi
- `hex-tooltip-unlock-label-dedup` (27/1 na bazie 261e736de): dług bazowy, poza zakresem tematu.
- Mutacja dla AI case B2 nie była wykonywana (NIE_ZMIERZONO).

BLOKADY: brak (zarzuty 2 i 3 w części dodatniej live/kosztowej pozostają jako NIE_ZMIERZONO do decyzji Final Control).
RUNDY: 1/5 (obrona r1)
NASTĘPNY KROK: Evaluator r2 albo Final Control: sprawdzić case 5b (mutacja czerwona), B2 (AI), 19/0 live; decyzja o dodatnim teście live i o tekście komunikatu.
DEPLOY/PUSH: NIE WYKONANO
