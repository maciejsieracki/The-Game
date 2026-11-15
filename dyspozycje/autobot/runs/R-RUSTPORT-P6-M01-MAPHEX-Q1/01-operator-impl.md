STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-M01-MAPHEX-Q1 (M01-R2: kompletny model heksa `MapHex`)
GOAL: Odwzorowac 1:1 `gra/src/types/hex.ts` (pin `07d2fbd72`) w `rust-port/engine/src/domain/mapgen/types.rs`: enumy, struktury i serde z wartosciami JSON jak w webie.
ZMIANY/COMMIT: allowlista dispatchu. Pliki: `rust-port/engine/src/domain/mapgen/types.rs` (typ MapHex i enumy), `rust-port/engine/tests/p6_m01_maphex_types.rs` (nowy), `dyspozycje/autobot/runs/R-RUSTPORT-P6-M01-MAPHEX-Q1/01-operator-impl.md`. Commit: SHA w odpowiedzi orkiestratora (jawne `git add`, bez Cargo.lock). Baza: `origin/rust-port/parity-v2` = `a01363d5f` (zawiera `7817ef0c`).
TESTY: (pomiary w sekcji "Dowody" nizej)
BLOKADY: brak blokad technicznych. Notatki w sekcji "Notatki".
RUNDY: 1/5 (Operator, impl)
NASTEPNY KROK: Obrona (jesli zarzuty) -> Evaluator (SONNET) -> Final Control (SONNET). Integracja NIE w tym temacie.
DEPLOY/PUSH: NIE WYKONANO

## Zakres i odwzorowanie (dowody plik:linia, pin 07d2fbd72, `gra/src/types/hex.ts`)
- `TerenBazowy` (8): hex.ts:12-24, wartosci :13-23 -> `laka, rownina, wzgorza, gory, plytkie_morze, morze, pustynia, polarny`.
- `Nakladka` (8): hex.ts:30-39 -> `brak, las, zloze_gliny, zloze_rudy, zloze_konia, zloze_owiec, zloze_bydla, zloze_lamy`.
- `Ulepszenie` (8): hex.ts:45-54 -> `brak, farma, irygacja, kopalnia, droga, droga_brukowana, pastwisko, tartak`.
- `Widocznosc` (3): hex.ts:60-64 -> `nieodkryty, odkryty, widoczny`.
- `HexCoords` {q, r}: hex.ts:71-74. Implementacja: alias `pub type HexCoords = HexCoord` (istniejacy `domain/hex.rs`, ten sam ksztalt `{q: i32, r: i32}`, `s = -q-r` liczone, nie przechowywane). Nie dodawano duplikatu typu.
- `Wioska` {istnieje: bool, ludnosc: u32}: hex.ts:81-86.
- `RzekaInfo` {obecna: bool, krawedzie: Vec<u8>}: hex.ts:93-101 (indeksy 0-5 flat-top; pusta tablica gdy obecna=false).
- `MapHex` (web `Hex`): hex.ts:107-140. Pola i klucze JSON: `coords` (:109), `terenBazowy` (:112), `nakladka` (:118), `ulepszenie` (:121), `wlasciciel` (:127), `wioska` (:130), `widocznosc` (:136), `rzeka` (:139). Pole `wlasciciel` jest wymagane (null dozwolone, brak klucza = blad deserializacji), `deny_unknown_fields` na `MapHex`, `Wioska`, `RzekaInfo`.
- `visibility_for(player)`: brak klucza w `widocznosc` = `Nieodkryty` (hex.ts:134: "nieobecnosc klucza = Nieodkryty").

## Decyzje techniczne (zapisane w REJESTR-RUST.md przez orkiestratora)
1. JSON enumow = wartosci z webu (snake_case), jawne `#[serde(rename = "...")]` na kazdym wariancie. Rozstrzyga LEDGER "serde Terrain PascalCase vs snake_case" na korzysc webu. Warianty w kodzie Rustowe (`PlytkieMorze`, `ZlozeLamy`, `DrogaBrukowana`).
2. `wlasciciel: Option<PlayerId>`. Uzyto istniejacego `PlayerId` (`domain/ids.rs`), nie nowego typu. JSON id gracza jako liczba (kontrakt silnika dla wlascicieli, jak `OwnerRef`); web typuje `string | null` (TS), wiec to swiadome mapowanie typu, nie zmiana wartosci. Barbarzyncy/rebelianci nie sa wlascicielami heksa w `hex.ts` (typ `string | null`), wiec nie uzyto `OwnerRef`.
3. `widocznosc: BTreeMap<PlayerId, Widocznosc>`: kolejnosc deterministyczna; klucze JSON to stringi z liczb (serde_json obsluguje newtype `PlayerId` jako klucz mapy).
4. Zakres: typ + serde + dostep. Mapowanie `generate_map` na `MapHex` NIE jest w tym temacie (zgodnie z dispatchem).

## Dowody (wykonane w worktree, CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0, CARGO_TARGET_DIR poza repo)
- `cargo test --test p6_m01_maphex_types`: 19 passed, 0 failed, 0 ignored.
  - `web_values_*` (4): wartosci JSON enumow = lista z hex.ts.
  - `shape_*` (3): 8/8/8/3 wariantow (wyczerpujace `match` bez `_`, indeksy gesto 0..n-1); klucze `MapHex` = dokladnie 8 pol webu; JSON probki = oczekiwany JSON.
  - `round_trip_*` (4): wszystkie enumy, struktury, JSON z webu -> MapHex -> JSON, `wlasciciel: null`.
  - `visibility_*` (3): brak klucza = Nieodkryty; pusta mapa; klucze jako ID graczy.
  - `reject_*` (5): brak `wlasciciel`, nieznane pole, PascalCase w enumie, nieznana wartosc enuma, brak pola w `wioska`.
- `cargo clippy --all-targets -- -D warnings`: EXIT 0.
- `cargo fmt --check`: EXIT 0.
- `cargo test --all-targets --no-fail-fast` (pelny): 468 sekcji `test result: ok`, 0 FAILED (log poza repo).
- Pierwszy pelny przebieg wykryl FAIL w `tests/p6_m00_skeleton.rs` (2 testy): naglowek `//!` pliku `types.rs` musi zawierac linie `Temat wlasciciel: R-RUSTPORT-P6-M01-RDZEN-WERYFIKACJA-Q1` (wlasciciel z tabeli P6-25 §6, ZALOZENIE Z2). Naprawiono dopisaniem linii naglowka; wlasciciel niezmieniony. Po poprawce `p6_m00_skeleton` 5/5 OK.
- `git diff --check`: EXIT 0. `cargo fmt --check`: EXIT 0.

## Kryteria konca (dispatch)
1. Enumy i struktury z hex.ts odwzorowane; wartosci JSON = web; test porownania z lista z pinu: SPELNIONE (`web_values_*`).
2. Round-trip kazdego typu; `widocznosc` bez klucza = Nieodkryty: SPELNIONE (`round_trip_*`, `visibility_absent_key_is_nieodkryty`).
3. Test ksztaltu 8/8/8/3, brak dodatkowych pol wzgledem Hex: SPELNIONE (`shape_*`, `deny_unknown_fields`).
4. Brak `#[ignore]`, brak oslabionych asercji, `#![forbid(unsafe_code)]` w obu plikach: SPELNIONE.
5. Kazde twierdzenie o webie z dowodem plik:linia (pin 07d2fbd72): SPELNIONE (sekcja powyzej i komentarze w kodzie).

## Notatki
- `wlasciciel` i typ JSON id: patrz decyzja 2. Gdyby web kiedys serializowal playerId jako string w zapisie, to jest zmiana kontraktu, nie tego tematu.
- Cargo wygenerowal `rust-port/engine/Cargo.lock` (niesledzony w git, nie dodawany do commita).
- Nie dotykano: `gra/**`, `rust-port/renderer/**`, `rust-port/view-model/**`, `src-tauri/**`, `Cargo.lock`, mapgen generatora.
- Model: dispatch deklaruje Operator = HAIKU 5.5 (silnik, nie grafika); wykonane w tej sesji przez model Haiku 5.5. Zgodne z CLAUDE.md (Opus tylko pamiec/GPU/grafika Rust).
