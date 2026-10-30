# Operator (runda 3): odpowiedz na zarzuty Final Control rundy 2

Temat: `R-RUSTPORT-P6-M06B1-WYBRZEZE-FINALIZACJA-Q1`. Baza: `c92ba394` (Operator-pomiary r2). Dokument: `dyspozycje/rust-port/p6/P6-M06B1-WYBRZEZE-FINALIZACJA.md` (przepisany, §9.8 odsyla tutaj).
Runda: 3/5. Kod `landsea.rs`: jedyna zmiana to refaktor `thicken_coast_and_smooth_inlets` -> `_with_passes` (logika bez zmian; potwierdzone testami i mutacjami).

## Zarzut 1 (nakladka na wodzie nieobserwowalna; Q, L, N przezyly) - PRZYJMUJE

- Poprawka: 50 nowych map z nakladka `las` na heksach wodnych (generator `gen-m06b1-vectors.mjs`, sekcja 7, ziarno 20261031,
  dopisane NA KONCU kazdej kategorii). Heksy wodne z `las` w wejsciu: 1351. Przypadki w zbiorze: purge 50, trim 50, flatten 50,
  thicken 100, finalize 100. Web zmienia nakladke las -> brak na heksie wodnym (z inna zmiana terenu): purge 30, trim 31,
  flatten 8, thicken 100, finalize 100.
- Mutanty dopisane do M-listy: M29 (Q), M30 (L), M31 (N) - wszystkie ZABITE (`mut-results-m06b1-r3.json`, rc=101):
  M29 przez `purge_relief_valley_water_matches_web`, M30 przez `flatten_false_coastal_river_notches_matches_web`,
  M31 przez `thicken_coast_and_smooth_inlets_matches_web`.
- Test `tests/p6_m06b1_overlay.rs` (2 testy) pilnuje obecnosci przypadkow i resetow nakladki w wyjsciu weba.
- Weryfikator Python: 1868 sprawdzonych, 0 rozbieznosci, w tym przypadki z nakladka. Test czulosci: kopie weryfikatora bez
  resetu nakladki (Q/L/N) daja 30 / 8 / 100 rozbieznosci (`verifier-sabotage-r3-{Q,L,N}.txt`).
- Korekta opisu: Q (`clear_hex_to_laka_with_river`) dotyczy WYLACZNIE `purge`. `trim` (`trimDeepOceanBays`) deleguje do
  `trim_enclosed_ocean_only` z M06A, ktore ma wlasny reset nakladki (`landsea.rs`, wiersz z `hex.overlay = Nakladka::Brak`
  w `trim_enclosed_ocean_only`) - to nie jest mutowane w tym temacie. Wektory trim z nakladka sa jednak w zbiorze.

## Zarzut 2 (sprzeczne twierdzenia w dossier: §6 cap "nie zmienia wyniku", §9.1 "Przezyly (5)") - PRZYJMUJE

- Dossier przepisany w calosci. §6: wiersz capu zastapiony pomiarem (cap 11 i 13 daja rozny stan na 10 z 10 map rozroznialnych).
  §9.1: lista aktualna (31 mutacji, 28 zabitych, 3 przezyte: M12, M19, M20 z dowodami); usunieto "NIE ZABITE, NIE DOWIEDZIONE".
  §9.2: stan zamkniety; wyraznie napisane, ze poprzednie zdanie o capie bylo bledne.

## Zarzut 3 (wymog "stare kategorie jako PREFIKS nowych (cmp-vectors)" niespelniony) - PRZYJMUJE

- Zrobione: nowy `web-vectors.json` (generator z dopisanymi przypadkami) ma stare kategorie jako prefiks (ocean 330/330,
  purge 228 -> 278, trim 80 -> 130, finalize 420 -> 520, thicken 296 -> 396, flatten 88 -> 138; maps 530 -> 580).
- Sprawdzenie: `check-prefix-m06b1-r3.py` porownuje wartosci JSON stare vs nowe, `prefix-check-r3.txt`: PREFIKS ZACHOWANY (EXIT=0).
  Liczniki `stats` identyczne. Rozmiar 8 404 764 B (< 10 MB).

## Zarzut 4 (pokrycie capu 12 cienkie; test nie sprawdza zachowania kodu) - PRZYJMUJE

- Zrobione: 10 map rozroznialnych (gen-indeksy 5, 6, 8, 15, 18, 26, 29, 37, 44, 62; `m06b1-r3-cap-pick.mjs`, `cap-picks-r3.json`)
  + 3 ogolne; kazda ma PELNE stany weba dla cap 11, 12, 13 (`web-cap.json`, 1.9 MB).
- Kod: `thicken_coast_and_smooth_inlets_with_passes(..., passes)`; test `explicit_passes_match_web_cap11_12_13` wola kod Rust
  z jawnym limitem 11/12/13 i porownuje stan + zwrot z wektorami weba (13 map x 3); test `cap_is_observable_in_rust_on_web_maps`
  liczy wynik w Rust (nie z JSON) i wymaga roznicy cap 11 i 13 wzgledem 12 na 10 mapach.
- Mutanty: M15 (limit 1), M16 (limit 11), M17 (limit 13) ZABITE (M16/M17 przez 3-4 testy kazdy). Stara wersja M-listy
  dla M15-M17 (petla na `p.przebiegi_wygladzania`) zostala przepisana na parametr `passes` (ta sama semantyka mutacji).

## Zarzut 5 (niezaleznosc weryfikatora Python: oracle = te same wektory; luka nakladki dziedziczona) - CZESCIOWO

- PRZYJMUJE skutek: weryfikator dziedziczyl luke nakladki. Teraz wektory z nakladka sa w zbiorze, a weryfikator
  implementuje reset nakladki we wszystkich czterech miejscach (set_to_laka, reset_to_laka_full, flatten, pierscien (b)).
  Dowod czulosci: 30 / 8 / 100 rozbieznosci przy usunietym resecie (Q/L/N).
- ODRZUCAM zadanie, by oracle byl niezalezny od weba: dispatch rundy 2 definiuje wartosci referencyjne jako wektory z
  uruchomionego weba (pin `edb8fb56`). Niezaleznosc weryfikatora polega na tym, ze jego implementacja jest napisana z tekstu TS
  (bez czytania `landsea.rs`); wynik ten jest zgodny z wymogiem dispatchu ("niezalezny weryfikator Python ... 0 rozbieznosci").

## Wyniki bramek i mutacji (runda 3)

- `cargo fmt -- --check`: EXIT=0 (`gate-fmt-r3.log`).
- `cargo clippy --offline --all-targets -- -D warnings`: EXIT=0 (`gate-clippy-r3.log`).
- `cargo test --offline --no-fail-fast`: EXIT=0, 1441 passed, 0 failed (`gate-test-r3.log`).
- Weryfikator Python: EXIT=0, 1868 sprawdzonych, 0 rozbieznosci (`verifier-python-r3.txt`).
- Mutacje: 31, zabite 28, przezyte 3 rownowazne (M12, M19, M20) (`mut-results-m06b1-r3.json`, `mut-logs-r3/`).
- Pliki zmienione w rundzie 3 (kod i testy): `landsea.rs` (refaktor `_with_passes`), `tests/p6_m06b1_cap.rs` (przepisany),
  `tests/p6_m06b1_overlay.rs` (nowy), `tests/p6_m06b1_vectors/web-vectors.json`, `tests/p6_m06b1_vectors/web-cap.json`.
  Runda 3 nie zmienia `mapgen-coast.json`, `derived.rs`, `relief.rs`, `bridge.rs`, `Cargo.toml`, `gra/**`, `renderer/**`, `src-tauri/**`.
