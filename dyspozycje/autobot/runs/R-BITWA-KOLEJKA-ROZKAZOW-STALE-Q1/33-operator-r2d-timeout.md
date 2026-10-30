# Operator R2-D — jawny timeout następnego planowania

**Wynik: WSTRZYMANY, test E2E niepełny. Nie jest to PASS i nie dowodzi awarii samej kolejki.**

Przed uruchomieniem testu `node --check`, `npm --prefix gra run typecheck` i `git diff --check`
przeszły. Vite zbudował 917 modułów (bundle 70,029,425 B; SHA-256
`2164c747231241b2c148940fa1c6b602a77006c984b3f12f45330b6f42ecac0e`). Run
`390215-qnhgun` uruchomił rzeczywiste Chromium i bitwę mieszaną 28v28. Bramka ręcznej
bitwy bez wodza przeszła. Tempo ustawiono przez produkcyjny handler klawisza `V`, bez
bezpośredniej zmiany stanu: odczytane kolejno `speedMul = 2, 4, 8, 16`.

Pierwszy rzeczywisty cykl 28 jednostek zakończył się PASS w 31.6 s: `round=1`,
`turnIdx=28`, kolejka `0`, `live=28`, `acted=28`; ruch wykonało 8 oddziałów
(`atk20`–`atk27`).

Drugi etap oczekiwał maksymalnie 240 s na stan planowania `roundNo >= 2 &&
_battleAwaitingOrders && !finished`. Oczekiwanie rozpoczęło się o 00:28:42.179 UTC
i zakończyło timeoutem o 00:32:50.615 UTC. Końcowy dump strony: bitwa nierozstrzygnięta,
`round=3`, `turnIdx=23`, `awaitingOrders=false`, `finished=false`, kolejka pusta;
`atk0`–`atk21` oznaczone jako wykonane, `atk22`–`atk27` oraz obrońcy jeszcze
nieoznaczeni. Żywych atakujących: 28, wykonane: 22. Nie pojawiły się wyjątki JS ani
błędy konsoli. Test nie doszedł do drugiego pointer-rozkazu ani do osobnego testu
martwego ID w produkcyjnym `_activateNext`.

Dowody: `evidence/operator-r2d-execution-trace.json`,
`evidence/operator-r2d-timeout.json` i `evidence/operator-r2d-timeout.png`.
Ślad pokazuje, że żądany stan planowania nie został przechwycony w limicie; nie
pozwala rozstrzygnąć, czy faza była pominięta/przejściowa, czy symulacja utkwiła w
trzeciej rundzie. Nie zgaduję przyczyny. Proces przeglądarki i testu zakończył się;
nie ma aktywnego retry.

**Ocena:** uwagi Evaluatora pozostają otwarte, brak podstaw do zaliczenia i komitu.
Następny krok wymaga poprawienia/obserwowalności przejścia do drugiej fazy planowania
(np. trace zmian `round/turnIdx/awaitingOrders` wewnątrz wait), następnie pojedynczy
ograniczony run. Nie należy uruchamiać kolejnych długich prób bez tego rozpoznania.
