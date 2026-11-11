STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-EMPIRE-RECRUIT-ALL-LIVE-VERIFY-Q1
GOAL: dowód w ŻYWEJ grze (Chromium, build vite serwowany po HTTP, ?playtest=mapa&civTest=1): panel imperium "Rekrutacja" -> "Rekrutuj wszystkie" z wybranym "Generałem rekrutującym"; równomierny rozkład po miastach, zrodzenie w realnym endTurn, jednostki do WYBRANEGO generała, koszty/limity/manpower, zapis/wczytanie, licznik domyślny 0.

ZMIANY/COMMIT: baza origin/main 10141fdcb. Tylko testy/skrypty, zero zmian kodu gry.
- NOWY gra/tools/empire-recruit-all-live-test.cjs (29 asercji; flagi --shot, --mutant=default1|rally; mutant jest cofany przez git checkout w finally).
- ZMIANA gra/tools/empire-recruit-live-test.cjs: L16-L18 (liczniki klikane 5x/4x zamiast 4x/3x).
- evidence/: 01-panel-przed-rekrutuj-wszystkie.png, 02-panel-po-rekrutuj-wszystkie.png, 03-po-turze-zrodzone.png, 04-limit-zlota-czesciowy.png
SHA: patrz commit czubka (pole sha w odpowiedzi).

TESTY (liczby z surowego wyjścia):
- empire-recruit-all-live-test (nowy): 29 passed, 0 failed. Dowodzi: L4 wszystkie liczniki w żywej grze = 0 (DEFAULT_QTY=0); L5/L7 przycisk nieaktywny przy zerach i bez generała; L8 klik w generała ustawia wybór (wybrany u0 jest DALSZY od miasta niż u1, d=2 vs 1); L10/L11 5xWojownik=2/2/1 i 4xRydwan=2/1/1 w cityProd.rekrutacja; L12 pobrane złoto = dokładnie 5x5+4x15 = 85 (w mutancie default1 pobrano 181); L13 liczniki -> 0; L14 9/9 wpisów kolejek niesie rallyGeneralId wybranego; L15-L19 zapis/wczytanie: kolejki identyczne, generał przywrócony; L20-L23 realny endTurn: 3 jednostki (po 1 z miasta), rally=wybrany, z kolejki każdego miasta zeszła 1 sztuka, marsz generalTargetId=wybrany (nie najbliższy); L24 limit złota (3 z 5: przyjęto 3, licznik 2, złoto 0); L25 brak złota -> nic; L26 manpower 0 -> nic; L27 po śmierci generała zamówienie odrzucone; L28 zero pageerror.
- MUTACJA default1 (DEFAULT_QTY=1 w empireRecruitPanel.ts): 21 passed, 8 FAILED (L4, L10, L11, L12, L14, L19, L24, L25) -> czerwony. MUTACJA rally (usunięcie rallyGeneralId z purchaseRecruitmentUnit w orderEmpireRecruitment): 25 passed, 4 FAILED (L14, L19, L20, L22) -> czerwony. Oba pliki przywrócone (git status czysty poza testami).
- empire-recruit-live-test (stary): przed zmianą 21 passed / 3 FAILED (L16 A=4, L17 totA=4, L18); po synchronizacji 24 passed, 0 failed, exit 0.
- army-auto-recruit-general-test: 32 assertions passed; army-auto-recruit-general-live-test: 17 passed, 0 failed; army-auto-recruit-general-ui-test: 11 passed, 0 failed.
- npx tsc --noEmit: exit 0, brak błędów.
- bramki referencyjne uruchomione: logic-test 213/213; tech-tree-test 20 pass/0 fail (ref. w dokumentacji 19/19 - dokument przestarzały, nie regresja); research-test 33/33; unit-replace-test 21/21 (ref. 13/13, jw.); combat-test 6/6; unit-power-test 6 pass/0 fail (ref. 4/2 czerwony - obecnie zielony). Nie uruchamiano map-gen-regression (wolny, nie wymagany w KRYTERIACH: "5 bramek referencyjnych" = logic/tech-tree/research/unit-replace/combat).

USTALENIA NA DOWODZIE:
1. empire-recruit-live-test L16-L18 był PRZESTARZAŁY, nie defekt gry: kod ma DEFAULT_QTY=0 (RECRUIT-ALL), test klikał "+" 4x przy założeniu licznika startowego 1 -> A=4 zamiast 5. Zsynchronizowano (tylko test). Zgłoszone "exit 124" NIE odtworzone: test kończy się exit 0 w ok. 2m41s (124 to timeout narzędzia przy zbyt krótkim limicie; samo wywołanie vite build + Chromium trwa ok. 2-3 min).
2. Na mapie ?playtest=mapa po 1. turze świata następuje zwycięstwo dominacją (gameOver, "Gra zakonczona"), więc DALSZE endTurn są niemożliwe; dodatkowo AI Greków atakuje gracza i otwiera ekran przed-bitwy (AUTO -> KONTYNUUJ). Skutek: w żywej turze można zmierzyć tylko PIERWSZĄ falę zrodzenia (1 jednostka/miasto/turę, RECRUIT_UNITS_PER_TURN): 3 z 9 zamówionych, pozostałe 6 zostaje w kolejkach po równo (2/2/2). Pełne zrodzenie 9 jednostek w kolejnych turach NIE_ZMIERZONO w żywej grze (ograniczenie mapy playtestowej, nie kodu). Po turze zmienia się lista typów (era), dlatego sekcja limitu złota bierze najtańszy typ z żywego panelu.
3. Brak defektu kodu gry; DECISION_REQUIRED nie jest potrzebne. Hooków civ-test-hooks.ts nie zmieniano (wszystko przez istniejące __empireRecruitTestDebug).
4. Środowisko: build vite do /dev/shm (poza repo), serwer HTTP node, Chromium /opt/pw-browsers/chromium-1194/chrome-linux/chrome przez PLAYWRIGHT_CHROMIUM_EXECUTABLE (domyślna ścieżka /opt/pw-browsers/chromium w testach może nie istnieć).

BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (przejrzeć nowy test pod kątem tautologii; sprawdzić zrzuty evidence/), potem Final Control; ewentualny follow-up: temat dla mapy playtestowej bez zwycięstwa dominacją, by zmierzyć wielotury rozkład zrodzeń.
DEPLOY/PUSH: NIE WYKONANO
