# PROPOZYCJA — zmęczenie wojną jako pozycja PW przy pokoju (tylko algorytm, BEZ wdrożenia)

Data: 2026-11-14. Źródło: decyzja właściciela (ABC: „A — zmęczenie jako pozycja PW") + doprecyzowanie z czatu.
Status: ZATWIERDZONE 2026-11-14 (ABC właściciela: A krzywa kwadratowa; stary rabat 60% usunąć; zmęczenie AI liczy się też przy ofercie gracza). Wdrożenie: R-WEB-DIPLO-WEARINESS-AS-PW-PEACE-ITEM-Q1.

## Wymóg właściciela

1. Na początku wojny AI proponuje warunki mniej korzystne: gracz musi do pokoju jeszcze dopłacić.
2. Z czasem zmęczenie to coraz większa liczba punktów wymiany (PW) na stole.
3. Pozycja leży po stronie osoby po drugiej stronie, nie tej proponującej.
4. Tabela ma być spójna z decyzją AI: nie ma być pokoju przy ujemnym bilansie, którego stół nie tłumaczy (przypadek Harappy).

## Stan dzisiejszy (z kodu)

- Cena pokoju C = 500 PW (`diplomacy-acceptance-points.json`) × mnożnik cywilizacji 0,7–1,5 (`peaceCivPriceMultiplier`).
- Zmęczenie L = min(1, tury/20 + 0,1 × zmienione miasta) — jeden licznik pary (`war-weariness.ts`).
- Dziś zmęczenie nie jest pozycją, tylko ukrytym rabatem do 60% ceny (`wearinessPeacePriceFactor`, od L = 0,5) i osobną gałęzią `bezwarunkowy` od L ≥ 0,8 (`ai.ts` ~l.7050), która omija bilans PW. Stąd pokój przy ujemnej tabeli.
- Słodzikiem pokoju są wyłącznie miasta (złoto i surowce odrzucane).

## Algorytm

Dane wejściowe: tylko istniejące parametry, żadna nowa liczba.

1. Cena pokoju: `C = 500 × mnożnikCywilizacji`. Stary rabat 60% (`wearinessPeacePriceFactor`) wyłączony, żeby zmęczenie nie liczyło się dwa razy.
2. Postęp zmęczenia: `x = clamp((L − progChetnosci) / (progKoncaZmeczenia − progChetnosci), 0, 1)`, czyli (L − 0,5) / 0,3.
3. Pozycja „Zmęczenie wojną": `Z = C × x²` (krzywa kwadratowa, wolny start i przyspieszenie). Wariant liniowy: `Z = C × x`.
4. Strona: pozycja Z jest wpisywana w kolumnę strony niebędącej proponującym. Dla oferty AI do gracza (przypadek Harappy) Z trafia do kolumny gracza i pokazuje, ile wojna już „spłaciła" z ceny pokoju.
5. Reszta do dopłaty: `R = C − Z`. Jeśli R > 0, strona dopłaca miastem o wartości PN ≥ R. To dotychczasowa reguła „tylko miasta są słodzikiem".
6. Gałąź bezwarunkowa przestaje być wyjątkiem. Przy L ≥ 0,8: x = 1, Z = C, R = 0, więc tabela sama pokazuje bilans 0 i pokój bez dopłaty. Jedna prawda zamiast dwóch ścieżek.
7. Propozycja AI: AI proponuje pokój tylko wtedy, gdy bilans tabeli po doliczeniu Z jest ≥ 0 dla niej. Znika „pokój na minusie bez wyjaśnienia".
8. Dolna granica: przed `minTurWojny` (10 tur) bez zmian — „za wcześnie na pokój", pokój nie jest oferowany.

## Tabela dla C = 500 PW (mnożnik 1,0), bez utraconych miast

| Tura wojny | L | x | Z liniowo | Z kwadratowo (rekomendacja) | R do dopłaty (kw.) |
|---|---|---|---|---|---|
| 10 | 0,50 | 0% | 0 | 0 | 500 |
| 11 | 0,55 | 17% | 83 | 14 | 486 |
| 12 | 0,60 | 33% | 167 | 56 | 444 |
| 13 | 0,65 | 50% | 250 | 125 | 375 |
| 14 | 0,70 | 67% | 333 | 222 | 278 |
| 15 | 0,75 | 83% | 417 | 347 | 153 |
| 16 | 0,80 | 100% | 500 | 500 | 0 |

Każde zmienione miasto (+0,1 L) przesuwa tabelę o 2 tury do przodu.

## Do decyzji właściciela (ABC)

- A. Krzywa: kwadratowa (rekomendacja — AI na początku wyraźnie żąda dopłaty) albo liniowa (szybszy spadek ceny).
- B. Wejście przy ofercie gracza do AI: liczy się zmęczenie AI (to AI ocenia ofertę). Rekomendacja: tak, pozycja widoczna w tabeli gracza jako „Zmęczenie AI".
- C. Stary rabat 60% ceny pokoju: usunąć (rekomendacja, bo Z go zastępuje).

## Po akceptacji — zakres tematu

`diplomacy-proposals.ts` (~l.1375, wyłączenie rabatu i dodanie pozycji Z), `ai.ts` (~l.7050, gałąź `bezwarunkowy` wyprowadzona z tabeli), UI stołu negocjacji (wiersz „Zmęczenie wojną +N PW"), Civpedia (hasło zmęczenia), test spójności tabela↔decyzja AI. Dług Rust: REPIN po wdrożeniu.
