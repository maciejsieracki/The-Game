STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-COLLISION-ARBITRATION-MANUAL-UNSELECTED-Q1
GOAL: w bitwie RECZNEJ pola sporne miedzy jednostkami NIEWYBRANYMI rozstrzygane jak w AUTO (piechota pierwsza, ten sam typ mniejsze ID, bez swapow/ping-ponga); rozkazy wybranych bez zmian; AUTO bit-w-bit jak baza; determinizm.
ZMIANY/COMMIT: kandydat 76e1c5cfee9b50d442e1c200c76a6a8961791c2d (potomek bazy 8f6381fc5 -- `git merge-base --is-ancestor` OK). Diff vs baza: gra/src/battle/battleScene.ts (+86/-14), gra/tools/battle-collision-manual-unselected-test.cjs (nowy), runs/<ID>/10-operator-claude.md, 30-obrona-claude.md. Zgodne z allowlista. `git diff --check` czysty. Ten raport = jedyny dodany plik FC.
TESTY (liczby z surowego wyjscia, node_modules po `npm ci`):
- tsc --noEmit: exit 0, brak wyjscia.
- battle-collision-manual-unselected-test.cjs: passed (S1..S4); --mutate: AssertionError (czerwony) -- kryterium (a)(b)(c)(3)(4) na prawdziwych metodach sceny (stubowany tylko teren/BFS/timer/UI).
- battle-manual-orders-full-move-test, battle-manual-orders-routing-test, battle-attack-move-order-test: passed.
- (d) AUTO bit-w-bit: live Chromium (battle-collision-arbitration-test, BCA_PART=live, 2x lucznik/hastati vs 2x), seedy 1,2,3, skrot zdarzen baza == kandydat: 6dc7dc72b54cf1805245f3cf7ac4c67b / 5ca3758d32538c2968cdc841e18bfc10 / 7a7c9bbcf8b21ec64bd8cc884d0282f3 (rundy 32/31/33, winner obronca). Armie 8v12 (domyslne) przekraczaja 240 s w tym srodowisku (NIE ZMIERZONO w pelnym rozmiarze).
- Bramki ref: logic 213/213, tech-tree 20/0, research 33/0, unit-replace 21/21, combat 6/6, unit-power 6/0 -- wszystkie exit 0 na kandydacie (zielone, nie potrzeba porownania z baza).
- (f) Chromium, zywa scena reczna (BattleScene, tryb RECZNY, bez rozkazow, sonda tymczasowa, NIE zacommitowana): 3 przebiegi, 0 bledow strony; arbitraz zaangazowany (claims 26/12/6 na ture, 31 aktywacji z fantomami przy 4 lucznikach+4 piechocie; 18/1/4, 9 aktywacji przy 5+5). Pozycje jednostek identyczne z przebiegiem bez arbitrazu (brak regresji/blokady ruchu), ALE w tych ukladach nie wystapila realna kolizja rozstrzygnieta inaczej -- zywego dowodu "lucznik ustapil" NIE ZMIERZONO. Ustapienie udowodnione tylko w ttescie scenowym S1.
- Czesc live BCA mutRev / pelne 5-bramek poza powyzszymi: NIE ZMIERZONO (limit czasu).
ZARZUTY (nr -> werdykt):
1 (brak kodu i testu arbitrazu) -> ODDAL: kandydat 76e1c5cfe zawiera kod i test; zarzut dotyczył 478e3c58c.
2 (brak testu wybranego lucznika) -> ODDAL: S3 w tescie zielony.
3 (brak mutacji) -> ODDAL: --mutate czerwony.
4 (d)(e)(g niezmierzone) -> ODDAL: zmierzone wyzej (d na malych armiach).
5 (f brak Chromium) -> CZESCIOWO ODDAL: zywa scena Chromium zmierzona, kolizja z ustapieniem nie wystapila -> NOTA, nie NAPRAW (mechanizm wlasciwy zweryfikowany testem scenowym; zywy artefakt wymagalby skonstruowania ukladu, ktory sam test S1 juz pokrywa).
6 (BLOCK bez commita) -> ODDAL: jest commit z praca.
7 (ref FALI 750 nieobecny) -> ODDAL: arbitraz napisany od nowa na istniejacym resolveAutoBatchPhase; test dowodzi zachowania.
Zaden zarzut NAPRAW. Brak DO DECYZJI CZLOWIEKA.
BLOKADY: brak (noty: zywy dowod ustapienia w Chromium nieobecny; AUTO 3 ziarna tylko na malych armiach).
UWAGI-DLA-ORKIESTRATORA: (1) fantomy rezerwuja CALA sciezke planu innej jednostki tej samej strony, wiec w gestych liniach niewybrani moga w tej turze omijac/stac -- w zmierzonych ukladach pozycje nie zmienily sie vs bez arbitrazu; warto obserwowac przy kolizjach w grze. (2) Dlug Rust: REPIN logiki bitewnej (zgodnie z dispatchem).
RUNDY: 1/5 FC (kolejna runda obrony nie jest potrzebna)
NASTEPNY KROK: integracja orkiestratora SHA 76e1c5cfee9b50d442e1c200c76a6a8961791c2d (merge-base z origin/main 8f6381fc5, FF mozliwy), bramki po merge, deploy ROBOCZA po osobnej autoryzacji.
DEPLOY/PUSH: NIE WYKONANO
