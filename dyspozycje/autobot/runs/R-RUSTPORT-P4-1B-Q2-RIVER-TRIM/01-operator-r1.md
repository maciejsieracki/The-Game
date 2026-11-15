# R-RUSTPORT-P4-1B-Q2-RIVER-TRIM — Operator, runda 1

STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1B-Q2-RIVER-TRIM
GOAL: port 1:1 `trimMediumTailAlongMain` (gen-helpers.ts:7623-7634) i `trimMediumRenderPathAtMain`
(:8194-8203, eksportowana) z pinu `07d2fbd72` do modulu rzek, z wektorami z pinu i testem czulosci.
ZMIANY/COMMIT: gałąź `wip/R-RUSTPORT-P4-1B-Q2-RIVER-TRIM-op-r1`, baza `1b8b67173` (= origin/rust-port/parity-v2);
SHA commitu: patrz `git log` gałęzi (commit zawiera ten raport; SHA podany w wyniku Operatora dla orkiestratora).
TESTY: wszystkie bramki EXIT 0 (szczegóły niżej).
BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator r1.
DEPLOY/PUSH: NIE WYKONANO (brak push do parity-v2, brak integracji).

## Źródło (pin `07d2fbd72`, `gra/src/map/gen-helpers.ts`)
Uwaga: dispatch podaje ścieżkę `gen-helpers.ts`; na pinie plik leży w `gra/src/map/gen-helpers.ts`
(numery linii zgodne z dispatchem: :7623-7634 i :8194-8203). `hexKey` = :157-159 (`` `${q},${r}` ``).

## Zmiany (allowlista — tylko te pliki)
- `rust-port/engine/src/domain/mapgen/rivers_a/render_trim.rs` (NOWY):
  - `pub(crate) fn trim_medium_tail_along_main(path: &[RiverCoord], main_keys: &HashSet<RiverCoord>) -> Vec<RiverCoord>` — 1:1 z :7623-7634
    (strażnik `len < 3 || mainKeys.size === 0`; pętla `while len >= 3`, pop gdy OBA ostatnie na main).
  - `pub fn trim_medium_render_path_at_main(path: &[RiverCoord], main_paths: &[Vec<RiverCoord>]) -> Vec<RiverCoord>` — 1:1 z :8194-8203.
  - Decyzje techniczne: klucz `hexKey` "q,r" dla liczb całkowitych jest bijekcją z `(q, r)`, więc
    `Set<string>` = `HashSet<RiverCoord>`. Web `mp ?? []` (null w `mainPaths`) = pusty `Vec` po stronie Rust
    (wektory zawierają przypadki z `null`, test mapuje je na pusty `Vec`). Web zwraca ten sam obiekt przy braku
    przycięcia — Rust zwraca kopię (`Vec`); wartościowo identycznie, pin nie mutuje wejścia (sprawdzane w generatorze).
- `rust-port/engine/src/domain/mapgen/rivers_a.rs`: jedna linia `pub mod render_trim;`.
- `rust-port/engine/tests/p4_1b_river_trim.rs` (NOWY): 4 testy.
- `rust-port/engine/tests/p4_1b_river_trim_vectors/gen.mjs` (NOWY): wycina z pinu `hexKey` (:157-159),
  `trimMediumTailAlongMain` (:7623-7634), `trimMediumRenderPathAtMain` (:8194-8203), sprawdza sygnatury
  i linie końca, strażnik SHA-256 wyciętych fragmentów
  `b087f66e08ff5f3e7b4ed9f632b64ed43568519ca61f9820a020149ed545f943`, `stripTypeScriptTypes`, wykonuje tekst pinu.
  Deterministyczny LCG; ponowne uruchomienie daje bajt-w-bajt ten sam `vectors.json` (sprawdzone `cmp`).
- `rust-port/engine/tests/p4_1b_river_trim_vectors/vectors.json` (NOWY): 283 wektory, 137 z faktycznym przycięciem.

Odtworzenie wektorów:
```
git show 07d2fbd72:gra/src/map/gen-helpers.ts > <TMP>/gen-helpers.ts
node rust-port/engine/tests/p4_1b_river_trim_vectors/gen.mjs <TMP>/gen-helpers.ts > rust-port/engine/tests/p4_1b_river_trim_vectors/vectors.json
```

## Wektory i pokrycie
- 283 wektory (≥150), 137 z przycięciem (≥50). Rozkład liczby zdjętych heksów: 0:146, 1:30, 2:20, 3:23, 4:21, 5–12: 43.
- 23 ręczne przypadki nazwane wg dispatchu: `len0`, `len1_na_main`, `len2_oba_na_main`, `len2_brak_main`,
  `pusty_mainPaths`, `mainPaths_z_pusta_sciezka`, `mainPaths_null`, `ogon0_main_obok`, `ogon1_tylko_ostatni`,
  `ogon_tylko_przedostatni`, `ogon2`, `ogon3`, `ogon4`, `cala_na_main_zostaja_2`, `cala_na_main_len3`,
  `cala_na_main_dwie_sciezki`, `duplikaty_w_mainPaths`, `duplikaty_cala`, `przerwa_w_ogonie`, `ujemne_wsp`,
  `powtorzony_heks_w_sciezce` i in.; 260 losowych (ścieżki 0..14, main z ogona, wyrwane heksy, duplikaty, null).
- Test `pokrycie_kategorii` LICZY kategorie z danych wejściowych (nie z nazw) i wymaga minimów:
  len<3 ≥10, pusty main ≥10, null w mainPaths ≥3, ogon 0/1/2/≥3 na main ≥10 każdy, tylko ostatni ≥10,
  tylko przedostatni ≥5, cała ścieżka na main ≥5 (z asercją: zostają 2 heksy), duplikaty w mainPaths ≥10.

## Testy (`rust-port/engine`, CARGO_TARGET_DIR w scratchpadzie poza repo, usunięty po bramkach)
`CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`
- `cargo fmt --check` → EXIT 0
- `cargo clippy --all-targets -- -D warnings` → EXIT 0
- `cargo test --test p4_1b_river_trim` → EXIT 0, 4 passed / 0 failed / 0 ignored
- `cargo test --lib` → EXIT 0, 118 passed / 0 failed / 0 ignored
- Brak `#[ignore]`, brak osłabionych asercji.

## Mutacje (wykonane na kodzie produkcyjnym `render_trim.rs`, potem przywrócone)
1. `main_keys.contains(&last) && main_keys.contains(&prev)` → `||`: `cargo test --test p4_1b_river_trim` →
   FAIL (`wektory_pinu_trim_medium_render_path_at_main` panicked, 3 passed / 1 failed).
2. Próg pętli `while out.len() >= 3` → `>= 2`: → FAIL (ten sam test, 3 passed / 1 failed).
   Uwaga: zmiana SAMEGO strażnika wejścia `len < 3` → `len < 2` (przy pętli `>= 3`) jest mutantem
   równoważnym — pętla `>= 3` i tak nie zdejmuje heksów ze ścieżki 2-heksowej; żaden wektor nie może go
   odróżnić (dotyczy też pinu). Mutacja progu „3 → 2” rozumiana jako zmiana pętli (oraz obu miejsc) jest wykrywana.
3. Dodatkowo stały test czułości `czulosc_mutanty_rozjezdzaja_sie_z_wektorami` (lokalne mutanty `||` i próg 2
   w obu miejscach) wymaga rozjazdu z wektorami w ≥10 / ≥5 przypadkach.

## NIE_ZMIERZONO
- Wołający produkcyjny `trim_medium_render_path_at_main` — brak (wołający w P4-1B-Q3 MAP-VIEW-PRODUCER).
- `trim_medium_tail_along_main` w `finalizeMediumPath` (M07C, `rivers_c.rs`) — nie dotykane (właściciel M07C).
- Pełny `cargo test` (wszystkie testy integracyjne) — nie uruchamiany (poza bramkami dispatchu).

## Uwagi procesowe
- `Cargo.lock` nie commitowany (nieśledzony w worktree). Commit jawnym `git add` na plikach allowlisty.
- Dispatch nakazuje model OPUS we wszystkich rolach (P4, DTO renderera); Operator wykonany na Opus.
