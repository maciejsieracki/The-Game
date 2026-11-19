STATUS: PASS-WITH-NOTES
DOMAIN: GAME (narzedzia pomiarowe; gra/src nietkniete)
TEMAT: R-WEB-MEASURE-RUNNERS-REJECT-AI-OFFERS-Q1
GOAL: wspolne odrzucanie wiszacych ofert AI->gracz w runnerach pomiaru ekonomii; proby i potwierdzone odrzucenia rozdzielone.
ZMIANY/COMMIT: kandydat 11eb45c7dfcd20bb745f44725703eecb985857da; `git merge-base --is-ancestor 12da9f405e27ce3905aa7a1ee5c24a502dc268a9 <kandydat>` = OK. `git diff --stat`: 6 plikow (+243/-17): gra/tools/measure-reject-offers.cjs (nowy), measure-reject-offers-test.cjs (nowy), ai-economy-measure-run.cjs, diplomacy-harder-measure-run.cjs, 2 raporty w runs/<ID>/. Wszystko w allowliscie; zero zmian w gra/src, gra-robocza/, gra-kanon/, WERSJE.md, rust-port/. `git diff --check` czyste.
TESTY (wlasne, surowe wyniki, node_modules przez npm ci --ignore-scripts):
- tsc --noEmit: exit 0
- logic-test 213/213; tech-tree 20/0; research 33/0; unit-replace 21/21; combat 6/6
- measure-reject-offers-test: 13 OK, 0 FAIL; mutant (potwierdzenie zawsze +1): 11 OK, 2 FAIL, exit 1 (test czerwony na mutacji)
- ai-economy-measure-hook-test: 23/23 zielone
- diplomacy-harder-measure-hook-test --build 1: 15 zielonych, 0 czerwonych
- ai-ai-alliance-measure-hook-test: WYNIK ZIELONY, 28/28 mutantow wykrytych
- BIEG DOWODOWY ai-economy-measure-run, seed 1234, --turns 42 (swiezy profil): endTurn=42, 41 wierszy jsonl, bez cannot-end; summary: aiOffersRejected=1, aiOffersRejectAttempts=1 (jeden wiersz z 1/1, reszta 0/0) -- oferta t18 odrzucona i potwierdzona, bieg przechodzi daleko poza t18 (wczesniej stal w t18).
Ocena zarzutow: N1 (brak osobnego biegu wrappera alliance) ODDAL jako uwage: wrapper spawnuje ten sam runner, hook-test 28/28 zielony. N2 przyjety i naprawiony przez obrone (asercja 6 kolejnosci reject przed canEnd). N3 naprawiony (asercja 5, proba liczona raz na id w turze). N4 jawnie opisany w naglowku helpera; stare jsonl nieporownywalne w polu aiOffersRejected.
BLOKADY: brak.
NIE_ZMIERZONO: parytet 20 tur seed 4242 przed/po (bez-ofertowa sciezka to wylacznie odczyt stolu, ale nie porownano metryk).
RUNDY: FC po rundzie 2/5; werdykt PASS-WITH-NOTES.
NASTEPNY KROK: integracja orkiestratora (FF kandydata do main), opcjonalnie bieg parytetu seed 4242 20 tur; decyzja ABC o akceptowaniu vs odrzucaniu ofert pozostaje u wlasciciela.
UWAGI-DLA-ORKIESTRATORA: (1) wznowienie (--resume) z profilu po przerwanym biegu --stop-at 22 padlo na openGame (page.waitForFunction: Target closed) przy ponownym starcie na tym samym profilu; swiezy profil dziala. Nie zbadano, czy to stan sprzed zmiany (NIE_ZMIERZONO). (2) gra/node_modules w worktree git-ignorowane.
DEPLOY/PUSH: NIE WYKONANO
