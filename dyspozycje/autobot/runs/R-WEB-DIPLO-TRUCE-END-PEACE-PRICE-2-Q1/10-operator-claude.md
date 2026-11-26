# R-WEB-DIPLO-TRUCE-END-PEACE-PRICE-2-Q1 — Operator, runda 2/5 (HAIKU 5.5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-TRUCE-END-PEACE-PRICE-2-Q1
GOAL: pkt (1) z DODATKU r1: propozycja pokoju gracza do AI w oknie „po rozejmie” przechodzi przez truceEndPriceRule (AI przyjmuje przy pokryciu ceny); poza oknem bez zmian. Pkt (2) i (3) z r1 pozostają zielone.
BAZA: b49a48566f524b9a34ea1b55ac67181692f2bffe (origin/main 8ad1d555d + commit r2 orkiestratora, FC r1 c39df23f4)

## ZMIANY-COMMIT
Allowlista rundy 2 (w tym rozszerzenie z DODATKU r2): 
- gra/src/game/diplomacy-pn-engine.ts — pole `truceEndTurn?: number` w DiploPairMeta (brak pola = brak okna; zapis JSON to zwykła liczba).
- gra/src/game/diplomacy-peace-lock.ts — `TRUCE_END_WINDOW_EXTRA_TURNS = 1`, `truceEndWindowOpen(truceEndTurn, turn)` (okno = tura końca + 1 kolejna tura); `truceEndTickPair` zapisuje `truceEndTurn: turn` przy wygaśnięciu rozejmu (ta sama tura co oferta albo powrót do wojny; cena 0 też).
- gra/src/game/diplomacy-proposals.ts — `ProposalEvalContext.truceEndWindow?: {open, requiredPn}`; w `evaluateProposalImpl` przed bramkami wojny: dla `pokoj` od GRACZA do AI, gdy `open` i `requiredPn > 0`: przyjęcie, gdy `givePn >= requiredPn` (powód „Pokój zawarty — cena po rozejmie pokryta”), w pozostałych wypadkach odrzucenie („cena … nie jest pokryta”). Poza oknem: brak zmian.
- gra/src/main.ts — import `truceEndPriceFor`, `truceEndWindowOpen`; `truceEndWindowFor(proposerId, responderId)` (okno tylko dla proposer = gracz, responder = AI, para w wojnie albo z ofertą, gracz jest płatnikiem reguły, cena z aiAiPeacePriceFor jak quotePn); pole `truceEndWindow` w `buildProposalEvalContext`; `truceEndTurn: undefined` w ścieżkach nowego rozejmu i pokoju (finalizePeaceTreatyBetween).
- gra/tools/truce-end-window-test.cjs (nowy) — 30 PASS / 0 FAIL, w tym 4 mutanty czerwone.

Zaktualizowane istniejące testy: brak (żaden test nie kodował starego kontraktu okna — okno jest nowe).

## TESTY
- `npx tsc --noEmit` (gra/) — exit 0.
- gra/tools/truce-end-window-test.cjs — PASS=30 FAIL=0. Mutanty czerwone: M-OPEN (warunek open zdjęty) wykryty; M-THR (>= zamienione na >) wykryty; M-ACCEPT (przyjęcie zamienione na odrzucenie) wykryty; M-SETTURN (tick nie zapisuje truceEndTurn) wykryty. Mutacja zastosowana w 1 miejscu każda.
- Regresja (wyniki z surowego wyjścia):
  - truce-end-peace-price-test.cjs: 62 PASS, 0 FAIL (plik nie zmieniony w tej rundzie; dispatch podawał 54/0 jako stan r1 — rozbieżność liczby NIE WYJAŚNIONA, do FC).
  - truce-end-settle-exec-test.cjs: 30 PASS, 0 FAIL (mutanty M-NOPAY/M-SWAP/M-DOUBLE wykryte).
  - truce-end-war-notice-test.cjs: PASS (exit 0).
  - diplo-truce-impl-test.cjs: 93 PASS, 0 FAIL.
  - war-limit-truce-count-test.cjs: 19 pass / 0 fail.
  - diplo-human-peace-no-war-test.cjs: PASS=13 FAIL=0.
  - diplo-war-tribute-once-test.cjs: PASS=8 FAIL=0.
  - war-rules-multiwar-main-guard-test.cjs: 21 PASS / 0 FAIL.
  - ai-test.cjs: 297 passed, 0 failed.
  - diplo-peace-balance-accept-test.cjs: 32 pass / 0 fail.
  - diplo-forced-peace-pending-test.cjs: PASS=40 FAIL=0.
  - diplo-peace-auto-stale-offer-test.cjs: PASS=6 FAIL=0.
  - diplo-peace-last-stage-payment-test.cjs, diplo-peace-ai-ai-nonnegative-test.cjs, diplo-forced-peace-d2-guard-test.cjs: exit 0, bez linii podsumowania w wyjściu (NIE ZLICZONO liczb).
- Bramki z dispatchu niewykonane w tej rundzie: logic 213, tech-tree 20, research 33, unit-replace, combat 6 — NIE ZMIERZONO (nie uruchamiano w tej rundzie; wymagają FC/integracji).
- Live w przeglądarce: NIE ZMIERZONO.

## ZAŁOŻENIA I ODCHYLENIA (do FC)
1. Okno = tura końca rozejmu + JEDNA kolejna tura. Uzasadnienie: oferta AI w skrzynce wygasa w kolejnej turze, więc gracz ma dokładnie jedną turę na reakcję; dłuższe okno przedłużałoby pokój za cenę poza zasadą właściciela.
2. Okno działa tylko, gdy to GRACZ płaci wg truceEndPriceRule. Gdy płaci AI (wariant, w którym AI dopłaca), okno się nie otwiera i obowiązuje dotychczasowa ocena. Dispatch nie definiuje tego przypadku; to założenie Operatora.
3. Odchylenie od „w pozostałych przypadkach bez zmian”: w oknie niedopłata jest odrzucana wprost (powód „nie jest pokryta”), a nie przepuszczana do dotychczasowej oceny. Uzasadnienie: zasada „AI przyjmuje, gdy cena zrównoważona” nie oznacza przyjęcia niedopłaty.
4. Pokój przyjęty przez ścieżkę propozycji gracza ustawia truceEndOffer: undefined (finalizePeaceTreatyBetween, już istniejące). Wpis w skrzynce z ofertą AI NIE jest usuwany przez tę ścieżkę — dla FC: sprawdzić, czy zostaje wpis „Rozejm wygasł” po zawarciu pokoju z propozycji gracza.
5. Gracz wypowiada wojnę w oknie (bez oferty, po wygaśnięciu rozejmu): pole truceEndTurn nie jest czyszczone przy deklaracji wojny (ścieżka deklaracji poza allowlistą). Okno nadal wymaga tury końca rozejmu +1, więc skutek ogranicza się do najbliższej tury.
6. Nie testowano w przeglądarce ani przez pełny cykl gry; testy są na poziomie evaluateProposal i truceEndTickPair z atrapami portów.

## BLOKADY
Brak twardych blokad. Punkty 4 i 5 wymagają oceny FC; punkt 2 to założenie, nie decyzja właściciela.

## RUNDY
2/5 (Operator HAIKU 5.5). Ostatni werdykt FC r1: BLOCK (tylko pkt 1, allowlista). Decyzja wymagana: brak (DECISION_REQUIRED nie wystąpiło; założenia 1–2 do potwierdzenia przez FC lub właściciela przy ABC edge-case, nie blokują).

## NASTĘPNY KROK
Final Control r2 (Sonnet): przegląd diffu w 4 plikach kodu + tools/truce-end-window-test.cjs; weryfikacja punktów 4–5 z sekcji ZAŁOŻENIA; pełne bramki z dispatchu (logic, tech-tree, research, combat) przed integracją.

DEPLOY/PUSH: NIE WYKONANO
