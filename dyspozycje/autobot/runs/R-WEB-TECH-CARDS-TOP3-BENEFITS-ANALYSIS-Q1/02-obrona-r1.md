STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB). Analiza i propozycja treści, bez zmian kodu gry.
TEMAT: R-WEB-TECH-CARDS-TOP3-BENEFITS-ANALYSIS-Q1
GOAL: Odpowiedź Obrony na zarzuty Evaluatora Z1–Z5 (r1) z dowodem i poprawkami artefaktów TOP 5 / „Co możesz teraz zrobić” dla 32 odkryć.

ZMIANY-COMMIT: baza = commit Operatora 163f82323 (raport) / 85be851ae (artefakty). Commit Obrony podany w raporcie końcowym workflow.
Zmienione pliki (wyłącznie allowlista):
- `dyspozycje/analizy/karty-odkryc/narzedzia/gen.py`: `lineterminator='\n'` w CSV, reguły R-K1 i E1, kolejność CMZ wg E1, adnotacje w plikach turniejów.
- `dyspozycje/analizy/karty-odkryc/narzedzia/techdata.py`: nowy kandydat Koło `e`, akcja `U:wodz`, poprawione zdania „aby…” dla Wojskowości i Brązownictwa.
- `odkrycia-top5.csv`, `turnieje/*.md` (28 plików + README) — wygenerowane ponownie: `python3 -I narzedzia/gen.py <repo>`.
- `ANALIZA-KART-ODKRYC.md`: §1.3 (R-K1, E1, nowe liczby), §4 pkt 9 (ziarnistość), tabele §5 i §6, Q2, Q7.

ODPOWIEDZI NA ZARZUTY:

- **Z1 — PRZYJMUJĘ.** Przyczyna: `csv.DictWriter` domyślnie pisze `\r\n`. Poprawka: `lineterminator='\n'` w `gen.py`. Dowód: `file odkrycia-top5.csv` → „UTF-8 (with BOM) text” bez „CRLF”; `git diff --check 57b916eb7` → pusto (0 trafień). BOM został.

- **Z2 — ODRZUCAM (z regułą zapisaną w §4 pkt 9).** TOP 5 liczy EFEKTY, nie obiekty. Dispatch każe wypisać „pełną listę efektów”, a `NIE_USTALONO` dopuszcza tylko „przy < 5 realnych efektach z dowodem” (DODATEK 2 pkt 5). Prawo ma 5 różnych efektów z dowodem: Sąd −30% korupcji (`economy.ts:1225-1235,1247-1249`), Pretorium −30% i 38 pkt Prawa (`society-params.json:795`), Sąd +19 pkt Prawa (`society-params.json:809`) oraz dwa pakiety płaskich przyrostów (`buildings.json:1742,1888`). Wpisanie `NIE_USTALONO ×3` przeczyłoby dispatchowi. Płaskie przyrosty jednego obiektu są już łączone w jedną pozycję we wszystkich 32 turniejach. Ta sama reguła rozstrzyga Wymianę, Kodeks, Handel i Walutę. Sposób pokazania na karcie (grupowanie po obiekcie) to wybór właściciela w Q1.

- **Z3 — PRZYJMUJĘ (rozstrzygnięte kryteriami, Q7 zawężone).**
  - R-K1: droga badań dostaje NOWA MECHANIKA = 0 (mechanikę ocenia karta następnego odkrycia, bez podwójnego liczenia) i ODCZUWALNOŚĆ ≤ 1. To wprost skala z §1.2: „1 = po łańcuchu warunków (inna technologia…)”, której Operator r1 nie stosował.
  - E1: Top1 = korzyść od ręki dla KAŻDEJ cywilizacji. Wykluczone: droga badań, cuda (wszystkie mają `maxNaSwiecie=1`; Wyrocznia, Ha'amonga i Brama są dostępne 15 cywilizacjom, więc to wyścig), obiekty narodowe i efekty martwe.
  - Wynik: Łowiectwo → Obóz łowiecki; Mistycyzm → Kamienne kręgi (+2% religii/turę, `society-params.json:588`); Religia → Świątynia (+4%, `:581`); Oblężnictwo → Warsztat oblężniczy (+10% parametrów; 41 pkt, a Katapulta ma 35); Inżynieria → Cytadela (+100% Obrony, `miasto-params.json:84`).
  - Obróbka żelaza ani Matematyka nie mają żadnego kandydata spełniającego E1. Ich Top1 zostaje wynikiem turnieju z zastrzeżeniem w Uwagach i trafia do Q7 (rekomendacja A: jawne „brak korzyści od ręki”). Bilans względem CSV Operatora (85be851ae): TOP 5 zmienione w 21/32 odkryciach, Top1 w 7 (5 wyżej + Matematyka i Obróbka żelaza, gdzie po R-K1 na pierwsze miejsce wyszedł cud narodowy). Waluta i Mennica są bez zmian (×1,5).

- **Z4 — PRZYJMUJĘ.** Nowy kandydat Koło `e`: „Wódz epoki Kamienia to Rydwan (woły): 400 HP zamiast 60”. Dowód: `generals.ts:71-73`, `main.ts:7304-7305`, `units.json:19` (Wojownik Health 60), `units.json:537` (Rydwan Health 400). Wynik 42 pkt daje Top3. „Droga: +2 handlu” spada na Top4. W CMZ dochodzi zdanie: „Rekrutuj Wodza w stolicy, aby mieć wodza na Rydwanie (woły) z 400 HP zamiast Wojownika z 60 HP.”

- **Z5 — PRZYJMUJĘ.**
  - Wojskowość: „…(np. Włócznik; Konnica wraz z Jeździectwem)”. Konnica ma `Tech=Jeździectwo`, a Włócznik `Tech=Brązownictwo`, które jest prerekwizytem Wojskowości.
  - Brązownictwo: „…bez niego i bez Koszar brak wojska epoki Brązu” (`production.ts:1075-1076`).

TESTY (= WERYFIKACJA):
- Generator przechodzi asercję 32/32 i `check_ev` dla każdego `plik:linia`, łącznie z nowymi dowodami.
- Liczby: 157 kandydatów i 374 pojedynki. 19/32 odkryć ma ≥ 5 efektów. Żadna pozycja nie przekracza 72 znaków.
- `git diff --check 57b916eb7` jest czysty. 0 zmian w `gra/**`, `gra-robocza` i `WERSJE.md`.

BLOKADY: brak. Q1–Q7 czekają na właściciela przez orkiestratora; Q7 zawężono do Matematyki i Obróbki żelaza.
RUNDY: 1/5 (Obrona)
NASTĘPNY KROK: Final Control robi trzeci turniej dla Prawa (spór ziarnistości), dla 6 odkryć zmienionych przez Z3 i Koła oraz dla próbki ≥ 6 zgodnych, w tym Waluty/Mennicy.
DEPLOY-PUSH: NIE WYKONANO
