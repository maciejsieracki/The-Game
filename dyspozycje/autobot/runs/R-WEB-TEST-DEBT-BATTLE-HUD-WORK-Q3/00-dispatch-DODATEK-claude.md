# R-WEB-TEST-DEBT-BATTLE-HUD-WORK-Q3 — DODATEK (orkiestrator, 2026-11-12, runda 1/5)
BAZA: origin/main (b0b0e3f86). MODEL: Operator HAIKU, Obrona HAIKU, Evaluator/FC SONNET. Dispatch: 00-dispatch.md (gałąź claude/sprawdzenie-funkcjonalnosci-ek4ra0).
ALLOWLISTA: WYŁĄCZNIE gra/tools/*-test.cjs (i pliki pomocnicze testów), dyspozycje/autobot/runs/R-WEB-TEST-DEBT-BATTLE-HUD-WORK-Q3/**. ZAKAZ zmian gra/src/**, JSON balansu, WERSJE.md, rust-port (realne defekty tylko opisz w raporcie). Testy bitew (battle-*) uruchamiaj POJEDYNCZO z limitem 280 s; równolegle chodzą W26/W27 w tych samych plikach źródłowych — nie dotykaj gra/src/battle.
ŚRODOWISKO: worktree; w gra/ npm ci --ignore-scripts; ZAKAZ npm run build/dev; Chromium przez Vite HTTP (build poza repo). Nie integrujesz, nie pushujesz.
