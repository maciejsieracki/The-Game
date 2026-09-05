# R-SZCZESCIE-PRZEBUDOWA-SKALI-Q1 — Operator, runda 2

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-SZCZESCIE-PRZEBUDOWA-SKALI-Q1
ROLA: Operator · MODEL+EFFORT: Opus 5, effort high
GOAL: przepisać asercje ośmiu bramek na kontrakt G1–G15 (allowlista rozszerzona ratyfikacją
rundy 2) i domknąć G8 w postaci docelowej. Żadna liczba balansu nie strojona.
IZOLACJA: `/home/user/wt-szczescie-skala`, gałąź `autobot/R-SZCZESCIE-PRZEBUDOWA-SKALI-Q1`.
Baza rundy `c9bc5d34` (praca rund 1 + ratyfikacja), commit rundy 2 leży na `eccac414`.

## ZMIANY/COMMIT

`5ba58273` — 12 plików, **wszystkie z allowlisty po ratyfikacji rundy 2**:
`gra/data/{citizen-resource-upkeep,society-params}.json`, `gra/src/game/society-breakdown.ts`,
`gra/tools/{logic-test, society-breakdown-test, szczescie-zamoznosc-test,
szczescie-skala-normalizacja-test, building-happiness-test,
r-wzrost-szczescie-dubel-wealth-ceramika-test, war-happiness-parity-test, wealth-test,
szczescie-przebudowa-skali-test}.cjs`.
`gra/src/main.ts` NIETKNIĘTY. Zero `git add -A` / `git add .` — staging per plik.

### G8 — postać docelowa (ratyfikacja, punkt „G8")

Przeniosłem `±2` **wprost** do `gra/data/citizen-resource-upkeep.json` → `_kara`
(`szczescieZaDostepny: 2`, `szczescieZaBrakujacy: -2`; `rozwojPctZaBrakujacy` **nie był**
objęty decyzją i zostaje `-1`). Mnożnik obejściowy `szczescie_zaopatrzenie_na_surowiec`
**usunięty** z `society-params.json` i z `society-breakdown.ts` — rozpiska wstawia teraz
`citizenResourceHappinessDelta` **1:1**. Nie trzymam obu naraz.

To naprawia przy okazji **zarzut 3 Evaluatora**: `citizen-resource-upkeep-test.cjs` miało
`107/2` z powodu mnożnika łamiącego kontrakt „linia niesie dokładnie przekazaną wartość".
Te dwa faile zniknęły. Szczegół w BLOKADACH.

## PRZEPISANE ASERCJE — co sprawdzały przed, przez co są sprawdzane po

Zasada: **ani jednej asercji nie usunąłem po cichu.** Liczba asercji rośnie w każdym pliku.

### 1. `gra/tools/logic-test.cjs` — 212/213 → **213/213**

Zakres: **wyłącznie** asercja `:1370`. Reszta pliku nietknięta (`git diff` = jeden hunk
+ komentarz nad nim).

| przed | po |
|---|---|
| `religionHappiness` zwraca `zadowolenieDominujaca` przy 90% własnej, `karaObca` przy 90% obcej, `karaBrakReligii` przy rozłamie 50/50 — kontrakt **binarny** | ten sam wywód na **znormalizowanym wskaźniku [−1,+1]**: 90% własnej → `+0,8`, 90% obcej → `−0,8`; dołożone krańce 100%/0% → `+1`/`−1` i punkt pośredni 75% → `+0,5` |

**Bez odpowiednika, mówię wprost:** przypadek `karaBrakReligii` (mała stała kara przy braku
dominacji) **nie ma odpowiednika w nowej mechanice**. Na skali proporcjonalnej miasto 50/50
jest DOKŁADNIE neutralne — to decyzja G4 właściciela, nie moja. Asercji nie usunąłem:
w jej miejscu ten sam wywód sprawdza teraz `=== 0`, czyli że rozłam daje zero, a nie karę.
`zadowolenieDominujaca` / `karaObca` / `karaBrakReligii` **zostają** w `ReligionParams`
i w danych — nadal wyświetla je panel imperium, po prostu nie sterują już Szczęściem.

### 2. `gra/tools/society-breakdown-test.cjs` — 32/10 → **53/0** (42 → 53 asercji)

Cztery faile siatki podatków, trzy wiersze Ceramika/Spichlerz, trzy cele PorPct T1.

| przed | po |
|---|---|
| `luksusHappinessBonus(25/30/50/70, null, 'normal')` = `+1/+2/+4/+6` — **siatka schodkowa**, wywołana z `society = null`, więc mierzy FALLBACK w TS | te same cztery punkty na **skali liniowej** G7: `−4,44 / −3,33 / +1,11 / +5,56`; **dołożone trzy kotwice** krańców na tym samym fallbacku: `0% → −10`, `90% → +10`, `45% → dokładnie 0`. Wartość dodana bez zmian: pilnuje, żeby stała w kodzie nie rozjechała się z decyzją właściciela |
| `Ceramika` = dokładnie +1 na miasto także przy wejściu 111 (ochrona przed owner-wide multiplication) | pole `ceramikaZadowolenie` jest **IGNOROWANE** — linii `ceramika` w rozpisce nie ma. To bramka **mocniejsza** niż poprzednia: przed chroniła przed zawyżeniem bonusu, po chroni przed powrotem samego dubla |
| `Spichlerz (działający)` = dokładnie +1 na miasto także przy 111 | j.w. dla `spichlerzZadowolenie`; Spichlerz liczy się teraz jako budynek (+5, G2) |
| `Ceramika + Spichlerz = +2` (suma dwóch linii) | `netto` z wejściem `111/111` = `netto` **bez tych pól** — czyli oba kanały wnoszą dokładnie 0 |
| `D-START-OSIEDLE`: PorPct T1 pop=1 = `80 / 58 / 34` (±4) dla easy/normal/hard | `94,8 / 73,4 / 59,2` (±4, ta sama tolerancja) — patrz „skąd te liczby" niżej; **dołożone** pasmo (`Ład`/`Spokój`/`Napięcie`), bonus osiedla `+15` per scenariusz oraz ścisła monotoniczność `easy > normal > hard` |
| *(asercja `happinessBucketsFromPct` usunięta w rundzie 1)* | w jej miejsce **skan po ŹRÓDLE** `society-breakdown.ts` — identyfikator nie występuje w pliku. Nie użyłem `typeof M.happinessBucketsFromPct === 'undefined'`, bo entry point tej bramki i tak jej nie eksportuje: taka asercja **nie mogłaby zaczerwienieć** i byłaby dokładnie tautologią, o którą pyta reguła anty-halucynacyjna |

**Skąd `94,8 / 73,4 / 59,2`.** To **pomiar** na parametrach właściciela, nie liczba dobrana
pod bramkę. Stare cele `80/58/34` policzono na siatce sprzed zmiany; przestawiły je cztery
decyzje naraz: G10 (osiedle przy pop 1: +4 → **+15**), G7 (podatki przy udziale 10%: 0/−1/−2 →
**−7,78**), G4 (Kultura i Religia z udziału × x(epoka)), G13 (mianownik 14 → **20/30/35**).
Tolerancja `±4` i sprawdzanie pasma **zostały bez zmian** — nie rozluźniłem ich.

**Poprawka wejść, nie asercji:** scenariusze podawały `haKult: 3 / 2 / 1` i `haRel: 3 / 2 / 1`.
Po G4 `haRel` to znormalizowany wskaźnik `[−1,+1]`, więc **wszystkie trzy obcinały się do +1**
i oznaczały to samo — różnicowanie było pozorne. Scenariusze dostają teraz jawnie
`ownCultureShare: 1, ownReligionShare: 1`, a **jedyną** różnicą między nimi jest trudność.
To jest dokładnie właściwość, którą G13 obiecuje: trudność wyrażana wyłącznie mianownikiem.

### 3. `gra/tools/szczescie-zamoznosc-test.cjs` — 5/55 → **88/0** (60 → 88 asercji)

| przed | po |
|---|---|
| 30 przypadków: 10 dziesiątek × 3 trudności wobec **trzech różnych siatek** (`easy [1..10]`, `normal [-1..8]`, `hard [-2..7]`) | 30 przypadków wobec **jednej skali liniowej**, wartość dziesiątki `idx` zapisana wprost regułą właściciela jako `(−90 + 20·idx)/9` — literały w teście, nie wywołanie implementacji |
| — | **dołożone 21 asercji parytetu trudności** (co 5 p.p. od 0 do 100: `easy === normal === hard`). Przed G7 ta asercja nie miała prawa przejść; dziś jej złamanie znaczy, że ktoś wrócił do trójki per parametr |
| 5 przypadków „jawnie wymaganych": `0%/9% → −1`, `5% hard → −2`, `20% → +1`, `100% easy → +10` | 5 kotwic wprost z decyzji właściciela: `0% → −10`, `90% → +10`, `45% → dokładnie 0`, `100% → +10` (nasycenie), `20% → −5,56` |
| 18 asercji granic bracketów (9 vs 10, 19 vs 20, 89 vs 90) — właściwość **schodków** | 18 asercji **braku schodków**: dla każdej trudności `w(10) < w(19)`, `w(20) < w(29)`, `w(80) < w(89)` (pary, które PRZED G7 dawały identycznie, bo leżały w jednym bracketcie) plus trzy dawne granice, nadal rosnące. Dołożone: **stały krok** 20/90 na 1 p.p. mierzony w trzech miejscach skali i nasycenie za progiem 90% |
| 3 asercje wartości spoza zakresu (`−5`, `150`, `NaN`) | te same trzy, nowe wartości (`−10`, `+10`, `−10`) — właściwość clampu bez zmian |
| 4 asercje integracji z rozpiską: 5% → linia `wysokie_podatki` = −1; **domyślne miasto 20% → linia `niskie_podatki` = +1** | 5% → `wysokie_podatki` = −8,89 (bez zmian co do właściwości). Próbka linii **dodatniej** musiała przesunąć się ponad punkt obojętny 45% — jest nią teraz udział 60% → `niskie_podatki` = +3,33. Domyślne miasto (20%) zostało **zapisane osobno** jako fakt: po G7 to `wysokie_podatki` −5,56, i bramka pilnuje, żeby ta zmiana nie przeszła niezauważona |

### 4. `gra/tools/szczescie-skala-normalizacja-test.cjs` — 110/22 → **141/0** (132 → 141)

| przed | po |
|---|---|
| 1a: `szMaxByEra` = `14,20,28` na każdej trudności — „liczby w JSON są DOKŁADNIE tymi, które były zahardkodowane w TS" (równoważność przeniesienia stałej) | `szMaxByEra` = tabela G13 właściciela per trudność (`20,40,60` / `30,50,70` / `35,55,80`). **Dołożona asercja, której przed nie dało się napisać:** wartości **różnią się** od `SZMAX_DEFAULTS`, więc bramka odróżnia teraz „wczytano z JSON" od „wzięto fallback z TS" — przy równych liczbach było to niesprawdzalne |
| 1b: `szMaxForEra(1,2,3,4,7)` = `14,20,28,28,28` | `30,50,70,70,70`. **Sedno pętli bez zmian:** epoka poza tablicą dostaje wartość epoki 3. Strona Prawa (`prawMaxForEra` 50/75/100) **nietknięta** — G13 jej nie dotyczył |
| 1c: pełny przebieg pop 2 / epoka 1: `netto 16`, `szMax 14`, `SzPct 114,3%` | ten sam przebieg: `netto 27,22`, `szMax 30`, `SzPct 90,7%` — **plus rozbicie na cztery składniki** (Budynki 13, Osiedle +12, Kultura +10, podatki −7,78), żeby zmiana któregokolwiek z nich nie schowała się w sumie. Równoważność „co do cyfry jak przed" została zerwana **świadomie przez właściciela** (G4/G7/G10/G13), nie przeze mnie |
| 5: `szMaxForCity(1, pop 1|2)` = `14` na każdej trudności | `= SZMAX_G13[diff][0]` (20/30/35). **Właściwość bez zmian:** przy pop ≤ populacji odniesienia mianownik jest czystą wartością epoki, bez skalowania |
| 6: zrzut właściciela — `netto 16`, `SzPct PRZED 114,3%` | `netto 27,22`, `SzPct PRZED 90,7%`. Zrzut pochodzi **sprzed tego tematu** i po stronie Szczęścia jest już nieodtwarzalny. **Strona Prawa (40%) nietknięta** — Prawo nie było objęte tematem i musi zgadzać się ze zrzutem co do cyfry |
| 7: `dobijaPrzed.szPct === 120` — odtworzenie objawu ze zgłoszenia („im dalej w las, tym szczęście wyższe") na stanie z wyłączonym skalowaniem populacji | objaw odtwarzam na stanie sprzed **OBU** tematów: nowy helper `societyPrzedG13()` cofa mianownik do `14/20/28` **i** wyłącza skalowanie → `szPct = 120%` dokładnie jak w zgłoszeniu. **Dołożona** asercja, że sam G13 (28 → 70) już zbija miasto z capu. Bramka nadal odtwarza objaw, a nie tylko opisuje stan po naprawie |
| 8: kotwice tabeli `szMaxForCity(1,12) = 22,4`, `(3,12) = 44,8` | `48,0` i `112,0` (mnożnik populacji **niezmieniony**, zmieniła się wyłącznie baza epoki 14→30 i 28→70). **Dołożona** kotwica samego mnożnika: `prog(12)/prog(2)` musi być identyczny w epokach 1 i 3, żeby zmiana bazy nie zamaskowała zmiany współczynnika |

### 5. `gra/tools/building-happiness-test.cjs` — 3/5 → **14/0** (8 → 14)

| przed | po |
|---|---|
| `buildingHappinessAtLevel(mury, 1) === 1` — budynek z `zadowolenie 0` i tak dostaje ryczałt +1 | rozbite na dwie: `buildingGivesHappiness(mury) === false` i `buildingHappinessAtLevel(mury,1) === 0`. **Właściwość „budynek bez własnego bonusu i tak dostaje ryczałt" NIE zniknęła** — przeniosła się na budynek szczęściodajny bez bonusu: dołożone `targowisko.baza.zadowolenie === 0`, `buildingGivesHappiness(targowisko) === true`, `buildingHappinessAtLevel(targowisko,1) === 1` |
| suma trzech budynków = `1 + 3 + studnia` = `6` | `0 + 3 + studnia` = `5` (Mury wypadły z ryczałtu). **Dołożona kontrola dodatnia:** podmiana Mury → Targowisko podnosi sumę o dokładnie +1, więc suma nadal liczy ryczałt, a nie tylko `baza.zadowolenie` |
| `budLine.label` zawiera `+1` — etykieta mówi graczowi regułę „+1 za budynek" | etykieta zawiera `szczęściodajne` **oraz** (asercja negatywna) **NIE** zawiera `+1`. Po G1 obietnica „+1 za każdy budynek" byłaby wobec gracza kłamstwem — 22 budynki dają 0. Właściwość bez zmian: rozpiska nazywa POWÓD wartości linii, nie samą liczbę |

### 6. `gra/tools/r-wzrost-szczescie-dubel-wealth-ceramika-test.cjs` — 49/3 → **54/0** (52 → 54)

| przed | po |
|---|---|
| `Ceramika` osobna linia +1 na miasto | linii `ceramika` nie ma — pole ignorowane (G3) |
| `Spichlerz` osobna linia +1 na miasto | linii `spichlerz` nie ma — pole ignorowane (G3) |
| kontrolowane kanały = `Wealth 10 + Ceramika 1 + Spichlerz 1` = **12** | kontrolowane kanały = **10** (sam Wealth); Ceramika i Spichlerz nie dokładają się drugi raz |
| — | **dołożona reguła „111" po nowemu:** `netto` i **liczba wierszy** rozpiski z wejściem `111/111` identyczne jak bez tych pól. Oryginalny temat pilnował, żeby bonus per miasto nie był mnożony przez liczbę miast — po G3 pilnuje, żeby dubel w ogóle nie wrócił |

### 7. `gra/tools/war-happiness-parity-test.cjs` — 16/2 → **21/0** (18 → 21)

| przed | po |
|---|---|
| `wojnaLine.value === -3` u gracza | `=== -5` (G9). Właściwość bez zmian: wojna wnosi **jedną, jawną** linię ujemną o wartości z parametru `szczescie_kara_wojna` |
| `wojnaLine.value === -3` u AI (parytet) | `=== -5`, parytet gracz/AI bez zmian |
| — | **dołożone trzy asercje antydryfowe:** `society-params.json` niesie `-5`; kara liczona **z JSON** równa się karze z domyślnej stałej TS (jedna liczba, nie dwie); `easy === normal === hard` (G13). Bez tego G9 dałoby się wprowadzić w jednym tylko nośniku, a bramka i tak by zzieleniała |

### 8. `gra/tools/wealth-test.cjs` — 26/2 → **36/0** (28 → 36)

| przed | po |
|---|---|
| `wealthZadowolenie(0, P)` = 0 | `wealthZadowolenie(0, P, 1)` = 0 — bez zmian (karaZero) |
| `wealthZadowolenie(9, P)` = 0 — „poniżej pierwszego stopnia" | właściwość zachowana, ale musiała zmienić epokę: `wealthZadowolenie(2, P, 3)` = 0 (`floor(2·10/30)`). Dołożone `wealthZadowolenie(9, P, 1)` = 9 — proporcjonalnie, bez schodka co 10 |
| `wealthZadowolenie(10, P)` = **+1** | `wealthZadowolenie(10, P, 1)` = **+10** — poziom = cap epoki daje maksimum |
| `wealthZadowolenie(100, P)` = +10 | `wealthZadowolenie(100, P, 10)` = +10 — cap epoki 10 |
| — | **dołożone 5:** rosnący próg przy stałym suficie (`10@ep2 = +5`, `10@ep3 = +3`, `20@ep2 = +10`, `30@ep3 = +10`), twardy sufit (`999@ep3 = +10`) oraz odporność na epokę nieliczbową/zerową (`50@ep0 = 0`, wynik zawsze skończony — hardening `d29a53fc`, dotąd niepokryty bramką) |

### 9. `gra/tools/szczescie-przebudowa-skali-test.cjs` (nowa bramka) — 430/0 → **446/0** w moim commicie

Przepisany wyłącznie blok **2f** (G8): kotwice przeniosły się z „`_kara` niesie ±1, punkty daje
mnożnik" na „`_kara` niesie ±2, rozpiska wstawia 1:1". Dołożone: stałe TS czytają `2/−2`
z danych (a nie z fallbacku `1/−1`), asercja **negatywna** że `szczescie_zaopatrzenie_na_surowiec`
zniknął (jeden nośnik liczby, nie dwa) oraz **koniec-do-końca** przez prawdziwe
`resolveCitizenResourceCoverage` dla epok 1–3 (NSUR 2/4/5 → `±4 / ±8 / ±10`) plus jawna symetria
(bonus + kara = 0). Sekcje 2h/2i dostały skorygowane wejście `delta` (było `NSUR`, jest `2·NSUR`),
bo delta niesie teraz punkty, a nie wskaźnik.

> **Uwaga:** ta bramka pokazuje dziś `511 OK` — 65 asercji ponad mój commit dołożył
> **równolegle pracujący Operator rundy 3** (patrz BLOKADY, punkt 3). To nie jest moja praca.

## TESTY

- `node ./node_modules/typescript/bin/tsc --noEmit` — **0 błędów** (exit 0).
- **Osiem bramek z ratyfikacji — wszystkie ZIELONE:**
  `logic-test` **213/213** · `society-breakdown-test` 53/0 · `szczescie-zamoznosc-test` 88/0 ·
  `szczescie-skala-normalizacja-test` 141/0 · `building-happiness-test` 14/0 ·
  `r-wzrost-…-ceramika-test` 54/0 · `war-happiness-parity-test` 21/0 · `wealth-test` 36/0.
- Nowa bramka `szczescie-przebudowa-skali-test` — **446/0** w commicie `5ba58273`.
- **Pięć bramek referencyjnych:** logic 213/213, tech-tree 19/19, research 33/33,
  unit-replace 13/13, combat 6/6 — komplet zielony.
- **Rodzina szczęścia/porządku (pełny grep kryterium 5), wszystkie zielone:**
  culture-religion 65/65, happiness-breakdown 38/38, porzadek-panel-czytelnosc 81/81,
  empire-religia-panel-coverage 15/15, ai-dlug-porzadki 17/17, city-orderstate-restore-clear 9/9,
  diplomacy-border-march 43/43, territory-border 9/9, territory-border-dense 15/15,
  border-march-scan 15/15.
- `border-march-wygasanie-test` 22/4 — **nie regres, potwierdzone pomiarem:** identyczne
  22/4 na czystym `main` (`/home/user/The-Game`, `1c218f5d`); czyta wyłącznie `main.ts`,
  bajt w bajt jak baza.
- `citizen-resource-upkeep-test` 107/2 — patrz BLOKADY, punkt 1.

### Dowód nietautologiczności — 14 mutacji, każda cofnięta, `git diff --quiet` czysty po każdej

Mutacje robione przez kopię/odtworzenie pliku, **nigdy** przez `git checkout` — w tym worktree
pracuje równolegle drugi Operator i `git checkout -- gra/` skasowałby jego niezacommitowaną pracę.

| # | mutacja | skutek |
|---|---|---|
| M1 | `religionHappiness`: `2·u−1` → `u` (kasuje normalizację do [−1,+1]) | **logic-test 212/213** — czerwieni dokładnie przepisaną asercję `:1370` |
| M2 | fallback TS `PODATKI_MAX_DEFAULT` 10 → 9 | **society-breakdown-test 47/6** (ścieżka `society = null`) |
| M3 | `szczescie_podatki_prog_pct` normal 90 → 80 | **szczescie-zamoznosc-test 53/35** — łamie i liniowość, i parytet trudności |
| M4 | `szczescie_max_epoka` easy[1] 20 → 21 | **szczescie-skala-normalizacja 138/3**: 1a (`20,40,60`) + dwie asercje neutralności startowej |
| M5 | `szczescie_bonus_osiedle_pop` easy[0] 15 → 14 | **society-breakdown-test 52/1** (asercja `+15` przy pop 1) |
| M6 | `buildings.json` `targowisko.dajeSzczescie` true → false | **building-happiness-test 11/3** — czerwieni przepisaną kontrolę dodatnią ryczałtu |
| M7 | przywrócone dublujące linie G3 (Ceramika +1 / Spichlerz +1) | **r-wzrost 49/5** i **society-breakdown-test 50/3** — obie przepisane grupy łapią powrót dubla |
| M8 | `szczescie_kara_wojna` normal −5 → −4 | **war-happiness-parity 18/3** — łapie też rozjazd JSON vs stała TS |
| M9 | `wealthZadowolenie`: usunięte przycięcie poziomu do capu | **wealth-test 35/1** (nowa asercja twardego sufitu `999@ep3`) |
| M10 | `wealthZadowolenie` ignoruje epokę (cap zawsze epoki 1) | **wealth-test 32/4** — G6 (zmiana sygnatury) realnie pokryty |
| M11 | `_kara.szczescieZaDostepny` 2 → 1 | `citizen-resource-upkeep-test` przestawia się na inną parę faili — patrz BLOKADY 1 |
| M12 | przywrócony mnożnik obok ±2 w danych (dwa nośniki tej samej liczby) | **citizen-resource-upkeep-test 105/4** — podwójne liczenie jest wykrywane |
| M13 | `szczescie_max_pop_wspolczynnik` normal 0,048 → 0,05 | **szczescie-skala-normalizacja 139/2** — obie kotwice tabeli z sekcji 8 |
| M14 | `szczescie_pct_cap` normal 120 → 130 | **szczescie-skala-normalizacja 137/4**, w tym **przepisane odtworzenie objawu ze zgłoszenia** — dowód, że sekcja 7 nadal mierzy, a nie tylko opisuje |

Po każdej mutacji plik przywrócony z kopii i zweryfikowany `git diff --quiet <plik>` = czysto.
Stan końcowy drzewa: brudne wyłącznie `gra/src/ui/cityPanel.ts` i
`gra/tools/szczescie-przebudowa-skali-test.cjs` — **praca równoległego Operatora rundy 3, nie moja.**

## BLOKADY

### 1. `gra/tools/citizen-resource-upkeep-test.cjs` — 107/2, plik POZA allowlistą

Bramka jest **zielona na `main`** (109/0) i **czerwona na gałęzi** — to regres, którego runda 1
nie zgłosiła (wypada poza grep kryterium 5; Evaluator znalazł go jako zarzut 3).

Runda 2 **poprawiła jej stan, ale nie domknęła**:
- **zniknęły** dwa faile kontraktowe (`linia niesie dokładnie przekazaną wartość (−3)` → było
  `−6`; `netto = netto_bez_kary + (−3)`) — to była realna **regresja zachowania** z mnożnika ×2;
- **pojawiły się** dwa faile na literałach `:208-209`: `kanon: +1 Szczęście za dostępny surowiec`
  i `kanon: −1 Szczęście za brakujący surowiec`. To są **stare liczby właściciela**, które G8
  jawnie zmienił na `±2`. Pozostałe asercje tego pliku używają stałych symbolicznie
  (`M.CITIZEN_UPKEEP_HAPPINESS_PER_*`) i przeszły bez zmian.

Ratyfikacja rozszerzyła allowlistę o `gra/data/citizen-resource-upkeep.json`, ale **nie**
o bramkę, która pilnuje tych liczb. Zmiana jest dwuwierszowa (`1` → `2`, `-1` → `-2`
plus komentarz). **Nie tknąłem pliku spoza allowlisty** — proszę o jedną linię ratyfikacji.

Rozważałem zostawienie mnożnika (ratyfikacja na to pozwala z uzasadnieniem) — **odrzucone**:
mnożnik daje w tej samej bramce dwa faile **kontraktowe** (zachowanie), a przeniesienie do
danych zostawia dwa faile **literałowe** (nieaktualna liczba). Drugie jest ściśle mniej szkodliwe,
a dodatkowo jest tym, o co ratyfikacja prosi wprost.

### 2. Runda 3 uchyla `szczescie_max_pop_wspolczynnik` = 0,038/0,048/0,058 → 0,04 ×3

Ratyfikacja rundy 3 (`eccac414`) trafiła do dispatchu **w trakcie** mojej pracy. Nie wykonuję
jej — to nie jest zakres rundy 2. Zmierzyłem natomiast dokładnie, co ona zepsuje w bramkach,
żeby runda 3 nie szukała po omacku. Symulacja (`0,04` na wszystkich trzech poziomach,
mutacja cofnięta, drzewo czyste): **wszystkie bramki zielone poza trzema asercjami, wszystkie
w jednym pliku** `gra/tools/szczescie-skala-normalizacja-test.cjs`:

1. `wspolczynnik Sz per trudnosc easy<normal<hard` (sekcja 5) — asercja **przedistniejąca**,
   nie moja; po zrównaniu do 0,04 z definicji nie może przejść. Jej odpowiednikiem w nowym
   kontrakcie jest `easy === normal === hard` (G13), analogicznie do parytetu, który dołożyłem
   w `szczescie-zamoznosc-test`. **Uwaga:** obok niej stoi bliźniacza asercja dla **Prawa**
   (`wspolczynnik Prawa per trudnosc easy<normal<hard`) — ratyfikacja mówi, że Prawo też ma
   0,04, więc ona również padnie, gdy ktoś ruszy `prawo_max_pop_wspolczynnik`.
2. `tabela: szMax(pop 12, epoka 1) = 48,0` → będzie `44,4`.
3. `tabela: szMax(pop 12, epoka 3) = 112,0` → będzie `103,6`.

`society-breakdown-test`, `szczescie-zamoznosc-test`, `wealth-test`, `building-happiness-test`,
`war-happiness-parity-test`, `r-wzrost-…`, `logic-test` — **bez zmian, zielone** przy 0,04.

### 3. Dwóch Operatorów w jednym worktree — kolizja izolacji (PROCESS)

W `/home/user/wt-szczescie-skala` pracuje **równolegle** drugi Operator (runda 3, zarzuty 1/2/6
Evaluatora). Zaobserwowane fakty:
- gałąź przesunęła się w trakcie mojej pracy `c9bc5d34` → `a8b84809` → `eccac414`;
- `gra/src/ui/cityPanel.ts` i `gra/tools/szczescie-przebudowa-skali-test.cjs` były zapisywane
  przez ten proces w trakcie moich pomiarów (mtime 21:27 i 21:31; nowa funkcja `szPktDisplay`
  z komentarzem „Evaluator runda 1, zarzut 6" to nie moja zmiana);
- licznik nowej bramki rósł między moimi kolejnymi uruchomieniami: 446 → 496 → 503 → 511.

**Co zrobiłem, żeby nikomu nie skasować pracy:** commit **per plik** (12 jawnie wymienionych,
bez `git add -A`/`git add .`, `cityPanel.ts` świadomie pominięty), a wszystkie mutacje przez
kopię/odtworzenie pliku zamiast `git checkout -- gra/` — które skasowałoby niezacommitowaną
pracę drugiego Operatora.

**To jest naruszenie §IZOLACJI dispatchu** („izolowany worktree" na temat) i wymaga decyzji
orkiestratora, niezależnie od wyniku tej rundy: dwa procesy piszą do jednego drzewa i jednej
gałęzi, więc `git status` przestał być dowodem czyjejkolwiek pracy. Zgłaszam jako fakt
procesowy — nie próbowałem tego naprawiać samodzielnie.

## OBSERWACJE (bez zmian, do wiadomości orkiestratora i właściciela)

- **Fallback TS `SZMAX_DEFAULTS` = 14/20/28 rozjechał się z danymi (20/40/60 · 30/50/70 · 35/55/80).**
  Pozostałe fallbacki G4/G7/G9/G10 runda 1 przestawiła na nowe liczby, ten został stary.
  Skutek jest ograniczony (dane ładują się statycznie; fallback dotyka ścieżek z `society = null`,
  m.in. w bramkach), ale to jedyny parametr Szczęścia, w którym kod i dane mówią co innego.
  **Nie ruszałem** — runda 2 dotyczy wyłącznie bramek, a sekcja 2 tej samej bramki jawnie testuje
  fallback `14`. Do rozstrzygnięcia razem z rundą 3 (ten sam plik, ta sama klasa problemu).
- **`computeGrowthHappinessNetto` (`growth-happiness.ts`) nadal dolicza Ceramikę +1 i Spichlerz +1.**
  Rozpiska Szczęścia już ich nie liczy (G3), więc podgląd wzrostu i silnik rozeszły się o 2 pkt.
  Allowlista dopuszcza w tym pliku **wyłącznie** przepięcie sygnatury Wealth, więc nie tknąłem —
  ale to jest ten sam „tryb trzeci" (dwa tory), o który dispatch ostrzega, i zasługuje na decyzję.
  Bramka `r-wzrost-…-ceramika-test` pokrywa dziś ten kanał trzema **zielonymi** asercjami
  (`10+1+1 = 12`), więc rozjazd jest utrwalony w teście, nie tylko w kodzie.
- **Start gry na easy wynosi teraz PorPct 94,8% (pasmo „Ład") przy pop 1, turze 1, bez garnizonu.**
  To wynik liczb właściciela (G10 podniósł bonus osiedla 4 → 15), nie moje strojenie — zgłaszam,
  bo skala od T1 zaczyna się blisko sufitu i easy/normal/hard różnią się o 94,8 / 73,4 / 59,2.

RUNDY: 2/5
NASTĘPNY KROK: Evaluator (to samo ID, ta sama gałąź) — po rozstrzygnięciu orkiestratora
w sprawie `citizen-resource-upkeep-test.cjs` (BLOKADY 1) i kolizji dwóch Operatorów w jednym
worktree (BLOKADY 3).
DEPLOY/PUSH: NIE WYKONANO
