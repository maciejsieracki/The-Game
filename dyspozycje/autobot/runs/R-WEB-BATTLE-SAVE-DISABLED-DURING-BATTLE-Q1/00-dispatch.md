# R-WEB-BATTLE-SAVE-DISABLED-DURING-BATTLE-Q1 (GAME/UI, Sonnet)
Decyzja właściciela 2026-11-12: zapis możliwy TYLKO poza bitwą. W trakcie bitwy (ręcznej, oblężenia, sceny bitwy) zapis gry jest wyłączony z czytelnym komunikatem (np. „Zapis niedostępny w trakcie bitwy”). Poza bitwą zapis bez zmian.
KRYTERIA: (1) zdiagnozować wszystkie ścieżki zapisu (przycisk, skrót, autozapis) i zablokować każdą w trakcie sceny bitwy; autozapis nie może zapisać stanu bitwy; (2) test Chromium: w bitwie zapis zablokowany + komunikat, po bitwie działa; (3) mutacja czerwieni; (4) tsc + 5 bramek; (5) zakaz zmian formatu zapisu.
ALLOWLISTA: main.ts (ścieżki zapisu), UI zapisu, testy w gra/tools, raport.
