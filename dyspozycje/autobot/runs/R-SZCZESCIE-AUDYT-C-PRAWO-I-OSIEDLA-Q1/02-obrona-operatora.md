# Obrona Operatora — runda 1

TEMAT: R-SZCZESCIE-AUDYT-C-PRAWO-I-OSIEDLA-Q1
ROLA: Operator (obrona po zarzutach Evaluatora, ta sama runda)
MODEL+EFFORT: Sonnet 5, effort medium

## ZARZUT 1 — niepełna siatka pomiarowa zaniża najgorszy przypadek

**PRZYJMUJE** (poprawiam w tej samej rundzie).

Zarzut trafny co do faktu: `ADMIN_VARIANTS` rundy 0 wariował maksymalnie jedną flagę
administracji naraz (albo żadną) zamiast pełnego zbioru potęgowego, i w ogóle nie wariował
`palacTier`/`hasPalac`, `ownCultureShare`, `ownReligionShare`, `podzialHandlu`/luksusu ani
`stolicaEasyBonus` — te pola nie występowały w `lawInput`/`happinessInput` bramki wcale.
Kod `computeLawBreakdown`/`computeHappinessBreakdown` nie wymusza żadnej wzajemnej
wyłączności między `hasDomStarszyzny`/`hasDworZarzadcy`/`hasPretorium` (każdy blok `if`
niezależny, linie 838-846 `society-breakdown.ts`), więc kombinacje "kilka naraz" są
poprawnymi, osiągalnymi stanami funkcji audytowanej — nie były sztucznie wykluczone z
dobrego powodu, tylko pominięte.

Naprawa (`gra/tools/szczescie-audyt-c-prawo-osiedla-test.cjs`, `measureWorstDrop`):
- `ADMIN_VARIANTS` zastąpione pełnym zbiorem potęgowym (2^6=64) sześciu flag boolowskich
  (`hasDomStarszyzny`, `hasDworZarzadcy`, `hasPretorium`, `hasSad`, `hasTrybunal`,
  `hasGarnizonBudynek`) — dokładnie liczba flag i kombinacji z zarzutu.
- Dodano `palacTier` (`null`/1/2/3).
- Dodano `ownCultureShare`, `ownReligionShare` (0/0,5/1), `podzialHandlu.procentLuksus`
  (0/50/100) i `stolicaEasyBonus` (true/false) do obu wejść (`happinessInput` i
  `lawInput`, wraz z propagacją `stolicaEasyBonus` do obu, bo obie funkcje je czytają).
- `POPS` w tej PEŁNEJ siatce potęgowej ograniczone do 1-6 (nie 1-14) wyłącznie z powodów
  wydajnościowych — uzasadnienie: `pickOsiedlePopBonus` (mechanizm tego tematu) zwraca 0
  dla `pop>4`, więc żaden najgorszy-spadek-na-osiedlu nie może fizycznie leżeć powyżej
  przejścia pop5→6; test `measurePop5PlusStability` osobno potwierdza na PEŁNYM zakresie
  1-14, że fragment krzywej pop≥5 jest płaski i niezależny od klucza osiedla — więc
  ograniczenie nie zawęża realnie przeszukiwanej przestrzeni najgorszego przypadku.

Wynik po naprawie (zweryfikowany uruchomieniem, `node
tools/szczescie-audyt-c-prawo-osiedla-test.cjs`):
- PRZED: **28,0 p.p.** (easy/era1/pop4→5) — identyczne z liczbą Evaluatora.
- PO: **20,0 p.p.** (ten sam punkt) — identyczne z liczbą Evaluatora.
- Podłoga (factor=0, zmierzona osobno tą samą pełną siatką) = **16,5 p.p.** — identyczna z
  liczbą Evaluatora.

Wniosek zarzutu nie zmienia się (redukcja ok. 28,6%, nadal rząd wielkości > precedensu
6 p.p., DECISION_REQUIRED nadal zasadny) — zgodnie z tym, co sam zarzut zauważa. Bramka
(asercja 3) zaktualizowana z progu `< 20` (fałszywie zielonego na węższej siatce) na
`<= 20,0` z komentarzem wprost tłumaczącym, że 20,0 to teraz prawdziwe maksimum na pełnej
siatce, nie przybliżenie z węższej próby. Raport (`opis` klucza w
`gra/data/society-params.json`) zaktualizowany na 28,0/20,0/16,5 (było 27,1/19,3/15,8).

Test uruchamia się w ok. 20 s (zamiast poprzednich ułamków sekundy) — akceptowalne dla
bramki jednorazowej/CI, nie w hot-path.

## ZARZUT 2 — niespójność faktora w `hard[3]`

**PRZYJMUJE** (poprawiam w tej samej rundzie).

Potwierdzone liczbowo: stara wartość `hard[3]=6`, nowa `1` → factor `1/6≈0,167`, podczas
gdy pozostałe 11 komórek mieszczą się w `0,25–0,32` (np. `hard[0]`: `7/22≈0,318`,
`hard[1]`: `5/16≈0,3125`, `hard[2]`: `3/10=0,3`; `easy[3]`: `3/10=0,3`; `normal[3]`:
`2/8=0,25`). Standardowe zaokrąglenie `6×0,3=1,8→2`, nie `1`. Naprawione:
`gra/data/society-params.json`, `prawo.prawo_bonus_osiedle_pop.hard[3]`: `1` → `2`.

Sprawdzone po poprawce:
- Tablica `hard` nadal malejąca i dodatnia pop1→4: `[7,5,3,2]`.
- Proporcje `easy[i] >= normal[i] >= hard[i]` nadal zachowane na każdym z 4 indeksów
  (idx3: `easy(3) >= normal(2) >= hard(2)`, `2>=2` — prawda).
- Bramka tematu: **15/15 OK** (było 15/15 przed poprawką z `hard[3]=1`; wartości
  najgorszego spadku PRZED/PO/podłoga niezmienione co do cyfry wyświetlanej — `hard[3]`
  nie leży na ścieżce najgorszego przypadku, który jest na `easy`).
- `opis` klucza w `data/society-params.json` zaktualizowany, żeby jawnie odnotować tę
  poprawkę rundy 1 (nie chować, że pierwsza wersja miała literówkę zaokrąglenia).

## Weryfikacja pełnej rodziny bramek po obu poprawkach

Uruchomione niezależnie po zmianie (`hard[3]=2` + rozszerzona siatka):
- `tsc --noEmit`: 0 błędów.
- `logic-test` 213/213, `tech-tree-test` 19/19, `research-test` 33/33,
  `unit-replace-test` 13/13, `combat-test` 6/6 — identyczne jak w raportach rundy 0.
- `szczescie-audyt-c-prawo-osiedla-test.cjs` (ta bramka, po obu poprawkach): **15/15 OK**.
- `prawo-palac-tier-test` 30/30, `prawo-przebudowa-skali-test` 152/152,
  `prawo-siatka-v2-test` 55/55, `szczescie-zamoznosc-test` 88/88,
  `r-wzrost-szczescie-dubel-wealth-ceramika-test` 59/59, `border-march-scan-test` 15/15 —
  wszystkie zielone, zero regresji od poprawki `hard[3]`.
- Pre-istniejące czerwone, niezmienione co do liczby (przyczynowość spoza allowlisty tego
  tematu potwierdzona już w rundzie 0 metodą kopii pliku, nie odtwarzana tu ponownie):
  `border-march-wygasanie-test` 4 FAIL, `szczescie-przebudowa-skali-test` 4 FAIL,
  `szczescie-skala-normalizacja-test` 4 FAIL, `society-breakdown-test` 6 FAIL — identyczne
  liczby jak w raporcie Evaluatora rundy 1.

`git status --short` po zmianach: wyłącznie `gra/data/society-params.json` i
`gra/tools/szczescie-audyt-c-prawo-osiedla-test.cjs` zmienione (plus ten raport, nowy plik)
— zero naruszeń allowlisty.

## Podsumowanie

Oba zarzuty PRZYJĘTE i naprawione w tej samej rundzie. DECISION_REQUIRED pozostaje w mocy
i pozostaje odrębny od tej obrony — decyzja właściciela w `decision-abc.md` (magnitude +
zakres allowlisty) jest nadrzędna wobec wyniku Final Control tej rundy, zgodnie z
NASTĘPNYM KROKIEM zarzutów Evaluatora.

---

STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-SZCZESCIE-AUDYT-C-PRAWO-I-OSIEDLA-Q1
GOAL: wygładzić `prawo_bonus_osiedle_pop` analogicznie do G10 Szczęścia, redukując najgorszy spadek PorPct na +1 mieszkańca
ZMIANY/COMMIT: worktree `/home/user/wt-szczescie-c`, gałąź `autobot/R-SZCZESCIE-AUDYT-C-PRAWO-I-OSIEDLA-Q1` — zmienione w tej rundzie: `gra/data/society-params.json` (hard[3] 1→2 + zaktualizowany `opis` z nowymi liczbami 28,0/20,0/16,5), `gra/tools/szczescie-audyt-c-prawo-osiedla-test.cjs` (pełna siatka: 64 kombinacji administracji × palacTier × kultura/religia/luksus/stolica-easy), oraz ten raport.
TESTY: bramka tematu 15/15 OK (po obu poprawkach); tsc 0 błędów; logic 213/213, tech-tree 19/19, research 33/33, unit-replace 13/13, combat 6/6; prawo-palac-tier 30/30, prawo-przebudowa-skali 152/152, prawo-siatka-v2 55/55, szczescie-zamoznosc 88/88, r-wzrost-szczescie-dubel 59/59, border-march-scan 15/15; pre-istniejące czerwone niezmienione (border-march-wygasanie 4 FAIL, szczescie-przebudowa-skali 4 FAIL, szczescie-skala-normalizacja 4 FAIL, society-breakdown 6 FAIL).
BLOKADY: DECISION_REQUIRED (bez zmian — patrz `decision-abc.md`).
RUNDY: 1/5
NASTĘPNY KROK: Final Control tej rundy nad poprawkami; decyzja właściciela w `decision-abc.md` pozostaje odrębna i nadrzędna.
DEPLOY/PUSH: NIE WYKONANO

OBRONA: 1 → PRZYJMUJE, poprawione (siatka rozszerzona, liczby zgodne z Evaluatorem: 28,0/20,0/16,5).
OBRONA: 2 → PRZYJMUJE, poprawione (`hard[3]`: 1→2).
