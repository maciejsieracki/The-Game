# Operator R2 — wyniki ograniczonych prób

## R2-A: pełny Chromium z usunięciem jednostki

**Wynik: niezaliczony; 240 s timeoutu w pierwszym pełnym cyklu.** W produkcyjnym Chromium
otwarto scenariusz 28v28, zaznaczono wszystkie 28 jednostek i wydano pointerem rozkazy
ataku oraz ruchu. Test oznaczył `atk27` jako martwy przed aktywacją i czekał na koniec
kolejki. Ostatni zapis stanu: `round=1`, `turnIdx=28`, `queueRemaining=1`, `live=27`,
`acted=27`, `moved=7`, `skippedQueuedIdStillQueued=true`; błędów strony/konsoli nie było.
Scenariusz nie dotarł do drugiego pointer-cyklu. JSON i screenshot przechowują się w
`evidence/operator-r2-timeout.json` oraz `evidence/operator-r2-timeout.png`.

Wynik wskazuje, że łączenie ręcznej pełnej kolejki z bezpośrednim zabiciem jednostki na
końcu listy utrudnia rozstrzygnięcie, czy asercja czeka na niewłaściwy slot. Nie jest to
zaliczony dowód ani dla, ani przeciw produkcyjnej poprawce. Zmieniono plan dowodowy:
żywe 28v28 ma weryfikować oba pointer-cykle, a pominięta martwa jednostka ma być osobnym,
deterministycznym przypadkiem z kandydatem dokładnie pod `turnOrder[turnIdx]`.

## R2-B: rozdzielony dowód

**Wynik: przerwany przez orkiestratora; niezaliczony i nierozstrzygający.** Zbudowano
produkcję Vite (917 modułów), mapa i bitwa 28v28 uruchomiły się bez błędów. Log potwierdza
skład 28v28, obecność jednostek dystansowych/konnych oraz bramkę wodza. Ostatni emitowany
punkt to `manual:full-roster-setup` o 00:14:13 UTC. Proces Node (`388573`) został przerwany
Ctrl+C o 00:18:52 UTC po 6:31 elapsed, zgodnie z poleceniem zatrzymania po braku dalszych
meldunków. Test nie emituje znaczników bezpośrednio przed/po każdym kliknięciu i wait;
dlatego z artefaktów nie da się ustalić, czy był jeszcze w 180 s aktywacji, w 240 s
oczekiwaniu na kolejne planowanie, czy w sekwencji pointerów. Nie przypisuję temu przebiegowi
statusu timeoutu, bo nie pojawił się timeout exception. Pozostały wyłącznie artefakty
`battle-open`/`map-before-battle`; nie ma dowodu drugiego rozkazu. Nie pozostał aktywny
proces Node tego testu ani jego profil Chromium.

## Zmiana testu do kolejnego ograniczonego przebiegu

- Live Chromium: bez sztucznej śmierci; 28 jednostek żyje, oczekiwanie na aktywację ma limit
  180 s, następne prawdziwe planowanie ma limit 240 s, a podzbiór ma wykonać rzeczywisty
  ruch po pointerowym kliknięciu i zmienić `q/r`.
- Osobna asercja produkcyjnego `_activateNext`: martwy, oczekujący kandydat jest dokładnie
  pod `turnOrder[turnIdx]`; rzeczywiste `_activateNext`, `_activateUnit` i Set pozostają
  oryginalne. Stubowany jest wyłącznie `_schedule`; test oczekuje usunięcia ID martwego
  kandydata i aktywacji następnej żywej jednostki.
- Statyczne bramki R2-B: `node --check`, `npm --prefix gra run typecheck` i
  `git diff --check` — PASS. Pełne Chromium po tej zmianie jeszcze niezaliczone.

**Status operatora: INCOMPLETE / WSTRZYMANY na dowodzie pełnego drugiego pointer-cyklu.**
Nie przekazuję pakietu evaluatorowi jako gotowego; potrzebny jest jeden ograniczony retry
z dodatkowymi znacznikami faz i niezależny werdykt po jego wyniku.
