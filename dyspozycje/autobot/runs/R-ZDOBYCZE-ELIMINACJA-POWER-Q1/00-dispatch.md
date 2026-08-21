# 00-dispatch — R-ZDOBYCZE-ELIMINACJA-POWER-Q1

STATUS: DISPATCHED
TEMAT: R-ZDOBYCZE-ELIMINACJA-POWER-Q1
GOAL: Popup eliminacji i stan gry mają prawidłowo przejmować oraz pokazywać Skarbiec, Naukę, technologie i Power pokonanego państwa, w tym przypadki niezerowe.
KRYTERIA KOŃCA: snapshot przed eliminacją; poprawny transfer; popup; testy niezerowe/zerowe i kolejność zdarzeń; save/load, jeśli dotyczy; Evaluator.
ALLOWLISTA: gra/src/ui/*elimination*; właściwy plik logiki eliminacji/zdobyczy; gra/src/game/power*; gra/src/main.ts tylko po reconie; celowane testy gra/tools; artefakty runu.
IZOLACJA: Civ-clean-main-2026-08-20, HEAD 47cdca15, Fala 300.
PLAN TESTÓW: test zdobyczy Skarbca/Nauki/tech/Power; zero-value; eliminacja ostatniego miasta; kolejność snapshot→transfer→popup.
ABC: brak na etapie reconu; nie zgadywać kontraktu Power, jeśli kod/decisions są sprzeczne.
DEPLOY/PUSH: NIE WYKONANO
