STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ENDTURN-BATTLE-DEADLOCK-Q1
GOAL: Runda 5 (ostatnia): dodać TEST WYKONAWCZY na prawdziwym kodzie main.ts i prawdziwej kolejce ui/preBattle.ts, zamiast samych pinów tekstowych (zarzut Evaluatora po r4). Bez zmian w logice gry.
ZMIANY/COMMIT: baza 01e8badf (łańcuch 4eb67321, 25bffd17, 349c8481, 01e8badf). Nowe pliki:
- `gra/tools/endturn-battle-deadlock-exec-test.cjs` (test wykonawczy)
- `dyspozycje/autobot/runs/R-WEB-ENDTURN-BATTLE-DEADLOCK-Q1/01-operator-r5.md` (ten plik)
`gra/src/main.ts` NIE zmieniony (test wyciąga ciała funkcji ze źródła, bez szwu testowego). `ui/preBattle.ts`, `game/**`, `battle/**`, `WERSJE.md`, `gra-robocza/**`: bez zmian. Commit w worktree, bez push.

Metoda: ciała `flushDeferredPreBattleSafely`, `scheduleDeferredPreBattleQueueWatchdog`, `maybeScheduleDeferredPreBattleQueueWatchdog`, `healStaleEndTurnBlockers`, `canPlayerInitiateEndTurn`, `hintEndTurnBlocked`, `healStuckDeferredPreBattleQueueOnEndTurnAttempt`, `advanceSeat`, `triggerPlayerEndTurn` są wyciągane z `main.ts` (indeks + `\n    }\n`), transpilowane esbuild i uruchamiane w fabryce z podstawionym stanem `let` oraz zaślepkami (`endActiveHumanTurn`, `switchActiveHuman`, `isDiplomacyAudienceOpen` itd.). Kolejka to prawdziwy bundel `ui/preBattle.ts` (esbuild + jsdom). Zegar sterowany ręcznie (`Date.now`, fałszywy `window.setTimeout`). Baza origin/main: `git show fcd86933:gra/src/main.ts`.

ZAŁOŻENIE: stan „osierocony” = bitwa odłożona przy otwartej audiencji, audiencja zamknięta bez flusha, brak ekranu (zgodnie z dispatchem). NIE_ZMIERZONO: czy taki stan występuje w grze na zapisie właściciela (brak repro w Chromium, zrzut nie był analizowany w tej rundzie).

TESTY:
- `node tools/endturn-battle-deadlock-exec-test.cjs` (z gra/): 36 pass / 0 fail.
  - A (fcd86933): klik 1 i 2 -> endTurn=0, podpowiedź „Zakończ ekran bitwy, potem zakończ turę.”; po 10 kliknięciach nadal 0 i brak ekranu (deadlock trwały).
  - B (poprawka): klik 1 otwiera „WOJNA1”; po rozstrzygnięciu klik 2 kończy turę.
  - C1: przy otwartym ekranie klik nie kończy tury, także po 9 s fałszywego czasu; watchdog nie rusza ekranu ani kolejki.
  - C2: przy otwartej audiencji odroczenie zostaje (bitwa nie pokazana, nie skasowana).
  - D: N=4 (W0..W3), W1 rzuca w showPreBattle; advanceSeat i triggerPlayerEndTurn: wyjątek nie wychodzi z kliknięcia, koniec tury po 5 kliknięciach (≤ N+1), FIFO W0,W2,W3, ostrzeżenie w logu, kolejka pusta. Na fcd86933 ten sam scenariusz: endTurn=0 (kontrola).
  - E: watchdog — healStale planuje DOKŁADNIE jeden timer 50 ms; przed 50 ms nic; po 50 ms odpala się bez kliknięcia i otwiera bitwę (warn „watchdog”); z audiencją otwartą w chwili odpalenia nie otwiera.
  - F (mutacje, każda czerwieni swój scenariusz): M1 brak flush-first (B i D czerwone); M2 brak watchdoga (E czerwone); M3 brak try/catch (D czerwone: wyjątek wychodzi); M4 bramka tylko `isPreBattleOpen()` (C2 czerwone: koniec tury przy czekającej kolejce).
- `node tools/endturn-battle-deadlock-test.cjs` (pin tekstowy r4): 38 pass / 0 fail, bez zmian.
- Testy produktowe (barbarzyncy, war-allin, logic, ai) NIE uruchamiane: diff nie dotyka kodu produkcyjnego (tylko nowy plik testu). `tsc` i build Vite NIE uruchamiane (brak zmian w TS produkcyjnym).
- `npm ci --ignore-scripts` w `gra/` wykonane w worktree (node_modules, gitignored).

BLOKADY: brak twardych.

ZARZUTY ODŁOŻONE JAKO OSOBNE TEMATY (nie naprawiane w tym temacie):
1. Źródło osieroconej kolejki: `finishMapBattleUi()` (main.ts ~27949) i `clearBattleUiState()` (~30733) nie wołają flusha. Test wykonawczy tego nie dowodzi; ścieżka kliknięcia to odzyskuje (flush-first).
2. Wyciek `activeBattleUnitIds` (nieopisany w dispatchu jako zrealizowany).
3. Walidacja rosterów przy odtwarzaniu bitew.
4. Hipoteza właściciela (bitwy AI↔AI / barbarzyńcy wzmożone przez `WAR_ALLIN_CAPITAL_ENABLED`, ROBOCZA 23893f19): NIE_ZMIERZONO w tej rundzie; test pokazuje mechanizm kolejki, nie częstość bitew.

RUNDY: 5/5 (ostatnia). Po FC: FAIL na pkt 2 i 4 -> naprawione w tej rundzie: pkt 2 (test wykonawczy na prawdziwym kodzie), pkt 4 (mutacje M1-M4 czerwienią testy). Limit rund osiągnięty; kolejny werdykt wymaga decyzji właściciela.
NASTĘPNY KROK: Evaluator r5 (niezależny przegląd testu wykonawczego i mutacji) -> Final Control. Integracja i READY_FOR_DEPLOY dopiero po Final Control przez orkiestrator.
DEPLOY/PUSH: NIE WYKONANO
