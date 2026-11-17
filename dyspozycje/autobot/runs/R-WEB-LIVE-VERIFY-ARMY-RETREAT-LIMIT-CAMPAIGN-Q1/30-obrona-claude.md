# R-WEB-LIVE-VERIFY-ARMY-RETREAT-LIMIT-CAMPAIGN-Q1 — raport Obrony Operatora (runda 2/5)

STATUS: PASS-WITH-NOTES (obrona zarzutów; pomiar kampanii nadal NIE ZMIERZONO, z powodem poniżej)
DOMAIN: GAME (tylko pomiar; bez zmian w `gra/src`, `gra/data`)
TEMAT: R-WEB-LIVE-VERIFY-ARMY-RETREAT-LIMIT-CAMPAIGN-Q1
GOAL: w żywej grze zmierzyć odwroty armii po przegranej bitwie (per tura gracza i AI), unicestwienie czwartym odwrotem, reset licznika w następnej turze, brak wyjątków strony.
BAZA: `origin/main` = `ef6e8ea1ee7c3d1019a537546153f53af9f4b115`. Start obrony: `f625fb824048feccddb321eec3ef382ab0427007` (kandydat rundy 1).

## Odpowiedzi na zarzuty Evaluatora (903aecbd)

### Zarzut 1 — pomiar kampanii NIE ZMIERZONO (tura gracza, tura AI, reset w następnej turze)
**ODRZUCAM żądanie zrobienia tego pomiaru w tym temacie; PRZYJMUJĘ fakt, że kryteria (1) i (3) są niespełnione.**
Dowody:
- `gra/src/game/civ-test-hooks.ts`, interfejs `CivTestApi` (linie ok. 130–166): dostępne są tylko `addUnit`, `setWar`, `endTurn`, `foundCity`, `adminSetup`, `setPolicy` i pokrewne. Brak jakiegokolwiek haka ruchu lub ataku (`move`, `attack`, `march`, `resolveBattle`). Grep `battle|bitw|retreat|odwr|attack|resolve` w tym pliku: 0 trafień (zgodnie z zarzutem Evaluatora).
- Każda kampanijna bitwa przechodzi przez `main.ts` (`recordRetreatOnRoster` przy `main.ts` ~36849) i `post-battle-map.ts` (~625, ~648). Bez ruchu atakującego w main.ts nie da się wywołać takiej bitwy z poziomu testu.
- Dodanie haka wymaga zmiany `gra/src` (civ-test-hooks.ts). Allowlista tematu tego nie dopuszcza (`gra/tools/*retreat*measure*.cjs` + runs/**).
- Dwóch najbliższych kandydatów też nie wystarcza: `ai-army-live-measure.cjs` (pełna gra, ale loguje tylko ruch AI, bez wymuszania bitwy — nagłówek linie 1–12) oraz `war-rules-multiwar-live-test.cjs` (`?playtest=mapa`, bez bitew).
Wniosek: pomiar kampanii wymaga nowego tematu z hakiem w `gra/src` (decyzja orkiestratora). W tym temacie zostaje NIE ZMIERZONO z powodem.

### Zarzut 2 — wiersze retreat=0 i 2 nie obejmują odwrotu (loserRetreatDistances=[])
**PRZYJMUJĘ.** Wiersze 0/2 nie dowodzą odwrotu i w raporcie nie wolno ich tak interpretować.
Poprawki w `gra/tools/battle-retreat-limit-measure.cjs` (commit tego tematu):
- Wiersz JSON zawiera teraz `loserSurvivorsExported`, `loserDeadStillOnMap`, `atkOnMap`, `defOnMap` (wcześniej tylko `loserDead`/`loserOnMap`/`loserRetreatDistances`).
- Nagłówek pliku mówi wprost: wiersze 0/2 nie dowodzą odwrotu.
Dowód z nowego uruchomienia (surowy wynik, scratch-kopia `gra/` poza repo, 9/9 przebiegów, `pageErrors=0`, `timedOut=0`):
- retreat=0 i retreat=2, seed 1/2/3 (6 wierszy): `loserSurvivorsExported=0`, `loserDeadStillOnMap=0`, `loserRetreatDistances=[]`, `loserDead=28`; seed 1/2: `defOnMap=22/23`, `atkOnMap=0`; seed 3: `atkOnMap=20`, `defOnMap=0`.
- retreat=3, seed 1/2/3 (3 wiersze): `loserSurvivorsExported=0`, `loserDead=28`, `loserRetreatDistances=[]`; `atkAnnihilated=true` (seed 1, 2) i `defAnnihilated=true` (seed 3), `*BudgetExhausted=true`. Zgodne z tabelą rundy 1.
Próba sprawdzenia, czy parametry URL entry zmieniają wynik (probe w scratch-kopii, nie w repo; `atkhp`/`defhp`):
- `atkhp=1.0, defhp=0.35, retreat=0`: `loserDead=28`, `loserSurvivorsExported=0`, `rosterSizes=[28,28]`.
- `atkhp=0.35, defhp=1.0, retreat=0`: `loserDead=28`, `loserSurvivorsExported=0`.
Wniosek: w entry (`gra/tools/battle-retreat-limit-browser-entry.ts`, poza allowlistą) przegrany zawsze ginie w całości, więc ścieżka odwrotu o 2 heksy nie jest wykonywana. Dla retreat=0/2 wynik „nie” znaczy tylko „brak unicestwienia przez limit”. Odwrót armii przegranej w bitwie jest NIE ZMIERZONO z powodem: skład armii jest stały w entry, a jego zmiana wymaga pliku spoza allowlisty.

### Zarzut 3 — niewyczerpana próba ścieżki żywej (brak sprawdzenia istniejących sterowników)
**PRZYJMUJĘ.** Rundę 1 zakończyłem bez udokumentowanego przeglądu sterowników. Przegląd wykonany teraz (grep/nagłówki, bez uruchamiania):
- `live-verify-battle-after-full-move-live.cjs`: scena bitwy przez `battle-rout-pursuit-browser-entry.html` (samodzielna scena, nie kampania).
- `siege-manual-battle-live.cjs`: `?playtest=oblezenie-duze`, poziom sceny bitwy.
- `live-verify-w18-w24-manual-losses-w3.cjs`: `?playtest=bitwa-duza|oblezenie-duze`, poziom sceny bitwy.
- `ai-army-live-measure.cjs`: pełna gra (realne `endTurn`), ale tylko ruch AI, bez wymuszania bitwy.
- `war-rules-multiwar-live-test.cjs`: `?playtest=mapa`, bez bitew.
Żaden z nich nie wymusza bitwy kampanijnej armii przez `main.ts`. Dlatego NIE ZMIERZONO pozostaje uzasadnione.

## ZMIERZONO (runda 2, surowe wyniki)

- Bramki (scratch-kopia `gra/` z `npm ci`, poza repo): nie uruchamiałem ponownie całego zestawu; Evaluator odtworzył `tsc`/logic/tech-tree/research/unit-replace/combat/battle-retreat-limit-test (43/0) na tym samym kandydacie. Zmiana w tej rundzie dotyczy wyłącznie pomiaru `.cjs` (nie kodu gry).
- `node --check gra/tools/battle-retreat-limit-measure.cjs`: OK (po poprawce).
- Pomiar poziomu bitwy po poprawce: `SUMMARY runs=6 pageErrors=0 timedOut=0` (retreat 0,2; seed 1,2,3) i `SUMMARY runs=3 pageErrors=0 timedOut=0` (retreat 3; seed 1,2,3).

## NIE ZMIERZONO (z powodem)

- Pomiar w kampanii (tura gracza, tura AI, reset w następnej turze): brak haka ruchu/ataku w `civ-test-hooks.ts`; wymaga zmiany `gra/src` spoza allowlisty (zarzut 1).
- Odwrót przegranej armii o 2 heksy (`loserRetreatDistances`): skład armii stały w entry, przegrany zawsze ginie (zarzut 2).
- Przypadek „odwrót wykonany a potem unicestwienie czwartym odwrotem” w tej samej turze: wymaga kampanii (zarzut 1).
- `battle-retreat-limit-browser-test.cjs` (BROWSER PASS z rundy 1) nie został ponownie uruchomiony w tej rundzie (NIE_ZMIERZONO w tej rundzie).

## ZMIANY-COMMIT

- `gra/tools/battle-retreat-limit-measure.cjs` (poprawka: pola `loserSurvivorsExported`, `loserDeadStillOnMap`, `atkOnMap`, `defOnMap` w wierszu JSON; zaktualizowany nagłówek o zakres i ograniczenia).
- `dyspozycje/autobot/runs/R-WEB-LIVE-VERIFY-ARMY-RETREAT-LIMIT-CAMPAIGN-Q1/30-obrona-claude.md` (ten raport).
- Brak zmian w `gra/src`, `gra/data`, `WERSJE.md`, manifeście, `gra-robocza/`, `rust-port/`.

## TESTY

- `node --check gra/tools/battle-retreat-limit-measure.cjs`: OK.
- `node tools/battle-retreat-limit-measure.cjs --seeds 1,2,3 --retreats 0,2` (scratch-kopia): `SUMMARY runs=6 pageErrors=0 timedOut=0`.
- `node tools/battle-retreat-limit-measure.cjs --seeds 1,2,3 --retreats 3` (scratch-kopia): `SUMMARY runs=3 pageErrors=0 timedOut=0`.
- Probe `atkhp/defhp` (scratch-kopia, nie w repo): 2 wiersze, `loserDead=28`, `loserSurvivorsExported=0`.
- `git diff --check`: wynik w sekcji poniżej (sprawdzony przed commitem).

## BLOKADY

- Pomiar kampanii wymaga nowego tematu z hakiem ruchu/ataku w `gra/src/game/civ-test-hooks.ts` (poza allowlistą tego tematu). Decyzja orkiestratora.
- Odwrót przegranej armii wymaga zmiany składu armii w `gra/tools/battle-retreat-limit-browser-entry.ts` (poza allowlistą) albo nowego entry.

## RUNDY

2/5. Ostatni werdykt Evaluatora: PASS-WITH-NOTES (3 zarzuty). Decyzja wymagana od orkiestratora: czy otworzyć temat na hak kampanii (ruch/atak przez main.ts + licznik per tura + reset w EOT), czy zamknąć pomiar jako częściowy (poziom bitwy + NIE ZMIERZONO kampanii).

## NASTĘPNY KROK

Evaluator: sprawdzić, że poprawka tylko dodaje pola JSON i zmienia nagłówek (allowlista), oraz odtworzyć `SUMMARY` dla retreat 0,2,3 na commicie. Final Control: rozstrzygnąć PASS-WITH-NOTES (pomiar poziomu bitwy + NIE ZMIERZONO kampanii i odwrotu przegranego). Orkiestrator: decyzja w sprawie osobnego tematu z hakiem kampanii.

## UWAGI-DLA-ORKIESTRATORA

- Dispatch wskazywał `origin/main` jako źródło pliku dispatch; plik istnieje tylko w gałęzi `claude/sprawdzenie-funkcjonalnosci-ek4ra0`. Nie wpływa na wynik.
- Harness w `battle-retreat-limit-browser-entry.ts` nie generuje przypadku z przeżywającym przegranym. Każdy wiersz 0/2 w `battle-retreat-limit-browser-test.cjs` (test z rundy 1, nie ruszany w tej rundzie) ma tę samą ograniczoność. Warto to mieć na uwadze, czytając jego „PASS” jako dowód dla przypadków 0/2.
- Scratch-kopia `gra/` z `node_modules` leży poza repo (katalog scratchpad sesji); do usunięcia po zamknięciu tematu.

DEPLOY/PUSH: NIE WYKONANO
