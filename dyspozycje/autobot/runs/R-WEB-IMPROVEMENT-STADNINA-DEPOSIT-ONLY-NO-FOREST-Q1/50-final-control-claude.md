# R-WEB-IMPROVEMENT-STADNINA-DEPOSIT-ONLY-NO-FOREST-Q1 — Final Control (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-IMPROVEMENT-STADNINA-DEPOSIT-ONLY-NO-FOREST-Q1
GOAL: stadnina nie stoi na heksie z Lasem (gracz, autopilot, AI); koszt/przychod/epoki bez zmian.
ZMIANY/COMMIT: kandydat 7feb168dc; `git merge-base --is-ancestor ea8f701 7feb168dc` = TAK (2 commity: 5713c531, 7feb168dc). diff --stat: 8 plikow (improvement-build.ts, terrain-improvements.json [tylko tekst warunku], 4 testy .cjs, 2 raporty). `git diff --check` czysty. Kod gry zmieniony tylko w isStadninaBlockedOnForest / isImprovementBlockedOnForest / FOREST_COEXIST (bez 'stadnina') — kwalifikacja stadniny; koszty/epoki nietkniete.

TESTY (wlasne uruchomienia na 7feb168dc, surowe wyniki):
- tsc --noEmit: exit 0; logic-test 213/213; tech-tree 20/0; research 33/0; unit-replace 21/21; combat 6/6; ai-territory-race 29 OK/0 FAIL
- stadnina-las 28/0; stadnina-konie-stare-zapisy 29/0; map-improvement-qualify 134/0; stadnina-early-eras-deposit-only 35/0; stadnina-early-eras-ai-picker 23/0; auto-improvements 46/0; ai-improvements 56/0
- hodowla-las 110/3. Baza ea8f701 uruchomiona przeze mnie (git archive): 106/7; tych 3 czerwonych (GRACZ stadnina na golej Lace; 2x AUTOMAT/AI runda 3) jest na bazie, nie dotycza lasu (era-gate / sasiedztwo zelaza) -> Q11.
- Mutacja (isStadninaBlockedOnForest -> return false): stadnina-las 24/4, map-improvement-qualify 131/3, stadnina-konie-stare-zapisy 28/1 — testy lapia regresje. Kod przywrocony (git checkout), status czysty.
NIE ZMIERZONO: bieg dymny AI <=45 tur seed 4242 w przegladarce (nie uruchomiony; seed 4242 nie ma zlozy konia, wiec nie dowodzi reguly); pomiar generateMap 90210/777/31415 (las=0) tylko z raportu Operatora r1, nie powtorzony.

OCENA ZARZUTOW:
1 (stadnina-las-test) i 2 (stare-zapisy): NAPRAWIONE (28/0, 29/0) — zasadne, zamkniete.
3 (hodowla-las 110/3): ZASADNY co do niespelnienia 106/0 z dispatchu, ale przyczyna pre-existing (dowod: baza 106/7) -> uwaga, nie FAIL.
4 (stadnina poza zlozem od epoki 3): dispatch sprzeczny; ZALOZENIE A Operatora (zakaz dotyczy lasu, epoki zachowane) jest zgodne z "zachowaj ograniczenia epok" i zakazem zmiany epok -> uwaga dla orkiestratora/wlasciciela.
5 (allowlista): improvement-build.ts jest jedynym miejscem reguly (wzorce `improvement-qualify*`/`map-improvement*` nie istnieja; dispatch sam nazywa buildImprovementQualifier); zmiana ograniczona do stadniny -> akceptowane, orkiestrator ma potwierdzic.
6 (tekst JSON): NAPRAWIONE.
7 (bieg dymny): NIE ZMIERZONO — uwaga, nie blokada (regula pokryta testami + mutacja).
8 (komentarze): NAPRAWIONE.

BLOKADY: brak technicznych. Do decyzji orkiestratora: (a) allowlista improvement-build.ts, (b) ZALOZENIE A, (c) 3 czerwone hodowla-las -> Q11, (d) bieg dymny 4242 po integracji.
RUNDY: 1/5
NASTEPNY KROK: integracja orkiestratora (sprawdz is-ancestor + diff --stat), potem READY_FOR_DEPLOY.
DEPLOY/PUSH: NIE WYKONANO
UWAGI-DLA-ORKIESTRATORA: hodowla-las-test w Q11 powinien dostac naprawe/zmiane 3 asercji; node_modules w worktree to symlink (ignorowany).
