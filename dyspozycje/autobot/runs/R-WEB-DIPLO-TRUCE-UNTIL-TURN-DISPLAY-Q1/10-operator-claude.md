# R-WEB-DIPLO-TRUCE-UNTIL-TURN-DISPLAY-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-TRUCE-UNTIL-TURN-DISPLAY-Q1 (#306 / #319)
GOAL: w relacji dyplomacji, gdy rozejm jest aktywny, pokazać „Rozejm do tury N” (N z danych pary, nie stała). Bez rozejmu — brak napisu.
BAZA: origin/main 34584b4da266b93c9a30585d2001c563057ccc29 (checkout --detach)
ZMIANY/COMMIT: patrz sekcja „Commit” na końcu raportu.

## Zmiany (allowlista)

- `gra/src/game/diplomacy-display.ts` — nowa funkcja `truceUntilTurnLabelPl(truceUntilTurn, currentTurn)`: zwraca `'Rozejm do tury N'` gdy `isTruceActive(until, currentTurn)`, w przeciwnym razie `null`. Aktywność liczy istniejące `isTruceActive` z `diplomacy-peace-lock.ts` (bez zmiany reguł rozejmu). Dodany import `isTruceActive` (brak cyklu: peace-lock nie importuje diplomacy-display).
- `gra/src/ui/diplomacyAudience.ts` — `DiplomacyAudienceState` dostaje pola `truceUntilTurn?: number | null` i `currentTurn?: number`; `formalBannerHtml` dokleja napis jako pierwszą pozycję podpisu banera, tylko gdy rozejm aktywny i status formalny != wojna.
- `gra/tools/diplo-truce-until-turn-test.cjs` — NOWY test (RUNTIME przez esbuild + wiring przez źródło + mutant M1).

Logika rozejmu (`diplomacy.ts`, `diplomacy-peace-lock.ts`), JSON balansu, WERSJE.md, `gra-robocza/`, `rust-port/`: NIE ruszane.

## Ustalenia z kodu (gdzie jest koniec rozejmu i gdzie relacja pokazuje status)

- Koniec rozejmu: `DiploPairMeta.truceUntilTurn` (`gra/src/game/diplomacy-pn-engine.ts`), ustawiany w `gra/src/main.ts` ok. linii 12085–12091 przez `truceUntilTurnFor(turn, truceTurns)`. Status pary przy rozejmie = `'pokoj'`.
- Status pokazywany w relacji: `formalStatus` budowany w `main.ts` (getState audiencji, ok. linii 25640–25660) i renderowany przez `formalBannerHtml` w `diplomacyAudience.ts`. Przy rozejmie banner pokazuje „POKÓJ” (kontakt ustanowiony), bo rozejm nie ma osobnego kind.

## BLOKADA (wymaga decyzji orkiestratora): wiring w main.ts poza allowlistą

Napis NIE pojawi się jeszcze w grze. Dane `truceUntilTurn` i bieżąca tura są znane tylko w `main.ts` (getState audiencji), a `main.ts` nie jest na allowliście tego tematu. Brakujący krok to jedna linia w obiekcie zwracanym przez getState (`pairMeta` jest już w zasięgu, linia `const pairMeta = getDiploPairMeta(ME(), ownerId);`):

```ts
truceUntilTurn: pairMeta.truceUntilTurn ?? null,
currentTurn: turn,
```

Nie wprowadzałem tej zmiany samodzielnie (poza allowlistą). Propozycja: rozszerzyć allowlistę o `gra/src/main.ts` (jedna linia w getState) w rundzie 2, albo zaakceptować wiring jako osobny mini-temat.

## TESTY (surowe wyniki)

- `npx tsc --noEmit` (w `gra/`): exit 0, bez wyjścia (0 błędów).
- `node tools/logic-test.cjs`: `LOGIC OK (213/213)`, exit 0.
- `node tools/tech-tree-test.cjs`: `tech-tree-test: 20 pass, 0 fail`, exit 0.
- `node tools/research-test.cjs`: `PASSED: 33 / FAILED: 0 / TOTAL: 33` / `ALL GREEN`, exit 0.
- `node tools/unit-replace-test.cjs`: `WSZYSTKIE TESTY ZIELONE (21/21)`, exit 0.
- `node tools/combat-test.cjs`: `COMBAT TEST: 6/6 pass`, exit 0.
- `node tools/diplo-truce-until-turn-test.cjs`: `WYNIK: 13 PASS / 0 FAIL`, exit 0.
  - aktywny rozejm 5 tur od tury 12 → „Rozejm do tury 17”; 15 tur od tury 40 → „Rozejm do tury 55”;
  - brak pola (undefined/null), wygaśnięcie w turze N, tura > N, nieprawidłowa długość → brak napisu (null);
  - mutant M1 (zaszyte N=10): `M1 (stałe N=10) wykryte` — test czerwieni się dla N=17 (PASS na wykrycie mutanta, czyli test działa).
  - wiring: import, liczenie `truceLabel`, pominięcie dla wojny — PASS.
- `npm ci --ignore-scripts` wykonane w `gra/` (bez `npm run build/dev`).
- `git diff --check`: czysto.

Uwaga: test wiringu sprawdza źródło `diplomacyAudience.ts` (regex), nie render DOM — `formalBannerHtml` nie jest eksportowany. Render w przeglądarce: NIE_ZMIERZONO.

## BLOKADY

1. Wiring w `main.ts` (getState audiencji) poza allowlistą — napis w grze jeszcze niewidoczny (patrz wyżej).
2. Render w przeglądarce / zrzut: NIE_ZMIERZONO (brak Chromium w tej rundzie).

## Założenia (luki rozstrzygnięte założeniem)

- Z1: napis dokładany do podpisu banera (pierwsza pozycja, przed „obowiązuje od”), a nie jako osobny element. Tekst dokładnie „Rozejm do tury N”.
- Z2: napis pokazywany dla każdego statusu poza wojną, gdy rozejm aktywny (rozejm trzyma status „pokoj”, więc w praktyce pojawia się przy POKÓJ).
- Z3: granica wygaśnięcia = `currentTurn >= N` → brak napisu, zgodnie z `isTruceActive` (wyłącznie do N).

## RUNDY

1/5

## NASTĘPNY KROK

Orkiestrator: zdecydować o wiringu main.ts (jedna linia, patrz BLOKADY). Po wiringu: smoke w przeglądarce (relacja z aktywnym rozejmem) i bramki ponownie.

## Commit

Commit z kodem i raportem (tylko ścieżki allowlisty + raport). SHA podany w polu `sha` odpowiedzi strukturalnej.

DEPLOY/PUSH: NIE WYKONANO
