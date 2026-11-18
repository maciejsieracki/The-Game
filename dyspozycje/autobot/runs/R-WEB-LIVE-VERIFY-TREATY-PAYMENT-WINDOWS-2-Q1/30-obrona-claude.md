STATUS: BLOCK (krok 3 (a): przeszkoda techniczna; kroki 1 i 2 zacommitowane)
DOMAIN: GAME (pomiar na żywo; zmiany logiki gry: zero)
TEMAT: R-WEB-LIVE-VERIFY-TREATY-PAYMENT-WINDOWS-2-Q1
GOAL: (a) render wiersza D + zrzut; (d) ogon pokoju przy cenie >0; (f) diagnoza r
ZMIANY-COMMIT: b35cfdeb6 na bazie ab9d9860b. gra/src/main.ts (+25, tylko __cityCessionTestDebug: peaceRoomTailForTest); nowy gra/tools/diplo-treaty-pay-room-tail-live-verify-2-test.cjs. Dowody (gitignored, lokalnie): runs/.../dowody/krok2-room-tail-live.log, krok2-room-tail-MUTACJA-przelew-usuniety.log.
TESTY:
- (d) realny Chromium headless, bundle Vite poza repo, ?playtest=mapa: 16/16. D1 złoto 100 + brąz 9700 = 3010 PN, brak 0. D2 żelazo 2000 → ruda 20000 = 2800 PN, brak 200 jawnie. D3 rozejm bez złota: brąz 10000, złoto nietknięte. D4 cena 0: pusto. D5 „Oddajesz: miasta” (2 miasta): miasto pierwsze, po płatności 1 miasto. Zero pageerror/console.error.
- Mutacja (kopia main.ts, przelew wycięty, bundle /tmp/civ-ob-mut, źródło przywrócone, cmp OK): 14/16, FAIL D1 T1 i D2 T1.
- (f): bez zmian od ab9d9860b (nachylenie 2; asercja R1 ±0,05 na getPowers).
- Bramki (surowe wyjścia): tsc --noEmit exit 0; logic-test LOGIC OK (213/213); tech-tree-test 20 pass, 0 fail; research-test 33/33; unit-replace-test 21/21; combat-test 6/6.
BLOKADY:
- (a) NIE ZMIERZONO, BLOCK techniczny. Live `__truceTestDebug` nie ma `pushNegotiationForTest` (klucze: turn, pairState, setWarAge, declareWar, acceptTruceForTest, negotiationEntries, credibilityEvents, aggressorFlags, openAudience, closeAudience, suppressVictoryForTest), więc nie da się wystawić oferty AI do okna. Sonda: /tmp/civ-ob-probe/probe.cjs. Wiersz D to `.da-pn-bal-num[title]` (src/ui/diplomacyAcceptanceBalance.ts, treatyPaymentRowHtml ~l.652–670).
- (d) rozejm: noGold to parametr haka, nie prawdziwa ścieżka rozejmu. NIE ZMIERZONO.
- (f) okno: asercja R1 czyta getPowers (silnik), nie DOM. NIE ZMIERZONO do (a).
RUNDY: 3/5 (obrona). Ostatni werdykt Evaluatora: FAIL.
NASTĘPNY KROK: runda 4 Operatora tylko dla (a): hak wystawiający ofertę AI do okna (stan testowy), zrzut DSF 1 ≤1 MB, asercje PL i wartość D == przelew, mutacja w kopii; (d) rozejm: osobny hak ścieżki 'rozejm'.
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty
1. (d) PRZYJMUJĘ: hak i pomiar (b35cfdeb6), 16/16 live, mutacja czerwieni.
2. (a) PRZYJMUJĘ jako NIE ZMIERZONO. Zrzutu brak. Przyczyna: BLOCK techniczny (brak haka, klucze wyżej), nie czas.
3. (f) PRZYJMUJĘ: brak asercji DOM okna; NIE ZMIERZONO do (a).
4. PRZYJMUJĘ: wcześniejszy BLOCK „czas/zakres” był błędny. Obecny BLOCK ma przyczynę techniczną. Bramki odtworzone i zielone.

## UWAGI-DLA-ORKIESTRATORA
- Bez sesji, zadań i harmonogramów. Procesy w tle: brak. Push: brak.
- Sprzątanie: /tmp/civ-ob-build, /tmp/civ-ob-mut, /tmp/civ-ob-probe, /tmp/civ-ob-*.log; gra/node_modules w worktree (~0,6 GB).
