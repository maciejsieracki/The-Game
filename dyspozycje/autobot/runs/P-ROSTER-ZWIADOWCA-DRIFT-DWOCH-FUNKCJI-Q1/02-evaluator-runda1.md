# P-ROSTER-ZWIADOWCA-DRIFT-DWOCH-FUNKCJI-Q1 — Evaluator, runda 1

STATUS: PASS-WITH-NOTES (werdyktu nie wydaję — Final Control)
DOMAIN: GAME
TEMAT: P-ROSTER-ZWIADOWCA-DRIFT-DWOCH-FUNKCJI-Q1
GOAL: skład bitwy niezależny od tego, którą funkcją go policzono.
MODEL+EFFORT: Opus 5, effort high · ROLA: Evaluator · RUNDA 1/5
IZOLACJA: `/home/user/wt-roster-zwiadowca`, gałąź `autobot/P-ROSTER-…-Q1`.
HEAD przy starcie `4e44b0bd` (potomek bazy `91877f11`), drzewo czyste. W trakcie
mojej pracy orkiestrator dopisał `7a19f591` (ratyfikacja rundy 2) — oceniam rundę 1.

## CO POTWIERDZIŁEM WŁASNYM ODCZYTEM I POMIAREM

Diagnoza Operatora jest prawdziwa. Predykat `battleRoster.ts:29-31` w gałęzi
`attacker` nie czyta `battleHex` (`return u.id === ctx.anchor.id`) — hipoteza RECON
obalona, zwiadowca wykluczany w OBU funkcjach. Własna sonda na bundlu bramki:
`collectBattleRoster(hastati,[hastati,ally,scout,warrior2])` → `u0+u2+u3`;
`collectAtkRosterNearCity(city(6,0),…)` → `u0+u2`; bez `warrior2` → `u0+u2`.
Czerwieni się wyłącznie człon `length === 2`; `!some(Zwiadowca)` przechodzi.
`warrior2` (`u3`, Hastati/miecznik, owner 0, `(5,-1)`) to jednostka bojowa w dystansie
1 od kotwicy `(5,0)` — roster ma poprawnie 3 pozycje.

## PUNKT KONTROLI — CZY OSŁABIONO ASERCJE

`git diff 91877f11..HEAD -- gra/` — PUSTE. Zmieniono wyłącznie 3 pliki runu.
Asercje (`grep -c 'assert('`) baza→HEAD: `map-field-battle-test` 21→21,
`battle-roster-test` 8→8, `retreat-garnizon-fortyfikacja-test` 28→28. Sporna asercja
bajt-identyczna z `91877f11` ORAZ z `6b81abf4`. Spadku nie ma.

## PUNKT KONTROLI — PIĘĆ WŁASNYCH MUTACJI (inne niż M1/M2 Operatora)

Każda cofnięta kopią pliku, po każdej `git diff --quiet` czysto.
- **E1** `radiusFrom(u) > 1` → `> 0`: map-field-battle 17/3, battle-roster 4/3.
- **E2** usunięty filtr `u.ownerId !== anchor.ownerId`: 18/2, battle-roster 7/0.
- **E3** `collectAtkRosterNearCity` liczy dystans OD KOTWICY (dokładnie rozjazd
  z hipotezy dispatchu): map-field-battle **19/1, lista fail bez zmian** — bramka
  tematu tego nie łapie; łapie tylko `battle-roster-test` (5/2).
- **E4** usunięte wymuszenie kotwicy na pozycji 0 (`battleRoster.ts:54-58`):
  map-field-battle 19/1, battle-roster **7/0** — nic tego nie łapie.
- **E5** `return out.slice(0, 2)` w `collectUnitsInRadius`: map-field-battle **20/0**,
  battle-roster **7/0**. Kontrprzykład do kategorycznej tezy Operatora.

## BRAMKI URUCHOMIONE PRZEZE MNIE (nie przepisane z raportu)

`map-field-battle-test` 19 ok/1 fail (exit 1) · `battle-roster-test` 7/7 ·
`battle-summary-test` OK · `auto-battle-power-test` 14/14 ·
`entity-card-contract-test` 75/75 · `retreat-garnizon-fortyfikacja-test` 27/27 ·
`logic-test` 213/213 · `tech-tree-test` 19/19 · `research-test` 33/33 ·
`unit-replace-test` 13/13 · `combat-test` 6/6 ·
`node ./node_modules/typescript/bin/tsc --noEmit` exit 0. Grep po `battleRoster`
dał tę samą listę co u Operatora (+ `_tmp-battle-roster-test.cjs`, nie-bramka).

## ZARZUTY

**1. Teza „żadna zmiana `gra/src` nie zazieleni obu naraz" jest FAŁSZYWA.**
Miejsce: `01-operator-runda1.md`, sekcja „PRAWDZIWA PRZYCZYNA", zdanie „Żadna zmiana
`gra/src` nie zazieleni obu naraz"; powtórzone w `decision-abc.md`, punkt „Testy".
Kontrprzykład E5: jedna linia w `battleRoster.ts:59` (`return out.slice(0, 2)`) daje
`map-field-battle-test` **20/20** i `battle-roster-test` **7/7**. Znaczenie: ratyfikacja
orkiestratora (`00-dispatch.md`, §RATYFIKACJA) opiera się wprost na tym dowodzie
(„Operator to udowodnił i to jest powód tej ratyfikacji"). Teza obroni się dopiero
w brzmieniu węższym: żadna zmiana ZGODNA Z KONTRAKTEM rosteru („heks kotwicy + własne
jednostki bojowe w promieniu 1"). E5 to zarazem dowód, że cały zestaw bramek jest ŚLEPY
na twardy limit 2 jednostek w rosterze — dokładnie „Tryb trzeci" z dispatchu.

**2. Recon rodziny rosterów niepełny — czwarta ścieżka pomija wykluczenie cywilów.**
Miejsce: `01-operator-runda1.md`, sekcja „TRZECIA FUNKCJA…", zdanie „Zero śladu
zamierzonej różnicy w kodzie, komentarzach ani wywołaniach (… `main.ts:24283-24306` …)".
`gra/src/main.ts:24283` `collectBattleRoster` przy `playtestWalkaActive` NIE deleguje do
`collectBattleRosterPure`, tylko do `collectPlaytestBattleRoster`
(`gra/src/game/playtestWalkaMapy.ts:113`), które **nie woła `shouldIncludeInBattleRoster`
w ogóle** — sąsiadujący zwiadowca WCHODZI tam do rosteru. Znaczenie: to jest realny
przypadek GOAL („skład bitwy zależy od tego, która funkcja go policzyła"), tylko w innej
parze funkcji niż zgadywał dispatch. Tryb playtest, więc nie blokuje gry — ale
kategoryczne „zero śladu" jest nieprawdziwe i znalezisko nie trafiło do raportu.

**3. Kryteria końca 1 i 3 rundy 1 formalnie niespełnione.**
Kryterium 1 (`map-field-battle-test` 20/20) — jest 19/1. Kryterium 3 (asercja parytetu
w `gra/tools/map-field-battle-test.cjs`) — nie dopisana. Operator uzasadnił oba
(konflikt kryteriów 1↔2; „zabetonowałaby bramkę przed decyzją"), a orkiestrator obie
kwestie ratyfikował w `7a19f591`. Odnotowuję jako otwarte, bo ratyfikacja jest
późniejsza niż praca oceniana.

**4. Teza o parytecie jest podana bez warunku, przy którym zachodzi.**
Miejsce: `01-operator-runda1.md`, „Parytet już zachodzi: dla wspólnej kotwicy na heksie
miasta oba rostery zwracają identyczny zbiór ID". Zmierzyłem: kotwica NA heksie miasta →
`u0+u2+u3` = `u0+u2+u3`, zgodne. Kotwica OBOK miasta (fixture bramki, hastati `(5,0)`,
miasto `(6,0)`) → `u0+u2+u3` vs `u0+u2`, **niezgodne** — bo promienie liczone są od
różnych środków, i tak ma być z definicji. Znaczenie dla rundy 2: asercja parytetu
z kryterium ratyfikacji MUSI ustawić kotwicę na heksie miasta; napisana na fixturze
`hastati/openCity` zaczerwieni się od razu i sprowokuje „naprawę" `gra/src`.

## OBSERWACJE (do rejestru, nie do naprawy w tym temacie)

- `gra/tools/battle-roster-test.cjs:166` `'city atk roster: anchor is always first'`
  jest TAUTOLOGICZNA na swoim fixturze — mutacja E4 usuwa całą logikę wymuszania
  kotwicy i asercja zostaje zielona. Asercja nie może zaczerwienić.
- `gra/tools/map-field-battle-test.cjs` nie mierzy różnicy środka promienia między
  `collectBattleRoster` a `collectAtkRosterNearCity` (E3). Osłona jest tylko
  w `battle-roster-test.cjs`.
- Potwierdzam oba znaleziska poboczne Operatora: `gra/tools/_tmp-battle-roster-test.cjs`
  zacommitowany (od `546f6a51`), oraz brak filtra `ownerId` w
  `collectDefRosterNearCity` kompensowany w `siegeDefenders.ts:16` i `main.ts:25593`.
- Raport Operatora ma 542 słowa przy limicie ok. 400.

## ZMIANY/COMMIT

Ten raport. `gra/**` nietknięte — `git status --short` puste, drzewo czyste
po wszystkich pięciu mutacjach.

## TESTY

Jak w sekcji „BRAMKI URUCHOMIONE PRZEZE MNIE".

## BLOKADY

Brak własnych. Kryterium 1 rundy 1 pozostaje niespełnialne bez zmiany fixture'u —
rozstrzygnięte ratyfikacją `7a19f591`.

RUNDY: 1/5
NASTĘPNY KROK: Final Control (werdykt), następnie runda 2 wg §RATYFIKACJA w `00-dispatch.md`.
DEPLOY/PUSH: NIE WYKONANO
