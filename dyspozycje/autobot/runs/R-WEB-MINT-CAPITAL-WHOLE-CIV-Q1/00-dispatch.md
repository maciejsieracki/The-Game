# R-WEB-MINT-CAPITAL-WHOLE-CIV-Q1 — Mennica w stolicy działa na całą cywilizację

DOMAIN: GAME | Operator HAIKU 5.5 | runda 1/5 | BAZA = origin/main 35f601ae304471593c4921a61bfecbddbb9de14a. Wdrożenie jako kolejna FALA na ROBOCZĄ po FC (zmiana gra/src).

## Decyzja właściciela (2026-11-25, odpowiedź literą A)
Obowiązuje przewodnik gracza: docs/PORADNIK-GRACZA/08-ekonomia-imperium.md §49.3b (l.~71) — bonus Mennicy (budynek stolicy) działa „dla **całej** cywilizacji”. Kod dziś tego nie robi: test gra/tools/trade-routes-income-test.cjs sekcja H2e („one capital Mint raises tax cash in another city”) jest czerwony (133 passed / 1 failed).
## Zadanie
1. Ustal w gra/src, gdzie liczony jest dochód podatkowy/ bonus Mennicy (grep Mennica/Mint w gra/src i gra/data), i dlaczego bonus nie obejmuje innych miast cywilizacji (git log -S ograniczony do gra/src gra/data; powiązane: MENNICACLAY FALA 879, Q11 „Mennica delta 0”).
2. Napraw tak, by Mennica w stolicy podnosiła dochód podatkowy WSZYSTKICH miast tej cywilizacji tak, jak opisuje przewodnik §49.3b (przeczytaj dokładną treść; nie zmieniaj wartości liczbowych bonusu — tylko zasięg). Nie dubluj bonusu (jedna Mennica stolicy = jeden bonus na miasto; kilka Mennic w stolicy niemożliwe). AI i gracz tą samą ścieżką.
3. Test trade-routes-income H2e ma przejść BEZ osłabiania asercji; dodaj asercje negatywne (cywilizacja bez Mennicy w stolicy nie dostaje bonusu; Mennica w mieście innym niż stolica nie działa na całą cywilizację, jeśli tak mówi przewodnik) i mutację (zawężenie bonusu do miasta lokalnego → H2e czerwony).
4. Zmiana wpływa na ekonomię — NIE zmieniaj nic poza zasięgiem; jeśli odkryjesz, że naprawa wymaga zmiany wartości/balansu → STOP, status DECISION_REQUIRED z jednym zdaniem konfliktu per wariant (bez proponowania rozwiązania), bez kodowania dalej.
## Allowlista
Pliki gra/src wskazane przez Twoje dochodzenie (minimalny zestaw, wypisz w raporcie), gra/tools/trade-routes-income-test.cjs, ewentualnie nowy gra/tools/mint-capital-whole-civ-test.cjs, dyspozycje/autobot/runs/R-WEB-MINT-CAPITAL-WHOLE-CIV-Q1/**.
## Zakazy: gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/, osłabianie lub usuwanie asercji (poza zakresem wprost opisanym niżej), git add -A, push, NOWE SESJE/ZADANIA/HARMONOGRAMY (spawn_task, create_session, create_trigger, send_later), run_in_background, git log -S nad całym repo bez ścieżki (zawiesza >120 s — zawężaj do gra/src gra/data gra/tools). Dysk >= 4 GB; po bramkach usuń gra/node_modules.
## Bramki
tsc 0; logic 213; tech-tree 20; research 33; unit-replace 21; combat 6; ai-test 297/0; era-war-pairing-alliance 19/0; ai-ai-alliance-surcharge ALL GREEN; testy ekonomii dotykające podatków/Mennicy (grep po gra/tools: mint, mennica, tax, podat) — wszystkie zielone lub wprost wyjaśnione (STARY-PIN wobec decyzji z 2026-11-25). Zacommituj i zwróć SHA.
## Binarne kryterium
H2e zielony bez zmiany asercji; nowy test zielony i czerwony po mutacji; bramki zielone; diff gra/src ograniczony do zasięgu bonusu.
