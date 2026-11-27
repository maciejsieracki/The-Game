STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-PLAYER-LASTCITY-REVOLT-Q1
GOAL: pomiar, czy gracz moze stracic ostatnie miasto przez bunt i jak czesto; mechanizm utraty miasta (V4/4242); Porzadek miast gracza; skutek w UI; readback ustawien maksimum.
ZMIERZONO (runda 3, Operator SONNET po 2 nieudanych rundach Haiku, baza 909a057fa):
- Mechanizm: utrata miasta gracza w 9/9 biegach pasywnych (kultura latwy/normalny/trudny x ziarna 4242/7/778899, maksimum) = barbarzyncy (0 -> -1), sciezka applyCityCaptureToMap <- applyMapBattleOutcome <- doMapAutoResolveIncoming <- onAuto <- showPreBattle (bitwa barbarzyncow, „Auto”), gracz bez obroncy. Tury: 4242 t16, 7 t29, 778899 t12 (niezaleznie od kultury). Zmian na -99 (bunt): 0 we wszystkich 16 biegach (9 + 3 autopilot + 3 diagnostyczne + 1 niezminifikowany). V4/4242 = t16 (nie t29).
- Porzadek miast gracza (min/sr): zob. tabela w dokumencie (latwy 59,8-75; normalny 44,9-59,5; trudny 37,4-43,9). Skrajny bunt (<12%): nigdy. Miasta pop 1-3 maja immunitet osiedla (prog pop<=4).
- Diagnostyka POZA maksimum (barbarzyncy 'brak', kultura trudny, 3 ziarna do t60): 1 miasto pop 3, Porzadek min 26,1-26,8, bunt 0.
- Autopilot gracza (kultura trudny): t18 utrata (4242), t15 utrata (778899), przezycie do t25 (7).
- UI po utracie: ekran „TWOJE IMPERIUM UPADLO / KLESKA”, przyciski „WCZYTAJ GRE” i „ROZPOCZNIJ OD NOWA”, brak „Wroc na mape”/kontynuacji, „Zakoncz ture” zablokowane (gameOver). Zrzuty: dane-r3/*-defeat.png.
- Rozbieznosc z REALDEF4: runner r1/r2 mial zaszyte barbariansLevel 'normalny' i kosztJednostekPace 'normalny' (domyslny --pace). Poprawione: --barb (domyslnie trudny), --pace wysoki; readback KAZDEGO biegu w dane-r3/*.run.log (linia [readback-plr], live.barbariansLevel z gry).
ZMIANY/COMMIT: allowlista r3: gra/src/main.ts (JEDEN hak civTest __cityOwnerChangeLogDebug + noteCityOwnerChangeForTest; 5 miejsc dopisania po zmianie city.ownerId; wylacznie odczyt i push do tablicy, no-op poza ?civTest=1), gra/tools/plrrevolt-run.cjs (--barb, --suppress 0, collectPlr, captureGameOverUi), gra/tools/plrrevolt-r3-table.cjs (nowy), dyspozycje/analizy/GRACZ-BUNT-OSTATNIE-MIASTO-2026-11-27.md, dyspozycje/autobot/runs/R-WEB-PLAYER-LASTCITY-REVOLT-Q1/dane-r3/** (jsonl.gz, run.log, zrzuty, events.log), ten raport. SHA: w polu sha wyniku.
TESTY (surowe wyjscie, kod r3): tsc --noEmit 0; logic-test "LOGIC OK (213/213)"; tech-tree-test 20 pass 0 fail; research-test 33/0; unit-replace-test 21/21; combat-test 6/6; society-breakdown-test 56 OK 0 FAIL; ai-city-rebellion-gate-test PASS=37 FAIL=0; ai-city-order-need-wiring-test 267 passed 0 failed; ai-test 297 passed 0 failed. Determinism: 2 biegi tego samego ziarna (bundle zminifikowany vs niezminifikowany) = identyczny skrot owners/terytorium/wars w 15/15 tur. Mutacja czerwona: nie dotyczy (instrumentacja).
BLOKADY: brak. NIE ZMIERZONO: porownanie bit w bit z bundlem BEZ haka (kandydat 909a057fa); bunt gracza przy populacji >= 5 (gracz nie urosl w 60 turach); wznowienie biegu ze slotu sypie Chromium (2 proby, diag-brak-trudny-s4242 powtorzony od zera w jednym segmencie).
RUNDY: 3/5.
UWAGI-DLA-ORKIESTRATORA: (1) ekran porazki nie podaje przyczyny (barbarzyncy vs bunt) — propozycja, nie decyzja; (2) decyzja ABC o ochronie ostatniego miasta gracza przed buntem dopiero jesli bunt okaze sie osiagalny przy pop >= 5 (dzis niezmierzone); (3) /tmp/plrrevolt-* (dist, profile) usuniete po pracy.
NASTEPNY KROK: Evaluator -> Obrona -> Final Control (ten sam ID).
DEPLOY/PUSH: NIE WYKONANO
