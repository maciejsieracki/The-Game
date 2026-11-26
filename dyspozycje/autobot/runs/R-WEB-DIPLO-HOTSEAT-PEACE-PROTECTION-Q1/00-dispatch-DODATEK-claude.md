# DODATEK (runda 1/5, Operator HAIKU 5.5; BAZA = origin/main w chwili startu — podana w args.cand)
## Tropy
- Luka P21b opisana w dyspozycje/analizy/WOJNA-WASALIZACJA-I-POKOJ-MIEDZYLUDZKI-2026-11-26.md: pokój między fotelami w main.ts (okolice interHumanDiplomacyInbox / respondToHumanProposal / proposeToHuman / finalizePeaceTreatyBetween) nie ustawia ochrony 10 tur, którą ma pokój z AI.
- Znajdź, jak pokój z AI ustawia 10 tur (peaceUntilTurn w diplomacyPairMeta, isPeaceLockedBetween, finalizePeaceTreatyBetween; parametr 10 z danych/params — NIE wpisuj 10 na sztywno jeśli istnieje parametr). Podepnij tę samą ochronę dla pary człowiek↔człowiek (wszystkie ścieżki zawarcia pokoju hotseat), z wyjątkiem pokoju kończącego wojnę wymuszoną/rozejmu jeśli reguły AI też go wyłączają (opisz).
- Ochrona nie może blokować wymuszonej wojny buntu (force=true, ownerDeclareWarOn) — tak jak dziś.
## Test
gra/tools/hotseat-peace-protection-test.cjs: pokój hotseat ustawia 10 tur (źródłowo + behawioralnie, o ile rdzeń da się wydzielić do czystej funkcji), wypowiedzenie wojny w tym oknie odrzucone, po 10 turach dozwolone; mutacja czerwona (zdjęcie ustawienia ochrony). Istniejące hotseat-etap6d-* (B 48/0, D 46/0, E 24/0, source E 77/0), diplo-human-peace-no-war 13/0, diplo-war-tribute-once 8/0 zostają zielone.
## Allowlista
gra/src/main.ts (TYLKO ścieżki pokoju hotseat), ewentualnie gra/src/game/diplomacy-*.ts pliki, które już ustawiają ochronę, nowy gra/tools/hotseat-peace-protection-test.cjs, dyspozycje/autobot/runs/R-WEB-DIPLO-HOTSEAT-PEACE-PROTECTION-Q1/**.
## Zakazy
gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/, zmiana wartości balansu poza zakresem, osłabianie asercji (zmiana asercji dozwolona WYŁĄCZNIE dla testów kodujących stary kontrakt — wypisz je w raporcie z uzasadnieniem), git add -A, push, spawn_task/create_session/create_trigger/send_later, run_in_background w Bash. Dysk >= 4 GB; usuń node_modules po bramkach.
## Bramki ogólne
tsc 0; logic 213; tech-tree 20; research 33; unit-replace zielone; combat 6; ai-test 297/0; war-rules-multiwar-main-guard 21/0; testy tematu; nowy test z mutacją czerwoną na rdzeniu. Zacommituj i zwróć SHA.
## Binarne kryterium
Pokój między fotelami ustawia 10 tur ochrony; wojna w oknie odrzucona; test z mutacją czerwoną; bramki zielone.
