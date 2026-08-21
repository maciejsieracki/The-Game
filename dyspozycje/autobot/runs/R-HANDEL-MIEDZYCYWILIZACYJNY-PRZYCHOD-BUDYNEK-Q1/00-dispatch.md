# 00-dispatch — R-HANDEL-MIEDZYCYWILIZACYJNY-PRZYCHOD-BUDYNEK-Q1

STATUS: DISPATCHED (RECON)
TEMAT: R-HANDEL-MIEDZYCYWILIZACYJNY-PRZYCHOD-BUDYNEK-Q1
GOAL: Potwierdzić istniejącą mechanikę przychodu z handlu między cywilizacjami, moment naliczenia, bramki technologiczne/budynkowe, warunki umowy, parytet stron i save/load; wskazać, czy potrzebna jest zmiana kodu.
KRYTERIA KOŃCA: raport Operatora z konkretnymi plikami/liniami i formułą przychodu; rozróżnienie handlu lądowego i morskiego; warunki Targowisko/Port/technologia/umowa; test lub dowód momentu naliczenia; Evaluator reconu; brak implementacji bez osobnego zakresu.
ALLOWLISTA: tylko artefakty runu; odczyt `gra/src/game/trade-routes.ts`, `gra/src/game/turn-economy.ts`, danych budynków/technologii i save/load; ewentualny celowany test wyłącznie po uzasadnieniu w raporcie.
IZOLACJA: Civ-clean-main-2026-08-20, baza HEAD 47cdca15, Fala 300; nie pracować w starym katalogu Civ.
PLAN TESTÓW: recon ścieżki utworzenia trasy, naliczenia w turze, warunków budynku/umowy, parytetu player/AI i save/load; testy istniejące tylko jeśli są już przeznaczone do tej mechaniki.
ABC: brak dla reconu; ewentualne AI↔AI lub zmiana balansu wymaga osobnego ABC.
DEPLOY/PUSH: NIE WYKONANO
