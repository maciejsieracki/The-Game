STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-WIEZE-2B2-Q1
GOAL: strzał wieży oblężniczej (`_fireOneTower`): cel w chwili strzału, `_singleBlow` ranged ze statystykami strzelca epoki, sprawdzenie `destroyed`; parytet 1:1 z pinem 07d2fbd72
ZMIANY/COMMIT: oceniany af7a0be6a (baza 14d5e50b9 jest przodkiem; zmiany tylko na allowliście; Cargo.lock nieskomitowany)
TESTY: cargo fmt --check EXIT 0; cargo clippy --all-targets -- -D warnings EXIT 0; pełny cargo test --no-fail-fast: passed=3373 failed=0 (jedyny #[ignore] to stary p6_order_lane.rs:1530, nie z tego diffu); p6_wieze_2b2 5/5 w pełnym przebiegu
BLOKADY: patrz zarzuty

ZARZUTY:
1. Brak wektorów z pina (kryterium 4 dispatchu): nie ma `p6_wieze_2b2_gen.mjs` ani `p6_wieze_2b2_vectors/`. Test `tower_shot_damages_target_through_single_blow_full` liczy oczekiwanie TĄ SAMĄ funkcją `single_blow_full` z tym samym szablonem i rzutem 0.0 (tautologia). Dispatch dopuszczał alternatywę (wartość pina z cytatem linii), ale test nie zawiera żadnej wartości liczbowej z pina. Nie jest to test behawioralny na wektorach pinu.
2. Szablon strzelca jest neutralny (`neutral_tower_shot_template()`: dmg 10, atk 10, def 0), a nie `towerShooterRow` z `strongest_ranged_unit_for_era` (założenie dispatchu: "dane strzelca = wynik strongest_ranged_unit_for_era"). Żadna ścieżka produkcyjna nie wypełnia `SiegeEnv::tower_shot` z `city_towers`. Statystyki nie zależą od epoki/nacji obrońcy, więc ostatnie zdanie z pina ("statystyki najmocniejszej jednostki dystansowej epoki") nie jest zrealizowane. Zależność jawnie niezadeklarowana jako zadanie następcze w rejestrze (tylko w raporcie operatora).
3. Brak wykrycia "destroyed" wprost: `destroyed` zastąpione proxy `!wall_tile_rows.contains(&row)`. Pin ustawia `destroyed` w `_destroyTowerAtRow` i w `_fireSiegeTowers` dla wież bez kafla (`!wallTileHp.has(t.row)` -> destroy + continue) — tu dziś planowanie je po prostu pomija (zgodne wynikowo z 2B1), ale pin ma stan trwały (`destroyed=true`, log "Wieza strzelnicza ... zburzona"), którego brak: wieża, której kafel zostanie "odtworzony" w wall_tile_rows, zacznie znów strzelać. Dispatch pkt 3 wymagał stanu `destroyed` i `_destroyTowerAtRow` "pełny efekt jak pin, jeśli dotyczy". Test `destroyed_tower_does_not_shoot` wymusza stan ręcznym czyszczeniem `wall_tile_rows`, więc nie pokrywa żadnej realnej ścieżki zniszczenia.
4. Brak kroku "czerwony przed zmianą" (kryterium 1): operator sam zapisał NIE_ZMIERZONO. Nie ma dowodu z kodem wyjścia, że testy 2B2 padają na bazie 14d5e50b9 (API nie istniało).
5. Pin wylicza `hit_arc`/facing (`facing: Dir.W`, `q,r` wieży vs cel) i `first_blow_of_pair`; szablon stałe `HitArc::Front`, `first_blow_of_pair: true`. Brak testu, że ścieżka tych pól jest zgodna z pinem (ustalone na sztywno jako Front).
6. `ProdBody::tower_blow` dopisuje do `unported` "wieza-resolveBlowOutcome-efekty" przy każdym trafieniu z wynikiem != None; pin po `_singleBlow` wywołuje też `_spawnDamageLabel` i (przez `_singleBlow`) efekty morale/rout dla celu — niezaimplementowane, jawnie odnotowane (OK jako dług, ale wymaga wpisu w rejestrze zadań).
7. Test `dead_target_is_not_chosen_at_shot_time` sprawdza filtr, który już był w 2B1; nie pokrywa nowego kodu 2B2 (nie testuje przypadku "cel zmarł między wystrzałem a trafieniem", czyli gałęzi `tower_hit` `tc.dead || tc.fading_out`). Gałąź ta (pin: `target.dead || target.fadingOut` w callbacku) ma brak testu behawioralnego; mutacja jej usunięcia przejdzie testy.
8. Brak testu opóźnienia lotu (`TOWER_FLY_MS = 380`): żaden test nie sprawdza, że trafienie następuje 380 ms po wystrzale (np. czas wirtualny zegara w chwili `tower_blow`).

WNIOSEK: kod jest poprawny w tym, co zrobiono, bramki zielone, ale kryteria 1 i 4 dispatchu (czerwony test, wektory/wartość pina) niespełnione, a dane strzelca nie pochodzą z epoki (zarzut 2) — do Operatora r2 zarzuty 1, 2, 3, 7, 8 (4 jako dowód na bazie).
RUNDY: ocena r1 / 5
NASTĘPNY KROK: Operator r2 (to samo ID), potem Evaluator
DEPLOY/PUSH: NIE WYKONANO
