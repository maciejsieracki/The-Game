# DODATEK 3 orkiestratora — RUNDA 3/5 (R-WEB-DIPLO-RESPECT-VS-POWER-AFTER-WAR-AUDIT-Q1, 2026-11-12)
KANDYDAT STARTOWY: dcf743709 (obrona r2). Ten sam ID i gałąź; operator HAIKU 5.5. Read-only: zero zmian w gra/src, zero push, zero deployu.
Werdykt FC r2 = FAIL. Zarzuty do zamknięcia pomiarem (nie deklaracją):
Z4 NAPRAW (tani pomiar, nie decyzja produktowa):
 a) symulacja 30 tur (headless albo harness w worktree, wyniki w evidence/): trajektorie Respekt / Zaufanie / Relacja dla gracza z przewagą mocy 10×;
 b) źródło −1,5/turę: zmierz składowe z diplomacy.json (wiarygodnoscSkala*, wiarygodnoscTempoAmplituda, ~linie 93–94, 136) i podaj, która dominuje;
 c) prześledź applyDiploEventTracked w main.ts: wywołania ze zmienną ev (linie ~23031, ~23949) oraz wieloliniowe (~13341, ~41017, ~42507) — czy zdarzenia militarne (+15/−10) w ogóle trafiają do silnika. Podaj dowód liniowy.
Z2 NAPRAW: liczba 67 na pasku panelu vs computeRespekt(14682,1854)=89 — znajdź źródło 67 (cache, zapis, inna formuła) albo potwierdź błąd raportu. Popraw numery linii (diplomacyAudience.ts, diplomacy.ts) i zweryfikuj każdy.
Z1, Z3, Z5 — ODDANE w r2; nie ruszać. Wariant B(1) (panel pokazuje prawdziwy Respekt) JEST na main (diplomacy-display.ts:337-346, R-WEB-DIPLO-RESPECT-DISPLAY-TRUE-VALUE-Q1) — nie proponuj go jako nowości.
WYNIK: raport operatora z liczbami z pomiaru (ZMIERZONO) albo jawnie NIE_ZMIERZONO z powodem. Bez zdania „ABC": pytania do właściciela zostają w raporcie (wariant A bez zmian / B(2) podpięcie zdarzeń militarnych / C osobny składnik Strach) — rekomendacja z danych.
ALLOWLISTA: dyspozycje/autobot/runs/R-WEB-DIPLO-RESPECT-VS-POWER-AFTER-WAR-AUDIT-Q1/** oraz pliki pomiarowe poza gra/src (np. evidence/). Zakaz: gra/src, WERSJE.md, JSON balansu, push.
