STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ARMY-AUTO-RECRUIT-GENERAL-Q1
GOAL: rekrutacja z panelu Rekrutacja tylko z wybranym generałem; nowe jednostki idą do WYBRANEGO generała; bez wyboru panel nie rekrutuje; rekrutacja ręczna bez zmian.

ODPOWIEDZI NA ZARZUTY EVALUATORA (start od fa054cb6b)

Zarzut 1 (brak testu e2e w realnej grze) — PRZYJMUJĘ.
Dodano gra/tools/army-auto-recruit-general-live-test.cjs (vite build -> Chromium, ?playtest=mapa&civTest=1, realny endTurn). Wynik: 17 passed, 0 failed. Pokrycie: 2 generałów, wybrany = DALSZY od miasta (nie najbliższy); bez wyboru zamówienie odrzucone (kolejki puste); z wyborem wpisy kolejki niosą rallyGeneralId+followGeneral; jednostka zrodzona w realnej turze niesie rallyGeneralId; zaplanowany marsz ma generalTargetId = WYBRANY generał (nie najbliższy u1); zapis przez persistSaveToSlot, wyzerowanie wyboru, wczytanie -> wybór przywrócony; śmierć generała (hak killGeneral) przy ZAMKNIĘTYM panelu -> po turze wybór wyczyszczony; po śmierci panel znów nie rekrutuje; zero pageerror. Haki testowe dodane do __empireRecruitTestDebug (selectGeneral, generalInfo, cityPos, rallyUnits, quickSave, loadSlot) — tylko w trybie civTest.
Uwaga: mutacja bramki `if (!rallyId)` jest teraz łapana wykonaniem (L4), nie tylko regexem.

Zarzut 2 (zrzuty z makiety) — PRZYJMUJĘ.
Live-test robi zrzut REALNEGO panelu: panel-rekrutacja-live-z-generalem.png (sekcja „Generał rekrutujący”, lista „Wódz 1/2 — Hastati”, znacznik „rekrutuje” przy wybranym, opis „Nowe jednostki z tego panelu idą do wybranego generała”). Na zrzucie widoczne okno „Wróg atakuje” (pre-battle z mapy playtestowej) zasłania dół ekranu; lista generałów jest w pełni widoczna. Makiety zostają jako uzupełnienie.

Zarzut 3 (leniwe powiadomienie o śmierci generała) — PRZYJMUJĘ.
Poprawka w main.ts: validateRecruitGeneral() wołane zaraz po flushPendingEraChangeToast() w końcówce tury (endTurnInProgress=false => prawdziwy toast, nie bierny wpis „Koniec tury”). Pierwsza próba (wywołanie przy turn++) zawiodła: hint trafiał do deferredEotHints i nie był toastem — wykryte przez live-test L15, przeniesione. Dowód: L14 (wybór wyczyszczony przy zamkniętym panelu) i L15 (toast zawiera „zginął”) PASS. Kontrakt regex w army-auto-recruit-general-test.cjs zaktualizowany.

Zarzut 4 (brak powiadomienia przy migracji zapisu) — PRZYJMUJĘ (poprawka odstępstwa od dispatchu).
Dodano pole zapisu recruitGeneralNoticeShown (save.ts: serializacja/deserializacja; main.ts: zapis zawsze true, nowa gra = true). Wczytanie zapisu bez flagi (legacy) => jednorazowy toast „Panel Rekrutacja wymaga teraz wybranego generała rekrutującego — wybierz go w panelu.” (gdy brak wybranego generała), po czym flaga true w kolejnych zapisach. Testy: roundtrip flagi, legacy bez flagi, regexy wiązania w main.ts (army-auto-recruit-general-test 32 assertions). Wczytanie legacy zapisu w realnej grze: NIE_ZMIERZONO (pokryte testem czystym + kontraktem źródłowym).

ZMIANY/COMMIT (allowlista: panel rekrutacji/stan/zapis/testy): gra/src/main.ts, gra/src/game/save.ts, gra/tools/army-auto-recruit-general-test.cjs, gra/tools/army-auto-recruit-general-live-test.cjs (nowy), dyspozycje/autobot/runs/R-WEB-ARMY-AUTO-RECRUIT-GENERAL-Q1/{30-obrona-claude.md, panel-rekrutacja-live-z-generalem.png}. SHA końcowy w polu sha zwrotki.

TESTY (surowe wyjścia, ten worktree):
- tsc --noEmit: 0 błędów (exit 0)
- army-auto-recruit-general-test: 32 assertions passed
- army-auto-recruit-general-live-test (realna gra): 17 passed, 0 failed
- army-auto-recruit-general-ui-test: 11 passed, 0 failed
- recruit-follow-general-origin-test: 22 assertions passed
- empire-recruit-panel-real-render-test 26/0; empire-recruit-plan-test 17/0; empire-recruit-all-test 31/0; empire-recruit-affordability-test 17/0; empire-recruit-panel-no-inner-scroll-test 17/0; recruit-rally-default-save-test PASS; army-panel-recruit-rally-general-test 5 assertions passed
- Nie ruszane (dług bazowy wg Evaluatora, identyczny na 37bcf8ebb): empire-recruit-live-test L16-18, recruitment-batch-contract-test, general-capital-recruitment-order-test.

BLOKADY: brak.
RUNDY: 2/5 (obrona po 1. rundzie Operatora i Evaluatorze)
NASTĘPNY KROK: Evaluator/Final Control runda kolejna na SHA z pola sha.
DEPLOY/PUSH: NIE WYKONANO
