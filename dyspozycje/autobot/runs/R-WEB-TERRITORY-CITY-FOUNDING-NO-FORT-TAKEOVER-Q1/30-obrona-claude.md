STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-WEB-TERRITORY-CITY-FOUNDING-NO-FORT-TAKEOVER-Q1
GOAL: zalozenie miasta NIE przejmuje cudzych fortow/posterunkow ani ich ulepszen (R0); heks wlasnego fortu zostaje u wlasciciela (zarzut 1, regula (a)); zdobycie fortu tylko silowo w wojnie (R2).
ZMIANY/COMMIT: fe2143da1 (obrona, runda 2). Pliki: gra/src/map/territory.ts (POZA ALLOWLISTA, patrz BLOKADY), gra/tools/city-founding-no-fort-takeover-test.cjs, gra/tools/fort-outpost-hard-territory-test.cjs. Raport: ten plik (commit osobny).
TESTY (surowe wyniki, uruchomione na fe2143da1):
- tsc --noEmit: exit 0
- city-founding-no-fort-takeover-test: 27 passed, 0 failed (bylo 21/0)
- fort-outpost-hard-territory-test: 92 passed, 0 failed (przed zawezeniem F6: 78/2)
- fort-strazniaca-zasieg-zakladania-test: 82 passed, 0 failed
- fort-vision-test: 15/0; fort-nodes-save-load-test: 18/0; fort-outpost-placement-rules-test: 40/0
- perf-hud-frame-memo-test: WYNIK 16 PASS, 0 FAIL (parytet indeksu terytorium)
- logic-test: LOGIC OK (213/213), exit 0; tech-tree-test: 20 pass, 0 fail; research-test: ALL GREEN, exit 0; unit-replace-test: 21/21, exit 0; combat-test: All sanity checks passed, exit 0
- ai-march-avoid-foreign-territory-test: 98 passed, 1 failed (C7, no-route) - ten sam wynik co na bazie (zarzut 8, wg Evaluatora)
- ai-territory-race-test: WYNIK 29 OK / 0 FAIL
- MUTACJA PRODUKCYJNA (gra/src/map/territory.ts, wylaczona galaz centrum `if (false && ...)`): city-founding 24 passed / 3 FAILED (R1c-1, R1c-4, R1i-1); fort-outpost-hard-territory 90 passed / 2 FAILED (F6c x2). Plik przywrocony `git checkout`, zweryfikowany grepem (centreFortOwner obecny, brak znacznika mutacji).

ZARZUTY EVALUATORA:
1. PRZYJMUJĘ, POPRAWIONE. Reprodukcja przed zmiana: owner(0,0)=1 (fort gracza, miasto AI pop 10 na (3,0)). Po zmianie owner(0,0)=0. Regula: dist 0 do wezla fortu/posterunku wygrywa z miastem (jak centrum miasta wygrywa z dalszym miastem). Lustro w territoryOwnerIndex (pole fc), parytet testowany (R1i-1).
2. PRZYJMUJĘ, POPRAWIONE CZĘŚCIOWO. Dodane: R1c-1..4 (centrum fortu, sasiedni heks = miasto, stadnina na heksie fortu = gracz), R1i-1/2 (indeks = territoryOwnerAt na 2 tys. heksow), F6c (heks fortu = wlasciciel). NIE ZMIERZONO: scenariusz na poziomie calej gry (fort + stadnina + zalozenie miasta w grze); testy sa na poziomie territoryOwnerAt.
3. PRZYJMUJĘ, POPRAWIONE. Mutacja produkcyjna wykonana (patrz TESTY): czerwone 3+2.
4. PRZYJMUJĘ = NIE ZMIERZONO. Brak dowodu w zywym Chromium (vite bundle poza repo, CHROME_PATH) nie wykonano w tej rundzie: koszt przekracza te runde (wymaga bundla i hooka civTest). Pozostaje blokada.
5. PRZYJMUJĘ jako ograniczenie, NIE POPRAWIANE. R2-7..R2-9 pozostaja testami zrodla (regex na main.ts); behawioralny sweepFortCaptures wymaga bootu gry, nie da sie go uruchomic w node. Zachowany test jednostkowy applyFortCaptureByOccupation (R2-1..6).
6. PRZYJMUJĘ jako DECISION_REQUIRED (ABC do wlasciciela, zgodnie z CLAUDE.md pkt 3). Nie zmieniam lokalizacji fortu bez decyzji. Konkretny skutek: fort mozna postawic w cudzym zasiegu miasta (2026-11-03: fort gdziekolwiek), a wtedy zabiera swoj heks (F6, patrz nizej). Owner w DOPISKU 2 (R1) prosil o "zakaz zakładania w cudzym zasięgu" jak dla miasta.
7. PRZYJMUJĘ (potwierdzone). Jedyne miejsce zmiany ownerId fortu w grze: fort-territory.ts:380 (applyFortCaptureByOccupation). Grep `.ownerId = ` w main.ts dla wezlow fortow: brak. Zakladanie miasta nie zmienia ownerId fortu (galaz F1 usuwa wezel).
8. ODRZUCAM regresje (dowod: 98/1 na kandydacie = 98/1 na bazie wg Evaluatora; ten sam C7). Wplyw na wyscig AI (FALA 868) NIE ZMIERZONO na pomiarze runnerem; ai-territory-race-test 29/0.

ZMIENIONE ASERCJE (kolejna runda, uzasadnienie: regula (a) decyzji wlasciciela 2026-11-19):
- F6 (fort-outpost-hard-territory, fort i posterunek, gap 9): bylo "strata sasiada = 0". Jest "strata sasiada POZA heksem fortu = 0" + "lost <= 1" + F6c "heks fortu (5,0) = wlasciciel fortu". Uzasadnienie: nowy fort postawiony w zasiegu sasiedniego miasta zabiera wlasny heks (5,0), co wynika wprost z reguly (a). Gap 11 i 12 bez zmian w wyniku. Asercja nie zostala oslabiona dla pozostalych heksow.
- Round 1 (A4a/A4b/A4e/A4f/E1 odwrocone) bez zmian.

LUKI I UWAGI:
- Stara regula 4 (przejecie fortow przez miasto) nie jest naprawiana wstecz w starych zapisach (zgodnie z dispatchem).
- Stadnina na heksie innym niz centrum fortu w zasiegu miasta obcego: wlasciciel heksu wg territoryOwnerAt (ta sama semantyka co miasto<->miasto, ulepszenia ida za wlascicielem heksu). Patrz DECISION_REQUIRED nizej.
- R1 tabela (poza placement): sporny heks i centrum rozstrzygane wg territoryOwnerAt; placement bez zmian.

BLOKADY:
1. ALLOWLISTA: gra/src/map/territory.ts nie jest na allowliscie dispatchu (dispatch: fort-territory.ts, main.ts, cities.ts, testy). Jest to miejsce zrodlowe territoryOwnerAt, bez ktorego poprawka (zarzut 1) nie dziala w grze. Decyzja orkiestratora: zaakceptowac rozszerzenie allowlisty o ten plik albo cofnac commit fe2143da1 (dla plikow w allowliscie dispatchu nie ma innego miejsca, w ktorym mozna to zrobic bez shimu).
2. Dowod Chromium przed/po: NIE ZMIERZONO.
3. DECISION_REQUIRED (ABC do wlasciciela): lokalizacja fortu w cudzym zasiegu miasta. Opcje: (A, rekomendowane, dosłownie DOPISEK 2 R1) fort nie moze powstac w cudzym zasiegu miasta, jak miasto; (B) obecny stan: fort mozna postawic, zabiera tylko wlasny heks. Wymaga zmian w budowie fortu (main.ts ~l.13987 i ai.ts, poza allowlista).
4. Osobny temat (luka R2): brak potwierdzonej scieżki "wrogi fort bojowy w stanie wojny" poza sweepFortCaptures — nie dotyczy tej rundy, zgodnie z dispatchem (zajecie juz istnieje).

RUNDY: 2/5 (runda 1: 89d0e99f7; runda 2 w tym raporcie)
NASTEPNY KROK: Orkiestrator: decyzja o allowliscie dla gra/src/map/territory.ts; ABC do wlasciciela (lokalizacja fortu); potem Evaluator (sprawdzenie fe2143da1 + raport) i dowod Chromium jako osobny temat albo w kolejnej rundzie.
UWAGI-DLA-ORKIESTRATORA: w gra/tools zostaly pliki nieSledzone: .gate-logic.txt (wyjscie logic-test), .probe-R1.cjs (+ bundle, entry) — nie dodane do commita; usuniecie wymaga zgody (rm zakazany). gra/node_modules to dowiazanie symboliczne do worktree wf_67a822a6-aa1-2 (gitignored), bez npm ci (dysk 2,4 GB wolne przy starcie).
DEPLOY/PUSH: NIE WYKONANO
