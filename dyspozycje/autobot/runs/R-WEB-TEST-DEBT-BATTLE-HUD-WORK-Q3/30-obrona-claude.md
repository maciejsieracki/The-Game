# R-WEB-TEST-DEBT-BATTLE-HUD-WORK-Q3 — raport Obrony (odpowiedź na zarzuty Evaluatora, runda 2)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME-TEST (zmiany tylko w gra/tools/*-test.cjs i w katalogu runu; zero zmian w gra/src, gra/data, WERSJE.md, rust-port)
TEMAT: R-WEB-TEST-DEBT-BATTLE-HUD-WORK-Q3
GOAL: dług testowy z FAL 651–658: dla każdego z 12 testów wynik, klasyfikacja (nieaktualny test | realny defekt | timeout środowiska | ABC), poprawka tylko przy klasyfikacji „nieaktualny test", bez osłabiania asercji.
BAZA: origin/main 6b9bcaf2b (pomiary bazowe); kandydat cfb7070222854fd7c1dc7a5acf75ee3743a80e36 (= dd026d165 + poprawka harnessu favicon, commit cfb70702).
SHA KANDYDATA: cfb7070222854fd7c1dc7a5acf75ee3743a80e36. SHA commita tej odpowiedzi: ostatni commit gałęzi po zapisie tego pliku (`git log -1 --format=%H -- dyspozycje/autobot/runs/R-WEB-TEST-DEBT-BATTLE-HUD-WORK-Q3/30-obrona-claude.md`).
ŚRODOWISKO: worktree wf_8be3657d-ef3-3 (detached HEAD); `npm ci --ignore-scripts` w gra/ (exit 0); brak `npm run build`/`dev`; testy bitew pojedynczo. Pomiary bazowe w kopii `git archive 6b9bcaf2b` poza repo (scratchpad), żeby nie zanieczyszczać drzewa plikami dowodowymi.

## ODPOWIEDZI NA ZARZUTY EVALUATORA (f07a152c4)

**Zarzut 1 (praca-jeden: osłabiona kontrola negatywna) — PRZYJMUJĘ.**
- Cofnięto zmianę semantyki: asercja `eq(przyrost.wydatki.ulepszeniaAuto, 0, ...)` jest przywrócona w brzmieniu z rundy 1 (bez `ok(... przekroczeń === 0)`).
- Zmieniony został tylko warunek wstępny: zamiast stałej `wplyw < 40` używany jest próg `MIN_KOSZT_ULEPSZENIA_AUTO` liczony z `gra/data/terrain-improvements.json` (minimum `koszt_praca` po pozostałych pozycjach, bez `_meta` i `wyrab`, bo `skipWyrab:true` wyklucza `wyrab` w `auto-improvements.ts:317`). Wynik: 15 Pracy (droga). To minimum jest konserwatywne: asercja obejmuje wszystkie wpływy poniżej najtańszego kosztu w danych, więc nie zawęża pokrycia wbrew danym.
- Usunięto martwą instrumentację (`maxAutoWTurze`, `wydaneAutoTura`) dodaną w rundzie 2.
- Komentarze bloku 7b zaktualizowane do stanu faktycznego (próg z danych, bez stałej 40).
- Wynik po zmianie: `praca-jeden-podzial-kontrakt-test: 634 OK, 0 FAIL`, EXIT 0 (dwa przebiegi). Liczba OK spadła z 637 (wersja kandydata z przekroczeniami) na 634 (asercja z rundy 1 na trzech punktach kontrolnych wplyw 6/9/12 < 15). Mutacja (usunięcie `improvementBudgetCap`) z rundy 1 nie była powtarzana w tej odpowiedzi.

**Zarzut 2 (mgla: rozszerzenie whitelisty bez ECHO) — PRZYJMUJĘ.**
- R-PROC-AUTOBOT §6 (wiersz „Mgła wzdłuż ścieżki") zabrania rozszerzania whitelisty bez ECHO właściciela; ECHO nie istnieje. Cofnięto 4 wpisy (ai.ts: `su.q = d.q`, `simUnit.q/r = step.q/r`, `me.q = c.toQ`) — plik `gra/tools/mgla-sciezka-inwariant-test.cjs` = wersja z origin/main 6b9bcaf2b.
- Wynik po cofnięciu: `41 pass, 1 fail` (FAIL [1] na czterech miejscach ai.ts:3737, 3772, 3773, 3820). Ten sam wynik co baza origin/main. Test 10 pozostaje CZERWONY.
- Merytorycznie kopie planistyczne AI są prawdopodobnie niegroźne (zgodnie z zarzutem), ale decyzja o whitelistcie należy do właściciela: ABC do właściciela (patrz niżej).

**Zarzut 3 (klasyfikacje timeout dla #4 chariot-r5 i #6 ranged bez pomiaru na origin/main) — PRZYJMUJĘ jako brak dowodu, pomiar wykonany.**
- Zmierzono na czystym origin/main (kopia archiwum 6b9bcaf2b), surowe wyniki poniżej. Obie klasyfikacje zostały zmienione zgodnie z pomiarem (patrz tabela).
- Harness chariot-r5 (`createServer` zwraca index.html dla każdego URL): PRZYJMUJĘ jako uwagę. Nie zmieniam testu, bo na bazie dał EXIT 0 z tą samą wadą (ta sama linia `Unexpected token '<'` w logu bazowym, liczba 1), a dispatch zabrania ruszać testy bez dowodu związku z błędem. Tablica `errors` nie jest asercją i nie wpływa na EXIT.

**Zarzut 4 (brak SHA kandydata w 10-operator-claude.md) — PRZYJMUJĘ.** SHA kandydata podano w nagłówku tego raportu (cfb70702...). Raport 10-operator-claude.md nie jest zmieniany w tej odpowiedzi (jest to plik poprzedniej rundy); SHA kandydata i pełna tabela są w tym pliku (30-obrona-claude.md).

**Zarzut 5 (uwagi procesowe) — PRZYJMUJĘ jako notatki.**
- (a) Pliki dowodowe `R-BITWA-ATAK-LUCZNICY-POZA-ZASIEGIEM-Q1/evidence/` NIE były modyfikowane w tej odpowiedzi: test ranged uruchomiono wyłącznie w kopii archiwum poza repo. W drzewie roboczym nie ma śladu po tym teście. Ryzyko szerokiego `git add` pozostaje dla przyszłych uruchomień i jest odnotowane.
- (b) Czasy: hint-toast 292 s i deadzone 252 s przekraczają limity dispatchu (280 s / 110 s). Nie zmieniam limitów ani testów; czasy są zapisane w tabeli jako surowe liczby.

## ZMIANY / COMMIT
- gra/tools/praca-jeden-podzial-kontrakt-test.cjs: przywrócona asercja z rundy 1, próg z danych, usunięta martwa instrumentacja, komentarze zaktualizowane.
- gra/tools/mgla-sciezka-inwariant-test.cjs: cofnięte 4 wpisy whitelisty (= origin/main).
- dyspozycje/autobot/runs/R-WEB-TEST-DEBT-BATTLE-HUD-WORK-Q3/30-obrona-claude.md: ten raport.
- Brak zmian: gra/src, gra/data, chariot-r5, ranged-approach, pointer (poprawka 204 z cfb7070 bez zmian), pozostałe testy.
- Commit: tylko powyższe 3 pliki (`git add <ścieżka>`, nie `-A`).

## WYNIKI BRAMEK (surowe wyjście, uruchomione w tej odpowiedzi na drzewie po zmianach)
- `node ./node_modules/typescript/bin/tsc --noEmit`: EXIT 0.
- logic-test: EXIT 0, `LOGIC OK (213/213)`.
- tech-tree-test: EXIT 0, `tech-tree-test: 20 pass, 0 fail`.
- research-test: EXIT 0, `ALL GREEN`.
- unit-replace-test: EXIT 0, `[unit-replace-test] WSZYSTKIE TESTY ZIELONE (21/21)`.
- combat-test: EXIT 0, `All sanity checks passed.`
- Uwaga: `git diff --stat 6b9bcaf2b HEAD -- gra/src gra/data` jest puste, więc kod gry kandydata = origin/main; wyniki bramek kodu gry są takie same na bazie i kandydacie.
- praca-jeden-podzial-kontrakt-test: EXIT 0, `634 OK, 0 FAIL` (kandydat po zmianach, runda obrony).
- mgla-sciezka-inwariant-test: EXIT 1, `41 pass, 1 fail` (kandydat po cofnięciu whitelisty = baza).

## POMIARY BAZOWE NA origin/main 6b9bcaf2b (w tej odpowiedzi, kopia archiwum poza repo)
- battle-natural-chariot-r5-test: EXIT 0, czas 133 s (2m13s), `grep -c R5_FAIL` = 0, w logu 1 linia `Unexpected token`.
- battle-ranged-approach-regression-test: EXIT 0, czas 249 s (4m09s), raport JSON zapisany, bez `activation timeout` i bez FAIL.

## TABELA 12 TESTÓW (test | wynik na bazie | wynik na kandydacie | klasyfikacja)
Oznaczenia źródła: [M-obrona] = zmierzone w tej odpowiedzi; [R2] = wynik rundy 2 Operatora (cfb7070/dd026d165), nie powtórzony w tej odpowiedzi; [E] = wynik podany przez Evaluatora (baza 6b9bcaf2b), nie powtórzony przeze mnie.

| # | Test (gra/tools/) | Wynik na bazie | Wynik na kandydacie | Klasyfikacja |
|---|---|---|---|---|
| 1 | auto-battle-simultaneous-test | FAIL (E, r1) | 29 pass, 0 fail, EXIT 0 [R2] | nieaktualny test (poprawka r1); nie powtórzony w tej odpowiedzi |
| 2 | battle-attack-move-pointer-test | FAIL: 404 /favicon.ico liczone jako błąd strony (r1) | 5/5 PASS, EXIT 0, 117 s [R2]; potwierdzone przez E | harness: poprawka 204 dla favicon (NAPRAW 1) |
| 3 | battle-dead-unit-disappearance-test | FAIL (E, r1) | PASS, EXIT 0 [R2] | nieaktualny test (poprawka r1); nie powtórzony |
| 4 | battle-natural-chariot-r5-test | PASS, EXIT 0, 133 s, 0 R5_FAIL [M-obrona] | PASS, EXIT 0, 144 s, 0 R5_FAIL [R2]; EXIT 2 `not stable` w obronie r2 wcześniejszej (fc88effc1) | niestabilność NIE odtworzona na bazie ani na kandydacie w tej odpowiedzi; nieudowodniony timeout środowiska. Otwarte (patrz NOTY) |
| 5 | pre-battle-save-test | crash bundlera (r1) | OK, EXIT 0, 2 s [R2] | nieaktualny test + brak shimów (poprawka r1) |
| 6 | battle-ranged-approach-regression-test | exit 124 po 280 s (r1); PASS EXIT 0, 249 s [M-obrona] | PASS, EXIT 0, 296 s [R2]; FAIL `activation timeout` EXIT 1, 5 min 33 s, load ~14 (obrona r2 wcześniejsza) | timeout środowiska pod obciążeniem: limit 280 s za krótki dla czasu 249–296 s; FAIL aktywacji widziany tylko przy load ~14. Klasyfikacja zamknięta jako timeout środowiska, NIE jako defekt gry; brak zmiany testu |
| 7 | hint-toast-zindex-empire-panel-test | FAIL (E, 4 regex); exit 124 (280 s) | 18 pass, 0 fail, EXIT 0, 274 s [R2] | nieaktualny test (poprawka r1); czas 274 s blisko limitu |
| 8 | load-fail-toast-zindex-test | FAIL 3 (E, r1) | 15 passed, 0 failed, EXIT 0 [R2] | nieaktualny test (poprawka r1) |
| 9 | grupy-budynkow-test | FAIL 3 (E, r1) | 83 pass, 0 fail, EXIT 0 [R2] | nieaktualny test (dane +1 budynek; poprawka r1) |
| 10 | mgla-sciezka-inwariant-test | 41 pass / 1 FAIL [E] | 41 pass / 1 FAIL [M-obrona, po cofnięciu whitelisty] | NIE NAPRAWIONE: wymaga ECHO właściciela (R-PROC §6). Blokada, ABC do właściciela |
| 11 | praca-jeden-podzial-kontrakt-test | FAIL 2 (r1) | 634 OK, 0 FAIL, EXIT 0 [M-obrona] | nieaktualny test: próg kontroli negatywnej z danych (15 Pracy), asercja z rundy 1 bez osłabiania |
| 12 | sidepanel-hud-deadzone-test | timeout 110 s (dispatch); EXIT 0, 43/0, 331 s (obrona r2 wcześniejsza) | 43 pass, 0 fail, EXIT 0, 233 s [R2] | timeout limitu 110 s za krótki na tę maszynę (wynik zielony) |

## KLASYFIKACJE ROZSTRZYGNIĘTE (z dowodem)
- Harness pointer (#2): defekt w harnessie (404 favicon), nie w grze.
- battle-ranged-approach (#6): na bazie origin/main przechodzi EXIT 0 w 249 s [M-obrona]. Limit 280 s z dispatchu jest za krótki dla tej maszyny. FAIL aktywacji wystąpił tylko przy obciążeniu ~14 i nie jest odtworzony na czystej maszynie.
- battle-natural-chariot-r5 (#4): na bazie PASS EXIT 0 w 133 s bez R5_FAIL [M-obrona]. Wcześniejszy EXIT 2 (`not stable`) nie został odtworzony. Klasyfikacja „timeout środowiska" NIE jest udowodniona; zostaje jako niestabilność nieudowodniona.

## NIEROZSTRZYGNIĘTE / NOTY
1. battle-natural-chariot-r5 (#4): EXIT 2 `locator.click not stable` z wcześniejszej obrony nie został odtworzony ani na bazie, ani w tej odpowiedzi. Wymaga powtórnego pomiaru pod obciążeniem (przez orkiestratora), jeśli ma być zamknięty.
2. mgla (#10): test pozostaje czerwony (41/1) na bazie i kandydacie. Zamknięcie wymaga decyzji właściciela (ABC, patrz niżej).
3. Limity dispatchu (280 s / 110 s) są nierealistyczne dla kilku testów na tej maszynie (#6, #7, #12). Nie zmieniono limitów; czasy podano jako surowe liczby.
4. Realny defekt gry: NIE wykazany dla żadnego z 12 testów.
5. Pięć bramek referencyjnych i tsc: zmierzone w tej odpowiedzi (sekcja WYNIKI BRAMEK).

## ABC DO WŁAŚCICIELA (do decyzji, nie rozstrzygam sam)
- Test mgla-sciezka-inwariant (#10): czy zaakceptować 4 wpisy whitelisty dla kopii planistycznych ai.ts (applyCoreDest, applyArmySeeksEnemyArmy, orderMovesToUnblock) jako klasę „BEZ-MGLY-GRACZA"? Rekomendacja: TAK, po ECHO (kopie sim/pos jednostek AI, nie RuntimeUnit gracza), z zapisem w R-PROC §6. Bez ECHO test pozostaje czerwony.

## ZAŁOŻENIA (luki rozstrzygnięte założeniem)
- Próg kontroli negatywnej praca-jeden: minimum `koszt_praca` po pozostałych pozycjach terrain-improvements.json (15, droga), a nie 20 jak sugerował Evaluator. Założenie: droga może być kupowana przez automat, więc próg konserwatywny.
- Pomiary bazowe chariot/ranged wykonane na kopii `git archive 6b9bcaf2b` (gra + dyspozycje), z symlinkiem na node_modules kandydata. Pliki tych testów są identyczne na bazie i kandydacie (diff pusty).

## RUNDY
2/5 (runda 1 = Operator, FC FAIL; runda 2 = naprawa FAIL r1 + odpowiedź na zarzuty Evaluatora w tej odpowiedzi).

## NASTĘPNY KROK
- Evaluator: ponowna weryfikacja praca-jeden (634 OK, asercja z rundy 1, próg z danych) i cofniętej whitelisty mgla (41/1 = baza).
- FC: potwierdzenie tabeli 12 testów wobec surowych wyników powyżej.
- Orkiestrator (poza tym tematem): decyzja ABC o whitelistcie mgla; ewentualny powtórny pomiar chariot-r5 pod obciążeniem.

DEPLOY/PUSH: NIE WYKONANO
