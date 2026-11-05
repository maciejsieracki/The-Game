STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-SIEGE-SORTIE-ANY-TURN-Q1
GOAL: oblegana armia AI/barbarzyńców z siłą >= 80% oblegających (10:8) wychodzi i atakuje w KAŻDEJ turze oblężenia, nie tylko w ostatniej.

## Diagnoza (potwierdzona w kodzie, baza origin/main 80919e2ae)

Dlaczego nie działało:
1. `planLastStandSortie` (`gra/src/game/siege-last-stand.ts`) zwracał `none('nie ostatnia tura...')`, gdy nie `isLastTurnBeforeCapitulation` (`oblegane && siegeCapitulationPending`), a `shouldLastStandSortie` miał twardą bramkę `if (!isLastTurn) return false`. Flaga `siegeCapitulationPending` jest ustawiana dopiero gdy magazyn żywności <= 0 (`handleSiegeCapitulationPhase`), więc w turach 1..N-1 wypad był niemożliwy niezależnie od przewagi sił (potwierdza zrzut Harappy "poddanie za 2 tury").
2. `canUnitSortie` odrzucał kotwicę, gdy `sentry` lub `ufortyfikowanyWPolu` (`inGarnizon` nie był blokadą, ale nikt nie budził garnizonu). Kotwica = pierwsza ruchoma po id, nie najsilniejsza.
3. `lastStandSortieCmdsForOwner` pomija `isHuman(ownerId)` (zgodnie z założeniem) i loguje tylko w ostatniej turze.
Pozostałe hipotezy z dispatchu: `ruchLeft` jest resetowany do `ruch` na starcie tury dla wszystkich (main.ts ~35542), więc nie blokuje; egzekucja `attack` AI nie sprawdza oblężenia (test D8); `besiegerOwnerForCity` zwraca właściciela przez `oblegajacyOwnerId`/mapę/sąsiada - bez zmian.

## Zmiany
- `gra/src/game/siege-last-stand.ts`: usunięta bramka ostatniej tury (`shouldLastStandSortie(bd, br)` - tylko próg 10:8, EPS zachowany); `isLastTurn` zostaje w planie wyłącznie do logu (ostatnia tura = szczególny przypadek tej samej reguły); `canUnitSortie` nie blokuje sentry/fortyfikacji; kotwica = najsilniejsza ruchoma jednostka (remis -> najniższe id, deterministycznie).
- `gra/src/main.ts` (tylko `lastStandSortieCmdsForOwner`): log "Wypad obleganej armii"/"Atak ostatniej woli" w każdej turze; przy `plan.sortie` budzi obrońców na heksie miasta (`exitGarnizon`, `exitFieldFortify`, `sentry=false`, ruch zachowany jako max przed/po), `syncCityGarnizon`. Wywołania (AI ~39319, barbarzyńcy ~40408) bez zmian.
- `gra/tools/siege-last-stand-sortie-test.cjs`: zaktualizowany (B3/B7/B8/A2 odwrócone z uzasadnieniem: reguła ANY-TURN), nowe B8b (garnizon), B11 (kotwica najsilniejsza), D10/D11, mutacje m3 (przywrócenie bramki), m3b/m3c/m7 (blokady), m3d (kotwica), m5.
Balans walki, determinizm AI i koszt decyzji bez zmian (ta sama pętla po miastach, jedno `planLastStandSortie` na oblężone miasto).

## Testy
- GREEN `gate-green.txt`: 70 OK, 0 FAIL (EXIT=0). RED `gate-red.txt`: nowy test vs stary moduł 55 OK / 15 FAIL (EXIT=1). Mutacje A..: wszystkie wywracają testy (w sekcji C).
- Tabela PRZED/PO (stosunek oblegający:oblężeni): 10:5 zostaje; 10:8, 10:9, 10:12 - PRZED wypad tylko w ostatniej turze, PO w każdej; 79% zostaje.
- `gate-tsc.txt`: `tsc --noEmit` EXIT=0.
- Regresje `gate-regresje.txt`: oblezenie-* , siege-ai/badge-zorder/defenders/manual-battle/surrender-*/last-stand, war-allin-keep/general-path, army-concentration/leadership/stack-ruch: PASS. `ai-test` 274/20 (baza). `war-allin-capital-test` 96/2 (hash 6b flagi OFF; ai.ts nietknięty; baza z gate NO-MARCH już EXIT=1 - nie z tej zmiany).
- NIE_ZMIERZONO: pomiar w realnym Chromium (przed/po) - repo nie ma hooka inscenizującego fazę AI obleganego miasta AI z zadanymi siłami (istniejące hooki dotyczą oblężenia gracza); budowa bundla wymaga vite poza repo. `siege-blockade-no-recruit-reinforce-test` i `siege-tower-breach-everywhere-test`: TIMEOUT 250 s (budują vite w repo - zakazane `npm run build`), NIE_ZMIERZONO. Stan fortyfikacji/snu garnizonu AI zmierzony tylko strukturalnie (AI w ai.ts pomija `inGarnizon`; `wakeSentryUnitsOnEnemyContact` budzi sentry przy wrogu w zasięgu wzroku).

## BLOKADY
- Gracz (ręczne dowodzenie): brak automatycznego wypadu, gracz NIE dostaje podpowiedzi ani przycisku "Wypad" - to decyzja produktowa, domyślnie nic nie zmieniono; do rozstrzygnięcia przez orkiestratora (opcja: przycisk "Wypad" w panelu obleganego miasta).
- Brak pomiaru na żywo (patrz NIE_ZMIERZONO). Po przegranym wypadzie obrońcy nie wracają do `inGarnizon` automatycznie (zostają jednostkami w mieście; istniejące zasady AI/garnizonu).

## RUNDY: 1/5
## NASTĘPNY KROK: Evaluator (zwłaszcza: pomiar live lub akceptacja NIE_ZMIERZONO; decyzja o przycisku "Wypad" dla gracza).
## DEPLOY/PUSH: NIE WYKONANO
## ZMIANY/COMMIT: ff94a0db3 (kod, test, bramki, raport; raport dopisany w kolejnym commicie z SHA)
