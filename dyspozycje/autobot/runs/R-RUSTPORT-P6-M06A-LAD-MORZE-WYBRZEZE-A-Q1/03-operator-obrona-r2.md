# Odpowiedz Operatora na zarzuty Evaluatora (runda 2)

Stan wyjsciowy: commit Operatora `8ab29f9a` (pomiary r1, FAIL). Kod `landsea.rs` NIE zmieniany w tej rundzie.

## Zarzuty

1. **Luka pierscienia (nakladka/zloze na Morzu) - PRZYJMUJE.**
   - Poprawka: `gen-m06a-vectors.mjs` dostaje mapy `coast_overlay_deposit` (Laka + Morze z Las/zloze przy lądzie, drugi pierscien, Morze poza zasiegiem), `coast_overlay_orphan` (sierota Wybrzeza z Las + zloze), `edge_top_sea`, `edge_left_sea` (3x3, morze na krawedzi).
   - Wektory z weba @ edb8fb56: 176 map, regeneracja bajtowo identyczna (sha256 `2c64719d...`).
   - Asercje: `coast_ring_clears_overlay_and_deposit_only_on_converted_sea` (wiersze `1,0`/`2,0`/`3,0` z wartosciami), `sanitize_clears_overlay_and_deposit_on_orphan_coast`.
   - Mutanty `ring-no-overlay-clear`, `ring-no-deposit-clear`: wczesniej SURVIVED, teraz KILLED (3 testy).
2. **Zakres 25 wierszy RUNDA-2 - PRZYJMUJE.** Temat nie jest zamkniety; 25 wierszy zostaje RUNDA-2 (lista w `P6-M06A-LAD-MORZE-WYBRZEZE-A.md`). Dodany wykaz Math.* (43 wystapienia, zero w symbolach PORTOWANYCH) i zaleznosci (mulberry32, buildPermTable, fbm, hashInt3 z plikiem:linia).
3. **Liczba 29 vs 46 wierszy - PRZYJMUJE rozstrzygniecie.** Grep: w zakresie 3186-4374 ssa 47 deklaracji top-level, z czego 29 to `export` (28 funkcji + 1 typ). Tabela: 47 wierszy = 46 w zakresie (jeden wiersz laczy `LandFractionFillBias` i `PANGEA_LAND_FILL_MIN_SCORE`) + `ensurePangeaSingleContinent` :4375 poza zakresem. ZALOZENIE zapisane w doc.
4. **Zestaw mutacji - PRZYJMUJE.** Dodane i KILLED: `ocean-edge-no-top`, `ocean-edge-no-left`, `json-wyspy-0.51`, `json-ziemia-0.22`, `json-erode-gory-wzgorza`, `double-no-overlay-clear`, `double-no-deposit-clear`, `double-src-shallow`, `sanitize-orphan-no-overlay-clear`, `sanitize-orphan-no-deposit-clear`. Mutanty dotyczace wewnetrznego wywolania `set_hex_to_morze` (M04, `terrain_class.rs`) ODRZUCAM w tym temacie: plik jest poza allowlista; czesciowe czyszczenia testowane sa inline.
5. **TIMEOUT `ocean-bfs-no-visited` - CZESCIOWO PRZYJMUJE.** Fakt przyjety: zawieszenie, nie asercja. ODRZUCAM dodanie watchdoga w tescie (brak wsparcia w harnessie, zmiana poza zakresem). Zalecenie CI z limitem czasu zapisane w doc. Mutant nie ponawiany: dodanie asercji nie moze cofnac zabicia.
6. **Proces (run_in_background w r1) - PRZYJMUJE jako fakt historyczny.** Runda 2 wykonana wylacznie w pierwszym planie, kazde wywolanie < 590 s.

## Wyniki (surowe)

- `cargo fmt -- --check`: EXIT=0 (`gate-fmt-r2.log`)
- `cargo clippy --all-targets -- -D warnings`: EXIT=0 (`gate-clippy-r2.log`)
- `cargo test`: EXIT=0, 1227 passed, 0 failed; `p6_m06a_landsea` 13/13 (`gate-test-r2.log`)
- Mutanty: 58 w runnerze; KILLED 55, TIMEOUT 1 (`ocean-bfs-no-visited`, nie ponawiany), SURVIVED 2 (ekwiwalentne: `erode-rank-rposition-EQUIV`, `neighbor-negate-both-EQUIV`) (`mutations-r2.log`)
- Prefiks wektorow: stare kategorie identyczne po nazwie/`map` z wersja r1 (sprawdzone skryptem)
- `git diff --check`: czysty

## Status

RUNDA-2 dla 25 wierszy nadal otwarte. Kolejny krok: Operator-impl runda 3 - port symboli RUNDA-2 wedlug zaleznosci (szum/RNG, potem predykaty wysokiego poziomu), z wektorami granicznymi i mutantami strukturalnymi.

RUNDY: 2/5 (Operator-obrona). DEPLOY/PUSH: NIE WYKONANO.
