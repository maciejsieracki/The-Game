STATUS: PASS
DOMAIN: GAME (analiza/projekt; zero zmian kodu gry)
TEMAT: R-WEB-AI-TERRITORY-RACE-FORTS-OUTPOSTS-DESIGN-Q1
GOAL: analiza pomiaru PRZED (2 ziarna × 150 tur) i projekt wyścigu AI o teren fortami/posterunkami z pytaniami ABC opartymi na liczbach.

ZMIANY/COMMIT: baza eae4eff57. Zmieniono tylko: `dyspozycje/analizy/AI-TERRITORY-RACE-DESIGN.md` (nowa sekcja 6b, przeformułowane P1–P5, korekta numerów linii, rekomendacja), `dowody/final-2x150/` (CSV, kontrolne.json, summary, analiza md/json, r4-okna-i-korelacja.js/.txt; 252 KB; surowe jsonl 12 MB zostają w /tmp/territory-final), ten raport. Brak zmian w gra/src, gra/tools ani danych JSON.

WYNIKI (źródło: dowody/final-2x150/):
- Σ terytorium (właściciele ≠ 0), t10→t150: ziarno 4242 2531→12374, ziarno 7 2530→14052; w t90 12254/13641 = 99,0%/97,1% wartości z t150.
- Nasycenie (Σ <1% w 3 kolejnych krokach co 10 tur): 4242 od t90, 7 od t100.
- Forty/posterunki: udział netto w terytorium szczyt 5,66% (t42) / 5,54% (t44); t150 0,4% / 0,05%. W oknie t30–t60 dają 2,8% / 4,3% przyrostu; w t60–t90 netto ujemnie (miasta wchłaniają heksy, wartość netto nie mierzy wkładu).
- 13/13 AI w obu ziarnach zbudowało fort lub posterunek; pierwszy t31–t128, mediana 50 / 47. Teza „AI nie stawia fortów" jest fałszywa; prawdziwa jest „dają mało terenu".
- Wcześni (≤t50) vs pozostali: 4242 n=7/6, śr. t150 1011/883; 7 n=9/4, 1040/1160. Pearson (tura pierwszej budowy vs heksy t150): −0,16 / +0,15 (n=13). Brak dowodu na zysk; przyczynowość nieprzesądzona.
- Sporne w t150: 8113 (65,6%) / 7737 (55,1%).

BLOKADY: NIE ZMIERZONO: ziarno 1234; wolna ziemia lądowa i heksy „zajęte pierwszy raz" (hak nie zwraca); kwota utrzymania fortu/posterunku; UI/administrator gracza (nie weryfikowano w tej rundzie); przyczyna zniknięcia 1 fortu w ziarnie 7 między t80 a t90; owner 40/41 jako miasta-państwa (nieweryfikowane w kodzie). n=2 ziarna — wnioski orientacyjne.

TESTY: bramki tsc/logic nie dotyczą (nie ruszano gra/src ani tools). Analizator uruchomiony na obu ziarnach (0 pól nie-liczbowych). Liczby z CSV policzone skryptem r4-okna-i-korelacja.js; numery linii sprawdzone grepem na eae4eff57.

RUNDY: 4/5 (Operator Sonnet 5.5, uzasadnienie haikuFailures=2 z DODATKU 3/4)

UWAGI-DLA-ORKIESTRATORA: (1) Rekomendacja: C, etap 1 wąski i wczesny (t30–t80); ruch budowniczych (etap 2) wart rozważenia dopiero po pomiarze PO, bo skala korzyści jest mała. (2) Proponowane progi w P2–P5 (N=15 heksów, 1 fort/3 miasta, odstęp 4, 15% puli, promień 6) to propozycje do decyzji właściciela, nie wybrane. (3) Sekcje 1.3 i 1.4 pkt 3 nadal mają „NIE ZWERYFIKOWANO".

NASTĘPNY KROK: Evaluator/FC; po PASS przedstawienie P1–P5 właścicielowi.
DEPLOY/PUSH: NIE WYKONANO
