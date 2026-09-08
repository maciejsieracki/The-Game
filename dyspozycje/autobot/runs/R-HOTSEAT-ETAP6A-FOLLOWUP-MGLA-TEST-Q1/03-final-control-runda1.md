STATUS: PASS
DOMAIN: INFRA
TEMAT: R-HOTSEAT-ETAP6A-FOLLOWUP-MGLA-TEST-Q1
GOAL: Naprawić FAIL w gra/tools/mgla-odkrycie-wzdluz-sciezki-test.cjs po Etapie 6a — bez zmian w gra/src/**.

TESTY: Niezależna weryfikacja w /home/user/wt-hotseat-etap6a-followup-mgla (HEAD 29040579).
- `node gra/tools/mgla-odkrycie-wzdluz-sciezki-test.cjs` → 17/17 PASS (własne uruchomienie, pełny output przejrzany).
- Kontrola nie-maskowania (powtórzona niezależnie): wyekstrahowano stary test z `git show e76adba2:gra/tools/mgla-odkrycie-wzdluz-sciezki-test.cjs`, podmieniono tymczasowo, uruchomiono na dzisiejszym main.ts → dokładnie 12 pass, 3 fail, te same trzy asercje (blok pathHexes.length>0, blok result.movePath.length>0, currentVisible()). Plik przywrócony do wersji Operatora, `git status --porcelain` czysty po teście.
- 5 bramek referencyjnych — własne uruchomienie, wszystkie zielone: logic-test 213/213, tech-tree-test 19/19, research-test 33/33, unit-replace-test 13/13, combat-test 6/6.
- `node ./node_modules/typescript/bin/tsc --noEmit` (w gra/) → exit 0, czysto.
- `git diff --stat e76adba2..HEAD`: tylko `01-operator-runda1.md`, `02-evaluator-runda1.md`, `gra/tools/mgla-odkrycie-wzdluz-sciezki-test.cjs` (+29/-5). Zero plików w `gra/src/**`.
- Przeczytano cały diff testu (`git diff e76adba2..HEAD -- gra/tools/...test.cjs`): trzy asercje statyczne rozszerzone o `OWNER_GUARD = '(?:u\.ownerId === 0|isMe\(u\.ownerId\)|u\.ownerId === humanOwnerId)'` (dwa bloki hutCollected) i dwuwariantową asercję dla `currentVisible()` (inline `u.ownerId === 0` LUB delegacja do `ownPlayerVisibleHexes()` z `u.ownerId === ME()`). Alternatywy są ZAMKNIĘTE — trzy konkretne, realnie istniejące w main.ts zapisy, nie wildcard; test nadal wymaga: (a) obecności któregoś z tych trzech strażników bezpośrednio przed `checkVillageRewardsAlongPath(...)` w odpowiednim bloku i we właściwej kolejności względem `computeVisibleAlongPath`, oraz (b) dla `currentVisible()` — że źródłem widoczności pozostaje BIEŻĄCA pozycja jednostek (`u.q, u.r` przez `computeVisibleAt`), nie ścieżka. Test nie akceptuje dowolnego kodu — kontrola nie-maskowania (wyżej) to potwierdza empirycznie: stary test nadal łapie te same 3 FAIL na tym samym main.ts, więc nowy test nie "rozmył się" do bezużyteczności, tylko precyzyjnie dogonił trzy realne warianty źródła.

BLOKADY: brak.

RUNDY: 1/5

WERDYKT KOŃCOWY: PASS. Niezależna weryfikacja w pełni potwierdza raporty Operatora i Evaluatora: 17/17 PASS na dzisiejszym main.ts, 5/5 bramek referencyjnych zielonych, tsc czysty, git diff ograniczony wyłącznie do pliku testowego z allowlisty (+ raporty), zero zmian w gra/src/**. Rozszerzone asercje są zamkniętymi alternatywami trzech faktycznie istniejących w main.ts zapisów strażnika tożsamości, nie ogólnym wildcardem — kontrola nie-maskowania (stary test na dzisiejszym kodzie nadal daje identyczne 12 pass/3 fail) dowodzi, że naprawa nie osłabiła testu, tylko naprawiła go precyzyjnie. Gotowe do integracji.

NASTEPNY KROK: integracja orkiestratora (merge do main) → READY_FOR_DEPLOY.
DEPLOY/PUSH: NIE WYKONANO
