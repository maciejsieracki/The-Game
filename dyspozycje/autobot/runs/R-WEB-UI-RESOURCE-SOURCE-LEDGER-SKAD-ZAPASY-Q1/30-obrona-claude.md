# R-WEB-UI-RESOURCE-SOURCE-LEDGER-SKAD-ZAPASY-Q1 — Obrona Operatora, runda 2 (odpowiedź na zarzuty Evaluatora)

STATUS: PASS-WITH-NOTES (CZĘŚCIOWY: partia 2 NIE domknięta; zarzuty 1 i 3 przyjęte częściowo, reszta w BLOKADACH)
DOMAIN: GAME
TEMAT: R-WEB-UI-RESOURCE-SOURCE-LEDGER-SKAD-ZAPASY-Q1
GOAL: odpowiedzieć na 8 zarzutów Evaluatora do kandydata 051d691b6 (partia 2 częściowa). Start od 051d691b6. Dodano okno „pending” dla poborów poza tickiem (budowa, rekrutacja) i testy (6)(7). Pozostałe luki udokumentowane jako BLOKADY.

## Baza i środowisko

- Worktree `wf_f9f933c8-6d0-3` zresetowany do 051d691b6 (był na ff090714d = origin/main, bez prac księgi). Zmiany: wyłącznie w wykazanej allowliście.
- origin/main ff090714d NIE został scalony (zarzut 8 Evaluatora: "przed integracją trzeba scalić"). Integracja należy do orkiestratora.
- `npm ci` w gra/ (gitignored, node_modules 134 MB), bo worktree nie miał zależności; bez tego `tsc` i test esbuild nie działały.

## Commit kodu rundy

- ad57be24c — kod (resource-ledger.ts, main.ts, ui/cityPanel.ts, tools/resource-ledger-consume-test.cjs).
- Ten raport jest w osobnym commicie (SHA końcowy w polu sha zwrotki).

## Odpowiedzi na zarzuty

**Zarzut 1 (zakres partii 2 niedomknięty) — PRZYJMUJĘ CZĘŚCIOWO.**
- ZROBIONE w tej rundzie: mechanizm „pending” (okno poza tickiem, `pendingLedgerSink` / `drainPendingLedgerInto` w resource-ledger.ts); źródło „Budowa budynku” (`deductOwnerStockCost` w main.ts oraz `addItem` w ui/cityPanel.ts); źródło „Rekrutacja jednostek” (dwa miejsca w main.ts: `purchaseRecruitmentUnits` i drugi batch rekrutacji). Drenaż okna po `advanceCityEconomy` (main.ts, po wywołaniu tiku).
- NIE ZROBIONE (otwarte w partii 2b): „Umowa wymiany z <civ>” i „Warzelnia (<miasto>)” (kryterium (b) dispatchu) — nie zaimplementowane; patrz BLOKADY pkt 2.
- Kryterium (b) dispatchu NIESPEŁNIONE.

**Zarzut 2 (test zgodności nie broni wpięcia main.ts) — PRZYJMUJĘ CZĘŚCIOWO.**
- Dodano test (7): strażnik tekstowy wpięcia (sinki budowy/rekrutacji w main.ts i cityPanel.ts, drenaż po ticku). Ten sam wzorzec co pozostałe testy wpięcia w repo.
- Mutacja: usunięcie linii `drainPendingLedgerInto(econ.resourceLedgerByOwner);` z main.ts -> test (7) czerwony (`FAIL: (7) main.ts: drenaż okna po ticku ekonomii`, wynik 29 passed, 1 failed). Plik przywrócony (cmp OK).
- Nadal prawdą: test (2) pokrywa 3 surowce i pętlę fixture, nie uruchamia main.ts. Pełnego testu w realnej pętli gry nie zrobiono (NIE ZMIERZONO, patrz niżej).

**Zarzut 3 (księga nie zgadza się z magazynem w grze) — PRZYJMUJĘ CZĘŚCIOWO.**
- Domknięte w tej rundzie: budowa (start, gracz i AI przez `deductOwnerStockCost`, UI przez cityPanel), rekrutacja (dwie ścieżki w main.ts).
- Otwarte (BLOKADY 2–5): handel (trasa E3c i umowy), łup, prezent, zdobycie/oddanie miasta, `reconcileOwnerResourceCaps`, Mennica, `building-resource-gate` (434/443), `unit-replace-cost`. Dla tych miejsc księga NIE jest zgodna ze stanem magazynu w grze. Test zgodności w grze nie istnieje.

**Zarzut 4 (brak dowodu hashem i w grze) — NIE ZMIERZONO (przyjęte jako luka, nie naprawione).**
- Test (4) porównuje tylko fixture `makeCities()`. Hash stanu w realnej grze wymaga harnessu headless, którego ten temat nie ma, a plik `gra/tools/determinism-*.cjs` jest poza allowlistą tematu (allowlista: `*ledger*|*skad-zapasy*`). Zmiana sygnatury `deductBuildingStockCostAcrossCities` (void -> Record) pozostaje bez pomiaru w grze.

**Zarzut 5 (alokacja pobranych surowców — założenie nieudokumentowane) — PRZYJMUJĘ jako ZAŁOŻENIE udokumentowane (kod bez zmian).**
- ZAŁOŻENIE (do zatwierdzenia przez orkiestratora): `allocateTakenToLedgerParts` przydziela pobraną ilość kolejno częściom (min(pozostało, koszt części)); nadwyżka ponad koszty trafia do OSTATNIEJ części. Dla upkeep (budynki, potem jednostki) i dla pojedynczej części (budowa, rekrutacja) nadwyżka nie powstaje, bo pobór nigdy nie przekracza żądanego kosztu; gałąź `isLast` jest zabezpieczeniem.
- Priorytet „najpierw budynki” przy niedoborze jest tylko kolejnością opisu w księdze (w tiku odejmowanie jest łączne) — potwierdzam zarzut, nie zmieniam.

**Zarzut 6 (etykiety po polsku, bez nazw budynków/miast przy utrzymaniu) — ODRZUCAM.**
- Dowód: dispatch (00-dispatch.md, GOAL) wymaga „z nazwą budynku/miasta” wyłącznie dla „produkcja budynków”. Dla utrzymania wymagane są etykiety po polsku (`Utrzymanie budynków`, `Utrzymanie jednostek`, `Obywatele`) — zgodnie z kryterium „Teksty po polsku, bez surowych ID”. Dodane etykiety: `Budowa budynku`, `Rekrutacja jednostek` — też po polsku, bez ID.

**Zarzut 7 (git diff --check nieczysty; raport przepisany, ślad r1 zniknął) — PRZYJMUJĘ CZĘŚCIOWO.**
- Naprawione: trailing whitespace w `10-operator-claude.md` usunięty (sed); `git diff --check` = czysty (bez wyjścia).
- NIE naprawione: przywrócenie śladu r1 w tym pliku. Ślad r1 istnieje w historii git (commity 060e0be6b i 4d2359e82, plik `10-operator-claude.md`). Nie przywrócono go do pliku w tej rundzie (próba odtworzenia zablokowana przez ograniczenia worktree; nie rozstrzygam sposobu). Do decyzji orkiestratora: czy dopisać r1 jako sekcję w kolejnej rundzie.

**Zarzut 8 (testy tekstowe czerwone na main.ts) — ODRZUCAM (dług bazowy, dowód na bazie).**
- Na bazie ad10b891b (wyeksportowane `git archive` do katalogu tymczasowego, te same node_modules): `building-upkeep-resources-test` = 47 passed, 1 failed (D10); `citizen-resource-upkeep-test` = 122 passed, 2 failed (F1 + drugi). Na kandydacie 051d691b6 i na ad57be24c: identycznie.
- Dispatch: „czerwone-na-bazie osobno”. Te pliki są poza allowlistą tematu; nie edytowano ich. Uwaga na przyszłość: runda zmieniająca wywołania w main.ts, które te testy sprawdzają, musi mieć je w allowliście albo naprawić dług osobno.

## Zmiany w kodzie (ad57be24c)

- `gra/src/game/resource-ledger.ts`: rodzaje źródeł `budowa`, `rekrutacja`; moduł-stan `pendingLedgerByOwner` z funkcjami `pendingLedgerSink(ownerId, kind, label)`, `drainPendingLedgerInto(target)`, `peekPendingLedger()`.
- `gra/src/main.ts`: import (linia 443) rozszerzony o sinki; `purchaseRecruitmentUnits` (batch) i drugi batch rekrutacji -> `pendingLedgerSink(ownerId, 'rekrutacja', 'Rekrutacja jednostek')`; `deductOwnerStockCost` -> `pendingLedgerSink(ownerId, 'budowa', 'Budowa budynku')`; po `const econ = advanceCityEconomy(...)` -> `drainPendingLedgerInto(econ.resourceLedgerByOwner)`.
- `gra/src/ui/cityPanel.ts`: import `pendingLedgerSink`; `addItem` (budynek) -> sink budowy.
- `gra/tools/resource-ledger-consume-test.cjs`: eksporty; sekcja (6) okno pending (2 ziarna x 30 tur, różnica 0, brak wpływu na stan, drenaż czyści okno); sekcja (7) strażnik tekstowy wpięcia.
- Zachowanie gry: sinki tylko zapisują do księgi; stan magazynu nie zmienia się (test (6) „bez wpływu” i wynik `tsc` 0). Okno jest pamięcią modułu — NIE jest w zapisie gry (luka: zapis między budową a końcem tury gubi wpisy okna; patrz BLOKADY 6).

## TESTY (surowe wyniki, zmierzone w tej rundzie na ad57be24c)

- `npx tsc --noEmit` (gra/, po `npm ci`): EXIT 0, 0 błędów.
- `node tools/resource-ledger-test.cjs`: 1030 passed, 0 failed (EXIT 0).
- `node tools/resource-ledger-consume-test.cjs`: 30 passed, 0 failed (EXIT 0) — wcześniej 20/0; dodane (6) i (7).
- Mutacja drenażu (usunięcie linii z main.ts): consume-test -> `resource-ledger-consume-test: 29 passed, 1 failed` (czerwone), main.ts przywrócony i zweryfikowany (`cmp`).
- `node tools/logic-test.cjs`: `LOGIC OK (213/213)` (EXIT 0).
- `node tools/tech-tree-test.cjs`: EXIT 0 (linia podsumowania nie została wychwycona filtrem; kod wyjścia 0).
- `node tools/research-test.cjs`: `PASSED: 33 / FAILED: 0 / TOTAL: 33 ALL GREEN` (EXIT 0).
- `node tools/unit-replace-test.cjs`: `WSZYSTKIE TESTY ZIELONE (21/21)` (EXIT 0).
- `node tools/combat-test.cjs`: `All sanity checks passed.` (EXIT 0).
- `node tools/building-upkeep-resources-test.cjs`: 47 passed, 1 failed (EXIT 1) — IDENTYCZNIE na bazie ad10b891b (dług bazowy).
- `node tools/citizen-resource-upkeep-test.cjs`: 122 passed, 2 failed (EXIT 1) — IDENTYCZNIE na bazie ad10b891b (dług bazowy).
- `git diff --check`: czysty.

## BLOKADY (jawna lista; co NIE jest zrobione)

1. Test (a) w realnej grze (≥3 ziarna x 30 tur, różnica magazynu i księgi = 0) — NIE ZMIERZONO (brak harnessu headless; `determinism-*.cjs` poza allowlistą).
2. Handel: źródła „Umowa wymiany z <civ>” (cykliczna, jednorazowa) i „Warzelnia (<miasto>)” — NIE zaimplementowane. Konflikt decyzji (do ABC orkiestratora, NIE rozstrzygam sam): w kodzie `main.ts` (blok „Handel E3c”, ok. linii 40166–40183) przepływ ilościowy szlaku NADAL przesuwa zapasy (`deductBuildingStockCostAcrossCities` nadawca, `creditOwnerResourceStock` odbiorca), a decyzja #311 (2026-11-14) mówi „tylko premia, bez przesuwania zapasów”. Dispatch z kolei wymaga, by zmiana magazynu = suma księgi. Bez decyzji szlak albo zostaje bez wpisu (niezgodność), albo trafia do księgi jako przepływ (sprzeczne z dispatchem „NIE księguj szlaku jako źródła”).
3. Łup z bitwy, prezent/dar, zdobycie/oddanie miasta — NIE zaimplementowane.
4. `reconcileOwnerResourceCaps` (obcięcie do limitu) i Mennica (drenaż Złota) — NIE zaimplementowane.
5. Pozostałe odjęcia z puli: `building-resource-gate.ts` (434, 443), `unit-replace-cost.ts`, ewentualne ścieżki AI wewnątrz tiku po `advanceCityEconomy` (okno pending jest drenowane raz, po tiku; pobory AI wykonane później w tiku trafią do następnej tury) — NIE zweryfikowane.
6. Okno pending nie jest zapisywane w zapisie gry: wczytanie gry po budowie, a przed końcem tury, gubi wpisy okna (stan magazynu jest zapisany, księga — nie). Przy wczytaniu zapisu okno jest puste (zgodne z regułą „brak pola = pusty dziennik”, ale to rozjazd na tę turę).
7. Pamięć N=10 tur w zapisie i jej odczyt — partia 3 (nie ruszane).
8. Hash stanu, pomiar czasu tury (tick 100 tur przed/po), zrzut Chromium — partia 4 (NIE ZMIERZONO).
9. Scalenie origin/main ff090714d (FALA 730) — NIE WYKONANO (integracja orkiestratora; konflikt możliwy w turn-economy.ts i main.ts).

## ZMIERZONO vs NIE ZMIERZONO

- ZMIERZONO: wszystkie wyniki w sekcji TESTY (surowe wyjścia powyżej), baza dla dwóch testów grep (ad10b891b), mutacja drenażu.
- NIE ZMIERZONO: test w realnej grze (pkt 1), hash i czas tury (pkt 8), Chromium (pkt 8), handel i łup w księdze (pkt 2–4).

## UWAGI-DLA-ORKIESTRATORA

- Konflikt decyzji szlaku (BLOKADY pkt 2): potrzebna decyzja ABC właściciela, zanim zaimplementuje się handel. Nie rozstrzygam sam.
- Rozbieżność bazy: DODATEK wskazywał „kandydat 4d2359e82 + merge main”, dispatch wskazywał 060e0be6b, Evaluator — 051d691b6. Użyto 051d691b6 (zawiera partię 1, obronę r1 i partię 2 częściową).
- worktree-wf_f9f933c8-6d0-3 zresetowany do 051d691b6; commit ff090714d (origin/main) nie jest ancestorem tej gałęzi — przed integracją trzeba scalić origin/main (zarzut 8 Evaluatora).
- Proponowany zakres partii 2b (kolejna runda, ten sam ID): (a) handel po decyzji szlaku; (b) „Umowa wymiany z <civ>” i „Warzelnia (<miasto>)” w deal execution; (c) łup/prezent/miasto przez okno pending; (d) cap i Mennica; (e) zapis okna w zapisie gry; (f) allowlista na dwa testy grep, jeśli zmieniane są wywołania w main.ts.
- Sprzątanie: `gra/node_modules` (134 MB) i pliki tymczasowe w /tmp/claude-0 do usunięcia po zakończeniu tematu (zasada dysku).

RUNDY: 2/5 (obrona r2, partia 2 — częściowa; kolejna runda wymagana)
NASTĘPNY KROK: runda 3 tego samego ID (partia 2b) po decyzji ABC w sprawie szlaku; po niej partia 3 i 4.
DEPLOY/PUSH: NIE WYKONANO
