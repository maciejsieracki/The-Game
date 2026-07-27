# C-WIAR-D4 — Modyfikator startowego Zaufania od Wiarygodności (Dźwignia 4)

**Status:** 🟢 **WDROŻONA** — FALA 36 `a74c3797`  
**Grupa:** D (dyplomacja / Wiarygodność)  
**Ekran:** [TEMAT: Wiarygodność cywilizacji — pierwszy kontakt dyplomatyczny]

## Status wdrożenia (dla innych agentów)

| Etap | Stan |
|------|------|
| **Sesja** | 🔧 **Czat ABC** — temat obsługujemy tutaj; **nie** publishuj `gra-robocza/` |
| **Kod `gra/src`** | ✅ **GOTOWY** — `diplomacy-credibility.ts` · `wiarygodnosc-test` |
| **Deploy `gra-robocza`** | ✅ **FALA 36** `a74c3797` (commit `2632156`) |
| **Indeks** | `STATUS-WDROZEN-AGENT-2026-07-27.md` |

## Sytuacja

Dźwignia 4 (pierwszy kontakt) jest opisana w specyfikacji Wiarygodności (`WIARYGODNOSC-SPECYFIKACJA.md`), ale nie ma wdrożenia ani ustalonych liczb. Startowe Zaufanie przy pierwszym spotkaniu zależy dziś wyłącznie od typu cywilizacji i poziomu trudności — globalna Wiarygodność państwa (W) nie wpływa na pierwsze wrażenie. Dźwignie 1 i 2 (kary za złamanie umów) działają już w silniku; reputacja nie dociera do momentu pierwszego kontaktu.

## Cel pytania

Ustalić wzór i skalę modyfikatora startowego Zaufania (w punktach Zaufania) od globalnej Wiarygodności państwa — symetrycznie dla gracza i dla sztucznej inteligencji.

## Dlaczego teraz

Dźwignie 1 i 2 są w silniku; bez Dźwigni 4 mechanizm Wiarygodności nie wpływa na pierwsze spotkanie z nowym sąsiadem. To ostatni brakujący element łańcucha „reputacja → dyplomacja" w warstwie pierwszego kontaktu.

## Opcja A — Lekki sygnał: ±5 pkt Zaufania na start

Opis: `startZaufanie + round(W / 20)` — przy W w zakresie typowym ±100 daje modyfikator od ok. −5 do +5 pkt Zaufania.

**Za:** Subtelny efekt — nie psuje startu relacji po jednej zdradzie · spójny z dzielnikiem 20 używanym w innych miejscach specyfikacji · łatwy do strojenia w Panelu D bez ryzyka „zamknięcia" dyplomacji na starcie.

**Przeciw:** Efekt ledwo widoczny przy jednorazowym kontakcie — gracz może nie odczuć, że reputacja coś znaczy · przy W bliskim zeru praktycznie brak różnicy między „świętym" a neutralnym państwem.

## Opcja B — Wyraźny sygnał: ±15 pkt

Opis: `round(W / 7)` lub tabela progów (np. W ≤ −50 → −15; W ≥ +50 → +15; między — interpolacja).

**Za:** Gracz od razu czuje reputację przy pierwszym spotkaniu · wyraźna nagroda za dobrą grę dyplomatyczną · łatwiej zauważyć w playteście, czy mechanizm działa.

**Przeciw:** Jedna zdrada (−15 W lub więcej) może zamknąć dyplomację od razu przy kolejnym kontakcie · ryzyko „śnieżnej kuli" negatywnej reputacji · wymaga kalibracji progów per trudność.

## Opcja C — Tylko ujemna strona

Opis: W &lt; 0 obniża startowe Zaufanie; W ≥ 0 bez bonusu (tylko kara za złą reputację).

**Za:** Karzemy złą reputację, nie nagradzamy drugi raz tych, którzy „i tak" grali uczciwie · prostszy komunikat dla gracza („zła sława cię prześladuje") · mniejsze ryzyko zbyt łatwego sojuszu po dobrej grze.

**Przeciw:** Brak nagrody za wysoką Wiarygodność przed ekspansją · asymetria względem Dźwigni 1–2 (tam kary i nagrody) · gracz z W = +80 nie odczuje przewagi nad neutralnym.

## Rekomendacja

**Litera:** A — subtelny sygnał nie blokuje dyplomacji po pojedynczym incydencie, a jednocześnie domyka specyfikację bez agresywnej kalibracji.

## Odpowiedź Macieja

> **C-WIAR-D4: A** — Lekki sygnał: `round(W / 20)` pkt Zaufania na start (2026-07-27).  
> Cytat w czacie: `C-WIAR-D4: A`.

## Wdrożenie

- `gra/src/game/diplomacy-credibility.ts` — `modyfikatorZaufaniaD4OdWiarygodnosci`, `zaufaniePierwszyKontaktZD4`
- `gra/src/game/diplomacy-layers.ts` — `applyWiarygodnoscD4ToRelation`
- `gra/src/main.ts` — start gry, lazy init relacji, miasta-państwa
- Test: `wiarygodnosc-test.cjs` (sekcja D4)
- **Wzór pary:** baza + `round(W_a/20)` + `round(W_b/20)` (parytet gracz/AI)
- Warstwa: 🟡
