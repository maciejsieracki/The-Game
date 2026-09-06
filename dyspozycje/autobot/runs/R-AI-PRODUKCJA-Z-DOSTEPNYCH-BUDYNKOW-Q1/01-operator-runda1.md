# R-AI-PRODUKCJA-Z-DOSTEPNYCH-BUDYNKOW-Q1 — Operator, runda 1/5

STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-AI-PRODUKCJA-Z-DOSTEPNYCH-BUDYNKOW-Q1
GOAL: AI wybiera budynki z tego samego źródła co gracz (availableProduction()), punktowane po BuildingDef.grupa, zero zaszytych id budynków jako źródła kandydatów.

## Rozbieżność z RECON (reguła przeciw samooszukiwaniu, tryb czwarty)

Katalog ma **42** budynki, nie 41 (`buildings.json.length===42`) — RECON się pomylił o
jeden (prawdopodobnie Garnizon z R-BUDYNEK-GARNIZON-NOWY-Q1). Powtórzony pomiar
literałowy (grep id w starym `ai.ts`) dał **23/42** (nie ~22/41 z RECON) — patrz
tabela pokrycia niżej, różni się też per-epoka (epoka 1: 10/12, nie 9/11).

## Co zrobiono

`chooseCityProduction` (ai.ts) generuje teraz kandydatów-budynki z **całego**
`data.buildings`, punktowanych funkcją `buildingGroupCandidateScore` po
`BuildingDef.grupa` (+ tie-break po koszcie) — `collectAvailableBuildingCandidates`.
Usunięte: literałowa lista `infraOrder` (7 id), pętla `['stolarnia','cegielnia',...]`,
osobne dodawanie `spichlerz`/`koszary`/`biblioteka`/`akademia`. Gdy `opts.isProductionAllowed`
podane (main.ts, owija prawdziwe `availableProduction()`) — używane wprost jako bramka
tech/epoka/prereq/zasoby/stolica. Gdy nieobecne (stare testy) — generyczny fallback:
`upgradeFrom` + `CITY_BUILDING_PREREQ` (import z production.ts/building-resource-gate.ts,
data-driven, bez zmian w tych plikach).

## Kryterium 1 — literały

Grep `'nazwa_grupy'` w `ai.ts`: 8 nazw grup (dopuszczalny wyjątek). Poza tym
**5 literałów budynków** pozostały, każdy udokumentowany w kodzie i tu:
- `mury`, `palisada` — fortyfikacja; BuildingDef nie ma flagi "to jest ściana"
  odróżniającej je od koszar/fortu/baszty w tej samej grupie. Zmiana wymagałaby
  nowego pola w `buildings.json` (poza allowlistą).
- `koszary` — dawny flat 200+militaryScore (ponad Wojownikiem) był świadomą
  decyzją "koszary przed rekrutacją"; podniesienie całej grupy zamiast tego
  jednego budynku psuło inny test (Mury/Palisada z tej samej grupy).
- `biblioteka`, `akademia` — analogicznie, Panel D (priorytetNauka) ma realnie
  przesuwać wybór ku nauce (ai-test T3b/T7d), niemożliwe do odtworzenia samą
  warstwą grupy bez podnoszenia też Steli/Teatru.

**DECISION_REQUIRED #1:** czy te 5 nazwanych wyjątków są akceptowalne, czy temat
ma wrócić do rundy 2 z nowym polem w `buildings.json` (np. `coreScore`/`fortyfikacja: true`)
eliminującym je całkowicie? Allowlista dzisiejsza tego nie obejmuje.

## Kryterium 2 — pokrycie (tabela niżej)

Major AI: **39/42** — brakuje `mury`, `fort`, `baszta`. Nie jest to literał w
`ai.ts` (są kandydatami z pełnego katalogu jak każdy inny budynek) — to
**świadome** wyłączenie: P-AI-008 (`ai-threat-mode.ts`, test wcześniejszy od
tego tematu) mówi wprost "major AI nigdy nie buduje Murów, fortyfikacja
zostaje dla miast-państw" — zweryfikowane empirycznie (`ai-test` T8c, scenariusz
BEZ zagrożenia), więc to nie tylko "pod zagrożeniem". Fort/Baszta wymagają
Murów w mieście (`CITY_BUILDING_PREREQ`), więc są przez to też nieosiągalne.

**DECISION_REQUIRED #2:** czy P-AI-008 ma zostać zawężone (Mury dostępne dla
major AI POZA trybem zagrożenia), co odblokuje Fort/Baszta i podniesie pokrycie
do 42/42? Miasta-państwa (defensiveCopy): **42/42** bez wyjątków.

## Kryterium 3 — kolejność wczesnej gry

Studnia jest pierwsza (zweryfikowane). Garncarnia i Stolarnia wchodzą wcześnie.
**Spichlerz odtwarza się PÓŹNIEJ niż w dawnym łańcuchu** — cała grupa "Produkcja
surowców" (7 budynków: stolarnia/kamieniarski/garncarnia/cegielnia/kuznia/
odlewnia_brazu/odlewnia_zelaza) ma wyższą warstwę bazową niż "Żywność", więc
Spichlerz czeka, aż ta grupa się wyczerpie, zamiast wejść zaraz po Stolarni.
Punktowanie WYŁĄCZNIE po grupie nie potrafi odtworzyć tej jednej pozycji bez
kolejnego literału (`spichlerz`) — **DECISION_REQUIRED #3**, zgłaszam zamiast
cicho porzucać (tryb trzeci reguły). Targowisko/administracja nie zdążyły
wejść w 60-turowym oknie testowym (zablokowane przez samą grupę Produkcja
surowców) — nie zmierzone dalej w tej rundzie.

## Kryteria 5–9

5: `ai-mp-*`, `ai-cs-*`, `city-state-prod-audit`, `cs-military-cap-wiring` —
zielone, miasta-państwa nienaruszone. 6: `infraOrder` (w tym linia `garnizon`)
usunięty w całości — Garnizon dostępny automatycznie (grupa Prawo i administracja,
dowód w bramce pokrycia). 7: `tsc --noEmit` zielone. 8: 213/213, 19/19, 33/33,
13/13, 6/6. 9: rodzina `ai-*` (38 plików) — wszystkie zielone poza
PRE-ISTNIEJĄCYMI (potwierdzone na bazie sprzed tematu, niezwiązane):
`ai-balans-step3-test` (1/8, wonder throttle), `ai-praca-split-parity-test`
(1/22), `ai-slider-test` (5/38), 4 asercje dyplomacji w `ai-test.cjs`
(zaproponuj_handel). `ai-buduje-budynki-test.cjs` nie ukończył w oknie tej
rundy (wielokrotne `vite build`, ~minuty/mutację, nie dotyka `chooseCityProduction`
wg grepu) — niezweryfikowany, do potwierdzenia w rundzie 2.

## ZMIANY/COMMIT

`gra/src/game/ai.ts` (refaktor chooseCityProduction), `gra/tools/ai-produkcja-pokrycie-katalogu-test.cjs`
(NOWY), `gra/tools/ai-test.cjs`, `gra/tools/ai-mp-military-cap-test.cjs`,
`gra/tools/ai-production-priority-test.cjs` (fixtures: dodane `grupa`/`kosztBudowy`
do fake `buildings`, nowy kontrakt — zero usuniętych/osłabionych asercji, liczba
asercji nie spadła nigdzie).

RUNDY: 1/5
NASTĘPNY KROK: Evaluator — rozstrzygnięcie DECISION_REQUIRED #1-#3, potem
dokończenie ai-buduje-budynki-test i pełnego 150-tur porównania z prawPct/szPct.
DEPLOY/PUSH: NIE WYKONANO
