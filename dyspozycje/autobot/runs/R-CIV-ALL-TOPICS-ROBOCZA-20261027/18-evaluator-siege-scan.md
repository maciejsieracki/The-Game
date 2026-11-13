# AutoBot Evaluator — profil skanu automatycznych oblężeń

**STATUS: PASS-WITH-NOTES**
**ROLE:** niezależny Evaluator raportu Operatora 13
**BAZA:** `integration/robocza-all-topics-20261027`, HEAD `99bb834c6fe158d3bc59eb741f8fde9637b77027`
**ZAKRES:** ocena dowodów 30,734 s w `scanAutoSiegesAfterAiTurn()`, walidacji testowego instrumentowania oraz nieudanego replayu.

## Werdykt

Raport poprawnie odróżnia zmierzony koszt całej funkcji od nieznanej przyczyny wewnątrz niej. Poprzedni pełny przebieg rzeczywiście zawiera `scanAutoSiegesAfterAiTurn` = **30 734 ms** w turze 40, przy maksimum `runWorldEndTurn_total` **69 795,6 ms**. Suma dla skanu to **134 791,6 ms / 39 pomiarów**, średnio **3 456,19 ms**. Te dane potwierdzają, że skan jest wiarygodnym obszarem do dalszego profilowania, ale nie dowodzą, czy koszt pochodzi z `validateActiveSieges`, detekcji, decyzji AI, cichego szturmu czy rozpoczęcia oblężenia.

Operator nie wprowadził optymalizacji bez dowodu i jawnie zgłosił, że nowa diagnostyka nie zebrała żadnego podziału gałęzi. To właściwe ograniczenie wniosku.

## Niezależny readback

- Odczyt `/tmp/large-empire-stress-summary-37176-efzk9u.json` potwierdza jeden rekord `scanAutoSiegesAfterAiTurn` na turn 40 równy 30 734 ms oraz agregat 39 rekordów z maksimum 30 734 ms.
- Raport 13 zapisuje build-only, `node --check` i `git diff --check` jako PASS oraz przypina artefakt hash SHA-256 `d6bb01482990a1a7d6e2967bc2a69e81d51ab47824d8a02f3c46908d8a723486`.
- Replay poprawnie przygotował fixture 137 miast, 180 ulepszeń i 21 jednostek, lecz nie ukończył nawet EOT 1→2 w ciągu 7 min 53 s. Nie osiągnął limitu wszystkich możliwych prób harnessu; Operator przerwał go, by nie czekać bez końca. Ponieważ browser korzystał z `remote-debug-pipe` i harness nie zapisał stanu/modalnego zrzutu, nie ma dowodu, czy zatrzymanie wynikało z runtime, instrumentacji, czy modalnej blokady.
- Zatem nie ma nowych danych o kosztach gałęzi ani zmianach właścicieli miast; wykonanie tego replayu nie potwierdza ani nie obala wcześniejszego wyniku.

## Uwagi i następny krok

Wynik akceptuje raportowanie i powściągliwość Operatora, **nie** gotowość wydania ani skuteczność optymalizacji. Bez rozbicia kosztu funkcji i bez udanego przebiegu nie rekomenduję zmian produktu.

Następny profil powinien unikać powtarzania pełnego 40-turowego replayu. Preferowany jest deterministyczny test z małym, kontrolowanym fixture oblężenia, który wywołuje rzeczywiste ścieżki głównego silnika i mierzy osobno walidację, detekcję, decyzję, auto-szturm i rozpoczęcie oblężenia. Jeśli runtime fixture jest konieczny, harness powinien zatrzymać się po pierwszym timeoutie oraz niezależnie zachować stan tury, widoczne modale, kolejkę bitew, relacje/peace-lock i migawkę `cityId → ownerId`; samo `busy` czy liczba miast nie wystarczą.

Niezależnie należy zachować wcześniejsze ograniczenie: test dużego imperium nadal nie przechodzi limitu — 40. tura zajęła **77 678 ms wall** / **69 795,6 ms w pomiarze fazy świata**. Nie wykonano merge, deployu ani pushu.
