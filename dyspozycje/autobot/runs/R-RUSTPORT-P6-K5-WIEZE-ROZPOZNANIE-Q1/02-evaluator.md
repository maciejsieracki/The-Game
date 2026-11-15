# 02-evaluator: K5-LOOP-WIEZE rozpoznanie (#96), runda 1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5-WIEZE-ROZPOZNANIE-Q1
GOAL: adwersarialna weryfikacja `01-rozpoznanie.md` (commit Operatora `6d2548532`): spot-check odwołań web (pin `07d2fbd72`) i Rust (`62ff9de35`), zakres commitu.
ZMIANY/COMMIT: wyłącznie ten plik w `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5-WIEZE-ROZPOZNANIE-Q1/`. Zero zmian w `gra/` i `rust-port/`.
TESTY: NIE_URUCHAMIANO (tryb odczytu; bez cargo/npm). Odczyt przez `git show`/`git grep` na `07d2fbd72` i `62ff9de35`.
BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: Operator (poprawka `01-rozpoznanie.md` o zarzuty 1 i 2) albo Final Control z adnotacją o tych dwóch lukach.
DEPLOY/PUSH: NIE WYKONANO.

## Zakres commitu Operatora

`git show --stat 6d2548532`: jeden plik, `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5-WIEZE-ROZPOZNANIE-Q1/01-rozpoznanie.md` (+99). Brak zmian w `gra/` i `rust-port/`. Rodzic = `9cbadc54a`, a nie baza `62ff9de35` z dispatchu. Operator to ujawnił (sekcja 0), a odczyt Rust przez `git show 62ff9de35` jest równoważny. ZGODNE.

## Potwierdzone odwołania (sprawdzone osobno)

1. Web `_fireSiegeTowers` (`battleScene.ts:4208-4219`): guard :4209, `stagger += 180` :4218, pominięcie `destroyed` :4215, `_destroyTowerAtRow` przy braku kafla :4216. POTWIERDZONE. `_fireOneTower` :4223, guard :4227 (Operator podał :4226, różnica o 1, bez znaczenia), `pickTowerTarget` :4230, `idx < 0` :4234, log :4247, `_schedule(RANGED_FLY_MS)` :4262, `_singleBlow(shooter, target, true)` :4264.
2. Web wyłom: `_breachWallTile` (:7638) usuwa `wallTileHp` i wywołuje `_destroyTowerAtRow` (:7646-7648); `_siegeShooterThreats` pomija `destroyed` (:7932-7934). POTWIERDZONE. `_schedule` :9595-9606 (planowanie AUTO wykonuje od razu). POTWIERDZONE.
3. Rust `siege_tactics_loop.rs` na `62ff9de35`: `plan_tower_shots` :365-378 (kolejność, stagger 180 tylko dla strzelających), `pick_tower_for_row` :382-404, `fire_siege_towers` :436-441, `tower_shoot` :613-627 (sprawdza `wall_tile_rows` na polu `env`), `tower_hit` :633-641, `ProdBody::tower_blow` :961-970 (`unported` "wieza-resolveBlowOutcome-efekty"). `TOWER_FLY_MS=380` :71, `TOWER_STAGGER_MS=180` :85. POTWIERDZONE. `pick_tower_target` w `siege_tactics_tower.rs:486-511` jest zgodny z `city-towers.ts:141-157` (pomija `d<1`, `d>range`, remis po HP, pierwszy w liście). POTWIERDZONE.
4. Brak wołającego produkcyjnego: `git grep tower_setup_from_units 62ff9de35 -- rust-port` trafia tylko w definicję i `tests/p6_wieze_2b2.rs`. `SiegeEnv` poza `siege_tactics_loop.rs` występuje wyłącznie w `tests/`. `wall_tile_rows` w `SiegeEnv` jest mutowane tylko w teście (`p6_wieze_2b2.rs:193`). POTWIERDZONE (pkt 13, 21, 23 tabeli).
5. Renderer: `destroy_tower_at_row` (`siege_towers.rs` ok. :335-352), `fire_one_tower` (:475-500, log "strzela do"), `breach_wall_tile_fort` (`dynamics.rs` ok. :790-803). POTWIERDZONE, niepodpięte do silnika. `begin_turn` (`siege_tactics_turnseq.rs`, `FireSiegeTowers` ok. :237-240) i `VirtualClock::schedule` (`siege_tactics_clock.rs` ok. :108-120) zgodne z opisem.

Numery linii Rust i web mieszczą się w granicach ±3 od podanych. Brak odwołań obalonych.

## Zarzuty

1. (ŚREDNI, luka pominięta w raporcie) Pkt 12 i 18 tabeli oceniają strzał wieży jako "OK w module" i "CZĘŚCIOWO (HP i zabicie OK)". Tymczasem szablon `neutral_tower_shot_template` (`siege_tactics_loop.rs:102-135`) ma na stałe `hit_arc: HitArc::Front`, `defender: {melee_defence 0, armor 0}`, `def_mods 1.0`, `def_on_wall: false`, `def_wall_civ_mult: 1.0`, a `tower_blow_on_target` (:246-272) podmienia z `st` tylko `defender_state` (hp, morale, flagi). Szablon jest jeden na wieżę, a cel wybierany jest w chwili strzału, więc dane obrońcy (obrona, pancerz, mnożniki trudności, teren/mur celu) i łuk trafienia nie zależą od celu. W pinie `_singleBlow` (:8809 i dalej) liczy `cuD = toCombatUnit(defender.bu, ...)`, `atkTerrain = combatTerrainName(attacker.q, attacker.r)`, bród atakującego (:8869) oraz `hitArc = relativeHit(defender.facing, attacker.q, attacker.r, defender.q, defender.r)` (:8880-8883), gdzie "attacker" to syntetyczny strzelec w `(wallCol, t.row)`. Zwykłe ciosy w `ProdBody::strike` (:1118-1190) ustawiają `hit_arc` per cel (:1146) i biorą szablon per para (`ProdUnit::blow`); wieża tego nie ma. Skutek: po podpięciu (#113) obrażenia wież byłyby liczone bez pancerza/obrony celu i zawsze jako cios z frontu. Do dopisania w sekcjach 3 i 5 jako osobna luka, zależna od #109/#147 (łuk) i #113 (wejścia per cel). Web rozstrzyga regułę, więc nie jest to decyzja gameplay.
2. (ŚREDNI, błędna ocena) Pkt 8 tabeli: "OK", a w sekcji 6 "brak `unit_cell` NIE_ZMIERZONO". `pick_tower_for_row` bierze pozycje z `ProdBody::unit_cell` (:972-974) = `pu.activate.q/r`. Na `62ff9de35` żadna ścieżka nie zapisuje `activate.q/r` (grep: tylko odczyty :903-904, :948-949, :1131-1136; w `start` pracuje klon `au`, :1012). Gałęzie ruchu są nieportowane (`unported`, :1066), a jednostki w oblężeniu trafiają do `out_of_scope` "oblezenie" (:996-1001). Web czyta ŻYWE `u.q/u.r` (:4231). Pozycje w Rust są więc statyczne z konfiguracji, a nie "może ich brakować". Poprawny status: CZĘŚCIOWO, zależne od portu ruchu (#123 K5LOOP-RUCH i zapis pozycji po krokach). Ustalone odczytem kodu, bez uruchamiania.
3. (NISKI, brak pokrycia dowodowego) Generator pętli `p6_siege_tactics_loop_gen.mjs` (:14-19) wycina `_fireSiegeTowers`/`_destroyTowerAtRow` i stubuje `_fireOneTower`, zakładając statyczny `wallTileHp` ("kafel nie wraca", `destroyed` niemodelowane). Pkt 7 i 21 (wieża po wyłomie w trakcie bitwy) nie mają więc żadnego wektora z pinu, a statusy OK dla pkt 5, 6, 16, 17 opierają się na czytaniu kodu i wektorach `p6_wieze_2b1`/`2b2`/`p6_tower_target*`, nie na testach pętli. Raport podaje NIE_URUCHAMIANO uczciwie, ale warto dopisać, że wektory wyłomu w trakcie bitwy trzeba będzie dodać w #98.
4. (INFORMACYJNY) Pkt 24 i luka "caller NIE_ZMIERZONO": `siege_shooter_threats` (`siege_tactics_approach.rs:102`) nie ma w `62ff9de35` produkcyjnego wołającego poza testami (ten sam wzorzec co pkt 23). Nie podważa raportu.

## Czego nie obalono

Wniosek główny jest poprawny: wybór celu (`pick_tower_target`), harmonogram 0/180/360 ms, lot 380 ms i warunki `finished`/`dead`/`fading_out` są zgodne z pinem; brakuje flagi `destroyed` w silniku, wiringu `SiegeEnv`/`tower_setup_from_units`, efektów `_resolveBlowOutcome` i logów bitwy. Rekomendowana kolejność (#98, potem #109/#147, potem #113) jest spójna z kodem, z dopiskiem, że zarzuty 1 i 2 też blokują sensowne podpięcie (#113).
