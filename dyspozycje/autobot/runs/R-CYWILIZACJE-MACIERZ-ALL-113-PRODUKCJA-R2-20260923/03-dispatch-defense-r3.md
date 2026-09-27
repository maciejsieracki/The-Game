# Conditional Defense dispatch — produkcja r3

TEMAT: R-CYWILIZACJE-MACIERZ-ALL-113-PRODUKCJA-R2-20260923
RUNDA: 3/5
DATA: 2026-09-24
DOMAIN: GAME
ŚCIEŻKA: B (Kanban prompt + live runtime evidence)
MODEL + EFFORT: Defense `gpt-5.6-luna` / `max`; provider `openai-codex`
PARENT: `t_a48da8d3`, run `1203`, terminal Evaluator `FAIL`

## WYZWALACZ

Terminalny niezależny Evaluator zakończył się `FAIL` z jednym konkretnym, ponumerowanym zarzutem: istniejący live gate nie uruchamia actual AI `availableProduction` callbacku przez `main.ts`/`runAiPhase`. Reguła procesu wymaga warunkowej Obrony przed Final Control.

## GOAL

Dostarczyć niezależny dowód rzeczywistego uruchomienia callbacku AI `availableProduction` w produkcyjnym `main.ts`/`runAiPhase`, bez helpera-probe, injected resolvera, static token search i bez zmian w kodzie produktu.

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ

- PRAWDA: realny browser/runtime wywoła `main.ts`/`runAiPhase` → callback `availableProduction`; dowód pokaże `civKey`, matrix parameter i wynik; neutral/non-zero; istniejące 112/112 i pozostałe bramki pozostaną zielone; raport `03-defense.md` i machine-readable evidence powstaną; terminalny Kanban event zostanie zapisany.
- FAŁSZ: dowód pozostaje helper-only, callback nie jest wykonany, harness wymaga nieautoryzowanego product patchu albo wynik jest nieweryfikowalny.

## ALLOWLISTA

- `gra/tools/civ-matrix-production-runtime-live-test.cjs` — minimalna korekta testu tylko do actual callback path,
- `gra/tools/civ-matrix-production-consumer-evidence.md`,
- `dyspozycje/autobot/runs/R-CYWILIZACJE-MACIERZ-ALL-113-PRODUKCJA-R2-20260923/03-defense.md`,
- `03-defense-evidence.json`,
- `03-transition-receipt-defense.json`.

Zakazane: `gra/src/**`, `gra/data/**`, `ai_*`, save schema, główne repo, commit/push/merge/deploy, reset/clean/stash/checkout.

## IZOLACJA

Istniejący, jawnie wskazany dirty worktree: `/home/ubuntu/projects/The-Game/.worktrees/civ-matrix-all-produkcja-r2-20260923`; branch `hermes/R-CYWILIZACJE-MACIERZ-ALL-113-PRODUKCJA-R2-20260923`; baza `origin/main=a8c9cf6c181f688201dd45e6a5871da1b0eb1301`. Obrona jest sekwencyjna po terminalnym Evaluatorze i jest jedynym writerem w tym worktree.

## REGUŁA PRZECIW SAMOOSZUKIWANIU

Nie uznawać wywołania `probeOwner`, `probeAutoBuildForOwner`, `runWorldEndTurn`, statycznego token search, fixture ani ręcznego resolvera za dowód callbacku. Trace musi pochodzić z rzeczywistego `main.ts`/`runAiPhase` runtime. Nie usuwać istniejących asercji tylko po to, aby utrzymać 112/112.

## PROCEDURA NAPRAWCZA PRZY FAIL

Jeżeli callback nadal nie jest wykonywany, zakończyć `FAIL`/`INFRA` z numerowanym dowodem. Nie przechodzić do Final Control i nie tworzyć integracji. Jeżeli evidence PASS, następna faza to niezależny Final Control na tym samym worktree i raporcie.

## GRANICE

Obrona nie integruje, nie pushuje, nie merguje, nie deployuje. Nie zmienia danych macierzy ani `ai_*`. Zachowuje parity player/AI/city-state i zero double count.

## OBIEG

Operator → Evaluator → **Conditional Defense** → Final Control → integracja orkiestratora → osobna zgoda deploy/push.
