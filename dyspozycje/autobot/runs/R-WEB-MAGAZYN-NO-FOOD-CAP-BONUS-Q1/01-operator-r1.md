STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-MAGAZYN-NO-FOOD-CAP-BONUS-Q1
GOAL: Magazyn nie zwiększa capu żywności centralnej; pojemność żywności daje wyłącznie Spichlerz (decyzja właściciela 2026-11-05). Baza 1000 i wkłady Spichlerzy bez zmian; pojemność surowców Magazynu (WAREH) nietknięta.
ZMIANY/COMMIT: kod `1c1b8bedc` (R-WEB-MAGAZYN-NO-FOOD-CAP-BONUS-Q1: Magazyn nie zwieksza capu zywnosci); ten raport w osobnym commicie na gałęzi worktree. Baza: origin/main 382981996, detached. Push: NIE.
- `gra/data/econ-params.json`: `magazyn_centralny_bonus_zywnosc_na_budynek` easy/normal/hard 100 → 0, opis zaktualizowany.
- `gra/src/game/empire-food.ts`: fallback w `buildEmpireFoodParams` 100 → 0; komentarze przy `centralCapBonusMagazyn` i `computeCentralFoodCap`. Struktura `EmpireFoodParams` bez zmian.
- `gra/tools/magazyn-food-cap-bez-magazynu-test.cjs`: NOWY test (realny silnik przez esbuild z src, realny econ-params.json).
- Nie zmieniano `economy-upkeep.ts` (jego komentarze nie opisują bonusu Magazynu do żywności), UI ani docs (patrz BLOKADY).
POMIAR PRZED/PO (cap żywności gracza, bez Spichlerza, `advanceEmpireFood` → `getEmpireFoodMaxCap`):
- PRZED: N=0 → 1000, N=1 → 1100, N=2 → 1200, N=3 → 1300 (easy, normal i hard identycznie).
- PO: N=0..3 → 1000 (easy, normal, hard). Spichlerz I dokłada 1000 przy każdym N.
TESTY:
- Nowy test: RED przed zmianą (9 FAIL), GREEN po (16 PASS, 0 FAIL). Mutacja (normal=100 w JSON): 7 FAIL, po przywróceniu 0 GREEN. Logi: `gate-nowy-test.txt`.
- `npm ci --ignore-scripts` EXIT=0; `tsc --noEmit` EXIT=0 (`gate-tsc.txt`). Nie uruchamiano `npm run build`/`dev`.
- Regresja food/magazyn/spichlerz (20 plików, `gate-regresja-1.txt`): 18× EXIT=0. Dwa FAIL, identyczne na czystym HEAD origin/main (sprawdzone osobno): `hex-plony-magazyn-test` 10 pass/4 fail; `mennica-magazyn-test` 34 pass/7 fail. Nie związane z capem żywności.
- `ai-test`: 274 passed, 20 failed, identycznie jak na czystym main (zgodnie z bazą 274/20).
- Regresja cap/upkeep (`gate-regresja-2.txt`): EXIT=0 dla upkeep-test, population-growth-v85, okolica-multi-city-overlap, city-state-mp-growth, autowyzywienie-rowny-wzrost, population-civ-matrix-wiring, siege-starvation, warehouse-state-cap-20pct, owner-economy. Pięć plików FAIL, identycznie na czystym main: ai-major-economy (TypeError computeMajorArchetypeMilitaryFraction), citizen-resource-upkeep (2 FAIL), unit-resource-upkeep (4 FAIL), surow-civ-storage (4 FAIL), ai-test (20 FAIL, jak wyżej).
- Testy z inline fixture `magazyn_centralny_bonus...: {normal: 100}` (np. magazyn-era-scaling, empire-food-b5, okolica-multi-city-overlap) podają wartość jawnie, więc nie zależą od JSON i przechodzą bez zmian.
BLOKADY / ZGŁOSZENIA POZA ALLOWLISTĄ (nie ruszane):
1. `gra/src/game/building-resource-gate.ts:538` (komentarz): nadal „Magazyn +100” przy `magazyn_centralny_baza_zywnosc`. Nieaktualny komentarz.
2. `gra/data/econ-params.json` opis `magazyn_centralny_baza_zywnosc`: nadal „(+ Spichlerze lokalne +100/+150, Magazyn +100)”. Allowlista dopuszcza tylko klucz bonusu i jego opis.
3. UI: w `gra/src` nie znaleziono tekstu „+100 za Magazyn” dla żywności. Panel pokazuje tylko liczbę `maxCap` (`ui/empireDetailPanel.ts`, `ui/cityPanel.ts:5662`), więc UI nie wymagał zmiany.
4. Docs (poza tym tematem, dotyczą SUROWCÓW, czyli WAREH): `docs/encyklopedia/budynki/magazyn.md:18`, `docs/PORADNIK-GRACZA/03-pasek-zasobow.md:365`, `docs/PORADNIK-GRACZA/08-ekonomia-imperium.md:408` (+100/Magazyn dla surowców). Przy okazji WAREH trzeba je zaktualizować. Poradnik §21 (żywność) jest już zgodny.
5. Testy sprzed zmiany: `gra/tools/magazyn-era-scaling-test.cjs:15-16` (komentarz cytujący stary opis). Nie zmieniano.
NASTĘPNY KROK: Evaluator (weryfikacja nowego testu, mutacji i logów gate; ocena pięciu FAIL pre-existing jako nieobjętych tematem); Final Control; integracja orkiestratora. Zgłoszenia 1–2 i 4 do decyzji orkiestratora (czy rozszerzyć allowlistę albo przekazać do WAREH).
RUNDY: 1/5. Ostatni werdykt: brak (runda pierwsza).
DEPLOY/PUSH: NIE WYKONANO
