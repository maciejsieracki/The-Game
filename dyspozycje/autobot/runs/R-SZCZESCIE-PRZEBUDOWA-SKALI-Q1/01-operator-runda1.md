# R-SZCZESCIE-PRZEBUDOWA-SKALI-Q1 — Operator, runda 1

STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-SZCZESCIE-PRZEBUDOWA-SKALI-Q1
ROLA: Operator · MODEL+EFFORT: Opus 5, effort high
GOAL: Piętnaście zmian G1–G15 skali Szczęścia; wszystkie liczby od właściciela, żadna nie strojona.
IZOLACJA: `/home/user/wt-szczescie-skala`, gałąź `autobot/R-SZCZESCIE-PRZEBUDOWA-SKALI-Q1`, baza `f570a91a` potwierdzona `git log -1` przed pracą.

## ZMIANY/COMMIT

`9ca09b76` kod+dane (G1–G15) · `2c08deed` nowa bramka · `d29a53fc` hardening NaN.
(pełne SHA: `9ca09b76`, `2c08deed`, `d29a53fc`)

Dwanaście plików, wszystkie z allowlisty: `gra/data/{buildings,society-params,wonders,econ-params}.json`,
`gra/src/game/{society-breakdown,culture-religion,wealth,economy,conquest-stability}.ts`,
`gra/src/ui/cityPanel.ts`, `gra/tools/society-breakdown-test.cjs`,
`gra/tools/szczescie-przebudowa-skali-test.cjs` (NOWY). `main.ts` NIETKNIĘTY (0 bajtów różnicy wobec bazy).
Audyt `gra/data/`: `buildings.json` = tylko `dajeSzczescie` ×41 + `spichlerz`/`spichlerz_ii` `baza.zadowolenie`;
`wonders.json` = 5 linii `zadowolenie 3→6`; `econ-params.json` = 1 klucz; `society-params.json` = 13 usuniętych,
5 dodanych, 3 zmienione. Zero zmian ubocznych.

**Decyzje projektowe (uzasadnienie w raporcie, nie strojenie liczb):**
- G1 lista jako DANE: pole `dajeSzczescie` per budynek w `buildings.json` (nie lista centralna) — nowy budynek
  klasyfikuje się razem ze swoim rekordem. Brak pola = `false`.
- G4 bez `main.ts`: `x` per epoka jest znane dopiero w `computeHappinessBreakdown`, więc `religionHappiness`
  zwraca ZNORMALIZOWANY wskaźnik [−1,+1], a punkty powstają w jednym miejscu — silnik i panel liczą jednym torem.
  `cultureHappiness` nietknięte (linia Kultury liczy się z `ownCultureShare`), żeby nie czerwienić `logic-test` ponad konieczność.
- G8 bez `citizen-resource-upkeep.json` (poza allowlistą): `_kara ±1` traktowane jako wskaźnik binarny,
  punkty przez nowy `szczescie_zaopatrzenie_na_surowiec = 2`. Wynik = ±2/surowiec, zgodnie z decyzją właściciela.
- `szczescie_max_pop_wspolczynnik` zostawiony 0,038/0,048/0,058 — dispatch mówi „BEZ ZMIAN, ZOSTAJE”; nie zrównałem go do 0,048.

## TESTY

- `tsc --noEmit` — **0 błędów**.
- **NOWA BRAMKA `szczescie-przebudowa-skali-test.cjs` — 430 OK / 0 FAIL**, kryteria 2a–2i komplet
  (per budynek 19/22, BUD 14/25/42 przy 11/23/31 budynkach, ±x i 50%→0 i 75%→x/2, Wealth cap→+10 w 3 epokach,
  podatki −10/+10/0, ±2 na surowiec, skan negatywny 7 kluczy, pop 8 = **58/85/118** i **szPct 120%**, parytet panel↔silnik).
- Nietautologiczność (3 mutacje, każda cofnięta, `git diff --quiet` po każdej):
  `szczescie_max_epoka[normal] 30→31` → **2 faile**; `szczescie_skala_kultura_religia[normal] 16→17` → **11 faili**;
  `buildings.json mury dajeSzczescie false→true` → **10 faili**. Po cofnięciu: 430/430.
- Bramki referencyjne: tech-tree 19/19, research 33/33, unit-replace 13/13, combat 6/6 — zielone.
  **logic-test 212/213** — jedna asercja (`tools/logic-test.cjs:1370`) sprawdza binarny kontrakt
  `religionHappiness`, który G4 zastępuje.
- Rodzina szczęścia/porządku (wszystkie znalezione, uruchomione): zielone — `culture-religion` 65/65,
  `happiness-breakdown` 38/38, `porzadek-panel-czytelnosc` 81/81, `empire-religia-panel-coverage` 15/15,
  `ai-dlug-porzadki` 17/17, `city-orderstate-restore-clear` 9/9, `diplomacy-border-march` 43/43,
  `territory-border` 9/9 i `-dense` 15/15, `border-march-scan` 15/15.
  Czerwone, każde wyłącznie na asercjach zastąpionej mechaniki: `szczescie-zamoznosc` 5/55 (siatka podatków),
  `szczescie-skala-normalizacja` 110/22 (szMax 14/20/28), `society-breakdown` 32/10, `building-happiness` 3/5,
  `r-wzrost-szczescie-dubel-wealth-ceramika` 49/3, `war-happiness-parity` 16/2 (wojna −3), `wealth-test` 26/2.
  `border-march-wygasanie` 22/4 — **nie regres**: czyta wyłącznie `main.ts`, który jest bajt w bajt jak w bazie.

## BLOKADY — dlaczego DECISION_REQUIRED (C-054, §3a)

Dispatch wymaga zachowania, które czerwieni bramki, a jednocześnie zabrania je poprawić:

1. **Kryterium 4 vs G4.** `tools/logic-test.cjs:1370` asertuje `religionHappiness == zadowolenieDominujaca / karaObca /
   karaBrakReligii`. G4 kasuje ten binarny przeskok. Plik poza allowlistą → 212/213 nie do naprawienia.
2. **Kryterium 3 vs G3/G7/G10.** `society-breakdown-test.cjs` ma być zielony, ale allowlista dopuszcza w nim
   TYLKO usunięcie asercji `happinessBucketsFromPct` (zrobione). Zostaje 10 faili: 4× siatka podatków,
   3× wiersze Ceramika/Spichlerz, 3× symulacja PorPct T1 (cele 80/58/34 sprzed G10).
3. **G8 a `data/citizen-resource-upkeep.json`** — jedyne miejsce z ±1; poza allowlistą. Obszedłem to mnożnikiem
   w `society-params.json` (wynik zgodny z decyzją właściciela), ale docelowo `_kara` powinno nieść wprost ±2.

**Proszę o rozstrzygnięcie orkiestratora:** rozszerzyć allowlistę o `gra/tools/{logic-test, society-breakdown-test,
szczescie-zamoznosc-test, szczescie-skala-normalizacja-test, building-happiness-test,
r-wzrost-szczescie-dubel-wealth-ceramika-test, war-happiness-parity-test, wealth-test}.cjs`
oraz `gra/data/citizen-resource-upkeep.json` — albo wskazać inne rozwiązanie. Żadna zmiana kodu gry nie jest potrzebna.

## OBSERWACJE (bez zmian, do wiadomości właściciela)

- BUD 14/25/42 to suma na POZIOMIE BAZOWYM budynków. Z realnym `buildingLevelForEpoch` miasto epoki 3 ma 49,
  nie 42 (Studnia/Kamienne kręgi/Świątynia/Akwedukt/Trybunał rosną z poziomem). Nie ruszałem — to liczba właściciela.
- `religia_zadowolenie_dominujaca` / `_kara_obca` / `_kara_brak_religii` zostają w danych i w `ReligionParams`;
  po G4 nie sterują już Szczęściem, a `empireDetailPanel.ts` (poza allowlistą) nadal je wyświetla.

RUNDY: 1/5
NASTĘPNY KROK: decyzja orkiestratora o allowliście, potem Evaluator (to samo ID, ta sama gałąź).
DEPLOY/PUSH: NIE WYKONANO
