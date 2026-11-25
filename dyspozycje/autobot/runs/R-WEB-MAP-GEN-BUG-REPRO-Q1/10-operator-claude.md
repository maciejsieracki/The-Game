STATUS: PASS
DOMAIN: GAME
TEMAT: R-WEB-MAP-GEN-BUG-REPRO-Q1
GOAL: Minimalne odtworzenia 5 kandydatów BŁĄD-GRY z Q14-E2 i klasyfikacja (BŁĄD GRY / STARY-PIN / NIE ZMIERZONO), skutek dla gracza, propozycja naprawy. Bez zmian w gra/.
ZMIANY/COMMIT: dokument `dyspozycje/analizy/GENERATOR-MAP-BLEDY-REPRO-2026-11-25.md`, skrypty `dyspozycje/autobot/runs/R-WEB-MAP-GEN-BUG-REPRO-Q1/repro/` (bundle.cjs, r1, r3, r4, r5), ten raport. Zero zmian w gra/src i gra/data. Commit SHA: patrz sekcja DEPLOY-PUSH (czubek gałęzi operatora).
TESTY (surowe wyniki):
- r1 Ziemia 777: `offMaskLand":72,"byTerrain":{"laka":72}`; 68/72 przy brzegu maski. Seed 42: ten sam wynik (72).
- earth-template-test.cjs (seed 777): `FAIL: ziemia: 0 heksów lądu poza szablonem (found 72)`, `FAIL: Antarktyda ... (found 0 heksów przy r=85)`, 8 pass / 2 fail, 6m34s.
- r3 kontynenty 42: `limitMaxGap":7`, 8/20 mas złych, `worstGapAll":18`. Pangea 7: `badMasses":[{"size":7056,"worstGap":15}]`.
- r4 wyspy 108×74 seed 42: `openOceanLandSpecks":1`; kontynenty 168×120 seed 42: `openOceanLandSpecks":0`.
- r5 (5 ziaren, Mała): rivLow=602 > rivMed=571 (test :141 fails); desLow=504 > desMed=503 (test :142 fails); złoża monotoniczne. Metryka lasu błędna (0), NIE ZMIERZONO.
BLOKADY: brak blokady technicznej. NIE ZMIERZONO: „15 FAIL z 3” stranded-land (zbadano 2 z ~9 przypadków); przyczyny etapowe pkt 1 i 5; źródło AC-7; częstość oparta na N=2.
KLASYFIKACJA:
1. Łąki poza maską Ziemi — BŁĄD GRY, waga niska (reguła: earth-land-mask.ts:1–10, earth-template-test.cjs:51).
2. Antarktyda r=85 — STARY-PIN (asercja z e9c4c965d 2026-07-24; reguła C-MAP-Q3c earth-land-mask.ts:5, f776d4d60 2026-07-27). Pytanie wyglądu do właściciela (A-MAP-ZIEMIA-1 §15 niespójny z kodem).
3. Ujście rzeki > limit 7 — BŁĄD GRY, waga średnia–wysoka (gen-helpers.ts:5726–5727, reguła Maciej FALA 170).
4. Samotne lądy na oceanie — BŁĄD GRY, waga niska (gen-helpers.ts:5177–5179, postwarunek 0).
5. Monotonia gęstości — BŁĄD GRY wg AC-7 w teście, waga niska–średnia.
NASTĘPNY KROK: orkiestrator: tematy P1 (ujścia rzek), P2 (monotonia tierów), P3 (łąki/maska), P4 (samotne lądy), dług testowy Antarktydy; pytania ABC wyglądu (Antarktyda na Ziemi; tolerancja 42 dla Ziemi) — szczegóły w dokumencie.
DEPLOY/PUSH: NIE WYKONANO
UWAGI-DLA-ORKIESTRATORA: dispatch wskazywał pliki Q14 (`R-WEB-TEST-DEBT-Q14-E2-Q1/10-operator-claude.md`) — na origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0 nieosiągalne (git show zwrócił pusty wynik); nie użyto. gra/node_modules zainstalowano na czas testów (`npm ci --ignore-scripts`) i usunięto po pracy.
