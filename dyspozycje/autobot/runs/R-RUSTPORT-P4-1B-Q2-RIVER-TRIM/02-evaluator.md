# 02-evaluator — R-RUSTPORT-P4-1B-Q2-RIVER-TRIM (runda 1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1B-Q2-RIVER-TRIM
GOAL: port 1:1 `trimMediumTailAlongMain` (gen-helpers.ts:7623-7634) i `trimMediumRenderPathAtMain` (:8194-8203) z pinu 07d2fbd72 do `rivers_a/render_trim.rs` z wektorami pinu.
ZMIANY/COMMIT: oceniany commit Operatora 32c282015 (gałąź wip/R-RUSTPORT-P4-1B-Q2-RIVER-TRIM-op-r1), rodzic = baza 1b8b67173 (= origin/rust-port/parity-v2, sprawdzone `git rev-parse`, `merge-base --is-ancestor` OK). Ten raport: jedyna zmiana Evaluatora.
TESTY: niżej (odtworzone samodzielnie, CARGO_TARGET_DIR w scratchpadzie poza repo, usunięty po bramkach).
BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: Obrona / Final Control.
DEPLOY/PUSH: NIE WYKONANO

## Allowlista
`git diff --stat 1b8b67173 32c282015` — 6 plików, wszystkie na allowliście:
render_trim.rs (NOWY), rivers_a.rs (+1 linia `pub mod render_trim;`), tests/p4_1b_river_trim.rs (NOWY),
p4_1b_river_trim_vectors/{gen.mjs, vectors.json} (NOWE), runs/.../01-operator-r1.md. Brak Cargo.lock, brak rivers_c.rs, brak gra/.
`git diff --check` czysty.

## Zgodność z pinem (przegląd ręczny)
- `git show 07d2fbd72:gra/src/map/gen-helpers.ts` :7623-7634 i :8194-8203 — logika identyczna: strażnik `len<3 || size==0`, pętla `while len>=3`, warunek `has(last) && has(prev)` → pop, inaczej break; render: zbiór z `mp ?? []`.
- `RiverCoord` w Rust = `{q:i64, r:i64}` z derive Hash/Eq; web `hexKey(q,r)` = "q,r" — bijekcja dla liczb całkowitych, więc HashSet<RiverCoord> ≡ Set<string>.
- `trim_medium_tail_along_main` = `pub(crate)`, `trim_medium_render_path_at_main` = `pub` — zgodnie z dispatchem.

## Bramki (odtworzone, kody wyjścia)
| Bramka | Wynik |
|---|---|
| `cargo fmt --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --test p4_1b_river_trim` | EXIT 0 — 4 passed, 0 failed, 0 ignored |
| `cargo test --lib` | EXIT 0 — 118 passed, 0 failed, 0 ignored |

## Wektory
- `node gen.mjs <gen-helpers.ts z pinu>` → EXIT 0; wynik `cmp` IDENTYCZNY bajt w bajt z commitowanym `vectors.json`.
- Generator wycina tekst pinu (hexKey :157-159, :7623-7634, :8194-8203), weryfikuje sygnatury, końce funkcji i SHA-256 (b087f66e…f943), wykonuje pin przez `stripTypeScriptTypes` — wektory behawioralne z pinu, nie ręczne oczekiwania.
- 283 wektory, 137 z przycięciem (próg ≥150 / ≥50 spełniony, sprawdzany też w teście).
- Kategorie dispatchu liczone w teście z danych wejściowych (`pokrycie_kategorii`): len<3, pusty/null mainPaths, ogon 0/1/2/≥3, tylko ostatni, tylko przedostatni, cała na main (asercja expected.len()==2), duplikaty.

## Mutacje produkcyjne (wykonane przez Evaluatora, cofnięte, `cmp` z oryginałem OK)
| Mutant w render_trim.rs | Wynik testu |
|---|---|
| M1 `&&` → `\|\|` w warunku pętli | FAIL (101, `wektory_pinu…` assert_eq) |
| M2 pętla `>= 3` → `>= 2` | FAIL (101) |
| M3 strażnik `< 3`→`< 2` + pętla `>= 3`→`>= 2` | FAIL (101) |
| M4 usunięcie `\|\| main_keys.is_empty()` | PASS — mutant równoważny (pusty zbiór → `contains` zawsze false → pętla nic nie zdejmuje) |
| M5 `contains(&prev)` → `true` | FAIL (101) |

## #[ignore] / osłabione asercje
- `grep ignore` w p4_1b_river_trim.rs: 0 trafień. Asercje to `assert_eq!` pełnego wyniku + prefiks; brak tolerancji.

## Wołający w Rust
- `trim_medium` występuje w src tylko w render_trim.rs — brak produkcyjnego wołającego. Dispatch (kryterium 4) tego wymaga jako NIE_ZMIERZONO (wołający w P4-1B-Q3; web woła też z `finalizeMediumPath` :8148 → M07C). Zgodne z dispatchem, nie jest zarzutem.

## Zarzuty / uwagi (informacyjne, nieblokujące)
1. Brak produkcyjnego wołającego — NIE_ZMIERZONO (P4-1B-Q3, M07C `finalizeMediumPath` :8148). Do pilnowania w rejestrze, by moduł nie został osierocony.
2. `gen.mjs` używa eksperymentalnego `node:module.stripTypeScriptTypes` (Node 22+, ExperimentalWarning). Regeneracja może się zepsuć w przyszłej wersji Node; wektory są zacommitowane, więc nie wpływa to na bramki Rust.
3. Mutanty w teście `czulosc_mutanty_rozjezdzaja_sie_z_wektorami` to lokalne kopie, a nie mutacja kodu produkcyjnego. To tylko uzupełnienie: rzeczywistą czułość potwierdziły mutacje M1–M3 i M5 powyżej.
