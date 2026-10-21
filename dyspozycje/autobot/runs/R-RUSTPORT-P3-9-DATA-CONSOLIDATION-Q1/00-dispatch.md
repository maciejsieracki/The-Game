STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P3-9-DATA-CONSOLIDATION-Q1
GOAL: Podpiąć wszystkie 5 nowych modułów danych z fali P3.5A-E (`src/data/{civilizations,
units_combat, buildings_tech, terrain_map, economy_society, economy_society_part2}.rs`) do
`lib.rs`/`src/data/mod.rs` jako jeden spójny moduł `data`, i przenieść `serde_json` z
`[dev-dependencies]` do `[dependencies]` w `Cargo.toml` (dług jawnie zanotowany w każdym z 5
tematów P3.5A-E — teraz go spłacamy, jednym skoordynowanym krokiem zamiast 5 kolidujących).
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5
  medium. Wszystko wyłącznie przez agent() w Workflow, Operator w izolowanym worktree.

KONTEKST
Fala P3.5A-E (5/5 PASS, zintegrowane na `origin/rust-port/parity-v2`, HEAD `df8d8592`) celowo
zostawiła wszystkie moduły danych NIEPODPIĘTE do `lib.rs` — każdy temat pisał WYŁĄCZNIE nowe pliki,
żeby 5 równoległych Operatorów nie kolidowało na `lib.rs`/`Cargo.toml`. Ten temat to skonsolidowane,
sekwencyjne podpięcie. Repozytorium ma dwie gałęzie (kod na `rust-port/parity-v2`, dokumentacja na
`claude/sprawdzenie-funkcjonalnosci-ek4ra0`) — dokumenty P3-5A..E są dostępne na OBU: zostały
skopiowane na gałąź dokumentacyjną po integracji, więc czytaj je z lokalnego `dyspozycje/rust-port/
p3/P3-5{A,B,C,D,E}-*.md` jeśli pracujesz z checkoutu dokumentacyjnego, albo przez `git show` z
gałęzi kodu jeśli Twój worktree jest na `rust-port/parity-v2` (sprawdź które działa w Twoim
środowisku — oba pliki powinny być identyczne).

PIERWSZY KROK: `git fetch origin rust-port/parity-v2 && git checkout --detach
origin/rust-port/parity-v2` — potwierdź, że jesteś na `df8d8592` lub nowszym.

ZADANIE
1. Stwórz `rust-port/engine/src/data/mod.rs` (jeśli nie istnieje) deklarujący wszystkie 5 modułów:
   `pub mod civilizations; pub mod units_combat; pub mod buildings_tech; pub mod terrain_map; pub mod
   economy_society; pub mod economy_society_part2;` (sprawdź dokładne nazwy plików przez `ls
   rust-port/engine/src/data/`).
2. W `lib.rs` dodaj `pub mod data;` (jeśli moduł `data` jeszcze nie jest zadeklarowany — sprawdź, bo
   P3.5D mógł to już zrobić dla pojedynczego pliku; ujednolić do jednego `pub mod data;` wskazującego
   na `data/mod.rs`).
3. W `Cargo.toml` przenieś `serde_json` z `[dev-dependencies]` do `[dependencies]` (jeśli jest
   zduplikowany w obu sekcjach, usuń duplikat w `[dev-dependencies]`).
4. Napraw kompilację: pliki `src/data/*.rs` używają dziś `#[path]` w testach lub mają publiczne
   funkcje `parse_*()` zakładające `serde_json` jako dev-dep — upewnij się że kompilują się jako
   część biblioteki (nie tylko w testach).
5. NIE WIĄŻ jeszcze danych z logiką domenową (`domain/**`) — to osobny, przyszły temat "rewiringu".
   Ten temat to WYŁĄCZNIE poprawne, skompilowane podpięcie modułów, bez zmiany zachowania.

ANTY-HALUCYNACYJNA REGUŁA
Zakaz twierdzenia "kompiluje się"/"testy przechodzą" bez wklejonego surowego logu `cargo build` i
`cargo test` Z PRZECHWYCONYM KODEM WYJŚCIA, dosłownie, bez redakcji. Policz liczbę testów przed i po
— musi być >= liczbie sprzed tego tematu (żadne testy nie mogą zniknąć/zostać wyłączone cicho).

BINARNE KRYTERIUM SUKCESU
`cargo build --all-targets` i `cargo test` zielone (exit 0) z modułem `data` w pełni zadeklarowanym
w `lib.rs`, `serde_json` wyłącznie w `[dependencies]`, w nowym pliku
`dyspozycje/rust-port/p3/P3-9-DATA-CONSOLIDATION.md`.

ALLOWLISTA
Dokument: `dyspozycje/rust-port/p3/P3-9-DATA-CONSOLIDATION.md` (NOWY), `dyspozycje/autobot/runs/
R-RUSTPORT-P3-9-DATA-CONSOLIDATION-Q1/**`. Worktree (`rust-port/parity-v2`, baza `df8d8592` lub
nowsza): `rust-port/engine/src/lib.rs`, `rust-port/engine/src/data/mod.rs` (nowy, jeśli potrzebny),
`rust-port/engine/Cargo.toml`. Zero zmian w `domain/**`, zero zmian w istniejących plikach
`src/data/*.rs` poza ewentualną drobną korektą widoczności (`pub`) jeśli kompilator tego wymaga —
jeśli wymaga więcej, opisz jako BLOKADA, nie improwizuj. Zero zmian w `gra/**`.

IZOLACJA
`isolation: worktree`. Baza: `origin/rust-port/parity-v2`, jawnie zweryfikowana jako pierwszy krok.
Commit w worktree dozwolony, PUSH zdalny NIE — integracja po PASS Final Control, osobny krok
orkiestratora.

PROCEDURA NAPRAWCZA PRZY FAIL
Jak w poprzednich tematach. Po 5 rundach: LIMIT-5-EXCEEDED.

OGRANICZENIA WYJŚCIA
Raport max ok. 400 słów (pełne logi cargo w pliku docelowym, liczą się osobno).

FORMAT ODPOWIEDZI
STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
