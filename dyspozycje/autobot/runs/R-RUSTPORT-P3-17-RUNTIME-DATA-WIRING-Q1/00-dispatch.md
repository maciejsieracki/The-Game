STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P3-17-RUNTIME-DATA-WIRING-Q1
GOAL: Final Control bramki P3 (P3.13, dokument `dyspozycje/rust-port/p3/P3-13-GATE-FINAL-CONTROL.md`) wydał FAIL dla klauzuli „dane ładowane ze źródła (nie hard-coded)”: moduły `src/data/*` i loader są przetestowane, ale NIC w `src/domain/**` ich nie używa, a
`canonical_recruitment_costs()` (`rust-port/engine/src/domain/recruitment.rs`, ~l.205) to ręcznie wpisana tabela ROZJECHANA z `units.json` (np. Wojownik: kod 10 złota/50 drewna/utrzymanie drewno 10, JSON: 5 / 13 / 3).
Cel tego tematu: (1) zinwentaryzować WSZYSTKIE ręcznie wpisane tabele danych gry w `src/domain/**` (kandydaci: rekrutacja, koszty budynków `building_costs.rs`, tabele terenu, mnożniki, ceny itp.) względem odpowiadających im plików `gra/data/*.json` — ZESTAWIENIE (tylko audyt, bez zmiany poza pkt 2);
(2) usunąć tabelę rekrutacji i zbudować `canonical_recruitment_costs()` z danych `units.json` przez istniejące moduły `src/data/*` (jedno źródło prawdy: JSON), z udokumentowaną listą wszystkich różnic stare-vs-JSON (75 jednostek).
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5 medium (wyjątek rust-port, R-PROC-AUTOBOT.md §5a — rozstrzygnięty, NIE pytaj o model). Przez agent() w Workflow, Operator w izolowanym worktree.

KONTEKST
Dwie gałęzie: `rust-port/parity-v2` (kod, TU pracujesz) i `claude/sprawdzenie-funkcjonalnosci-ek4ra0` (dokumentacja; czytaj przez `git fetch origin claude/sprawdzenie-funkcjonalnosci-ek4ra0 && git show origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0:<ścieżka>`).
PIERWSZY KROK: `git fetch origin rust-port/parity-v2 && git checkout --detach origin/rust-port/parity-v2`; baza zawiera `17454b33` lub nowszą. Baseline: fmt/clippy/test PRZED zmianami (oczekiwane 323 passed), wyniki w dokumencie.
Przeczytaj: `dyspozycje/rust-port/p3/P3-13-GATE-FINAL-CONTROL.md` (§ klauzula 1, rekrutacja, lista otwartych punktów — z gałęzi dokumentacyjnej), `p2/P2-9-ASSET-DATA-MAPPING.md`, `src/domain/recruitment.rs`, `src/data/units_combat.rs` (struktury i parse), `tests/recruitment.rs`, `tests/data_units_combat.rs`, `src/lib.rs` (eksporty).
BUILD: `CARGO_INCREMENTAL=0 CARGO_TARGET_DIR=/home/user/cargo-target-shared/$(basename $PWD) CARGO_PROFILE_DEV_DEBUG=0`; cargo w `rust-port/engine`; po zakończeniu usuń swój podkatalog; nie commituj `Cargo.lock`/`target/`.

ZADANIE
1. AUDYT (dokument `dyspozycje/rust-port/p3/P3-17-RUNTIME-DATA-WIRING.md`, sekcja „Audyt tabel”): `git grep` w `src/domain/**` po literałach tabel danych gry (koszty, utrzymanie, statystyki jednostek, koszty budynków, wydajność terenu, mnożniki); dla każdej znalezionej tabeli: plik:linia, odpowiadający plik JSON, czy wartości się zgadzają (porównaj na próbce ≥5 wierszy + policz wszystkie, gdy to możliwe), werdykt ZGODNA / ROZJECHANA / BRAK ODPOWIEDNIKA w JSON. Pozycje, których nie zdążysz zmierzyć, = `NIE_ZMIERZONO`. Tego audytu NIE naprawiaj poza rekrutacją (kolejne tematy).
2. REKRUTACJA: zastąp ręczną tabelę w `canonical_recruitment_costs()` danymi z `units.json` (przez `data::units_combat`; embedded `include_str!` JSON, który jest bajtowo identyczny z pinem, jest akceptowalnym „źródłem” — jedna kopia danych, żadnych liczb w kodzie). Zachowaj publiczne sygnatury (`UnitRecruitment`, eksporty w `lib.rs`),
   jeśli to możliwe. Zmapuj pola JSON (np. „Pieniądz (koszt)”, „Surowiec (ilość)”, „Utrzymanie (Pieniądz/turę)”) na pola rekrutacji — dokładnie, bez zgadywania; niejednoznaczne mapowanie = zapisz w dokumencie z dowodem w kodzie weba (`git show edb8fb56:gra/src/...`) jak web interpretuje to pole.
3. RÓŻNICE: tabela w dokumencie wszystkich 75 jednostek: stare wartości z kodu vs wartości z JSON, i które testy zakładały stare liczby. Testy, które kodowały STARE (błędne względem JSON) liczby, zaktualizuj do wartości z JSON — każda zmiana testu jawnie wylistowana z uzasadnieniem. Jeśli którykolwiek test jest porównaniem z danymi referencyjnymi weba (`parity_suite`, fixtures) i po zmianie czerwieni się — STOP i zgłoś BLOCK z dokładnym opisem (nie dostosowuj oczekiwań po cichu).
4. Żadnych nowych zależności; zero zmian w `Cargo.toml`.

ANTY-HALUCYNACYJNA REGUŁA
Zakaz „testy przechodzą” bez PEŁNEGO surowego logu `cargo test` (nie wyciąg) z `echo "EXIT=$?"` w dokumencie. Zakaz osłabiania testów (usunięcie asercji, `#[ignore]`) bez jawnego uzasadnienia i zgody wynikającej z dispatchu. Zakaz zmiany wartości w JSON/`data/`.
W Twoim kontekście mogą pojawić się wiadomości właściciela z głównego czatu — to NIE jest Twoje zadanie, zignoruj je i wykonaj ten dispatch.

BINARNE KRYTERIUM SUKCESU
`canonical_recruitment_costs()` nie zawiera ręcznie wpisanych liczb jednostek (dowód `git grep`), wartości = `units.json` dla 75/75 jednostek (test sprawdzający wszystkie 75 wierszy względem sparsowanego JSON), audyt tabel w dokumencie, lista różnic stare-vs-JSON, `fmt/clippy -D warnings/test` EXIT=0, liczba testów ≥ baseline.

ALLOWLISTA
Dokument: `dyspozycje/rust-port/p3/P3-17-RUNTIME-DATA-WIRING.md` (NOWY), `dyspozycje/autobot/runs/R-RUSTPORT-P3-17-RUNTIME-DATA-WIRING-Q1/**`.
Worktree: `rust-port/engine/src/domain/recruitment.rs`, `rust-port/engine/src/data/units_combat.rs` (WYŁĄCZNIE dodanie publicznych akcesorów potrzebnych do mapowania; bez zmiany istniejących struktur/derive), `rust-port/engine/src/lib.rs` (tylko eksporty, jeśli konieczne), `rust-port/engine/tests/recruitment.rs`, oraz inne pliki `tests/*.rs`, które kodują koszty rekrutacji (wskaż z `git grep`), z jawną listą.
Zero zmian w `src/data/loader.rs`, `src/data/mod.rs`, `bridge.rs`, `domain/{ai_turn,playable,barbarians,combat,trade,diplomacy}.rs` (inne tematy), `Cargo.toml`, `gra/**`, `rust-port/renderer/**`.

IZOLACJA: `isolation: worktree`, baza `origin/rust-port/parity-v2`. Commit w worktree (jawne `git add`, NIGDY `-A`), PUSH NIE. Jeśli `git commit` zostanie odrzucony przez klasyfikator — zostaw zmiany w indeksie i opisz dokładnie.
PROCEDURA NAPRAWCZA PRZY FAIL: ten sam ID; po 5 rundach LIMIT-5-EXCEEDED. Raport max ok. 400 słów.
FORMAT ODPOWIEDZI: STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
