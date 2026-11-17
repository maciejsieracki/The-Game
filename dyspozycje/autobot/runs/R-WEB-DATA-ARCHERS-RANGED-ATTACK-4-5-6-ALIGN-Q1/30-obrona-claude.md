STATUS: PASS-WITH-NOTES (obrona r1: zarzut 1 PRZYJĘTY i naprawiony; werdykt końcowy należy do Final Control)
DOMAIN: GAME
TEMAT: R-WEB-DATA-ARCHERS-RANGED-ATTACK-4-5-6-ALIGN-Q1
GOAL: Łucznik/egipski/nubijski: "Atak dystansowy" i missileAttack = 4/5/6, zsynchronizowane powielenia, brak nowej czerwieni względem bazy.
ZMIANY-COMMIT: baza origin/main 439b1e1ae; kandydat Operatora d86802c79; obrona = commit SHA_OBRONA (podany w odpowiedzi orkiestratora) na gałęzi wykonawczej, zmienione pliki:
- gra/data/units.json: Łucznik fieldPower 21 -> 22 (runtime dla missileAttack 4), Łucznik egipski fieldPower 20 -> 19 (runtime dla missileAttack 5). Nubijski (missileAttack 6, fieldPower 20) bez zmian: test "Łucznik nubijski" w ranged-damage-mult-test PASS.
- gra/tools/ranged-damage-mult-test.cjs: dwie asercje armyFieldPower zaktualizowane z 21/20 na 22/19 (nowa moc z missileAttack 4/5, ta sama wartość co runtime; test nie został osłabiony, asercja nadal porównuje z wynikiem armyFieldPower).

ODPOWIEDZI NA ZARZUTY:
1. PRZYJMUJĘ. Dowód przed poprawką (kandydat d86802c79, node gra/tools/ranged-damage-mult-test.cjs): "FAIL armyFieldPower Łucznik (health 20) = 21: 22", "FAIL armyFieldPower Łucznik egipski = 20: 19"; unit-card-ranged-mult-test: "Error: Łucznik units.json fieldPower 21 matches runtime" (exit 1). Przyczyna: cache fieldPower w units.json nie został przeliczony po zmianie missileAttack; asercje w teście także były z wartościami sprzed zmiany. Poprawka: cache 22/19 (wartości, które runtime zwraca w tym samym teście), asercje 22/19. Dowód po poprawce: ranged-damage-mult-test exit 0, 0 linii FAIL; unit-card-ranged-mult-test exit 0 (Łucznik units.json fieldPower matches runtime; Łucznik card field power 22 matches armyFieldPower).
   Uwaga: Operator w r1 nie uruchomił tych dwóch testów (przyznaję brak; kryterium (b) to obejmowało). Teraz uruchomione.
2. Brak zarzutu w tym punkcie (balans NIE ZMIERZONO - uczciwie zadeklarowane). Zgadzam się, że zmiana fieldPower wpływa na moc AI/auto-walki; to część zmiany danych objętej decyzją właściciela.

TESTY (surowe wyniki, Node v22.22.0, npm ci w gra/ wykonane ponownie w worktree; po poprawce):
- tsc --noEmit: exit 0
- ranged-damage-mult-test: exit 0 (0 FAIL)
- unit-card-ranged-mult-test: exit 0
- archers-health-dist-data-test: ALL GREEN
- json-descriptions-sync-test: 19 pass / 0 fail
- logic-test: LOGIC OK (213/213)
- tech-tree-test: 20 pass, 0 fail
- research-test: ALL GREEN
- unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21)
- combat-test: "All sanity checks passed."
- Pojedynek 20 vs 20 (balans): NIE ZMIERZONO (brak harnessu w tej rundzie).
- Znany dług bazowy (nie regresja, według Evaluatora): fortify-pole-test 39/2 na bazie i kandydacie; nie dotykany.

BLOKADY: brak (poza NIE ZMIERZONO balansu)
RUNDY: obrona r1 (po FAIL rundy 1/5 Evaluatora); kolejna runda Evaluatora/FC z tym samym ID
UWAGI-DLA-ORKIESTRATORA:
- Dług Rust: REPIN units.json (łucznicy 4/4, 5/5, 6/6) oraz pola fieldPower po zmianie missileAttack.
- Operator nie zmieniał dokumentacji/wiki (zgodnie z zakresem: zarzut dotyczy wyłącznie cache fieldPower i testu).
NASTĘPNY KROK: Evaluator (ten sam ID) weryfikuje commit obrony; potem Final Control.
DEPLOY/PUSH: NIE WYKONANO

---

## RUNDA 2/5 (Obrona Operatora, Haiku 5.5) — odpowiedź na zarzuty Evaluatora r2 (kandydat 0262dd843)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (dane jednostek, balans; test)
TEMAT: R-WEB-DATA-ARCHERS-RANGED-ATTACK-4-5-6-ALIGN-Q1
GOAL: jak w dispatchu: Łucznik 4 / egipski 5 / nubijski 6 (decyzja 2026-11-17); odpowiedź na 4 zarzuty Evaluatora; pomiar 20 vs 20 (kryterium e); wykaz mechanik wybierających jednostkę dystansową (pkt 2 DODATKU 1).
BAZA/KANDYDAT: kandydat 0262dd8435662c19340a20de1121b576b80f1738 (`git merge-base --is-ancestor 2cd4044104f11aa7ee59c6840a6c69266e24e105 HEAD`: TAK). Worktree odłączony (`git checkout --detach`), `git status` czysty.
ZMIANY-COMMIT: kod i dane kandydata NIE zmienione w tej rundzie (odpowiedzi to dowody, pomiary i opis). Commit obejmuje wyłącznie ten plik raportu (`git add` jawną ścieżką). SHA raportu: podany w polu sha odpowiedzi orkiestratora.

ODPOWIEDZI NA ZARZUTY (z Evaluatora r2, `20-evaluator-claude.md`, commit c73497f5):

1. PRZYJMUJĘ (kryterium e, pojedynek 20 vs 20). Evaluator ma rację: harness walki istnieje (`gra/tools/barb-warrior-audit-sim.cjs` bundluje prawdziwe `resolveCombat`/`combatUnitFromDef` i stałe ziarno LCG), a mój poprzedni zapis „NIE ZMIERZONO — brak harnessu” był błędny. Pomiar wykonany w tej rundzie (skrypt poza repo: `/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/duel/army.cjs`, bundle `.../duel/bundle.cjs` z `gra/src/game/combat.ts` i `hit-mode.ts` kandydata; dane `units-base.json` = `git show 6ddb8c2d2:gra/data/units.json`, `units-cand.json` = `gra/data/units.json` kandydata). Sekwencja 20 jednostek vs 20 jednostek: sekwencyjne 1v1, zwycięzca zostaje z pozostałym HP, 200 prób (ziarno LCG 5000+t·104729), tryb „losowe”; tryb „pewne” deterministyczny.

   Surowe wyniki (liczby z wyjścia skryptu):

   | Pojedynek (atakujący vs obrońca) | Dane | Wygrana atakującego (armia) | Stracone HP atakującego | Stracone HP obrońcy | Ocaleli atakujący (śr.) |
   |---|---|---|---|---|---|
   | Łucznik vs Wojownik, losowe | baza 6ddb8c2d2 (silnik 3) | 93,0% | 52,1% | 76,7% | 19,66 |
   | Łucznik vs Wojownik, losowe | kandydat 0262dd843 (silnik 4) | 100,0% | 9,5% | 73,4% | 19,86 |
   | Łucznik vs Wojownik, pewne | baza | 100% | 0,0% | 63,6% | 20,00 |
   | Łucznik vs Wojownik, pewne | kandydat | 100% | 0,0% | 72,7% | 20,00 |
   | Wojownik vs Łucznik, losowe | baza | 12,0% | 76,9% | 56,1% | n/d (przy porażce armii nieuruchomione jednostki liczą się jako żywe) |
   | Wojownik vs Łucznik, losowe | kandydat | 0,0% | 73,7% | 10,7% | n/d (jw.) |

   Pojedynek 1v1 (200 prób, losowe, Łucznik atakuje Wojownika): baza — Łucznik wygrywa 33,0%, Wojownik 62,5%, remis 4,5%; kandydat — Łucznik 84,5%, Wojownik 14,5%, remis 1,0%. Tryb „pewne” 1v1 (1 przebieg, deterministyczny): Łucznik wygrywa 100% na obu danych; pozostało HP Wojownika 36,4% (baza) / 27,3% (kandydat), zgodnie z pomiarem Evaluatora.
   Zgodność z Evaluatorem: kierunek i wielkość zgodne (Łucznik 20v20 baza ~89–93% wygranych i ~47–52% straconego HP vs kandydat ~100% i ~9–10%); różnice w procentach wynikają z innych ziaren i sekwencji. Wojownik-atakujący w armii: Evaluator podał 7,5% (baza), mój pomiar 12,0% — różnica mieści się w zakresie szumu przy 200 próbach i innym ziarnie, nie zmienia wniosku.
   Ograniczenia: model 1v1 sekwencyjny (przybliżenie); NIE ZMIERZONO bitwy taktycznej, szyku, zasięgu w scenie i Chromium.

2. PRZYJMUJĘ (punkt 2 DODATKU 1 wykonany częściowo: AI zakupu i doktryny). Uzupełnienie wykazu (grep `missileAttack` po `gra/src` oraz `max|sort|reduce` przy `missile|ranged|dystans`):
   - `gra/src/game/city-towers.ts:77` (`strongestRangedUnitForEra`): remis mocy rozstrzygany zasięgiem — już w raporcie r2 operatora.
   - **AI zakupu — `gra/src/game/ai-army-composition.ts:153–169` (`bestUnitForArmyClass`), używane przez `planCompositionRecruitChain` (ok. l.190–200) dla klasy „dystans”.** Klucz wyboru: najnowsza epoka → jednostka Specjalna z Nacją → WIĘKSZE `fieldPower` (cache z units.json) → tańsza (`-Pieniądz`) → nazwa. Mechanika NIE czyta `missileAttack` bezpośrednio, ale zmiana `missileAttack` 3→4 przesuwa `fieldPower` (22), więc AI wybiera Łucznika nad egipskim (19) w tej samej epoce. Remis `fieldPower` rozstrzyga koszt, potem nazwa.
   - `gra/src/game/ai.ts:5085` (`strengthOf` w `partitionWarArmies`): `armyFieldPower` do podziału armii na wojny, nie do wyboru typu jednostki — opisane, bez zmian.
   - `gra/src/main.ts:20893`: `sort` po polu `dystans` (odległość heksowa), nie po ataku dystansowym — poza zakresem.
   - `gra/src/game/ai-difficulty-bonus.ts:47–56`: skalowanie `missileAttack` per poziom trudności; kasuje cache `fieldPower` — nie jest selektorem.
   - Doktryny: w `gra/src` nie znaleziono selektora doktryn sortującego po `missileAttack` (grep po `doktryn|doctrin` w nazwach plików i po `missileAttack` daje listę powyżej). NIE ZMIERZONO każdej ścieżki doktryny w grze na żywo.
   Wniosek dla orkiestratora: jedyna ścieżka wyboru „najsilniejszej dystansowej” z remisem zależna od danych to wieżyczka murów (zasięg) i zakup AI (fieldPower). Oba zachowania są skutkiem decyzji 2026-11-17 i opisane.

3. ODRZUCAM (informacyjny: brak niezależnej asercji zgodności fieldPower ze wzorem `unit-power.ts`). Dowód, że asercja istnieje: `gra/tools/unit-card-ranged-mult-test.cjs:50–64` liczy `cardPower = fieldPower({...})` z `unit-power.ts` i asertuje `unit.fieldPower === cardPower` („units.json fieldPower … matches runtime”); l.70 asertuje `armyFieldPower(unit) === unit.fieldPower`. Dodatkowo `ranged-damage-mult-test.cjs:115–116` pinuje 22/19 względem `armyFieldPower`. Test wykonany w tej rundzie: exit 0. Brak zmiany.

4. PRZYJMUJĘ jako znalezisko (poza GOAL, bez zmiany). Potwierdzone: `docs/encyklopedia/jednostki/ucznik.md:18,33,49` podaje „Siła w polu” **17.5**; `docs/encyklopedia/jednostki/ucznik-egipski.md:18,33,49` podaje **15**. Obie wartości nie odpowiadają fieldPower z units.json (22 / 19) i były nieaktualne przed tematem. NIE poprawiam dokumentacji w tym temacie (allowlista i GOAL obejmują dane, test i raport). Propozycja: osobny temat DOCS po decyzji orkiestratora (patrz UWAGI).

TESTY (ponowne uruchomienie na 0262dd843, surowe wyniki, Node v22.22.0, `npm ci --ignore-scripts` w `gra/`, 71 pakietów):
- `node tools/city-wall-towers-test.cjs` → `WYNIK: 59 OK, 0 FAIL`, exit 0
- `node tools/ranged-damage-mult-test.cjs` → `RANGED-DAMAGE-MULT: WSZYSTKIE PASS`, exit 0
- `node tools/unit-card-ranged-mult-test.cjs` → exit 0 (`OK Łucznik asyryjski expanded card renders "×2 obrażeń pocisku"`, `OK Oszczepnik expanded card has no "obrażeń pocisku" suffix`)
- `node tools/archers-health-dist-data-test.cjs` → `WYNIK: 10 pass, 0 fail`, `ALL GREEN`, exit 0
- `node tools/json-descriptions-sync-test.cjs` → `19 pass / 0 fail`, exit 0
- `./node_modules/.bin/tsc --noEmit` → exit 0, bez wyjścia
- Bramki: `logic-test.cjs` → `LOGIC OK (213/213)`, exit 0; `tech-tree-test.cjs` → `20 pass, 0 fail`, exit 0; `research-test.cjs` → `ALL GREEN`, exit 0; `unit-replace-test.cjs` → `WSZYSTKIE TESTY ZIELONE (21/21)`, exit 0; `combat-test.cjs` → `All sanity checks passed.`, exit 0
- Tabela test | baza | kandydat (wszystkie testy łuczników): bez zmiany w tej rundzie (kod kandydata identyczny z 0262dd843 zbadanym przez operatora r2 i Evaluatora r2; ich tabele: operator 87 testów, Evaluator 103 testy; NOWA CZERWIEŃ względem bazy: BRAK). Nie liczono ponownie.
- `git status` po testach: czysto (artefakty testów nie pozostały w śledzonych plikach; `gra/node_modules` ignorowane przez git).

BLOKADY: brak blokad technicznych. NIE ZMIERZONO: 16 testów wymagających Chromium/buildu (timeouty), `hotseat-etap6a-input-noop-test`, bitwa taktyczna, gra na żywo, doktryny w grze na żywo.

RUNDY: obrona r2 (runda 2/5 tematu; po werdykcie PASS-WITH-NOTES Evaluatora r2, bez werdyktu końcowego).
NASTĘPNY KROK: Final Control (Sonnet) weryfikuje odpowiedzi 1–4 na kandydacie 0262dd843 i raport; decyzja orkiestratora o pozycjach z UWAG (dokumentacja 17.5/15 i skutki rozgrywkowe).
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA (poza zakresem, do decyzji; nie wykonywane w tym temacie):
- Skutki rozgrywkowe decyzji 2026-11-17 (do właściciela): (a) wieżyczka murów generycznej cywilizacji w Kamieniu strzela Łucznikiem (zasięg 3) zamiast Oszczepnikiem (zasięg 2); (b) Łucznik 3→4 wobec pancerza 2 Wojownika podwaja obrażenia pocisku (2→4) — w pomiarze 20 vs 20 Łucznik wygrywa 100% zamiast 93% i traci ok. 10% HP zamiast ok. 52%; (c) egipski 6→5 (słabszy o 1 w ataku dystansowym).
- Dane pomocnicze do pytania właściciela o „siłę uderzenia” Wojownika (NIE jest to odpowiedź; pytanie należy do orkiestratora): Wojownik ma atak wręcz 4, zdrowie 22, pancerz 2 (units.json, bez zmian w tym temacie). Pojedynek 1v1 Wojownik atakujący Łucznika (losowe, 200 prób): baza — Wojownik wygrywa 68,0%, Łucznik 28,0%; kandydat — Wojownik 12,5%, Łucznik 86,5% (uwaga: ten wiersz pochodzi z mojego 1v1; pomiar armii 20v20 podano wyżej). W armii 20v20 Wojownik atakujący wygrywa 12,0% (baza) i 0,0% (kandydat).
- Dług Rust (bez zmian): REPIN units.json — łucznicy 4/4, egipski 5/5, nubijski 6/6 oraz pola fieldPower 22/19 (cache) i tabela zamian.
- Narzędzia do pomiarów: skrypty pomiarowe pozostają poza repo w scratchpadzie orkiestratora; nie są commitowane.
- Lokalnie: `gra/node_modules` utworzone przez `npm ci --ignore-scripts` w tym worktree (ignorowane przez git) — do usunięcia przy sprzątaniu worktree.
