STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-HANDEL-SZLAKI-PRZEBUDOWA-Q1-T4
GOAL: Zastąpić stary globalny mnożnik +5% Handlu (`handelBrutto *= (1+0.05*liczbaTrasHandlowych)`, `economy.ts:954-957`) sumą per-trasowych bonusów `0.05 × własny dochód dystansowy trasy`, naliczaną wyłącznie dla tras z `budynekOdblokowany===true`.

PRZYCZYNA/PROJEKT (rozstrzygnięcia z reconu, zapisane w `decision-abc.md`):
- Recon: `ctx.liczbaAktywnychTrasHandlowych` (economy.ts:653/954-957) pochodzi z `computeTradeRouteCountByCity()` (trade-routes.ts:963), budowanej i wpinanej w `turn-economy.ts` (parametry `advanceCityEconomy`-podobnych funkcji, linie ~1852/2270 → ctx linie ~2000-2036/2562-2598) oraz w `main.ts` (8 miejsc: budowa/`.clear()`/przekazanie, m.in. linia 13051, 25615) i osobno w `cityPanel.ts` (linie 10364-10521, ZDUPLIKOWANA kopia starej formuły do wyświetlenia „premia za trasy handlowe: +X%").
- Agregacja (rozstrzygnięta, NIE zgadywana): "własny dochód dystansowy trasy" = `tradeRouteTotalDistanceIncome(dystans, medium)` (T1+T2, symetryczna dla obu stron trasy) — CELOWO bez mnożnika bonusu cudów (osobny, niepowiązany mechanizm CUDA-HANDEL-01). Nowy addend ma wejść do `handelBrutto` w TYM SAMYM miejscu co stary mnożnik (po Targowisku i civHandelMult, przed Step 5 korupcją) — zgodnie z precedensem D5 ("realny transfer budżetu" przechodzi przez korupcję/Walutę+Mennicę jak reszta Handlu).
- BLOKADA: nowy mechanizm wymaga danych NA POZIOMIE TRASY (nie samej liczby), więc `economy.ts`/`trade-routes.ts` same w sobie nie wystarczą — wymagane jest też podłączenie w `turn-economy.ts` i `main.ts` (mechaniczna podmiana kształtu mapy w istniejących punktach wpięcia) oraz poprawka jednej linii tekstu w `cityPanel.ts` (dziś liczy stary wzór niezależnie od silnika — inaczej gracz zobaczy błędny napis). Żaden z tych trzech plików nie jest w allowliście T4. Bez nich: albo nowy mechanizm jest martwy w rozgrywce (kryterium 1 niespełnione poza testami jednostkowymi), albo usunięcie starego mnożnika zostawia miasta bez JAKIEGOKOLWIEK bonusu za trasy do kolejnej rundy.

ZMIANY/COMMIT: branch `autobot/HANDEL-T4-Q1` (odgałęziony od `origin/main`, zawiera T3), commit `127143bb`, wypchnięty do `origin/autobot/HANDEL-T4-Q1`. Jedyny plik: `dyspozycje/autobot/runs/R-HANDEL-SZLAKI-PRZEBUDOWA-Q1-T4/decision-abc.md` (opis konfliktu + propozycja lekkiej ścieżki: rozszerzyć allowlistę o `turn-economy.ts`, 8 istniejących punktów wpięcia w `main.ts` — bez `buildEmpireTradeSnap()`, T6 — i jedną linię `cityPanel.ts`). Zero zmian w `trade-routes.ts`/`economy.ts` — kod produkcyjny celowo NIE tknięty (STOP zgodnie z zasadą konfliktu kontraktu, żeby nie zostawić martwego/regresywnego stanu).

TESTY: nie uruchamiane — brak zmian kodu produkcyjnego do zweryfikowania. Kryteria sukcesu 1-7 dispatchu pozostają otwarte do następnej rundy.

BLOKADY: konflikt allowlisty (opisany wyżej, pełny zapis w `decision-abc.md`) — czysto inżynierski, bez wpływu na gameplay/balans (sama formuła i liczby nie są przedmiotem sporu, tylko lista plików potrzebnych do jej realnego podłączenia). Kwalifikuje się do lekkiej ścieżki (jedna propozycja, nie turniej C-018).

RUNDY: 0/5 (STOP przy konflikcie kontraktu nie zużywa rundy, zgodnie z `R-PROC-AUTOBOT.md` §3a/C-054).

NASTĘPNY KROK: decyzja orkiestratora/właściciela — zatwierdzenie rozszerzenia allowlisty T4 o `gra/src/game/turn-economy.ts`, wskazane 8 punktów wpięcia w `gra/src/main.ts` i jedną linię `gra/src/ui/cityPanel.ts` (propozycja w `decision-abc.md`), po czym wznowienie Operatora na tym samym ID/branchu.

DEPLOY/PUSH: NIE WYKONANO (branch roboczy `autobot/HANDEL-T4-Q1` wypchnięty do origin, poza tym brak integracji/deployu — poza zakresem Operatora, i tak wstrzymane do zamknięcia T4).