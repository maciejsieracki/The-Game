STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-29-TEXT-FONTS-Q1
GOAL: RR-T8b. Fonty i tekst w `rust-port/renderer` na `raster::Canvas2dLite` zgodne z Chromium: measureText, przycinanie po jednostkach UTF-16, toUpperCase, sceny T5/T6/T9/T15. To jest Final Control r3 po Evaluatorze r3 i obronie r3.

ZMIANY/COMMIT:
- Oceniany kod: `51839a356` (r1), `6cee8e46c` i `283f8634c` (obrona r1). Wszystkie trzy są już przodkami `origin/rust-port/parity-v2`. Do tego dochodzą `b7bda0016` (testy i dokument z obrony r3) oraz `69eae2e85` (raport obrony r3 i dowody).
- Baza obrony r3: `525a2ef7b`. `git merge-base 69eae2e85 origin/rust-port/parity-v2` = `525a2ef7b`.
- Gałąź `parity-v2` przesunęła się do `fffc5e7c6` (P4-34; zero ścieżek P4-29). `git merge-tree --write-tree fffc5e7c6 69eae2e85` daje drzewo `537a0cfe5`, bez konfliktów.
- Ten raport jest jedyną zmianą FC i leży w commicie na `69eae2e85`. Kod bez zmian.

ALLOWLISTA (sprawdzona samodzielnie):
- `git diff --name-status 525a2ef7b 69eae2e85` daje 14 plików. Wszystkie mieszczą się w allowliście: `tests/text_*.rs`, `P4-29-TEXT-FONTS.md` i `runs/<ID>/**`.
- `src/**` i `tests/fixtures/text/**` są bez zmian. Nie zmieniono `gra/**`, `rust-port/engine/**`, `Cargo.toml` ani `Cargo.lock`.
- Commity r1 i obrony r1 też mieszczą się w allowliście: `raster/text/**`, `raster/mod.rs`, `raster/canvas.rs` (zmiana opisana w P4-29), `assets/fonts/**`, `Cargo.{toml,lock}`, `tests/text_*.rs` i `tests/fixtures/text/**`.
- Rozmiary (`du -sb`): `tests/fixtures/text` = 3 869 084 B (limit 8 MB), `assets/fonts` = 3 069 998 B (limit 6 MB).

TESTY (FC, HEAD `69eae2e85`; zmienne `CARGO_INCREMENTAL=0`, `*_DEBUG=0`; `CARGO_TARGET_DIR` w scratchpadzie, usunięty po bramkach):
- `cargo fmt --all -- --check`: EXIT=0.
- `cargo clippy --locked --all-targets -- -D warnings`: EXIT=0.
- `cargo clippy --locked --all-targets --features gpu -- -D warnings`: EXIT=0.
- `cargo test --locked --all-targets` na rustc 1.97.0: EXIT=0, **478 passed / 0 failed** (63 bloki `test result`).
- `cargo +1.87.0 test --locked --all-targets`: EXIT=0, **478 / 0**.
- `git diff --check 525a2ef7b 69eae2e85`: EXIT=0. `git status` czysty.
- Mutacje obrony r3 powtórzone przez FC (`05-obrona-r3-mutations.py`): **10/11 KILLED**, wynik identyczny z logiem obrony. Przeżywa R3-E7.
- Sonda Chromium 153 (`05-obrona-r3-chromium-probe.mjs`) powtórzona przez FC: wyjście **identyczne** z `05-obrona-r3-chromium-probe.log`. Jedyna różnica to końcowa linia `EXIT=0` dopisana w logu. Stałe w `text_edge_cases.rs` są więc odtwarzalne.
- Liczby w P4-29 sprawdzone na fixturach: `widths.tsv` = 5 121 wierszy danych, `truncate.tsv` = 12 714. Zgadzają się z §4.1 i §4.2.

ORZECZENIA (zarzuty Evaluatora r3):
1. GPOS x/y_offset (E6, E9): **ODDAL** (usunięte). Nowy test `combining_marks_follow_gpos_offsets_like_chromium` zabija E6, E6b, E9 i E9b (FC powtórzyło). Uwaga: referencja pochodzi z Chromium 153, a tolerancja ±1 px to ZAŁOŻENIE.
2. `\n \r \f` (E4): **ODDAL** (usunięte). 87 szerokości zgadza się bit w bit z Chromium 153, a test `ascii_whitespace_shapes_as_space` zabija E4a, E4b i E4c.
3. Samotna połówka pary zastępczej (E11): **ODDAL** (usunięte). Zachowanie zmierzono w Chromium 153, a E11a i E11b są zabite. §4.2 oznacza teraz Chromium 141 jako NIE_ZMIERZONO, co jest uczciwe.
4. NaN/Inf (E7): **ODDAL**. Test dodano, a E7 jest mutantem równoważnym. FC sprawdziło źródło: `tiny-skia-path-0.12.0/src/path_builder.rs:421` (`Rect::from_points(..)?`) oraz `rect.rs:235-238` (`FiniteF32::new(..)?`) dają `None` dla punktów nieskończonych.
5. M20 (kwantyzacja przy obrocie): **ODDAL** (usunięte). Test `rotated_text_origin_is_not_quantised` zabija M20 (FC powtórzyło). Próg 0,34 to jawne ZAŁOŻENIE: środek między zmierzonymi wartościami 0,2525 i 0,4306.
6. `toUpperCase` a wersja Unicode: **ODDAL**. Część ścisła (U+0000–058F i U+1E00–1EFF, 1 680 punktów kodowych) daje 0 różnic na obu toolchainach. Teraz mierzona jest część informacyjna w obu kierunkach: 28 różnic, wyłącznie poza danymi pinu. §0 i §4.4 poprawione.
7. Liczby w dokumencie: **ODDAL** (poprawione). FC sprawdziło je na fixturach.
8. Proces (brak raportu Evaluatora r1, błędna ścieżka `03-operator-r2.md`): **ODDAL** w zakresie kodu. Uwaga dla orkiestratora: run nie zawiera też raportu Evaluatora r3. Jego zarzuty istnieją tylko w zadaniu Workflow i ten raport je streszcza.
9. `mapFamily` = `map_family`: **ODDAL**. To decyzja D-TXT-5 = A. Dopisek obrony o fontach systemowych dla U+1D400 jest zgodny z Z-29-7.

NAPRAW: brak. DO DECYZJI CZŁOWIEKA: brak nowych. Ocena wzrokowa właściciela (D-TXT-4 = A) pozostaje zaplanowana na później, zgodnie z dispatchem.

UWAGI (PASS-WITH-NOTES):
- Referencje dla przypadków brzegowych z §8b pochodzą z Chromium 153, nie z 141 jak fixtury. Te przypadki nie występują w danych pinu.
- Niezmierzone (NIE_ZMIERZONO): clippy na 1.87.0, Windows i GPU, gamma masek glifów.
- Integracja wymaga merge'a na `fffc5e7c6`, bez konfliktów.

BLOKADY: brak.
RUNDY: 3/5 (Final Control r3).
NASTĘPNY KROK: integracja orkiestratora (`69eae2e85` + ten raport) na `rust-port/parity-v2`, potem `refs/keep/R-RUSTPORT-P4-29-TEXT-FONTS-Q1-fc`.
DEPLOY/PUSH: NIE WYKONANO
