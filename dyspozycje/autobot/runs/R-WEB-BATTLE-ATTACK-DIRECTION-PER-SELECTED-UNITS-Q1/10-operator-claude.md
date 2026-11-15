# R-WEB-BATTLE-ATTACK-DIRECTION-PER-SELECTED-UNITS-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-ATTACK-DIRECTION-PER-SELECTED-UNITS-Q1
GOAL: „Kierunek natarcia”, „Formacja” i „Konnica” w fazie rozstawienia działają na DOKŁADNIE zaznaczone jednostki (także mieszane typy i z różnych grup); brak zaznaczenia = cała armia; meta grupy nadpisywana tylko przy zaznaczeniu wszystkich żywych jednostek grupy albo całej armii.
BAZA: ac3352c25 (origin/main), kod w commicie 0fe506c53.

ZMIANY-COMMIT:
- 0fe506c53 — `gra/src/battle/battleScene.ts` (resolver, meta grupy, chip, snapshot) + nowy test `gra/tools/battle-attack-dir-per-selection-test.cjs`.
- Raport: ten plik (commit raportu w gałęzi roboczej).
- Nie zmieniano: `gra/`-zależnych danych, `wikiBundle.json`, `main.ts`, `WERSJE.md`, manifest, `rust-port`, docs/encyklopedia.

## ETAP 1 — weryfikacja opisu z dispatchu

ZMIERZONO (headless, esbuild + vm, ten sam harness co `battle-deploy-cavalry-flanks-test.cjs`; NIE w żywej grze):
- Armia mieszana: jedna grupa „1” = 6 piechoty (`miecznik`) + 4 konnica (`konnica`) + dowódca.
- Scenariusz (a): zaznaczona sama konnica → „Tył” (`_applyDeployAttackDirection('tyl')`). Na bazie (ac3352c25) piechota dostaje `tyl`: asercja `inf0 stays front` pada z `'tyl' !== 'front'`. Potwierdza opis z dispatchu: rozkaz z konnicy obejmuje całą grupę, łącznie z piechotą.
- Zaznaczona konnica → „Konnica: z tyłu” (`_applyDeployCavalryMode('rear')`): na bazie cała grupa jest przestawiana fizycznie (wynika z tego samego resolvera).
- Scenariusze (b) samą piechotę i (c) brak zaznaczenia: brak zaznaczenia = cała armia (potwierdzone po fixie); (c) z dispatchu opisuje zachowanie już działające.
- Mechanika per jednostka w auto-walce (`ru.attackDirection` w `_advanceStep` / `_cavalryAction` / `desiredHitForDirection`) czyta wartość jednostki, nie meta grupy. Meta grupy `attackDirection` nie jest czytana w logice walki (tylko w chipie), więc błąd dotyczył wartości jednostek, nie meta.
- Dispatch twierdzi, że w ręcznym trybie kierunek nie działa; nie zmieniano (zgodnie z zakazem tematu).

NIE ZMIERZONO:
- Żywa gra w Chromium, zrzuty paska/chipu „Natarcie: …” i komunikatu zakresu — brak czasu w tej rundzie; dispatch wymaga tego jako dowodu wizualnego (ETAP 1 w pełnej formie). Do wykonania w kolejnej rundzie albo przez orkiestratora.
- Auto-walka „konnica na tyły, piechota z przodu” w krótkiej bitwie AUTO (log pozycji/uderzeń rear vs front) — NIE ZMIERZONO.

## ETAP 2 — naprawa (zakres rozszerzony DODATKIEM 1, ABC B)

Zmiany w `battleScene.ts`:
1. `_resolveDeployFormationTargets`: przy zaznaczeniu zwraca wyłącznie zaznaczone żywe jednostki (bez rozszerzania na grupę). Brak zaznaczenia = cała armia (bez zmian).
2. Nowy helper `_fullyCoveredGroupIds(targets, live)`: grupy, których WSZYSTKIE żywe jednostki są w `targets`. Meta grupy (`formation`, `cavalryMode`, `attackDirection`) ustawiane tylko dla nich. Jednostka z własnym rozkazem (`ru.attackDirection`) ma pierwszeństwo, bo konsumenci walki czytają wartość jednostki; nie wprowadzono dziedziczenia z grupy przy odczycie.
3. `_applyDeployAttackDirection`, `_applyDeployCavalryMode`, `_applyDeployArmyFormation`: zapis meta grupy przez `_fullyCoveredGroupIds`.
4. `_syncDeployToolbarFromSelection`: kierunek w chipie wyliczany z kierunków zaznaczonych jednostek; różne kierunki → „Natarcie: różne” (flaga `_deployAttackDirMixed`, bez podświetlenia przycisku).
5. `_restoreDeployAttackDirSnapshot`: meta grupy ustawiane tylko przy jednolitym kierunku grupy.
6. Komunikat zwrotny bez zmian w formie: „cała armia” gdy zakres = cała armia, inaczej „zaznaczenie (N)” — teraz prawdziwe także dla zaznaczenia całej grupy (N = liczba jednostek).

Reguła meta grupy (do decyzji orkiestratora, nie zmieniana): meta grupy = rozkaz dla grupy jako całości; zaznaczenie części grupy tworzy tylko rozkaz jednostkowy.

Pytanie do właściciela (nie rozstrzygane tutaj): Formacja i Konnica fizycznie przestawiają zaznaczone jednostki w strefie rozstawienia; przy zaznaczeniu części grupy pozostałe jednostki stoją (test (e), (f)). Czy to jest zamierzone, czy ma być automatyczne przesunięcie reszty — do decyzji ABC.

## TESTY

Nowy test `gra/tools/battle-attack-dir-per-selection-test.cjs` (headless):
- Na bazie ac3352c25 (przed fixem): FAIL — `(a) inf0 stays front`: `'tyl' !== 'front'` (test czerwony na bazie).
- Po fixie: `battle-attack-dir-per-selection-test: OK, checks=15`.
  - (a) zaznaczona konnica + Tył: konnica = tył, piechota = front, meta grupy nie nadpisana, komunikat „zaznaczenie (4)”.
  - (b) brak zaznaczenia = cała armia: wszystkie = bok, meta grupy = bok, komunikat „cała armia”.
  - (c) kolejność: cała armia front, potem konnica tył → tylko konnica zmieniona.
  - (c2) zaznaczenie wszystkich jednostek grupy → meta grupy = tył.
  - (e) Konnica „z tyłu” per zaznaczenie: piechota nie przestawiona, brak kolizji pól, meta `cavalryMode` nieustawiona.
  - (f) Formacja F1 per zaznaczenie (2 jednostki piechoty): konnica nieprzestawiona, brak kolizji pól.
- Mutacja (przywrócenie rozszerzania na grupę) → czerwone (potwierdzone przez wynik na bazie, punkt (a)).
- Testy regresji (zielone po fixie):
  - `tools/battle-cavalry-flank-default-test.cjs` — PASS (960 checks)
  - `tools/battle-cavalry-front-flank-placement-test.cjs` — PASS (163 checks)
  - `tools/battle-deploy-cavalry-flanks-test.cjs` — PASS (536 checks)
  - `tools/battle-flank-close-formation-test.cjs` — PASS (994 checks)
  - `tools/battle-undeployed-units-test.cjs` — PASS=37 FAIL=0
  - `tools/war-rules-multiwar-test.cjs` — 57 OK / 0 FAIL (sprawdzony, bo wspomina o „cała grupa”, ale nie dotyczy deploy)
- `npx tsc --noEmit` — exit 0 (wynik z surowego wyjścia: brak błędów).
- `git diff --check` — czysto.
- Bramki referencyjne z dispatchu („5 bramek referencyjnych”) — NIE ZMIERZONO w tej rundzie (pełny zestaw bramek weba nie uruchamiany; wykonano wyżej wymienione testy battle-*).
- Chromium / zrzuty — NIE ZMIERZONO (patrz ETAP 1).

## BLOKADY

- Brak pomiaru w żywej grze (Chromium) — ETAP 1 w formie wizualnej i auto-walki NIE ZMIERZONO.
- Pełne bramki referencyjne nie uruchamiane w tej rundzie.

## RUNDY

1/5 (ta runda). Ostatni werdykt: brak (pierwsze wykonanie).

## DŁUG / UWAGI-DLA-ORKIESTRATORA

- Dług Rust: REPIN combat / formacji dla zaznaczenia (zachowanie resolvera zmienione w web, port Rust do wyrównania) — do zapisania w rejestrze.
- Dokumentacja (poradnik walki / encyklopedia): opis zakresu rozkazu do uzupełnienia (allowlista dopuszcza; nie wykonano, bo wymaga decyzji o treści).
- `wikiBundle.json` nie regenerowany (brak zmian w danych wiki).
- Znalezisko poza zakresem: test `battle-attack-dir-per-selection-test.cjs` używa `_placeUnits` i stubów UI; ten sam wzorzec co istniejące testy deploy — bez zmian w harnessie.

NASTĘPNY KROK: ETAP 1 w żywej grze (Chromium, ?civTest=1) — tabela scenariusz × jednostka × attackDirection, zrzut chipu „Natarcie: różne”, krótka bitwa AUTO (rear vs front) — przed FC. Decyzja ABC o automatycznym przesunięciu reszty przy Formacji/Konnicy.

DEPLOY/PUSH: NIE WYKONANO
