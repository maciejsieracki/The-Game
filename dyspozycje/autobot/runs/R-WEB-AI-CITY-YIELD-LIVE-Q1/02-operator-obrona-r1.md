STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-CITY-YIELD-LIVE-Q1
GOAL: Pomiar PRE (`c99ac58cd`) vs POST (`8ce134b81`, waga 0,3) w pełnej grze; obrona po zarzutach Evaluatora (PASS-WITH-NOTES na `be87dc75f`). Bez zmian kodu gry, bez nowych biegów.

BAZA OBRONY: `be87dc75f` (rodzic `f8d7b55ea`). Zmiany obrony: tylko ten plik oraz cztery pliki `evidence/*.log.txt`.

ODPOWIEDZI NA ZARZUTY

1. Metryka "miasta AI major" to suma założeń i przejęć MP: PRZYJMUJĘ. Dowód z `evidence/*.json` (pole `snaps.tNN`): przejęte MP = majorCities - 5 (stolice) - founded; zgadza się z ubytkiem csCities (36 po T1).
   (w każdej komórce major = założone + przejęte + 5 stolic startowych; "+5" pominięto poza pierwszym wierszem)
   | Mapa / bieg | T25 major = zał. + przejęte | T50 | T100 |
   |---|---|---|---|
   | Kontynenty PRE | 31 = 2 + 24 (+5) | 72 = 37 + 30 | 93 = 58 + 30 |
   | Kontynenty POST | 31 = 2 + 24 | 71 = 36 + 30 | 93 = 58 + 30 |
   | Pangea PRE | 24 = 0 + 19 | 63 = 28 + 30 | 92 = 57 + 30 |
   | Pangea POST | 24 = 0 + 19 | 64 = 29 + 30 | 90 = 55 + 30 |
   (przy T25 część MP jeszcze nie przejęta: csCities 12 i 17; od T50 wszystkie 30 przejętych MP jest u AI, csCities = 6.) Wzrost do T25-T50 to więc głównie przejęcia MP. Poprawiona definicja metryki: "miasta AI major" = 5 stolic + miasta założone + miasta przejęte od MP. Delta samych założonych miast T100: Kontynenty 58 vs 58 = 0,0%; Pangea 57 vs 55 = -3,5%. Obie wartości w progu -10% do +25%. Wniosek liczbowy się nie zmienia; przejęcia są identyczne w PRE i POST (po 30), więc cała różnica PRE/POST leży w założeniach.

2. Definicja "wysoki plon": PRZYJMUJĘ. W `gra/tools/ai-city-live-measure.cjs:95` `HIGH = {laka, rownina}`; wszystko inne (las, wzgórza, pustynia, tundra itd.) liczy się jako "niski". Zdanie "AI zakłada prawie same miasta na wysokim plonie" zastępuję: "po poprawce udział założeń na terenie innym niż łąka i równina spada: Kontynenty T100 12,1% -> 0,0% (7 -> 0 z 58), Pangea T100 15,8% -> 9,1% (9 -> 5 z 57 vs 55; POST 5 z 55)". Pangea POST nie jest "prawie same wysokie plony": 9% założeń jest nadal na terenie niskiego plonu. Kierunek efektu zgodny z intencją poprawki, ale w Pangei wyeliminowanie niskiego plonu jest częściowe.

3. Odwołanie do nieistniejącej linii COMMIT i logi poza gitem: PRZYJMUJĘ. (a) Końcowa linia "COMMIT" w 01 nie istnieje; SHA runu Operatora to `be87dc75f`, SHA obrony podany w raporcie końcowym obrony i w `git log -1`. (b) `*.log` jest w `.gitignore` (linia 20), więc cztery logi (po ok. 700 B) skopiowano do `evidence/*.log.txt` i dodano jawnym `git add`. Dowód uruchomienia (log + `.DONE` + JSON) jest teraz w commicie.

4. Jedno ziarno, limit 20 miast, czasy zawyżone: PRZYJMUJĘ jako ograniczenie, ODRZUCAM żądanie nowych biegów w tej rundzie. Dispatch wymagał jednej mapy i jednego ziarna (4242); jeden bieg generuje świat 100-1300 s i trwa około godziny, nie ma w nim wymogu wariancji. Zawężam sformułowanie wniosku: "dla ziarna 4242, 5 AI, 100 tur, mapa Standardowy 168x120 (Kontynenty i Pangea) waga 0,3 mieści się w progu; to pomiar jednoziarnowy, NIE dowód dla populacji map i NIE zgoda na deploy". Górny próg +25%: nie sprawdzony skutecznie (T100 przy limicie 20 miast/cywilizację; wiele cywilizacji na 20), ale w tym pomiarze nie wystąpił żaden wzrost powyżej +1,6% w żadnej turze. Czasy tury (mediana 45-48 s, p95 57-83 s) ważne tylko dla pary PRE/POST z równoległych biegów (load 20-30 na 4 rdzeniach). NIE_ZMIERZONO: wariancja ziaren, Wyspy, pojedynczy bieg bez obciążenia. Rekomendacja opcjonalna: dodatkowe ziarna (np. 1337, 2024) jako osobny temat, jeśli właściciel chce wniosku populacyjnego.

Uwagi Evaluatora (allowlista, gate, determinizm PRE=POST do T25): bez zarzutu, nic do zmiany.

TESTY: `node --check gra/tools/ai-city-live-measure.cjs` EXIT=0; `node --check gra/tools/ai-city-live-summarize.cjs` EXIT=0 (powtórzone w tej rundzie). Liczby z tabeli w pkt 1 i 2 wyliczone ponownie z `evidence/*-4242.json`. Brak nowych biegów.
BLOKADY: brak
RUNDY: 2/5 (obrona po rundzie 1)
NASTĘPNY KROK: Evaluator weryfikuje poprawioną definicję metryki i dołączone logi; następnie Final Control.
DEPLOY/PUSH: NIE WYKONANO
