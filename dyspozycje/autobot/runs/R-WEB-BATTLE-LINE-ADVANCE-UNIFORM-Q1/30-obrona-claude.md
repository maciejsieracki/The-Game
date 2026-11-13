# R-WEB-BATTLE-LINE-ADVANCE-UNIFORM-Q1 — raport Obrony (Operator-obrona, runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-LINE-ADVANCE-UNIFORM-Q1
GOAL: w Atak (doktryna steady) jednostki jednej rangi piechoty idą do przodu równo; linia odzyskuje spójność po przeszkodzie.
ZMIANY/COMMIT: brak zmian kodu; kod = kandydat 6d81e708a1bffaab21d99a68a13b620bc6e3a3e6 (start obrony). Zacommitowany wyłącznie ten raport.
TESTY: NIE_ZMIERZONO w tej rundzie (brak zmian kodu; w worktree nie ma gra/node_modules, nie uruchamiano testów). Obowiązują wyniki Evaluatora z 20-evaluator-claude.md (tsc rc=0, test tematu 17/0, 5 bramek zielonych, parytet AUTO=SKIP 42/0, mutacje czerwone).

## Odpowiedzi na zarzuty

1. PRZYJMUJĘ (opis, bez zmiany kodu). Zgoda: w żywym Chromium (Las, seed 1) armie stykają się w r.2, więc pomiar dotyczy fazy kontaktu, nie marszu. Dowód poprawy fazy marszu/objazdu przeszkód jest wyłącznie z silnika headless (evidence/przed-poprawka.txt, po-poprawce.txt: rocks atk 5→2, wall def 13→2, mixedSpeed 13/15→0). Nie twierdzę, że żywa scena dowodzi poprawy marszu. Rekomendacja dla FC: potraktować scenę żywą jako test dymny (brak regresji), nie dowód poprawy; scena z dłuższym dystansem i przeszkodą = osobny dowód do rozważenia.
2. PRZYJMUJĘ (opis). Zgodnie z evidence MD5 PNG przed/po są identyczne (1f6dd8a0…) w r.6, bo w tej rundzie rozrzut jest ten sam (3=3). Kryterium zrzutu przed/po spełnione formalnie; zaznaczam to jako ograniczenie, nie jako dowód różnicy.
3. ODRZUCAM częściowo. Rozrzut 3 w żywej scenie dotyczy fazy kontaktu (jednostki w kontakcie są z definicji wyłączone z wyznaczania tempa — `info.engaged` w `_lineAdvanceCap`), a próg 2 testu jednostkowego dotyczy marszu bez kontaktu. Próg 2 = najmniejsza pula ruchu rangi (sufit = min + minMp), więc nie jest stosowalny do sceny z kontaktem. Test regresyjny w pełnej scenie z kontaktem uznaję za zakres osobnego tematu.
4. PRZYJMUJĘ jako ograniczenie, ODRZUCAM jako blokadę. Test przeglądarkowy jest narzędziem zbierającym evidence (JSON/PNG), nie bramką; bramką jest battle-line-advance-uniform-test.cjs (17 asercji, mutacja odtwarzalna z repo: wystarczy zawsze-true w `_lineAdvanceWithinCap` — potwierdzone przez Evaluatora: 14 FAIL). Wariant „before" faktycznie wymaga lokalnej kopii battleScene sprzed zmiany (odtwarzalna: `git show dee73a067:gra/src/battle/battleScene.ts`).
5. ODRZUCAM jako defekt, PRZYJMUJĘ jako udokumentowaną lukę. Wyłączenie rangedBase/konnicy/machin z sufitu jest świadome (mają własne ścieżki `_rangedAction`/`_cavalryAction`, flanki konnicy FALA 554/578 wg dispatchu „nie zmieniaj"). GOAL dispatchu kazał nie ruszać reguł konnicy i strzelców. Hastati (rangedBase) poza sufitem — zgłaszam jako osobny temat (`R-WEB-BATTLE-LINE-ADVANCE-RANGED-Q2`, propozycja), wymaga decyzji właściciela, bo zmienia zachowanie strzelców.
6. PRZYJMUJĘ jako uwagę procesową. Pliki `battle-line-advance-uniform-browser-entry.{ts,html}` są pomocniczymi zasobami testu przeglądarkowego w gra/tools; FC/orkiestrator decyduje o akceptacji lub wycofaniu z integracji (można pominąć przy merge — test przeglądarkowy nie jest bramką). Zmiana `battle-cap-500-test.cjs` (`scene.roundNo = turns + 1`) to dopasowanie harnessu do zegara rund, asercje bez zmian. Tempo 500v500: 54 vs 42 tur (+29%) — to skutek reguły „najwolniejszy wyznacza tempo" w harnessie bez konnicy/dystansu; wpływ na balans = element decyzji ABC z pkt 8.
7. ODRZUCAM. `roundNo` jest inkrementowany w `_beginTurn` (battleScene.ts, jedyna produkcyjna ścieżka tury: i AUTO, i SKIP, i gracz). Zarzut dotyczy wyłącznie harnessów pomijających `_beginTurn`; skutek = sufit liczony z zawsze żywych pozycji (część „na żywo" nie jest cache'owana), nieodświeżone są tylko zbiór „w kontakcie" i licznik stall — degradacja to łagodniejszy sufit, nie zawieszenie (anty-freeze działa w `stall`, gdy rundy tykają). Jedyny znany harness dotknięty to cap-500, już poprawiony. Brak dodatkowego testu odporności — NIE_ZMIERZONO.
8. PRZYJMUJĘ — DECISION_REQUIRED (ABC) dla właściciela, kierowane przez orkiestratora; bez wybierania progu przeze mnie:
   - Pytanie: czy akceptujemy `LINE_ADVANCE_STALL_ROUNDS` = 10 rund (czas wstrzymywania linii przez zablokowaną jednostkę)? A) 10 (rozrzut ≤2 przy ścianie 5 pól; rekomendacja, zmierzone) B) 8 (szybciej puszcza linię, rozrzut do 4 przy ścianie) C) inna wartość.
   - Pytanie: czy akceptujemy regułę „tempo linii = najwolniejsza jednostka rangi" (500v500: 54 tury vs 42)?

BLOKADY: brak blokad technicznych; DECISION_REQUIRED (pkt 8) do orkiestratora/właściciela. Dług bazowy: 3 testy czerwone identycznie na bazie (wg Evaluatora). Dług Rust REPIN (ruch w bitwie): bez zmian, wskazany w 10-operator.
RUNDY: 1/5 (obrona)
NASTĘPNY KROK: Final Control (werdykt + rozstrzygnięcie pkt 6 i 8 przez orkiestratora/ABC).
DEPLOY/PUSH: NIE WYKONANO
