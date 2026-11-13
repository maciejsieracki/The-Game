STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB), bitwa
TEMAT: R-WEB-BATTLE-CAP-500-Q1
GOAL: limit jednostek na strone w bitwie 120 -> 500 (jedno zrodlo), poprawny 500v500, komunikat rezerwy, test 600v450.
ZMIANY/COMMIT: weryfikowany SHA do integracji: 377edb72451d07cd3316cd53323753ed6492e185 (baza fcaa10300; seria operatora a06ed6511, 7a4769b79, obrona 377edb724). Allowlista czysta (battleScene.ts, 3 testy w gra/tools, katalog runu). Zero zmian gra-robocza, WERSJE.md, rust-port, main.ts. git diff --check czysty.
TESTY (odtworzone samodzielnie na 377edb724): tsc --noEmit EXIT=0; battle-cap-500-test PASS 59 asercji (w tym 1b: clearSideCap 40v40=120, czyszczenie 120: legacy 18 / preset 13, 500: 50 / 45); battle-undeployed-units-test PASS=35 FAIL=0; teren-walki-etapy-test 33 ok / 0 fail; logic-test 213/213; ai-test 274/20, zbior 20 porazek identyczny z baza fcaa10300 (diff pusty). PERF logika tury 500v500 bez renderu (maszyna obciazona): srednia 1947 ms, p95 5782 ms, max 11769 ms; rozstawienie ok. 3,8-4,0 s.
WERDYKTY ZARZUTOW:
1. Regresja terenu: ODDAL (naprawione w 377edb724). Glebokosc czyszczenia liczy battleClearSideCap = min(500, max(120, wieksza armia)), nie stala limitu; bitwy <=120 maja stare wartosci (18/13), potwierdzone testem. Czyszczenie 50/45 kolumn dotyczy tylko armii >120 i wynika z potrzeby rozstawienia (500 jedn. wymaga wielu rang).
2. Test konca bitwy: ODDAL. Ta sama fixture przy N=120 konczy sie tym samym progiem 5% (diag-sim120-r2.txt); mechanizm (lucznicy bez amunicji) nie zalezy od limitu. Cwiczenie STALL_TURN_LIMIT poza zakresem tematu (ZALOZENIE).
3. Wydajnosc/FPS: ODDAL z notatka. FPS w Chromium NIE_ZMIERZONO (brak przegladarki). Logika tury 500v500 ok. 2 s srednio, do ok. 12 s max na obciazonej maszynie; planowanie AUTO synchroniczne, mozliwe zawieszenie karty. Limit 500 to decyzja wlasciciela; proponowany osobny temat: rozlozenie planowania AUTO w czasie / LOD.
4. Brakujace bramki: ODDAL. logic-test i ai-test uruchomione (brak regresji wzgledem bazy); rownowaznosc rozstawienia udokumentowana artefaktem eq-placement (10 scenariuszy bajt-w-bajt z baza); _makeCanAttackFromTest przeanalizowany w kodzie: semantycznie identyczny z _canAttackFrom (pozycje wrogow stabilne podczas BFS).
DO DECYZJI CZLOWIEKA: brak.
BLOKADY: brak. Notatka: weryfikacja wizualna i FPS w Chromium przy 500v500 nadal NIE_ZMIERZONO.
RUNDY: 2/5
NASTEPNY KROK: integracja orkiestratora serii a06ed6511, 7a4769b79, 377edb724 na main/ROBOCZA (baza fcaa10300; UNDEPLOYED-UNITS juz w bazie), przed kolejnym tematem na battleScene.ts (ARMY-STACK-LIMIT). Wzgledem origin/rust-port/parity-v2: zmiana tylko webowa, niezalezna; ewentualny REPIN Rust pozniej. Pomiar live w Chromium osobno.
DEPLOY/PUSH: NIE WYKONANO
