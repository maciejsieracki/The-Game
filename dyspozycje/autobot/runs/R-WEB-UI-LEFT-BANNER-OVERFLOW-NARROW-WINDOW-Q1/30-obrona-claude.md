STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-LEFT-BANNER-OVERFLOW-NARROW-WINDOW-Q1
GOAL: lewy baner nie wychodzi poza okno przy 1366/1280/1024 px; uklad szeroki bez zmian.
ZMIANY/COMMIT: start d46619dbd; zmieniony tylko gra/tools/left-banner-overflow-narrow-test.cjs (+rozdzielczosci 1920/1600/1480, parametr POP, kontrola jednej linii od 1480) i ten raport. Kod gry bez zmian wzgledem d46619dbd.
ODPOWIEDZI NA ZARZUTY:
1. ALLOWLISTA (cityPanel.ts, cityUxFrame.ts poza lista) - PRZYJMUJE jako fakt formalny, ODRZUCAM jako wade kodu. Zmierzona przyczyna wyjscia poza okno lezy w CSS pasa banerow widoku miasta (.civ-v-w3-chips-flank w cityPanel.ts, max-width stosu w cityUxFrame.ts); hud.ts/hudLayout.ts nie zawieraja tej reguly. Diff: 9 + 2 linie CSS, bez zmiany tresci/wartosci. DECYZJA ORKIESTRATORA: rozszerzyc allopliste o te dwa pliki albo dac FAIL.
2. TOZSAMOSC BANERA (mapa vs miasto) - PRZYJMUJE: nie da sie rozstrzygnac z repo, ktory baner widzial wlasciciel. Baner mapy (hud.ts) wg Evaluatora miesci sie (hud-topbar-layout-a-test 144/0; nie powtarzano w tej rundzie - brak node_modules/vite w worktree). ZALOZENIE: zgloszenie dotyczy pasa banerow widoku miasta (jedyny element zmierzony jako wychodzacy: l=-21/-64/-190 px). NIE_ZMIERZONO: baner mapy w realnej grze. Jesli wlasciciel mial na mysli baner mapy, potrzebny odtwarzalny scenariusz.
3. FIXTURE / SZEROKIE OKNA - PRZYJMUJE czesciowo (poprawka testu + dowod):
 a) okna 1480-2000: dodane 1920x1080, 1600x900, 1480x900 + kontrola "jedna linia, h<70" dla w>=1480. Wynik: 1920 L256..921 R1160..1664 h=53; 1600 L96..761 R1000..1504 h=53; 1480 L36..701 R940..1444 h=53; brak wyjscia, brak scrolla.
 b) duze liczby: POP=60 (zmienna srodowiskowa) - wszystkie rozdzielczosci PASS (np. 1024: L12..449 R689..1012 h=142; 1366 h=98).
 c) zrzuty PNG: nie ogladano ponownie w tej rundzie; dowodem sa pomiary getBoundingClientRect. NIE_ZMIERZONO: widok miasta w pelnej grze z prawdziwym stanem (fixture syntetyczny, jedno miasto); przy 1024 baner ma 3 rzedy (h=142), panele boczne schodza pod niego (test to sprawdza).
TESTY (surowe wyjscie; Chromium z /opt/pw-browsers, esbuild+playwright+three zainstalowane poza repo, symlink node_modules nie commitowany):
 left-banner-overflow-narrow-test.cjs: PASS=74 FAIL=0 (POP=6). POP=60: PASS=71 FAIL=0 przed dodaniem kontroli jednej linii.
 --mutant: PASS=69 FAIL=6 (l>=0 i r<=okno w 1366/1280/1024; np. 1366 l=-20.97, r=1386.95).
 Nie powtarzano: tsc, logic/tech-tree/research/unit-replace/combat, city-side-panels, hud-topbar, hud-panels (kod gry niezmieniony wzgledem d46619dbd, ktore Evaluator zweryfikowal: tsc 0, 213/213, 20/0, 33/33, 21/21, 6/6, 61/0, 144/0, 119/0).
BLOKADY: DODATEK i 00-dispatch.md nieobecne na origin/main i wskazanej galezi (dispatch z commitu 5c4a78862); zalozenia wyzej. Decyzje do orkiestratora: allowlista (zarzut 1), tozsamosc banera (zarzut 2).
RUNDY: obrona, runda 1/5
NASTEPNY KROK: Final Control (po decyzji o allowliscie).
DEPLOY/PUSH: NIE WYKONANO
