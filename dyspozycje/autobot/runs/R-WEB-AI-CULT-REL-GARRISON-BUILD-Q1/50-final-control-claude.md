STATUS: PASS-WITH-NOTES
DOMAIN: GAME (AI)
TEMAT: R-WEB-AI-CULT-REL-GARRISON-BUILD-Q1
GOAL: normalny/trudny AI trzyma garnizon wg potrzeby i buduje budynki Prawa/Szczescia; pomiar PRZED/PO na poziomie maksymalnym.
ZMIERZONE-NA: baza 54af88a0e; kandydat zlecony 052492e94 (r3 operatora); wersja po obronie 0899aff41 (potomek 052492e94, 3 commity r4).

WERDYKT W SKROCIE
- Kandydat 052492e94 SAM: zarzut 1 (brak testu preferencji budynkow) potwierdzony wlasna mutacja -> w tym SHA to FAIL tego punktu.
- 0899aff41 (052492e94 + obrona r4): zarzut 1 naprawiony i zweryfikowany mutacja; PASS-WITH-NOTES. Do integracji nalezy 0899aff41, NIE 052492e94.
- Efekt w grze (kryterium "mniej pustych miast i brak rozpadu AI") NIESPELNIONY mierzalnie: wpiecie neutralne (puste miasta 32,1->31,4% i 34,7->34,5%). To decyzja orkiestratora, nie bloker techniczny.

WERYFIKACJE WLASNE
- merge-base --is-ancestor 54af88a0e 052492e94: TAK. 052492e94 jest tez przodkiem ada7614d3 i 0899aff41.
- diff 54af88a0e..052492e94: 11 plikow (ai-city-garrison.ts, ai-city-order-need.ts, ai.ts, main.ts, 2 testy, 2 runnery, analiza, raport, pomiar surowy). Allowlista (rozszerzona dodatkiem o main.ts i ai.ts): OK, brak gra-robocza/, WERSJE.md, rust-port.
- Bramki na 052492e94 (surowe): tsc 0; logic 213/213; tech-tree 20/0; research 33/0; unit-replace 21/21; combat 6/6; unit-power 6/0; ai-test 297/0; society-breakdown 56/0; culture-religion-level 59/0; culture-religion 65/0; ai-city-order-need 35/0; garrison-min-one 38/0; wiring 119/0; unit-replace-full-cost 40/0; promotion-table PASS.
- Bramki na 0899aff41: tsc 0; wiring 231/0; order-need 35/0; garrison-min-one 38/0; logic 213/213; culture-religion-level 59/0; ai-test 297/0 (society-breakdown exit 0).
- NIE uruchomiono ponownie na 0899aff41: tech-tree, research, unit-replace*, combat, unit-power (diff r4 dotyka tylko ai.ts, main.ts, wiring-test, runnera; zielone na 052492e94).
- Mutacja zarzutu 1: na 052492e94 bonus 40->0 => wiring 119/0 (mutant PRZEZYL, zarzut potwierdzony). Na 0899aff41 ta sama mutacja => "FAIL T5 need=1: garnizon +40 / swiatynia +40", 24 pass / 2 fail (mutant ZABITY).
- Pomiaru live (Chromium) nie powtarzalem; opieram sie na 40-pomiar-r4-surowy.txt (NIE ZWERYFIKOWANE niezaleznie).

OCENA ZARZUTOW (bez etykiet)
1. Brak testu budynkow: NAPRAW. Potwierdzone na 052492e94; naprawione w ada7614d3 (T5, MW6-8), mutacja zabita na 0899aff41. ZALATANE.
2. Przyczyna -30% jednostek / 2x puste miasta nierozstrzygnieta, bunty NIE ZMIERZONO: ODDAL (uwaga). Dostarczono liczby skutkow (mniej nowych jednostek 252/258 vs 365/368, straty podobne, glod i zloto 0), nie mechanizm. Brak dowodu na utrzymanie (H3), wiec DECISION_REQUIRED z pkt 5 dispatchu nie wyzwolony. Zostaje temat diagnostyczny (licznik produkcji jednostek per miasto + licznik buntow).
3. Efekt mieszany: ODDAL (uwaga, kryterium binarne niespelnione). Po r4 na poziomie maksymalnym efekt pomijalny w obu ziarnach: brak poprawy i brak regresji. Zmiana bezpieczna dla latwy/zgodnosc (ai-test 297/0). Orkiestrator decyduje o zostawieniu wpiecia.
4. Hak startGame = Normalny: zalatane w c6e6c1526 (opcja difficulty + --difficulty w runnerze; r4 mierzone na Trudny). Pomiaru nie powtarzalem.
5. Nit komentarza main.ts: ODDAL (kosmetyka).
6. Potrzeba bez modyfikatora macierzy: zalatane w ada7614d3 (main.ts uzywa ordPct po applyCivMatrixHappinessModifier i override po zdobyciu). Zostaje petla z poprzedniej tury (zalozenie, niski wplyw). ODDAL.

ZMIANY/COMMIT: weryfikowane 052492e94 i 0899aff41; zadnych zmian kodu; commit tylko tego raportu.
TESTY: jak wyzej.
BLOKADY: brak technicznych. Uwaga: zlecenie wskazywalo kandydata 052492e94, a obrona odnosi sie do 0899aff41; integrowac 0899aff41.
RUNDY: FC r4/5.
NASTEPNY KROK: orkiestrator integruje 0899aff41 i decyduje o zostawieniu wpiecia bez mierzalnego efektu; opcjonalny temat diagnostyczny. Poziom maksymalny uznany = Kultura i religia trudny + trudnosc gry Trudny.
UWAGI-DLA-ORKIESTRATORA: wpiecie bezpieczne i przetestowane, ale bez mierzalnego efektu; nie deployowac jako "naprawe pustych miast".
DEPLOY/PUSH: NIE WYKONANO
