# R-WEB-DIPLO-PEACE-WEAKER-SEEKS-CITY-ONLY-Q1 — obrona Operatora (runda 2, odpowiedź na zarzuty FC z 20-evaluator-claude.md)

STATUS: PASS-WITH-NOTES (zarzut 1 PRZYJĘTY w całości; zarzut 2 PRZYJĘTY dla ai.ts/proposals/forced-peace, NIE ZROBIONE dla main.ts — patrz BLOKADY)
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-PEACE-WEAKER-SEEKS-CITY-ONLY-Q1
GOAL: rozejm i pokój wg siły militarnej: słabsza strona szuka rozejmu/pokoju, silniejsza go odrzuca, opór silniejszej przełamuje wyłącznie miasto (cena PN jak dotąd); złoto i surowce NIE są słodzikiem w żadnym kierunku (D2). Dotyczy gracza i AI.
BAZA: e91c1a178 (kandydat r2 wskazany w dispatchu) → ta runda: patrz ZMIANY-COMMIT (SHA w polu sha).
RUNDY: 2/5 (obrona r2; ostatni werdykt Evaluatora: FAIL, raport 20-evaluator-claude.md)
GAŁĄŹ: detached HEAD w worktree `wf_c0f8041a-93d-3` (commit bez nazwy gałęzi; orkiestrator wybiera ref)

## Odpowiedzi na zarzuty

| nr | zarzut | werdykt | dowód / co zrobiono |
|---|---|---|---|
| 1 | AI nadal oferuje ZŁOTO za pokój (`oferuj_trybut_za_pokoj`, ai.ts ok. l. 7095–7108) | PRZYJMUJĘ | Usunięta gałąź priorytet 1 z `decideAIDiplomacy` (ai.ts): złoto za pokój nie jest już generowane przez nikogo (ani wobec gracza, ani AI↔AI). Słabsza AI bez miasta nie składa propozycji pokoju wobec gracza (`peaceWeakerNoCityVsPlayer`, bez zmian). Zmieniona zostaje też doc-komentarz listy priorytetów i nieużywany import `AI_TRIBUTE_PEACE_MAX` (tsc 0). Testy: nowe przypadki h1–h5 w `tools/diplo-peace-weaker-seeks-city-only-test.cjs` (h1: słabsza AI, 1 miasto, złoto 5000 → brak oferty złota; h2: brak jakiejkolwiek oferty pokojowej; h3/h4: 6 miast → `oferuj_miasto_za_pokoj` z rodzajem rozejm (wojna <20 tur) / pokój (≥20); h5: silniejsza AI → brak ofert). Mutacja M10 (przywrócenie gałęzi złota) czerwieni test: 3 FAIL. Asercje o starej regule przepisane (zgodnie z D2): `tools/ai-test.cjs` T9d i T9h (teraz `zaproponuj_pokoj`, bez złota; dodany `turnsAtWar`, bez którego gałąź pokoju nie działa), `tools/ai-losing-war-asks-peace-vs-player-test.cjs` (test (1): złoto nie tworzy trybutu; 2 miasta → brak komend pokojowych do t<150; od t≥150 minimum miast obniża zmęczenie wojną). UWAGA: ten ostatni plik już na bazie e91c1a178 miał 2 FAIL (asercje starej reguły bez danych siły militarnej) — teraz 12/0. Poprzednia runda deklarowała usunięcie złota, a kod tego nie robił — to był mój błąd w raporcie, nie tylko w kodzie. Pozostaje (nieaktywne dla AI, do decyzji orkiestratora): mapowanie `oferuj_trybut_za_pokoj` → `trybut_oferta` w `diplomacy-proposals.ts` (l. ~1989–1990, ~2182–2190) i typ w `ai.ts`; strona gracza (`trybut_oferta` jako osobna umowa z koszykiem) nie była przedmiotem zarzutu i nie została zmieniona. |
| 2 | brak dowodu mutacyjnego (h) dla każdej bramki | CZĘŚCIOWO PRZYJĘTY | Dodane M10 (złoto) i M11 (`cityOfferKind` zawsze `pokoj` — test rozejm/pokój). Oba zabite. Dodano `diplo-peace-weaker-seeks-city-only-test.cjs` jako killer dla M4/M5 (poza balance-accept). Runner `tools/diplo-peace-gate-mutation-run.cjs` przyjmuje opcjonalny prefiks nazwy mutanta. **Surowy wynik** (`node tools/diplo-peace-gate-mutation-run.cjs`): `MUTACJE BRAMEK: 11/11 zabite` (M1 2/3 FAIL; M2 1; M3 2; M4 5+1; M5 2+1; M6 1; M7 3; M8 1; M9 2; M10 3; M11 1). Zakres: evaluatePeaceAiGate (M1), proposals r5Gate/cityGivePn (M2), odrzucenie złota/surowców w proposals (M3), ai.ts aiFeelsStronger (M4), ai.ts słabsza-bez-miasta (M5), forced-peace (M6, M7), proposals rodzaj rozejm (M8), pasmo (M9), ai.ts złoto (M10), ai.ts cityOfferKind (M11). **NIE ZROBIONE: main.ts** — dwa miejsca wiązania pozycji militarnej (`main.ts:11753` `diploProposalWarState` → `responderPozycjaMilitarna`; `main.ts:36588` `gateVerdict` → `pozycjaMilitarna`) i zgodność tie-breaku ścieżek main.ts vs ai.ts. Plik main.ts nie jest importowalny w harnessie cjs (aplikacja DOM), więc mutacja w main.ts nie może być zabita testem behawioralnym bez zmiany architektury. Nie dopisuję regexu (lekcja W45/W47). Wymagana decyzja orkiestratora: wyciągnąć wiązanie do czystej funkcji (np. w `diplomacy-military-strength.ts`) i zmutować ją — to zmiana kodu poza tą rundą. |
| 3 | rozejm z miastem słabszej AI (z r1) | zamknięte w r1 | Test f2 (`aiCommandToPendingProposal` `rodzaj: 'rozejm'` → `actionId 'rozejm'`, miasto w giveItems) nadal zielony; h3 dodaje wejście przez `decideAIDiplomacy`. |
| 4 | testy pasma i jednego miasta (D3) | zamknięte w r1 | Pasmo: g1–g3 (zielone). Jedno miasto: d3 + h1/h2. |
| 5 | remis deterministyczny ai.ts vs main.ts | CZĘŚCIOWO | Test a4 (remis daje jedną stronę silniejszą) zielony. Zgodność ścieżek main.ts vs ai.ts — patrz zarzut 2 (main.ts nie pokryty). |

## Zmiany w tej rundzie (pliki)

- `gra/src/game/ai.ts` — usunięta gałąź `oferuj_trybut_za_pokoj` (priorytet 1 w `decideAIDiplomacy`), zaktualizowany komentarz listy priorytetów, usunięty nieużywany import `AI_TRIBUTE_PEACE_MAX`.
- `gra/tools/diplo-peace-weaker-seeks-city-only-test.cjs` — +decideAIDiplomacy w entry (h1–h5); 26/0.
- `gra/tools/ai-test.cjs` — T9d, T9h przepisane na regułę bez złota (+turnsAtWar); 297/0.
- `gra/tools/ai-losing-war-asks-peace-vs-player-test.cjs` — test (1) przepisany na regułę miasta (silaMilitarna w `decide`); 12/0.
- `gra/tools/diplo-peace-gate-mutation-run.cjs` — M10, M11; M4/M5 dodatkowo zabijane przez nowy test; filtr prefiksu (argv[2]).
- `dyspozycje/autobot/runs/R-WEB-DIPLO-PEACE-WEAKER-SEEKS-CITY-ONLY-Q1/30-obrona-claude.md` — ten raport.
Allowlista: nie dotknięto `gra/`-zależnych artefaktów poza testami i ai.ts; `diplomacy-ai-forced-peace.ts`, `diplomacy-proposals.ts`, `main.ts` bez zmian w tej rundzie.

## TESTY (surowe wyniki z tej rundy, komenda → wynik)

- `npx tsc --noEmit -p .` → exit 0
- `tools/logic-test.cjs` → `LOGIC OK (213/213)`
- `tools/tech-tree-test.cjs` → `20 pass, 0 fail`
- `tools/research-test.cjs` → `PASSED: 33 / FAILED: 0 / TOTAL: 33`
- `tools/unit-replace-test.cjs` → `WSZYSTKIE TESTY ZIELONE (21/21)`
- `tools/combat-test.cjs` → `COMBAT TEST: 6/6 pass`
- `tools/diplo-peace-balance-accept-test.cjs` → `32 pass / 0 fail`
- `tools/diplo-war-peace-main-guard-test.cjs` → `35 pass / 0 fail`
- `tools/diplo-peace-weaker-seeks-city-only-test.cjs` → `26 pass / 0 fail`
- `tools/diplo-peace-gate-mutation-run.cjs` → `MUTACJE BRAMEK: 11/11 zabite`
- `tools/ai-test.cjs` → `ai-test: 297 passed, 0 failed`
- `tools/ai-losing-war-asks-peace-vs-player-test.cjs` → `WYNIK: 12 PASS / 0 FAIL`
- `tools/diplo-war-peace-sim-test.cjs` → `19 pass / 3 fail` (S3, S4b, M_TUR — dług bazowy, bez zmiany liczby)
- Pozostałe regresje tematu: `diplomacy-test` 148/0; `diplo-military-strength-test` 27/0; `diplo-war-battle-counter-test` 35/0; `diplo-war-declare-zero-trust-test` 43 OK/0; `diplo-trust-numbers-test` 22/0; `ai-unit-replace-same-rules-test` 45/0; `unit-replace-army-multi-select-test` 36/36; `unit-replace-promotion-table-test` PASS (brak cykli).
- `git diff --check` → czysto.

## ZAŁOŻENIA (luki rozstrzygnięte w kodzie)

- Słabsza AI z mniej niż 3 miastami (minimum N1a, `minMiast`) nie oferuje miasta i nie proponuje pokoju wobec gracza do t<150; od t≥150 zmęczenie wojną obniża minimum (istniejące zachowanie, nie zmieniane). Traktuję jako zgodne z Z5/D3 (brak miasta do oddania = brak propozycji).
- Gałąź `oferuj_trybut_za_pokoj` w `diplomacy-proposals.ts` zostaje jako martwe mapowanie (AI jej już nie emituje) — usunięcie to osobny, dozwolony krok, nie zrobiony tutaj, by nie rozszerzać diffu.

## BLOKADY

- main.ts — brak behawioralnego dowodu mutacyjnego dla dwóch miejsc wiązania pozycji militarnej (main.ts:11753, main.ts:36588) i tie-breaku main vs ai.ts. Wymaga decyzji orkiestratora (wyciągnięcie wiązania do importowalnej funkcji = zmiana kodu poza tą rundą). Bez tego zarzut 2 nie jest w pełni zamknięty.
- Dług bazowy `diplo-war-peace-sim-test` (3 FAIL: S3, S4b, M_TUR) — poza zakresem, jak w dispatchu.

## UWAGI-DLA-ORKIESTRATORA

- Przy kolejnej rundzie zalecam: wyciągnąć `pozycjaMilitarna` z main.ts do jednej funkcji w `diplomacy-military-strength.ts` (jedno miejsce tie-breaku, dla ai.ts i main.ts) — wtedy mutacja tej funkcji jest zabijalna testem.
- Martwe mapowanie `oferuj_trybut_za_pokoj` w `diplomacy-proposals.ts` do usunięcia przy okazji, jeśli orkiestrator to dopuści.
- Nie tworzyłem żadnych sesji, zadań ani tasków; nie integrowałem, nie pushowałem, nie deployowałem.
