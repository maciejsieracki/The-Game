STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UNIT-PROCARZ-PIERCING-ARMOR-REDUCTION-Q1
GOAL: Strzał Procarza (Slinger, także Huaracoc) liczony wzorem wręcz z przebiciem 2 ((max(0, atak dyst − pancerz)+2) ×3 × kontra, min 1); inne dystansowe bez zmian; karty pokazują przebicie i opis; Zastąp/zdrowie/atak/zasięg bez zmian.
ZMIANY/COMMIT: kandydat do integracji 002c4bcd6ce946762d9edd225a74ced3e579ea3a (potomek bazy 32c13e63f — `git merge-base --is-ancestor` OK). Zmienione: units.json (piercing 2 + fieldPower 14 dla Procarz/Huaracoc), combat.ts (rangedShotBase/isPiercingShotShooter, użyte w rangedShotDamage = auto-walka), battleScene.ts:9554 (bitwa ręczna, ta sama funkcja), hexContextTooltip.ts i unitInfoCard.ts (opis), testy gra/tools. Poza literalną allowlistą: fieldPower 12→14 (cache units.json, zarzut 4).
TESTY (surowe wyjście na kodzie 002c4bcd6): tsc --noEmit rc=0; logic-test 213/213; tech-tree-test 20/0; research-test 33/0; unit-replace-test 21/21; combat-test 6/6; procarz-piercing-shot-test ALL PASS (18/9/6/6 dla pancerza 0/3/6/8 zgodnie z dispatchem); ranged-damage-mult-test PASS; unit-card-ranged-mult-test rc=0 (karta: "przebicie 2: strzał liczy się jak cios wręcz"); ranged-health-card-align 5/0; archers-health-dist 10/0; unit-power-test 6/0 (cache == runtime); unit-power-sort 13/0; hit-mode-consistency 8/0; hit-mode-test 18/0. Brak czerwonych, porównanie baza vs kandydat zbędne.
Miejsca liczące obrażenie strzału: combat.ts rangedShotDamage (auto-walka, wywołania 1068/1086) i battleScene.ts 9554 (bitwa ręczna) — oba przez rangedShotBase; siege.ts i city-towers nie liczą strzału jednostek. Brak pominiętych ścieżek.
ZARZUTY:
1 (opis na karcie): ODDAL — naprawione w obronie, test karty zielony.
2 (Chromium, ścieżka sceny): ODDAL z uwagą — guard źródłowy dodany i zielony; Chromium NIE ZMIERZONO (dispatch dopuszcza).
3 (pomiar 10v10): ODDAL — informacyjny, NIE ZMIERZONO. Per strzał vs pancerz 8/6: 3 → 6.
4 (cache fieldPower): ODDAL — regeneracja 12→14 poprawna (unit-power-test wymaga cache==runtime; ai-army-composition czyta cache); wyjątek w teście usunięty. Zatwierdzam rozszerzenie allowlisty o fieldPower.
Żaden zarzut nie wymaga NAPRAW.
BLOKADY: brak blokujących. NIE ZMIERZONO: Chromium (bitwa Procarz vs pancerz 6, karta), pomiar 10v10.
UWAGI-DLA-ORKIESTRATORA:
- DO DECYZJI CZŁOWIEKA (nieblokujące): piercing to jedno pole, więc Procarz we wręcz też ma teraz przebicie 2 (cios 0 → 2 przy weaponDamage 0; w battleScene min 1 → 2). Wzór wręcz niezmieniony, ale efekt na Procarza w melee jest realny; jeśli niepożądany, potrzebne osobne pole.
- Dług: komentarz unit-power.ts ~187-190 ("cache bez mnożnika") sprzeczny z danymi. Dług Rust: REPIN units.json + rangedShotBase.
RUNDY: 1/5 (FC)
NASTĘPNY KROK: integracja orkiestratora 002c4bcd6 (merge/FF, bramki), deploy ROBOCZA wg procesu.
DEPLOY/PUSH: NIE WYKONANO
