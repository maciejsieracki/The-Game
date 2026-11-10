# R-WEB-UI-EMPIRE-RECRUIT-PANEL-RECRUIT-ALL-Q1 — dispatch (2026-11-09)

GOAL (zgłoszenie właściciela + zrzut zbiorczego panelu rekrutacji „Rekruci: dostępne 750,5k”): w zbiorczym panelu rekrutacji cywilizacji (wcześniejszy temat R-WEB-UI-EMPIRE-RECRUIT-PANEL-Q1):
 1. Domyślna liczba jednostek do rekrutacji przy każdej pozycji = 0 (dziś 1; na zrzucie np. Procarz 4).
 2. Gracz ustawia przyciskami +/− (lub polem) ile jednostek chce zrekrutować dla każdego typu jednostki; rozkład po miastach jak dotąd (równomierny / znaczniki „+” per miasto w danych miastach).
 3. JEDEN przycisk „Rekrutuj wszystkie” na SAMEJ GÓRZE i JEDEN na SAMYM DOLE panelu: po kliknięciu rekrutuje wszędzie (we wszystkich miastach, gdzie zaznaczono jednostki „plusikiem”) wszystkie pozycje, których ustawiona liczba > 0 — bez klikania „Rekrutuj” przy każdej pozycji osobno. Przyciski przy pozycjach mogą zostać (rekrutacja pojedynczego typu).
 4. Po rekrutacji liczniki wracają do 0; brak zasobów/rekrutów → komunikat po polsku które pozycje nie przeszły i dlaczego (bez surowych id); częściowy sukces nie cofa udanych rekrutacji. Przycisk nieaktywny, gdy suma = 0.
 5. Zgodność z kosztem rekrutacji (pieniądz + surowiec z puli państwa) i limitem rekrutów; ta sama ścieżka rekrutacji co przycisk pojedynczy (brak duplikacji logiki).
BAZA: origin/main (FALA 571+). Operator: HAIKU 5.5 (UI, wzorzec istnieje).
ZAKRES: diagnoza panelu (szukaj „Rekruci: dostępne”, empireRecruitPanel / recruit panel w gra/src/ui, main.ts), zmiana domyślnej wartości, dodanie dwóch przycisków i logiki „rekrutuj wszystkie”, test `gra/tools/empire-recruit-all-test.cjs` (domyślnie 0; ustaw 3 pozycje; „wszystkie” rekrutuje tylko >0; limity; reset; brak surowca → częściowy), regresje istniejących testów panelu rekrutacji. Weryfikacja wizualna w Chromium jeśli dostępny, inaczej NIE_ZMIERZONO jawnie.
ALLOWLISTA: gra/src/ui/*recruit*.ts, gra/src/main.ts (tylko podpięcie), nowy test, runs/<ID>/. Zakaz: WERSJE.md, gra-robocza/, build/dev, git add -A, push/deploy. Ignoruj pytania właściciela z innych tematów pojawiające się w kontekście.
