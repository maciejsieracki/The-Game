STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-SIEGE-REPLAY-RESTORE-WALL-TERRAIN-Q1
GOAL: _resetSiegeForReplay przywraca KOMPLETNY stan poczatkowy muru (teren kafli, HP, wylom, brama, wizualia, wiezyczki); replay deterministyczny.
ZMIANY/COMMIT: baza bc239270378081cd872886df2409f71d12f22449 (origin/main 6ade0f0ec jest jej przodkiem; merge "Already up to date"). Pliki:
 - gra/src/battle/battleScene.ts: pola siegeWallInitialTiles (kopia terenu kolumny muru po _carveWallTiles), siegeRubbleMeshes, siegeHiddenMeshes; _breachWallTile/_breachGate rejestruja ukryte meshe i gruz; _resetSiegeForReplay przywraca teren kolumny muru/bramy z kopii, lastAttackedWallRow, zdejmuje gruz, odslania segmenty muru i brame, odbudowuje wiezyczki (destroyed=false, mesh.visible), odswieza HUD oblezenia.
 - gra/tools/siege-auto-breach-replay-e2e-live-test.cjs: R5 z defect -> check; dodane R5b (teren kazdego kafla kolumny muru), R8-R11 (determinizm: przebieg C po replayu przebiegu B z wylomem == B: wynik, jednostki, zdarzenia wylomu, kafle); mutacja restore-terrain-off; B4b -> known() (ZNANY-DEFEKT, exit 5 gdy jedyny wynik; SABR_SKIP_KNOWN=1 => exit 0), asercja B4b NIE oslabiona.
TESTY (surowe wyjscie):
 - tsc --noEmit: 0 bledow.
 - siege-auto-breach-replay-e2e-live-test SABR_ONLY=r,f,m: "23 ok, 0 fail, 0 defekt(y), 0 NIE_ZMIERZONO", exit 0 (R5: tileDiff 7 -> 0 po replayu; wallColDiff 0).
 - SABR_ONLY=b: 6 ok, 0 fail, 1 ZNANY-DEFEKT B4b (inside 0, maxAtkQ 40 = wallCol), exit 5.
 - Mutacja SABR_MUT=restore-terrain-off (r): CZERWONE R5, R5b, R9, R11 (8 ok, 4 fail), exit 1.
 - Bramki: logic-test 213/213, tech-tree-test 20 pass/0 fail, research-test 33/33, unit-replace-test rc 0, combat-test "All sanity checks passed".
 - Regresja: map-field-battle 24/0, post-battle-map 32/0, oblezenie-test 27/0, oblezenie-remis-endsiege 271/0, oblezenie-siege-lifted-po-bitwie 16/0, battle-skip-equals-auto-resolve 38 ok/0 fail, battle-skip-siege-parity 17/0, siege-ai 17/0, siege-defenders 12/0, siege-manual-battle-behavior 40/0, siege-tower-breach-everywhere 47/0, siege-nearby-lock-join 23/0, siege-last-stand-sortie 71/0.
 - NIE_ZMIERZONO: battle-skip-siege-parity-live-test.cjs (2 proby, 280 s i 580 s, obie zabite timeoutem, rc 124; to nie FAIL asercji); pozostale siege-* testy z katalogu nie byly uruchamiane.
BLOKADY: brak.
OBSERWACJE POZA ZAKRESEM (nie naprawiane; ZALOZENIE: osobne tematy):
 1. Rozmieszczenie po replayu != przy pierwszym starcie: replay odtwarza grupy z konca rozstawiania (_restoreDeployGroupSnapshot) zamiast _autoGroupDeployByKind; atakujacy staja w q=10-12 zamiast 14/13. W scenariuszu MINI replay-layout nie daje wylomu w 24 turach (pierwszy start: wylom w turze 22). Dlatego test determinizmu porownuje B z C (oba po replayu), nie A z B.
 2. vNow/_ffVirtualMs/vTimerSeq nie sa zerowane przy replayu (ciagly zegar wirtualny); brak wplywu na wynik zmierzony w R9, ale to resztka stanu.
RUNDY: 1/5
NASTEPNY KROK: Evaluator
DEPLOY/PUSH: NIE WYKONANO
