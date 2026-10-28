# AutoBot Evaluator — bezpośredni profil skanu oblężeń

**STATUS: PASS-WITH-NOTES**
**ROLE:** niezależna ocena follow-upu Operatora 13
**BAZA:** `integration/robocza-all-topics-20261027`, HEAD `99bb834c6fe158d3bc59eb741f8fde9637b77027`
**ZAKRES:** interpretacja pojedynczego syntetycznego skanu, jego pomiarów i ograniczeń. Bez zmian produktu, testów przeglądarkowych ani zmian źródeł.

## Werdykt

Follow-up dostarcza użytecznego dowodu do wybrania następnego, wąskiego kroku diagnostycznego: w fixture z ośmioma wymuszonymi szturmami niemal cały zmierzony czas skanu pochodzi z `executeSilentSiegeStorm`. Uzasadnia to profilowanie kosztu wewnątrz tej ścieżki i jej skutków ubocznych. Nie uzasadnia jeszcze optymalizacji produktu ani twierdzenia, że ta gałąź wyjaśnia określoną część naturalnego zacięcia t39→40.

Wynik jest spójny arytmetycznie: 16 666,3 ms z 16 670,3 ms przypada na osiem szturmów; walidacja, wykrywanie i decyzje łącznie to około 1,7 ms. Zero wywołań `startMapSiege` oznacza, że ten fixture nie mierzył kosztu rozpoczynania oblężeń.

## Readback i granice dowodu

- Scenariusz używa seeded mapy 137 miast / 180 ulepszeń, lecz następnie jawnie ustawia osiem miast gracza jako cele i po cztery syntetyczne jednostki atakujące przy każdym. Wykonuje jeden skan bez EOT. To kontrolowane obciążenie, a nie naturalna symulacja AI.
- Wszystkie osiem przejęć miało callback `applyCityCaptureToMap.onOwnerChanged`; w chwili callbacku relacja była `wojna`, a `peaceLocked=false`. To wspiera wyłącznie stwierdzenie, że te syntetyczne przejęcia przeszły przy aktywnej wojnie i bez blokady pokoju. Nie rozstrzyga legalności wcześniejszej zmiany właściciela w t3→4 ani zachowania przy pokoju.
- Instrumentacja należy do `gra/tools/perf-large-empire-stress-live-test.cjs` i transformu Vite. Udostępnia testowy hook wywołania, dodaje liczniki czasu oraz callback snapshots; nie wprowadza zmian w kodzie produktu. Transform tworzy instrumentowaną kopię ciała `scanAutoSiegesAfterAiTurn`, więc wynik dotyczy tej kopii podczas testu. Przed użyciem wniosku do zmian wydajności warto porównać kopię z aktualną implementacją źródłową i nie traktować samego pomiaru jako dowodu braku wpływu instrumentacji.
- Operator nie zachował surowego JSON-u bezpośredniego przebiegu w katalogu evidence; raport zawiera wartości i hash artefaktu, a test usuwa tymczasowy build po wykonaniu. Dlatego ten niezależny readback ocenia zapisane liczby i kod harnessu, nie odtwarza pomiaru z niezależnego surowego logu.
- Osiem syntetycznych przejęć może ujawnić kosztowną ścieżkę, ale nie określa naturalnej liczby assault/capture w turn 39→40 ani ich udziału w historycznych 30,734 ms. Pierwszy naturalny replay nie ukończył nawet EOT 1→2, więc to ogniwo nadal nie ma potwierdzenia.

## Rekomendowany następny krok

Wykonać jeden mały profil rozbijający czas `executeSilentSiegeStorm` na główne operacje (rozstrzygnięcie bitwy, capture, synchronizację renderera/fog/HUD i aktualizacje stanu). Zachować stałą semantykę i liczbę szturmów; przed zmianą produktu potwierdzić, że profilowany harness wywołuje równoważny kod źródłowy. Potem można zaproponować konkretną, ograniczoną optymalizację wraz z testem równoważności capture, relacji i stanu jednostek. W osobnym, późniejszym przebiegu trzeba wrócić do naturalnej reprodukcji t39→40, by ocenić wpływ na pierwotny problem.

**Decyzja:** przyjąć diagnozę jako podstawę ukierunkowanego profilowania, nie jako zamknięcie błędu wydajności ani problemu legalności przejęć. Nie rekomenduję jeszcze zmiany produktu, integracji, deployu ani pushu na podstawie tego wyniku.
