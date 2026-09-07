STATUS: FAIL
DOMAIN: GAME
TEMAT: R-WOJNA-WYMUSZONA-PROG-TURY-GRACZ-Q1
GOAL: Naprawić dokładnie 4 bramki testowe (allowlista rundy 2) pod nowy trzywarunkowy
próg tury gracza w Kroku C main.ts, zachowując SEDNO testów #3/#4, teraz przesunięty
za turę 25.

ZMIANY-COMMIT: Niescommitowane. Zweryfikowano `git status --short`: pokrywa się z unią
`00-dispatch.md` + `00b-dispatch-runda2-allowlist.md`. Zero plików poza allowlistą.
`git diff` main.ts: dokładnie blok Kroku C, zero innych hunków, zero nowego haka.
`gra/src/game/forced-war-*.ts` nietknięte.

TESTY: `tsc --noEmit` czysto. Regex #1 (`forced-war-iron-main-guard-test.cjs`)
zweryfikowany programistycznie na faktycznym main.ts — czysty re-anchor. Mutant M42
(`forced-war-iron-mutant-probe.cjs`): 55/55 mutacji zaczerwienionych, 37/37 main/ai.
Oba live testy #3/#4 uruchomione realnie (Playwright, vite build) — SEDNO D/E
zachowane, gracz nadal realnie staje się celem wymuszonej wojny, tylko przy turze ≥25.
5 bramek referencyjnych zielone. `boot-error-catcher-console-error-test.cjs` 8/8.
`wojna-wymuszona-prog-tury-gracz-test.cjs` 9/9. `wojna-wymuszona-parowanie-test.cjs`
47/47.

**Cała reszta rodziny `forced-war-*-test.cjs` uruchomiona samodzielnie: NIE jest
17/17 zielona, jak twierdzi raport operatora.** `forced-war-trojstronna-domino-live-test.cjs`
— 24 pass, 4 fail, EXIT=1.

BLOKADY: patrz ZARZUTY.
RUNDY: 2/5.
NASTĘPNY KROK: Operator, runda 3 — naprawa (poza obecną allowlistą, wymaga rozszerzenia
jak w 00b) piątego zastałego pliku.

ZARZUTY:

1. **[KRYTYCZNY, blokujący PASS] `forced-war-trojstronna-domino-live-test.cjs` — piąta
   zastała bramka, pominięta i przez Evaluatora rundy 1, i przez allowlistę 00b, i przez
   operatora rundy 2 — realnie CZERWONA po zmianach tej gałęzi.** 24 pass/4 fail.
   Scenariusz D (SEDNO — attacker ma wypowiedzieć wojnę graczowi po jednej turze od
   bootstrapu turn=1) kończy się `relAttAfter:"neutralni"` zamiast `"wojna"`; scenariusze
   E/F (oczekiwany DECISION_REQUIRED dla ownera gracza 0) nie generują żadnego takiego
   loga. Przyczyna: `assignForcedWarPairings` buduje pulę leftoverów (mechanizm domina)
   wyłącznie z `triggeredSubjects` — gracz wchodzi do `triggeredSubjects` dopiero od
   `turn>=25`. Test bootstrapuje na turze 1 i robi tylko jedną turę. Naprawa wymaga
   tego samego wzorca co #3/#4 (fast-forward realnymi endTurn() do tury≥25), poza
   obecną allowlistą 00b — wymaga rozszerzenia przez orkiestratora.

2. **[DROBNY, informacyjny] Rozbieżność liczbowa w raporcie operatora.** Operator
   twierdzi „15 forced-war-*-test.cjs" (razem z 2 plikami wojna-wymuszona-*-test.cjs =
   17). Realnie na dysku istnieje dokładnie 14 plików pasujących do wzorca — razem z 2
   plikami wojna-wymuszona-* daje 16, nie 17. Nie zmienia wagi zarzutu 1.

DEPLOY/PUSH: NIE WYKONANO
