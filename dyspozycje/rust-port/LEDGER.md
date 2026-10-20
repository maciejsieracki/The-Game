# Ledger — Port Rust/Tauri (`rust-port/parity-v2`)

Chronologiczny zapis dispatchu/rund/wyników. Wpis dodawany przez orkiestratora
zaraz po zajściu zdarzenia (nie rekonstruowany później z pamięci — §2a planu).

## Scheduled task (autonomiczna kontynuacja)

| trigger_id | cron | cel |
|---|---|---|
| `trig_015Z1Rtdm2U13oqPMvAmtQht` | `46 */4 * * *` (co 4h) | cykliczne wybudzenie tej sesji: sprawdź wynik ostatniego Workflow, integruj PASS, otwórz kolejny dispatch, zaktualizuj GOAL-RUST-PORT-20261020.md. Założony 2026-10-20. |

## Rundy

| Data | Temat | Runda | Rola→Model/Effort | STATUS | Notatka |
|---|---|---|---|---|---|
| 2026-10-20 | — | — | — | PROJECT-INIT | Założono plan, GOAL, ledger, taski. Dispatch P0 w przygotowaniu. |
| 2026-10-20 | R-RUSTPORT-P0-KALIBRACJA-Q1 | 1 | Workflow (pętla do 5 rund) | DISPATCHED | Workflow uruchomiony w tle, run ID `wf_6ce4ed38-4e2`. Operator/Evaluator/Final Control jako `agent()` wewnątrz jednego skryptu, z pętlą rund (max 5) wbudowaną w skrypt. Czeka na wynik. |
| 2026-10-20 | R-RUSTPORT-P0-KALIBRACJA-Q1 | 1 | Operator→Evaluator(2 zarzuty)→Obrona(2×PRZYJMUJE)→Final Control(2×ODDAL) | **PASS** | Pin main = `edb8fb56` (2026-10-17T14:16Z). Manifest `gra/**` 2115 plików zgodny. 4 gałęzie Rust: main 95 testów, `autobot/real24-staging` 215, `hermes/handoff` 215, `hermes/RECOVERY-R2` 107 — wszystkie `cargo build`/`test` EXIT 0. **Znalezisko:** real24-staging/handoff mają 2x więcej testów niż main — potwierdza rekomendację poprzedniego agenta o bazie startowej. `src-tauri` nie kompiluje się w tym kontenerze (brak GTK3/gdk-3.0) — blokada środowiskowa do P2/P7, nie kodu. Dowody: `dyspozycje/rust-port/manifest-gra-edb8fb56.sha256.tsv`, `dyspozycje/autobot/runs/R-RUSTPORT-P0-KALIBRACJA-Q1/logi-rerun/` (14 logów+SHA256SUMS), `03-final-control.md`. |
| 2026-10-20 | — | — | — | OWNER-INPUT | Właściciel przekazał rekomendacje poprzedniego (OpenClaw) agenta: baza = `autobot/real24-staging` jako rusztowanie (selektywny port, nowy czysty branch, nie scalanie 3 brudnych worktree); zatwierdzony pin `69ccb145` vs obecny main `edb8fb56` (59 commitów różnicy) — **rozstrzygnięte przez właściciela przez AskUserQuestion: zostajemy przy świeżym main `edb8fb56`**, delta kwalifikowana w P1; lokalizacja repo — zgodna z już przyjętą decyzją; pierwszy zakres — pionowy wycinek (miasto+jednostka, deterministyczny, przez UI→bridge→engine, kryteria na efekt stanu + dokładnie jedno wykonanie) zanotowany jako wytyczna dla przyszłego P2→P6, nie do zastosowania teraz. |
| 2026-10-20 | — | — | — | OWNER-INSTRUCTION | Właściciel: przed otwarciem P1 dociągnąć pełną analizę całego materiału archiwum OpenClaw (ledger 275KB, evidence/ 594 plików, reports/ 7 nieprzeczytanych, dispatch/, orchestration/, process/, memory/, worktree-overlays/ patche, §9 planu orchestracji, inwentarz dossier 109k linii) przez Workflow — szukać znalezisk sugerujących, że coś jest bardziej dokończone niż sądzimy. Dopiero po tym otworzyć P1. |
