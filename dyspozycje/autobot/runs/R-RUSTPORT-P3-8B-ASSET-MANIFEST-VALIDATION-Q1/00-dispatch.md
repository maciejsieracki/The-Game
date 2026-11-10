STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P3-8B-ASSET-MANIFEST-VALIDATION-Q1
GOAL: Bramka P3: „manifest assetów przechodzi walidację wobec web”. Zamień jednorazową weryfikację
P3.8 (428/428, blob-hash) w trwały, powtarzalny test Rust: `tests/assets_manifest.rs` sprawdza
`rust-port/assets/MANIFEST.tsv` wobec faktycznej zawartości katalogu i wobec katalogu P1.11.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5 medium
  (wyjątek rust-port, R-PROC-AUTOBOT.md §5a — rozstrzygnięty, NIE pytaj o model). Wszystko przez agent()
  w Workflow, Operator w izolowanym worktree.

KONTEKST
Dwie gałęzie: `rust-port/parity-v2` (kod, TU pracujesz) i `claude/sprawdzenie-funkcjonalnosci-ek4ra0`
(dokumentacja). Dokumenty z gałęzi dokumentacyjnej czytaj przez
`git fetch origin claude/sprawdzenie-funkcjonalnosci-ek4ra0 && git show origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0:<ścieżka>`.
PIERWSZY KROK: `git fetch origin rust-port/parity-v2 && git checkout --detach origin/rust-port/parity-v2`;
baza musi zawierać `1d53dcdb` (P3.8) lub nowszy — katalog `rust-port/assets/` z `MANIFEST.tsv`
(kolumny: sha, rozmiar, ścieżka źródłowa, ścieżka docelowa; nagłówek + 428 wierszy) musi istnieć.
Baseline: `cargo test --offline` PRZED zmianami, zapisz liczbę (oczekiwane 256 passed).

KOSZT DYSKU: buduj z
`CARGO_TARGET_DIR=/home/user/cargo-target-shared CARGO_PROFILE_DEV_DEBUG=0 cargo test --offline`.
NIE twórz `rust-port/engine/target/` w worktree. NIE commituj `Cargo.lock` ani `target/`.

Czytaj: `dyspozycje/rust-port/p1/P1-11-ASSET-CATALOG.md` (zwłaszcza §2: liczności i sumy bajtów per
kategoria) oraz `dyspozycje/rust-port/p3/P3-8-ASSETS.md` — dostępny na gałęzi `parity-v2` pod
`dyspozycje/rust-port/p3/P3-8-ASSETS.md` (commit 1d53dcdb) lub na gałęzi dokumentacyjnej.

ZADANIE — `rust-port/engine/tests/assets_manifest.rs` (NOWY), testy:
1. manifest ma dokładnie 428 wierszy danych + nagłówek; ścieżki docelowe unikalne;
2. każda ścieżka docelowa z manifestu istnieje w `rust-port/assets/`, a jej rozmiar w bajtach == kolumna rozmiaru;
3. w `rust-port/assets/` nie ma plików spoza manifestu (poza samym `MANIFEST.tsv`) — rekurencyjny
   spacer `std::fs`, bez nowych zależności;
4. liczności per rozszerzenie: 307 svg, 8 json, 4 css, 45 jpg, 2 png, 62 mp3, oraz sumy bajtów
   per kategoria zgodne z P1.11 §2 (ikony 136 176, portrety 445 951, hero 4 214 674, muzyka
   44 584 683 — ZWERYFIKUJ te liczby w P1.11 przed wpisaniem do testu, wskaż § i wiersz);
5. (opcjonalnie, tylko jeśli zmieści się bez nowych zależności) suma kontrolna git-blob SHA-1
   zgodna z kolumną sha: wolno zaimplementować SHA-1 ręcznie w pliku testu; jeśli tego nie robisz,
   napisz jawnie w BLOKADY, że hash-weryfikacja pozostaje w `git hash-object` (wklej wynik z terminala).
6. test negatywny mechanizmu: zbuduj w pamięci zepsuty manifest (zły rozmiar / brakujący plik /
   duplikat ścieżki) i pokaż, że funkcja walidująca w teście go odrzuca — żeby test nie był pustym
   „zawsze zielonym” (plan P4.13 wymaga testów mutacyjnych tej klasy).
7. Zero zmian w `rust-port/assets/**` — jeśli test wykryje rozbieżność, to ustalenie do zgłoszenia, nie naprawy.

ANTY-HALUCYNACYJNA REGUŁA
Zakaz „testy przechodzą” bez surowego logu `cargo test` z `echo "EXIT=$?"` wklejonego dosłownie.
Każda liczba wpisana w test ma źródło (§ P1.11 albo komenda w terminalu).

BINARNE KRYTERIUM SUKCESU
`tests/assets_manifest.rs` istnieje, ≥5 testów (w tym ≥1 negatywny mechanizmu), `cargo test --offline`
exit 0, liczba testów > baseline, żaden istniejący test nie zniknął, surowy log w dokumencie.

ALLOWLISTA
Worktree: `rust-port/engine/tests/assets_manifest.rs` (NOWY) — nic więcej. Dokument:
`dyspozycje/rust-port/p3/P3-8B-ASSET-MANIFEST-VALIDATION.md` (NOWY),
`dyspozycje/autobot/runs/R-RUSTPORT-P3-8B-ASSET-MANIFEST-VALIDATION-Q1/**`.
Zero zmian w `src/**`, `Cargo.toml`, `rust-port/assets/**`, `gra/**`. (Równolegle: P3.4b na
`domain/**`+`bridge.rs`, P3.11 na `tests/data_compliance.rs`, P3.12 na `src/data/loader.rs` — nie dotykaj.)

IZOLACJA
`isolation: worktree`, baza `origin/rust-port/parity-v2`. Commit w worktree (jawne `git add` plików
z allowlisty, NIGDY `git add -A`), PUSH NIE.

PROCEDURA NAPRAWCZA PRZY FAIL: jak w poprzednich tematach, ten sam ID; po 5 rundach LIMIT-5-EXCEEDED.
OGRANICZENIA WYJŚCIA: raport max ok. 400 słów (logi w pliku docelowym).
FORMAT ODPOWIEDZI: STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
