# R-WOJNA-WYMUSZONA-PROG-TURY-GRACZ-Q1 — dokończenie Obrony rundy 2 + weryfikacja orkiestratora

Obrona rundy 2 (agent) rozpoczęła naprawę piątego, pominiętego pliku
(`forced-war-trojstronna-domino-live-test.cjs`, Zarzut 1 Evaluatora rundy 2) —
dokładnie tym samym wzorzec co #3/#4 (fast-forward realnymi `endTurn()` do tury 24
przed `forceBronzeForcedWarDominoOnPlayer()`, funkcja `advanceTurnBySettledEndTurn()`
analogiczna do już istniejącej w `forced-war-player-target-live-test.cjs`) — ale agent
wyczerpał budżet przed zapisaniem raportu/potwierdzeniem wyniku.

Orkiestrator dokończył weryfikację (allowlista rozszerzona w `00c-dispatch-runda3-allowlist.md`,
autoryzacja identyczna z zakresem 00b dla piątego pliku):

## Wynik

`node tools/forced-war-trojstronna-domino-live-test.cjs` → **31 pass, 0 fail** (było
24 pass/4 fail w rundzie 2 przed naprawą). Scenariusze D/E/F (SEDNO: attacker wypowiada
wojnę graczowi po progu tury 25; ECHO 2 blokuje CAŁĄ parę przy sojuszu którejkolwiek
strony) — wszystkie zielone.

Pełna regresja rodziny (uruchomiona przez orkiestratora, nie tylko cytowana):
wszystkie **14** plików `forced-war-*-test.cjs` (rzeczywista liczba na dysku,
koryguje rozbieżność z Zarzutu 2 Evaluatora rundy 2 — „15"/„17" było błędne) +
`forced-war-iron-mutant-probe.cjs` + `wojna-wymuszona-parowanie-test.cjs` (47/47) +
`wojna-wymuszona-prog-tury-gracz-test.cjs` (9/9) + `boot-error-catcher-console-error-test.cjs`
(8/8) — **wszystkie zielone**, zero regresji. `npx tsc --noEmit` czysto. 5 bramek
referencyjnych (logic/tech-tree/research/unit-replace/combat) zielone.

## Stan allowlisty (kumulatywnie, 3 rundy)

- `gra/src/main.ts` — próg tury gracza w Kroku C (runda 1).
- `gra/index.html` — usunięcie override `console.error` (runda 1).
- `gra/tools/wojna-wymuszona-prog-tury-gracz-test.cjs`,
  `gra/tools/boot-error-catcher-console-error-test.cjs` — nowe bramki (runda 1).
- `gra/tools/forced-war-iron-main-guard-test.cjs`,
  `gra/tools/forced-war-iron-mutant-probe.cjs`,
  `gra/tools/forced-war-iron-player-target-live-test.cjs`,
  `gra/tools/forced-war-player-target-live-test.cjs` — re-anchor (runda 2, allowlista `00b`).
- `gra/tools/forced-war-trojstronna-domino-live-test.cjs` — re-anchor (runda 2/3,
  allowlista `00c`).

Zero zmian w `gra/src/game/forced-war-*.ts` przez CAŁY temat (progi AI bronze/stone/iron
nietknięte, potwierdzone `git diff --stat` pusty dla tego katalogu).

## Następny krok

Final Control (Workflow, Sonnet 5 effort high) — niezależna weryfikacja całości przed
integracją, temat miał FAIL w rundzie 2, wymaga pełnego, niezależnego zamknięcia.

DEPLOY/PUSH: NIE WYKONANO
