STATUS: PASS-WITH-NOTES
DOMAIN: GAME (UI/raportowanie, bez zmiany zasad ekonomii)
TEMAT: R-WEB-UI-HUD-NET-CONVERTER-INPUTS-Q1
GOAL: HUD „netto” surowców nie odejmował wejść konwerterów; naprawa tylko warstwy liczenia netto.
ZMIANY-COMMIT: baza 251fe75cb (origin/main). Pliki: gra/src/game/resource-gross-net.ts (netto = ratePerTurn − zużycie − wejścia konwerterów; brutto bez zmian), gra/src/main.ts (nowa funkcja empireConverterInputRatesForOwner, pole rateConverterInputPerTurn w wierszu HUD), gra/src/ui/empireDetailTypes.ts (pole typu), gra/src/ui/empireDetailPanel.ts (wiersz „Wejścia konwerterów” w karcie), gra/tools/resource-cards-gross-net-test.cjs (wzorzec mutanta M2 zaktualizowany), gra/tools/resource-gross-net-converter-inputs-test.cjs (nowy), raport. Commit: SHA w polu sha.
POTWIERDZENIE HIPOTEZY: POTWIERDZONA w kodzie. ratePerTurn = produkcja − umowy wychodzące + przychodzące (main.ts:4206, produkcja konwerterów nominalna). Zużycie (usage) = tylko budynki/obywatele/wojsko. Wejścia konwerterów zjadane w runConverters (converters.ts runConverter/consumed) nigdzie nie były odejmowane od netto. Test fixturowy (prawdziwe receptury): Garncarnia 3×50 cykli → 150 Gliny/t; netto 326 → 176 (dawniej 326, Δstanu zmierzone 175).
TESTY: resource-gross-net-converter-inputs-test 14 ok / 0 FAIL (w tym mutant bez wejść → netto≠176); tsc --noEmit EXIT 0; logic-test LOGIC OK 213/213; tech-tree 20/0; research 33/0; unit-replace 21/21; combat 6/6; ai-economy-measure-hook-test 23/23; resource-cards-gross-net 24/0 (po aktualizacji wzorca M2); hud-gross-net-rest 820/0; hud-topbar-grid-gross-net 1150/0; gross-net-numbers-only-unify 35/0; hud-konwerter-dopasowanie 20/0. git diff --check czysto.
BLOKADY: dowód na żywo (bieg ≤30 tur seed 4242, porównanie Δstanu z HUD netto przed/po) NIE ZMIERZONO — wymaga zbudowania bundle poza repo i runnera headless; runner jsonl nie zapisuje HUD netto, więc potrzebny jest dodatkowy odczyt. Bramka testów przeglądarkowych nie uruchamiana.
RUNDY: 1/5
NASTĘPNY KROK: orkiestrator: integracja + Final Control; dowód na żywo do wykonania przed deployem (sprawdzić Δstanu Gliny/Ceramiki vs netto w ≥3 turach).
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
1. Zmiana obniża netto każdego surowca wchodzącego do konwertera (glina, drewno, ruda, ruda cyny, ruda żelaza, żelazo) — nagłówek „Brutto → netto” zejdzie w dół; to zamierzone.
2. Wejścia liczone NOMINALNIE (przepustowość × zużycie na cykl), bez klamrowania do zapasu — tak jak brutto konwerterów. Przy niedoborze magazynu netto będzie zaniżone.
3. Alert niedoboru w nagłówku (resourceAlertCount, surowceNiedoborLabels) nadal opiera się na ratePerTurn (bez wejść). Surowiec może być netto ujemny, a nie być zaznaczony jako niedobór. Osobny temat, nie ruszany.
4. Pozostałe miejsca korzystające z resourceGrossNetPerTurn (karty panelu, telemetria main.ts ~33931) dziedziczą poprawkę automatycznie.
5. Brutto Drewna/Gliny nie zmienione (produkcja), zgodnie z zadaniem.
