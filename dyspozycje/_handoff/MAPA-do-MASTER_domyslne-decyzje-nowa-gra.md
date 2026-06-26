# HANDOFF: MAPA → MASTER (dla UI/menu „Nowa gra") — DOMYŚLNE DECYZJE

**Data:** 26.06.2026 · **Od:** Civ-MAPA · Decyzja Macieja: ekran „Nowa gra" ma DOMYŚLNE wybory wstępnie zaznaczone; **NIE blokuje** przejścia — gracz klika „Dalej" na domyślnych albo zmienia, co chce.

## Domyślne — GENERACJA ŚWIATA (własność MAPA)
| Wybór | DOMYŚLNA wartość | Opcje |
|---|---|---|
| Typ świata | **Kontynenty** | Kontynenty / Pangea / Wyspy |
| Rozmiar mapy | **Średnia / Standardowy** (~5040 hex, **84×60 kanoniczne z generator.ts**; 50×36 było TYMCZASOWE w main.ts) | Mała / Średnia / Duża / Ogromna |
| Seed | **Losowy** (nowy za każdym razem; „Nowy seed") | dowolna liczba |
| Aktywne typy / rywale | **auto wg rozmiaru** (Mała 3 / Średnia 5 / Duża 7 / Ogromna 9) | (pochodna rozmiaru) |
| Zagęszczenie klastrów (min_dist) | **auto wg rozmiaru** (adaptacyjne: 4/6/8/9) | (pochodna rozmiaru) |

API: `generujSwiat(seed, rozmiar, typ)` — wszystkie domyślne podstawione, gdy gracz nic nie zmieni.

## Domyślne — CROSS-LANE (NIE MAPA; do potwierdzenia przez właścicieli)
- Cywilizacja gracza → DANE/CYWILIZACJE (domyślnie: losowa lub pierwsza z rosteru).
- Poziom trudności AI → Civ-AI (domyślnie: średni).
- Tempo gry → EKONOMIA/CYWILIZACJE (domyślnie: standardowe).

## Zasada dla UI
Ekran „Nowa gra" = wszystkie pola z domyślnymi WSTĘPNIE ZAZNACZONYMI; przycisk „Dalej/Start" aktywny od razu (bez wymuszania kliknięć). Zmiana dowolnego pola tylko nadpisuje domyślną wartość.
