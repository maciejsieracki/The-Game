# R-WEB-UI-PREBATTLE-RAW-IDS-AND-ROSTER-OVERLAP-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (UI, błędy web)
TEMAT: R-WEB-UI-PREBATTLE-RAW-IDS-AND-ROSTER-OVERLAP-Q1
GOAL: (1) okno „Rozstawienie bitwy” nie pokazuje graczowi surowych identyfikatorów (`Matrix:…`, `walka_…`, `plytkie_morze`); (2) lista wojsk gracza przy 12 jednostkach w 1024×640 nie jest zasłonięta przez panel rozstawienia.
BAZA: b1eff89eef58ac911940ea4a1a60f76dc858d3b4 (origin/main), checkout --detach w worktree `wf_29e9167e-ed8-1`.
ZMIANY-COMMIT: patrz sekcja „Zmiany” niżej; SHA commita w polu `sha` odpowiedzi strukturalnej.

## Wynik ogólny

- Część (1), surowe ID: ZREPRODUKOWANA na żywo w bazie i NAPRAWIONA. Po poprawce w widocznym tekście okna nie ma żadnego dopasowania do `Matrix:|walka_|plytkie_morze|[a-z]+_[a-z_]+` (we wszystkich trzech viewportach).
- Część (2), zasłonięta lista: NIE ZREPRODUKOWANA w bazie. Pomiar geometrii w prawdziwym Chromium przy 12 jednostkach: panel rozstawienia i lista gracza nie nakładają się, „+4 więcej…” i przyciski akcji są w viewport, brak przewijania strony. Kryterium (c) z dispatchu jest spełnione bez zmiany układu. Nie zmieniałem układu (zgodnie z „zmiana układu bez jasnej reguły → DECISION_REQUIRED”). Jedyna widoczna uwaga: ostatnia karta listy jest ucięta na krawędzi przewijanej listy (patrz „Do decyzji”).

## Źródła surowych ID (ustalone w kodzie)

1. `Matrix:<id>` — `gra/src/game/civ-bonuses.ts` (`civMatrixBonusyForCivKey`, linie ~293–309) i `gra/src/game/production.ts` (~670) ustawiają `opis` wpisów walki na `Matrix:<matrixParamId>`. Te teksty trafiały do chipów przy portrecie dowódcy (`effectiveCombatBonusChipTexts`) i do linii „Bonus cywilizacji obrońcy” w `warunki` (`defenderCivBonusBreakdown`, `gra/src/game/defenseBreakdown.ts`).
2. `plytkie_morze` — `gra/src/main.ts`, funkcja `terrainLabelPl` (mapa miała klucze ze starych identyfikatorów `Rownina`, `Wybrzeze`, więc każdy nowy id wracał surowo, zlowercase’owany). Trafiało do tytułu „Atakujesz: …” i do miejsca walki.
3. `Teren: plytkie_morze` — `gra/src/ui/preBattle.ts`, `metaHtml` (pokazywało `info.teren` bez etykiety).

## Zmiany

- `gra/src/game/civ-matrix-semantic.ts`: uzupełniono słownik `civMatrixParameterLabelPl` o brakujące części (`obleczenie`→„oskrzydlenia”, `bitwa`→„bitwy”, `murze`→„w murze”, `plytkie`→„płytkim morzu”; części techniczne `w`, `wlasne`, `szarzy`, `morze` pomijane), pomijanie pustych części, `%` dolepiane bez separatora. Nowa funkcja `civBonusOpisPl(opis)`: `Matrix:<id>` → etykieta; inne teksty bez zmian. Pole `opis` w danych NIE jest zmieniane (dopasowanie bonusów czyta je osobno).
- `gra/src/game/civ-bonuses.ts` (`effectiveCombatBonusChipTexts`) i `gra/src/game/defenseBreakdown.ts` (`bonusChipTexts`, `defenderCivBonusBreakdown`): tekst dla UI przez `civBonusOpisPl`.
- `gra/src/main.ts`: `terrainLabelPl` czyta `TEREN_LABEL_PL` (`map/terrain-names.ts`, jedno źródło) z fallbackiem `nazwaWyswietlana`, wynik małymi literami (jak wcześniej w zdaniach).
- `gra/src/ui/preBattle.ts`: `terenLabelPl(teren)` dla „Teren: …” i dla tytułu gdy brak `miejsce`.
- `gra/tools/civ-bonusy-test.cjs`: asercje chipów oczekiwały surowego `Matrix:…` (czyli wadliwego tekstu). Zmieniono na etykiety polskie + asercja „brak `Matrix:|walka_`”. 56/56 PASS.
- `gra/tools/prebattle-rawids-roster-q1.cjs` (nowy): probe live w Chromium (realny klik w jednostkę gracza i w heks barbarzyńcy, odczyt DOM `.pb-overlay`, pomiar prostokątów listy/panelu/przycisków, zrzuty). Env: `PB_N`, `PB_VP`, `PB_MUTATE=deploy-wide` (mutacja pomiarowa: panel rozciągnięty na cały viewport).

## Dowody live (Chromium 141, `/usr/bin/chromium`, build vite poza repo)

Pliki: `runs/R-WEB-UI-PREBATTLE-RAW-IDS-AND-ROSTER-OVERLAP-Q1/evidence/`.

Przed (baza b1eff89, 12 jednostek, 1024×640) — `probe-przed.json`:
- widoczny tekst zawiera surowe: `Matrix:` ×2, `walka_` ×2, `atak_piechota`, `pancerz_piechota`, `plytkie_morze` ×2 (tytuł i „Teren”). Zrzut: `przed-1024x640-12-jednostek.png` (obejrzany).
- geometria: lista gracza 14–182 × 132–454; panel 208–816 × 383–622; brak nakładania; „+4 więcej…” w viewport; przyciski w viewport; brak przewijania strony.
- Te same wyniki surowych ID przy 1280×800 i 1920×1080 (w JSON).

Po (poprawka) — `probe-po.json`:
- `raw: []` we wszystkich trzech viewportach.
- Tytuł „Atakujesz: płytkie morze”, „Teren: Płytkie morze”, chipy „Walka · atak · piechoty”, „Walka · pancerz · piechoty” (zrzut `po-1024x640-12-jednostek.png`, obejrzany; `po-1280x800…` i `po-1920x1080…` zapisane, nieobejrzane).
- geometria bez zmian względem przed (lista 14–182 × 132–454, panel 208–816 × 383–622, brak nakładania, przyciski w viewport, brak przewijania).

Kandydat 04706c109 (`kandydat-04706c109-hunger-stack-1024x640.png`, z dispatchu) — obejrzany dla porównania: układ identyczny z bazą; lista kończy się „+4 więcej…” w tym samym miejscu. Ucięta karta na krawędzi listy jest tam widoczna też.

## Mutacje (czy testy są czerwone)

- Raw ID: test DOM na bazie (przed) → czerwony (8 dopasowań). Po poprawce → zielony. Cofnięcie poprawki = build z bazy, nie edycja pliku.
- Geometria: `PB_MUTATE=deploy-wide` (wstrzyknięty CSS rozciągający `.pb-deploy` na 100vw) → `overlapRoster: true`, `overlapMore: true` (1024×640). Test geometrii wykrywa nakładanie.

## Testy i bramki

- `npx tsc --noEmit`: exit 0.
- Bramki referencyjne: logic-test LOGIC OK 213/213; tech-tree-test 20 pass / 0 fail; research-test 33 / 0; unit-replace-test exit 0; combat-test 6/6.
- Okno przed bitwą: pre-battle-defender-retreat-test OK; pre-battle-retreat-exhausted-test 33/0; pre-battle-save-test OK; barbarzyncy-podwojny-atak-prebattle-test 18/0.
- Etykiety i bonusy: civ-matrix-semantic-labels-test PASS 490 / FAIL 0; civ-bonusy-test 56 / 0 (po aktualizacji asercji); population-civ-matrix-wiring-test 122/0; pr141-g1-combat-activation-test PASS; pr141-f04-cost-activation-defense-test 64/0.
- `defense-breakdown-test.cjs` pada na linii 172 (`grecy.bonusy` undefined: fixture szuka `Cywilizacja === 'Grecy'` w `civs` i nie znajduje wiersza). To nie jest ścieżka zmieniona tematem. NIE ZMIERZONO na bazie (nie uruchamiałem testu na czystym b1eff89).
- `git diff --check`: patrz wynik w sekcji „Stan git” niżej.

## Odstępstwa i ryzyka (do decyzji orkiestratora)

1. Allowlista: `gra/src/game/civ-bonuses.ts`, `gra/src/game/defenseBreakdown.ts` i `gra/tools/civ-bonusy-test.cjs` nie są wprost w allowliście. Wpisałem je, bo źródło `Matrix:` leży w `civ-bonuses.ts` (wpis „etykiety matrix, tylko jeśli źródło ID tam”), a asercje w `civ-bonusy-test` utrwalały surowy tekst. Zmiana w `main.ts` (`terrainLabelPl`) mieści się w tej samej regule. FC proszę o potwierdzenie.
2. Test `weakened-warning` z `04706c109` (`live-verify-prebattle-weakened-q1.cjs`) nie działa na bazie: wymaga funkcji `.pb-weak` oraz haków `__aiTradeWiringTestDebug.setSpichlerzPanstwa` i `__ledgerRealPathDebug.setTreasury`, których nie ma w b1eff89 (04706c109 nie jest przodkiem bazy). Dlatego nie użyłem go; zrobiłem osobny probe bez tych haków. Narzędzie z kandydata zostawiam w tej gałęzi.
3. Chipy pokazują teraz samą etykietę bez wartości (np. „Walka · atak · piechoty”), tak jak wcześniej pokazywały samo `Matrix:…` bez wartości. Dodanie wartości (np. „+X%”) to osobna decyzja; nie sprawdzałem jednostek wartości w `civ-matrix.json`.
4. Fallback dla domyślnego `'Rownina'` w `main.ts` (`dTeren4 ?? 'Rownina'`) daje `Rownina` (nie `Równina`), bo klucz enum to `rownina`. Dotyczy tylko heksu bez danych; nie zmieniałem.

## Do decyzji (układ, część 2)

- Ostatnia karta listy wojsk gracza jest ucięta na dolnej krawędzi przewijanej listy (`.pb-rcards`, `overflow-y:auto`); „+N więcej…” jest widoczne pod listą. Lista ma własne przewijanie, więc kryterium z dispatchu jest spełnione. Jeśli właściciel chce pełne karty bez cięcia, to zmiana wysokości/układu → DECISION_REQUIRED (nie robiłem).
- Próba przeniesienia „+N więcej…” do przewijanej części listy została wycofana: wtedy znika z widoku na starcie (zrzut poza listą), co gorsze.

## Stan git i sprzątanie

- Commit: zawiera kod, testy, probe i ten raport z `evidence/`. Push i deploy: NIE WYKONANO (zgodnie z dispatchem).
- `gra/node_modules` i buildy w scratchpadzie usuwam po commicie.

## Zgłoszenia poza zakresem (UWAGI-DLA-ORKIESTRATORA)

- Surowe ID w innych oknach (np. `Matrix:` w opisach `production.ts` `civProductionCostBonusyForCivKey`) nie są w tym temacie pokazywane w UI przed bitwą; sprawdzić, czy trafiają do panelu produkcji (nie zbadane).
- `defense-breakdown-test.cjs`: fixture pada na danych (`Cywilizacja` 'Grecy'). Zgłoszenie do długu testowego.

NASTĘPNY KROK: FC na commicie tego tematu (zwłaszcza allowlista i decyzja o układzie karty listy).
RUNDY: 1/5 (ostatni werdykt: brak; decyzja wymagana tylko w punkcie „Do decyzji”).
DEPLOY/PUSH: NIE WYKONANO
