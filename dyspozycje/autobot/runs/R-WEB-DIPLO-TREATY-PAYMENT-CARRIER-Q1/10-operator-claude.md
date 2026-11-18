STATUS: PASS-WITH-NOTES (runda 2: stopień technologii + przemarsz/wasal podłączone do nośnika gracz→AI; kierunek AI→gracz NIE zrobiony)
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-TREATY-PAYMENT-CARRIER-Q1
GOAL: nośnik dopłaty D w traktatach z parytetem (NAP, sojusz obronny, sojusz pełny, przemarsz, wasal), gdy PŁATNIK = GRACZ (słabszy) i autor = gracz. Kolejność: technologie (tylko których druga strona nie ma) → złoto → brąz → żelazo → rudy. Praca/pieniądze poza zakresem (extraStages puste). Baza kodu: a8fad70001a4cbc18aecc3b3f363a615a7845244 (origin/main 0c12240a3 + runda 1).
ZMIANY-COMMIT: SHA czubka tej rundy podany w polu sha odpowiedzi operatora (commit po dodaniu raportu). Pliki:
- gra/src/game/diplomacy-proposals.ts: ProposalEvalContext +playerTechs/+partnerTechs; treatyCarrierPlanForPlayerPayer +parametr techs (techPn = diplomacyPnTech, zamiast `() => null`); treatyParityPowerGate i attachTreatyCarrier przekazują techy; treatyCarrier.items +typ 'tech' (tech przed złotem); TREATY_CARRIER_ACTIONS += 'granice', 'wasal' (aktualny komentarz).
- gra/src/main.ts (ctx budowany w jednym miejscu, ok. l.26042): playerTechs = ownerResearchedTechs(ME()), partnerTechs = ownerResearchedTechs(druga strona); komentarz o przelewie technologii zaktualizowany. Przelew technologii: pozycje giveItems typ 'tech' idą istniejącą gałęzią transferBasketItems (case 'tech' → grantTechToOwner).
- gra/tools/diplo-treaty-payment-wiring-test.cjs: W9 przepisany (granice/wasal przelewają koszyk), nowe W10 (tech w nośniku, typ tech pierwszy), W11 (tech już u drugiej strony odpada), W12 (planer z/bez listy techów), mutanty M4 (attach gubi techy), M5 (planer ignoruje techy drugiej strony).
Zmienione tylko te 3 pliki + raport. treaty-payment.ts i peace-tail-payment.ts NIE zmienione. Pokój i rozejm NIE ruszone.

TESTY (surowe wyniki, ZMIERZONO na tym SHA):
- npm ci --ignore-scripts w gra/: exit 0 (dysk przed startem 9,9 GB wolnego).
- tsc --noEmit: exit 0 (czysto, po wszystkich zmianach src).
- diplo-treaty-payment-wiring-test: 171 pass, 0 fail (mutanty M1–M5 wykryte; przed rundą 2 było 95/0).
- diplo-treaty-payment-carrier-test: 11 pass / 0 fail; mutanty niewykryte: 0.
- Parytet i pokój (tabela przed/po):
  | test | baza a8fad70 (r1) | po r2 |
  | diplo-treaties-power-parity-test | 50/0 (dispatch) | 50 pass, 0 fail |
  | diplo-treaties-ai-parity-test | 80/0 (dispatch) | 80 pass / 0 fail |
  | diplo-rozejm-parity-test | 25/0 (dispatch) | 25 pass, 0 fail |
  | diplo-peace-tail-integration-test | 42/0 | 42 pass / 0 fail |
  | diplo-peace-tail-proposal-test | 9/0 | 9 pass / 0 fail |
  | diplo-war-peace-sim-test | 25/0 | 25 pass / 0 fail |
  | diplo-peace-last-stage-payment-test | OK | OK |
  UWAGA: wartości „przed” z dispatchu nie były ponownie mierzone na bazie a8fad70; podane są wyniki po zmianie, a zielone = brak regresji względem asercji.
- Bramki: logic-test LOGIC OK (213/213); tech-tree-test 20 pass, 0 fail; research-test PASSED 33/33; unit-replace-test WSZYSTKIE ZIELONE (21/21); combat-test COMBAT TEST 6/6.

BLOKADY (NIE ZMIERZONO / NIE ZROBIONE):
1. Kierunek AI→gracz (żądanie D przez silną AI): NIE ZROBIONE. treatyCarrierPlanForPlayerPayer nadal zwraca null, gdy autor nie jest graczem (test W5 to dokumentuje). Wymaga osobnej ścieżki: przy propozycji AI gracz jest płatnikiem, a pozycje z jego zapasów muszą zostać dopisane po stronie giveItems respondenta — to zmienia kierunek przelewu w gałęzi main.ts; nie zweryfikowane.
2. Okno propozycji (diplomacyAcceptanceBalance.ts): NIE ZMIENIONE. Powód odrzucenia już zawiera listę z treatyPaymentLabel (polskie nazwy, bez surowych ID) albo „brakuje X PN”, ale osobnego wiersza/tooltipa w oknie nie dodawałem. NIE ZMIERZONO w przeglądarce.
3. Stopnie praca / pieniądze (¤): extraStages zostają puste — decyzja właściciela 3b (czeka na rano).
4. Przemarsz i wasal: włączone w TREATY_CARRIER_ACTIONS na podstawie kodu main.ts (acceptedKind inny niż UmowaSzlakow/UmowaHandlowa → gałąź transferBasketItems z payload.giveItems). Testem objęte tylko wiring w ocenie (W9: accepted + treatyCarrier); przelew przy zawarciu NIE zweryfikowany testem integracyjnym — NIE ZMIERZONO. Wasal ma dodatkowo bramkę Respektu ≥70 (niezmieniona).
5. Test integracyjny przelewu (funkcja main.ts) nie został napisany: wiring testuje ocenę (evaluateProposal), nie faktyczne przeniesienie pozycji w grze. Zgodnie z zasadą „wiring bez testu = NIE ZMIERZONO” przelew technologii i złota w grze jest NIE ZMIERZONO.
6. Tempo do wyceny technologii: diplomacyPnTech(name) używa domyślnego tempa 'standardowa' (pnOpts nie niesie tempoGry w tym module); przy innym tempie gry wycena techu może się różnić od wyceny w koszyku — do sprawdzenia.

RUNDY: 2/5 (operator, ten sam ID). Poprzednia runda: r1 FC FAIL (zarzuty 1–8 z 30-obrona-claude.md).
ODPOWIEDZI NA ZARZUTY FC r1:
(a) kierunek AI→gracz — NIE ZROBIONE (blokada 1).
(b) okno/tooltip — częściowo: powód zawiera listę pozycji; wiersz okna NIE (blokada 2).
(c) przemarsz i wasal — dodane do nośnika (blokada 4).
(d) technologie w ProposalEvalContext — ZROBIONE (playerTechs/partnerTechs, diplomacyPnTech, filtr „tylko techy, których druga strona nie ma”, testy W10–W12).
(e) test integracyjny obu kierunków i wszystkich pięciu traktatów — CZĘŚCIOWO: 3 traktaty w obu testach wiringu (NAP, sojusz pełny, przemarsz/wasal ocena) + mutanty M1–M5; kierunek AI→gracz i sojusz obronny w wiringu NIE sprawdzone osobno (sojusz obronny: ten sam mechanizm, brak asercji).

NASTĘPNY KROK: (1) decyzja właściciela 3b (¤ jako osobna pula, stopnie praca/pieniądze); (2) osobny temat: kierunek AI→gracz (żądanie D przez silną AI) — zmiana gałęzi main.ts dla propozycji AI; (3) wiersz/tooltip w diplomacyAcceptanceBalance.ts; (4) test przelewu w grze (funkcja wydzielona jak PEACELAST) dla technologii i przemarszu.
DEPLOY/PUSH: NIE WYKONANO (push zakazany dla Operatora; orkiestrator).
UWAGI-DLA-ORKIESTRATORA: (a) gra/node_modules w worktree zainstalowane przez npm ci (nieśledzone, do sprzątnięcia po FC). (b) W trakcie rundy przypadkowo zostawiłem pliki logów poza worktree (ścieżka względna z gra/, katalog nadrzędny) — nie do sprzątania przez Operatora bez zgody; treść nieistotna. (c) Pliki tymczasowe npm ci log w /tmp/claude-0-npmci.log i logi testów w /tmp/claude-0-*.log (do usunięcia po FC). (d) Nie zmierzono wpływu na sesje z przeglądarką; brak testu w Chromium.
