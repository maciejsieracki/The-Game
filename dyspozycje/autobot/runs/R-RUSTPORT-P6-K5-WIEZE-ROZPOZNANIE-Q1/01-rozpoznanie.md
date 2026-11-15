# 01-rozpoznanie: K5-LOOP-WIEZE (#96) — wieże oblężnicze, pick_tower_target, harmonogram 180 ms

STATUS: PASS (rozpoznanie wykonane, tryb tylko odczyt, bez kodu)
DOMAIN: GAME
TEMAT: #96 K5-LOOP-WIEZE — co z `_fireSiegeTowers` z pinu jest na parity, a czego brakuje. Bez kodu.
GOAL: tabela krok po kroku: web (pin `07d2fbd72`) → Rust (baza `62ff9de35`) z oceną OK / CZĘŚCIOWO / BRAK / ROZBIEŻNE / PREZENTACJA / NIE_ZMIERZONO.
ZMIANY/COMMIT: wyłącznie `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5-WIEZE-ROZPOZNANIE-Q1/01-rozpoznanie.md`. Zero zmian w `gra/` i `rust-port/`.
TESTY: NIE_URUCHAMIANO (dispatch: tryb tylko odczyt; bez cargo/npm). Istniejące testy wskazano tylko jako dowód istnienia, nie jako wynik.
BLOKADY: brak. Żadna luka nie wymaga decyzji gameplay: każdą regułę rozstrzyga web (patrz sekcja 4).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet) — spot-check tabeli z sekcji 2 względem linii pinu i `62ff9de35`. Potem decyzja orkiestratora o kolejności #98 przed #113 (sekcja 5).
DEPLOY/PUSH: NIE WYKONANO (dispatch: bez push na parity, bez integracji).

## 0. Źródła i zastrzeżenia

- Web: `git show 07d2fbd72:gra/src/battle/battleScene.ts` (plik sprawdzony, numery linii zweryfikowane `grep`/`sed`), pin `gra/src/game/city-towers.ts:141-157` (`pickTowerTarget`).
- Rust: `git show 62ff9de35:rust-port/engine/src/domain/...` oraz `rust-port/renderer/src/battle/siege_towers.rs`. Worktree roboczy ma HEAD `9cbadc54a`, który NIE zawiera `62ff9de35`; dlatego cały odczyt Rust idzie przez `git show 62ff9de35`, a nie z drzewa roboczego.
- Stałe web: `RANGED_FLY_MS = 380` (:1012), `STEP_GAP_MS = 70` (:1011), `stagger += 180` (:4218).

## 1. Pinowy przebieg `_fireSiegeTowers` (web, 07d2fbd72)

1. `_beginTurn` (:5641-5643): po `_counterBudget.beginTurn()` warunek `siegeWallCol >= 0` → `_fireSiegeTowers()`.
2. Guard (:4209): `finished` || `siegeTowers.length === 0` || `!towerShooterRow` → return.
3. Pętla po `siegeTowers` w kolejności tablicy (:4214). Wieża `destroyed` → pomiń (:4215).
4. Wieża bez kafla (`!wallTileHp.has(t.row)`) → `_destroyTowerAtRow` (ustawia `destroyed`, ukrywa mesh, log `Wieza strzelnicza w wyłomie (rzad N) zburzona.`, :4194-4199), potem `continue` (:4216).
5. Pozostałe: `delay = stagger`; `stagger += 180` (:4217-4218); `_schedule(delay, () => _fireOneTower(t, …))` (:4219).
6. `_fireOneTower` (:4223): guard `finished || t.destroyed` (:4226).
7. Cele: `enemies = atk.filter(!dead && !fadingOut && !routed && !removed)` (:4227-4228).
8. `idx = pickTowerTarget({q: wallCol, r: t.row}, towerRange, enemies.map(q, r, hp: bu.hp))` (:4229-4233). `idx < 0` → return (:4234). `target = enemies[idx]` (:4235).
9. Strzelec syntetyczny (:4236-4246): `dead: true`, `morale: 0`, `stats: shooterRow`, `hp = Health ?? health ?? 1 || 1`, `kategoria = Typ ?? 'Distance'`, `nazwa = 'Wieza (' + (Jednostka ?? 'Strzelec') + ')'`.
10. Log `Wieza strzelnicza (rzad N) strzela do X.` (:4247). Pocisk, `_sfxShot`, `projectiles.push` (:4248-4261).
11. `_schedule(RANGED_FLY_MS, cb)` (:4262). Cb: `finished || target.dead || target.fadingOut` → return (:4263). `dmg = _singleBlow(shooter, target, true)` (:4264). `dmg > 0 && …` → `_spawnDamageLabel` (:4265).
12. `_singleBlow` (:8809) → `_resolveBlowOutcome` (wywołanie :9010, definicja :9019): morale, rout przed śmiercią, wstrząs sojuszników przy zabiciu.
13. Wyłom: `_breachWallTile` (:7646-7648) usuwa `wallTileHp` i wywołuje `_destroyTowerAtRow`. Oznacza to, że `destroyed` ustawia się w chwili wyłomu, nie dopiero przy następnej salwie.
14. `_placeSiegeTowers` (:4157-4190) ustawia `towerShooterRow = strongestRangedUnitForEra(...)` (:4167) i `towerRange = towerRangeFor(...)` (:4168).
15. `_schedule` (:9595-9606): w trakcie planowania AUTO (`_autoBatchPlanning`) wykonuje cb od razu; przy `finished` nie dodaje timera.

## 2. Tabela: web (pin) → Rust (62ff9de35) → status

Legenda: OK = zgodne strukturalnie; CZĘŚCIOWO = część zgodna; BRAK = nieobecne w ścieżce produkcyjnej lub w module; ROZBIEŻNE = obecne, ale inna semantyka; PREZENTACJA = efekt wizualny/dźwiękowy poza silnikiem; NIE_ZMIERZONO = nie sprawdzono.

| # | Krok (web) | Web (pin 07d2fbd72) | Rust (62ff9de35) | Status |
|---|---|---|---|---|
| 1 | Wywołanie z `_beginTurn` po budżecie kontrataków, warunek `siegeWallCol >= 0` | battleScene.ts:5641-5643 | siege_tactics_turnseq.rs:228-241 (`begin_turn`; `SeqEvent::FireSiegeTowers` :239, `env.fire_siege_towers` :240) | OK |
| 2 | Guard: `finished` / brak wież / brak strzelca | :4209 | siege_tactics_loop.rs:436-441 (`fire_siege_towers`): sprawdza brak wież i brak `tower_shot`, nie sprawdza `finished`. Skutek równoważny: przy `finished` `clock.schedule` zwraca Dropped (planning=false, siege_tactics_clock.rs:112-113) albo RunNow, a `tower_shoot` sprawdza `finished` (loop.rs:614) | OK (skutkowo) |
| 3 | Pętla po wieżach w kolejności, pominięcie `destroyed` | :4214-4215 | loop.rs:365-378 (`plan_tower_shots`): kolejność zgodna; brak flagi `destroyed` w stanie, pomijanie wyłącznie przez brak wiersza w `wall_tile_rows` | CZĘŚCIOWO |
| 4 | Wieża bez kafla → `_destroyTowerAtRow` (flaga, mesh, log) + continue | :4216, :4194-4199 | loop.rs:370-372: tylko `continue`, bez flagi, bez logu. Odpowiednik DTO po stronie renderera: renderer/src/battle/siege_towers.rs:338-352 (`destroy_tower_at_row`, zwraca linię logu) i :382-415 (`fire_siege_towers`). Renderer nie jest podpięty do silnika bitwy | ROZBIEŻNE (engine) |
| 5 | `stagger` 0, 180, 360 … tylko dla strzelających | :4217-4218 | loop.rs:370-375; `TOWER_STAGGER_MS = 180.0` (loop.rs:85) | OK |
| 6 | `_schedule(delay, _fireOneTower)` | :4219 | loop.rs:533-540 (`apply`, `SeqEvent::FireSiegeTowers`: `clock.schedule(p.ms, LoopTimer::TowerShot(p.tower), p.planning)`); siege_tactics_clock.rs:108-120 | OK |
| 7 | `_fireOneTower`: guard `finished \|\| t.destroyed` | :4226 | loop.rs:613-620 (`tower_shoot`): `finished` OK. Zamiast `destroyed` sprawdza `wall_tile_rows.contains(row)` na MIGAWCE pola z `SiegeEnv` (loop.rs:313). Nic w engine nie aktualizuje tej listy przy wyłomie (sekcja 3, pkt 21) | ROZBIEŻNE (wyłom w trakcie bitwy) |
| 8 | Filtr żywych atakujących: `!dead && !fadingOut && !routed && !removed` | :4227-4228 | loop.rs:382-402 (`pick_tower_for_row`): ten sam filtr; dodatkowo pomija jednostki bez komórki (`unit_cell` → None) | OK (różnica NIE_ZMIERZONO: web zakłada `q/r` zawsze obecne) |
| 9 | `pickTowerTarget(wieża, towerRange, enemies)`: pomija `d < 1` i `d > range`, remis po HP, potem pierwszy w liście | :4229-4232; city-towers.ts:141-157 | loop.rs:404 → siege_tactics_tower.rs:486-511 (`pick_tower_target`), typ `TowerTarget` :469. Testy wektorowe istnieją: tests/p6_tower_target.rs, tests/p6_tower_target_wiring.rs | OK (logika). hp: `c.hp` vs `bu.hp` NIE_ZMIERZONO (założenie równości pól) |
| 10 | `idx < 0` → return | :4233 | loop.rs:617-619 | OK |
| 11 | Mapowanie indeksu z listy filtrowanej na indeks w `atk` | :4234 | loop.rs:404 (`refs[k]`) | OK |
| 12 | Strzelec syntetyczny: `dead: true`, morale 0, kategoria, hp, stats | :4236-4246 | loop.rs:102 (`neutral_tower_shot_template`), :204 (`tower_shooter_kategoria`), :213 (`tower_shooter_hp`), :227 (`tower_shot_from_row`). Szablon liczony raz w setupie, nie per strzał | OK w module; wywołanie produkcyjne BRAK (pkt 13) |
| 13 | `towerShooterRow` (najmocniejsza jednostka dystansowa epoki obrońcy) i `towerRange` | :4166-4168; city-towers.ts (`strongestRangedUnitForEra`, `towerRangeFor`) | loop.rs:192-203 (`tower_setup_from_units`); city_towers.rs:186 (`strongest_ranged_unit_for_era`), :245 (`tower_range_for`). `tower_setup_from_units` nie ma wołającego w `rust-port/**/src` | OK w module; BRAK wiringu |
| 14 | Log `Wieza strzelnicza (rzad N) strzela do X.` | :4247 | Brak w silniku. Tekst istnieje w renderer/src/battle/siege_towers.rs:475-500 (`fire_one_tower`), nieużywany przez silnik | BRAK (log bitwy) |
| 15 | Pocisk z `(x − TILE_S·0.5, 4.2, z)` do celu, `_sfxShot`, `projectiles.push` | :4248-4261 | renderer/src/battle/siege_towers.rs:430-441 (`tower_shot_endpoints`), :475 (`fire_one_tower` → `launch_projectile`) | PREZENTACJA (poza gameplay) |
| 16 | `_schedule(RANGED_FLY_MS = 380, cb)` | :4262; :1012 | loop.rs:70-71 (`TOWER_FLY_MS = 380.0`), :623-626 (`clock.schedule(TOWER_FLY_MS, TowerHit(target))`) | OK |
| 17 | Cb: `finished \|\| target.dead \|\| target.fadingOut` → return | :4263 | loop.rs:633-641 (`tower_hit`) | OK |
| 18 | `_singleBlow(shooter, target, true)`: HP, zabicie | :4264 | loop.rs:246-272 (`tower_blow_on_target`: `single_blow_full` z `ranged = true`, zapis `hp`, `dead` przy `Outcome::Kill`); ProdBody::tower_blow loop.rs:961-970 | CZĘŚCIOWO (HP i zabicie OK; efekty z `_resolveBlowOutcome` niżej) |
| 19 | Efekty `_resolveBlowOutcome`: morale, rout przed śmiercią, wstrząs sojuszników przy zabiciu, `engaged` | :9019 (wywołane z :9010) | loop.rs:961-970: gdy `out.blow.outcome != Outcome::None`, dopisuje do `unported` wpis `"wieza-resolveBlowOutcome-efekty"`. Efekt NIE zastosowany | BRAK (= #109 / #147) |
| 20 | `_spawnDamageLabel` gdy `dmg > 0` i cel żyje | :4265 | brak w silniku (prezentacja) | PREZENTACJA |
| 21 | Wyłom w `_breachWallTile` → `wallTileHp.delete` + `_destroyTowerAtRow` | :7646-7648 | Silnik: brak. `breach_wall_tile` (siege_tactics_breach.rs:81) nie dotyka wież; `SiegeEnv.wall_tile_rows` nie jest modyfikowany (loop.rs:313). Renderer: renderer/src/battle/dynamics.rs:790-803 (`breach_wall_tile_fort` → `destroy_tower_at_row`) | BRAK w silniku (→ #98) |
| 22 | Log `Wieza strzelnicza w wyłomie …` | :4198 | Tekst w renderer/src/battle/siege_towers.rs:338-352; silnik nie emituje | BRAK w silniku |
| 23 | Wiring produkcyjny: `_placeSiegeTowers` buduje `siegeTowers`, `towerRows`, material | :4157-4190 | `SiegeEnv` konstruowany tylko w testach (loop.rs:1295); `city_towers::tower_rows` (city_towers.rs:77) bez wołającego produkcyjnego | BRAK (→ #113) |
| 24 | Wieże jako strefa zagrożenia dla AI (`siegeTowers` z pominięciem `destroyed`) | battleScene.ts:7928-7935 | siege_tactics_approach.rs:106-111: zagrożenie przychodzi jako wejście. Lista budowana u wołającego, a pominięcie zniszczonych zależy od pkt 21 | ROZBIEŻNE_ZALEŻNE (od #98); caller NIE_ZMIERZONO |

## 3. Co jest OK, co BRAK, co ROZBIEŻNE (zwięźle)

- OK: kolejność i odstępy (0, 180, 360 …), pickTowerTarget (logika i wektory), flight 380 ms, bramki `finished` i `target.dead/fadingOut`, `planning` jako odpowiednik `_autoBatchPlanning`, szablon strzelca i zasięg w module.
- BRAK w produkcji: wiring `SiegeEnv` (pkt 23), wywołanie `tower_setup_from_units` (pkt 13), efekty `_resolveBlowOutcome` od trafienia wieży (pkt 19), log bitwy (pkt 14, 22).
- ROZBIEŻNE: stan `destroyed` nie istnieje w silniku (pkt 4, 7). Wieża, która straci kafel w trakcie bitwy, w engine dalej strzela (sprawdzenie tylko na migawce `wall_tile_rows`). Web przestaje strzelać natychmiast (`destroyed` w `_breachWallTile`). Ta rozbieżność ujawni się po podpięciu (#113), jeśli #98 nie doda propagacji wyłomu do `SiegeEnv`.
- Ryzyko nazewnicze: `siege_tactics_tower.rs` ma `scene.tower_rows: BTreeSet<i64>` (rzędy z jednostką na wieży, odpowiednik `towerAtWallRows`), a `SiegeEnv.tower_rows: Vec<i64>` to rzędy `siegeTowers`. To dwa różne pojęcia o tej samej nazwie.

## 4. Zakres tematów i rozstrzygnięcie z webu

Każda luka ma rozstrzygnięcie w pinie, więc żadna nie wymaga pytania do właściciela. Nie ma pozycji typu "decyzja gameplay".

- Zakres #96 / #146 (pick_tower_target w fire_siege_towers): wg kodu w `62ff9de35` wybór celu w ścieżce strzału JEST już podpięty (loop.rs:382-404, :613-619). Zostaje: stan `destroyed` (pkt 4, 7) i wiring setupu (pkt 13). Tytuł #146 jest więc częściowo nieaktualny; warto go zaktualizować.
- #98 (K5-LOOP-WYLOM): propagacja wyłomu do `SiegeEnv` (pkt 4, 7, 21, 22, 24). To wymagany warunek przed #113.
- #109 / #147 (K5LOOP-OUTCOME): efekty `_resolveBlowOutcome` od trafienia wieży (pkt 19). Ten sam port dotyczy ciosów zwykłych jednostek.
- #113 (K5LOOP-WIRING): wiring `SiegeEnv` z `towerRows`, `wallTileRows`, `towerRange`, `tower_shot` (pkt 13, 23). Nie startować przed #98.
- Prezentacja (pkt 14, 15, 20, 22): renderer ma już DTO (renderer/src/battle/siege_towers.rs, REPIN-3D A3). To wiring rendera, nie gameplay.
- #97 (AUTO bez oblężenia): poza tą ścieżką, nie dotyczy wież.

## 5. Rekomendowana kolejność (dla orkiestratora)

1. #98 w zakresie propagacji wyłomu do `SiegeEnv` (`destroyed` jako stan, usunięcie wieży z planowania i z trafień w locie) — najpierw, bo bez tego #113 da błędne strzały po wyłomie.
2. #109 / #147 dla efektów `_resolveBlowOutcome` (wspólne z ciosami zwykłymi).
3. #113 jako wiring, z `tower_setup_from_units` i `tower_rows` z produkcji.

## 6. Pozycje NIE_ZMIERZONO

- `hp` celu: web `u.bu.hp`, Rust `c.hp`. Nie czytałem definicji `CombatUnit.hp` vs `bu.hp` w tej rundzie.
- Brak `unit_cell` (pkt 8): nie ustalono, czy w produkcji może wystąpić jednostka bez komórki.
- Konsument strefy zagrożenia (pkt 24): nie zlokalizowano wołającego `siege_tactics_approach` w produkcji.
- Kolejność timerów o tym samym `due` (wieże vs ruchy jednostek): wg kodu `clock` tie-break po `id`, ale nie zweryfikowano wektorem.
- Testów nie uruchamiano (tryb odczytu).
