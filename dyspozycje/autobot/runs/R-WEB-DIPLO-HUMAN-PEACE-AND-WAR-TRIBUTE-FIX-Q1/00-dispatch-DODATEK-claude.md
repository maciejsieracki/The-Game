# R-WEB-DIPLO-HUMAN-PEACE-AND-WAR-TRIBUTE-FIX-Q1 — dwa błędy dyplomacji z analizy wasalizacji/pokoju między graczami: pokój bez wojny (P21c) i cykliczny trybut w wojnie z modala (P17b)

DOMAIN: GAME (naprawa błędów; bez pytań do właściciela — to niespójności z regułami już istniejącymi w kodzie) | Operator HAIKU 5.5 | runda 1/5 | BAZA = origin/main d629d2d4e69847e7f1522fb9a32dbdfe56a45c4a. Wdrożenie jako FALA po FC PASS (zmiana gra/src).

## Kontekst
dyspozycje/analizy/WOJNA-WASALIZACJA-I-POKOJ-MIEDZYLUDZKI-2026-11-26.md (§3.3, §3.4, §6–7; probe gra/tools/war-end-vassal-human-probe-test.cjs):
(P21c) pokój/rozejm między dwoma fotelami ludzkimi (hotseat) NIE sprawdza stanu wojny: proposeToHuman/onPropose (gra/src/main.ts ~23003, ~23165), respondToHumanProposal (~23035/23057), finalizePeaceTreatyBetween (~12957–12996: ustawia status 'pokoj' i startPeaceTreatyLock dla dowolnej pary). AI odrzuca taką propozycję („Pokój — brak trwającej wojny”, gra/src/game/diplomacy-proposals.ts:1583–1587). Skutek: gracz może „zawrzeć pokój” z kimś, z kim nie jest w wojnie (np. przy sojuszu/neutralności nadpisuje relację i zakłada blokadę).
(P17b) modal „Zaproponuj trybut” (gra/src/ui/diplomacyNegotiationModal.ts ~425–431, case 8, tributeMode 'offer') w WOJNIE wysyła goldPerTurn bez goldOnce, więc silnik (diplomacy-proposals.ts ~2191, ~3178; diplomacy-war-gates.ts:10) tworzy trwały traktat Wasalizacja, a reguła UI w wojnie to tylko reparacje jednorazowe (gra/src/ui/diplomacy-locks.ts ~333; koszyk gra/src/ui/diplomacyTradeBasket.ts ~1338 ustawia goldOnce = goldPerTurn i trafia w gałąź jednorazową ~2202).
## Zadanie
1. P21c: dodaj w silniku (proponowanie i akceptacja pokoju/rozejmu między fotelami ludzkimi i w finalizePeaceTreatyBetween jako obrona w głębi dla par ludzkich) sprawdzenie, że para jest w wojnie (status 'wojna'); wzór komunikatu jak diplomacy-proposals.ts:1583–1587; UI przycisk/etykieta dla pary bez wojny — jeśli istnieje wspólny mechanizm blokad (diplomacy-locks.ts), użyj go; NIE zmieniaj bramki 10 tur (osobna decyzja właściciela) ani zachowania par z AI.
2. P17b: w modalu ustaw goldOnce dla trybutu w wojnie tak jak koszyk (jedna reguła; sprawdź, czy poza wojną cykliczny trybut pozostaje dozwolony — bez zmian).
3. Testy behawioralne (nie tylko regex): evaluateProposal / finalizePeace… (przez port do testów jak w gra/tools/war-rules-*) — czerwone na bazie, zielone po naprawie, mutacje czerwone; para z AI bez zmian; hotseat w wojnie bez zmian.
4. Zapis/wczytanie: bez zmian formatu.
## Allowlista
gra/src/main.ts (TYLKO miejsca wskazane), gra/src/ui/diplomacyNegotiationModal.ts, gra/src/ui/diplomacy-locks.ts (tylko jeśli potrzebne), gra/src/game/diplomacy-proposals.ts (tylko jeśli potrzebne), nowe gra/tools/diplo-human-peace-no-war-test.cjs i gra/tools/diplo-war-tribute-once-test.cjs, testy-piny wskazane grepem (jawne przepięcia), dyspozycje/autobot/runs/R-WEB-DIPLO-HUMAN-PEACE-AND-WAR-TRIBUTE-FIX-Q1/**.
## Zakazy
gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/, osłabianie asercji, zmiana bramki 10 tur i zachowania par z AI, git add -A, push, spawn_task/create_session/create_trigger/send_later, parametr run_in_background narzędzia Bash. Dysk >= 4 GB; po bramkach usuń gra/node_modules. Commituj wcześnie.
## Bramki
tsc 0; logic 213; tech-tree 20; research 33; unit-replace zielone; combat 6; ai-test 297/0; war-rules-multiwar-main-guard 21/0; hotseat e-source 77/0, B 48/0, D 46/0, E 24/0; hud-me-literal-zero zielony; diplo-world-news zielony; truce-end-war-notice zielony; bramki-tmpdir PASS=18; testy gra/tools/*peace*test.cjs, *tribut*test.cjs, *vassal*test.cjs, *diplo*test.cjs bez live. Zacommituj i zwróć SHA.
## Binarne kryterium
Pokój hotseat bez wojny odrzucony z komunikatem (silnik + UI), pokój w wojnie bez zmian, para z AI bez zmian; trybut w wojnie z modala jednorazowy jak z koszyka; testy czerwone na bazie / zielone po / mutacje czerwone; bramki zielone.
