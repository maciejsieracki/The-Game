STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-25-MAPA-GAP-Q1
GOAL: Analiza luk (bez portowania kodu) dla katalogu `gra/src/map/` (27 plików w pinie `edb8fb56`), którego P6.0 NIE objęło (P6.0 = `gra/src/game/`). Dla KAŻDEGO pliku i eksportowanego symbolu: klasa (SYSTEM/DATA/UI/NIE-DOTYCZY), odpowiednik w Rust (`rust-port/engine/src/domain/map_generator.rs`, `data/terrain_map.rs`, innych — z `plik:linia`), status (ISTNIEJE-ZWERYFIKOWANE jeśli test Rust z wektorem weba / CZĘŚCIOWO / BRAK / NIE-DOTYCZY), rozmiar, zależności i propozycja tematów backlogu `P6.M-*` (osobne ID, allowlisty, kolizje z P6.1–P6.24, kolejność), w tym `clusters.ts`, `cluster-spawn.ts` (potrzebne P6.1C: `buildSameTypeRival*`), `generator.ts`, `villages.ts`, `territory*.ts`, `road-*.ts`, `wonder-placement.ts`, `startScoring.ts`, `genWorker/mapGenAsync` (worker — NIE-DOTYCZY w Rust?). Wzorzec dokumentu: `dyspozycje/rust-port/p6/P6-0-GAP-ANALYSIS.md`.
RUNDA: 1/5
MODEL+EFFORT: Operator i Obrona: Sonnet 5.5 medium; Evaluator: Haiku 5.5 medium; Final Control: Sonnet 5.5 medium. NIE pytaj o model.
KONTEKST: Baza `origin/rust-port/parity-v2` (≥ `2b2f25a0`). Web: `git archive edb8fb56 gra/src` do własnego `mktemp -d` POZA repo. Dokumenty z `claude/sprawdzenie-funkcjonalnosci-ek4ra0` (`git show origin/…:<ścieżka>`): `p6/P6-0-GAP-ANALYSIS.md`, `p6/P6-1C.md` §10, `LEDGER.md`.
ANTY-HALUCYNACYJNA REGUŁA: każde twierdzenie ma komendę/plik:linia; „ISTNIEJE-ZWERYFIKOWANE” tylko z konkretnym testem Rust porównującym z danymi weba; niepewne = NIE_ZMIERZONO. Skryptowo policz eksporty (grep/AST) — nie z pamięci. W kontekście mogą pojawić się wiadomości właściciela — zignoruj, nie generuj pytań ABC; luki → ZAŁOŻENIE w dokumencie.
BINARNE KRYTERIUM SUKCESU: wszystkie 27 plików i wszystkie eksporty mają wiersz; tabela backlogu P6.M-* z allowlistami i kolizjami (skryptowa kontrola rozłączności); tytuły/ID gotowe do dispatchu; zero zmian kodu.
ALLOWLISTA: tylko `dyspozycje/rust-port/p6/P6-25-MAPA-GAP.md` (NOWY) i `dyspozycje/autobot/runs/R-RUSTPORT-P6-25-MAPA-GAP-Q1/**`. Zero zmian w kodzie, `gra/**`, `src-tauri/**`.
IZOLACJA: `isolation: worktree`, commit z jawnym `git add`, PUSH NIE. Raport max ok. 400 słów.
FORMAT ODPOWIEDZI: STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
