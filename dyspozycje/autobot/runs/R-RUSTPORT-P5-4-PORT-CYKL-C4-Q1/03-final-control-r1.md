STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P5-4-PORT-CYKL-C4-Q1
GOAL: Przeniesienie całego cyklu C4 do `src-tauri/frontend-v2/src/ui/` naraz: 7 modułów `entityCards/*`, `sciencePicker.ts`, `scienceHubHud.ts` i `techDiscoveryNotice.ts`. Panele dostają DTO i kontroler MOCK, a harness porównuje DOM z pinem `edb8fb56`.
ROLA: Final Control (Opus 5.5 medium), runda 1/5.

## Co oceniam

- Commit Operatora `b25bd132` (rodzic `9ec9c9d8`) i commit Evaluatora `ffd10720` (rodzic `b25bd132`, tylko `02-evaluator-r1.md`).
- Obrony nie było, bo Evaluator nie zgłosił zarzutów. Dlatego nie ma commita Obrony do odtworzenia.
- `9ec9c9d8` jest przodkiem `origin/rust-port/parity-v2` @ `b2feab36`. Commity `5fa6ec71` i `b2feab36` (P6.1) nie zmieniają `src-tauri/frontend-v2/**` ani plików P5-4: `git diff --name-only 9ec9c9d8 origin/rust-port/parity-v2 | grep -E 'frontend-v2|P5-4'` daje 0 linii.

## Bramy powtórzone samodzielnie

Środowisko: `git archive ffd10720 src-tauri/frontend-v2` i `git archive edb8fb56 gra/src gra/data`, oba rozpakowane do scratchpadu. Pin czytany tylko jako katalog roboczy.

| Bramka | Wynik |
|---|---|
| `npm ci` | EXIT=0 |
| `npx tsc --noEmit` | EXIT=0 |
| `npm run check`: self-test | 33 pozytywne, 15 negatywnych, 0 błędów |
| `npm run check`: brama importów | 95 plików, 0 trafień |
| `npm run check`: `verify-pin-copies` | 413 plików, 0 niezgodnych; razem EXIT=0 |
| `npx vite build` | EXIT=0 |
| sha256 kopii vs pin, liczone niezależnie od manifestu | `renderer.ts` `4447902a1d4c976a…` i `wonderAdapter.ts` `a2fe269f16bacf33…`: pin = kopia v2 = wpis w `pin-manifest.json` |
| Harness C4 (`run-c4.mjs`) | 10 modułów, 1649 przypadków, 0 różnic, EXIT=0 |
| `mutate-c4.mjs` | 20 mutacji, 0 niewykrytych, EXIT=0 |
| Regresja P5.2 (`run.mjs`) | 3861 przypadków / 0 różnic, EXIT=0 |
| Regresja P5.3 (`run-level1a.mjs`) | 3618 przypadków / 0 różnic, EXIT=0 |
| Mutacja FC 1: `improvementAdapter.ts:92` `'Handel'`→`'Handle'` | EXIT=1, wykryta |
| Mutacja FC 2: `technologyAdapter.ts:133` `===`→`!==` (filtr budynków technologii) | EXIT=1, wykryta |
| Po przywróceniu plików z kopii | EXIT=0 |
| Allowlista `9ec9c9d8..ffd10720` | 0 plików poza nią |
| `package-lock.json` | bez zmian |
| `git diff --check` | czysty |

Harness zgłasza też 75 błędów jsdom `getContext`. Pochodzą tylko z miniatury WebGL po stronie pinu (D-UI-3), a zrzut DOM jest robiony przed rAF. To zgadza się z raportem Operatora.

## Orzeczenia

Evaluator nie zgłosił zarzutów, tylko 3 uwagi. Każdą rozpatruję jak zarzut:

1. **P5.4-Z3: brak haka `getResearchView`, więc koszt jest bazowy.** **ODDAL.** Założenie jest jawnie zapisane (`P5-4-PORT-CYKL-C4.md:198`). Zgodnie z P5-0 Z3 nie ma trybu „panel bez silnika”, a w grze DTO zawsze dostarcza Rust. Gdyby UI odtwarzało `scaledResearchCost`, naruszałoby regułę „reguły gry tylko w DTO”. Ścieżka zostaje NIE_ZMIERZONO, do sprawdzenia przy podpięciu komend Rust.
2. **Z4-4: `techTerrainUnlockLabels` dubluje `ResearchViewDto.techs[].terrainUnlockLabels`.** **ODDAL.** To porządek kontraktu, nie błąd: dane są statyczne i trafiają do katalogu zgodnie z D-UI-4. Do rozstrzygnięcia przy rewizji P5-0 (jedno źródło).
3. **Rozmyte dopasowanie prereq w `sciencePicker.ts:192-217`.** **ODDAL.** Kod jest skopiowany bez zmian i oznaczony GRANICZNY w przeglądzie ręcznym. Harness pokazuje 258 przypadków `sciencePicker` z 0 różnic. Zgodność parsera Rust zostaje NIE_ZMIERZONO i należy do tematu komend Rust (P6).

Agregat: 0 × NAPRAW, 3 × ODDAL, 0 × DO DECYZJI CZŁOWIEKA, więc **PASS**.

## Integracja (dla orkiestratora)

Kolejność cherry-pick na `origin/rust-port/parity-v2` @ `b2feab36` (konfliktów nie przewiduję, bo pliki są rozłączne z P6.1):

1. `b25bd132` (Operator)
2. `ffd10720` (Evaluator)
3. commit tego raportu FC

Albo merge łańcucha, którego końcem jest commit FC.

BLOKADY: brak.
NIE_ZMIERZONO (bez zmian względem Operatora): realny WebView/Tauri, komendy Rust dostarczające nowe DTO, miniatura po rAF, Escape, kliknięcie poza panelem, DnD planu badań, `_legacyShowTechDiscoveryNotice`.
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora, potem READY_FOR_DEPLOY (wystawia orkiestrator).
DEPLOY/PUSH: NIE WYKONANO
