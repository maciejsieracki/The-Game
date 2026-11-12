# R-WEB-UI-CITY-EMPTY-QUEUE-WORK-TO-POOL-HINT-Q1 (domain GAME/UI, Sonnet)
GOAL: w panelu miasta, gdy kolejka produkcji jest pusta, a miasto przekazuje całą Pracę do puli imperium (wyjątek silnika pracaImperialPoolGain, decyzja właściciela ABC „Zostaw zasadę + podpowiedź w UI"), pokazać czytelny komunikat: „Kolejka pusta — Praca idzie do puli imperium". Zasada silnika BEZ ZMIAN.
KRYTERIA: (1) komunikat widoczny tylko gdy kolejka pusta i Praca faktycznie trafia do puli; znika po dodaniu pozycji; (2) test Chromium na realnym panelu miasta + mutacja czerwieni; (3) tsc + 5 bramek referencyjnych; (4) zakaz zmian silnika/produkcji.
ALLOWLISTA: gra/src/ui/cityPanel.ts (+ formatPl/pomocnicze), nowy test w gra/tools, raport w runs/<ID>/.
Tło: skarga właściciela „100% pracy na budynki, a praca się zbierała" — źródło to zamierzony wyjątek; brakuje wyjaśnienia w UI.
