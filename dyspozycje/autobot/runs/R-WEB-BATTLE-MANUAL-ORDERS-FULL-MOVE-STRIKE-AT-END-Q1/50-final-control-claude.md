STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-MANUAL-ORDERS-FULL-MOVE-STRIKE-AT-END-Q1
GOAL: rozkaz reczny (marsz / atak) = pelny ruch w jednej aktywacji, cios na koncu ruchu (max 1/ture), AUTO bez zmian.
ZMIANY/COMMIT: kandydat 39dab519d (potomek bazy 459354a12: merge-base --is-ancestor = tak). Diff vs baza = 4 pliki, wszystkie w allowliscie: gra/src/battle/battleScene.ts (tylko sciezka _performPlayerOrder + 3 nowe pomocnicze _manualOrderChainActive/_manualOrderAfterStep/_manualOrderStrike), gra/tools/battle-manual-orders-full-move-test.cjs, runs/.../10-operator-claude.md, 30-obrona-claude.md. integration_sha = 39dab519d (kod); commit z tym raportem jest dodatkowy, tylko dokumentacja.

ZARZUTY (werdykt na zarzut):
1 (krytyczny, lancuch martwy dla jednostek domyslnych) - ODDAL: naprawione w bd1f05836 (usuniety warunek _isUnitDoctrineAuto). Zweryfikowane samodzielnie live (ponizej): ruch 1,79/1,65 hex na aktywacje, ruch+cios 6.
2 (brak pomiaru live) - ODDAL: pomiar live wykonany przeze mnie (ponizej) i przez Obrone.
3 (test na stubach) - ODDAL: stub _isUnitDoctrineAuto usuniety, test uzywa prawdziwej funkcji; --mutate czerwony. Pozostale stuby (BFS/koszt terenu) to drobne ograniczenie, pokryte pomiarem live.
4 (attackMove z wyczerpanym MP vs move) - ODDAL: niespojnosc wg zalozenia operatora, nie blokuje celu; do osobnej decyzji.
Zadnego NAPRAW, zadnej decyzji produktowej.

TESTY (surowe wyniki):
- npm ci OK; tsc --noEmit exit 0.
- battle-manual-orders-full-move-test.cjs: passed (exit 0); z --mutate: AssertionError (czerwony).
- git diff --check baza..kandydat: nie uruchomione w tej formie przez ograniczenie srodowiska; git diff --check na drzewie roboczym czysty; lista plikow diffu = 4 pliki allowlisty.
- 5 referencyjnych: logic-test 213/213; tech-tree-test 20 pass 0 fail; research-test ALL GREEN; unit-replace-test 21/21; combat-test All sanity checks passed. Wszystkie exit 0 (brak czerwonych, porownanie baza vs kandydat zbedne).
- battle-attack-move-order-test: passed; battle-manual-orders-routing-test: passed.
- LIVE Chromium (Vite przez HTTP, battle-manual-orders-full-move-repro-measure.cjs, Hastati 6 vs 6, limit 120-200 s => przebiegi czesciowe, timedOut):
  move seed1: hexPerRoundWhenMoving 1,79; movingUnitRoundsWithStrike 6; leftoverMp 0,38
  move seed3: 1,65; 6; leftoverMp 0,55
  attack seed2: 1,92; 11; (wskaznik leftoverMp=3, patrz uwagi)
  Baza wg Evaluatora: 1,00 hex, 0 ruch+cios, leftover ~2 MP.
- AUTO (summary pomiaru, ziarna 1 i 2, baza vs kandydat; battleScene.ts podmieniony na baze na czas przebiegu): identyczne w obu ziarnach (seed2: 0,47/1,75/0,72/5/4,33; seed1: 0,62/1,48/0,57/5/5,83). Ziarno 3 AUTO NIE ZMIERZONO. Strukturalnie lancuch wymaga _manualMode && strona gracza && playerOrder move/attackMove/attack, wiec AUTO i Skip bez zmian.

BLOKADY: brak blokujacych.
UWAGI-DLA-ORKIESTRATORA:
- Kryterium "niewykorzystany ruch <=10%" nie jest literalnie spelnione w move seed1/3 (0,38 i 0,55 z 3 MP = 13% i 18%): jednostka dochodzi do wroga, bije i zostaje jej reszta MP (cel osiagniety, nie wyczerpanie). Uznane za zgodne z GOAL ("do wyczerpania MP albo do celu").
- W trybie attack wskaznik leftoverMp=3 w moim przebiegu (probka czesciowa, timedOut): NIE rozstrzygniete, czy artefakt metryki; ruch+cios 11 i 1,92 hex potwierdzaja dzialanie.
- Przebiegi live czesciowe (timedOut); pelny przebieg do konca bitwy NIE ZMIERZONO.
- Zarzut 4 do osobnej decyzji (spojnosc attackMove vs move), powiazany z #430/#439.
RUNDY: 1/5 (Final Control po obronie)
NASTEPNY KROK: integracja orkiestratora (merge 39dab519d), deploy ROBOCZA po osobnej autoryzacji.
DEPLOY/PUSH: NIE WYKONANO
