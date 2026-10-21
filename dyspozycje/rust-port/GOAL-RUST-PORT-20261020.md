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
| 1 | `R-RUSTPORT-P1-16C-KODU-A-Q1` | P1.16c (1/4) | 1/5 | `wf_176939fc-85d` | DISPATCHED (w toku) | 2026-10-21 |
| 2 | — | — | — | — | **WOLNY** | 2026-10-21 |
| 3 | — | — | — | — | **WOLNY** | 2026-10-21 |
| 4 | — | — | — | — | **WOLNY** | 2026-10-21 |
| 5 | — | — | — | — | **WOLNY** | 2026-10-21 |
| 6 | — | — | — | — | **WOLNY** | 2026-10-21 |

Zamknięte od ostatniej aktualizacji tej tabeli (patrz `LEDGER.md` po szczegóły): P1.13b (PASS, 15/15
`ProposalActionId` z dowodem), P1.16b (LIMIT-5-EXCEEDED → podzielone na 4 następców `P1.16c-*`,
pierwszy z nich — KODU-A — właśnie dispatchowany w slocie 1).

**P1.16c-PARYTET-AI, P1.16c-STOLICE, P1.16c-CIVPEDIA-OPISY czekają SEKWENCYJNIE** (ten sam plik
`P1-16-EDGE-CASES.md` co KODU-A) — nie dispatchować równolegle, dopiero po zamknięciu poprzedniego.

**Realna, niewyczerpana treść P1 poza łańcuchem P1.16c: BRAK.** Wszystkie pozostałe tematy
P1.1-P1.18 (poza wariantami 16c) mają PASS w LEDGER. 5 z 6 slotów jest teraz wolnych nie dlatego, że
czekają na decyzję właściciela (ta z STOLICE okazała się już rozstrzygnięta, patrz LEDGER
2026-10-21), ale dlatego że P1.16c jest z natury sekwencyjny (jeden plik) i nie ma już
niezależnego, gotowego, bezkolizyjnego materiału P1 do obsadzenia pozostałych slotów bez wchodzenia
w P1-GATE-SYNTHESIS (przedwczesne — P1.16c jeszcze nie zamknięte) albo we wczesny P2 (wymaga decyzji
właściciela o rozpoczęciu, patrz pytanie w czacie 2026-10-21).

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
