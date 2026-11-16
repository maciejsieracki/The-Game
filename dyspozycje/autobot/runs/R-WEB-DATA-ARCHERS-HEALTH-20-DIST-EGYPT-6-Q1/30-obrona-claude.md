# R-WEB-DATA-ARCHERS-HEALTH-20-DIST-EGYPT-6-Q1 — obrona Operatora (odpowiedź na zarzuty Evaluatora, runda 1/5)

STATUS: DECISION_REQUIRED
DOMAIN: GAME (dane jednostek)
TEMAT: R-WEB-DATA-ARCHERS-HEALTH-20-DIST-EGYPT-6-Q1
GOAL: zdrowie pieszych jednostek łuczniczych = 20 (pola `Health` i `health`); atak dystansowy wg dispatchu (Łucznik 5, egipski 6, nubijski 7). Ten raport nie zmienia kodu; rozstrzyga zarzuty Evaluatora.
BAZA: b160459c9dea67e082ec59dc7770d10cc59c08d4 (origin/main). Kandydat: 42f52a2c3fb620277980e77c78a99ea7b928fdc7 (ancestor-check: OK, `git merge-base --is-ancestor b160459c9 42f52a2c3` = tak).
PUNKT WEJŚCIA: worktree przełączony na `42f52a2c3` (detached). Brak zmian poza tym raportem.

## ZMIANY-COMMIT
- Kod i dane: BEZ ZMIAN względem 42f52a2c3 (ta obrona nie modyfikuje `gra/`, `units.json` ani testów).
- Ten raport: `dyspozycje/autobot/runs/R-WEB-DATA-ARCHERS-HEALTH-20-DIST-EGYPT-6-Q1/30-obrona-claude.md` (jedyny nowy plik commita, dodany ścieżką, bez `git add -A`).
- Stan kandydata (zmierzony `git diff --stat b160459c9 42f52a2c3`): 5 plików, 236 insertions, 21 deletions: `10-operator-claude.md`, `gra/data/units.json`, `gra/tools/archers-health-dist-data-test.cjs` (nowy), `gra/tools/ranged-damage-mult-test.cjs`, `gra/tools/unit-card-ranged-mult-test.cjs`. Zero zmian w `gra/src/**`.
- Weryfikacja pól w kandydacie (ZMIERZONE `git show 42f52a2c3:gra/data/units.json`): wszystkie 6 pieszych łuczników ma `Health` 20 i `health` 20. `Atak dystansowy`: Łucznik 5, egipski 6, nubijski 7, sumeryjski 4, akadyjski 6, asyryjski 6. `missileAttack`: Łucznik 3, egipski 6, nubijski 6, sumeryjski 4, akadyjski 5, asyryjski 4. `fieldPower`: 21, 20, 20, 16, 19, 21.
- Potwierdzenie zarzutu 1 w kodzie (ZMIERZONE `git show 42f52a2c3:gra/src/game/combat.ts`): linia 224 `missileAttack: combatNormField(def['missileAttack'], 0)`; obrażenia dystansowe liczone z `missileAttack` (linie 469-470, 936, 941). `Atak dystansowy` nie jest czytany przez silnik.

## ODPOWIEDZI NA ZARZUTY EVALUATORA

### Zarzut 1 — atak dystansowy nie działa w grze (`missileAttack`, combat.ts:224)
ODPOWIEDŹ: PRZYJMUJĘ ustalenie faktyczne i zmieniam status na DECISION_REQUIRED. ODRZUCAM zmianę kodu w tej rundzie.

Dowód faktów: Evaluator ma rację co do silnika. Zmiana `Atak dystansowy` egipskiego 5→6 nie zmienia zachowania bojowego, bo silnik czyta `missileAttack` (6 już przed zmianą). To samo dotyczy łuczników: `missileAttack` Łucznika zwykłego to 3, nie 5, a nubijskiego 6, nie 7 (patrz tabela w 10-operator-claude.md, pkt 1 DECYZJA-WYMAGANA).

Dlaczego nie zmieniam `missileAttack` samodzielnie:
- Dispatch (GOAL pkt 2 i pkt 4) wskazuje do zmiany pole `Atak dystansowy` i zakazuje zmiany pozostałych parametrów bez wyraźnej decyzji („żadne inne parametry ... NIE zmieniają się”). Wartości `missileAttack` nie ma na liście dozwolonych zmian.
- Ustawienie `missileAttack` (Łucznik 3→5, nubijski 6→7) to realna zmiana siły ostrzału, czyli zmiana balansu. Dobór progów i balansu należy do właściciela (zasada 3 CLAUDE.md), a nie do Operatora.
- Dispatch nie rozstrzyga, czy „atak dystansowy” ma oznaczać pole wyświetlane, czy wartość silnika. Operator nie może zgadnąć tego za właściciela.

Wniosek dla orkiestratora: zadać właścicielowi pytanie ABC, np. (A) zmienić tylko pole wyświetlane (stan kandydata, nic więcej nie wolno), (B) ustawić `missileAttack` Łucznik 5, egipski 6, nubijski 7 (zmiana siły w grze), (C) inny wariant. Rekomendacja Operatora: B, jeśli właściciel chce, by liczba z decyzji działała w bitwie, bo w stanie obecnym decyzja nie ma skutku w grze. Do czasu odpowiedzi kandydat nie powinien iść do integracji jako kompletny.

### Zarzut 2 — kryterium (d), wiki/Civpedia niezgodne i NIE ZMIERZONE
ODPOWIEDŹ: PRZYJMUJĘ, że kryterium (d) NIE zostało spełnione, i wyjaśniam przyczynę. ODRZUCAM naprawę w tej rundzie.

Dowody (ZMIERZONE):
- `gra/tools/bundle-wiki-for-game.cjs` czyta wyłącznie `docs/PORADNIK-GRACZA` i `docs/encyklopedia` (linie 9-10) i zapisuje `gra/src/data/wikiBundle.json`. Nie czyta `units.json`. Regeneracja generatorem nie może więc zaktualizować liczb, które są ręcznie wpisane w markdownie. Dlatego `git status` po regeneracji nie pokazał zmiany bundla (potwierdzenie z 10-operator-claude.md).
- Tabela `docs/PORADNIK-GRACZA/57-katalog-jednostek.md:30` podaje Łucznika „Moc” 17.5, a bundle ma `Moc w polu` 17.5 dla Łucznika. Wartość `fieldPower` w `units.json` na bazie b160459c9 wynosiła 19, a na kandydacie 21. Niezgodność istniała więc przed tym tematem, a obecny temat ją tylko poszerza.
- Pole „Moc w polu” w docs nie jest tym samym co `fieldPower` w `units.json` (inna formuła / inna data kalibracji; w bazie już 17.5 vs 19 przed zmianą). Ręczne przepisanie 17.5 → 21 byłoby zgadywaniem formuły, a nie dowodem spójności.
- Dispatch dopuszcza wariant „lub wypisz NIE ZMIERZONO”. Ten wariant jest prawdziwy dla kryterium (d) w zakresie liczb wiki.

Stan do zapisania w rejestrze jako dług: NIE ZMIERZONO spójności wiki z `fieldPower` (Łucznik docs 17.5 / bundle 17.5 / units 21). Wymaga osobnej decyzji: które pole „mocy” ma być źródłem dla wiki i czy poradnik powinien być zaktualizowany ręcznie. Ten sam dług dotyczy pozostałych łuczników (np. egipski w docs/encyklopedia, nie sprawdzony wiersz po wierszu w tej rundzie).

## TESTY
W tej rundzie nie zmieniano kodu, więc nie uruchamiano nowych bramek (NIE ZMIERZONO w tej rundzie). Wyniki z runu 1 (surowe wyjście z 10-operator-claude.md, commit 42f52a2c3) są cytowane bez ponownego pomiaru:
- `node tools/archers-health-dist-data-test.cjs` — 9 pass, 0 fail.
- `tsc --noEmit` — exit 0; logic-test 213/213; tech-tree-test 20/0; research-test OK; unit-replace-test 21/21; combat-test OK.
- Evaluator (cytowany, nie mój pomiar): 88 testów porównane z bazą b160459c9, zbiór czerwonych identyczny (17 pozycji, dług bazowy), 3 testy `battle-*` timeoutują na bazie i na kandydacie.
- Stan długu bazowego do zapamiętania: `bitwa-auto-atak-wielojednostkowy-evaluation-test`, `city-defense-terrain-gate-test`, `structure-defense-bonus-test`, `fortify-pole-test` — czerwone przed i po zmianie.

## BLOKADY
- Zarzut 1 wymaga decyzji właściciela (pytanie ABC) przed integracją. To jest jedyna blokada.
- Zarzut 2: dług wiki, bez blokady wykonania testów; wymaga decyzji o źródle „Mocy”.

## UWAGI-DLA-ORKIESTRATORA
- Status zmieniony z PASS-WITH-NOTES na DECISION_REQUIRED, bo pkt 1 dotyczy celu tematu (efekt w grze), nie tylko notatki.
- Znaleziska poza zakresem (do decyzji orkiestratora, nic nie zakładam): stare snapshoty `gra/tools/intrinsic-unit-power*.md`, `gra/tools/TW-v3-migracja-jednostek.md`, `gra/tools/dystans-*`, `gra-robocza/*.md`, `Civ-UNITS/*.md` zawierają stare liczby łuczników (wskazane w 10-operator-claude.md).
- Evaluator zarzucił kryterium (d) „NIE ZMIERZONE”; zgodnie z dispatchem nie tworzono nowego tematu (brak `spawn_task`).

RUNDY: 2/5 (runda obrony po zarzutach Evaluatora; pierwsza runda Operatora 1/5)
NASTĘPNY KROK: orkiestrator zadaje właścicielowi pytanie ABC o znaczenie „atak dystansowy” (pole wyświetlane vs `missileAttack`) i decyduje o długu wiki. Po odpowiedzi właściciela: osobny dispatch (jeśli wybrano B: zmiana `missileAttack` w `units.json` + aktualizacja asercji testów), potem Evaluator i Final Control.
DEPLOY-PUSH: NIE WYKONANO
