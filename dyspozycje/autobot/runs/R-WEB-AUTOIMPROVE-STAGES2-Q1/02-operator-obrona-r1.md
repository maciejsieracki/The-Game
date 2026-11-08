STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB, `gra/`)
TEMAT: R-WEB-AUTOIMPROVE-STAGES2-Q1
GOAL: Obrona Operatora wobec werdyktu Evaluatora R1 (PASS-WITH-NOTES), bez zmiany kodu produktu.
ZMIANY/COMMIT: baza d6f40e7e7 (Operator R1). Zmienione tylko `gra/tools/autoimprove-stages-q1-test.cjs` (nowy blok s5), `gra/tools/ai-improvements-test.cjs` (2 asercje) i ten raport z logami. SHA w raporcie końcowym obrony.

ODPOWIEDZI NA ZARZUTY
1. Luka testu sztywnego budżetu (KROK 0 wyrębu, FAZA 2, FAZA 0): PRZYJMUJĘ.
   Dodano blok (s5) w autoimprove-stages-q1-test.cjs:
   - KROK 0 (rzeka+las, K1 i K2): pct 1/2/3 x pula 100 (sufit mniejszy niż koszt wyrębu 2.5) daje wydatek <= sufit i 0 wyrębów przy pct 2. Pula 300 x 1% daje dokładnie 1 wyrąb. Pula 200 x 1% daje 0.
   - FAZA 2 (K1, las poza rzeką): te same przypadki.
   - FAZA 0 (obrona, profil Infrastruktura): pct 1/5/10/20/100 x pula 400, wydatek <= sufit, plus asercja nie-próżności (posterunek lub fort powstaje przy wysokim %).
   Mutacje na kopii źródeł (log: mutacje-r2-obrona.txt), wszystkie ZABITE:
   - M7 usunięty cap KROKU 0 (auto-improvements.ts ok. l.1414): 10 FAIL w K1/K2. Przypadek z zarzutu (pct 2 x pula 100) pada.
   - M8 usunięty cap FAZY 2 (l.1503 i l.1505): 4 FAIL.
   - M9 usunięty cap FAZY 0 (l.1152 i l.1168): 1 FAIL (wydatek ponad sufit).
   Uwaga z pomiaru: całkowity sufit jest zaokrąglany w dół (`totalBudget = Math.floor(...)`, auto-improvements.ts ok. l.599). Pula 250 x 1% = 2.5 daje więc sufit 2 i wyrąb (2.5) nie powstaje. To konserwatywne zaokrąglenie w dół, nigdy przekroczenie, więc zgodne z decyzją właściciela. Test granicy używa 300 i 200, żeby tego nie zakładać.
   Błąd w moim pierwszym raporcie: "wszystkie 6 mutacji zabite" nie obejmowało tych ścieżek. Teraz obejmuje (M7, M8, M9 dodatkowo).
2. `ai.ts` poza literą allowlisty: ODRZUCAM jako naruszenie, ale proszę o jawną akceptację Final Control.
   Dowód: DOPRECYZOWANIE BUDŻETU w dispatchu, punkt (2), każe wprost "USUŃ każdy limit % dla AI i miast-państw", wymieniając `MAX_PROCENT_PULI_IMPERIUM` w `ai.ts`. Dispatch jest wewnętrznie sprzeczny (allowlista: tylko wywołanie pickera, późniejsze doprecyzowanie: usuń limit w ai.ts). Zastosowałem późniejszy, bardziej szczegółowy zapis, bo bez tego ścieżka AI bez silnika zachowuje cap 50% wbrew decyzji właściciela. W grze zero skutku (silnik `main.ts:36166` daje AI 100%). Zmiana ogranicza się do 2 miejsc fallbacku i importu. Bez zmian względem R1.
3. Osłabienia testów: (a) PRZYJMUJĘ. W ai-improvements-test.cjs test 11 dodano asercje `normalSpent > floor(80*50%)` i `defensiveSpent > floor(80*50%)` (dowód braku capu 50%, wcześniejsze `<= 80` było tautologią). Test: 56/0 (było 54/0). Pozostaje mocna asercja `eq(spent, farmCost*n)`. (b) ai2 'I' (obóz): ODRZUCAM jako osłabienie. Obóz nie ma gdzie powstać na heksach bez obywateli, a zakaz rzeka+las (D-R5-2) i farma-pierwsza (D-R5-1) są pokryte w s3 i s4. Brak zmian.
4. Założenie Z1 dla D-R5-1: ODRZUCAM jako błąd, zostaje do rozstrzygnięcia przez orkiestratora. To jawne założenie dispatchu ("luki rozstrzygaj założeniem w dokumencie"), zgłoszone jako ABC-1 z liczbami (tartak 128 na 123 przy założeniu, 26 w wariancie ścisłym). Do odpowiedzi właściciela obowiązuje Z1. Stan Drewna: NIE_ZMIERZONO.
5. Brak saveload-praca-pool-live: ODRZUCAM jako zarzut. Wymaga builda, a `npm run build` w `gra/` jest zabroniony; dispatch dopuszcza "jeśli czas". Pytania ABC-2 i ABC-3 pozostają dla orkiestratora.

TESTY (po obronie, kod produktu bez zmian względem 40e9fc240):
- autoimprove-stages-q1: 269/0 (było 255/0, dodane 14 asercji s5). gate-r2-autoimprove-stages-q1-test.txt: EXIT=0
- ai-improvements: 56/0. gate-r2-ai-improvements-test.txt: EXIT=0
- tsc --noEmit: EXIT=0 (gate-r2-tsc.txt)
- Pozostałe bramki R1 nie dotknięte (kod produktu i pozostałe testy bez zmian); logi gate-r1-*.txt aktualne.
BLOKADY: brak
RUNDY: obrona R1 (runda 1/5)
NASTĘPNY KROK: Final Control (decyzje ABC-1/2/3 i akceptacja zmiany `ai.ts` dla orkiestratora)
DEPLOY/PUSH: NIE WYKONANO
