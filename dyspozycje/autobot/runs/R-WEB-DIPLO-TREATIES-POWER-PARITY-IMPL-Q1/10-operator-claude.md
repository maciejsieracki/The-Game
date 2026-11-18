STATUS: BLOCK (zakres częściowy — wymaga rundy 2)
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-TREATIES-POWER-PARITY-IMPL-Q1
GOAL: parytet siły i ceny ×10 dla 6 traktatów (rozejm, nap, granice, sojusz_defensywny, sojusz_pelny, wasal). Zrobione: dane + bramka gracza-autora dla 5 traktatów. Niezrobione: rozejm, ścieżka AI, panel/tooltipy, Civpedia/wiki, testy aktualizowane, Chromium.
ZMIANY-COMMIT: baza 2b950566f36d8b53a6ec512d3ba068b514bc6232; commit z kodem = SHA w polu sha raportu. Pliki: gra/data/diplomacy-acceptance-points.json (ceny ×10: rozejm 2000, nap 2000, granice 600, sojusz_defensywny 4200, sojusz_pelny 5000, wasal 3500; pola `parytet`/`platnik` — true/"slabsza" dla 5 traktatów, rozejm `parytet: false`); gra/src/game/diplomacy-proposals.ts (ProposalEvalContext.treatyPower; funkcja treatyParityPowerGate wpięta po treatyPnGate w evaluateProposalImpl); gra/src/main.ts (jedno miejsce: treatyPower w buildzie ProposalEvalContext, przez peacePowerSidesForPair/objectivePowerForOwner); gra/tools/diplo-treaties-power-parity-test.cjs (nowy). Nie użyłem treatyPwPointsByPowerRatio jako nowej nazwy — reużyta peacePwPointsByPowerRatio(X, …), która jest już ogólna w X.
TESTY:
- tsc --noEmit: exit 0.
- logic-test LOGIC OK (213/213); tech-tree-test 20 pass 0 fail; research-test ALL GREEN; unit-replace-test 21/21; combat-test "All sanity checks passed".
- diplo-treaties-power-parity-test (nowy): 22 pass, 0 fail (wzór S/W/D dla r = 1/1,5/2,67/5/10 + moc 0; bramka: słabszy gracz bez D → "Brakuje… parytetu"; silniejszy bez blokady; brak treatyPower = bez bramki; umowa_handlowa poza parytetem bez zmian; baza NAP = 2000).
- diplomacy-stol-pw-sum-test 168/0; diplomacy-bilans-unifikacja-test 27/0; diplo-weariness-c615-both-cities-test 12/0; dyplo-rel-current-etykieta-test 5/0; diplo-json-descriptions-sync 46/46.
- CZERWONE: diplomacy-acceptance-points-test 255 pass / 49 fail — wszystkie błędy to stare ceny (NAP 200, sojusz 500/420, granice 60, wasal 350) i pochodne liczby w asercjach panelu oraz 3 asercje U2 (bilans informacyjny). Asercje NIE ZAKTUALIZOWANE w tej rundzie (do zrobienia w rundzie 2, każda zmiana z uzasadnieniem).
- CZERWONE: dyplo-bilans-gate-n-e1-reprodukcja-test 21 PASS / 1 FAIL: asercja „TREATY_GATED_NEGOTIATION_ACTIONS === {pokoj, umowa_szlakow, umowa_handlowa}” (w teście jest rozejm). Nie zmieniałem tej stałej; wygląda na dług sprzed rundy (rozejm dodany wcześniej) — NIE ZWERYFIKOWANE na bazie.
- Uboczne: test dyplo-bilans-gate zmienił 6 plików PNG w dyspozycje/…/dowody — przywrócone git checkout, NIE w commicie.
- Chromium: NIE ZMIERZONO (nie wykonano).

BLOKADY / NIEZROBIONE (lista dla rundy 2):
1. Ścieżka AI: AI-autor (oferta AI → gracz, AI↔AI, planAiOfferOnTable, aiPeaceSignals, ai.ts) nie liczy parytetu. Przy ×10 bazie AI oferuje drożej bez wzoru S/W/D.
2. Rozejm: nie objęty bramką (idzie ścieżką pokoju, zależność od zmęczenia L: X = 2000×(1−L)) — parytet: false.
3. Stary `treatyBaseFairnessGap` (koszyk, proposerIsPlayer) nadal liczy X bez S/W/D: silniejszy gracz z koszykiem może dostać „Brakuje” z powodu własnej wyceny — sprzeczne z GOAL 2. Wymaga rozdzielenia w treatyPnGate/proposerUnfairToPartnerGate dla 5 traktatów.
4. Panel PW i tooltipy (diplomacyAcceptanceBalance.ts, diplomacyAudience.ts): brak wyświetlenia moc/r/S/W/D/rabat.
5. Civpedia/wikiBundle: hasła nie zaktualizowane.
6. Testy: 49 asercji w diplomacy-acceptance-points-test do aktualizacji; test TREATY_GATED (dyplo-bilans-gate) do decyzji.
7. Pokój i pokój wymuszony: nietknięte (zgodnie z zakazem).

UWAGI-DLA-ORKIESTRATORA:
- Tabela S/W/D z kodu (X = nowa baza, bez mnożnika czasu; r = 1/1,5/2,67/5):
  nap, rozejm (X=2000): r1 S2000 W2000 D0 | r1,5 S3000 W1333 D1667 | r2,67 S5338 W749 D4589 | r5 S10000 W400 D9600
  sojusz_defensywny (4200): r1 0 | r1,5 S6300 W2800 D3500 | r2,67 S11210 W1574 D9636 | r5 S21000 W840 D20160
  sojusz_pelny (5000): r1 0 | r1,5 S7500 W3333 D4167 | r2,67 S13345 W1873 D11472 | r5 S25000 W1000 D24000
  granice (600): r1 0 | r1,5 S900 W400 D500 | r2,67 S1601 W225 D1376 | r5 S3000 W120 D2880
  wasal (3500): r1 0 | r1,5 S5250 W2333 D2917 | r2,67 S9342 W1311 D8031 | r5 S17500 W700 D16800
- Wpływ na AI↔AI i częstość traktatów: NIE ZMIERZONO. Przy ×10 bazie słabszy gracz bez oferty D nie zawrze sojuszu/NAP z silniejszym przy r > 1 (D rośnie liniowo z r) — to świadomy wybór ABC „bez sufitu”, ale oznacza praktycznie zamknięte traktaty dla słabszej strony. Pomiar w harnessie wymagany przed deployem.
- Rekomendacja: runda 2 = punkty 1–6 wyżej; nie deployować przed domknięciem punktów 1 i 3 (inaczej silniejszy gracz może trafić na blokadę własnej wyceny).

NASTĘPNY KROK: runda 2/5 tego samego ID (ten sam Operator, ta sama baza 2b950566), start od punktów 1, 3, 6, potem 4–5.
DEPLOY/PUSH: NIE WYKONANO
