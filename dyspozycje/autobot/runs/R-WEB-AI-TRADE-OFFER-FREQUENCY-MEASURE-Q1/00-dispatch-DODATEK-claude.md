# R-WEB-AI-TRADE-OFFER-FREQUENCY-MEASURE-Q1 — DODATEK (orkiestrator, 2026-11-12, runda 1/5)
BAZA: origin/main (ef27be007). MODEL: Operator HAIKU, Obrona HAIKU, Evaluator/FC SONNET. Dispatch: 00-dispatch.md (gałąź claude/sprawdzenie-funkcjonalnosci-ek4ra0).
ALLOWLISTA: WYŁĄCZNIE nowy gra/tools/measure-ai-trade-offer-frequency.cjs (+ ewentualny entry .ts/.html w gra/tools) i dyspozycje/autobot/runs/R-WEB-AI-TRADE-OFFER-FREQUENCY-MEASURE-Q1/**. ZAKAZ zmian gra/src/**, JSON balansu, WERSJE.md, rust-port. Wzorzec: ai-trade-wiring-e2e-live-test.cjs (hak testowy, bundle vite poza repo).
ŚRODOWISKO: worktree; w gra/ npm ci --ignore-scripts; ZAKAZ npm run build/dev; długie przebiegi z limitem 590 s i raportem częściowym. Nie integrujesz, nie pushujesz.
