STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-AUTO-IMPROVE-REMOVE-ITEM-CAP-Q1
GOAL: zlikwidowac limit LICZBY ulepszen terenu na miasto/ture (gracz, panstwa-miasta, AI cywilizacji); limitem zostaje tylko budzet Pracy.

## Kluczowe ustalenie (ZALOZENIE ZWERYFIKOWANE)
Limit liczby JUZ nie dzialal w produkcji (zdjety 2026-10-31, decyzje #10 ABC-D=B i S3-2=C): `ai.ts` nie przekazuje `maxItemsPerCity` (komentarz ai.ts:~2688), `main.ts:36303` (gracz) go nie ustawia, panstwa-miasta ida ta sama sciezka co AI (`planCityImprovements`, ai.ts:3255 `decideAITurn` i ai.ts:4422 `decideDefensiveCopyTurn`), `FOOD_STAGE_MAX_ITEMS_PER_CITY = Infinity`. W `gra/data/*.json` brak klucza limitu liczby. Zostawal MARTWY parametr `maxItemsPerCity` (domyslnie Infinity), martwa stala i ~20 testow/narzedzi go przekazujacych. Dispatch (start `ai.ts:2633`) opisywal stan sprzed 2026-10-31.
Wniosek: "ogromny niewydany budzet i puste pola" NIE wynika z limitu liczby (pomiar PRZED = PO, nizej). Przyczyny sa gdzie indziej (K2 tylko zywnosc przy `demandDriven`, `onlyWorked`/pop, sufit % gracza, wymagania tech/teren) — poza allowlista, patrz DECYZJA_WYMAGANA.

## ZMIANY / COMMIT
SHA: patrz commit tej rundy (wpisany w odpowiedzi orkiestratora; commit = "R-WEB-AUTO-IMPROVE-REMOVE-ITEM-CAP-Q1 r1").
- `gra/src/game/auto-improvements.ts`: USUNIETO pole `maxItemsPerCity` (opts + `PickFortClaimsCtx` + destrukturyzacja + 6 przekazan w `pickAutoImprovements`), stala `FOOD_STAGE_MAX_ITEMS_PER_CITY`, licznik `placedThisCity` i warunki `placedThisCity >= maxItemsPerCity` (FAZA 0, FAZA 1 x2, FAZA 2), filtr `usedByCity < maxItems`, komentarze. Logika wycinki/rzeki/etapow NIETKNIETA. Limity BUDZETU (`pracaBudgetPercent`, `cityBudgetCap`, `imperiumBudgetCap`, rezerwa) bez zmian. Zostaje `defenseCap = ceil(pop/10)` na klucz fort/posterunek w FAZIE 0 (limit liczby DANEGO typu obronnego w profilach nie-K2/K3; NIE zmieniany — decyzja obronna z innych tematow; zglaszam jako potencjalny ostatni "limit liczby").
- `gra/src/game/ai.ts`: tylko komentarz przy `sharedOpts`.
- `gra/tools/*`: testy zaktualizowane z uzasadnieniem (cap 1 byl izolatorem "jeden pick na wywolanie"): `ai-food-improvement-priority-stages-test` (sekwencja 0b: E2 wycina wszystkie lasy rzeczne w jednym wywolaniu -> farmy E1 na wszystkich), `ai2-heks-po-heksie-test` (B: >1 pick; D: brak parametru w picker/ai), `autoimprove-stages-q1-test` (asercja stalej -> brak stalej), reszta (`ai-improvements`, `ai4-popyt-obywatele`, `auto-fort-diag`, `auto-improvements`, `civ-ai-allocation`, `farma-nie-w-lesie`, `hodowla-las`, `oboz-lowiecki-las`, `oboz-lowiecki-wymaga-tartaku`, `oboz-lowiecki-evaluator-probe`, `verify-decisions-picker`, narzedzia `*-measure`/`fc*-kronika*`/`ev*`) — tylko zdjecie przekazywanego parametru i etykiet.
- NOWY `gra/tools/auto-improve-no-item-cap-test.cjs` (15 asercji): gracz/AI/panstwo-miasto (`defensiveCopy:true`) > 1 ulepszenie na miasto w turze (prawdziwe `pickAutoImprovements` + `decideAITurn`), sufit 33% x 300 nadal sztywny, zero duplikatow hex+klucz, wydatek <= pula, straznik zrodla, MUTACJA (limit 1 w kopii pickera -> test CZERWONY).

## TESTY
- RED przed: nowy test na kodzie sprzed zmian = 10 passed / 5 failed (B: `maxItemsPerCity:1` ograniczal do 1/miasto; D x2 zrodlo; E x2 mutacja nie dotyczy starego kodu). GREEN po: 15/15.
- tsc `--noEmit`: EXIT=0 (gate-tsc.txt).
- Regresja PRZED vs PO (identyczne wyniki): ai-food-improvement-priority-stages 0F->0F, ai-improvements, ai2-heks-po-heksie, auto-improvements, autoimprove-live-hooks, autoimprove-stages-q1 (302/0), farma-nie-w-lesie, hodowla-las, oboz-lowiecki-wymaga-tartaku, wyrab-rzeka-d1/krok0/r2, auto-fort-diag, civ-ai-allocation: wszystkie PASS po. ISTNIEJACE NA BAZIE (te same PRZED i PO, nie z tej zmiany): `oboz-lowiecki-las` 19 FAIL, `ai4-popyt-obywatele` 1 FAIL (Q2p tekst main.ts wyrab), `oboz-lowiecki-las-znika-render` TIMEOUT 250 s.
- POMIAR NA ZYWO (Chromium, bundle vite PRZED i PO poza repo, `?civTest` hooki wbudowane, ta sama gra, tryb auto, pula 2000, K2, onlyWorked, 33%): 8 tur zamiast 30 (limit 590 s/wywolanie, generacja swiata ~3 min). PRZED = PO bit-w-bit: gracz 15 warstw/1 miasto, MAX 11 ulepszen w jednej turze na jedno miasto (t1), pula 2000->1367 (niewydane 1367); AI cywilizacji 2 miasta: 2 warstwy; panstwa-miasta 3: 7 warstw. Dowod: limitu liczby nie bylo PRZED. Node-harness 30 tur (3 miasta, K3, pula 2000+40/tura): PRZED = PO = 123 ulepszenia, max 19/miasto/ture. Tury 9-30 na zywo: NIE_ZMIERZONO.

## BLOKADY
Brak. Dispatch istnieje tylko na galezi zdalnej; tworze wylacznie raport i logi gate.

## DECYZJA_WYMAGANA (bez ABC)
Niewydana pula i puste pola maja inne przyczyny niz limit liczby (zmierzone: pop 1 + K2 "zrownowazone" + `onlyWorked` + sufit 33%; po t3 brak kandydatow). Jesli wlasciciel chce wiecej budowy: osobny temat (profil/onlyWorked/%, `defenseCap`).

## RUNDY: 1/5
## NASTEPNY KROK: Evaluator (weryfikacja: diff, mutacja, regresje PRZED/PO, pomiar zywy).
## DEPLOY/PUSH: NIE WYKONANO
