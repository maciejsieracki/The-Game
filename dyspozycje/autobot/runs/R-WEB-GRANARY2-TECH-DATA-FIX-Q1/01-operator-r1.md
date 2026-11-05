STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-GRANARY2-TECH-DATA-FIX-Q1
GOAL: Spichlerz II ma realną technologię w bramce badań (zamiast nieistniejącego "Warzelnia soli"), jest budowalny przy epoce 2 + Spichlerzu I + Garncarstwie + soli + ceramice; strażnik danych łapie przyszłe techUnlock/Tech spoza tech.json. Bez zmiany kosztów budowy.
ZMIANY/COMMIT: baza origin/main 80919e2ae (detached). Allowlista: gra/data/buildings.json (spichlerz_ii: techUnlock "Warzelnia soli" -> "Garncarstwo"; wymagania i uwagi zaktualizowane), gra/src/game/building-resource-gate.ts (spichlerz_ii: ['Sól'] -> ['Ceramika','Sól']), gra/tools/granary2-tech-data-guard-test.cjs (NOWY), gra/tools/deposit-building-gate-test.cjs (asercje runtime spichlerz_ii: wymaga Ceramiki i Soli), dyspozycje/autobot/runs/R-WEB-GRANARY2-TECH-DATA-FIX-Q1/01-operator-r1.md. SHA: patrz commit w tym worktree (git log -1).
DIAGNOZA (ZMIERZONA): "Warzelnia soli" to ulepszenie terenu odblokowywane przez Garncarstwo (tech.json, kolumna "Odblokowuje ulepszenie terenu"), NIE technologia. Żadna technologia nie ma Spichlerza II w "Odblokowuje budynek". Skan buildings.json i units.json: jedyny techUnlock/Tech spoza tech.json to spichlerz_ii. production.ts availableProduction (~973) i eraBuildingCatalog (~2395) odrzucają budynek, gdy tech nie jest w unlockedTechs, więc Spichlerz II był niebudowalny dla gracza i AI.
TESTY:
- PRZED (RED): granary2-tech-data-guard-test PASS 8 / FAIL 6 (guard: "Warzelnia soli"; katalog locked, missingTech=Warzelnia soli).
- PO (GREEN): granary2-tech-data-guard-test PASS 14 / FAIL 0.
- Mutacja: usunięcie Ceramika z bramki -> FAIL "niebudowalny bez Ceramiki" (łapie regresję). Przywrócone.
- tsc --noEmit: EXIT 0.
- Regresje (wszystkie EXIT 0 poza ai-test): spichlerz-cap-citypanel-wiring 12/0; spichlerz-deficyt-scalenie 58/0; spichlerz-drain-keys 44/0; spichlerz-drain-pipeline 21/0; spichlerz-hud-params-parity 66/0; spichlerz-panel-food-parity 11/0; spichlerz-widocznosc 45/0; spichlerz-wzrost 14/0; popcap-spichlerz2-akwedukt20 46/0; building-resource-visibility 15/0; cities-buildings-production-owner-contract ALL GREEN; production-overflow 213/0; ai-production-priority 9/0; pr141-ai-production-behavior 23/0; pr141-matrix-only-production 96/0; map-deposits-era 16/0; deposit-building-gate 50/0 (przed zmianą 48/1: asercja zakładała bramkę tylko-Sól); ai-test 274 pass / 20 fail = bazowe 274/20 (bez zmian).
- NIE ZMIERZONO w tej rundzie: panel Chromium (krok 3: zrzut chipu "Wymagane badania") oraz LONGRUN/ARMYPANEL (poza zakresem rundy 1). Brak npm run build/dev (zakaz).
BLOKADY:
1. DECYZJA WŁAŚCICIELA: bramka Ceramika dla Spichlerza II dodana na podstawie zasady "ceramika + sól". Spichlerz I nadal NIE ma bramki Ceramiki przy budowie (PYTANIE-84-U-24, drain po postawieniu). Opcja A (wdrożona): Ceramika + Sól przy budowie II. Opcja B: jak Spichlerz I (tylko Sól przy budowie, Ceramika w drainie). Do potwierdzenia.
2. Epoka 2 jako bramka: epokaWejscia 2 zostaje (test pinuje: w epoce 1 niebudowalny). Domyślnie technologia Garncarstwo (parytet ze Spichlerzem I, bez fikcyjnej technologii). Alternatywy z epoki Brąz, jeśli właściciel chce innego warunku: Pismo (prereq Garncarstwo + Wymiana, koszt 180), Religia (prereq Garncarstwo + Mistycyzm, koszt 192).
3. Stare zapisy: bramka działa tylko przy kolejkowaniu nowych budów; zbudowany Spichlerz II nie jest usuwany. NIE ZMIERZONO testem na zapisie z hookiem.
NASTĘPNY KROK: Evaluator (przegląd diffu); dowód UI w Chromium (krok 3) po decyzji właściciela o bramce Ceramiki.
RUNDY: 1/5
DEPLOY/PUSH: NIE WYKONANO
