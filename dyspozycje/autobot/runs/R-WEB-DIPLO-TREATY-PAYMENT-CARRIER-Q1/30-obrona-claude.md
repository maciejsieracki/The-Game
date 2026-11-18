STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-TREATY-PAYMENT-CARRIER-Q1
GOAL: częściowo. Nośnik ogona (złoto/brąz/żelazo/rudy) podłączony do oceny i akceptacji dla NAP i sojuszy, gdy płaci gracz. Brak: stopień technologii, praca/pieniądze, kierunek AI→gracz (żądanie D), wiersz okna propozycji.
ZMIANY/COMMIT: f84a0ec1c (gra/src/game/diplomacy-proposals.ts, gra/src/game/treaty-payment.ts, gra/src/main.ts, gra/tools/diplo-treaty-payment-wiring-test.cjs). Raport: 30-obrona-claude.md.
TESTY (surowe wyniki; baza = 08c75518e, cur = f84a0ec1c):
- diplo-treaties-power-parity 50/0 (baza 50/0)
- diplo-treaties-ai-parity 80/0 (baza 78/0)
- diplo-rozejm-parity 25/0 (baza 25/0)
- diplo-peace-tail-integration 42/0 (baza 42/0)
- diplo-peace-tail-proposal 9/0 (baza 9/0)
- diplo-war-peace-sim 25/0 (baza 25/0)
- diplo-peace-last-stage-payment OK (baza OK)
- diplo-treaty-payment-carrier 11/0, 0 mutantów niewykrytych (baza 11/0)
- NOWY diplo-treaty-payment-wiring 95/0; mutanty M1 (bramka ignoruje nośnik), M2 (brak attach), M3 (brak odjęcia koszyka) wykryte
- logic 213/213; tech-tree 20/0; research 33/33; unit-replace 21/21; combat OK
- Przejściowo: bramka bez zapasów przepuszczała NAP (power-parity 48/2, rozejm 24/1). Naprawione przed commitem (brak zapasów = zero zapasów, nadal odrzut).
- tsc --noEmit: exit 2. NIE ZMIERZONO na czysto. Instalacja minimalna (esbuild, typescript, three) z powodu 3,7 GB wolnego (dispatch wymaga 4 GB). Błędy: brak typów vite/client (filePlayer.ts) i innych modułów, 177 linii w src/. Brak błędów w diplomacy-proposals.ts, treaty-payment.ts i w main.ts w zakresie 26200–26400. Porównanie z bazą niemożliwe (eksport bez tsconfig).
BLOKADY:
- zarzut 1: stopień technologii NIE podłączony (ProposalEvalContext nie ma listy technologii ani wyceny). NIE ZMIERZONO.
- zarzut 5: silna AI nie żąda D od gracza. Bramka działa tylko, gdy autor = gracz (treatyCarrierPlanForPlayerPayer: `if (!proposerIsPlayer) return null`). NIE ZROBIONE.
- zarzut 2: powód odrzucenia zawiera „możesz dopłacić: …; brakuje X PN" (polskie etykiety). diplomacyAcceptanceBalance.ts nie zmieniony. NIE ZMIERZONO.
- zarzut 8 / ZAŁOŻENIE 3b: stopnie praca/pieniądze (extraStages) nieaktywne do decyzji właściciela.
- granice i wasal: poza zakresem nośnika (ścieżka akceptacji nie przelewa koszyka). Bramka odrzuca jak dotąd (test W9).
RUNDY: 2/5 (obrona). Ostatni werdykt Evaluatora: FAIL zakresu.
ODPOWIEDZI NA ZARZUTY:
1. PRZYJMUJĘ częściowo. Wiring NAP/sojusz (gracz→AI, ogon): W2/W3 + M1/M2. Technologie: BLOKADA.
2. PRZYJMUJĘ częściowo. Powód z listą pozycji (W1/W2). Wiersz okna: BLOKADA.
3. PRZYJMUJĘ częściowo. Testy kierunku gracza i mutanty wiringu; kierunek AI→gracz brak.
4. ODRZUCAM. treaty-payment.ts jest importowany i wywoływany w diplomacy-proposals.ts (composeTreatyPayment, treatyPaymentLabel).
5. PRZYJMUJĘ jako otwarte. Brak implementacji; wymaga danych w ctx i decyzji właściciela.
6. PRZYJMUJĘ. Pliki treaty-parity istnieją i przechodzą (patrz TESTY). Tabela przed/po w TESTY.
7. PRZYJMUJĘ. pn stopnia = min(qty·cena, reszta); asercja W8 (Σ extra.pn = coveredByExtraPn).
8. ZAŁOŻENIE: extraStages puste do decyzji właściciela 3b.
NASTĘPNY KROK: (a) decyzja właściciela: 3b (¤ jako osobna pula) i kierunek AI→gracz (żądanie D); (b) osobny temat: technologie (lista techów i wycena w ctx + przelew odkrycia), wiersz okna propozycji. Bez tego GOAL(2)–(3) nie są spełnione.
DEPLOY/PUSH: NIE WYKONANO (push zakazany dla Operatora; orkiestrator).
UWAGI-DLA-ORKIESTRATORA: scratchpad/base (eksport 08c75518e, ~148 MB) i scratchpad/tools (esbuild, typescript, three) do sprzątnięcia po FC. gra/node_modules w worktree to symlink, nie jest w git.
