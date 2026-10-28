# Proponowany roster jednostki wodza/generała — do akceptacji właściciela

STATUS: decyzje właściciela Q2=A i Q3=B zebrane; selektor niezmieniony; Operator może wdrażać.

## Metoda

- Zestaw zawiera 15 grywalnych cywilizacji z `gra/data/civs.json`.
- Obecna ścieżka `bestGeneralUnitForOwner()` buduje ofertę z `purchasableUnits()` w stolicy i sortuje przez `sortByUnitPowerDescending()`.
- Wartość sortowania pochodzi z `unit-power.ts`: atak wręcz + obrażenia broni + przebicie + szarża/2 + atak dystansowy/2 + obrona wręcz + pancerz + zdrowie/2. Jest to więc aktualna siła bojowa z danych statystyk, a nie tylko surowe pole `fieldPower` z JSON.
- Symulacja zakłada pełne badania do wskazanej epoki i wcześniej, koszary tam, gdzie wymagane, oraz ignoruje braki magazynowe (oferta wodza już używa `showStockGatedUnits: true`). Zasada rekrutacji: jednostki z bieżącej i poprzedniej epoki; w epoce kamienia tylko kamienne.
- Wykluczyłem role `Dystans` i `Oblężnicza`, typy cywilne/morskie/oblężnicze oraz dopuściłem piechotę (`Swordsman`, `Spearman`, `Falangite`, `Offensive`) i flankę/konne/rydwanowe (`Mount`). Uwzględniłem narodowe zastępstwa z `W zamian za`, a nie bazową jednostkę zastąpioną przez jednostkę cywilizacji.
- Odpowiedź właściciela **R-GENERAL-ELIGIBLE-UNIT-ROSTER-Q2=A**: pozostawić rydwany i konnicę; wykluczać wyłącznie klasy `Dystans` i `Oblężnicza`. Zatem jednostki konne/rydwanowe z atakiem pociskowym pozostają dopuszczone, jeśli ich kategoria produkcyjna jest `Flanka`/`Mount`.
- Odpowiedź właściciela **R-GENERAL-ELIGIBLE-UNIT-ROSTER-Q3=B**: w Brązie, zanim zatwierdzony rydwan stanie się dostępny, model wodza to najlepsza obecnie dostępna piechota/konnica; po odblokowaniu właściwego rydwanu selektor przełącza model na ten rydwan.

## Proponowany wygląd dowódcy według epoki

Właściciel doprecyzował kategorię modelu dowódcy: w Kamieniu ma to być wóz wołowy; w Brązie najnowszy chariot dostępny dla cywilizacji; w Żelazie prawdziwa konnica albo jej narodowy odpowiednik. Poniższa tabela odpowiada tym kategoriom, nie jest rankingiem wszystkich jednostek według jednego pola mocy.

| Cywilizacja | Kamień | Brąz | Żelazo |
|---|---|---|---|
| Grecy | Rydwan (woły) | Rydwan mykeński | Konnica |
| Rzymianie | Rydwan (woły) | Rydwan konny | Konnica |
| Chińczycy | Rydwan (woły) | Rydwan Shang | Jeździec chiński |
| Inkowie | Rydwan (woły) | Rydwan konny | Konnica |
| Zulusi | Rydwan (woły) | Rydwan konny | Konnica |
| Egipt | Rydwan (woły) | Rydwan egipski | Konnica |
| Sumerowie | Rydwan (woły) | Rydwan sumeryjski | Konnica |
| Celtowie | Rydwan (woły) | Rydwan konny | Konnica |
| Germanie | Rydwan (woły) | Rydwan konny | Konnica |
| Harappa | Rydwan (woły) | Rydwan konny | Konnica |
| Hetyci | Rydwan (woły) | Rydwan Kapadokijski | Konnica |
| Słowianie | Rydwan (woły) | Rydwan konny | Jeździec z oszczepami* |
| Babilonia | Rydwan (woły) | Rydwan konny | Konnica |
| Asyria | Rydwan (woły) | Rydwan konny | Konnica lancowa asyryjska |
| Fenicjanie | Rydwan (woły) | Rydwan konny | Konnica |

## Konsekwencje do decyzji

- Kamień jest z góry określony przez właściciela: Rydwan (woły) we wszystkich cywilizacjach.
- W Brązie użyłem chariota z epoki Brązu, jeśli dane wskazują unikalny wariant cywilizacji; w pozostałych przypadkach ogólnego Rydwanu konnego. Celtycki chariot jest dopiero żelazny, więc Celtowie zachowują ogólny Rydwan konny w Brązie. Hetycki chariot Kapadokijski jest unikalnym brązowym wariantem, mimo że jego moc wpisana w `units.json` jest niższa niż wóz wołowy.
- W Żelazie wykluczyłem charioty i wybrałem Konnicę albo narodowe zastępstwo. Dane `units.json` mają: Konnica 98 mocy, Jeździec chiński 91, Konnica lancowa asyryjska 78 i Jeździec z oszczepami 65.
- Jeździec z oszczepami (`Typ=Mount`, `Rola=Flanka`, `missileAttack=14`) oraz egipski rydwan (`missileAttack=10`) zostają dozwolone jako konne/rydwanowe, zgodnie z odpowiedzią Q2=A.
- Narodowe zastępstwa konnicy dla Chin, Asyrii i Słowian są użyte jako odpowiedniki jednostki bazowej. Zwykła Konnica pozostaje w pozostałych nacjach. Kwestia, czy ogólna Konnica ma być dostępna obok słabszego unikalnego odpowiednika, zmieni wynik przy rankingu czysto liczbowym; tabela przyjmuje istniejącą zasadę zastępowania bazowej jednostki przez narodową.
- Nazwa karty i jednostki dowódcy powinna brzmieć wyłącznie „Wódz” albo „Generał”; typ użytej jednostki może nadal sterować statystykami i wyglądem modelu, ale nie musi być dopisywany do nazwy.
- Obecny kod nie realizuje ograniczeń z tej analizy: nadal bierze najsilniejszy dostępny wpis katalogu, w tym taran/maszynę oblężniczą i jednostki dystansowe. Nie wprowadzono zmiany przed decyzją właściciela.
