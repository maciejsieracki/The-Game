# R-WEB-TEST-DEBT-Q13 - Final Control (runda 5/5)

STATUS: PASS-WITH-NOTES (przyrost testowy 88920aa2 zielony i bezpieczny do integracji jako CZESCIOWY; zakres tematu niespelniony - LIMIT-5-EXCEEDED, dalsza praca wymaga decyzji wlasciciela)
DOMAIN: GAME (testy; zero zmian w gra/src, gra/data)
TEMAT: R-WEB-TEST-DEBT-Q13
GOAL: testy czerwone do obowiazujacych regul bez oslabiania asercji; bledy gry jako kandydaci R-WEB-*.

ZMIANY/COMMIT: kandydat 88920aa2bfa95a0d02af1f73df5c644f3d0883bd. `git merge-base --is-ancestor 1f0f48be 88920aa2` = TAK. `git diff --name-only 1f0f48be..88920aa2`: 46 plikow, wszystkie w allowliscie (41 x gra/tools/*-test.cjs + runs/R-WEB-TEST-DEBT-Q13/**); zero trafien w gra/src, gra/data, rust-port, gra-robocza, gra-kanon, WERSJE.md. Brak usunietych plikow w gra/tools.

TESTY (wlasne uruchomienie na 88920aa2, gra/node_modules z `npm ci --ignore-scripts`, surowe):
- tsc --noEmit exit 0; logic 213/213; tech-tree 20 pass/0 fail; research 33/0; unit-replace 21/21; combat 6/6.
- ai-test 297 passed/0 failed; war-rules-multiwar-main-guard 21 PASS/0 FAIL; forced-war stone 31/0, iron 55/0, bronze 48/0, reguly 48/0; era-war-engine-scenario 27 OK/0; era-war-bronze-player-target 44/0; ai-economy-measure-hook 25/25.
- Testy tematu: naval-water-access-gate 40/0; unit-stock-cost 58/0; mur-paradoks 29/0; ai-army-composition-per-civ 341/0; ai-general-war-campaign 52/0; army-leadership exit 0; recruitment-batch-contract 17/0; tartak-oboz-wyscig-race exit 0; rekrutacja-skarbiec-only 13/0.
- NIE ZMIERZONO: wlasny sweep wszystkich 156 pozycji (liczby 69 zielonych / 87 czerwonych: A 1, B 10, D 50, E 26 pochodza z raportu operatora, niezweryfikowane niezaleznie); testy live/Chromium i E.

OCENA ZARZUTOW (bez etykiet rol):
1. D (50) nierozstrzygniete - ZASADNY. Wiersze maja "przyczyna NIE ZMIERZONO"; nie sa zweryfikowanymi bledami gry ani starymi pinami. Runda 5/5 wyczerpana, nie da sie naprawic w tym temacie -> ODDAL do decyzji wlasciciela / nowy temat R-WEB-TEST-DEBT-Q14 (analiza po 1 tescie). Nie blokuje integracji przyrostu (zero zmian kodu gry), ale blokuje zamkniecie tematu.
2. E bez sekwencyjnego ponowienia - ZASADNY (25 timeoutow pod -P4). ODDAL do Q14/osobny runner; save-load-roundtrip i ai-ai-treaty-live-proof-wiring pozostaja czerwone/niezmierzone.
3. 10 B nienaprawionych - ZASADNY. Dlug niezlikwidowany (87/156 czerwonych wg operatora). ODDAL; odblokowanie hud-moc-warstwa:168 i moc-ranking-rozjazd:145 zalezy od decyzji ABC (a).
4. mur-paradoks 49->98 - ZASADNY, niezaleznosc asercji oslabiona. Zweryfikowano: units.json Konnica fieldPower = 98, Epoka Zelazo, wiec test jest zgodny z aktualnymi danymi; asercja ma warunek typeof/>0 i porownanie z danymi, a dalsze asercje testu (29/0) licza na konkretnych wartosciach. Czy 98 jest intencja (konflikt wiki 49 vs units.json) - decyzja ABC (a). Akceptuje jako notatke, nie jako FAIL, bo zmiana nie dotyka kodu gry.
5. ai-army-composition garnizon jako "wrecz" - zasadne jako zalozenie operatora. Progi tabeli wlasciciela nietkniete, test 341/0; zmiana fixture odzwierciedla regule garnizonu min. 1 (FALA 857). Interpretacja wymaga potwierdzenia: ABC (b). Nota.
6. Kandydaci - unit-stock-cost rozstrzygniety (stary pin, Zelazo x4; naprawione, 58/0, nie blad gry). climate-band-test.cjs:75 ("map has polar terrain (0 hexes)", generujSwiat(42,'standardowy','kontynenty')) - kandydat R-WEB-MAP-POLAR-ZERO, przyczyna NIE ZMIERZONO; ODDAL jako osobny temat po triage.

Obrona: przyjela zarzuty 1-6 bez sporu i dodala 2 realne naprawy (naval-water-access-gate, unit-stock-cost), zweryfikowane powyzej.

BLOKADY: (a) decyzja ABC: Konnica rekrut 49 czy 98; (b) czy garnizon liczy sie jako "wrecz" w pomiarze armii AI; (c) 50 D + 10 B + 26 E otwarte; (d) kandydat R-WEB-MAP-POLAR-ZERO.
RUNDY: 5/5 zuzyte; ostatni werdykt FC = PASS-WITH-NOTES (przyrost), temat NIE zamkniety = LIMIT-5-EXCEEDED; wymagana decyzja wlasciciela: czy otworzyc R-WEB-TEST-DEBT-Q14 (D po 1 tescie, E sekwencyjnie, B po decyzji (a)).
UWAGI-DLA-ORKIESTRATORA: harnessy tekstowe main.ts gnija przy kazdej zmianie (rozwazyc eksport funkcji); testy generatora mapy > 190 s - potrzebny osobny runner; zadna z kategorii C nie zostala oznaczona.
NASTEPNY KROK: integracja orkiestratora przyrostu 88920aa2 (FF/merge, bramki wyzej zielone) bez READY_FOR_DEPLOY dla calego tematu; decyzje ABC (a)(b); ewentualny temat Q14.
DEPLOY/PUSH: NIE WYKONANO
