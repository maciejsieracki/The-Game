STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-29-TEXT-FONTS-Q1
GOAL: RR-T8b — fonty i tekst na `raster::Canvas2dLite` vs Chromium 141 (bez zmian zakresu). Obrona Operatora wobec zarzutów 1–5 Evaluatora r1 (PASS-WITH-NOTES).

ZMIANY-COMMIT: na `ff0b0239` (r1): `26360bb8` (testy + fixtury + dokument + mutacje obrony) i commit z tym raportem i `dowody/02-obrona-gates.{sh,log}`. Bez push. `src/**` bez zmian.
- `tests/fixtures/text/{gen.mjs,widths.tsv,truncate.tsv,fontparse.tsv,MANIFEST.sha256}`: referencje odtworzone w Chromium 141.0.7390.37. `ref/*.rgba` (36), `scenes.tsv`, `baselines.tsv`, `upper.tsv`, `city_names.txt` i `versions.txt` mają sha256 identyczne jak w r1. Fixtury mają 3 869 084 B (≤ 8 MB).
- `tests/text_metrics.rs`, `tests/text_fonts.rs`, `P4-29-TEXT-FONTS.md` §0, §4.1, §4.2, §7 i nowa §8a.

ZARZUTY:
1. E03 (brak przypadku `maxW == measureText(name)`): **PRZYJMUJĘ.** `gen.mjs` liczy `maxW` w Chromium jako dokładny float: 40 nazw z budżetem równym szerokości nazwy, 40 z budżetem równym szerokości `nazwa[..-2]+'…'` oraz po 3 analogiczne wiersze hover. Test wymaga co najmniej 40 przypadków „mieści się dokładnie”; zmierzone 43. Mutanty O1 (`<=`→`<`), O4 i O5 (`>`→`>=`) są zabite.
2. E09 i E05: **PRZYJMUJĘ.** Dodałem wiersze hover o długości 2 i 1 jednostki UTF-16 (`AB`, `Ż·`, `WA`, `A`, `·`) przy `maxW = 1` oraz nazwy `AB`, `ŻÓ`, `A`. W `fontparse.tsv` doszły 4 sondy `bolder`: Chromium serializuje je jako `bold`, a `bolder lighter` odrzuca. W `widths.tsv` doszło 16 wierszy `bolder`/`lighter`. Mutanty O2, O3 i O6 są zabite.
3. Tolerancja 1e-9 w `measureText`: **PRZYJMUJĘ.** `same_bits()` porównuje przez `to_bits` (±0 traktowane jako równe) w testach szerokości i linii bazowych. `WIDTH_TOL` usunięty. Mutant O7 (+1 ulp) jest zabity.
4. Brak sha256 fixtur w teście: **PRZYJMUJĘ.** Nowy test `text_fonts::fixtures_match_manifest_sha256` sprawdza każdą linię manifestu fixtur (w tym `ref/` i 6 fontów) i wymaga, żeby każdy plik był na liście. Jawny wyjątek to `golden.tsv`: pisze go test Rust (`TEXT_BLESS`), a nie generator. Ujawnił to nowy test. Mutanty O8 i O9 (zmieniony 1 bajt lub 1 bit) są zabite.
5. Bramy na HEAD bazowym: **PRZYJMUJĘ formalnie.** Bramy obrony uruchomiłem po commicie. `dowody/02-obrona-gates.log` pokazuje `HEAD 26360bb8`.

TESTY (`dowody/02-obrona-gates.log`, HEAD `26360bb8`):
- `fmt`, `clippy` i `clippy --features gpu`: EXIT=0.
- `cargo test --locked --all-targets` na 1.97.0: **254 passed / 0 failed**, EXIT=0.
- `cargo +1.87.0 test --locked --all-targets`: **254 passed / 0 failed**, EXIT=0.
- `measureText`: 5 121/5 121 bitowo. Przycięcia: 12 714/12 714 (2 578 przyciętych). Parser `font`: 43/43.
- Mutacje obrony (`dowody/02-obrona-mutations.{py,log}`): **9/9 KILLED**. Razem z r1: 32/32.
- `git diff --check`: OK.

BLOKADY: brak. Pozycje NIE_ZMIERZONO bez zmian (P4-29 §9): clippy na 1.87.0, Windows/GPU, gamma masek Skii, architektury inne niż x86_64.
RUNDY: 1/5 (obrona)
NASTĘPNY KROK: Final Control (R-RUSTPORT-P4-29-TEXT-FONTS-Q1)
DEPLOY/PUSH: NIE WYKONANO
