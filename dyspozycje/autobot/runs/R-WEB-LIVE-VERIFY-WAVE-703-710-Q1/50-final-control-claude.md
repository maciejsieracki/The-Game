# R-WEB-LIVE-VERIFY-WAVE-703-710-Q1 — Final Control (Sonnet), runda 2

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (weryfikacja live; tylko narzędzia i dowody, bez zmian w gra/src i gra/data)
TEMAT: R-WEB-LIVE-VERIFY-WAVE-703-710-Q1
GOAL: tabela a–g (ZMIERZONE-PASS / ZMIERZONE-FAIL / NIE_ZMIERZONO z powodem) na kodzie origin/main
ZMIANY/COMMIT: do integracji kandydat b450c4dbedbb70c189e0ad23ac1e39d4f217a38e (dziecko origin/main 800578f29; `git merge-base --is-ancestor 800578f29 b450c4dbe` = exit 0). Diff 800578f29..b450c4dbe: 21 plików, wyłącznie `gra/tools/live-verify-administrator-panel.cjs`, `gra/tools/live-verify-wave-703-710-Q1.cjs`, `gra/tools/live-verify-wave-703-710-civpedia.cjs`, `dyspozycje/autobot/runs/R-WEB-LIVE-VERIFY-WAVE-703-710-Q1/**` (PNG max 595027 B <= 600 KB). Zero zmian w gra/src, gra/data, WERSJE.md. Allowlista zachowana. Ten raport jest osobnym commitem nad kandydatem.

## Weryfikacja własna (kod b450c4dbe, surowe wyjście)
- tsc --noEmit: exit 0
- logic-test: LOGIC OK (213/213)
- tech-tree-test: 20 pass, 0 fail
- research-test: PASSED 33 / FAILED 0
- unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21)
- combat-test: 6/6 pass
- unit-card-stats-engine-canon-test (statyczny, dla punktu a): PASS (brak odczytu kolumn PL w unitAdapter/unitInfoCard/cityPanel; helper unitEngineStats obecny)
- notif-diplo-tab-count-blocking-test (dla punktu f, logika licznika): 25 OK, 0 FAIL
- git diff --check 800578f29..b450c4dbe: czysty
- Dowody z kandydata odczytane: result-seed11.json (negatives/negativesMajor, pageErrors [], aiMajorCount 13), result-civpedia-seed11.json (4 checks ok). NNS_AI_BALANCE_TURN_MIN = 1 w no-negative-stocks.ts:350 (baza zawiera FALĘ 710). Build vite i uruchomienie Chromium nie powtarzane przez FC; pomiary live przyjęte z artefaktów Obrony, spójnych z kodem.

## Orzeczenie wobec zarzutów Evaluatora
| Nr | Orzeczenie | Uzasadnienie |
|---|---|---|
| 1 baza bez FAL 708–710 | ODDAL (naprawione w r2) | Pomiary e/d powtórzone na 800578f29; 4ff1bc8cd/3ac817678/009dbdd0c/dce6ad2ab są przodkami. Wynik e z r1 nieważny, tabela r2 go zastępuje. |
| 2 (d) bez DOM | ODDAL (naprawione) | Nowy skrypt mierzy DOM Civpedii: brak "jeszcze niewdrożone", "od 3 do 7 tur", baza 6. ZMIERZONE-PASS. |
| 3 (a) nie zmierzono | DO NOTATKI | GOAL dopuszcza NIE_ZMIERZONO z powodem; status uczciwy, nie PASS. Powód "brak hooka" słaby, ale FC potwierdził statycznym testem kanonu PASS. Pomiar DOM w 3 miejscach zostaje luką. |
| 4 (f) nie zmierzono | DO NOTATKI | j.w.; licznik (test logiki 25/0) zielony, live z blokującą propozycją niezmierzony. Modal "Audiencja dyplomatyczna" przed akcjami o nieustalonym źródle — do osobnego rozpoznania. |
| 5 (g) słaba dyskryminacja | ODDAL | Obrona jawnie zastrzega pustą kolejkę i brak dowodu mutacyjnego; PASS opisany jako z zastrzeżeniem. |
| 6 (c) szerokości kolumn | ODDAL | Status obniżony do PASS-CZĘŚCIOWY, szerokości 106/119/186 NIE_ZMIERZONO. |
Żaden zarzut nie wymaga NAPRAW w tej rundzie; brak decyzji produktowej od człowieka w zarzutach.

## Tabela końcowa
a 708 NIE_ZMIERZONO (static canon PASS) · b 703 ZMIERZONE-PASS · c 707 PASS-CZĘŚCIOWY (blok mieści się, 6 konfiguracji) · d 709 ZMIERZONE-PASS · e 710 ZMIERZONE-FAIL (seed 11, T2: skarbiec -1 u 6 właścicieli AI, w tym 2 MAJOR: hetyci oid1, chińczycy oid22; T3–T10 czysto; pageErrors puste) · f 705 NIE_ZMIERZONO · g 706 ZMIERZONE-PASS z zastrzeżeniem.

## BLOKADY
Brak blokady procesu. (e) to realny defekt kodu gry, nienaprawiany w tej rundzie zgodnie z GOAL.

## UWAGI-DLA-ORKIESTRATORA
1. Założyć temat R-WEB-* dla (e): ujemny skarbiec AI w T2 po decyzji "AI od tury 1" (no-negative-stocks.ts:350, main.ts:~40593 bankowanie aiSkarbiecByOwner).
2. Temat live-verify r2 dla luk a, f, g (mutacja z niepustą kolejką), c (szerokości kolumn) — wymaga haków ?civTest=1.
3. Niespójność tekstu okna zwolnienia: "administratora ulepszeń" przy nagłówku "Administrator państwa".
4. wikiBundle.json: w haśle "Model relacji" nadal nagłówek "jeszcze niewdrożone".
5. 00-dispatch.md jest tylko na gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0.
6. Przy integracji: integrować b450c4dbe (lub ten commit raportu); bez builda i deployu — tylko narzędzia i dowody.

RUNDY: 2/5 (Final Control po Obronie r2)
NASTĘPNY KROK: integracja orkiestratora (FF/merge tylko narzędzi i dowodów), rejestr, zgłoszenie tematu dla (e)
DEPLOY/PUSH: NIE WYKONANO
