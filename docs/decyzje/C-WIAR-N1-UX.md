# C-WIAR-N1-UX — Modal trzyopcjiowy przy ataku poza wojną (N1)

**Status:** 🟢 **WDROŻONA** (kod w `gra/src`, bez deploy ROBOCZA)  
**Grupa:** D (dyplomacja / Wiarygodność) + E (UI-shell, modal walki)  
**Ekran:** [TEMAT: Wiarygodność — inicjacja walki bez wypowiedzenia wojny]

## Sytuacja

Specyfikacja Wiarygodności (N1) wymaga modala z trzema opcjami przy próbie ataku na państwo, z którym nie toczymy wojny. Kod ma dziś tylko przyciski Anuluj / Tak. Kary N1 (i powiązane N2, N3) działają w silniku po fakcie, ale gracz nie dostaje wyboru ze specyfikacji — nie ma podglądu kar przed decyzją ani ścieżki „wypowiedz wojnę bez ataku teraz".

## Cel pytania

Ustalić docelowy przepływ interfejsu użytkownika przy inicjacji walki poza stanem wojny — z zasadą: kara N1 tylko po uprzedzeniu (świadomy wybór gracza).

## Dlaczego teraz

Rdzeń N1 działa w silniku; bez modala trzyopcjiowego wdrożenie Wiarygodności jest niepełne względem specyfikacji i Poradnika gracza.

## Opcja A — Pełny modal trzyopcjiowy

Opis: Trzy opcje — (1) wypowiedz wojnę bez ataku w tej turze, (2) atak bez uprzedzenia z podglądem kar N1+N2+N3, (3) anuluj. Podgląd kar przed potwierdzeniem ataku.

**Za:** Pełna zgodność ze specyfikacją Wiarygodności · świadomy wybór gracza z widocznymi konsekwencjami · spójność z zasadą „kara tylko po uprzedzeniu" · materiał edukacyjny dla nowych graczy (co grozi za złamanie pokoju).

**Przeciw:** Więcej kliknięć w typowej ścieżce wojny · przebudowa istniejącego modala potwierdzenia walki · wymaga koordynacji Grupy D (logika kar) i Grupy E (UI).

## Opcja B — Wojna teraz, atak następnej tury; kara N1 po fakcie

Opis: Uproszczony przepływ — jeden przycisk „wypowiedz wojnę"; atak możliwy dopiero od następnej tury; brak osobnej ścieżki „atak bez ostrzeżenia".

**Za:** Mniej przycisków — szybsza ścieżka do wojny · mniej pracy UI · naturalnie unika N1 (brak ataku w turze wypowiedzenia).

**Przeciw:** Łamie zasadę uprzedzenia z specyfikacji (gracz nie widzi explicite kary za „niespodziewany" atak) · nie ma podglądu N2/N3 przy agresywnym stylu gry · odbiega od Poradnika i od oczekiwań playtestów N1.

## Opcja C — Dwa przyciski akcji + anuluj

Opis: (1) wypowiedz wojnę bez ataku, (2) wypowiedz i atakuj teraz (z karą N1), (3) anuluj — bez osobnej opcji „atak zupełnie bez wypowiedzenia".

**Za:** Kompromis UX — mniej opcji niż A, ale nadal wybór · każda ścieżka wojny wymaga jawnej decyzji · łatwiejsze do zaimplementowania niż pełny modal ze specyfikacji.

**Przeciw:** Odbiega od literalnej specyfikacji (brak trzeciej ścieżki „czysty atak bez wypowiedzenia") · nadal wymaga podglądu kar przy opcji 2 · może mylić („wypowiedz i atakuj" vs karencja N1).

## Rekomendacja

**Litera:** A — specyfikacja i Poradnik zakładają trzy ścieżki; pełny modal to jedyny wariant domykający N1 zgodnie z dokumentacją.

## Odpowiedź Macieja

> **A** — Pełny modal trzyopcjiowy (2026-07-27)

## Wdrożenie

- `gra/src/ui/diplomacyAudience.ts` — `showWarConsentModal` (Wypowiedz wojnę / Atakuj bez wypowiedzenia / Anuluj) + podgląd kar N1+N2+N3
- `gra/src/main.ts` — `withPlayerWarConsent` (mapa) + audiencja akcja 11 (tylko wypowiedzenie)
- `gra/src/game/diplomacy-penalty-preview.ts` — bez zmian (już gotowy)
- Warstwa: 🟡
