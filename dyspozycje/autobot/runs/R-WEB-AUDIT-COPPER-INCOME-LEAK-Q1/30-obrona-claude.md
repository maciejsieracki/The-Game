STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-WEB-AUDIT-COPPER-INCOME-LEAK-Q1
GOAL: Ustalić źródło ~24 000 szt. miedzi (`ruda`) u jednej cywilizacji krótko po wejściu w epokę miedzi. Naprawa tylko przy potwierdzonej przyczynie.
ZMIANY/COMMIT: Obrona r4 odpowiada na zarzuty Evaluatora z e7cc5f21f (raport Evaluatora r4). Kod gry gra/src BEZ ZMIAN. Kandydat pomiarowy: 3666c9b69 (tylko gra/tools/ i raport operatora). Ta runda dodaje wyłącznie ten plik raportu. Narzędzia pomiarowe NIE zmienione (patrz zarzut 8). SHA tej obrony: pole sha w odpowiedzi orkiestratorowi (raport nie może zawierać własnego SHA).
TESTY:
- Bramki kodu: NIE uruchamiane w tej rundzie, bo nie zmieniono TS (gra/src bez zmian, tylko jeden plik .md w commicie). Liczby bramek cytowane z raportu operatora 10-operator-claude.md i z raportu Evaluatora, nie z pamięci.
- Ponowna analiza surowych jsonl (wykonana w tej rundzie, skrypt residual z 3666c9b69 uruchomiony poza repo, `python3 -I`):
  - seed 4242, przebieg o3: 41 tur, dodatnia reszta w 0 turach, tury z ujściem 17, suma końcowa 10 790, suma kredytu kopalni 23 520.
  - seed 4242, przebieg o2: 60 tur, dodatnia reszta w 0 turach, tury z ujściem 36, suma końcowa 74 630, suma kredytu kopalni 135 105.
  - seed 777, przebieg o4: 54 tury, dodatnia reszta w 0 turach, tury z ujściem 31, suma końcowa 29 660, suma kredytu kopalni 70 920.
  Liczby zgodne z raportem operatora (60/36/135 105/74 630 oraz 54/31/70 920/29 660).
- Szczegóły per właściciel dla zarzutu 3 (seed 4242, przebieg o2, surowe phase.ruda i phase.ry):
  - T22: suma 1080 -> 1530, Δ 450 = surowy kredyt 450. Przy 8 właścicielach z miedzią. Zmiana sumy jest w całości kredytem kopalni.
  - T25: suma 2610 -> 3240, Δ 630 = surowy kredyt 630. Największe przyrosty per właściciel: właściciel 22 +270, właściciel 29 +180, właściciel 1 +150.
  - T49: suma 27 360 -> 30 740, Δ 3 380 przy surowym kredycie 5 355. Reszta −1 975 (ujście). Przyrosty per właściciel niezerowe: 22 +1570, 1 +1350, 38 +1180, 15 +100, 8 +80, 41/40/39/36/29 po +30, 37 −1050. Właściciel 38 zyskał +1180 przy −1050 u właściciela 37 w tej samej turze. Różnica 130 nie została rozpisana na surowy kredyt właściciela 38 (NIE_ZMIERZONO per właściciel).
  - T57: suma 55 185 -> 58 340, Δ 3 155 przy surowym kredycie 6 405 (największy surowy kredyt: właściciel 22 = 2880, właściciel 1 = 2025, właściciel 8 = 480). Najwięksi przyrostowcy: 22 +2055, 1 +1350, 38 +130.
- Pozostałe liczby z tabeli raportu operatora (seed 4242 T16–T60, seed 777) pochodzą z surowych plików i nie zostały ponownie przeliczone poza powyższym.
BLOKADY: brak blokady technicznej. Ograniczenia pomiaru opisane w odpowiedziach na zarzuty 1, 2, 4, 5, 7, 8.
RUNDY: 4/5 (obrona w rundzie 4; ostatni werdykt FC/Evaluatora: zarzuty r4 w e7cc5f21f, werdyktu Evaluatora brak). Decyzja wymagana: patrz sekcja DECYZJA.
NASTĘPNY KROK: ABC do właściciela (A/B/C/D z raportu operatora). Ewentualnie osobny pomiar: 3. ziarno, tury >60, pomiar per właściciel przy migracjach (z wznawialnym runnerem), przed decyzją o naprawie.
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty Evaluatora (e7cc5f21f)

### Zarzut 1 (zakres: 2 ziarna, 60 i 54 tury, 15 cywilizacji łącznie, brak 3. ziarna): ODRZUCAM zarzut o niezgodność z dispatchem; PRZYJMUJĘ ograniczenie
- Dodatek orkiestratora do dispatchu, sekcja RUNDA 4 (`git show origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0:dyspozycje/autobot/runs/R-WEB-AUDIT-COPPER-INCOME-LEAK-Q1/00-dispatch-DODATEK-claude.md`) mówi dosłownie: „pełne 15×3×150 jest NIEWYKONALNE — NIE próbuj. ZAWĘŹ pomiar”. Zakres 2 ziaren i ok. 60 tur jest więc zgodny z zawężeniem orkiestratora, a nie z wymogiem r2.
- PRZYJMUJĘ: 15 cywilizacji nie zostało rozdzielone (jeden świat, 42 właścicieli), 3. ziarno i tury >60 NIE zmierzono. Ten zakres jest już zapisany w raporcie operatora jako NIE_ZMIERZONO. Wnioski ograniczam do: w ziarnie 4242 (tury T1–T60, przebieg o2) i w ziarnie 777 (T1–T54) nie ma dodatniej reszty.
- Poprawka do wniosku z raportu operatora: „brak przecieku” należy czytać jako „brak dodatniej reszty w zmierzonym oknie”, nie jako dowód dla wszystkich ziaren.

### Zarzut 2 (metoda reszty daje tylko górne ograniczenie; zdanie „miedź NIE powstaje z niczego poza kopalniami” mocniejsze niż dowód): PRZYJMUJĘ
- Metoda: reszta = Δ(suma miedzi) − surowy kredyt kopalni. Dodatnia reszta wykrywa tylko źródła większe od ujścia w tej samej turze. Ujście (odlewnia, cap) nie jest zinstrumentowane, więc źródło ≤ ujście jest niewidoczne. To jest ograniczenie górne, nie dowód braku innych źródeł.
- Poprawka sformułowania: zamiast „miedź NIE powstaje z niczego poza kopalniami” należy pisać: „w zmierzonych turach suma miedzi nigdy nie rośnie szybciej niż surowy kredyt kopalni; źródła poza kopalniami, mniejsze od ujścia, nie są wykluczone”.
- Tury bez ujścia (liczone jako tury łącznie minus tury z ujściem): 24 w przebiegu o3 (41 − 17), 24 w o2 (60 − 36), 23 w o4 (54 − 31). W tych turach reszta wynosi 0 (brak dodatniej reszty i brak ujemnej). To wspiera tezę, ale jej nie dowodzi.

### Zarzut 3 (teza „zdobywca dziedziczy zapas” rozpisana tylko dla T22): PRZYJMUJĘ, dane dodane
- T22 (seed 4242): Δ sumy 450 = surowy kredyt 450. Zmiana sumy jest kredytem kopalni; przeniesienie między właścicielami nie zmienia sumy, więc T22 nie jest dowodem dziedziczenia, tylko rozkładu.
- T25: Δ 630 = kredyt 630; przyrosty per właściciel: 22 +270, 29 +180, 1 +150 (przy 8 właścicielach z miedzią).
- T49: Δ 3 380 przy kredycie 5 355; właściciel 38 +1180 przy właścicielu 37 −1050 (przeniesienie zapasu przy zmianie własności miast; 130 różnicy nie rozpisane per właściciel).
- T57 seed 4242: właściciel 22 +2055 przy kredycie 2880, właściciel 1 +1350 przy kredycie 2025.
- Seed 777: tylko sumy z raportu operatora (T45 14 685, T54 27 530); rozpisania per właściciel NIE wykonano.
- Wniosek ostrożny: w przebiegu seed 4242 zmiany własności miast przenoszą zapas (T22, T49), a przyrost „24 tys.” u właściciela 1 i 22 idzie głównie z kredytu kopalni przy 40–64 kopalniach u jednego właściciela, nie z samego przejęcia.

### Zarzut 4 (odrzucenia (a), (c), (d), (g) oparte na grepie i wnioskowaniu z „reszta = 0”): PRZYJMUJĘ jako ograniczenie
- Oznaczenie metody: pozycje (a) start bonus, (d) bonusy cywilizacji, (g) łup/zwrot/handel cykliczny to odrzucenia STATYCZNE (grep i lektura kodu, bez pomiaru osobnego). Pozycja (c) migracje zapisów to nie-dotyczy dla świeżej gry, potwierdzone pomiarem tylko przez brak dodatniej reszty.
- Brak izolowanego pomiaru migracji zapisów, handlu cyklicznego i łupów. Ta luka pozostaje otwarta i jest opisana w raporcie operatora w sekcji Ograniczenie.
- Pozycja (b) skok capu magazynu: przyjęta z kodu creditOwnerResourceStock (cap nie dopełnia stanu) i z liczb (stan nie przekracza 100 000 w epoce 2).

### Zarzut 5 (surowe jsonl poza repo, recenzent nie odtworzy tabeli): PRZYJMUJĘ częściowo
- Surowe pliki istnieją poza repo (katalog scratchpad sesji operatora: `o2/seed4242.jsonl` 117 KB, `o3/seed4242.jsonl` 167 KB, `o4/seed777.jsonl` 341 KB). Commit w tej rundzie obejmuje wyłącznie ten plik raportu (zgodnie z dispatchem), więc danych nie dodano do repo.
- Odtwarzalność: skrypt residual jest w repo (`gra/tools/copper-leak-q1-residual.py` w 3666c9b69), a wyniki jego uruchomienia są w odpowiedziach na zarzuty 1–3 powyżej. Rekomendacja dla orkiestratora: skopiować trzy jsonl (łącznie ok. 625 KB, lub gzip) do `runs/R-WEB-AUDIT-COPPER-INCOME-LEAK-Q1/evidence/` w osobnym commicie, jeśli ma to być dowód archiwalny.

### Zarzut 6 (brak SHA w raporcie operatora): PRZYJMUJĘ
- Raport operatora 10-operator-claude.md ma w polu ZMIANY/COMMIT odwołanie „SHA: patrz koniec raportu”, a na końcu go nie ma. Kandydat pomiarowy: 3666c9b69 (commit r4 operatora), baza 8779253688 + merge e8a731bc6. SHA tej obrony zwraca orkiestratorowi pole sha.

### Zarzut 7 (zbieżność z 24 000 co do rzędu wielkości, nie tożsamości zdarzenia): PRZYJMUJĘ
- Pomiar daje ok. 24 560 u właściciela 1 w T57 (seed 4242) i 24 480 u właściciela 22 w T57. To ok. 9 tur po wejściu właściciela w epokę 3 (era=3 od T48), ok. 40 tur po pierwszej miedzi (T16).
- Konkretnego przypadku ze zgłoszenia (inna gra, inne ziarno, inny moment) NIE odtworzono. Zgodność dotyczy rzędu wielkości.

### Zarzut 8 (tryb przyspieszony domyślnie włączony w longrun; early-exit copper-leak-q1-measure): PRZYJMUJĘ jako ryzyko, poprawki kodu NIE zcommitowano
- Fakt: `gra/tools/longrun-100-turns-leak-q1-measure.cjs:228` włącza tryb przyspieszony, gdy `MEAS_FAST !== '0'`, czyli domyślnie. Dodatek r4 operatora (diff `fa486a27a..3666c9b69`) dodał tę linię (+1 linia w tym pliku). Poprzednie uruchomienia longrun w tym pliku nie miały trybu przyspieszonego.
- Fakt: `copper-leak-q1-measure.cjs:31` kończy się wcześnie przy `__phaseT.ruda` („juz zapatchowany”). Kopia zapatchowana w r3 nie dostanie instrumentacji r4 (`__phaseT.ry`, `__phaseT.mines`) i nie zgłosi tego. Przebiegi r4 (o2/o3/o4) mają pole `ry`, więc były na świeżej kopii.
- Nieznane (NIE_ZMIERZONO): czy digest stanu gry jest identyczny z trybem przyspieszonym i bez niego. Nie porównano tego w tej rundzie. Wyniki pomiaru r4 są więc wynikami w trybie przyspieszonym.
- Poprawka proponowana (NIE zcommitowana, bo commit tej rundy obejmuje wyłącznie raport): (1) `MEAS_FAST === '1'` jako opt-in, (2) w copper-leak-q1-measure.cjs sprawdzać marker `__phaseT.mines` zamiast `__phaseT.ruda` i przy samym `ruda` kończyć błędem „kopia w starej łatce, wymagany świeży prepare”. Decyzja orkiestratora, czy to osobny temat narzędziowy.

### Zarzut 9 (brak 00-dispatch.md na origin/main): ODRZUCAM
- Plik istnieje, ale nie na origin/main: `git ls-tree -r --name-only origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0 -- dyspozycje/autobot/runs/R-WEB-AUDIT-COPPER-INCOME-LEAK-Q1` zwraca `00-dispatch-DODATEK-claude.md` i `00-dispatch.md`. Dispatch r1 był w gałęzi roboczej orkiestratora, nie w origin/main.
- Kryteria pierwotnego dispatchu są w tej samej gałęzi, a dodatek RUNDA 4 zawęża je, co jest podstawą odpowiedzi na zarzut 1.

## Sprawdzone i odrzucone (po obronie r4, z jawnym oznaczeniem metody)
- (a) Start/bonus/difficulty: STATYCZNIE (brak startStock/bonusStart); POMIAREM: T1–T15 miedź 0 u wszystkich 42 właścicieli (seed 4242).
- (b) Skok capu magazynu: STATYCZNIE (creditOwnerResourceStock, economy-upkeep.ts:391–457).
- (c) Migracje zapisów: nie dotyczą świeżej gry w pomiarze; POMIAREM tylko przez brak dodatniej reszty.
- (d) Bonusy cywilizacji: STATYCZNIE (brak premii do klucza `ruda` w civs/econ).
- (f) Kolizja „Ruda żelaza” → `ruda`: STATYCZNIE (diplomacy-goods.ts:49–57, 102–115) potwierdzona jako błąd poprawności oferty, nie źródło tworzenia miedzi; transfer zachowawczy NIE zweryfikowany w tej rundzie.
- (g) Łup, zwrot Zastąp, handel cykliczny: STATYCZNIE (units.json, TRADE_ROUTE_STOCK_FLOW_KEYS bez `ruda`).

## Uwagi dla orkiestratora
- Zwrot Zastąp bez capu (main.ts:5120–5133): poboczna uwaga z audytu, nie dotyczy miedzi.
- Kolizja etykiety „Ruda żelaza” → `ruda` (diplomacy-goods.ts:56–57): osobny temat R-WEB, nie przeciek.
- Pomiar w trybie przyspieszonym: patrz zarzut 8, digest nie porównany.

## DECYZJA (bez zmian względem raportu operatora)
Fakt z pomiaru: w zmierzonym oknie miedź rośnie wyłącznie przez kredyt kopalni, a 40–64 kopalni u jednego właściciela daje 1 350–2 880 szt./turę przy jedynym ujściu (odlewnia brązu). To jest bilans gospodarczy, nie błąd kodu. Progi i wybór mechanizmu wymagają decyzji właściciela (ABC):
- A. Bez zmian (cap 100 000 w epoce 2 ogranicza górę).
- B. (rekomendowane przez operatora) Nowe ujście miedzi proporcjonalne do liczby kopalni (np. przepustowość odlewni rosnąca z liczbą kopalni miedzi lub koszt utrzymania zużywający miedź).
- C. Niższy cap magazynu dla `ruda`, bez nowego ujścia.
- D. Limit kopalni miedzi na właściciela lub malejąca stawka powyżej N kopalni.
Bez decyzji nie zmieniam balansu.
