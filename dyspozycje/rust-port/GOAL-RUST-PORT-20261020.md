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
| 1 | `R-RUSTPORT-P1-16B-AUDIT-CROSSCHECK-Q1` | P1.16b | 1/5 | `wf_8634e0dd-bf2` | DISPATCHED (w toku) | 2026-10-20 |
| 2 | `R-RUSTPORT-P1-14-GAMEPLAY-CATALOG-Q1` | P1.14 | 1/5 | `wf_682a6444-dd8` | DISPATCHED (w toku) | 2026-10-20 |
| 3 | `R-RUSTPORT-P1-1B-REMAINING-DIRS-Q1` | P1.1b | 1/5 | `wf_63a49349-573` | DISPATCHED (w toku) | 2026-10-20 |
| 4 | `R-RUSTPORT-P1-17B-UI-CLASSIFICATION-Q1` | P1.17b | 1/5 | `wf_967aff2b-a05` | DISPATCHED (w toku) | 2026-10-20 |
| 5 | `R-RUSTPORT-P1-4-EPOCH-SELECTION-Q1` | P1.4 | 1/5 | `wf_ce142234-50a` | DISPATCHED (w toku, przeglądarkowy) | 2026-10-20 |
| 6 | `R-RUSTPORT-P1-5-CIV-SELECTION-Q1` | P1.5 | 1/5 | `wf_384dd42c-162` | DISPATCHED (w toku, przeglądarkowy) | 2026-10-20 |

**Zasada stałej:** gdy temat się zamyka (PASS/FAIL ostateczny/DECISION_REQUIRED/LIMIT-5-EXCEEDED),
natychmiast otwieram kolejny w zwolnionym slocie — pula 6 ma być stale w pełni wykorzystana, bez
przestojów między falami. Historia zamkniętych tematów (P0, poprawka terenu, P1.1/1.2/1.10/1.11/1.12 —
wszystkie PASS) — patrz `LEDGER.md`.

**Decyzje właściciela po P0 (2026-10-20):**
- Pin webowy: zostajemy przy świeżym `main` = `edb8fb56` (nie wracamy do `69ccb145`) — delta zostanie w pełni skwalifikowana w P1.
- Archiwum OpenClaw przeanalizowane w pełni (temat zamknięty DECISION_REQUIRED, patrz AUDYT-ARCHIWUM-OPENCLAW-20261020.md).
- **P0.4/P0.5 zamknięte:** baza = `autobot/real24-staging`, gałąź = `rust-port/parity-v2` (założona).
- 4 patche archiwum = tylko inspiracja/UNKNOWN, nigdy kopiowane 1:1.

**Znalezisko P0 istotne dla P0.4/P1:** `autobot/real24-staging` i `hermes/handoff` mają 215 testów
`cargo test` w `rust-port/engine`, main tylko 95 — potwierdza rekomendację poprzedniego agenta, że
`real24-staging` jest lepszym rusztowaniem startowym niż samo `rust-port/engine` z main.

**Decyzje właściciela (2026-10-20), zamykają P0.4/P0.5:**
- 4 patche z `worktree-overlays/` (bridge save/load+replay+assets, hot-seat, population-matrix,
  entrypoint-script) = **tylko inspiracja, UNKNOWN/REFERENCE** — żaden kod nie jest przenoszony 1:1.
  Dotyczy to też wszystkich przyszłych klasyfikacji w P1.17/P2.
- Poprawka żywego buga terenu (Desert/Tundra) w `real24-staging` = **pierwszy mały temat Workflow teraz**,
  przed otwarciem P1.
- **Baza startowa (P0.4):** `autobot/real24-staging` (78d494c7), nie main-owy `rust-port/engine` — więcej
  gotowego, testowanego kodu domenowego (28 plików vs 18).
- **Gałąź (P0.5):** `rust-port/parity-v2`, forkowana z `autobot/real24-staging`.

P1 otwarte: fala 1 (6 równoległych tematów katalogowych: P1.1, P1.2, P1.10, P1.11, P1.12, P1.13) w
toku. Po ich zamknięciu — fala 2: P1.14 (katalog mechanizmów gameplayu, największy punkt), P1.17
(klasyfikacja REUSE/ADAPT/REPLACE istniejącego Rust, zależy od P1.1), P1.18 (hot-seat behavior matrix
na obecnym pinie — archiwum go nie pokrywa rzetelnie), i ewentualnie P1.3–P1.9/P1.15 (manualne przejścia
w żywym Chromium — wymagają innego trybu pracy niż czysty katalog odczytowy, do zaplanowania osobno).

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
