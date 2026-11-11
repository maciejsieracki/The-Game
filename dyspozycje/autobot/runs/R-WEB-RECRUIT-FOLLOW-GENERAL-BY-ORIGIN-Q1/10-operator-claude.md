# R-WEB-RECRUIT-FOLLOW-GENERAL-BY-ORIGIN-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-RECRUIT-FOLLOW-GENERAL-BY-ORIGIN-Q1
GOAL: „Idź do wodza” zapisywane przy zamówieniu rekrutacji. Zamówienie bezpośrednio w mieście domyślnie OFF, niezależnie od globalnego przełącznika. Zamówienie z menu Armia lub panelu Rekrutacja dziedziczy globalny przełącznik. Intencja trwa w kolejce do zrodzenia. Brak zmian w istniejących jednostkach, ręcznych rozkazach, AI i walce.
BAZA: adb5c1653 (origin/main), start `git checkout --detach adb5c1653`.

## ZMIANY / COMMIT

Kod: **e758eba8f** (ancestor adb5c1653 potwierdzony `git merge-base --is-ancestor`; `git diff --stat adb5c1653 e758eba8f`: 5 plików, +130 / −20).

- `gra/src/game/production.ts` — pole `ProductionItem.followGeneral?: boolean`; typ `RecruitOrigin = 'city' | 'army'`; czyste funkcje `recruitFollowGeneralForOrder(origin, globalToggle)` i `resolveRecruitFollowGeneral(item, globalToggle)`.
- `gra/src/main.ts`:
  - `purchaseRecruitmentUnit` przyjmuje `opts.origin` (domyślnie `'city'`) i zapisuje intencję w każdej sztuce zamówienia, tylko dla `ownerId === 0`. Rekurencja bramki generała przekazuje `origin`.
  - `purchaseRecruitmentUnits` (partia) zapisuje intencję `'army'`.
  - Panel imperium (`purchase` w `executeEmpireRecruitment`) podaje `origin: 'army'`.
  - Callbacki `onPurchaseUnit` / `onPurchaseGeneral` przyjmują i przekazują `origin`.
  - Spawn z kolejki rekrutacji: `followGeneral: resolveRecruitFollowGeneral(rec, recruitFollowGeneralDefault)`.
  - Spawn z kolejki produkcji miasta (ścieżka legacy, bo nowe jednostki nie wchodzą tam od czasu bramek Pracy): `recruitFollowGeneralForOrder('city', …)`, czyli OFF.
- `gra/src/ui/cityPanel.ts` — `recruitUnit(…, origin)`; karty w Armii i partia Armii przekazują `'army'`; karty w panelu miasta przekazują `'city'`; karta generała w Armii przekazuje `'army'`.
- `gra/tools/recruit-follow-general-origin-test.cjs` — nowy test, 20 asercji (patrz TESTY).
- `gra/tools/general-capital-recruitment-order-test.cjs` — regex kontraktu `onRecruit → cfg.onPurchaseGeneral` przyjmuje opcjonalny argument `'army'`. Zmiana wynika z zamierzonego kontraktu tego tematu.

Commit raportu: osobny commit tylko z plikiem raportu (patrz SHA w polu `sha` odpowiedzi orkiestratora).

## ZAŁOŻENIA (luki rozstrzygnięte założeniem)

1. **Origin Armii/Rekrutacji = `'army'`**: obejmuje karty „Armia” (`renderPurchasableUnits` z `armyBatch`, partia `recruitUnit(…, false, 'army')`), kartę generała w Armii i panel imperium (`mountCityRecruitment`, `purchase`). Origin miasta = `'city'`: karty w panelu miasta.
2. **Intencja zapisywana w momencie zamówienia**, nie w momencie zrodzenia. Późniejsza zmiana globalnego przełącznika nie zmienia już zamówionych jednostek. Zgodne z „intencja utrwalona w kolejce”.
3. **Legacy (brak pola `followGeneral` w zapisanym elemencie kolejki)**: fallback na bieżący globalny przełącznik. Zachowuje dotychczasowe zachowanie starych zapisów. Alternatywa „OFF” byłaby zmianą wyniku dla już zamówionych sztuk. Wybrano przełącznik.
4. **Ścieżka kolejki produkcji miasta (`applyProductionCompleted`)**: origin `'city'`, czyli OFF dla gracza. Ścieżka jest w praktyce martwa dla nowych zamówień (`enqueue` odrzuca `kind !== 'budynek'`, a `stripLegacyUnitsFromPracaQueue` czyści stare jednostki), więc zmiana nie wpływa na nowe ruchy gracza.
5. **Zapis**: `cityProd` jest zapisywany jako zwykły obiekt JSON (`save.ts:396`, `deserializeGame` przepuszcza `obj2.cityProd` bez filtrowania), więc pole przeżywa save/load bez zmiany schematu. Brak podbicia `SAVE_VERSION`.
6. **AI** (`ownerId !== 0`): pole `followGeneral` nie jest zapisywane i zachowanie AI nie zmienia się.
7. **Ręczne przełączniki po zrodzeniu** (`followGeneral` na jednostce, `main.ts` ~25658–25706) pozostają bez zmian.

## TESTY (surowe wyniki z wykonania w tej worktree)

- `node ./node_modules/typescript/bin/tsc --noEmit` → exit 0, brak błędów.
- `npx vite build --outDir <scratchpad>/vbuild-origin --emptyOutDir` → exit 0, `index.html 14,450.93 kB`, `✓ built in 25.74s`. Build poza repo, zgodnie z dispatchem. `npm run build` nie uruchamiano.
- `node tools/recruit-follow-general-origin-test.cjs` → **20 assertions passed**: 4 pochodzenia, 4 zrodzenia (w tym legacy), 2 kolejka (partia 3 mieszanych sztuk, zdjęcie z kolejki), 2 save/load (intencja zachowana, legacy bez pola), 8 kontraktowych regexów na main.ts/cityPanel.ts.
- `tools/recruit-rally-default-save-test.cjs` → `PASS save roundtrip preserves global default and per-unit overrides; legacy save omits them safely`.
- `tools/army-panel-recruit-rally-general-test.cjs` → **5 assertions passed**.
- `tools/army-panel-recruit-remove-test.cjs` → **21 passed, 0 failed**.
- `tools/super-unit-limit-one-test.cjs` → **40 OK, 0 FAIL**.
- `tools/army-stack-limit-test.cjs` → **51 asercji, wszystkie OK**.
- `tools/empire-mass-recruitment-test.cjs` → **45 passed, 0 failed**.
- `tools/empire-recruit-all-test.cjs` → **31 passed, 0 failed**.
- `tools/promote-to-front-test.cjs` → **129 passed, 0 failed**.
- `tools/general-capital-recruitment-order-test.cjs` → wszystkie asercje źródłowe PASS (po aktualizacji regexu, patrz ZMIANY). Część przeglądarkowa kończy się `ReferenceError: hexHasRoomFor is not defined` (**PRZED ZMIANĄ**: `git show adb5c1653:gra/src/main.ts` zawiera `hexHasRoomFor` w `purchaseRecruitmentUnit` na linii 4624, którą ten temat nie zmienia; ZAŁOŻENIE: harness nie dostarcza tej funkcji, więc błąd jest w bazie też — NIE ZMIERZONO na czystej bazie).
- `tools/recruitment-batch-contract-test.cjs` → `ReferenceError: hexHasRoomFor is not defined` w harnessie (ta sama przyczyna; wiersz kodu z `hexHasRoomFor` jest w bazie, a zmieniony tu nie jest).
- `tools/recruit-rally-default-ui-test.cjs` → błąd esbuild na importach `.css?raw` / `.svg` w `src/ui/brandTokenVars.ts` i `src/ui/icons/brandAssets.ts`. Te pliki nie są zmieniane w tym temacie (ZAŁOŻENIE: problem istnieje w bazie; NIE ZMIERZONO na czystej bazie).
- `tools/unit-replace-full-cost-test.cjs` → `39 passed, 1 failed`: „Taran okuty ma zamiennik Katapulta w Zelazie u 16/16 nacji”. Asercja dotyczy danych jednostek, których ten temat nie zmienia (ZAŁOŻENIE: błąd istnieje w bazie; NIE ZMIERZONO na czystej bazie).
- `git diff --check` → czysto.
- Uwaga procesowa: test `empire-recruit-all-test` zostawia w `gra/tools/` plik `.empire-recruit-all-bundle.js`. Usunięty przed commitem, nie został zacommitowany.

## BLOKADY

- **Weryfikacja w przeglądarce / na żywo: NIE ZMIERZONO.** Nie sprawdzono w grze, że zamówienie z miasta startuje z odznaczonym „Idź do wodza”, a z Armii z zaznaczonym (przy włączonym przełączniku). Wymóg realnej weryfikacji dotyczy tematów wizualnych; ten temat ma wpływ na UI, więc Evaluator/Final Control powinni to potwierdzić Chromium (maks. 2 procesy).
- Część przeglądarkowa `general-capital-recruitment-order-test` i `recruitment-batch-contract-test` nie działa w bazie (harness bez `hexHasRoomFor`). Nie naprawiano — poza zakresem.

## RUNDY

1/5 (Operator). Brak FAIL, brak poprawek po Evaluatorze.

## NASTĘPNY KROK

Evaluator (Luna high): ocena kodu i testów względem GOAL, sprawdzenie założeń 1–4, decyzja o weryfikacji na żywo (NIE ZMIERZONO). Potem Final Control, integracja przez orkiestratora. Operator nie integruje i nie pushuje.

DEPLOY/PUSH: NIE WYKONANO
