# R-WEB-FORTIFICATIONS-OLD-SAVE-QUEUE-CLEANUP-Q1 — DODATEK (orkiestrator, 2026-11-12, runda 1/5)
BAZA: origin/main (44af89169). MODEL: Operator HAIKU, Obrona HAIKU, Evaluator/FC SONNET. Dispatch: 00-dispatch.md (gałąź claude/sprawdzenie-funkcjonalnosci-ek4ra0).
ALLOWLISTA: gra/src/game/building-upgrades.ts, production.ts (czyszczenie kolejki), gra/src/main.ts (wpięcie migracji przy wczytaniu), gra/src/game/save* jeśli konieczne, gra/tools/*-test.cjs, dyspozycje/autobot/runs/R-WEB-FORTIFICATIONS-OLD-SAVE-QUEUE-CLEANUP-Q1/**. Zakaz: JSON balansu/kosztów, format zapisu (tylko migracja przy wczytaniu), WERSJE.md, rust-port.
ŚRODOWISKO: worktree; w gra/ npm ci --ignore-scripts; ZAKAZ npm run build/dev; Chromium przez Vite HTTP (build poza repo). Nie integrujesz, nie pushujesz.
