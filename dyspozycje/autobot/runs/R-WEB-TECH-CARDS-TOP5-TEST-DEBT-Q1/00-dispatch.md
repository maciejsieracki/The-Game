# R-WEB-TECH-CARDS-TOP5-TEST-DEBT-Q1
STATUS: REGISTERED — etap1/11
DOMAIN: GAME
GOAL: odtworzyć i naprawić wskazany dług testowy: tech-cards-top5-test.cjs, bez osłabienia asercji ani niezatwierdzonych zmian reguł gry.
MODEL: Operator/Evaluator/FinalControl gpt-6-luna high; role osobne,sekwencyjne.
BAZA: origin/main poFALI608; Operator zapisze dokładnySHA.
ALLOWLIST: tenrun i własny wskazanytest; producthelpers/dane read-onlypoczątkowo. D-FOG najpierwidentyfikuje dokładne3pliki i dopisuje je przededycją.
Testy: baseline i regresja, dowody aktualnego kontraktu, żadnego skip/relax/balanceguess. Przeglądarkę ciężką tylko z blokadą orkiestratora, nie równolegle. Cel11/11 po niezależnychbramkach; testonlydeployN/A.

## Decyzja właściciela i kwalifikacja implementacji
2026-11-10: właściciel wybrał dokładny opis „Odblokowuje jednostki epoki Żelaza”, bez liczby. Zamyka to DECISION_REQUIRED dotyczące źródła Top3 Sztuki wojennej.
Rozszerzony zakres: kanoniczny CSV (tylko Top3 wiersza Sztuka wojenna), odpowiadające wygenerowane pola/opisy Top3 i właściwy test. Operator przededycją dopisuje konkretne ścieżki. Zachować koszty, prereq, reguły odblokowania i pozostałe technologie; nie wpisywać liczby jednostek aniNIE_USTALONO. Nie usuwać globalnego --check. Generator/defaultsource tylko jeśli niezbędne do spójności, z dowodem.
ALLOWLISTA UZUPEŁNIONA PRZED EDYCJĄ (konkretne ścieżki):
- `dyspozycje/analizy/karty-odkryc/odkrycia-top5.csv` — tylko kolumna `Top3` wiersza `Sztuka wojenna`.
- `gra/data/tech-cards-top5.json` — tylko wygenerowany wpis `Sztuka wojenna.top5` odpowiadający zatwierdzonemu Top3.
- `gra/tools/tech-cards-top5-test.cjs` — tylko asercja regresyjna dokładnego tytułu zatwierdzonego Top3.
Bez zmian `gen-tech-cards-top5.cjs`, `gen-tech-cards-top5.zdania.json`, historycznego snapshotu CSV, innych pól/wierszy ani mechaniki.

## Uzupełnienie źródła dla zgodności globalnego generatora
Po zatwierdzeniu przez orkiestratora (`2026-11-10`) scope źródłowy rozszerzono wyłącznie o pola opisowe potrzebne, by kanoniczny CSV generował obecną, zaakceptowaną zawartość kart po FALA 582. Nie synchronizować całych wierszy ani pól analitycznych/wyborów rankingu.
- `dyspozycje/analizy/karty-odkryc/odkrycia-top5.csv`: wiersz `Hutnictwo żelaza` — `Top5`, slot `Top5` w `Dowod_plik_linia`, czwarty element `Co_mozesz_zrobic_PROPOZYCJA`; wiersz `Obróbka żelaza` — `Co_mozesz_zrobic_PROPOZYCJA`; wiersz `Sztuka wojenna` — `Top3`, dowód slotu `Top3` w `Dowod_plik_linia`, oraz drugi element `Co_mozesz_zrobic_PROPOZYCJA` odpowiadający istniejącemu CMZ w bieżącym HEAD.
- `gra/data/tech-cards-top5.json` pozostaje generowany; oczekiwane różnice względem bieżącego HEAD: wyłącznie `_meta.csvSha256` i tytuł `Sztuka wojenna.top5[2]` zatwierdzony przez właściciela.
Pozostałe Top5/CMZ, dowody generatora, koszty, prereq, statystyki, rekrutacja, jednostki i wszystkie inne technologie pozostają dokładnie jak w bieżącym HEAD. Wartości źródłowe mają odzwierciedlać `gra/data/tech-cards-top5.json` bieżącego HEAD oraz potwierdzone fakty gry po FALA 582.
AktualnydispatchCodex: gpt-6-luna high; sourceoldreadonlyzakres rozszerzony jawnie dopiero po decyzji.
