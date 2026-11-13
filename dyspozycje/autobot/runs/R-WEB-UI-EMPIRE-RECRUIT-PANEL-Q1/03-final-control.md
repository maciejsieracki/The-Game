STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) — UI + logika
TEMAT: R-WEB-UI-EMPIRE-RECRUIT-PANEL-Q1
GOAL: Liczniki "Rekrutuj" niezależne i nie zerowane; zbiorczy panel "Rekrutacja — cała cywilizacja" rozkładający zamówienie równomiernie po miastach gracza.
ZMIANY/COMMIT: weryfikowany SHA ecf8454c0 (baza 34f24ef0e; origin/main = 3aa1b3a2a, merge-tree bez konfliktów). Ten raport: osobny commit dokumentacyjny.
WERDYKTY ZARZUTÓW:
1 runtime: ODDAL — hak __empireRecruitTestDebug (tylko ?civTest=1) + empire-recruit-live-test 23/23 na realnym buildzie (3 miasta, 5 wojowników 2/2/1, 4 tarany, koszty, oblężone pominięte).
2 allowlista unitRecruitCard.ts: ODDAL — przyczyna resetu (setQuantity(1)) jest tam; zmiana +17/-3, uzasadniona; rozszerzenie allowlisty zatwierdzone.
3 ucinana meta: ODDAL — zawijanie + .erp-queued, asercja widoczności (26/26).
4 odświeżanie/reset: ODDAL — refresh w updateHud, reset w prepareSessionForLoad i doStartGame.
5 cywile: ODDAL — filtr Civilian/isCivilianUnit, potwierdzone w live.
6 redystrybucja: ODDAL — jedna runda replanowania (plan-test 17/17); brak limitu kolejki w enqueueRecruitment = założenie udokumentowane.
7 regresje: ODDAL — patrz TESTY.
Zero NAPRAW -> PASS.
TESTY (własne, ecf8454c0): tsc --noEmit EXIT=0; empire-recruit-plan-test 17/17; empire-recruit-panel-real-render 26/26; empire-recruit-live-test 23/23 (w tym 640 px); recruit-card-quantity-real-render 25/25; recruitment-batch-contract 17/17; empire-mass-recruitment 30/30; army-panel-recruit-remove 21/21; siege-blockade-no-recruit-reinforce --no-live 48 OK. Brak zmian w production.ts, gra-robocza, WERSJE.md, rust-port.
NIE_ZMIERZONO: ai-test 274/20 i szeroki zestaw *queue*/*production* (wg raportu Obrony 0 FAIL, nie powtórzone); mutant wiringu main.ts; siege-blockade część live. Znane błędy na bazie, niezwiązane: rekrutacja-skarbiec-only-test (1), era-recruit-panel-refresh-test (trimWarEventLog).
BLOKADY: brak
RUNDY: 2/5
NASTĘPNY KROK: integracja orkiestratora: SHA do integracji = ecf8454c0 (kod) scalić na świeży origin/main (obecnie 3aa1b3a2a, bez konfliktów). Zmiany tylko w gra/ web, niezależne od origin/rust-port/parity-v2: web najpierw do main, REPIN parity-v2 po końcu weba.
DEPLOY/PUSH: NIE WYKONANO
