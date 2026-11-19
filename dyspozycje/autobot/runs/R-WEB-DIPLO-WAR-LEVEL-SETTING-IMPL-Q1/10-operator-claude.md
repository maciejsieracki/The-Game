# R-WEB-DIPLO-WAR-LEVEL-SETTING-IMPL-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-WAR-LEVEL-SETTING-IMPL-Q1
GOAL: ustawienie nowej gry „Dyplomacja i wojna” (Łatwa / Normalna / Trudna): kary ×1/×2/×3, bonusy ×1/÷2/÷3; ŁATWA = dziś (bit-w-bit).
ZMIANY-COMMIT: patrz SHA w polu `sha` wyniku. Nowe: `gra/src/game/diplomacy-war-level.ts` (helper, zbiory kluczy), `gra/tools/diplomacy-war-level-test.cjs`. Zmienione (allowlista): `gra/src/game/diplomacy.ts`, `diplomacy-harder.ts`, `diplomacy-penalty-preview.ts`, `diplomacy-value-catalog.ts`, `diplomacy-tick-war-brake.ts`, `diplomacy-border-march.ts`, `ai-ai-treaty-evaluate.ts`, `ai-ai-treaty-tick.ts`, `gra/src/main.ts` (tylko ustawienie/wczytanie poziomu), `gra/src/ui/newGameFlow.ts` (pole, domyślna ŁATWA, migracja, wiersz w zaawansowanych, podsumowanie). `gra/data/*` bez zmian.
TESTY:
- `tsc --noEmit`: exit 0.
- Bramki: logic 213/213; tech-tree 20/20; research 33/33; unit-replace 21/21; combat 6/6.
- `diplomacy-war-level-test.cjs`: 26/26 zielone; mutant (kara bez ×k) → 12 czerwonych.
- Live Chromium (bundle `vite build` poza repo): ai-ai-treaty-live-proof-breach 12 OK / 0 FAIL; diplomacy-audience-status-banner 14/0; diplomacy-trade-era-saveload exit 0 (świeży bundle).
- Testy diplomacji (89 plików): 83 zielone. 6 niezielonych: 4 środowiskowe (brak binarki Chromium pod ścieżką w teście, brak serwera :612, analizator wymaga wyniku runa); 1 timeout (diplomacy-relation-deal-text-consistent-live-test, baza NIE ZBADANA); 1 istniejąca czerwień (diplomacy-sensible-deals-live-test: te same 3 FAIL na bazie 29a3920b9).
BLOKADY:
- NIE ZMIERZONO: pomiar 90 tur ×3 poziomów (wojny, sojusze AI↔AI, zaufanie t50) — runner nie ma haka poziomu.
- NIE ZMIERZONO: żywy start gry na poziomie Normalna/Trudna i odczyt kary w Chromium.
- NIE WDROŻONE: ABC7 — `gra/src/game/ai.ts:1479` (`ekspansja_heurystyka_granica_kara`, ×k). `ai.ts` jest POZA allowlistą; zmiana wycofana. Do decyzji orkiestratora (jedna linia `scalePenaltyForWarLevel(...)`).
- NIE ZWERYFIKOWANO: round-trip zapisu nowego pola (mechanizm jak `wzrostSurowcowZEpoka`); migracja i UI tylko przez tsc.
- Odstępstwo: poziom czytany globalnie (`setDiplomacyWarLevel`), a nie argumentem do `applyDiplomaticEvent`.
- Świadomie nie skalowano: wartości startowe, progi, czasy, ceny PN, zmęczenie wojną, krok zaniku urazów (ABC 4/6/8/5c). N2 ×3 = −54 przekracza próg −40 (ABC3 A).
- Live testy nadpisały śledzone PNG w `dyspozycje/` — przywrócone `git restore`. Nowy nieśledzony `P-DYPLO-PRZEMARSZ-DUPLIKAT-AKTYWNY-Q1/dowody/render.png` nie wszedł do commita.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator — przegląd diffu; decyzja o `ai.ts` (allowlista); runner pomiaru 3 poziomów z hakiem poziomu (civTest); żywy start Normalna/Trudna.
DEPLOY/PUSH: NIE WYKONANO
