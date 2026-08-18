# Audyt odpowiedzi na menu „Następny krok” — 2026-08-18

## Zakres

Audyt obejmuje bieżącą serię zgłoszeń po FALI 299 i sprawdza, czy menu
zakończone słowami „Napisz: 1 / 2 / 3” dostało jednoznaczną odpowiedź.

**Wynik:** w zapisanej serii nie ma odpowiedzi w kanonicznym formacie
`<ID zgłoszenia> + NK1/NK2/NK3`. Maciej często przechodził od razu do nowego
zgłoszenia albo wydawał własną dyspozycję. Tych wiadomości nie oznaczamy
wstecznie jako odpowiedzi na poprzednie menu.

| # | Temat menu | Opcje pokazane | Odpowiedź przypisana? | Co nastąpiło |
|---:|---|---|---|---|
| 1 | `R-REKRUT-SUROWIEC-BEZ-UPKEEP-REZERWY-Q1` | 1/2/3 | NIE | nowe zgłoszenie granic |
| 2 | `R-GRANICE-NARUSZENIE-ZAUFANIE-KIERUNEK-Q1` | 1/2/3 | NIE | nowe zgłoszenie barbarzyńców |
| 3 | `R-BARB-CHATKA-LIMIT-15-Q1` | 1/2/3 | NIE | nowa wycena surowców |
| 4 | `R-DYPLO-SUROWCE-WARTOSC-5X-Q1` | działaj/1/2/3 | NIE | nowe uporządkowanie dyplomacji |
| 5 | `R-DYPLO-INFOGRAFIKI-TOOLTIPY-Q1` | 1/2/3 | NIE | nowy komunikat badań |
| 6 | `R-NAUKA-KOMUNIKAT-KARTA-UKONCZENIA-Q1` | 1/2/3 | NIE | wspólna walka z barbarzyńcami |
| 7 | `R-DYPLO-WSPOLNA-WALKA-BARB-PRZEMARSZ-Q1` | 1/2/3 | NIE | brak kart ważnych zdarzeń |
| 8 | `R-TRIUMF-CS-KOMUNIKAT-KARTA-W-GRZE-Q1` | 1/2/3 | NIE | regres wzrostu 116% |
| 9 | `R-GARNCARNIA-CERAMIKA-SZCZESCIE-111-Q1` | 1/2/3 | NIE | koncentracja armii |
| 10 | `R-ARMIA-KONCENTRACJA-AI-BARB-Q1` | 1/2/3 | NIE | zdobywanie miast przez barbarzyńców |
| 11 | `R-BARB-ZDOBYCIE-MIAST-Q1` | 1/2/3 | NIE | naprawa Manpower — dyspozycja tekstowa |
| 12 | `R-MANPOWER-UZUPELNIENIE-HP-NIEZAPISUJE-Q1` | 1/2 | NIE | zgłoszenie ikony głodu |
| 13 | `R-ARMIA-IKONA-GLOD-FALSZYWA-Q1` | 1/2/3 | NIE | audyt rekrutacji AI/MP |
| 14 | `R-AI-MP-REKRUTACJA-SKARBIEC-ZAMIAST-BUDOWY-Q1` | 1/2/3 | NIE | korekta limitu chatki |
| 15 | `R-GARNCARNIA-CERAMIKA-SZCZESCIE-111-Q1` | 1/2/3 | NIE | prośba o pełną listę i dispatch |

## Ustalenia na przyszłość

1. Każde menu ma ID zgłoszenia oraz identyfikatory `NK1`, `NK2`, `NK3`.
2. Odpowiedź musi zawierać ID, np. `R-MANPOWER-UZUPELNIENIE-HP-NIEZAPISUJE-Q1 + NK1`.
3. Nowa dyspozycja zamiast numeru nie zamyka poprzedniego menu; jest osobnym
   wpisem w rejestrze.
4. Tematy już naprawione, jak Manpower w PR #130, nie dostają ponownego
   Operatora tylko dlatego, że stare menu nie miało numerowanej odpowiedzi.

