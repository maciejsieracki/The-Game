# R-WEB-BATTLE-NEVERROUT-HOLD-FIGHT-Q1 — raport Obrony (Operator, runda 2)

STATUS: PASS-WITH-NOTES (obrona zakonczona; werdykt koncowy nalezy do Final Control)
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-NEVERROUT-HOLD-FIGHT-Q1
GOAL: po zalamaniu morale armii neverRout zostaja i walcza, zwykli uciekaja i sa gonieni; bitwa konczy sie, gdy neverRout zgina / uciekinierzy zejda / minie limit 30 tur.

## Baza i kandydat
- Start obrony: 4dea74a1b5ec1bcaea92c377b57b45c9eed25342 (kandydat r1), baza 6a0cbba2809d75af6adda62acb59f2f2d8bb53bb.
- Dispatch: 00-dispatch.md z origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0 (plik nie istnieje na origin/main).
- Zalozenie: 00-dispatch-DODATEK-claude.md nie istnieje na zadnej galezi (sprawdzone git show); zakres = 00-dispatch.md.

## ZMIANY/COMMIT
- Kod obrony: 93980e2a4 (gra/src/battle/battleScene.ts, gra/tools/battle-neverrout-hold-test.cjs). Allowlista zachowana; brak zmian w gra/data/*.json.
- battleScene.ts: _lastLogHas zastapione przez _logHas, ktore przeszukuje CALY log bitwy (nie tylko ostatni wpis). Cel: komunikat o zalamaniu morale raz na strone.
- Test: dodane dwa przypadki dyskryminujace "sama Chaska po zalamaniu" (seed 1 i 2, noFlee); collapse liczony od pierwszego zalamania z zywym neverRout (usuniety warunek had); sprawdzenie kr.1 fledAtEdge>0 pomijane tylko dla noFlee.
- Raport: 30-obrona-claude.md (osobny commit, SHA w polu sha).

## ODPOWIEDZI NA ZARZUTY
1. (Test niewrazliwy) PRZYJMUJE. Dowod: przed zmiana testu, na kandydacie i na bazie 6a0cbba, wynik 36 PASS / 0 FAIL (zgodnie z zarzutem). Po dodaniu przypadkow "sama Chaska" test na bazie daje 54 PASS / 4 FAIL: "[sama Chaska po zalamaniu (seed 1)] kr.3: bitwa trwa PO turze zalamania (koniec 2 > zalamanie 2) -- [2,2]" oraz "przegrana strona nie ma zywych neverRout po koncu -- {atk:4,def:0}"; analogicznie seed 2 (atk:3). Na kandydacie 58 PASS / 0 FAIL. Mechanizm: na bazie po zalamaniu nie ma uciekinierow na polu, wiec aliveA=false konczy bitwe w turze zalamania przy zywej Chaskie; kandydat zostawia aliveA=true.
2. (Dedup logu) PRZYJMUJE zmiane kodu (_logHas po calym logu). NIE_ZMIERZONO: liczba wpisow komunikatu w logu po poprawce nie zostala policzona osobnym przebiegiem (test sprawdza kryteria, nie liczbe wpisow). Wczesniejszy stan (3 wpisy w seed 1) — zarzut Evaluatora, nie powtorzone przeze mnie.
3. (kr.1 dla strony wygrywajacej) ODRZUCAM jako poza zakresem kryterium. Dowod: diff kandydata nie dotyka _resolveRemainingRouted (usuwanie pojedynczego uciekiniera przy koncu bitwy istnialo wczesniej, z logiem "uciekl z pola bitwy", co spelnia kr.1 w brzmieniu dispatchu: log "uciekl z pola bitwy" lub znika z pola). Test celowo sprawdza kr.1 tylko dla przegranej strony (komentarz w pliku testu nad check kr.1 notEdge). Przypadek "Chaska po stronie obrony": notEdge zwyciezcy = [['atk',19,73,0]] — zachowanie historyczne, nie regresja tej zmiany.
4. (Live game) PRZYJMUJE jako luke. Dowod: headless Chromium (vite + playwright, battle-rout-pursuit-browser-entry, tryb watch) — 58/0 na kandydacie. Zywa gra NIE_ZMIERZONO; kryterium 5 w pelnej wersji nie spelnione; decyzja dla FC/wlasciciela.
5. (Pomin do wyniku) ODRZUCAM zmiane. Dowod: _skipInstantFallback / computeInstantResult nie sa w allowliscie tematu (dispatch: ZAKAZ wszystkiego poza allowlista); nie zmieniane. Rozbieznosc AUTO vs SKIP dla armii z neverRout pozostaje BLOKADA do osobnej decyzji. NIE_ZMIERZONO.
6. (PAT / sufit z zywa neverRout) ODRZUCAM jako blad kodu; PRZYJMUJE jako luke pokrycia. Dowod: PAT jest jawnie obsluzony w _checkEnd (_stalled -> forcedVerdict=true, log "PAT: brak postepu"), a test wylacza kr.3 przy forcedEnd. Scenariusz z sondy nie wchodzi w zalamanie, wiec nie jest objety kryterium.
7. (Brak DODATKU) ODRZUCAM jako blokade: zalozenie zakres = 00-dispatch.md (patrz wyzej).

## TESTY (surowe wyniki tej rundy)
- npx tsc --noEmit -> TSC_EXIT=0 (po poprawce battleScene.ts i testu).
- battle-neverrout-hold-test.cjs na kandydacie (poprawka + nowe przypadki): 58 PASS, 0 FAIL.
- Mutacja: ten sam test z battleScene.ts z bazy 6a0cbba: 54 PASS, 4 FAIL (cztery FAIL z ZARZUTU 1).
- Bramki referencyjne (po poprawce): logic-test "LOGIC OK (213/213)"; tech-tree-test "20 pass, 0 fail"; research-test "PASSED: 33 / FAILED: 0 / TOTAL: 33"; unit-replace-test "WSZYSTKIE TESTY ZIELONE (21/21)"; combat-test "COMBAT TEST: 6/6 pass"; battle-routed-pursued-destroyed-test "30 PASS, 0 FAIL".
- Nie uruchamiano npm run build / npm run dev. Zaleznosci: npm ci --ignore-scripts w gra/.

## BLOKADY
- Zywa gra (kr.5 w pelnej wersji): NIE_ZMIERZONO.
- Sciezka "Pomin do wyniku" (_skipInstantFallback / computeInstantResult): poza allowlista, nie zmieniana; mozliwa rozbieznosc AUTO vs SKIP dla neverRout — decyzja wlasciciela/FC.

## RUNDY
Obrona r2 (po FAIL Evaluatora r1). Limit 5 rund nieprzekroczony.

## NASTEPNY KROK
Evaluator r2 (to samo ID) na 93980e2a4: sprawdzic mutacje (54/4 na bazie, 58/0 na kandydacie) i dedup logu; potem Final Control.

## DEPLOY/PUSH: NIE WYKONANO
