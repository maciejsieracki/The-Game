# AI-REBELIA — weryfikacja na żywo (R-WEB-AI-REBEL-VERIFY-LIVE-Q1, tag AIREBELVER)

Data: 2026-11-27. Baza kodu: `99375f77e` (origin/main, FALE 928–929). Operator: runda 1/5 (HAIKU 5.5).
Ustawienia maksymalne: Trudny, „Kultura i religia” trudny, „Koszty jednostek” Wysoki ×4 (`--pace wysoki`), `--city-state 1`.
Surowe dane: `dyspozycje/autobot/runs/R-WEB-AI-REBEL-VERIFY-LIVE-Q1/dane/`. Raport: `runs/.../10-operator-claude.md`.

| Pozycja | Wynik | NIE ZMIERZONO + powód |
|---|---|---|
| 1. Ochrona ostatniego miasta AI (scenariusz wymuszony: AI z 1 miastem w buncie skrajnym) | NIE ZMIERZONO w scenariuszu wymuszonym. W naturalnych biegach 60 tur (seed 4242 i 7) żadna cywilizacja AI nie spadła do 0 miast (`AI z 0 miast` = 0 w t2–t60). | Brak haka wymuszającego bunt w `__aiEconomyMeasure` ani w runnerze. Wymuszenie wymagałoby zmiany gra/src — DECISION_REQUIRED: czy dodać hak testowy „wymuś bunt miasta AI”. Ochronę potwierdza wyłącznie test na wejściach bramki (`ai-city-rebellion-gate-test.cjs`, 37/0). |
| 2. Stolica AI w buncie przy ≥2 miastach (flaga/efekty, Mennica, zwycięstwo) | NIE ZMIERZONO | Runner nie zapisuje stanu stolicy ani efektów Mennicy; odczyt wymagałby nowego haka (jw., DECISION_REQUIRED). |
| 3. Round-trip zapisu z buntami AI i wpisem „rebelia” w „Wydarzeniach na świecie” | NIE ZMIERZONO | Runner nie wykonuje zapisu/wczytania z listą wydarzeń; wpis z FALI 929 trafia do listy trwałej, której stan nie jest eksportowany do JSONL. Hotseat nie sprawdzany. |
| 4. Zrzut okna dyplomacji z wpisem „rebelia” (Chromium) | NIE ZMIERZONO | Nie wykonano zrzutu: w czasie rundy przeprowadzono biegi żywe (pozycja 5); render wymagał osobnego skryptu na `_live-ready.cjs`, nieuruchomionego w tej rundzie. |
| 5. Bieg żywy 60+ tur na maksimum, seed 4242 i 7 | ZMIERZONO (patrz tabela niżej). Zgodność z kodem: zliczone z `cityState` (właściciel −99 = frakcja buntu), NIE z kodu. | Liczby wpisów „rebelia” na liście i widoczne graczowi cywilizacje — NIE ZMIERZONO (nie eksportowane przez runner). |

## Pomiar pozycji 5 (maksimum, 60 tur, 1 przebieg na ziarno)

Liczby z `dane/seed4242-maks.txt` i `dane/seed7-maks.txt` (pole `owners` i `cityState`).
„Rebelia” = miasta we frakcji −99 (`cityState`, właściciel −99 = miasta w buncie). „AI” = właściciele > 0 (bez gracza 0; bez −1).

| Tura | s4242: bunt (miasta) | s4242: miasta AI | s4242: AI z 0 miast | s7: bunt (miasta) | s7: miasta AI | s7: AI z 0 miast |
|---|---|---|---|---|---|---|
| t2 | 0 | 42 | 0 | 0 | 42 | 0 |
| t10 | 0 | 42 | 0 | 0 | 42 | 0 |
| t20 | 0 | 48 | 0 | 0 | 50 | 0 |
| t30 | 0 | 68 | 0 | 0 | 71 | 0 |
| t40 | 1 | 114 | 0 | 1 | 116 | 0 |
| t50 | 7 | 130 | 0 | 9 | 128 | 0 |
| t60 | 7 | 149 | 0 | 13 | 142 | 0 |

- Bunt startuje po ok. 30–40 turach i rośnie; w t60: 7 miast (s4242) i 13 miast (s7).
- Pole `lacznaZero` w `cityState` oznacza liczbę miast z łaską = 0 (nie „AI bez miast”); w t60: 10 (s7). Nie jest to licznik zerowych cywilizacji.
- Wojsko AI w t60: 148 (s4242), 134 (s7). Wartości wojska AI nie są porównywane z biegiem PRZED (brak tego pomiaru w tej rundzie).
- Liczba 149 miast AI w t60 (s4242) zgadza się z dokumentem AI-REBELIA-WDROZENIE (PO s4242: 148 + 10 w buncie) w granicach szumu między przebiegami.

## Wnioski ostrożne

- Bunt AI działa na żywo na maksimum: 0 buntów do t30, 7 (s4242) i 13 (s7) miast w buncie w t60.
- Ochrona ostatniego miasta nie została wywołana w naturalnych biegach (żadna AI nie spadła do 0 miast), więc nie ma dowodu live jej działania — to pozostaje NIE ZMIERZONO do czasu haka wymuszającego.
- Pozycje 2–4 wymagają nowych haków lub osobnego skryptu renderu; nie są zamknięte.
