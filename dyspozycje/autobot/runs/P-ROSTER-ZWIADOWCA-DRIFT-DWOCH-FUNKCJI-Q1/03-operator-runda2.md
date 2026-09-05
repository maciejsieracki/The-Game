# P-ROSTER-ZWIADOWCA-DRIFT-DWOCH-FUNKCJI-Q1 — Operator, runda 2

STATUS: PASS
DOMAIN: GAME
TEMAT: P-ROSTER-ZWIADOWCA-DRIFT-DWOCH-FUNKCJI-Q1
GOAL: bramka mierzy własną intencję (skład bitwy niezależny od funkcji liczącej),
bez zmiany zachowania gry — naprawa wadliwego fixture'u, nie kodu `gra/src`.
MODEL+EFFORT: Opus 5, effort high · ŚCIEŻKA A (Workflow) · RUNDA 2/5
IZOLACJA: `/home/user/wt-roster-zwiadowca` @ `7a19f591`, drzewo czyste przed pracą.

## CO ZROBIONE (wg RATYFIKACJI ORKIESTRATORA)

`gra/tools/map-field-battle-test.cjs` — jedyny zmieniony plik.

1. Asercja `:155-157` przepisana z licznika na **kontrolę zbioru ID**: `!ids.has(scout.id)`
   (nazwa `collectBattleRoster atk: adjacent scout excluded` zachowana bajt w bajt)
   + nowa `…pozostale trzy jednostki bojowe ZOSTAJA w rosterze` na `hastati/ally/warrior2`.
2. Dopisana **asercja parytetu**: wspólna kotwica `u-anchor-city` na heksie miasta `(6,0)`,
   zestaw `[parityAnchor, hastati, ally, scoutNeighbor, warrior2, garrison]`;
   `collectBattleRoster` i `collectAtkRosterNearCity` porównywane jako **zbiory ID**
   (`Set`, nie listy). Oba dają `{u-anchor-city, u0, u2}`. Strażnik `size > 1` broni
   przed tautologią „oba zbiory puste".

20 → **22 asercje**. Zero zmian w `gra/src`.

## DOWÓD NIETAUTOLOGICZNOŚCI (mutacje `gra/src`, cofnięte KOPIĄ pliku)

**M1** — `shouldIncludeInBattleRoster`, gałąź atakującego `return true` (zwiadowca wraca do
rosteru): bramka **19 ok / 3 fail**, czerwienieje m.in. `adjacent scout excluded`. Wymagane
kryterium 3 spełnione.

**M2** — `collectUnitsInRadius`, cichy drop niekotwicznego `Hastati` (usuwa `warrior2`
z rosteru): **nowa** bramka **21 ok / 1 fail** — czerwienieje wyłącznie
`pozostale trzy jednostki bojowe ZOSTAJA`. **Kontrola na STAREJ wersji bramki przy tej samej
mutacji: 20 ok / 0 fail — CAŁKOWICIE ZIELONA.** To jest twardy dowód, że przepisana asercja
jest mocniejsza: stary licznik `length === 2` przepuszczał ciche usunięcie jednostki bojowej
ze składu bitwy, czyli dokładnie tę zmianę balansu, przed którą ostrzegała runda 1.

Po każdej mutacji przywrócenie z kopii; `git diff --quiet -- gra/src/` czysto,
md5 `battleRoster.ts` = `f8995d15…` (identyczny z bazowym).

## TESTY

`map-field-battle-test` **22/22** · `tsc --noEmit` **0 błędów** (5.9.3, `gra/node_modules`
symlink obecny, C-029) · `logic-test` 213/213 · `tech-tree-test` 19/19 · `research-test` 33/33 ·
`unit-replace-test` 13/13 · `combat-test` 6/6 · `battle-roster-test` 7/7 ·
`retreat-garnizon-fortyfikacja-test` 27/27 · `battle-summary-test` OK ·
`auto-battle-power-test` 14/14 · `entity-card-contract-test` 75/75.
Lista sąsiedztwa z grepu po `battleRoster`: `battle-roster-test`, `map-field-battle-test`,
`retreat-garnizon-fortyfikacja-test` (+ `_tmp-battle-roster-test` — nie bramka, obserwacja 1).

## WPŁYW NA GRĘ

**Zerowy.** `git diff fe57a068..HEAD -- gra/src/` — PUSTE (kryterium 2). Skład bitwy w polu
bez zmian: kotwica Hastati `(5,0)` + Łucznik `(5,1)` + Hastati `(5,-1)`, zwiadowca `(5,1)`
poza rosterem — przed i po.

## OBSERWACJE (do rejestru orkiestratora, NIE naprawiane)

1. `gra/tools/_tmp-battle-roster-test.cjs` — zacommitowany plik roboczy udający bramkę.
2. `collectDefRosterNearCity` nie filtruje po `ownerId`; kompensują to oba wywołania
   (`siegeDefenders.ts:16`, `main.ts:25593`) — kruche, dziś działa.
3. Asercja `map-field-battle-test.cjs:155` była wadliwą kopią `battle-roster-test.cjs:105-109`
   (ta sama reguła, poprawny fixture, zielona). Kopiowanie asercji między bramkami bez
   kopiowania fixture'u to tryb błędu wart zapisania.

## ZMIANY/COMMIT

Allowlista: `gra/tools/map-field-battle-test.cjs` (wyłącznie asercje) +
`dyspozycje/autobot/runs/P-ROSTER-ZWIADOWCA-DRIFT-DWOCH-FUNKCJI-Q1/03-operator-runda2.md`.
`git diff --check` czysto. `git add` po jawnych ścieżkach (C-008).

BLOKADY: brak.
RUNDY: 2/5
NASTĘPNY KROK: Evaluator (weryfikacja zakresu, mutacji i braku zmian w `gra/src`).
DEPLOY/PUSH: NIE WYKONANO
