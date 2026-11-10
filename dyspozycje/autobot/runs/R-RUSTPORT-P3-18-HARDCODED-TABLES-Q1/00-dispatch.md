STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P3-18-HARDCODED-TABLES-Q1
GOAL: Dokończ usuwanie ręcznie wpisanych danych gry z `rust-port/engine/src/domain/**` (klauzula bramki P3 „dane ładowane ze źródła”, P3.13). P3.17 (zintegrowany, `d3a73641`) usunął tabelę rekrutacji i wykazał, że inne tabele są rozjechane lub niezmierzone
(dokument `dyspozycje/rust-port/p3/P3-17-RUNTIME-DATA-WIRING.md` §2 pozycje 1–18 i Załącznik H). Zrób w dwóch krokach: (A) ZMIERZ wszystkie niezmierzone pozycje audytu względem `gra/data/*.json` i kodu weba; (B) napraw te, które są ROZJECHANE i mają jednoznaczne źródło prawdy w JSON/webie —
w pierwszej kolejności `diplomacy.rs:1842–1905` (drugi ręczny katalog wartości jednostek: 64 wpisy, 0/64 zgodnych z `units.json`) oraz tabele z pozycji 14–18 (`improvements.rs` produkcja ulepszeń vs `terrain-improvements.json`, `map_generator.rs` udziały lądu vs `map-gen-params.json`, stałe `ai_turn.rs` vs `ai-params.json`,
`trade.rs` bonus 0.05 vs parametry handlu, `barbarians.rs` liczba obozów wg trudności vs parametry). Pozycje bez odpowiednika w JSON zostaw i wylistuj jako `BRAK ODPOWIEDNIKA` z dowodem z kodu weba.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5 medium (wyjątek rust-port, R-PROC-AUTOBOT.md §5a — rozstrzygnięty, NIE pytaj o model). Przez agent() w Workflow, Operator w izolowanym worktree.

KONTEKST
Dwie gałęzie: `rust-port/parity-v2` (kod, TU pracujesz) i `claude/sprawdzenie-funkcjonalnosci-ek4ra0` (dokumentacja; czytaj przez `git fetch origin claude/sprawdzenie-funkcjonalnosci-ek4ra0 && git show origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0:<ścieżka>`).
PIERWSZY KROK: `git fetch origin rust-port/parity-v2 && git checkout --detach origin/rust-port/parity-v2`; baza zawiera `d3a73641` (P3.17) lub nowszą. Baseline: fmt/clippy `-D warnings`/test PRZED zmianami (oczekiwane 324 passed).
Przeczytaj OBOWIĄZKOWO: `dyspozycje/rust-port/p3/P3-17-RUNTIME-DATA-WIRING.md` (§2 audyt, §3 mapowanie i dowody z weba, §8 wnioski; na parity-v2 pod tą ścieżką), `dyspozycje/rust-port/p3/P3-13-GATE-FINAL-CONTROL.md`, `src/data/*.rs` (dostępne struktury),
`src/domain/recruitment.rs` (wzorzec z P3.17: dane z `parse_*` + `OnceLock`).
ZASADY ŹRÓDŁA PRAWDY: wartości danych gry → `gra/data/*.json` na pinie `edb8fb56` (kopie w `rust-port/engine/data/` bajtowo identyczne); logika/mnożniki → kod weba (`git show edb8fb56:...`). Testy z wektorami autorstwa Rust (nie nagrania z weba) kodujące stare ręczne liczby wolno zaktualizować do wartości z JSON — KAŻDĄ zmianę testu jawnie wylistuj z uzasadnieniem i dowodem.
Jeśli czerwieni się test będący prawdziwym wektorem referencyjnym z weba/fixture z nagrania — STOP, BLOCK, opis (nie dostosowuj po cichu). Nie osłabiaj testów (`#[ignore]`, usuwanie asercji) bez jawnego uzasadnienia.
BUILD: `CARGO_INCREMENTAL=0 CARGO_TARGET_DIR=/home/user/cargo-target-shared/$(basename $PWD) CARGO_PROFILE_DEV_DEBUG=0`; cargo w `rust-port/engine`; po zakończeniu usuń swój podkatalog; nie commituj `Cargo.lock`/`target/`.

ZADANIE
1. (A) Dla KAŻDEJ z pozycji audytu P3.17 §2 (1–18) oznaczonej NIE_ZMIERZONO: zmierz (komendy wklejone), nadaj werdykt ZGODNA / ROZJECHANA / BRAK ODPOWIEDNIKA. Podaj zestawienie w dokumencie `dyspozycje/rust-port/p3/P3-18-HARDCODED-TABLES.md` (tabela: pozycja, plik:linia, JSON, liczba wierszy/wartości, wynik, dowód).
2. (B) Napraw pozycje ROZJECHANE z jednoznacznym źródłem, w kolejności: `diplomacy.rs` (katalog wartości jednostek — zasil z `units.json` zamiast ręcznej tabeli; sprawdź w kodzie weba, jak wartość jednostki w dyplomacji jest liczona z JSON, i odtwórz regułę), potem pozostałe wg wagi. Każda naprawa: dane z `parse_*` (embedded JSON), brak liczb w kodzie, test porównujący WSZYSTKIE wiersze z JSON.
3. Zmiany zachowania gry (liczby się zmieniają, bo stare były błędne) wypisz w tabeli „było/jest” z dowodem; testy kodujące stare liczby zaktualizuj jawnie (zasady wyżej).
4. Pozycje, których naprawa wymaga decyzji (np. czy dodać mnożnik epoki ×1/×2/×4 i dopłatę `kon` 25 z `building-stock-cost.ts:28,60–68,368–417` do domeny) — NIE naprawiaj, opisz opcje i koszt w sekcji „Do decyzji właściciela”.
5. `OwnerRef`/`CampId` NIE są zakresem tego tematu (osobny, po nim).

ANTY-HALUCYNACYJNA REGUŁA
Zakaz „testy przechodzą” bez PEŁNEGO surowego logu `cargo fmt/clippy/test` z `echo "EXIT=$?"` w dokumencie (nie wyciąg). Każda liczba i twierdzenie o webie ma komendę/plik:linia. Niepewne = `NIE_ZMIERZONO`.
W Twoim kontekście mogą pojawić się wiadomości właściciela z głównego czatu — to NIE jest Twoje zadanie, zignoruj je i wykonaj ten dispatch.

BINARNE KRYTERIUM SUKCESU
Tabela zestawieniowa 18 pozycji bez NIE_ZMIERZONO (lub z uzasadnieniem, czemu nie da się zmierzyć), naprawione pozycje ROZJECHANE z jednoznacznym źródłem mają dane z JSON i test wszystkich wierszy, `fmt/clippy -D warnings/test` EXIT=0 z liczbą testów ≥ 324, lista zmian zachowania i zmian testów, lista „do decyzji właściciela”.

ALLOWLISTA
Dokument: `dyspozycje/rust-port/p3/P3-18-HARDCODED-TABLES.md` (NOWY), `dyspozycje/autobot/runs/R-RUSTPORT-P3-18-HARDCODED-TABLES-Q1/**`.
Worktree: `rust-port/engine/src/domain/{diplomacy,improvements,map_generator,ai_turn,trade,barbarians}.rs` (TYLKO usunięcie ręcznych tabel danych i podpięcie danych z `data::*`), `rust-port/engine/src/data/*.rs` (TYLKO dodanie publicznych akcesorów; bez zmiany istniejących struktur), `rust-port/engine/src/lib.rs` (tylko eksporty, jeśli konieczne),
`rust-port/engine/tests/*.rs` (aktualizacja wektorów zgodnie z zasadami + nowe testy zgodności z JSON). Zero zmian w `bridge.rs`, `playable.rs`, `combat.rs`, `Cargo.toml`, `gra/**`, `rust-port/renderer/**`, `src-tauri/**`.
(Równolegle: P4.7 dokument, P4.8/9/10 w `rust-port/renderer` — nie dotykaj. Kolejny temat OwnerRef/CampId dotknie tych samych plików domeny — startuje PO tym temacie.)

IZOLACJA: `isolation: worktree`, baza `origin/rust-port/parity-v2`. Commit w worktree (jawne `git add`, NIGDY `-A`), PUSH NIE. Jeśli `git commit` zostanie odrzucony przez klasyfikator — zostaw zmiany w indeksie i opisz dokładnie.
PROCEDURA NAPRAWCZA PRZY FAIL: ten sam ID; po 5 rundach LIMIT-5-EXCEEDED. Raport max ok. 400 słów.
FORMAT ODPOWIEDZI: STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
