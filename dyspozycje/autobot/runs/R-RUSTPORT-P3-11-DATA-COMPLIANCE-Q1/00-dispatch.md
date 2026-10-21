STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P3-11-DATA-COMPLIANCE-Q1
GOAL: Testy zgodności danych Rust z pinem webowym `edb8fb56` (plan P3.11): liczba i ID cywilizacji
oraz kompletność/1:1 wszystkich 27 plików `gra/data/*.json` zaimportowanych do `rust-port/engine/data/`
i sparsowanych przez moduły `src/data/*` (P3.5A-E, P3.9). Wyłącznie NOWY plik testowy.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5 medium
  (wyjątek rust-port, R-PROC-AUTOBOT.md §5a — rozstrzygnięty, NIE pytaj o model). Wszystko przez agent()
  w Workflow, Operator w izolowanym worktree.

KONTEKST
Dwie gałęzie: `rust-port/parity-v2` (kod, TU pracujesz) i `claude/sprawdzenie-funkcjonalnosci-ek4ra0`
(dokumentacja). Dokumenty z gałęzi dokumentacyjnej czytaj przez
`git fetch origin claude/sprawdzenie-funkcjonalnosci-ek4ra0 && git show origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0:<ścieżka>`.
PIERWSZY KROK: `git fetch origin rust-port/parity-v2 && git checkout --detach origin/rust-port/parity-v2`;
baza musi zawierać `1d53dcdb` (P3.8) lub nowszy. Baseline: uruchom `cargo test --offline` PRZED zmianami
i zapisz liczbę (oczekiwane 256 passed).

KOSZT DYSKU (dysk jest wąskim gardłem sesji): buduj z
`CARGO_TARGET_DIR=/home/user/cargo-target-shared CARGO_PROFILE_DEV_DEBUG=0 cargo test --offline`.
NIE twórz `rust-port/engine/target/` w worktree. NIE commituj `Cargo.lock` ani żadnego `target/`.

Czytaj: `dyspozycje/rust-port/p1/P1-12-DATA-CATALOG.md` (katalog danych, liczności), moduły
`rust-port/engine/src/data/*.rs` i istniejące `tests/data_*.rs` (żeby NIE duplikować tego, co już
sprawdzone). Źródło prawdy o danych webowych: `git show edb8fb56:gra/data/<plik>.json`.

ZADANIE
1. Zinwentaryzuj, co istniejące testy `tests/data_*.rs` już sprawdzają, a czego nie.
2. Dodaj `rust-port/engine/tests/data_compliance.rs` z testami:
   a. liczba cywilizacji i ZBIÓR ich ID w danych Rust == web na pinie (liczby i ID wyprowadź z
      `git show edb8fb56:gra/data/civs.json` i wpisz jako stałe w teście z komentarzem źródła);
   b. analogicznie liczności kluczowych kolekcji: jednostki, budynki, technologie, cuda, typy terenu,
      zasoby (tam, gdzie moduły danych je wystawiają);
   c. test 1:1 bez gubienia pól: dla każdego z 27 plików `rust-port/engine/data/*.json` sparsuj
      modułem Rust, zserializuj z powrotem do `serde_json::Value` i porównaj z `Value` z oryginalnego
      pliku. Jeśli któryś plik/struktura nie jest odwracalna (np. pola opcjonalne, `skip_serializing_if`,
      kolejność kluczy nieistotna dla `Value`), NIE osłabiaj testu po cichu — opisz jawnie różnicę
      i zgłoś jako lukę (prawdziwa luka danych = ustalenie, nie błąd testu);
   d. plik w `rust-port/engine/data/` jest bajtowo identyczny z blobem na pinie — jeśli nie da się
      tego sprawdzić w teście bez zależności, sprawdź to w terminalu (`git hash-object` vs
      `git rev-parse edb8fb56:gra/data/<plik>`) i wklej wynik do dokumentu.
3. Zero nowych zależności, zero zmian w `Cargo.toml`.
4. Jeśli test wykryje REALNĄ rozbieżność danych (np. brakujące pole w strukturze): nie naprawiaj w
   `src/data/**` (poza allowlistą) — udokumentuj jako ustalenie z dowodem i oznacz test jako
   `#[ignore = "<powód>"]` TYLKO jeśli to konieczne, z jawnym wpisem w BLOKADY.

ANTY-HALUCYNACYJNA REGUŁA
Zakaz twierdzenia „testy przechodzą” bez wklejonego surowego logu `cargo test` z kodem wyjścia
(`echo "EXIT=$?"` zaraz po komendzie, wklejone dosłownie). Zakaz wpisywania liczności „z głowy” —
każda stała w teście ma źródło (komenda `git show ... | ...` wklejona w dokumencie).

BINARNE KRYTERIUM SUKCESU
Nowy `tests/data_compliance.rs` istnieje, `cargo test --offline` exit 0, liczba testów > baseline,
żaden istniejący test nie zniknął, dokument z surowym logiem i wynikami weryfikacji `git hash-object`.

ALLOWLISTA
Worktree: `rust-port/engine/tests/data_compliance.rs` (NOWY) — nic więcej. Dokument:
`dyspozycje/rust-port/p3/P3-11-DATA-COMPLIANCE.md` (NOWY), `dyspozycje/autobot/runs/R-RUSTPORT-P3-11-DATA-COMPLIANCE-Q1/**`.
Zero zmian w `src/**`, `Cargo.toml`, istniejących testach, `gra/**`. (Równolegle pracują inne tematy
na `domain/**`, `bridge.rs`, `src/data/loader.rs`, `tests/assets_manifest.rs` — nie dotykaj ich.)

IZOLACJA
`isolation: worktree`, baza `origin/rust-port/parity-v2`. Commit w worktree (jawne `git add` plików
z allowlisty, NIGDY `git add -A`), PUSH NIE — integracja po PASS Final Control, krok orkiestratora.

PROCEDURA NAPRAWCZA PRZY FAIL: jak w poprzednich tematach, ten sam ID; po 5 rundach LIMIT-5-EXCEEDED.
OGRANICZENIA WYJŚCIA: raport max ok. 400 słów (logi w pliku docelowym).
FORMAT ODPOWIEDZI: STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
