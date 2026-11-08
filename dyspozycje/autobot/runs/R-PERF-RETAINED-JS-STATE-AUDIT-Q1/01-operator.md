# R-PERF-RETAINED-JS-STATE-AUDIT-Q1 — Operator, runda 1/5

STATUS: OPERATOR_COMPLETE / READ_ONLY
BAZA: `a1d8621290d107adc3ece82978d64aa6b7c4c0dc`
ZMIANY W ŹRÓDŁACH: brak

## Wynik

Potwierdzono structural retention w `cityCaptureEventDetails`: wpis ma ID z numerem tury, więc ponowne odbicie miasta tworzy nowy klucz; `recordCityCaptureEvent` zapisuje pełny raport w mapie (main.ts:9190–9232), a dopiero potem dopisuje kartę do `warEventLog` i obcina widoczny log do 8 (9254). Eviction logu nie usuwa wpisu mapy. Mapa rośnie z liczbą przejęć miast dotyczących gracza przez całe życie sesji. Wpis usuwa jedynie dismiss konkretnej karty (23237–23268) lub reset/new game (9474–9478, 39391–39395). Save/load tego dziennika nie odtwarza; reset load/new game czyści go. Rozmiar pojedynczy zależy od liczby wierszy raportu. To dowiedziony błąd ograniczania retencji, ale brak pomiaru bytes i brak dowodu, że wyjaśnia wzrost do 2 GB.

`civElimEventDetails` (9136–9154) ma ten sam brak eviction przy ucięciu `warEventLog` do 8; mapa jest ograniczona regułami eliminacji cywilizacji i dlatego zwykle skończona względem rosteru, nie liczby tur. Dismiss czyści wpis (23256), reset również (9477/39394).

Drugim kandydatem jest `wiarygodnoscZdarzeniaByOwner`: `appendWiarygodnoscEvent` dopisuje immutable rekord bez limitu (10315–10326; helper w `game/diplomacy-credibility.ts:158+`). 10% trwały ślad jest semantycznie zachowywany, a rejestr trafia do save meta (32189) i jest odtwarzany przy load (41381–41385); eliminuje się go przy usunięciu ownera (30586). Koszt pamięci jest O(liczby zdarzeń dyplomatycznych), a obliczanie wiarygodności iteruje całą historię (`getWiarygodnosc`, 10334–10348). Może narastać w długiej rozgrywce, ale spodziewanej liczby rekordów i udziału w heap/RSS nie zmierzono.

## Kolekcje z istniejącymi granicami

- `warEventLog`: cap 8 przy writerach; osobne czyszczenie na reset. Sam log nie rośnie bez limitu.
- `diplomacyFactorLog`: limit 40 rekordów na parę (`game/diplomacy-factors.ts:37–54`), czyszczenie ownera/eliminacji i reset.
- `wiarygodnoscStrumienByOwner`: wpisy aktywnych zobowiązań owner/partner/typ; wygasłe strumienie są usuwane w update.
- `borderMarchEventTargets`, `tradeRouteEventPlayerCityIds`: czyszczone na granicy każdej tury (main.ts:33005–33006).
- logi village/trade/ration/border, dismiss IDs: czyszczone na EOT; deferred hints opróżniane po materializacji do logu (32996–33008, 37948–37954).
- Wiele map renderer/cache jest indeksowanych przez miasta, jednostki, heksy albo ownerów. To wzrost wraz z rozmiarem świata, a nie automatycznie wyciek per tura; test musi kontrolować liczność tych encji.

`__turnSlowdownTestDebug.collections()` ujawnia m.in. `cityCaptureEventDetails`, `civElimEventDetails`, `warEventLog`, `wiarygodnoscZdarzeniaByOwner` i liczbę miast/jednostek (26100–26236), więc daje gotowe liczniki do eksperymentu. W tym audycie nie uruchomiono testu przeglądarkowego ani GC/RSS. Nie potwierdzono narastającego listenera/timera. Nie ma podstaw do przypisania zgłoszonych ~2 GB którejkolwiek z powyższych struktur.

## Celowany eksperyment

Na identycznym seedzie i stabilnych liczbach miast/jednostek zebrać po T1/T50/T100: heap po wymuszonym GC, RSS procesu, `collections()` oraz sumy długości tablic w mapie wiarygodności. Osobny scenariusz wykonać z co najmniej 12 przejęciami/odbiciami miast gracza bez dismiss: przed korektą oczekiwane `cityCaptureEventDetails > 8` przy `warEventLog <= 8`; po korekcie mapa powinna pozostawać w zgodzie z retencją widocznych kart. Powtórzyć z dismiss i z kontrolą bez capture. Raportować różnicę względem baseline, nie traktować korelacji jako dowodu na 2 GB.
