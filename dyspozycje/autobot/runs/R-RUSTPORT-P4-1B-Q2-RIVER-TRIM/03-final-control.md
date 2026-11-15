# 03 — Final Control r1 — R-RUSTPORT-P4-1B-Q2-RIVER-TRIM

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1B-Q2-RIVER-TRIM
GOAL: port 1:1 trimMediumTailAlongMain (gen-helpers.ts:7623-7634) i trimMediumRenderPathAtMain (:8194-8203) z pinu 07d2fbd72 do rivers_a/render_trim.rs, z wektorami pinu
ZMIANY/COMMIT: oceniany 21a63cfb3 (Obrona) <- ea61d34bf (Evaluator) <- 32c282015 (Operator) <- 1b8b67173 (baza z dispatchu); FC dopisuje tylko ten raport
TESTY: fmt EXIT 0; clippy --all-targets -D warnings EXIT 0 (czysty target); test p4_1b_river_trim 4/4 EXIT 0; test --lib 118/118 EXIT 0; mutacje produkcyjne FAIL; regeneracja wektorow bajt w bajt
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora na rust-port/parity-v2 (parity przesunieta od bazy: 83f5fd654 — wymagany merge-tree)
DEPLOY/PUSH: NIE WYKONANO
```

## Weryfikacja własna (FC, worktree wf_3095763c-84a-4, detached 21a63cfb3)

- **Baza / ancestry:** `git merge-base --is-ancestor 1b8b67173 21a63cfb3` = OK. Łańcuch: 1b8b67173 → 32c282015 → ea61d34bf → 21a63cfb3.
  Uwaga dla integracji: `origin/rust-port/parity-v2` = `83f5fd654` (przesunięta od bazy dispatchu) — integracja przez merge, nie FF.
- **Allowlista:** diff bazy..21a63cfb3 = 5 plików kodu/testów z allowlisty (render_trim.rs NOWY, rivers_a.rs +1 linia `pub mod render_trim;`, p4_1b_river_trim.rs, gen.mjs, vectors.json) + 3 raporty w `runs/`. Brak `Cargo.lock`, `rivers_c.rs`, `gra/`. `git diff --check` czysty.
- **Parytet 1:1 z pinem:** porównane z `git show 07d2fbd72:gra/src/map/gen-helpers.ts` :7620-7636 i :8190-8205 — warunek wejścia (`len<3 || size==0`), pętla `>=3`, `&&` na last/prev, `pop`; budowa zbioru kluczy z `mainPaths` (`mp ?? []` = pusty Vec). `RiverCoord {q,r}` z `Hash/Eq` — bijekcja z `hexKey`.
- **Bramki** (CARGO_INCREMENTAL=0, DEBUG=0, target w scratchpadzie poza repo, usunięty):
  - `cargo fmt --check` EXIT 0;
  - `cargo clippy --all-targets -- -D warnings` EXIT 0 (pierwsza próba z `-q` zwróciła 101 bez komunikatu — przejściowe; powtórzone na ŚWIEŻO wyczyszczonym targecie: EXIT 0, „Checking civ-engine … Finished”);
  - `cargo test --test p4_1b_river_trim` 4 passed, 0 ignored;
  - `cargo test --lib` 118 passed.
- **Mutacje kodu produkcyjnego (render_trim.rs, przywrócony `cmp` = identyczny):** `&&`→`||` FAIL; pętla `>=3`→`>=2` FAIL; oba progi 3→2 FAIL.
- **Wektory:** `gen.mjs` na `git show 07d2fbd72:gra/src/map/gen-helpers.ts`, Node v22.23.4 → GEN EXIT 0, wynik **bajt w bajt** = `vectors.json`; 283 wektory, 137 z przycięciem (≥150 / ≥50 spełnione); strażnik SHA-256 fragmentów aktywny. Test pokrycia kategorii z dispatchu (len<3, pusty main, ogon 0/1/2/≥3, tylko ostatni, tylko przedostatni, cała na main → 2 heksy, duplikaty) z progami; brak `#[ignore]`.

## Orzeczenia zarzutów

1. **Brak wołającego produkcyjnego — ODDAL.** Dispatch kryterium 4 wprost każe zapisać NIE_ZMIERZONO (wołający w Q3, `finalizeMediumPath`/M07C w `rivers_c.rs` poza allowlistą). Zapisane. Pozostaje NIE_ZMIERZONO do Q3.
2. **`stripTypeScriptTypes` eksperymentalne w Node 22 — ODDAL.** Bramki Rust czytają wyłącznie zacommitowany `vectors.json`; generator działa dziś (zweryfikowane) i ma strażnik SHA, więc ewentualna przyszła zmiana Node da głośny błąd, nie ciche złe wektory. Notatka informacyjna.
3. **Mutanty w teście są lokalnymi kopiami — ODDAL.** Test dowodzi rozdzielczości wektorów; czułość kodu produkcyjnego potwierdzona niezależnie przez Evaluatora, Obronę i FC (3/3 mutacje produkcyjne = FAIL).
4. **Weryfikacja Evaluatora — ODDAL (brak zarzutu)**; potwierdzona niezależnie powyżej.

Zero NAPRAW, zero DO DECYZJI CZŁOWIEKA → **PASS-WITH-NOTES** (noty: NIE_ZMIERZONO wołającego do Q3; parity przesunięta od bazy).
