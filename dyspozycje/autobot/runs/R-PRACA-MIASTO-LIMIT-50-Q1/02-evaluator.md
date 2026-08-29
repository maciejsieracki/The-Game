# 02-evaluator — R-PRACA-MIASTO-LIMIT-50-Q1

STATUS: PASS-WITH-NOTES
TEMAT: R-PRACA-MIASTO-LIMIT-50-Q1
GOAL: Lokalny podział Pracy w mieście respektuje kontrakt: budynki 50–100%, ulepszenia maksymalnie 50%, z komplementem Budynki = 100% − Ulepszenia; wspólnie dla gracza i AI, z override per miasto i migracją starego save.

## Baza i izolacja

- Checkout: `Civ-clean-main-2026-08-20`.
- `README.md`: obecny i potwierdzony.
- HEAD: `47cdca15757efb89d5e634e9e9ddff370925708d` (`47cdca15`).
- FALA 300: obecna w `dyspozycje/WERSJE.md`, `ROBOCZA`, md5/stempel `47149d70`, `VERIFY OK`.
- Sprawdzenia Git wykonywane lokalnie z `git -c safe.directory=<ścieżka>`.
- Nie wykonano integracji, commita, deployu ani pushu.

## ZMIANY/COMMIT

- Allowlista z `00-dispatch.md`: `gra/src/game/cities.ts`, `gra/src/game/empire-city-defaults.ts`, `gra/src/game/ai.ts`, `gra/src/ui/cityPanel.ts`, celowane testy w `gra/tools/` oraz artefakty runu. `buildModeHud.ts` i `turn-economy.ts` są w allowliście kontrolnej, ale pozostają poza zmianą zgodnie z reconem.
- Faktyczny tematowy diff potwierdzony w czterech plikach implementacji oraz w `empire-city-defaults-test.cjs`, `praca-split-ui-test.cjs` i nowym `praca-miasto-limit-50-test.cjs`.
- `gra/src/ui/buildModeHud.ts` i `gra/src/game/turn-economy.ts`: brak diffu. To właściwe: lokalny suwak jest w `cityPanel.ts`; `buildModeHud.ts` ma odrębny historyczny automat `pracaAutoPercent` (0–100%) oraz osobny nadrzędny split, nie lokalny suwak miasta.
- Worktree jest współdzielony i niecommitowany. `cityPanel.ts` zawiera również niezależny diff rekrutacyjny z `R-REKRUTACJA-SUROWIEC-BEZ-UPKEEP-Q1`; `empireDetailPanel.ts` jest zmieniony przez sąsiedni `R-PRACA-JEDEN-SUWAK-UI-Q1`. Te hunki nie są zmianą tego tematu i nie zostały przypisane do niego.
- Brak commita.

## Rekon implementacji

- `cities.ts`: `clampPodzialPracyBudynkiPercent()` wymusza `[50,100]`, zaokrągla wartości skończone i dla brakujących/niepoprawnych danych wraca do legalnego defaultu. `ensureCityPodzialDefaults()` normalizuje zapis miasta.
- `cityPanel.ts`: `readPodzialPracy()` clampuje hook, pole zapisane i fallback; lokalny input ma `min=50`, `max=100`, a event ponownie clampuje wartość przed callbackiem. `cityPracaSplit()` wylicza `pctUlepszenia = 100 - pctBudynki`, a `splitPraca()` zachowuje remainder (`doPuli = total - doBudynkow`). Gracz ma suwak; miasto rywala jest tylko do podglądu.
- `empire-city-defaults.ts`: resolver clampuje zarówno globalny default, jak i lokalny override; override ma pierwszeństwo i pozostaje niezależny od zmiany globalnej. Migracja normalizuje stare per-city wartości i zachowuje rozróżnienie override.
- `ai.ts`: early/mid target to 50% budynków; korekty pokojowe nie schodzą poniżej 50%; finalny clamp zabezpiecza wszystkie gałęzie, w tym wojnę i nietypowe wejście.
- Silnik: `turn-economy.ts` używa `econCity.podziałPracy`, zasilanego przez resolver, zarówno w preview, jak i w ticku końca tury. Nie znaleziono drugiej lokalnej ścieżki UI pozwalającej efektywnie skierować ponad 50% do ulepszeń.
- Load: `main.ts` wywołuje `ensureCitySaveDefaults()` dla miast przy wczytywaniu, a następnie `migratePodzialPracyOnLoad()`; stare wartości 0–49 są więc normalizowane przed użyciem. `savedDefaults` również są clampowane.

## Granice i parytet

- 0% budynków → 50% budynków / 50% ulepszeń po clampie.
- 50% budynków → 50% ulepszeń, czyli cap.
- 100% budynków → 0% ulepszeń.
- W każdym przypadku suma wynosi 100%; dla małych pul remainder zachowuje całość bez utraty jednostek.
- Gracz: UI + callback + resolver + silnik.
- AI: decyzja suwaka + zapis owner default/per-city + resolver.
- Override per miasto: lokalna wartość przeżywa zmianę globalnego defaultu, ale nadal podlega capowi.
- Stare save: `ensureCitySaveDefaults` i migracja clampują wartości oraz zachowują flagę/rozróżnienie override.

## TESTY

- `node gra/tools/praca-miasto-limit-50-test.cjs`: **4/4 PASS**.
- `node gra/tools/empire-city-defaults-test.cjs`: **49/49 PASS**.
- `node gra/tools/ai-slider-test.cjs`: **38/38 PASS**.
- `node gra/tools/production-overflow-test.cjs`: **51/51 PASS**.
- `node gra/tools/praca-split-ui-test.cjs`: **13/13 PASS**.
- TypeScript: `node gra/node_modules/typescript/bin/tsc -p gra/tsconfig.json --noEmit`: **PASS, exit 0**. `tsc` nie jest dostępny w PATH, ale kompilator projektowy istnieje lokalnie. To rozdziela brak globalnego/PATH kompilatora od pozytywnego lokalnego typechecku; `npx --no-install tsc` nie jest dowodem, bo próbuje rozwiązać pakiet `tsc` przez npm.
- `git diff --check`: **PASS**.

## BLOKADY

- Brak blokady implementacyjnej dla tego tematu.
- Nota procesowa: worktree zawiera równoległe, niecommitowane zmiany kilku tematów; atrybucja hunks opiera się na diffie i dyspozycjach runów, nie na commitach.
- Worktree jest współdzielony i zawiera obce, niecommitowane zmiany; przed integracją trzeba ponownie wykonać atrybucję allowlisty na rozdzielonym diffie.

## NASTĘPNY KROK

ROUTING: `Evaluator PASS-WITH-NOTES → Final Control` dla tego samego ID; bez integracji, commita, deployu i pushu.

`Evaluator PASS-WITH-NOTES → Final Control dla tego samego ID`. Final Control ma sprawdzić kompletność śladu, ponowić testy z dokładnymi komendami powyżej i potwierdzić izolację od obcych zmian. Integracja dopiero po pozytywnym Final Control.

## DEPLOY/PUSH

NIE WYKONANO.
