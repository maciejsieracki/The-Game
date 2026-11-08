# Operator Defense — R-NEWGAME-SETTINGS-LAND-DIPLO-REPOSITION-Q1

**Werdykt: PASS-WITH-NOTES.** Uwaga o `newgame-adv-tooltip-test.cjs` została rozpatrzona jako ograniczenie środowiska testowego, niezwiązane z przesunięciem ustawień.

## Obrona uwagi `file://`

Test tooltipów buduje produkcyjny bundle, następnie otwiera `index.html` przez `file://`. W tym środowisku Chromium blokuje tę nawigację (`ERR_BLOCKED_BY_ADMINISTRATOR`), więc test nie osiąga asercji tooltipów. Nie oznacza to PASS testu tooltipów; jego wynik pozostaje nierozstrzygnięty z powodu transportu pliku. Sam zakres poprawki ustawień nie zmienia tooltipów ani sposobu ich renderowania. Test regresyjny ustawień uruchamia prawdziwy Chromium przez `http://127.0.0.1`, bez `file://`, i przechodzi. Nie przypisujemy zatem awarii `file://` do zmiany ustawień.

## Łączna weryfikacja z trybem bitwy

Utworzono tymczasowego kandydata testowego w `/workspace/R-NEWGAME-BATTLE-COMBINED`, bazującego na `origin/main`, złożonego z commitów:

- `84b33588` — przeniesienie udziału lądu i rozpatrywania ofert,
- `64939960` — etykiety trybu bitwy,
- `0eb9cb5d` — wiring trybu automatycznego,
- `572d86a3` — rozszerzenie testu ustawień o tryb bitwy.

Na tym kandydacie:

- `TMPDIR="$PWD/tmp" node gra/tools/newgame-settings-layout-reposition-test.cjs` — **PASS** w Chromium: land share, trudność miast-państw, bramka ofert i tryb bitwy są widoczne/wybieralne; land, dyplomacja i tryb bitwy przeżywają zamknięcie/ponowne otwarcie kreatora; parametry startu zawierają wybrane wartości.
- `TMPDIR="$PWD/tmp" node gra/tools/battle-mode-choice-labels-test.cjs` — **PASS**: obie etykiety, opis, wybór i podsumowanie.
- `node gra/tools/battle-manual-choice-contract-test.cjs` — **12/12 PASS**.
- `node gra/tools/pre-battle-defender-retreat-test.cjs` — **PASS**.
- `npm run typecheck --prefix gra` — **PASS**.
- `git diff --check` — **PASS**.

Kandydat służy wyłącznie wspólnej weryfikacji: nie wykonano merge, push ani deployu. Można przekazać go Final Control/integracji z powyższym test planem.
