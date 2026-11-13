# R-WEB-DIPLO-WAR-TRUST-ZERO-NOT-RELATION-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-WAR-TRUST-ZERO-NOT-RELATION-Q1 (krok 1 z 4)
GOAL: w wojnie obniżane jest wyłącznie Zaufanie (do zera); Respekt nie zmienia się przez wojnę; limit 29 na sumę Zaufania+Respektu usunięty; ocena pokoju używa relacji bez limitu 29.
BAZA: origin/main 5d0c5f8d1e3e6efd188064419418804779868cfa (detached), worktree wf_89badf3a-f25-1.

## ZMIANY (allowlista)

- `gra/src/game/diplomacy.ts`: `clampRelationForWar` ścina teraz wyłącznie Zaufanie do 0 w stanie wojny (`{ ...rel, zaufanie: 0 }`); usunięte obcinanie sumy do `WAR_RELATION_SCORE_CAP` (Zaufanie najpierw, potem Respekt). `WAR_RELATION_SCORE_CAP` zostaje wyeksportowane jako stała referencyjna (już nie steruje clampem). Wywołania: `applyDiplomaticEvent` (linia ~1094) i `tickDiplomacy` (linia ~1860) — bez zmiany kodu wywołań.
- `gra/src/game/diplomacy-proposals.ts`: tylko komentarz nad `treatyEvalRelationTotal`. Komentarze w blokach PN (linie ~1415–1480) nadal opisują stare obcinanie do 29 — patrz BLOKADY.
- `gra/src/game/diplomacy-display.ts`: komentarz `effectiveNastawienieScores` i `warRelationCapApplies` (logika bez zmian: dopisek pojawia się, gdy w wojnie Zaufanie > 0).
- `gra/src/ui/diplomacyAudience.ts`: dopisek „limit wojenny 29” zastąpiony tekstem „(w wojnie zaufanie spada do zera)” z tooltipem; usunięty nieużywany import `WAR_RELATION_SCORE_CAP`.
- Testy (asercje o limicie 29 / o wartościach wynikających z capu, bez osłabiania):
  - `gra/tools/diplomacy-test.cjs`: 3 asercje Respektu w wojnie 29 → 40 / 30 / 30 (Respekt nietknięty).
  - `gra/tools/diplo-respect-military-events-test.cjs`: asercja „score ≤ 29” → Zaufanie 0 i Respekt +5; asercja zgodności z clampem zamieniona na idempotencję clampu.
  - `gra/tools/diplomacy-respect-true-value-real-render-test.cjs`: tekst dopisku i tooltipu, asercja relacji, scenariusz C (wojna 10/10 → 0/10); dopisek sprawdzany teraz pod kątem Zaufania > 0.
  - `gra/tools/dyplo-bilans-gate-n-e1-reprodukcja-runda3-test.cjs`: 3 literały zależne od capu: (2-PRZED-neutralna) -55 → 50; (4a) -355 → -250 (tożsamość z rundą 2 zachowana); (4b) -655 → -550 względem rundy 2 = 50.
- NOWY `gra/tools/diplo-war-trust-only-test.cjs` (sekcje a–e z dispatchu, 11 asercji).

Dodatkowo: nie zmieniano progów 30/10/130/90, JSON balansu, etykiet nastawienia, `ai.ts`, `main.ts`, `power-objective.ts`, `WERSJE.md`. Zrzuty PNG w `dyspozycje/.../dowody` nadpisane przez testy live zostały przywrócone (`git checkout`) i nie są w commicie.

## INTERPRETACJA (ZAŁOŻENIE)

- „Ocena pokoju używa nieobciętej sumy” (dispatch, pkt 4 i test (d)) zinterpretowano jako: w wojnie `treatyEvalRelationTotal` = Zaufanie 0 + Respekt (zgodnie z pkt 1 dispatchu: Zaufanie w wojnie = 0). Poza wojną = Zaufanie + Respekt, bez zmian. Gdyby właściciel chciał sumę z Zaufaniem sprzed wojny, to inna reguła — do potwierdzenia.
- Przy zmianie treści dopisku w UI przyjęto treść wskazaną w dispatchu („w wojnie zaufanie spada do zera”).

## TESTY (surowe wyniki, uruchomione z gra/ na tym worktree)

Bramki referencyjne (przed zmianą na bazie i po zmianie — bez różnicy):
- `npx tsc --noEmit` → exit 0 (przed: 0; po: 0)
- `node tools/logic-test.cjs` → `LOGIC OK (213/213)`
- `node tools/tech-tree-test.cjs` → `tech-tree-test: 20 pass, 0 fail`
- `node tools/research-test.cjs` → `PASSED: 33 / FAILED: 0 / TOTAL: 33`
- `node tools/unit-replace-test.cjs` → `WSZYSTKIE TESTY ZIELONE (21/21)`
- `node tools/combat-test.cjs` → `COMBAT TEST: 6/6 pass`

Testy dotknięte zmianą (po zmianie):
- `diplomacy-test.cjs` → `148 passed, 0 failed (total 148)` (przed zmianą na bazie 148/0; po pierwszym przebiegu bez poprawek 145/3)
- `diplo-respect-military-events-test.cjs` → `Wynik: 24 OK, 0 FAIL` (po pierwszym przebiegu 22 OK / 2 FAIL)
- `diplomacy-respect-true-value-real-render-test.cjs` → `18 OK, 0 FAIL` (po pierwszym przebiegu 12 OK / 5 FAIL; baza 17/0)
- `diplo-war-trust-only-test.cjs` (NOWY) → `11 OK, 0 FAIL`
- `dyplo-bilans-gate-n-e1-reprodukcja-runda3-test.cjs` → `22 PASS / 5 FAIL`. Baza: `22 PASS / 5 FAIL`. Te same 5 pozycji na bazie i na kandydacie: (3b) ×4 (accepted=TRUE dla pokój, runda 4) i (3c). Pierwszy przebieg po zmianie dawał 19/8 (trzy nowe FAIL) — naprawione aktualizacją literałów capu, patrz wyżej.
- `forced-war-bronze-test.cjs` → `PASSED: 45 / FAILED: 3 / TOTAL: 48`, ten sam zestaw 3 FAIL co na bazie (diff pusty).

Pozostałe testy diplomacy/war sprawdzone po zmianie (rc=0):
- `wiarygodnosc-test` → 270 pass, 0 fail
- `ai-war-weariness-peace-test` → PASS=96 FAIL=0
- `ai-losing-war-asks-peace-vs-player-test` → 12 PASS / 0 FAIL
- `diplo-peace-balance-accept-test` → 29 pass / 0 fail
- `diplomacy-negotiation-table-test` → rc 0 (62/62 w ostatniej asercji)
- `diplomacy-proposal-test` → rc 0 (200/200 w ostatniej asercji)
- `diplomacy-relation-value-mismatch-live-test` → 10 pass, 0 fail
- `dyplo-pokoj-kierunek-runda1-test` → 18 PASS, 0 FAIL

Nie zmierzono (NIE_ZMIERZONO):
- Z 214 skryptów z filtra diplo/dyplo/war/peace/treaty/trust/respect/relacj/pokoj/nap/alliance/sojusz uruchomiono 40 (chunk-00) + 40 (chunk-01); pozostałe ~134 nie były uruchamiane (budżet czasu).
- Skrypty live/measure, które przekroczyły limit czasu na kandydacie (20 s lub 120 s; nie uruchomiono ich na bazie w pełni): `ai-general-war-campaign-live-test`, `ai-war-defend-home-measure`, `diplo-aggressor-marker-live-test`, `diplo-truce-ai-table-live-test`, `diplo-truce-live-test`, `diplo-truce-saveload-live-test`, `diplo-war-peace-live-test`, `diplomacy-city-cession-live-test`.
- Skrypty z rc=1, które na bazie też dają rc=1 (środowisko/argumenty, nie zmiana): `ai-war-weariness-live-audit-hook`, `ai-war-weariness-live-audit-measure`, `ai-war-weariness-live-audit-summarize`, `alliance-war-call-live-reload-test`, `civ-matrix-ai-diplomacy-wiring-test`, `diplo-truce-r1-test`, `diplo-war-peace-sim-test`, `diplomacy-border-era-penalty-live-test`. Zawartość FAIL dla `diplo-truce-r1-test` (2 FAIL: „rozejm za wcześnie”, „rozejm silniejsze AI” — odrzucenie z powodem „Pokój i rozejm dostępne po 10 pełnych turach wojny”) nie została porównana linia po linii z bazą; kod rc jest identyczny (1).

## BLOKADY / WPŁYW NA ETYKIETĘ (opisane, nie naprawiane)

- Etykieta „Wrogi” i tekst nastawienia w wojnie: `effectiveNastawienieScores` nadal zwraca wartości surowe (dispatch: nie zmieniać etykiet/progów). Po tej zmianie stan wojenny po ticku ma Zaufanie 0, więc suma = Respekt; etykieta może wyjść poza „Wrogi” wyłącznie wtedy, gdy Respekt ≥ 30 (ten efekt zależy od progów etykiet — do osobnego kroku, nie zmieniano).
- Panel dyplomacji pokazuje Zaufanie z tego, co jest w stanie. Zmiana działa przy najbliższym ticku lub zdarzeniu dyplomatycznym; stan zapisany przed zmianą (np. Zaufanie 74 w wojnie) wyświetli się do pierwszego ticku.
- Stare komentarze o capie 29 w `diplomacy-proposals.ts` (~linie 1415–1480) i `diplomacy-ai-offer-balance.ts` (~linia 539) nie zostały przepisane (wymagają analizy matematyki PN; nie zmieniano rachunku).
- Pozostałe ruchy PN (rozejm/pokój) mogą się zmienić jakościowo: relacja w wojnie to teraz Respekt bez limitu — testy PN przeszły, ale nie zmierzono scenariuszy live.

## NIE WYKONANO (poza zakresem tego kroku — wymagają decyzji właściciela / osobnych zleceń)

- Próg wrogości poniżej 10 Zaufania i „wojna przy zerze” (zdanie z prośby właściciela w wiadomości relayed): NIE zaimplementowano. Dispatch wprost wyłącza „progi 30 → zaufanie, próg wrogości poniżej 10, automatyczna wojna przy zerze” z tego kroku. Progi to decyzja liczbowa (CLAUDE.md: pytanie ABC), nie wybierano ich samodzielnie. Do ABC: czy próg „Wrogi” ma być < 10 Zaufania oraz czy zerowe Zaufanie ma automatycznie wypowiadać wojnę.
- Zmiana etykiety nastawienia i jej progów (krok 2–4 wg dispatchu).

## RUNDY

1/5 (runda pierwsza, bez FAIL/BLOCK).

## NASTĘPNY KROK

Commit kodu i raportu (ten commit) → Evaluator (SONNET) → Final Control (SONNET). Przed Evaluatorem: decyzja właściciela w sprawie progów (ABC) dla kroków 2–4.

## DEPLOY/PUSH: NIE WYKONANO
