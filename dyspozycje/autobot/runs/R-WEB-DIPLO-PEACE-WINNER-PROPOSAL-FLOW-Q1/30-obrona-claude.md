# R-WEB-DIPLO-PEACE-WINNER-PROPOSAL-FLOW-Q1 — Obrona Operatora (runda 1, odpowiedź na zarzuty Evaluatora)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (dyplomacja/UI)
TEMAT: R-WEB-DIPLO-PEACE-WINNER-PROPOSAL-FLOW-Q1
GOAL: blokada 10 tur wojny widoczna przed kliknięciem z licznikiem (pkt 1) — zrobione i poprawione. Pkt 2 (kierunek płatności), pkt 3 (zgoda słabszej AI, konkretny powód odmowy) — NIE ZROBIONE w tej rundzie; pkt 2 wymaga DECISION_REQUIRED (patrz zarzut 1).
ZMIANY-COMMIT: `93944392bb09c73f0e9151e050d60dc8ea7060cd` na gałęzi `autobot/R-WEB-DIPLO-PEACE-WINNER-PROPOSAL-FLOW-Q1` (baza edb4b0056). Pliki: `gra/src/game/diplomacy-locks.ts`, `gra/src/game/diplomacy-peace-proposal-timing.ts`, `gra/src/main.ts` (jedna linia w buildDiplomacyLockContextBase), `gra/tools/diplo-peace-winner-proposal-flow-test.cjs`. Allowlista zachowana. Reguły liczbowe (10 tur, 6000 PN, progi) nietknięte.

## Odpowiedzi na zarzuty

| Nr | Zarzut | Decyzja | Dowód |
|---|---|---|---|
| 1 | Kierunek płatności nie zbadany | PRZYJMUJĘ (niezrobione) + DECISION_REQUIRED | Zbadane: `diplomacy-proposals.ts` ~l.1660–1676 — bramka „Brakuje N PW do uczciwej oferty pokoju" działa tylko gdy `authorIsPlayer` (gracz jest autorem). `diplomacy-war-peace-profile.ts:441` — cena pokoju = 6000 PN × (1 − L). Komentarz ECHO 2026-09-07 w tym samym pliku: „jeżeli ja chcę zaproponować pokój, a bilans jest ujemny, muszę go wyrównać". To jest sprzeczne z GOAL pkt 2 dispatchu (zwycięzca nie dopłaca podatku relacji). Nie wiem, która zasada obowiązuje — to decyzja właściciela. Kod nie zmieniony. |
| 2 | Brak konkretnego powodu odmowy AI | PRZYJMUJĘ (niezrobione) | `evaluateProposal` zwraca `reason` (`diplomacy-proposals.ts:1199`, `:1670`), ale ścieżka reason→UI nie została sprawdzona. Następna runda. |
| 3 | AI słabsza/zmęczona nie zbadana | PRZYJMUJĘ (niezrobione) | Brak zmian i brak testu w `evaluateProposal`. Następna runda. |
| 4 | Brak tabeli autor × adresat × tury × zmęczenie | PRZYJMUJĘ część, ODRZUCAM część | Dodana pełna oś tur 0..11 dla akcji '10' (test) i akcji '8' w wojnie. ODRZUCAM wymiary autor/adresat/zmęczenie dla tej blokady: `resolveDiplomacyActionLock` / `DiplomacyActionLockContext` (`diplomacy-locks.ts:59`) nie ma pól zmęczenia ani adresata (grep `zmecz|fatigue|weariness` w tym pliku: 0 trafień) — blokada jest po stronie gracza. Te wymiary dotyczą `evaluateProposal` (zarzut 3), więc wejdą z tą poprawką. |
| 5 | Brak dowodu live w Chromium | PRZYJMUJĘ — NIE ZMIERZONO | `/usr/bin/chromium` i `xvfb-run` są dostępne, ale scenariusz ze zrzutu wymaga stanu gry z wojną 11 tur i zmęczeniem 28%; nie przygotowano fixture ani sterownika w tej rundzie. Nie zgłaszam jako zaliczonego. |
| 6 | Błąd polszczyzny „za 5 tury" | PRZYJMUJĘ — naprawione | Nowa `turyWojnyLabel(n)` (`diplomacy-peace-proposal-timing.ts`): 1 → „turę", 2–4 → „tury" (poza 12–14), reszta → „tur". Test: `'10' wojna t=5: forma 'za 5 tur'`, `t=9: 'za 1 turę'`, odmiana 1/2/3/4/5/9/10/12/22/25. |
| 7 | Rozejm / trybut poza wyszarzeniem | PRZYJMUJĘ — naprawione częściowo | Rozejm: UI `rozejm: '10'` (`main.ts:21992`), więc jest objęty blokadą '10'. Trybut: case '8' w wojnie zwracał zawsze `locked:false` — dodana blokada z tą samą regułą (`peaceProposalBlocked('trybut_oferta')`) i licznikiem. Test: `'8' wojna t=5: locked=true z licznikiem`, `t=10: odblokowane`. |
| 8 | Render z efektem ubocznym (`diploWarStateFor`) | PRZYJMUJĘ — naprawione | `main.ts` (buildDiplomacyLockContextBase) używa teraz `diploWarStateForRead` — bez zapisu/zdejmowania stempla `wojnaStartTura`. Wartości te same: w wojnie `od = wojnaStartTura ?? turn`, czyli to co zwróciłby `diploEnsureWarStart`. |
| 9 | Błędna wzmianka „brak linii podsumowania" | PRZYJMUJĘ — korekta | W 10-operator-claude.md napisałem, że trzy testy (diplo-war-peace-gate, tech-chip-filter, diplo-truce-r1) nie mają linii podsumowania. Mają: 24 pass, 66/66, 31 pass. Korekta w tym raporcie; wynik nie zmienia się. |

## Bramki (surowe wyniki, ta runda, commit 93944392)

- `npx tsc --noEmit` → exit 0
- `node tools/diplo-peace-winner-proposal-flow-test.cjs` → `SUMA: PASS=49 FAIL=0` (było 20/0)
- diplomacy-locks-test → 88 passed, 0 failed
- diplomacy-audience-actions-test → 20 passed, 0 failed
- diplo-nap-trust-30-test → 25/25 passed
- diplo-quick-actions-labels-test → 38 OK, 0 FAIL
- diplo-alliance-gate-test → 19 PASS, 0 FAIL
- diplo-nap-border-threshold-test → 14 OK, 0 FAIL
- diplo-war-peace-gate-test → exit 0 (linia: 24 pass)
- diplomacy-tech-chip-filter-and-multi-deal-test → exit 0 (66/66)
- diplo-truce-r1-test → exit 0 (31 pass)
- handel-wymiana-tech-gate-test → 35 passed, 0 failed
- logic-test → LOGIC OK (213/213); tech-tree-test → 20 pass, 0 fail; research-test → ALL GREEN; combat-test → All sanity checks passed; unit-replace-archer-slinger-test → 51 OK, 0 FAIL
- Nieuruchomione: weaker-seeks / main-guard / gate G / truce-r4 (znane czerwone przed zmianą, poza zakresem).
- Mutacja: nie wykonana w tej rundzie (Evaluator potwierdził, że test wykrywa cofnięcie poprawki r1).

## Stan środowiska

`gra/node_modules` zainstalowane przez `npm ci --ignore-scripts` w worktree (untracked, nie w commicie). Wolne miejsce na `/`: 4,9 GB przed instalacją.

## BLOKADY / DECISION_REQUIRED

**DECISION_REQUIRED — kierunek płatności za pokój (GOAL pkt 2).** Sytuacja: kod nadal blokuje autora-gracza, gdy bilans PW pokoju jest ujemny (`diplomacy-proposals.ts` ~l.1670), a cena pokoju 6000 PN × (1 − L) (`diplomacy-war-peace-profile.ts:441`) płaci przegrywający miastami. Dispatch każe, by zwycięzca nie dopłacał „podatku relacji". Opcje:
- A (zgodne z dispatchem): usunąć bramkę PW dla autora-gracza przy pokoju; cena płaci wyłącznie przegrywający. Zaleta: spójne z decyzją o miastach. Wada: zmienia zasadę ECHO z 2026-09-07; gracz może wysłać darmowy pokój.
- B (zgodne z ECHO 2026-09-07): zostawić bramkę dla gracza-autora, dopisać w panelu jasny komunikat „dopłać N PW". Zaleta: bez zmiany zasad. Wada: sprzeczne z GOAL pkt 2.
- C (hybryda): bramka tylko przy pokoju bez oddania miasta; przy oddaniu miasta — bez dopłaty. Zaleta: gracz-zwycięzca może zażądać miasta bez kosztu. Wada: dodatkowa reguła do opisania w Civpedii.
**Rekomendacja: A**, z wyraźnym komunikatem w panelu (wymóg dispatchu). Nie zmieniono kodu.

## RUNDY / NASTĘPNY KROK

RUNDY: 2/5 (ostatni werdykt Evaluatora: FAIL, zarzuty 1–9).
NASTĘPNY KROK: Evaluator sprawdza commit 93944392 (zakres allowlisty, tabela testów, zarzuty 6–9). Pkt 2–3 GOAL (reason→UI, zgoda słabszej AI) i decyzja A/B/C na kierunek płatności — poza tą rundą; wymagają odpowiedzi właściciela (DECISION_REQUIRED) i osobnego zakresu. Dowód live w Chromium — NIE ZMIERZONO, do zrobienia przy następnej rundzie.

UWAGI-DLA-ORKIESTRATORA: dispatch wskazywał `00-dispatch.md` w origin/main — tam go nie ma; odczytany z gałęzi `claude/sprawdzenie-funkcjonalnosci-ek4ra0`. Worktree wskazywał HEAD b92aab97 (FALA 814); pracę prowadzono od edb4b0056 na gałęzi `autobot/R-WEB-DIPLO-PEACE-WINNER-PROPOSAL-FLOW-Q1`. Nie tworzono nowych sesji, zadań ani harmonogramów. Nie integrowano, nie pushowano na main.

DEPLOY/PUSH: NIE WYKONANO
