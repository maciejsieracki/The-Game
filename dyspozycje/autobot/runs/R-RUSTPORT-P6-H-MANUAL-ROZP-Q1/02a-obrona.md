STATUS: PASS-WITH-NOTES
DOMAIN: GAME (odczyt)
TEMAT: R-RUSTPORT-P6-H-MANUAL-ROZP-Q1 (runda 1, obrona Operatora HAIKU na zarzuty Evaluatora Z1-Z7 z 02-evaluator.md)
GOAL: Odpowiedzieć na każdy zarzut: PRZYJMUJĘ (poprawka tekstu rozpoznania + dowód) albo ODRZUCAM (dowód z pinu 07d2fbd72 lub Rust 316ded4b7). Wskazać dokładne poprawki do 01-rozpoznanie.md.
ZMIANY/COMMIT: tylko ten plik (`dyspozycje/autobot/runs/R-RUSTPORT-P6-H-MANUAL-ROZP-Q1/02a-obrona.md`). Kod, `gra/`, `rust-port/` nietknięte. Bez push na parity.
TESTY: NIE DOTYCZY (tryb odczytu: bez cargo, npm, build). Weryfikacja: `git show` i `git grep` z §5.
BLOKADY: NIE_ZMIERZONO: ciała `_isUnitDoctrineAuto` (17621) i `_effectiveMetaForUnit` (17633) nadal nie czytane; statusy #147-#149 i #179 w liście zadań sesji (orkiestrator potwierdza); zachowanie w grze. Położenie commita 3589700dd: patrz Z7.
RUNDY: 1/5
NASTĘPNY KROK: Orkiestrator: (a) zintegrować `3589700dd` (01-rozpoznanie.md) jawnie, bo nie jest przodkiem HEAD `459354a12` ani gałęzi `origin/claude/rust-sivvrn`; (b) zastosować poprawki P1-P7 z §3 do 01-rozpoznanie.md; (c) Evaluator r2 weryfikuje poprawki.
DEPLOY/PUSH: NIE WYKONANO

Baza i pin (zgodne z 01-rozpoznanie.md §0): `origin/rust-port/parity-v2` = `316ded4b7e2ed836cddc76c53c04090d449c6c4a`; pin `07d2fbd72` (`gra/src/battle/battleScene.ts`). Oba SHA istnieją w repo (`git cat-file -t`: commit).

## 1. Odpowiedzi na zarzuty

| # | Zarzut (skrót) | Werdykt | Uzasadnienie (dowód) |
|---|---|---|---|
| Z1 | Zakres H4 zaniżony: bramka `siege_tactics_loop.rs:1036-1039` ma gałąź `oblezenie`, nie tylko `tryb-reczny` | PRZYJMUJĘ | Potwierdzone (§2 Z1). Poprawka P1. |
| Z2 | Trait `ActivateOps` jest bezargumentowy i synchroniczny, brak opisu powrotu z callbackiem `done`; H3 "nie dotyka wspólnych plików" nieudowodnione | PRZYJMUJĘ | Potwierdzone: `siege_tactics_activate.rs:114-132`, `perform_player_order(&mut self) -> bool` (117). Poprawka P2. |
| Z3 | Opis `_targetInRange` (pin 8373) niepełny: brak `_meleeBlockedByWall`, `dd === 0`, filtru kierunku i `lowestHp` dla obu gałęzi | PRZYJMUJĘ | Potwierdzone: pin 8389, 8391, 8402-8409. Poprawka P3. |
| Z4 | Tabela pomija krawędzie wokół `_performPlayerOrder`, rekursję doktrynową i wejścia `_executeUnitsImmediate` | PRZYJMUJĘ | Potwierdzone grepem wywołań (§5). Poprawka P4. |
| Z5 | Zdanie "W H3 wystarczą dwie flagi wejściowe" jest hipotezą, a nie wnioskiem | PRZYJMUJĘ | Potwierdzone: 01 §1 wiersz 10 podaje to jako wniosek, §6 przyznaje brak odczytu 17621/17633. Poprawka P5. |
| Z6 | Rekomendacja A uzależnia H3 -> H4 od tematów #147-#149 (BLOCKED); raport nazywa to "dłuższym czekaniem" | PRZYJMUJĘ (doprecyzowanie) | Zależność jest realna, raport wymienia #179/#148 jako BLOCKED w §4a, ale nie dopisał, że H4 dziedziczy tę blokadę. Rekomendacja A bez zmian, zależność do wpisania. Poprawka P6. Decyzja technicznie należy do orkiestratora (zgodnie z zarzutem). |
| Z7 | Commit `3589700dd` nie jest przodkiem HEAD worktree; orkiestrator musi scalić jawnie | PRZYJMUJĘ (położenie) | Potwierdzone (§2 Z7). Zdanie o nieudanym `spawn_task` nie dotyczy treści raportu i nie było sprawdzane: NIE_ZMIERZONO. Poprawka P7. |

Zarzuty oznaczone w ocenie jako "Potwierdzone bez zastrzeżeń" (commit 3589700dd, zakres pliku, pin 18435-18475, 6020-6025, 6066-6069, 6068, atrapy ProdOps 773-791, adresy K1/K3/KLASY) nie wymagają odpowiedzi; nie kwestionuję ich.

## 2. Szczegóły dowodowe

### Z1: PRZYJMUJĘ (H4 musi też zdjąć gałąź `oblezenie`)

- Rust, `rust-port/engine/src/domain/siege_tactics_loop.rs` (316ded4b7), 1036-1039:
  `let out_of_scope = if self.scene.manual_mode { Some("tryb-reczny") } else if self.scene.wall_col >= 0 || st.siege_wall_col >= 0 { Some("oblezenie") } ...`
- Komentarz w tym samym pliku, linia 1096: "strażnik `oblezenie` wyżej wyklucza mur".
- Pin, `_performSiegeManualOrder` 18437: `if (!(this.siegeWallCol >= 0) || ru.side !== 'atk' || ord.type === 'move') return false;`. Ręczne oblężenie działa tylko przy murze. Zdjęcie samego `tryb-reczny` nie uruchamia gałęzi ręcznej, bo ścieżka `oblezenie` zwraca wcześniej.
- Recon (01 §4, wiersz H4) podawał tylko `:1036-1039 (tryb-reczny)`. Zależność od zdjęcia `oblezenie` nie była wpisana. Do ustalenia (NIE_ZMIERZONO): który temat zdejmuje gałąź `oblezenie` (#97 K5-LOOP-AUTO czy #113 K5LOOP-WIRING).

### Z2: PRZYJMUJĘ (sygnatury traitu i powrót callbacka)

- Rust, `siege_tactics_activate.rs:114-132` (trait `ActivateOps`): `fn perform_player_order(&mut self) -> bool;` (117), `fn ram_tower_step(&mut self) -> bool;` (122). Brak parametru `done` i brak typu wyniku z callbackiem.
- Produkcyjna implementacja: `siege_tactics_loop.rs:764` (`struct ProdOps`), `:768` (`impl ActivateOps for ProdOps`), `:773` (`perform_player_order` -> `false`), `:1073` (`ProdOps { melee_target }`). `ProdOps` trzyma tylko `melee_target`.
- Pin: callbacki `done` w `_doAttack(ru, adj, done)` (18455), `_doAttack(ru, adj, done)` (18462) i w `_siegeSafeApproach(ru, tc, tr, () => { refresh; done(); })` (18471-18473).
- Rust nie przenosi callbacka: wynik idzie przez wektor zdarzeń `ActivateEvent` (`Done`, `Attack { target }`, `RamTowerStep` itd.), które `siege_tactics_loop.rs` interpretuje po `activate_unit`. Sposób, w jaki H3 ma to zrobić, nie został rozstrzygnięty w 01. Dlatego to NIE_ZMIERZONO do decyzji w H3.
- Wniosek o H3 "NIE (tylko nowe pliki)" (01 §4) jest nieudowodniony. Jeśli H3 ma wejść przez `ActivateOps`, trzeba zmienić `siege_tactics_activate.rs`, którego nie ma w allowlistach H1-H4 (tam jest tylko "reuse read-only"). Dwa warianty do wpisania w H3: A) nowy moduł wywoływany wprost z pętli (bez zmiany traitu, wymaga rozpisania sposobu wejścia z `ProdOps`); B) zmiana traitu w `siege_tactics_activate.rs`, dopisana do allowlisty H3 i do listy wspólnych plików.

### Z3: PRZYJMUJĘ (pełny opis `_targetInRange`)

- Pin 8373-8409 (`_targetInRange`):
  - gałąź strzelca (`canShoot`): `dd >= 1 && dd <= ru.range`;
  - gałąź melee: `if (this._meleeBlockedByWall(ru, e)) continue;` (8389, filtr R2), potem `if (dd === 1 || dd === 0) inReach.push(e);` (8391);
  - po obu gałęziach: `desired = desiredHitForDirection(ru.attackDirection)` (8402); jeśli jest, filtr `relativeHit(e.facing, ru.q, ru.r, e.q, e.r) === desired` i `return lowestHp(matching)` (8407); w przeciwnym razie `return lowestHp(inReach)` (8409).
- Wniosek: filtr kierunku ataku (`attackDirection`, `relativeHit`) działa dla obu gałęzi, a wybór po `lowestHp` też. Recon (01 §1 wiersz 12) tego nie zawierał.
- Rust: `rust-port/engine/src/domain/siege_city_fortification.rs:66` ma już `pub fn melee_blocked_by_wall(ctx: MeleeWallContext) -> bool` (K2). Wrapper sceny `_meleeBlockedByWall` (pin 8361) jeszcze nie istnieje. H2 ma go reużyć, nie przepisywać.
- `_rangedTargetInRange` (pin 7041): wiersz 11 w 01 pozostaje poprawny (Z3 to potwierdza).

### Z4: PRZYJMUJĘ (krawędzie wywołań)

Wywołania z grepa `git show 07d2fbd72:gra/src/battle/battleScene.ts | grep -n ...` (§5):
- `_performPlayerOrder(` wywoływane z: 6068 (`_activateUnit`), 18082 (`_executeGroupDoctrineStep`), 18122 (`_executeSkirmishDoctrineStep`), 18608 (`_executeUnitsImmediate`, callback).
- `_executeGroupDoctrineStep(` wywoływane z: 6097 (`_activateUnit`), 17987 (wewnątrz `_executeGroupDoctrineStep` -> `_executeSkirmishDoctrineStep`), 18291 (wewnątrz `_performPlayerOrder`, gałąź `none` + `_isUnitDoctrineAuto`).
- `_executeUnitsImmediate(` wywoływane z: 3610, 18649, 18677, 18699 (wejścia do 18608).
- Rekursja: `_performPlayerOrder` (18280) -> 18291 `_executeGroupDoctrineStep` -> 17987 `_executeSkirmishDoctrineStep` -> 18122 `_performPlayerOrder`. Zamyka ją (dla `move`) guard 18437 `ord.type === 'move'` -> `return false`. Czy każda ścieżka dla `none` kończy się `done()`: NIE_ZMIERZONO.
- Te krawędzie brakowały w 01 §1 i trzeba je dopisać (P4).

### Z5: PRZYJMUJĘ (hipoteza oznaczona jako hipoteza)

01 §1, wiersz 10, zdanie "W H3 wystarczą dwie flagi wejściowe (`doctrine_auto`, `doctrine_manual`)" jest wnioskiem bez odczytu ciał 17621 i 17633, a §6 tę lukę przyznaje. Poprawka P5 zmienia to na hipotezę do sprawdzenia.

### Z6: PRZYJMUJĘ (zależność do wpisania, rekomendacja bez zmian)

- Lista zadań sesji pokazuje #147, #148, #149 jako `BLOCKED` i #179 jako `pending` (przy czym w tej samej liście jest też wpis `#226 [completed] K5LOOP-OUTCOME-ROZPOZNANIE (#179)`). Status #179 orkiestrator musi potwierdzić; NIE_ZMIERZONO.
- Przy rekomendacji A łańcuch H3 -> H4 zależy od odblokowania #147-#149 albo #179. Raport to dopisał w §4a jako "dłuższe czekanie", ale nie zapisał, że H4 też nie rusza przed odblokowaniem. Poprawka P6.

### Z7: PRZYJMUJĘ (położenie commita); część o `spawn_task` NIE_ZMIERZONO

- `git cat-file -t 3589700dd` -> commit.
- `git show --stat 3589700dd` -> 1 plik: `dyspozycje/autobot/runs/R-RUSTPORT-P6-H-MANUAL-ROZP-Q1/01-rozpoznanie.md` (+135).
- `git branch --contains 3589700dd` -> tylko `worktree-wf_d8a3e31a-461-1`.
- `git merge-base --is-ancestor 3589700dd HEAD` (HEAD `459354a12`) -> nie jest przodkiem.
- `git ls-tree -r --name-only origin/claude/rust-sivvrn -- dyspozycje/autobot/runs/R-RUSTPORT-P6-H-MANUAL-ROZP-Q1/` -> tylko `00-dispatch.md`. Plik 01 nie jest na zdalnej gałęzi.
- Wniosek: orkiestrator musi scalić `3589700dd` jawnie (cherry-pick albo merge). Nie jest to wada rozpoznania, ale plik nie trafia do żadnej gałęzi, z której ktoś mógłby go wziąć automatycznie.
- Zdanie o nieudanym zapisie przez `spawn_task` (timeout MCP) nie jest weryfikowalne z repo i nie wchodzi w treść raportu: NIE_ZMIERZONO.

## 3. Poprawki do 01-rozpoznanie.md (do zastosowania przez orkiestratora lub Operatora r2)

- P1 (Z1), §1 wiersz 1/8 i §4 H4: bramka w `siege_tactics_loop.rs:1036-1039` to DWIE gałęzie: `tryb-reczny` (1037) i `oblezenie` (1038-1039). H4 zdejmuje `tryb-reczny`. Zdjęcie `oblezenie` jest zależnością H4 i wymaga osobnego tematu (#97 lub #113, NIE_ZMIERZONO, do decyzji orkiestratora). Bez tego ręczne oblężenie (`_performSiegeManualOrder` wymaga `siegeWallCol >= 0`) nie uruchomi się, a sama odblokowana gałąź `tryb-reczny` daje tylko ścieżkę poza maszyną.
- P2 (Z2), §4 H3 "Wspólny plik": zmienić z "NIE (tylko nowe pliki)" na: "TAK, warunkowo. Wariant A: bez zmiany traitu, nowy moduł wywoływany z pętli. Wariant B: zmiana sygnatur w `siege_tactics_activate.rs:114-132` (plik spoza H1-H4, do dopisania do allowlisty). Sposób powrotu z callbackiem `done` (pin 18471-18473) w Rust = zdarzenia `ActivateEvent`; wybór wariantu do rozstrzygnięcia w H3."
- P3 (Z3), §1 wiersz 12 i §4 H2: `_targetInRange` (pin 8373-8409) = (a) strzelec: `1 <= dd <= range`; (b) melee: `_meleeBlockedByWall` (8389, Rust: `siege_city_fortification.rs:66`, wrapper do dodania), `dd === 1 || dd === 0` (8391); (c) po obu gałęziach filtr `desiredHitForDirection(ru.attackDirection)` + `relativeHit(...) === desired` (8402-8407), potem `lowestHp` (8407, 8409). H2 wymaga wektorów dla `dd === 0`, remisu HP i filtru kierunku.
- P4 (Z4), §1: dopisać wiersze: `2a` `_performPlayerOrder -> _executeGroupDoctrineStep` (18291); `2b` `_activateUnit -> _executeGroupDoctrineStep` (6097); `2c` `_executeGroupDoctrineStep -> _executeSkirmishDoctrineStep` (17987); `4a` wejścia `_executeUnitsImmediate` (3610, 18649, 18677, 18699) -> 18608. Opisać rekursję 18291 -> 17987 -> 18122 -> 18280 i guard 18437 dla `move`.
- P5 (Z5), §1 wiersz 10: zdanie "W H3 wystarczą dwie flagi wejściowe" zamienić na: "HIPOTEZA, NIE_ZMIERZONO: czy wystarczą dwie flagi wejściowe, zależy od ciał 17621 i 17633 (nieczytane)."
- P6 (Z6), §4a "Koszt" przy A: dopisać: "Łańcuch H3 -> H4 zależy wtedy od odblokowania #147-#149 (BLOCKED wg listy zadań) albo #179 (status do potwierdzenia). Rekomendacja A bez zmian."
- P7 (Z7), nagłówek 01 lub §0: dopisać: "Commit 3589700dd (ten plik) leży na gałęzi `worktree-wf_d8a3e31a-461-1`, nie jest przodkiem `459354a12` i nie ma go na `origin/claude/rust-sivvrn`. Scalić jawnie."

## 4. Propozycja dla H2 (wpływ poprawek)

Zgodnie z P3 i P6: H2 (helpery celu) powinien mieć wektory dla `dd === 0`, remisu HP i filtru kierunku oraz reużyć `melee_blocked_by_wall`. Zakres H2 zostaje ten sam (`siege_tactics_targets.rs` nowy, bez zmian w `siege_tactics_loop.rs` poza atrapami 788/791). Rekomendacja A z §4a nadal wymaga akceptacji orkiestratora ze względu na P6.

## 5. Odtwarzalne polecenia (użyte w obronie)

```
git cat-file -t 07d2fbd72
git cat-file -t 316ded4b7
git cat-file -t 3589700dd
git show --stat 3589700dd
git branch --contains 3589700dd
git merge-base --is-ancestor 3589700dd HEAD                       # NOT_ANCESTOR
git ls-tree -r --name-only origin/claude/rust-sivvrn -- dyspozycje/autobot/runs/R-RUSTPORT-P6-H-MANUAL-ROZP-Q1/
git show 316ded4b7:rust-port/engine/src/domain/siege_tactics_loop.rs | sed -n '1025,1100p'    # gate 1036-1039, komentarz 1096
git show 316ded4b7:rust-port/engine/src/domain/siege_tactics_activate.rs | sed -n '105,135p'   # trait ActivateOps 114-132
git show 316ded4b7:rust-port/engine/src/domain/siege_tactics_loop.rs | grep -n "struct ProdOps\|impl ActivateOps for ProdOps\|fn perform_player_order\|ProdOps { melee_target }"
git show 316ded4b7:rust-port/engine/src/domain/siege_city_fortification.rs | sed -n '60,70p'         # melee_blocked_by_wall
git show 07d2fbd72:gra/src/battle/battleScene.ts | sed -n '18430,18478p'                           # _performSiegeManualOrder
git show 07d2fbd72:gra/src/battle/battleScene.ts | sed -n '8373,8410p'                             # _targetInRange
git show 07d2fbd72:gra/src/battle/battleScene.ts | grep -n "const desired = desiredHitForDirection\|return lowestHp(matching)\|return lowestHp(inReach)\|if (dd === 1 || dd === 0)"
git show 07d2fbd72:gra/src/battle/battleScene.ts | grep -n "_performPlayerOrder(\|_executeGroupDoctrineStep(\|_executeSkirmishDoctrineStep(\|_executeUnitsImmediate(\|_performSiegeManualOrder(\|_activateUnit("
git show 07d2fbd72:gra/src/battle/battleScene.ts | sed -n '18280,18300p'                          # _performPlayerOrder, wejście
git show 07d2fbd72:gra/src/battle/battleScene.ts | sed -n '6018,6026p'                             # player_unit_idle (blok)
```

Każdy wynik odczytany ręcznie. Numery linii Rust z tych poleceń.

## 6. NIE_ZMIERZONO (obrona)

- Ciała `_isUnitDoctrineAuto` (17621) i `_effectiveMetaForUnit` (17633): nie czytane (Z5).
- Sposób powrotu callbacka `done` do sekwencji tury w Rust: nie rozstrzygnięty (Z2).
- Który temat zdejmuje gałąź `oblezenie` w bramce (Z1): nie rozstrzygnięte.
- Czy rekursja `_performPlayerOrder` <-> `_executeGroupDoctrineStep` zawsze kończy się `done()`: nie sprawdzone (Z4).
- Statusy #147-#149 i #179 w kolejce: do potwierdzenia przez orkiestratora (Z6).
- Zdanie o nieudanym `spawn_task`: nie weryfikowane (Z7).
- Zachowanie w grze (uruchomienie web lub `*-live.cjs`): nie sprawdzane. Tryb odczytu.
