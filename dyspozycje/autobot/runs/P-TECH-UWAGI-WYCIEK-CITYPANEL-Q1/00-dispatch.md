# 00-dispatch — P-TECH-UWAGI-WYCIEK-CITYPANEL-Q1

TEMAT: P-TECH-UWAGI-WYCIEK-CITYPANEL-Q1
GOAL: pole `tech.Uwagi` (notatki deweloperskie, np. „ABC-7: Popalnia brązu na mapie") NIE ma
przeciekać do gracza w `cityPanel.ts::appendTechDetailBlock()`.

## Znalezisko (Final Control, przy okazji R-TECH-ULEPSZENIA-TERENU-SYNC-Q1, FALA 303)

Filtr `playerFacingNote()` (i/lub `isDevOnlyPlayerText()`) rozpoznaje tylko wzorce
`PYTANIE`/`DECYZJA`/`DEC-\d{8}`/"patrz unit-building-bonuses" — NIE rozpoznaje wzorca
"ABC-7:" (i prawdopodobnie innych podobnych numerowanych notatek deweloperskich w
`tech.json`). `techDiscoveryNotice.ts` ma TEN SAM problem strukturalnie, ale już świadomie
NIE renderuje pola `Uwagi` wcale — `cityPanel.ts::appendTechDetailBlock()` (wywoływane z
paneli budynku/jednostki, gdzie karta odkrycia technologii wyświetla blok szczegółów
technologii wymaganej) to przeoczyła.

## Zakres

1. Zlokalizuj wszystkie wzorce notatek deweloperskich rzeczywiście występujące w polu
   `Uwagi` w `gra/data/tech.json` (grep, nie zgadywanie) — nie tylko "ABC-7:", sprawdź czy
   są inne podobne prefiksy nierozpoznawane przez `playerFacingNote()`/`isDevOnlyPlayerText()`.
2. Napraw filtr (funkcja współdzielona, prawdopodobnie w `techDiscoveryNotice.ts` lub
   wspólnym module) tak, by rozpoznawał WSZYSTKIE rzeczywiście występujące wzorce notatek
   deweloperskich, nie tylko te już obsłużone.
3. Zweryfikuj że `cityPanel.ts::appendTechDetailBlock()` faktycznie używa (lub zaczyna
   używać) tego samego filtra co `techDiscoveryNotice.ts` — to jest KOREŃ przeoczenia, nie
   osobny bug w samym `cityPanel.ts`.
4. Dodaj/rozszerz test regresyjny pokrywający ten konkretny scenariusz (notatka z prefiksem
   "ABC-7:" lub podobnym NIE trafia do gracza przez `cityPanel.ts`).

## Ograniczenia

- To jest bug filtra (nierozpoznany wzorzec), NIE decyzja projektowa — nie wymaga ABC.
- NIE zmieniaj treści samych notatek w `tech.json` — tylko to, czy/jak są filtrowane przed
  wyświetleniem graczowi.
- NIE dotykaj `techDiscoveryNotice.ts`'s świadomej decyzji "nie renderuj Uwagi wcale" — to
  ma zostać jak jest, ten temat dotyczy WYŁĄCZNIE `cityPanel.ts`.

## Branch

`autobot/P-TECH-UWAGI-WYCIEK-CITYPANEL-Q1` (z `main`).
