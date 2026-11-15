# Final Control r1 — R-RUSTPORT-P4-1J-PLANNED-MARCH-STATE-Q1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1J-PLANNED-MARCH-STATE-Q1
GOAL: pola planów marszu (`plannedMarches` z `attackUnitId`, `marchAttackTargets`, `marchStopNotified`,
`marchStopDetail`) w `PlayableState` z `serde(default, skip_serializing_if)`, zapis/odczyt przez
`SavedPlannedMarch`, golden zapisu bez zmian.
ZMIANY/COMMIT: oceniany kod = `1506833dd` (Obrona r1). Ten raport: commit na gałęzi
`R-RUSTPORT-P4-1J-PLANNED-MARCH-STATE-Q1-wip/fc-r1`, rodzic `1506833dd`, zmienia wyłącznie ten plik.
TESTY: odtworzone samodzielnie (niżej).
BLOKADY: brak.
RUNDY: FC 1/5.
NASTĘPNY KROK: integracja orkiestratora na `rust-port/parity-v2` (FF z `a01363d5f`).
DEPLOY/PUSH: NIE WYKONANO

## 0. Baza i ancestry

- `origin/rust-port/parity-v2` = `a01363d5fad9cd70b5d37a827952092e46eb04af` (po `git fetch`).
- `git merge-base --is-ancestor a01363d5f 1506833dd` = TAK. Łańcuch:
  `a01363d5f → 78f5db10f → 2169bd17d → 25da353f8 → 23e3f056d → 1506833dd`. Gałąź jest liniowa, FF możliwy.
- `git merge-base --is-ancestor 7817ef0c a01363d5f` = TAK. Parity-v2 zawiera 7817ef0c, co potwierdza Z2.
- „DODATEK r2” w dispatchu: na `origin/claude/rust-sivvrn` plik `00-dispatch.md` to nadal runda 1, bez
  dodatku (sprawdzone po fetch). Orzekam według rundy 1.

## 1. Allowlista (sprawdzona samodzielnie, `git diff --name-only a01363d5f 1506833dd`)

Zmienione pliki: `playable.rs`, `save_load.rs`, trzy nowe `tests/p4_1j_planned_march_{state,bounds,pin_vectors}.rs`,
pliki w katalogu runu. Filtr regex poza allowlistą: pusty. Zero zmian w `gra/**`, `renderer/**`,
`view-model/**`, `src-tauri/**`, fixturach, istniejących testach. `Cargo.lock` nie jest commitowany.
W diffie nie ma `#[ignore]` ani `unsafe`. `git diff --check a01363d5f 1506833dd` jest czysty.

## 2. Bramki (FC, `1506833dd`, CARGO_TARGET_DIR w scratchpadzie poza repo, INCREMENTAL=0, DEBUG=0)

| Bramka | Wynik |
|---|---|
| `cargo fmt --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --all-targets --no-fail-fast` | 469 zestawów OK, 3387 passed, 0 failed, 1 ignored. Proces jednego zestawu (`p6_m12_spawn`) dostał z zewnątrz **SIGTERM** (`signal: 15`), bez żadnej asercji. Na tym samym dysku i CPU działały równolegle buildy innych agentów, a wolne miejsce spadło do 3 GB. |
| `cargo test --test p6_m12_spawn` (ponowione, ten sam target) | EXIT 0, 8 passed |
| Łącznie | **470 zestawów, 3395 passed, 0 failed, 1 ignored** (istniejący `e2e::dump_tick1_econ_for_web_generator`), zgodnie z Obroną |
| `p4_1j_planned_march_state` | 9/9 (z `restore_merges_duplicates_before_filter`) |
| `p4_1j_planned_march_bounds` | 1/1 |
| `p4_1j_planned_march_pin_vectors` | 4/4 |
| `git diff --check` | czysto |

Po bramkach usunąłem CARGO_TARGET_DIR i Cargo.lock.

## 3. Orzeczenia

**Z1 (restore: deduplikacja po filtrze): ODDAL. Usterka naprawiona w Obronie i potwierdzona.**
Na `1506833dd` funkcja `restore_playable_planned_marches` scala powtórzony `unitId` przed wywołaniem
`planned_marches_from_save`: pętla `entries` zachowuje pierwszą pozycję i ostatnią wartość. Dopiero
potem działa filtr. To odpowiada webowi: `JSON.parse` daje obiekt, a `plannedMarchesFromSave`
w `planned-march.ts@07d2fbd72:451-482` iteruje `Object.entries` po tym obiekcie. Przeczytałem źródło
pinu. Test `restore_merges_duplicates_before_filter` sprawdza A (ostatni wpis to pozycja jednostki,
więc brak planu i brak celu ataku), B (ostatni wpis 2.5, więc brak planu, a `unrepresentable=["1"]`
zgadza się ze stanem) oraz kontrolę odwrotną. Test przechodzi. Czułość, czyli FAIL na kodzie
`23e3f056d`, deklaruje Obrona. FC jej nie powtarzała, bo logika testu A wprost przeczy zachowaniu
sprzed poprawki opisanemu i zmierzonemu przez Evaluatora. Doc-komentarz jest teraz zgodny z kodem.

**Z2 (odwrócony `is-ancestor` w raportach Operatora): ODDAL. Usterka sprostowana w Obronie i potwierdzona.**
`git merge-base --is-ancestor 7817ef0c a01363d5f` = TAK (FC). Sprostowania są dopisane w
`01-operator-impl.md` §0 i `01b-operator-pomiary.md` §0, historia została zachowana. Kod jest bez wpływu.

**U1 (`forbid(unsafe_code)`): ODDAL jako zarzut, zostaje jako uwaga.** W `rust-port/engine/src` nie ma
tego atrybutu ani na bazie, ani na gałęzi (FC: `grep` pusty). Kryterium 4 jest więc spełnione w tym
sensie, że nic nie usunięto i nie dodano `unsafe`. Dodanie atrybutu leży poza allowlistą.

**U2 (brak produkcyjnego wołającego): ODDAL dla tego tematu.** Dispatch obejmuje stan i zapis/odczyt.
Wpięcie należy do P4-1H albo do ścieżki zapisu PlayableState.

**U3 (trzy mapy nie zapisywane przez web, a obecne w JSON DTO `PlayableState`): ODDAL dla tego tematu,
zostaje jako uwaga do wpięcia.** Dispatch wprost wymaga tych pól z `serde(default, skip_serializing_if)`.
Ścieżka `SaveSnapshot` ich nie zapisuje, a `restore_*` je czyści (zgodnie z `main.ts@07d2fbd72:46272-46279`).
Jeśli JSON `PlayableState` stanie się formatem zapisu gry, trzeba je pominąć albo wyczyścić przy odczycie.

**U4 (`generalTargetId` pominięty): ODDAL dla tego tematu.** Pominięcie wynika z dispatchu (§8 P4-1J
tego pola nie wymienia) i jest jawnie raportowane w `general_target_dropped`. Luka parytetu jest już
osobnym zadaniem orkiestratora (#221). Zachowanie po wczytaniu: NIE_ZMIERZONO.

**U5 (decyzja r1: UnitId/i32 i raport `unrepresentable`): ODDAL jako zarzut.** Decyzja jest rozsądna,
a raport sprawia, że odstępstwo jest jawne, a nie ciche. Orkiestrator wpisuje ją do `REJESTR-RUST.md`
(zasada 9).

## 4. Kryteria końca

1. Pola §8 z `serde(default, skip_serializing_if)`: SPEŁNIONE (`playable.rs`).
2. Round-trip z planami i bez nich, golden bez zmian bajtowych: SPEŁNIONE. Testy
   `golden_state_files_reserialize_byte_identical` i `full_state_roundtrips_*` są zielone, a żadna
   fixtura nie jest zmieniona w diffie.
3. Pusta lista nie zmienia zapisu: SPEŁNIONE (`snapshot_without_plans_is_byte_identical`,
   `empty_fields_are_omitted_and_legacy_state_loads_with_defaults`).
4. Brak `#[ignore]` i osłabionych asercji, brak `unsafe`: SPEŁNIONE (zob. U1).
5. Twierdzenia o webie z plik:linia: FC sprawdziła `planned-march.ts@07d2fbd72:16-35, :451-500` oraz
   `main.ts@07d2fbd72:31124-31130, :46268-46287`. Są zgodne z komentarzami w kodzie.

## 5. Uwagi dla orkiestratora

- Decyzja U5 → `REJESTR-RUST.md`. U3 trzeba pilnować przy wpięciu zapisu (P4-1H). U4 → zadanie #221.
- Dispatch nie ma DODATKU r2, choć polecenie FC się na niego powołuje.
- SIGTERM na `p6_m12_spawn` przyszedł z zewnątrz (współdzielona maszyna). Zestaw ponowiony osobno przeszedł 8/8.
- Wolne miejsce na dysku po sprzątaniu: 6,0 GB.

SHA końcowy (kod): `1506833dd`; ancestry: `a01363d5f` jest przodkiem (TAK), FF możliwy.
