# R-WEB-POLISH-LANGUAGE-AUDIT-Q1 — niezależna weryfikacja

STATUS: PASS z zastrzeżeniem redakcyjnym dla PL-02  
DATA: 2026-11-10  
ZAKRES: kontrola trzech zgłoszonych grup w aktywnych kartach jednostek: widoczność historii i Top 3 oraz zasadność proponowanych poprawek. To ograniczona weryfikacja wskazanych przykładów, nie audyt wszystkich tekstów UI/CIVPEDII. Bez zmian źródeł, uruchamiania przeglądarki i commitów.

## Wynik

Potwierdzam, że wszystkie trzy zgłoszone grupy mają przykłady w bieżących danych i prowadzą do treści renderowanych na karcie jednostki.

- **PL-01 — potwierdzone, poprawka bezpieczna.** `gra/data/units.json:5113` zawiera „a niektórzy źródła wspominają”. `unitAdapter.ts:289` przekazuje `Historia` jako `historicalNote`, a `renderer.ts:441-482` renderuje niepuste pole jako akapit pod nagłówkiem „Rys historyczny”. Korekta zgody „niektóre źródła” zachowuje sens i nie wymaga decyzji historycznej.
- **PL-02 — błąd językowy potwierdzony; proponowane przepisanie wymaga decyzji.** `gra/data/units.json:5184` zawiera „krótki, szerokoostrzowy dzirot kolący”. Ścieżka widoczności jest taka sama jak dla PL-01. „Dzirot” jest niepoprawnym wyrazem, a „kolący” w tym opisie należy poprawić na „kłujący”. Natomiast zamiana całego określenia na „włócznia o szerokim, kłującym ostrzu” interpretuje rodzaj broni i zmienia opis; wymaga uzgodnienia terminologii/historycznej. W szczególności nie zatwierdzam tej propozycji jako bezpiecznej korekty. Można rozważyć „dziryt kłujący” jako najbliższą korektę pisowni, ale dobór nazwy broni także warto potwierdzić przed zmianą.
- **PL-03 — potwierdzone.** `gra/data/units.json:4553-4558` zawiera w rekordzie Top 3 etykiety „Najwyższe Health”, „Health 40”, „Najwyższa fieldPower” i „fieldPower 40”. `unitAdapter.ts:90-99` kopiuje `Top3[].tytul/tekst` wprost do etykiety i wartości wiersza; `unitAdapter.ts:157-159` dodaje te wiersze jako sekcję „Top 3”, a `renderer.ts:229-249,263-271` buduje i wyświetla jej wiersze. Angielskie fragmenty nie są zatem tylko surowymi polami danych. Weryfikuję też przykłady `Bonus vs Spearman` i `vs Mount`: występują w widocznym tytule/tekście Top 3, np. `units.json:886` oraz `5196-5197`. Dla Health istnieje już polska etykieta podstawowej statystyki „HP” (`unitAdapter.ts:182`), lecz właściwe brzmienie opisowej etykiety mocy oraz polskie nazwy typów przeciwnika należy ustalić przed poprawką; raport słusznie nie rozstrzyga ich samodzielnie.

Aktywność karty potwierdza `renderer.ts:39-54`: ścieżka `kind: 'unit'` rozwiązuje bieżący rekord i deleguje go do `unitAdapter`. Sekcja Top 3 jest dodawana, gdy rekord ma niepuste Top3 (`unitAdapter.ts:90-99, 157-159`), a weryfikowane wpisy są w rekordach obecnych w `units.json`. Nie uruchamiałem aplikacji ani nie potwierdzałem zachowania w przeglądarce.

Uwaga do dowodów: komentarz nad kodem Top 3 w `unitAdapter.ts:157` nadal mówi „dziś: 0/75”, choć kod dodaje sekcję warunkowo, a wskazane rekordy `units.json` zawierają Top3. To nie zmienia wyniku weryfikacji ścieżki, ale jest nieaktualnym komentarzem w kodzie.

## Zakres i duplikaty

Raport operatora zachowuje ograniczony zakres i nie twierdzi, że przeczytał wszystkie teksty widoczne w grze. Nie dopisuję nazw dla oczekujących wpisów #201. Nie powtarzam zależności ani tematów FALA601RAWIDS/FALA602terminology; sprawdziłem wyłącznie, czy wskazane przykłady tej rundy są widoczne przez aktualne ścieżki kart jednostek.

**OBRONA POMINIĘTA:** brak osobnego zarzutu wymagającego odpowiedzi poza zastrzeżeniem do propozycji PL-02.
