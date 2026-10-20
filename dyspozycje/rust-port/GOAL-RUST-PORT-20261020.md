# GOAL — Port "The Game" (web) → Rust/Tauri, pełny parytet 1:1

**Status dokumentu:** TRWAŁA KOTWICA CELU — aktualizowana po każdym cyklu Workflow (orkiestrator). Nie usuwać, nie przenosić bez jawnej decyzji właściciela.
**Utworzono:** 2026-10-20
**Pełny plan:** `dyspozycje/rust-port/PLAN-PORT-RUST-TAURI-20261020.md`
**Ledger rund:** `dyspozycje/rust-port/LEDGER.md`

## GOAL

Ukończyć funkcjonalny i wizualny port gry webowej `maciejsieracki/The-Game` (`gra/**`) do aplikacji Rust/Tauri, zachowując zachowanie 1:1 (UI, dane, reguły gameplayu, komunikaty). Wydajność jest ostatnią bramą (P10), nie substytutem parytetu (P8). Packaging/dostarczenie (P11) dopiero po osobnej, jawnej zgodzie właściciela.

## Decyzje przyjęte (§0 pełnego planu)

1. Baza startowa: `rust-port/engine` + gałęzie Tauri = **biblioteka referencyjna**, nie baza kontynuacji.
2. Lokalizacja: nowa gałąź w tym repo, `rust-port/parity-v2` (tematy robocze nadal pod `autobot/<ID>`).
3. Model routingu: Orkiestrator = Sonnet 5.5 (tylko orkiestruje). Operator/Evaluator = Haiku 5.5 medium. Final Control = Sonnet 5.5 medium. **Wszystkie trzy role wyłącznie przez `agent()` w skryptach Workflow — nigdy przez narzędzie `Agent`, nigdy wykonywane bezpośrednio przez orkiestratora.**

## Równoległość tematów — do 6 jednocześnie (§2b planu)

Do 6 niezależnych tematów naraz, każdy jako osobne wywołanie Workflow (osobny `runId`). Tematy
dotykające tych samych plików — zawsze sekwencyjnie, nigdy w tej samej fali. Ten kontener ma 4 rdzenie
(limit `agent()` wewnątrz jednego Workflow = 2), ale pipeline per temat jest sekwencyjny, więc 6 tematów
= najwyżej 6 jednoczesnych `agent()` w całej sesji.

## Status bieżący — aktywne tematy (max 6)

| # | Temat | Faza | Runda | runId Workflow | Status | Ostatnia aktualizacja |
|---|---|---|---|---|---|---|
| 1 | `R-RUSTPORT-P0-KALIBRACJA-Q1` | P0 | 1/5 | `wf_6ce4ed38-4e2` | DISPATCHED (w toku) | 2026-10-20 |
| 2 | — wolny slot — | | | | | |
| 3 | — wolny slot — | | | | | |
| 4 | — wolny slot — | | | | | |
| 5 | — wolny slot — | | | | | |
| 6 | — wolny slot — | | | | | |

Następny krok: po PASS tematu #1 — zamknąć fazę P0, otworzyć pilot P1.1–P1.2 jako temat #1 kolejnej
fazy; dodatkowe sloty (#2–#6) otwierać dopiero gdy jest więcej niż jeden niezależny, bezkolizyjny wątek
pracy gotowy do dispatchu (np. po P1 rozbitym na niezależne moduły bez współdzielonych plików).

## Automatyzacja (mechanizm autonomicznej kontynuacji)

1. **TaskCreate/TaskUpdate** — lista zadań bieżącej sesji.
2. **Scheduled task** — cykliczne wybudzenie tej sesji (patrz `dyspozycje/rust-port/LEDGER.md` dla trigger_id i interwału), prompt: sprawdzić wynik ostatniego Workflow, zintegrować PASS, otworzyć kolejny dispatch, zaktualizować ten plik.
3. **Ten plik** — trwała kotwica niezależna od sesji/scratchpadu.
4. **Pętla w skrypcie Workflow** — rundy Operator→Evaluator→(Obrona)→Final Control zapętlone wewnątrz jednego dispatchu, max 5 rund.

## Granice nienaruszalne (skrót, pełna lista: `docs/decyzje/R-PROC-AUTOBOT.md` §9)

- Zero zmian w `gra/**` w ramach tego projektu (web = referencja read-only).
- Zakaz `npm run build`/`npm run dev` w `gra/` bez scratch outDir.
- Zakaz `git add -A` / `git add .`.
- Zakaz fake DOM / placeholder / hard-coded podzbioru jako substytutu realnego systemu.
- Integracja wyłącznie allowlist-only, scoped diff od merge-base.
- `READY_FOR_DEPLOY`/push/deploy tylko po osobnej, jawnej zgodzie właściciela — nie dotyczy zwykłych commitów dokumentacji/postępu tego projektu na gałęzi roboczej.
