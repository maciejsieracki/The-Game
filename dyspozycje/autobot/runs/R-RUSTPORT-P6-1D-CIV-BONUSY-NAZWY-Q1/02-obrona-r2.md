STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-1D-CIV-BONUSY-NAZWY-Q1
GOAL: Przeniesc logike city-names-pool.ts (23) i civ-bonuses.ts (17) do Rust; usunac zarzuty 1-3 Evaluatora r1.
RUNDY: 2/5 (obrona)

Baza: commit Operatora 6ffe9db0 (baza b2feab36). Gate surowe logi: gate-fmt-r2.log, gate-clippy-r2.log, gate-test-r2.log (kazdy konczy sie EXIT=0).

## Odpowiedzi na zarzuty

1. PRZYJMUJE. Dodano `web-src/{civ-bonuses,city-names-pool,civ-matrix}.ts` (pelne pliki z pinu edb8fb56, `git show edb8fb56:gra/src/game/<plik>`) w katalogu runu. P6-1D.md §4 opisuje odtworzenie WEB_ROOT (`git archive edb8fb56 gra/src gra/data`; commit jest w historii repo).
2. PRZYJMUJE. `tests/p6_1d_city_names.rs`: `assert_eq!(from_data.len(), 15)` -> `assert!(!from_data.is_empty())`. Rownosc pul wektor/dane (`assert_eq!(from_vec, from_data)`) nadal pilnuje zgodnosci.
3. ODRZUCAM przeniesienie, UZASADNIAM w P6-1D.md §4 ("Decyzja o tokenach"): tokeny `tok` to fragmenty tekstu wolnego (nazwy/opisy po strip_diacritics), czesc algorytmu klasyfikacji (w webie literaly w funkcjach), nie ID/wartosci balansowe. Do JSON trafily ID parametrow, prefiksy routingu, fragmenty id warunkow (`teren_las` = fragment ID z paramDefs), progi i limity. Granica spojna: ID/wartosci -> tabela, dopasowanie tekstu wolnego -> kod. Ostateczna decyzja nalezy do Final Control (zapisane jawnie).
4. ODNOTOWANE bez zmiany kodu: Hangul i plaszczyzny astralne NIE_ZMIERZONO, poza domena danych (P6-1D.md §5 pkt 5, 8).
5. ODNOTOWANE: kategorie i matchesCel pokryte dla 174 jednostek; apply/mults 18 reprezentantow + 3 syntetyczne (zadeklarowane, ryzyko niskie).
6. ODNOTOWANE: matrix_param prywatny, pelny port civ-matrix.ts w P6.1B/C; konflikt addytywny (§5 pkt 2).
7. PRZYJMUJE czesciowo: poprawiono komentarz w `tests/p6_1d_tables.rs` (diakrytyki, znak laczacy z pusta wartoscia) oraz zdanie w P6-1D.md §5 pkt 8 (Unicode 14 Pythona vs Node/Rust). `CivStatMultipliers::add` panikuje tylko dla statystyki spoza zestawu; test ksztaltu `p6_1d_tables.rs` sprawdza znane statystyki w JSON, wiec panika nieosiagalna dla wbudowanych danych (bez zmiany kodu).
8. ODNOTOWANE: `ł` nie dekomponuje sie w NFD (zachowanie weba, P6-1D.md §5 pkt 1); do zgloszenia osobnym tematem jako mozliwy blad weba.

## Zmiany r2 (allowlista)
- tests/p6_1d_city_names.rs (asercja), tests/p6_1d_tables.rs (komentarz)
- dyspozycje/rust-port/p6/P6-1D.md (§4, §5 pkt 8)
- run: web-src/*.ts, 02-obrona-r2.md, gate-*-r2.log
Brak zmian w kodzie produkcyjnym, bridge.rs, Cargo.toml, gra/**.

## Testy
fmt EXIT=0; clippy --all-targets -D warnings EXIT=0; cargo test 437 passed, 0 failed (EXIT=0).

BLOKADY: brak
NASTEPNY KROK: Evaluator, potem Final Control (decyzja o tokenach).
DEPLOY/PUSH: NIE WYKONANO
