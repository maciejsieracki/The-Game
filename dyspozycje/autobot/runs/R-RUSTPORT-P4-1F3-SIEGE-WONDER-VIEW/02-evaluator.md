# R-RUSTPORT-P4-1F3-SIEGE-WONDER-VIEW — Evaluator r1 (adwersarialny)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1F3-SIEGE-WONDER-VIEW
GOAL: stan `oblegane`, `siegeMachines.ready`, `placedWorldWonders` w `PlayableState` (z zapisem i odczytem) oraz producenci `sieges[]` i `wonders[]` 1:1 z pinem `07d2fbd72`.
ZMIANY/COMMIT: oceniany kod `81bb886707e6c4171a560baaa2e1de9b2a54bc4c`, raport Operatora `999083029`, baza `585bb48e0` (zgodna z dispatchem). Ten raport to jedyna zmiana Evaluatora (commit lokalny, bez push).
TESTY: odtworzone samodzielnie, wyniki niżej.
BLOKADY: brak blokujących. Dysk 3.5–3.6 GB wolnego, więc pełnego `cargo test --all-targets` NIE uruchomiono (NIE_ZMIERZONO w tej rundzie; Operator raportuje EXIT 0, 3666 passed). Zamiast tego: `clippy --all-targets` (kompiluje wszystkie testy), `--lib`, nowe testy i 7 binarek testów zapisu.
RUNDY: 1/5
NASTĘPNY KROK: Obrona → Final Control.
DEPLOY/PUSH: NIE WYKONANO

## Bramki (rust-port/engine, CARGO_INCREMENTAL=0, DEBUG=0, CARGO_TARGET_DIR w scratchpadzie, usunięty po bramkach)

| Bramka | Kod wyjścia |
|---|---|
| `cargo fmt --check` | 0 |
| `cargo clippy --all-targets -- -D warnings` | 0 |
| `cargo test --lib` | 0 (124 passed) |
| `cargo test --test view_overlays_siege_wonder --test view_overlays_siege_wonder_save` | 0 (11 + 6 passed) |
| testy zapisu: `p4_1j_planned_march_state`, `p6_zapis_era_zapisu`, `p6_zapis_migracje_snapshot_load`, `p6_zapis_loader_migrate`, `p6_wire_war_state_snapshot`, `p6_repin_wojna_2_r4_save`, `p6_zapis_erawar_save` | 0 (9/8/8/8/5/4/10 passed) |
| `git diff --check 585bb48e0 HEAD` | czysto |

## Mutacje (odtworzone, skrypt w scratchpadzie, plik przywrócony i sprawdzony `cmp`)

| Mutacja w `overlays_view.rs` | Wynik nowych testów |
|---|---|
| (a) `era > absolut` → `era >= absolut` | FAIL (101) |
| (b) deduplikacja `camp_hexes` po heksie | FAIL (101) |
| (c) właściciel obozu = pierwsza jednostka na heksie bez filtra `!= cityOwnerId` | FAIL (101) |
| (c2) właściciel obozu = sama jednostka obozu (bez `camp_owner_at_hex`) | FAIL (101) |
| (d, dodatkowa) `ruin = !(era <= absolut)` (wariant NaN z rozpoznania) | FAIL (101) |

## Sprawdzenia

- Allowlista: zmienione tylko `playable.rs`, `save_load.rs`, `overlays_view.rs` (NOWY), `mod.rs` (1 linia `pub mod overlays_view;`), `tests/view_overlays_siege_wonder*.rs` (NOWE), raport. `view-model/` i `renderer/` bez zmian. `Cargo.lock` niecommitowany.
- Brak `#[ignore]`, brak `should_panic`. `#[allow]` tylko clippy przy rzutowaniach z komentarzem i `dead_code` w helperach testu.
- Pin: cytaty sprawdzone `git show 07d2fbd72`: `cities.ts:858` (`oblegane?`), `:884` (`siegeMachines?`), `main.ts:4025`, `:4199-4210`, `:17492-17530`, `:37450`, `:46459-46461`, `siegeCampSync.ts:7-47`, `wonders-data.ts:101,109-111,164-168`. Wszystkie się zgadzają.
- NIE_ZMIERZONO 8 z rozpoznania jest zamknięte: wszystkie 19 cudów pinu (`gra/data/wonders.json`) mają `absolut`, a wartości są identyczne z `rust-port/engine/data/wonders.json`. Fallback `_meta.absolut` jest więc nieosiągalny także w webie.
- Wektory pochodzą z reguł pinu i są uruchamiane przez producenta (`siege_views`, `wonder_views`, `restore_*`). Nie są przepisanymi wynikami. `absolut` w teście granicy jest czytany z danych, nie z literału.
- Golden: `golden_state_files_reserialize_byte_identical` i `snapshot_without_new_fields_is_byte_identical` są zielone. Pusty stan nie dodaje kluczy.

## Zarzuty (ponumerowane)

1. **[parytet, adapter] Właściciel obozu i maszyny na heksie wspólnym dla dwóch oblężonych miast.** Web składa `allCampOwners` i `allMachinesByCamp` jako mapy GLOBALNE po heksie (`main.ts:17509-17517`). Właściciel: ostatnie miasto w kolejności `cities` nadpisuje wpis. Maszyny: listy są łączone. `siegeMarker.ts` czyta te mapy dla każdego miasta (`options.campOwnerByHex?.get(hk)`, `machinesByCampHex?.get(hk)`). Rust liczy właściciela osobno dla każdego miasta. Sprawdziłem to tymczasowym testem (usuniętym po sprawdzeniu). Miasta 10 (właściciel 1, heks 5,5) i 20 (właściciel 2, heks 7,4), na wspólnym heksie 6,5 jednostki [właściciel 1, właściciel 3], wojny 1–3 i 1–2. Rust daje obóz miasta 10 z właścicielem **3**, a obóz miasta 20 z właścicielem **1**. Web pokaże dla obu obozów właściciela **1**. DTO nie traci informacji: per-wpis właściciel plus kolejność `sieges[]` pozwalają adapterowi odtworzyć regułę „ostatni wygrywa”, a łączenie maszyn wynika z `ready_machines` per miasto. Reguła musi jednak trafić do adaptera P4-1G Q5 (#236/#269), bo inaczej kolor obozu i maszyny będą różne od webu. Wymagane: zapis w raporcie lub rejestrze jako zależność adaptera. Kodu producenta nie trzeba zmieniać.
2. **[wołający / zależność] Nowego stanu nic nie zapisuje w produkcji.** `state.oblegane`, `siege_machines_ready` i `placed_world_wonders` są ustawiane tylko w testach i w `restore_playable_siege_wonders`. Ani pipeline W8 (który dalej bierze `oblegane` z `CityWarExtras.oblegane`, `war_world_view.rs:50`, i ustawia/czyści je na kopiach `turn_economy_attrition.rs:156`, `siege_surrender.rs:209`), ani rozmieszczanie cudów (`wonder_placement`) nie piszą do `PlayableState`. `with_playable_siege_wonders` i `restore_siege_wonders` też nie mają wołającego produkcyjnego (ten sam wzorzec co P4-1J). Raport Operatora (pkt 5) mówi tylko o braku wołającego producentów. Brakuje jawnej zależności: kto i kiedy zapisuje te pola (W8: wejście w oblężenie i jego koniec, produkcja maszyn; budowa i przejęcie cudu). Dziś `sieges[]` i `wonders[]` w grze zawsze będą puste.
3. **[podwójne źródło] `CityViewCityFacts.besieged` (`city_view.rs:86-87`) jest nadal wejściem wołającego**, choć `PlayableState.oblegane` już istnieje. Grozi rozjazd między odznaką oblężenia miasta a `sieges[]`. Plik jest poza allowlistą, więc to temat na później. Wymagane: wpis długu (np. przy wpięciu W8 albo `RenderViewDto`).
4. **[zapis] `citySiege` to klucz istniejący tylko w Rust.** Zapis webowy trzyma `oblegane`/`siegeMachines` w obiektach miast, a `GameStateDto` ich nie niesie. Po wczytaniu zapisu z webu stan oblężenia zniknie bez raportu. To decyzja techniczna Operatora i jest opisana. Uwaga: przy imporcie zapisów webowych (P6.20–P6.22) trzeba będzie mapować `cities[].oblegane` → `citySiege`.
5. **[drobne] `placedWorldWonders: []` nie jest zapisywany** (web zawsze go pisze, `main.ts:37450`). Odczyt traktuje brak jako `[]` tak samo jak web (`:46459-46461`), więc zachowanie jest równoważne. Akceptowalne ze względu na golden.

Werdykt: kod producentów i stanu jest zgodny z pinem dla zakresu dispatchu. Wektory są zielone, a każda mutacja daje FAIL. Zarzuty 1–3 to zależności i długi do zapisania przez orkiestratora. Nie blokują PASS w tym zakresie.
