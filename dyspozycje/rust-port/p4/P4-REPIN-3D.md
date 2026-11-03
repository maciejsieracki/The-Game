# P4-REPIN-3D — REPIN sceny bitwy 3D do aktualnego weba (część A: pomiar + plan + partia A1)

**TEMAT:** R-RUSTPORT-REPIN-3D-A-Q1 · **DOMAIN:** GAME · **RUNDA:** 1/5 · **ROLA:** Operator
**Baza:** `rust-port/parity-v2` @ `e1c040160` · **Pin dotychczasowy:** `edb8fb56` (MOD-14, P4-36 cz. 1–5)
**Web docelowy:** `origin/main` @ `c1581619f` (wektory A1); w trakcie pracy `origin/main` przesunął się na
`60621493a` — `git diff --stat c1581619f..60621493a -- gra/src/battle gra/src/render gra/src/game/siege.ts gra/src/game/siegeDefenders.ts gra/data/units.json` = pusto (zakres bez zmian).
**Plan nadrzędny:** `dyspozycje/rust-port/PLAN-AKTUALIZACJI-PORTU-DO-WEBA-20261030.md` §3, faza U5.

## 0. Streszczenie

1. **Dryf zmierzony** (§1): `git diff --numstat edb8fb56..origin/main` — `battle/battleScene.ts` +872/−200,
   `battle/siegeWall.ts` +213/−0, `battle/formationRules.ts` +160 (nowy), `battle/mapFieldBattle.ts` +1,
   `game/siege.ts` +27/−10, `game/siegeDefenders.ts` +294/−33, 14 plików `render/*` (+366/−79 łącznie)
   oraz nowe moduły logiki oblężenia `game/city-fortification.ts` (+83), `game/city-towers.ts` (+163),
   `game/city-defense.ts` (+58), `game/army-leadership.ts` (+63).
2. **Klasyfikacja** każdego hunka behawioralnego (§2): czysta logika sceny (port bit w bit do
   `battle::*`), GPU/three-zależne (opis), UI DOM (P5), logika bitwy (P6.13 — `rust-port/engine`, poza
   allowlistą), kosmetyka/komentarz. Mapowanie na moduły Rust i kolejka partii A1…A6 z wyceną (§3).
3. **Partia A1 ZPORTOWANA** (§4): kolejka rozkazów (`battle::orders`), atakuj-marszem
   (`PlayerOrder::AttackMove` + strzałka), natychmiastowe usuwanie zabitych (`units::kill_unit`, także
   katapulta obrońcy na wyburzonym kaflu). Wektory z **uruchomionego** weba `origin/main`
   (`tests/repin3d_fixtures/gen_a1.ts`, 618 850 B), 6 testów `tests/repin3d_a1.rs` + 2 jednostkowe:
   0 różnic. Mutacje 35/35 (§5). Pełny `cargo test`: 439/0 (baza 431 + 8).
4. Ocena wizualna: **NIE_ZMIERZONO** (brak `/dev/dri`); nie blokuje (dispatch).

**ZAŁOŻENIE Z-RP-1 (ścieżka):** dispatch wskazuje `gra/src/render/battleScene.ts`; plik leży w
`gra/src/battle/battleScene.ts` (tak też w P4-36 §3). Mierzę `gra/src/battle/**` + `gra/src/render/**` +
`game/siege*.ts` + `battle/mapFieldBattle.ts` (`game/mapFieldBattle.ts` nie istnieje — jest `battle/`).
Dispatch podawał „+610/−192”; pomiar `--numstat` daje **+872/−200** (stan `c1581619f`).

**ZAŁOŻENIE Z-RP-2 (zakres „portowalna logika”):** `battle::*` portuje **scenę** (P4-36 §0: logika bitwy →
P6.13). Do A1 wchodzą funkcje, których wynik bezpośrednio steruje grafem sceny (które strzałki, w jakim
kolorze, linia przerywana „dyspozycji”, odłączenie modelu zabitego). Decyzje taktyczne nowego weba
(trasy attack-move, linia natarcia, wieżyczki — strzał) są wstrzykiwane jako DTO, jak w cz. 3–4.

**ZAŁOŻENIE Z-RP-3 (`Fade`):** w webie `origin/main` lista `fadingUnits` nie ma już żadnego zapisu
(jedyna inicjalizacja `:2601`; `_startFade` `:9440-9451` woła `_removeUnitFromScene`), więc
`_tickFades` (`:8956-8976`) jest martwy. `dynamics::Fade`/`tick_fades` zostają (zweryfikowane na pinie,
P4-36 §30) z adnotacją; test A1 potwierdza, że ticki na nowym webie nic nie zmieniają. Usunięcie —
po regeneracji wektorów cz. 4 (partia A5), żeby nie gubić pokrycia pinu przed jego wymianą.

## 1. Metoda pomiaru

```bash
git diff --numstat edb8fb56..origin/main -- gra/src/render gra/src/battle gra/src/game/mapFieldBattle.ts gra/src/game/siege.ts gra/src/game/siegeDefenders.ts
git diff edb8fb56..origin/main -- gra/src/battle/battleScene.ts     # 1776 linii diffu, 78 hunków
git diff edb8fb56..origin/main -- gra/src/battle/siegeWall.ts       # 3 hunki
git diff edb8fb56..origin/main -- gra/src/render                    # 14 plików
git log --oneline edb8fb56..origin/main -- gra/src/battle/battleScene.ts gra/src/battle/siegeWall.ts   # 16 commitów
```

Commity webu w zakresie (najważniejsze): `fa94d9b92` remove killed units immediately, `601fc3baf` manual
attack-move, `96d088b4d` clear stale queued order ids, `25e9183a3`/`0d31bc4ec`/`9dc324bb9`/`3f88dad92`
doktryny i trasy, `4f68d98c4` AUTO bez generała, `1461c0dfa`/`ce77ddffa`/`3469dc3a4` palisada/mur +
wieżyczki, `4d41f3060` bonus obrońców + zasięg ×2, `5d9534e0b` wycieki pamięci, `f48894231` dowódcy.
Linie `web:` poniżej = `origin/main` (`c1581619f`), `pin:` = `edb8fb56`.

## 2. Tabela hunków: symbol → hunk → moduł Rust → status

Klasy: **SC** = czysta logika sceny (port bit w bit), **GPU** = zależne od GPU/three bez odpowiednika
CPU (opis), **UI** = DOM (P5), **LB** = logika bitwy (P6.13, `rust-port/engine`), **K** = kosmetyka /
komentarz / pamięć bez zmiany obrazu.

### 2.1 `battle/battleScene.ts`

| # | symbol (web) | hunk (web) | klasa | moduł Rust | status |
|---|---|---|---|---|---|
| 1 | `_startFade` → `_removeUnitFromScene` (brak animacji śmierci) | `:9440-9451` (pin `:9082-9089`) | SC | `units::kill_unit` | **A1 PORTOWANE** |
| 2 | `_tickFades` bez zapisów do `fadingUnits` | `:2601`, `:8956-8976` | SC (martwe) | `dynamics::Fade` (zostaje, Z-RP-3) | **A1 zmierzone** (no-op) |
| 3 | `_breachWallTile`: katapulta obrońcy na kaflu → `_startFade` (pin: `dead/fadingOut` bez listy = model zostawał widoczny) | `:7614-7619` | SC | `kill_unit` + `dynamics::breach_wall_tile` | **A1 PORTOWANE** |
| 4 | `_refreshQueuedOrderVisuals`: `attackMove` = strzałka do kafla w kolorze ataku | `:11020-11022` | SC | `units::refresh_queued_order_visuals`, `PlayerOrder::AttackMove` | **A1 PORTOWANE** |
| 5 | `_activateNext`: zdejmowanie id pominiętych (`:5862-5866`) i aktywowanych (`:5881-5883`) z kolejki | `:5847-5898` | SC (stan kolejki → styl strzałek) | `orders::next_activation`, `consume_on_activation`, `QueuedOrders` | **A1 PORTOWANE** |
| 6 | `_issueBattleAttackMove`, `_cancelAttackMoveSelected`, Escape | `:18076-18106`, `:16850-16856` | SC | `orders::issue_attack_move`, `cancel_attack_move_selected` | **A1 PORTOWANE** |
| 7 | `playerOrder` + `attackMove` (typ) | `:1984` | SC | `PlayerOrder::AttackMove` | **A1 PORTOWANE** |
| 8 | `_placeSiegeWall` `kind: palisada/mur` | `:3984-3985`, `fortKind` `:2678` | SC | `units::place_siege_wall` + `siege_wall` | A2 |
| 9 | `_placeSiegeTowers` (klon `buildWallTower`, poz. `x − TILE_S/2`) | `:4053-4086` | SC | nowy `battle::siege_towers` | A2 |
| 10 | `_destroyTowerAtRow` (`mesh.visible = false`), wołane z `_breachWallTile` `:7563` i `_fireSiegeTowers` | `:4089-4095` | SC | `siege_towers` | A3 |
| 11 | `_fireOneTower` — pocisk (`makeProjectileMesh`, `from = (x − 0,5, 4,2, z)`, kwaternion) | `:4103-4161` (`_fireSiegeTowers` + `_fireOneTower` `:4118`) | SC (3D) + LB (cel, obrażenia) | `dynamics::launch_projectile` (istnieje) + `siege_towers` | A3 |
| 12 | `_placeUnits` / `_placeUnitsOneSide`: szyk `initialBattleSlots` (`formationRules.ts`), skrzydła konnicy, `formationRank` | `:5197-5247`, `:16580-16622`, `:16743-16748` | LB (pozycje = DTO `UnitSpawn`) | — (scena bez zmian) | NIE-DOTYCZY sceny; wektory cz. 3 (`units.json`) do regeneracji w A4 |
| 13 | `_placeSiegeDefenders`: `_applyTerrainRange` | `:4625` | LB | — | NIE-DOTYCZY |
| 14 | `dispose()`: `renderer.forceContextLoss()` | `:3716-3720` | GPU | RR (cykl życia kontekstu wgpu) | opis: w Rust odpowiednik = drop `wgpu::Device/Surface` sceny bitwy; NIE_ZMIERZONO |
| 15 | zdejmowanie `_deployToolbarDocClick` / `resize` | `:3771-3781`, `:12306-12310` | UI | P5 | NIE-DOTYCZY |
| 16 | przycisk Atakuj-marszem, „Anuluj marsz”, `_orderSummary` tekst, `_attackMoveMode` | `:18374`, `:18476-18496`, `:2243`, `:18212` | UI | P5 | NIE-DOTYCZY |
| 17 | `_toggleManualMode` (bramka dowódcy, reset trybu) | `:16790-16805` | LB/UI | P6.13 / P5 | NIE-DOTYCZY |
| 18 | trasy i doktryny: `_rangedForwardStep`, `_bestForwardStep` (pas boczny), `_compactAttackAllowsStep`, `_rangedFiringStepStaysBehindMelee`, `_shouldAvoidAutoBacktrack`, `_advanceStep` (cios przy styku), `_firstStepAlongPathToAttack(allow, target)`, `_executeGroupDoctrineStep`, `_performPlayerOrder` (move/attackMove/attack), `_firstStepTowardMoveDestination`, `_attackMovePath`, `_firstStepOnAttackMovePath` | `:6684-6806` (`_rangedForwardStep` `:6691`, `_bestForwardStep` `:6737`), `:7834-7965` (`_compactAttackAllowsStep` `:7834`, `_rangedFiringStepStaysBehindMelee` `:7866`, `_shouldAvoidAutoBacktrack` `:7882`, `_advanceStep` `:7889`), `:8221-8263`, `:17408-17465`, `:17722-17970` (`_firstStepTowardMoveDestination` `:17872`, `_attackMovePath` `:17929`, `_firstStepOnAttackMovePath` `:17964`) | LB | P6.13 | NIE-DOTYCZY (scena dostaje `_doMove` / `_doAttack` przez `dynamics`) |
| 19 | mur/palisada: `_meleeBlockedByWall`, `wallEverBreached`, `skip()` z machinami, „SZTURM ODPARTY”, `_wallBonusProcFor`, `_isWallCrownShooter`, zasięg ×2, `computeInstantResult.defBonus` | `:8046-8062`, `:2453`, `:3615-3640`, `:9692-9697`, `:7374-7385`, `:7413-7416`, `:19783-19986` | LB | P6.13 | NIE-DOTYCZY |
| 20 | dowódcy: `moraleWithArmyLeaderBonus`, `_removeCommanderMoraleBonus` (→ `_updateMoraleBar`), `_disableManualIfCommanderLost`, `commandersToWithdrawAfterArmyBreak` | `:1575-1578`, `:9502-9524`, `:9679-9680` | LB (+ SC: aktualizacja pasków morale = istniejące `units::update_morale_bar`) | P6.13 | NIE-DOTYCZY; test A1 odtwarza wywołania paska z DTO |
| 21 | usunięte `arrangeFlankCavalry` | pin `:1478-1511` | LB | — | NIE-DOTYCZY |

### 2.2 `battle/siegeWall.ts` (port: `battle::siege_wall`, cz. 1)

| symbol | hunk | klasa | status |
|---|---|---|---|
| `SiegeWallOpts.kind?: 'palisada' \| 'mur'` + `resolved.kind ?? 'mur'` | `:22-33`, `:1192-1198` | SC | A2 — dla `kind` pustego / `'mur'` wynik **bez zmian** (diff wyłącznie addytywny: nowa gałąź `if (resolved.kind === 'palisada') return buildPalisade(...)` przed `switch (civ)`) |
| `buildPalisade` (~110 LOC, pale + drewniana brama, kontrakt `userData` jak mur) | `:981-1089` | SC | A2 |
| `buildWallTower(material, tileSize, height)` (~85 LOC) | `:1090-1189` | SC | A2 |

### 2.3 `render/*` (14 plików; moduły poza `battle::*` — poza allowlistą A)

| plik | zmiana (diff) | klasa | moduł Rust | status |
|---|---|---|---|---|
| `units.ts` | `HIGHLIGHT_OPACITY` = `MAP_HEX_HIGHLIGHT_BASE_OPACITY` (0,35 = jak było), gwiazda dowódcy `applyUnitCommanderStar`, cache sprite'ów odznak stosu (bez przebudowy co sync) | SC (gwiazda) / K (stała, cache) | `units::*`, `models::unit_core` | **REPIN-3D-B** |
| `unitVeteranBadges.ts` | `applyUnitCommanderStar` (+33) | SC | `units::overlay` | REPIN-3D-B |
| `unitStatPlate.ts` | `PLATE_OWNER_ICON_SIZE` 0,20 → **0,80**·HEX_R | SC (zmiana obrazu) | `units::overlay` (P4-32) | REPIN-3D-B |
| `unitOwnerEmblem.ts` | warianty dysku, klucz emblematu (+41/−12) | SC (canvas) | `raster`/`units` (P4-28/P4-32) | REPIN-3D-B |
| `cities.ts` | model osady wg stylu (+70/−4) | SC | `cities::*` (P4-21) | REPIN-3D-B |
| `improvements.ts` | fort/posterunek ×2 (`FORT_OUTPOST_MODEL_SCALE`) | SC | `models` improvements (P4-20) | REPIN-3D-B |
| `resources.ts`, `styleResources.ts` | `RESOURCE_MODEL_SCALE = 2` → `userData.depositDisplayScale` | SC | `decor`/resources | REPIN-3D-B |
| `kopalnia-cyny/zlota-opus5.ts` | materiały/geometrie współdzielone (`markSharedTransient…`) | K (pamięć) — do potwierdzenia w B | P4-20 | REPIN-3D-B (weryfikacja „bez zmiany obrazu”) |
| `bronzeCityRoblox.ts`, `stoneCityRoblox.ts` | `markSharedTransientGeometry(geo)` | K (pamięć) | — | NIE-DOTYCZY obrazu |
| `transientObjectResources.ts`, `memDebug.ts` | nowe: zarządzanie zwalnianiem, `?memdebug=1` | K/GPU (dispose) | — | NIE-DOTYCZY (Rust: własność) |
| `buildHighlight.ts` | nowe stałe podświetleń (0,35 / 0,3 × 1,2) + filtr | SC (stałe) / LB (filtr) | overlays | REPIN-3D-B |
| `rangeOverlay.ts` | `MINE_ELIGIBLE_TINT_OPACITY` 0,30 → 0,36 (0,3 × 1,2) | SC | `overlays` | REPIN-3D-B |
| `braz-rydwan-woly-opus5.ts` | tylko komentarz (Epoka) | K | — | NIE-DOTYCZY |

### 2.4 Logika oblężenia (`game/siege.ts`, `game/siegeDefenders.ts`, `game/city-*.ts`, `battle/formationRules.ts`, `battle/mapFieldBattle.ts`)

Wszystko **LB** → P6.13 / `rust-port/engine` (poza allowlistą tego tematu, zero zmian). Dla sceny ważne
jako źródło DTO: `cityFortificationKind` (palisada/mur → A2), `towerRows`/`towerMaterialFor`/`pickTowerTarget`
(A2–A3: rzędy i materiał wieżyczek jako DTO), `initialBattleSlots` (A4: pozycje `UnitSpawn`).

## 3. Kolejka partii (wycena = LOC weba do portu sceny + wektory)

| partia | zakres (§2) | moduły Rust | wycena |
|---|---|---|---|
| **A1** | #1–#7 | `orders` (nowy), `units` | **WYKONANA** w tej rundzie (~320 LOC Rust + generator) |
| A2 | #8, #9, §2.2 (palisada + wieżyczka jako modele; umieszczenie wieżyczek z DTO `towerRows`) | `siege_wall`, nowy `siege_towers`, `units::place_siege_wall` | ~200 LOC weba → ~600 LOC Rust; wektory: 9 stylów × {mur, palisada} + wieżyczki 2 materiały |
| A3 | #10, #11 (burzenie wieżyczki, pocisk wieżyczki) | `siege_towers`, `dynamics` | ~60 LOC weba; wektory jak cz. 4 |
| A4 | regeneracja wektorów cz. 3 (`units.json`) na nowym szyku #12 (scena bez zmian, zmienia się tylko DTO) | testy `battle3d_units` | generator cz. 3 na `origin/main`; ryzyko: dryf modeli `render/units.ts` (gwiazda dowódcy) → razem z REPIN-3D-B |
| A5 | regeneracja cz. 4–5 (`dynamics.json`, `picking.json`) na `origin/main`; usunięcie martwego `Fade` (Z-RP-3) | `dynamics`, `picking` | generator cz. 4–5; zmiana oczekiwana tylko w przypadkach „fade” |
| A6 | regeneracja cz. 1–2 (`siege_wall.json`, `field.json`) — kontrola, że `mur` bez zmian | — | tylko pomiar (oczekiwane 0 różnic, §2.2) |
| REPIN-3D-B | §2.3 (`render/*`) | `units`, `cities`, `overlays`, `models` | osobny temat (inna allowlista) |

## 4. Partia A1 — implementacja i weryfikacja

**Kod** (`rust-port/renderer/src/battle/`): `orders.rs` (nowy: `QueuedOrders` z semantyką JS `Set`,
`TurnCandidate`, `next_activation`, `consume_on_activation`, `issue_attack_move` z wstrzykniętym
`_orderMoveForUnits`, `cancel_attack_move_selected`), `units.rs` (`PlayerOrder::AttackMove`, gałąź strzałki
w `refresh_queued_order_visuals`, `kill_unit`), `mod.rs` (moduł + wiersz tabeli). Bez nowych zależności,
`Cargo.toml`/`Cargo.lock` bez zmian.

**Generator** (`rust-port/renderer/tests/repin3d_fixtures/`, README tamże): `gen_a1.ts` + `build_a1.mjs`
(kopia `build_dynamics.mjs` z własną listą `export {…}`), `dom_stub.ts`/`three_shim.ts` z
`tests/fixtures/battle3d/` bez zmian; web `git archive origin/main gra/src gra/data` do `mktemp -d`
**poza repo**, three@0.169.0, esbuild@0.24.0, node v22.22.0. Wszystkie przypadki na
`Object.create(BattleScene.prototype)` z wstrzykniętym stanem (wzorzec `gen_units.ts`), logika
zastubowana/obserwowana, decyzje jako DTO:

| przypadek | co | brzegi |
|---|---|---|
| `queued` (4) | strzałki z `attackMove` | zero-długość, routed/dead/removed, rogi pola `(0,0)` i `(BF_COLS−1, BF_ROWS−1)`, `def` jako gracz, `started=false`, `finished=true`, stara strzałka, id spoza rosteru w kolejce |
| `issue` + `cancel` (6) | `_issueBattleAttackMove` / `_cancelAttackMoveSelected` | pusta selekcja, dead/removed/routed/nieznane id, jednostka bez rozkazu ruchu (waypoint = klik), istniejący `attack`, kolejka/natychmiast, krawędź pola |
| `activate` (6) | skan `_activateNext` | każda flaga pominięcia osobno, tryb AUTO (kolejka nietknięta), wyczerpanie (`schedule 240` = `TURN_GAP_MS`), `turnIdx` = N−1 / N / poza końcem (9 > 7) |
| `kill` (7 kroków) | `_startFade` | żywy, `dead`, `fadingOut`, `removed`, `routed` (usuwany), dowódca (paski morale sojuszników z bonusem), drugie zabicie tego samego; `_tickFades` 4 czasy |
| `breach` (6) | `_breachWallTile` bez grupy muru | katapulta na kaflu (usunięta), odwrót na `wallCol+1`, odwrót przy zajętym polu (szukanie), pole za murem rzeką, martwa katapulta, rząd bez muru, ten sam rząd 2× |

**Wynik** (`cargo test --locked --test repin3d_a1 -- --nocapture`): 6/6 ok (5 wektorowych + test strażnika
`kill_guard_removed_alone_is_a_no_op`, §5) — checks: queued 53, issue/cancel
464, activate 78, kill 273 (+1 skalar `DEATH_FADE_MS`), breach 642; 0 różnic. Testy jednostkowe
`battle::orders` (2): semantyka `Set`, każda flaga pominięcia, N−1/N/N+1 końca kolejki, AUTO.
NaN: wejścia A1 to id/flagi/indeksy całkowite (brak `f64` w logice kolejki); `f64` występują tylko w
pozycjach strzałek/modeli liczonych przez istniejące (już zweryfikowane z NaN, P4-36 §24) funkcje —
**ZAŁOŻENIE Z-RP-4**: brak sensownego brzegu NaN dla A1.

**Niezależny weryfikator generatora:** drugi katalog `mktemp -d` z osobnym `npm install` i osobnym
`git archive` → `a1.json` identyczny bajt w bajt (§6, `dowody/verify-gen-a1-r1.txt`).

**Wspólne pomoce testów:** `tests/repin3d_common/mod.rs` = dosłowna kopia czytnika JSON / `Cmp` /
`dumpTree` z `tests/battle3d_units.rs` (zmienione tylko `pub` i katalog fixtur) — do ponownego użycia w A2+.

## 5. Mutacje

`tests/repin3d_fixtures/mutate_a1.py`: 35 mutantów na każdej gałęzi sterującej A1 (`QueuedOrders::add/delete`,
4 flagi `can_act`, skan: tryb ręczny / flaga odświeżenia / usuwanie / krok indeksu / indeks wyniku,
`consume_on_activation` ×2, `issue_attack_move`: pusta selekcja, 3 warunki pominięcia, 2 źródła waypointu,
kolejka/natychmiast ×2, komunikat, `execute_now`, wyszukiwanie id; `cancel` ×3; strzałka: kolor, brak
strzałki, styl kolejki; `kill_unit`: 3 warunki strażnika, brak usunięcia, wynik).

Wynik r1: pierwszy przebieg **34/35** (`dowody/mutate-a1-r1.txt`) — przeżył `kill ignores removed`
(strażnik `fading_out || dead` bez `removed`). Na stanach osiągalnych webu mutant jest **równoważny**:
`removed = true` pada wyłącznie w `_removeUnitFromScene` `:9425`, razem z `dead = true` `:9426`, więc gałąź
`dead` zawsze go łapie. API Rust pozwala jednak podać `removed` bez `dead`, więc dodany test
`kill_guard_removed_alone_is_a_no_op` (zachowanie strażnika `:9441`) → przebieg końcowy **35/35**
(`dowody/mutate-a1-r1-final.txt`, `EXIT=0`).

## 6. Bramy i dowody

Surowe logi z `EXIT=`: `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-3D-A-Q1/dowody/`
(`gates-r1.txt`, `test-full-r1.txt`, `mutate-a1-r1*.txt`, `verify-gen-a1-r1.txt`); raport `01-operator-r1.md`.

```text
# rustc 1.97.0 (stable); CARGO_INCREMENTAL=0, CARGO_PROFILE_DEV_DEBUG=0, CARGO_PROFILE_TEST_DEBUG=0
## $ cargo fmt --all -- --check                                   EXIT=0
## $ cargo clippy --locked --all-targets -- -D warnings            EXIT=0
## $ cargo test --locked --no-fail-fast   passed=439 failed=0 binaries=57   EXIT=0   (baza e1c040160: 431)
## $ cargo +1.87.0 test --locked --test repin3d_a1     6 passed   EXIT=0
## $ cargo +1.87.0 test --locked --lib battle::orders  2 passed   EXIT=0
## $ python3 tests/repin3d_fixtures/mutate_a1.py        KILLED 35/35   EXIT=0
## $ sha256sum -c tests/repin3d_fixtures/MANIFEST.sha256   5 OK   EXIT=0
## generator 2 katalogi: a1.json 5b8baa9a… = 5b8baa9a… = repo
```

`cargo clippy --features gpu`: **NIE_ZMIERZONO** w tej rundzie (A1 nie dotyka kodu za cechą `gpu`;
budowa wgpu przy ~3,6 GB wolnego dysku pominięta).

## 7. Co ocenić wzrokiem (NIE_ZMIERZONO — wymaga GPU)

- Zabita jednostka znika natychmiast (bez 0,5 s zanikania i skurczu) — zgodnie z webem `origin/main`.
- Strzałka atakuj-marszem: kolor ataku (czerwony), do kafla (nie do jednostki); dyspozycja = linia przerywana.
- Po aktywacji jednostki jej strzałka dyspozycji przestaje być przerywana (kolejka zdjęta).
- Katapulta obrońcy na wyburzonym kaflu znika (na pinie zostawała widoczna — błąd pinu, nie portu).
