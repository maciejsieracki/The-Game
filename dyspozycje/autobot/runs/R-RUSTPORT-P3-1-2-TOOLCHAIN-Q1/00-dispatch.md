STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P3-1-2-TOOLCHAIN-Q1
GOAL: Ustalić i udokumentować czysty, odtwarzalny toolchain dla `rust-port/engine` na gałęzi
`rust-port/parity-v2` — `cargo build` i `cargo test` zielone od zera na świeżym checkoucie, bez
żadnych zmian w `gra/` (web). To jest PIERWSZY temat fazy P3 i jedyny, od którego zależą wszystkie
pozostałe (P3.3+) — ma być wykonany SEKWENCYJNIE, PRZED dispatchem jakiegokolwiek innego tematu P3.
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5
  medium. Wszystko wyłącznie przez agent() w Workflow, Operator w izolowanym worktree.

KONTEKST
Faza P2 zamknięta (bramka formalnie otwarta, `dyspozycje/rust-port/p2/P2-13-GATE-SYNTHESIS.md`).
`rust-port/engine` na `origin/rust-port/parity-v2` (HEAD `9e33fc77`) to crate `civ-engine` (Cargo.toml:
`serde`, dev-dependency `serde_json`) z ok. 29 plików w `src/domain/` (recruitment.rs, diplomacy.rs,
trade.rs, save_load.rs, ai_turn.rs, combat.rs, itd. — katalogowane w P2.1/P2.8/P2.9). Żaden z
dotychczasowych tematów P2 nie uruchamiał `cargo build`/`cargo test` — to jest PIERWSZA faktyczna
weryfikacja, że ten kod się w ogóle kompiluje i przechodzi własne testy na czystym checkoucie.
Przeczytaj `dyspozycje/rust-port/p2/P2-1-DOMAIN-MODULES.md` (katalog modułów) jako kontekst, NIE
projektuj niczego od nowa — to jest weryfikacja istniejącego kodu, nie nowa architektura.

ZADANIE
1. Sklonuj/sprawdź `origin/rust-port/parity-v2` do izolowanego worktree. Uruchom `cargo build`
   w `rust-port/engine/`. Zapisz DOKŁADNĄ wersję toolchaina (`rustc --version`, `cargo --version`)
   i czy build przechodzi bez błędów/ostrzeżeń. Jeśli NIE przechodzi — napraw najmniejszym możliwym
   patchem (nie refaktoryzuj), z dowodem co było nie tak i co zmieniono.
2. Uruchom `cargo test` w `rust-port/engine/`. Zapisz wynik: liczba testów, ile PASS/FAIL/pominiętych.
   Jeśli są FAIL — zdiagnozuj przyczynę (błąd w kodzie vs błąd w teście vs brakująca zależność) i
   napraw najmniejszym patchem, z dowodem.
3. Udokumentuj dokładną procedurę odtworzenia tego stanu od zera (polecenia, wersje, ścieżka
   worktree) — to będzie szablon dla WSZYSTKICH kolejnych tematów P3 piszących kod Rust.
4. Sprawdź i zapisz: czy `cargo build`/`cargo test` da się uruchomić BEZ dostępu do internetu po
   pierwszym pobraniu zależności (ważne dla powtarzalności w izolowanych worktree kolejnych tematów).
5. Zero zmian w `gra/**` — to jest bariera krytyczna, naruszenie = natychmiastowy FAIL niezależnie od
   reszty pracy.

ANTY-HALUCYNACYJNA REGUŁA
Zakaz twierdzenia "build przechodzi" bez wklejonego surowego wyjścia `cargo build`/`cargo test`
(exit code, pełny log błędów jeśli są). Zakaz "naprawy" przez wyłączenie testu/modułu zamiast
naprawienia przyczyny — jeśli naprawa wymaga czegoś większego niż trywialny patch, zgłoś jako
BLOCK z opisem, nie obchodź.

BINARNE KRYTERIUM SUKCESU
`cargo build` i `cargo test` w `rust-port/engine/` na świeżym checkoucie `origin/rust-port/parity-v2`
kończą się exit code 0, z wklejonym surowym logiem obu komend jako dowód — w nowym pliku
`dyspozycje/rust-port/p3/P3-1-2-TOOLCHAIN.md`.

ALLOWLISTA
Zapis: `dyspozycje/rust-port/p3/P3-1-2-TOOLCHAIN.md` (NOWY plik, poza worktree),
`dyspozycje/autobot/runs/R-RUSTPORT-P3-1-2-TOOLCHAIN-Q1/**`. W IZOLOWANYM WORKTREE na gałęzi
`rust-port/parity-v2`: WYŁĄCZNIE `rust-port/engine/**` (minimalne patche naprawcze, jeśli build/test
nie przechodzi) — commit w worktree, NIE push bez wyraźnej zgody (patrz IZOLACJA). Zero zmian w
`gra/**` absolutnie. Zero zmian w `dyspozycje/rust-port/p1/**`, `p2/**`.

IZOLACJA
`isolation: worktree` dla roli Operator (potrzebuje realnego `cargo build`). Baza: jawnie
`origin/rust-port/parity-v2` (HEAD `9e33fc77`), NIE `origin/main`. Jeśli Operator wykona naprawczy
commit w worktree — NIE push do zdalnego repo w tym temacie; orkiestrator przejmuje push po PASS
Final Control (osobny krok integracji, zgodnie z regułą „Final Control nie integruje/nie pushuje").

PROCEDURA NAPRAWCZA PRZY FAIL
Jak w tematach P2. Po 5 rundach: LIMIT-5-EXCEEDED.

OGRANICZENIA WYJŚCIA
Raport max ok. 400 słów (plik docelowy może zawierać pełne logi build/test, które się liczą osobno).

FORMAT ODPOWIEDZI
STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
