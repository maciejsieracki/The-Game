STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-FOOD-ONLY-WORKED-HEXES-Q1
GOAL: Ulepszenia żywnościowe i wycinka tylko na heksach z obywatelami (gracz: Żywność i Zrównoważone; AI).
BAZA: fb75c1631 (kod `gra/src` bez zmian w rundzie 2; zmiany tylko w teście, logach i tym raporcie).

ODPOWIEDZI NA ZARZUTY
1. PRZYJMUJĘ. Test nie pilnował kluczy. Dodano sekcję (F): sonda per klucz z `FOOD_IMPROVEMENT_KEYS` (farma, irygacja, tarasy [wzgórza, chinczycy], bydlo [złoże], owce, lama [wzgórza, inkowie], oboz_lowiecki [las + tartak, profil zrównoważony], lodzie_rybackie [morze], wyrab [las], warzelnia_soli [złoże soli]). Dla każdego: kontrola (filtr OFF stawia klucz poza obywatelami, sonda realna), filtr ON = 0, przebieg niedoboru (`getOnlyWorked=false` + `farmPriorityOnlyWorked=true`) = 0 z kontrolą, oraz AI przez `decideAITurn`. UWAGA: usunięcie klucza ze zbioru przy zwykłym `onlyWorked=true` jest mutacją równoważną (drugą linią obrony jest `candidateHexes.filter(workedKeys)`); zbiór rozstrzyga dopiero w przebiegu niedoboru i dla złóż, dlatego sonda ma ten tryb. Mutacje: usunięcie każdego z 10 kluczy po kolei = RED (farma 1, irygacja 1, tarasy 1, bydlo 3, owce 1, lama 1, oboz 1, lodzie 1, warzelnia 9, wyrab 1 FAIL), logi `gate-mutacja-klucz-*.txt`. Limit uczciwości: AI nie stawia w sondzie tarasów, owiec, lamy, obozu ani łodzi nawet bez filtra (polityka priorytetów AI), więc dla tych kluczy sprawdza się ścieżka gracza (ten sam `hexAllowsKey`), a asercja AI jest pusta (log podaje liczbę postawionych).
2. PRZYJMUJĘ. Pomiar na pełnych mapach: 5 ziaren (11-15) × {kontynenty, wyspy} × 100 tur × 3 miasta, aktor AI (`decideAITurn`) ORAZ automat gracza (`pickAutoImprovements`, profile zywnosc i zrownowazone). Logi `gate-pomiar-r2-{przed,po}-{ai,zywnosc,zrownowazone}-5x2x100.txt`.
   Ulepszenia żywnościowe poza polami obywateli PRZED -> PO: AI 1120/1761 (63,6%) -> 0/645 (0%); gracz Żywność 1272/1932 (65,8%) -> 0/737 (0%); gracz Zrównoważone 1128/1761 (64,1%) -> 0/645 (0%). Gracz liczony ściśle (pole obywatela miasta z `cityId` picka); AI luźniej (pole obywatela któregokolwiek miasta, bo komenda nie niesie `cityId`).
3. PRZYJMUJĘ. Dodano plon: nominalny `bonus.zywnosc` z `terrain-improvements.json`, sumowany na końcu gry. Efektywny (ulepszenia na polach obywateli w ostatniej turze): AI 2292 -> 1852 (-19%), gracz Żywność 2312 -> 1922 (-17%), Zrównoważone 2292 -> 1852 (-19%). Łącznie wszystkich postawionych: 3678 -> 1966. Wniosek: łączna żywność SPADA o ok. 17-19% w tym modelu (statyczne 3 miasta, pop do 8); przed zmianą farmy na pustych polach "wyprzedzały" wzrost obywateli. To bezpośredni skutek reguły właściciela, nie błąd; decyzja czy akceptować spadek należy do orkiestratora. NIE_ZMIERZONO: realny plon z silnika tury (pomiar nominalny, bez modyfikatorów).
   Czas wyboru: AI 19,5 -> 15,6 ms/turę; gracz 13-14 ms (przed 16-19).
4. PRZYJMUJĘ. Pierwszy pomiar sumował pola wszystkich miast (przyczyną różnicy 10-14 trafień były promienie, które nachodzą na siebie). Gracz jest teraz liczony ściśle per `cityId`. Dla AI komenda nie ma `cityId`, więc metryka zostaje luźniejsza (jawnie oznaczone `perCityStrict`). Przypadek "farma zostaje po przesunięciu obywatela": dodano sekcję (G): na heksach z istniejącą farmą poza polami obywateli picker nie dodaje NIC (irygacja/trzoda) i nie ma komendy burzenia (oba profile gracza). Model "obywatele przesuwani co turę": 0% dotyczy decyzji w danej turze.
5. PRZYJMUJĘ (format). Logi M1-M4 mają teraz linię zaczynającą się od `EXIT=`; nowe logi też.
6. ODNOTOWANE, bez zmian. Zmiana scenariusza w kroku (e) testu `autoclear-river-forest-priority` jest uzasadniona decyzją właściciela; OFF nadal pokryte.
7. ODRZUCAM jako zarzut do zmiany, dowód: `oboz-lowiecki-las-test` 72/19, `oboz-lowiecki-ev-r2-mainpath` 29/1, `autoimprove-live-hooks-test` (1 FAIL), `wyrab-rzeka-obywatel-turns` (błąd Node) dają IDENTYCZNY wynik na bazie 86d510c66 i na fb75c1631 (odtworzone w tej rundzie, `git checkout` pliku auto-improvements.ts na bazę i z powrotem).

TESTY: nowy test 81 OK / 0 FAIL (`gate-nowy-test-r2.txt`, EXIT=0); na bazie 52 OK / 29 FAIL (RED, `gate-nowy-test-r2-RED-baza.txt`). Kod `gra/src` niezmieniony od fb75c1631, więc tsc i regresje z rundy 1 aktualne (tsc EXIT=0; 13 testów regresji zielonych).
BLOKADY: brak.
RUNDY: 2/5
NASTĘPNY KROK: Evaluator rundy 2, potem Final Control.
DEPLOY/PUSH: NIE WYKONANO
