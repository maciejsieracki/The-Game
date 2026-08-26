# 00-dispatch — R-REKRUTACJA-SUROWIEC-BEZ-UPKEEP-Q1

STATUS: DISPATCHED
TEMAT: R-REKRUTACJA-SUROWIEC-BEZ-UPKEEP-Q1
GOAL: Rekrutacja sprawdza wyłącznie koszty zakupu jednostki; przyszłe utrzymanie nie blokuje zakupu i jest rozliczane dopiero w następnej turze wraz z istniejącymi konsekwencjami niedoboru.
KRYTERIA KOŃCA: potwierdzony punkt regresu; rozdzielenie affordability recruit vs upkeep; parytet gracz/AI/MP; UI pokazuje właściwe wymagania; testy graniczne i negatywne; save/load/migracja jeśli dotyczy; tsc; Evaluator; Final Control; integracja; READY_FOR_DEPLOY.
ALLOWLISTA: gra/src/ui/cityPanel.ts; gra/src/game/production.ts; gra/src/game/turn-economy.ts; gra/src/game/economy.ts; gra/src/game/main.ts; właściwe pliki rekrutacji/jednostek ujawnione przez recon; ewentualne celowane testy gra/tools/; artefakty runu.
IZOLACJA: Civ-clean-main-2026-08-20, baza HEAD 47cdca15, Fala 300; nie pracować w starym katalogu Civ.
PLAN TESTÓW: recon affordability i upkeep; test wystarczających surowców przy niewystarczającym upkeep; test normalnego braku zasobu rekrutacyjnego; parytet AI/MP; następna tura i szkody niedoboru; tsc.
ABC: brak — właściciel podał kontrakt literalnie.
DEPLOY/PUSH: NIE WYKONANO
