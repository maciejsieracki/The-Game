# R-WEB-UI-UNIT-CARD-STATS-ENGINE-CANON-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-UNIT-CARD-STATS-ENGINE-CANON-Q1
GOAL: karty, tooltipy i panel miasta pokazują bojowe statystyki jednostki z tych samych pól co silnik (`combatUnitFromDef`), a nie z kolumn PL w `units.json`. Zmiana tylko wyświetlania.
BAZA: b3e74f414 (origin/main), checkout --detach. Operator: HAIKU 5.5.

## ZMIANY-COMMIT

Allowlista (wszystko w gra/src/ui/** i gra/tools/**):

- NOWY `gra/src/ui/unitEngineStats.ts` — `unitEngineStats(def)` zwraca `atak/obrona/hp/pancerz/przebicie/obrazeniaBroni/atakDystansowy`. Wewnątrz woła `combatUnitFromDef` (game/combat.ts), więc mapowanie i domyślne są współdzielone z silnikiem, bez duplikacji.
- `gra/src/ui/entityCards/unitAdapter.ts` — sekcja „Statystyki bojowe": Atak/Obrona/HP/Pancerz/Przebicie ze silnika. „Atak dystansowy" tylko gdy > 0. „Obrażenia broni" = `weaponDamage` (wcześniej PL `Uderzenie`).
- `gra/src/ui/unitInfoCard.ts` — ta sama zmiana w wierszach „Statystyki bojowe" karty mapy.
- `gra/src/ui/cityPanel.ts` — blok „Walka" w karcie jednostki z panelu miasta (ten sam zakres: Atak w zwarciu, Obrona, Obrażenia broni, Pancerz, Przebicie, Atak dystansowy, HP).
- `gra/tools/unit-detail-card-entitycard-migration-test.cjs` — 3 asercje przepisane z `u.Atak`/`u.Obrona`/`u.Uderzenie` na `unit.meleeAttack`/`unit.meleeDefence`/`unit.weaponDamage`. Uzasadnienie: dispatch wymaga wartości silnika, a stare asercje wymuszały wartości PL. Wynik: 40 pass, 0 fail (przed zmianą 38 pass, 2 fail).
- NOWY `gra/tools/unit-card-stats-engine-canon-test.cjs` — test binarny.

Commit: SHA podany w polu `sha` odpowiedzi StructuredOutput (commit zawiera kod, test i ten raport).

Nietknięte (wg zakazów dispatchu): `gra/data/**`, `gra/src/game/**` (w tym combat.ts, unit-power.ts, auto-battle-power.ts), WERSJE.md, gra-robocza/, rust-port/. `git diff --stat` pokazuje wyłącznie pliki z allowlisty.

## (1) Inwentarz odczytów kolumn PL dla statystyk bojowych

Grep po `gra/src` (bez `game/`, bez `data/`):

| Plik:linia (stan przed zmianą) | Odczyt | Decyzja |
|---|---|---|
| gra/src/ui/entityCards/unitAdapter.ts:239–243 | `unit.Atak`, `Obrona`, `Health`, `Pancerz`, `Przebicie` | ZMIENIONE: wyświetlanie statystyk, przejście na silnik |
| gra/src/ui/entityCards/unitAdapter.ts:252–253 | `unit['Atak dystansowy']`, `unit.Uderzenie` | ZMIENIONE (missileAttack / weaponDamage) |
| gra/src/ui/unitInfoCard.ts:291,292,293,297,298 | `unit.Atak`, `Obrona`, `Health`, `Pancerz`, `Przebicie` | ZMIENIONE |
| gra/src/ui/unitInfoCard.ts:296 | `unit['Atak dystansowy']` | ZMIENIONE |
| gra/src/ui/cityPanel.ts:8208–8215 | `u.Atak`, `Obrona`, `Uderzenie`, `Pancerz`, `Przebicie`, `Atak dystansowy`, `Health` | ZMIENIONE (blok „Walka" karty jednostki w mieście) |
| gra/src/main.ts:18944–18946 | `def['chargeBonus'] ?? def['Uderzenie']`, `armor ?? Pancerz`, `piercing ?? Przebicie` | ZOSTAWIONE: już EN-first, z fallbackiem PL; zgodne z silnikiem; poza allowlistą (main.ts) |
| gra/src/main.ts:34547 | `def['health'] ?? def['Health']` | ZOSTAWIONE: EN-first, zgodne z silnikiem |
| gra/src/main.ts:34592 | `armor ?? Pancerz` | ZOSTAWIONE: EN-first |
| gra/src/battle/battleScene.ts:1406, 1426, 4248 | `missileAttack ?? 'Atak dystansowy'`, `Health ?? health` | ZOSTAWIONE: EN-first, to logika bitwy, nie karta |
| gra/src/battle/testBattle.ts:314 | `health ?? Health` | ZOSTAWIONE: logika testowego pola bitwy |
| gra/src/oblezenie/main.ts:38–39 | `health ?? Health`, `meleeAttack ?? Atak` | ZOSTAWIONE: narzędzie debugowe, EN-first |
| gra/src/ui/unitInfoCard.ts, unitAdapter.ts: `Ruch`, `Zasięg ataku (hex)`, `Ilość pocisków`, `Widok pola`, `Ruch w bitwie (heksy)` | pola bez odpowiednika EN w units.json | ZOSTAWIONE: brak pary EN, a silnik też czyta je z PL (combatUnitFromDef). Nie są statystykami bojowymi w sensie dispatchu |

Uwaga do inwentarza: `gra/src/game/unit-card-stats.ts` i `unitCardCombatDisplay` (bonusy budynków i weterana) już istnieją i są w `main.ts::unitCardCombatFor`. Ten temat ich nie rusza. Karty pokazują wartości BAZOWE silnika (bez mnożników budynków i weterana), tak jak wcześniej.

## (2) Wspólny odczyt

`unitEngineStats` korzysta z `combatUnitFromDef` — tych samych pól i domyślnych co `combatUnitFromDef` (health domyślnie 30 itd.). Nie ma kopii mapowania w UI. Wszystkie 75 jednostek w units.json ma pola EN (`meleeAttack` itd.), więc fallbacki PL nie są wywoływane dla meleeAttack/meleeDefence/health.

Przykład (z units.json): Wojownik — karta pokazuje Atak 4, Obrona 4, HP 22, Pancerz 2 (silnik). Wcześniej karta pokazywała 6/6/60/4 (PL).

## (3) Testy

- `npx tsc --noEmit` (gra/): exit 0 (sprawdzone dwukrotnie, po wszystkich edycjach).
- `node gra/tools/unit-card-stats-engine-canon-test.cjs`: PASS (exit 0). Sprawdza: 75/75 jednostek, karta = `combatUnitFromDef`; Wojownik 4/4/22/2; brak odczytów PL dla statystyk bojowych w trzech plikach UI.
- Czerwony na bazie: na b3e74f414 nie istnieje `src/ui/unitEngineStats.ts`, więc test pada na bundlingu. Dodatkowo asercja „brak odczytów PL" pada na liniach 239–243, 252–253 (unitAdapter), 291–298 (unitInfoCard) i 8208–8215 (cityPanel). Nie zmierzono osobnym przebiegiem na bazie (NIE_ZMIERZONO w pełnym mutacyjnym sensie — dispatch prosi o „dowód mutacyjny"; wykonany jest dowód przez inspekcję linii, nie przez mutację kodu).
- `unit-detail-card-entitycard-migration-test.cjs`: 40 pass / 0 fail (exit 0).
- Pozostałe testy kart jednostek z katalogu (uruchomione, wszystkie exit 0): unit-card-3d-preview-coverage-test, unit-card-ranged-mult-test, unit-context-card-test, unit-detail-card-hover-layout-real-render-test, unit-info-card-army-interaction-test, unit-info-card-badges-real-render-test, unit-info-card-contract-test, unit-info-card-entitycard-migration-test, unit-info-card-viewport-height-real-render-test, unit-info-card-wiring-test, entity-cards-resource-icons(-real-render)-test, entity-cards-yield-icons(-real-render)-test.
- `git diff --check`: czysty (exit 0).
- 5 bramek referencyjnych z R-PROC-AUTOBOT §Bramki: NIE_ZMIERZONO w tej rundzie. Operator uruchomił tylko testy kart jednostek. Evaluator/FC powinni uruchomić pełny zestaw.
- Weryfikacja w Chromium (krok 4 dispatchu): NIE_ZMIERZONO. Brak przeglądarki w tej sesji i brak czasu na zrzut. Do zrobienia przez Evaluator/FC przed deployem.

## (4) Build i artefakty

- Build nie był uruchamiany (zakaz `npm run build` w gra/). tsc wystarczył do typów.
- Testy wygenerowały zmiany w PNG w `dyspozycje/autobot/runs/R-CIVPEDIA-KARTY-SPOJNOSC-Q1-B/dowody/` (test migracji je nadpisuje). Przywrócone `git checkout`, nie są w commicie.
- `node_modules` w gra/ zainstalowany przez `npm ci` w worktree (nieśledzony). Do sprzątania po integracji.

## BLOKADY

- Brak weryfikacji wizualnej (krok 4): NIE_ZMIERZONO.
- Bundle wiki/Civpedia: NIE sprawdzono, czy `wikiBundle` zawiera te same pola PL (unitAdapter jest współdzielony). Generatora nie zmieniano. Jeśli wiki generuje tekst z kolumn PL, to osobny temat dla orkiestratora (w UWAGACH).

## UWAGI-DLA-ORKIESTRATORA

1. Zmiana znaczenia etykiety „Obrażenia broni": wcześniej PL `Uderzenie` (4 dla Wojownika, zgodne z `weaponDamage` = 4), teraz `weaponDamage`. Dla części jednostek PL `Uderzenie` i EN `weaponDamage` mogą się różnić, bo `Uderzenie` jest też fallbackiem `chargeBonus` w silniku. Evaluator powinien sprawdzić, czy właściciel chce etykietę „Obrażenia broni" = `weaponDamage` (zgodnie z silnikiem: `weaponDamage`). Rozbieżność z `chargeBonus`/„Bonus szarży" nie była w zakresie.
2. „Atak dystansowy" ukrywany gdy silnikowy `missileAttack` = 0. Wcześniej ukrywany był pusty PL. Efekt: jednostki bez strzelania nie pokażą wiersza 0.
3. Test migracji (`unit-detail-card-entitycard-migration-test.cjs`) zmieniony w 3 asercjach. Wymaga akceptacji Evaluatora (dispatch to dopuszcza: „zaktualizuj asercje do wartości silnika i uzasadnij").
4. Znalezisko poza zakresem: `gra/tools/unit-card-ranged-mult-test.cjs` oraz `unitCardCombatDisplay` (bazy z `Number(unit.meleeAttack)`) używają już EN, więc nie wymagały zmian. Nie zgłaszam tematu.
5. Nie zakładałem sesji ani zadań (zakaz dispatchu respektowany).

## RUNDY

1/5

## NASTĘPNY KROK

Evaluator (SONNET): przegląd diffu (4 pliki + 2 nowe), uruchomienie 5 bramek referencyjnych, weryfikacja w Chromium karty Wojownika (4/4/22/2), decyzja o etykiecie „Obrażenia broni" (uwaga 1), potem Final Control.

## DEPLOY/PUSH: NIE WYKONANO
