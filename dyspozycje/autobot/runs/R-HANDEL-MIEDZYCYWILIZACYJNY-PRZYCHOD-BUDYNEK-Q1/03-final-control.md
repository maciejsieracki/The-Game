# 03-final-control — R-HANDEL-MIEDZYCYWILIZACYJNY-PRZYCHOD-BUDYNEK-Q1

STATUS: PASS-WITH-NOTES
ZAKRES: final control / recon mechaniki, bez implementacji
IZOLACJA: `Civ-clean-main-2026-08-20` (HEAD `47cdca15`, branch `work/clean-main-2026-08-20`)

## Werdykt

Mechanika istnieje i jest wystarczająco określona. Osobny implementation topic nie jest potrzebny dla zakresu tego reconu. Nie wykonano zmian kodu, integracji, commitu, deployu ani pushu.

## Potwierdzenia

- **Przychód/formuła:** składnik dystansowy trasy wynosi `floor(max(1, 8 - 0,4 × dystans))` Pieniądza/turę. Parametry są w `gra/data/econ-params.json:713-730`, a funkcja w `gra/src/game/trade-routes.ts:751-780`. Aktywna trasa kredytuje pełną kwotę obu miastom (`trade-routes.ts:808-840`). Niezależnie istnieje +5% Handlu za aktywne połączenie miasta (`trade-routes.ts:845-848`), bez podwójnego wliczania do składnika dystansowego.

- **Moment naliczenia:** w realnym ticku końca tury najpierw liczony jest Wealth i `pieniadzPoWealth`, a dochód trasy jest pobierany osobno i dodawany po mnożniku Wealth (`gra/src/game/turn-economy.ts:2636-2644`). Finalnie oba składniki trafiają do `pieniadz` i bilansu właściciela (`turn-economy.ts:2768-2775`). Dochód dystansowy nie jest mnożony przez Wealth.

- **Handel lądowy:** medium `lad` korzysta z połączenia po przechodnich heksach lądowych; budynkiem handlowym/bramką slotu jest `Targowisko`. Budynek ma technologię `Wymiana` (`gra/data/buildings.json:255-301`), a limit tras miasta jest liczony z `Targowisko/Port/Port wielki` (`gra/src/game/trade-routes.ts:451-476`).

- **Handel morski:** medium `morze` wymaga Portu w obu miastach oraz wodnej ścieżki `Morze/Wybrzeże` (`trade-routes.ts:128-157`, `281-284`). `Port handlowy` wymaga wybrzeża morskiego lub rzeki i technologii `Żegluga` (`gra/data/buildings.json:305-341`); `Port wielki` jest upgradem, wymaga tego samego dostępu i technologii `Inżynieria` (`buildings.json:345-382`).

- **Umowa i pokój:** trasa gracz↔obca powstaje wyłącznie przy pokoju, aktywnej `Umowie Handlowej`, geometrycznym połączeniu i wolnym slocie po obu stronach (`gra/src/game/trade-routes.ts:611-744`). Wojna usuwa/blokuje trasę; sam pokój nie wystarcza.

- **Parity:** gracz↔AI używa tej samej formuły i oba miasta otrzymują przychód. Implementacja obecnie ogranicza tworzenie aktywnych tras do `ownerId === 0` ↔ `ownerId !== 0`; AI↔AI nie tworzy tras (`trade-routes.ts:615-623`, `668-670`). To jest znana granica zakresu, nie luka do naprawy w tym temacie.

- **Save/load:** `tradeRoutes` jest opcjonalnym polem save, a brak pola w starym zapisie normalizuje się do pustej listy (`gra/src/game/save.ts:352-357`, `503-508`). Load odtwarza listę i przelicza zależne agregaty/granty (`gra/src/main.ts:31197-31201`, `31282-31284`).

## Dowód / testy

Istnieją przeznaczone testy `trade-routes-test.cjs`, `trade-routes-income-test.cjs` i `building-tech-gate-test.cjs`. Nie uruchamiano ich w tym final control, ponieważ wcześniejszy operator odnotował `EPERM` przy tworzeniu plików tymczasowych w `gra/tools`; nie zmieniano środowiska ani kodu, aby to obejść.

## Notes — obce zmiany

Worktree zawiera liczne zmiany i nowe artefakty niezwiązane z tym final control (m.in. `.claude`, `.cursor`, `CLAUDE.md`, `docs`, `gra/src/*`, narzędzia testowe oraz inne runy autobota). Traktuję je wyłącznie jako obce zmiany/note; nie były modyfikowane, integrowane ani oceniane jako część tego reconu.

W runie nie ma pliku `02-evaluator.md`; dostępne wejścia to `00-dispatch.md` i `01-operator.md`. Brak `02` został odnotowany, a werdykt opiera się na tych plikach oraz odczycie wskazanych źródeł.

DEPLOY/PUSH: NIE WYKONANO
COMMIT: NIE WYKONANO
