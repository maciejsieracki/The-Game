# R-WEB-AI-TRADE-ONESHOT-OVERPAY-LIMIT-Q1 — DODATEK (orkiestrator, 2026-11-12, runda 1/5)
BAZA: origin/main (b4853c8e6, po FALI 664). MODEL: Operator HAIKU, Obrona HAIKU, Evaluator/FC SONNET. Dispatch: 00-dispatch.md (gałąź claude/sprawdzenie-funkcjonalnosci-ek4ra0).
ALLOWLISTA: gra/src/game/diplomacy-proposals.ts, gra/src/main.ts (tylko selekcja/filtr/enqueue ofert AI→gracz), gra/tools/*-test.cjs, dyspozycje/autobot/runs/R-WEB-AI-TRADE-ONESHOT-OVERPAY-LIMIT-Q1/**. ZAKAZ: podgląd gracza (previewIncomingPlayerAccept), bramka gracz→AI, JSON balansu, WERSJE.md, rust-port.
UWAGA: równolegle W35 dodaje hooki testowe w main.ts/civ-test-hooks.ts (za ?civTest=1) — nie ruszaj ich; ewentualny konflikt rozwiąże integracja.
ŚRODOWISKO: worktree; w gra/ npm ci --ignore-scripts; ZAKAZ npm run build/dev; Chromium przez Vite HTTP (build poza repo). Nie integrujesz, nie pushujesz.
