# R-WEB-TEST-DOC-DEBT-GENCAP-SZCZESCIE-LEFTOVERS-Q1

DOMAIN: PROCESS/GAME (tylko testy i dokumentacja; ZERO zmian w `gra/src`, `gra/data`) · Operator HAIKU · Evaluator SONNET · Obrona HAIKU · FC SONNET · max 5 rund. Priorytet niski.

## GOAL (dwa drobne długi z FC poprzednich tematów)
1. **Szczęście 11/23/31 → 12/24/32 (decyzja właściciela 2026-11-17: komplety zostają 12/24/32, katalog 44).** Zostały nieaktualne wzmianki: `dyspozycje/BALANS-SZCZESCIE-SKALOWANIE-EPOK.md:21`, komentarz `gra/src/ui/civpediaOpenGate.ts:36` (komentarz — tylko ZGŁOŚ, nie edytuj src; jeśli to jedyne miejsce, zapisz w raporcie jako propozycję), `gra/tools/szczescie-skala-normalizacja-test.cjs:571`. Wykonaj `rg -n "11 ?/ ?23 ?/ ?31|11/23/31"` w `dyspozycje/`, `gra/tools/`, `docs/`, `gra/` (poza `node_modules`) i popraw w dokumentacji i testach tam, gdzie liczby dotyczą kompletów szczęścia; każdą zmianę uzasadnij odczytem aktualnej wartości z kodu/danych (nie z pamięci). Nie zmieniaj miejsc, gdzie 11/23/31 znaczy co innego.
2. **Luka testowa GENCAP:** test generała/stolicy (`gra/tools/general-capital*-test.cjs` — znajdź przez rg) nie ma asercji limitu stosu / limitu super-jednostek. Dopisz asercje, które odczytują limity z kodu silnika (nie hardkodują liczb) i czerwienieją po mutacji (kopia pliku, NIE `git checkout`).

## Kryteria binarne
- `rg` po 11/23/31 w dozwolonych katalogach: wynik rozpisany w raporcie (poprawione / pozostawione z powodem); w tekstach o kompletach szczęścia 0 starych liczb.
- Test GENCAP: nowe asercje zielone + RED po mutacji; poprzednie asercje bez zmian.
- tsc bez nowych błędów, 5 bramek referencyjnych, `szczescie-skala-normalizacja-test` i testy szczęścia zielone.
- Brak zmian w `gra/src`, `gra/data`, `gra-robocza`, `WERSJE.md`.

## Zakazy
`npm run build/dev` w `gra/`, `git add -A`, `rm/rmdir/unlink` w komendach, logi do /tmp, nie commituj cudzych PNG nadpisanych testami.
