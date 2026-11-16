# R-WEB-DATA-ARCHERS-HEALTH-20-DIST-EGYPT-6-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (dane jednostek)
TEMAT: R-WEB-DATA-ARCHERS-HEALTH-20-DIST-EGYPT-6-Q1
GOAL: zdrowie wszystkich pieszych jednostek łuczniczych = 20 (pola `Health` i `health`); atak dystansowy: Łucznik 5 (bez zmian), Łucznik egipski 5 -> 6, Łucznik nubijski 7 (bez zmian); pozostałe liczby bez zmian.
BAZA: b160459c9dea67e082ec59dc7770d10cc59c08d4 (origin/main), praca w trybie detached w worktree.

ZMIANY-COMMIT:
- `gra/data/units.json` — 6 wpisów pieszych łuczników (Łucznik, egipski, nubijski, sumeryjski, akadyjski, asyryjski): `Health` i `health` = 20; `Atak dystansowy` egipskiego 5 -> 6; pole `fieldPower` (cache mocy) tych 6 wpisów przeliczone na wartości runtime (patrz tabela).
- `gra/tools/archers-health-dist-data-test.cjs` (nowy) — bramka danych: 6 pieszych łuczników, Health/health = 20, dystanse wg decyzji, jednostki spoza zakresu bez zmian (Konnica łucznicza 60, Oszczepnik 20, Procarz 20), realny `combatUnitFromDef(...).health` = 20 przez bundle esbuild, mutacje na kopii (egipski Health 40; dystans 5) dają FAIL.
- `gra/tools/ranged-damage-mult-test.cjs` — asercje mocy armii: Łucznik 19 -> 21, Łucznik egipski 18 -> 20 (świadoma aktualizacja, skutek zmiany zdrowia).
- `gra/tools/unit-card-ranged-mult-test.cjs` — asercja tooltipa „Moc pola” dla Łucznika asyryjskiego 19 -> 21.
- `dyspozycje/autobot/runs/R-WEB-DATA-ARCHERS-HEALTH-20-DIST-EGYPT-6-Q1/10-operator-claude.md` — ten raport.
- Nie zmieniano: `gra/src/**`, WERSJE.md, manifest, gra-robocza/, rust-port/, nic poza allowlistą. `git diff --stat`: units.json 18+/18-, dwa testy 5+/2- i 3+/1-, nowy test.

ZMIERZONE — tabela przed/po (dane z units.json; `health` = pole czytane przez combat.ts:203; `Health` = pole legacy):

| Jednostka | Health przed -> po | health (walka) przed -> po | Atak dystansowy przed -> po | missileAttack (silnik) | fieldPower cache przed -> po |
|---|---|---|---|---|---|
| Łucznik | 20 -> 20 | 16 -> 20 | 5 -> 5 | 3 (bez zmian) | 19 -> 21 |
| Łucznik egipski | 40 -> 20 | 16 -> 20 | 5 -> 6 | 6 (bez zmian) | 18 -> 20 |
| Łucznik nubijski | 50 -> 20 | 18 -> 20 | 7 -> 7 | 6 (bez zmian) | 19 -> 20 |
| Łucznik sumeryjski | 40 -> 20 | 16 -> 20 | 4 -> 4 | 4 (bez zmian) | 14 -> 16 |
| Łucznik akadyjski | 50 -> 20 | 18 -> 20 | 6 -> 6 | 5 (bez zmian) | 18 -> 19 |
| Łucznik asyryjski | 16 -> 20 | 16 -> 20 | 6 -> 6 | 4 (bez zmian) | 19 -> 21 |

Pola nietknięte: koszt, pociski, zasięg, morale, próg dezercji, pancerz, `missileAttack`, `Opis`, `Uwagi` (w tym „BALANCE: Koszt↑14, Pociski↓12” egipskiego).

Kod czytający pola zdrowia (ZMIERZONE grep):
- `gra/src/game/combat.ts:203` — `combatNormField(def['health'] ?? def['Health'], 30)`: walka i maxHp używają małego `health`; `Health` tylko jako fallback. Wniosek: efektywne zdrowie łuczników w grze przed zmianą to było 16/18 (nie 40/50).
- `gra/src/game/unit-card-stats.ts` (`hpMax: Number(unit.health)` w testach, `unitCardCombatDisplay`) — karta czyta `health`.
- `gra/src/game/unit-power.ts:126,173` — `num(u.health)`: moc armii używa `health`; stąd zmiana `fieldPower`.
- `gra/src/battle/battleScene.ts:4279` — `Health ?? health` (wiersz strzelca w scenie bitwy; przy obu polach równych 20 wynik identyczny).
- `gra/src/game/combat.ts:224` — `missileAttack` (silnik); `Atak dystansowy` nie jest czytany przez silnik, tylko jako fallback (`city-towers.ts:77`, `battleScene.ts:1406`).

TESTY (surowe wyniki, uruchomione w worktree po `npm ci` w gra/):
- `npx tsc --noEmit` — exit 0 (przed korektą cache i testów .cjs; TS nie czyta tych liczb jako typów, zmiana nie dotyka .ts).
- `node tools/archers-health-dist-data-test.cjs` — WYNIK: 9 pass, 0 fail — ALL GREEN (nowy).
- `node tools/logic-test.cjs` — LOGIC OK (213/213), exit 0.
- `node tools/tech-tree-test.cjs` — tech-tree-test: 20 pass, 0 fail, exit 0.
- `node tools/research-test.cjs` — ALL GREEN, exit 0.
- `node tools/unit-replace-test.cjs` — WSZYSTKIE TESTY ZIELONE (21/21), exit 0.
- `node tools/combat-test.cjs` — All sanity checks passed, exit 0.
- `node tools/unit-power-test.cjs` — 6 pass, 0 fail, exit 0.
- `node tools/unit-power-sort-test.cjs` — 13 pass, 0 fail, exit 0.
- `node tools/load-game-regression-test.cjs` — 34 PASS / 0 FAIL, exit 0.
- `node tools/battle-hp-display-test.cjs` — PASS 7/7, exit 0.
- `node tools/ranged-damage-mult-test.cjs` — exit 0 (po aktualizacji 2 asercji mocy).
- `node tools/unit-card-ranged-mult-test.cjs` — exit 0 (po aktualizacji asercji tooltipa).
- Sprawdzone, bez regresji (exit 0): ai-production-priority-test, battle-attack-move-order-test, battle-cap-500-test, battle-cavalry-flank-default-test, battle-initial-placement-runtime-test, battle-line-advance-uniform-test, battle-manual-orders-routing-test, city-militia-no-defenders-test, general-eligible-unit-roster-test, map-field-battle-test, pr141-g1-combat-activation-test, unit-context-card-test, battle-deploy-cavalry-flanks-test.
- Czerwone, ale IDENTYCZNE przed i po zmianie (zweryfikowane przez tymczasowe przywrócenie bazowego units.json i ponowne uruchomienie; liczba i treść FAIL taka sama):
  - `bitwa-auto-atak-wielojednostkowy-evaluation-test` — 5 FAIL przed i po (asercje o zachowaniu łucznika za piechotą).
  - `city-defense-terrain-gate-test` — 1 FAIL przed i po (KONTROLA (b) hitChance 35% vs 36%).
  - `structure-defense-bonus-test` — 1 FAIL przed i po (hitChance 36% vs 37%).
  - `fortify-pole-test` — 2 FAIL (4 linie) przed i po (Taktyczna/Pomiń, płasko i na wzgórzu).
  Są to długi testowe sprzed tego tematu; NIE naprawiane (poza allowlistą i poza zakresem).
- Wiki: `node tools/bundle-wiki-for-game.cjs` — `wikiBundle.json: 22 rozdz. + 184 haseł`; `git status` nie pokazał zmiany `gra/src/data/wikiBundle.json`, czyli regeneracja generatorem nie zmieniła pliku (ZMIERZONE: brak zmiany bundle; nie zweryfikowano ręcznie, które liczby łuczników bundle zawiera).
- NIE ZMIERZONO: testy przeglądarkowe/live (`*-browser*`, `*-live*`), `load-game-regression-e2e*`, pełna matryca `battle-*`, `vite build`, wizualna karta jednostki w grze.

UWAGI / NIE ZMIERZONO w dokumentacji historycznej:
- Snapshoty w `gra/tools/intrinsic-unit-power*.md`, `gra/tools/TW-v3-migracja-jednostek.md`, `gra/tools/dystans-*.json|txt`, `gra-robocza/*.md`, `Civ-UNITS/*.md` zawierają stare liczby łuczników. To są dokumenty historyczne/generowane; NIE zmieniano ich (nie były rozpisane w dispatchu jako cel). Wymaga decyzji orkiestratora, czy aktualizować.
- Nie zmierzono w grze, czy kartę jednostki widać jako 20 HP we wszystkich wariantach cywilizacji (mnożniki veteran/parametry dają inny efektywny HP; test sprawdza bazę).

RUNDY: 1/5
BLOKADY: brak blokad wykonania. Patrz DECYZJA-WYMAGANA poniżej.
DECYZJA-WYMAGANA (do orkiestratora — nie wdrażano wbrew dispatchowi):
1. Atak dystansowy wg silnika. Silnik i karta jednostki czytają `missileAttack`, nie `Atak dystansowy`. Stąd: (a) Łucznik zwykły w silniku ma 3 (karta pokazuje 3), a nie 5 z decyzji właściciela; (b) egipski `missileAttack` był już 6, więc zmiana „5 -> 6” w kolumnie `Atak dystansowy` NIE zmienia zachowania ani wyświetlanej wartości w grze; (c) nubijski ma `missileAttack` 6, a `Atak dystansowy` 7. Dispatch nakazał zmieniać tylko `Atak dystansowy` i nie ruszać pozostałych liczb. Jeśli zamiarem właściciela jest realna zmiana siły ostrzału, potrzebna jest osobna decyzja: czy ustawić `missileAttack` (Łucznik 3 -> 5, nubijski 6 -> 7, egipski zostaje 6). Nie wykonano bez zgody.
2. Efekt zmiany zdrowia jest realny tylko dla pola `health` (przed: egipski 16, nubijski 18, akadyjski 18, sumeryjski 16, asyryjski 16, Łucznik 16). Zmiana `Health` samego w sobie była kosmetyczna w silniku. To zostało wykonane zgodnie z dispatchem (oba pola = 20).
NASTĘPNY KROK: Evaluator (SONNET) — weryfikacja diffu units.json przeciw allowliście i tabeli, bramki jak wyżej; orkiestrator decyduje o pkt 1 przed integracją.
DEPLOY-PUSH: NIE WYKONANO
