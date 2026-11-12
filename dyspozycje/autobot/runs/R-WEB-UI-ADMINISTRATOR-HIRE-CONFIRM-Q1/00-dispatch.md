# R-WEB-UI-ADMINISTRATOR-HIRE-CONFIRM-Q1 (GAME/UI, Sonnet)
Decyzja właściciela 2026-11-12: dodać okno potwierdzenia przy ZATRUDNIENIU administratora (zwolnienie już je ma; wzorzec: administratorPanel.ts, FALA 651).
GOAL: przed zatrudnieniem administratora miasta/ulepszeń krótkie potwierdzenie z kosztem (opłata) i bonusami; Anuluj nic nie zmienia; Potwierdź zatrudnia jak dziś. Zakaz zmiany kosztów/bonusów/zasad.
KRYTERIA: (1) test Chromium na realnym panelu: klik zatrudnij → okno; anuluj → stan bez zmian; potwierdź → zatrudniony; (2) skrypt live-verify-administrator-panel.cjs i administrator-panel-real-render-test rozszerzone (obsługa dialogu); (3) mutacja czerwieni; (4) tsc + 5 bramek; istniejące testy administratora zielone.
ALLIANCE/ALLOWLISTA: gra/src/ui/administratorPanel.ts, pomocnicze UI, testy w gra/tools, raport.
