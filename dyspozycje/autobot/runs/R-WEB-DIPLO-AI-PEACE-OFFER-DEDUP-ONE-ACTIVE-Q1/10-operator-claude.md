STATUS: PASS-WITH-NOTES
DOMAIN: GAME (dyplomacja, stół negocjacyjny)
TEMAT: R-WEB-DIPLO-AI-PEACE-OFFER-DEDUP-ONE-ACTIVE-Q1 (DIPLO-5), runda 1/5, Operator HAIKU 5.5
GOAL: na stole co najwyżej JEDNA aktywna propozycja pokoju/rozejmu na parę (oferta gracza blokuje ofertę AI; nowa oferta AI zastępuje poprzednią ofertę AI tej pary). Bez zmiany cen, progów i cooldownów.

ZMIANY-COMMIT: baza e37eef15464fb6b84b45db0b91a6694a08925210 (origin/main). Commit na lokalnej gałęzi autobot/R-WEB-DIPLO-AI-PEACE-OFFER-DEDUP-ONE-ACTIVE-Q1 (SHA w polu sha). Pliki (allowlista):
- gra/src/game/diplomacy-proposals.ts: nowa czysta funkcja planAiOfferOnTable (eksport).
- gra/src/main.ts: enqueueNegotiationFromAiCmdImpl używa planera zamiast dedupu i ręcznego zastępowania.
- gra/tools/diplo-peace-offer-dedup-one-active-test.cjs: nowy test behawioralny.
- dyspozycje/autobot/runs/R-WEB-DIPLO-AI-PEACE-OFFER-DEDUP-ONE-ACTIVE-Q1/10-operator-claude.md: raport.
Zakres zmiany: dla actionId pokoj/rozejm (WAR_DEPENDENT_ACTIONS) — jeśli propozycja GRACZA tej pary jest na stole, AI nie dokłada; w przeciwnym razie wcześniejsze propozycje AI tej pary są usuwane i wstawiana jest nowa. Inne typy: dotychczasowy dedup tego samego typu, bez zmian.

TESTY:
- npm ci --ignore-scripts: OK (71 pakietów).
- tsc --noEmit: exit 0.
- logic-test: LOGIC OK (213/213).
- tech-tree-test: 20 pass, 0 fail.
- research-test: ALL GREEN.
- unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21).
- combat-test: All sanity checks passed.
- diplo-peace-offer-dedup-one-active-test (nowy): OK T1 maxPair=1 (symulacja 24 tur, AI co 3 tury pokoj/rozejm, gracz rozejm w t7); OK T2 blokada przez ofertę gracza; OK T3 wymiana oferty AI; OK T4 handel: dedup zachowany, inny typ przechodzi; OK T5 mutant (stary dedup) maxPair=2 — wykryty; OK T6 niezależność par. WSZYSTKO ZIELONE.
- 36 testów dyplomacji nielive (peace/truce/war-weariness/negotiation/alliance/city-offer): wszystkie exit 0. Pozostałe testy dyplomacji (ok. 320) NIE uruchomione w tej rundzie.
- Dowód live (Chromium /usr/bin/chromium dostępny): NIE ZMIERZONO — nie wykonano buildu vite ani sesji w przeglądarce w tej rundzie.

BLOKADY:
1. Live (Chromium, kilka tur oferty AI na żywo): NIE ZMIERZONO.
2. Punkt (4) dispatchu — „Przyjmij” wyszarzone dla oferty będącej czystym prezentem: NIE WYKONANO. Przyczyna nieustalona; raport DIAG (10-operator-claude.md, pkt 5) też jej nie ustalił. Bramka PW (previewIncomingPlayerAccept, main.ts ~22107) nie była zmieniana, bo brak reprodukcji.
3. Punkt (2) częściowo: nowa oferta AI zastępuje starą po cichu (brak komunikatu w „Ważne”). Sprzątanie ofert po pokoju (purgeWarDependentNegotiations) i prune po utracie wojny (pruneInvalidNegotiations) istnieją w bazie i nie były zmieniane; ich zachowanie na żywo nie zostało ponownie zweryfikowane.
4. Dar o actionId innym niż pokój/rozejm nie jest czyszczony po pokoju (pkt 4 raportu DIAG) — poza zakresem tego tematu, nie zmieniano.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet) — przegląd diffu i testu. Punkty (2) i (4) oraz live Chromium: osobny temat z reprodukcją blockReason „Przyjmij”, jeśli orkiestrator uzna za konieczne.
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
- Decyzja produktowa nie była potrzebna (bez zmian cen, progów i cooldownów). Przyjęto: AI może zastąpić swoją starszą ofertę przy każdej nowej decyzji (zgodnie z GOAL „wymiana, nie nawarstwianie”).
- Oferta GRACZA pokoju/rozejmu blokuje ofertę AI także gdy typ jest inny (pokój vs rozejm) — zgodnie z GOAL „co najwyżej jedna”.
