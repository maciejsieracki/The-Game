STATUS: PASS-WITH-NOTES (odpowiedź na zarzuty 1–6; test przebudowany; na realnym buildzie 4 asercje FAIL = zmierzone defekty produktu D1/D2, nie artefakty harnessu)
DOMAIN: GAME (pomiar na żywo; zmiany tylko gra/tools i raport; gra/src nietknięte)
TEMAT: R-WEB-LIVE-VERIFY-FORCED-PEACE-PENDING-PATHS-Q1
GOAL: odpowiedzieć na zarzuty Evaluatora 082e7d016 (PRZYJMUJĘ z dowodem albo ODRZUCAM z dowodem) i doprowadzić test żywy do stanu wznowialnego: asercja = zachowanie gry, nie artefakt bitwy.
ZMIANY-COMMIT: gra/tools/diplo-forced-peace-pending-live-paths-test.cjs (przebudowa); dyspozycje/autobot/runs/R-WEB-LIVE-VERIFY-FORCED-PEACE-PENDING-PATHS-Q1/30-obrona-claude.md; dowody/ (s4-okno-pokoju-r2.png, wyniki-realny-build-r2.json, wyniki-mutacja-bez-bramki-r2.json, logi r2). Baza: 11e33cac5 (kandydat), gałąź autobot/R-WEB-LIVE-VERIFY-FORCED-PEACE-PENDING-PATHS-Q1 utworzona. SHA końcowy: pole sha.

ODPOWIEDZI NA ZARZUTY
Z1 (test czerwony, nie wznowialny): PRZYJMUJĘ. Każdy FAIL ma teraz odrębną, zmierzoną przyczynę (okno nie pojawia się samo; kolejka). Bitwy AI domykane są przed asercjami (clearBattles). Realny build r2: EXIT 1, 4 FAIL (S4 samoczynne pojawienie się okna; S2 samoczynne pojawienie się; S2 brak drugiego okna po akceptacji pierwszego; S2 bramka otwarta przy parze w stanie „wojna”).
Z2 (D1 nieważne, okno bitwy): PRZYJMUJĘ. Zrzut kandydata pokazuje okno bitwy, a Esc był Wycofaj. Po domknięciu bitew (cleared=0 w czasie czekania, brak .pb-overlay w DOM) okno pokoju nadal NIE pojawia się samo w 90 s. Po JEDNYM Esc pojawia się (dbgA=0, dbgB=0, afterEsc=1; dowody/log-realny-build-r2.txt). Hipoteza „kolejka bitwa->pokój” odrzucona dla tego przebiegu. Asercja „Esc nie zamyka” w kandydacie była pusta (okno pojawiało się dopiero po Esc); zastąpiona drugim Esc przy WIDOCZNYM oknie (OK) i klikiem w tło (OK).
Z3 (S3 tautologia `|| /Akceptuję/`): PRZYJMUJĘ. Usunięte. Nowa asercja: wariant z okna („Oddajesz:” vs „Pokój bez wymiany miast”) == wariant wpisu warLog po akceptacji. Wynik: bez-wymiany == bez-wymiany (OK). Wariant z miastami: NIE ZMIERZONO (plan pokoju w tej mapie nie zawiera miast; wpis warLog „Pokój bez wymiany miast”). S3 = PASS tylko dla gałęzi cena=0.
Z4 (D2 niepotwierdzony): PRZYJMUJĘ jako zmierzone, nie przypisane. Po akceptacji pierwszego: p1=pokoj, p2=wojna, okno drugiego NIE wraca (30 s), a bramka „Zakończ turę” jest OTWARTA (tura 4->5, log). Czy druga pozycja w ogóle powstała, czy została usunięta przez prune — NIE ROZSTRZYGNIĘTE (brak haka odczytu pendingForcedPeaceTreaties). Nota w teście; S2 = FAIL.
Z5 (5 bramek i FORCEDPEACE nie uruchomione): PRZYJMUJĘ, wykonane (surowe wyjścia):
  - tsc --noEmit: EXIT 0
  - logic-test: LOGIC OK (213/213), EXIT 0
  - tech-tree-test: 20 pass, 0 fail, EXIT 0
  - research-test: PASSED 33 / FAILED 0, EXIT 0
  - unit-replace-test: 0 linii [FAIL], EXIT 0
  - combat-test: All sanity checks passed, EXIT 0
  - diplo-forced-peace-pending-test: PASS=40 FAIL=0, EXIT 0
  - diplo-peace-auto-stale-offer-live-test (build r2, SKIP_BUILD=1): PASS=15 FAIL=0, EXIT 0
Z6 (D3 innerText; brak gałęzi autobot; mutacja tylko Enter): PRZYJMUJĘ D3 (asercja usunięta, zostaje NOTA: panel „Ważne” bywa zamknięty). PRZYJMUJĘ brak gałęzi autobot/<ID> (utworzona). ODRZUCAM zarzut o zakresie mutacji: wymóg dispatchu to co najmniej scenariusz (4), ten jest pokryty. Dodatkowo mutacja r2 na realnym bundlu (usunięty warunek `Ud.length>0` w bramce pending; kopia w scratchpad, nie w repo): Enter 2->3 (FAIL), tura 5->6 i kolejka FAIL — dowody/log-mutacja-bez-bramki-r2.txt.

WYNIKI r2 (realny build, dowody/log-realny-build-r2.txt)
- S4 FAIL: okno pokoju NIE pojawia się samo po końcu tury (90 s, 0 bitew w DOM). Reszta OK: Esc i tło nie zamykają widocznego okna; klik i Enter na „Zakończ turę” nie kończą tury (2->2); akceptacja: okno znika, status „pokoj”, tura kończy się.
- S3 PASS (gałąź cena=0; wariant z miastami NIE ZMIERZONO).
- S2 FAIL: okno pierwszego pokoju nie pojawia się samo; po akceptacji pierwszego brak drugiego okna, tura 4->5 (bramka otwarta), para 2 nadal „wojna”. Po akceptacji drugiego: OK.
- S1 NIE ZMIERZONO (brak haka odczytu meta.pendingForcedPeaceTreaties i helpera zapis+wczytaj).
- S5 NIE ZMIERZONO (brak haka wieku wojny AI<->AI).
- Konsola: zero pageerror/console.error.

BLOKADY: S1 i S5 — brak haków. Propozycja test-only (NIE w src): __truceTestDebug.pendingForcedPeaceForTest() -> [{pairKey, loser, winner}]; __truceTestDebug.endFullTurnSaveLoadForTest() dla S1; __truceTestDebug.setWarAgeForPair(a, b, n) dla S5.
RUNDY: 2/5 (r1 = Operator, r2 = obrona)
NASTĘPNY KROK: orkiestrator decyduje o osobnym temacie R-WEB-* na D1 i D2 (poza tym tematem, zgodnie z zakazem zmian w src) oraz o dodaniu haków test-only.
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA
- D1 (zgłoszenie): po końcu tury z wojną 40 tur (pokój wymuszony, pending) okno nie pojawia się samo w 90 s; pojawia się po Esc. Kod: src/main.ts showNextPendingForcedPeace (~26038), wywołania ~41665 (finally) i ~39213. Źródło nieustalone (prawdopodobnie zasłonięcie okna przez inny modal końca tury).
- D2 (zgłoszenie): po akceptacji pierwszego z dwóch pokoi bramka „Zakończ turę” jest otwarta, a para 2 nadal w „wojna” bez okna. Kod: src/main.ts acceptPendingForcedPeace (~26060), prunePendingForcedPeace (~26017), wpis pending ~39199.
- Porządek: moja pomyłkowa komenda build (vite --outDir poza repo) utworzyła pusty katalog /home/user/tmp/x poza worktree; usunięcie wymaga zgody (zakaz rm w dispatchu). Repo bez zmian poza allowlistą.
