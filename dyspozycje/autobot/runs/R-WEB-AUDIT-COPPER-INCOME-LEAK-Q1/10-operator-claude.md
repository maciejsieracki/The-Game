STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-WEB-AUDIT-COPPER-INCOME-LEAK-Q1
GOAL: Ustalić źródło ~24 000 szt. miedzi (`ruda`) u jednej cywilizacji krótko po wejściu w epokę miedzi: pomiar per tura i cywilizacja + śledzenie źródeł przyrostu; naprawa tylko przy potwierdzonej przyczynie.
ZMIANY/COMMIT: baza kandydat 8779253688 + merge origin/main (e8a731bc6). Kod gry gra/src BEZ ZMIAN. Zmienione tylko narzędzia pomiarowe w gra/tools/: copper-leak-q1-measure.cjs (dodatkowa instrumentacja kopii: surowy kredyt `ruda` per owner + lista heksów kopalni + epoka właściciela), longrun-100-turns-leak-q1-measure.cjs (tryb przyspieszony `setFastMode`, MEAS_FAST=0 wyłącza), copper-leak-q1-residual.py (analiza bilansu). SHA: patrz koniec raportu.
TESTY:
- POMIAR WYKONANY (pełna gra, headless Chromium, `?civTest=1`, tryb przyspieszony, 42 miasta startowe, mapa Standardowy/kontynenty). Kluczowe odkrycie: tura 1,4-6 s zamiast ~52 s (poprzednie rundy mierzyły bez trybu przyspieszonego, który pomija render three.js). Seed 4242: 60 tur (przebieg ~580 s, ucięty limitem), seed 777: 54 tury, seed 4242 drugi przebieg 41 tur z listą heksów kopalni. Surowe pliki jsonl: scratchpad `o2/seed4242.jsonl`, `o3/seed4242.jsonl`, `o4/seed777.jsonl` (poza repo).
- NIE ZMIERZONO: 15 cywilizacji w osobnych ziarnach (jeden świat 42 właścicieli = wszystkie cywilizacje+państwa-miasta naraz), 3. ziarno, tury > 60 (limit 590 s na wywołanie, runner niewznawialny; 3 przebiegi równolegle nie ruszyły w limicie).
- Bramki tsc/5 bramek NIE uruchamiane: zero zmian w gra/src.

WYNIK 1 (bilans, rozstrzygający): w obu ziarnach dla KAŻDEJ tury wyliczono resztę = Δ(suma miedzi wszystkich właścicieli) − Σ(surowy kredyt kopalni `terrYield.ruda`). Seed 4242: 60 tur, reszta dodatnia w 0 turach (36 tur z ujściem: odlewnie/cap). Seed 777: 54 tury, reszta dodatnia w 0 turach (31 tur z ujściem). Czyli miedź NIE powstaje z niczego poza kopalniami: łączna suma nigdy nie przekracza kredytu z kopalni. Seed 4242: suma kredytu kopalni T1-60 = 135 105, stan końcowy 74 630 (ujście ok. 60 tys.). Seed 777: kredyt 70 920, stan 29 660.
WYNIK 2 (źródło „skoków”): zmiany stanu większe niż własny kredyt kopalni występują tylko w turach przejęcia miast i są PRZENOSZENIEM istniejącego stanu: seed 4242 T22 (właściciele 2,3,5,7,11,18,28 znikają; suma przed 1080 + kredyt 450 = 1530 = suma po, dokładnie), T25 (+2 miasta), T49 (owner 38 +1180). Zapas jedzie z miastem (City.surowce), więc zdobywca dziedziczy miedź zdobytych państw-miast.
WYNIK 3 (mechanizm 24 000): to zwykły bilans „bardzo wiele kopalni u jednego właściciela, brak ujścia”. Zdobywca (owner 1, seed 4242) przejmuje terytoria z kopalniami: kredyt kopalni owner 1 = 150/t (5 kopalni, T23-30) → 1410/t (47 kopalni ×30, T39) → 2025/t (45 kopalni × 45, epoka 3, T48-57). Zapas owner 1: 4 100 (T40), 12 410 (T48), 24 560 (T57, +1350/t netto). Owner 22 równolegle: 24 480 w T57 (kredyt 2880/t = 64 kopalnie × 45). Czyli „24 tys.” osiągnięte w ~T57, ok. 40 tur po pierwszej miedzi (T16) i ok. 9 tur po wejściu właściciela w epokę 3. Seed 777: owner 15 = 10 575 w T55 (+390/t netto, 9 kopalni epoka 3 + dziedzictwo), tempo wskazuje 24 tys. ok. T90.
- Arytmetyka (kod): kopalnia_miedzi = 20 szt./t (data/terrain-improvements.json:336) × 1,5^(era−1) (terrain-improvements.ts:282-290) = 20/30/45 na kopalnię/turę; każdy heks liczony raz (computeTerritoryResourceYieldByCity, improvementKeysForHex ma dedupe), przypisanie do najbliższego miasta właściciela. Kredyt idzie przez creditOwnerResourceStock z capem magazynu państwa 50 000 × 2^(era−1) × (1+0,2×Magazyny) (economy-upkeep.ts:391-457), więc stan nie przekroczy 100 000 w epoce 2.
- Gęstość: na świecie ~76 heksów z kopalnią miedzi już w T40 (zloze=miedz, w większości pod nakładką las); AI buduje je masowo (owner 1 = 40 w T36, owner 22 = 64 w T57), a jedynym ujściem jest Odlewnia brązu (przepustowość płaska, nie rośnie z liczbą kopalni).

TABELA „tura → miedź per cywilizacja → źródło” (seed 4242, surowe: phase.ruda, phase.ry z jsonl; kolumny: stan na koniec tury / Δ / surowy kredyt kopalni, n = liczba miast z kopalniami):
tura | owner 1: stan Δ kredyt (n) | owner 22: stan Δ kredyt (n) | owner 29 | suma wszystkich
16 | 0 | 0 | 0 | 30 (pierwsza miedź: owner 28, 1 kopalnia ×30)
21 | 90 +30 30 (1) | 0 | 0 | 1 080
22 | 660 +570 30 (1) | 330 +330 0 | 0 | 1 530  (przejęcie 7 właścicieli: stan przeniesiony; 1080+450=1530)
24 | 960 +150 150 (5) | 510 +90 90 (3) | 180 +180 | 2 610
30 | 1 060 −50 150 | 1 230 +70 120 | 1 260 +180 180 | 5 290
39 | 3 180 +1060 1410 (11) | 960 −230 120 | 2 530 +130 180 | 8 930
45 | 8 810 +900 1350 (11) | 1 570 +1570 1920 (10) | 2 860 | 17 750
48 | 12 410 +1350 2025 (11) epoka 3 | 6 280 +1570 1920 | 2 950 | 27 360
51 | 16 460 +1350 2025 | 11 625 +2205 2880 (11) epoka 3 | 3 040 | 37 885
54 | 20 510 +1350 2025 | 18 240 +2205 2880 (12) | 2 980 | 48 580
57 | 24 560 +1350 2025 | 24 480 +2055 2880 | 2 910 | 58 340
60 | 28 565 +1305 1980 | 30 690 +2100 2925 | 2 820 | 70 365
Seed 777: T19 suma 960 (pierwsze kopalnie T14), T27 4 210, T45 14 685 (owner 15: 6 840, kredyt 780/t), T54 27 530 (owner 15: 10 185, kredyt 1 170/t; owner 22: 6 695).

SPRAWDZONE I ODRZUCONE (pomiarem lub kodem):
(a) start bonus / difficulty: brak przyznania miedzi przy starcie/epoce (grep: brak startStock/bonusStart; T1-15 miedź = 0 u wszystkich 42 właścicieli).
(b) skok capu magazynu: cap rośnie ×2/epokę, ale nie dopełnia stanu (creditOwnerResourceStock dodaje tylko przyrost kopalni, przycięty do capu).
(c) migracje zapisów: nie dotyczą świeżej gry w pomiarze; reszta bilansu = 0.
(d) bonusy cywilizacji: w danych civs/econ brak premii do klucza `ruda`; pomiar nie wykazał dodatkowego źródła.
(e) wiele kopalni × mnożnik ery × kumulacja: POTWIERDZONE jako mechanizm (patrz wynik 3).
(f) kolizja „Ruda żelaza” → klucz `ruda` (diplomacy-goods.ts:56-57): nie jest źródłem tworzenia miedzi, bo reszta bilansu dodatnia w 0 turach (transfer zachowawczy, dawca traci tyle, ile biorca zyskuje). Pozostaje błędem poprawności oferty (zły surowiec pod etykietą żelaza), osobny temat R-WEB (poza zakresem).
(g) łup z bitwy / zwrot Zastąp / handel cykliczny: nie dają `ruda` (units.json i TRADE_ROUTE_STOCK_FLOW_KEYS bez `ruda`); pomiar zgodny (reszta dodatnia = 0).
Ograniczenie: pomiar nie rozdziela, czy konkretny przeniesiony zapas pochodził z handlu/łupu; wiemy tylko, że żaden z nich nie tworzy netto miedzi ponad kredyt kopalni.

BLOKADY: brak (pomiar wykonany). Poza zakresem pozostają: kolizja etykiety Ruda żelaza (osobny R-WEB), zwrot Zastąp bez capu (main.ts:5120-5133).
RUNDY: 4/5

DECYZJA WŁAŚCICIELA (DECISION_REQUIRED, to jest balans gospodarczy, nie błąd kodu; progi liczbowe nie z głowy):
Fakt z pomiaru: miedź wyłącznie z kopalni, ale 40-64 kopalni u jednego właściciela daje 1 350-2 880 szt./turę przy jedynym ujściu w postaci Odlewni brązu. Rekomendacja (B):
- A. Bez zmian (stan 24 tys. jest konsekwencją podboju; cap 100 000 w epoce 2 ogranicza górę).
- B (rekomendowane). Nowe ujście miedzi proporcjonalne do liczby kopalni, np. przepustowość Odlewni brązu rosnąca z liczbą kopalni miedzi LUB utrzymanie/koszt rekrutacji zużywający miedź; wartość progu dobrać na podstawie tabeli (kredyt 2 025-2 880/t u zdobywcy vs ujście obecnie ok. 60 tys. w 60 turach u wszystkich razem).
- C. Niższy cap magazynu dla `ruda` (np. 25 000 × mnożnik epoki), bez nowego ujścia (tanie, ale zapas „przycina się” zamiast zużywać).
- D. Limit kopalni miedzi na właściciela / malejąca stawka powyżej N kopalni.
Bez decyzji nie zmieniam balansu (reguła: progi liczbowe i balans = ABC).

NASTĘPNY KROK: ABC do właściciela (A/B/C/D), potem osobny temat implementacyjny z testem i mutacją; ewentualnie pomiar uzupełniający >60 tur (nowy zapis stanu między wywołaniami) i 3. ziarno.
UWAGI-DLA-ORKIESTRATORA:
- Tryb przyspieszony (hak `__aiTradeWiringTestDebug.setFastMode`, tylko `?civTest=1`) skraca turę z ~52 s do 1-6 s; runner longrun domyślnie go włącza. Poprzednie „NIEWYKONALNE” wynikało z braku tego trybu.
- Przebiegi równoległe 3×: świat nie startuje w 570 s (CPU). Jeden przebieg ~60 tur / 580 s.
- Kolizja etykiety `Ruda żelaza`→`ruda` oraz zwrot Zastąp bez capu: osobne tematy, nie wykonane.
DEPLOY/PUSH: NIE WYKONANO
