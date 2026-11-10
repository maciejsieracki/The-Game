# R-WEB-DIPLO-LABELS-RECRUITS-UNITS-CITIZENS-WAR-NOTE-Q1 — dispatch (2026-11-10) — START PO deployu CITREC (FALA 592)
GOAL (decyzje właściciela ABC 2026-11-10, trzy drobne zmiany tekstu dyplomacji, bez zmiany mechaniki):
1. Karta listy dyplomacji: wiersz „Rekruci” z dopiskiem „jedn.” (np. „Rekruci: 12 / 31 jedn.”) + tooltip z przeliczeniem (Manpower ÷ koszt jednostki epoki, ten sam wzór co rekrutEkw); audiencja (surowy Manpower) bez zmian.
2. „Ludność” → „Obywatele” (karta listy i audiencja; ta sama liczba; sprawdzić teksty w diplomacy-display.ts / diploListHud.ts / diplomacyAudience.ts i testy).
3. Dopisek „(limit wojenny 29)” przy wierszu Relacja doprecyzować, by nie sugerował limitu samego Respektu (np. „etykieta Wrogi: limit wojenny”); tooltip bez zmian merytorycznych; stała WAR_RELATION_SCORE_CAP zamiast liczby.
Operator HAIKU 5.5. ALLOWLISTA: gra/src/game/diplomacy-display.ts, ui/diploListHud.ts, ui/diplomacyAudience.ts, ui/diplomacyPanel.ts, testy diplomacy*, runs/<ID>/. Test z Chromium (render karty listy i audiencji) lub NIE_ZMIERZONO. LEDGER (REPIN Rust UI). Zakaz: WERSJE.md, gra-robocza/, build/dev, git add -A, push/deploy.
