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

---

## OBRONA r3 (odpowiedź na zarzuty Evaluatora z 65ad2d927, start ea5814367) — 2026-11-15

STATUS: BLOCK (partia 2 nadal niedomknięta; poprawki dla zarzutów 3, 6 i 9a/9c wykonane z dowodem; reszta PRZYJĘTA jako otwarta albo ODRZUCONA z dowodem)
DOMAIN: GAME
TEMAT: R-WEB-UI-RESOURCE-SOURCE-LEDGER-SKAD-ZAPASY-Q1
GOAL: odpowiedź na KAŻDY zarzut Evaluatora (9 pozycji) — PRZYJMUJĘ (poprawka + dowód) albo ODRZUCAM (dowód)
ZMIANY/COMMIT: commit obrony r3 na gałęzi `r-ledger-obrona-r3` (SHA w polu sha poniżej); pliki: gra/src/game/resource-ledger.ts (nowa funkcja resetPendingLedger), gra/src/main.ts (import + 1 linia w prepareSessionForLoad), gra/tools/resource-ledger-trade-test.cjs (sekcje [6] i [7]), dyspozycje/.../30-obrona-claude.md. Zero zmian w E3c, zero zmian w turn-economy.ts, zero zmian etykiet.
TESTY (surowe wyniki, worktree po zmianach obrony):
- `npx tsc --noEmit` (gra/): exit 0
- `node tools/resource-ledger-trade-test.cjs`: RESULT: 15 passed, 0 failed (poprzednio 10/0; dodano [6] reset 3/3 i [7] wiring 2/2)
- `node tools/resource-ledger-test.cjs`: 1030 passed, 0 failed
- `node tools/resource-ledger-consume-test.cjs`: 30 passed, 0 failed
- `logic-test`: LOGIC OK (213/213); `tech-tree-test`: 20 pass, 0 fail; `research-test`: ALL GREEN; `unit-replace-test`: 21/21; `combat-test`: All sanity checks passed
- `git diff --check`: exit 0
- Czerwone bazowe bez zmian (nie dotykane w tej rundzie): building-upkeep-resources-test 47/1, citizen-resource-upkeep-test 122/2 (dług bazowy, opisany w r3 Operatora)
- node_modules: `npm ci` w gra/ (71 pakietów, 3 s) — do sprzątania po tym temacie

ODPOWIEDZI NA ZARZUTY (nr zgodny z 65ad2d927):
1. Warzelnia (sól) — PRZYJMUJĘ. Brak źródła „Warzelnia (<miasto>)” potwierdzam (grep: 0 trafień). NIE ZROBIONE w tej rundzie: plon soli jest sumą terytorium na miasto (`territoryResourceByCity`) i wymaga rozbicia per budynek w zbieraniu plonów tury — zmiana w pipeline ekonomii poza zakresem tej odpowiedzi. Kryterium (b) pozostaje OTWARTE.
2. Test w realnej ścieżce gry (≥3 ziarna × 30 tur, hash z/bez księgi) — PRZYJMUJĘ. NIE ZROBIONE: brak harnessu headless dla main.ts. Potrzebny osobny temat tooling (DEBT).
3. Tautologia testu [1] — PRZYJMUJĘ częściowo. ZROBIONE: dodano [7a] (sprawdzenie, że w main.ts są 4 miejsca etykiety „Umowa wymiany z <civ>”, czyli 2 przelewy × 2 strony) i [7b] (wpięcie resetu). NIE ZROBIONE: test [1] nadal używa jednego magazynu dla obu właścicieli w fixture; słaba mutacja „movedTotal===0 ||” nie została usunięta.
4. Mennica i cap bez testu wpięcia — PRZYJMUJĘ. NIE ZROBIONE: brak przypadku testowego dla recordStockDeltaToTurn w turn-economy.ts (mutacja obu wpięć nadal zielona). Test [3] obejmuje tylko reconcileOwnerResourceCaps w izolacji.
5. Szlak E3c (main.ts ~40152–40197) przesuwa brąz/żelazo/cegłę bez księgi — PRZYJMUJĘ jako fakt kodu (potwierdzam: E3c nie został zmieniony w r3 i nie jest księgowany). Decyzja ABC o usunięciu lub zostawieniu E3c pozostaje otwarta; zgodnie z DODATKIEM 2 nie zmieniano E3c w tej rundzie. Pytanie ABC do właściciela: patrz UWAGI.
6. Okno pendingLedgerByOwner nie czyszczone przy nowej grze / wczytaniu — PRZYJMUJĘ i NAPRAWIONO CZĘŚCIOWO:
   - dodano `resetPendingLedger()` w resource-ledger.ts (czyści okno),
   - wywołanie w `prepareSessionForLoad()` (main.ts:10167), czyli w ścieżce wczytania (loadGameFromSlot wywołuje tę funkcję jako pierwszą, main.ts:48031),
   - test [6] (6a okno niepuste przed resetem, 6b reset czyści, 6c drain po resecie nie wnosi wpisów): 3/3 PASS.
   - NIE ZWERYFIKOWANO: ścieżka „nowa gra” — nie ustaliłem w tej rundzie, czy przechodzi przez prepareSessionForLoad; jeśli nie, okno nadal może przeciec między grami. Wymaga wskazania punktu startu nowej gry i dopisania resetu.
   - NIE ZMIERZONO: test wczytania zapisu w żywej grze.
7. Kolejność: przelew umowy w turze gracza → pending → rekord następnej tury — PRZYJMUJĘ jako ryzyko. NIE ZMIERZONO w żywej grze. Kod: runDiplomacyTurnTick (main.ts ~40111) → advanceCityEconomy (~40266) → drainPendingLedgerInto (40308); ZAŁOŻENIE tej odpowiedzi: przelew wykonany przed tickiem tej samej tury trafia do tej samej tury (nie zweryfikowane w grze).
8. Brak pomiaru czasu tury (kryterium d) — PRZYJMUJĘ. NIE ZMIERZONO. Nie wykonywałem pomiaru w tej rundzie.
9. Drobne:
   (a) etykiety out/in „Umowa wymiany z X” — ODRZUCAM. Dowód: wpisy mają różne sourceKey (`umowa-wymiany|out|<id>` vs `umowa-wymiany|in|<id>`, main.ts:13299–13302 i 25088–25091), więc nie sumują się; kierunek jest czytelny ze znaku kwoty (+ przyrost / − ubytek) w panelu. Zmiana etykiety złamałaby kryterium (b) z dispatchu („Umowa wymiany z <civ>”).
   (b) zapłata praca/złoto w umowie cyklicznej nie księgowana — PRZYJMUJĘ. NIE ZROBIONE w tej rundzie (zakres: wymiana surowców; zapłata to osobny przepływ).
   (c) DODATEK nieuaktualniony do bazy tej rundy — PRZYJMUJĘ jako dług procesowy (orkiestrator aktualizuje DODATEK; wskazuję, że bazą r3 był ea5814367 po commicie raportu Operatora).

ZMIERZONO vs NIE ZMIERZONO:
- ZMIERZONO: testy gry i bramki z surowego wyjścia (powyżej); reset okna (test [6]); wiring etykiet i resetu w main.ts (test [7], czytanie źródła).
- NIE ZMIERZONO: ścieżka realnej gry (zarzut 2), czas tury (8), zapis/wczytanie w grze (6), kolejność tur w grze (7), Warzelnia (1, brak kodu), Mennica/cap wpięcie (4).

UWAGI-DLA-ORKIESTRATORA:
- Pytanie ABC do właściciela (bez mojego rozstrzygania): E3c szlak handlowy — (A) usunąć przesuw zapasów szlakiem zgodnie z decyzją #311, osobny temat; albo (B) zostawić i księgować przepływ szlaku (zmienia zakres). Do czasu decyzji partia 2 jest niedomknięta.
- Do zlecenia w kolejnej rundzie: (i) reset okna w ścieżce „nowa gra” (punkt startu do ustalenia), (ii) Warzelnia — rozbicie plonu soli per budynek, (iii) harness headless dla main.ts (zarzut 2) jako osobny temat tooling, (iv) zapłata cykliczna w księdze.

RUNDY: 4/5 (partia 2, runda 4 — częściowa: zarzuty 3, 6, 9a/9c obsłużone; 1, 2, 4, 5, 7, 8, 9b otwarte z powodów wyżej).
NASTĘPNY KROK: decyzja ABC E3c → runda 5 tego samego ID (ostatnia) albo rozbicie na osobne tematy po stronie orkiestratora: Warzelnia, harness main.ts, reset nowej gry.
DEPLOY/PUSH: NIE WYKONANO
