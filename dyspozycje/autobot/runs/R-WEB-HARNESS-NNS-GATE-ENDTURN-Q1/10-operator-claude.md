STATUS: PASS-WITH-NOTES
DOMAIN: GAME (harness testów live; zero zmian gra/src i gra/data)
TEMAT: R-WEB-HARNESS-NNS-GATE-ENDTURN-Q1 (NNSQ12 #156, odp. 12A: bramka „Zakończ turę” zostaje w grze)
GOAL: testy i runnery live przechodzą endTurn bez zatrzymania na bramce NNS; dowód: 3 ziarna (4242, 777, 7) x 60 tur bez zatrzymania, mutacja bez helpera czerwona.
RUNDY: 1/5 (Operator HAIKU 5.5)
BAZA: 7bebd2ee697c4adaa245c45c3b36c9927c5caafe (origin/main)

ZMIANY/COMMIT (allowlista):
- gra/tools/_live-ready.cjs: nowa procedura prepareEndTurnGate(page) (hak __nnsMeasureDebug: gateInfo, setPlayerTreasury, setPlayerGranary). Podnosi skarbiec do 5000 i spichlerz do 999 TYLKO gdy gra zgłasza canEnd=false; logikę bramki liczy gra.
- gra/tools/live-nns-gate-smoke-test.cjs (nowy): dymny test 60 tur w pętli endTurn, wznawialny (zapis slotu nns-gate-<seed> + stan). Obsługuje blokady inne niż NNS (oferty AI->gracz, pokój wymuszony, bitwy) przez istniejące helpery measure-reject-offers, measure-forced-peace i ai-economy-measure-run. Flaga --mutant 1 pomija helper.
- Nie zmieniono: gra/tools/war-duration-measure.cjs (krok 4 dispatchu). Podpięcie wymaga przepisania pętli endTurn w runnerze, więc pominięte do decyzji orkiestratora.
- Commit: SHA podany w StructuredOutput. Commit zawiera dwa pliki kodu i ten raport.

TESTY:
- npm ci w gra/ (PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1). Build poza repo: node ./node_modules/vite/bin/vite.js build --outDir <scratchpad>/dist-nns --emptyOutDir, built in 23.07s, exit 0.
- tsc --noEmit: exit 0.
- node --check: tools/_live-ready.cjs OK, tools/live-nns-gate-smoke-test.cjs OK.
- Smoke z helperem (wyniki z plików JSON testu):
  - ziarno 4242: PASS, 60/60 tur. Wykonane w 2 wywołaniach (pauza w turze 43, wznowienie ze slotu). Blokada NNS w turze 1 (prognoza skarbca -2) usunięta przez helper. Awarie strony: 0.
  - ziarno 777: PASS, 60/60 tur, jedno wywołanie, 341 s. Blokady zgłoszone przez grę: prognoza skarbca/spichlerza < 0 (7 razy), oferta handlowa AI (5). Awarie strony: 0.
  - ziarno 7: PASS, 60/60 tur, jedno wywołanie, 373 s. Blokady: oferta handlowa AI (63 razy), NNS (7). Awarie strony: 0.
- Mutacja czerwona (--mutant 1, bez helpera): ziarno 4242 zatrzymało się w turze 1 na bramce NNS (prognoza skarbca -2), 0 tur przeszło, exit 1.
- Chromium: 0 awarii procesu i strony w przebiegach.

BLOKADY:
- Pierwsza próba 4242 zatrzymała się w turze 52 z canEnd=false przy blokada=false. Przyczyną był gameOver: pasywny gracz utracił miasta. Test ustawia istniejące hooki testowe (__truceTestDebug.suppressVictoryForTest, __rebelProtectionTestDebug.disableVictoryCheckForTest; tylko ?civTest=1). Nie zmieniają reguł gry, tylko wyłączają koniec gry w teście.
- Blokady inne niż NNS są obsługiwane przez helpery pomiarowe i nie są błędem harnessu.

NASTĘPNY KROK:
- Evaluator (SONNET) i Final Control: sprawdzić allowlistę (git diff --stat), nowe pliki, mutację czerwoną i liczby z tabeli.
- Bramki ogólne z dispatchu (logic 213, tech-tree 20, research 33, unit-replace, combat 6, ai-test 297/0) NIE URUCHOMIONE w tej rundzie. Zmiany nie dotykają gra/src ani gra/data, a te testy nie ładują tools/_live-ready.cjs ani nowego testu. Orkiestrator potwierdza je przed READY_FOR_DEPLOY.

UWAGI-DLA-ORKIESTRATORA:
- Pasywny gracz w pomiarach przegrywa miasta po ok. 50 turach, więc każdy runner musi to obejść osobno (suppressVictoryForTest). Kandydat na wspólny helper w _live-ready.cjs (osobny temat, poza tym dispatchem).
- Czas: 60 tur to ok. 5–6 min na ziarno (startup ok. 2 min). Wznowienie ze slotu działa (zweryfikowane na 4242: pauza w turze 43, potem PASS 60).
- Podpięcie prepareEndTurnGate do war-duration-measure.cjs i runnera dyplomacji: NIE wykonane (wymaga przepisania pętli endTurn w runnerze).

DEPLOY/PUSH: NIE WYKONANO
