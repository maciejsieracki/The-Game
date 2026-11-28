STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-WEB-GRACE15-EFFECTS-Q1 (GRACE15FX), obrona po ocenie Evaluatora r2 (FAIL, commit 9a8aeeb81), rola Operator HAIKU 5.5
GOAL: odpowiedź na zarzuty 1–9 Evaluatora; kryterium binarne z dispatchu (tabela aktywnego gracza t1–30 z min. 2 ziarnami z Drewnem, readback barbarzyńców, barbarzyńcy po t16) NIE zostało zamknięte w tej rundzie. Zero zmian gra/src i gra/data.
BAZA: ad2629a08 (kandydat r2); commit obrony poniżej.

ZMIANY/COMMIT: 
- gra/tools/grace15fx-active2-live.cjs: usunięto martwy blok `if (false && …)` z setTaxSplit; usunięto `window.__civTest.endTurn()`; koniec tury = klik przycisku „Zakończ turę” w UI (ścieżka NIE ZWERYFIKOWANA na żywo).
- dyspozycje/analizy/OKNO-LASKI-15-TUR-SKUTKI-2026-11-27.md: baner nadpisań nad sekcjami r1; STAN WIĄŻĄCY przepisany (usunięto „ok. 32 na jednostkę” jako fakt; liczby t16 z definicjami; readback = NIE ZWERYFIKOWANO; dane s11 oznaczone jako z hakiem endTurn); nagłówek wersji bez zdwojenia „runda 2”.
- dyspozycje/autobot/runs/R-WEB-GRACE15-EFFECTS-Q1/30-obrona-claude.md (ten raport).
- Brak nowych biegów na żywo w tej rundzie. Dane r2 bez zmian.

ODPOWIEDZI NA ZARZUTY:
1. PRZYJĘTE (NIE ZAMKNIĘTE). Tabela t17–30 aktywnego gracza NIE ZMIERZONA. Powód: bieg wymaga wznawialnego zapisu między wywołaniami (ok. 170 s startu + ok. 24 s/turę, limit 590 s na wywołanie) oraz działającego klikania suwaka Wyżywienia lub rozwiązania jednostki; żadnego z tych elementów nie zbudowano i nie sprawdzono. Nie wpisuję wartości, których nie zmierzono.
2. PRZYJĘTE. Z Drewnem bez haka jest tylko seed 11 (1 ziarno). Seed 7 wyłączony z wniosków. Drugie ziarno NIE ZMIERZONO.
3. PRZYJĘTE. Żadna dźwignia po t16 nie została przetestowana: suwak Wyżywienia nie znaleziony w widoku harnessu (rangeDump = []), rozwiązanie jednostki nie zaimplementowane. Odpowiedź „czy gracz ma wyjście z blokady” = NIE ZBADANO.
4. PRZYJĘTE. Hak `civTest.endTurn()` (l.347) i martwy blok z setTaxSplit (l.267–273) usunięte z narzędzia. Dane s11 z tego narzędzia powstały z hakiem endTurn i są NIEZGODNE z zakazem dispatchu; traktuję je jako nieważne dla wniosków, dopóki nie zostaną powtórzone klikiem. Przypis: dane s7-z-hakiem-podatku były już wyłączone.
5. PRZYJĘTE. `readback-s11.txt` to zapis wartości przekazanej do startNewGame, nie odczyt. Poziom barbarzyńców: NIE ZWERYFIKOWANO w grze. Dokument mówi to wprost w STANIE WIĄŻĄCYM.
6. PRZYJĘTE. Barbarzyńcy po t16: NIE ZMIERZONO (bieg nie wszedł po t16).
7. PRZYJĘTE. Dodano baner nadpisań nad sekcjami r1; nagłówki „runda 2” zmieniono na jednoznaczne; STAN WIĄŻĄCY opisuje, które stwierdzenia r1 są nieaktualne.
8. PRZYJĘTE i wyjaśnione definicją. Liczby z `turns-s11.jsonl` (t16): skarbiec 19; `projSkarbDelta` = −29 to ZMIANA skarbca w turze, czyli skarbiec po turze = 19 − 29 = −10. `projFoodDelta` = −31 to ZMIANA Spichlerza, czyli Spichlerz po turze = 1 − 31 = −30 (zgodne z `forecastSpichlerzPo` = −30 w `turns-s11.jsonl`). „ok. 32 na jednostkę” usunięto ze STANU WIĄŻĄCEGO; zostaje jako hipoteza oznaczona NIE ZMIERZONO.
9. PRZYJĘTE. Sekcje r1 z „bramką skarbca” mają baner nadpisania; STAN WIĄŻĄCY stwierdza, że pierwszy wąski przekrój po t16 to żywność (Spichlerz). Zmiana wiki/komunikatu (decyzja, czy opisać to w grze) należy do właściciela; nic nie poprawiono w tekstach gry.

ODPOWIEDZI TESTOWE:
- Bramki po obronie NIE ponawiano (kod gry nietknięty, zmiana tylko w narzędziu i dokumencie). Ostatnie wyniki z r2 (ad2629a08, po npm ci --ignore-scripts): tsc exit 0; LOGIC OK (213/213); ai-test 297 passed, 0 failed; early-grace-15-test 33 passed, 0 failed (wg raportu Evaluatora r2; powtórzono tylko `node --check` zmienionego narzędzia: SYNTAX_OK).

TESTY/POMIARY W TEJ RUNDZIE:
- Pomiary na żywo: 0 (NIE ZMIERZONO).
- node --check gra/tools/grace15fx-active2-live.cjs: SYNTAX_OK.

BLOKADY:
- Brak czasu/infrastruktury na wznawialny bieg 30 tur z klikiem suwaka i dźwigni (zarzuty 1, 2, 3, 6). Wymaga osobnej rundy (r3) i rozważenia eskalacji modelu zgodnie z zasadą „2 nieudane rundy Haiku”.
- Ścieżka klikana „Zakończ turę” nie została zweryfikowana na żywo.

RUNDY: 3/5 (obrona po r2; zużyto 2 rundy Operatora Haiku; wg zasady modeli rozważyć Sonnet na Operatorze dla r3 z pisemnym uzasadnieniem: 2 nieudane rundy Haiku bez tabeli t17–30).
NASTĘPNY KROK: Final Control dla kandydata obrony (po commicie). Kandydat NIE spełnia kryterium binarnego dispatchu (zarzuty 1–3, 6 otwarte). Potrzebna runda r3: wznawialny runner pomiaru aktywnego gracza t1–30 na ziarnach 11 i drugim z Drewnem, klik suwaka Wyżywienia lub rozwiązania jednostki, readback barbarzyńców z odczytu UI.
UWAGI-DLA-ORKIESTRATORA: (a) zarzut 8 i 9 zamknięte w dokumencie; (b) dane s11 z hakiem endTurn są nieważne dla wniosków, nie ma ich w STANIE WIĄŻĄCYM jako dowodu dla t1–16; (c) Operator r3 powinien mieć wskazanie, jak otworzyć suwak Wyżywienia (widok .civ-cs .wyzwienie-w4-sliders, wg 10-operator).
DEPLOY/PUSH: NIE WYKONANO
