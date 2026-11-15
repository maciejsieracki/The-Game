STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-29-TEXT-FONTS-Q1
GOAL: RR-T8b — fonty i tekst na `raster::Canvas2dLite` vs Chromium (zakres bez zmian). Obrona Operatora wobec zarzutów 1–9 Evaluatora r3.

ZMIANY-COMMIT: baza `origin/rust-port/parity-v2` = `525a2ef7b`. Commit kodu obrony **`b7bda0016`**, a ten raport z logami bram i mutacji jest w następnym commicie (jego SHA podaje odpowiedź Workflow). Nie wykonano push. **`src/**` i `tests/fixtures/text/**` bez zmian.** Zmienione pliki:
- nowy `rust-port/renderer/tests/text_edge_cases.rs` (5 testów);
- `tests/text_scenes.rs` (+1 test);
- `tests/text_upper.rs` (porównanie obustronne);
- `dyspozycje/rust-port/p4/P4-29-TEXT-FONTS.md` (§0, Z-29-6, §3.2, §4.1, §4.2, §4.4, §5.2, §5.3, §6, §7, nowa §8b, §9);
- `dowody/05-obrona-r3-*`.

Kod do oceny: `51839a356` (r1), `6cee8e46c` (dokumentacja), `283f8634c` (obrona r1). Wszystkie trzy są przodkami `origin/rust-port/parity-v2` (`git merge-base --is-ancestor`, sprawdzone 15.11).

Chromium: w kontenerze jest tylko **153.0.8010.12** (playwright 1.63). Chromium 141 z fixtur jest niedostępny. Nowe referencje pochodzą z sondy `dowody/05-obrona-r3-chromium-probe.{mjs,log}` i są zapisane jako stałe w teście. Do fixtur 141 nie trafiły.

ZARZUTY:
1. **GPOS x/y_offset (E6, E9): PRZYJMUJĘ.** Test `combining_marks_follow_gpos_offsets_like_chromium` sprawdza `x`+U+0301+U+0323 w Liberation Serif Regular i Bold. Najpierw sprawdza, że przesunięcia GPOS są niezerowe w obu osiach. Potem porównuje ramki atramentu bazy i obu znaków łączących z Chromium 153 z tolerancją ±1 px: 22 z 24 współrzędnych są równe, 2 różnią się o 1 px. R3-E6, E6b, E9 i E9b są zabite.
2. **`\n \r \f` (E4): PRZYJMUJĘ.** Testy porównują 87 szerokości z Chromium 153 bit w bit (`a␣b`, `A␣V`, `\n`, `\r\n` w 3 fontach weba) i sprawdzają, że kształtowanie daje ten sam wynik co spacja. R3-E4a, E4b i E4c są zabite.
3. **Samotna połówka pary zastępczej (E11): PRZYJMUJĘ.** Zmierzono to w Chromium **153**, nie w 141. Szerokość samotnej połówki jest równa szerokości U+FFFD, a piksele `fillText` są identyczne. Test sprawdza 6 przycięć przez parę U+1F031 (nazwa i wiersz hover), w tym 2, w których web zwraca łańcuch z samotną połówką. P4-29 §4.2 poprawiony: zachowanie w Chromium 141 = NIE_ZMIERZONO. R3-E11a i E11b są zabite.
4. **Strażnik NaN/Inf (E7): PRZYJMUJĘ test, ODRZUCAM wymóg zabicia E7.** `non_finite_position_draws_nothing` sprawdza fill i stroke, tekst konturowy, emoji i tekst mieszany: nic się nie rysuje i nie ma paniki. E7 jest mutantem równoważnym. Ścieżka z punktami nieskończonymi kończy się w `PathBuilder::finish` zwróceniem `None` (`tiny-skia-path-0.12.0/src/path_builder.rs:421`, `rect.rs:235-239` `FiniteF32::new(..)?`). Ścieżkę emoji zatrzymują strażniki `drawImage` (`raster/canvas.rs:584`, `raster/image/svg.rs:224`). Strażnik zostaje, bo odpowiada regule HTML.
5. **M20 tylko złotym hashem: PRZYJMUJĘ.** Test `rotated_text_origin_is_not_quantised` wymaga mean_abs ≤ 0,34 (ZAŁOŻENIE: środek przedziału). Zmierzone: 0,2525 bez kwantyzacji i 0,4306 z kwantyzacją. Złoty hash nie wchodzi do kryterium; nowy test zabija R3-M20.
6. **`toUpperCase`: PRZYJMUJĘ.** Do tej pory test sprawdzał tylko klucze tablicy JS. Teraz sprawdza wszystkie wartości skalarne w obu kierunkach (`dowody/05-obrona-r3-upper.log`). Wobec fixtury (node v22.22.0): rustc 1.97 ma **28** różnic, rustc 1.87 ma 0. Wobec node v22.23.4 (Unicode 17): rustc 1.97 ma 0, rustc 1.87 ma 28. Różnice dotyczą U+A7CF, U+A7D3, U+A7D5 i U+16EBB–16ED3. Nie ma ich w danych pinu ani w ścisłym zakresie testu. Poprawione §0 i §4.4.
7. **Liczby w dokumencie: PRZYJMUJĘ.** Poprawione: §4.1 = 5 121, §4.2 = 2 578 / 12 714, §6 = 3 869 084 B. Liczby 5 105 / 12 620 w §5.3 i Z-29-6 opisują pomiar `full` z r1 na zestawie r1, więc zostają, ale mają teraz takie oznaczenie.
8. **Proces: PRZYJMUJĘ jako fakt, bez zmian w kodzie.** Raportu Evaluatora r1 nie ma w runie. Jego zarzuty cytuje `02-operator-obrona-r1.md`, więc nie odtwarzam raportu z pamięci. Operatora r2 nie było, a ścieżka `03-operator-r2.md` w zadaniu Workflow jest błędna.
9. **`mapFamily` = `map_family` (informacyjnie): ODRZUCAM jako wadę.** To decyzja D-TXT-5 = A. Dopisek: sonda pokazała, że Chromium dla U+1D400 (znak spoza trzech rodzin) używa fontu systemowego (linie `S`). Zgadza się to z Z-29-7. Zdanie „never reaches system fonts” w `gen.mjs` dotyczy więc tylko znaków pokrytych przez dołączone fonty.

TESTY (`dowody/05-obrona-r3-gates.log`, HEAD `b7bda0016`):
- `fmt`, `clippy` i `clippy --features gpu`: EXIT=0.
- `cargo test --locked --all-targets`: rustc 1.97.0 **478 passed / 0 failed**, rustc 1.87.0 **478 / 0**, EXIT=0.
- `git diff --check`: EXIT=0.
- Mutacje obrony r3 (`dowody/05-obrona-r3-mutations.{py,log}`, tylko nowe testy): **10/11 KILLED**. Przeżywa R3-E7, mutant równoważny (zarzut 4).

BLOKADY: brak. Pozycje NIE_ZMIERZONO:
- przypadki brzegowe §8b w Chromium 141 (zmierzone w 153);
- clippy na 1.87.0;
- Windows/GPU;
- gamma masek Skii.
RUNDY: 3/5 (obrona r3)
NASTĘPNY KROK: Final Control (R-RUSTPORT-P4-29-TEXT-FONTS-Q1)
DEPLOY/PUSH: NIE WYKONANO
