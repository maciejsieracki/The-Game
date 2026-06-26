# SPEC: FAZA ROZSTAWIANIA przed bitwą (UNITS — mechanika; UX — skin)

**Od:** Civ-UNITS · **Data:** 2026-06-25 · Dla: UX (skin) + integracja. UNITS dostarcza mechanikę i hooki; UX może oskinować.

## Cel
Zanim ruszy symulacja bitwy, gracz USTAWIA swoje jednostki w strefie startowej, potem klika „Start".

## Przepływ (maszyna stanów sceny)
`ROZSTAWIANIE` → (Start) → `WALKA` → `KONIEC`.
- W `ROZSTAWIANIE`: symulacja ZAMROŻONA (vClock stoi, AI nie działa). Jednostki gracza już wstępnie auto-rozstawione (domyślny układ wg ról), gracz je przesuwa.
- „Start" blokuje rozstawienie i odpala walkę.

## Elementy na ekranie (co UX skinuje / co buduję)
1. **Strefa startowa** — podświetlone, półprzezroczyste pola, na których wolno stawiać swoje jednostki (np. pas przy własnej krawędzi; w oblężeniu = strefa natarcia atakującego). Pola poza strefą / nieprzejezdne / zajęte = niedozwolone.
2. **Zaznaczenie jednostki** — najazd = podświetlenie; klik = wybór (obwódka/glow).
3. **Przenoszenie** — klik własnej jednostki → klik pola w strefie = przenosi ją tam. (Docelowo drag&drop z „duchem" jednostki: zielone pole = OK, czerwone = nie.)
4. **Dolny ROSTER** (Faza 2) — karty jednostek do wstawienia (ikona/typ/liczba); przeciąganie z karty na pole; pula jeszcze-nierozstawionych.
5. **Przyciski**: „Auto-ustaw" (układ automatyczny wg ról), „Reset", „Start" (+ „Wyjście").
6. **Baner**: „Faza rozstawiania — ustaw jednostki i kliknij Start". Kursor „przenieś" w strefie.
7. **Styl**: spójny z HUD bitwy (ciemny, złote akcenty — jak Total War).

## Mechanika/hooki (UNITS dostarcza)
- stan `phase` (deploy/battle/end); zamrożenie symulacji w deploy.
- zbiór pól strefy startowej gracza (do podświetlenia).
- picker pointer→pole (raycast na siatkę) + rozróżnienie klik vs przeciąganie kamery (przeciąganie = pan; krótki klik = wybór/postaw).
- API: zaznacz jednostkę, przenieś na pole (walidacja: w strefie, przejezdne, wolne, aktualizacja zajętości), auto-ustaw, reset, start.
- ograniczenia: tylko WŁASNE jednostki, tylko w strefie.

## Podział
- UNITS: cała mechanika powyżej + podstawowy skin (gray-box). 
- UX: docelowy wygląd (podświetlenie strefy, duch przeciągania, karty rostera, kursory, styl przycisków).
- Master: kiedy bitwa startuje z mapy → wchodzi w fazę ROZSTAWIANIE (po projekcie/akceptacji).

## Etapy wdrożenia (UNITS)
- **Faza 1 (gray-box, robię teraz):** stan deploy + strefa podświetlona + klik-wybierz/klik-postaw w strefie + przyciski Auto/Reset/Start + zamrożenie do „Start".
- **Faza 2:** drag&drop z duchem, dolny roster z kartami, dopieszczony skin.

— Civ-UNITS
