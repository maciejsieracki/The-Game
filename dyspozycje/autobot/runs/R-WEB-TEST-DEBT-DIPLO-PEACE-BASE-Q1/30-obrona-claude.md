# R-WEB-TEST-DEBT-DIPLO-PEACE-BASE-Q1 — raport Obrony Operatora (runda 1, odpowiedzi na zarzuty Evaluatora)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (testy; bez zmian kodu produkcyjnego)
TEMAT: R-WEB-TEST-DEBT-DIPLO-PEACE-BASE-Q1
GOAL: odpowiedzieć na zarzuty Evaluatora (59ab782d6, raport 20-evaluator-claude.md) — każdy PRZYJMUJĘ (poprawka + dowód) albo ODRZUCAM (dowód); bez osłabiania asercji i bez zmian `gra/src`.
ZMIANY-COMMIT: punkt startu 8a07a11457187af1ee3cbbb539841af00d48ae5b (kandydat), wyjście: patrz SHA w polu `sha` odpowiedzi orkiestratora. Zmieniony plik: `gra/tools/diplo-peace-weaker-seeks-city-only-test.cjs` (+7 linii: asercja h6b). `gra/src`, `gra/data`, `WERSJE.md` nietknięte. Mutacje produkcyjne wykonane i cofnięte (`git status` po każdej: wyłącznie plik testu).

## ZARZUTY EVALUATORA — ODPOWIEDZI

### Zarzut 1 (niski): utrata pokrycia gałęzi `oferuj_miasto_za_pokoj` z rodzajem `pokoj` (h4 na bazie)
Decyzja: PRZYJMUJĘ fakt, KOREKTA treści mojego wcześniejszego raportu, DODANA asercja h6b (dowód nieosiągalności na granicy progu).

Dowód (kod, nie pamięć):
- `gra/src/game/ai.ts:7049-7058`: bezwarunkowy koniec zmęczenia `if (rel.stanWojny && rel.partnerId === '0' && aiPeaceTimeOk && wearinessUnconditionalEndDue(wearyLevel)) { ... continue; }` — sprawdzany PRZED gałęzią miasta (ai.ts ok. 7059-7090).
- `gra/src/game/war-weariness.ts:68-71`: `warWearinessLevel = clamp(turns / pelneTur + wagaStratMiasta * lostCitiesTotal, 0, 1)`; `pelneTur = 20` (`gra/data/war-weariness-params.json:5`).
- `gra/src/game/war-weariness.ts:233-234`: `wearinessUnconditionalEndDue(level) = level >= progKoncaZmeczenia` (= 0,8, `war-weariness-params.json:9`).
- `gra/src/game/ai.ts:6262-6264`: `aiPeaceProposalKind(t) = t < AI_ROZEJM_DO_TUR(20) ? 'rozejm' : 'pokoj'`. Gałąź miasta z rodzajem `pokoj` wymaga więc `turnsAtWarRel >= 20`, a wtedy `level >= 1,0 >= 0,8`.
- Straty tylko podnoszą poziom (`wagaStratMiasta = 0,1`, `Math.max(0, ...)`), więc przy `turnsAtWarRel >= 20` bezwarunkowy koniec ZAWSZE przechwytuje sytuację przed gałęzią miasta. Gałąź jest nieosiągalna dla KAŻDEJ liczby strat, nie tylko przy zerowych.

Korekta do mojego raportu Operatora (10-operator-claude.md, UWAGA 2): „praktycznie nieosiągalna przy zerowych stratach” → poprawnie: „nieosiągalna przy obowiązujących progach (każda liczba strat)”.

Konsekwencja dla testu: stara h4 (30 tur, miasto za pokój, rodzaj pokój) kodowała regułę sprzed decyzji #359/#363 — nie da się jej przywrócić bez zmiany reguły. Nowa h6b pokazuje granicę: przy 16 turach (zmęczenie 0,80) i 6 miastach słabsza AI daje `zaproponuj_pokoj` bezwarunkowy, bez `oferuj_miasto_za_pokoj`. Razem z h4 (14 tur → rozejm z miastem) i h6 (30 tur → bezwarunkowy) pokrywa całą logikę wokół progu.

Decyzja o samej martwej gałęzi w kodzie (usunąć / zostawić jako ścieżkę na wypadek zmiany progów) należy do orkiestratora / właściciela — NIE zmieniam kodu produkcyjnego w tym temacie.

### Zarzut 2 (niski): R6/ZT w main-guard to asercja tekstowa na źródle ai.ts
Decyzja: ODRZUCAM (z dowodem).
- Styl jest pre-existing: w bazie `6a373373e` ten sam plik ma asercje źródłowe R7/ZT (`diplo-war-peace-main-guard-test.cjs:36-38`, `r7ZtOk(MAIN)`) i R3/R6 (`:100`). Przepisanie R6 na behawioralną wykracza poza zakres „dług testowy: nie osłabiać i nie przepisywać na siłę” z dispatchu.
- Wykrywalność udowodniona ponownie przeze mnie (nie tylko przez Evaluatora): mutacja `gra/src/game/ai.ts` `progPrzewagiProc: progPrzewagiWojnyProc,` → `progPrzewagiProc: 20,` daje `FAIL: R6/ZT: priorytet 4 liczy przewagę przez compareMilitaryStrength z progiem charakteru (progPrzewagiWojnyProc)`, wynik `diplo-war-peace-main-guard-test: 34 pass / 1 fail` (exit 1). Plik `ai.ts` przywrócony z kopii; `git status` pokazuje tylko plik testu.

### Zarzut 3 (informacyjny): mutacja G w gate-test nie była odtworzona
Decyzja: PRZYJMUJĘ — mutację odtworzyłem (wcześniej NIE_ZMIERZONO).
- Mutant: `gra/src/game/diplomacy-proposals.ts:1380` `basePn = Math.round(basePnCfg * r5Gate.priceMultiplier * wearyFactor);` → dopisany mnożnik `* (ctx.warState.responderRw >= 0.9 ? 1.8 : 1)`.
- Wynik: `FAIL: G: rw nie jest mnożnikiem ceny pokoju — ten sam stan, rw 0.9 vs 0.5, identyczny bilans PW — {"highRw":-757,"lowRw":-420}`, `diplo-war-peace-gate-test: 23 pass / 1 fail` (exit 1). Plik przywrócony z kopii; `git status` czysty w `gra/src`.
- Uwaga o zakresie asercji G (informacyjnie, zgodnie z zarzutem): dowodzi niezależności od rw dla jednego stanu wojny; nie rozszerzałem go, bo wykracza poza ten temat.

## ZAŁOŻENIA (luki)
- Plik `00-dispatch.md` ani `00-dispatch-DODATEK-claude.md` dla tego tematu NIE występują w `origin/main` ani na `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0` (`git show` zwraca `fatal: path ... does not exist`). Zakres przyjęto z raportów 10-operator-claude.md i 20-evaluator-claude.md (ta sama lista 5 plików i kryteria (a)–(c)), bazą 6a373373e / kandydatem 8a07a1145, zgodnie z zadaniem.
- Bramki referencyjne (ai-test, diplomacy-test, logic, tech-tree, research, unit-replace, combat) NIE były ponownie uruchamiane w tej rundzie: po kandydacie zmieniłem wyłącznie plik `*-test.cjs` (dodanie asercji), `gra/src` i `gra/data` nie zmieniły się. Wyniki bramek z 10-operator-claude.md / 20-evaluator-claude.md stoją (NIE_ZMIERZONO w tej rundzie).

## TESTY (surowe wyjście, lokalnie w worktree, po `npm ci --ignore-scripts` w `gra/`)
Kandydat 8a07a1145 (przed moją zmianą):
- diplo-peace-weaker-seeks-city-only-test: exit 0, `34 pass / 0 fail`
- diplo-war-peace-main-guard-test: exit 0, `35 pass / 0 fail`
- diplo-war-peace-gate-test: exit 0, `24 pass / 0 fail`
- diplo-truce-r1-test: exit 0, `31 pass / 0 fail`
- diplo-truce-r4-ai-test: exit 0, `24 pass / 0 fail`

Po mojej zmianie (h6b dodane):
- diplo-peace-weaker-seeks-city-only-test: exit 0, `PASS: h6b słabsza AI, granica 16 tur (zmęczenie 0,80): ...`, `35 pass / 0 fail`

Mutacje (każda cofnięta, `git status` = tylko plik testu):
- G (diplomacy-proposals.ts:1380, ×1,8 przy rw ≥ 0,9): gate `23 pass / 1 fail`, exit 1 — zabita.
- R6 (ai.ts progPrzewagiProc → 20): main-guard `34 pass / 1 fail`, exit 1 — zabita.

## BLOKADY
Brak. (Ograniczenie: w tej rundzie nie uruchamiałem bramek referencyjnych od nowa — patrz ZAŁOŻENIA.)

## UWAGI-DLA-ORKIESTRATORA
1. Martwa gałąź `oferuj_miasto_za_pokoj` z rodzajem `pokoj` (ai.ts ok. 7074-7090) jest nieosiągalna przy obecnych progach dla każdej liczby strat. Decyzja: usunąć czy zostawić — do właściciela (ABC). Nie zmieniałem kodu.
2. Brak plików DODATEK i 00-dispatch w origin (patrz ZAŁOŻENIA) — do odnotowania przy Final Control.
3. Nie tworzono sesji, nie użyto `run_in_background`, nie integrowano, nie pushowano na `main`.

RUNDY: 1/5 (Obrona)
NASTĘPNY KROK: Evaluator (SONNET) — weryfikacja h6b i mutacji G/R6 z tego raportu; potem Final Control (SONNET).
DEPLOY/PUSH: NIE WYKONANO
