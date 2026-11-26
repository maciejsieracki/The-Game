# Liczba sojuszy AI↔AI przed i po ALLYCLEAN (R-WEB-DIPLO-ALLIANCE-COUNT-MEASURE-Q1, #153)

STATUS: POMIAR ZAKOŃCZONY, bez zmian w grze. Wniosek: spadek liczby sojuszy AI nie wystąpił (>30% = brak).

## Warunki pomiaru

- PRZED: commit `b1e4e04ab` (main przed ALLYCLEAN, FALA 913 nie zawiera zmiany; to stan TRUCEPRICE, FALA 912).
- PO: commit `107e30f5e` (baza dispatchu, origin/main w chwili startu; zawiera FALĘ 913 = ALLYCLEAN).
- Runner: `gra/tools/diplomacy-harder-measure-run.cjs`, domyślne ustawienia (`--harder 0`, bez `--all-flags`, `--player-ai 1`, `--gold 200 --food 200 --bypass 1`), Chromium 1243 z `/opt/pw-browsers`, deviceScaleFactor 1, seedy 4242 i 7, tury 2–67 (66 wierszy na przebieg, bez duplikatów).
- Bundle budowany poza repo (`vite build --outDir` w katalogu scratchpad), oba bundle z tego samego drzewa `gra/`, tylko różnica commitów.
- Liczba sojuszy AI↔AI = pary z `aiAi: true` i `pokoj === 'sojusz'` (activeDeals), nie pole `status`.
- Analizator: `dyspozycje/analizy/allyclean-count-measure.cjs`; surowe wyniki: `dyspozycje/analizy/SOJUSZE-LICZBA-PRZED-PO-ALLYCLEAN-2026-11-26.json`.

## Wyniki: sojusze AI↔AI w wybranych turach (PRZED / PO)

| tura | seed 4242 PRZED | seed 4242 PO | seed 7 PRZED | seed 7 PO |
|---|---|---|---|---|
| 10 | 0 | 0 | 0 | 0 |
| 20 | 0 | 0 | 0 | 0 |
| 30 | 2 | 2 | 0 | 0 |
| 40 | 2 | 2 | 2 | 2 |
| 50 | 2 | 2 | 2 | 2 |
| 60 | 3 | 3 | 2 | 3 |
| 67 | 3 | 3 | 5 | 6 |

Maksimum sojuszy AI↔AI w przebiegu: seed 4242 PRZED 3 / PO 3; seed 7 PRZED 5 / PO 6.
Sojusze z graczem (owner 0): 0 w każdej turze każdego przebiegu.

## Limit 2 na cywilizację

- Maksymalna liczba sojuszy AI↔AI na jedną cywilizację w turze: 2 we wszystkich czterech przebiegach.
- Tur z naruszeniem limitu (>2): 0 we wszystkich czterech przebiegach.

## Nowe umowy, usunięcia i podmiany (pary kolejnych tur)

| przebieg | nowe umowy | usunięcia | podmiany partnera* | odnowienie po 1 turze bez umowy |
|---|---|---|---|---|
| seed 4242 PRZED | 3 | 0 | 0 | 0 |
| seed 4242 PO | 3 | 0 | 0 | 0 |
| seed 7 PRZED | 8 | 3 | 3 | 1 |
| seed 7 PO | 9 | 3 | 3 | 0 |

\* podmiana partnera = umowa zniknęła, a w tej samej turze któryś z uczestników dostał nowego partnera AI.

## Pary ze statusem „sojusz” bez aktywnej umowy (ślad ALLY66)

Liczone jako pary ze `status === 'sojusz'` i `pokoj !== 'sojusz'`, suma po wszystkich turach / maks. na turę:

| przebieg | suma par-tur | maks. na turę |
|---|---|---|
| seed 4242 PRZED | 0 | 0 |
| seed 4242 PO | 0 | 0 |
| seed 7 PRZED | 24 | 3 |
| seed 7 PO | 0 | 0 |

PO zmianie ALLYCLEAN żaden przebieg nie ma relacji „sojusz” bez umowy. Oczekiwany wynik (0) spełniony.

## Różnica względna PO vs PRZED

- seed 4242: 0% w każdej raportowanej turze (przebiegi identyczne w liczbach sojuszy).
- seed 7: w turze 60 +50% (2 → 3), w turze 67 +20% (5 → 6). Przebiegi rozchodzą się po pierwszej różnicy zachowania AI, więc różnica w pojedynczej turze nie jest sama w sobie dowodem skutku.
- Najmniejsza wartość PO względem PRZED nie spada poniżej PRZED w żadnej turze raportu.

## Wniosek

Czyszczenie relacji po zniknięciu umowy (ALLYCLEAN) nie zmniejszyło liczby sojuszy AI o ponad 30% na żadnym z dwóch ziaren. Nie ma podstaw do DECISION_REQUIRED wg kryterium dispatchu.

Obserwacja spoza kryterium: w przebiegu PRZED seed 7 widać 3 podmiany partnera i jedno odnowienie po jednej turze bez umowy; w PO odnowienia po jednej turze nie ma. Podmiany partnera (3) występują w obu wersjach, więc ALLYCLEAN ich nie usuwa; to osobny wątek (wzorzec podmiany z dyspozycje/analizy/SOJUSZE-PODMIANA-WZORZEC-2026-11-25.md), nie zmieniony tym pomiarem.

## Ograniczenia

- Dwa ziarna, jedna konfiguracja nowej gry (domyślna), tury 2–67. Nie zmierzono innych ustawień dyplomacji ani tur powyżej 67.
- Przebiegi seed 7 wymagały wznowień ze slotu (Chromium zamykał stronę, runner ponawiał start). Od tury ok. 63 (PO seed 7) i od tury 40 (PRZED seed 7) w ponowieniach ustawiono `MEASURE_CHROME_ARGS="--disable-gpu --mute-audio"` (flagi renderu, nie logika gry). Przebieg seed 4242 PRZED miał jedno nieudane wznowienie (exit 1) i zakończył się poprawnym wznowieniem. Liczby wierszy (66 na przebieg, tury 2–67) potwierdzają brak duplikatów.
- Analiza liczy tylko pary w `diplo.pairs`, które runner zapisuje (pary inne niż neutralne lub sąsiedzkie). Sojusz zawsze spełnia ten warunek, więc liczenie sojuszy nie jest zaniżone; pary bez kontaktu nie mogą być sojuszem.
- Pole `aiAi` odróżnia AI↔AI od sojuszy z graczem; sojusze z miastami-państwami nie zostały osobno wydzielone (w danych nie ma osobnego pola typu cywilizacji), co nie zmienia wyniku, bo liczba sojuszy z graczem wynosi 0.
