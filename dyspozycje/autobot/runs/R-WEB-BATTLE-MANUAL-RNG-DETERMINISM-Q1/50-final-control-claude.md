STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-MANUAL-RNG-DETERMINISM-Q1
GOAL: walka reczna i sceniczna uzywaja deterministycznego strumienia z ziarna gry (ta sama fabryka gameStreamRng co walki AUTO)
ZMIANY/COMMIT: kandydat 67223cf5d117b2a3913781086b221d202829b245 (potomek bazy fab9a9b75, merge-base --is-ancestor OK). Kod: gra/src/battle/battleScene.ts, gra/src/battle/manualBattle.ts, gra/src/main.ts (podpiecie), gra/tools/manual-battle-rng-determinism-test.cjs + runs/**. Allowlista zachowana (sciezka battleScene.ts to gra/src/battle/, nie ui/). origin/main (db7084ea9) rozni sie od bazy tylko administratorPanel.ts, dokumentacja i testy; main.ts nietkniety, merge powinien byc czysty.
TESTY (surowe wyjscie, worktree z npm ci): tsc --noEmit exit 0 (0 bledow); logic 213/213; tech-tree 20 pass 0 fail; research 33/0; unit-replace 21/21; combat 6/6; nowy test OK exit 0; git diff --check fab9a9b75..kandydat czysty. Dowod mutacyjny: baza (wg obrony: FAILED) oraz moja mutacja (_combatRng()*100 -> Math.random()*100 na kopii) => FAIL "rzut trafienia _singleBlow bez Math.random", FAILED 1.
WERDYKT PER ZARZUT:
1 (mapFieldBattle bez rng) ODDAL - naprawione w obronie: wrapper createBattleScene (main.ts:38062) dodaje combatRng; wszystkie miejsca tworzenia BattleScene w main.ts (35026, 35758, 38062, 38493, 38655 przez bOpts) maja strumien.
2 (test tylko statyczny) ODDAL z notatka - BattleScene tworzy WebGLRenderer, test behawioralny bez GPU niewykonalny w node; zmiana to okablowanie, resolveCombat z rng pokryty combat-test; mutacja czerwieni test. Test behawioralny: NIE_ZMIERZONO.
3 (zaleznosc od klatek) ODDAL - analiza kodu: timery bitwy dzialaja w wirtualnym czasie, _drainTimers odpala je w kolejnosci due/id niezaleznie od granulacji klatek, wiec kolejnosc rzutow nie zalezy od FPS. Weryfikacja live NIE_ZMIERZONO.
4 (ManualBattle bez instancji) ODDAL - zgodne z dispatchem, bez efektu.
5 (oblezenie/main.ts:46) ODDAL - poza allowlista, do osobnego tematu.
6 (migracja zapisu) ODDAL - odczyt defensywny (-1/0), asercja statyczna w tescie.
7 (baza fab9a9b75 vs main) ODDAL - brak konfliktu plikowego.
Zaden NAPRAW => PASS-WITH-NOTES.
BLOKADY: brak
RUNDY: FC 1/5
NASTEPNY KROK: integracja orkiestratora kandydata 67223cf5d (+ ten raport), sprawdzic ancestry i diff --stat, deploy ROBOCZA wg procesu.
UWAGI-DLA-ORKIESTRATORA: (a) gra/src/oblezenie/main.ts:46 nadal Math.random - ewent. osobny temat; (b) live-weryfikacja dwoch identycznych walk NIE_ZMIERZONO - kandydat do LIVE-VERIFY; (c) zmiana zmienia wyniki walk (zaakceptowane ABC nr 11 = A).
DEPLOY/PUSH: NIE WYKONANO
