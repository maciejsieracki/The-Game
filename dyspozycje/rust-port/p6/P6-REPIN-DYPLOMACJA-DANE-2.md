# P6-REPIN-DYPLOMACJA-DANE-2 — dalszy dryf danych dyplomacji (Rust względem weba)

TEMAT: R-RUSTPORT-REPIN-DYPLOMACJA-DANE-2-Q1 · RUNDA 2/5 (poprawka po FAIL rundy 1) · DOMAIN: GAME (RUST)
BAZA RUST: `origin/rust-port/parity-v2` = `7897540ce` · BAZA WEB: `origin/main` = `cffe39cb9`
GAŁĘZ OPERATORA R2: `r-repin-dyplo-dane-2-r2` (baza = commit R1 `0c5b98330`)

Legenda: ZMIERZONO = odczyt pliku/komendy/grep w tej rundzie; NIE_ZMIERZONO = nie potwierdzone.

## 1. Pomiar dryfu — całe pliki (ZMIERZONO w R2)

Porównanie: `git show origin/main:gra/data/<plik>` vs `rust-port/engine/data/...` (cmp bajtowy albo diff kluczy płaskich).

| Plik (web) | Rust (kopia) | Stan przed R2 | Stan po R2 |
|---|---|---|---|
| `diplomacy.json` (689 kluczy płaskich) | `data/diplomacy.json` | zgodny po R1 (0 różnic kluczy) | zgodny (0 różnic) |
| `diplomacy-acceptance-points.json` | `data/diplomacy-acceptance-points.json` | BRAK `traktaty.rozejm` (`punkty` 200, `jednostka` umowa, `uwaga`) — 3 klucze | cmp bajtowo identyczny z webem |
| `diplomacy-war-peace-params.json` | `data/derived/diplomacy-war-peace-params.json` | BRAK `przewagaMilitarna` (prog 0,2; epsilon 1e-9; `_opis`) i `pokojAiAi` (minBilansPW 0; `_opis`) | cmp bajtowo identyczny z webem |
| `diplomacy-aggressor-params.json` | `data/derived/diplomacy-aggressor-params.json` | zgodny | cmp identyczny |
| `diplomacy-tick-params.json` | `data/derived/diplomacy-tick-params.json` | zgodny | cmp identyczny |
| `war-rules-params.json` | brak pliku w Rust (literały w kodzie) | patrz §1a | bez zmiany danych (§1a) |

### 1a. `war-rules-params.json` — porównanie literałów (ZMIERZONO grep)

Zgodne z webem (literał w Rust, `domain/diplomacy_multiwar.rs` i `war_forced_bronze.rs`):
- `delayInterCivWarsUntilTurn` 40 (`DELAY_INTER_CIV_WARS_UNTIL_TURN`),
- `eraForcedWarStartTurnsFromEra` 40/40/40 (`ERA_FORCED_WAR_START_TURNS_*`, `WOJNA_KAMIEN_WYMUSZONA_START_TURY`),
- `maxConcurrentWarsStone` 1, `maxConcurrentWarsFromBronze` null,
- `maxEraForcedWarsPerCivPerEra` 1,
- `enabledForcedWarEras` = Kamień, Brąz, Żelazo (`diplomacy_multiwar.rs:69`).

NIE PORTOWANE w Rust (grep bez konsumenta, ZMIERZONO):
- `engageRadiusHexes` 10 — w Rust `engage_radius` jest podawany jawnie przez wywołującego (`war_all_in_capital.rs:141`, `war_rules_multiwar.rs:9`); domyślna wartość z JSON nie istnieje.
- `splitArmyByWarCount` true — brak trafień w `rust-port/engine/src`.
- `eraForcedWarIgnoreR1` [bronze, iron] — brak trafień w `rust-port/engine/src`.

Dług: port `WAR_RULES_PARAMS` z `war-rules-multiwar.ts` (`war_rules_multiwar.rs` deklaruje to jako niezrobione).

## 2. Zmiany R2

- `rust-port/engine/data/diplomacy-acceptance-points.json`: kopia `origin/main:gra/data/diplomacy-acceptance-points.json` (cmp identyczny).
- `rust-port/engine/src/data/civilizations.rs`: nowa struktura `Rozejm` (`punkty`, `jednostka`, `uwaga`, `deny_unknown_fields`) i pole `Traktaty.rozejm`. Stała w kodzie `diplomacy_truce_flow::TRUCE_BASE_PN` = 200 jest teraz pilnowana testem zgodności z plikiem danych.
- `rust-port/engine/data/derived/diplomacy-war-peace-params.json`: kopia weba (cmp identyczny). `WarPeaceParams` nie ma `deny_unknown_fields`, więc nowe klucze są ignorowane przy parsowaniu.
- `rust-port/engine/src/domain/diplomacy_nap_trust.rs`: `progNapZaufanie` jest teraz czytany z danych. Nowa funkcja `nap_zaufanie_z_danych()` (OnceLock, `parse_diplomacy().params.prog_nap_zaufanie`, fallback `NAP_ZAUFANIE_FALLBACK` = 30 tylko przy błędzie parsowania). `resolve_nap_lock` używa jej, gdy `ctx.prog_nap_zaufanie` = None. ZMIERZONO grep: w `rust-port/engine/src` nie ma miejsca, które ustawia `prog_nap_zaufanie: Some(..)`, więc w produkcji zawsze działa ścieżka z danych. Zachowanie się nie zmienia (30 = 30).
- `rust-port/engine/tests/p6_repin_dyplomacja_dane2_vectors/web-vectors.json` (NOWY): wektory wygenerowane z URUCHOMIONEGO kodu weba (`gra/src/game/diplomacy.ts`, `getEffectiveDiplomacyParams`, `sisterAllianceDiplomacyParams`) generatorem `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-DYPLOMACJA-DANE-2-Q1/gen-dane2-web.mjs`. Wartości: `progSojuszWillingnessMin` 0,54; `progNapBezterminowyRelacja` 151; `progNapRelacja` 110; `progNapZaufanie` 30; sister low/normal/strong `progSojuszWillingnessMin` 0,324 / 0,162 / 0,081 (informacyjnie: w Rust nie ma portu `sisterAllianceDiplomacyParams`, ZMIERZONO grep `sister` = 0 trafień).
- `rust-port/engine/tests/p6_repin_dyplomacja_dane2_sojusz_nap_ekspansja.rs`: testy R1 + nowe (§4).
- Z R1 bez zmian: `diplomacy.json` (kopia weba), `civilizations.rs` pola serde 4 kluczy, `diplomacy.rs` `alliance_willingness_min` 0,68 → 0,54 i `nap_indefinite_relation` = 151, pin FNV `dataFnv.diplomacy` w `p6_1e_vectors/web-vectors.json` (`a9f6c991…` → `6cc897e2…`).

## 3. Zakres poza zmianą (ZAŁOŻENIA i długi)

Każdy punkt poniżej ma dowód grep w `rust-port/engine/src` (ZMIERZONO R2):

- Reguła balansu wojny i pokoju (`przewagaMilitarna`, próg 20%, DODATEK 1 PEACE-BALANCE-ACCEPT-DIAG) oraz `pokojAiAi.minBilansPW` (R-WEB-DIPLO-PEACE-AI-AI-NONNEGATIVE-BALANCE-Q1): BRAK konsumenta w Rust. Dane są zsynchronizowane, logika NIE jest portowana. Dług: `R-RUSTPORT-P6-DYPLO-PEACE-BALANCE-PORT`.
- `progNapBezterminowyRelacja` (151): pole `nap_indefinite_relation` bez konsumenta (propozycja NAP bezterminowego AI, web `ai.ts:7064`). Dług: port propozycji NAP AI.
- `ekspansjaGranicaBraz/Zelazo_zaufanie_perTura` (-3/-4) oraz `ekspansjaGranica_zaufanie_perTura` (-2): tylko pola struktury danych, brak konsumenta. Dług: port ekspansji granicznej.
- Sojusz siostrzany (`sisterAllianceDiplomacyParams`, skala 0,6/0,3/0,15 progu gotowości): brak portu w Rust. Dług: port (informacyjne wektory w `p6_repin_dyplomacja_dane2_vectors`).
- Rozejm: stała `TRUCE_BASE_PN` = 200 w kodzie oraz wartość z pliku danych są zgodne (test). Sama obsługa rozejmu jest w `diplomacy_truce_flow.rs` (osobny temat RUST #5).
- Konsument progu gotowości sojuszu: `diplomacy.rs:3392` (`min_willingness`). Test zachowania pokrywa granicę 0,54 (0,55 przechodzi próg, 0,53 jest odrzucane). NIE_ZMIERZONO: równość wartości `willingnessAlly` z webem (`aiDiplomacyStance`), bo w Rust nie ma wektorów tej funkcji (brak testów `ai_diplomacy_stance`). Dług: wektory `aiDiplomacyStance`.

## 4. Testy R2 (ZMIERZONO)

Środowisko: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0 CARGO_TARGET_DIR=<worktree>/.tgt` (katalog usunięty po bramce).

- `cargo fmt --check`: exit 0.
- `cargo clippy --all-targets -- -D warnings`: exit 0.
- `cargo test --lib`: 22 passed, 0 failed.
- `cargo test --doc`: 0 testów (exit 0).
- `cargo test --test p6_repin_dyplomacja_dane2_sojusz_nap_ekspansja`: 8 passed, 0 failed (3 testy R1 + `acceptance_points_rozejm_zgodny_z_web`, `war_peace_przewaga_i_pokoj_ai_ai_zsynchronizowane_z_web`, `nap_zaufanie_domyslne_czyta_diplomacy_json`, `web_vectors_wartosci_zgodne_z_rust`, `gotowosc_sojuszu_0_55_przechodzi_prog_0_54_a_0_53_nie`).
- Pełny zestaw: 338 binarek `tests/*.rs` uruchomionych w partiach (70 + 70 + 198 binarek = 338; `p6_8i_pick` osobno, 5 passed w 498 s). Wynik: 0 failed we wszystkich partiach.
- Baseline przed zmianą (`7897540ce`): NIE_ZMIERZONO (nie uruchomiono na bazie). Wynik na HEAD: 0 failed, więc żaden test nie pada, niezależnie od stanu bazy.
