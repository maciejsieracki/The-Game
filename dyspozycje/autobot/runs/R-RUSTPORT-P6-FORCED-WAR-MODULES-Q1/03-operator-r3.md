STATUS: PASS-WITH-NOTES (Operator r3, dodatek 2 — partia G3a: fale; timer/trigger z main.ts poza zakresem tej rundy)
DOMAIN: GAME (RUST)
TEMAT: R-RUSTPORT-P6-FORCED-WAR-MODULES-Q1
GOAL: Partia G3a wojen wymuszonych: `forced-war-waves.ts` (approachSectorForHex, planForcedWarWave, pruneForcedWarWaves, serialize/restore, empty state, hexDistanceForForcedWar) 1:1 z webem, wektory z uruchomionego weba. Bez podpinania do tury.
BAZA: abc5f58b9 = origin/rust-port/parity-v2 (G1+G2 zintegrowane). Dispatch odczytany z origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0 (DODATEK 2).

ZMIANY-COMMIT:
- `505631741` G3a: `rust-port/engine/src/domain/war_forced_waves.rs` (nowy, ~520 linii po rustfmt), `domain/mod.rs` (+pub mod), `tests/p6_forced_war_g3.rs` (~293 linii), `tests/p6_forced_war_g3_data/{cases.json,gen_cases_g3.mjs}`, `dyspozycje/rust-port/p6/P6-FORCED-WAR-MODULES.md` (sekcja 2b).
- Commit tego raportu: osobny, po commicie G3a (SHA w raporcie orkiestratora).
- Allowlista: wszystkie zmiany w `domain/war_*.rs`, `domain/mod.rs`, `tests/p6_forced_war_*`, `dyspozycje/rust-port/p6/P6-FORCED-WAR-MODULES.md`, `dyspozycje/autobot/runs/R-RUSTPORT-P6-FORCED-WAR-MODULES-Q1/**`. Zero zmian w `gra/**`, WERSJE.md, Cargo.toml, renderer, src-tauri. Wyjątków poza allowlistą: brak. `main.ts` tylko czytany (`git show origin/main`).

WEKTORY: 554 przypadki z uruchomionego weba (Node 22, `--experimental-strip-types`, `git archive origin/main gra/src gra/data` poza repo). Patche tylko w kopiach tymczasowych: stub `units/setup` (hexDistance dosłownie z setup.ts; isCivilianUnit = pole wejściowe), stub `army-concentration` (stałe z webu). Plan 226 (80 niepustych), prune 122, approach 121, hexDistance 30, restore 49, serialize 3, empty 1, stałe 2. Weryfikacja ponowna: roznic=0.

BŁĄD W TRAKCIE (naprawiony): pierwsza wersja generatora przekazywała pozycyjne `hexDistance(aq,ar,bq,br)` jako funkcję obiektową — web liczył NaN, 26 rozbieżności nie leżało po stronie portu. Poprawka w generatorze, wektory przeliczone ponownie.

TESTY:
- `cargo test --test p6_forced_war_g3`: 2 passed (zgodność z wektorami; pokrycie plan/prune/restore).
- `cargo test --lib`: 22 passed, 0 failed.
- `cargo test --test p6_forced_war_g1`: 1 passed; `p6_forced_war_g2`: 3 passed.
- Binarki war/multiwar: p6_dyplo_multiwar2_eraign 3, p6_dyplo_multiwar_gates 5, p6_dyplomacja_multiwar3_d 10, _e 2, _f 2, _g 4, p6_dyplo_multiwar2_tick 3, p6_dyplo_multiwar_interciv 3, p6_zapis_erawar_save 24, p6_repin_wojna_c_war_brake 5 — wszystkie passed, 0 failed.
- `cargo clippy --all-targets -- -D warnings`: czysto (Finished, bez ostrzeżeń).
- `rustfmt --check` na nowych plikach: czysto (po formatowaniu).
- NIE_ZMIERZONO: pełne `cargo test` po ~318 binarkach (dysk ok. 4–6 GB wolne w trakcie; budowa debug każdej binarki kosztowna). Zmiana addytywna (nowy moduł + jedna linia w mod.rs), ryzyko regresji poza wymienionymi binarkami niskie, ale nie zmierzone.
- Gates cargo: CARGO_INCREMENTAL=0, CARGO_PROFILE_*_DEBUG=0, CARGO_TARGET_DIR w worktree (`target-g3`), usunięty po bramkach; `Cargo.lock` (nieśledzony) usunięty.

ZAŁOŻENIA / ODSTĘPSTWA (szczegóły w sekcji 2b tabeli):
- `isCivilianUnit` nie portowane (zbiory w setup.ts); wywołujący podaje `is_civilian`.
- `localeCompare` identyfikatorów = porządek bajtowy; zakładany alfabet małych liter/cyfr. Do weryfikacji przy podpinaniu do tury.
- `approachSectorForHex`: JS `Math.round` zaimplementowane dokładnie (połówki w stronę +∞); `f64::round` dałby sektor 4 zamiast 5 dla kąta −90°. Wektory pokrywają ten przypadek.
- `restore`: odchylenia tylko dla danych malformowanych (nienumeryczne `createdTurn` w falach → 0, nieznane pola i nietekstowe `unitIds` odrzucane, `originHex`/`rallyPoint` bez q/r odrzucają falę). Dane z `serialize` nie mają tych kształtów; wektory ich nie zawierają.
- Rozmiar: moduł ~520 + test ~293 linii, powyżej budżetu 600 LOC na partię — ZAŁOŻENIE do akceptacji (moduł i test to jedna całość 1:1; analogicznie do G2a).

BLOKADY:
- Timer/trigger wojny wymuszonej (G3b) NIE zrobiony: logika w `main.ts` siedzi w domknięciach na stanie gry (pending owners z `syncOwnerEraFromResearch`, wpis fali i prune w ownerLoop, sprzątanie przy pokoju `cleanupStone/Iron/BronzeForcedWar*`, `sweepStaleForcedWarEntries`, odpoczynek `WOJNA_WYMUSZONA_ODPOCZYNEK_TUR`). Wyodrębnienie czystych funkcji to osobny temat; dispatch dopuszcza wektory z ręcznie wydzielonej kopii, ale wymaga wcześniejszej decyzji o zakresie (allowlista Rust nie obejmuje tej logiki w całości).
- Brak wywołań z tury; moduły nieaktywne w grze.

RUNDY: 3/5 (dodatek 2 = G3a). Brak rundy FAIL; brak ponownego obiegu.
NASTĘPNY KROK: Evaluator (Sonnet 5.5) i Final Control (Sonnet 5.5) dla G3a na commicie `505631741`. Decyzja orkiestratora: czy G3b (timer/trigger z main.ts jako czyste funkcje) ma iść jako kolejna runda (wymaga zgody na rozszerzenie zakresu poza `war_*.rs` przy stanie mapy) czy zostać odłożone.
DEPLOY/PUSH: NIE WYKONANO (dispatch: PUSH NIE; commity lokalne na detached HEAD worktree).
