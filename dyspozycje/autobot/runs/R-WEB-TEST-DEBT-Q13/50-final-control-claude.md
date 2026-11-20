# R-WEB-TEST-DEBT-Q13 - Final Control (runda 2/5)

STATUS: PASS-WITH-NOTES (przyrost testowy do integracji; TEMAT NIE ZAMKNIETY - GOAL spelniony czesciowo)
DOMAIN: GAME (testy; zero zmian gra/src, gra/data)
TEMAT: R-WEB-TEST-DEBT-Q13
GOAL: usunac czerwone po FALACH 875-888 w obowiazujacych regulach bez oslabiania asercji; zmierzyc sweep; bledy gry jako kandydaci.
ZMIANY/COMMIT: kandydat 3a34c51f1eb7d81a43a7450e6c0391c5ca3b585c; baza 2127238ace30b2c5a51e78a190f5587a525aa27c jest jego przodkiem (merge-base --is-ancestor rc=0). git diff --stat: 13 plikow, +1564/-42: 8 testow gra/tools/*.cjs + 5 plikow dyspozycje/autobot/runs/R-WEB-TEST-DEBT-Q13/. Zero zmian w gra/src i gra/data (git diff --name-only pusty). Allowlista zachowana.
TESTY (wlasne uruchomienia na 3a34c51f1, wlasne npm ci --ignore-scripts):
- tsc --noEmit exit 0; logic 213/213; tech-tree 20/0; research 33/33; unit-replace 21/21; combat 6/6; unit-power 6/0.
- forced-war-stone 31/0; forced-war-iron 55/0; forced-war-bronze 48/0; forced-war-reguly-multi-turn-simulation 48/0; era-war-bronze-player-target 44/0; wojna-wymuszona-prog-tury-gracz 9/0; war-rules-multiwar-main-guard 21 PASS/0 FAIL; ai-test 297 passed/0 failed (wejsciowo 292/5).
- Spot-check czerwonych spoza zakresu: administracja-stolica-test 52 OK/1 FAIL; army-leadership-test czerwony (assert regex na zrodle: commandersToWithdrawAfterArmyBreak) - potwierdza, ze lista czerwonych jest realna i NIE sklasyfikowana.

OCENA ZARZUTOW (bez etykiet rol):
1. Brak klasyfikacji 156 czerwonych - PRAWDA, nie naprawione. W 31-triage-tabela.md dominuje "przyczyna NIE ZMIERZONO". Zakres dispatchu pkt 3/4 niespelniony. -> wraca do Operatora (runda 3), nie jest ODDAL.
2. forced-war stone/iron/bronze/reguly czerwone - NAPRAWIONE, potwierdzone wlasnymi uruchomieniami (wyzej). Zmiany to aktualizacja pinu 20/25 -> 40 zgodnie z decyzja 2026-11-10 (war-rules-params.json); asercje nie oslabione (te same kontrole, nowe wartosci; petle tur wydluzone proporcjonalnie). Kamien przypiety do stanu kodu (tura globalna) z jawnym KANDYDATEM R-WEB-STONE-ERA-ENTRY-40 - uczciwe, ale to przypiecie znanej rozbieznosci kod vs decyzja, nie jej rozwiazanie.
3. 45 timeoutow - czesciowo zmierzone (obrona: 16 nadal exit 124 przy 300 s); reszta NIE ZMIERZONO. -> runda 3.
4. Lista nowych czerwonych wzgledem FC DIPLOWARLEVEL - NIE ZROBIONE (brak sweepu bazowego). -> runda 3.
5. Niezacommitowane zmiany w worktree -1 (barbarians.ts, .victory-screen-bundle.css) - poza commitem (4 pliki testow + artefakty); w moim worktree czysto. Przyjete jako uwaga; nie integrowac z worktree -1.
Uwaga o ai-test: dodanie garnizonu w T2b/T5d i isProductionAllowed:()=>true w T5a/b/f zmienia przygotowanie scenariusza (powolanie na garnizon min. 1, FALA 857), nie tresc asercji; isProductionAllowed jest opcjonalna bramka w ai.ts:326 - akceptowalne. Zalecam, by orkiestrator potwierdzil to w rejestrze (ABC o czerwonych oryginalnych asercjach garnizonu bylo juz otwarte).
Uwaga: tabela triage powstala przy node_modules symlinkowanym z worktree -1; moje wlasne uruchomienia na czystym npm ci potwierdzaja wyniki.

BLOKADY: ~124 czerwone bez klasyfikacji (np. administracja-stolica 1 FAIL, army-leadership regex na zrodle); 16 timeoutow 300 s; brak sweepu bazowego do porownania z FC DIPLOWARLEVEL; kandydat bledu gry R-WEB-STONE-ERA-ENTRY-40 niezaadresowany.
RUNDY: 2/5 (FC po rundzie 2 obrony)
NASTEPNY KROK: (a) orkiestrator moze zintegrowac 3a34c51f1 jako przyrost testowy (8 testow zielonych, bramki zielone) - ale NIE oznaczac tematu jako zamknietego; (b) runda 3 do tego samego ID: klasyfikacja pozostalych czerwonych wg 32-pierwsze-fail.md (stary pin / martwy / blad gry), sweep na commicie FC DIPLOWARLEVEL do listy "nowe", 16 timeoutow sekwencyjnie; (c) osobny temat R-WEB-STONE-ERA-ENTRY-40.
UWAGI-DLA-ORKIESTRATORA: proces 156 testow byl w tle powloki (przyznane przez obrone); zasada "nie run_in_background" dotyczy kolejnych rund.
DEPLOY/PUSH: NIE WYKONANO
