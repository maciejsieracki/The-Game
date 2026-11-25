STATUS: PASS-WITH-NOTES
DOMAIN: GAME (pomiar/analizator; kod gry src/ bez zmian)
TEMAT: R-WEB-ALLIANCE-LIMIT-AI-T66-Q1
GOAL: ustalić, czy limit 2 sojuszy AI↔AI (FALA 865) został przekroczony w t66–67 seed 4242 (AI 1); ustalić ścieżkę albo błąd danych pomiaru; naprawić minimalnie albo DECISION_REQUIRED.
BAZA: 6d29f9cd23e7a074fdad732fff22ce31a2537372 (kandydat rundy 1, detached), dispatch 00-dispatch.md + 00-dispatch-DODATEK-claude.md.

## Odpowiedzi na zarzuty Evaluatora (bc79d94bf)

1. Brak ciągłego biegu seed 4242 do t67 z logiem: PRZYJMUJĘ, wykonane. npm ci w gra/ (71 pakietów), bundle vite poza repo (scratch), runner diplomacy-harder-measure-run.cjs seed 4242, harder 0, player-ai 1, każdy tura zapisana. Przebieg segmentowany (--stop-at 30/35 i wznowienie do 67) z jednym ponowieniem startu po SIGSEGV Chromium przy wznowieniu (harness openWithRetry, 2. próba zadziałała). Liczby: wiersze jsonl 66, tury 2..67. Log zawierania: dyspozycje/autobot/runs/R-WEB-ALLIANCE-LIMIT-AI-T66-Q1/dane/seed4242-alliance-log-t67.txt. NIE ZMIERZONO: czy bieg odtwarza dane WARS4242 (w biegu t66b sojusz 1-13 powstał w t33, w danych WARS w t62); bieg nie jest bajt-w-bajt tym samym przebiegiem.

2. Ścieżka t66 nieustalona z dowodem: PRZYJMUJĘ w części, ustalono:
   - W biegu (log ALLIANCE-PLAN, czyli licznik z activeDeals przekazany do planera, t66) AI 1 miał przed tickiem licznik 1 (tylko 1-19). Jedyne nowe zawarcie AI 1 w t66 to 1-22 (ALLIANCE-SYNC t66 22-1, deal sojusz_aiai_1_22_t66, planer). Przy liczniku 1 bramka przepuszcza, więc 2 sojusze to wynik zgodny z limitem.
   - Pole pokoj=pokoj dla 1-13 w t66-67 oznacza brak wpisu sojuszu w activeDeals (resolvePokojTrustTier, diplomacy-treaties.ts:450). Status=sojusz pozostał z relacji.
   - Dowód stale status: w logu wielokrotnie ALLIANCE-SYNC z sojuszWDeals=false statusPrzed=sojusz (np. t12, t17, t59, t61, t65 — pary bez żadnej umowy alliance). syncRelationFromDeals (main.ts, funkcja) ustawia 'sojusz' lub 'pokoj' tylko gdy znajdzie umowę, nigdy nie zdejmuje 'sojusz' po zniknięciu umowy.
   - NIE ZMIERZONO: ścieżka usunięcia sojuszu 1-13 (zawarty t33, zniknął między t33 a t40; sojusz_aiai_1_13_t40 zniknął między t58 a t66; 1-19 z t33 zniknął między t38 a t58). Cztery instrumentowane ścieżki usuwania (wygaśnięcie w runDiplomacyTurnTick, breakTreatiesOnWar, zerwanie dobrowolne, ścieżka sióstr-zerwań) NIE zalogowały żadnego usunięcia (ALLIANCE-REMOVE = 0). Kandydaci niezinstrumentowani: removeTreatiesById w gałęzi odmowy sojuszu (main, treatiesBrokenByRefusal, dotyczy gracza), filtr po zniszczonym właścicielu (activeDeals.filter !d.strony.includes(ownerId)), usunięcie wasalizacji (findWasalDeal). Nie zweryfikowano, którą z nich trafiono.
   - Hipoteza A (odwrócone strony) ODRZUCAM z dowodem: addTreaty (diplomacy-treaties.ts:292–297) normalizuje strony przez pairKey, więc activeDeals przechowuje zawsze posortowaną parę. Jedyna obserwacja asymetrii to wiersz runu 1 t43 (sync(1,13)=false, sync(13,1)=true), której nie powtórzono w t66b (tam t43 1-13 = true); NIE ZMIERZONO przyczyna tej pojedynczej obserwacji.
   - Hipoteza B (relacja po zniknięciu umowy) POTWIERDZONA runtime: patrz wyżej (sync z statusPrzed=sojusz bez umowy).

3. Brak poprawki, testu, asercji negatywnej, mutacji i biegu weryfikującego: PRZYJMUJĘ i wykonano w tej rundzie. Wybrana ścieżka: błąd danych pomiaru (zgodnie z dispatchem: "jeśli to błąd danych pomiaru — opisz i popraw analizator"). Gra (src/) nie zmieniona: bramka liczy activeDeals i nie przekracza limitu w zarejestrowanych zawarciach.
   - Analizator tools/limits-measure.cjs: sojusz liczony z pola pokoj (activeDeals, resolvePokojTrustTier), nie ze status (relacja). Dodano rozbieznosciStatusPokoj (jawny licznik). Dodano analyzeRows/jestSojuszemDeal (eksport).
   - Test tools/alliance-limit-ai-t66-test.cjs (nowy): 6/6 OK. Asercja negatywna: status bez umowy nie daje naruszenia. Asercja pozytywna: 3 realne sojusze -> naruszenie 1. Mutacja (jestSojuszemDeal -> status): AssertionError "status bez umowy nie może dać naruszenia limitu" = czerwony, przywrócono i ponownie zielony.
   - Analizator na oryginalnych danych WARS4242 (dane/diplo-seed4242-harder0.jsonl.gz, rozpakowane do scratchpad): maxSojuszyAI 2, naruszeniaSojuszyAI 0, rozbieznosciStatusPokoj 2 (1-13 w t66-67). Status-only dawał 3 dla AI 1 w t66. Nowy bieg (t66b, 67 tur): maxSojuszyAI 2, naruszenia 0, rozbieznosci 2. Pierwszy bieg (t66): maxSojuszyAI 2, naruszenia 0, rozbieznosci 30 (stale status).

4. Brak bramek: PRZYJMUJĘ, uruchomiono (liczby z surowego wyjścia):
   - tsc --noEmit -p tsconfig.json: EXIT 0 (bez wyjścia).
   - ai-ai-alliance-limit-test.cjs: "SUMMARY: limit suite OK; mutants detected 4/4 + wiring 4/4", EXIT 0.
   - ai-ai-alliance-tick-test.cjs: "SUMMARY: suite 19/19 OK; mutants detected 8/8", EXIT 0.
   - diplomacy-harder-measure-hook-test.cjs: "WYNIK: 14 zielonych, 0 czerwonych", EXIT 0.
   - ai-ai-alliance-surcharge-test.cjs: "RESULT: ALL GREEN (live + mutants detected)", EXIT 0.
   - alliance-limit-ai-t66-test.cjs: "6/6 OK", EXIT 0 (plus mutacja czerwona, jw.).
   - NIE URUCHOMIONO (uzasadnienie): logic 213, tech-tree 20, research 33, unit-replace, combat 6, ai-test 297/0, era-war-pairing-alliance 19/0, war-rules-multiwar-main-guard 21/0. Powód: commit zmienia wyłącznie gra/tools/*.cjs i dokumentację, src/ bez zmian (diff main.ts pusty po revercie diagnostyki), więc wynik tych bramek jest taki jak na bazie 536ccd093. Orkiestrator może je uruchomić przy integracji.

5. Nie zbadano źródła rozbieżności status vs pokoj ani kiedy status wraca z sojusz: PRZYJMUJĘ. Źródło: relacja nie jest czyszczona po usunięciu umowy (syncRelationFromDeals). Wpływ na grę: status 'sojusz' jest czytany m.in. w klasyfikacji 'ally' (main, funkcja relacji ~24531), w liczniku sojuszy UI (~20447) i przy wyborze celu (~12777). To jest wątpliwość produktowa: NIE zmieniono zachowania gry.

6. Hipoteza A bez miejsca tworzącego umowy: ODRZUCAM z dowodem (addTreaty normalizuje, patrz punkt 2).

## ZMIANY-COMMIT
- gra/tools/limits-measure.cjs: liczenie sojuszy z pokoj (activeDeals), licznik rozbieznosciStatusPokoj, eksport analyzeRows/jestSojuszemDeal.
- gra/tools/alliance-limit-ai-t66-test.cjs (nowy): test analizatora (6 asercji, mutacja czerwona).
- gra/tools/diplomacy-harder-measure-run.cjs: przechwycenie konsoli wierszy [ALLIANCE-*] do <out>/<TAG>.alliance-log.txt (log, bez wpływu na pomiar).
- dyspozycje/autobot/runs/R-WEB-ALLIANCE-LIMIT-AI-T66-Q1/dane/seed4242-alliance-log-t67.txt (log zawierania/usuwania sojuszy, bieg t66b).
- dyspozycje/autobot/runs/R-WEB-ALLIANCE-LIMIT-AI-T66-Q1/diag-alliance-log.patch (diagnostyka main.ts: ALLIANCE-GATE/SYNC/REMOVE/PLAN, log-only; NIE zastosowana w commicie, do odtworzenia dowodu).
- dyspozycje/autobot/runs/R-WEB-ALLIANCE-LIMIT-AI-T66-Q1/30-obrona-claude.md (ten raport).
- gra/src/: BEZ ZMIAN. Diagnostyka usunięta z main.ts (git checkout), zachowana jako patch.

## TESTY
Patrz punkt 4 (liczby z surowego wyjścia). Dodatkowo: mutacja alliance-limit-ai-t66-test.cjs (status-only) -> AssertionError, przywrócono -> 6/6 OK.

## BLOKADY
- NIE ZMIERZONO: ścieżka usunięcia sojuszy 1-13 (t33-40), 1-19 (t38-58), 1-13 (t58-66) bez logu ALLIANCE-REMOVE.
- NIE ZMIERZONO: przyczyna jednorazowej asymetrii sync(1,13)/sync(13,1) w runie 1 t43.
- NIE ZMIERZONO: czy bieg t66b odtwarza dane WARS4242 (różnica w czasie zawarcia 1-13).
- Wątpliwość produktowa (DECISION_REQUIRED dla właściciela, nie rozstrzygane tutaj): czy status relacji 'sojusz' ma być czyszczony po zniknięciu umowy (zmiana zachowania AI/UI).

## RUNDY
2/5 (runda 1: BLOCK; runda 2 = ta obrona).

## NASTĘPNY KROK (dla orkiestratora)
1. Integracja (nie wykonuję): zatwierdzić analizator (pokoj zamiast status) i test; wpisać wynik WARS4242 po korekcie: max sojuszy AI 2, 0 naruszeń.
2. Osobny temat (propozycja dla orkiestratora, bez deployu): znaleźć niezinstrumentowaną ścieżkę usuwania sojuszy AI↔AI (kandydaci wymienieni wyżej; użyć diag-alliance-log.patch) oraz decyzja, czy relacja 'sojusz' ma być czyszczona po zniknięciu umowy.
3. Bramki poza zakresem commita (lista wyżej) uruchomić przy integracji.

UWAGI-DLA-ORKIESTRATORA: jw. (ścieżka usuwania sojuszu jest realnym, nieznanym mechanizmem w silniku, nie tylko artefaktem pomiaru: umowy AI↔AI znikają z activeDeals bez wpisu w logu usunięć).

DEPLOY/PUSH: NIE WYKONANO
