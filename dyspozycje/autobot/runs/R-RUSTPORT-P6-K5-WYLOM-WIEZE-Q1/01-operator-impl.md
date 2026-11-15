# 01-operator-impl: R-RUSTPORT-P6-K5-WYLOM-WIEZE-Q1 (#98 K5-LOOP-WYLOM, zakres 1-3)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5-WYLOM-WIEZE-Q1 (#98 K5-LOOP-WYLOM: stan zniszczenia wieży przy wyłomie)
GOAL: wieża bez kafla muru przestaje planować i strzelać (pin :4214-4216, :4227); wyłom (`breach_wall_tile`) usuwa kafel i zburza wieżę w tym samym wywołaniu (pin :7646-7648); wektory pinu i test mutacji.
BAZA: `origin/rust-port/parity-v2` = d5a52a980 (gałąź lokalna `wip/R-RUSTPORT-P6-K5-WYLOM-WIEZE-Q1`, nie wypchnięta).

## ZMIANY / COMMIT

Allowlista (dispatch) i faktyczne zmiany:
- `rust-port/engine/src/domain/siege_tactics_breach.rs`: kod `breach_wall_tile` BEZ ZMIAN; zmieniony wyłącznie komentarz dokumentacyjny tej funkcji (pin :7646/:7647/:7648, reguła zburzenia wieży).
- `rust-port/engine/src/domain/siege_tactics_loop.rs`: import `WallState`; NOWA metoda `SiegeEnv::sync_wall_state(&mut self, &WallState)` (wall_tile_rows = klucze `wall_tile_hp`, wall_ever_breached); komentarze `plan_tower_shots` i `tower_shoot` (kod bez zmian). Patrz DECYZJA 2.
- NOWE `rust-port/engine/tests/p6_siege_wylom_tower.rs` (6 testów).
- NOWE `rust-port/engine/tests/p6_siege_wylom_gen.mjs` (generator wektorów z pinu) i `rust-port/engine/tests/p6_siege_wylom_vectors/vectors.json`. Patrz DECYZJA 4.
- NOWE ten plik.
- NIE zmieniono: `gra/**`, `rust-port/renderer/**`, `rust-port/view-model/**`, `bridge.rs`, `domain/mod.rs`, `Cargo.lock` (wygenerowany przez cargo, nieśledzony, NIE dodany do commita).

Commit: SHA w raporcie końcowym orkiestratora.

## DECYZJE (techniczne, bez pytania właściciela; web rozstrzyga)

1. Stan `destroyed` NIE jest jawną flagą w `SiegeEnv`/`WallState`, lecz wyprowadzany z żywych kafli: wieża na wierszu `r` jest zburzona wtedy, gdy `r` nie ma w `wall_tile_hp` (predykat `!wall_tile_hp.contains_key(&r)`; w pętli: `!wall_tile_rows.contains(&r)`). Podstawa w pinie: `wallTileHp` jest zapisywane tylko w :4053 (init), :10529 (reset replaya) i :7558 (`_attackWallTile`), a :7558 po HP<=0 natychmiast woła `_breachWallTile` (:7563), który kasuje klucz (:7646). Kafel nie wraca.
   Powód odejścia od dispatchu ("stan destroyed w SiegeEnv/ProdBody"): dodanie pola do `WallState` łamie literały w `tests/p6_siege_tactics_breach.rs` (:64, :393), a do `SiegeEnv` łamie literały w `tests/p6_siege_tactics_loop.rs` (:148) i `tests/p6_tower_target_wiring.rs` (:228). Wszystkie poza allowlistą.
2. `SiegeEnv::sync_wall_state` to jedyny most między pure `breach_wall_tile` a pętlą. Allowlista mówi "zmiany tylko w strukturze stanu wież i planowaniu"; nowa metoda dotyczy stanu wież i muru, ale jest nową funkcją w `siege_tactics_loop.rs`. FC: proszę ocenić, czy to mieści się w allowliście.
3. Dispatch: "breach_wall_tile usuwa kafel i ustawia destroyed w tym samym wywołaniu". Realizacja: jedno wywołanie usuwa klucz kafla (`wall_tile_hp.remove`, :7646) i ustawia `wall_ever_breached` (:7647); zburzenie wieży na tym wierszu wynika z tej samej zmiany (decyzja 1). Mutacja "usunięcie `remove`" (brak zburzenia) daje FAIL, patrz TESTY.
4. Wektory: `p6_siege_wylom_gen.mjs` WYKONUJE metody pinu `07d2fbd72` (`_destroyTowerAtRow` :4194-4199 cały; `_fireSiegeTowers` :4208-4219 cały; `_fireOneTower` :4223-4270 bez bloku wizualnego, cięcie od `const tw = cellToWorld` do `this.projectiles.push`; `_breachWallTile` :7638-7648, cięcie po `_destroyTowerAtRow`; `_schedule` :9595-9606 cały; `pickTowerTarget` z city-towers.ts z SHA). Stuby jawne w klasie generatora: `_singleBlow` (zapis celu, zwraca 0), `_spawnWallLabel`, `_spawnDamageLabel`, `_sfxShot`, `drain` (zegar). Straż SHA-256: `battleScene.ts` = d784735e185c63f03d95c12a5de33855106b79432001dcc382c5ef335989d21d; `city-towers.ts` = cc715ed61f65cb0b11fe38efe80e6c6a1742feefec2c0bb5e6ce142a4da8cbd4; fragment pickTowerTarget = 56a196fe638705e1883506e315b059116268e49b20b679a90db1448ebe3da333 (jak w istniejącym generatorze). SHA czterech wyciętych fragmentów (destroyTower, fireSiegeTowers, fireOneTower, breachWallTile, schedule) ustawiono z pinu przy pierwszym uruchomieniu generatora: to samo-odniesienie, nie niezależna weryfikacja. Generator odmawia pracy przy zmianie pinu.
   Generator i vectors.json NIE są w literalnej allowliście (`p6_siege_wylom_*.rs`); to ten sam wzorzec co `p6_tower_target_wiring_gen.mjs`. FC: proszę zatwierdzić.
5. Test pętli wyłącza sufit tur bez wyłomu (`no_breach_cap: 1_000_000`). Bez tego sufit kończył bitwę przed trafieniem, bo harness wektorów pinu nie modeluje sufitu tur (wykryte w pierwszym przebiegu; nie wpływa na porównanie z pinem).
6. Porównanie w teście: kolejność i cel (indeks w `st.atk`) każdego trafienia wieżą, odroczenia salw (ms) i snapshot muru (klucze kafli, `destroyed` per wieża, `wall_ever_breached`) po każdym kroku. Snapshot `destroyed` liczony dwiema drogami (predykat na WallState i obecność w pętli), asercja równości.

## WEKTORY (3 scenariusze, wygenerowane z pinu)

- `wylom-po-planowaniu-przed-strzalem`: salwa planuje [0, 180]; wyłom wiersza 2 przed odpaleniem zegara; trafienie tylko z wiersza 4 (cel 1).
- `brak-kafla-przy-planowaniu`: wieża wiersza 1 bez kafla zburzona przy planowaniu (destroyed=[true,false]); planowanie [0]; trafienie cel 1.
- `wylom-przed-kolejna-salwa`: salwa 1 planuje [0,180], trafienia [0,1]; wyłom wiersza 2; salwa 2 planuje tylko [0]; trafienie [1].

## TESTY (wszystkie EXIT 0; env: CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0; CARGO_TARGET_DIR poza repo)

- `cargo fmt --check` (rust-port/engine): EXIT 0.
- `cargo clippy --all-targets -- -D warnings` (rust-port/engine): EXIT 0.
- `cargo test --test p6_siege_wylom_tower`: 6 passed, 0 failed (wylom po planowaniu; brak kafla przy planowaniu; wylom przed kolejna salwa; breach_wall_tile jednowywołaniowy; licznik niepustości wektorów; zgodność źródeł SHA).
- `cargo test --all-targets` (rust-port/engine, pełny): EXIT 0; 3421 passed, 0 failed, 1 ignored. Ignorowany test to pre-istniejący `e2e::dump_tick1_econ_for_web_generator` (nie z tego tematu; w nowym pliku brak `#[ignore]`).
- `git diff --check`: EXIT 0.
- MUTACJA (na finalnym kodzie): w `breach_wall_tile` usunięto `n.wall_tile_hp.remove(&wall_row);` -> FAIL w 3 testach (`breach_wall_tile_usuwa_kafel_i_zburza_wieze_w_tym_samym_wywolaniu`, `wylom_po_zaplanowaniu_salwy_wieza_nie_strzela_przed_strzalem`, `wylom_przed_kolejna_salwa_pomija_zniszczona_wieze`). Plik przywrócony z kopii, `cmp` identyczny.

Sprawdzenie numerów linii pinu (dispatch vs rzeczywistość): :4194-4199 OK; :4214-4216 OK; guard `_fireOneTower` jest w :4227 (dispatch: :4226; w komentarzach użyto :4227); :7646-7648 OK; `_schedule` RANGED_FLY_MS :4262 OK.

## BLOKADY

Brak blokad po stronie operatora. Zakres z dispatchu zrealizowany (1-3).

## NIE_ZMIERZONO

- Czas trafienia wieży (380 ms) i kolejność względem innych timerów o tym samym `due`: wektory porównują kolejność i cele, nie czasy (Rust `tower_blow` nie dostaje `vNow`).
- Trafienie wieżą już w locie, gdy wyłom następuje po wystrzale (zgodnie z pinem :4263 nie jest anulowane przez `destroyed`): NIE pokryte wektorem; scenariusze wyłomu wykonują się przed trafieniem.
- `hp` celu: web `u.bu.hp` vs Rust `c.hp` (rozpoznanie pkt 9 i 6): w harnessie równe z konstrukcji; nie zweryfikowano w pinie definicji `CombatUnit.hp`.
- Sufit tur bez wyłomu (`_roundCapVerdict`, pin): nie porównywany w tym wektorze (wyłączony w teście, decyzja 5).
- Wpływ na `end-check` (`wall_ever_breached` przez sync): ustawiane, nie testowane w tym temacie.
- Konsument strefy zagrożenia AI (pin :7928-7935, rozpoznanie pkt 24): nie zmieniany.
- Wyłom po `_attackWallTile` (pin :7555-7565) oraz wiring produkcyjny: poza zakresem (#113/#98 finał).

## BRAK (poza zakresem lub nieportowane)

- Efekty `_resolveBlowOutcome` od trafienia wieżą (pin :9019, rozpoznanie pkt 19; tematy #109/#147). Wpis `unported` w `ProdBody::tower_blow` bez zmian.
- Log bitwy: "Wieza strzelnicza (rzad N) strzela do X." (pin :4247) i "Wieza strzelnicza w wyłomie (rzad N) zburzona." (pin :4198). Silnik nie emituje logu.
- ZMIANA 5 w `_breachWallTile` (cofnięcie obrońcy z wyłomu, zniszczenie katapult, pin :7649+) i zdejmowanie jednostek z muru (:7660-7756): nieportowane (ruch jednostek, #123).
- Wiring produkcyjny: `SiegeEnv` nie jest konstruowany w produkcji; `sync_wall_state` nie ma wołającego produkcyjnego (#113).
- Prezentacja (`_spawnWallLabel`, pocisk, dźwięk): poza silnikiem.

## RUNDY

1/5 (runda Operatora). Brak FAIL/BLOCK z poprzednich rund.

## NASTĘPNY KROK

Evaluator (SONNET 5.5): (a) zweryfikować allowlistę `git diff --stat` i decyzje 1-4 (zwłaszcza sync_wall_state i generator spoza literalnej allowlisty); (b) ponownie uruchomić `node rust-port/engine/tests/p6_siege_wylom_gen.mjs <WEB_ROOT>` z `git archive 07d2fbd72 gra/src` i porównać z `vectors.json`; (c) powtórzyć mutację z TESTY i sprawdzić FAIL. Potem Obrona (jeśli zarzuty) i Final Control.

## DEPLOY/PUSH

NIE WYKONANO. Commit lokalny na gałęzi `wip/R-RUSTPORT-P6-K5-WYLOM-WIEZE-Q1` (bez push, bez integracji, bez zmian w `rust-port/parity-v2`).
