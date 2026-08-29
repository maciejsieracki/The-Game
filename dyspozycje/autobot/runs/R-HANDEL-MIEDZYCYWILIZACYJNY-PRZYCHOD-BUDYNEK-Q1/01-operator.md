# 01-operator — R-HANDEL-MIEDZYCYWILIZACYJNY-PRZYCHOD-BUDYNEK-Q1

STATUS: PASS-WITH-NOTES
TEMAT: R-HANDEL-MIEDZYCYWILIZACYJNY-PRZYCHOD-BUDYNEK-Q1
GOAL: Ustalić faktyczny przychód handlu między cywilizacjami, moment wejścia mechaniki i wymagany budynek.
ZMIANY/COMMIT: Brak zmian kodu i danych. Recon zapisany w tym raporcie.

## Ustalenia

- Przychód trasy: `floor(max(1, 8 − 0,4 × dystans))` Pieniądza/turę dla obu miast trasy (`gra/src/game/trade-routes.ts:751-842`).
- Przychód trafia bezpośrednio do Skarbca po rozliczeniu Wealth (`gra/src/game/turn-economy.ts:2639-2644`).
- Wymagane: aktywna `UmowaSzlakow`, pokój, połączenie geometryczne i wolny slot handlowy w obu miastach (`gra/src/game/trade-routes.ts:611-744`).
- Handel lądowy wymaga `Targowiska`, odblokowanego technologią `Wymiana` (`gra/data/buildings.json:255-302`).
- Handel morski wymaga `Portu`/`Portu wielkiego` w obu miastach oraz odpowiedniego wybrzeża/rzeki (`gra/src/game/trade-routes.ts:133-157`).
- `Mennica` i `Waluta` zwiększają Handel, ale nie są bramką samej trasy (`gra/src/game/economy.ts:963-972`).
- Gracz↔AI korzysta ze wspólnej formuły i obie strony otrzymują przychód. AI↔AI obecnie nie tworzy aktywnych tras (`gra/src/game/trade-routes.ts:615-670`).
- `tradeRoutes` jest uwzględnione w save/load (`gra/src/game/save.ts:352-357`, `gra/src/main.ts:24434-24440`, `31265-31266`).

## Testy i blokady

TESTY: Istnieją `trade-routes-test.cjs`, `trade-routes-income-test.cjs` i `building-tech-gate-test.cjs`; Operator nie uruchomił ich z powodu EPERM przy tworzeniu plików tymczasowych w `gra/tools`.
BLOKADY: Brak blokady merytorycznej. Rozszerzenie o realne trasy AI↔AI wymaga osobnego ABC; rekomendacja Operatora: pozostawić AI↔AI poza zakresem.
NASTĘPNY KROK: Brak zmiany kodu; ewentualne rozszerzenie AI↔AI dopiero po ABC.
DEPLOY/PUSH: NIE WYKONANO
