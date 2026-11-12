# R-WEB-SIEGE-SKIP-INSTANT-FALLBACK-DIVERGENCE-Q1 — obrona Operatora (runda 1/5, odpowiedzi na zarzuty Evaluatora)

STATUS: DECISION_REQUIRED (pomiary uzupelnione; decyzja produktowa A/B nadal po stronie wlasciciela; zero zmian w gra/src)
DOMAIN: GAME
TEMAT: R-WEB-SIEGE-SKIP-INSTANT-FALLBACK-DIVERGENCE-Q1
GOAL: zmierzyc, czy _skipInstantFallback daje inne wyniki niz SKIP/AUTO w oblezeniu; naprawic tylko realny blad; przy decyzji produktowej DECISION_REQUIRED z liczbami.
BAZA/KANDYDAT: bd4ac94c6 (rodzic = b0b0e3f86 = origin/main; diff gra/src = pusty). Worktree: wf_6c07e0da-2b5-3.

## ZMIANY-COMMIT
- Kod gry (gra/src): BRAK zmian. Konflikt z W26 (B4b, battleScene.ts) nie wystapil.
- gra/tools/battle-skip-siege-parity-live-test.cjs: dodany tryb `fallback` (deployPhase=false, started=false, potem skip()). Ten tryb w r1 istnial tylko w niezacommitowanym worktree (zarzut 2 zamkniety). Opis w naglowku pliku. `node --check` OK.
- Raport: dyspozycje/autobot/runs/R-WEB-SIEGE-SKIP-INSTANT-FALLBACK-DIVERGENCE-Q1/30-obrona-claude.md.

## ODPOWIEDZI NA ZARZUTY EVALUATORA

Zarzut 1 (brak kolumny AUTO, NIE_ZMIERZONO): PRZYJMUJE. Poprawka = pomiar, nie kod. Limit 280 s z r1 zastapiony foreground Bash 590 s, przebiegi pojedynczo, prebuild poza repo (/tmp, potem kopia w scratchpadzie). Dowod: AUTO 8x (WSKIP_AUTO_SPEED_IDX=3), surowe linie JSON w scratchpadzie `w29/auto8x.jsonl`, wszystkie 4 ziarna dokonczone (PAT, tura 400, bez timeoutu, L0 PASS):
  - seed 1: obronca, tura 400, virtMs 8721539, atk strat 26 (zyw. 13, HP 2658), def strat 11 (zyw. 17, HP 763)
  - seed 2: obronca, tura 400, virtMs 8677123, atk 26 (13, HP 2648), def 8 (20, HP 802)
  - seed 3: obronca, tura 400, virtMs 8847362, atk 26 (13, HP 2659), def 11 (17, HP 747)
  - seed 7: obronca, tura 400, virtMs 8830084, atk 25 (14, HP 2689), def 12 (16, HP 720)

Zarzut 2 (pomiar niereprodukowalny, tryb fallback tylko w worktree): PRZYJMUJE. Tryb `fallback` zacommitowany (patrz ZMIANY-COMMIT). Ponowny pomiar z kandydata (`w29/fallback.jsonl`, 4 ziarna, L0 PASS x4):
  - seed 1: atakujacy, tura 0 (w logu "Rundy: 14"), atk 39/39 zyw., def 28/28
  - seed 2: obronca, log "Rundy: 1"
  - seed 3: obronca, log "Rundy: 1"
  - seed 7: obronca, log "Rundy: 24"
  Wynik zgadza sie z tabela r1 (ta sama zwycieska strona w 4/4 ziarnach). "Tura 0" to licznik tury sceny: fallback nie przewija tur; rundy symulacji sa w logu.

Zarzut 3 (porownanie niejednorodne; "oblezenie bez wylomu"): CZESCIOWO PRZYJMUJE, CZESCIOWO ODRZUCAM.
  - ODRZUCAM framing "SKIP konczy sie na suficie bez wylomu". Dowod z surowych wynikow SKIP i AUTO 8x: `breached: true` i `siegeWallCol: 40` we WSZYSTKICH 4 ziarnach w obu trybach. To oblezenie Z wylomem. Ceiling 400 tur dla takiej bitwy to FF_MAX_ROUNDS i rozstrzygniecie po morale (battleScene.ts ~9577-9588, `_roundCapVerdict`: galaz `noBreach` dotyczy tylko bitew bez wylomu). Pat na turze 400 jest wiec wynikiem tej samej symulacji, nie sufitem "bez wylomu".
  - PRZYJMUJE, ze fallback z zalozenia ustawia wylom (R1: wallEverBreached=true przy machinie), ale SKIP/AUTO tez maja wylom, wiec zalozenie wylomu NIE tlumaczy rozjazdu. Rozjazd wynika z tego, ze fallback liczy pary jednostek bez ruchu (computeInstantResult), a SKIP przewija pelna symulacje. To model, nie warunek scenariusza.
  - PRZYJMUJE, ze straty fallbacku sa nieporownywalne: licznik sceny = 0 (fallback nie aktualizuje jednostek), wiec porownujemy zwyciezcow, tury i log. Straty fallbacku: NIE_ZMIERZONO.
  - Nowe ustalenie (1x vs 8x): wynik SKIP zalezy od WSKIP_AUTO_SPEED_IDX (krok FF = _scaledWallDelta). Przebieg SKIP przy 1x (domyslnie) dal inne liczby niz 8x: seed 1 virtMs 6904896; seed 2 def strat 11 (8x: 8); seed 3 def 12 (8x: 11); seed 7 def 8 (8x: 12). Tabela r1 byla z 8x (naglowek testu: WSKIP_AUTO_SPEED_IDX=3) i jest odtwarzalna co do liczby. Porownanie AUTO 1x vs SKIP 1x: NIE_ZMIERZONO.

Zarzut 4 (nieaktualny komentarz przy _skipInstantFallback, dublowanie pokrycia): PRZYJMUJE fakt, ODRZUCAM zmiane kodu w tej rundzie.
  - Komentarz battleScene.ts:3733 ("tylko gdy przewiniecie niemozliwe lub przekroczylo limit") jest nieaktualny w czesci "przekroczylo limit" (limit obsluguje _ffRoundCapResult). Jedyne wywolanie (battleScene.ts:3709) to `if (!this.started)`.
  - Nie zmieniam komentarza: battleScene.ts jest w obszarze W26 (B4b, wf_01b99e4d, r2 w toku); zmiana komentarza to ryzyko konfliktu przy integracji, a dispatch zabrania ruszania tego obszaru poza pomiarem. Do zrobienia po W26 albo przy decyzji A/B.
  - Pokrycie: siege-auto-breach-replay-e2e-live-test.cjs sekcja F wymusza te sama sciezke; nowy tryb `fallback` dubluje ja czesciowo. Zostawiam, bo tryb mierzy parytet wynikow, a nie sam fakt wywolania.

Uwaga procesowa Evaluatora (pkt 5): ZGODNE. Rozstrzygniecie DECISION_REQUIRED zostaje; rekomendacja A pozostaje aktualna; po pomiarach 8x nadal brak dowodu bledu widocznego dla gracza (sciezka nieosiagalna z UI, jedno wywolanie).

## TESTY (surowe wyniki z tego przebiegu)
Srodowisko: gra/node_modules = symlink do istniejacego node_modules z wf_01b99e4d-3f1-1 (bez npm ci, zeby nie zjadac dysku); build vite poza repo (/tmp, potem kopia w scratchpadzie).
- battle-skip-siege-parity-live-test.cjs, tryb fallback (seeds 1,2,3,7): `--- 4 ok, 0 fail`.
- battle-skip-siege-parity-live-test.cjs, tryb skip 8x (seeds 1,2,3,7): 4 x L0 PASS, bez timeoutu. Liczby identyczne z tabela r1 (seed 1 virtMs 8721536; seed 2 8677120; seed 3 8847360; seed 7 8830080).
- live test, tryb auto 8x (seeds 1,2,3,7; osobne wywolania): 4 x L0 PASS, bez timeoutu.
- Porownanie par (WSKIP_COMPARE=1, plik cmp8x.jsonl): `--- 4 ok, 0 fail` (P1: SKIP == AUTO dla seed 1, 2, 3, 7: zwyciezca, tura, straty, zywi, HP).
- battle-skip-equals-auto-resolve-test.cjs (domyslnie seeds 1,2,3,7, 8x): `--- 42 ok, 0 fail; CZESC B: DONE` (real 5m46s). Byl NIE_ZMIERZONO w r1; teraz zmierzony.
- Bramki kodu (tsc, logic, tech-tree, research, unit-replace, combat, battle-skip-siege-parity-test): NIE_ZMIERZONO w tej rundzie, bo kod gry sie nie zmienil (diff gra/src wzgledem b0b0e3f86 = pusty); wyniki z r1 i z Evaluatora (zielone) pozostaja odniesieniem.
- Dowod mutacyjny: nie dotyczy (brak poprawki kodu).
- Surowe dane: scratchpad `/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/w29/` (auto8x.jsonl, skip8x.jsonl, skip.jsonl (1x), fallback.jsonl, cmp8x.jsonl, dist/ = build).

## TABELA (8x; AUTO i SKIP zmierzone, fallback zmierzony)

| seed | AUTO 8x | SKIP 8x | fallback (_skipInstantFallback) |
|---|---|---|---|
| 1 | obronca, tura 400, PAT, atk 26/39, def 11/28 | obronca, tura 400, PAT, atk 26/39, def 11/28 | atakujacy, log "Rundy: 14", straty NIE_ZMIERZONO (licznik 0) |
| 2 | obronca, tura 400, PAT, atk 26/39, def 8/28 | obronca, tura 400, PAT, atk 26/39, def 8/28 | obronca, log "Rundy: 1" |
| 3 | obronca, tura 400, PAT, atk 26/39, def 11/28 | obronca, tura 400, PAT, atk 26/39, def 11/28 | obronca, log "Rundy: 1" |
| 7 | obronca, tura 400, PAT, atk 25/39, def 12/28 | obronca, tura 400, PAT, atk 25/39, def 12/28 | obronca, log "Rundy: 24" |

Wszystkie przebiegi AUTO/SKIP 8x: breached=true, siegeWallCol=40.

## WNIOSEK (po pomiarach)
- AUTO i SKIP w 8x sa zgodne we wszystkich 4 ziarnach (P1 PASS; battle-skip-equals-auto-resolve-test 42/0).
- Fallback rozjezdza sie ze SKIP/AUTO w 4/4 ziarnach: w seed 1 zwyciezca inny, w 2/3/7 zwyciezca ten sam, ale fallback liczy wynik po 1–24 turach zamiast 400 tur PAT. Rozjazd jest realny w sciezce awaryjnej i nie wynika z sufitu "bez wylomu" (wylom jest we wszystkich przebiegach).
- Sciezka jest nieosiagalna z normalnej gry (ustalenie r1, bez zmian). Dlatego nie ma dzis bledu widocznego dla gracza.
- Decyzja produktowa: nadal A/B (ABC wlasciciela). Nie wybieram sam.

## PYTANIE ABC do wlasciciela (bez zmian wzgledem r1)
A) (rekomendowane) Ujednolicic: skip() przed startem uruchamia _startBattle() i przewijanie; _skipInstantFallback usunac albo zostawic jako martwy kod z testem. Efekt w grze dzis: brak.
B) Zostawic fallback jako awaryjny rachunek i dopisac test dokumentujacy rozjazd (wynik fallbacku moze roznic sie od symulacji).
Dodatkowo do decyzji: czy SKIP ma dawac ten sam wynik przy roznych predkosciach (1x vs 8x); w pomiarze 1x i 8x dal rozne straty (parytet AUTO 1x vs SKIP 1x NIE_ZMIERZONO).

## BLOKADY
- Decyzja wlasciciela A/B (bez niej nie ma poprawki).
- Parytet AUTO 1x vs SKIP 1x nie zmierzony (poza zakresem dispatchu, zapisane jako obserwacja).
- Straty fallbacku nie zmierzone (licznik sceny = 0).
- Bramki kodu nie uruchamiane ponownie (brak zmian src).
- Komentarz battleScene.ts:3733 nieaktualny: do poprawki po W26 lub przy decyzji A/B.

RUNDY: 1/5 (obrona r1); bez nowej rundy Operatora
NASTEPNY KROK: pytanie ABC do wlasciciela (A/B + pytanie o parytet predkosci). Evaluator/Final Control po obronie.
DEPLOY/PUSH: NIE WYKONANO
