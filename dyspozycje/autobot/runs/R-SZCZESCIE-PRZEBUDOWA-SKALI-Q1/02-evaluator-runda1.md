# R-SZCZESCIE-PRZEBUDOWA-SKALI-Q1 — Evaluator, runda 1

STATUS: PASS-WITH-NOTES (werdyktu nie wydaje — Final Control)
DOMAIN: GAME
TEMAT: R-SZCZESCIE-PRZEBUDOWA-SKALI-Q1
ROLA: Evaluator · MODEL+EFFORT: Opus 5, effort high
GOAL: G1–G15, wszystkie liczby właściciela nietknięte.
IZOLACJA: `/home/user/wt-szczescie-skala`, HEAD `3ad84ee0`, baza `f570a91a` potwierdzona `git log -1`.

## KONTROLA LICZB WŁAŚCICIELA — komplet zgodny, ZERO strojenia

Własny odczyt JSON (`node -e` po `society-params.json`, `wonders.json`, `econ-params.json`,
`buildings.json`): kultura/religia `[10,16,23]` na easy/normal/hard; podatki −10/+10, próg 90;
zaopatrzenie 2; wojna −5; osiedle `[15,12,8,5]` ×3; sześć cudów `zadowolenie: 6` (i tylko one);
Spichlerz i Spichlerz II = 5 łącznie, Świątynia 3 / Teatr 4 / Akademia 4; `szczescie_max_epoka`
20/40/60 · 30/50/70 · 35/55/80; `szczescie_pct_cap` 120 i `szczescie_max_pop_wspolczynnik`
0,038/0,048/0,058 NIETKNIĘTE (§GRANICE zabrania — słusznie nie zrównane).
Własny pomiar przez bundlowany silnik: Wealth przy capie epoki = +10 dla epok 1/2/3; podatki
0%→−10, 45%→0, 90%→+10, 100%→+10; x·(2u−1) → 100%/75%/50%/0% = +x/+x÷2/0/−x; pop 8 =
**58 / 85 / 118**, szPct **120** we wszystkich trzech epokach. `conquestNoGarrisonLawPenalty`
= −3, NIETKNIĘTA; `conquestUnstableHappinessPenalty` = 0.
BUD policzone niezależnie od bramki (własne zwinięcie `upgradeFrom`): 11/23/31 budynków →
**14 / 25 / 42**. 19 `dajeSzczescie:true`, 22 `false`, katalog 41 — listy identyczne z dispatchem.
7 martwych kluczy: 0 trafień w `society-params.json` i w `gra/src` (trafienia to wyłącznie proza
w `opis`). `happinessBucketsFromPct` usunięte. Lista G1 jest DANYMI (pole per rekord), nie stałą TS.

## BRAMKI URUCHOMIONE PRZEZE MNIE

`tsc --noEmit` 0 błędów. Nowa bramka 430/430. tech-tree 19/19, research 33/33, unit-replace 13/13,
combat 6/6. **logic 212/213.** society-breakdown 32/10, building-happiness 3/5, wealth 26/2,
szczescie-zamoznosc 5/55, szczescie-skala-normalizacja 110/22, r-wzrost-…-ceramika 49/3,
war-happiness-parity 16/2 — każda wyłącznie na asercjach zastąpionej mechaniki (odczytałem treść
faili). Zielone: culture-religion 65/65, happiness-breakdown, porzadek-panel 81/81,
empire-religia-panel, ai-dlug-porzadki 17/17, city-orderstate 9/9, diplomacy-border-march 43/43,
territory-border 9/9 i -dense 15/15, border-march-scan 15/15. border-march-wygasanie 22/4 —
potwierdzam „nie regres": czterema failami są asercje na `onEventDismiss` w `main.ts` (bajt w bajt
jak baza).
`git diff f570a91a --stat`: 13 plików, wszystkie z allowlisty, **`gra/src/main.ts` nieobecny**.

Mutacje własne (każda cofnięta, `git diff --quiet` czysty po każdej):
`szczescie_max_epoka[normal][0]` 30→31 → 2 FAIL; `mury dajeSzczescie` false→true → 10 FAIL;
`koloseum zadowolenie` 6→5 → 1 FAIL; **`cityPanel` `wealthZadowolenie(..., era)` → `..., 1` → 0 FAIL**.

## ZARZUTY

1. **Kryterium 2i jest tautologiczne wobec realnego rozjazdu.**
   `gra/tools/szczescie-przebudowa-skali-test.cjs:461-466` sprawdza tylko, że wywołania
   `wealthZadowolenie` mają trzy argumenty (`w.split(',').length === 3`). Podmieniłem w
   `gra/src/ui/cityPanel.ts:3045` `era` na literał `1` — panel pokazywałby +10 Wealth przy W=10
   w każdej epoce, silnik nie — a bramka nadal 430/430. Punkt (7) porównuje
   `computeHappinessBreakdown` z `evaluateOrderFromBreakdown`, a ta druga woła tę pierwszą
   (`society-breakdown.ts:983`) — to porównanie funkcji z samą sobą. Znaczenie: „tryb trzeci"
   dispatchu (panel kłamiący wobec mechaniki) nie jest realnie zabezpieczony.

2. **G15 niedomknięte: panel pomija `haCuda` i zamraża `atWar`.**
   `gra/src/ui/cityPanel.ts:3086-3098` przekazuje do `evaluateOrderFromBreakdown` wejście BEZ
   `haCuda` i z `atWar: false`, podczas gdy silnik podaje `haCuda` (`main.ts:29154`) i `ownerAtWar`
   (`main.ts:29167`). Rozjazd istniał przed tematem, ale G11 podnosi go z max 21 do **36 pkt**
   (sześć cudów po +6), a G9 z −2 do **−5**. Komentarz w `cityPanel.ts:3050-3070` stwierdza wprost,
   że gałąź `fromEngine: true` NADPISUJE `porPct`/`bandLabel` wartościami z tego przeliczenia —
   więc gracz na wojnie i z cudami widzi inne pasmo Porządku niż egzekwuje silnik. Plik jest na
   allowliście, a G15 żąda „identycznego wyniku".

3. **Nieujawniony czerwony regres bramki: `gra/tools/citizen-resource-upkeep-test.cjs`.**
   `107 passed, 2 failed`: `:231` „linia niesie dokładnie przekazaną wartość (−3)" → got **−6**;
   `:236` netto → got −0,556 zamiast 2,444. Przyczyna to wprost G8 (mnożnik ×2 w
   `society-breakdown.ts:707-709`). Bramki nie ma w raporcie Operatora ani w jego wniosku o
   rozszerzenie allowlisty — wypada poza sugerowany grep kryterium 5, ale mierzy dokładnie
   zmienioną mechanikę. Sprawdziłem, że to nie parytet bazy: fail nie znika po zmianie wartości
   w JSON, bo asercja idzie ścieżką fallbacku `2` w kodzie.

4. **Kryterium końca 3 niespełnione.** `node gra/tools/society-breakdown-test.cjs` → 32 OK / 10 FAIL
   (4× siatka podatków, 3× wiersze Ceramika/Spichlerz, 3× cele PorPct T1 80/58/34 sprzed G10).
   Blokada leży w samym dispatchu (allowlista dopuszcza w tym pliku tylko usunięcie asercji
   `happinessBucketsFromPct`) — dlatego `DECISION_REQUIRED` jest statusem właściwym, ale kryterium
   pozostaje niespełnione i musi to rozstrzygnąć orkiestrator.

5. **Kryterium końca 4 niespełnione.** `logic-test` 212/213; fail: „religion: religionHappiness
   rewards our dominant religion and penalises a foreign one" (`gra/tools/logic-test.cjs:1370`) —
   asercja binarnego kontraktu, który G4 celowo kasuje. Plik poza allowlistą.

6. **Drobne: panel zaokrągla punkty Religii, silnik nie.** `gra/src/ui/cityPanel.ts:2971`
   (`Math.round(pkt * 10) / 10`) wobec `proporcjonalneSzczescie` bez zaokrąglenia
   (`society-breakdown.ts:497`). Przy x=23 i udziale 1/3 panel pokaże −7,7, a linia rozpiski
   niesie −7,667. Bramka 2i(6) zaokrągla OBIE strony, więc tego nie złapie.

## OBSERWACJE (bez zarzutu)

- `wealthZadowolenie` przycina `poziom` do capu (`wealth.ts:141`) — to nie strojenie, BALANS §3c
  mówi „maksimum +10 w każdej epoce".
- Konflikt w samym dispatchu: G13 każe zrównać wszystkie parametry na easy/normal/hard, a §GRANICE
  zabrania ruszać `szczescie_max_pop_wspolczynnik` (dziś 0,038/0,048/0,058). Operator wybrał zakaz —
  zgodnie z zasadą nadrzędną. Do decyzji właściciela.
- `gra/data/` bez skażenia `export-data`: pełny diff czterech plików to wyłącznie zamierzone klucze.

RUNDY: 1/5
NASTĘPNY KROK: Final Control (to samo ID, ta sama gałąź) po decyzji orkiestratora o allowliście.
DEPLOY/PUSH: NIE WYKONANO
