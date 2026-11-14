STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-WEARINESS-AS-PW-PEACE-ITEM-Q1
GOAL: zmęczenie wojną jako pozycja PW przy pokoju (Z = round(C×x²)) widoczna w tabeli; bilans zgodny z decyzją AI; rabat 60% usunięty.
ZMIANY/COMMIT: baza f6ced4d1d (merge-base 656a0f0d2 OK). Zmiany tej rundy (allowlista: gra/src/ui/diplomacyAcceptanceBalance.ts, gra/src/game/diplomacy-proposals.ts):
  - diplomacyAcceptanceBalance.ts balancePanelDataFromRows: przy zablokowanym wierszu (canAccept=false) pole responderPreview zachowuje wearinessPw (zarzut 6, część plumbingu; wiersz Z nie znika).
  - diplomacy-proposals.ts: tylko komentarz przy bramce 'stronger' (zarzut 3 ODRZUCONY, patrz niżej). Kod bez zmiany względem f6ced4d1d.
  Commit: SHA w polu sha orkiestratora (commit po tym pliku).
TESTY (surowe wyniki, uruchomione lokalnie w worktree po npm ci w gra/):
  - tsc --noEmit: exit 0
  - git diff --check: czysty
  - diplo-weariness-as-pw-peace-item-test: PASS=76 FAIL=0
  - ai-war-weariness-peace-test: PASS=101 FAIL=0
  - diplo-peace-balance-accept-test: 32 pass / 0 fail
  - diplo-war-peace-sim-test: 25 pass / 0 fail
  - diplo-peace-weaker-seeks-city-only-test: 35 pass / 0 fail
  - Pełny przebieg wszystkich tools/diplo-*.cjs NIE dokończony (przerwany limitem czasu, zadanie w tle zatrzymane). Nie raportuję wyniku, którego nie zmierzyłem.
  - Uwaga procesowa: uruchomienie testów zmodyfikowało śledzone PNG w dyspozycje/autobot/runs/{R-WEB-AGGRESSOR-MARKER-Q1,R-WEB-DIPLO-NAP-TRUST-30-Q1,R-WEB-WAR-AGGRESSOR-FLAG-Q1}/evidence/ (przywrócone git checkout; nie są w commicie).
ODPOWIEDZI NA ZARZUTY EVALUATORA:
  1. (e) Chromium: NIE ZMIERZONO. /usr/bin/chromium istnieje, ale build poza repo i hooki ?civTest=1 nie zostały wykonane w tej rundzie. Status: PRZYJMUJĘ jako otwarte. Zrzut 'Zmęczenie wojną +N PW' w wczesnej i późnej turze wojny nadal do zrobienia.
  2. (b) test tautologiczny: PRZYJMUJĘ. Nie naprawiony w tej rundzie. Test nadal porównuje wearinessUnconditionalEndDue(L) z R==0 (oba zależne od L). Do przepisania na wywołanie realnej ścieżki decyzji AI/evaluateProposal.
  3. (silna AI wymaga miasta C, bilans tabeli 0): ODRZUCAM zmianę na R (proba zrobiona i cofnięta). Dowód: po przejściu na basePn (R) czerwieniały testy: diplo-peace-balance-accept C1 ('AI silniejsza militarnie, bez miasta => accepted=false', dostała accepted=true, wearinessPw=500) i C2 ('silniejsza AI przy 120 turach => nadal odrzucone'); diplo-war-peace-sim S3b (gracz od tury 10 dostaje odrzucenie 'miasta warte 0 PN, wymagane 660/642/587/495/367/202 PN') i S3c ('po 20 turach silniejsza AI nadal odrzuca' — dostała 'Warunki pokoju spełnione' x11). To wiążąca reguła R-WEB-DIPLO-PEACE-WEAKER-SEEKS-CITY-ONLY-Q1 (bez wygasania). Dispatch nakazuje w takim konflikcie DECISION_REQUIRED, nie zmianę reguły miasta. Rozjazd tabela↔decyzja dla 'stronger' przy L≥0,8 POZOSTAJE i wymaga decyzji właściciela.
  4. (brak kierunku AI→gracz; ai.ts bezwarunkowy poza diffem): PRZYJMUJĘ. Gałąź bezwarunkowa w ai.ts (~l.7050, wearinessUnconditionalEndDue(wearyLevel)) nadal omija evaluateProposal i tabelę; wiersz Z jest tylko po stronie 'Oni oddają' (gracz proponuje → AI odpowiada). Tabela dla oferty AI→gracz (Z po stronie gracza) NIE zbudowana. Wymaga osobnego tematu lub decyzji o zakresie.
  5. (dowód mutacyjny niepełny): PRZYJMUJĘ jako prawdziwy brak. Nie dodano testu behawioralnego evaluateProposal z wearinessPw/pwBalance dla tur 10–20. Mutacja basePn=C nadal wykrywana tylko przez asercję regexową (e).
  6. (wiersz Z znika przy blokadzie; brak testu UI; tooltip): CZĘŚCIOWO NAPRAWIONE: wiersz Z zostaje przy canAccept=false (commit tej rundy). PRZYJMUJĘ jako otwarte: brak testu UI wearinessPwRowHtml; tooltip nadal nie podaje tur wojny, utraconych miast i procentu zmęczenia (dispatch pkt 3).
BLOKADY:
  - (e) Chromium zrzuty — NIE ZMIERZONO.
  - Test (b) i test behawioralny (zarzut 5) — niezrobione.
  - Gałąź AI→gracz (ai.ts bezwarunkowy + tabela po stronie gracza) — niezrobione.
  - Tooltip i test UI wiersza Z — niezrobione.
  - DECISION_REQUIRED (właściciel, ABC): silna AI ('stronger') przy L≥0,8 — (A) nadal wymaga miasta o pełnej cenie C (stan obecny; testy wiążące to potwierdzają; tabela pokazuje bilans 0 = rozjazd), albo (B) wymaga miasta R = C − Z (zmiana wiążącej reguły R-WEB-DIPLO-PEACE-WEAKER-SEEKS-CITY-ONLY-Q1, wymaga aktualizacji testów C1/C2/S3b/S3c). Rekomendacja orkiestratora: A + usunąć bilans 0 z tabeli dla 'stronger' albo oznaczyć jako wyjątek; decyzja właściciela.
RUNDY: 1/5 (runda obrony; ten sam temat, FAIL wraca do Operatora)
NASTĘPNY KROK: Evaluator (runda 2) ponownie: zweryfikować commit tej rundy (plumbing wiersza Z), oraz decyzję właściciela dla 'stronger' (DECISION_REQUIRED). Przed kolejnym przebiegiem Operatora: przepisać test (b) na realną ścieżkę, dodać test UI wearinessPwRowHtml i zrzut Chromium (e).
DEPLOY/PUSH: NIE WYKONANO
