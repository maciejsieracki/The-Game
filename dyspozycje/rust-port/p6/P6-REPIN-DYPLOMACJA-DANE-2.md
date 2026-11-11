# P6-REPIN-DYPLOMACJA-DANE-2 — dalszy dryf danych dyplomacji (Rust względem weba)

TEMAT: R-RUSTPORT-REPIN-DYPLOMACJA-DANE-2-Q1 · RUNDA 1/5 · DOMAIN: GAME (RUST)
BAZA RUST: `origin/rust-port/parity-v2` = `7897540ce` · BAZA WEB: `origin/main` = `cffe39cb9`

Legenda: ZMIERZONO = odczyt pliku/komendy w tej rundzie; NIE_ZMIERZONO = nie potwierdzone.

## 1. Pomiar dryfu (ZMIERZONO: diff kluczy `origin/main:gra/data/diplomacy.json` vs `rust-port/engine/data/diplomacy.json`)

| Klucz | Web | Rust przed | Rust po |
|---|---|---|---|
| `progSojuszWillingnessMin` | 0,54 | 0,68 | 0,54 (JSON + `DiplomacyParams::alliance_willingness_min`) |
| `progNapZaufanie` | 30 | brak w JSON (fallback 30 w `diplomacy_nap_trust.rs`) | 30 w JSON |
| `progNapBezterminowyRelacja` | 151 | brak | 151 w JSON + pole `DiplomacyParams::nap_indefinite_relation` |
| `ekspansjaGranicaBraz_zaufanie_perTura` | -3 | brak | -3 w JSON |
| `ekspansjaGranicaZelazo_zaufanie_perTura` | -4 | brak | -4 w JSON |
| `ekspansjaGranica_zaufanie_perTura` | -2 | -2 | -2 (bez zmian) |
| opis pakt NAP (tekst `Opis`) | z pozycją „Zaufania ≥ 30” | bez | zsynchronizowany (plik skopiowany z weba) |

Pozostałe klucze `diplomacy.json` są zgodne (ZMIERZONO: diff płaski, 0 innych różnic).

`war-rules-params.json`: w Rust brak pliku danych, literały są w kodzie. ZMIERZONO: `DELAY_INTER_CIV_WARS_UNTIL_TURN` 40, `MAX_CONCURRENT_WARS_STONE` Some(1), `MAX_CONCURRENT_WARS_FROM_BRONZE` None, `ERA_FORCED_WAR_START_TURNS_BRONZE/IRON` 40, `WOJNA_KAMIEN_WYMUSZONA_START_TURY` 40, `max_era_forced_wars_per_civ_per_era` Some(1). Zgodne z web, bez zmian.

`diplomacy-acceptance-points.json`: wpis `traktaty.rozejm` (200 PN) istnieje w webie, a w Rust go nie ma. NIE_ZMIERZONO, czy rozejm jest obsługiwany w innym miejscu Rust (temat RUST #5 ROZEJM). Poza zakresem tej rundy, zostaje jako dług.

## 2. Zmiany (commit w gałęzi `r-repin-dyplo-dane-2`)

- `rust-port/engine/data/diplomacy.json`: pełna kopia `origin/main:gra/data/diplomacy.json` (ZMIERZONO: sha-zgodność FNV-1a `6cc897e2c8a06f92`).
- `rust-port/engine/src/data/civilizations.rs`: pola serde dla 4 nowych kluczy (`ekspansjaGranicaBraz/Zelazo`, `progNapZaufanie`, `progNapBezterminowyRelacja`).
- `rust-port/engine/src/domain/diplomacy.rs`: `alliance_willingness_min` 0,68 → 0,54; nowe pole `nap_indefinite_relation` = 151.0.
- `rust-port/engine/tests/p6_1e_vectors/web-vectors.json`: pin FNV `dataFnv.diplomacy` (2 wystąpienia) `a9f6c9917d17f733` → `6cc897e2c8a06f92` (plik jest teraz bajtowo zgodny z webem).
- `rust-port/engine/tests/p6_repin_dyplomacja_dane2_sojusz_nap_ekspansja.rs` (nowy, 3 testy).

## 3. Zakres poza zmianą (ZAŁOŻENIA)

- `progNapBezterminowyRelacja` (151): brak konsumenta w Rust (AI nie proponuje NAP bezterminowego). Pole dodane jako parametr, bez podpięcia. Dług: temat propozycji NAP AI (ai.ts:7064).
- `ekspansjaGranicaBraz/Zelazo_zaufanie_perTura`: brak konsumenta w Rust po obu stronach zgodności. Dane zsynchronizowane, logika poza tematem.
- `progNapZaufanie` w JSON: konsument Rust to `diplomacy_nap_trust.rs` (fallback 30, zgodny). Wartość z JSON nie jest czytana przez ten moduł (NIE_ZMIERZONO, czy wymaga podpięcia).
- Rozejm w acceptance points: patrz §1.

## 4. Testy (ZMIERZONO, `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`)

- `cargo fmt --check`: OK.
- `cargo clippy --all-targets -- -D warnings`: exit 0.
- `cargo test --lib`: 22 passed, 0 failed.
- Wszystkie 338 binarek `tests/*.rs` uruchomione osobno: 0 failed. `p6_8i_pick` przeszedł (5 passed) w 380 s; uruchomiony osobno z timeoutem 580 s.
- Nowy test `p6_repin_dyplomacja_dane2_sojusz_nap_ekspansja`: 3 passed.
- Doctesty: NIE_ZMIERZONO.
- Baseline przed zmianą: NIE_ZMIERZONO (nie uruchomiono osobno; wynik po zmianie jest 0 failed).
