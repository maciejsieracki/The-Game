STATUS: FAIL
DOMAIN: GAME (WEB)
TEMAT: R-WEB-PERF-LATE-GAME-LAG-HUD-Q2
GOAL: refreshFog, updateHud/buildHudState i refreshTerritoryBorderOverlay zredukowane >= 5x albo usuniete ze sciezki interakcji; endTurn zmierzony i zredukowany. Stan: updateHud 5,4x (spelnione), refreshFog 3,9x (niespelnione), granice nie zmierzone osobno, endTurn 1,1x (w szumie), ruch/wejscie do miasta/panel miasta NIE_ZMIERZONO.

ZMIANY/COMMIT: oceniany HEAD = 00b98fde1e9375e5395e0163e5bd756e0b910d9f (obrona R1), nad Operatorem 52d92bd717b88f940ef807eab22bb22b00a0307f / kod 157a9dcfdadea16eaf282eac2aa203b3ddd26642, baza 4905bac052e77cbd104b9794b304a87d8f3c9b65.
Allowlista: git diff --name-only 4905bac05..00b98fde1 = gra/src (9 plikow: main.ts, game/okolica.ts, game/owner-scope.ts, game/production.ts, game/resource-access.ts, game/turn-economy.ts, map/improvement-build.ts, map/territory-border-cache.ts, map/territory.ts), gra/tools (perf-hud-q2-test.cjs, perf-late-game-interaction-live-test.cjs), dyspozycje/.../R-WEB-PERF-LATE-GAME-LAG-HUD-Q2/**. Brak gra-robocza, WERSJE.md, rust-port, src-tauri, battle, gra/data. git diff --check czysty.
Ten commit (03-final-control.md) dokleja tylko raport FC.

TESTY (odtworzone samodzielnie na 00b98fde1, npm ci --ignore-scripts, node_modules usuniete po pracy):
- tsc --noEmit: EXIT=0
- perf-hud-q2-test: 23/0 (budzet 600 przypisan 486 ms < 6000)
- okolica-test 72/72; okolica-multi-city-overlap 55/55
- territory-border 9/0; territory-border-dense-settlement 15/0
- hud-skarbiec 34/0; production-overflow 213/0
- Nie powtarzano: irrigation-river-definition-unify, auto-improvements (EXIT=0 w gate-r2-*.txt Obrony), ai-test 274/20 (z evidence Operatora), Chromium (dysk 4,7 GB, load wysoki; brak buildu/profilu).
- Zerowa regresja wzgledem bazy (wg Evaluatora): ai-fog-test, okolica-load-reconcile, okolica-ownership-change-reconcile bez zmian.

WERDYKT PER ZARZUT:
1. GOAL >= 5x niespelniony (refreshFog 3,9x, endTurn 1,1x, granice nie zmierzone osobno): NAPRAW. Kryterium glowne dispatchu jest liczbowe; spelnione tylko dla updateHud. Obrona nie dostarczyla poprawki, tylko potwierdzila stan.
2. Brak redukcji wielokrotnych wolan refreshFog/updateHud na klik: NAPRAW (w formie pomiaru-najpierw). Odrzucenie przez Obrone ("ryzyko") nie jest poparte pomiarem; dispatch (zad. 1) wymagal licznika wolan na klik. Nie wymagam slepej koalescencji rAF; wymagam licznika wolan/klik i zbicia tylko duplikatow bez mutacji stanu pomiedzy wolaniami (dowod w kodzie lub rAF za flaga z testami DOM).
3. NIE_ZMIERZONO: ruch, wejscie do miasta, panel miasta, zaleznosc od tury: NAPRAW. To jest dokladnie zgloszenie wlasciciela. renderInfo.calls 28 881 po wczytaniu zapisu wobec 707 w swiezej grze to kandydat na osobne, realne waskie gardlo (np. obiekty sceny nieusuwane/dublowane przy wczytaniu), nie artefakt; najpierw diagnoza.
4. Luka testowa: ODDAL (naprawione w 00b98fde1: +15 testow, ownerScoped i granice). Pozostaje NIE_ZMIERZONO dla domkniec main.ts (productionAvailabilityCtxForCity, cityResourceAccessForCityId(activeOnly)); do domkniecia w rundzie 3 tam, gdzie wyciagniecie do modulu jest tanie.
5. Memo rzek, slaba inwalidacja i typ: ODDAL (naprawione: skrot wspolrzednych, ReadonlySet, test).
6. Szum pomiarow: NAPRAW (w rundzie pomiarowej): raportowac min/mediane/max z N powtorzen i load average; endTurn 1,1x traktowac jako nieodroznialny od szumu.

Recenzja semantyczna: bez zmian wyniku gry (potwierdzone przegladem Evaluatora i testami rownowaznosci). Merge-tree z origin/main (0312a1fdb) czysty, brak konfliktow (main zmienil sidePanel*/converters/eot-event-defer i 75 linii main.ts).

BLOKADY: zarzuty 1, 2, 3, 6 otwarte. Brak DO DECYZJI CZLOWIEKA.
RUNDY: 2/5 (FC po rundzie 2 Obrony)
SHA DO INTEGRACJI: brak (FAIL). Kod 00b98fde1 jest bezpieczny do integracji jako czesc pozniejszego PASS; kolejnosc wzgledem origin/rust-port/parity-v2: temat jest czysto webowy (gra/src), nie dotyka rust-port; integracja do main, parity-v2 bez zmian, REPIN po zmianach weba.
NASTEPNY KROK: Operator runda 3 (ten sam ID, ta sama galaz): (a) diagnoza renderInfo.calls 28 881 po wczytaniu zapisu; (b) licznik wolan refreshFog/updateHud/refreshD1bHud na klik + profil CDP ruch/wejscie/panel miasta, min/mediana/max; (c) dobic refreshFog do >= 5x (assignWorkedTiles/previewCityEconomy, buildEmpireResourceRows, refreshMinimap, renderBar) lub odroczyc poza sciezke interakcji; (d) osobny pomiar refreshTerritoryBorderOverlay. Potem Evaluator, FC.
DEPLOY/PUSH: NIE WYKONANO
