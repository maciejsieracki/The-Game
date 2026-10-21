STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P3-3-IMPL-Q1
GOAL: Wdrożyć (kod Rust, nie tylko propozycja) trzy konkretne naprawy zidentyfikowane w
`dyspozycje/rust-port/p3/P3-3-ERRORS-LOGGING.md`: (1) szkielet logowania `tracing`, (2) naprawa
latentnej paniki importu w `EventQueue::enqueue`, (3) naprawa rozjazdu atomowości w
`MockEngineAdapter::AddPlayer`. Rozszerzenie `BridgeErrorCode` o kody importu P2.11 NIE wchodzi do
tego tematu — dokument źródłowy wprost mówi, że ma to iść razem z implementacją importu P2.11, nie
przed nią.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5
  medium. Wszystko wyłącznie przez agent() w Workflow, Operator w izolowanym worktree.

KONTEKST
Trzeci temat fazy P3, następca P3.3 (zamknięty PASS jako propozycja). Przeczytaj OBOWIĄZKOWO:
`dyspozycje/rust-port/p3/P3-3-ERRORS-LOGGING.md` CAŁY (§2 inwentarz 16 miejsc panic/assert, §3
propozycja BridgeErrorCode — TYLKO do wiedzy, nie wdrażać teraz, §4 propozycja tracing, §5 zakres
przyszłej pracy — Twoje zadanie to punkty 1 i 3 z tej listy plus szkielet z §4).
`dyspozycje/rust-port/p3/P3-1-2-TOOLCHAIN.md` (procedura weryfikacji: świeży checkout, cargo
build/test od zera, online i offline — użyj TEJ SAMEJ procedury do weryfikacji swoich zmian).

ZADANIE
1. **Szkielet `tracing`** (§4 dokumentu źródłowego): dodaj `tracing = "0.1"` jako zależność
   bezpośrednią w `rust-port/engine/Cargo.toml` (wersja już rozwiązana w `src-tauri/Cargo.lock` do
   0.1.44 — sprawdź że się zgadza). Silnik NIE instaluje subskrybenta (to biblioteka) — używa
   wyłącznie makr `tracing::{error!, warn!, info!, debug!}` w miejscach z §4 dokumentu źródłowego
   (m.in. odrzucenie importu, zatruty mutex, błąd emisji eventu — dokładna lista w §4).
2. **Naprawa `events.rs:384`** (pozycja #5 inwentarza): zamień `.expect("event queue sequence
   exhausted")` w `EventQueue::enqueue` na obsługę przez `try_enqueue` w granicy importu (ten punkt
   wywołania musi zwracać `Result`, nie panikować) ORAZ w `normalize()` (`events.rs:508-527`)
   odrzucaj/koryguj wejściowe `sequence == u64::MAX` zamiast przepuszczać je do stanu, który potem
   wywołuje panikę. Dodaj test regresyjny: deserializacja `EventQueueWire` z `sequence ==
   u64::MAX` NIE powoduje paniki przy kolejnym `enqueue`.
3. **Naprawa `MockEngineAdapter::AddPlayer`** (`bridge.rs:330-349`): zamień kolejność — najpierw
   `game.add_player(...)?` (fallibilne), DOPIERO PO sukcesie `self.state.players.push(...)`. Dodaj
   test regresyjny: gdy `add_player` zwraca błąd, `state.players` NIE zawiera nowego gracza.
4. Uruchom PEŁNĄ procedurę z P3-1-2-TOOLCHAIN.md (świeży checkout w worktree, `cargo build` +
   `cargo test`, online i offline) PO swoich zmianach — wklej surowe logi jako dowód, dokładnie jak
   w P3.1-2. Liczba testów MUSI wzrosnąć o co najmniej 2 (dwa nowe testy regresyjne) względem 224
   z P3.1-2, wszystkie PASS.

ANTY-HALUCYNACYJNA REGUŁA
Zakaz twierdzenia "naprawione" bez testu regresyjnego, który REALNIE czerwienieje na starym kodzie
i zieleni się po poprawce (uruchom test na starym kodzie najpierw, pokaż że faktycznie łapie błąd).
Zakaz rozszerzania zakresu o `BridgeErrorCode`/`ImportWarning` — to świadomie POZA tym tematem.

BINARNE KRYTERIUM SUKCESU
`cargo build` i `cargo test` zielone (exit 0) w worktree po zmianach, z co najmniej 2 nowymi testami
regresyjnymi (jeden na `events.rs` sequence overflow, jeden na `AddPlayer` atomowość), oba
pokazane jako czerwone na kodzie PRZED poprawką i zielone PO — surowe logi w
`dyspozycje/rust-port/p3/P3-3-IMPL.md`.

ALLOWLISTA
Zapis dokumentu: `dyspozycje/rust-port/p3/P3-3-IMPL.md` (NOWY plik, poza worktree),
`dyspozycje/autobot/runs/R-RUSTPORT-P3-3-IMPL-Q1/**`. W IZOLOWANYM WORKTREE na `rust-port/parity-v2`:
`rust-port/engine/Cargo.toml`, `rust-port/engine/src/lib.rs` (dodanie `pub mod logging;` jeśli
potrzebne), nowy plik `rust-port/engine/src/logging.rs` (jeśli potrzebny), `rust-port/engine/src/
domain/events.rs`, `rust-port/engine/src/bridge.rs`, nowe/zmienione pliki testowe w
`rust-port/engine/tests/`. Commit w worktree dozwolony, PUSH do zdalnego repo NIE — integracja po
PASS Final Control, osobny krok orkiestratora. Zero zmian w `gra/**`.

IZOLACJA
`isolation: worktree` dla roli Operator. Baza: `origin/rust-port/parity-v2` (HEAD `9e33fc77`).

PROCEDURA NAPRAWCZA PRZY FAIL
Jak w poprzednich tematach. Po 5 rundach: LIMIT-5-EXCEEDED.

OGRANICZENIA WYJŚCIA
Raport max ok. 400 słów (pełne logi cargo w pliku docelowym, liczą się osobno).

FORMAT ODPOWIEDZI
STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
