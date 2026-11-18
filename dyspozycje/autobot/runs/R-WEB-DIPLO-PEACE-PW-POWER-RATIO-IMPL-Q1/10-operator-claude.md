# R-WEB-DIPLO-PEACE-PW-POWER-RATIO-IMPL-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES (część wzoru i bramki wdrożona; reszta zakresu NIE wykonana — patrz BLOKADY)
DOMAIN: GAME (dyplomacja, kod)
TEMAT: R-WEB-DIPLO-PEACE-PW-POWER-RATIO-IMPL-Q1
GOAL: pokój „P·r i P/r" wg POWER (r = moc silniejszej / moc słabszej, S = round(P·r), W = round(P/r), D = S − W dopłaca słabsza miastami, bez sufitu). Baza: eabeda5d4d42197ad07b73f95879034ba3ee32ed. Ten commit realizuje: funkcję czystą, parametry, bramkę PW propozycji pokoju gracza oraz test. Nie realizuje: wiring POWER w main.ts, AI/AI↔AI, panel/tooltipy, Civpedia (patrz BLOKADY).

ZMIANY-COMMIT: commit na gałęzi autobot/R-WEB-DIPLO-PEACE-PW-POWER-RATIO-IMPL-Q1 (SHA: patrz pole sha w wyniku). Allowlista respektowana. Pliki:
- gra/src/game/war-weariness.ts: eksport `peacePwPointsByPowerRatio(P, powerA, powerB)` → {strongerSide, r, S, W, D}; typ `PeacePwPowerSplit`; pole `pwPrzezMoc` w typie parametrów.
- gra/data/war-weariness-params.json: sekcja `pwPrzezMoc` (mianownikMin = 1, jedyna liczba: ochrona mianownika).
- gra/src/game/diplomacy-proposals.ts: pola `warState.powerPlayer` / `warState.powerOther` (opcjonalne); w `case 'pokoj'` gdy podane — gracz-autor: silniejszy ma wymaganie 0, słabszy pokrywa D (po rabacie relacji); komunikat „Brakuje N PW do wyrównania mocy — … D = …". Brak pól = stara bramka bit w bit.
- gra/tools/diplo-peace-pw-power-ratio-test.cjs (nowy): 18 asercji, w tym mutant.

NIE ZMIENIONO: progów zmęczenia, cen (wearinessPeaceCashPn), ścieżki wymuszonego pokoju (deferForcedPeace / acceptPendingForcedPeace), zakazu surowców. Miara mocy = POWER (nie siła militarna).

TESTY:
- `node tools/diplo-peace-pw-power-ratio-test.cjs`: 18 PASS / 0 FAIL (wzór U1–U7; integracja I1–I6; mutant M1 — stałe gap=0 czerwieni I2; statyczna S1). Przykład z kodu: moc 6969/2611, P=4320 → r≈2,669, S=11530, W=1619, D=9911 (zgodne z dispatchem).
- `npx tsc --noEmit` (gra/): 0 błędów.
- Bramki: logic-test 213/213; tech-tree-test 20/20; research-test 33/33; unit-replace-test 21/21; combat-test OK.
- Regresja pokoju (zielone bez zmiany asercji): diplo-peace-price-decay 13/0, diplo-peace-balance-accept, diplo-peace-weaker-seeks-city-only, diplo-peace-price-wiring, diplo-peace-ai-ai-nonnegative, diplo-peace-winner-proposal-flow, diplo-peace-price-production-paths, diplo-winner-proposal-table, diplomacy-sensible-deals, diplo-weariness-city-only, diplo-forced-peace-pending — exit 0.
- Asercje zaktualizowane: żadne (istniejące testy nie zakładały podziału mocy, bo pola nie są ustawiane w grze).
- Build vite: NIE ZMIERZONO (nie uruchamiany w tym runie). Chromium: NIE ZMIERZONO.

BLOKADY (jawnie, NIE zrobione):
1. KRYTYCZNE dla gry: nikt nie ustawia `warState.powerPlayer/powerOther` (wiring w main.ts `diploProposalWarState`, poza allowlistą). Bez tego bramka działa tylko w testach; w grze zachowanie jest bit-identyczne z bazą. Wymagana zmiana allowlisty + jeden wpis w main.ts (moc z power-objective.ts).
2. AI (ai.ts / diplomacy-ai-forced-peace.ts planCityPeacePayment, runWarWearinessTick, AI↔AI, planAiOfferOnTable/loserDespair) — kwota do pokrycia = D słabszej strony — NIE zrobione.
3. Panel PW / tooltipy (diplomacyAcceptanceBalance.ts, diplomacyAudience.ts): pokazanie mocy obu stron, r, S, W, D, rabatu, etykieta „(po rabacie relacji)" — NIE zrobione.
4. Civpedia / wikiBundle — NIE zrobione (bez zmian w docs).
5. Okno pokoju wymuszonego (wyliczenia do tooltipów, DECLUTT) — poza zakresem tego runu.

UWAGI-DLA-ORKIESTRATORA:
(a) Konsekwencja wzoru: r = 1 ⇒ D = 0 (pokój bez dopłaty), także przy równej mocy — zgodnie z wzorem właściciela, nie zmieniano.
(b) Przykład liczbowy 6969/2611, P=4320 → S 11530, W 1619, D 9911 — sprawdzony w teście U3 (z zaokrągleniem round).
(c) Słabsza strona bez środków: gate blokuje oddanie zbyt małej wartości miastami (I4), nie przyjmuje pokoju; pokój wymuszony przy 100% zmęczenia pozostaje nietknięty (cena 0, odroczony do akceptacji). Bramka nie dodaje płatności surowcami.
(d) Rabat relacji stosowany jest do D (effectiveTreatyPnRequired). Przy słabych relacjach rabat jest duży (w teście: D 12000 → 1200 PW). Należy to potwierdzić z właścicielem, bo D4 mówi o rabacie „po rabacie".
(e) Pola warState są opcjonalne; brak ich = zachowanie sprzed zmiany.

RUNDY: 1/5 (wynik z pierwszej rundy; brak FAIL do odnotowania)
NASTĘPNY KROK: Operator r2 (lub osobny temat) — wiring main.ts (allowlista do rozszerzenia przez orkiestratora), potem AI/AI tick, panel i Civpedia z wikiBundle generatorem.
DEPLOY/PUSH: NIE WYKONANO
