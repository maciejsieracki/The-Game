# 10-operator-claude — R-WEB-UI-HUD-RESOURCE-CARD-STATE-NET-Q1 (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (UI, bez zmiany zasad ekonomii)
TEMAT: R-WEB-UI-HUD-RESOURCE-CARD-STATE-NET-Q1
GOAL: karta surowca w panelu imperium liczy niedobór z netto HUD (resourceIsShortage), tak jak alert i chip „Surowce”.
BAZA: 0936a1d9f21615a6652bc50a970c2e7bfc095a44 (origin/main), worktree detach.

ZMIANY-COMMIT:
- gra/src/ui/empireDetailPanel.ts: resStateOf używa resourceIsShortage(r) zamiast r.ratePerTurn < 0; funkcja wyeksportowana (dla testu); import rozszerzony o resourceIsShortage.
- gra/tools/hud-resource-card-state-test.cjs (nowy).
- Lokalizacje `ratePerTurn < 0` w UI (grep gra/src/ui, main.ts): jedyna to empireDetailPanel.ts:3408 (zmieniona). main.ts już używa resourceIsShortage (23929, 23935). hud.ts:238 tylko komentarz.

TESTY:
- tsc --noEmit: bez błędów.
- hud-resource-card-state-test: 7 ok / 0 FAIL (A konwerter bad; B −0,4 good; C zużycie bad; D good/warn; E siatka 105 przypadków zgodna z chipem; M mutant ratePerTurn<0 daje inny wynik na A).
- logic-test 213/213 (ostatni PASS [213]); tech-tree 20 pass; research 33/33; unit-replace 21 OK; combat PASS (0 FAIL).
- hud-shortage-alert-converter-test 17 ok / 0; resource-gross-net-converter-inputs-test 18 ok / 0; hud-resource-deficit-red-test 41 pass / 0 fail (Chromium /opt/pw-browsers).
- Istniejące testy kart: resource-building-toggle 210/0; resource-card-numbers-only 14/0; resource-cards-gross-net 24/0; resource-usage-breakdown 100/0; surowce-katalog-kolejnosc 62/0.
- NIE ZMIERZONO: resource-cards-plusx-badge-test i resource-ledger-skad-dom-test — brak /usr/bin/chromium (test hardkoduje ścieżkę; plusx kończy błędem launch, ledger SKIP).

BLOKADY: brak w zakresie rundy.

RUNDY: 1/5

NASTĘPNY KROK: Evaluator (SONNET) — weryfikacja diffu i testu; Final Control po werdykcie.

UWAGI-DLA-ORKIESTRATORA:
- Komentarz „sekcja hero” w empireDetailPanel.ts (~3707–3719) nadal twierdzi, że resStateOf jest „NIETKNIĘTE”. Po zmianie jest nieaktualny. Liczenie kubełków (nGood/nGrow/nFlat) pozostaje spójne, bo nFlat = reszta. Poza allowlistą, nie zmieniano.
- Zmiana semantyki: surowiec z ratePerTurn < 0 i ułamkowym deficytem (−0,4) przestaje być „bad”; to zamierzone (zgodność z chipem).

DEPLOY/PUSH: NIE WYKONANO
