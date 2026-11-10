STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P3-5E-DATA-ECON-SOCIETY-Q1
GOAL: Przenieść 1:1 dane z `gra/data/econ-params.json`, `society-params.json`,
`epoka-ludnosc-manpower.json`, `citizen-resource-upkeep.json`, `miasto-params.json`, `resources.json`,
`e-start-params.json`, `ai-params.json`, `ui-params.json` do struktur Rust z `serde::Deserialize`,
embedded przez `include_str!`, parsowane w teście jednostkowym.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5
  medium. Wszystko wyłącznie przez agent() w Workflow, Operator w izolowanym worktree.

KONTEKST
Jeden z 5 RÓWNOLEGŁYCH tematów danych fazy P3 (P3-5A..P3-5E), każdy do WŁASNEGO nowego pliku Rust,
zero styku. To NAJWIĘKSZY zbiór plików (9) — jeśli okaże się zbyt duży na jedną rundę, podziel na
pod-grupy w KOLEJNYCH rundach tego samego tematu, nie zostawiaj połowy zrobionej bez jawnego
oznaczenia. Przeczytaj OBOWIĄZKOWO: `dyspozycje/rust-port/p2/P2-9-ASSET-DATA-MAPPING.md` (sekcje
dot. tych plików — stan dzisiejszy, ewentualne rozjazdy), `dyspozycje/rust-port/p1/
P1-16D-OPISY-EKONOMIA5X.md` (rozjazd ekonomii ×5, może dotyczyć `econ-params.json`). `dyspozycje/
rust-port/p3/P3-1-2-TOOLCHAIN.md` (procedura weryfikacji cargo). Katalog `gra/data/*.json` czytaj na
pinie `edb8fb56`.

ZADANIE
1. Dla KAŻDEGO z 9 plików: wczytaj pełną zawartość na pinie, zaprojektuj struktury
   `#[derive(Deserialize)]` 1:1 z kształtem JSON.
2. Skopiuj zawartość każdego pliku JSON (bez zmian) do `rust-port/engine/data/<ta sama nazwa>.json`.
3. Nowy plik `rust-port/engine/src/data/economy_society.rs`: struktury + funkcje parsujące przez
   `include_str!` + `serde_json::from_str`. Jeśli plik Rust robi się zbyt duży, możesz podzielić na
   `economy_society.rs` + `economy_society_part2.rs` w TYM SAMYM temacie — oba nowe, oba Twoje.
4. Test jednostkowy: każdy z 9 plików parsuje się bez błędu, co najmniej 1 spot-check liczbowy per
   plik.
5. **NIE dotykaj `rust-port/engine/src/lib.rs`, `domain/mod.rs` ani żadnego istniejącego pliku
   domenowego** (`turn_economy.rs`, `resource_production.rs` itd.) — osobny temat konsolidacyjny/
   rewiringu później. Test w `rust-port/engine/tests/data_economy_society.rs` z własnym `#[path]`
   do nowych plików źródłowych.

ANTY-HALUCYNACYJNA REGUŁA
Zakaz zgadywania kształtu JSON z pamięci — czytaj FAKTYCZNĄ zawartość na pinie. Zakaz twierdzenia
"parsuje się" bez wklejonego surowego logu `cargo test`. Przy 9 plikach ryzyko pominięcia jednego
jest wysokie — policz na końcu 9/9 jawnie w raporcie.

BINARNE KRYTERIUM SUKCESU
9/9 plików JSON ma odpowiadającą strukturę Rust, parsuje się bez błędu w teście jednostkowym z
surowym logiem `cargo test` (exit 0), z co najmniej 1 spot-checkiem liczbowym per plik — w nowym
pliku `dyspozycje/rust-port/p3/P3-5E-DATA-ECON-SOCIETY.md`.

ALLOWLISTA
Dokument: `dyspozycje/rust-port/p3/P3-5E-DATA-ECON-SOCIETY.md` (NOWY), `dyspozycje/autobot/runs/
R-RUSTPORT-P3-5E-DATA-ECON-SOCIETY-Q1/**`. Worktree: `rust-port/engine/data/econ-params.json`,
`society-params.json`, `epoka-ludnosc-manpower.json`, `citizen-resource-upkeep.json`,
`miasto-params.json`, `resources.json`, `e-start-params.json`, `ai-params.json`, `ui-params.json`
(kopie 1:1), `rust-port/engine/src/data/economy_society*.rs` (NOWE),
`rust-port/engine/tests/data_economy_society.rs` (NOWY). `Cargo.toml` tylko jeśli opisane jawnie w
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
