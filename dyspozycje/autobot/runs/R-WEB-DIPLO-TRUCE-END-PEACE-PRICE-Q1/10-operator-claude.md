# R-WEB-DIPLO-TRUCE-END-PEACE-PRICE-Q1 — raport Operatora (runda 1/5, HAIKU 5.5)

STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-TRUCE-END-PEACE-PRICE-Q1 (tag TRUCEPRICE)
GOAL: po wygaśnięciu rozejmu AI zawsze składa propozycję pokoju z CENĄ zależną od układu sił; pokój po rozejmie nie jest już za darmo; odmowa gracza = wojna.
BAZA: origin/main e70abe718fc962b4d87f3c154dd58e2c2f7f49de (worktree wf_76d45383-00b-1, detached).

## ZMIANY-COMMIT

Allowlista (wykonana): gra/src/game/diplomacy-peace-lock.ts, gra/src/main.ts (porty rozejmu, zgoda gracza, płatność AI↔AI), gra/src/game/diplomacy-truce-end-price.ts (nowy moduł, reguła ceny), gra/tools/diplo-truce-impl-test.cjs, gra/tools/truce-end-war-notice-test.cjs, gra/tools/truce-end-peace-price-test.cjs (nowy), ten raport.

Co zostało zrobione:
- `truceEndPriceRule` (diplomacy-truce-end-price.ts): pasmo ±prog z `WAR_PEACE_PARAMS.przewagaMilitarna.prog` (0,2, bez zmiany wartości). Silniejsza ≤ (1+prog) × słabsza = pasmo "within" → słabsza strona płaci SUROWCAMI (remis → inicjator rozejmu płaci). Powyżej = "outside" → słabsza płaci MIASTEM. Dokładnie +20% NIE jest przewagą. Brak armii u słabszej = outside.
- `truceEndTickPair` (diplomacy-peace-lock.ts): wygasły rozejm ZAWSZE daje AI-propozycję z ceną. Para z graczem → oferta w skrzynce gracza (od AI, `truceEndOffer.fromOwnerId` = AI, także gdy gracz był inicjatorem). Para AI↔AI → pokój tylko gdy `settlePeacePrice` zwróci true, inaczej wojna. Usunięta darmowa zgoda AI (truceEndAiAccepts nie jest już używana w ścieżce; funkcja zostaje jako helper testów).
- `truceEndAcceptCore` (nowy): zgoda gracza = płatność wg reguły; zapłata OK → pokój (finalizePeace od AI), brak zapłaty → wojna bez kary. `truceEndSettleCore` / `truceEndPriceFor`: pomocnicze.
- main.ts: port `settlePeacePrice` → `settleTruceEndPrice` (płatność: surowce = ogon złoto→brąz→żelazo→rudy bez miast; miasto = tylko miasta płatnika, bez ogona; przelew tylko przy pełnym pokryciu; dla pary AI↔AI dodatkowo `isAiAiPeaceBalanceAllowed` z pokojAiAi.minBilansPW). Cena wyciągnięta z tickAiAiPeaceRequests do `aiAiPeacePriceFor` (ta sama wycena, bez zmiany wzorów). Ścieżka zgody gracza w resolvePendingDiplomacy używa truceEndAcceptCore; przy braku zapłaty pokazuje komunikat „wojna trwa”.
- Zgodność wsteczna zapisów: nie dodano żadnych nowych pól w DiploPairMeta; cena liczona na żywo z sił w chwili zgody. Stare zapisy bez inicjatora → wojna (jak dotąd).

## TESTY

- `npx tsc --noEmit` → exit 0 (po wszystkich zmianach, także po dodaniu bilansu AI↔AI).
- `node tools/truce-end-peace-price-test.cjs` → 35 PASS / 0 FAIL (część 1 reguła: granice 110/100, 120/100, 121/100, remis, 0:0, nieprawidłowe dane; część 2 cykl: (a)–(f) z portami-atrapami, zgoda gracza, brak zapłaty; część 3 wiring w main.ts; część 4 mutanty: M-THR (pasmo bez progu) i M-PAYER (zamiana płacącego przy remisie) wykryte — testy czerwone na mutantach).
- `node tools/diplo-truce-impl-test.cjs` → 93 PASS / 0 FAIL. Zmiana asercji (old contract „AI-adresat akceptuje za darmo wg 80% siły”): blok B-4 przepisany na nowy kontrakt (oferta od AI, zgoda z płatnością, brak zgody = wojna); asercja źródłowa „getArmyM w truceEndAiAccepts” zastąpiona asercją „getArmyM w truceEndPriceRule”; mutant M1 przepięty z truceEndAiAccepts na pasmo reguły ceny; blok R6 (C) 0 vs 0 przepisany na parę AI↔AI (remis → płaci inicjator). Asercje samej funkcji truceEndAiAccepts (80%/81%/0 vs 0) ZOSTAŁY bez zmian — funkcja nadal istnieje i jej kontrakt nie został usunięty.
- `node tools/truce-end-war-notice-test.cjs` → 20 OK (exit 0). Zmiana asercji: scenariusz „odmowa AI” (gracz inicjator, AI odmawia) był starym kontraktem — w turze wygaśnięcia jest teraz oferta, nie wojna; scenariusz przepisany na: oferta bez wojny w turze 10, timeout w turze 11 = wojna z wpisem `truce-war-11-0-1`; dodane: AI↔AI z zapłatą = pokój, AI↔AI bez zapłaty = wojna. Mutanty M1/M2 bez zmian.
- Bramki zielone (liczby z surowego wyjścia): ai-test 297 passed / 0 failed; logic-test PASS (ostatnia pozycja [213]); tech-tree-test 20 pass / 0 fail; research-test ALL GREEN; combat-test All sanity checks passed; war-rules-multiwar-main-guard-test 21 PASS / 0 FAIL; diplomacy-war-limit-unit-test pass=57 fail=0; war-limit-truce-count-test 19 pass / 0 fail; diplo-truce-n6-saveload 8 PASS; diplo-truce-r1 31 PASS; diplo-truce-r4-ai 24 PASS; diplo-truce-until-turn 15 PASS / 0 FAIL; diplo-human-peace-no-war 13 PASS / 0 FAIL; diplo-war-tribute-once 8 PASS / 0 FAIL; ai-war-nearest-city-peace-2t 15 mutantów zabitych, PASS.
- NIE ZMIERZONO: testy live (diplo-truce-live, diplo-truce-saveload-live, diplo-truce-ai-table-live) — wymagają Chromium, nie uruchamiane. Runtime w przeglądarce (zgoda gracza w skrzynce, płatność na żywo) — NIE ZMIERZONO; main.ts testowany tylko przez typecheck i testy źródłowe, nie przez wykonanie silnika tury.

## BLOKADY

1. KONFLIKT DO ROZSTRZYGNIĘCIA (DECISION_REQUIRED, patrz niżej): brak pełnego pokrycia ceny.
2. Punkt 6 dispatchu (pokój proponowany przez GRACZA po rozejmie: AI przyjmuje przy zrównoważonej cenie zamiast starego „≤80%”) NIE ZROBIONY: ścieżka zgody AI na propozycję gracza (cenaPokoju) nie była w zakresie tego przebiegu; stary warunek 80% istnieje już tylko w helperze truceEndAiAccepts, którego ścieżka nie używa.
3. Ogólna reguła dotycząca miast: wybór miasta do cesji przy >20% to ta sama lista co dla AI↔AI (planCityPeacePayment, zakaz stolicy/ostatniego miasta). Nie sprawdzono w grze, czy dla gracza-płacącego `aiPeacePaymentAssets` zwraca poprawne zasoby (kod jest wspólny dla właściciela, ale nieprzetestowany dla ME()).

## DECISION_REQUIRED — konflikt reguł (jedno zdanie na wariant, bez rozwiązania)

- Wariant A: pokój po rozejmie wchodzi także przy niepełnej zapłacie (częściowa zapłata = pokój), a nie tylko przy pełnym pokryciu.
- Wariant B: pokój po rozejmie wchodzi tylko przy pełnym pokryciu ceny; przy niepełnym (np. brak miast o pełnej wartości, brak surowców) wojna wraca (tak zaimplementowano jako domyślne zachowanie).
- Dodatkowe sytuacje do potwierdzenia: płatnik-gracz bez wystarczających surowców lub miast przy zgodzie → wg wariantu B wojna.

## NASTĘPNY KROK

Orkiestrator: pytanie ABC do właściciela o wariant A/B (pokrycie ceny po rozejmie) z opisem skutku dla gracza; po ECHO — dopisek poprawki w tym samym temacie. Po zatwierdzeniu wariantu B: sprawdzić w przeglądarce (testy live) zgodę gracza i płatność. Punkt 6 dispatchu — osobny temat lub rozszerzenie po decyzji.

RUNDY: 1/5 (Operator HAIKU 5.5; brak sonnet, brak rund powtórnych)
DEPLOY/PUSH: NIE WYKONANO
