# R-WEB-DIPLO-DEALS-SENSIBLE-Q1 — dispatch (zlecenie ownera 2026-10-25)

STATUS: ZAREJESTROWANE (start dopiero po zintegrowaniu R-WEB-WAR-RULES-MULTIWAR-Q1; wspólne pliki dyplomacji z R-WEB-DIPLO-TICK-WAR-BRAKE-Q1 → sekwencyjnie po nim)
DOMAIN: GAME

GOAL: propozycje handlowe AI są sensowne i zawsze możliwe do rozpatrzenia przez gracza; opcja nowej gry wymusza rozpatrzenie oferty przed końcem tury.

## Wymagania ownera (dosłownie sprowadzone)
1. AI NIE proponuje deali ujemnych dla gracza w sensie „nie do zaakceptowania” (ujemny bilans, którego gracz nie może przyjąć). Propozycja ma być co najmniej na zerze (bilans ≥ 0 dla odbiorcy według tej samej konwencji co `diplomacy-ai-offer-balance.ts`), tak aby gracz mógł ją zaakceptować, zmodyfikować lub odrzucić.
2. Opcja w ekranie parametrów nowej gry (obok city-states, poziomów trudności itd.): „Wymagaj rozpatrzenia ofert handlowych przed końcem tury”. Domyślnie WŁĄCZONA, można wyłączyć. Włączona: dopóki gracz ma oczekującą ofertę handlową od AI, nie może zakończyć tury (zaakceptować / zmodyfikować / odrzucić). Wyłączona: stare zachowanie. Zapis gry przechowuje ustawienie; starsze zapisy = wyłączona.
3. Sens ofert: AI proponuje wymianę surowca/towaru tylko gdy (a) jej go BRAKUJE (niedobór), albo (b) ma duże nadwyżki jednego surowca i niedobór innego — wymiana nadwyżka↔niedobór. Brak niedoboru i brak nadwyżki = brak oferty. Oferta musi mieć zapisane uzasadnienie logiczne (pole `reason`), widoczne w teście.

## Kryteria końca
- Test: w N turach symulacji żadna oferta AI→gracz nie ma bilansu < 0; żadna oferta nie dotyczy surowca, którego AI nie potrzebuje i nie ma w nadwyżce.
- Test opcji: domyślnie ON w nowej grze, OFF → brak blokady; blokada tury przy oczekującej ofercie (ON) znika po akceptacji/odrzuceniu/modyfikacji; zapis/odczyt; integracja z `canPlayerInitiateEndTurn` i `healStaleEndTurnBlockers` (brak osieroconej blokady — uwaga na wcześniejszy deadlock).
- Parametry (progi niedoboru/nadwyżki) w JSON; flaga `DIPLO_SENSIBLE_DEALS_ENABLED`; OFF = hash jak baza; determinizm.
- Bramki regresji: diplomacy-*-test, endturn-deadlock 38/0+46/0, logic-test 213/213, ai-test 276/18, tsc, Vite build do katalogu tymczasowego (NIE npm run build/dev w repo).

## Założenia do potwierdzenia przez Evaluatora
- „Niedobór” = zapas surowca < zużycie na ~N tur (parametr, domyślnie 10) lub ujemny przyrost; „duża nadwyżka” = zapas > próg × zużycie.
- Oferty AI→AI nie podlegają blokadzie tury (tylko gracz).
