# R-WEB-LIVE-VERIFY-ARMY-RETREAT-LIMIT-CAMPAIGN-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES (pomiar częściowy: poziom bitwy zmierzony w Chromium; pomiar w kampanii NIE ZMIERZONO)
DOMAIN: GAME (tylko pomiar; bez zmian w `gra/src`, `gra/data`)
TEMAT: R-WEB-LIVE-VERIFY-ARMY-RETREAT-LIMIT-CAMPAIGN-Q1
GOAL: w żywej grze zmierzyć odwroty armii po przegranej bitwie (per tura gracza i AI), unicestwienie czwartym odwrotem, reset licznika w następnej turze, brak wyjątków strony.
BAZA: `origin/main` = `ef6e8ea1ee7c3d1019a537546153f53af9f4b115` (ROBOCZA 8e83eab3, FALA 767)

## ZMIERZONO

1. Istniejący test Chromium `gra/tools/battle-retreat-limit-browser-test.cjs` (prawdziwa bitwa 3D w trybie Skip + prawdziwy `applyPostBattleMap`), uruchomiony w kopii `gra/` poza repo (`$SCRATCH/gra-copy`, `npm ci` tylko w kopii): **BROWSER PASS**, 3 przypadki (retreat=0, 2, 3), 0 błędów strony.
2. Nowe narzędzie pomiarowe `gra/tools/battle-retreat-limit-measure.cjs` (allowlista): 3 ziarna (`?seed=1,2,3`) × licznik odwrotów 0/2/3 = 9 przebiegów. Surowe wyniki poniżej (liczby z wyjścia narzędzia, `SUMMARY runs=9 pageErrors=0 timedOut=0`).

| seed | retreatN (przed bitwą) | zwycięzca | loserDead | loserRetreatDistances | defAnnihilated | atkAnnihilated | defBudgetExhausted | atkBudgetExhausted |
|---|---|---|---|---|---|---|---|---|
| 1 | 0 | obrońca | 28 | [] | nie | nie | nie | nie |
| 1 | 2 | obrońca | 28 | [] | nie | nie | nie | nie |
| 1 | 3 | obrońca | 28 | [] | nie | **tak** | tak | tak |
| 2 | 0 | obrońca | 28 | [] | nie | nie | nie | nie |
| 2 | 2 | obrońca | 28 | [] | nie | nie | nie | nie |
| 2 | 3 | obrońca | 28 | [] | nie | **tak** | tak | tak |
| 3 | 0 | atakujący | 28 | [] | nie | nie | nie | nie |
| 3 | 2 | atakujący | 28 | [] | nie | nie | nie | nie |
| 3 | 3 | atakujący | 28 | [] | **tak** | nie | tak | tak |

Wnioski z tabeli (tylko to, co widać w liczbach):
- Licznik 3 wyczerpuje budżet obu stron; przegrany z wyczerpanym limitem ginie w całości (`*Annihilated = true`, 0 przegranych na mapie). Licznik 0 i 2 nie kończy się unicestwieniem przez limit (budżet nie wyczerpany). Zgodne z regułą FALI 732.
- Wszystkie 9 przebiegów: `timedOut = false`, `pageErrors = 0`.

## NIE ZMIERZONO (z powodem)

- **Pomiar w kampanii (tura gracza i tura AI, reset licznika w następnej turze)**: NIE ZMIERZONO. Powód: nie istnieje hak `civTest`, który w żywej turze wymusza kolejne przegrane bitwy tej samej armii i pozwala policzyć odwroty per tura; istniejące narzędzia `*retreat*`/`*battle-*live*` działają na poziomie sceny bitwy (`battle-retreat-limit-browser-entry`), a pełnego driva kampanii (`ai-army-live-measure.cjs`) nie rozszerzałem o bitwy — to wymagałoby nowego haka, czyli osobnego tematu.
- **Odwrót przeżywających przegranych (2 heksy, `loserRetreatDistances`)**: NIE ZMIERZONO. We wszystkich 9 przebiegach `loserRetreatDistances = []` i `loserDead = 28`, `loserOnMap = 0`: w tym harnessie przegrany ginie w bitwie, zanim dojdzie do odwrotu, więc ścieżka odwrotu o 2 heksy nie jest wykonywana. Oznacza to, że licznik 0 i 2 nie demonstruje „odwrotu dozwolonego”, tylko brak unicestwienia przez limit; test nie rozróżnia przypadku „odwrót wykonany” od „przegrany zginął w bitwie”.
- **Odwrót obrońcy przed bitwą (przycisk „Wycofaj”), komunikat na ekranie, zrzuty**: NIE ZMIERZONO (poza zakresem tego harnessu; test je wyłącza).

## ZMIANY-COMMIT

- `gra/tools/battle-retreat-limit-measure.cjs` (nowy, allowlista `gra/tools/*retreat*measure*.cjs`; tylko pomiar, `node --check` OK)
- `dyspozycje/autobot/runs/R-WEB-LIVE-VERIFY-ARMY-RETREAT-LIMIT-CAMPAIGN-Q1/10-operator-claude.md` (ten raport)
- Brak zmian w `gra/src`, `gra/data`, `WERSJE.md`, manifeście, `gra-robocza/`, `rust-port/`. `npm run build/dev` nie uruchamiano w repo. `git diff --check`: czysto.

## TESTY

- `node tools/battle-retreat-limit-browser-test.cjs` (w kopii poza repo): `BROWSER PASS`, exit 0; przypadki retreat=0/2/3 zgodne z oczekiwaniem.
- `node tools/battle-retreat-limit-measure.cjs --seeds 1,2,3 --retreats 0,2,3` (w kopii poza repo): `SUMMARY runs=9 pageErrors=0 timedOut=0`.
- `node --check gra/tools/battle-retreat-limit-measure.cjs`: OK.
- tsc: nie dotyczy (dodany plik jest `.cjs`, nie TypeScript).

## BLOKADY

- Pomiar kampanii wymaga haka civTest wymuszającego serię przegranych bitew w jednej turze (osobny temat, Sonnet/Haiku po decyzji orkiestratora).

## RUNDY

1/5. Ostatni werdykt: brak (runda pierwsza). Decyzja wymagana: nie, chyba że orkiestrator chce pomiaru kampanii — wtedy nowy temat z hakiem.

## NASTĘPNY KROK

Evaluator: sprawdzić allowlistę i wyniki tabeli. Orkiestrator: zdecydować, czy otworzyć temat na hak kampanii (serie przegranych bitew w jednej turze + liczenie odwrotów per tura gracza/AI + reset w EOT) albo zamknąć pomiar jako częściowy.

## UWAGI-DLA-ORKIESTRATORA

- Dispatch wskazywał `origin/main` jako źródło pliku dispatch; plik istnieje tylko w gałęzi `claude/sprawdzenie-funkcjonalnosci-ek4ra0` (odczytany stamtąd, jak wskazuje DODATEK). Nie wpływa na wynik.
- `loserRetreatDistances` zawsze puste w harnessie bitwy (patrz NIE ZMIERZONO). Warto wiedzieć przy ocenie testu `battle-retreat-limit-browser-test.cjs`: jego przypadki 0/2 nie pokrywają odwrotu, tylko brak unicestwienia.
- Kopia robocza `gra/` z `node_modules` znajduje się poza repo (katalog scratchpad sesji); do usunięcia po zamknięciu tematu.

DEPLOY/PUSH: NIE WYKONANO
