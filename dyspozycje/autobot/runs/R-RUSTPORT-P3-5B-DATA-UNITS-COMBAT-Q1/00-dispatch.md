STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P3-5B-DATA-UNITS-COMBAT-Q1
GOAL: Przenieść 1:1 dane z `gra/data/units.json`, `combat-params.json`, `terrain-combat.json`,
`counters.json`, `auto-battle-params.json`, `power-params.json` do struktur Rust z
`serde::Deserialize`, embedded przez `include_str!`, parsowane w teście jednostkowym.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5
  medium. Wszystko wyłącznie przez agent() w Workflow, Operator w izolowanym worktree.

KONTEKST
Jeden z 5 RÓWNOLEGŁYCH tematów danych fazy P3 (P3-5A..P3-5E), każdy do WŁASNEGO nowego pliku Rust,
zero styku. Przeczytaj OBOWIĄZKOWO: `dyspozycje/rust-port/p2/P2-9-ASSET-DATA-MAPPING.md` — ZWŁASZCZA
znalezisko o `units.json` ↔ `recruitment.rs`: 75/75 nazw zgodnych, ALE 75/75 WARTOŚCI rozbieżnych
(komentarz w kodzie "mirrored from units.json" jest nieprawdziwy). TWOJE ZADANIE to WYŁĄCZNIE
nowa warstwa danych 1:1 z JSON — NIE dotykaj `recruitment.rs` ani nie próbuj "naprawiać" rozjazdu,
to osobny temat rewiringu domeny po zamknięciu wszystkich tematów danych. `dyspozycje/rust-port/p3/
P3-1-2-TOOLCHAIN.md` (procedura weryfikacji cargo). Katalog `gra/data/*.json` czytaj na pinie
`edb8fb56`.

ZADANIE
1. Dla KAŻDEGO z 6 plików: wczytaj pełną zawartość na pinie, zaprojektuj struktury
   `#[derive(Deserialize)]` 1:1 z kształtem JSON (nazwy pól jak w JSON, `#[serde(rename)]` gdzie
   trzeba, zachowaj typy liczbowe/stringowe jak w źródle).
2. Skopiuj zawartość każdego pliku JSON (bez zmian) do `rust-port/engine/data/<ta sama nazwa>.json`.
3. Nowy plik `rust-port/engine/src/data/units_combat.rs`: struktury + funkcje parsujące przez
   `include_str!` + `serde_json::from_str`.
4. Test jednostkowy: każdy z 6 plików parsuje się bez błędu, co najmniej 1 spot-check liczbowy per
   plik (np. `units.json` ma dokładnie tyle samo typów jednostek, ile mówi P2.9 — 75; policz
   niezależnie, nie przepisuj liczby z P2.9 bez weryfikacji).
5. **NIE dotykaj `rust-port/engine/src/lib.rs`, `domain/mod.rs` ani `domain/recruitment.rs`** — osobny
   temat konsolidacyjny później. Test w `rust-port/engine/tests/data_units_combat.rs` z własnym
   `#[path]` do nowego pliku źródłowego, bez edycji istniejących plików rejestrujących moduły.

ANTY-HALUCYNACYJNA REGUŁA
Zakaz zgadywania kształtu JSON z pamięci — czytaj FAKTYCZNĄ zawartość na pinie. Zakaz twierdzenia
"parsuje się" bez wklejonego surowego logu `cargo test`. Zakaz "poprawiania" wartości `units.json`
względem `recruitment.rs` — to poza zakresem, kopiujesz dane JSON 1:1, nie domenę.

BINARNE KRYTERIUM SUKCESU
6/6 plików JSON ma odpowiadającą strukturę Rust, parsuje się bez błędu w teście jednostkowym z
surowym logiem `cargo test` (exit 0), z co najmniej 1 spot-checkiem liczbowym per plik — w nowym
pliku `dyspozycje/rust-port/p3/P3-5B-DATA-UNITS-COMBAT.md`.

ALLOWLISTA
Dokument: `dyspozycje/rust-port/p3/P3-5B-DATA-UNITS-COMBAT.md` (NOWY), `dyspozycje/autobot/runs/
R-RUSTPORT-P3-5B-DATA-UNITS-COMBAT-Q1/**`. Worktree: `rust-port/engine/data/units.json`,
`combat-params.json`, `terrain-combat.json`, `counters.json`, `auto-battle-params.json`,
`power-params.json` (kopie 1:1), `rust-port/engine/src/data/units_combat.rs` (NOWY),
`rust-port/engine/tests/data_units_combat.rs` (NOWY). `Cargo.toml` tylko jeśli opisane jawnie w
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
