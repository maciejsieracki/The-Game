STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-PALISADE-BATTLE-WALL-RULES-Q1
GOAL: Runda 2 (obrona): odpowiedz na 5 zarzutow Evaluatora do R4 (wieżyczki muru/palisady) i modelu palisady.
RUNDY: 2/5 (obrona)

ODPOWIEDZI NA ZARZUTY
1. Brak zrzutow mapy miasta: PRZYJMUJE. Nowe `gra/tools/palisade-map-city-live.cjs` renderuje w Chromium te same funkcje co `render/cities.ts` (buildMiastoKamien / buildMiastoBraz). Zrzuty `zrzuty-r2d/mapa-miasto-era{1,2}-{brak,palisada,mur}.png` (<= 0,1 MB). Era 2: palisada = drewniane zaostrzone pale z brama, mur = kamienne bloki (rozne). Era 1: palisada i mur dają ten sam model (drewniany wał Biskupin, PALISADA-BRAZ-Q1=A, miasto-kamien.ts:635) — to decyzja z wczesniejszych rund, nie zmiana tej rundy. "PRZED" dla mapy nie istnieje jako różnica rundy 2 (model mapy pochodzi z rundy 1); pokazano stan obecny.
2. Wieżyczki tylko w taktycznej, nie w Auto/"Pomiń": ODRZUCAM jako defekt rundy, zostaje DECYZJA_WYMAGANA. Auto (`executeSilentSiegeStorm`, main.ts:33183) liczy jeden zagregowany stosunek sił (`resolveAutoBattleByPower`, mur wchodzi przez `dStructBonus`), bez symulacji tur. Wstrzyknięcie ostrzału = zmiana balansu Auto nieokreślona w dispatchu i niezmierzona. Domyślne założenie: ostrzał tylko w bitwie taktycznej (gracz i AI); opcja do decyzji właściciela: doliczyć moc wież do `mDef` (np. liczba żywych wież x moc strzału).
3. Slaby dowód ostrzału w scenie: PRZYJMUJE. Dodano parametr playtestu `?defera=1..3` (main.ts, tylko ścieżka playtestu oblężenia) i env `DEFERA` w `palisade-towers-live.cjs` (powtarzalne narzędzie w repo). Pomiar żywy na prawdziwej scenie, palisada, `--probe`: epoka 2 -> strzelec Procarz, zasięg 4, log "Wieza (Procarz) chybia w Hastati (56>=34%)" (rzut chybiony, hp 38->38); epoka 3 -> Procarz (fallback z epoki wcześniejszej), zasięg 4, "trafia Hastati za 1 (HP 37/38)". 39 wieżyczek, 0 błędów JS. Epoka 1 z rundy 2: Oszczepnik, zasięg 2, 38->37. Siła ostrzału jest z założenia właściciela mała (statystyki jednostki).
4. Jeden strzał na turę: ODRZUCAM (z uzasadnieniem). Tura bitwy (`_beginTurn`, battleScene.ts:5488) obejmuje przeplatane aktywacje OBU stron (atakującego i obrońcy). Sformułowanie dispatchu "w turze atakującego i w turze obrońcy" realizuje się jako jeden strzał na rundę, gdy w zasięgu jest wróg; dwa strzały na rundę podwajałyby siłę ostrzału bez wsparcia w dispatchu. Założenie do akceptacji; zmiana na 2 strzały = jedna linia wołania `_fireSiegeTowers` także po turze atakującego, gdyby właściciel tego chciał.
5. Regresja 7 testów rc!=0: ZBADANE, niezwiązane z rundą 2 (identyczny kod wyjścia PRZED i PO). Przyczyny (uruchomione ponownie):
 - auto-battle-simultaneous-test: błąd harnessu (stub sceny, `occByKey` undefined w `_activateUnit`).
 - battle-loot-test: dane/oczekiwania rozjechane (Włócznik braz 50 zamiast 2; 4 FAIL).
 - heal-stale-blockers-pending-battle-test, pre-battle-retreat-exhausted-test, mur-paradoks-test (fixture M Konnicy 49 vs 98): przypięcia źródła/wartości nieaktualne względem main.
 - pr141-combat-defense-owner-route-test: `ReferenceError: _menuCivIdByOwner is not defined` (harness).
 - pre-battle-save-test: esbuild "Build failed with 2 errors" (harness).
 Nie naprawiam (poza allowlistą tematu). endturn-battle-deadlock-exec-test: różnica PRE rc=1 / PO rc=0 to wrażliwość na obciążenie równoległe.

ZMIANY/COMMIT: baza `dbb0ec69a` (Operator r2). Pliki: `gra/src/main.ts` (tylko ?defera w playteście oblężenia), `gra/tools/palisade-towers-live.cjs` (DEFERA), NOWY `gra/tools/palisade-map-city-live.cjs`, run-dir: `05-obrona-r2.md`, `zrzuty-r2d/`, `gate-r2d-*.txt`. R1–R3 i logika R4 bez zmian.
TESTY: tsc --noEmit EXIT=0; city-wall-towers-test 59 OK/0 FAIL; palisade-battle-wall-rules-test 52 OK; city-siege-wall-rules-test 50 OK; vite build (--outDir /dev/shm) OK; Chromium: pomiar ostrzału epoki 2 i 3, 0 błędów JS; zrzuty mapy 6 szt.
BLOKADY: brak techniczych.
DECYZJA_WYMAGANA (dla orkiestratora): (a) ostrzał wież w Auto/"Pomiń" (domyślnie: nie); (b) 1 vs 2 strzały na rundę (domyślnie: 1); (c) z rundy 1: wieża oblężnicza w taktycznej nie liczy się jako wyłom.
NASTĘPNY KROK: Evaluator r2 (ponowna ocena) / Final Control.
DEPLOY/PUSH: NIE WYKONANO
