# P4-REPIN-3D — REPIN sceny bitwy 3D do aktualnego weba (część A: pomiar + plan + partie A1, A2)

**TEMAT:** R-RUSTPORT-REPIN-3D-A-Q1 · **DOMAIN:** GAME · **RUNDA:** 1/5 · **ROLA:** Operator
**Baza:** `rust-port/parity-v2` @ `e1c040160` · **Pin dotychczasowy:** `edb8fb56` (MOD-14, P4-36 cz. 1–5)
**Web docelowy:** `origin/main` @ `c1581619f` (wektory A1); w trakcie pracy `origin/main` przesunął się na
`60621493a` — `git diff --stat c1581619f..60621493a -- gra/src/battle gra/src/render gra/src/game/siege.ts gra/src/game/siegeDefenders.ts gra/data/units.json` = pusto (zakres bez zmian).
**Partia B1:** R-RUSTPORT-REPIN-3D-B-Q1 (runda 1/5, Operator) na `parity-v2` @ `65e81ae4d`, web `origin/main` @ `86d510c66` — §9.
**Partia A2:** R-RUSTPORT-REPIN-3D-A2-Q1 (runda 1/5, Operator) na `parity-v2` @ `776bede11`, web `origin/main` @ `5fa0c1a84` — §8.
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
| 8 | `_placeSiegeWall` `kind: palisada/mur` | `:3984-3985`, `fortKind` `:2678` | SC | `units::place_siege_wall_fort` (+ `FortKind`, `FortDto`) + `siege_wall` | **A2 PORTOWANE** (§8) |
| 9 | `_placeSiegeTowers` (klon `buildWallTower`, poz. `x − TILE_S/2`) | `:4053-4086` | SC | nowy `battle::siege_towers::place_siege_towers` | **A2 PORTOWANE** (§8) |
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
| `SiegeWallOpts.kind?: 'palisada' \| 'mur'` + `resolved.kind ?? 'mur'` | `:22-33`, `:1189-1199` | SC | **A2 PORTOWANE** — dla `kind` pustego / `'mur'` wynik **bez zmian** (diff wyłącznie addytywny: nowa gałąź `if (resolved.kind === 'palisada') return buildPalisade(...)` przed `switch (civ)`) |
| `buildPalisade` (~110 LOC, pale + drewniana brama, kontrakt `userData` jak mur) | `:993-1093` | SC | **A2 PORTOWANE** (`siege_wall::build_palisade`) |
| `buildWallTower(material, tileSize, height)` (~85 LOC) | `:1102-1185` | SC | **A2 PORTOWANE** (`siege_towers::build_wall_tower`) |

### 2.3 `render/*` (14 plików; moduły poza `battle::*` — poza allowlistą A)

| plik | zmiana (diff) | klasa | moduł Rust | status |
|---|---|---|---|---|
| `units.ts` | `HIGHLIGHT_OPACITY` = `MAP_HEX_HIGHLIGHT_BASE_OPACITY` (0,35 = jak było), gwiazda dowódcy `applyUnitCommanderStar`, cache sprite'ów odznak stosu (bez przebudowy co sync) | SC (gwiazda) / K (stała, cache) | `units::*`, `models::unit_core` | **REPIN-3D-B** |
| `unitVeteranBadges.ts` | `applyUnitCommanderStar` (+33) | SC | `units::overlay` | REPIN-3D-B |
| `unitStatPlate.ts` | `PLATE_OWNER_ICON_SIZE` 0,20 → **0,80**·HEX_R | SC (zmiana obrazu) | `units::overlay::stat_plate` (P4-32) | **B2** (§9.5: łamie `overlay_web_parity`, fixtury przez Chromium — razem z `unitOwnerEmblem.ts`) |
| `unitOwnerEmblem.ts` | warianty dysku, klucz emblematu (+41/−12) | SC (canvas) | `raster`/`units` (P4-28/P4-32) | REPIN-3D-B |
| `cities.ts` | model osady wg stylu (+70/−4) | SC | `cities::*` (P4-21) | REPIN-3D-B |
| `improvements.ts` | fort/posterunek ×2 (`FORT_OUTPOST_MODEL_SCALE`) | SC | `models::improvements::registry` (P4-20) | **B1 PORTOWANE** (§9) |
| `resources.ts`, `styleResources.ts` | `RESOURCE_MODEL_SCALE = 2` → `userData.depositDisplayScale` | SC | `models::improvements::zasoby` (pomiar) | **B1 PORTOWANE** (§9) |
| `kopalnia-cyny/zlota-opus5.ts` | materiały/geometrie współdzielone (`markSharedTransient…`) | K (pamięć) | P4-20 | **B1 POTWIERDZONE bez zmiany obrazu** (§9.4) |
| `bronzeCityRoblox.ts`, `stoneCityRoblox.ts` | `markSharedTransientGeometry(geo)` | K (pamięć) | — | NIE-DOTYCZY obrazu |
| `transientObjectResources.ts`, `memDebug.ts` | nowe: zarządzanie zwalnianiem, `?memdebug=1` | K/GPU (dispose) | — | NIE-DOTYCZY (Rust: własność) |
| `buildHighlight.ts` | nowe stałe podświetleń (0,35 / 0,3 × 1,2) + filtr | SC (stałe) / LB (filtr) | nowy `models::misc::build_highlight` | **B1 PORTOWANE** (§9) |
| `rangeOverlay.ts` | `MINE_ELIGIBLE_TINT_OPACITY` 0,30 → 0,36 (0,3 × 1,2) | SC | `models::misc::range` (pomiar) | **B1 PORTOWANE** (§9) |
| `braz-rydwan-woly-opus5.ts` | tylko komentarz (Epoka) | K | — | NIE-DOTYCZY |

### 2.4 Logika oblężenia (`game/siege.ts`, `game/siegeDefenders.ts`, `game/city-*.ts`, `battle/formationRules.ts`, `battle/mapFieldBattle.ts`)

Wszystko **LB** → P6.13 / `rust-port/engine` (poza allowlistą tego tematu, zero zmian). Dla sceny ważne
jako źródło DTO: `cityFortificationKind` (palisada/mur → A2), `towerRows`/`towerMaterialFor`/`pickTowerTarget`
(A2–A3: rzędy i materiał wieżyczek jako DTO), `initialBattleSlots` (A4: pozycje `UnitSpawn`).

## 3. Kolejka partii (wycena = LOC weba do portu sceny + wektory)

| partia | zakres (§2) | moduły Rust | wycena |
|---|---|---|---|
| **A1** | #1–#7 | `orders` (nowy), `units` | **WYKONANA** w tej rundzie (~320 LOC Rust + generator) |
| **A2** | #8, #9, §2.2 (palisada + wieżyczka jako modele; umieszczenie wieżyczek z DTO `towerRows`) | `siege_wall`, nowy `siege_towers`, `units::place_siege_wall_fort` | **WYKONANA** (§8; ~650 LOC Rust + generator) |
| A3 (**następna**) | #10, #11 (burzenie wieżyczki `_destroyTowerAtRow` → `SiegeTower.destroyed` + `mesh.visible = false`, wołane z `_breachWallTile` `:7563`; pocisk `_fireOneTower`); + wyłom/brama PALISADY w `dynamics::breach_wall_tile` / `breach_gate` (grupa pali zamiast meshu segmentu — §8.4) | `siege_towers`, `dynamics` | ~60 LOC weba; wektory jak cz. 4 + palisada |
| A4 | regeneracja wektorów cz. 3 (`units.json`) na nowym szyku #12 (scena bez zmian, zmienia się tylko DTO) | testy `battle3d_units` | generator cz. 3 na `origin/main`; ryzyko: dryf modeli `render/units.ts` (gwiazda dowódcy) → razem z REPIN-3D-B |
| A5 | regeneracja cz. 4–5 (`dynamics.json`, `picking.json`) na `origin/main`; usunięcie martwego `Fade` (Z-RP-3) | `dynamics`, `picking` | generator cz. 4–5; zmiana oczekiwana tylko w przypadkach „fade” |
| A6 | regeneracja cz. 1–2 (`siege_wall.json`, `field.json`) — kontrola, że `mur` bez zmian | — | tylko pomiar (oczekiwane 0 różnic, §2.2) |
| REPIN-3D-B | §2.3 (`render/*`) | `units`, `cities`, `overlays`, `models` | R-RUSTPORT-REPIN-3D-B-Q1: **B1 WYKONANA** (§9), kolejka B2…B4 (§9.5) |

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

## 8. Partia A2 — palisada jako forma muru, wieżyczki (R-RUSTPORT-REPIN-3D-A2-Q1, runda 1)

**Baza:** `rust-port/parity-v2` @ `776bede11` (renderer 439/0). **Web:** `origin/main` @ `5fa0c1a84`;
`git log c1581619f..origin/main -- gra/src/battle` = pusto (siegeWall.ts / battleScene.ts bez zmian od A1),
jedyna zmiana w zakresie §1: `game/siegeDefenders.ts` +5/−17 (`d4ca8b748`, Milicja bez strat ludności) — LB, §8.4.

### 8.1 Kod (`rust-port/renderer/src/battle/`)

- `siege_wall.rs`: `WallKind { Palisada, Mur }`, `SiegeWallOpts.kind: Option<WallKind>` (+ `with_kind`;
  `new`/`battle` = `None` = pole nieobecne), `WallStyle::Palisada` (poza `WALL_STYLES`), `SiegeWallUserData.fort_kind`
  (klucz `fortKind` po `gateOpen`, tylko palisada, web `:1091`), `build_palisade` (`:993-1093`).
  `build_siege_wall_style`: `if opts.kind == Some(Palisada) { return palisade(o) }` PRZED `match style`
  (= web `:1199` przed `switch`); dla `None`/`Mur` gałąź mur bez zmian — diff addytywny
  (`tests/battle3d_siege_wall.rs` 95 przypadków P4.36 nadal bit w bit; `repin3d_a2` sprawdza `mur` = brak = budowa cz. 1).
- `siege_towers.rs` (NOWY): `TowerMaterial`, `build_wall_tower` (`:1102-1185`, `userData.towerHeight/towerTopY` też na
  węźle korzenia), `SiegeTower { row, mesh, destroyed }`, `place_siege_towers(scene, wallCol, material, rows)`
  (`battleScene.ts:4053-4086`).
- `units.rs`: `FortKind { None, Palisada, Mur }` (+ `wall_kind()` = `:3985`), `FortDto { kind, tower_material, tower_rows }`,
  `place_siege_wall_fort` (`:3971-4044`: mur/palisada, potem wieżyczki po murze, `:4031`); `PlacedWall` + `fort_kind`, `towers`.
  `place_siege_wall` = `place_siege_wall_fort(.., &FortDto::none())` (bez zmiany zachowania; wywołania cz. 3–5 nietknięte).
- `mod.rs`: moduł + wiersz tabeli + re-eksporty. `Cargo.toml`/`Cargo.lock` bez zmian.

### 8.2 Kwirki weba przeniesione 1:1 (zmierzone na uruchomionym webie)

1. **Cache geometrii pali po `h.toFixed(3)`** (`:1007-1017`): pal o wysokości z tym samym kluczem co wcześniejszy dostaje
   JEGO geometrię (inną wysokość), pozycja `hv/2` własna. Wektory: 97 trafień cache (`cacheHits`) w 20 przypadkach sweep.
2. **`tower.clone(true)` → `rotation = (−0, 0, −0)`**: `Object3D.copy` robi `quaternion.copy`, którego callback
   przelicza Euler z kwaternionu (`atan2(−0, 1) = −0`); Rust: `rotation = euler_from_quat(quaternion)` na każdym
   sklonowanym węźle (`units_kamien::kit::euler_from_quat`). Macierze bez zmian; `dumpTree` haszuje Euler.
3. **Klony dzielą materiały** (three `clone` trzyma referencje): `graft_clone` przemapowuje sloty na materiały
   pierwszej kopii (scena `game`: 16/11 materiałów zamiast 16 + 3·39).

### 8.3 Wektory, testy, mutacje

Generator `tests/repin3d_fixtures/gen_a2.ts` (bundler `build_a1.mjs` BEZ zmian: `node build_a1.mjs gen_a2`), wynik
`a2.json` (1 524 929 B, sha256 `66549532…`); README tam. Przypadki: `walls` 36 (12 kluczy civ × {brak, mur, palisada},
rozmiar gry + `attachRowBreachPanels`; generator sam asertuje `sig(mur) = sig(brak)` na webie), `palisades` 20
(N−1/N/N+1 wokół bramy: `len-1`, `no-side`, `len-3`, `len-4`; `gate-zero/half`, `tile-zero/neg`, `len-neg`, NaN
wysokości/kafla/długości/bramy, `len-eps` = granica pętli `sx < L/2 − 0,01·T`, `cache`), `towers` 18 (2 materiały ×
{gra, 0,5/1,8, 1,3/4,4, 0, H=0, ujemny, NaN×2, ∞}), `place` 27 (`_placeSiegeWall` → `_placeSiegeTowers` na
`Object.create(BattleScene.prototype)` z PRAWDZIWYMI `towerMaterialFor`/`towerRows`/`miasto-params.json`; 7 układów:
gra, pas, 1 rząd, 3 rzędy, 4 rzędy bez bramy, brama na 1. wieżyczce, `wallCol = −1`; × fortKind {none, mur, palisada}).

`cargo test --locked --test repin3d_a2`: **4/4 ok**, 0 różnic (checks: walls 17 244 + 16 812 skalarów, palisades
1 375 + 385, towers 477 + 72, place 4 937 + 3 005; 248 wieżyczek). Test jednostkowy
`siege_towers::tests::clones_share_the_first_copy_materials`. Porównanie = pełny strumień bajtów `dumpTree`
(rodzaj, rodzic, p/r/q/s, macierz świata, cienie, widoczność, materiał, geometria) + kontrakt `userData`.

**Mutacje** `tests/repin3d_fixtures/mutate_a2.py`: 49 mutantów (dyspozycja `kind`, gałąź `WallStyle::Palisada`,
`fortKind`, każda gałąź `build_palisade` w tym pętla/brama/klucz/cache/indeks materiału, `FortKind::wall_kind`,
`place_siege_wall_fort`, obie gałęzie materiału wieżyczki i ich pętle, `null` materiału, pozycja/wiersz/flaga klonu,
współdzielenie materiałów, Euler klonu). Pierwszy przebieg 48/49 — przeżył „segment loop bound” (`sx < L/2` zamiast
`sx < L/2 − 0,01·T`; brak przypadku z ostatnim kaflem w marginesie 1%) → dodany przypadek `len-eps` (6,005 kafla),
wektory zregenerowane i ponownie zweryfikowane; przebieg końcowy **49/49** (`dowody/mutate-a2-r1-part{1,2}.txt`).
Ramiona `NodeKind::LineLoop/Sprite` w `graft_clone` są nieosiągalne (wieżyczka ma tylko Group/Mesh) — dowód
równoważności: `build_wall_tower` tworzy wyłącznie `Scene::mesh`/korzeń `Group`.

**Niezależny weryfikator:** 2 katalogi `mktemp -d` (osobny `npm install`, osobny `git archive`): A = pełne `gra/src` +
`gra/data` (66 MB), B = tylko 167 plików z `a2_web_inputs.txt` (wejścia `metafile` esbuild, **6,5 MB ≤ 10 MB**) →
`a2.json` i `gen_a2.mjs` identyczne bajt w bajt, = repo (`dowody/verify-gen-a2-r1.txt`). Kopie usunięte jawnymi ścieżkami.

### 8.4 ZAŁOŻENIA i dryf

- **Z-RP-A2-1 (DTO):** `towerMaterialFor`, `towerRows`, `strongestRangedUnitForEra`, `towerRangeFor`, odstęp z
  `miasto-params.json` i `cityFortificationKind` to logika (P6.13, `game/city-towers.ts`, `city-fortification.ts`) —
  NIE zportowane; scena dostaje `FortDto { kind, tower_material, tower_rows }`, w testach = dokładnie to, co policzył web.
- **Z-RP-A2-2 (konstruktor):** `build_battle_scene_with_units` nadal stawia mur przez `place_siege_wall` (= `fortKind 'none'`:
  mur wg cywilizacji, zero wieżyczek — identycznie jak web z `'none'`). Pole `fortKind` w `BattleUnitsOpts` → A4
  (razem z regeneracją wektorów cz. 3; zmiana pola struktury łamałaby testy cz. 3–5 spoza allowlisty).
- **Z-RP-A2-3 (`userData` klonu):** three kopiuje `userData` przez JSON; NaN/∞ → `null`. W grze `towerHeight = 4,375`,
  `towerTopY = 4,8125` (stałe `TILE_S = 1`, `2,5`) — round-trip JSON = tożsamość; brzegi NaN/∞ testowane na
  `build_wall_tower` (bez klonu).
- **Z-RP-A2-4 (materiał spoza typu):** `buildWallTower` z napisem innym niż `'kamien'` idzie gałęzią drewnianą; enum Rust
  dopuszcza tylko 2 wartości (typ TS też) — brak przypadku.
- **Dryf do A3/A4 (reguły oblężenia weba, kontekst właściciela):** (a) palisada ma kafle jako GRUPY pali —
  `dynamics::breach_wall_tile` ukrywa `rowWallMeshes[row]` (tu: grupa pali) — zachowanie na palisadzie NIE_ZMIERZONO (A3); ponadto wyłom muru burzy też
  wieżyczkę (`_destroyTowerAtRow` z `_breachWallTile` `:7563`) — A3; (b) `isSiegeTower` (`:1516`, `:6088`, wieże
  oblężnicze jako jednostki) i Milicja (`siegeDefenders.ts`, `d4ca8b748`) = LB (P6.13) — dla sceny tylko DTO jednostek → A4;
  (c) `_fireSiegeTowers`/`_fireOneTower` (pocisk z `(x − 0,5, 4,2, z)`) — A3.
- Ocena wizualna GPU: **NIE_ZMIERZONO** (brak `/dev/dri`; nie blokuje). Do oceny wzrokiem: pale palisady (2 rzędy,
  szpice), drewniana brama ze słupami i poprzeczką, wieżyczki co 4 kafle wysunięte o pół kafla na stronę atakującego,
  kamienne przy murze / drewniane przy palisadzie.

### 8.5 Bramy (surowe logi: `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-3D-A2-Q1/dowody/`)

```text
# rustc 1.97.0; CARGO_INCREMENTAL=0, CARGO_PROFILE_DEV_DEBUG=0, CARGO_PROFILE_TEST_DEBUG=0
## $ cargo fmt --all -- --check                                   EXIT=0
## $ cargo clippy --locked --all-targets -- -D warnings            EXIT=0
## $ cargo test --locked --no-fail-fast   passed=444 failed=0 binaries=58   EXIT=0   (baza 776bede11: 439)
## $ cargo +1.87.0 test --locked --test repin3d_a2 --test repin3d_a1   4 + 6 passed   EXIT=0
## $ cargo +1.87.0 test --locked --lib battle::siege                   5 passed       EXIT=0
## $ python3 tests/repin3d_fixtures/mutate_a2.py (RANGE 0:25 + 25:60)   KILLED 25/25 + 24/24 = 49/49   EXIT=0
## $ sha256sum -c tests/repin3d_fixtures/MANIFEST.sha256   9 OK
## generator 2 katalogi: a2.json 66549532… = 66549532… = repo
```

`cargo clippy --features gpu`: NIE_ZMIERZONO (A2 nie dotyka kodu za cechą `gpu`).

### 8.6 Kolejka

A3 (następna): `_destroyTowerAtRow` + `_fireOneTower` + wyłom/brama palisady w `dynamics` (§3). Potem A4 (wektory cz. 3,
`fortKind` w konstruktorze), A5, A6, REPIN-3D-B.

## 9. Partia B1 — stałe podświetleń, odcień kopalni, skala złóż i fortów (R-RUSTPORT-REPIN-3D-B-Q1, runda 1)

**Baza:** `rust-port/parity-v2` @ `65e81ae4d` (renderer 444/0, A1+A2). **Web:** `origin/main` @ `86d510c66`.
Pomiar dryfu: `git diff --numstat edb8fb56..origin/main -- gra/src/render` = 17 plików (jak §2.3 + `units.ts` +72/−46,
`unitOwnerEmblem.ts` +41/−12, `unitVeteranBadges.ts` +36, `cities.ts` +70/−4, `memDebug.ts` +59, `transientObjectResources.ts` +68).
Partia A3 (równoległa) nie dotyka żadnego pliku B1 (B1: wyłącznie `src/models/**` + nowe pliki testów/fixtur `*_b*`/`*B*`).

### 9.1 Kod (ścieżki zmierzone `grep` stałych w `rust-port/renderer/src`)

- `models/misc/build_highlight.rs` (NOWY, `buildHighlight.ts:1-28`): 5 stałych (`IMPROVEMENT_BUILD_HIGHLIGHT_OPACITY =
  0,35 × 1,2`, `MINE_BUILD_HIGHLIGHT_OPACITY = 0,3 × 1,2` — wyrażenia jak w webie, nie literały), `filter_build_highlight_hexes`
  (klucz `${q},${r}:${key}` przez `js_num` = V8 `Number.prototype.toString`, kolejność `Array.filter`).
- `models/misc/range.rs`: `MINE_ELIGIBLE_TINT_OPACITY = MINE_BUILD_HIGHLIGHT_OPACITY` (web `rangeOverlay.ts:477`; pin 0,30).
- `models/improvements/registry.rs`: `FORT_OUTPOST_MODEL_SCALE = 2`, `FORT_OUTPOST_BASE_SCALE = 0,5`; sektor forta mnoży
  przez `0,5 × 2` (`improvements.ts:398-399`, `:507`).
- `models/improvements/zasoby.rs`: `RESOURCE_MODEL_SCALE = 2` (`resources.ts:18`); `build_styled_resource_overlay` =
  baza (dawna funkcja, bez zmian) + `depositDisplayScale = (dds || 1) × 2` (`styleResources.ts:448-452`): koń 2 → **4**,
  pozostałe złoża brak → **2**. Ścieżka nie `decor` ani `overlays.rs` (dispatch „wg pomiaru”): symbole żyją w `models/**`.
- `Cargo.toml`/`Cargo.lock` bez zmian. `units/**`, `cities/**`, `overlays.rs`, `decor/**` w B1 bez zmian.

### 9.2 Wektory

`tests/repin3d_fixtures/gen_b1.ts` → `b1.json` (`README_B.md`; wejścia esbuild 45 plików 2,9 MB ≤ 10 MB): stałe (10, `to_bits`),
`filter` (14: puste, trafienie/pudło, duplikaty, `−0`, NaN, ±∞, ułamki, `1e-7`, `1e+21`, pusty klucz, `:` w kluczu, przekątna
9 heksów z trafieniami na końcach i poza zakresem = N−1/N/N+1), `jsnum` (18 granic notacji V8), `deposit` (8 `Nakladka` ×
13 `zloze` = 104: klucze `userData` + `depositDisplayScale`). `cargo test --test repin3d_b1`: 4/4, 0 różnic (constants 11
skalarów, filter 49 + 30, deposit 202 + 98).

**ZAŁOŻENIE Z-RP-B-1 (fixtury pinu poza allowlistą — niezbędne, uzasadnienie):** zmiana obrazu łamie wektory pinu
`tests/improvements_web_parity.rs` (fort, złoża) i `tests/misc_web_parity.rs` (odcień kopalni) — bez nich `cargo test` nie
jest zielony. Pliki `.rs` testów NIETKNIĘTE; zregenerowane WYŁĄCZNIE fixtury JSON ich własnymi, niezmienionymi
generatorami (`tests/fixtures/improvements/gen.ts`, `tests/fixtures/misc/gen.ts`) na `origin/main` zamiast `edb8fb56`.
Diff względem pinu (porównanie liści JSON) = dokładnie oczekiwane przypadki: improvements `models.json` 32 × `res:*`
(klucz `depositDisplayScale`) + `sect-full:mix-mask5`; `sigs.json` 7 układów sektorów z fortem/posterunkiem; `legacy`,
`protokeys`, `data` bajt w bajt; misc `overlays.json` tylko `styles.mine` + 51 przypadków `range` stylu `mine`;
`models.json`, `siege.json` bajt w bajt (SHA = README misc). README fixtur pinu NIE edytowane: SHA `overlays.json` w
`tests/fixtures/misc/README.md` (`d590e026…`) jest teraz nieaktualne (nowe `dc62fa14…`) — do poprawy przy integracji / A6.

### 9.3 Mutacje i weryfikator

`tests/repin3d_fixtures/mutate_b1.py` (testy: `repin3d_b1` + `improvements_web_parity` + `misc_web_parity`): 21 mutantów
w r1 — 20 zabitych, 1 przeżył: „fort factor y only” (usunięte `n.scale.y *= f`) = **równoważny**: `f = 0,5 × 2 = 1` dokładnie,
`x × 1,0 = x` bit w bit (IEEE-754); usunięty z listy z dowodem w docstringu. Drugi równoważny (nie na liście): strażnik `|| 1`
(`filter(v ≠ 0 ∧ ¬NaN)`) — baza pisze `depositDisplayScale` tylko jako `2,0` (`depo2`) albo wcale. Wynik końcowy **20/20**
(`dowody/mutate-b1-r1-part{1,2}.txt`). Niezależny weryfikator: 2 katalogi `mktemp -d` (osobne `npm install`, osobne
`git archive`) → `b1.json`, improvements `models/sigs.json`, misc `overlays.json` identyczne SHA = repo (`dowody/verify-gen-b1-r1.txt`).

### 9.4 Potwierdzone „bez zmiany obrazu” (pkt 5 dispatchu)

- `kopalnia-cyny/zlota-opus5.ts`: `markSharedTransient{Geometry,Material}` ustawia tylko flagę `userData` geometrii/materiału
  (`transientObjectResources.ts:7-16`, zwalnianie) — modele `imp:kopalnia_*` w regenerowanym `improvements/models.json` = pin.
- `braz-rydwan-woly-opus5.ts`: tylko komentarz (Epoka) — diff = 2 linie komentarza.
- `transientObjectResources.ts`, `memDebug.ts`: zarządzanie zwalnianiem / `?memdebug=1` — K/GPU, Rust: własność; NIE-DOTYCZY.
- `bronzeCityRoblox.ts`, `stoneCityRoblox.ts`: `markSharedTransientGeometry` (jw.) — wektory `cities` na `origin/main`
  NIE_ZMIERZONO (→ B4 razem z `cities.ts`).

### 9.5 Kolejka B2…B4

| partia | zakres | moduły Rust | uwagi |
|---|---|---|---|
| **B2** (zrobione, §10) | `unitStatPlate.ts` `PLATE_OWNER_ICON_SIZE` 0,80 + `unitOwnerEmblem.ts` (warianty dysku `ringColorFor`/`normalizeRingHex`, klucz emblematu, `883afa6da`) | `units::overlay::{stat_plate, emblem}` | zmiana samej stałej zmierzona w r1 i cofnięta: łamie `overlay_web_parity` (5 testów: drzewa + tekstury); fixtury `overlay` wymagają headless Chromium 141 (playwright) — jedna regeneracja razem z emblematem |
| **B3** (gwiazda dowódcy zrobiona, §10; reszta → §10.5) | `unitVeteranBadges.ts` `applyUnitCommanderStar` (+33), `units.ts` gwiazda dowódcy + cache odznak stosu (`:6199-6290`), `HIGHLIGHT_OPACITY = MAP_HEX_HIGHLIGHT_BASE_OPACITY` (= 0,35, wartość bez zmian) | `units::overlay`, `units::*` | po B2 (wspólne fixtury `overlay`) |
| **B4** | `cities.ts` (+70/−4: `registerOwnedMeshResources` + `CityRenderer`; wg nagłówków hunków głównie zwalnianie M1 `5d9534e0b`; zmiana obrazu NIE_ZMIERZONO), `bronze/stoneCityRoblox.ts` | `cities::*` | regeneracja `tests/fixtures/cities` na `origin/main` rozstrzygnie SC vs K |

Ocena wizualna GPU: **NIE_ZMIERZONO** (brak `/dev/dri`; nie blokuje). Do oceny wzrokiem: forty/posterunki 2× większe w
sektorze, złoża 2× większe na mapie świata (koń 4×), podświetlenie kopalni nieco mocniejsze (0,36).

### 9.6 Bramy (surowe logi: `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-3D-B-Q1/dowody/`)

```text
# rustc 1.97.0; CARGO_INCREMENTAL=0, CARGO_PROFILE_DEV_DEBUG=0, CARGO_PROFILE_TEST_DEBUG=0
## $ cargo fmt --all -- --check                                   EXIT=0
## $ cargo clippy --locked --all-targets -- -D warnings            EXIT=0
## $ cargo test --locked --no-fail-fast   passed=448 failed=0 binaries=59   EXIT=0   (baza 65e81ae4d: 444)
## $ cargo +1.87.0 test --locked --test repin3d_b1 --test improvements_web_parity --test misc_web_parity   4 + 3 + 11   EXIT=0
## $ python3 tests/repin3d_fixtures/mutate_b1.py (RANGE 0:11 + 11:30)   11/11 + 9/10 (1 równoważny) → 20/20
## $ sha256sum -c tests/repin3d_fixtures/MANIFEST_B.sha256   4 OK
## generator 2 katalogi: b1.json fa57d2dd… = fa57d2dd… = repo
```

## 10. Partie B2 + B3 — obwódka medalionu, ikona właściciela 0,80, gwiazda dowódcy (R-RUSTPORT-REPIN-3D-B2-Q1, runda 1)

**Baza:** `rust-port/parity-v2` @ `8d74519c2` (renderer 448/0, B1). **Web:** `origin/main` @ `86d510c66` (zmierzone
`git rev-parse origin/main`). Pomiar dryfu (`git diff edb8fb56..origin/main`): `unitOwnerEmblem.ts` +41/−12,
`unitStatPlate.ts` 1 stała + komentarz, `unitVeteranBadges.ts` +36, `units.ts` +72/−46; plików kluczy atlasu
(`cityMapStatChip.ts`, `zoomLod.ts`, `workerFieldOverlay.ts`, `unitUpgradeBadges.ts`) dryf = 0. A3 (`src/battle/**`) i
B4 (`src/cities/**`) nietknięte.

### 10.1 Kod

- `raster/atlas/keys.rs`: `OwnerEmblemContext.ring_hex` (`ringHex?: string | null`, `:100-106`), NOWE
  `normalize_ring_hex` (`:249-253`: JS `trim` → `/^#[0-9a-fA-F]{6}$/` → `toLowerCase`, `''`/`null` → `None`),
  `owner_emblem_key` → `civ:<civ>:<era>:<ring>` (`<ring>` = znormalizowana barwa albo `brass`, `:330-339`).
- `units/overlay/emblem.rs`: to samo pole i klucz (re-eksport `normalize_ring_hex` — jedna implementacja), NOWE
  `ring_color_for` (`:260-263`: tylko wariant `civ` bierze `ringHex`, miasto-państwo/barbarzyńcy stałe `RING_COLOR`,
  zła barwa → mosiądz), `draw_disc(ctx, ring_color)`, `draw_fallback_glyph(ctx, variant, ring_color)`, pierścień
  nad portretem w barwie cywilizacji (`:419-426`; pin: zawsze mosiądz). Sygnet `civ` nadal barwiony mosiądzem
  (`prepareSvgForCanvas(…, RING_COLOR.civ)`, `:434`, bez zmian w webie).
- `units/overlay/stat_plate.rs`: `PLATE_OWNER_ICON_SIZE` 0,20 → **0,80·HEX_R**; `PLATE_OWNER_X` liczony z niej
  (−0,401 → −0,701·HEX_R, prawa krawędź ikony przy lewej krawędzi tabliczki).
- `units/overlay/veteran_badges.rs` (B3): `build_commander_star` (`applyUnitCommanderStar`, `:275-301`: grupa
  `commanderStarBadge` na `VETERAN_BADGE_RESERVED_Y + 0,25·HEX_R`, odchylenie jak listwa, obrys
  `VETERAN_STAR_OUTLINE_SCALE × 1,6` na z = `STAR_OUTLINE_OFFSET_Z`, gwiazda 1,6; wspólna geometria i materiały),
  `commander_star_update` (idempotencja `sync()`: obecna + chciana = ten sam obiekt, brak przebudowy),
  `COMMANDER_STAR_HIT_UD`; `units/overlay/mod.rs`: `OverlayNode.commander_star_hit`.
- `Cargo.*` bez zmian.

**ZAŁOŻENIE Z-RP-B2-1 (pliki pinu poza listą — niezbędne):** jak Z-RP-B-1. Zmiana klucza i stałej łamie wektory pinu
`overlay_web_parity` (5 testów) i `atlas_keys` (`related_keys_match_web`). Zregenerowane WYŁĄCZNIE dane, ich własnymi
NIEZMIENIONYMI generatorami na `origin/main` (headless Chromium 141 przez `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`
— domyślne `chromium.launch` znajduje `chromium-1194`; pin odtworzony najpierw bajt w bajt: `MANIFEST.sha256`
= `7d70d6e1…` z README fixtur): `overlay/overlay.json` + `MANIFEST.sha256` (diff liści = 104 klucze `…:brass`, stała,
58 bitów skali + 29 pozycji ikony, 22 + 1 klucze w `userData`, 8 kluczy tekstur; `ref/*.rgba`, `input/*` bajt w bajt),
`overlay/golden.tsv` (`OVERLAY_BLESS=1`; zmienił się tylko tekst klucza, wszystkie hashe FNV identyczne),
`atlas/atlas_keys.json` (diff = tylko 304 `emblemKeys[].key`; pozostałe 13 sekcji bajt w bajt) + wiersz `SHA256SUMS`.
W `.rs` pinu (`overlay_web_parity.rs`, `atlas_keys.rs`) WYŁĄCZNIE dopisane `ring_hex: None` w 3 literałach struktury
(pole jest nowe; bez tego kompilacja testów pada) — żadna asercja nie zmieniona. README fixtur pinu NIE edytowane:
SHA `atlas_keys.json` w `fixtures/atlas/README.md` (`8d64d5c0…`; nowe `e45004b9…`) i `MANIFEST` w
`fixtures/overlay/README.md` (`7d70d6e1…`; nowe `f579a315…`) są nieaktualne — do poprawy przy integracji / A6 (jak Z-RP-B-1).

**ZAŁOŻENIE Z-RP-B2-2:** barwę `ringHex` liczy kompozytor (`main.ts:3863-3865` `civRingHexFn` = `'#' +
civColorFn(id).toString(16).padStart(6,'0')`, `:9240-9242` `null` dla barbarzyńców i miast-państw) — w Rust pole DTO
wejścia, jak `civ_id`/`era`. Flagę gwiazdy dowódcy (`units.ts:6147` `vitals ? vitals.hasCommander : unit.isGeneral
=== true`) też podaje wołający (UnitRenderer nie jest zportowany).

### 10.2 Wektory (`tests/repin3d_fixtures/README_B.md`)

`gen_b2.ts`/`gen_b2.mjs` (harness `overlay/gen.mjs`, Chromium 141 + node, wynik node = Chromium wymagany; zasoby =
bajty `overlay/input/*`, inaczej abort) → `b2.json` + 19 `b2_ref/*.rgba`; `gen_b3.ts` (node) → `b3.json`.
`cargo test --test repin3d_b2`: 8/8 — klucze 168 × {units, atlas} = web (30 z barwą, 138 → `brass`/`cs:`/`barb`;
brzegi: `trim` JS vs U+0085/U+FEFF/U+3000, długość 6/7/8 = N−1/N/N+1, pełnoszerokie cyfry, `\0`, wielkie litery),
stała bit w bit, ikona tabliczki (3 × pozycja/skala bity, klucz), tekstury 12 (+7 stanów `initial`) w progach
RR-T8 (SSIM 0,9907–0,9939, mean_abs ≤ 1,16, px>16 ≤ 3,24 %, sonda obwódki 4 punkty = 0 różnicy), gwiazda
dowódcy 10 stanów × poddrzewo bit w bit + 8 sekwencji `sync()` + współistnienie z gwiazdkami weterana.

### 10.3 Mutacje i weryfikator

`tests/repin3d_fixtures/mutate_b2.py` (testy `repin3d_b2` + `overlay_web_parity` + `atlas_keys`): **30/30 zabitych**
(`dowody/mutate-b2-r1-part{1,2}.txt`): stała i kotwica ikony, każda gałąź `normalize_ring_hex` (trim JS/Rust/brak,
długość, `#`, hex vs alnum, lowercase), klucz atlasu i medalionu (bez barwy, surowa barwa, tekst fallbacku),
`ring_color_for` (każdy wariant, fallback, bez normalizacji, pin), dysk/glif/pierścień nad portretem w mosiądzu,
gwiazda dowódcy (uniesienie, skala, obrys, z, odchylenie, znaczniki trafień, materiał, reguła dodaj/usuń).
Równoważny (nie na liście): filtr `!r.is_empty()` — `""` po `trim` ma długość 0 ≠ 7 → `None` tak samo.
Niezależny weryfikator: drugi `mktemp -d` (osobny `npm install`, osobny `git archive origin/main`) → `overlay.json`,
`MANIFEST.sha256`, `atlas_keys.json`, `b2.json`, `b3.json`, 19 `b2_ref` — wszystkie SHA = repo
(`dowody/verify-gen-b2-r1.txt`).

### 10.4 Bez zmiany obrazu / poza rendererem (NIE-DOTYCZY w tej partii)

- `units.ts` `HIGHLIGHT_OPACITY = MAP_HEX_HIGHLIGHT_BASE_OPACITY` (0,35 = pin, wartość bez zmian) i
  `setHighlight(hexes, opacity = HIGHLIGHT_OPACITY)`: dysk podświetlenia UnitRenderera nie ma odpowiednika w Rust
  (`grep HIGHLIGHT_OPACITY src` = tylko stałe `build_highlight`, B1); stała źródłowa zportowana w B1.
- `units.ts` cache sprite'ów odznak stosu (`stackBadgeCount`) i ikon cierpienia (`_syncSufferingIconMap`,
  `sufferingIconPaired`, `_disposeOverlaySprite`): zarządzanie zasobami bez zmiany obrazu (te same sprite'y, pozycje i
  skale co pin, tylko bez przebudowy co `sync()`); w Rust brak UnitRenderera / stosów → przy porcie kompozytora.
- `units.ts:1612` — tylko komentarz.

### 10.5 Kolejka po B2/B3

| partia | zakres | uwagi |
|---|---|---|
| **B4** | `cities.ts`, `bronze/stoneCityRoblox.ts` (§9.5) | bez zmian planu |
| **B3-rest** | `HIGHLIGHT_OPACITY`/`setHighlight(opacity)`, cache odznak stosu i ikon cierpienia | przy porcie UnitRenderera (kompozytor `units::*`); zmiana obrazu = 0 |

Ocena wizualna GPU: **NIE_ZMIERZONO** (brak `/dev/dri`; nie blokuje). Do oceny wzrokiem: medalion właściciela 4×
większy z lewej tabliczki; obwódka w barwie cywilizacji (miasta-państwa i barbarzyńcy bez zmian); większa gwiazda
dowódcy nad listwą odznak.

### 10.6 Bramy (surowe logi: `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-3D-B2-Q1/dowody/`)

```text
# rustc 1.97.0; CARGO_INCREMENTAL=0, CARGO_PROFILE_DEV_DEBUG=0, CARGO_PROFILE_TEST_DEBUG=0
## $ cargo fmt --all -- --check                                   EXIT=0
## $ cargo clippy --locked --all-targets -- -D warnings            EXIT=0
## $ cargo test --locked --no-fail-fast   passed=456 failed=0 binaries=60   EXIT=0   (baza 8d74519c2: 448)
## $ cargo +1.87.0 test --locked --test repin3d_b2 --test overlay_web_parity --test atlas_keys   8 + 11 + 7   EXIT=0
## $ python3 tests/repin3d_fixtures/mutate_b2.py (RANGE 0:4 + 4:40)   4/4 + 26/26 = 30/30   EXIT=0
## $ sha256sum -c tests/repin3d_fixtures/MANIFEST_B.sha256   29 OK
## generator 2 katalogi: b2.json e8297e7b… = e8297e7b… = repo; overlay.json a37e1ae2…; atlas_keys.json e45004b9…
```
