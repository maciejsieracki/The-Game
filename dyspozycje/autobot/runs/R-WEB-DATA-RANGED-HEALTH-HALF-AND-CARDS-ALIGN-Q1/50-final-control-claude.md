# R-WEB-DATA-RANGED-HEALTH-HALF-AND-CARDS-ALIGN-Q1 — raport Final Control (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (balans danych jednostek + karty)
TEMAT: R-WEB-DATA-RANGED-HEALTH-HALF-AND-CARDS-ALIGN-Q1
GOAL: zdrowie dystansowych x0,5 wg tabeli właściciela; Oszczepnik Zulu / Estólica atak dystansowy 5 (Estólica zdrowie 10); karty = wartości liczone przez silnik; łańcuch „Zastąp” dopasowany (Estólica -> tylko Łucznik, wariant A).
BAZA: cc3c80b171b9c625f1060ea4e316dbefa061a832 (origin/main w chwili dispatchu; worktree FC na 009cb5c69).
KANDYDAT: 009cb5c69 (kod = ad372cdb6; 009cb5c69 dodaje tylko raport Obrony).
ZMIANY/COMMIT: kandydat do integracji (kod) = 009cb5c69; ten raport = osobny commit potomny (SHA w polu `report_sha` wyniku). Kod nie jest zmieniany przez FC.

## Weryfikacja struktury
- `git merge-base --is-ancestor cc3c80b17 009cb5c69` = TAK; `ad372cdb6` jest przodkiem `009cb5c69`: TAK.
- `git log cc3c80b..009cb5c69`: fb17e765a (Operator), ad372cdb6 (Obrona, fieldPower), 009cb5c69 (raport Obrony).
- `git diff --stat cc3c80b 009cb5c69`: 11 plików (units.json, ai-era-unit-promotion.ts, 7 testów w gra/tools, 2 raporty); brak gra-robocza, WERSJE.md, battleScene.ts, main.ts.
- Własny diff pól units.json vs baza (skrypt porównujący wszystkie 75 rekordów, każde pole): zmienione wyłącznie pola z dispatchu + `fieldPower` (cache) — zgodnie z raportami: health 11 jednostek (Oszczepnik 8, Zulu 10, Estólica 10, Łucznik + 5 narodowych 10, Procarz 8, Procarz Huaracoc 8), missileAttack Zulu 4->5 i Estólica 4->5, „Zastąp specjalnie” Estólicy -> „Łucznik”, „Atak dystansowy” karty (Hastati 3->4, Rydwan egipski 8->10, Łucznik akadyjski 6->5, Łucznik asyryjski 6->4, Katapulta 8->4, Drużynnik 0->7, Jeździec z oszczepami 4->14, Thorakites 0->6, Evocati 0->6, Gwardzista z champi 0->5, Zulu i Estólica ->5), „Zasięg ataku (hex)” „—”->2 dla Drużynnika/Thorakites/Evocati/Gwardzisty z champi. Hastati 38, Wojownik germański, Medżaj, konne, rydwany, Katapulta (zdrowie) bez zmian. Mnożniki ranged_damage_mult nietknięte.
- ai-era-unit-promotion.ts: dodany wyłącznie wpis 'Oszczepnik (Estólica)' do JAVELIN_TO_ARCHER_SOURCES (wyjątek AI jak dla Zulu) + komentarz.

## Zarzuty Evaluatora — rozstrzygnięcie
1. Cache `fieldPower` Oszczepnika / Zulu / Estólicy niespójny z `fieldPower()`: ODDAL (już NAPRAWIONE przez Obronę w ad372cdb6; nie wymaga dalszej poprawki). Weryfikacja własna: units.json w kandydacie ma fieldPower 8 / 11.5 / 9.5 = wartości z `fieldPower()` podanych przez Evaluatora; test ranged-damage-mult-test (WSZYSTKIE PASS) zawiera asercje cache == fieldPower().total dla tych trzech; unit-power-test 6/0. Odstępstwo od wprost wymienionej allowlisty (pole `fieldPower`) uznaję za uzasadnione (cache pochodny od health/ataku; komentarze siegeDefenders.ts / ai-difficulty-bonus.ts wymagają spójności; test unit-card-ranged-mult-test tego wymaga) — NOTA dla orkiestratora.
2. Brak Chromium i pomiaru skutku balansowego: ODDAL jako NIE_ZMIERZONO (dispatch kryterium (d) i (e) dopuszcza „NIE ZMIERZONO”; (e) jest informacyjne i `hit-mode-archers-vs-warrior-sim` nie czyta zmienionego health, więc nie mierzy skutku). Nie jest to defekt kodu; nie blokuje. Brak realnego Chromium: w FC nie uruchomiono przeglądarki (brak zainstalowanych przeglądarek Playwright; karty weryfikowane testami jsdom/renderera kart, patrz niżej).
Żaden zarzut nie wymaga NAPRAW w tej rundzie => nie FAIL. Brak punktu DO DECYZJI CZŁOWIEKA poza obserwacjami niżej.

## TESTY (surowe wyniki z tego FC, katalog gra/, kandydat 009cb5c69, `npm ci --ignore-scripts` exit 0)
- `npx tsc --noEmit`: exit 0
- 5 bramek referencyjnych: logic-test 0 „LOGIC OK (213/213)”; tech-tree-test 0 „20 pass, 0 fail”; research-test 0 „PASSED: 33 / FAILED: 0 ... ALL GREEN”; unit-replace-test 0 „WSZYSTKIE TESTY ZIELONE (21/21)”; combat-test 0 „COMBAT TEST: 6/6 pass”. Wszystkie = wartości referencyjne z R-PROC-AUTOBOT §6.
- unit-power-test 0 „6 pass, 0 fail”.
- Testy tematu: ranged-health-card-align-test 0 „5 pass, 0 fail”; unit-card-ranged-mult-test 0; unit-replace-archer-slinger-test 0 „51 OK, 0 FAIL”; unit-replace-promotion-table-test 0 „PASS: 32 wpisów źródłowych, 63 krawędzi, brak cykli”; ai-era-unit-promotion-test 0 „17 passed, 0 failed”; archers-health-dist-data-test 0 „10 pass, 0 fail”; units-health-single-field-test 0 „ZIELONO” (w tym mutacja health=40 wykryta); ranged-damage-mult-test 0 „WSZYSTKIE PASS”; unit-replace-multitype-walk-test 0 „25 OK, 0 FAIL”; ai-unit-replace-same-rules-test 0 „45 passed, 0 failed”; unit-context-card-test 0 „29 pass, 0 fail”.
- Testy sąsiednie (zależne od zdrowia/ataku strzelców): ai-army-composition-per-civ-test 341/0; ai-test 297/0; battle-formation-rules-test PASS; pr141-g1-combat-activation-test PASS; city-defense-terrain-gate-test 34/0; city-militia-no-defenders-test 110/0; militia-garrison-contract-test 17/0; structure-defense-bonus-test 8/0; army-scout-not-leader-test 19/0; hit-mode-consistency-test 8/0; map-field-battle-test 24/0; post-battle-map-test 32/0; bitwa-auto-atak-wielojednostkowy-evaluation-test 10/0; ai-mp-military-cap-test 18/0; battle-ranged-mounted-doctrine-test 10/10; general-eligible-unit-roster-test 137 checks PASS.
- CZERWONE, porównane z bazą (data/units.json podmieniony na wersję z cc3c80b; po pomiarze przywrócony kandydat, `git status` czysty): unit-epoch-cost-test 56/1 (kandydat) = 56/1 (baza), „Bronze mount stock + horse supplement”; fortify-pole-test 39/2 (kandydat) = 39/2 (baza); unit-replace-full-cost-test 39/1 (baza; kandydat Obrony 39/1) — identyczne na bazie, dług bazowy niezwiązany z tematem. Wniosek: brak regresji.
- Wiki: `node tools/bundle-wiki-for-game.cjs` -> `git status` bez zmian (wikiBundle bajt-identyczny; generator nie zawiera kolumn zdrowia/ataku z units.json).
- Kryterium (g) mutacja łańcucha: promotion-table-test porównuje każdą krawędź z EXPECTED_TABLE (zmiana wpisu = czerwony); archer-slinger-test 51 asercji obejmuje Estólicę -> Łucznik; Evaluator potwierdził mutację cofnięcia wyjątku AI. Osobnej mutacji „usunięcie wpisu” FC nie uruchamiał (NIE ZMIERZONO osobno).

## BLOKADY
Brak blokad technicznych. NIE ZMIERZONO: żywy Chromium (karty Łucznika/Estólicy/Drużynnika); skutek balansowy zdrowia x0,5 (pomiar „przed” nie istnieje, symulacja hit-mode nie czyta health); osobna mutacja usunięcia wpisu łańcucha.

## UWAGI-DLA-ORKIESTRATORA
1. Obserwacja do właściciela (iii, bez zmian kodu): przejścia „Zastąp”, w których cel ma mniej zdrowia/ataku niż źródło: Łucznik (10/4) i narodowi łucznicy (10, atak 4-6) -> Procarz (8/4): HP spadek -2; Oszczepnik (8/4) -> Łucznik (10/4): HP wzrost; Zulu i Estólica (10/5) -> Łucznik (10/4): atak -1. „Zastąp” za pełny koszt bywa osłabieniem.
2. Dług Rust: REPIN units.json (health, missileAttack, Atak dystansowy, Zasięg, Zastąp specjalnie Estólicy, fieldPower) i tabeli zamian.
3. Dług bazowy: cache fieldPower machin (Taran, Taran okuty, Katapulta, Wieża oblężnicza) vs armyFieldPower=0 — osobny temat.
4. Statyczna tabela rosteru w wikiBundle (Civpedia, „Oszczepnik (Estólica) ... 9 | 1 ... 12”, „Procarz (Huaracoc) ... 8 | 1 ... 12”) to ręcznie pisany tekst o starych wartościach, nie generowany z units.json; był nieaktualny już na bazie, poza allowlistą tematu — kandydat na osobny temat dokumentacyjny (DOC-CIVPEDIA).
5. Jeździec z oszczepami: missileAttack 14 = melee Atak 14 (możliwa kopia) — bez zmian wg decyzji właściciela.
6. Przed deployem na ROBOCZĄ zalecany jednorazowy pomiar Chromium kart (kryterium d) przez osobny temat/LIVE-VERIFY.
7. Sprzątanie: w worktree FC jest gra/node_modules (ignorowany przez git) — do usunięcia razem z worktree.

RUNDY: 1/5 (FC po Operator r1 + Evaluator + Obrona r1). Ostatni werdykt: PASS-WITH-NOTES.
NASTĘPNY KROK: integracja orkiestratora kandydata kodu 009cb5c69 (merge do main z kontrolą `git merge-base --is-ancestor` i `git diff --stat`), potem build poza repo, deploy na ROBOCZĄ dopiero po osobnej autoryzacji; REPIN Rust jako dług.
DEPLOY/PUSH: NIE WYKONANO
