STATUS: PASS
DOMAIN: GAME
TEMAT: R-HOTSEAT-ETAP6D-PODETAP-C-Q1
GOAL: Migracja klastra "silnik: inicjalizacja i save/load" (5 funkcji, ok. 7-9 miejsc
literalu `0`) na `isMe()`/`isHuman()` wg aliasu wskazanego w recon, kontynuacja Etapu 6d.

ZMIANY/COMMIT: worktree /home/user/wt-6d-PODETAP-C, gałąź
autobot/R-HOTSEAT-ETAP6D-PODETAP-C-Q1, commit c1532a9f (NIE scalony do main).
- gra/src/main.ts: 5 funkcji zmigrowane 1:1 wg tabeli aliasów z dispatchu:
  applyClusterStartPlan (8567-8574) i spawnPendingSameTypeRivals (8691-8699) ->
  HUMAN_OWNER_PRIMARY (2 miejsca każda: setDiploRelation + getWiarygodnosc); zapisują
  stan PARY przy tworzeniu świata, nie ekran aktywnego fotela.
  finalizeAllianceObligationRefusals (18871-18886), resolvePendingDiplomacy
  (16925-16977, 5 miejsc), restoreGameFromSave (2 hardkody: 36843 negotiationTable,
  36910 diplomaticContactEstablished) -> isMe()/ME(). Pełny Read potwierdził, że
  resolvePendingDiplomacy operuje wyłącznie na pendingDiplomacyInbox (oferty do/od
  aktywnego fotela) — decyzja orkiestratora isMe zastosowana bez DECISION_REQUIRED.
- gra/tools/hotseat-etap6d-podetap-c-migracja-test.cjs (nowy): ekstrakcja ciał 5 funkcji
  z main.ts, asercja braku regresji literału + obecności aliasu; PRE/POST logika dla
  klastra isMe na [0] (no-op) i [0,1] aktywny=1 (rozjazd — dowód nietautologiczności).
  Ręcznie zweryfikowano: revert jednej migracji (restoreGameFromSave) czerwieni 2/34
  asercji, po przywróceniu znów 34/34 zielone.
- gra/tools/hotseat-etap6d-podetap-c-live-saveload-test.cjs (nowy): żywy Chromium —
  realny doStartGame (applyClusterStartPlan+spawnPendingSameTypeRivals), 3 tury, REALNY
  buildSaveGameSnapshot/restoreGameFromSave (__aiBuildingsTestDebug.saveLoadRoundTrip,
  ta sama para funkcji co "Zapisz grę"), 3 kolejne tury. Wariant ZEPSUTY (isMe()=false)
  równolegle: 0 wyjątków JS w obu wariantach — te 2 hardkody isMe w restoreGameFromSave
  dotyczą wyłącznie diplomacyRelations/negotiationTable, których dumpState() (jedyny hak
  dostępny bez naruszenia allowlisty) nie obejmuje; nietautologiczność semantyki isMe
  dowiedziona osobno w migracja-test.cjs (nie w tej bramce — udokumentowane w kodzie).

TESTY:
- tsc --noEmit: 0 błędów.
- 5 bramek referencyjnych: logic-test 213/213, tech-tree-test 19/19, research-test
  33/33, unit-replace-test 13/13, combat-test 6/6 — wszystkie PASS.
- Bramki save/load istniejące: forced-war-iron-era-enter-turn-save-load-test 20/20,
  fort-nodes-save-load-test 18/18, save-load-sort-test 4/4 — PASS, bez regresji.
- Nowa bramka migracji: 34/34 PASS, mutacja-czerwieni potwierdzona ręcznie.
- Nowa bramka żywa (Chromium, realny save/load): 7/7 PASS. Świat: 1 miasto gracza +
  >=1 rywal tego samego typu (spawnPendingSameTypeRivals zadziałał). Roundtrip
  save/load bez wyjątku, cities/units/turn identyczne przed/po (oczekiwane — hardkody
  dotyczą diplomacji, nie cities/units). Kolejne tury po wczytaniu mijają.

BLOKADY: brak. Oba wcześniej nierozstrzygnięte aliasy (finalizeAllianceObligationRefusals,
resolvePendingDiplomacy) rozstrzygnięte decyzją orkiestratora z dispatchu; pełny Read
potwierdził warunek dla resolvePendingDiplomacy (pętla wyłącznie na ofertach do/od
aktywnego fotela) — DECISION_REQUIRED nie było potrzebne.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator ocenia migrację i oba nowe testy (allowlist-only main.ts +
tools/*-test.cjs). Po PASS Evaluatora → Final Control → integracja orkiestratora do main
(commit c1532a9f na gałęzi autobot/R-HOTSEAT-ETAP6D-PODETAP-C-Q1, NIE scalony).
DEPLOY/PUSH: NIE WYKONANO
