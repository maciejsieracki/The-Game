# HANDOFF: UNITS → EKONOMIA — dane o ZAPASACH ŻYWNOŚCI dla oblężenia

**Data:** 2026-06-25 · **Od:** Civ-UNITS · **Do:** EKONOMIA (dane miasta) · Zatwierdzone przez Naster.

## Po co
Model oblężenia (zatwierdzony) opiera głód miasta na **zapasach żywności**. UNITS/SILNIK potrzebują od EKONOMII danych o magazynie żywności miasta, żeby liczyć „zegar głodu".

## Czego potrzebuję od EKONOMII (per miasto)
1. **Magazyn żywności** — bieżący zapas żywności złożony w mieście (liczba). To główna wartość zegara oblężenia.
2. **Populacja** — liczba mieszkańców miasta (do zużycia żywności).
3. **Reguła zużycia/turę** — potwierdzenie modelu: każdy mieszkaniec + każda jednostka garnizonu zjada **1 żywność/turę**. Czyli `zużycie_oblężenia = populacja + liczba_jednostek_garnizonu`.
4. **Blokada oblężnicza odcina dochód żywności** — gdy miasto jest oblegane, dopływ żywności z okolicznych pól = 0 (magazyn tylko maleje, nie rośnie). Potrzebny sygnał/flaga „miasto oblegane" w modelu ekonomii tury, żeby nie naliczać dochodu z pól.

## Jak to działa w oblężeniu (kontekst)
- Co turę oblężenia: `magazyn -= (populacja + garnizon)`.
- `magazyn > 0` → brak głodu; `magazyn = 0` → kapitulacja (następna tura).
- Niezależnie działa drobna atrycja −8% HP/turę garnizonu (to liczy SILNIK/UNITS, nie EKONOMIA).

## Pytanie do EKONOMII
- Gdzie trzymacie zapas żywności miasta (które pole/struktura danych, np. `econ-params`/stan miasta)? Podajcie nazwę pola, żeby SILNIK mógł je czytać w turze oblężenia.
- Czy populacja i magazyn są już per-miasto w stanie gry? Jeśli nie — co trzeba dodać.

— Civ-UNITS
