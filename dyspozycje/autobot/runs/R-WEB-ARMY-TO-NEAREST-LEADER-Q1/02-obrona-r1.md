STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-ARMY-TO-NEAREST-LEADER-Q1
GOAL: Jednostki zbierane do wodza idą do najbliższego dostępnego wodza (odległość = długość realnej trasy).
RUNDY: obrona po 1/5

Odpowiedzi na zarzuty:
1. B2 nie był RED na bazie: PRZYJMUJĘ. B2 zastąpiony B2a (pełny mur, wódz kampanii niedostępny) i B2b (mur z przejściem: wódz bliższy w linii prostej, dalszy po trasie). Asercja: ruch leży na realnej trasie do osiągalnego, najbliższego po trasie wodza. Na bazie B2a/B2b FAIL (gate-nearest-leader-test-RED-baza-r2.txt, 3 PASS / 12 FAIL), po poprawce PASS. Dodana mutacja odległości w linii prostej łamie test.
2. Brak testu zachowania ścieżki gracza: PRZYJMUJĘ CZĘŚCIOWO. Logika wyboru (filtr, wyprawa, brak trasy, ponowny wybór po zniknięciu wodza) wyniesiona z main.ts do army-concentration.ts (collectLeaderCandidates, pickNearestLeaderUnit) i przetestowana zachowaniowo (F, 12 asercji, 3 mutacje). main.ts jest tylko cienką nakładką (trasa marchPathPlan). Przycisk, issueGeneralQuickFollow i callback syncGeneralMarchTargets: dalej tylko kontrola statyczna (E3, E4). Przeglądarka: NIE_ZMIERZONO (zakaz build/dev w gra/).
3. pickNearestLeaderForUnit filtruje tylko po hp: PRZYJMUJĘ. Ten sam filtr co nearestLivingGeneral (dead, removed, routed, hp>0, właściciel) jest w collectLeaderCandidates, używany też przez ai.ts. Testy F: routed, removed, dead, hp=0, inny właściciel. Mutacje routed/removed łamią test.
4. Siatka regresji częściowo ślepa: PRZYJMUJĘ jako uwagę, bez zmiany kodu. Powtórzony PRZED/PO (95 plików): różnic 0 poza nowym testem i jednym testem przeglądarkowym PRZED=1 PO=0. ai-test.cjs: identyczna lista 20 FAIL PRZED i PO. ai-move-full-range samodzielnie PO EXIT=0. Zbiór ~25 pre-existing awarii pozostaje ślepy dla kampanii i wodza, to osobny dług, poza allowlistą tematu. Dowód pokrycia: army-to-nearest-leader-test (43 asercje, symulacja decideAITurn).
5. Koszt wydajności niezmierzony: PRZYJMUJĘ. Poprawki: obłożenie liczone raz na jednostkę (nie na wodza), jeden wódz = brak liczenia trasy, picker przycina wodzów po linii prostej (trasa >= odległość heksowa, remisy sprawdzane do końca; mutacja przycinania łamie test). Pomiar w teście (PERF): sim 120 tur x 3 ziarna, średnio 3.12 ms/turę PRZED, 0.26 ms PO (mniej ruchów); stres 80 jednostek, 4 wodzów: 18.7 ms PRZED, 3.9 ms PO. Wniosek: brak wzrostu kosztu tury AI. Interfejs gracza (pickNearestLeaderForUnit): NIE_ZMIERZONO, wołane zdarzeniowo, z tym samym przycinaniem.
6. onExpedition nieustawiane w ai.ts: ODRZUCAM. Blok jest tylko w etapach recruiting i gathering (ai.ts, appendAiGeneralCampaignOrders, warunek stage === 'recruiting' || 'gathering'), w których z definicji żaden wódz AI nie maszeruje na cel, a wodzowie zablokowani są odfiltrowani (blockedGeneralIds). Reguła wyprawy jest zaimplementowana i testowana w pickerze (A7, A8) i na ścieżce gracza (F fExpedition). Komentarz w kodzie to dokumentuje.

ZMIANY-COMMIT: fe60b40a5 (ai.ts, army-concentration.ts, main.ts, army-to-nearest-leader-test.cjs) + commit z logami i tym raportem. Operator: e7d290059, 97e5081da.
TESTY: tsc --noEmit EXIT=0 (gate-tsc-r2.txt). army-to-nearest-leader-test: 43 PASS, 0 FAIL, EXIT=0, 9 mutacji łamie asercje (gate-nearest-leader-test-r2.txt). Baza: 3 PASS / 12 FAIL (RED-baza-r2). Symulacja AI 3 ziarna x 120 tur: u nie-najbliższego PRZED 54/109 jednostek, PO 0/114; ruchów 305+347+389 PRZED, 55+58+82 PO. Regresja: gate-regresja-przed-po-r2.txt.
BLOKADY: brak
NASTĘPNY KROK: Evaluator
DEPLOY/PUSH: NIE WYKONANO
