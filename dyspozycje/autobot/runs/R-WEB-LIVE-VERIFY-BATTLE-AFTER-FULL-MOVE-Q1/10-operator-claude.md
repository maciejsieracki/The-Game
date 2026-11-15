STATUS: BLOCK
DOMAIN: GAME (tylko pomiary i narzędzia; kod gry nietknięty)
TEMAT: R-WEB-LIVE-VERIFY-BATTLE-AFTER-FULL-MOVE-Q1
GOAL: potwierdzić na żywej bitwie (Chromium), że reguły z FALI 732/745/747 (odwrót, ucieczka 50% ruchu, pościg, neverRout, tempo mieszanej armii, straty w trybie ręcznym) nie zregresowały.
RUNDA: 2/5 (Operator HAIKU 5.5)

## Baza kodu (odstępstwo od tekstu zadania, z uzasadnieniem)
- Zadanie każe `git checkout --detach 622580620`. Ten commit zawiera tylko dwa pliki dispatchu (DODATEK/00-dispatch), nie ma w nim kodu gry i nie jest bazą pomiaru.
- Addendum mówi o bazie r1 `6f1f557f3` + merge `7ac79dafb`. `6f1f557f3` NIE jest przodkiem `7ac79dafb` (zmienia 4 pliki: obrona r1 i `gra/tools/live-verify-battle-after-full-move-rout-check.cjs`). Nie robiłem merge'a. Worktree startował od `7ac79dafb` (= origin/main, FALA 747). Z r1 wziąłem tylko plik checkera.
- Pomiary wykonano na kodzie `7ac79dafbf993119cae09c56cdc814bbc430680e` (FALA 747), zgodnie z celem addendum: "pomiary mają dotyczyć kodu PO FALI 747".
- SHA commita z raportem i narzędziami: patrz pole sha w StructuredOutput.

## ZMIERZONO

### (3) Rout i pościg (N3, cel 1): Chromium, auto-rozstrzygnięcie przewijane (mode=skip), 4 scenariusze x 3 ziarna = 12 bitew
- Dane surowe: `dyspozycje/autobot/runs/R-WEB-LIVE-VERIFY-BATTLE-AFTER-FULL-MOVE-Q1/evidence/rout-v2-all.jsonl` (wiersz = JSON z `gra/tools/battle-rout-pursuit-measure.cjs`). Hook rozszerzony o zdarzenia rozbicia i ucieczki z numerem rundy oraz flagą neverRout (`gra/tools/battle-rout-pursuit-browser-entry.ts`).
- We wszystkich 12 bitwach: timeout=false, pageerror=0.
- K1-K5 PASS na 12/12: fledNotAtEdge=0 (K2), routedLeft=0 po obu stronach (K3), bilans killed+fled+survived=total (K5). Pościg (K4) PASS: attacksOnRouted>0 w 12/12.
- Ucieczka wystąpiła w 9 z 12 bitew (wrecz 12v12 i strzelcy+wrecz oraz przewaga 2:1). W konnicy vs piechota (3 bitwy) nikt nie uciekł: piechota ginęła w rozbiciu, a konnica dobijała (killedWhileRouted=10).
- Przykłady (scen/ziarno; A=atakujący, D=obrońca; k/f/s = zabici/uciekli/ocaleli):
  - wrecz 12v12, s1: A 0/12/0, D 0/0/12, atkOnRouted=8, runda 34 (obrona wygrywa, atakujący uciekają bez zabitych).
  - konnica vs piechota, s1: A 0/0/8, D 14/0/0, killedWhileRouted=10, collapseRound=2.
  - przewaga 2:1, s2: A 0/0/20, D 2/8/0, atkOnRouted=41.
- Tryb `instant` (12 wierszy, fled=0): rozstrzygnięcie bez rozgrywania bitwy (`_skipInstantFallback`, runda=0). fled=0 jest więc oczekiwane i nie jest regresją neverRout.
- neverRout (K7): żadna jednostka neverRout nie została rozbita (PASS). Uwaga: scenariusze nie zawierają jednostek neverRout, więc K7 sprawdza pusty zbiór. Pełne pokrycie neverRout: NIE_ZMIERZONO.

### Limit odwrotu <=3 na turę (K6): FAIL, kandydat defektu (nie naprawiano)
- Pomiar: per (tura, strona) liczba jednostek, które przeszły w stan routed w tej turze. Maksimum 9. Naruszenie (>3) w 12/12 bitew, np. wrecz 12v12 s1 tura 10 strona atk = 6; przewaga 2:1 s2 tura 9 strona def = 6.
- Kod: liczniki `_routCountA` / `_routCountD` (battleScene.ts:2450-2451) są zerowane (11143-11144), ale nigdzie nie są inkrementowane ani sprawdzane (sprawdzone grepem po battleScene.ts). Reguła FALI 732 ("do trzech na turę, czwarty = unicestwienie") nie jest widoczna w źródle. Commit d1a2ad5c3 to tylko artefakt builda. Wygląda na to, że zalamanie morale armii (`battleScene.ts` ok. 10744-10748, "reszta jednostek pęka i ucieka") rozbija wszystkich naraz.
- Zakaz zmian w gra/src: nie naprawiano. Kandydat: R-WEB-BATTLE-RETREAT-CAP-3-NOT-ENFORCED-Q1 (patrz UWAGI).

### (2) Mieszana armia: tylko test headless (częściowo)
- `gra/tools/battle-pace-equal-line-live-test.cjs` (ta sama produkcyjna pętla tury, bez Chromium): 23 PASS / 0 FAIL, mutacje 5/5 czerwienią test. Wynik: `evidence/pace-equal-line.txt`.
- To NIE jest pomiar live w Chromium. Nie zawiera metryk wymaganych w N2: tabeli rozrzutu frontu przed zderzeniem per typ, odsetka aktywacji z niewykorzystanym ruchem per typ, ciosów na jednostkę na turę (<=1). NIE_ZMIERZONO.

### Bramki referencyjne i typy
- `npx tsc --noEmit -p tsconfig.json`: exit 0.
- logic-test: LOGIC OK (213/213); tech-tree-test: 20 pass, 0 fail; research-test: ALL GREEN; unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21); combat-test: All sanity checks passed. Logi: `evidence/gate-*.txt`.
- `git diff --check`: czysto.

## NIE_ZMIERZONO (z powodami)
- (1) Ruch uciekinierów 50% i kolumna pozycji per tura: runner nie eksportuje pozycji per tura. Fled i pościg są zmierzone.
- (1) Zrzuty ekranu obejrzane narzędziem Read: nie wykonano w tej rundzie.
- (2) Live Chromium z rozrzutem frontu i ciosami per typ: nie wykonano w tej rundzie (patrz wyżej).
- (3) Straty zwycięzcy w trybie RĘCZNYM (driver klik-po-klik w Playwright, 3 ziarna x 2 składy vs AUTO): nie wykonano. Nie zbudowano `gra/tools/live-verify-battle-after-full-move-manual-driver.cjs`, bo zabrakło czasu na przejście UI bitwy ręcznej w tej rundzie. Nie stwierdzono twardej przeszkody wymagającej zmiany gra/src. Do zrobienia w kolejnej rundzie Operatora bez zmian w gra/src.
- K6 kończy checker kodem 1. Zgodnie z kryterium (c) to właściwe zachowanie narzędzia, a nie błąd narzędzia.

## Narzędzia (allowlista)
- `gra/tools/live-verify-battle-after-full-move-rout-check.cjs`: checker K1-K7, kod wyjścia 1 przy niespełnionym kryterium. Uruchomienie: `cd gra && node tools/live-verify-battle-after-full-move-rout-check.cjs <plik.jsonl>`. Dane wejściowe: `evidence/rout-v2-all.jsonl`. Wynik: `evidence/rout-check-r2.txt` (exit 1, 12 FAIL wyłącznie K6).
- `gra/tools/battle-rout-pursuit-browser-entry.ts`: dodany eksport `events.rout` / `events.flee` (tura, strona, id, neverRout). Zmiana wyłącznie w narzędziu pomiarowym.
- Pomiar: `cd gra && ROUT_SCEN=0,1 ROUT_SEEDS=1,2,3 ROUT_MODES=skip,instant node tools/battle-rout-pursuit-measure.cjs > <plik>.jsonl` (ok. 6 min na połowę scenariuszy; foreground, bez run_in_background).

## UWAGI-DLA-ORKIESTRATORA (kandydaci R-WEB-*, nie naprawiano)
1. R-WEB-BATTLE-RETREAT-CAP-3-NOT-ENFORCED-Q1: limit 3 odwrotów na turę (FALA 732) nie działa w `gra/src/battle/battleScene.ts`. Liczniki `_routCountA/_routCountD` nigdy nie rosną. Minimalna reprodukcja: `battle-rout-pursuit-measure` z `ROUT_SCEN=0 ROUT_SEEDS=1 ROUT_MODES=skip` daje 6 rozbić po stronie atk w jednej turze (tura 10). Dowód: `evidence/rout-check-r2.txt`. Wpływ: reguła właściciela o odwrocie nie jest egzekwowana. Do decyzji właściciela: czy "czwarty = unicestwienie" ma obowiązywać także przy zalamaniu morale armii.
2. Pozostałe pomiary (live mieszana armia, driver ręczny, zrzuty) to następna runda Operatora. Nie są defektem.
3. Dług testowy: `battle-large-mixed-doctrine-matrix-test.cjs` nie był uruchamiany w tej rundzie (poza zakresem N1-N3).

## TESTY (zbiorczo)
- K6 rout-check: FAIL 12/12 (wyłącznie odwrót <=3, max 9). K1-K5 i K7: PASS na 12/12.
- pace-equal-line: 23 PASS / 0 FAIL.
- tsc: exit 0; logic 213/213; tech-tree 20/0; research ALL GREEN; unit-replace 21/21; combat sanity PASS.

BLOKADY: N1 (driver ręczny, zrzuty) i N2 (live Chromium mieszana armia z metrykami per typ) nie wykonane w tej rundzie. K6 to otwarty defekt (kandydat 1).
RUNDY: 2/5 (Operator HAIKU; Sonnet nie użyty)
NASTĘPNY KROK: runda 3 Operatora: driver ręczny N1 (Playwright, bez zmian w gra/src), N2 live z metrykami per typ, zrzuty z Read. Wynik K6 przekazać do decyzji właściciela (kandydat 1).
DEPLOY/PUSH: NIE WYKONANO
