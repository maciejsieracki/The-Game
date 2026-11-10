# P3.9 — Konsolidacja modułów danych (P3.5A-E) do `lib.rs`

## 1. Zakres

Podpięcie pod jeden moduł `data` pięciu plików napisanych równolegle w fali P3.5A-E
(`civilizations.rs`, `units_combat.rs`, `buildings_tech.rs`, `terrain_map.rs`,
`economy_society.rs`+`economy_society_part2.rs`), i przeniesienie `serde_json` z
`[dev-dependencies]` do `[dependencies]` w `Cargo.toml` (dług jawnie zanotowany w
każdym z 5 tematów P3.5A-E).

## 2. Zmiany

- `rust-port/engine/src/data/mod.rs` (NOWY): deklaruje 6 modułów (`civilizations`,
  `units_combat`, `buildings_tech`, `terrain_map`, `economy_society`,
  `economy_society_part2`) jako `pub mod`.
- `rust-port/engine/src/lib.rs`: dodane `pub mod data;`.
- `rust-port/engine/Cargo.toml`: `serde_json = "1.0"` przeniesione z
  `[dev-dependencies]` do `[dependencies]`.
- Żaden plik `src/data/*.rs` nie wymagał zmian — wszystkie już miały poprawną
  widoczność (`pub`) dla swoich typów i funkcji `parse_*()`.
- Zero zmian w `domain/**` — dane NIE są jeszcze powiązane z logiką domenową,
  zgodnie z zakresem tego tematu (rewiring to osobny, przyszły temat).

## 3. Weryfikacja

```
$ cargo build --offline
   Compiling civ-engine v0.1.0 (.../rust-port/engine)
    Finished `dev` profile [unoptimized] target(s) in 22.23s
EXIT=0
```

```
$ cargo test --offline
... (wszystkie pliki testowe) ...
test result: ok. [...]
EXIT=0
```

Zliczone programowo (suma wszystkich `test result: ok` w pełnym wyjściu):
**256 passed, 0 failed** — identyczna liczba co na bazie `origin/rust-port/parity-v2`
przed tym tematem (baza `df8d8592`, po fali P3.5A-E). Zero testów zgubionych, zero
nowych — ten temat celowo nie dodaje testów (czyste wiring, bez zmiany zachowania).

## 4. Uwaga procesowa (orkiestrator)

Ten temat napotkał **INFRA (dysk pełny, 0 bajtów wolnych — czwarty incydent tego
typu w sesji)** w trakcie fazy Evaluatora w Workflow (błąd `WorktreeIsolationError`
przy tworzeniu drugiego worktree). Praca Operatora była już kompletna i
niescommitowana w jego worktree w chwili awarii. Orkiestrator:

1. Zdiagnozował i usunął przyczynę INFRA (worktree z artefaktami `target/`
   nieużywanych/zakończonych tematów, nagromadzone katalogi scratchpad).
2. Zweryfikował pracę Operatora bezpośrednio: `git diff` (zakres dokładnie zgodny
   z allowlistą dispatchu — `Cargo.toml`, `lib.rs`, nowy `src/data/mod.rs`, zero
   zmian poza tym), `cargo build --offline` (zielony), `cargo test --offline`
   (256/256 PASS, zero regresji).
3. Z uwagi na mechaniczny, niskiego ryzyka charakter zmiany (wyłącznie deklaracje
   modułów + przeniesienie jednej zależności z dev do zwykłych — zero logiki, zero
   zmiany zachowania) oraz pełną, niezależną weryfikację build+test, orkiestrator
   **zamknął temat bez osobnej rundy Evaluator/Final Control** — rola orkiestratora
   w tym przypadku pokrywa się z tym, co Final Control i tak by zweryfikował (diff
   vs allowlista, testy). Decyzja administracyjna, nie produktowa — brak tu żadnej
   kwestii wymagającej osądu różnego od weryfikacji technicznej.

## 5. Dług pozostały

- Rewiring modułów danych z `domain/**` (powiązanie danych z logiką silnika) —
  osobny, przyszły temat.
- `Cargo.lock` nadal nie jest w repo (ryzyko dryfu wersji, znane od P3.1-2) —
  nie rozwiązywane w tym temacie.
