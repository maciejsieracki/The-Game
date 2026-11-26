# R-WEB-MINT-CAPITAL-ONLY-Q1 — obrona Operatora (runda 2, odpowiedź na raport Evaluatora f4d32c06)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-MINT-CAPITAL-ONLY-Q1
GOAL: bonus Mennicy na całą cywilizację, raz, tylko z Mennicy w AKTUALNEJ stolicy; Mennica poza stolicą nie działa.
BAZA: dbd6d3acb078648f60fef70f2dd465aad277d8f4 (kandydat rundy 1, wycofany z bazy przez poprawki poniżej)

## Odpowiedzi na zarzuty

1. (istotny, źródło stolicy) PRZYJMUJĘ i NAPRAWIONE.
   Silnik używał heurystyki „pierwsze miasto ownera w `cities`", panel i produkcja używają `capitalCityIdForOwner` (main.ts, boot), który respektuje przeniesienie stolicy. Naprawa:
   - `turn-economy.ts`: nowy resolver `setOwnerCapitalCityResolver(fn|null)` (wzorzec jak `setArmyFoodUpkeepResolver`); `ownersWithMennica` przy zainstalowanym resolverze liczy bonus tylko gdy `resolver(owner) === c.id` i w tym mieście stoi `mennica`. Bez resolvera zostaje heurystyka (testy, stare wywołania).
   - `main.ts` (boot, obok `setArmyFoodUpkeepResolver`, ~l. 10330): `setOwnerCapitalCityResolver((oid) => capitalCityIdForOwner(oid))`. Deklaracja `capitalCityIdForOwner` (~l. 39897) jest w tym samym zakresie `boot()` (2121–53451), więc hoisting działa.
   - Silnik (`advanceCityEconomy`, `previewCityEconomy`) i panel (`cfg.getCapitalCityId`, main.ts ~35398) czytają teraz to samo źródło.
2. (brak testu spójności) PRZYJMUJĘ częściowo.
   `mint-capital-only-test.cjs` przypadek 3 używa resolvera wskazującego nową stolicę c1 (nie zmiany kolejności tablicy) i sprawdza, że osierocona Mennica w c0 nie daje bonusu, a sama Mennica w c1 daje. Test sprawdza silnik przez tę samą funkcję, której używa gra. Spójności z panelem nie testuję w node (panel to DOM); spójność wynika z tego, że oba czytają `capitalCityIdForOwner`. Test na żywo: NIE ZMIERZONO.
3. (tautologia mutacji nr 5) PRZYJMUJĘ i USUNIĘTE.
   Przypadek „mutant zdefiniowany w teście" usunięty. Zastąpiony przypadkami wołającymi prawdziwą funkcję z resolverem. Własna mutacja zewnętrzna (w `ownersWithMennica` `const resolver = null`, czyli resolver ignorowany): `mint-capital-only-test` 6 PASS / 2 FAIL (czerwone), po przywróceniu 8 PASS / 0 FAIL.
4. (etykieta UI osieroconej Mennicy) PRZYJMUJĘ i ZROBIONE (mały koszt, istniejące `cfg.getCities` / `cfg.getBuiltBuildingIds`).
   `cityPanel.ts`: nowa funkcja `ownerHasOrphanMennica(ownerId)`. Gdy Mennica stoi poza stolicą i nie ma aktywnej, zamiast „Bez Mennicy" panel pokazuje: „Mennica stoi poza stolicą — jest nieaktywna; bonus liczy się tylko z Mennicy w stolicy." Tekst pokazuje się tylko w gałęzi „brak aktywnej Mennicy", więc nie zmienia wyniku liczbowego. Wizualnie NIE ZMIERZONO w przeglądarce.
5. (zdublowane komentarze) PRZYJMUJĘ i POPRAWIONE.
   - `turn-economy.ts`: usunięto stary blok doc-comment („w KTÓRYMKOLWIEK ze swoich miast"); jeden aktualny komentarz nad `ownersWithMennica`.
   - `cityPanel.ts`: komentarze „gdziekolwiek w imperium / ten sam union" (ok. l. 1356–1363, 1511, 11659–11663) przepisane na stolicę i resolver. Zdanie „ten sam union" usunięte.
6. (production.ts, brak zmian) PRZYJMUJĘ jako ustalenie z kodu, bez zmian w production.ts.
   Dowód z kodu: `production.ts:623–630` `buildingLocationAllowed` dla `lokalizacja === 'stolica'` zwraca `isCapital === true`; nie ma żadnego warunku imperialnego. Osierocona Mennica w starej stolicy nie blokuje więc budowy w nowej stolicy (zgodnie z ZAŁOŻENIEM dispatchu, pkt 2). Jedna Mennica na miasto wynika z listy już zbudowanych. Efekt: w danym momencie aktywna jest co najwyżej jedna Mennica (w stolicy), osierocone są nieaktywne. Potwierdzenie w przeglądarce: NIE ZMIERZONO, do decyzji właściciela (czy dopuszczać budowę w nowej stolicy przy osieroconej Mennicy — kod to dopuszcza).

## Zmiany w tej rundzie (commit: patrz sekcja ZMIANY-COMMIT)

- `gra/src/game/turn-economy.ts`: `setOwnerCapitalCityResolver`, `ownersWithMennica` z resolverem, usunięty zdublowany komentarz.
- `gra/src/main.ts`: import `setOwnerCapitalCityResolver`, instalacja resolvera w boot (~l. 10330). Zmiana w allowliście (pkt „main.ts tylko jeśli konieczne"): konieczne, bo źródło stolicy żyje w main.ts.
- `gra/src/ui/cityPanel.ts`: `ownerHasMennica` (stolica z `cfg.getCapitalCityId`), nowa `ownerHasOrphanMennica`, etykieta w gałęzi „brak", komentarze.
- `gra/tools/mint-capital-only-test.cjs`: eksport resolvera, przypadki 3–6 przepisane (resolver, zmiana stolicy, dwie cywilizacje, fallback heurystyczny), usunięta tautologia.

Nie zmieniono: `production.ts`, `gra-robocza/`, `gra-kanon/`, `WERSJE.md`, `rust-port/`, manifest, wartości balansu, `waluta-mennica-test.cjs` (zmiana asercji z rundy 1 zostaje; zgodna z 8A).

## TESTY (surowe wyniki, uruchomione w tym worktree na zmienionym kodzie)

- `npx tsc --noEmit -p .` (w gra/): brak błędów (wyjście puste, kod 0).
- `node tools/mint-capital-only-test.cjs`: `mint-capital-only-test: 8 PASS / 0 FAIL`, exit 0.
- mutacja (resolver ignorowany, `const resolver = null`): `mint-capital-only-test: 6 PASS / 2 FAIL`; po przywróceniu 8/0.
- `node tools/waluta-mennica-test.cjs`: `waluta-mennica-test: 61 passed, 0 failed`.
- `node tools/logic-test.cjs`: `LOGIC OK (213/213)`.
- `node tools/tech-tree-test.cjs`: `tech-tree-test: 20 pass, 0 fail`.
- `node tools/research-test.cjs`: `PASSED: 33 / FAILED: 0 / TOTAL: 33`.
- `node tools/combat-test.cjs`: `COMBAT TEST: 6/6 pass`.
- `node tools/trade-routes-income-test.cjs`: `135 passed, 0 failed`.
- `node tools/ai-unit-replace-same-rules-test.cjs`: `45 passed, 0 failed`.
- `node tools/ai-test.cjs`: `ai-test: 297 passed, 0 failed`.
- `node tools/war-rules-multiwar-main-guard-test.cjs`: `21 PASS / 0 FAIL`.
- `git diff --check`: czysto.
- NIE ZMIERZONO: gra w przeglądarce (etykieta panelu, budowa Mennicy w nowej stolicy przy osieroconej, przeniesienie stolicy w grze na żywo).

Uwaga o środowisku: `gra/node_modules` zainstalowane przez `npm ci` (nie `npm run build`); usunięte po bramkach.

## BLOKADY

Brak blokad technicznych. Otwarte do decyzji właściciela (nie blokują wdrożenia kodu):
- czy budowa Mennicy w nowej stolicy przy osieroconej Mennicy w starej ma być dozwolona (kod dopuszcza; zgodne z ZAŁOŻENIEM dispatchu pkt 2).

## UWAGI-DLA-ORKIESTRATORA

- Dług poza zakresem (pre-existing, potwierdza zarzut UWAGA Evaluatora): w `advanceCityEconomy`/`previewCityEconomy` `isCapital` (pierwsze miasto ownera) nadal jest heurystyką dla innych efektów stolicy; pre-pass D2 (`capitalCoordsByOwner`) też. Mennica już korzysta z resolvera; reszta to osobny temat (warto rozważyć jako R-WEB-CAPITAL-SOURCE-*).
- Evaluator wskazał `main.ts` jako wymagany do allowlisty; zmiana minimalna (import + jedna linia instalacji).

RUNDY: 2/5 (Operator, obrona)
NASTĘPNY KROK: ponowny Evaluator (runda 2) na commicie zawierającym poprawki; następnie Final Control.
DEPLOY-PUSH: NIE WYKONANO
