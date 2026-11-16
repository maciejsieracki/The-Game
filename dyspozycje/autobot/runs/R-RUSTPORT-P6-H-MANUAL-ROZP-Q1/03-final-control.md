STATUS: PASS-WITH-NOTES
DOMAIN: GAME (odczyt)
TEMAT: R-RUSTPORT-P6-H-MANUAL-ROZP-Q1 (runda 1, Final Control SONNET)
GOAL: Orzec na dowodzie, czy rozpoznanie trybu ręcznego bitwy oblężniczej (`01-rozpoznanie.md`) wraz z oceną (`02-evaluator.md`) i obroną (`02a-obrona.md`) nadaje się jako podstawa dispatchów H1-H4, oraz zweryfikować samodzielnie zakres commitów.
ZMIANY/COMMIT: tylko `dyspozycje/autobot/runs/R-RUSTPORT-P6-H-MANUAL-ROZP-Q1/` (01, 02, 02a przeniesione cherry-pickiem bez zmian treści, plus ten plik). Kod, `gra/`, `rust-port/` nietknięte. Bez push na parity. SHA końcowy (commit z tym plikiem): w raporcie zwrotnym FC (SHA nie może być wpisany w plik, który zmienia).
TESTY: NIE DOTYCZY (tryb odczytu). Weryfikacja: `git show` i `git ls-tree` z §4.
BLOKADY: brak blokad odczytu. Poprawki P1-P7 z obrony NIE są naniesione w `01-rozpoznanie.md` (obrona je tylko opisuje). Ten dokument wiąże je jako erratę (§3), która ma pierwszeństwo przed `01` w razie sprzeczności.
RUNDY: 1/5
NASTĘPNY KROK: Orkiestrator: (a) zintegrować gałąź z tym commitem (zawiera 01, 02, 02a, 03); (b) dispatche H1-H4 pisać z `01` + erratą §3 tego pliku; (c) rozstrzygnąć techniczne decyzje z §5; (d) Evaluator r2 nie jest wymagany, o ile dispatche H3/H4 powołują się na erratę (decyzja orkiestratora).
DEPLOY/PUSH: NIE WYKONANO

## 1. Zakres commitów (zweryfikowane samodzielnie)

Pliki każdego commitu (`git diff --name-only <c>^ <c>`):

| Commit (oryginał) | Rodzic | Pliki | Wynik |
|---|---|---|---|
| `3589700dd` (Operator, 01) | `459354a12` | `dyspozycje/autobot/runs/R-RUSTPORT-P6-H-MANUAL-ROZP-Q1/01-rozpoznanie.md` | tylko dozwolona ścieżka |
| `70f75431f` (Evaluator, 02) | `459354a12` | `.../02-evaluator.md` | tylko dozwolona ścieżka |
| `326c88889` (Obrona, 02a) | `459354a12` | `.../02a-obrona.md` | tylko dozwolona ścieżka |

Trzy commity są rodzeństwem (każdy od `459354a12`, na osobnych gałęziach worktree), więc żaden nie jest przodkiem drugiego. W tym worktree wprowadziłem je `git cherry-pick` (brak konfliktów, różne pliki), żeby jeden SHA niósł komplet. Kod, `gra/` i `rust-port/` nie występują w żadnym diffie.

Z7 potwierdzone: `git ls-tree -r --name-only origin/claude/rust-sivvrn -- dyspozycje/autobot/runs/R-RUSTPORT-P6-H-MANUAL-ROZP-Q1/` zwraca wyłącznie `00-dispatch.md`. Plik 01 nie jest na zdalnej gałęzi. Orkiestrator musi scalić jawnie (ten commit to załatwia).

## 2. Orzeczenia na zarzuty Evaluatora (z weryfikacją własną)

Dowody z pinu `07d2fbd72` (`gra/src/battle/battleScene.ts`) i Rust `316ded4b7` odczytałem samodzielnie.

| # | Zarzut | Obrona | Orzeczenie FC | Dowód własny |
|---|---|---|---|---|
| Z1 | Bramka `oblezenie` obok `tryb-reczny` | PRZYJMUJĘ | **NAPRAW (errata P1)**. Obrona słuszna. | Rust `siege_tactics_loop.rs:1036-1039`: `if self.scene.manual_mode { "tryb-reczny" } else if self.scene.wall_col >= 0 \|\| st.siege_wall_col >= 0 { "oblezenie" }`. Komentarz 1094-1096: "strażnik `oblezenie` wyżej wyklucza mur". Pin 18437: `if (!(this.siegeWallCol >= 0) \|\| ru.side !== 'atk' \|\| ord.type === 'move') return false;`. Wniosek: sama zmiana `tryb-reczny` nie uruchomi ścieżki ręcznej, bo `_performSiegeManualOrder` działa tylko z murem, a mur jest wykluczony przez `oblezenie`. |
| Z2 | `ActivateOps` bez `done`, sposób powrotu callbacka | PRZYJMUJĘ | **NAPRAW (errata P2) + DO DECYZJI ORKIESTRATORA (§5, D1)**. Obrona słuszna, ale nie rozstrzyga wariantu. | Rust `siege_tactics_activate.rs:114-132`: `fn perform_player_order(&mut self) -> bool;`, `fn tower_climb`, `fn infantry_to_tower`, `fn ram_tower_step` bez parametrów. Pin 18471-18473: `_siegeSafeApproach(ru, tc, tr, () => { ...; done(); })`. Klasyfikacja "H3 NIE dotyka wspólnych plików" w 01 §4 jest nieudowodniona. |
| Z3 | Niepełny opis `_targetInRange` | PRZYJMUJĘ | **NAPRAW (errata P3)**. Obrona słuszna i dokładna. | Pin 8373-8409: gałąź strzelca `dd >= 1 && dd <= ru.range`; melee: `if (this._meleeBlockedByWall(ru, e)) continue;` (8389) i `dd === 1 \|\| dd === 0` (8391); potem `desiredHitForDirection(ru.attackDirection)` + `relativeHit(...) === desired` + `lowestHp(matching)`; w przeciwnym razie `lowestHp(inReach)`. Wrapper `_meleeBlockedByWall` (pin 8361) wymaga `this.siegeWallCol >= 0`, `wallBreached: this.wallEverBreached`, `attackerIsMelee: !canShoot(ru) && !isSiegeUnit(ru.bu)`. Rust ma czystą funkcję K2, wrapper sceny do dodania w H2. |
| Z4 | Pominięte krawędzie wokół `_performPlayerOrder` | PRZYJMUJĘ | **NAPRAW (errata P4)**. Obrona słuszna. | `grep -n` pinu: `_performPlayerOrder(` z 6068, 18082, 18122, 18608 (definicja 18280); `_executeGroupDoctrineStep(` z 6097 i 18291 (definicja 17966); `_executeUnitsImmediate(` z 3610, 18649, 18677, 18699 (definicja 18578); `_performSiegeManualOrder(` z 18286 (definicja 18435). Uwaga: linia 17987 to wywołanie `_executeSkirmishDoctrineStep` (z wnętrza `_executeGroupDoctrineStep`), nie `_executeGroupDoctrineStep`. Obrona opisuje to poprawnie w łańcuchu rekursji, ale w spisie "wywoływane z" wymienia 17987 pod `_executeGroupDoctrineStep`; należy to czytać jako krawędź `_executeGroupDoctrineStep -> _executeSkirmishDoctrineStep` (drobna poprawka, errata P4). |
| Z5 | Dwie flagi wejściowe to hipoteza | PRZYJMUJĘ | **NAPRAW (errata P5)**, z doprecyzowaniem własnym. | Odczytałem pin 17619-17640 (ciała, których Operator i Evaluator nie czytali): `_isUnitDoctrineAuto` zwraca `false` gdy `_getEffectiveDoctrine(ru) === 'manual'`; `true` gdy `ru.unitDoctrine != null`; dla `ru.groupId` zwraca `meta?.autoPlay ?? true` z `_groupMeta`; inaczej `true`. `_effectiveMetaForUnit` składa `GroupMeta` z `_ensureGroupMeta(ru.groupId)` i `_getEffectiveDoctrine`. To są cztery wejścia (doktryna efektywna, `unitDoctrine`, `groupId`, `autoPlay` grupy), nie dwie flagi. Czy flagi `doctrine_auto`/`doctrine_manual` w `ActivateUnit` (Rust) wystarczą, zależy od tego, kto je liczy (T0 #255 / T1 #263); ciało `_getEffectiveDoctrine` NIE_ZMIERZONO. |
| Z6 | Rekomendacja A uzależnia H3 -> H4 od #147-#149 | PRZYJMUJĘ | **NAPRAW (errata P6)** jako zapis zależności. Rekomendacja A bez zmian, decyzja techniczna orkiestratora (§5, D2). | Lista zadań sesji (stan na tę rundę): #147, #148, #149 `pending ... [BLOCKED]`; #179 `pending`, ale #226 "K5LOOP-OUTCOME-ROZPOZNANIE (#179)" `completed`. Status #179 wygląda na nieodświeżony duplikat; potwierdza orkiestrator. |
| Z7 | `3589700dd` nie jest przodkiem HEAD | PRZYJMUJĘ | **NAPRAW (errata P7)**: załatwione tym commitem. Zdanie o `spawn_task` poza zakresem: NIE_ZMIERZONO. | `git ls-tree` z §1. |

Nic nie kwalifikuje się do ODDAL (Obrona nie odrzuciła żadnego zarzutu, a ja także nie znajduję zarzutu bezzasadnego). Nic nie wymaga decyzji właściciela (web rozstrzyga gameplay).

Weryfikacja ciała `_performSiegeManualOrder` (pin 18435-18475): zgodna z wierszami 6-20 tabeli w 01 (guard `ord.type === 'move'`, `isSiegeUnit` -> `_siegeRamTowerStep` albo `return false`, `doctrineAuto`, bezczynny strzelec z `_rangedTargetInRange`, `onWallWalkway`, `_trySiegeTowerClimb`, `_siegeInfantryToTowerStep`, gałąź `_siegeApproachRestricted`, `_siegeSafeApproach`). Fakty Rust (`ProdOps` 764-791, `struct ProdOps` 764, `impl ActivateOps for ProdOps` 768, `perform_player_order` 773, `doctrine_step` 776, `player_unit_idle` 456, `ProdOps { melee_target }` 1073) zgodne z grepem.

## 3. Errata wiążąca do `01-rozpoznanie.md` (pierwszeństwo przed 01)

- **P1 (Z1)**: H4 nie wystarcza do uruchomienia trybu ręcznego oblężenia. Bramka `siege_tactics_loop.rs:1036-1039` ma DWIE gałęzie: `tryb-reczny` (1037) i `oblezenie` (1038-1039). Tryb ręczny oblężenia (`siegeWallCol >= 0`) wymaga zdjęcia OBU. Zdjęcie `oblezenie` jest jawną zależnością H4 od osobnego tematu (#97 K5-LOOP-AUTO, #113 K5LOOP-WIRING albo nowy). Który z nich: NIE_ZMIERZONO, decyzja orkiestratora. Zdanie w 01 "Odblokowanie `tryb-reczny` należy do H4, nie do #97" należy czytać z tym zastrzeżeniem.
- **P2 (Z2)**: klasyfikacja H3 "Wspólny plik: NIE" zastąpiona przez: "TAK, warunkowo". Wariant A: nowy moduł `player_order_siege.rs` wywoływany z pętli bez zmiany traitu (wymaga rozpisania wejścia z `ProdOps` i wyniku kroku bez parametru `done`). Wariant B: zmiana sygnatur w `siege_tactics_activate.rs:114-132` (plik spoza allowlist H1-H4; dopisać do H3 i do listy plików współdzielonych). Wybór wariantu w §5 (D1).
- **P3 (Z3)**: wiersz 12 i H2 zastąpione opisem: strzelec `1 <= dd <= range`; melee: `_meleeBlockedByWall` (pin 8361/8389; Rust K2 `siege_city_fortification.rs`, wrapper sceny do dodania) oraz `dd === 1 || dd === 0` (8391); dla obu gałęzi filtr kierunku `desiredHitForDirection(ru.attackDirection)` + `relativeHit` i wybór `lowestHp` (8402-8409). Wektory H2: `dd === 0`, remis HP, filtr kierunku, blokada muru (przed i po wyłomie `wallEverBreached`).
- **P4 (Z4)**: do tabeli §1 dopisać krawędzie: `_performPlayerOrder -> _executeGroupDoctrineStep` (18291); `_activateUnit -> _executeGroupDoctrineStep` (6097); `_executeGroupDoctrineStep -> _executeSkirmishDoctrineStep` (17987); `_executeUnitsImmediate` wywołane z 3610, 18649, 18677, 18699. Rekursja: `_performPlayerOrder` (18280) -> 18291 -> `_executeGroupDoctrineStep` (17966) -> 17987 -> `_executeSkirmishDoctrineStep` (18087) -> 18122 -> `_performPlayerOrder`; dla rozkazu `move` zamyka ją guard 18437 (`return false`). Czy każda ścieżka `none` kończy się `done()`: NIE_ZMIERZONO (wektory dla T1 i T8).
- **P5 (Z5)**: zdanie "W H3 wystarczą dwie flagi wejściowe" jest HIPOTEZĄ. Wejścia `_isUnitDoctrineAuto`/`_effectiveMetaForUnit` to: `_getEffectiveDoctrine`, `unitDoctrine`, `groupId`, `_groupMeta.autoPlay` (pin 17621-17640). `_getEffectiveDoctrine`: NIE_ZMIERZONO.
- **P6 (Z6)**: przy rekomendacji A łańcuch H3 -> H4 zależy od odblokowania #147-#149 (oznaczone BLOCKED) i/lub #179 (status do potwierdzenia, patrz #226). H4 nie rusza przed tym.
- **P7 (Z7)**: 01 nie jest na `origin/claude/rust-sivvrn`; ten commit scala 01, 02, 02a i 03.

## 4. Odtwarzalne polecenia (użyte przez FC)

```
git diff --name-only 3589700dd^ 3589700dd
git diff --name-only 70f75431f^ 70f75431f
git diff --name-only 326c88889^ 326c88889
git ls-tree -r --name-only origin/claude/rust-sivvrn -- dyspozycje/autobot/runs/R-RUSTPORT-P6-H-MANUAL-ROZP-Q1/
git show 07d2fbd72:gra/src/battle/battleScene.ts | sed -n '18428,18476p'
git show 07d2fbd72:gra/src/battle/battleScene.ts | sed -n '8355,8412p'
git show 07d2fbd72:gra/src/battle/battleScene.ts | sed -n '17619,17640p'
git show 07d2fbd72:gra/src/battle/battleScene.ts | grep -n -E "_performPlayerOrder\(|_executeGroupDoctrineStep\(|_executeSkirmishDoctrineStep\(|_executeUnitsImmediate\(|_performSiegeManualOrder\("
git show 316ded4b7:rust-port/engine/src/domain/siege_tactics_loop.rs | sed -n '1030,1048p;1090,1100p'
git show 316ded4b7:rust-port/engine/src/domain/siege_tactics_activate.rs | sed -n '108,135p'
git show 316ded4b7:rust-port/engine/src/domain/siege_tactics_loop.rs | grep -n -E "struct ProdOps|impl ActivateOps for ProdOps|fn perform_player_order|fn doctrine_step|fn player_unit_idle|ProdOps \{"
```

## 5. Decyzje techniczne dla orkiestratora (nie dla właściciela; web rozstrzyga gameplay)

- **D1 (Z2)**: jak H3 oddaje wynik kroku z callbackiem `done`: wariant A (moduł bez zmiany traitu) czy B (zmiana sygnatur w `siege_tactics_activate.rs`). FC nie rozstrzyga; rekomendacja techniczna: rozpocząć H3 od odczytu, jak `ActivateEvent` niesie zakończenie dla istniejących gałęzi (`Done`, `Attack`), i wybrać A, jeśli wystarczy; B wymaga osobnej allowlisty i wyłączności na pliku.
- **D2 (Z6)**: zatwierdzenie rekomendacji A z §4a w 01 (H2 do #179/#148) razem z zapisem zależności z P6.
- **D3 (Z1)**: który temat zdejmuje gałąź `oblezenie` (#97, #113 albo nowy).
- **D4**: status #179 vs #226 w liście zadań (prawdopodobny duplikat).

## 6. NIE_ZMIERZONO (FC)

- `_getEffectiveDoctrine` (ciało), `_doAttack`, `_siegeSafeApproach` (8107) i pozostałe ciała z listy w 01 §6: nieczytane (poza 17619-17640).
- Czy rekursja `_performPlayerOrder` <-> `_executeGroupDoctrineStep` zawsze kończy się `done()`.
- Statusy #147-#149, #179 poza listą zadań sesji.
- Zachowanie w grze (web `*-live.cjs`): nie uruchamiano (tryb odczytu).
- Zdanie o nieudanym `spawn_task` (timeout MCP): nie weryfikowalne z repo.
