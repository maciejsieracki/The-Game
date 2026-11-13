STATUS: PASS (runda 2: poprawka zarzutów FAIL z rundy 1; część kodowa)
DOMAIN: GAME
TEMAT: R-WEB-TERRAIN-IMPROVE-FARM-MISSING-ON-HEX-Q1
GOAL: Usunąć regresję z rundy 1 (tooltip oferował Trzodę/Owce Inkom w epokach 1-2 wbrew silnikowi), poprawić komentarz w kodzie, dodać pokrycie testowe dla Inków w epokach 1, 2, 3. Decyzja ABC z DODATKU 1 pozostaje po stronie właściciela (kodu nie zmieniano).
BAZA: ac2d90617b456bd23965428528db64460ff1a42d (commit operatora r1; w worktree gałąź r2-terrain-farm).
ZMIANY/COMMIT: kod i testy 0edc54543e1395b3a1aa63fc688973d315e46857 (baza ac2d90617). Raport r2 dopisany w commicie kolejnym.
Allowlista r2:
- gra/src/ui/hexContextTooltip.ts (bramka isLivestockAllowed dla bydlo/owce + poprawiony komentarz + import)
- gra/tools/terrain-improve-farm-availability-test.cjs (scenariusz Inkowie, epoki 1/2/3)
- dyspozycje/autobot/runs/R-WEB-TERRAIN-IMPROVE-FARM-MISSING-ON-HEX-Q1/02-operator-r2.md

ODPOWIEDŹ NA ZARZUTY:
1. REGRESJA hexContextTooltip.ts (Trzoda/Owce bez bramki epoki/cywilizacji): PRZYJMUJĘ.
   Poprawka: w listTerrainPossibleImprovements po bramce owce/isOwceBaseTerrain dodano
   `if ((key === 'bydlo' || key === 'owce') && !isLivestockAllowed(playerCivType, key, ownerEra ?? 1)) continue;`
   Import: isLivestockAllowed z '../game/livestock-unlock' (obok isLamaDepositVisibleForCiv).
   `ownerEra ?? 1` to ta sama wartość co engine (`playerEra = state.playerEra ?? 1`, improvement-build.ts ~l.954).
   Dowód: test Inkowie (era 1/2/3) PASS; mutant z usuniętą bramką -> 6 FAIL (Inkowie era 2: tooltip true, silnik false). Przywrócono poprawny kod, 36/36 PASS.
2. BRAK POKRYCIA TESTEM (tylko rzymianie, era 1): PRZYJMUJĘ.
   Dodano blok w terrain-improve-farm-availability-test.cjs: dla civ 'inkowie' i era 1,2,3, heks Łąka goła (Trzoda) i Wzgórza (Owce): tooltip == silnik oraz Trzoda/Owce oferowane tylko od epoki 3. Funkcje tooltipPossible i engine przyjmują teraz parametry civ i era (domyślnie rzymianie/1 - bez zmiany dotychczasowych asercji).
3. KOMENTARZ „nie może obiecywać MNIEJ niż silnik": PRZYJMUJĘ.
   Komentarz przepisany: tooltip ma być zgodny z silnikiem w obie strony - nie może obiecywać WIĘCEJ (bramka cywilizacji/epoki isLivestockAllowed) ani MNIEJ (ukrywać to, co silnik dopuszcza).
4. Informacja do orkiestratora (DODATEK 1 a, tryb ręczny): ODNOTOWANE, bez zmian kodu. Pytanie ABC zadaje orkiestrator.

ZAŁOŻENIA:
- Bramka dotyczy tylko bydlo/owce (lama już ma bramkę Inków przez isLamaDepositVisibleForCiv; koń ma bramkę zawsze otwartą w isLivestockAllowed).
- isLivestockUnlockedForPlacement dla bydlo/owce/lama zwraca true (bez złoża), więc tooltip nie potrzebuje bramki odblokowania - zgodne z silnikiem.

TESTY (gra/, bez build/dev, wynik na ac2d90617 + r2):
- terrain-improve-farm-availability-test: 36 passed, 0 failed (w tym 9 nowych asercji Inkowie)
- hex-tooltip-mozliwe-ulepszenia-zloze-test: 65 passed, 0 failed
- citizen-auto-assign-farm-river-test: 11 passed, 0 failed
- farma-nie-w-lesie-test: 138 passed, 0 failed
- auto-improvements-test: 46 passed, 0 failed
- ai-citizen-hex-sibling-exclusion-test: 19 OK, 0 FAIL
- autoimprove-irrigation-after-farms-test: 42 OK, 0 FAIL
- Nie uruchamiano builda ani dev. Brak weryfikacji w przeglądarce (NIE_ZMIERZONO).
- Test wykonany z tymczasowym linkiem node_modules do worktree operatora r1; link usunięty przed commitem.

BLOKADY: brak techniczny. Czeka decyzja właściciela z DODATKU 1 (ABC), poza tym tematem kodowym.
RUNDY: 2/5
NASTĘPNY KROK: Evaluator (runda 2), potem Final Control. Integracja i deploy wyłącznie po READY_FOR_DEPLOY.
DEPLOY/PUSH: NIE WYKONANO
