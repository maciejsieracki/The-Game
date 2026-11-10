# R-WEB-DIPLO-PEACE-AI-AI-NONNEGATIVE-BALANCE-Q1 — dispatch (2026-11-09)

GOAL: Decyzja właściciela (ABC D1, odpowiedź własna): „Jeżeli [bilans pokoju] jest ujemny dla gracza, to jest do przyjęcia przez gracza, ale nie może być ujemny dla innej cywilizacji AI.” Czyli: (1) pokój proponowany graczowi przez AI zostaje akceptowalny nawet przy ujemnym bilansie gracza (bez zmian); (2) pokój/rozejm między DWIEMA cywilizacjami AI (AI↔AI) nie może zostać zawarty/zaakceptowany, jeśli bilans (PW) dla którejkolwiek z tych AI jest ujemny.
BAZA: main po FALA 567 (R-WEB-DIPLO-PEACE-BALANCE-ACCEPT-DIAG-Q1, SHA 512401eac w main). Operator: SONNET 5.5 (uzasadnienie: dyplomacja AI, wiele ścieżek, zależność od diagnozy).
ZAKRES:
1. Diagnoza w raporcie: ścieżki zawierania pokoju/rozejmu AI↔AI (diplomacy-proposals.ts, ai.ts, diplomacyAcceptanceBalance.ts ~366, diplomacy-war-peace-profile.ts): czy akceptacja po stronie AI ocenia bilans PW dla siebie; gdzie wyjątek „pokój zawsze do przyjęcia” (decyzja 2026-09-07) działa dla AI-odbiorcy; czy AI↔AI może dziś zawrzeć pokój na minus.
2. Naprawa: odbiorca-AI (i proponent-AI) nie akceptuje pokoju z ujemnym bilansem własnym. Wyjątek gracza zostaje nietknięty. Reguła 20% przewagi (FALA 567) bez zmian. Progi tylko w plikach danych.
3. Testy: nowy `gra/tools/diplo-peace-ai-ai-nonnegative-test.cjs` (AI↔AI ujemny→odmowa, nieujemny→zgoda, gracz ujemny→zgoda, brak regresji R3/R5); uruchom diplo-peace-balance-accept, war-peace-gate/sim, truce-r1, ai-test, logic-test.
ALLOWLISTA: gra/src/game/diplomacy-*.ts, gra/src/game/ai.ts, gra/src/ui/diplomacyAcceptanceBalance.ts (jeśli tam), gra/data/diplomacy-war-peace-params.json, nowy test, runs/<ID>/. Zakaz: WERSJE.md, gra-robocza/, build/dev, git add -A, push/deploy.
