# R-WEB-POLISH-UI-ROUTES-AUDIT-Q3 — Operator LunaHigh, runda 1

STATUS: READ-ONLY PASS-WITH-NOTES — cztery bounded tematy mają konkretne, osiągalne teksty kandydujące do niezależnej weryfikacji. Nie zmieniano produktu, danych ani testów.
BAZA: `98531a86b4030bbf8538b5c0e0cc2395305f03ae` (`codex/polish-ui-q3`).
ZAKRES: aktywne UI/Civpedia: miasto i budowa, ulepszenia, handel, ustawienia pauzy, powiadomienia autozapisu. Cztery tematy: modal ulepszeń, liczby w UI budowy, liczba aktywnych tras handlowych, komunikat o błędzie autozapisu.
TESTY/PRZEGLĄDARKA: Nie uruchamiano. To źródłowy audyt read-only; nie dodawano testów. Istniejący kod i testy przywołano wyłącznie jako ślad zakresu/scenariusza, nie jako automatyczny werdykt językowy.
ZMIANY: tylko ten raport i `11-coverage-matrix.tsv`; brak zmian produkcyjnych, stage’owania i commita.
NASTĘPNY KROK: niezależny evaluator ma zweryfikować cztery tematy, w tym fałszywe alarmy i osiągalność scenariuszy. Do czasu kwalifikacji nie ma allowlisty zmian.
DEPLOY/PUSH: NIE DOTYCZY — wynik audytu informacyjnego, brak zmiany produktu.

## Metoda i granice

Każdy kandydat ma wskazany renderer oraz źródło wartości albo callback produkcyjny. Nie traktowałem surowych identyfikatorów z JSON jako błędu bez ścieżki do UI. Nie powtarzam Q2 UI-01–04 ani zamkniętych tematów 601/602/609–617; Q2 UI-03 dotyczył wskazanych etykiet czasu „N tur”, a nie poniższych fraz.

Przegląd jest statyczny i ograniczony do wskazanych powierzchni; nie odtwarzał stanu gry w Chromium. Raport nie oznacza pełnej korekty całego UI ani Civpedii. Właściciel ma zdecydować o brzmieniu ewentualnych poprawek. Ten raport nie upoważnia do zmian w kodzie.

## Potwierdzone kandydaty dla niezależnego evaluatora

**UI-01 — modal budowy wstawia nazwę ulepszenia w mianowniku po „Postawić”.** `gra/src/ui/improvementBuildConfirm.ts:48-59` pobiera `newLabel = improvementDisplayName(newKey)` i wstawia surową nazwę w zdaniu `Postawić <nazwa> na tym polu?`. `improvementDisplayName()` w `gra/src/game/terrain-improvements.ts:457-458` zwraca pole `nazwa` z katalogu ulepszeń; np. `gra/data/terrain-improvements.json:12-14` definiuje `farma` jako „Farma”. Produkcyjna ścieżka `gra/src/main.ts:16472-16484` wywołuje modal, kiedy zaakceptowane do budowy ulepszenie zastępuje istniejące warstwy lub las. W takim stanie gracz widzi „Postawić Farma na tym polu?”, choć po „postawić” ta nazwa wymaga biernika („farmę”) albo przebudowy zdania. Lista usuwanych elementów ma odrębne „Zniknie: …” i nie jest podstawą tego kandydata. Proponowany zakres do sprawdzenia: tylko tekst pytania; nie zakładać zmian nazw encji.

**UI-02 — stała forma liczby pól w panelu budowy nie pasuje do każdej liczby; tytuł listy budynków ma ten sam wzorzec.** `gra/src/ui/buildModeHud.ts:603-608` pokazuje status, gdy rzeczywisty raport automatu ulepszeń ma `waitingHexes > 0`, jako `${waitingHexes} pól czeka na obywatela`. Wartość jest liczbą kluczy oczekujących pól w `gra/src/game/auto-improvements.ts:277-293`; produkcyjne `main.ts:26383-26385` przekazuje `playerUnspentBudgetWarning` do HUD-u. Przy 3 renderer pokazuje „3 pól czeka”, gdzie właściwa konstrukcja to „3 pola czekają”; przy 5 obecny tekst jest zgodny. Istniejący scenariusz renderera w `gra/tools/auto-improve-q3-test.cjs:270, 314` ustawia `waitingHexes` na 3 i montuje HUD, ale nie uruchamiałem testu.

W tym samym temacie budowy, `gra/src/ui/cityPanel.ts:11859-11868` pozwala zapisać szablon już dla `lista.length > 0`, a przy odtwarzaniu tworzy tytuł `Wgraj „${tpl.nazwa}” (${tpl.budynki.length} pozycji)` (`11881-11888`). Callbacki tworzenia i wczytywania są przekazane przez `gra/src/main.ts:9149-9180`; tworzenie kopiuje rzeczywistą listę budynków do `tpl.budynki`. Dla listy jednoelementowej tytuł daje „1 pozycji”, a dla 2–4 również pozostawia stałą formę „pozycji”. To atrybut `title` (wskazówka po najechaniu), więc ma niższą widoczność niż powyższy status, ale jest aktywnym tekstem UI. Obydwie obserwacje są jednym ograniczonym tematem zgodności liczebników w UI budowy; nie proponuję tutaj poprawki ani implementacji formattera.

**UI-03 — liczba aktywnych tras handlowych ma statyczną formę „aktywnych”.** `gra/src/ui/cityPanel.ts:11361-11362` bierze `aktywneTrasyCount` z `activeTradeRouteCountForCity(city)`. Helper (`11503-11517`) liczy wyłącznie połączone trasy z odblokowanym budynkiem, których koniec jest tym miastem. Widoczna ścieżka handlowego szczegółu daniny wyświetla `Trasy handlowe z budynkiem: … (${aktywneTrasyCount} aktywnych …)` w `11433-11438`. Dla jednej trasy wyrażenie „1 aktywnych” jest niepoprawne; nazwa i kontekst wskazują na liczbę tras. Dodatkowy wiersz `(${aktywneTrasyCount} z budynkiem)` w `11401-11406` jest osobnym skrótem i nie stanowi dowodu tej usterki.

**UI-04 — toast błędu autozapisu pomija polskie znaki w słowie „błąd”.** `notifyAutosaveFailureOnce()` przekazuje tekst bezpośrednio do `showHintMessage(msg, 4000)` (`gra/src/main.ts:37041-37050`). Błędy migawki, zapisu rotacyjnego i nieobsłużony wyjątek przekazują „Autozapis nieudany (blad zapisu)” w aktywnych gałęziach `37137-37142`, `37214-37222` oraz `37684-37688`; obok komunikaty produktowe używają polskich znaków, np. wariant braku miejsca w `37215-37217`. Jest to toast dla gracza po błędzie autozapisu, nie wyłącznie wpis konsoli. Kandydat dotyczy pisowni `blad` → `błąd`, bez oceny tego, jak często awaria występuje.

## Sprawdzone granice / odrzucone alarmy

- W ustawieniach menu pauzy `Autozapis co N tur` (`gra/src/ui/gamePauseMenu.ts:190-194`) jest stałym opisem pola częstotliwości; `N` to placeholder etykiety, a nie dynamiczny tekst `1 tur` z błędną odmianą. Nie rejestruję go jako duplikatu Q2 UI-03.
- `improvementAdapter.ts` renderuje etykiety i pola oparte o adapter oraz teksty nazw; nie zgłaszałem nieprzetłumaczonych kluczy na podstawie samego JSON ani komentarzy/deweloperskich pól, które adapter już pomija.
- Panel handlowy z listą szlaków był już śledzony w Q2 matrix dla negocjacji/basket/deal. Kandydat UI-03 dotyczy innego renderera — szczegółu podatku miasta — nie powiela etykiety czasu z Q2.
- Nie znaleziono potwierdzonego problemu w statycznych etykietach audio, automatyzacji budowy i przycisków menu pauzy w przeczytanym fragmencie; widoczność ustawień została sprawdzona statycznie, bez odtwarzania wszystkich stanów.
