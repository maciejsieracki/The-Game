# Final Control — integracja na `main` R2-I

**Werdykt: PASS-WITH-NOTES. Etap 8/11 potwierdzony na dokładnym, zintegrowanym worktree.**
Nie wykonywałem commit, deployu ani pushu.

## Zakres i kontrola źródeł

- HEAD jest `c0724801` (`main`, zgodny z `origin/main` przy rozpoczęciu kontroli); `git merge-base --is-ancestor c0724801 HEAD` przechodzi.
- Working tree zawiera wyłącznie oczekiwane zmiany tematu: dwie poprawki lifecycle w `gra/src/battle/battleScene.ts`, nowy Chromium harness oraz run `R-BITWA-KOLEJKA-ROZKAZOW-STALE-Q1`. Nie ma cofania zmian z bazowego `main` ani ukrytego cherry-pick całej starej gałęzi.
- Hunk pierwszy usuwa ID z `_queuedOrderUnitIds`, gdy `_activateNext` pomija martwego/zużytego kandydata; po pętli odświeża podgląd tylko wtedy, gdy zbiór się zmienił. Hunk drugi usuwa ID po zakończeniu zwykłej aktywacji i analogicznie odświeża podgląd. Zmiana ogranicza się do cyklu życia stanu kolejki.
- `git diff --check`, `node --check gra/tools/battle-manual-queued-order-lifecycle-live-test.cjs` oraz niezależnie raportowane `npx tsc --noEmit --pretty false` — PASS.

## Dowody integracyjne

Niezależny evaluator R2-I potwierdził świeży Chromium na źródłach HEAD `c0724801` plus widoczne hunki: **15/15 PASS**, zero błędów strony/konsoli. W 28v28 pierwsza kolejka aktywowała 28/28, wyzerowała queue i przesunęła 8 jednostek. Drugi rozkaz wskaźnikiem wykonał natychmiastowy ruch `atk27`; pozycja zmieniła się `(30,72) → (31,71)`, a cel `(31,68)` zgadza się z klikniętym heksiem oraz offsetem formacji `{dc:0,dr:-4}`. Probe produkcyjnego `_activateNext` pomija martwą jednostkę, usuwa jej ID i obsługuje następną żywą.

Dodatkowe 60 sekund obserwacji nie wykazało drugiej aktywacji ani drugiego ruchu `atk27`; wcześniejszego podejrzenia overlapu nie potwierdzono w tym przebiegu. To ograniczenie dowodów, nie dowód niemożliwości w innych stanach.

## Uwagi i dalszy krok

Pole `deadActivated` w JSON jest myląco nazwane: wartość `!dead.acted && dead.dead` opisuje pominięcie martwej jednostki, nie jej aktywację. Niezależny evaluator to zauważył; bieżące kryterium, stan żywej jednostki i wynik kolejki są spójne, więc nie blokuje to poprawki produktu. Warto przemianować pole na `deadSkipped` w późniejszej kosmetycznej zmianie harnessu.

Kryteria akceptacji poprawki są spełnione na aktualnym `main` w testowanym zakresie; kontrola nie wykazała regresji. Maksymalny limit 120 jednostek i wszystkie typy rozkazów nie są objęte tym testem. Następna bramka to selektywny commit allowlisty i weryfikacja, potem Robocza deploy oraz push/readback zgodnie z nadrzędną dyspozycją.
