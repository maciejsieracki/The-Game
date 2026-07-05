# PROMPT — wklej w Claude Design (Brand Book v1)

Skopiuj całość poniżej do Claude Design razem z uploadem folderu `00-brand-book-pakiet/`.

---

```
Jesteś projektantem UI gry strategicznej „The Game” (4X turowa, epoki Kamień–Brąz–Żelazo, mapa heks, imperium, miasta, wojna, dyplomacja).

ZADANIE (FAZA 1 — tylko to teraz):
Stwórz kompletny BRAND BOOK / DESIGN SYSTEM v1 dla tej gry — NIE poprawiaj jeszcze wszystkich ekranów gry. Najpierw system, potem ekrany.

ŹRÓDŁA (załączone w uploadzie):
- 01-DECYZJE-WARSTWA1.md — zamknięte decyzje producenta (OBOWIĄZKOWE)
- 02-SPEC-IKONY.md — semantyka ikon line (OBOWIĄZKOWE — każda ikona ma konkretny przedmiot)
- 03-O-GRE.md — kontekst gry i klimat wizualny
- 04-TOKENY-KOLORY.md — paleta hex i fonty
- 02-html-podglad/ — HTML z przykładami decyzji ABC (Warstwa1, menu referencja)

DECYZJE STYLU (NIE ZMIENIAJ):
1B — ciepłe złoto #e8d88a, tło #080a12, pergamin
2C — Georgia w tytułach; Segoe UI w UI/liczbach/przyciskach
3C — ikony minimal LINE (obrys), bez emoji, semantyka z 02-SPEC-IKONY.md
4C — przyciski OUTLINE 2px złoty; wypełnienie tylko hover/active — NIE pełne złote CTA domyślnie
5C — panele premium: gruba ramka 2px, cień, wyraźny nagłówek
6C — chipy HUD: ikona + liczba + ETYKIETA TEKSTOWA po polsku (np. „Praca”, „Żywność”)

BRAND BOOK MA ZAWIERAĆ:
1. Strona cover + krótki opis klimatu (premium historyczny, ciemne tło, złoto)
2. Color tokens — tabela z hex i zastosowaniem
3. Typography — Georgia vs Segoe UI, przykłady H1/H2/body/label uppercase
4. Ikony — minimum Tier 1 (zasoby imperium) + Tier 2 (toolbar) w stylu 3C; pokaż 24px i 40px
5. Przyciski — warianty: Primary outline, Default outline, Disabled, Danger (outline)
6. Panele 5C — ramka, nagłówek, treść, przykład karty kreatora
7. Chipy 6C — 3 przykłady z etykietą PL
8. Step bar kreatora (5 kroków) — aktywny / done / todo
9. Do / Don't — 4 reguły (np. nie emoji, nie pełne złote przyciski, nie chłodny niebieski dominujący)

FORMAT WYJŚCIA:
- Design system gotowy do eksportu (PDF/HTML + osobne strony komponentów)
- Canvas referencyjny 1920×1080 tam gdzie sensowne
- Język etykiet: polski
- Nazwa projektu: „The Game — Design System v1”

NIE RÓB W TEJ FAZIE:
- Pełnego redesignu wszystkich 34 ekranów
- Nowych decyzji gameplay
- Ikony „dowolne” — Praca = MŁOTEK, Żywność = KROMKA CHLEBA, Nauka = SOWA Z BERETEM

Po zakończeniu: krótkie README co jest w brand booku i jak używać tokenów przy kolejnych ekranach (kolejność: menu → HUD → miasto → dyplomacja → walka).
```

---

*Lane UI · pakiet brand book · 2026-07-01*
