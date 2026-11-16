# OBRONA OPERATORA — R-RUSTPORT-P6-K5DOC-T5A-KITE (runda 1, odpowiedzi na zarzuty Evaluatora)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (engine Rust, czyste funkcje)
TEMAT: R-RUSTPORT-P6-K5DOC-T5A-KITE
GOAL: strzelec KITE — czyste funkcje i wektory pinu (bez wpięcia w pętlę, zgodnie z dispatchem)
KOD OPERATORA: 7de3417e8 (gałąź wf-d3b365ce/k5doc-t5a-kite, baza 2edc808d7); raport Operatora: a921c69a2
ZMIANY W TEJ OBRONIE: BRAK zmian w kodzie. Ten plik jest nieskomitowany w worktree na gałęzi worktree-wf_d3b365ce-bae-3 (cb077b588), która nie jest bazą tematu.
SHA obrony: NIE_COMMITOWANE

## Odpowiedzi na zarzuty

### Zarzut 1 [PROCES] — dysk i brak pełnego suite
Odpowiedź: PRZYJMUJĘ.
- Fakt: `df -h /` pokazuje 212 MB przed kontrolą i 120–127 MB w trakcie obrony z 252 GB. Obok trwa cudzy proces `cargo test --test p6_k5doc_t4b` (PID 3872, CARGO_TARGET_DIR w scratchpadzie innej rundy). Nie usuwałem ani nie budowałem niczego, co mogłoby kolidować.
- Nie powtórzyłem `fmt`/`clippy`/`cargo test --all-targets`. Ta obrona nie dokłada żadnych nowych wyników bramek.
- Wymagane: Final Control powtarza `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --all-targets --no-fail-fast` przy co najmniej 8 GB wolnego (dispatch, kryterium 2).

### Zarzut 2 [TESTY] — zawieszenie pick_auto_improvements_matches_pinned_web_vectors (p6_8i_pick)
Odpowiedź: PRZYJMUJĘ jako otwarte. ODRZUCAM twierdzenie o regresji.
- Fakt: test zawisł w pełnym runie Operatora. Nie został zbadany na bazie 2edc808d7 (NIE_ZMIERZONO na bazie).
- Dowód strukturalny, że moduł kite nie jest przyczyną: diff 7de3417e8 względem bazy dotyka tylko `rust-port/engine/src/domain/mod.rs` (jedna linia `pub mod siege_tactics_kite;`) oraz nowych plików: `siege_tactics_kite.rs`, `tests/p6_k5doc_t5a.rs`, `tests/p6_k5doc_t5a_gen.mjs`, `tests/p6_k5doc_t5a_vectors/vectors.json`. `git grep kite` w 7de3417e8 zwraca tylko te pliki i `siege_tactics_doctrine_state.rs` oraz `data_compliance.rs` (dane). Plik p6_8i_pick nie używa modułu kite.
- Zastrzeżenie: to dowód przez zależności, nie przez uruchomienie. FC musi uruchomić ten test na bazie 2edc808d7 i na 7de3417e8, z limitem czasu, i porównać wyniki. Do tego czasu kryterium 2 (EXIT 0 całego suite) jest NIEPOTWIERDZONE.
- Raport Operatora: run z `--skip` nie ma końcowego TEST_EXIT. Wynik 2003 passed / 0 failed jest cząstkowy.

### Zarzut 3 [MUTACJA a] — mutant `gap <= dNow` -> `gap < dNow` przechodzi
Odpowiedź: ODRZUCAM wymóg FAIL dla tego mutanta. Mutant jest RÓWNOWAŻNY matematycznie.
- Dowód: `gap = manhattan(cand, threat)`, `dNow = manhattan(me, threat)`, `cand = me + krok z DIRS4`. Odległość manhattan zmienia się o dokładnie ±1 przy kroku o jeden kafelek, więc `gap - dNow ∈ {+1, -1}` i nigdy 0.
- Sprawdzenie wykonane w tej obronie: `scratchpad/mut_a_check.mjs` (ścieżka pod `/tmp/claude-0/-home-user-The-Game/b3259bfd-6985-5166-9861-4edd4aa89b33/scratchpad/`). Wyczerpująco siatka 0..8 x 0..8 dla pozycji jednostki i zagrożenia, 4 kierunki: 25920 przypadków, gap == dNow w 0 przypadkach, różnica gap - dNow wyłącznie {1, -1}, rozbieżność `(gap <= dNow)` vs `(gap < dNow)` w 0 przypadkach.
- Wniosek: żaden test nie zabije tego mutanta, bo zachowanie jest identyczne. Wymóg dispatchu „(a) MUSI dać FAIL” nie da się spełnić bez zmiany zachowania. Decyzja orkiestratora: (i) zaakceptować mutant jako równoważny i odnotować w rejestrze, albo (ii) zastąpić go mutantem nierównoważnym tego samego predykatu, np. `gap <= dNow` -> `gap < dNow - 1`. Dla (ii) przewiduję FAIL przez test `best_gap_nie_wiekszy_od_dnow_odrzuca` (me (2,5), zagrożenie (5,5), kandydat (3,5): gap=2, dNow=3; mutant przepuściłby kandydata). Nie uruchomiłem (ii) z powodu braku dysku.
- Mutacje b i c: wg raportu Operatora FAIL (b, c) i FAIL (d, dodatkowa). NIE_ZMIERZONO w tej obronie (brak kompilacji).

### Zarzut 4 [ODSTĘPSTWO, niskie] — best_kite_shot_step zwraca Option<Tile> zamiast Option<CellKey>
Odpowiedź: PRZYJMUJĘ jako prawdziwe odstępstwo od pisemnej specyfikacji dispatchu („zwrot `Option<CellKey>`”). Poprawka NIE została wykonana w tej obronie.
- Fakt: w `siege_tactics_kite.rs` sygnatura to `-> Option<Tile>` (`Tile = (f64, f64)` z `siege_tactics_pathstep`). `CellKey = (u64, u64)` jest w `siege_tactics_autobatch.rs` (linia 50), a `cell_key(col,row)` w linii 63.
- Argument semantyczny (nie zmienia decyzji, tylko typ): `js_bits` jest injektywne poza `-0`, które normalizuje się do `0`. `CellKey` niesie więc tę samą informację co kafelek. Test porównuje współrzędne przez `==` na f64, gdzie `0.0 == -0.0`.
- Proponowana poprawka (do decyzji orkiestratora, NIE zastosowana): (1) `use super::siege_tactics_autobatch::{cell_key, CellKey, BF_COLS};`; (2) zwrot `Option<CellKey>`, `best: Option<CellKey>`, `best = Some(cell_key(nc, nr));`; (3) w `tests/p6_k5doc_t5a.rs` funkcja `best()` mapuje wynik: `.map(|(c, r)| (f64::from_bits(c), f64::from_bits(r)))`. Reszta testów bez zmian. Około 5 linii.
- Dlaczego nie zastosowałem: edycja bez `cargo check`/`cargo test` przy 120–127 MB wolnego miejsca i cudzym procesie cargo to edycja na ślepo w kodzie wymagającym bramki. Proponuję, żeby FC zdecydował: r2 z CellKey albo akceptacja Tile jako odstępstwa odnotowanego w rejestrze.

## Zestawienie
| # | Zarzut | Odpowiedź | Zmiana kodu |
|---|--------|-----------|-------------|
| 1 | dysk / brak pełnego suite | PRZYJMUJĘ | nie |
| 2 | zawieszenie p6_8i_pick | PRZYJMUJĘ jako otwarte; ODRZUCAM regresję (dowód strukturalny) | nie |
| 3 | mutant (a) przechodzi | ODRZUCAM wymóg FAIL: mutant równoważny (dowód 25920 przypadków) | nie |
| 4 | Option<Tile> vs Option<CellKey> | PRZYJMUJĘ (odstępstwo prawdziwe), poprawka opisana, NIE wykonana | nie |

## TESTY W TEJ OBRONIE
- Brak uruchomionych bramek cargo (dysk 120–127 MB, cudzy cargo PID 3872). NIE_ZMIERZONO.
- Dowód mutanta (a): skrypt node `mut_a_check.mjs`, wynik `{"przypadki":25920,"gap_eq_dNow":0,"orig_vs_mut_roznica":0,"roznica_gap_minus_dNow":[1,-1]}`.

## BLOKADY (dla orkiestratora)
1. Dysk < 8 GB: FC nie może uruchomić pełnych bramek bez zwolnienia miejsca. Nie usuwałem cudzych katalogów target.
2. Test p6_8i_pick na bazie 2edc808d7: do potwierdzenia przez FC.
3. Mutant (a): decyzja, czy akceptować jako równoważny, czy zamienić na `gap < dNow - 1`.
4. CellKey: decyzja, czy r2 z poprawką, czy akceptacja Tile.

## RUNDY
1/5 (obrona Operatora r1).

## NASTĘPNY KROK
Final Control: (a) powtórzyć bramki przy co najmniej 8 GB wolnego; (b) uruchomić p6_8i_pick na 2edc808d7 i na 7de3417e8 z limitem czasu; (c) rozstrzygnąć mutant (a) i odstępstwo CellKey.

DEPLOY/PUSH: NIE WYKONANO (zgodnie z dispatchem: bez push, bez integracji, bez zmian poza allowlistą).
