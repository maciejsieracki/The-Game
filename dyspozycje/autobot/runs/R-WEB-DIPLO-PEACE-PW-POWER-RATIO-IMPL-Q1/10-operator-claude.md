# R-WEB-DIPLO-PEACE-PW-POWER-RATIO-IMPL-Q1 — raport Operatora (runda 2/5)

STATUS: BLOCK (runda częściowa: P1 zrobione i zielone; P2, P3, P4 NIE wykonane — patrz BLOKADY)
DOMAIN: GAME (dyplomacja, kod)
TEMAT: R-WEB-DIPLO-PEACE-PW-POWER-RATIO-IMPL-Q1
GOAL: pokój „P·r i P/r" wg POWER (r = moc silniejszej / słabszej, S = round(P·r), W = round(P/r), D = S − W dopłaca słabsza miastami, bez sufitu). Start r2: baza 5057586001032855a99bd1b94d82a9ae2b5743a3, następnie `git merge origin/main` (origin/main = ba2d59d17ceffb6c079ed6f9fedee9ee7a433696, bez konfliktów). Ta runda domyka P1 (wiring POWER w main.ts).

ZMIANY-COMMIT: commit na gałęzi autobot/R-WEB-DIPLO-PEACE-PW-POWER-RATIO-IMPL-Q1 (SHA w polu sha). Pliki:
- gra/src/main.ts (allowlista rozszerzona przez orkiestratora, tylko `diploProposalWarState`): dodane pola `powerPlayer` = `objectivePowerForOwner(ME())` i `powerOther` = `objectivePowerForOwner(drugiej strony)`. Konwencja: powerPlayer = moc GRACZA. Nic poza tą funkcją nie zmienione; ścieżka pokoju wymuszonego, okno i bramka „Zakończ turę" nietknięte.
- dyspozycje/autobot/runs/R-WEB-DIPLO-PEACE-PW-POWER-RATIO-IMPL-Q1/10-operator-claude.md (ten raport).
Pozostałe pliki z r1 (war-weariness.ts: peacePwPointsByPowerRatio; diplomacy-proposals.ts: bramka gracza; params pwPrzezMoc; test diplo-peace-pw-power-ratio-test.cjs) bez zmian w tej rundzie.

NIE ZMIENIONO: progów zmęczenia, cen (wearinessPeaceCashPn), ścieżki wymuszonego pokoju, zakazu surowców, miary (POWER, nie siła militarna), WERSJE.md, gra-robocza/gra-kanon.

TESTY:
- `npx tsc --noEmit` (gra/): exit 0, brak błędów wyjścia.
- `node tools/diplo-peace-pw-power-ratio-test.cjs`: 18 PASS / 0 FAIL (wzór U1–U7, integracja I1–I6, mutant M1, statyczna S1). Uwaga: test NIE sprawdza wiringu w main.ts (test jednostkowy na evaluateProposal z ręcznie podanymi mocami); wiring potwierdzony tylko przeglądem diffu (7 linii).
- Bramki (logic-test, tech-tree-test, research-test, unit-replace-test, combat-test): NIE ZMIERZONO w tej rundzie (runda niepełna; nie uruchamiane po częściowej zmianie).
- Build vite: NIE ZMIERZONO. Chromium: NIE ZMIERZONO.
- Asercje zaktualizowane: żadne.

BLOKADY (jawnie, NIE zrobione w r2):
1. P2 — ścieżka AI: planCityPeacePayment (kwota = D słabszej), runWarWearinessTick AI↔AI (war-weariness.ts ~333–400: `required = price.requiredPn` nadal bez podziału), planAiOfferOnTable / loserDespair, testy (c) i (d). Wymaga decyzji o kierunku D dla AI↔AI (kto jest słabszy w parze) i przeliczenia testów bilansu AI↔AI — zakres za duży na jedną rundę.
2. P3 — panel PW i tooltipy (diplomacyAcceptanceBalance.ts, diplomacyAudience.ts, diplomacyTipText.ts): moc obu stron, r, S, W, D, rabat, etykieta „(po rabacie relacji)". NIE zrobione.
3. P4 — Civpedia / wikiBundle (generator). NIE zrobione.
4. Test end-to-end „w grze" (P1) przez main.ts nie został dopisany — brak w tej rundzie.

UWAGI-DLA-ORKIESTRATORA:
(a) Konsekwencja wzoru: r = 1 ⇒ D = 0 (pokój bez dopłaty), także przy równej mocy — zgodnie z wzorem właściciela, nie zmieniano.
(b) Przykład liczbowy 6969/2611, P = 4320 → S = 11530, W = 1619, D = 9911 (test U3).
(c) Słabsza strona bez środków: bramka blokuje pokój z kwotą (test I4); pokój wymuszony przy 100% zmęczenia nietknięty.
(d) ZAŁOŻENIE: rabat relacji stosowany do D (effectiveTreatyPnRequired), zgodnie z rozstrzygnięciem zarzutu 5 w DODATKU 2. Przy słabych relacjach rabat jest duży (test I2b: D 12000 → 1200 PW po rabacie). Właściciel potwierdzi w grze.
(e) Pola warState są opcjonalne; brak ich = zachowanie sprzed zmiany.
(f) Zmiana w main.ts wywołuje `objectivePowerForOwner` przy każdej ocenie propozycji pokoju (koszt: jedno liczenie POWER na parę); nie zmierzono wpływu na wydajność.

RUNDY: 2/5 (r1 FAIL/BLOCK wiringu; r2 = ta runda, BLOCK z powodu niepełnego zakresu P2–P4)
NASTĘPNY KROK: runda 3 — P2 (ścieżka AI i AI↔AI na peacePwPointsByPowerRatio, po decyzji kierunku D dla AI↔AI), potem P3 (panel/tooltipy), P4 (Civpedia + wikiBundle generatorem), test end-to-end wiringu.
DEPLOY/PUSH: NIE WYKONANO
