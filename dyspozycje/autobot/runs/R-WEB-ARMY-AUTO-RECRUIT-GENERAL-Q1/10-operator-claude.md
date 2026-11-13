STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ARMY-AUTO-RECRUIT-GENERAL-Q1
GOAL: rekrutacja z panelu Rekrutacja (cała cywilizacja) działa tylko przy wybranym generale rekrutującym; nowo zrekrutowane jednostki idą do WYBRANEGO generała; bez wyboru panel nie rekrutuje; rekrutacja ręczna (Armia, miasto) bez zmian.

ZMIANY/COMMIT (baza 37bcf8ebb; SHA commita w polu sha zwrotki):
- gra/src/game/recruit-general.ts (nowy, czysty): livingGeneralsOf, resolveRecruitGeneral (none/ok/lost), recruitRallyStamp, pickRallyGeneral.
- gra/src/game/production.ts: ProductionItem.rallyGeneralId?.
- gra/src/units/setup.ts: RuntimeUnit.rallyGeneralId?.
- gra/src/game/save.ts: pole recruitGeneralId (zapis/wczytanie; stary zapis = brak pola).
- gra/src/main.ts: stan recruitGeneralId; validateRecruitGeneral (śmierć/zniknięcie generała -> czyszczenie wyboru + powiadomienie hint); orderEmpireRecruitment odmawia bez żywego generała i przekazuje rallyGeneralId do purchaseRecruitmentUnit; wpis kolejki dostaje followGeneral:true + rallyGeneralId; spawn kopiuje rallyGeneralId do jednostki; planSpawnedUnitFollowGeneral i syncGeneralMarchTargets używają pickRallyGeneral (wybrany generał, a gdy zginął — najbliższy); reset przy Nowej grze; hak testowy __empireRecruitTestDebug (selectedGeneral, generals, ensureAndSelectGeneral, clearGeneralSelection, killGeneral, queueIntents).
- gra/src/ui/empireRecruitPanel.ts: sekcja „Generał rekrutujący” (lista własnych generałów, ikona gry ★, znacznik „rekrutuje” przy wybranym, ponowny klik odznacza), „Rekrutuj”/„Rekrutuj wszystkie” nieaktywne bez wyboru + ostrzeżenie. Wymóg działa tylko gdy cfg.getGenerals podane (main.ts podaje).
- Testy: tools/army-auto-recruit-general-test.cjs (nowy, 27 asercji), tools/army-auto-recruit-general-ui-test.cjs (nowy, Chromium, 11 PASS, zrzuty), tools/recruit-follow-general-origin-test.cjs (regex kontraktu zaktualizowany o rallyGeneralId), tools/empire-recruit-live-test.cjs (wybór generała przed zamówieniami + env PLAYWRIGHT_CHROMIUM_EXECUTABLE).
- Zrzuty: panel-rekrutacja-bez-generala.png, panel-rekrutacja-z-generalem.png (w tym katalogu).

TESTY (surowe wyjście):
- tsc --noEmit: bez błędów.
- army-auto-recruit-general-test: 27 assertions passed.
- recruit-follow-general-origin-test: 22 assertions passed.
- army-auto-recruit-general-ui-test (Chromium): 11 passed, 0 failed.
- empire-recruit-panel-real-render 26/0; empire-recruit-plan 17/0; empire-recruit-all 31/0; empire-mass-recruitment 45/0; empire-recruit-panel-no-inner-scroll 17/0; empire-recruit-affordability 17/0; recruit-rally-default-save PASS.
- empire-recruit-live-test (realna gra, vite build + Chromium): 21 passed, 3 failed (L16, L17, L18). Przyczyna: test zakłada start licznika = 1 (4 kliknięcia „+" mają dać 5), a kod ma DEFAULT_QTY = 0 od R-WEB-UI-EMPIRE-RECRUIT-PANEL-RECRUIT-ALL (rejestr #187 LIVE-VERIFY). Nie zmierzono na bazie 37bcf8ebb (NIE_ZMIERZONO) — ocena z kodu: dług sprzed tego tematu, niezwiązany z generałem. Wszystkie nowe bramki generała w tym teście (L2b, zamówienia L6-L14) PASS.
- recruit-rally-default-ui-test: FAIL budowy esbuild (importy ?raw w brandTokenVars/brandAssets) — plik niezmieniony przeze mnie; dług środowiska testu, NIE_ZMIERZONO na bazie.
- NIE wykonano: pełnego scenariusza „generał ginie w realnej grze + zrodzenie jednostki w turze” w Chromium (pokryte testem jednostkowym pickRallyGeneral/resolveRecruitGeneral i kontraktem źródłowym; hak killGeneral/queueIntents gotowy pod Evaluatora).

ZAŁOŻENIA:
1. W kodzie nie istnieje osobny „automat rekrutacji”; „automatyczna rekrutacja w panelu Rekrutacja” = zamówienia z zbiorczego panelu (automatyczny rozkład po miastach). Wymóg generała dotyczy tego panelu. Ręczna rekrutacja (panel Armia, miasto) i wspólne „Idź do wodza” wg BY-ORIGIN — bez zmian.
2. Brak wyboru = zamówienia z panelu zablokowane (przyciski nieaktywne + komunikat w onOrder). Nie ma „fallbacku do najbliższego” dla panelu (GOAL: „bez wybranego generała automatyczna rekrutacja wyłączona”).
3. Generał ginie/znika: wybór czyszczony przy najbliższym otwarciu panelu/zamówieniu z powiadomieniem; jednostki już w kolejce, których rallyGeneralId wskazuje martwego generała, przy zrodzeniu idą do najbliższego generała (dotychczasowa reguła), bez błędu.
4. Migracja: starych zapisów nie ma czego migrować (brak stanu „auto-rekrutacji”); po wczytaniu brak wybranego generała = panel nie rekrutuje do wyboru (informacja w panelu). Jednorazowe powiadomienie nie dodane — NOTATKA do Evaluatora, jeśli właściciel je chce.
5. Parytet AI: AI nie używa panelu; ścieżka AI (purchaseRecruitmentUnit bez rallyGeneralId, spawn ownerId>0) niezmieniona.
6. Ikona: istniejący znak generała ★ z gry (armyStackHud), brak nowych assetów. Brak nowych liczb gry (brak danych liczbowych w kodzie).
7. Stan UI generałów (lista) dotyczy fotela ME() (hot-seat: ownerId aktywnego gracza); pole zapisu jedno (jak recruitFollowGeneralDefault).

BLOKADY: brak. (Zależność z kolejki „po IMPROVEMENT-ADMINISTRATOR” nie blokowała — temat niezależny plikowo.)
RUNDY: 1/5
NASTĘPNY KROK: Evaluator — sprawdzić: (a) zbieżność z L16-18 (test live, dług DEFAULT_QTY) czy naprawić test; (b) scenariusz w realnej grze: wybór generała -> zamówienie -> zrodzenie -> marsz do WYBRANEGO (nie najbliższego); (c) śmierć generała; (d) zapis/wczytanie w realnej grze; (e) decyzja właściciela, czy potrzebne powiadomienie przy wczytaniu zapisu bez wyboru.
DEPLOY/PUSH: NIE WYKONANO
