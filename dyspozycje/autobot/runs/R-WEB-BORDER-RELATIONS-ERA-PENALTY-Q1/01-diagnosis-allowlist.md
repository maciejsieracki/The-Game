# R-WEB-BORDER-RELATIONS-ERA-PENALTY-Q1 — diagnoza i allowlista przed kodem

## Diagnoza

- Istniejąca kara jest jednym ciągłym czynnikiem Zaufania, sterowanym flagą `karaWspolnaGranica`. `computeTickZaufanieDelta` dodaje do ticka `ekspansjaGranica_zaufanie_perTura`; parametr ma obecnie jedną wartość `-2` (`gra/src/game/diplomacy.ts:144-164,1769-1781`, `gra/data/diplomacy.json:28`). Nie ma tu dotychczasowego skalowania per epoka.
- Warunek aktywacji jest już wspólny dla ticka i rozbicia UI: obie strony mają >2 miasta i `ownersShareLandBorderLive(a,b)` (`gra/src/main.ts:22330-22367,22373-22406`). W helperze UI `buildRelationBreakdown` pokazuje ten sam parametr co tick (`gra/src/game/diplomacy-factors.ts:157-187`).
- Tick pary dla wszystkich kombinacji wywołuje `tickDiplomacy(cur, buildDiplomacyTickCtxForPair(a,b))`; AI↔AI ma osobną ścieżkę używającą tego samego helpera. Główny loop AI↔gracz również tyka relację gracza z kontekstem ręcznie zbudowanym (`gra/src/main.ts:11466-11475,40505-40512`). Preview UI bierze delta z `computeTickZaufanieDelta(buildDiplomacyTickCtxForPair(...))` (`gra/src/main.ts:24817-24819`).
- Globalne `_diplomacyParams()` dostarcza parametry wg trudności, nie właściciela ani epoki (`gra/src/main.ts:10057`). Osobne epoki istnieją per owner: `empireEpochForOwner(ownerId)` zwraca epokę dla ludzkiego fotela albo `ownerEraByOwner` dla AI (`gra/src/main.ts:2382-2385`).
- Relacja i `zaufanie` są przechowywane raz na parę, a jej klucz jest symetryczny. Zlecenie pierwotnie nie definiowało agregacji różnych epok; decyzja właściciela z 2026-11-10 rozstrzyga to na wyższą epokę w parze. Resolver użyje max(epochA, epochB): Stone = -2, Bronze = -3, Iron = -4.

## Minimalna allowlista po decyzji o mieszanych epokach

- `gra/data/diplomacy.json` — zmienić tylko definicję parametru kary na parametryczne wartości Stone/Bronze/Iron.
- `gra/src/game/diplomacy.ts` — typ i resolver wartości dla istniejącego czynnika; przekazać wyliczoną stawkę w `TickCtx`, aby pełny tick i preview używały identycznej wartości.
- `gra/src/main.ts` — tylko resolver epoki z `empireEpochForOwner` dla obu właścicieli oraz przekazanie stawki do wszystkich kontekstów tick/preview/breakdown; zachować obecny warunek granicy i >2 miasta; sprawdzić pętlę pair, AI↔AI, AI↔gracz, player↔AI i save/recalc.
- `gra/src/game/diplomacy-factors.ts` — tylko typ/wyświetlenie liczby już rozstrzygniętej przez główny resolver.
- `gra/tools/*-test.cjs` oraz `dyspozycje/autobot/runs/R-WEB-BORDER-RELATIONS-ERA-PENALTY-Q1/**` — testy rzeczywistej logiki i dowody tego runu.

Nie ma uzasadnionej potrzeby zmiany innych czynników dyplomatycznych ani save schema: stawka może być wyliczana ze stanów ownerów w istniejącym ticku, o ile decyzja projektowa określi zachowanie dla różnych epok.

## Decyzja i zakres implementacji

Zastosować max(epochA, epochB), zgodnie z `00-owner-answer.md`. Kod będzie zmieniony dopiero po zapisaniu tego echa. Ten wybór nie wymaga zmiany save schema, ponieważ epoki ownerów są już zapisane i odtwarzane przez istniejący system.
