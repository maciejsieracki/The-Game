STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-MEMORY-LEAKS-FIX-Q1
GOAL: Obrona Operatora wobec zarzutów Evaluatora (`02-evaluator.md`, commit `3651e388`) do commita Operatora `50f95eca` (pin `edb8fb56`).
ZMIANY/COMMIT: tylko dokumenty w `dyspozycje/autobot/runs/R-WEB-MEMORY-LEAKS-FIX-Q1/`: §7 w `01-operator.md` (instrukcja dla właściciela), ten plik i trzy pliki z surowymi wyjściami bramek `03-obrona-bramki-*.txt`. Zero zmian w `gra/**`. Commit na `3651e388`.
TESTY: §2
BLOKADY: brak
RUNDY: 1/5 (obrona w ramach rundy 1)
NASTĘPNY KROK: Final Control (Opus 5.5 medium)
DEPLOY/PUSH: NIE WYKONANO

Wpływ na wydajność: `NIE_ZMIERZONO` (brak profilera i przeglądarki).

## 1. Odpowiedzi na zarzuty

| # | Zarzut | Decyzja | Dowód / poprawka |
|---|---|---|---|
| 1 | Liczby referencyjne z dispatchu (mgla 42/42, map-field-battle 22) nie zgadzają się z pinem | **ODRZUCAM jako wadę pracy, PRZYJMUJĘ jako uwagę dla orkiestratora** | To stan bazy, nie skutek zmian. Na `cfc26c17` (obecny `origin/main`) bez moich zmian wynik jest taki sam: `mgla` 41/1 EXIT=1 (ten sam przypadek `battleScene.ts:7998-7999`), `map-field-battle` 24/0 (`03-obrona-bramki-cfc26c17-baseline.txt:573-574, 687-688`). Rozjazd był już zgłoszony (`01-operator.md` §4, §5 U1). |
| 2 | Krok 12 (`BattleScene` w snapshocie) działa tylko bez minifikacji | **PRZYJMUJĘ** | `vite.config.ts` nie ustawia `keepNames`, więc `vite build` minifikuje nazwy klas. Poprawki w `01-operator.md` §7: krok 1 mówi teraz, które kroki działają w obu wersjach. Krok 12 podzieliłem: 12a (`BattleScene`, tylko `npm run dev` na komputerze właściciela) i 12b, który nie zależy od minifikacji. 12b porównuje przyrost `getEventListeners(document).click` i `getEventListeners(window).resize` przed bitwą i po niej. Te nasłuchiwacze są dodawane w `battleScene.ts:11929, 13263, 13524, 18107` (`edb8fb56`). |
| 3 | Krok 9 to przewidywanie; `perfDebug` loguje na starcie, a `memdebug` na końcu tury | **PRZYJMUJĘ** | Krok 9 nie zawiera już przewidywania. Krok 2 włącza teraz `?memdebug=1&perfDebug=1`. Krok 9 każe porównywać obie wersje wyłącznie po liniach `[perfDebug] EOT start`, bo to ten sam punkt pomiaru i ten sam kod (`main.ts:35864-35874` na `50f95eca`; `cfc26c17:main.ts:36110`). Dodałem też zastrzeżenie: porównuje się trend, nie pojedyncze wartości. |
| 4 | Przycinanie M2 w każdym `sync()` wymusza ponowne malowanie plakietki po hoverze | **ODRZUCAM jako wadę wymagającą zmiany** | 1) Hover idzie przez `syncStatChips` (`main.ts:26255-26261, 26332-26334`), a ta funkcja niczego nie przycina (`cities.ts:627-643`). Przycinają tylko `sync()` (`cities.ts:593`) i koniec tury. 2) Hover dotyczy naraz jednego miasta (`statChipHoverCityId`, `main.ts:2585`). Koszt jest więc ograniczony do najwyżej jednego dodatkowego malowania plakietki na wywołanie `sync()` lub na turę, nie zależy od liczby miast. 3) Wygląd się nie zmienia, bo ten sam klucz daje ten sam canvas (`cityMapStatChip.ts:1071-1079`). Koszt w ms: `NIE_ZMIERZONO`, ujawniony w `01-operator.md` §2. |
| 5 | Pin jest 3 commity za `origin/main`, a rebase nie był sprawdzony | **PRZYJMUJĘ, sprawdzone** | Na `cfc26c17` polecenie `git cherry-pick --no-commit 50f95eca` dało EXIT=0 (auto-merge `main.ts`, bez konfliktów). Hunki w `main.ts` trafiły w `@@ -134,0 +135` (import) i `@@ -36238,0 +36240,14` (`finally` końca tury). Drzewo po cherry-picku: `3f5c8f6a`. Bramki przed i po, z pełnymi wyjściami: `03-obrona-bramki-cfc26c17-baseline.txt`, `03-obrona-bramki-cfc26c17-po.txt`. Wyniki są identyczne, a `tsc` daje EXIT=0. Cherry-pick był tylko weryfikacją; niczego nie zacommitowałem na `cfc26c17`, a worktree wrócił na `3651e388`. Integracja i tak powtarza bramki na swojej bazie. |
| 6 | U3 (wczytanie lub nowa gra bez `dispose()`) odłożone | **PRZYJMUJĘ jako uwagę** | Poza zakresem dispatchu (M1/M2/M3/M6). Wyciek następuje przy wczytaniu, nie co turę (`01-operator.md` §5 U3). Proponuję orkiestratorowi osobny temat. |

## 2. Bramki (pełne surowe wyjścia z `EXIT=` w plikach obok)

| Bramka | `cfc26c17` baseline | `cfc26c17` + `50f95eca` | ten commit (kod = `50f95eca`) |
|---|---|---|---|
| `npm ci` | EXIT=0 | EXIT=0 | EXIT=0 |
| `tsc --noEmit` | EXIT=0 | EXIT=0 | EXIT=0 |
| logic | 213/213 | 213/213 | 213/213 |
| tech-tree | 19/0 | 19/0 | 19/0 |
| research | 33/33 | 33/33 | 33/33 |
| unit-replace | 13/13 | 13/13 | 13/13 |
| combat | 6/6 | 6/6 | 6/6 |
| mgla | 41/1 EXIT=1 (pre-istniejące) | 41/1 EXIT=1 (ten sam przypadek, linie 8009-8010) | 41/1 EXIT=1 |
| entity-card | 75/0 | 75/0 | 75/0 |
| map-field-battle | 24/0 | 24/0 | 24/0 |

Pliki: `03-obrona-bramki-cfc26c17-baseline.txt`, `03-obrona-bramki-cfc26c17-po.txt`, `03-obrona-bramki-po.txt`. Nie uruchamiałem build/dev, vite, testów real-render/Chromium ani `unit-power-test`. Po pracy usunąłem `gra/node_modules`.
