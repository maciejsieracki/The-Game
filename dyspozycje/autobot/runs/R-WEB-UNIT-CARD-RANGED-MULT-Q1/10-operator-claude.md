# R-WEB-UNIT-CARD-RANGED-MULT-Q1 — Operator (runda 1/5, 2026-11-11)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UNIT-CARD-RANGED-MULT-Q1 (#205)
GOAL: karty jednostek i tooltipy pokazują moc Procarza (×3) i Łucznika pieszego (×2) zgodną z armyFieldPower; „Atak dystansowy” z dopiskiem „×N obrażeń pocisku”; units.json fieldPower dla 8 wierszy zgodne z runtime; brak regresji.
BAZA: origin/main 0571c8731 (ROBOCZA 881b150c, FALA 625), worktree odłożony `--detach`.

## Ustalenie kluczowe

Cel tematu jest już zrealizowany w bazie. Commit `39f8e2ce0` ("fix(ui): reflect ranged projectile multipliers in unit cards") jest przodkiem `0571c8731` i był już przejęty przez Final Control (`dyspozycje/autobot/runs/R-WEB-UNIT-CARD-RANGED-MULT-Q1/50-final-control.md`, PASS-WITH-NOTES) oraz wdrożony jako FALA 607 (`90-release-607.json`, publicationCommit 2da63d941). Ta runda nie znalazła luki w kodzie, więc nie zmieniłem kodu gry. Zrobiłem weryfikację na nowej bazie.

## Zmiany w kodzie

Brak. Commit zawiera wyłącznie ten raport. Dispatch nie wymagał zmian, a zmiany ponad to byłyby duplikatem wdrożonego kodu.

Stan kodu w bazie (potwierdzony odczytem):
- `gra/src/game/unit-card-stats.ts`: `rangedDamageMult: rangedDamageMultFor(bases)` w `unitCardCombatDisplay`.
- `gra/src/main.ts` (`unitCardCombatFor`, ok. linii 32907): dodane `Typ` i `Jednostka` z definicji.
- `gra/src/ui/hexContextTooltip.ts`: linia 867 dopisuje `×N obrażeń pocisku` przy „Atak dystansowy" gdy mnożnik > 1; „Moc pola" (linie 836–845) liczona przez `fieldPower()` z polami Typ/Jednostka.
- `gra/data/units.json`: pole `fieldPower` dla 8 wierszy (Procarz ×2, Łucznik pieszy ×6) zgodne z runtime.
- `gra/src/game/unit-power.ts`, `ai-army-composition.ts`: bez zmian w tym temacie.

## Dane (z bieżącego odczytu units.json)

- Procarz (Slinger, missileAttack 4): fieldPower 16 = runtime.
- Procarz (Huaracoc): fieldPower 16.
- Łucznik (Distance, missileAttack 3): fieldPower 19.
- Łucznik egipski (missileAttack 6): fieldPower 18.
- Oszczepnik (Distance, missileAttack 4): fieldPower 12, mnożnik ×1, bez zmian.

## TESTY

Środowisko: `cd gra && npm ci --ignore-scripts` (wykonane). Bez `npm run build`/`dev`.

- `node tools/unit-card-ranged-mult-test.cjs`: exit 0, wszystkie linie `OK` (m.in. „Łucznik asyryjski card exposes ×2 projectile damage", „Łucznik asyryjski card field power 19 matches armyFieldPower", „Łucznik asyryjski units.json fieldPower 19 matches runtime", „Oszczepnik keeps multiplier ×1"). Liczby OK nie zebrałem osobno, bo wyjście obcinałem do ogona; exit 0 oznacza brak asercji.
- `node tools/ranged-damage-mult-test.cjs`: „RANGED-DAMAGE-MULT: WSZYSTKIE PASS", exit 0.
- `node tools/unit-power-test.cjs`: 6 pass, 0 fail, exit 0.
- `node tools/unit-context-card-test.cjs`: 29 pass, 0 fail, exit 0.
- `node tools/unit-power-sort-test.cjs`: 13 pass, 0 fail, exit 0.
- `node ./node_modules/typescript/bin/tsc --noEmit`: exit 0.

## NIE WYKONANO: zrzut Chromium karty/tooltipu

Dispatch wymaga zrzutu Chromium karty Procarza i Łucznika. Próba przez esbuild zbudowania harnessu `buildUnitContextTooltipHtml` nie przeszła: `src/ui/icons/brandAssets.ts` używa importów `*.svg?raw` i `import.meta.glob`, które wymagają loaderów Vite. Nie uruchamiałem pełnej gry w przeglądarce. Harness leżał poza repo w scratchpadzie i nie został zacommitowany. Renderowany tekst „×N obrażeń pocisku" pozostaje potwierdzony tylko statycznie, tak jak w FC i release 607.

## BLOKADY

- Brak zrzutu Chromium (patrz wyżej). Wymaga bramki Vite albo ręcznej sesji w grze.
- Brak nowego testu: `tools/unit-card-ranged-mult-test.cjs` już istnieje z `39f8e2ce0` i pokrywa wartości, nie tekst HTML.

## ZAŁOŻENIA

- Zakładam, że ten temat wraca w tej rundzie jako weryfikacja nowej bazy (FALA 625), a nie jako nowa zmiana. Jeśli orkiestrator oczekuje nowych zmian, potrzebna jest nowa decyzja właściciela (np. dodatkowy wariant dopisku w karcie).

RUNDY: 1/5
NASTĘPNY KROK: orkiestrator decyduje, czy zamknąć #205 jako wykonane (kod w bazie, testy zielone) i czy zamówić zrzut Chromium osobną bramką Vite.
DEPLOY/PUSH: NIE WYKONANO
