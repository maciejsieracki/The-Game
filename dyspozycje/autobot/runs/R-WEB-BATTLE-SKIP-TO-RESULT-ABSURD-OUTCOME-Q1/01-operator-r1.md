STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-SKIP-TO-RESULT-ABSURD-OUTCOME-Q1
GOAL: „Pomiń do wyniku" (»») daje TEN SAM wynik co walka AUTO (ta sama symulacja), z poprawną turą/czasem i sformatowanymi stratami.
ZMIANY/COMMIT: BAZA web-wip/BATSKIP 9320f3e47 (r1+r2). Runda 3 (DODATEK 2): gra/src/battle/battleScene.ts, gra/tools/battle-skip-equals-auto-resolve-test.cjs, gra/tools/wall-defenders-bonus-range-test.cjs, ten raport. SHA kodu: patrz commity gałęzi worktree-wf_32a70936-1a9-1 (d674915aa = punkt 1; kolejny commit = punkty 2-3 + raport).

DIAGNOZA PUNKT 1 (rozbieżność AUTO vs SKIP, seed 7 bitwa-duza; odtworzona: AUTO tura 9 wygrywa atakujący, SKIP tura 11 wygrywa obrońca)
Dwie przyczyny, obie w skip()/_runFastForward:
 a) Krok FF = 120 ms vs klatka AUTO 16 ms. Kroki animacji (_raf) liczą się per krok, a timery/animacje w czasie wirtualnym -> inna kwantyzacja kolejności zdarzeń -> rozjazd sekwencji Math.random. Naprawa: FF_STEP_MS = 16 (identyczny rytm jak klatka AUTO 1x; kolejność w kroku: timery, pociski/zaniki, kroki rAF z poprzedniego kroku — zgodna z _startLoop).
 b) skip() włączał _ffActive PO _kickoffBattleTurn/_toggleManualMode, więc kroki ruchu pierwszej tury szły przez prawdziwe requestAnimationFrame, nie przez kolejkę FF: tura 1 stała w miejscu ~64 s czasu wirtualnego (cały budżet 40 ms klatki FF), a wynik zegara bitwy był zawyżony (skip 89 696 ms vs AUTO 25 952 ms). Naprawa: _ffActive/_ffQueue ustawiane PRZED startem tury.
WYNIK (Chromium, deterministyczny zegar 16 ms, seedowany Math.random, scena bitwa-duza): seedy 1,2,3,7 — zwycięzca, straty, HP, tura IDENTYCZNE; czas wirtualny: seed 1 36576=36576, seed 3 43840=43840, seed 2 36608 vs 36576, seed 7 25952 vs 25936 (różnica 1-2 klatki, test: <= 200 ms). Test nie osłabiony (B4 porównuje zwycięzcę, straty, HP, turę; dodany B5 czas).

PUNKT 2 (wall-defenders-bonus-range-test): mutacja „skip" przepięta na `pct: this._wallBonusProcFor(u) }));` -> `pct: 0 }));` w snapshocie skip(). Wynik: 58 ok, 0 fail; B-MUT skip czerwony na B13/B14 (nietautologiczny).

PUNKT 3 (skip z trybu ręcznego w trakcie animacji): POTWIERDZONY błąd — rozkaz gracza w toku (busy, acted=false) + natychmiastowe _toggleManualMode -> _beginAutoBatchTurnFromCurrentState planuje tę jednostkę drugi raz (duplikat aktywacji). Naprawa: skip() przy `_manualMode && busy` ustawia _ffPendingAuto; pętla FF dokańcza rozkaz (całą kolejkę gracza), a gdy busy=false wykonuje _ffEnterAuto() (toggle + kickoff). Test D0-D3 (w pliku skip-equals-auto): fix = 0 powtórnych startów jednostki w otwartej turze, kontrola starego zachowania = 1 (test wykrywa regresję).
Oblężenie (oblezenie-duze): AUTO nie kończy się w 150 s (tura 40), SKIP dochodzi do sufitu 400 tur (PAT po morale, ~156 klatek) -> porównanie AUTO vs SKIP NIE_ZMIERZONO (AUTO nie rozstrzyga się silnikiem).

PUNKT 4 (FF_MAX_ROUNDS=400): uczciwe duże bitwy 9-15 tur (seedy 1,2,3,7 bitwa-duza; 28 vs 28 jednostek) -> margines ~27x. Bitwa bez rozstrzygnięcia (oblężenie bez postępu) dobija do 400 tur w ~156 klatkach FF (kilka sekund) i kończy się PAT po morale. Wartość uzasadniona, bez zmian.

PUNKT 5 (weterani-test): 78 PASS / 1 FAIL („stackFieldPowerM Konnica gwiazdki=3 == 49 — 98"). Diff tematu względem 18b609dc3 dotyka wyłącznie src/battle/battleScene.ts i endScreen1E.ts; test dotyczy src/game/{veteran,combat,unit-power}.ts (niezmienione) -> dług sprzedtematu, NIE regresja. battle-loot-test 4 FAIL — dług sprzed tematu (zarejestrowany osobno).

TESTY
- npx tsc --noEmit -p gra: czysto.
- battle-skip-equals-auto-resolve-test (WSKIP_SEEDS=1,2,3,7 -> 34 ok / 0 fail; z seedem 7 + część D: 20 ok / 0 fail).
- wall-defenders-bonus-range-test: 58 ok / 0 fail.
- battle-dead-units-removed-test PASS, battle-dead-unit-disappearance-test PASS, battle-hp-display-test 7/7.
- NIE_ZMIERZONO: AUTO vs SKIP w oblężeniu; pełne testy battle-loot (dług).
LEDGER/REPIN Rust: dług „REPIN skip = przewinięcie tej samej symulacji (krok 16 ms, FF przed startem tury, odroczone AUTO przy busy)" — wpis do rejestru po stronie orkiestratora (brak pliku LEDGER w repo).
BLOKADY: brak.
RUNDY: 3/5
NASTĘPNY KROK: Evaluator r3 -> Obrona -> Final Control
DEPLOY/PUSH: NIE WYKONANO
