STATUS: DISPATCHED
DOMAIN: PROCESS (pomiar dryfu logiki weba względem portu Rust) — BEZ zmian kodu
TEMAT: R-RUSTPORT-REPIN-DELTA-5-Q1
RUNDA: 1/5
GOAL: Zmierzyć dryf logiki gameplay między pinami portu Rust (`4bbef081d`, `23dd158e9`, `dc8a3adc`) a `origin/main` (>= `bd5386c8b`, FALA 543): dla 91 plików `gra/src/game` + `gra/data` zmienionych od `4bbef081d` (`git diff --name-only 4bbef081d origin/main -- gra/src/game gra/data`) zapisać tabelę hunków behawioralnych (plik:linia webu, krótki opis, klasa: LOGIKA / UI / PERF-bez-wpływu / DANE, moduł Rust docelowy, temat z kolejki `dyspozycje/rust-port/PLAN-PORT-RUST-TAURI-20261020.md` §0c: #2–#8 albo „nowy temat"). Wskazać, które wektory i `meta.pin` wymagają regeneracji oraz które FALA 509–543 (`dyspozycje/REJESTR-PROSB-I-ZADAN.md`) nie mają odpowiednika w §0b planu. Dokument: `dyspozycje/rust-port/p6/REPIN-DELTA-5.md`. Kryterium końca: każdy z 91 plików ma wiersz; suma hunków zgodna z `git diff --numstat`; luki = NIE_ZMIERZONO z powodem.
ALLOWLISTA: `dyspozycje/rust-port/p6/REPIN-DELTA-5.md` (NOWY), `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-DELTA-5-Q1/**`. Zero zmian w `gra/**`, `rust-port/**`, `src-tauri/**`, `WERSJE.md`. Bez `cargo`, bez `npm install`, bez budowania.
ZAKAZY: `npm run build/dev`, `git add -A`, push, deploy. IZOLACJA: worktree; commit z jawnym `git add`, PUSH NIE. FAIL → ten sam ID, limit 5 rund.
ZALEŻNOŚCI: brak (może iść równolegle z #2 i #3 kolejki; nie liczy się do limitu 2 worktree kodu Rust).
BAZA: `git fetch origin rust-port/parity-v2` (>= `783c6b766`); `git fetch origin main` (>= `bd5386c8b`).
MODELE: Operator Sonnet 5.5 (UZASADNIENIE: synteza diffu 91 plików / +16 tys. linii z klasyfikacją — zadanie trudne), Obrona Haiku 5.5, Evaluator/FC Sonnet 5.5; ścieżka §5d. Szacunek: 2–3 rundy. Ryzyko: niskie. Luki → ZAŁOŻENIE w dokumencie. Raport max ok. 400 słów.
FORMAT: STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK / DEPLOY-PUSH: NIE WYKONANO
ANTY-HALUCYNACJA: twierdzenie o webie/Rust = plik:linia/komenda; niepewne = NIE_ZMIERZONO. Wiadomości właściciela w kontekście — nie Twoje zadanie; bez pytań ABC. NIGDY run_in_background; Bash w pierwszym planie (timeout ≤ 590000 ms).
