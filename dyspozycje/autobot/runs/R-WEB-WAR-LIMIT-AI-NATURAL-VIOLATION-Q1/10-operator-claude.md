STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-WAR-LIMIT-AI-NATURAL-VIOLATION-Q1
GOAL: limit 1 wojny naturalnej per cywilizacja obowiązuje także przy wciąganiu sojuszników (seed 4242, AI 28, tury 60–67).
ZMIANY/COMMIT: gra/src/main.ts (+25/-8), nowy gra/tools/war-limit-ai-natural-test.cjs, ten raport. SHA = czubek commita tej rundy (podany w polu sha odpowiedzi).

## 1. Reguła limitu (z kodu i komentarzy)
- gra/src/game/diplomacy-war-limit.ts: "maks. 1 wojna epoki + 1 wojna naturalna naraz per cywilizacja"; `warLimitAllows` odmawia, gdy ATAKUJĄCY lub OBROŃCA ma już tyle wojen danego typu, ile wynosi maksimum (`maxWojenNaturalnych` = 1 w gra/data/diplomacy-war-limit-params.json). Gracz jako deklarujący nie jest ograniczany.
- Brak wyjątku w kodzie dla przyłączenia przez sojusz: komentarz w applyAllianceObligationsOnWar mówi "sojusznik nie dołącza, gdy limit wojen typu T jest przekroczony", a bramka warLimitAllowsDeclaration(allyId, mustDeclareWarOn, typWojny) ją egzekwuje. Wojna dołączona przez sojusz dziedziczy typ wojny źródłowej.
- Brak wyjątku "przejęcie miasta" w bramce. Ścieżka triggerRebelProtectionWarConsequence -> ownerDeclareWarOn(force=true) omija limit (patrz UWAGI 1).

## 2. Ścieżka deklaracji 22↔28 — ustalona (dowód pośredni, NIE log)
- Dane MEAS79 dane/seed4242-all1.jsonl.gz (flagi ON): tura 59 — 7↔28 w 'pokoj', 1↔28 i 22↔28 'neutralni'; tura 60 — 1↔28 i 22↔28 jednocześnie 'wojna' (typ naturalna). Czyli 28 nie miał wojny na starcie tury 60 i w tej samej turze dostał dwie.
- Kod: w głównych ścieżkach (AI wypowiedz_wojne ~main.ts 47349; ownerDeclareWarOn ~14317; hamulec ~12678) applyAllianceObligationsOnWar(attacker, victim) jest wywoływane PRZED setDiploRelation(attacker, victim, 'wojna'). Sojusznik 22 (sojusz z 1, wg dispatchu) sprawdzał limit obrońcy 28 bez wojny głównej, przeszedł i joinAllyToWar(22, 28) ustawił wojnę. Po zapisie głównej wojny 28 miał dwie wojny naturalne.
- Minimalne odtworzenie: seed 4242, tura 60, stos: AI wypowiedz_wojne (1->28) -> applyAllianceObligationsOnWar(1,28,'naturalna') -> warLimitAllowsDeclaration(22,28,'naturalna') z warTypesForOwner(28) bez pary 1↔28 -> joinAllyToWar(22,28).
- NIE ZMIERZONO: log deklaracji z nowego uruchomienia (runner diplomacy-harder-measure-run.cjs + bundle vite w /tmp, ok. 10 min). Ścieżka wynika z danych tur i kodu, nie z logu.

## 3. Naprawa (ścieżka ŁAMIE regułę, nie jest wyjątkiem)
- main.ts: `warTypesForOwner(ownerId, pomijany, pending?)` dopisuje wojnę oczekującą (`pendingPrincipalCounts`: para zawiera ownerId, partner != pomijany, relacja != 'wojna'). `warLimitPermits` i `warLimitAllowsDeclaration` przyjmują `pending`. applyAllianceObligationsOnWar buduje `pendingPrincipal = {a: attackerId, b: victimId, typ: typWojny}` i przekazuje go do bramki sojusznika.
- Zakres: tylko bramka sojusznika w applyAllianceObligationsOnWar. Przy limitWojenAktywny=false warLimitPermits zwraca true jak dotąd, więc parytet zachowany.
- Test: gra/tools/war-limit-ai-natural-test.cjs, PASS 9 / FAIL 0. Mutacja (usunięcie argumentu pendingPrincipal z bramki sojusznika, kopia w scratchpad) daje FAIL 2, test czerwony.

## 4. Bieg weryfikujący seed 4242 do tury 67 — NIE ZMIERZONO
- Powód: bieg ciągły 67 tur wymaga bundla vite poza repo i runnera z Chromium; nie wykonano w tej rundzie. Do zrobienia przez kolejną rundę lub FC: analizator gra/tools/limits-measure.cjs na nowym biegu, oczekiwane 0 naruszeń (maks. wojen naturalnych AI <= 1).

## Bramki (liczby z surowego wyjścia tej rundy)
- tsc --noEmit -p tsconfig.json: exit 0
- tools/war-limit-ai-natural-test.cjs: PASS 9 / FAIL 0 (mutant: FAIL 2)
- tools/diplomacy-war-limit-unit-test.cjs: pass=57 fail=0
- tools/diplomacy-war-limit-analyze-test.cjs: pass=17 fail=0
- tools/alliance-war-obligation-test.cjs: 14 passed, 0 failed
- tools/war-rules-multiwar-test.cjs: 57 OK / 0 FAIL
- tools/era-war-pairing-alliance-test.cjs: 19 pass, 0 fail
- NIE ZMIERZONO w tej rundzie: logic 213, tech-tree 20, research 33, unit-replace, combat 6, ai-test 297/0, ai-ai-alliance-surcharge (pełnych suit nie uruchamiano; do zlecenia FC).
- Instalacja: npm ci --ignore-scripts w worktree gra/ (71 pakietów), tylko dla esbuild i tsc. Nie uruchomiono npm run build/dev.

## UWAGI-DLA-ORKIESTRATORA
1. Ścieżka force=true: triggerRebelProtectionWarConsequence (main.ts ~14377) -> ownerDeclareWarOn(newOwner, rebelPrevOwnerId, true, 'wymuszona_inna') omija warLimitAllowsDeclaration (`!force &&`) i nadaje typ 'naturalna'. Może łamać limit po przejęciu chronionego buntownika. To kandydat na wyjątek "przejęcie miasta" -> DECYZJA właściciela (ABC). Nie kodowano tutaj.
2. Wojna po wygaśnięciu rozejmu: declareWarAfterTruce (main.ts ~13104) ustawia 'wojna_wypowiedziana' bez bramki limitu i bez typu. Nie wystąpiła w seed 4242 (tury 59–60: pokój bez końca rozejmu), ale to kolejna ścieżka łamiąca regułę; wymaga osobnego tematu.
3. Główne ścieżki (hamulec ~12678, AI wypowiedz_wojne ~47349) sprawdzają limit pary głównej PRZED zapisem; ich sojusznicy są teraz objęci tą samą poprawką.

NASTĘPNY KROK: Evaluator (Sonnet) przegląda diff gra/src/main.ts i test. FC: bieg seed 4242 do tury 67 + limits-measure.cjs. ABC do właściciela w sprawie UWAG 1 i 2.
DEPLOY/PUSH: NIE WYKONANO
RUNDY: 1/5
