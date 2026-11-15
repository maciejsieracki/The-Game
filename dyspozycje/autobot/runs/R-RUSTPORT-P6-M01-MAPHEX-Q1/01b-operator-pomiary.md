STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-M01-MAPHEX-Q1 (M01-R2: kompletny model heksa `MapHex`), runda Operatora 2: POMIARY (bramki + mutacje)
GOAL: Zmierzyc, czy bramki sa zielone i czy testy `p6_m01_maphex_types` wychwytuja realne bledy w `MapHex` (round-trip, wartosci JSON jak w webie, widocznosc bez klucza = Nieodkryty).
ZMIANY/COMMIT: BEZ zmian w kodzie. Jedyny nowy plik: `dyspozycje/autobot/runs/R-RUSTPORT-P6-M01-MAPHEX-Q1/01b-operator-pomiary.md`. Baza kodu = commit `0bb8a6f22` (zawiera `a01363d5f` i `7817ef0c`), detached HEAD w worktree. Mutacje wykonane na kopii `types.rs` i przywracane bit w bit (cmp OK po kazdym przebiegu). Cargo.lock wygenerowany i usuniety, nie commitowany.
TESTY: patrz sekcja "Bramki" i "Mutacje" nizej.
BLOKADY: brak blokad technicznych. Uwagi: (a) dispatch oznacza role jako "Operator (Opus)", ale temat nie jest pamiecia/GPU/grafika Rust, wiec wg CLAUDE.md zasada 2 wlasciwy model to HAIKU 5.5 (wykonano na Haiku 5.5); (b) dispatch odwoluje sie do "DODATKU r2", ktorego w `00-dispatch.md` NIE MA (plik ma 58 linii, sekcje konczy sie na "PROCES"); przyjeto zakres z sekcji "BRAMKI" i "KRYTERIA KONCA"; (c) w worktree startowym branch nie zawieral bazy (`46b845913`), wiec praca przeniesiona na commit `0bb8a6f22`.
RUNDY: 2/5 (Operator, impl r1 = `0bb8a6f22`; Operator, pomiary r2 = ten commit)
NASTEPNY KROK: (1) Obrona/Operator r3 (Haiku): dopisac testy dla trzech przezytych mutacji M08, M09, M11 (sekcja "Luki"), tylko w `rust-port/engine/tests/p6_m01_maphex_*.rs`. (2) Evaluator (Sonnet) po r3. (3) Final Control (Sonnet). Decyzja wlasciciela wymagana tylko przy pkt "Uwaga o typie owner" (nizej).
DEPLOY/PUSH: NIE WYKONANO

## Bramki (worktree, `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie, usuniety po bramkach)
- `cargo fmt --check` (crate `rust-port/engine`): EXIT 0.
- `git diff --check`: EXIT 0.
- `cargo test --test p6_m01_maphex_types`: 19 passed, 0 failed, 0 ignored.
- `cargo clippy --all-targets -- -D warnings`: EXIT 0.
- `cargo test --all-targets --no-fail-fast` (pelny): 468 sekcji `test result: ok`, 0 FAILED, EXIT 0 (log poza repo).

## Mutacje (13 mutacji na `rust-port/engine/src/domain/mapgen/types.rs`, kazda osobno, po kazdej przywrocenie pliku)

| ID | Mutacja | Wynik | Testy, ktore padly |
|---|---|---|---|
| M01 | `plytkie_morze` -> `plytkie-morze` (wartosc JSON) | ZABITA | round_trip_map_hex_from_web_json, shape_serialized_json_matches_web_sample, web_values_terenbazowy_match_pin |
| M02 | `visibility_for`: brak klucza -> `Odkryty` zamiast `Nieodkryty` | ZABITA | visibility_absent_key_is_nieodkryty, visibility_empty_map_is_nieodkryty_for_everyone |
| M03 | `MapHex` bez `deny_unknown_fields` | ZABITA | reject_unknown_field |
| M04 | `wlasciciel` bez `deserialize_with` (brak klucza = None) | ZABITA | reject_missing_owner_key |
| M05 | `MapHex` bez `rename_all = "camelCase"` | ZABITA | round_trip_map_hex_from_web_json, shape_map_hex_has_exactly_web_fields, shape_serialized_json_matches_web_sample |
| M06 | `Ulepszenie::Farma` JSON = `brak` (duplikat wartosci) | ZABITA | round_trip_all_enums, web_values_ulepszenie_match_pin |
| M07 | usuniety wariant `Ulepszenie::Tartak` | ZABITA | blad kompilacji (wyczerpujace `match` w tescie) |
| M08 | `Wioska` bez `deny_unknown_fields` | PRZEZYLA | brak |
| M09 | `RzekaInfo` bez `deny_unknown_fields` | PRZEZYLA | brak |
| M10 | `Wioska.ludnosc` z `#[serde(default)]` | ZABITA | reject_missing_wioska_field |
| M11 | `RzekaInfo.krawedzie` z `#[serde(default)]` | PRZEZYLA | brak |
| M12 | `Polarny` JSON = `polarne` | ZABITA | web_values_terenbazowy_match_pin |
| M13 | `Widocznosc::Odkryty` JSON = `widoczny` (duplikat) | ZABITA | round_trip_map_hex_from_web_json, round_trip_structs, round_trip_all_enums, round_trip_owner_null_is_kept_null, shape_serialized_json_matches_web_sample, web_values_widocznosc_match_pin |

Wynik: 10 zabitych / 13 (76,9%). Przezyte: M08, M09, M11.

## Luki (przezyte mutacje = brak asercji, nie bug w kodzie)
- M08 i M09: `deny_unknown_fields` na `Wioska` i `RzekaInfo` nie jest testowane. `reject_unknown_field` sprawdza tylko pole na najwyzszym poziomie `MapHex`. Brakuje testu z nieznanym polem zagniezdzonym (np. `wioska.dodatkowe`, `rzeka.dodatkowe`).
- M11: brak testu na brakujace pole `rzeka.krawedzie` (JSON `{"obecna": true}`). Test powinien wymagac bledu deserializacji.
- Dopisanie tych trzech asercji zabije M08, M09, M11 i nie wymaga zmian w `types.rs`.

## Uwagi (nie blokuja tej rundy)
- Uwaga o typie owner (do oceny Evaluatora): web typuje `wlasciciel` jako `string | null` (`gra/src/types/hex.ts:127`, pin `07d2fbd72`), a `widocznosc` kluczuje `playerId` jako string (`hex.ts:134`; w `gra/src/types/diplomacy.ts:59` klucz para ma format `"playerId_A:playerId_B"`). Rust uzywa `Option<PlayerId>` i `BTreeMap<PlayerId, _>`, czyli w JSON liczb (`"wlasciciel": 2`, klucze `"1"`, `"2"`). Test `shape_serialized_json_matches_web_sample` potwierdza liczby, nie wartosci z webu. Decyzja z r1 (`01-operator-impl.md`, decyzja 2) zostaje; to odstepstwo JSON od webu i nalezy je swiadomie zatwierdzic w REJESTR-RUST.md. NIE_ZMIERZONO: czy zapis z webu w ogole zawiera playerId jako string w praktyce (nie ma fixture'u z web).
- Dispatch: sekcja "DODATEK r2" nie istnieje w `00-dispatch.md` (patrz BLOKADY).
- Mapowanie `generate_map` -> `MapHex` nadal poza zakresem (zgodnie z dispatchem).

## Dowody
- Pin webu: `git show 07d2fbd72:gra/src/types/hex.ts` (140 linii), przypisy linii w kodzie zgodne z plikiem (enumy :12-64, struktury :71-140).
- Baza: `git merge-base --is-ancestor a01363d5f 0bb8a6f22` i `7817ef0c` -> obie OK.
- Worktree po pomiarach: `git status --short` pusty; `rust-port/engine/src/domain/mapgen/types.rs` identyczny z `0bb8a6f22` (cmp OK).

## Kryteria konca (dispatch) — stan po pomiarach
1. Enumy/struktury z hex.ts, wartosci JSON = web: SPELNIONE (`web_values_*`, M01/M06/M12/M13 zabite).
2. Round-trip kazdego typu; widocznosc bez klucza = Nieodkryty: SPELNIONE (`round_trip_*`, M02 zabita).
3. Ksztalt 8/8/8/3, brak dodatkowych pol wzgledem Hex: CZESCIOWO. Top-level SPELNIONE (M03, M05 zabite); zagniezdzone `deny_unknown_fields` NIE (M08, M09 przezyte).
4. Brak `#[ignore]`, brak oslabionych asercji, `forbid(unsafe_code)`: SPELNIONE (bez zmian w kodzie).
5. Kazde twierdzenie o webie z dowodem plik:linia: SPELNIONE (komentarze w `types.rs` i `01-operator-impl.md`).
