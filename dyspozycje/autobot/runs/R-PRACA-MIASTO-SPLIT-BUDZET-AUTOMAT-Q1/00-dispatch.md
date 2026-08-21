# 00-dispatch — R-PRACA-MIASTO-SPLIT-BUDZET-AUTOMAT-Q1

STATUS: DISPATCHED
TEMAT: R-PRACA-MIASTO-SPLIT-BUDZET-AUTOMAT-Q1
GOAL: Rozdzielić nadrzędny podział zebranego budżetu od trybu automatyzacji ulepszeń; usunąć błędną blokadę/opis 0–50% tam, gdzie właściwe sterowanie trybem pracy jest 0–100%.
KRYTERIA KOŃCA: recon obu kontrolek; jednoznaczny kontrakt UI; brak sprzecznych suwaków; test wiring i wartości; brak regresji limitu miejskiego; Evaluator.
ALLOWLISTA: gra/src/ui/cityPanel.ts; gra/src/ui/empireDetailPanel.ts; gra/src/ui/buildModeHud.ts; właściwe pliki automatyzacji ulepszeń; celowane testy gra/tools; artefakty runu.
IZOLACJA: Civ-clean-main-2026-08-20, HEAD 47cdca15, Fala 300.
PLAN TESTÓW: recon, test 0/50/100 i tryb automatyzacji, UI render/wiring, testy sąsiednie.
ABC: jeśli po reconie pozostaną dwie realne interpretacje, przygotować ABC.
DEPLOY/PUSH: NIE WYKONANO
