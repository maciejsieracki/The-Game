# R-WEB-DIPLO-PEACE-PW-POWER-RATIO-IMPL-Q1 — obrona Operatora (runda 2/5, odpowiedź na zarzuty Evaluatora)

STATUS: BLOCK (zarzut 1 wymaga zmiany poza allowlistą; brak nowego commita z kodem w tej rundzie)
DOMAIN: GAME (dyplomacja, kod)
TEMAT: R-WEB-DIPLO-PEACE-PW-POWER-RATIO-IMPL-Q1
GOAL: bez zmian względem dispatchu (wzór P·r / P/r wg POWER, D = S − W dopłaca słabsza miastami, bez sufitu). Baza: eabeda5d4d42197ad07b73f95879034ba3ee32ed. Kandydat obrony: 5cd4e72a03063562e1a4f439769449a074e5f48f (startowy SHA tej rundy).

ZMIANY-COMMIT: w tej rundzie brak zmian kodu. Commit zawiera wyłącznie ten raport. Kod z r1 bez zmian.

ODPOWIEDŹ NA ZARZUTY:
1. PRZYJMUJĘ (fakt potwierdzony). `grep` po `gra/src`: `powerPlayer`/`powerOther` występują tylko w `diplomacy-proposals.ts` (typ i bramka, l. 222–223, 1618–1620). `main.ts` importuje `computeObjectivePower` (l. 1115), ale nie zasila pola `warState` w `diploProposalWarState` (l. ~12330). W grze zachowanie jest bit-identyczne z bazą. NIE WYKONANO: wiring wymaga zmiany `gra/src/main.ts`, a tego pliku nie ma w allowlistze. Nie rozszerzam allowlisty samowolnie. Propozycja dla orkiestratora: w `diploProposalWarState` dodać `powerPlayer` / `powerOther` z `computeObjectivePower` dla gracza i drugiej strony (po stronie respondenta i proponenta). Po rozszerzeniu allowlisty to jest jedyna zmiana potrzebna do zamknięcia zarzutu 1.
2. PRZYJMUJĘ jako otwarte (NIE WYKONANO w tej rundzie). Ścieżki AI (`planCityPeacePayment`, `planAiOfferOnTable`/`loserDespair`, AI↔AI) nie używają jeszcze `peacePwPointsByPowerRatio`. Zakres jest większy niż jedna poprawka i zależy od zarzutu 1 (moc AI też musi być podana).
3. PRZYJMUJĘ jako otwarte (NIE WYKONANO). Panel PW i tooltipy nie pokazują mocy, r, S, W, D ani etykiety „(po rabacie relacji)”. Zmiana w `diplomacyAcceptanceBalance.ts` / `diplomacyAudience.ts` (allowlista) wymaga danych z zarzutu 1.
4. PRZYJMUJĘ jako otwarte (NIE WYKONANO). Civpedia/wikiBundle nie zaktualizowane. Regeneracja generatorem ma sens dopiero po zarzutach 1–3.
5. ODRZUCAM (z założeniem, do potwierdzenia przez właściciela). Dowody:
   - D1 (dispatch): „Rabat relacji gracza bez zmian”. Mechanizm rabatu to `effectiveTreatyPnRequired` (`diplomacy-pn-engine.ts` l. 203–207). Jest nakładany na podaną kwotę bazową, a nie tylko na P.
   - D4 (dispatch): etykieta „(po rabacie relacji)” ma stać przy wartości po rabacie. To wymaga, by rabat działał na wartość pokazywaną graczowi, czyli także na D.
   - „Bez sufitu” (D2) oznacza brak limitu dopłaty, a nie brak rabatu. Kod nie wprowadza sufitu.
   - Kod: `requiredD = effectiveTreatyPnRequired(pkPowerSplit.D, relTotal)` (`diplomacy-proposals.ts` ~l. 1621–1624).
   - Założenie: rabat relacji stosuje się do D. Przykład z testu: D 12000 → 1200 PW przy silnie dodatniej relacji. Ta interpretacja jest w ABC do potwierdzenia przez właściciela; jeśli właściciel chce D bez rabatu, to zmiana jednej linii i jednego asercji.
6. PRZYJMUJĘ. Test `diplo-peace-pw-power-ratio-test.cjs` ustawia `powerPlayer`/`powerOther` wprost w `warState`. Nie dowodzi to ścieżki z `power-objective.ts` do bramki. Zamknie się to po zarzucie 1 (dodatkowy test end-to-end przez `diploProposalWarState`).

WERYFIKACJA W TEJ RUNDZIE (liczby z surowego wyjścia):
- `./node_modules/.bin/tsc --noEmit -p .` (w `gra/`, po `npm ci --ignore-scripts`): exit 0.
- `node tools/diplo-peace-pw-power-ratio-test.cjs`: `Wynik: 18 PASS, 0 FAIL`, exit 0.
- Bramki logic-test, tech-tree-test, research-test, unit-replace-test, combat-test oraz regresja pokoju: NIE PONOWIONO w tej rundzie (wyniki z r1 i Evaluatora nie zostały tu zmierzone ponownie).
- Build vite i Chromium: NIE ZMIERZONO.

UWAGI-DLA-ORKIESTRATORA:
(a) Konsekwencja r = 1 ⇒ D = 0 (pokój bez dopłaty), zgodnie z wzorem właściciela. Nie zmieniano.
(b) Przykład z kodu: moc 6969/2611, P = 4320 → r ≈ 2,669, S = 11530, W = 1619, D = 9911 (asercja I3/U3 w teście).
(c) Gdy słabsza strona nie ma czym zapłacić D, bramka odrzuca propozycję (asercja I4). Pokój wymuszony przy 100% zmęczenia (cena 0, odroczony do akceptacji) nie jest ruszany.
(d) Rabat relacji na D to założenie do potwierdzenia (zarzut 5).
(e) Lokalnie zainstalowano `gra/node_modules` (`npm ci --ignore-scripts`). To katalog ignorowany przez git, nie jest częścią commita.

WYMAGANE DECYZJE / DZIAŁANIA DLA ORKIESTRATORA:
- Rozszerzyć allowlistę o `gra/src/main.ts` (tylko `diploProposalWarState`, pola `powerPlayer`/`powerOther`), zanim wystartuje następna runda Operatora.
- Potwierdzić u właściciela, czy rabat relacji działa na D (zarzut 5, założenie w raporcie).
- Zarzuty 2–4 i 6 zostają otwarte do następnej rundy po wiringu.

RUNDY: 2/5 (r1 PASS-WITH-NOTES; r2 BLOCK: zarzut 1 wymaga allowlisty, zarzut 5 odrzucony z dowodem)
NASTĘPNY KROK: orkiestrator rozszerza allowlistę o `main.ts` (tylko wiring) i wznawia Operatora r3 z tym samym ID; potem zarzuty 2–4 i 6.
DEPLOY/PUSH: NIE WYKONANO
