# R-WEB-LIVE-VERIFY-WAVE-650-664-Q1 — DODATEK (orkiestrator, 2026-11-12, runda 1/5)
BAZA: origin/main (ef27be007). MODEL: Operator HAIKU, Obrona HAIKU, Evaluator/FC SONNET. Dispatch: 00-dispatch.md (gałąź claude/sprawdzenie-funkcjonalnosci-ek4ra0).
ALLOWLISTA: WYŁĄCZNIE nowe pliki gra/tools/live-verify-wave-650-664-*.cjs i dyspozycje/autobot/runs/R-WEB-LIVE-VERIFY-WAVE-650-664-Q1/** (evidence/). ZAKAZ zmian gra/src/**, JSON, WERSJE.md, rust-port.
ŚRODOWISKO: worktree; w gra/ npm ci --ignore-scripts; ZAKAZ npm run build/dev; build vite poza repo (--outDir /tmp/...) i Chromium przez HTTP. Wzorce: gra/tools/live-verify-administrator-panel.cjs, battle-save-disabled-live-test.cjs, siege-storm-needs-machines-test.cjs. Nie integrujesz, nie pushujesz.

## DODATEK (runda 2/5, 2026-11-12) — domknięcie punktu 4 (W32)
BAZA: kandydat d1a3edc2a (web-wip/R-WEB-LIVE-VERIFY-WAVE-650-664-Q1) + merge origin/main (b4853c8e6 — zawiera już FALĘ 664 = kod W32). MODEL: Operator HAIKU, Obrona HAIKU.
ZADANIE (tylko punkt 4): live w Chromium — wczytanie zapisu z kolejką Palisada+Mur kamienny+Mur ceglany (zbuduj fixturę starego zapisu w teście/JSON) pokazuje komunikat czyszczenia kolejki (W32) dokładnie raz, w kolejce zostaje najwyższy etap; zrzut obejrzany; surowy wynik. Punkty 1,2,3,5 NIE powtarzaj (PASS w r1). Bez zmian gra/src.
KRYTERIA: PASS/FAIL z dowodem; mutacja (komunikat/wpięcie wyłączone → test czerwony) jeśli się da bez zmiany repo (kopia pliku); tsc nie wymagany (brak zmian kodu).
