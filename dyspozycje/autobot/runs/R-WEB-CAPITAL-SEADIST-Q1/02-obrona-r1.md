STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-CAPITAL-SEADIST-Q1

Odpowiedzi na zarzuty (baza: main 943c6afba, operator 0fb3cb989 cherry-pick):
1. PRZYJMUJE. Dodano gra/tools/capital-seadist-measure.cjs + gate-seadist-measure.txt: sepGate=23, landSep=5562, hexy seaDist>=10: 659 (z gorami; liczba 615 z r1 byla bez nich/inna definicja), maks. pakunek zachlanny (300 prob, RNG deterministyczny) 6 przy sep 22/23/25, 7 przy 20, 9 przy 15. To dolna granica heurystyczna; gornej granicy nie dowodzono (NIE_ZMIERZONO).
2. PRZYJMUJE CZESCIOWO. Dodano kontrole negatywna w tescie: ten sam warunek przy odslonieciu (tylko stolica gracza jako "inna") wykrywa 629 wolnych slotow -> warunek nie jest martwy (3 nowe asercje, 481 -> 484). Zastrzezenie "lokalne, nie globalne" ODRZUCAM jako blokujace: test szuka wolnego slotu po CALEJ mapie (bardziej restrykcyjnie niz runtime, ktory wybiera w regionie civ), a pakunek globalny dowodzi, ze 8 stolic srodladowych jest niewykonalne. Decyzja produktowa (8 typow na Standard) zostaje dla orkiestratora/ABC.
3. PRZYJMUJE. Test uruchomiony na tym worktree: 484 passed, 0 failed, EXIT=0 (gate-cluster-start.txt); tsc --noEmit EXIT=0 (gate-tsc.txt); capital-spacing-prop ALL PASS; parity polar 30/30 (BASE bez zmian).
4. PRZYJMUJE. Baza = main 943c6afba (po slodkiej wodzie); wynik na tej bazie zielony, mapa seed 4242 nadal 3 stolice <10 (8,8,6). Margines -1 usuniety: sepGate liczony jak runtime (landCount = nie morze/gory/plytkie_morze, civCount 8 => 23, clusters.ts:3517-3529); wyjasnia rozbieznosc z linia 787 (bez argumentow => 25).
5. CZESCIOWO. tsc czysty (zrobione). Chromium: BLOKADA/NIE_ZMIERZONO (zmiana tylko .cjs, zakaz buildu w gra/). capital-spacing-measure.cjs nie uruchamiany; gra/src bez zmian.
RUNDY: 2/5 (obrona r1)
DEPLOY/PUSH: NIE WYKONANO
