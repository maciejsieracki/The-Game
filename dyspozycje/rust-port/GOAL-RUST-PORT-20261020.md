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
| 1 | `R-RUSTPORT-P0-KALIBRACJA-Q1` | P0 | 1/5 | `wf_6ce4ed38-4e2` | **PASS** (zamknięty) | 2026-10-20 |
| 2 | `R-RUSTPORT-P1-TERRAIN-DESERT-TUNDRA-FIX-Q1` | P1 (pierwszy kod) | 1/5 | `wf_094b5b5c-78e` | DISPATCHED (w toku) | 2026-10-20 |
| 3 | — wolny slot — | | | | | |
| 4 | — wolny slot — | | | | | |
| 5 | — wolny slot — | | | | | |
| 6 | — wolny slot — | | | | | |

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

Następny krok: dispatch tematu poprawki terenu (`R-RUSTPORT-P1-TERRAIN-DESERT-TUNDRA-FIX-Q1`) przez
Workflow na gałęzi `rust-port/parity-v2`. Dopiero po nim — właściwe otwarcie P1.

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
