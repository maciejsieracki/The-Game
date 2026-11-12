STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-TRADE-WIRING-E2E-Q1
GOAL: runda 3 (DODATEK 3, ABC A1): AI składa graczowi ofertę „równe za równe”, „Przyjmij” jest AKTYWNE bez forceAccept, przyjęcie przyciskiem daje umowę i dostawy; podgląd gracza bez zmian; bramka gracz->AI bez zmian.
ZMIANY/COMMIT: baza kandydat 93fb1bc21 (web-wip/...-r2) + merge origin/main -> 0aeb96a5b (bez konfliktów). Zmiany własne: gra/src/game/diplomacy-proposals.ts (stała AI_PROPOSER_FAIRNESS_REL_TOTAL=100; w evaluateProposal dla responderIsPlayer bramka 'handel' z relTotal 100), gra/src/main.ts (filtr enqueue ~20476: bramka rel 1 + givePn<=receivePn + previewIncomingPlayerAccept na payloadzie końcowym; selekcja pickAiPlayerCyclicBarter: fairnessGate z rel 1 i givePn<=receivePn, evaluateExactPayload z podglądem gracza; hak diagnostyczny diagPayload na tę samą bramkę), gra/tools/ai-trade-wiring-e2e-live-test.cjs (asercje A1, klik „Przyjmij” w oknie, tabela proporcji, kontrola zużycia sprzedawcy), evidence/r3-*. Commit: SHA w polu sha wyniku (czubek tej rundy). Podgląd „Przyjmij” (previewIncomingPlayerAccept, diplomacy-acceptance-points.ts) NIEZMIENIONY. Nie pushowano.

ZMIANA LOGIKI (co dokładnie):
- Bramka AI dla oferty AI->gracz: handelRequiredPn clampuje relację do 100, więc przy 100 wymagane givePn >= receivePn (współczynnik 1). Dotyczy filtra enqueue, selekcji i ścieżki evaluateProposal przy responderIsPlayer.
- Gorny limit (A1): AI nie oddaje więcej PW niż dostaje: givePn <= receivePn w selekcji i filtrze enqueue; dodatkowo filtr enqueue wymaga przejścia realnego podglądu „Przyjmij” gracza. Razem: wyłącznie oferty „równe za równe” (givePn == receivePn).
- Diagnoza z r2 potwierdzona: sama bramka AI (bez limitu) przepuszcza oferty z nadpłatą (np. 1400 PW za 50 PW) i wtedy podgląd gracza je odrzuca. Pierwsza próba (tylko zmiana relacji) dała pusty stół: selekcja szuka wyłącznie po stronie „AI daje >= dostaje”, a limit po stronie podglądu jest potrzebny, żeby filtr nie wpuszczał nadpłaty. Filtr enqueue działa na payloadzie PO clamp/trim, więc limit tam jest sprawdzany ostatecznie.
- Scenariusz testu zmieniony: para zelazo/cegla (AI daje zelazo 20 PW/szt.) nie ma w selekcji rozwiązania równego (AI musiałoby przyjąć >= 40 cegieł/turę, a potrzeba cegły AI to krok 10 -> selekcja = null, zmierzone: "selekcja ... -- null" w przebiegu pośrednim). Użyta para cegla/zelazo (AI daje cegłę 5 PW/szt., bierze zelazo 20 PW/szt.; 40 cegieł = 200 PW = 10 zelaza). AI-cegielnia/gracz-odlewnia w setupie zamienione odpowiednio.

TESTY (surowe wyniki z tej sesji):
- tsc --noEmit: exit 0 (po wszystkich zmianach i po przywróceniu źródła z mutacji).
- ai-trade-wiring-e2e-live-test.cjs (Chromium headless, bundle vite zbudowany POZA repo do scratchpadu, file://, ?civTest=1): 44 pass / 0 fail, exit 0 (evidence/r3-live-run.log). Przebieg pośredni (tylko zmiana relacji, BEZ limitu) też dał 42/0, ale wyłącznie dlatego, że oferta nadal była nadpłacona i stare asercje DECISION_REQUIRED były zielone — ten przebieg NIE jest dowodem A1; dowodem jest przebieg 44/0 po aktualizacji testu.
- Mutacja A1 (zdjęcie limitu: 4 klauzule w main.ts: givePn<=receivePn w selekcji, givePn>receivePn i podgląd w enqueue, `void` na podglądzie w selekcji): live test exit 1 (evidence/r3-mutacja-zdjety-limit-live.log). Czerwone: „Przyjmij” disabled w oknie; wycena 1100 PW za 200 PW (previewAccept.accepted=false, „Przewaga u Ciebie … (900 PW)”); stół z ofertą 225 cegieł za 10 zelaza; brak umowy; wszystkie asercje dostaw FAIL. Źródło po mutacji przywrócone (cmp z kopią: identyczne).
- Tabela proporcji (evidence/r3-live-result-grid.json, siatka give 10..200 x recv 10..200 krok 10 = 400 ofert/parę, 6 par, w żywej grze, relacja AI->gracz 11,6): aiA1 = oferta przechodzi bramkę AI z limitem; player = podgląd „Przyjmij” gracza przechodzi; both = obie; bothNotEqual = 0 we wszystkich parach.
  cegla->zelazo: aiA1 5, player 360, both 5 | zelazo->cegla: 5, 45, 5 | drewno->kamien: 6, 343, 6 | kamien->drewno: 6, 63, 6 | zelazo->kamien: 1, 22, 1 | drewno->cegla: 4, 370, 4.
  Wniosek: oferty „równe za równe” istnieją, ale są rzadkie (1–6 z 400 na parę na siatce krok 10). Selekcja przeszukuje pełny zakres do maksimum zapasu, więc znajduje je, gdy istnieją (w teście: 40 cegieł / 10 zelaza).
- Zrzut okna z aktywnym „Przyjmij”: evidence/r3-05-okno-przyjmij-aktywne.png (oraz r3-05b przed przyjęciem, r3-06 po przyjęciu przyciskiem).
- Bramki referencyjne (exit 0): logic-test LOGIC OK 213/213; tech-tree-test 20 pass / 0 fail; research-test PASSED 33 / FAILED 0; unit-replace-test 21 OK / 0 FAIL (tabela R-PROC §Bramki nadal podaje 13 — nieaktualna, osobny temat); combat-test All sanity checks passed (6/6).
- ai-trade-proposal-branch-test: 10 passed, 0 failed. ai-trade-proposal-to-player-test: 25 assertions passed.

PRZEBIEG UMOWY (tura -> zasoby, scenariusz testu, live):
- Oferta na stole po realnym endTurn (tura 2): AI daje 40 cegły/turę, prosi 10 żelaza/turę, per_turn, 10 tur. Przycisk „Przyjmij” AKTYWNY (previewAccept.accepted=true, awaitingMe=true).
- Przyjęcie PRZYCISKIEM w oknie (klik karty HUD „Dyplomacja” -> data-negot-act="accept-package"): oferta zdjęta ze stołu, umowa umowa_wymiany-0-1-t3 w cyclicDeals (pozycje: cegla 40/tura AI->gracz, zelazo 10/tura gracz->AI). Zrealizowano bez forceAccept.
- Tick dostaw (tura 3 -> 4), zapasy PRZED / PO:
  AI cegla 430 -> 405 (różnica −25 = −40 z umowy + 15 naturalnego przyrostu zapasu AI, zmierzone kontrolą bez umowy, ctlSellerDelta=+15).
  AI zelazo 0 -> 10 (+10 z umowy; kontrola bez umowy: 0 ubytku).
  Gracz cegla 0 -> 19 (= 40 z umowy − 21 naturalnego ubytku, zmierzone kontrolą bez umowy: ctlLossGive=21).
  Gracz zelazo 280 -> 210 (−10 przekazane w umowie; −60 w tym samym tiku — patrz NIE_ZMIERZONO).
- Zapis w trakcie umowy + wczytanie: umowa zachowana (te same pozycje); kolejny tick: gracz cegla 19 -> 38, AI cegla 405 -> 380 (dostawy trwają).
- Odrzucenie przyciskiem „Odrzuć” w oknie: stół czysty, cooldown odrzuconej oferty zapisany, brak umowy; po dwóch turach AI nie składa nowej oferty.
- Stary zapis (bez pól AI-TRADE): ładuje się bez błędu, cooldown barteru pusty, koniec tury działa; zero console.error/pageerror.

ZARZUTY/OTWARTE (uczciwie):
1. SPRZECZNY KOMUNIKAT W OKNIE (zrzut 05): przy aktywnym „Przyjmij” panel „Wpływ relacji na deal” nadal pisze „Relacja 11,6 · musisz dać więcej (×8,6 PW), by oferta była uczciwa” — to tekst z innej (wyższej) wyceny dla relacji 11,6; podgląd gracza (netPw>=0) już przepuszcza. Nie ruszałem UI ani podglądu (poza zakresem). Do FC/ABC: ujednolicić wyświetlany warunek z regułą A1.
2. Zakres relacji: pomiar i test w tej rundzie są przy relacji AI->gracz 11,6. Siatka z r2 (Rel 50/80/100/130) dotyczyła starej reguły i starej pary; NIE_ZMIERZONO dla innych relacji dla r3 (bramka AI przy A1 nie zależy od relacji, ale podgląd gracza w handlu bazowym tak — nie sprawdzone).
3. Ścieżka evaluateProposal dla AI-proponenta (responderIsPlayer) dostała współczynnik 1 bez górnego limitu: w tej ścieżce oferty z nadpłatą AI przechodzą bramkę AI. Limit egzekwują selekcja i filtr enqueue; podgląd gracza blokuje przyjęcie. Ryzyko: inne ścieżki AI->gracz (nie cykliczne) oceniane tylko przez evaluateProposal. NIE_ZMIERZONO, czy są takie ścieżki w grze.
4. Clamp per_turn: po selekcji ilości mogą zostać zmniejszone (w r2 zaobserwowano 90->75 zelaza). Dlatego limit sprawdzany jest ostatecznie na payloadzie po clamp/trim w filtrze enqueue; w teście oferta była dokładnie równa (40/10).
5. MECHANIZM „ubytku 60” (punkt 5 DODATKU): w tym tiku zapas żelaza gracza spadł o 60 poza umową (280 -> 210 przy przekazaniu 10). Ten sam wzorzec co w r1 (kontrola bez umowy: 70 -> 10). Dostawa tego NIE powoduje (transferSurowiecIlosc przenosi całość; w tiku z umową po stronie odbiorcy ubytek jest taki sam jak w kontroli cegły: 21). Co konkretnie zjada zapas (utrzymanie/zużycie/limit): NIE_ZMIERZONO — kontroli bez umowy dla zapasu żelaza gracza nie mierzyłem w r3.
6. Wersja testu: bundle z file:// (bez serwera dev), zgodnie z dispatchem; cel hook ?civTest=1 bez zmian poza asercjami A1.

Nie zmieniano: WERSJE.md, gra/ poza trzema plikami wyżej, allowlisty r1 poza nimi. Nie uruchamiano `npm run build`/`dev`; npm ci --ignore-scripts w gra/; vite build wyłącznie do katalogu poza repo.

BLOKADY: brak technicznych. Otwarte: zgodność komunikatu UI (zarzut 1), ścieżka evaluateProposal (zarzut 3), mechanizm ubytku (zarzut 5) — wszystkie NIE_ZMIERZONO lub do decyzji FC.
RUNDY: 3/5 (DODATEK 3; ten plik jest NOWY — raport r2 10-operator-claude.md zostawiony bez zmian, zgodnie z DODATKIEM 3 pkt 6).
NASTĘPNY KROK: Evaluator r3 (test live 44/0, mutacja czerwona, tabela proporcji, bramki) -> Final Control -> integracja orkiestratora (sprawdzić ancestry 0aeb96a5b i git diff --stat przed integracją).
DEPLOY/PUSH: NIE WYKONANO
