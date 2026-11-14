# R-WEB-TEST-DEBT-DIPLO-PEACE-BASE-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (testy; bez zmian kodu produkcyjnego)
TEMAT: R-WEB-TEST-DEBT-DIPLO-PEACE-BASE-Q1
GOAL: pięć testów dyplomacji czerwonych na bazie origin/main 6a373373e przepisać pod obowiązujące decyzje właściciela (zmęczenie wojną 20 tur, siła militarna zamiast rw, globalny próg 10 tur, rozejm 5/10/15), bez osłabiania asercji i bez zmian `gra/src`.

## ZMIANY / COMMIT

Kod produkcyjny nietknięty (`git status` po pracy: wyłącznie 5 plików testów w `gra/tools/`). Mutacje produkcyjne wykonywane na żywo i cofane przez Edit (patrz TESTY, pkt 3).

| Plik testu | Asercje na bazie (pass/fail) | Po zmianie | Zmiana |
|---|---|---|---|
| `gra/tools/diplo-peace-weaker-seeks-city-only-test.cjs` | 29 / 3 (h2, h4, h5) | 34 / 0 | h2: 12 tur (przed końcem zmęczenia, 0,60); h4: 14 tur → `oferuj_miasto_za_pokoj` rodzaj `rozejm` (przed progiem 0,8 i przed 20 turami); h5: 14 tur; NOWE h5b (silniejsza, 30 tur → wyłącznie `zaproponuj_pokoj` bezwarunkowy); NOWE h6 (słabsza, 30 tur → bezwarunkowy pokój, bez miasta) |
| `gra/tools/diplo-war-peace-main-guard-test.cjs` | 34 / 1 (R6/ZT) | 35 / 0 | R6: zamiast literału `compareMilitaryStrength(...).przewaga` sprawdza wiązanie z progiem charakteru (`progPrzewagiProc: progPrzewagiWojnyProc` + `}).przewaga === 'A'`) — ai.ts ~7364 |
| `gra/tools/diplo-war-peace-gate-test.cjs` | 23 / 1 (G) | 24 / 0 | G kodowało usunięty mnożnik siły (rw 0,9 ⇒ ×1,8; `diplomacy-war-peace-profile.ts:436-441`, FALA 695). Nowa asercja: ten sam stan, rw 0,9 vs 0,5 ⇒ identyczny `pwBalance` (dodany wariant `lowRw`) |
| `gra/tools/diplo-truce-r1-test.cjs` | 28 / 2 (P1, P2) | 31 / 0 | P1/P2: rozejm 3 i 9 tur odrzucany globalnym progiem „10 pełnych tur” (gracz→AI, przed bramką profilu), z parytetem komunikatu z pokojem. NOWE P2b: rozejm 12 tur, `responderPozycjaMilitarna: 'silniejsza'` → odrzucenie bramką profilu „AI jest militarnie silniejsza”, parytet z pokojem (bez kwoty PN, bo baza rozejmu ≠ baza pokoju, M2) |
| `gra/tools/diplo-truce-r4-ai-test.cjs` | 23 / 1 (wzorzec M2 trafiał 2 miejsca: applied=2) | 24 / 0 | Mutant M2 zawężony do gałęzi `pending-rozejm` (kontekst `makeDealId('pending-rozejm', `), bo w `diplomacy-proposals.ts` są dwie gałęzie rozejmu (2106 i 2123) |

Dodatkowo: 0 nowych plików pomocniczych, 0 zmian w allowliście poza 5 plikami testów, `gra/src`, `gra/data`, `WERSJE.md`, `gra-robocza/`, `rust-port/` nietknięte.

Commit: patrz sekcja „SHA” w pliku końcowym (czubek brancha operatora). Commit zawiera 5 plików testów + ten raport (`git add` ścieżkami, bez `-A`).

## TESTY

1. Baza (origin/main 6a373373e, przed zmianami; liczby z surowego wyjścia `node tools/<test>.cjs`):
   - weaker-seeks: `29 pass / 3 fail` (h2, h4, h5)
   - main-guard: `34 pass / 1 fail` (R6/ZT)
   - gate: `23 pass / 1 fail` (G)
   - truce-r1: `28 pass / 2 fail` (P1, P2)
   - truce-r4-ai: `23 pass / 1 fail` (mutant M2 applied=2)
   - Razem 8 czerwonych asercji na bazie. Uwaga: `node_modules` w `gra/` nie istniało w worktree; wykonano `npm ci --ignore-scripts` (71 pakietów, bez skryptów; katalog ignorowany przez git). Bez tego weaker-seeks/gate/truce-r1/r4 padały na `Cannot find module esbuild` (to nie jest czerwień merytoryczna).

2. Po zmianach (surowe wyjście):
   - `diplo-peace-weaker-seeks-city-only-test: 34 pass / 0 fail` (exit 0)
   - `diplo-war-peace-main-guard-test: 35 pass / 0 fail` (exit 0)
   - `diplo-war-peace-gate-test: 24 pass / 0 fail` (exit 0)
   - `diplo-truce-r1-test: 31 pass / 0 fail` (exit 0)
   - `diplo-truce-r4-ai-test: 24 pass / 0 fail` (exit 0)

3. Mutacje produkcyjne (kryterium b): każda na pliku źródłowym, uruchomienie testu, cofnięcie przez Edit (bez `git checkout`), na końcu `git status` = tylko 5 plików testów.
   - A: `gra/src/game/ai.ts` — `&& wearinessUnconditionalEndDue(wearyLevel)` → `&& false && ...` (stary przepływ bez bezwarunkowego końca). Wynik weaker-seeks: `32 pass / 2 fail` — padają h6 i h5b.
   - B: `ai.ts` — `progPrzewagiProc: progPrzewagiWojnyProc,` → `progPrzewagiProc: DEFAULT_MILITARY_STRENGTH_PARAMS.progPrzewagiProc,`. Wynik main-guard: `34 pass / 1 fail` — ppada R6.
   - C: `gra/src/game/diplomacy-proposals.ts` — `basePn = ... * wearyFactor;` → dodany mnożnik `×1,8` przy `responderRw >= 0,9` (stara reguła rw). Wynik gate: `23 pass / 1 fail` — pada G (`highRw -757` vs `lowRw -420`).
   - D: `diplomacy-proposals.ts` — `if (r5Gate.verdict === 'stronger')` → `if (false)`. Wynik truce-r1: `30 pass / 1 fail` — pada P2b.
   - E (truce-r4): mutacje produkcyjne są częścią samego testu (M1 `<=`, M2 gałąź rozejmu w propozycji, M3 `rodzaj: 'pokoj'`); wszystkie trzy zabite (`PASS: ... zabity`), zob. wynik `24 pass / 0 fail`.

4. Bramki referencyjne (surowe `pass/fail` z pliku wyjścia):
   - `npx tsc --noEmit`: exit 0, brak wyjścia (0 błędów)
   - `node tools/ai-test.cjs`: `297 passed, 0 failed` (wymóg 297/0: OK)
   - `node tools/diplomacy-test.cjs`: `149 passed, 0 failed (total 149)` (wymóg 149/0: OK)
   - `node tools/logic-test.cjs`: exit 0, ostatnia linia `PASS [213] cityfix...` (wymóg 213/213: OK)
   - `node tools/tech-tree-test.cjs`: `20 pass, 0 fail` (OK)
   - `node tools/research-test.cjs`: `PASSED: 33 / FAILED: 0 / TOTAL: 33` (OK)
   - `node tools/unit-replace-test.cjs`: exit 0, bez FAIL (ostatnie `[OK] cross-type melee matrix…`)
   - `node tools/combat-test.cjs`: exit 0, `All sanity checks passed.` (6/6 wg dokumentacji)
   - `node tools/unit-power-test.cjs`: `=== unit-power-test: 6 pass, 0 fail ===` (OK)

5. Kryterium (c): żaden test zielony na bazie nie stał się czerwony — zmieniono wyłącznie 5 plików testów; wszystkie testy ai/diplomacy/logic/tech/research/unit-replace/combat/unit-power zielone.

## USTALENIA (przyczyny czerwieni, plik:linia)

- h2/h4/h5 (weaker-seeks): `ai.ts` ~7050-7066 — od `wearinessUnconditionalEndDue(wearyLevel)` (poziom zmęczenia = tury/20 + 0,1·straty, `data/war-weariness-params.json` progKoncaZmeczenia 0,8) AI proponuje pokój BEZWARUNKOWY także silniejsza (FALA 689, W58b). Po ok. 16 turach bez strat poziom ≥ 0,8, a od tury 20 poziom ≥ 1,0. Stare asercje (30 tur ⇒ miasto za pokój) kodowały regułę sprzed tej decyzji.
- R6/ZT (main-guard): ai.ts ~7364 — przewaga liczona z progiem charakteru `progPrzewagiWojnyProc` (baza 20% + bias.warSilaBonus); literał `compareMilitaryStrength(...).przewaga` nie występuje.
- G (gate): `diplomacy-war-peace-profile.ts:436-441` — mnożnik siły z ceny usunięty; zostaje tylko mnożnik cywilizacji. rw nie wpływa na cenę pokoju.
- P1/P2 (truce-r1): `diplomacy-peace-proposal-timing.ts` (PEACE_PROPOSAL_MIN_WAR_TURNS = 10) zamyka propozycję gracz→AI przed bramką profilu („Pokój i rozejm dostępne po 10 pełnych turach wojny”).
- M2 (truce-r4): wzorzec mutanta był niejednoznaczny (dwie gałęzie `rodzaj === 'rozejm'`, `diplomacy-proposals.ts` 2106 i 2123).

## UWAGI-DLA-ORKIESTRATORA

1. BRAK DODATKU. Plik `00-dispatch-DODATEK-claude.md` (wskazany w zadaniu na gałęzi `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0`) NIE ISTNIEJE w żadnym zbadanym refie (`git ls-tree`/`git log --all`); w katalogu `R-WEB-TEST-DEBT-DIPLO-PEACE-BASE-Q1/` na tym branchu jest wyłącznie `00-dispatch.md` (commit 2e0207346). Lukę rozstrzygnięto założeniem: zakres = pięć plików i kryteria (a)-(c) z `00-dispatch.md`. Dispatch dopisany tutaj nie został wykorzystany poza tym zakresem.
2. Obserwacja produkcyjna (NIE naprawiana, poza zakresem tematu): gałąź „oferuj miasto za POKÓJ” (ai.ts ~7074, rodzaj `pokoj`) jest praktycznie nieosiągalna dla słabszej AI z zerowymi stratami — zmęczenie = tury/20, więc od tury 20 bezwarunkowy koniec (`continue`) wyprzedza ją. Do tury 19 kind = `rozejm` (`AI_ROZEJM_DO_TUR` = 20, ai.ts:6259). Decyzja właściciela czy taki kształt jest zamierzony — do potwierdzenia (ABC).
3. Zmiana `gra/tools/diplo-truce-r1-test.cjs` P2b: porównanie reason pokój vs rozejm przycinane do ` — miasta` (różna kwota PN jest zamierzona: baza rozejmu ≠ baza pokoju).
4. `gra/node_modules` zainstalowany lokalnie (`npm ci --ignore-scripts`), katalog ignorowany przez git; orkiestrator może usunąć przy sprzątaniu.
5. Nie tworzono sesji, nie użyto `run_in_background`, nie integrowano ani nie pushowano na `main`.

NASTĘPNY KROK: Evaluator (SONNET) — weryfikacja 5 testów (surowe wyjścia w raporcie), mutacji A-D oraz bramek referencyjnych; Final Control po werdykcie.
RUNDY: 1/5
DEPLOY/PUSH: NIE WYKONANO
