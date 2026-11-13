STATUS: PASS-WITH-NOTES (progi liczbowe do zatwierdzenia przez właściciela)
DOMAIN: GAME
TEMAT: R-WEB-AI-PURCHASE-MAINTENANCE-RESERVE-Q1
GOAL: AI nie kupuje jednostek, gdy po zakupie dochód netto złota/turę spadłby poniżej progu albo skarbiec nie pokryłby ceny + N tur utrzymania; progi w gra/data/ai-params.json per poziom.

## ZMIANY/COMMIT
Baza: 1cafcf632 (zawiera d07389579). Allowlista rozszerzona przez orkiestratora: main.ts (tylko call site) i econ-params.json. Commit: patrz SHA na końcu (sekcja COMMIT).
- `gra/src/main.ts`: import `loadAiPurchaseReserveParams`; nowa mapa `aiGoldIncomeByOwner` (przychód brutto z ostatniego ticku, zapis w bloku bankowania AI przy `sumEconomyForOwner`, czyszczona razem z `aiSkarbiecByOwner`); funkcja `aiPurchaseReserveInputs(ownerId, unitTypeId)`; call site `shouldAIPurchaseUnit` dostaje `...aiPurchaseReserveInputs(ownerId, candId)`.
  - Zgodność z ekonomią tury: tick robi `skarb += pieniadz − utrzymanieRazem`. Netto = `aiGoldIncomeByOwner` (to samo `pieniadz`) − `previewOwnerUpkeep(...).utrzymanieRazem` (te same prymitywy `upkeepBalance`, co HUD gracza ~20802 i suwaki AI ~38799). Prognoza HUD (13410/20915) jest tylko dla `ME()`, więc nie nadaje się dla AI; użyłem tego samego `previewOwnerUpkeep`. Utrzymanie kupowanej jednostki = różnica `previewOwnerUpkeep` z nią i bez niej. Poziom: `aiDiffLevelForOwner(ownerId)`.
  - Brak wpisu przychodu (tura 1, po wczytaniu zapisu) = reguła nieaktywna, dawna bramka (cena + Manpower); jedna tura, bez wpływu na grę.
- `gra/data/econ-params.json`: usunięte martwe klucze `ai_rush_jednostka_rezerwa_zlota` i `ai_rush_jednostka_max_na_ture`. Grep w `gra/src`, `gra/tools`, testach: zero odczytów (trafienia tylko w wygenerowanych `tools/.scc-bundle.cjs` i `.dip-audit-bundle.cjs`, osadzone kopie JSON, nieczytane w runtime). Zastąpione kluczami `kupno_jednostki_*` w ai-params.json.
- `gra/tools/ai-purchase-maintenance-reserve-test.cjs`: sekcja G (kontrakt źródłowy main.ts + zachowanie na stanie). Razem 43/0.
- `pomiar/` (w tym katalogu): skrypty pomiaru (poza repo budowane kopie gra), surowe JSON baza/po T100, `podsumowanie.txt`.

## TESTY
- Nowy test: 43 passed / 0 failed. Na main.ts z bazy fcaa10300: 33/10 (10 asercji sekcji G pada) -> test faktycznie wykrywa brak wpięcia.
- logic-test 213/213. ai-test 274 passed / 20 failed (jak baza). `npx tsc --noEmit` (TS 5.x z node_modules) czyste.
- ai-unit-rush 7/0, ai-mp-rekrutacja-build-gate 21/0, ai-rekrutacja-parytet 7/0, ai-prod-fallback 17/0. ai-jednostki-tylko-zakup 43/1 (D11, identycznie na bazie, nie ruszane).

## POMIAR (żywa gra, Chromium /opt/pw-browsers/chromium, seed 4242, mapa Mały, kontynenty, 3 AI większe: właściciele 1/7/13 + miasta-państwa, gracz tylko kończy tury; do T100)
Bundle baza = fcaa10300, po = ta zmiana; oba z tym samym hakiem odczytu. Jednostki wojskowe (bez cywili):
| Tura | Baza (AI 1/7/13) | Po (AI 1/7/13) | Suma baza -> po |
|---|---|---|---|
| T20 | 5/2/7 | 3/2/3 | 14 -> 8 |
| T40 | 29/65/28 | 25/42/25 | 122 -> 92 (-25%) |
| T60 | 47/133/28 | 38/71/25 | 208 -> 134 (-36%) |
| T100 | 48/134/28 | 39/72/25 | 210 -> 136 (-35%) |
Miasta T100: baza 22/16/20, po 20/19/20. Skarbce T100 (po): 48k/53k/66k (baza 21k/45k/64k). Utrzymanie T100: baza 2108/1712/428, po 1734/1494/450.
Degeneracja: brak. Żadna z 3 AI nie schodzi do 0 wojsk; tury ze skarbcem < 0: baza 29/297, po 24/297; minimum skarbca baza -472, po -57 (mniej bankructwa). Tury w stanie wojny (3 AI): baza 82, po 81 -> wojny nadal możliwe. Miasta nie tracone (wzrost).
Obserwacja poza zakresem: AI gromadzi skarbiec (20-66k do T100) i sztywno trzyma liczbę jednostek (limity/Manpower), czyli reguła rezerwy nie jest jedynym ogranicznikiem; największy efekt dotyczy AI 7 (134 -> 72).

## TABELA PROGÓW DLA WŁAŚCICIELA (ai-params.json; nie zmieniałem wartości po pomiarze, bo nie ma dowodu degeneracji)
| Poziom | rezerwa_tur (N) | min_dochod_netto | Zmierzony skutek (Normal, seed 4242) |
|---|---|---|---|
| Easy | 3 | 0 | nie mierzony osobno (jak Normal) |
| Normal | 3 | 0 | wojsko AI -35% w T100, bez bankructwa, wojny zachowane |
| Hard | 2 | -2 | nie mierzony osobno |
Pomiar objął jedną trudność główną (domyślną) i jeden seed; Easy/Hard weryfikowane tylko testem decyzji. Jeśli właściciel chce mniejszy lub większy spadek armii, pokrętłem jest `kupno_jednostki_rezerwa_tur_poziom2` (np. 2 -> mniejszy spadek, 5 -> większy); nie zmieniam bez decyzji.

## BLOKADY
Brak technicznych. Zatwierdzenie progów liczbowych: do decyzji właściciela (przez orkiestratora). Pomiar jednoseedowy (4242).

## RUNDY: 2/5 (licząc rundy jako: r1 Operator, r2 ta; dispatch nazywa to runda 2 po FC r1)
## NASTĘPNY KROK: Evaluator, potem Final Control. Integracja: ten temat przed ARMY-STACK-LIMIT (dotyka ai*.ts i main.ts).
## DEPLOY/PUSH: NIE WYKONANO
