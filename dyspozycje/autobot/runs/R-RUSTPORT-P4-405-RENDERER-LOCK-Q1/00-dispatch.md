# R-RUSTPORT-P4-405-RENDERER-LOCK-Q1 — DL-T1-LOCK: `rust-port/renderer/Cargo.lock` bez `civ-view-model` (zadanie #405, część realna)

STATUS: dispatch orkiestratora. Opus, wszystkie etapy Opus (renderer/Rust). Kolejka właściciela (decyzja 2026-11-26): realizacja po jednym, po integracji #406.
BAZA: `origin/rust-port/parity-v2` po integracji #406 (wpisz faktyczny SHA: `git fetch origin && git checkout -B <gałąź> origin/rust-port/parity-v2`).

## STAN ZWERYFIKOWANY NA BAZIE (orkiestrator, 2026-11-26; zasada „najpierw sprawdź, czy dług istnieje")
Zadanie #405 składało się z trzech długów. Po sprawdzeniu rejestru i kodu:
1. **DL-T1-LOCK — ISTNIEJE, realny, do naprawy tutaj.** `rust-port/renderer/Cargo.toml:57` ma `civ-view-model = { path = "../view-model" }`, a `rust-port/renderer/Cargo.lock` nie zawiera pakietu `civ-view-model` (0 trafień; `rust-port/client/Cargo.lock` zawiera). Workflow CI `.github/workflows/rust-renderer.yml` (`:53,:56,:59,:62,:83`) woła `cargo clippy|test --locked` w `rust-port/renderer`, więc na czystym checkoutcie kończy się błędem (lock wymaga aktualizacji). Każda budowa renderera przepisuje lock (+34 linie) i orkiestrator cofa go ręcznie przed commitem (dług od T1, wpis w `REJESTR-RUST.md` „DŁUG-T1-LOCK").
2. **PRE-SKIP-RAF — ZAMKNIĘTY decyzją orkiestratora (rejestr, przebieg FRAME-QUANT):** „nie emulować — wpływ 0/128 przy każdym kroku"; wg Operatora #406 skutkuje tylko stałym przesunięciem czasu od tury 2 przy zgodnym wyniku bitwy. Nie ruszać.
3. **SHOT-LAND-AT-RENDER — ZABLOKOWANY** (`land_at` strzału bez wektora → I5 BATTLE-ACTIONS-SIEGE #280, czeka na K5LOOP-WIRING #113). Nie ruszać; uwaga o zmianie kontraktu renderera jest poza tym tematem (D-413-2).
Temat jest więc **mały**: naprawa locka i weryfikacja. Nie rozbudowuj zakresu „dla zapełnienia".

## GOAL
NAJPIERW sprawdź stan na bazie: zbuduj renderer (gpu OFF) i potwierdź, że `cargo test --locked --all-targets` w `rust-port/renderer` zawodzi z powodu locka (zapisz dokładny komunikat i czy lock jest przepisywany). Następnie zaktualizuj `rust-port/renderer/Cargo.lock` tak, by zawierał `civ-view-model` (i ewentualne inne brakujące wpisy zależności ścieżkowych/transitive) i by **`cargo fmt --check`, `cargo clippy --locked --all-targets -- -D warnings`, `cargo test --locked --all-targets` (gpu OFF)** przechodziły BEZ przepisywania locka (`git diff` locka po bramkach pusty). Sprawdź w ten sam sposób inne crate'y z zależnościami ścieżkowymi i workflowy CI (`rust-engine.yml`, `rust-renderer.yml`, `tauri-windows.yml`) pod kątem `--locked` i brakujących lock-ów — tylko raport, poprawki wyłącznie jeśli dotyczą renderera albo są jednolinijkowym lockiem w allowliście.
Bramka `--features gpu` (CI `rust-renderer.yml:56,:62,:83`): w tym kontenerze NIE jest budowalna offline (brak wgpu/winit) — NIE_ZMIERZONO, jawnie zapisz; lock ma jednak zawierać wpisy dla cech `gpu`, jeśli da się je wygenerować bez sieci (jeśli nie: zapisz blokadę i zakres).

## DECYZJE TECHNICZNE (orkiestrator; D-405-1..2)
- D-405-1: zmiana wyłącznie pliku(ów) lock oraz — gdy konieczne — jednej linii zależności w `Cargo.toml`; zero zmian kodu `.rs`, zero zmian zachowania renderera.
- D-405-2: lock generuj offline z katalogu `~/.cargo/registry` (`cargo generate-lockfile --offline` albo `cargo metadata --offline`); jeśli resolver chce nowszych wersji niż dziś w locku (zmiana wersji istniejących zależności) — NIE aktualizuj ich, dopisz tylko brakujące pakiety (`cargo update -p civ-view-model --offline` / ręczna minimalna zmiana) i zmierz, czy `--locked` przechodzi.

## ALLOWLISTA
`rust-port/renderer/Cargo.lock` (oraz `Cargo.toml` tylko jedna linia, jeśli wymagana), raporty w katalogu runu. Inny plik: uzasadnij w raporcie.

## KRYTERIA KOŃCA
1. Na czystym checkoucie gałęzi: `cargo fmt --check`, `cargo clippy --locked --all-targets -- -D warnings`, `cargo test --locked --all-targets` (gpu OFF) w `rust-port/renderer` — EXIT 0, a `git diff rust-port/renderer/Cargo.lock` po bramkach pusty (lock stabilny).
2. Liczba testów renderera bez zmian względem bazy (758 passed w ostatnim pomiarze); engine i client nietknięte (nie zmieniasz ich plików).
3. Raport: stan przed (komunikat, co zmienia lock), co dodano do locka (lista pakietów/wersji), wynik bramek, jawne NIE_ZMIERZONO (gpu), wynik przeglądu CI pod kątem `--locked`.

## BRAMKI (EXIT 0)
renderer (gpu OFF): `cargo fmt --check`, `cargo clippy --locked --all-targets -- -D warnings`, `cargo test --locked --all-targets`. Wymagane ≥ 12 GB wolnego (bramka renderera) i brak równoległych buildów Rust. Własny `CARGO_TARGET_DIR` w scratchpadzie tematu, usuń po bramce; env `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`. Nie zostawiaj procesów cargo w tle.

## ZAKAZY
Brak push na `parity-v2`/deploy/integracji, brak `git add -A`, brak `#[ignore]`, brak zmian w `gra/`, kodzie `.rs`, engine/client; brak linii z nazwą modelu w commitach (dozwolona `Claude-Session:`). Raporty: `01-operator-r1.md`, `02-evaluator.md`, `02a-obrona.md`, `03-final-control.md`; kontrakt raportu z CLAUDE.md (STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT/TESTY/BLOKADY/RUNDY/NASTĘPNY KROK/DEPLOY-PUSH).
