# R-WEB-SIEGE-AUTO-BREACH-ATTACKERS-ENTER-BEHIND-WALL-Q1 (GAME)
Decyzja właściciela 2026-11-12: NAPRAW B4b. W AUTO oblężenia po wyłomie atakujący zatrzymują się przy murze zamiast wejść ZA mur (jak w trybie ręcznym).
Tło: gra/tools/siege-auto-breach-replay-e2e-live-test.cjs grupa b: B4b zgłoszony jako ZNANY-DEFEKT (exit 5; SABR_SKIP_KNOWN=1 daje exit 0), asercja nie osłabiona; baza: FALA 653 (W16 replay).
KRYTERIA: (1) po naprawie B4b zielone bez SABR_SKIP_KNOWN, test live PASS (SABR_ONLY=r,f,m,b); (2) parytet AUTO=SKIP: battle-skip-equals-auto-resolve-test, battle-skip-siege-parity, siege-parity; (3) mutacja czerwieni; (4) bez zmiany balansu/statów; (5) tsc + 5 bramek referencyjnych.
ALLOWLISTA: gra/src/battle/battleScene.ts, autoBatchPhase.ts i powiązane, testy w gra/tools, raport.
UWAGA: battle-skip-equals-auto-resolve-test uruchamiać pojedynczo (limit 280 s).
