# AI: puste miasta w t60 — diagnoza (R-WEB-AI-EMPTY-CITIES-Q1, tag AIEMPTY)

Data: 2026-11-27. Baza kodu: `8c0877042` (origin/main). Zmian w `gra/src` ani `gra/data` NIE WPROWADZONO
(`git status` po pracy: tylko nowe pliki w `gra/tools/` i `dyspozycje/`).
Dane: `dyspozycje/autobot/runs/R-WEB-AI-EMPTY-CITIES-Q1/dane/`. Narzędzie: `gra/tools/aiempty-analyze.cjs`.

## 1. Definicja metryki (kod, nie pamięć)

„Puste miasto” = miasto właściciela, na którego heksie nie stoi żadna jednostka bojowa:
`owners[].miastaWojsko[].wojsko === 0`. Wartość liczona w `gra/src/main.ts` (~34874): nie cywil, nie zwiadowca,
nie generał, nie zaokrętowany. Ten sam predykat co `emptyCityGarrisonRecruitIds` w `gra/src/game/ai.ts` (~2044).

| Pomiar | Które miasta | Wynik |
|---|---|---|
| FALA 857 (`ai-city-garrison-measure-analyze.cjs`) | wszyscy właściciele oprócz gracza (0), pokój i wojna osobno | ta sama definicja |
| AIBAL2 (`aibal2-summarize.cjs`) | właściciele AI (owner ≠ 0 i ≠ −1) | ta sama definicja |

Różnica między nimi jest tylko formalna (właściciel −1). W rekordach tur właściciel −1 nie występuje na liście
`owners` (występuje tylko w `cityState` i `unitFlow`), więc obie metryki dają IDENTYCZNE liczby — potwierdzone
w 12 z 12 zestawień (poniżej). **Metryka nie jest przyczyną rozbieżności.**

## 2. Pomiar na żywo (6 biegów, t30 i t60, dwa ziarna)

Runner: `gra/tools/aibal2-measure-run.cjs` (bundle vite zbudowany z `8c0877042` do `/tmp`, usunięty po pracy).
Wszystkie biegi: start przez `__settingsLive.startNewGame` (prawdziwa nowa gra), gracz kończy tury realnym `endTurn`.

| Konfiguracja | Ustawienia | Ziarno | t30 puste/miasta | t60 puste/miasta (pokój / wojna) |
|---|---|---|---|---|
| A domyślna | Normalny; Koszty jednostek Normalny (×2); Dyplomacja łatwa; Kultura łatwa | 4242 | 27/72 (37,5%) | 39/155 (25,2%) (31 / 8) |
| A domyślna | j.w. | 7 | 30/79 (38,0%) | 61/169 (36,1%) (56 / 5) |
| B Wysoki ×4 | Normalny; Koszty Wysoki (×4); Dyplomacja łatwa; Kultura łatwa | 4242 | 33/79 (41,8%) | 45/156 (28,8%) (24 / 21) |
| B Wysoki ×4 | j.w. | 7 | 35/79 (44,3%) | 54/162 (33,3%) (23 / 31) |
| C maksimum | Trudny; Koszty Wysoki (×4); Dyplomacja trudna; Kultura trudna | 4242 | 16/94 (17,0%) | 55/174 (31,6%) (12 / 43) |
| C maksimum | j.w. | 7 | 26/89 (29,2%) | 80/173 (46,2%) (24 / 56) |

Uwagi do tabeli:
- Konfiguracja C odtwarza wiersze AIBAL2 co do liczby (55/174 i 80/173).
- „Maksimum” = najwyższe poziomy dostępne w ustawieniach nowej gry (Trudny, Wysoki, Trudna, Trudna kultura).
  Innych poziomów nie mierzono (zasada właściciela, 2026-11-26).
- Konfiguracja A/B: poziom trudności Normalny i kultura Łatwa to wartości domyślne z `newGameFlow.ts` (307–312).
- Pokój/wojna dzielone wg `wars.pairs` rekordu tury.
- **Porównanie z FALĄ 857 nie jest bezpośrednie:** pomiar FALI 857 (`R-WEB-AI-CITY-GARRISON-MIN-ONE-IMPL-Q1`)
  dał t60 16/188 (ziarno 4242, commit `28bace9bb`), a jego t30 36/96 — konfiguracja i commit są inne niż w tym
  temacie. Nasza konfiguracja A, ziarno 4242, t30 = 27/72 (37,5%), czyli bardzo blisko t30 z FALI 857; **różnica
  pojawia się między t30 a t60**: w FALI 857 puste miasta w t60 spadły do ~8%, teraz rosną do 25–36% (A).

## 3. Powód dla maksimum w t60 (dane z rekordu)

Z JSONL odczytywalne są: skarbiec właściciela, pula rekrutów (`rekruci`), liczba jednostek, głód, miasta.
NIE ZMIERZONO w rekordzie: zasoby Drewno/Brąz właściciela (potrzebne do `canAffordUnitRecruitFull`,
`src/main.ts` ~46927) oraz przyczyna z `isProductionAllowed` (epoka/technologia).

- Pula rekrutów: wszyscy właściciele z pustymi miastami mają `rekruci > 0` (od 13 720 do 298 000). **Pula nie
  blokuje.**
- Skarbiec: w biegu C-max 4242 t60 puste miasta z właścicielem ze skarbcem < 4 Pn (najtańszy Procarz, koszt
  bazowy z `data/units.json`): **2 z 55**; w C-max 7 t60: **3 z 80**; w A i B: 0–3. **Brak skarbca nie
  tłumaczy większości pustych miast.**
- Koncentracja: w C-max 4242 t60 dwóch właścicieli (owner 9: 15/15 pustych; owner 13: 16/17) daje 31 z 55
  pustych miast. Obaj mają w `uSur` tylko Drewno (u właścicieli 5, 7, 21 też brak Brązu, ale ich puste miasta są
  nieliczne). **Hipoteza (niesprawdzona):** brak zasobu Brązu/Drewna w zasięgu tych właścicieli blokuje
  `canAffordUnitRecruitFull`. Wymaga pomiaru zasobów właściciela (NIE ZMIERZONO).

Wniosek dla powodu: dominujący powód z liczb = **nie skarbiec i nie pula rekrutów**; najbardziej prawdopodobny
kandydat to zasoby surowcowe rekrutacji (skoncentrowane u kilku właścicieli), ale to hipoteza.

## 4. Regresja czy zamierzone? — NIE ROZSTRZYGNIĘTE

- Próba zawężenia commitem: build sprzed FALI 875 (`1bc8ec66d`) nie ma haka `__settingsLive`, więc runner nie
  mógł ustawić konfiguracji (błąd `Cannot read properties of undefined (reading 'startNewGame')`). Bisekcja
  wymaga buildu z hakiem, czyli późniejszego commita. Wyszukiwanie commita z hakiem przez historię przerwano
  (zbyt wolne). **NIE ZAWĘŻONO** do konkretnej FALI.
- Dowody za regresją: t30 zgodne z FALĄ 857, a t60 nie (8% → 25–36% w konfiguracji A). Koszty ×2 (konfiguracja
  A) nie są wyjaśnieniem, bo w A puste miasta też rosną między t30 a t60 i nie zależą od kosztów ×4.
- Dowody za zamierzonym: koszty ×4 (B) podnoszą puste miasta w t30 w obu ziarnach (B: 33/79 i 35/79; A: 27/72 i 30/79); w t60 wpływ kosztów jest niejednoznaczny (ziarno 4242: B wyżej, ziarno 7:
  B niżej niż A). Gracz w biegach nie prowadzi działań (tylko endTurn), co może zmieniać wynik; NIE ZMIERZONO.
- Rozstrzygnięcie wymaga: (a) licznika zasobów właściciela w rekordzie tury, (b) bisekcji 857→930 na buildach
  z hakiem `__settingsLive`. Żadnej poprawki nie proponuję: bez wyjaśnienia przyczyny zmiana balansu byłaby
  zgadywaniem (zakaz z dispatchu).

## 5. Ograniczenia

- Dwa ziarna (4242, 7) — wariancji między ziarnami nie badano dalej.
- Jeden przebieg na konfigurację; brak powtórzeń.
- Nie zmierzono zasobów właściciela ani przyczyn z `isProductionAllowed`.
- Pomiar FALI 857 (16/188) pochodzi z innego commita i konfiguracji; nie jest powtórzony.
- Dane: `dane/*/seed*.jsonl.gz`; zestawienie: `dane/aiempty-summary.txt`.
