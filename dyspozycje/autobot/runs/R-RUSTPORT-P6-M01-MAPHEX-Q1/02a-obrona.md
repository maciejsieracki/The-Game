STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-M01-MAPHEX-Q1 (M01-R2: kompletny model heksa `MapHex`), OBRONA r3 (odpowiedz na zarzuty Evaluatora r1: Z1-Z4, U1-U4)
GOAL: Odwzorowac 1:1 `gra/src/types/hex.ts` (pin `07d2fbd72`) w `rust-port/engine/src/domain/mapgen/types.rs`; domknac zarzuty Evaluatora dowodem z pinu, testami i decyzjami zapisanymi tutaj.
ZMIANY/COMMIT: baza kodu = `e404a2a3c` (Evaluator r1 FAIL na `442632465` z kodem `0bb8a6f22`). Zmienione pliki (allowlista): `rust-port/engine/src/domain/mapgen/types.rs`, `rust-port/engine/tests/p6_m01_maphex_types.rs`, NOWY `rust-port/engine/tests/p6_m01_maphex_pin_snapshot.rs` (migawka `hex.ts` z pinu bajt w bajt, wzorzec `p6_m01_maphex_*.rs`), `dyspozycje/autobot/runs/R-RUSTPORT-P6-M01-MAPHEX-Q1/02a-obrona.md`. SHA: patrz `git log -1` na gałęzi `worktree-wf_0e33af85-341-4` (podane w odpowiedzi orkiestratora). Cargo.lock wygenerowany lokalnie, NIE commitowany.
TESTY: patrz sekcja "Bramki" nizej.
BLOKADY: brak technicznych. Do decyzji/wykonania przez orkiestratora (poza allowlista Operatora): wpis w `dyspozycje/rust-port/REJESTR-RUST.md` (decyzje Z3b i Z4, patrz nizej), asercja SHA-256 w tescie (Z1, patrz nizej).
RUNDY: 3/5 (Operator impl r1 = `0bb8a6f22`; pomiary r2 = `442632465`; Evaluator r1 FAIL = `e404a2a3c`; obrona r3 = ten commit)
NASTEPNY KROK: Evaluator r2 (Sonnet) na tym commicie -> Final Control (Sonnet).
DEPLOY/PUSH: NIE WYKONANO (brak push na `rust-port/parity-v2`, brak integracji, brak deployu).

Uwaga o modelu: dispatch podaje "Obrona (Opus)" w roli, ale CLAUDE.md (zasada 2) i sekcja MODEL dispatchu daja HAIKU 5.5 dla obrony tematu silnika (nie pamiec/GPU/grafika). Obrone wykonano na HAIKU 5.5 (zgodnie z zasada 2).

## Odpowiedzi na zarzuty

### Z1 (istotny) — PRZYJMUJE, z jednym wyjatkiem (SHA w tescie)
Zarzut: wektory enumow w `tests/p6_m01_maphex_types.rs` wpisane recznie, brak trwalego artefaktu z pinu.
Poprawka:
- Dodana migawka `tests/p6_m01_maphex_pin_snapshot.rs`: tresc `gra/src/types/hex.ts` z pinu `07d2fbd72` bajt w bajt (4141 B) w surowym literale `r###"..."###`. Wygenerowana skryptem, ktory sprawdza, ze wyciety literal == plik zrodlowy.
- Testy NIE maja juz list z reki (`WEB_TEREN`, `WEB_NAKLADKA`, `WEB_ULEPSZENIE`, `WEB_WIDOCZNOSC` usuniete). `pin_enum_entries(name)` parsuje z migawki pary `(Nazwa, 'wartosc')` w kolejnosci deklaracji i `check_enum` porownuje je z `format!("{v:?}")` i z `serde_json` dla kazdego wariantu Rust. Sprawdza to nazwy wariantow, wartosci JSON i kolejnosc naraz.
- `pin_interface_fields(name)` parsuje pola interfejsow `Hex`, `Wioska`, `RzekaInfo`, `HexCoords` z pinu; `shape_fields_match_pin_interfaces` porownuje je z kluczami JSON serializacji.
- Dowod SHA (poza testem): `git show 07d2fbd72:gra/src/types/hex.ts | sha256sum` = `07eb0ee905c2aac56c1f99127f36fd2a058a9d2822bbc4c92d753d9056867df1`; ten sam hash liczy skrypt z ekstrakcji literalu z migawki (`python3 -I`, wynik: 4141 B, `07eb0ee9...`).
- WYJATEK (ODRZUCAM w tescie, PRZYJMUJE jako dowod poza testem): asercja SHA-256 w kodzie testu wymagalaby nowej zaleznosci (np. `sha2` w `[dev-dependencies]` `rust-port/engine/Cargo.toml`), a Cargo.toml nie jest w allowliscie. Zamiast tego test sprawdza dlugosc migawki (4141 B) jako tani strazak, a SHA jest w tym dokumencie z komenda do odtworzenia. Decyzja dla orkiestratora: dodac zaleznosc w osobnym temacie albo zaakceptowac ten wariant.

### Z2 (istotny) — PRZYJMUJE
Zarzut: przezyte mutanty M08, M09, M11; brak testow na nieznane pole w zagniezdzonych strukturach i na brak `rzeka.krawedzie`; brak testow na znak `ludnosc` i szerokosc `krawedzie`.
Poprawka (testy, `types.rs` bez zmian w tym miejscu):
- `reject_unknown_field_in_wioska` (zabija M08), `reject_unknown_field_in_rzeka` (zabija M09), `reject_missing_rzeka_krawedzie` (zabija M11).
- Dodatkowo: `reject_unknown_field_in_coords` (wymuszone przez nowy `strict_coords`, patrz Z3), `reject_missing_coords_field`, `reject_negative_ludnosc`, `reject_krawedzie_above_u8`, `reject_string_owner_like_web_player_id`, `reject_string_visibility_key_like_web_player_id`.
Mutacje po poprawce (kazda osobno, plik `types.rs` przywracany i porownywany `cmp`; log: scratchpad `mut_*.log`):
| Mutant | Opis | Wynik | Test, ktory padl |
|---|---|---|---|
| M08 | `Wioska` bez `deny_unknown_fields` | ZABITY | reject_unknown_field_in_wioska |
| M09 | `RzekaInfo` bez `deny_unknown_fields` | ZABITY | reject_unknown_field_in_rzeka |
| M11 | `RzekaInfo.krawedzie` z `serde(default)` | ZABITY | reject_missing_rzeka_krawedzie |
| N1 | `coords` bez `strict_coords` (przyjmuje `s`) | ZABITY | reject_unknown_field_in_coords |
| N2 | `Wioska.ludnosc: i32` (ze znakiem) | ZABITY | reject_negative_ludnosc |
| N3 | `RzekaInfo.krawedzie: Vec<u16>` | ZABITY | reject_krawedzie_above_u8 |
Wynik: 6/6 mutantow z zarzutu Z2 i nowych (M08, M09, M11, N1, N2, N3) zabitych. Pierwotne mutanty M01-M07, M10, M12-M13 (z pomiarow r2) maja nadal te same testy (`web_values_*`, `visibility_*`, `reject_*`) i powinny zginac; PONOWNY PELNY PRZEBIEG 13 MUTANTOW: NIE_ZMIERZONO w tej rundzie (czas; kolejka cargo zajeta przez pelny test).

### Z3 (istotny, wymaga decyzji orkiestratora) — PRZYJMUJE decyzje (a) dla struktury, (b) dla zakresow
Zarzut: "walidacja" z dispatchu nie zrealizowana; `coords` przyjmuje `s`; `krawedzie` 9/200 i `wioska {istnieje:false, ludnosc:7}` przechodza.
Decyzja Operatora (zasada 9/11: web nie waliduje; decyzje techniczne podejmuje Operator; do potwierdzenia przez orkiestratora):
- (a) STRUKTURA — PRZYJMUJE: `coords` ma teraz wlasna postac wejsciowa `HexCoordsWire { q, r }` z `deny_unknown_fields` (`strict_coords`, `types.rs`). Powod: kryterium 3 (brak dodatkowych pol wzgledem pinu), a wspolny `domain::hex::HexCoord` (poza allowlista) NIE zmieniany. Serializacja bez zmian (`{q, r}`). Test: `reject_unknown_field_in_coords`, `reject_missing_coords_field`.
- (b) ZAKRESY — ODRZUCAM walidacje zakresu 0-5 i niezmiennikow (wioska bez wioski = ludnosc 0; rzeka bez krawedzi): web tego nie egzekwuje (hex.ts:84 "0 gdy brak", hex.ts:97-99 "indeksy 0-5", "pusta gdy obecna = false" to KOMENTARZE, nie kod). Zasada 11 zabrania wymyslania regul, ktorych nie ma w webie. Typ `u8` odrzuca wartosci >255 (zostaje). Test dokumentujacy: `web_parity_does_not_validate_ranges` (krawedzie [9,7], ludnosc 7 przechodza) — ma jawna nazwe i komentarz, ze to swiadomy parytet, nie rekomendacja danych. Pilnowanie zakresu zostaje dla generatora (poza tym tematem).
- Ryzyko (zapisane): jesli orkiestrator wybierze (a) dla zakresow, to osobny temat z testami i zmiana `types.rs`; obecny test `web_parity_does_not_validate_ranges` wtedy trzeba odwrocic.

### Z4 (umiarkowany) — PRZYJMUJE typ liczbowy; PRZYJMUJE wpis rejestru jako zadanie orkiestratora (poza allowlista)
Zarzut: `wlasciciel`/`widocznosc` maja typ liczbowy, a web deklaruje `string | null`; brak wpisu w REJESTR-RUST.md; naglowek `types.rs` klamal ("Zapisane w REJESTR-RUST.md").
Poprawki:
- Naglowek `types.rs` poprawiony: wskazuje `02a-obrona.md` jako uzasadnienie i mowi wprost, ze wpis do rejestru robi orkiestrator (rejestr poza allowlista Operatora).
- Testy odrzucania: `reject_string_owner_like_web_player_id` (`"wlasciciel": "player_0"` -> blad) i `reject_string_visibility_key_like_web_player_id` (klucz `"player_0"` -> blad). Dotychczasowe `reject_missing_owner_key`, `round_trip_owner_null_is_kept_null` zostaja.
- Dowody z pinu (sprawdzone przeze mnie ponownie, nie tylko cytat Evaluatora):
  - `git show 07d2fbd72:gra/src/map/generator.ts:272` — jedyne miejsce, w ktorym `Hex.wlasciciel` dostaje wartosc: `wlasciciel: null`.
  - `git show 07d2fbd72:gra/src/map/mapSnapshot.ts:243` i `:314` — `Hex.wlasciciel` tylko zapisywane/odczytywane w snapshocie (`intern(hex.wlasciciel)`, `null` gdy -1). Nie ustawia go zadna inna sciezka w `gra/src` (`git grep -E 'wlasciciel\s*(=[^=]|:)'` daje tylko generator i snapshot; pozostale `wlasciciel: string` dotycza `army.ts:38`, `city.ts:118`, `unit.ts:50`, czyli innych typow).
  - Wniosek: w pinie `Hex.wlasciciel` jest zawsze `null` w rzeczywistej sciezce danych. Wybor liczby NIE zmienia dzis zachowania webu; wplywa tylko na przyszly zapis/odczyt snapshotu, gdyby pole zaczeto ustawiac. Pozostaje ryzyko: zapis z `"player_0"` nie zdeserializuje sie (test to dokumentuje).
  - Wewnetrzna niespojnosc webu (number|null w `farm-assign-hint.ts:127`, string|null w `livestock-unlock.ts:120`, `widocznosc[String(ownerId)]` w `main.ts:15063`) zostaje odnotowana jako NIE_ZMIERZONO co do realnych danych.
- Propozycja wpisu do REJESTR-RUST.md (dla orkiestratora): "M01-R2 MapHex: `wlasciciel` = `Option<PlayerId>` (JSON: liczba lub null, brak klucza = blad); klucze `widocznosc` = PlayerId jako liczby w BTreeMap (numeryczny porzadek). Odstepstwo od deklaracji weba `string | null` (hex.ts:127): web nie ustawia wartosci niepustej poza snapshotem (generator.ts:272), engine uzywa liczbowego id. Testy: reject_string_owner_like_web_player_id, reject_string_visibility_key_like_web_player_id, visibility_map_keys_serialize_in_numeric_player_order."

## Uwagi mniejsze

- U1 (test kolejnosci kluczy) — PRZYJMUJE. `visibility_map_keys_are_player_ids_in_order` zastapiony przez `visibility_map_keys_serialize_in_numeric_player_order`: surowy `serde_json::to_string(&BTreeMap<PlayerId,_>)` z kluczami 10 (wstawiony pierwszy) i 2; oczekiwany tekst `{"2":"widoczny","10":"odkryty"}`. Nie uzywa `serde_json::Value` (ktory sortuje leksykograficznie, co maskowalo problem). Leksykograficzny porzadek dalby `"10"` przed `"2"` i test by padl.
- U2 (tautologiczne `len()`) — PRZYJMUJE. Asercje `teren_all().len() == 8` itd. usuniete. Liczby wariantow sa teraz porownywane z pinem (`pin_enum_entries(...).len()`), a permutacja tablic `*_all()` jest sprawdzana przez `*_index` (wyczerpujacy `match`).
- U3 (trailer Co-Authored-By z nazwa modelu) — ODRZUCAM usuniecie. Dowod: konfiguracja atrybucji srodowiska (system reminder) wymaga dla commitow linii `Co-Authored-By: Claude Haiku 5.5 <noreply@anthropic.com>` i linii `Claude-Session:`. Dispatch "bez nazwy modelu w tresci" rozumiem jako zakaz nazwy modelu w tresci opisu, nie w trailerze. Commit obrony: tresc opisu bez nazwy modelu, trailery jak w konfiguracji srodowiska, ostatnia linia `Claude-Session`. Rozstrzygniecie sprzecznosci: orkiestrator.
- U4 (inny `struct MapHex` w rendererze, `rust-port/renderer/src/pick/terrain.rs:246`) — PRZYJMUJE jako informacje. Brak zmiany kodu. Osobny crate (`renderer` nie zalezy od `engine` w tej sciezce), kolizji kompilacji nie ma. P4-1B musi swiadomie uzyc modelu z silnika (`civ_engine::domain::mapgen::types::MapHex`).
- Dodatkowo (nie zarzut): `#![forbid(unsafe_code)]` w obu plikach testu i w `types.rs`; brak `#[ignore]`; brak `unsafe`.

## Bramki (worktree; `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`; `CARGO_TARGET_DIR` w scratchpadzie; Cargo.lock lokalny, nie commitowany)
- `cargo fmt --check` (crate `rust-port/engine`): EXIT 0 (po `cargo fmt` zmienil sie tylko `tests/p6_m01_maphex_types.rs`, formatowanie; `git status` bez innych plikow).
- `cargo test --test p6_m01_maphex_types`: 29 passed, 0 failed, 0 ignored (bylo 19).
- `cargo clippy --all-targets -- -D warnings`: EXIT 0.
- `cargo test --all-targets --no-fail-fast` (pelny): patrz wynik w odpowiedzi orkiestratora (log poza repo).
- `git diff --check`: patrz odpowiedz orkiestratora.

## Kryteria konca (dispatch) — stan po obronie r3
1. Enumy i struktury z `hex.ts`, wartosci JSON = web: SPELNIONE, dowod z pinu w tescie (parsowanie migawki), nie z przepisanych list.
2. Round-trip kazdego typu; `widocznosc` bez klucza = Nieodkryty: SPELNIONE.
3. Ksztalt 8/8/8/3, brak dodatkowych pol wzgledem `Hex`, takze na poziomie zagniezdzonym: SPELNIONE (`shape_fields_match_pin_interfaces`, `reject_unknown_field_in_*`, `reject_unknown_field_in_coords`).
4. Brak `#[ignore]`, brak oslabionych asercji, `forbid(unsafe_code)`: SPELNIONE.
5. Kazde twierdzenie o webie z dowodem plik:linia: SPELNIONE (naglowek testu i `types.rs`; Z4 z dowodem `generator.ts:272`, `mapSnapshot.ts:243,314`).

## Co zostaje otwarte (dla orkiestratora)
- Wpis rejestru (Z3b, Z4) w `dyspozycje/rust-port/REJESTR-RUST.md` — poza allowlista Operatora.
- Decyzja o asercji SHA-256 w tescie (Z1): nowa zaleznosc (`sha2` w dev-dependencies) poza allowlista.
- Pelny przebieg mutacji M01-M13 po r3: NIE_ZMIERZONO w tej rundzie.
