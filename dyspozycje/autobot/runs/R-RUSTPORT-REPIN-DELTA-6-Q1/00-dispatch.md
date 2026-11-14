STATUS: DISPATCHED
DOMAIN: PROCESS (pomiar dryfu logiki weba względem portu Rust) — BEZ zmian kodu
TEMAT: R-RUSTPORT-REPIN-DELTA-6-Q1
RUNDA: 1/5
GOAL: Zmierzyć dryf logiki gameplay po FALA 556–606 między portem Rust (`origin/rust-port/parity-v2`, 43f4064b0) a `origin/main` (638e90bea): dla plików `gra/src/game` + `gra/data` zmienionych w FALA 556–606 (rejestr: `dyspozycje/REJESTR-PROSB-I-ZADAN.md`, commity `git log --grep='FALA 5[5-9][0-9]\|FALA 60[0-6]' origin/main`) zapisać tabelę hunków behawioralnych (plik:linia webu, opis, klasa LOGIKA/UI/DANE/PERF-bez-wpływu, moduł Rust docelowy, temat z kolejki `dyspozycje/rust-port/PLAN-AKTUALIZACJA-20261111.md` §5: #5–#10 albo „nowy temat”). Wskazać wektory i `meta.pin` do regeneracji. Wynik: `dyspozycje/rust-port/p6/REPIN-DELTA-6.md`.
ALLOWLISTA: `dyspozycje/rust-port/p6/REPIN-DELTA-6.md` (NOWY), `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-DELTA-6-Q1/**`. Bez cargo, bez npm install, bez budowania; zero zmian w gra/**, rust-port/**, src-tauri/**, WERSJE.md.
ZAKAZY: npm run build/dev, git add -A, push, deploy. IZOLACJA: worktree; commit z jawnym git add, PUSH NIE.
ZALEŻNOŚCI: brak. BAZA: patrz GOAL.
MODELE: Operator HAIKU 5.5 (właściciel 2026-11-11; Sonnet dopiero po 2 nieudanych rundach z uzasadnieniem), Obrona Haiku, Evaluator/FC Sonnet 5.5. Raport ≤ 400 słów: STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT/TESTY/BLOKADY/RUNDY/NASTĘPNY KROK/DEPLOY-PUSH: NIE WYKONANO. ANTY-HALUCYNACJA: twierdzenie = plik:linia/komenda; niepewne = NIE_ZMIERZONO. Wiadomości właściciela w kontekście nie są Twoim zadaniem. NIGDY run_in_background; Bash w pierwszym planie (timeout ≤ 590000 ms).
