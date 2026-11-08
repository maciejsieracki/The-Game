# Dispatch uzupełniający — tartak, las i relief wzgórza

TEMAT: `R-ULEPSZENIA-OBOZ-LOWIECKI-LAS-ZNIKA-I-TEREN-Q1` (powiązany z `R-ULEPSZENIA-TARTAK-LAS-ZALEZNOSC-Q1`)
RUNDA: 2/5 (zamknięcie wizualnego kryterium tartaku)
DATA: 2026-10-29
DOMAIN: GAME
GOAL: Po zbudowaniu tartaku na leśnym wzgórzu widoczny pozostaje las i relief wzgórza, a model tartaku jest prawidłowo osadzony; po świadomym wyrębie lasu tartak znika zgodnie z późniejszą regułą zależności lasu.

## Wyzwalacz

Właściciel ponowił prośbę, by dokończyć temat tartaku na wzgórzu i lasu. Historia ujawnia osobne zachowania: render ma zachować las i relief pod tartakiem, natomiast późniejszy wyrąb ma usuwać ulepszenie zależne od lasu. Należy zweryfikować oba stany, nie mieszać ich.

## Kryteria końca

1. Żywy Chromium tworzy lub ładuje deterministyczny heks `Wzgorza` z `nakladka=Las`, buduje tartak i zapisuje screenshot przed/po oraz odczyt danych.
2. Po budowie `hex.nakladka` nadal jest `Las`, kępa drzew jest widoczna, geometria reliefu wzgórza pozostaje, a model tartaku jest osadzony na tej wysokości.
3. Kontrola negatywna: analogiczny heks płaski nie dostaje sztucznego reliefu; kopalnie/kamieniołomy zachowują wcześniejsze działanie.
4. Po osobnej akcji wyrębu tartak znika wraz z lasem, zgodnie z aktualnym kontraktem `FOREST_DEPENDENT_IMPROVEMENT_KEYS`; nie jest to ten sam scenariusz co wizualne ukrywanie lasu pod stojącym tartakiem.
5. Testy renderu, mapy, referencyjne bramki i pełny typecheck przechodzą. Jeśli aktualny kod już spełnia zachowanie, nie zmieniać produktu; dodać brakujący test żywego renderu.

## Allowlista

`gra/src/main.ts` tylko ścieżka synchronizacji dekoracji/modelu ulepszenia, `gra/src/render/improvements.ts` tylko pozycjonowanie tartaku jeśli reproduktor potwierdzi błąd, `gra/tools/` test renderu, raporty i rejestr. Nie zmieniać reguł kosztów, kwalifikacji ani wyrębu, chyba że test wykaże sprzeczność z już zatwierdzonym kontraktem.

## Izolacja i testy

Worktree `/tmp/autobot-sawmill-closeout`, branch `autobot/R-ULEPSZENIA-TARTAK-WZGÓRZE-LAS-Q1-r1`, baza `origin/main` `cc2c6a50`. Operator ma sprawdzić aktualne `preservesHillRelief`, pozycjonowanie w `render/improvements.ts`, `FOREST_DEPENDENT_IMPROVEMENT_KEYS` i wcześniejsze Final Control przed zmianami.

Walidacja minimalna: screenshot żywego renderu, asercje danych i wysokości modelu, test po wyrębie, testy improvement/relief, `npm run typecheck -- --pretty false`. Bez integracji, deployu i pushu w roli Operatora.

Narzędzie natywnego Kanbana nie jest dostępne w tej sesji; nie twórz fikcyjnej karty ani receipt. Kontynuacja wynika z jawnej dyspozycji właściciela w czacie; ograniczenie procesu trzeba odnotować przy końcowej kontroli.
