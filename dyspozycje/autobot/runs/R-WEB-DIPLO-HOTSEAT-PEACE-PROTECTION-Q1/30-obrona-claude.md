STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-HOTSEAT-PEACE-PROTECTION-Q1
GOAL: pokój między dwoma fotelami (hotseat) ma tę samą regułę czasu co pokój z AI (10 pełnych tur wojny przed pokojem; ochrona po pokoju już działa).
ZMIANY-COMMIT: kandydat 938e70a2c (baza b1e4e04ab). Obrona zmienia wyłącznie gra/tools/hotseat-peace-protection-test.cjs (funkcja runHumanPeaceReject: predykat bramki czasu bierze się teraz z PRODUKCYJNEGO ciała `peaceProposalBlocked` z gra/src/game/diplomacy-peace-proposal-timing.ts zamiast reimplementacji reguły). gra/src/main.ts NIE zmieniany. Commit obrony: patrz pole sha. Plik raportu: 30-obrona-claude.md.

ODPOWIEDZI NA ZARZUTY:
1. PRZYJMUJĘ. Atrapa `peaceProposalIsTooEarly` w teście powtarzała regułę. Poprawka: `runHumanPeaceReject` buduje predykat z `extractBody(timingSrc, 'peaceProposalBlocked')` i wywołuje go z PEACE_PROPOSAL_MIN_WAR_TURNS czytanym z modułu timingu. Atrapa pozostaje tylko do odczytu stanu (status relacji, tury wojny), które są wejściem testu. Połączenie z prawdziwym licznikiem nadal sprawdza kontrakt źródłowy (GATE_LINE). Asercje nie osłabione (oczekiwane komunikaty i wartości bez zmian).
2. PRZYJMUJĘ JAKO ZAŁOŻENIE (bez zmiany kodu). Luka rozstrzygnięta wg analizy WOJNA-WASALIZACJA-I-POKOJ-MIEDZYLUDZKI-2026-11-26 §3.3: pytanie brzmiało „czy pokój między dwoma graczami na hotseat ma wymagać tych samych 10 pełnych tur wojny co pokój z AI? (A: tak, ta sama reguła i licznik)”. Odpowiedź 4A = wariant A = bramka PRZED pokojem, co wdrożono. Ochrona PO pokoju już istnieje i nie była zmieniana: `finalizePeaceTreatyBetween` (main.ts:12957) wywołuje `startPeaceTreatyLock` z PEACE_TREATY_LOCK_TURNS = 10 (diplomacy-peace-lock.ts), a `playerDeclareWarOnOwner` i `ownerDeclareWarOn` sprawdzają `isPeaceLockedBetween`. Sformułowanie GOAL w dispatchu („po zawarciu pokoju… ochrona 10 tur”) jest niezgodne z tym, co zatwierdził właściciel, i z kodem. ZAŁOŻENIE: obowiązuje wariant A (bramka przed pokojem); GOAL do sprostowania przez orkiestratora. Jeśli właściciel miał na myśli coś innego, wymaga to potwierdzenia przed deployem.
3. ODRZUCAM (poza allowlistą). Licznik „dostępne za N tur” w HUD wymaga zmiany w gra/src/ui/interHumanDiplomacyHud.ts. Ten plik nie jest na allowliście dispatchu DODATEK (dozwolone: gra/src/main.ts, gra/src/game/diplomacy-*.ts, gra/tools/hotseat-peace-protection-test.cjs, dyspozycje/autobot/runs/R-WEB-DIPLO-HOTSEAT-PEACE-PROTECTION-Q1/**). Sama analiza (§5 pkt 3) opisuje licznik jako osobny krok („Wymaga licznika w interHumanDiplomacyHud.ts”), a dispatch nie wymienia go w GOAL ani w kryteriach binarnych. Zgłaszam jako kandydat na nowy temat (UWAGI-DLA-ORKIESTRATORA).

TESTY (surowe wyjście, po poprawce, worktree na 938e70a2c + zmiana testu):
- node tools/hotseat-peace-protection-test.cjs: PASS zachowanie 0 odchyleń; PASS kontrakt 0 odchyleń; PASS mutacja-zachowanie (2 odchylenia); PASS mutacja-kontrakt (1 odchylenie); WYNIK: PASS=4 FAIL=0, exit 0.
- node tools/diplo-human-peace-no-war-test.cjs: WYNIK: PASS=13 FAIL=0.
- Pełnych bramek (tsc, logic, ai-test, itd.) NIE PONOWIONO w tej rundzie: zmiana obejmuje wyłącznie plik narzędziowy testu, którego gra nie importuje; main.ts nie zmieniony w tej rundzie, więc wyniki rundy 1 (10-operator-claude.md, 20-evaluator-claude.md) dotyczą tego samego kodu gry. node_modules nie instalowano w tej rundzie.
- Mutacja nadal wykrywa brak bramki (2 i 1 odchylenie), więc test nie zrobił się zielony przy usuniętej bramce.

BLOKADY: brak w zakresie kodu. Otwarte: potwierdzenie wariantu A przez właściciela (zarzut 2); licznik w HUD poza zakresem (zarzut 3).

RUNDY: 2/5 (runda obrony po PASS-WITH-NOTES Evaluatora; bez zmian w grze)
NASTĘPNY KROK: Evaluator ponownie ocenia poprawkę testu (zarzut 1); orkiestrator prostuje GOAL i potwierdza wariant A z właścicielem przed deployem; zarzut 3 jako osobny temat.
UWAGI-DLA-ORKIESTRATORA: (a) GOAL dispatchu wymaga sprostowania (zarzut 2). (b) Czerwony peace-vazne-always-test (M1, wzorzec wcięcia 10 spacji) potwierdzony w rundzie 1 jako istniejący w bazie b1e4e04ab — osobny temat naprawy testu, nie ten temat. (c) Licznik „dostępne za N tur” w gra/src/ui/interHumanDiplomacyHud.ts — kandydat na osobny temat R-WEB-*, wymaga wpisu na allowliście.
DEPLOY/PUSH: NIE WYKONANO
