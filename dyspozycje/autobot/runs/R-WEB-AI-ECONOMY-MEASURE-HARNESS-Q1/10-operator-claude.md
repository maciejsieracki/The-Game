STATUS: PASS-WITH-NOTES
DOMAIN: GAME (narzędzia pomiarowe + hak civTest; bez zmian logiki gry)
TEMAT: R-WEB-AI-ECONOMY-MEASURE-HARNESS-Q1
GOAL: harness pomiarowy ekonomii AI (metryki w haku civTest, runner wznawialny, obejście bramki NNS gracza, dowód 100 tur ×2 ziarna, test wznowienia, instrukcja pomiaru #415 ON/OFF)
ZMIANY/COMMIT: baza 6d25244ea (r2) -> kod r3 `ba327c946`; raport/dowody/README w commicie raportu (czubek pracy, SHA w polu `sha`).
  Pliki: `gra/src/main.ts` (wyłącznie blok `__aiEconomyMeasure` za `?civTest=1`: usunięcie fantomowych ownerów z `aiStartHexes`, nowe `diag.aiStartOwnersBezWiersza`),
  `gra/tools/ai-economy-measure-run.cjs`, `ai-economy-measure-hook-test.cjs`, nowy `ai-economy-measure-upkeep-onoff.cjs`, `ai-economy-measure-README.md`, `runs/R-WEB-AI-ECONOMY-MEASURE-HARNESS-Q1/{10-operator-claude.md,evidence/r3-*}`.
  Nie ruszono: logiki gry, gra/data, WERSJE.md, manifest, rust-port, gra-robocza.
TESTY: (surowe wyjścia w `evidence/r3-*`)
  - tsc --noEmit: 0 błędów (ZMIERZONE).
  - logic-test 213/213; tech-tree-test 20 pass 0 fail; research-test 33/33; unit-replace-test 21/21; combat-test 6/6; resource-ledger-hook-gate-test 6 passed 0 failed (wszystkie ZMIERZONE po `npm ci`, na kodzie r3).
  - Test haka (`r3-hook-test.log`): 11/11 ZIELONE, w tym: kształt (42 właścicieli, komplet pól), brak fantomowych ownerów, AI z miastami (42 właścicieli z miastem), bramka NNS blokuje w t1, dosypka 0/0 NIE odblokowuje, dosypka 200/200 odblokowuje i endTurn 1->2 (`bypassApplied` ścieżka WYKONANA), wartość AI (każdy AI >=1 miasto; bez jednostek [23] = 1 z 41 <= 10%), kontrola negatywna bez `?civTest=1`, mutacja realna (bundle z przemianowanym `utrzymanieJednostekPieniadz`) CZERWONA zgodnie z oczekiwaniem.
  - Mutacja obejścia w runnerze (`--gold 0 --food 0`): stop `gate-blocked-after-bypass` w t1 (`r3-bypass-mutation.json`) = CZERWONE jak trzeba.
  - 100 tur x 2 ziarna: PRZEBIEG (b), patrz tabela niżej. ZMIERZONE.
  - Wznowienie 41-50 (c): CZERWONE 0/10 (ZMIERZONE na kodzie r3); przyczyna i dowód niżej. Mutacja wznowienia: NIE ZMIERZONO (dispatch: dopiero przy zielonej bazie).
  - Skrypt ON/OFF #415: zweryfikowany na 20 turach (oba bundle zbudowane, oba przebiegi do t20, OFF != ON).
  - `git diff --check`: czysto (sprawdzone przed commitem).

## Diagnoza N1 — dlaczego AI miały 0 miast (ODWOŁANIE tezy z r2 „defekt startu gry”)
Ustalone przez porównanie ze ścieżką `ai-army-live-measure.cjs` i sondę (p.cjs): `__nnsMeasureDebug.startGame` wywołuje asynchroniczne `doStartGame`; klastry AI i miasta-państwa powstają dopiero po zniknięciu nakładki „Tworzenie świata” (u mnie ~120 s przy 41 właścicielach). Runner/test haka (r1/r2) zakładały miasto gracza od razu po `turn >= 1`, czyli przed końcem generacji. Naprawa: czekanie na koniec nakładki + `awaitingFirstCity===true`, dopiero potem `foundFirstCity`. Defekt jest w HARNESSIE, nie w grze. Dowód: sonda po naprawie: 42 właścicieli z miastem w t1 (`diag`: citiesAll=42, aiStartOwnersBezWiersza=[]).
Dodatkowo (zarzut 6 Evaluatora r2): hak nie dodaje już właścicieli z `aiStartHexes` bez miasta/jednostki; zamiast wierszy zerowych jest `diag.aiStartOwnersBezWiersza` (jawny sygnał).

## (b) 100 tur x 2 ziarna — ZMIERZONE
| Ziarno | Tura końcowa | Tury z aktywną bramką NNS gracza | Dosypki | Czas | Uwagi |
|---|---|---|---|---|---|
| 4242 | 100 | 1 (t1) | 1 | ≈ 6 min (t1-51) + 35 min (t50-100 po wznowieniu) | przebieg ciągły zatrzymał się w t51 (kolejka bitew, niżej); wznowienie ze slotu t50 |
| 777 | 100 | 1 (t1) | 1 | ≈ 31 min (t1-89) + 18 min (t80-100) | zatrzymanie w t89 tą samą przyczyną; wznowienie ze slotu t80 |
JSONL: 99 wierszy na ziarno (t2..t100), `evidence/r3-seed4242-100t.jsonl`, `r3-seed777-100t.jsonl`.

Kryterium „AI mają miasta>0 i jednostki>0 w t2/t50/t100” (z JSONL):
| Ziarno | t2 | t50 | t100 |
|---|---|---|---|
| 4242 | 41/41 AI z miastem i jednostką | 16 AI, 16 z miastem, 15 z jednostką | 14 AI, 14/14 |
| 777 | 41/41 | 14 AI, 14/14 | 14 AI, 14/14 |
Wyjątek jawny: seed 4242 t50 — 1 AI z miastem, ale 0 jednostek (utrata garnizonu; zachowanie gry). Z 41 AI na starcie zostaje 14-16 do t50 (pozostali znikają z wierszy — wyeliminowani/wchłonięci; przyczyna NIE zbadana). Gracz (owner 0) w t100 nie ma miast ani jednostek (`ownersBezMiastIJednostek=[0]`) — bierny gracz podbity.
Dane dla #415 (t100): suma wojska AI 895 (4242) / 883 (777), śr. skarbiec AI 18 315 / 29 374, max utrzymanie jednostek jednego AI 3416 / 6272 Pieniądza/turę; `glodWojska` sporadycznie (t10 seed 777: 1), `deficytZlota` = 0 w próbkach t2/t10/t50/t100.

## N2 — obejście bramki NNS
Na ścieżce newgame bramka gracza blokuje wyłącznie w t1 (`gateActiveTurns=1`, `bypassApplied=1` w obu ziarnach). Ścieżka dosypek WYKONANA i zmierzona (test haka: warunek wstępny blokuje, 0/0 nie odblokowuje, 200/200 odblokowuje, endTurn przechodzi), mutacja runnera czerwona. Harness dosypuje wyłącznie graczowi; blokady AI nie ukrywa.

## N4 — skok licznika tury 2->1 w `?playtest=mapa&civTest=1`
ZMIERZONE (sonda p2, seed 4242, 8 prób endTurn): w jednej próbie licznik pokazał 2 -> 3 -> 1; potem 1 -> 2; od 4. próby bramka NNS blokuje i tura stoi na 2. Przyczyna skoku NIE ZMIERZONA (kodu scenariusza playtest nie badano). Wniosek: scenariusz playtest nie nadaje się do pomiaru; runner używa `--start newgame`.

## N5 — wznowienie (c): CZERWONE, przyczyna po stronie gry
Polecenie: `--turns 50 --save-at 40 --resume-test 1` seed 4242 (kod r3): `allEqual=false, compared=10`, zgodnych 0/10 (`evidence/r3-resume-test-seed4242-summary.json`). #424 (R-WEB-SAVE-LOAD-CITY-WORK-SPLIT-ROUNDTRIP-Q1) NIE jest na `origin/main` (sprawdzone `git log origin/main --grep=ROUNDTRIP`, main = bd647523b). Dowód przyczyny (diff migawek t41, ciągła vs wznowiona, `r3-resume-t41-snapshot-diff.txt`, 443 różnic): po wczytaniu zapisu WSZYSTKIE 41 miast dostają pola domyślne, których w stanie ciągłym nie ma (`magazynZywnosci` null->0, `budowaPriorytetTypow`, `budowaLista`, `postepBudynkowUsuniete`), ponadto 88 różnic `wealthState.pula`, 78 `units[].stackGroupId`. To klasa SAVE-LOAD (uzupełnianie domyślnych pól miasta przy wczytaniu), poza allowlistą. Zakres tabeli SAVE-LOAD w #424 jest więc SZERSZY niż sam `podzialPracy` — do uwzględnienia przy tym temacie. Asercji nie osłabiono. Po naprawie #424 powtórzyć polecenie i dodać `--mutant 1`.

## N3 — README / #415
README przepisane (stan r3, tabela przebiegów, test haka, usunięta błędna diagnoza „zapis nie zawiera podzialPracy” i „defekt startu”). #415: nowy `gra/tools/ai-economy-measure-upkeep-onoff.cjs` — jedno polecenie `cd gra && node tools/ai-economy-measure-upkeep-onoff.cjs --work /tmp/upkeep-onoff --seed 4242 --turns 100`; nakłada diff z `refs/keep/R-WEB-AI-UPKEEP-Q2-r2-fc` (3 pliki; flaga `AI_UPKEEP_RUNWAY_GATE.wlaczone` w `gra/data/ai-upkeep-params.json`) na tymczasowy worktree z HEAD, buduje dwa bundle poza repo, uruchamia runner ON/OFF i drukuje tabelę. Do main flagi NIE wprowadzono. Weryfikacja 20 tur: OFF vs ON różnią się (t20 śr. skarbiec AI 43,44 vs 41,02), więc flaga realnie działa; to próba narzędzia, nie wynik #415. Właściwy pomiar 100 tur ON/OFF = ok. 2 x 40 min w tle — NIE wykonano w tej rundzie (poza zakresem „narzędzie + dowód działania”).

BLOKADY:
  - (c) wznowienie czerwone z powodu SAVE-LOAD (#424), poza allowlistą; mutacja wznowienia NIE ZMIERZONO.
  - Pomiar #415 ON/OFF na 100 turach NIE wykonany (tylko weryfikacja narzędzia na 20 turach).
  - Skuteczność leczenia zalegającej kolejki bitew w runnerze (`stuckQueueHeals`) NIE ZMIERZONA w żywym przebiegu (po wznowieniu zjawisko się nie powtórzyło: licznik 0).
RUNDY: 3/5 (Sonnet na Operatorze po dwóch nieudanych rundach Haiku: r1 FAIL, r2 BLOCK — zgodnie z dispatchem).
NASTĘPNY KROK: Evaluator -> Final Control; po naprawie #424 powtórzyć `--resume-test` i mutację wznowienia; osobno pomiar #415 ON/OFF (skrypt gotowy).
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA (znaleziska poza zakresem, bez zakładania zadań):
  1. Możliwy defekt gry: zalegająca kolejka odłożonych bitew (`pendingAuto=true`, nic nie otwarte, `canEnd=false`) blokuje „Zakończ turę” do momentu PRÓBY zakończenia tury (+8 s leczenia). Wystąpiła w przebiegu ciągłym obu ziaren (seed 4242 t51, seed 777 t89) przy ~15-41 AI. Kandydat R-WEB-* (t57 z #418 może mieć ten sam mechanizm — hipoteza NIEZWERYFIKOWANA).
  2. #424 obejmuje więcej pól niż `podzialPracy` (zob. N5); warto rozszerzyć dispatch SAVE-LOAD o `magazynZywnosci`, `budowaPriorytetTypow`, `budowaLista`, `postepBudynkowUsuniete`, `wealthState.pula`, `units[].stackGroupId`.
  3. Z 41 AI zostaje 14-16 do t50 (eliminacje/wchłonięcia) i bierny gracz traci wszystko do t100 — wpływa na interpretację pomiarów ekonomii AI (liczba owners w wierszach maleje).
  4. Skarbce AI rosną do dziesiątek tysięcy Pieniądza (brak sinka) — dane wejściowe dla #415.
  5. Czas 100 tur z 41 AI: ok. 40-50 min na ziarno (35-50 s/turę po t60) — kolejny pomiar planować w tle z wznawianiem.
