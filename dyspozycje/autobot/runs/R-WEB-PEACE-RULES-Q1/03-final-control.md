STATUS: FAIL
DOMAIN: GAME (WEB, gra/)
TEMAT: R-WEB-PEACE-RULES-Q1
GOAL: Runda 1 (R1-R7, R10, D7); R8/R9 odlozone do rundy 2.
ZMIANY/COMMIT: oceniany f61db5cc9 (baza 7164f7ca1; 44a4de5fd + obrona). Allowlista: 14 plikow, wylacznie gra/ (src/game, src/main.ts, data, tools); brak gra-robocza, WERSJE.md, forced-war-*, rust-port. git diff --check czysty. Brak push/deploy.
TESTY (odtworzone samodzielnie na f61db5cc9): tsc --noEmit PASS; profile-unit 153/0; gate 11/0; main-guard 28/0; sim 19/0; d7 8/0; brake 51/0, unit 69/0, mutacje 17/0; diplomacy-test 148/0; peace-lock 9/0; war-rules-multiwar 55/0, main-guard 21/0. Nie odtworzono: ai-test, civ-matrix-wiring, forced-war-*, ai-wojny-zwykle-cap (wartosci Obrony, bez regresji wzgledem bazy wg jej pomiaru).

ROZSTRZYGNIECIE ZARZUTOW
1 symulacja wielotur: ODDAL (sim-test 19/0 wola realne decideAIDiplomacy/evaluateProposal, 30 tur, 4 mutanty wykrywane; poziom regul akceptowalny).
2 zrzut Chromium (kryt. 9): NAPRAW. R-PROC-AUTOBOT par. 9 pkt 6: brak zywej weryfikacji = FAIL bezwarunkowo. Wykonalne: node ./node_modules/vite/bin/vite.js build --outDir /tmp/... + Playwright/Chromium z /opt/pw-browsers; pokazac komunikat "AI czuje sie silniejsze..." (diplomacy-war-peace-profile.ts:357, uzyty w diplomacy-proposals.ts) oraz ostrzezenie hamulca "Ryzyko wojny ... (laczna Relacja <= N)"; plus dowod nietautologicznosci (mutacja zrodla -> test czerwony).
3 R3(c) zdrowie armii: ODDAL (zaimplementowane: diploArmyHealthShare w main.ts, klucz podlaczony; testy S6/M_HEALTH).
4 test zachowania decideAIDiplomacy: ODDAL (S1-S7, M_SIG/M_FEEL/M_WEAR).
5 D7 i hamulec wg Relacji: ODDAL (brakeWarOutcome wydzielone i testowane + mutant M_D7; crisisStepForPair z progiem/N testowane w unit/mutation 69/17). Uwaga: okablowanie diploBrakeWarParams w main to nadal test zrodlowy.
6 oslabiona asercja brake: ODDAL (przywrocona dokladna asercja, brake 51/0).
7 sygnal (e) vs R5(b): ODDAL (AI nie proponuje pokoju gdy isFeelingStronger; saturacja naprawiona: maks*min(1,t/T)).
8 premiaProfilObronny=0: DO DECYZJI CZLOWIEKA/orkiestratora. Sprzecznosc w dispatchu (+0.05 vs Zulusi 0.28 i Chinczycy 0.49 przy profilu=1). Udokumentowane ZALOZENIE w JSON, jedna liczba do zmiany. Nie blokuje.
9 migracja starych zapisow / round-trip: ODDAL (round-trip testowany; opoznienie <= minTurWojny, ZALOZENIE).
10 bramki: ODDAL (potwierdzone powyzej).

POWOD FAIL: jeden NAPRAW (zarzut 2 / kryterium 9).
BLOKADY: kryterium 9; R8, R9 (runda 2 wg dispatchu); decyzja pkt 8.
RUNDY: 2/5 zuzyte (R1 Operator+Evaluator FAIL, R2 Obrona). Nastepna: runda 3 (Operator), wylacznie zrzut Chromium + mutacja; bez zmian logiki.
NASTEPNY KROK: Operator (ten sam ID) -> Evaluator -> Final Control. Kolejnosc integracji: po PASS cherry-pick f61db5cc9 (+ ewentualne commity r3) na origin/rust-port/parity-v2 dopiero po zintegrowaniu R-WEB-ERA-WAR-COUNTER-Q1 (ten sam main.ts; konflikt blokow rozwiazuje orkiestrator), przed R8/R9 i R-WEB-PEACE-CITY-CESSION-Q1.
DEPLOY/PUSH: NIE WYKONANO
