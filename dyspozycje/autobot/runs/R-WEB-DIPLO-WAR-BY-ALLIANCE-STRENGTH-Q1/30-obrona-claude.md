# R-WEB-DIPLO-WAR-BY-ALLIANCE-STRENGTH-Q1 — obrona Operatora (runda 1, odpowiedź na raport Evaluatora e0366d9)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-WAR-BY-ALLIANCE-STRENGTH-Q1
GOAL: słaba AI z sojusznikami wypowiada wojnę siłą bloku (próg 20% + charakter), za flagą domyślnie false.
ZMIANY/COMMIT: baza kandydat 70b4596ac5cdb28ad1d82c719d25bfface085c32; poprawki w gra/src/main.ts (commit obrony, SHA w polu sha raportu orkiestratora). Allowlista: tylko gra/src/main.ts.

ODPOWIEDZI NA ZARZUTY:
1. PRZYJMUJĘ. Dodano import setWarByAllianceStrengthForTest oraz hak `__truceTestDebug.warByAllianceStrengthForTest.setEnabled(v)` obok zeroTrustForTest (hak testowy, NIE UI, domyślnie OFF).
2. PRZYJMUJĘ. Sojusznik połączony sojuszem z OBIEMA stronami jest teraz wykluczony z obu bloków (zbiór sojusznicyPrzeciwnika w blokSojusznicyDla; symetryczne dla wywołań AI i partnera). Brak podwójnego liczenia.
3. ODRZUCAM z dowodem: diplomacy-proposals.ts:477 (`if (!econ) return true`) pokazuje, że Wasalizacja może istnieć bez ekonomia, a wtedy kierunek suwerena nie jest zapisany w danych. Zgadywanie strony byłoby gorsze niż ostrożne wykluczenie obu stron. Zachowano dotychczasowe zachowanie konserwatywne.
4. ODRZUCAM część „kaskada”: dispatch oznacza dołączanie sojusznika przez kaskadę jako krok OPCJONALNY (cyt. „opcjonalnie w tym samym kroku, jeśli proste"); nie jest to brak wymagany. Metryki wojen blokowych (liczba, tura pierwszej) pozostają NIE_ZMIERZONO: brak biegu gry w tej rundzie. Odróżnialność wojen blokowych w logach: sufiks `[blok sily: ...]` w powodzie komendy (ai.ts, tylko za flagą).

TESTY (surowe wyniki, po poprawkach, cwd gra/, node_modules z `npm ci --ignore-scripts`):
- tsc --noEmit: exit 0
- diplomacy-alliance-strength-unit-test: 33 OK, 0 FAIL (exit 0)
- diplomacy-test: 149 passed, 0 failed (exit 0)
- diplomacy-zero-trust-unit-test: PASS=43 FAIL=0 (exit 0)
- ai-ai-alliance-tick-test: suite 19/19 OK; mutants detected 8/8 (exit 0)
- logic-test: LOGIC OK (213/213) (exit 0)
- NIE_ZMIERZONO: tech-tree 20, research 33, unit-replace 21, combat 6 (nie uruchamiane w tej rundzie); npm run build nie wykonywany (zakaz); `git diff --check` nie uruchomiony w tej rundzie.
- Poprawka pkt 2 i hak pkt 1 w main.ts nie mają testu jednostkowego (logika w boot()); zweryfikowane tylko kompilacją tsc.

BLOKADY: brak.
RUNDY: 1/5 (obrona w rundzie 1).
NASTĘPNY KROK: Final Control (po czystym diffie 70b4596..HEAD tylko gra/src/main.ts + ten raport).
DEPLOY/PUSH: NIE WYKONANO
