# R-WEB-CLEAN-DEAD-LEDGER-PROBE-Q1 — usunąć martwą sondę ledgerAuditE3c* z main.ts

DOMAIN: GAME (sprzątanie kodu, bez zmiany zachowania) | Operator HAIKU 5.5 | runda 1/5 | BAZA = origin/main d97e825bb14a4e6953e08d48a77483ac5a196903. Wdrożenie jako kolejna FALA po FC (zmiana gra/src) — zachowanie gry bez zmian.

## Kontekst
Temat OLD-728-746 (runs/R-WEB-TEST-DEBT-OLD-728-746-Q1/10-operator-claude.md, rejestr FALA 740): w gra/src/main.ts sonda ledgerAuditE3c* (deklaracje ok. l. 10502–10503, odczyt ok. l. 33176) nigdy nie jest przypisywana ani inkrementowana; jedyny konsument gra/tools/resource-ledger-live-measure.cjs:175 zawsze dostaje 0 / []. To martwy kod (FALA 740 „martwa sonda”).
## Zadanie
1. Sprawdź grepem po całym gra/src i gra/tools, że ledgerAuditE3c* nie ma żadnego innego zapisu/odczytu (w tym hak civTest, window.*, ?civTest=1, zapisy gry); wypisz wszystkie trafienia.
2. Usuń deklaracje i odczyt z main.ts oraz odczyt z resource-ledger-live-measure.cjs:175 (zastąp pomiar konsumenta wartością „n/d” albo usuń pole, tak by narzędzie dalej działało); zero zmian zachowania gry (zapisy gry nie mogą zawierać tej sondy — sprawdź round-trip zapisu test save-load zielony).
3. Test strażnik (np. rozszerzenie istniejącego testu źródłowego lub nowy gra/tools/dead-ledger-probe-absent-test.cjs): w main.ts nie ma ledgerAuditE3c; mutacja (przywrócenie deklaracji) → czerwony.
## Allowlista
gra/src/main.ts (TYLKO linie sondy), gra/tools/resource-ledger-live-measure.cjs, nowy gra/tools/dead-ledger-probe-absent-test.cjs, dyspozycje/autobot/runs/R-WEB-CLEAN-DEAD-LEDGER-PROBE-Q1/**.
## Zakazy
gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/, zmiana zachowania gry, osłabianie asercji, git add -A, push, spawn_task/create_session/create_trigger/send_later, run_in_background, git log -S nad całym repo bez ścieżki. Dysk >= 4 GB; po bramkach usuń gra/node_modules.
## Bramki
tsc 0; logic 213; tech-tree 20; research 33; unit-replace zielone; combat 6; ai-test 297/0; testy save-load (grep tools: save-load, resource-ledger) zielone; war-rules-multiwar-main-guard 21/0 i hotseat-etap6d 77/0 (okna tekstowe w main.ts — sprawdź po zmianie). Zacommituj i zwróć SHA.
## Binarne kryterium
Sonda usunięta bez zmiany zachowania; test strażnik czerwony po mutacji; testy tekstowe main.ts zielone; bramki zielone.
