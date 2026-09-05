# R-MAPA-ETYKIETA-STOLICY-NAZWA-MIASTA-Q1 — Operator, runda 2

STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-MAPA-ETYKIETA-STOLICY-NAZWA-MIASTA-Q1
MODEL+EFFORT: Opus 5, effort high (Operator)
GOAL: R2-1 — plakietka obcej stolicy niesie SAMĄ nazwę miasta (ECHO „Sama nazwa miasta, bez
cywilizacji"); R2-2 — stolica AI bierze nazwę z `miasta_cywilizacji[0]`, nie z puli
miast-państw. Państwa-miasta, zwykłe obce miasta i miasta gracza bez zmian.

## ZMIANY

Baza `e39d49ee`. Allowlista, pliki dotknięte:

- `gra/src/game/display-names.ts` — nowe `foreignCapitalMapName(cityName, civ)`
  (miasto → degradacja do cywilizacji → pusto); `formatCityMapLabel` woła je zamiast
  gałęzi `isClusterCapital`. Opt-in `clusterCapitalWithCityName` z rundy 1 **usunięty** —
  po uproszczeniu do jednego członu nie miał drugiego konsumenta (`main.ts:7879` nigdy go
  nie ustawiał). Gałąź `isClusterCapital` w `resolveOwnerBaseName` dalej zwraca nazwę
  nacji: dyplomacja/HUD identyfikuje PAŃSTWO i zostaje bez zmian.
- `gra/src/game/city-names-pool.ts` — `foreignCapitalFromPool` czyta
  `miasta_cywilizacji[0]`; stara ścieżka (`miasta_panstwa[0]` → `ikonaId`) zostaje jako
  fallback przy niekompletnej puli.
- `gra/src/game/civ-names.ts` — poprawiony opis `foreignCapitalCityName` (tylko komentarz).
- `gra/tools/mapa-etykieta-stolicy-test.cjs` — asercje przepisane na nowe zachowanie,
  dołożone sekcje E (źródło nazwy stolicy AI) i F (sprzężenie pula → plakietka).
- `gra/tools/display-names-test.cjs` — jedna asercja („Neapol → Rzym") przepisana na
  „Neapol"; nadal mierzy tę samą gałąź.
- `dowody/pomiar-szerokosci-runda-2.cjs`, `dowody/zrzut-mapy-runda-2.cjs`,
  `dowody/mapa-obca-stolica-runda2-*.png`.

`gra/src/map/cluster-spawn.ts` i `gra/src/render/cities.ts` — **nietknięte**, mimo że
allowlista na to pozwalała: `cluster-spawn.ts:354` woła `foreignCapitalCityName`, więc
naprawa źródła nazwy mieści się piętro niżej. Danych (`city-names-pools.json`,
`civs.json`) nie ruszano.

## TESTY

- `tsc --noEmit` — zielone.
- `mapa-etykieta-stolicy-test.cjs` — **34/0**.
- `display-names-test.cjs` — **27/0** (parytet z bazą; przed rundą 2 było 26/1).
- Bramki referencyjne: logic 213/213, tech-tree 19/19, research 33/33, unit-replace 13/13,
  combat 6/6.
- Bramki nazw/etykiet: city-names-pool 12/0, city-names-pools 6/0, civ-names 6/0,
  danina-podatek-nazwa 15/0, diplomacy-display 35/0, rozmiar-label 13/0, save-label OK,
  unit-recruit-nazwa 17/0, battle-hp-display 7/7, bitwa-tożsamość-źródło 38 OK,
  cluster-start-q2-smoke 16/0.
- Czerwone, **parytet z czystą bazą potwierdzony pomiarem** (te same wyniki po
  `git stash` całej pracy): `flaga-mp-nie-gasnie` 31/1 (T14 liczy przypisania
  `startCityState` w `main.ts` — pliku nie dotykaliśmy) i `miasta-panstwa-wylaczone`
  52/3 (porównuje plan z PRE-drzewem `scratchpad/pre-main`, które jest starsze od
  bieżącego `origin/main` — różni się sam generator mapy: inny `playerStartHex` i inna
  liczba miast, 22 vs 24, czego zmiana nazw wywołać nie może). Obie czerwone przed
  tematem i po nim — nie są regresem tej pracy.
- `cluster-start-test.cjs` — TIMEOUT po 900 s (maszyna liczyła równolegle testy innych
  wątków); nie jest bramką referencyjną tego tematu.

## DOWÓD ŻYWY

`dowody/mapa-obca-stolica-runda2-zblizenie.png` — obejrzany. Plakietka chińskiej stolicy
AI: medalion kultury, korona, **XI'AN**, populacja 1, **bez wielokropka**. Zrzut rundy 1
w tym samym katalogu pokazuje w tym miejscu „QIN · CHIŃCZ…". Oba zadania widać na jednym
obrazie: nazwa pochodzi z `miasta_cywilizacji[0]` (R2-2) i dociera na plakietkę w całości
(R2-1). W tle miasta-państwa klastra „QI · MIASTO-PA…", „YAN · MIASTO-P…" — format
miast-państw nietknięty.

Nietautologiczność (mutacja źródła, cofnięta):
- odwrócenie kolejności w `foreignCapitalMapName` (plakietka znów pokazuje cywilizację):
  `mapa-etykieta-stolicy-test` 27/7, `display-names-test` 26/1;
- powrót `foreignCapitalFromPool` do `miasta_panstwa[0]`: `mapa-etykieta-stolicy-test`
  25/9 (E1 „Qin", E3 „Kiev", E8 pokazuje, że drugie miasto AI brało wtedy „Xi'an").

## POMIAR PRZYCIĘĆ (`dowody/pomiar-szerokosci-runda-2.cjs`, żywy Chromium, 700 22px Georgia)

Budżet stolicy `200 − prodW − growthW − crownW`: 181 px bez glifu produkcji, 161 px z nim.

| stan | 181 px | 161 px |
|---|---|---|
| przed tematem (nazwa cywilizacji) | 0/15 | 2/15 |
| runda 1 (dwa człony) | 14/15 | 15/15 |
| **runda 2 (nazwa miasta)** | **1/15** | **1/15** |

Model potwierdzony kotwicą: przewiduje dokładnie „QIN · CHIŃCZ…", czyli napis z żywego
zrzutu rundy 1.

## BLOKADA — dlaczego DECISION_REQUIRED, a nie PASS

Kryterium końca mówi „oczekiwane 0/15". Wyszło **1/15**: Zulusi, `uMgungundlovu` = 214 px
przy budżecie 181 px → `UMGUNGUND…`. Dispatch przewidział ten przypadek wprost:
„jeśli okaże się, że jednak nie [mieści się], to jest DECISION_REQUIRED, nie samodzielne
poszerzanie" — `cityMapStatChip.ts` pozostał nietknięty.

Kontekst do decyzji (nie usprawiedliwienie, dane):
1. To nie jest własność tej zmiany, tylko długości nazwy: **112 z 1500** nazw miast w
   pulach przekracza 181 px. Każde miasto z długą nazwą — także własne miasto gracza —
   jest dziś przycinane tak samo.
2. Dla Zulusów `miasta_panstwa[0]` = `miasta_cywilizacji[0]` = `uMgungundlovu`, więc
   **zuluski gracz widzi „UMGUNGUND…" na własnej stolicy już dziś**, przed tym tematem.
   Po zmianie stolica AI wygląda dokładnie tak samo jak stolica gracza — to parytet,
   nie rozjazd.
3. Wariant „zostawiamy" nic nie kosztuje; wariant „poszerzamy budżet/zmniejszamy font"
   dotyczy WSZYSTKICH długich nazw miast, więc powinien być osobnym tematem na
   `cityMapStatChip.ts`, nie doklejką tutaj.

## CZY POMYŁKA PULI DOTYCZY TEŻ KOLEJNYCH MIAST AI — NIE

- Pozostałe miasta obcego klastra (`cluster-spawn.ts:358` → `clusterRivalCityName` →
  `miasta_panstwa[1..]`) są **miastami-państwami** tego klastra
  (`isClusterCityStateSlot` = `!isClusterCapital`), więc pula państw-miast jest tam
  źródłem właściwym. Widać to na zrzucie: „QI · MIASTO-PA…", „CHU · MIASTO-P…".
- Miasta zakładane później przez AI osadnikiem (`main.ts` → `pickAiFoundedCityName` →
  `pickNextRegularCityName`) biorą z `miasta_cywilizacji` i pomijają nazwy już użyte —
  asercja E8 pokazuje, że po naprawie drugie miasto Chińczyków to `Luoyang`, bez
  duplikatu stolicy.
- Zasięg pomyłki był więc dokładnie jeden: nazwa stolicy AI, 2 z 15 cywilizacji.

## ZNALEZISKO POZA ZAKRESEM (nie zmieniane)

`playerCapitalFromPool` (`city-names-pool.ts:75`) — **pierwsze miasto GRACZA** też idzie
z `miasta_panstwa[0]`. Gracz grający Chińczykami zaczyna w mieście „Qin", Słowianami
w „Kiev". To ta sama klasa pomyłki, ale R2-2 mówi o stolicy AI, a zmiana ścieżki gracza
czerwieniłaby bramki spoza allowlisty (`cluster-start-test.cjs:104`,
`city-names-pool-test.cjs:56`, `cluster-start-q2-smoke`). Asercja E7 utrwala obecny stan,
żeby zmiana nie przeszła niezauważona. Do decyzji właściciela — osobny temat albo
rozszerzenie tego.

RUNDY: 2/5
NASTĘPNY KROK: Evaluator (ponumerowane zarzuty), potem Final Control.
DEPLOY/PUSH: NIE WYKONANO
