# R-WEB-WAR-LIMIT-BYPASS-Q1 — wojna po rozejmie i wojna wymuszona omijają limit wojen naturalnych

DOMAIN: GAME (naprawa błędu) | Operator HAIKU 5.5 | runda 1/5 | BAZA = origin/main b610e71a62f68c5c3052d456facc0deebd86af72. Wdrożenie jako kolejna FALA po FC.

## Kontekst
Limit 1 wojny naturalnej na cywilizację (FALA 863; poprawka sojuszników FALA 896; gra/src/game/diplomacy-war-limit.ts warLimitAllows; main.ts warLimitPermits ~26068). W raportach WARLIM (runs/R-WEB-WAR-LIMIT-AI-NATURAL-VIOLATION-Q1/10-operator-claude.md i 50-final-control) wskazano dwie ścieżki poza bramką: (1) declareWarAfterTruce (main.ts ~13104): wypowiada wojnę po rozejmie bez bramki limitu i bez typu wojny; (2) triggerRebelProtectionWarConsequence → ownerDeclareWarOn(force=true) (przejęcie miasta/bunt) omija limit.
## Zadanie
1. Ustal dokładną regułę limitu z rejestru (FALA 863, 896, decyzje właściciela o wojnach naturalnych/wymuszonych/epoki; dyspozycje/autobot/runs/*WAR-LIMIT*): co wolno ponad limit (wojna epoki? obrona? przejęcie miasta?). Zacytuj w raporcie.
2. declareWarAfterTruce: ustal, czy wojna po rozejmie to wojna naturalna (liczona do limitu) wg reguły; jeśli TAK (reguła mówi, że limit dotyczy każdej wojny naturalnej i rozejm nie jest wyjątkiem) — dodaj bramkę limitu (jak przy zwykłym wypowiedzeniu) i typ wojny; jeśli reguła nie rozstrzyga lub rozejm wygasający to inny mechanizm (np. wznowienie wcześniej wypowiedzianej wojny, która już była policzona) — opisz i nie zmieniaj.
3. force=true (bunt/przejęcie miasta): TYLKO opisz skutek (ile wojen ponad limit powstaje, w jakich sytuacjach) — to wątpliwość o grze; zwróć DECISION_REQUIRED z jednym zdaniem konfliktu per wariant (A: wyjątek zostaje, B: limit obowiązuje także tu), bez kodowania tej części.
4. Test behawioralny dla poprawki z pkt 2 (asercja negatywna: druga wojna po rozejmie przy pełnym limicie jest odrzucona) z mutacją czerwoną na rdzeniu logiki; bieg weryfikacyjny nie jest wymagany (zmiana lokalna), jeśli niewykonalny — NIE ZMIERZONO z powodem.
## Allowlista
gra/src/game/diplomacy-war-limit.ts, gra/src/main.ts (TYLKO declareWarAfterTruce i bramka), nowy gra/tools/war-limit-after-truce-test.cjs, dyspozycje/autobot/runs/R-WEB-WAR-LIMIT-BYPASS-Q1/**.
## Zakazy
gra-robocza/, gra-kanon/, dyspozycje/WERSJE.md, manifest, rust-port/, npm run build/dev w gra/, zmiana wartości balansu (limit 1 zostaje), osłabianie asercji, git add -A, push, spawn_task/create_session/create_trigger/send_later, parametr run_in_background narzędzia Bash. Dysk >= 4 GB; usuń node_modules.
## Bramki
tsc 0; logic 213; tech-tree 20; research 33; unit-replace zielone; combat 6; ai-test 297/0; era-war-pairing-alliance 19/0; war-rules-multiwar 57/0; war-rules-multiwar-main-guard 21/0 (okna tekstowe main.ts — sprawdź po zmianie); war-limit-ai-natural 15/0; diplomacy-war-limit-unit 57/0; alliance-war-obligation 14/0. Zacommituj i zwróć SHA.
## Binarne kryterium
Reguła zacytowana; declareWarAfterTruce zgodna z regułą (bramka + test negatywny + mutacja czerwona) albo opis, dlaczego nie zmieniać; force=true opisany z DECISION_REQUIRED; bramki zielone.
