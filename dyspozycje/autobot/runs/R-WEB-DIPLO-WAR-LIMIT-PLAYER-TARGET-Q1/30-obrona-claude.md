STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-WAR-LIMIT-PLAYER-TARGET-Q1
GOAL: wojna, w ktorej gracz jest celem ataku AI (w tym klaster panstw-miast -> gracz), liczy sie do limitu wojen tej AI za flaga limitWojenAktywny; flaga OFF = parytet.
ZMIANY/COMMIT: gra/tools/diplomacy-war-limit-unit-test.cjs (+sekcja wpiecia bramki w main.ts: 3 asercje zrodlowe; test czyta gra/src/main.ts, env WAR_LIMIT_MAIN_TS do mutacji kopii); ten raport. Kod gry bez zmian (gra/src/main.ts z b358dddde zostaje). SHA: patrz pole sha.

ODPOWIEDZI NA ZARZUTY EVALUATORA:
- Zarzut 1 (wiazanie w testach): PRZYJMUJE. Dodano 3 asercje zrodlowe na main.ts: petla `for (const csOwnerId of clusterDowOwners)` istnieje; linia bramki `if (!warLimitAllowsDeclaration(csOwnerId, ME(), 'naturalna')) continue;` wystepuje dokladnie raz; stoi w petli PRZED `chargeWarDeclarationCredibility(csOwnerId, ME())`. Mutacja B na kopii main.ts (usuniecie linii bramki): unit-test pass=55 fail=2 (FAIL: "wystepuje dokladnie raz: got 0 want 1"; "stoi w petli przed wypowiedzeniem: got false want true"), exit 1. Na prawdziwym pliku: pass=57 fail=0 (bylo 54/0, +3 nowe).
- Zarzut 2 (brak biegu OFF i runtime): PRZYJMUJE jako NIE ZMIERZONO. Nie wykonano biegu 45 tur z klastrem PM->gracz ani biegu OFF: stan maszyny (load ~12 na 4 rdzeniach) i limit foreground 590 s nie mieszcza pelnego biegu 45 tur (poprzedni bieg zatrzymal sie na t44 przy 585 s). Poprawka nie ma dowodu runtime. Proponuje osobny temat pomiarowy (bieg ON z wymuszonym klastrem PM hard do t45 + OFF) po zwolnieniu CPU.
- Zarzut 3 (tabela na odczycie kodu): PRZYJMUJE w zakresie wiazania. Wpiecie bramki jest teraz sprawdzane testem zrodlowym (grep-test main.ts, jak w zarzucie). Logika limitu dla przypadku PM->gracz (wojna naturalna PM z graczem blokuje druga naturalna) pozostaje pokryta testem czystym: "ON: panstwo-miasto w wojnie naturalnej z graczem -> nowa naturalna zabroniona" oraz parytetem OFF.

ZALOZENIE (bez zmiany): obrona gracza jako strony limitu liczy sie tak samo jak w istniejacych bramkach 12512/14235 (warTypesForOwner po stronie ofiary); nie wprowadzono nowego progu.

TESTY (surowe wyniki, ta runda):
- node tools/diplomacy-war-limit-unit-test.cjs: pass=57 fail=0, exit 0
- mutacja B (kopia main.ts bez linii bramki, WAR_LIMIT_MAIN_TS): pass=55 fail=2, exit 1
- node tools/diplomacy-war-limit-analyze-test.cjs: pass=17 fail=0 (bez zmian w kodzie)
- tsc --noEmit: exit 0
- NIE ZMIERZONO w tej rundzie: logic-test, tech-tree, research, unit-replace, combat (kod gry nie zmieniony wzgledem kandydata, ktory je przechodzil); bieg runtime ON/OFF (patrz zarzut 2).

BLOKADY: brak kodowych. Runtime bez dowodu (NIE ZMIERZONO).
RUNDY: 2/5 (runda obrony 1)
NASTEPNY KROK: Evaluator weryfikuje wpiecie testem zrodlowym i mutacje B; decyzja orkiestratora o osobnym temacie pomiaru runtime przed FC.
UWAGI-DLA-ORKIESTRATORA: w worktree dodano symlink gra/node_modules -> gra/node_modules worktree wf_4bb175ca-428-1 (tylko odczyt, esbuild/tsc); nie jest w commicie. Symlink nie zostal usuniety (rm zakazany).
DEPLOY/PUSH: NIE WYKONANO
