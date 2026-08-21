# 00-dispatch — R-PROC-AGENT-CLEANUP-QUEUE-Q1

STATUS: DISPATCHED (PROCESS AUDIT)
TEMAT: R-PROC-AGENT-CLEANUP-QUEUE-Q1
GOAL: Zamykać zakończonych subagentów i nie blokować nimi kolejki.
KRYTERIA KOŃCA: status każdego znanego agenta sprawdzony; zakończeni zamknięci; aktywny agent pozostawiony do raportu; brak usuwania aktywnej pracy.
ALLOWLISTA: tylko artefakty audytu i statusy delegacji; bez zmian kodu gry.
IZOLACJA: bieżąca sesja AutoBot i Civ-clean-main-2026-08-20.
DEPLOY/PUSH: NIE WYKONANO
