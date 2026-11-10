# R-WEB-POLISH-LANGUAGE-AUDIT-Q1 — niezależna weryfikacja rundy 2

STATUS: PASS — wąska zmiana źródeł gotowa w zadeklarowanym zakresie; audyt nadrzędny pozostaje CZĘŚCIOWY  
DATA: 2026-11-10  
ZAKRES: poprawka PL-01 i prezentacyjne mapowania Top 3; kontrola faktycznego DOM, nieznanego tekstu, źródłowych danych Top3 oraz zachowania poza zatwierdzonymi mapowaniami. Bez przeglądarki, pełnego buildu ani commitów.

## Wynik

Potwierdzam, że implementacja mieści się w allowliście dispatchu. W `units.json` zmieniono wyłącznie zgodę „niektórzy źródła” na „niektóre źródła” w historii Evocati; diff nie pokazuje zmian liczb, kluczy ani żadnego wpisu Top3. W `unitAdapter.ts` mapowanie działa podczas tworzenia wierszy Top3 w adapterze, a nie modyfikuje rekordów. Nieaktualny komentarz o 0/75 usunięto bez zmiany logiki.

Uruchomiłem `cd gra && node tools/unit-top3-player-language-test.cjs`; wynik PASS. Test bundluje rzeczywisty `unitAdapter` i renderer, tworzy DOM i sprawdza poprawioną historię oraz tłumaczenia w wyrenderowanej karcie. Następnie renderuje wszystkie aktualnie wypełnione sekcje Top3 — 75/75 — i sprawdza, że nie zawierają surowych etykiet z czterech zatwierdzonych rodzin Health, fieldPower, Bonus vs Spearman i Bonus vs Mount/vs Mount. Test sprawdza także nieznane `UnknownLabel` bez zmian oraz identyczność wejściowych wartości Top3 przed i po przejściu przez adapter/renderowanie.

Weryfikacja zakresu angielskich etykiet jest celowo ograniczona. Mapowania nie obejmują `Bonus vs Swordsman`, `Bonus vs Falangite`, `Bonus vs Distance`, `Bonus vs Slinger` ani `Bonus vs Offensive`; kod pozostawia je bez zmian, a raport operatora prawidłowo wymienia je jako nierozstrzygnięte. Wynik testu nie oznacza, że wszystkie angielskie fragmenty kart jednostek ani wszystkie angielskie teksty gry zostały usunięte.

Nie znalazłem rozbieżności wymagającej blokady. PL-02 pozostaje bez zmian, zgodnie z raportem pierwszej rundy i zakresem decyzji. Weryfikacja dotyczy wyłącznie kart jednostek i nie potwierdza pełnego audytu UI, CIVPEDII ani poradników.

**OBRONA POMINIĘTA:** brak osobnego zarzutu wymagającego odpowiedzi.
