# R-WEB-ECONOMY-UNIT-RECRUIT-COST-ERA-EXTRA-MULT-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ECONOMY-UNIT-RECRUIT-COST-ERA-EXTRA-MULT-Q1 (+ DODATEK 1: usunięcie trudności z kosztu jednostek)
GOAL: rekrutacja w Pieniądzu x2 (Brąz) i x4 (Żelazo) DODATKOWO do skali epoki; trudność nie mnoży kosztu i utrzymania jednostek; audyt kosztów wojska.
BAZA: 031b42d730ae1cf989eb882564820163c9013d2f (origin/main). Commit: czubek gałęzi detached z tym raportem.

ZMIANY-COMMIT:
- `gra/src/game/production.ts`: `unitRecruitEraExtraMultiplier` (l.~418) i `unitRecruitBaseMoneyCost` (l.441) — mnożnik stosowany raz w bazie rekrutacji; użyty w `unitProductionItem` (l.498), `availableProduction` (l.1302), `availableReplacementsFor` (l.1433), `unitPurchaseCost` (l.2642). `itemCost('jednostka')` bez zmian (loot `battle-loot.ts:63` = dawna wartość). `unitMoneyCost` (l.665): usunięte `applyDifficultyCostMultiplier` dla jednostek (l.684).
- NOWE `gra/data/unit-recruit-cost-era-params.json`: `kosztRekrutacjiDodatkowyMnoznikEpoki: {kamien 1, braz 2, zelazo 4}`.
- `gra/data/econ-params.json`: trudna/łatwa wartości utrzymania jednostek ujednolicone do normalnej (patrz tabela).
- Testy: NOWE `gra/tools/unit-recruit-cost-era-extra-test.cjs` (9/0, mutanty Braz 2→1, Zelazo 4→2, ponowne naliczenie trudności czerwone); NOWE `gra/tools/unit-cost-difficulty-removed-test.cjs` (9/0, kontrola budynków, mutanty czerwone); piny zaktualizowane z uzasadnieniem DECYZJA 2026-11-19: `unit-epoch-cost`, `impi-recruitment-discount`, `recruitment-cost-50-wood`, `upkeep-difficulty-per-owner`, `citystate-army-food-difficulty`, `pr141-f04-cost-activation`.

TABELA KOSZTU REKRUTACJI (Pieniądz, pace niski/normalny/wysoki, bez ulg cywilizacji; przed → po):
- Wojownik (Kamień, raw 5): 5/10/20 → 5/10/20
- Włócznik (Brąz, 8): 16/32/64 → 32/64/128
- Procarz (Brąz, 4): 8/16/32 → 16/32/64
- Rydwan konny (Brąz, 14): 28/56/112 → 56/112/224
- Falanga (Żelazo, 9): 36/72/144 → 144/288/576
- Hastati (Żelazo, 9): 36/72/144 → 144/288/576
- Konnica (Żelazo, 11): 44/88/176 → 176/352/704
Trudność (łatwa AI ×2, trudna gracz ×2) usunięta z kosztu jednostek: rekrutacja identyczna dla easy/normal/hard i gracz/AI (sprawdzone w teście).

TABELA UTRZYMANIA JEDNOSTEK (easy / normal / hard): przed → po
- globalne.utrzymanie_jednostka_standard: 1/1/2 → 1/1/1
- ekonomia_miasta.zywnosc_jednostka_ruch: 1/1/2 → 1/1/1
- ekonomia_miasta.zywnosc_jednostka_oboz: 0,38/0,5/0,62 → 0,5/0,5/0,5
Nie zmienione (efekty, nie utrzymanie jednostek): koszty budynków i ulepszeń, utrzymanie budynków, badania, próg wzrostu ludności, `zywnosc_zuzytka_populacja` (hard 2), `glod_wojska_*`, `zloto_deficyt_*`, `armia_odklad_*` (kary/głód armii) — do decyzji właściciela, czy też usunąć.

AUDYT (wywołania prawdziwych funkcji; liczby z surowego wyjścia `audit.cjs`):
- Konnica utrzymanie Pieniądz/turę = 48: baza JSON 3 × epoka Żelazo ×4 (`unitUpkeepScaleByEpoch`, economy-upkeep.ts:1122; flaga rebalansu ON) × `R_STAWKI_FALA1_FALA2_MULT` ×4 (economy-upkeep.ts:1078). Każdy mnożnik liczony RAZ w kodzie (brak podwójnego naliczenia). Efektywnie 16× bazy JSON. Pace nie dotyczy utrzymania (brak parametru w `unitUpkeep`). 10 × 48 = 480 = suma utrzymania, nie koszt rekrutacji (rekrutacja Konnicy niski = 176 po zmianie).
- Utrzymanie Pieniądz i żywność/turę wszystkich 10 jednostek: identyczne przed i po zmianie (zmiana dotyczy wyłącznie rekrutacji).
- Liczone raz: rekrutacja (pace, era extra), utrzymanie (epoka, R_STAWKI).
- NIEPEWNE: czy łączne ×16 na utrzymaniu jest zamierzone — DECYZJA WŁAŚCICIELA.

POMIAR: NIE ZMIERZONO — bieg dymny AI 60 tur (seed 4242) i liczba jednostek AI t30/t60 nie wykonane. Headless Chromium w `tools/empire-mass-recruitment-test.cjs` wisi na starcie (timeout 8 min, mimo `/usr/bin/google-chrome`); nie diagnozowano.

TESTY (surowe wyniki):
- `npx tsc --noEmit`: exit 0
- logic 213/213; tech-tree 20 pass/0; research 33/0; unit-replace 21/21; combat 6/6; ai-unit-replace-same-rules 45/0; unit-upkeep-era-scale 16 ok/0; ekonomia-5x 280/0
- zmienione/nowe: unit-epoch-cost 57/0; impi 705/0; recruitment-cost-50-wood 190/0; upkeep-difficulty-per-owner 19/0; citystate-army-food-difficulty 29/0; pr141-f04 exit 0; difficulty-cost 22/0; upkeep-test 91/0; ai-difficulty-bonus 97/0; ai-prod-gate-difficulty 8/0; unit-cost-tempo 9/0; recruitment-no-upkeep-gate 37/0; unit-replace-full-cost 40/0
- Regresja: ~250 testów `*recruit*|*cost*|*upkeep*|*epoch*|...` porównanych z bazą: czerwone również w bazie (przeglądarkowe/pomiarowe i m.in. `empire-food-b5`, `building-upkeep-resources`, `unit-frozen-fortified-unselectable`, `roster-space-next-active-unit`, `recruit-list-visibility-ui`); nowych regresji brak poza naprawionymi pinami.

BLOKADY / UWAGI-DLA-ORKIESTRATORA:
1. Allowlista rozszerzona o 3 testy spoza listy (`pr141-f04-cost-activation`, `citystate-army-food-difficulty`, `upkeep-difficulty-per-owner`) — piny wartości zmienionych tą decyzją.
2. Loot bojowy (`battle-loot.ts`) nadal na dawnym `itemCost` — potwierdzić z właścicielem.
3. Untracked śmieci z uruchomień testów (NIE dodane do commita): `gra/bundle.js`, `gra/entry.ts`, `gra/guard-*`, `gra/tools/.empire-*-bundle*.js`; `gra/node_modules` zainstalowany (ignorowany). Przywrócone PNG z `dyspozycje/.../dowody` zmienione przez testy.
4. Pytanie do właściciela: czy utrzymanie Konnicy 48/turę (efektywnie 16× baza) jest zamierzone.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator — weryfikacja pinów, allowlisty i tabel; pomiar AI 60 tur po naprawie uruchamiania przeglądarki.
DEPLOY/PUSH: NIE WYKONANO
