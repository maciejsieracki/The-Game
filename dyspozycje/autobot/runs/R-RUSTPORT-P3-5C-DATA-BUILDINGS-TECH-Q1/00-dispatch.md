STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P3-5C-DATA-BUILDINGS-TECH-Q1
GOAL: Przenieść 1:1 dane z `gra/data/buildings.json`, `wonders.json`, `tech.json` do struktur Rust z
`serde::Deserialize`, embedded przez `include_str!`, parsowane w teście jednostkowym.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5
  medium. Wszystko wyłącznie przez agent() w Workflow, Operator w izolowanym worktree.

KONTEKST
Jeden z 5 RÓWNOLEGŁYCH tematów danych fazy P3 (P3-5A..P3-5E), każdy do WŁASNEGO nowego pliku Rust,
zero styku. Przeczytaj OBOWIĄZKOWO: `dyspozycje/rust-port/p2/P2-9-ASSET-DATA-MAPPING.md` — ZWŁASZCZA
znalezisko o `buildings.json` (40/40 rekordów zgodnych wartościowo z `building_costs.rs` — kontrast
z `units.json`), oraz sekcje dot. `wonders.json`/`tech.json`. `dyspozycje/rust-port/p1/
P1-16F-TECHNOLOGIE.md` i `P1-16F-CIVPEDIA-CUDA.md` jeśli pomocne do zrozumienia kształtu danych.
`dyspozycje/rust-port/p3/P3-1-2-TOOLCHAIN.md` (procedura weryfikacji cargo). Katalog `gra/data/*.json`
czytaj na pinie `edb8fb56`.

ZADANIE
1. Dla KAŻDEGO z 3 plików: wczytaj pełną zawartość na pinie, zaprojektuj struktury
   `#[derive(Deserialize)]` 1:1 z kształtem JSON.
2. Skopiuj zawartość każdego pliku JSON (bez zmian) do `rust-port/engine/data/<ta sama nazwa>.json`.
3. Nowy plik `rust-port/engine/src/data/buildings_tech.rs`: struktury + funkcje parsujące przez
   `include_str!` + `serde_json::from_str`.
4. Test jednostkowy: każdy z 3 plików parsuje się bez błędu, co najmniej 1 spot-check liczbowy per
   plik (np. liczba budynków w `buildings.json` zgodna z 40 z P2.9 — policz niezależnie).
5. **NIE dotykaj `rust-port/engine/src/lib.rs`, `domain/mod.rs` ani `domain/building_costs.rs`** —
   osobny temat konsolidacyjny/rewiringu później. Test w
   `rust-port/engine/tests/data_buildings_tech.rs` z własnym `#[path]` do nowego pliku źródłowego.

ANTY-HALUCYNACYJNA REGUŁA
Zakaz zgadywania kształtu JSON z pamięci — czytaj FAKTYCZNĄ zawartość na pinie. Zakaz twierdzenia
"parsuje się" bez wklejonego surowego logu `cargo test`.

BINARNE KRYTERIUM SUKCESU
3/3 plików JSON ma odpowiadającą strukturę Rust, parsuje się bez błędu w teście jednostkowym z
surowym logiem `cargo test` (exit 0), z co najmniej 1 spot-checkiem liczbowym per plik — w nowym
pliku `dyspozycje/rust-port/p3/P3-5C-DATA-BUILDINGS-TECH.md`.

ALLOWLISTA
Dokument: `dyspozycje/rust-port/p3/P3-5C-DATA-BUILDINGS-TECH.md` (NOWY), `dyspozycje/autobot/runs/
R-RUSTPORT-P3-5C-DATA-BUILDINGS-TECH-Q1/**`. Worktree: `rust-port/engine/data/buildings.json`,
`wonders.json`, `tech.json` (kopie 1:1), `rust-port/engine/src/data/buildings_tech.rs` (NOWY),
`rust-port/engine/tests/data_buildings_tech.rs` (NOWY). `Cargo.toml` tylko jeśli opisane jawnie w
BLOKADY dlaczego konieczne. Zero zmian w ISTNIEJĄCYCH plikach `.rs`. Zero zmian w `gra/**`.

IZOLACJA
`isolation: worktree`. Baza: `origin/rust-port/parity-v2` (HEAD `9e33fc77`). Commit w worktree
dozwolony, PUSH zdalny NIE.

PROCEDURA NAPRAWCZA PRZY FAIL
Jak w poprzednich tematach. Po 5 rundach: LIMIT-5-EXCEEDED.

OGRANICZENIA WYJŚCIA
Raport max ok. 400 słów.

FORMAT ODPOWIEDZI
STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
