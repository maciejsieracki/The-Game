# P-BRAMKI-BUDYNKI-DWIE-CZERWONE-ZASTANE-Q1 — Operator, runda 1

STATUS: PASS
DOMAIN: INFRA
TEMAT: P-BRAMKI-BUDYNKI-DWIE-CZERWONE-ZASTANE-Q1

## Diagnoza per asercja (wszystkie 9 = kategoria (a))

**7× `eraBuildingCatalog status='ready' z X wybudowaną (ma: locked)`** (akademia, fort,
akademia_wojskowa, swiatynia, laznia_publiczna, baszta, akwedukt): CITY_BUILDING_PREREQ i
`cityBuildingPrereqMet` działają poprawnie (potwierdzone: `buildableProduction`/parytet AI
zielone niezależnie). Realna przyczyna: `eraBuildingCatalog` liczy status też z `resourceOk`
(`canAffordBuildingStock` na `koszt_surowce`, np. akademia 40 drewna+70 cegły) — mechanizm
PYTANIE-84/SUROW-CIV-01 (2026-07-23/24), starszy niż ten plik testowy (2026-07-25), ale test
nigdy nie ustawiał `empireResourceStock`. Zweryfikowane ręcznie (bundlowany moduł, ten sam
`buildings.json`): z `empireResourceStock` wystarczającym status faktycznie przechodzi na
`ready`. Wzorzec potwierdzony też w `tools/deposit-building-gate-test.cjs` (już tak robi).
Naprawa: `AMPLE_STOCK` w `baseCtx()`.

**1× `Mennica DOSTĘPNA z Targowiskiem + Złoto`**: test używał pola `activeResourceLabels`,
ale `buildingResourceGateMet` bierze parametr `_activeLabels` z podkreśleniem — celowo
nieużywany. Kod (`building-resource-gate.ts`): `isAccessOnlyResourceLabel` oznaczone
`@deprecated DOSTEP-SUROWCE-Q1 — pusty; wszystkie etykiety = magazyn państwa`. Jedyna bramka
złota to `empireResourceStock.zloto`. Legalna, udokumentowana zmiana semantyki starsza od
testu. Naprawa: `empireResourceStock: { zloto: 10 }` zamiast martwego pola.

**1× `no handel bonus on bruk`** (upgrade-budynki-test.cjs): `data/terrain-improvements.json`
→ `droga_brukowana` niesie WPROST udokumentowaną notatkę: `R-DROGI-RUCH-HANDEL-Q1 (Maciej
2026-08-14): ruch z +2 (odejmowanie) na 5x szybciej; Handel (plon heksa) 2→3/turę`. To
udokumentowana w samych danych decyzja właściciela, nowsza niż test (asercja opisywała stan
sprzed tej decyzji). Naprawa: asercja sprawdza `bonus.handel === 3` zamiast braku bonusu;
`bonus_ruch===2` zostaje (pole historyczne/martwe, nieusuwane z JSON, więc nadal =2).

Brak kategorii (b) — zero DECISION_REQUIRED. Nie znaleziono żadnego realnego defektu w
łańcuchach prereq/upgrade budynków; wszystkie 9 faili to test podążający za już wdrożonymi,
udokumentowanymi zmianami danych/kodu.

## ZMIANY/COMMIT
- `gra/tools/prereq-budynkow-test.cjs`: `AMPLE_STOCK` w `baseCtx()` (empireResourceStock
  domyślnie duży dla drewna/kamienia/cegły), sekcja 1b przepisana na `empireResourceStock.zloto`
  zamiast martwego `activeResourceLabels`. Zero zmian liczby/semantyki innych asercji.
- `gra/tools/upgrade-budynki-test.cjs`: asercja "no handel bonus on bruk" przekotwiczona na
  aktualny, udokumentowany w JSON stan (`bonus.handel===3`), z rozszerzonym komentarzem.
- Brak zmian w `gra/src/**`, `gra/data/**`.

## TESTY
- `node tools/prereq-budynkow-test.cjs` → 59/59 (było 51/8)
- `node tools/upgrade-budynki-test.cjs` → 49/49 (było 48/1)
- `npx tsc --noEmit` → czysto
- Referencyjne: logic-test 213/213, tech-tree-test 19/19, research-test 33/33,
  unit-replace-test 13/13, combat-test 6/6 — wszystkie zielone.
- Liczba asercji (pass+fail) nie spadła w żadnej bramce (59 i 49, jak przed = binarne
  kryterium).

## BLOKADY
Brak.

## RUNDY
1/5 — PASS, koniec pętli.

## NASTĘPNY KROK
Evaluator (Sonnet 5, effort high) → Final Control → integracja allowlist-only.

## DEPLOY/PUSH: NIE WYKONANO
