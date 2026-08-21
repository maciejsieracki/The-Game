# 00-dispatch — R-AUTOBOT-CAPACITY-LEDGER-VS-THREAD-LIMIT-Q1

STATUS: DISPATCHED (PROCESS DIAGNOSTIC)
TEMAT: R-AUTOBOT-CAPACITY-LEDGER-VS-THREAD-LIMIT-Q1
GOAL: Zmierzyć rozjazd między ledgerem a rzeczywistą pojemnością wątków narzędzia oraz ustalić, czy Watchdog zajmuje wspólny limit.
KRYTERIA KOŃCA: kontrolowana próba przy znanej liczbie aktywnych agentów; zapis accepted/rejected z timestampem; obserwacja czasu od close do faktycznego zwolnienia; rozdzielenie statusu ledgerowego i wykonawczego; reguła rezerwacji slotu uwzględniająca Watchdog; brak duplikatu przy statusie nieznanym.
ALLOWLISTA: artefakty procesu w `dyspozycje/autobot/**`, rejestr i ewentualnie reguły/watchdog; bez `gra/**`, bez integracji, commita, deployu i pushu.
IZOLACJA: Civ-clean-main-2026-08-20, baza HEAD 47cdca15, Fala 300; testy narzędzia wyłącznie na jawnie oznaczonych agentach.
PLAN TESTÓW: snapshot aktywnych agentów; próba dispatchu po ledgerowym close; próba po faktycznym `close_agent`; pomiar opóźnienia; próba z Watchdogiem aktywnym; klasyfikacja `completed`, `interrupted`, `timeout`, `not_found`, `BLOCK`, `CLOSED`.
ABC: brak — problem procesu, chyba że narzędzie zwróci trwałą niedostępność.
DEPLOY/PUSH: NIE WYKONANO
