STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5I2B2-POKRYCIE-Q1
GOAL: obrona Operatora wobec zarzutow Evaluatora (02-evaluator.md, SHA 8afed5af4); odpowiedz na kazdy zarzut: PRZYJMUJE albo ODRZUCAM
ZMIANY/COMMIT: brak zmian kodu i wektorow w tej rundzie; zapisany wylacznie ten raport. Kod operatora: 738bf1238dd5da2ca4be1d25d66fae2176d67f87 (raport operatora: a0071c780). Evaluator 8afed5af4 jest potomkiem tego kodu.
TESTY: w tej rundzie nie uruchamiano ponownie bramek cargo (zmiana dotyczy wylacznie raportu). Ponownie zmierzono liczby z pliku vectors.json z commita 738bf1238: 1200 przypadkow, sha256 efbce73b3a8db0fa... (pelny: efbce73b3a8db0fafa502cc5a50d739b6a8c4db9de7380723a6fd65ef5b5f4c8, zgodny z raportem), rozmiar 7 343 513 B.
BLOKADY: brak
RUNDY: 1/5
NASTEPNY KROK: Final Control (R-RUSTPORT-P6-K5I2B2-POKRYCIE-Q1, baza 8afed5af4 albo kod 738bf1238)
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

### Zarzut 1. -0 w murze: NIE_ZMIERZONO (JS-MAX-SIGN, #110)
PRZYJMUJE. Luka jest prawdziwa i pozostaje jawnie oznaczona jako NIE_ZMIERZONO. Generator w 738bf1238 daje wallNegZeroBonus=0, czyli zadne wyjscie muru nie daje -0. Asercja neg_zero_cu dotyczy wylacznie CombatUnit (cuA/cuD), nie muru. Dispatch dopuszcza zapis 0 z uzasadnieniem, gdy -0 jest niedostepne w pinie dla danej galezi. Nie dodaje asercji dla muru: wymagalaby zmiany rozkladu wejsc muru w generatorze, czyli nowego celu poza GOAL tego tematu. Pozostaje do tematu JS-MAX-SIGN (#110). Brak zmiany kodu.

### Zarzut 2. Rozbieznosc liczby przypadkow -0 (45 vs 88)
PRZYJMUJE, opis byl niedokladny. Ponowny pomiar na vectors.json z 738bf1238 (skrypt node, JSON.parse, szukanie tagu ["n","-0"] w cuA i cuD):
- cuA: 45 przypadkow
- cuD: 45 przypadkow
- cuA lub cuD: 88 przypadkow
Asercja testu (`c["in"]["cuA"]... || c["in"]["cuD"]...`) liczy przypadki z OR, wiec wlasciwa wartosc licznika neg_zero_cu to 88. Raport 01-operator-r1.md podal 45 jako laczna liczbe; to bylo blad opisowy, nie bledna asercja. Korekta jest w tej odpowiedzi; kod nie wymaga zmiany. Asercja wymaga tylko >0, wiec wynik testu nie zmienia sie.

### Zarzut 3. Margines procarza (116 przy progu 100) i lucznika (29 przy progu 14)
PRZYJMUJE jako notatke, bez zmiany kodu. Dane: slingerRanged=116 (prog GOAL >= 100), lucznikRanged=29 (prog GOAL >= 14). Oba progi GOAL sa spelnione. Nie podnosze progow ponad GOAL. Zmiana ziarna 2201 albo wag losowania wymaga regeneracji i ponownej kontroli, a asercje w zgodnosc_z_pinem_end_to_end wymusza to automatycznie (test pada, gdy licznik spadnie ponizej progu).

### Zarzut 4. Wektory nie sa bajt-w-bajt z poprzednimi
ODRZUCAM jako defekt, PRZYJMUJE jako fakt do odnotowania.
- GOAL (3) dispatchu wprost nakazuje regeneracje wektorow generatorem z pinu (z straznikiem SHA-256) przy zachowaniu zgodnosci 1200/1200. Tak zrobiono: sha256 pliku vectors.json jest identyczny po regeneracji z commitem (potwierdzone przez Evaluatora i ponownie pomierzone tu).
- Zmiana wag losowania (70% procarze, z reszty 50% lucznicy, reszta jednorodnie) zmienia liczbe wywolan RNG na przypadek, wiec nowe wektory musza sie roznic. To jest nieuniknione przy GOAL (1); nie da sie podniesc licznika lucznikow bez zmiany strumienia losowego.
- Zgodnosc z pinem zostala potwierdzona testem zgodnosc_z_pinem_end_to_end: 1200/1200 (3 passed w p6_siege_tactics_blow_env, wg raportu operatora i reprodukcji Evaluatora).
- Uwaga do Final Control: tytul dispatchu zawiera fraze "stare wektory bajt-w-bajt", ktora jest niejednoznaczna wobec GOAL (3). Operator przyjal interpretacje GOAL (3), czyli regeneracje z pinu, a nie zachowanie starych bajtow. FC prosze o potwierdzenie tej interpretacji.
