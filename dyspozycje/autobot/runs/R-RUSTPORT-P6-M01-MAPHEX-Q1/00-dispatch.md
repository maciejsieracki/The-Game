# DISPATCH R-RUSTPORT-P6-M01-MAPHEX-Q1 (runda 1)

STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: M01-R2 — kompletny model heksa `MapHex` w `rust-port/engine/src/domain/mapgen/types.rs` (dziś szkielet pusty, `6fb1e57bc`).
MODEL: Operator HAIKU 5.5 (engine, nie grafika); Obrona HAIKU 5.5; Evaluator SONNET 5.5; Final Control SONNET 5.5.

## DLACZEGO (blokada P4-1B)
LEDGER (wpis M01, 2026-10-22) podaje „RUNDA-2: MapHex w types.rs”, ale NIGDZIE w repo nie ma definicji
`pub struct MapHex` (sprawdzone: `git log --all -S` i historia pliku `types.rs` — tylko `6fb1e57bc`, bez MapHex).
Rdzeń generatora M01 (`7fe46f7f4`: prims, maska Ziemi, klimat) jest na parity. Brakuje modelu heksa, od którego
zależy producent widoku mapy P4-1B (`D-DTO-6`, rekomendacja B: model `MapHex` jest właścicielem modelu heksa).

## ZASADA (CLAUDE.md zasada 11): NAJPIERW WEB
Wzorcem jest `gra/src/types/hex.ts` na pinie `07d2fbd72` (`git show 07d2fbd72:gra/src/types/hex.ts`).
Odwzorowanie 1:1 pól i wartości; różni się tylko kodowanie Rust.

Struktura z webu (do odtworzenia):
- `TerenBazowy` (8): laka, rownina, wzgorza, gory, plytkie_morze, morze, pustynia, polarny — WARTOŚCI JSON jak w webie (snake_case).
- `Nakladka` (8): brak, las, zloze_gliny, zloze_rudy, zloze_konia, zloze_owiec, zloze_bydla, zloze_lamy.
- `Ulepszenie` (8): brak, farma, irygacja, kopalnia, droga, droga_brukowana, pastwisko, tartak.
- `Widocznosc` (3): nieodkryty, odkryty, widoczny.
- `HexCoords { q, r }` (s = -q-r, nie przechowywać).
- `Wioska { istnieje: bool, ludnosc: u32/i32 }` (ludnosc 0 gdy brak wioski).
- `RzekaInfo { obecna: bool, krawedzie: Vec<u8> }` (indeksy krawędzi 0–5, flat-top; pusty gdy obecna=false).
- `Hex { coords, terenBazowy, nakladka, ulepszenie, wlasciciel, wioska, widocznosc, rzeka }`:
  - `wlasciciel: Option<<typ właściciela z silnika>>` (web: playerId lub null). Użyć ISTNIEJĄCEGO typu id gracza
    w silniku (sprawdzić `PlayerId`/`OwnerRef`); NIE wprowadzać nowego typu.
  - `widocznosc`: mapa per gracz; BRAK klucza = Nieodkryty (zachowanie webu). Kolejność deterministyczna (BTreeMap).

## DECYZJE TECHNICZNE (zasada 9/11, z webu)
- JSON enumów = wartości z webu (snake_case). Rozstrzyga otwartą kwestię „serde Terrain PascalCase vs snake_case weba”
  z LEDGER na korzyść webu. Zapisane w REJESTR-RUST.md.
- Pola i ich nazwy w Rust: snake_case w kodzie, `#[serde(rename = "...")]` tam, gdzie wartość JSON musi być jak w webie.
- Mapowanie generatora (`generate_map`) na `MapHex` NIE jest w tym temacie. Tylko typ + serde + walidacja.

## BAZA
`origin/rust-port/parity-v2` = `a01363d5f`. Przed pracą: `git merge-base --is-ancestor a01363d5f HEAD`.

## ALLOWLISTA (wszystko poza tym = FAIL)
- `rust-port/engine/src/domain/mapgen/types.rs` (typ MapHex, enumy, struktury pomocnicze)
- `rust-port/engine/tests/p6_m01_maphex_*.rs` (nowe testy)
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-M01-MAPHEX-Q1/**`
ZERO ZMIAN W: `gra/**`, `rust-port/renderer/**`, `rust-port/view-model/**`, `src-tauri/**`, `Cargo.lock`.

## BRAMKI (EXIT 0; CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0; target poza repo)
- `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --all-targets` (pełny), `git diff --check`.

## KRYTERIA KOŃCA
1. Wszystkie enumy i struktury z `hex.ts` odwzorowane; wartości JSON identyczne z webem (test porównania nazw z listą z pinu).
2. Round-trip JSON każdego typu; `widocznosc` bez klucza = Nieodkryty.
3. Test kształtu: 8/8/8/3 wariantów; brak dodatkowych pól względem `Hex`.
4. Brak `#[ignore]`, brak osłabionych asercji, `forbid(unsafe_code)`.
5. Każde twierdzenie o webie z dowodem plik:linia (pin `07d2fbd72`).

## PROCES
Operator (impl) → Obrona (jeśli zarzuty) → Evaluator → Final Control. Commit z jawnym `git add`, nigdy `-A`.
Bez push na parity, bez deployu. Commit bez nazwy modelu w treści; ostatnia linia `Claude-Session: https://claude.ai/code/session_01Eq7NKGj1PasjUCd7VCtYbZ`.
