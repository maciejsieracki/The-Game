STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-AI-MOVE-FULL-RANGE-Q1
GOAL: AI w marszu zuzywa pelny zapas ruchu (jednostka i grupa), bez zmiany balansu/kosztow terenu; zgodnie z regulami (wrog, obce miasto, koszt terenu).
RUNDY: 1/5

## Baza i diagnoza
Baza: origin/main a4eda2b7e (>= 23dd158e9). Pojedyncza jednostka juz jest OK (R-WEB-AI-MOVE-RANGE-Q1: firstStep = farthestStepWithinBudget, ai.ts:895-909; egzekutor truncatePath main.ts:39145). Hipoteza "kolizja z wlasnym heksem cofa koniec marszu" (ai.ts firstStep / ai-city-capture-executor.ts:130) zostala ZMIERZONA i ODRZUCONA: computePath omija zajete heksy (setup.ts), kolumna 5 jednostek z jednego heksu przechodzi 5/5/5/5/5 takze na bazie. Zmian w ai.ts, main.ts, executorze NIE ma.

Realna przyczyna: planer wojny all-in `planWarAllInCapital` (warAllInCapital.ts, uzywany przez ai.ts applyWarAllInCapitalToCommands, main.ts przez decideAITurn):
1. `emit` rezerwowal WSZYSTKIE heksy trasy kazdej jednostki (`st.claimed`), nie tylko koncowy -> jednostki z tylu nie mialy gdzie isc (wczesniej: kolumna 8 jednostek, budzet 3 = 10/24 pkt).
2. `extendWalk` szedl tylko krokami "scisle blizej celu" -> w linii marszu jeden pas; zajety heks blokowal reszte. Brak kroku bocznego.

## Zmiany (1 plik zrodlowy)
`gra/src/game/warAllInCapital.ts` (+46/-2): (a) rezerwacja tylko heksu koncowego; (b) w `extendWalk` krok BOCZNY (to samo pole odleglosci, hexDistance nie rosnie, jak w chooseStep) wylacznie gdy po nim da sie jeszcze zblizyc w budzecie (bez ping-pongu, zbior visited). Zachowane: wylacznosc heksu koncowego, nigdy nie cofa, wrog/obce miasto (nav.occupied/blocked), koszt terenu, determinizm.
UWAGA ZAKRES: warAllInCapital.ts NIE jest na allowlist (jest tam ai.ts/army-concentration/pathfinding/main). Uzasadnienie: przyczyna lezy wylacznie tu (planer ruchu wojsk, poprzedni temat MOVE-RANGE tez go zmienial); ai.ts tylko go wola. Do oceny Evaluatora/orkiestratora; nie dotyka logiki zbiorki ani omijania terytorium.
Nowy: `gra/tools/ai-move-full-range-test.cjs` (+ dowody w katalogu runu).

## Pomiar (PRAWDZIWY decideAITurn + executeAiCityMove okablowany jak main.ts; 3 swiaty x 6 ziaren x 100 tur; PRZED = warAllInCapital.ts z a4eda2b7e przez git show)
Silnik NIE jest main.ts (nieuruchamialny headless); pelna gra w przegladarce: NIE_ZMIERZONO (poprzedni temat: 66 min/gra). "plains" jest niezalezny od ziarna.
- Formacje ustalone: blok 3x3 (8 jedn.) 15/21 -> 18/21 pkt; kolumna 8x3: 10/24 -> 24/24.
- Symulacja (zsumowane ziarna 1-3 i 4-6): udzial ruchow z niewykorzystanym zapasem mimo wolnej trasy 8,1%/7,8% -> 4,9%/5,4%; sredni odsetek wykorzystania 92,7%/93,7% -> 94,3%/94,4%; ruch4 88,8% -> 89,6%, ruch3 93,1% -> 93,8%.
- Czas decyzji: 2,26-2,44 ms/ruch PRZED vs 2,21-2,29 ms/ruch PO (nie wzrosl).
- Histogram firstStep (plik:linia ai.ts:909, stan PO, 18 tys. wywolan): zasieg zuzyty w 100% ~72%, przybycie do celu w zasiegu ~21% (legalne), granulacja kosztu terenu (nastepny heks drozszy niz reszta) ~6%, INNE 0.
- Pozostale 5% niewykorzystania: formacje gesto upakowane (wylacznosc heksu koncowego, tie-break leksykograficzny chooseStep), rendezvous/oczekiwanie (swiadomy projekt).

## ZALOZENIA
- Stos porusza sie z predkoscia najwolniejszej TYLKO u gracza (armyMerge.ts:828 stackRuchLeft, :870 stackRuchMax). Ruch AI jest indywidualny (komenda per jednostka, executeAiCityMove ruchLeft=0), wiec kazda jednostka uzywa WLASNEGO zapasu; test B8 (2,3,4). Nie zmieniano.
- Oczekiwanie glowy na doganiajaca grupe (waiting/held w planerze) to zaprojektowana zbiorka, nie zmieniana.
- Mgla wojny/granice obce/strefa kontroli: zachowanie niezmienione (planer dostaje blocked/occupied od wolajacego); nietestowane osobno poza B5/B6.

## TESTY
- `ai-move-full-range-test.cjs`: GREEN 20/20 (gate-test-s123.txt, gate-test-s456.txt, EXIT=0); RED na zrodle bazowym: 12 passed / 5 failed, EXIT=1 (gate-red-base.txt); mutacje (brak kroku bocznego, rezerwacja calej trasy) czerwienia A1/A2/C.
- tsc --noEmit: EXIT=0 (gate-tsc.txt).
- Regresje 80 testow (ai-*, war-allin, army-*, *move*, *movement*, planned-march, city-hex): zbior porazek PRZED == PO (diff pusty): ai-test, ai-fog, ai-major-economy, ai-balans-step3, ai-wojny-zwykle..., war-allin-capital-test (94/4 identyczne), player-moves-before-ai-turn, itd. (znane czerwone, evidence-regress-{pre,post}.txt). ai-move-range-test i *collision* zielone.

## BLOKADY
Brak. Znana pre-existing czerwien war-allin-capital-test 1a/6b (identyczna PRZED/PO).
NASTEPNY KROK: Evaluator (ocena zakresu: warAllInCapital.ts poza allowlista; ocena kroku bocznego), potem Final Control.
ZMIANY/COMMIT: patrz SHA ponizej (jawny git add, bez push).
DEPLOY/PUSH: NIE WYKONANO
