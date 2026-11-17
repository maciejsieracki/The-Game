STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UNIT-PROCARZ-PIERCING-ARMOR-REDUCTION-Q1 (runda 1/5, Operator HAIKU 5.5)
GOAL: (1) dane: Procarz i Procarz (Huaracoc) piercing 2 (karta „Przebicie” = 2 już była); (2) silnik: strzał procarza (Typ Slinger) = wzór wręcz max(0, atak dyst. − pancerz) + przebicie 2, x3 (mnożnik klasy), min 1; pozostałe dystansowe bez zmian (Łucznik ×2 bez przebicia w strzale, Oszczepnik ×1); (3) karty/tooltipy: przebicie 2 z danych; (4) łańcuch „Zastąp”, zdrowie, atak, zasięg, mnożniki klas BEZ zmian.
BAZA: origin/main 32c13e63f863553392b1bcaf60e14731bb2a0002 (detach w worktree wf_d197f914-b4e-1).

ZMIANY/COMMIT:
- gra/data/units.json: linia 124 (Procarz `piercing` 0→2), linia 1583 (Procarz (Huaracoc) `piercing` 0→2). Nic więcej w pliku.
- gra/src/game/combat.ts: nowe `isPiercingShotShooter(shooter)` (Typ === 'Slinger'), `rangedShotBase(shooter, missileAttack, armor)` (Slinger: damageTw(m, a, piercing, 0, false) = max(0, m−a)+piercing; reszta: rangeDamageTw = max(1, m−a) jak dotąd); `rangedShotDamage` używa `rangedShotBase` (Pick rozszerzony o `piercing`). Zmieniona funkcja `rangedShotDamage` jest używana przez auto-walkę (strzały obu stron w fazie dystansowej).
- gra/src/battle/battleScene.ts: gałąź `ranged` (~9553) używa `rangedShotBase(cuA, atkMissile, defArmor)` zamiast `rangeDamage(...)`; import `rangeDamage` zamieniony na `rangedShotBase`. Mnożnik klasy i kontra bez zmian (max(1, round(raw*kontra)) jak dotąd).
- gra/tools/procarz-piercing-shot-test.cjs (NOWY): test liczb z dispatchu na realnych funkcjach combat.ts + mutacje.
- gra/tools/ranged-damage-mult-test.cjs: 4 asercje zaktualizowane do nowego wzoru (Procarz vs Falanga, floor 1 → 6, kontra×1.5 → 27, armyFieldPower Procarz 12 → 14, bo fieldPower zawiera `piercing`).
- gra/tools/unit-card-ranged-mult-test.cjs: asercja cache fieldPower dla Slinger z przebiciem = cache + piercing (patrz BLOKADY); oczekiwana moc pola Procarza w tooltipie 12 → 14.
- Plik raportu (ten).

Nie zmieniono: gra-robocza, WERSJE.md, zdrowie/atak/zasięg/mnożniki klas, przebicie we wręcz (damageTw dla wręcz bez zmian), siege.ts, wikiBundle, Civpedia, unit-power.ts (kod bez zmian: fieldPower już sumuje `piercing`, armyFieldPower liczy na żywo dla mnożnika ≠1, więc Procarz automatycznie dostaje +2).

TABELA MIEJSC LICZĄCYCH OBRAŻENIE STRZAŁU:
| Miejsce | Rola | Zmieniono? |
|---|---|---|
| gra/src/game/combat.ts rangedShotDamage (auto-walka, obie strony fazy dystansowej) | obrażenie pocisku | TAK (przez rangedShotBase) |
| gra/src/game/combat.ts rangedShotBase (nowe) | baza strzału wg klasy | TAK (nowe) |
| gra/src/game/combat.ts rangeDamageTw / rangeDamage | baza strzału zwykłych dystansowych | NIE |
| gra/src/battle/battleScene.ts ~9553 (gałąź ranged, bitwa animowana) | obrażenie pocisku | TAK |
| gra/src/game/unit-power.ts fieldPower / armyFieldPower | szacunek mocy AI/sortowanie | NIE (kod); skutek: Procarz +2 przez `num(u.piercing)` |
| gra/src/game/unit-card-stats.ts (piercingEffective, rangedDamageMult) | dane kart | NIE (automatycznie 2) |
| gra/src/ui/unitInfoCard.ts, entityCards/unitAdapter.ts, unitEngineStats.ts, cityPanel.ts | wyświetlanie Przebicie z danych | NIE (automatycznie 2) |
| gra/src/ui/hexContextTooltip.ts ~906 | sufiks „×3 obrażeń pocisku” | NIE (brak dopisku o przebiciu, patrz BLOKADY) |
| gra/src/game/siege.ts damageTw/baseDamage (oblężenie) | obrażenia oblężnicze, nie strzał | NIE |
| gra/src/game/ai.ts:3570 | odczyt piercing do symulacji | NIE (czyta dane) |

TESTY (surowe wyniki, uruchomione w gra/):
- node_modules/.bin/tsc --noEmit: exit 0, brak wyjścia.
- logic-test: LOGIC OK (213/213), rc=0
- tech-tree-test: 20 pass, 0 fail, rc=0
- research-test: PASSED 33 / FAILED 0 / TOTAL 33, rc=0
- unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21), rc=0
- combat-test: COMBAT TEST 6/6 pass, rc=0
- ranged-damage-mult-test: WSZYSTKIE PASS, rc=0 (po aktualizacji 4 asercji, patrz ZMIANY)
- unit-card-ranged-mult-test: rc=0 (po aktualizacji, patrz ZMIANY)
- ranged-health-card-align-test: 5 pass, 0 fail; ALL GREEN, rc=0
- archers-health-dist-data-test: 10 pass, 0 fail; ALL GREEN, rc=0
- unit-power-test: 6 pass, 0 fail, rc=0
- hit-mode-consistency-test: 8 PASS, 0 FAIL, rc=0
- procarz-piercing-shot-test (NOWY): ALL PASS, rc=0. Liczby: Procarz pancerz 0 → 18, 3 → 9, 6 → 6, 8 → 6; Huaracoc pancerz 6 → 6; Łucznik pancerz 0 → 8, 6 → 2 (bez zmian); Oszczepnik pancerz 6 → 1 (bez zmian). MUTACJA procarz piercing 0 vs pancerz 6 → 1 (test wykrywa brak przebicia); MUTACJA Łucznik z piercing 1 vs pancerz 6 → 2 (przebicie nie wchodzi do strzału).
- git diff --check: czysto.

Mutacja na poziomie sceny (battleScene) NIE wykonana: test pokrywa funkcję współdzieloną (rangedShotBase) użytą przez battleScene i auto-walkę.

BLOKADY / UWAGI:
1. Chromium (bitwa Procarz vs pancerz 6, karta z przebiciem 2): NIE ZMIERZONO, przeglądarki nie uruchamiano w tej rundzie.
2. Cache `fieldPower` w gra/data/units.json dla Procarza i Huaracoc (12) jest sprzed przebicia; runtime = 14. Kod używa runtime dla mnożnika ≠1, więc gra nie jest błędna, ale cache jest nieaktualny. Poprawka cache (12 → 14) to zmiana poza allowlistą (units.json tylko piercing), więc NIE wykonano; decyzja orkiestratora. Test unit-card-ranged-mult-test ma wyjątek dla Slinger z przebiciem.
3. Karta/Civpedia/wikiBundle: brak nowego krótkiego opisu „strzał z przebiciem liczy się jak cios wręcz” na karcie Procarza i brak regeneracji wikiBundle: NIE WYKONANO w tej rundzie.
4. Pomiar informacyjny (d) 10 Procarzy vs 10 Falang (pancerz 8) i vs 10 Triari (pancerz 6): NIE ZMIERZONO (wymaga symulacji; poza tą rundą).
5. Dług Rust: REPIN units.json (piercing Procarza) i wzoru strzału, do zlecenia po integracji.

ZAŁOŻENIA:
- „Typ Slinger” identyfikuje procarza (Procarz i Procarz (Huaracoc)); Oszczepnik i Łucznik mają Typ Distance.
- Minimum 1 po kontrze i mnożniku (jak dotąd); max(0, …) wewnątrz wzoru dla procarza, zgodnie z oczekiwanymi liczbami (6 przy pancerzu 8).

RUNDY: 1/5 (Operator, bez wcześniejszych FAIL)
NASTĘPNY KROK: Evaluator (SONNET) → Final Control. Orkiestrator decyduje o cache fieldPower (units.json) i o dopisku na karcie/wikiBundle.
UWAGI-DLA-ORKIESTRATORA: (a) cache fieldPower Procarza 12 → 14 do decyzji; (b) pozycje 3–5 z BLOKAD jako otwarte; (c) brak zmian w gra-robocza i WERSJE.md.
DEPLOY/PUSH: NIE WYKONANO
