# Rozbieżność po wczytaniu zapisu (B != A) — stan analizy, bez naprawy

Temat: R-WEB-SAVE-LOAD-DIVERGENCE-FIX-Q1 (SAVEFIX). Data: 2026-11-27.
Status: PRZYCZYNA NIEZIDENTYFIKOWANA. Naprawy w grze NIE ma. Ten dokument opisuje, co sprawdzono, a co nie.

## Co jest ustalone (z pomiarów poprzednich rund, nie powtarzanych w tej rundzie)

- Pomiar: cfg max (najwyższy poziom: Trudny, dyplomacja trudna, Wysoki x4, kultura i AI trudne, flagi ON), seed 4242, zapis po turze 3, K=6.
- A = ciągła gra; B = świeża sesja + `__detHarness.restoreJson` ze snapshotu z A.
- B != A od tury 4 po wczytaniu (t4-t9). Liczba jednostek i miast zgodna do t6, potem rozchodzi się (detIdSeq t6: A 65 / B 66).
- Rozjazd w pierwszej turze po wczytaniu: pula stolic AI (city16, city25: A 3.9 / B 3.6375), drewno miast 16/17/25, manpower miasta 26 (A 2000 / B 0).
- Snapshot vs stan po restore: różnice tylko reprezentacyjne (pola domyślne, np. `budowaLista`, `magazynZywnosci`, `postepBudynkowUsuniete`).
- Odrzucone: (P1) zapis i wczytanie map cudów AI (`aiWonderPracaTickByCity`, `aiWonderStuckTurnsByOwner`) jako pól opcjonalnych — rozjazd bez zmian; (P2) podstawienie z A do B 17 map poziomu modułu — rozjazd bez zmian; (hexy) podstawienie hexów z `mapSnapshot` — rozjazd bez zmian.

## Sprostowanie do poprzedniego raportu

Poprzedni raport twierdził, że `__detHarness.restoreJson` omija `mapSnapshot`. Kod tego nie potwierdza:
- `gra/src/main.ts` ~33714: `snapshotJson` = `JSON.stringify(buildSaveGameSnapshot(...))`;
- `gra/src/main.ts` ~42946: `buildSaveGameSnapshot` zawiera `mapSnapshot: serializeMapForSave(map)`;
- `gra/src/main.ts` ~33723: `restoreJson` przekazuje cały JSON do `restoreGameFromSave`.
Harness więc przekazuje `mapSnapshot`. Nie wiadomo natomiast, czy `restoreGameFromSave` korzysta z niego tak samo jak ścieżka UI (`loadNeedsMapRebuild` ~10580, `regenerateWorldForLoad` ~50905). Ta różnica pozostaje NIE ZMIERZONO.

## Co NIE zostało zmierzone

- Cztery konfiguracje, dwa ziarna (seed 7 nieobjęty), dwa punkty zapisu (t10 nieobjęty): NIE ZMIERZONO poza jednym punktem (cfg max, seed 4242, t3).
- Ścieżka UI (wczytanie z menu i z pauzy w tej samej grze): NIE ZMIERZONO.
- Hipotezy do sprawdzenia w następnej rundzie (bez dowodu): (a) `ownerBonusy` / `ownerCivKey` / `mpMults` dla właściciela 22 (manpower miasta 26, `turn-economy.ts` ~3214-3222); (b) kolejność iteracji Map odbudowanych przy wczytaniu; (c) zmienne `let` w zakresie zapisu/odczytu, niebędące Mapą ani Setem.

## Co zrobiono w tej rundzie

- Usunięto z `gra/tools/savedigest-run.cjs` opcje `--dumpmod` / `--inject`: zależały od `window.__savefixDiag`, którego nie ma w `gra/src/main.ts` (grep: brak trafień). Plik wrócił do stanu bazy.
- Brak zmian w `gra/src/`. `git diff 31a1ad39d -- gra/` = 0 linii.
- Eksperymentalny patch `dyspozycje/autobot/runs/R-WEB-SAVE-LOAD-DIVERGENCE-FIX-Q1/diag-savefix-r2-main.patch` NIE do integracji.

## Dalsze kroki (dla następnej rundy)

1. Powtórzyć B != A na cfg max, seed 4242, t3 (potwierdzenie na bieżącej bazie).
2. Zrzut `ownerBonusy`, `ownerCivKey`, `mpMults` i pól manpower/drewno miasta 26 w A@t3 oraz B po restore, przed endTurn.
3. Bisekcja po kolejności iteracji Map (hipoteza b) i po zmiennych `let` (hipoteza c).
4. Dopiero po wskazaniu przyczyny: poprawka pól opcjonalnych, test `save-load-continuity-*.cjs`, test zgodności wstecznej, mutacja czerwona, bramki dispatchu.
