STATUS: PASS-WITH-NOTES
DOMAIN: GAME (UI/raportowanie, bez zmiany zasad ekonomii)
TEMAT: R-WEB-UI-HUD-NET-CONVERTER-INPUTS-Q1
GOAL: HUD „netto” surowców odejmuje wejścia konwerterów (naprawa warstwy liczenia netto); brutto bez zmian.
ZMIANY-COMMIT: baza kandydata 2ac692739; poprawka w commicie (SHA w polu sha raportu orkiestratora). Pliki: gra/src/game/converters.ts (nowa czysta `converterConsumedRatesForBuildings`, sumuje `consumed` z `converterProductionDisplayForBuilding`), gra/src/main.ts (`empireConverterInputRatesForOwner` deleguje do tej funkcji; lokalna pętla usunięta), gra/tools/resource-gross-net-converter-inputs-test.cjs (test B woła prawdziwą funkcję; asercja filtra właściciela w main.ts). Przywrócono do bazy 251fe75cb: gra/src/ui/empireDetailPanel.ts, gra/src/ui/empireDetailTypes.ts (poza allowlistą). Zostawiono gra/tools/resource-cards-gross-net-test.cjs (aktualizacja wzorca mutanta M2; bez niej istniejący test 24/0 pada).
ODPOWIEDZI NA ZARZUTY:
1. PRZYJMUJĘ. Panel i typy przywrócone do bazy (poza allowlistą). Plik resource-cards-gross-net-test.cjs zostaje jako konieczna aktualizacja wzorca testu istniejącego — wymaga zatwierdzenia allowlisty przez orkiestratora (patrz UWAGI 1).
2. PRZYJMUJĘ jako otwarte: dowodu na żywo NIE wykonano w tej rundzie (wymaga bundle poza repo i odczytu HUD netto w runnerze, którego jsonl nie zapisuje). Blokada przed deployem.
3. PRZYJMUJĘ. Test B woła teraz prawdziwą funkcję `converterConsumedRatesForBuildings` (converters.ts) na fixturze 3 Garncarnie × 50 cykli. Glue w main.ts (filtr właściciela) sprawdzany asercją na treści funkcji `empireConverterInputRatesForOwner` (mutant `c.ownerId !== ownerId` -> `===` daje FAIL). Uwaga: sama funkcja w main.ts nie jest wykonywana w teście jednostkowym (zamknięcie w boot()).
4. PRZYJMUJĘ. Duplikacja usunięta: main.ts sumuje `consumed` z `converterProductionDisplayForBuilding` przez wspólną funkcję; jedyna formuła wejść to converters.ts. Unikalność budynku liczona per miasto (Set), jak poprzednio.
5. ODRZUCAM w tym temacie (zakres): alert niedoboru (shortageRows, surowceNiedoborLabels) liczy ratePerTurn i nie jest wyświetlaniem netto; dispatch nie dopuszcza zmian poza warstwą netto. Zgłaszam orkiestratorowi jako osobny temat (UWAGI 2).
6. ODRZUCAM z dowodem: dispatch (pkt 1, 3) definiuje netto = produkcja − utrzymanie − wejścia, bez klamrowania. Konwencja nominalna jest świadoma i udokumentowana w converters.ts (komentarz `converterProductionDisplayForBuilding`: „CELOWO BRUTTO… nie pomniejszona o brak wejścia tej tury”). Skali rozjazdu przy niedoborze nie zmierzono (NIE ZMIERZONO) — ryzyko zostaje w BLOKADACH.
TESTY (surowe liczby z uruchomień w tej rundzie):
- npx tsc --noEmit: EXIT 0
- resource-gross-net-converter-inputs-test: RESULT 18 ok, 0 FAIL (mutant bez wejść daje netto != 176)
- resource-cards-gross-net-test: 24 pass, 0 fail
- hud-gross-net-rest-test: 820 ok, 0 fail
- hud-topbar-grid-gross-net-test: 1150 ok, 0 fail
- gross-net-numbers-only-unify-test: 35 ok, 0 FAIL
- hud-konwerter-dopasowanie-test: 20 passed, 0 failed
- resource-card-numbers-only-test: 14 pass, 0 fail
- logic-test: LOGIC OK (213/213)
- tech-tree-test: 20 pass, 0 fail
- research-test: 33/0
- unit-replace-test: 21/21
- combat-test: 6/6
- ai-economy-measure-hook-test: 23/23
- git diff --check: czysto
BLOKADY: (a) dowód na żywo (seed 4242, ≤30 tur, Δstanu vs HUD netto) NIE ZMIERZONO; (b) skala rozjazdu netto przy niedoborze magazynu NIE ZMIERZONO; (c) bramki przeglądarkowe nie uruchamiane; (d) allowlista: resource-cards-gross-net-test.cjs poza allowlistą.
RUNDY: 2/5 (runda 1 PASS-WITH-NOTES, Evaluator FAIL: allowlista, dowód, test, duplikacja, niedobór, nominalność)
NASTĘPNY KROK: Evaluator (runda 2) i Final Control; przed deployem dowód na żywo.
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
1. Przywrócenie panelu karty oznacza: tooltip karty „Brutto · netto” pokazuje Brutto − Zużycie, a Netto (z resourceGrossNetPerTurn) już odejmuje wejścia, więc suma w tooltipie się nie zgadza. Wymaga decyzji: rozszerzenie allowlisty o empireDetailPanel.ts/empireDetailTypes.ts (linia „Wejścia konwerterów”) albo osobny temat.
2. Alert niedoboru w nagłówku (main.ts ~23940/23946) nadal opiera się na ratePerTurn bez wejść konwerterów — osobny temat.
3. Wejścia są nominalne, bez klamrowania do zapasu; przy niedoborze netto zaniża się względem Δstanu. Decyzja czy klamrować.
4. Zmiana obniża netto wszystkich surowców wchodzących do konwerterów (glina, drewno, ruda, cyna, żelazo); brutto bez zmian.
