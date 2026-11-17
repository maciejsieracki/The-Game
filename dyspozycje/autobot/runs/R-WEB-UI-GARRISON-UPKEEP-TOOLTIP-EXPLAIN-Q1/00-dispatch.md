# R-WEB-UI-GARRISON-UPKEEP-TOOLTIP-EXPLAIN-Q1 (GARNTIP)

DOMAIN: GAME (UI/tekst) · Operator HAIKU · Evaluator SONNET · Obrona HAIKU · FC SONNET · max 5 rund. Priorytet niski.

## Zgłoszenie / decyzja właściciela (2026-11-17, wariant A)
GARNDIAG ustalił: karta Garnizonu pokazuje utrzymanie 4, a dane budynku mają bazę 2 — różnicę robi mnożnik silnika (stawki utrzymania). Decyzja właściciela: **dane zostają bez zmian (A)**, a w karcie/podpowiedzi ma być WYJAŚNIENIE, skąd wartość 4.

## GOAL
W podpowiedzi (tooltip) pozycji „Utrzymanie” karty Garnizonu (lista budynków miasta + karta encji/Civpedia, jeśli ta sama wartość jest tam pokazywana) dodać krótkie, polskie wyjaśnienie: „baza X × mnożnik silnika Y = Z”, gdzie X, Y, Z są liczone Z TYCH SAMYCH STAŁYCH/FUNKCJI co silnik (żadnych zahardkodowanych 2/×2). Jeśli mnożnik zależy od epoki/trybu, wyjaśnienie pokazuje bieżący.

## Zakres
- Znajdź (rg) gdzie karta Garnizonu składa tekst utrzymania (cityPanel.ts, entityCards/buildingAdapter, tooltipy) i funkcję/stałą mnożnika w silniku; użyj jej (nie duplikuj).
- Dotyczy WSZYSTKICH budynków pokazujących utrzymanie tą samą ścieżką, o ile wspólny renderer — ale tekst wyjaśnienia tylko tam, gdzie baza ≠ wyświetlana wartość.
- Bez zmian w `gra/data`, kosztach, silniku, balansie, AI. Tylko prezentacja. Tekst po polsku, zgodny z zasadą „brak surowych ID w tekstach dla gracza” i z regułami ikon surowców (ikony, nie nazwy, jeśli tak robi okolica).

## Kryteria binarne
- Test `gra/tools/garrison-upkeep-tooltip-explain-test.cjs`: dla Garnizonu tooltip zawiera bazę, mnożnik i wynik zgodne z silnikiem (wartości odczytane z kodu silnika w teście); dla budynku bez różnicy brak wyjaśnienia; czerwienieje po mutacji (kopia pliku, NIE `git checkout`).
- tsc bez nowych błędów, 5 bramek referencyjnych, istniejące testy kart budynków (np. budynek-garnizon-test) bez nowej czerwieni.
- Weryfikacja w przeglądarce (Chromium, zrzut tooltipu) — jeśli niewykonalne, jawnie „NIE ZMIERZONO”.
- Brak zmian w `gra/data`, `gra-robocza`, `WERSJE.md`.

## Zakazy
`npm run build/dev` w `gra/`, `git add -A`, `rm/rmdir/unlink` w komendach, logi do /tmp, nie commituj cudzych PNG nadpisanych testami.
