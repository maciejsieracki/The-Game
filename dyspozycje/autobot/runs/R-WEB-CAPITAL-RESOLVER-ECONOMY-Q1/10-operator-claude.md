# R-WEB-CAPITAL-RESOLVER-ECONOMY-Q1 — raport Operatora (runda 1/5)

STATUS: PASS
DOMAIN: GAME (spójność wyboru stolicy, zero zmian wartości balansu w istniejących scenariuszach)
TEMAT: R-WEB-CAPITAL-RESOLVER-ECONOMY-Q1 (MINTDEBT #165)
GOAL: efekty stolicy w tickach ekonomii (advanceCityEconomy i podgląd previewCityEconomy) używają tej samej stolicy co UI i Mennica (resolver capitalCityIdForOwner z main.ts), a nie heurystyki „pierwsze miasto ownera w tablicy cities”.
BAZA: 4afe2c609 (origin/main)

## Tabela efektów zależnych od stolicy (przed zmianą -> po zmianie)

| Miejsce | Efekt | Skąd stolica przed | Skąd stolica po |
|---|---|---|---|
| turn-economy.ts `previewCityEconomy` i `advanceCityEconomy`: `isCapital` | korupcja: dystansOdStolicy = 0 dla stolicy (strataBazowa) | pierwsze miasto ownera w `cities` | `capitalCityIdByOwnerForTick` (resolver main.ts, fallback pierwsze miasto) |
| te same funkcje: pre-pass `capitalCoordsByOwner` (D2) | współrzędne referencyjne dla dystansu wszystkich pozostałych miast ownera | pierwsze miasto ownera w `cities` | ten sam helper |
| `ownersWithMennica` (turn-economy.ts) -> `maMennica` | bonus Waluta+Mennica (empire-wide) | resolver, gdy ustawiony; inaczej pierwsze miasto | ten sam helper (refaktor, jedno źródło) |
| `toEconomyCity` -> pole `czyStolica` (economy.ts `EconomyCity`) | brak wpływu: pole jest ustawiane, ale nigdzie nie czytane w economy.ts ani turn-economy.ts (zweryfikowane grep-em) | isCapital | isCapital z helpera (wartość spójna, bez efektu) |

Inne moduły wołane z tiku (economy.ts, production.ts, cityPanel.ts, administracja): stolica występuje jako warunek lokalizacji budynku (`lokalizacja: stolica/region`) przy budowie i w UI (cityPanel `cfg.getCapitalCityId`, już na capitalCityIdForOwner) — to nie jest efekt tiku, nie wymagało zmiany. `corruptionBuildingReduction` i administrator nie zależą od stolicy. Zmieniono więc tylko turn-economy.ts. Allowlista nie wymagała zmian w main.ts ani innych modułach silnika.

## Zmiany (COMMIT: patrz sekcja ZMIANY-COMMIT)

- gra/src/game/turn-economy.ts
  - nowa eksportowana funkcja `capitalCityIdByOwnerForTick(cities)`: wskazanie resolvera, gdy wskazuje miasto tego ownera obecne w `cities`; w pozostałych przypadkach (brak resolvera, testy) — pierwsze miasto ownera (zachowanie dotychczasowe).
  - `ownersWithMennica` korzysta z helpera (ta sama logika co wcześniej dla niepustego resolvera i dla heurystyki).
  - w `previewCityEconomy` i `advanceCityEconomy`: `isCapital` i pre-pass `capitalCoordsByOwner` liczone z helpera; usunięty `capitalSeen`.
  - wartości balansu, kolejność obliczeń i wzory: bez zmian.
- gra/tools/capital-resolver-economy-test.cjs (nowy): 10 asercji behawioralnych na realnym silniku (mapa seed 9191, previewCityEconomy + advanceCityEconomy).

Nuans (do wiadomości orkiestratora): gdy stolica jest przeniesiona (jawny capitalCityIdByOwner w main.ts) albo oldestCityOfOwner różni się od pierwszego miasta w tablicy, wartości korupcji i Mennicy dla danego imperium zmieniają się — to jest zamierzona poprawka, nie zmiana balansu. Bez przeniesienia stolicy i przy zgodności pierwszego miasta z resolverem wynik jest identyczny (asercja B1/B2).

## TESTY (liczby z surowego wyjścia)

- `npx tsc --noEmit` (gra/): exit 0
- logic-test: exit 0, ostatnia linia `PASS  [213] cityfix: ...` (213 sekcji)
- tech-tree-test: `20 pass, 0 fail`
- research-test: `PASSED: 33 / FAILED: 0 / TOTAL: 33`
- unit-replace-test: exit 0 (brak linii podsumowania w wyjściu)
- combat-test: exit 0, `All sanity checks passed.`
- ai-test: `297 passed, 0 failed` (po refaktorze)
- war-rules-multiwar-main-guard-test: `21 PASS / 0 FAIL`
- waluta-mennica-test: `61 passed, 0 failed`
- mint-capital-only-test: `8 PASS / 0 FAIL`
- mint-orphan-test: `28 PASS / 0 FAIL`
- trade-routes-income-test: `135 passed, 0 failed`
- citizen-resource-upkeep-test: `124 passed, 0 failed`
- city-administrator-economy-test: `72 passed, 0 failed`
- mennica-uspienie-test: `49 passed, 0 failed`
- currency-test: `37 passed, 0 failed`
- growthmult-compound-test: `24 passed, 0 failed`
- spichlerz-wzrost-test: `14 passed, 0 failed`
- labor-to-tax-conversion-gold-test: `58 passed, 0 failed`
- city-administrator-test: `119 passed, 0 failed`
- administracja-stolica-test: `53 OK, 0 FAIL`
- capital-capture-test: exit 0 (brak linii podsumowania w wyjściu)
- NOWY capital-resolver-economy-test: `10 passed, 0 failed`
  - A1/A2: stolica przeniesiona do B (drugie w tablicy) == B pierwsze w tablicy (tick i preview)
  - B1/B2: resolver = pierwsze miasto == brak resolvera (tick i preview)
  - C1/C2: przeniesienie stolicy realnie zmienia wynik (test ma moc)
  - D1-D4: capitalCityIdByOwnerForTick, ownersWithMennica (Mennica w nowej / osieroconej stolicy), heurystyka bez resolvera
- MUTACJA CZERWONA (wykonana, źródło przywrócone i zweryfikowane grep-em + ponownym zielonym przebiegiem): w `capitalCityIdByOwnerForTick` wyłączenie użycia resolvera (`if (!resolver || true)`) -> `capital-resolver-economy-test: 3 passed, 7 failed` (czerwone: A1, A2, C1, C2, D1, D2, D3).

Luki/NIE_ZMIERZONO: brak pomiaru w przeglądarce (live) — temat nie zmienia UI; wartości w grze nie sprawdzane na żywej partii z przeniesioną stolicą.

## Decyzja właściciela

Nie wymagana. Żadna istniejąca asercja nie zmieniła wartości (wszystkie zielone bez modyfikacji asercji); zmiana dotyczy tylko imperiów, w których stolica różni się od pierwszego miasta w tablicy.

## Pliki

- gra/src/game/turn-economy.ts (zmodyfikowany)
- gra/tools/capital-resolver-economy-test.cjs (nowy)
- dyspozycje/autobot/runs/R-WEB-CAPITAL-RESOLVER-ECONOMY-Q1/10-operator-claude.md (ten raport)

## UWAGI-DLA-ORKIESTRATORA

- Nie tworzono żadnej nowej sesji/zadania (zakaz respektowany).
- `gra/node_modules` zainstalowane przez `npm ci --ignore-scripts` wyłącznie w worktree; do usunięcia po bramkach (zgodnie z dispatchem) — orkiestrator/sprzątanie worktree.
- Pliki tymczasowe testu (`.cre-*`) są usuwane przez sam test; git status pokazuje tylko pliki kodu i raport.
- Dług do rozważenia (poza zakresem): `capitalCoordsByOwner` i `isCapital` w turn-economy.ts nadal istnieją jako dwa niezależne bloki w previewCityEconomy i advanceCityEconomy (duplikacja logiki tiku) — kandydat na osobny refaktor.

NASTĘPNY KROK: FC (Final Control) na commit z kodem; po FC integracja orkiestratora (merge-tree sprawdzony przez orkiestratora).
RUNDY: 1/5
DEPLOY/PUSH: NIE WYKONANO
