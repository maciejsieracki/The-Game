STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-TERYTORIUM-FORTY-Q1
GOAL: REPIN delty weba `dc8a3adc` -> `4bbef081d` (forty/terytorium); `p6_8i_pick` w trybie ostrym, 0 odchylen.

## Odpowiedzi na zarzuty Evaluatora

1. Brak logow mutacji: PRZYJMUJE. Pierwotne 32/31 wycofane jako NIE_ZMIERZONO. Dodane `mutate-teren.py` (jedno wystapienie wzorca, `cargo test` na `p6_repin_teren_domain` + `p6_8i_pick`, przywrocenie pliku), logi `mut-<ID>.log`, `mut-podsumowanie.txt`. Zmierzone: 42 mutanty, 39 zabitych, 3 przezylo (T6 rownowazny - dowod plik:linia w P6-REPIN-TERYTORIUM-FORTY.md §3; D3/D4 mutuja `zasieg_pol`, pole nieczytane przez logike Rust, `terrain_map.rs:124`; promien czyta `zasieg_terytorium`, `terrain.rs:273-295`, a D1/D2 zabite). Dane `terrain-improvements.json` bajtowo identyczne z pinem (`cmp`). Mutacja `o.seq < b.seq` -> `<=` (T4) zabita, zgodnie z reka Evaluatora. `git status` po mutacjach: tylko nowe pliki (zero zmian w sledzonych zrodlach).
2. Zalozenie B poza allowlista + rozmiar qualifier.json: ODRZUCAM jako zarzut do poprawki, zalozenie B zostaje jawnie do decyzji Final Control. Dowod: wejscia wektorow identyczne (`dowod-regen-wektorow.txt`, Evaluator potwierdzil niezaleznie); bez regeneracji 19 testow w 6 binariach swiecilo na czerwono z powodu zmiany pinu (nie bledu portu). Limit 6 MB dotyczy NOWYCH fixture (`teren.json` 2,0 MB); `qualifier.json` to istniejacy fixture: 7 737 658 B przed (`fd8585daf`) vs 7 705 865 B po (`git cat-file -s`), czyli nie wzrosl. Zmiana okien promieni (5/3) naturalnie zmienia dlugosc list `api/qualifying`.
3. Brak liczb scenariuszy w logu: PRZYJMUJE. Dodane `liczniki-8i.txt` (python3 -I na `pick.json`): pin `4bbef081d`, 2227 scenariuszy, 107 z niepustym `fortNodes`, EXIT=0.

## Nie zmieniono
Zero zmian w `gra/**`, kodzie Rust, `Cargo.toml`, `WERSJE.md`. NieSledzony `rust-port/engine/Cargo.lock` (artefakt buildu) nie jest commitowany.

RUNDY: 1/5 (Obrona)
DEPLOY/PUSH: NIE WYKONANO
