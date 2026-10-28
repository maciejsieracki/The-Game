# AutoBot Operator — stress test po optymalizacji syncu szturmu AI

**WERDYKT: FAIL / NIEUKOŃCZONY — przekroczony próg 60 s bez postępu**
**Zakres:** dokładnie jedno uruchomienie `STRESS_COMPACT=1 node tools/perf-large-empire-stress-live-test.cjs 100`. Bez retry i bez zmian produktu po stronie operatora.

## Tożsamość i scenariusz

- `src/main.ts` SHA-256 przed uruchomieniem i po przerwaniu: `a9e9875dfa204f4bdc51b8635d2f36b37444738320647551a85638b778c7742d` (bez zmiany).
- Bundle `index.html` SHA-256: `f2163b5821ee05afdbb4d2e25c4ed52701c74f3fa32e9b4c338111d7bf16741b`.
- Artefakt: `/tmp/large-empire-stress-59664-patsfv/index.html` (70 013 673 bajtów).
- Vite build: 911 modułów, 17,88 s.
- Scenariusz utworzony poprawnie: 40 miast gracza, sześć głównych AI po 15 miast (łącznie 90), siedem miast-państw; razem 137 miast, 180 ulepszeń i pięć typów budynków (`stolarnia`, `spichlerz`, `targowisko`, `koszary`, `biblioteka`).
- Przed turami: turn 1, 21 jednostek, heap `301203788` bajtów, renderer: 396 wywołań i 1 387 068 trójkątów.

## Przebieg i zatrzymanie

Ostatnia linia harnessu przed zatrzymaniem to trzy poprawnie obsłużone oferty AI przez przycisk odrzucenia w UI, wszystkie opisane jako `turn: 2` (`negot-umowa_handlowa-0-{1,5,9}-t2-{1,2,3}`). Nie pojawił się checkpoint EOT ani kolejny komunikat o postępie. Oznacza to, że przebieg osiągnął obsługę ofert dla tury 2; harness nie potwierdził ukończenia przejścia z tury 2 do 3. Nie osiągnięto turn 100.

Proces Node był aktywny około 8–9 minut łącznie. Ostatni pomiar `ps` przed przerwaniem wskazywał elapsed `08:11`; po kolejnych około 30 sekundach bez nowego logu zatrzymałem ten sam proces. Brak znaczników czasu na logach harnessu uniemożliwia dokładny pomiar startu i czasu samego EOT. Brak postępu przekroczył 60 s. Ponieważ strona nie odpowiadała na dalsze odczyty, harness nie zapisał stanu `busy`, finalnego turn ani timeout screenshotu. Zatrzymanie procesu nastąpiło przed wygenerowaniem przez harness końcowego raportu; nie wykonano ponowienia.

Nie odnotowano jawnego komunikatu o wyjątku JavaScript ani page error przed utratą postępu, ale brak końcowego `errors` snapshot oznacza, że nie można raportować ich jako pustych. Heap po rozpoczęciu EOT, city counts po EOT, busy flags, rozbicie fazowe i czas pojedynczego EOT nie zostały uchwycone. Nie ma screenshotu timeoutu: istniejący screenshot hook działa dopiero gdy harness odzyska kontrolę po timeoutie, czego się nie udało osiągnąć.

## Ocena

100-turowa walidacja **nie przeszła** i nie może odblokować bramki wydajności. To pojedyncze uruchomienie zbudowało właściwą fixture i dotarło do obsługi AI offers dla turn 2, po czym nie wykazało postępu przez ponad 60 s; zostało zatrzymane bez retry. Nie należy interpretować build success ani początkowego stanu świata jako dowodu ukończenia EOT lub poprawy wydajności. `src/main.ts` zachował ten sam hash przez cały test. Osobna zmiana `src/game/production.ts` pojawiła się w trakcie runu; nie mam hasha pliku z chwili builda, więc tego artefaktu nie oznaczam jako walidacji po tej zmianie.

**Proces:** zakończony; potwierdzono, że nie działa już Node harness ani proces przeglądarki należący do tego runu. **Push/deploy:** brak.
