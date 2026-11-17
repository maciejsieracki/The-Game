STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ARMY-AMBUSH-REQUIRES-GENERAL-Q1
GOAL: zasadzka tylko z generałem (decyzja właściciela 2026-11-17, wariant B): (1) akcja „Zasadzka” dla armii bez generała zablokowana z powodem po polsku; (2) AI nie zastawia zasadzek bez generała (wspólna funkcja z graczem); (3) zasadzka zastawiona przez armię, która straciła generała, wygasa (ZAŁOŻENIE, bez DECISION_REQUIRED); (4) martwa ścieżka „bez generała → AUTO” sprawdzona; (5) spójność AUTO na mapie opisana.
BAZA: d44d5b982305fd2cff3dada175b4833d936e4525 (origin/main).

ZMIANY/COMMIT: commit z kodem i raportem (SHA w polu sha odpowiedzi). Allowlista:
- gra/src/game/ambush.ts (powód 'no-general', stackHasGeneral, reguła wygaśnięcia w reconcileAmbush)
- gra/tools/ambush-core-test.cjs, ambush-wiring-test.cjs, ambush-realstep-test.cjs, ambush-save-roundtrip-test.cjs (helpery: isGeneral domyślnie true; nowa sekcja 2b)
- gra/tools/ambush-live-vite.config.ts (fixture live: generał w zastawianych stosach)
- docs/encyklopedia/pojecia/zasadzka.md + gra/src/data/wikiBundle.json (regeneracja: node gra/tools/bundle-wiki-for-game.cjs)
- dyspozycje/autobot/runs/R-WEB-ARMY-AMBUSH-REQUIRES-GENERAL-Q1/10-operator-claude.md
Nie zmieniano: gra/data/**, WERSJE.md, battleScene.ts, ambushDeploy.ts, main.ts.

Zmiana kodu:
- canSetAmbush: nowy powód 'no-general' (zaraz po 'empty'), komunikat „Zasadzkę może zastawić tylko armia z generałem.”. Przycisk w UI (main.ts ~27243) i handler (main.ts ~27497) już korzystają z canSetAmbush, więc blokada i tooltip działają bez zmian w main.ts.
- reconcileAmbush: zasadzka wygasa dla całego stosu (ta sama pieczęć q,r,owner), gdy w tym stosie nie zostaje żaden isGeneral. Polityka „reszta zostaje" bez zmian.
- AI: w tej bazie AI NIE ma ścieżki zastawiania zasadzek (setAmbush wołane tylko z UI gracza; AI jedynie wykrywa i atakuje zasadzkę). Warunek dla AI jest więc w canSetAmbush, którą każda przyszła ścieżka AI musi wołać; nie dodawałem nowej ścieżki AI (poza zakresem).

TESTY (surowe wyniki):
- tsc --noEmit: exit 0.
- Baseline przed zmianą (d44d5b98): ambush-core 40/0; ambush-realstep 16/0; ambush-save-roundtrip 5/0; ambush-wiring 28/0; ambush-ui-reason 5/0; ambush-deploy-geometry 20/0; ambush-deploy-scene 26/0; ambush-deploy-zone-visual 11/0; ambush-deploy-wiring 15/0; ambush-deploy-line-width PASS 240; ambush-deploy-lineside-guard PASS 757; ambush-split-barb exit 0; ambush-deploy-identity (AMBUSH_BASE_GRA=gra) PASS 1776.
- Po zmianie: ambush-core 48 OK / 0 FAIL (+8 w sekcji 2b); ambush-realstep 16/0; ambush-save-roundtrip 5/0; ambush-wiring 28/0; ambush-ui-reason 5/0; ambush-deploy-geometry 20/0; ambush-deploy-scene 26/0; ambush-deploy-zone-visual 11/0; ambush-deploy-wiring 15/0; ambush-deploy-line-width PASS 240; ambush-deploy-lineside-guard PASS 757; ambush-split-barb exit 0 (mutanty czerwone); ambush-deploy-identity PASS 1776.
- mgla-sciezka-inwariant: 42 linii OK, 0 FAIL.
- Mutacje (ręczne, przywrócone, cmp zgodny): usunięcie warunku stackHasGeneral → core 44 OK / 4 FAIL; usunięcie reguły wygaśnięcia w reconcileAmbush → core 47 OK / 1 FAIL.
- ambush-live-test (Chromium, 1 proces): po zmianie kodu i fixture 18 PASS / 3 FAIL (B3, B5, B6). Ta sama wartość 18/3 i te same trzy FAILe na BAZIE (kod i fixture z origin/main) → brak regresji; B3/B5/B6 są sprzed tematu i NIE są naprawiane tutaj. Przed poprawką fixture (generał tylko w gracza) A2 failował — oczekiwane, bo zastawianie bez generała jest teraz zablokowane. Dowód DOM dla armii bez generała: przycisk disabled, title = „Zasadzkę może zastawić tylko armia z generałem.”

NIE ZMIERZONO:
- zrzut ekranu przycisku dla armii bez generała (wizualnie NIE obejrzano; dowód DOM jak wyżej),
- pełny zestaw pięciu bramek referencyjnych poza wymienionymi powyżej,
- ambush-deploy-identity z innym AMBUSH_BASE_GRA niż bieżący gra/ (użyto bieżącego katalogu gra/).

BLOKADY: brak.
RUNDY: 1/5.

ZAŁOŻENIA (luki rozstrzygnięte założeniem):
1. Utrata generała = wygaśnięcie zasadzki dla całego stosu (zamiast DECISION_REQUIRED). Uzasadnienie: „zasadzka tylko z generałem" logicznie wymaga tego; reguła jest w jednym miejscu (reconcileAmbush).
2. Ścieżka „rozstawienie bez generała → AUTO" (ambushDeployFeedbackText, noGeneralManualBlocked) NIE została usunięta: dla ZASTAWIAJĄCEGO jest już nieosiągalna (zastawiający ma generała), ale nadal osiągalna dla ZASKOCZONEGO gracza bez generała (wpadł w zasadzkę AI). Komunikat zostaje, bo dotyczy zaskoczonych.
3. AI: w tej bazie AI nie zastawia zasadzek, więc „AI nie zastawia bez generała" jest zagwarantowane przez wspólną funkcję canSetAmbush (sekcja 2b), a nie przez zmianę zachowania AI.
4. AUTO na mapie: po zmianie zasadzka nie może istnieć bez generała w stosie (wygasa przy najbliższym reconcile); ruch wroga na heks zasadzki nadal przerywa marsz (planPlayerAmbushMove / truncatePathAtAmbush bez zmian).

NASTĘPNY KROK: Evaluator (Sonnet) — weryfikacja diffu i testów; FC; orkiestrator integruje (merge-base względem d44d5b98).
DEPLOY/PUSH: NIE WYKONANO
