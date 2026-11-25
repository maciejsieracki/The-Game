# R-WEB-WAR-END-REASON-LOG-Q1 — obrona Operatora (runda 1/5, po zarzutach Evaluatora)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (log + tekst wpisu w „Wydarzeniach na świecie”)
TEMAT: R-WEB-WAR-END-REASON-LOG-Q1
GOAL: Przy zmianie statusu wojna/pokój między dwiema cywilizacjami AI zapisywać PRZYCZYNĘ w wpisie „Wydarzenia na świecie” (dziennik + trwała lista) oraz log diagnostyczny window.__diploWarEndLog pod ?civTest=1. Baza: origin/main 60986fe85.

ZMIANY/COMMIT: c42594895 (kod + testy, 4 pliki z allowlisty); commit tego raportu = czubek gałęzi (pole sha).

Odpowiedzi na zarzuty Evaluatora:
1. (Nie blokuje, klasyfikacja P10/P11 bez testu behawioralnego) — PRZYJMUJĘ. Wyciągnięto czysty klasyfikator `powodZmeczeniaPokoju(peak, progWymuszony)` w diplo-world-news.ts; main.ts go używa. Test CZĘŚĆ A sprawdza granice (peak == próg → wymuszony, próg−1 → oferta, 0 → oferta). Test CZĘŚĆ B pilnuje wywołania klasyfikatora z WAR_WEARINESS_PARAMS.zmeczenie.progWymuszonyPokoj.
2. (Kaskady zmian statusu innych par dostają powód) — PRZYJMUJĘ. Nie odrzucam uwagi: powód był przypisywany wszystkim zmianom w obrębie fn, co jest błędne (np. wpis sojuszu w tym samym wywołaniu dostawał cudzy powód). Poprawka: withDiploWarReason(a, b, ctx, fn) zapisuje pairKey; setDiploRelation przekazuje powód TYLKO gdy key == pairKey. Pozostałe pary dostają wpis bez powodu (jak dotąd). Mutacja (usunięcie warunku pary) → test CZERWONY „powód przypisany tylko do zmiany statusu tej pary”, PASS=40 FAIL=1; po przywróceniu PASS=41 FAIL=0.
3. (Kody pokoj_z_propozycji, pokoj_po_rozejmie, rozejm_wygasl, zdobycie_miasta, bunt, wypowiedzenie_gracza istnieją tylko jako etykiety) — PRZYJMUJĘ. Usunięto je z typu WorldDiploReasonCode i z worldDiploReasonLabel (martwy kod, nic ich nie ustawia). Kody w użyciu: pokoj_wymuszony_zmeczenie, oferta_zmeczenia, auto_pokoj_dwa miasta, prosba_o_pokoj_ai, wojna_epoki, wypowiedzenie_ai. Podpięcie tych ścieżek (np. rozejm wygasł, zdobycie miasta) to osobny temat, nie wymagany binarnym kryterium.

Dodatkowo naprawiono dwa testy, które czytały stare sygnatury (zmiana wymagana przez poprawki): gra/tools/diplo-world-news-test.cjs (regexy hooka: dopuszczono treść między `{` a wywołaniem, nowy argument powodPary); gra/tools/war-end-reason-log-test.cjs (regexy haków przepięte na withDiploWarReason(a, b, …), usunięto sprawdzenie starego zapisu progu). Żadna asercja nie została osłabiona.

TESTY (surowe liczby z wyjścia, ten sam worktree, po commicie c42594895):
- tsc --noEmit: EXIT 0.
- war-end-reason-log-test.cjs: PASS=41 FAIL=0 (wcześniej 34/0).
- diplo-world-news-test.cjs: PASS 67/0.
- hud-me-literal-zero-test.cjs: 150 PASS / 0 FAIL.
- war-rules-multiwar-main-guard-test.cjs: 21 PASS / 0 FAIL.
- era-war-end-like-classic-test.cjs: PASS 17 / FAIL 0.
- truce-end-war-notice-test.cjs: PASS (EXIT 0).
- Pozostałe *war-weariness*/*peace* (bez live): 34 EXIT 0; diplo-forced-peace-pending-test.cjs: PASS=39 FAIL=1 (asercja „okno wraca na początku tury po turn++”) — ten sam wynik co na bazie 60986fe85 (zgłoszone w rundzie 1), NIEZWIĄZANE z tą zmianą.
- Testy live (Chromium): NIE ZMIERZONO w tej rundzie.
- Bramki z dispatchu nieuruchomione w tej rundzie (logic 213, tech-tree 20, research 33, unit-replace, combat 6, ai-test 297, hotseat 77, bramki-tmpdir 18): NIE ZMIERZONO. Zmiana dotyka tylko hooków dyplomacji AI↔AI i wpisów powodu.

BLOKADY: brak.

RUNDY: 1/5 (operator, HAIKU 5.5) — obrona po zarzutach Evaluatora (wywołanie z dispatchu obrony).

NASTĘPNY KROK: Evaluator (ponowna weryfikacja poprawek: klasyfikator, zakres pary, usunięte kody), potem Final Control. Do rozważenia przez orkiestratora (poza zakresem, UWAGI): podpięcie ścieżek pokoj_po_rozejmie / rozejm_wygasl / zdobycie_miasta / bunt, jeśli właściciel chce powody także dla nich.

DEPLOY/PUSH: NIE WYKONANO

SHA: c42594895 (kod + testy). Czubek raportu: patrz pole sha.

UWAGI-DLA-ORKIESTRATORA:
- gra/node_modules zainstalowane na czas bramek i usunięte przed commitem.
- diplo-forced-peace-pending-test.cjs ma czerwoną asercję już na bazie 60986fe85 (dług testowy, kandydat na osobny temat).
