STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P3-3-ERRORS-LOGGING-Q1
GOAL: Zaprojektować spójną strategię błędów, logowania i diagnostyki dla `rust-port/engine` i
warstwy Tauri — co już istnieje (`BridgeError`/`BridgeErrorCode`, `bridge.rs:119-125`), czego
brakuje, i jak to się ma do polityki błędów importu zapisów ustalonej w P2.11 (atomowy fail tylko
dla nienaprawialnego uszkodzenia, naprawa-z-ostrzeżeniem dla reszty). PROPOZYCJA + wdrożenie
minimalnego szkieletu, analogicznie do wzorca P2 (dokument projektowy, potem osobny temat
implementacyjny dla reszty) — NIE architektura od zera w próżni, tylko na tym co już jest.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5
  medium. Wszystko wyłącznie przez agent() w Workflow.

KONTEKST
Drugi temat fazy P3, niezależny od P3.1-2 (zamknięty PASS — toolchain zweryfikowany, 224/224 testów
zielonych). Przeczytaj OBOWIĄZKOWO: `dyspozycje/rust-port/p2/P2-8-TAURI-ADAPTER.md` (dzisiejszy stan
błędów: `BridgeError{code,message}`, kody `InvalidRequest|UnsupportedVersion|EngineRejected|
EventEmission|Internal`, `bridge.rs:119-155`), `dyspozycje/rust-port/p2/P2-11-SAVE-MIGRATION.md` §10
(polityka błędów importu — atomowy fail tylko dla nienaprawialnego uszkodzenia strukturalnego,
naprawa-z-ostrzeżeniem dla reszty), `dyspozycje/rust-port/p3/P3-1-2-TOOLCHAIN.md` (stan toolchaina:
`rustc`/`cargo` 1.97.0, 224 testy w 26 binarkach — sprawdź, czy jest już jakiś mechanizm logowania
używany w testach/kodzie, np. crate `log`/`tracing`, `eprintln!`, czy nic).

ZADANIE
1. Zinwentaryzuj FAKTYCZNY stan: czy `rust-port/engine` używa dziś jakiegokolwiek mechanizmu
   logowania (`git grep` dla `log::`, `tracing::`, `eprintln!`, `println!` w `src/`), czy
   `BridgeError` ma wystarczającą granulację kodów błędów dla wszystkich dotychczas skatalogowanych
   scenariuszy błędów (P2.5 komendy, P2.11 import), czy są gdziekolwiek `unwrap()`/`panic!()` w
   ścieżkach obsługujących wejście z zewnątrz (komendy gracza, import zapisu) — to są kandydaci do
   zamiany na `Result`, bo panika w aplikacji desktopowej = crash całej gry.
2. Zaprojektuj: (a) rozszerzenie `BridgeErrorCode` o kody potrzebne dla polityki importu P2.11
   (np. rozróżnienie błędu strukturalnego od ostrzeżenia naprawionego), (b) mechanizm logowania
   (rekomendacja: `tracing` — standard w ekosystemie Tauri, wspiera structured logging i poziomy),
   z jasnym podziałem: co loguje się zawsze (błędy, ostrzeżenia importu), co tylko w trybie debug.
3. Zidentyfikuj WSZYSTKIE `unwrap()`/`expect()`/`panic!()` w `src/` poza testami (`git grep` na pinie
   `9e33fc77`) i oceń każdy: czy jest bezpieczny (np. invariant matematyczny niemożliwy do złamania)
   czy wymaga zamiany na `Result` (ścieżka z danymi z zewnątrz — import, komenda gracza).
4. Napisz PROPOZYCJĘ (dokument, jak P2.x) — implementacja minimalnego szkieletu (dodanie `tracing`
   jako zależność w `Cargo.toml`, jeden przykładowy punkt logowania) jest DOZWOLONA jeśli projekt
   jest jednoznaczny, ale PEŁNA zamiana wszystkich `unwrap()` to osobny temat implementacyjny
   (zbyt duży zakres na ten temat) — oznacz to wprost jako zakres przyszłej pracy, nie udawaj że
   zrobiono więcej niż zrobiono.

ANTY-HALUCYNACYJNA REGUŁA
Zakaz projektowania systemu logowania w próżni bez sprawdzenia FAKTYCZNEGO stanu kodu (grep, nie
domysł). Zakaz twierdzenia "wszystkie `unwrap()` bezpieczne" bez wypisania KAŻDEGO z osobna z oceną.

BINARNE KRYTERIUM SUKCESU
Pełna lista `unwrap()`/`expect()`/`panic!()` w `src/` (plik:linia, ocena bezpieczny/do zamiany),
propozycja rozszerzenia `BridgeErrorCode`, propozycja mechanizmu logowania z uzasadnieniem wyboru
biblioteki — w nowym pliku `dyspozycje/rust-port/p3/P3-3-ERRORS-LOGGING.md`.

ALLOWLISTA
Zapis dokumentu: `dyspozycje/rust-port/p3/P3-3-ERRORS-LOGGING.md` (NOWY plik, poza worktree),
`dyspozycje/autobot/runs/R-RUSTPORT-P3-3-ERRORS-LOGGING-Q1/**`. Jeśli implementacja minimalnego
szkieletu jest wykonywana: WYŁĄCZNIE w izolowanym worktree na `rust-port/parity-v2`, zakres
`rust-port/engine/Cargo.toml` (dodanie zależności) i co najwyżej 1 nowy plik (`src/logging.rs` albo
podobny) — bez modyfikacji istniejących plików domenowych. Zero zmian w `gra/**`.

IZOLACJA
`isolation: worktree` dla roli Operator (potrzebuje `cargo build` do weryfikacji, że dodanie
zależności się kompiluje). Baza: `origin/rust-port/parity-v2` (HEAD `9e33fc77`). NIE push bez
wyraźnej zgody — integracja po PASS Final Control.

PROCEDURA NAPRAWCZA PRZY FAIL
Jak w poprzednich tematach. Po 5 rundach: LIMIT-5-EXCEEDED.

OGRANICZENIA WYJŚCIA
Raport max ok. 400 słów.

FORMAT ODPOWIEDZI
STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
