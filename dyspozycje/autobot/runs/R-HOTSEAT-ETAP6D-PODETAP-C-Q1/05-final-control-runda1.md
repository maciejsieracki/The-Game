STATUS: PASS
DOMAIN: GAME
TEMAT: R-HOTSEAT-ETAP6D-PODETAP-C-Q1
GOAL: Migracja klastra „silnik: inicjalizacja i save/load" (5 funkcji, ok. 7-9 miejsc
literału `0`) na `isMe()`/`isHuman()` wg aliasu wskazanego w recon, kontynuacja Etapu 6d.

WERDYKTY:
- Migracja 5 funkcji: ZGODNA z tabelą aliasów dispatchu w 00-dispatch.md. Potwierdzone
  własnym `Read` pełnych ciał (nie zaufaniem raportom Operatora/Evaluatora):
  - `applyClusterStartPlan` (8476-8618) i `spawnPendingSameTypeRivals` (8621-8730) →
    `HUMAN_OWNER_PRIMARY`, oba miejsca każda (setDiploRelation arg1 + getWiarygodnosc).
    Zgodne z uzasadnieniem "stan pary, nie ekran aktywnego fotela".
  - `finalizeAllianceObligationRefusals` (18848-18889) → `isMe()`/`ME()`, 3 miejsca.
    Zgodne z decyzją orkiestratora (spójność z `joinAllyToWar`/
    `applyAllianceObligationsOnWar`).
  - `resolvePendingDiplomacy` (16929-16987) → `ME()`, 5 miejsc.
  - `restoreGameFromSave` (36143-36966), oba hardkody → `isMe()`/`ME()`
    (36846 negotiationTable restore, 36914-36915 diplomaticContactEstablished pętla).
- WARUNEK orkiestratora dla `resolvePendingDiplomacy` (pętla wyłącznie na ofertach
  DO/OD aktywnego fotela) — zweryfikowany OSOBIŚCIE, niezależnie od twierdzeń Operatora
  i Evaluatora, przez pełne prześledzenie producentów `pendingDiplomacyInbox`:
  `enqueueDiplomacyPendingFromCmd` (jedyny writer poza save-restore) ma dokładnie 2 grupy
  wywołań w main.ts — (a) linie 32452-32468, wszystkie pod `else if (targetId === 0)`
  w pętli komend AI; (b) linia 18566 w `applyAiAudienceRequest`, wołanej WYŁĄCZNIE gdy
  `cmd.targetId === '0'` (main.ts:32325). Obie ścieżki są warunkowo ograniczone do
  aktywnego fotela — WARUNEK POTWIERDZONY, decyzja isMe/ME() poprawna,
  DECISION_REQUIRED nie było potrzebne.
- Reszta ciała `restoreGameFromSave` (poza dwoma migrowanymi hardkodami) zawiera inne,
  NIEZWIĄZANE literały `ownerId === 0`/`!== 0` (linie ok. 36226, 36261, 36755 — dotyczą
  `city.ownerId`, tryb okolicy/praca-pool, nie relacji dyplomatycznej) — POZOSTAWIONE
  celowo, poza allowlistą tego tematu (dispatch wskazał WYŁĄCZNIE 2 konkretne hardkody
  w tej funkcji). Brak scope creep, brak przeoczenia.
- `git diff --stat` względem merge-base (`cb667e5d`, potwierdzone `git merge-base`)
  ZGODNY z allowlistą 1:1: wyłącznie `gra/src/main.ts` (46 linii) + 2 nowe pliki
  `gra/tools/*-test.cjs`. Pełny `git diff` main.ts pokazuje wyłącznie 5 hunków, każdy
  wewnątrz jednego z 5 migrowanych ciał — zero zmian poza allowlistą.
- Docstring `hotseat-etap6d-podetap-c-live-saveload-test.cjs` linia ~35: NAPRAWIONY
  poprawnie — obecnie mówi "(5) wariant ZEPSUTY (isMe()=false) NIE MUSI dać wyjątku JS
  ani różnego wyniku roundtrip", zgodnie z faktyczną asercją w kodzie (linia 352,
  PASS wymaga braku wyjątku, rozjazd cities/units/turn tylko INFO). Zgodność
  nagłówek-kod potwierdzona osobiście.
- Drobna, NIEBLOKUJĄCA rozbieżność znaleziona przeze mnie (nowa, nie zgłoszona przez
  Evaluatora/Obronę): raporty Operatora i Evaluatora obaj piszą "34/34" dla
  `hotseat-etap6d-podetap-c-migracja-test.cjs`, ale rzeczywisty, niezmieniony od
  commitu `c1532a9f` plik ma 35 wywołań `check()` i mój przebieg drukuje 35 linii
  `OK:`, 0 `FAIL` — tj. bramka jest 35/35, nie 34/34. Zweryfikowałem, że plik testu
  nie zmienił się między rundami (`git diff c1532a9f 01305d64 -- gra/tools/hotseat-etap6d-podetap-c-migracja-test.cjs`
  pusty) — to nie regresja ani manipulacja, tylko błąd w liczbie cytowanej w prozie
  obu raportów (Operator i Evaluator, niezależnie od siebie, podali tę samą złą liczbę).
  Nie wpływa na wynik: bramka w pełni zielona, mutacja czerwieni ją poprawnie (patrz DOWOD
  WLASNEJ WERYFIKACJI). Nie blokuję integracji z tego powodu — czysto kosmetyczna
  nieścisłość w tekście raportu, nie w kodzie ani w bramce.

DOWOD WLASNEJ WERYFIKACJI:
- `npx tsc --noEmit` (wersja 5.9.3, z `gra/`): 0 błędów. Czas ok. 14s.
- Fresh `Read` pełnych ciał wszystkich 5 funkcji (linie podane wyżej) + fresh `grep -n`
  potwierdzający aktualne numery linii (main.ts przesunął się od recon, potwierdzone
  zgodnie z ostrzeżeniem dispatchu).
- Niezależne prześledzenie WSZYSTKICH producentów `pendingDiplomacyInbox` (opisane
  wyżej w WERDYKTY) — własna metoda (grep na `pendingDiplomacyInbox.push`/
  `enqueueDiplomacyPending(FromCmd)?`), nie powtórzenie kroków Evaluatora.
- Brace-aware/grep skan pozostałości literałów `0` w ciałach 5 funkcji — zero
  nieprzeoczonych hardkodów dyplomacji; pozostałe `ownerId===0` w
  `restoreGameFromSave` są out-of-scope (city ownerId, nie relacja).
- Własna MUTACJA niezależna od Operatora/Evaluatora: w `resolvePendingDiplomacy`
  zmieniłem `getDiploRelation(ME(), p.ownerId)` z powrotem na
  `getDiploRelation(0, p.ownerId)`, uruchomiłem `hotseat-etap6d-podetap-c-migracja-test.cjs`
  → `1 FAILURE(S)` (asercja "resolvePendingDiplomacy: brak literałowych argumentów..."
  poprawnie czerwienieje). Przywróciłem plik (`git diff --stat` znów pusty,
  `git status --porcelain` czyste), ponowny przebieg → 35/35 zielone. Mutacja-czerwieni
  POTWIERDZONA własnoręcznie, nie tylko odczytana z raportu.
- `node tools/hotseat-etap6d-podetap-c-migracja-test.cjs`: 35 OK / 0 FAIL (patrz notatka
  o rozbieżności liczby wyżej).
- `node tools/hotseat-etap6d-podetap-c-live-saveload-test.cjs` (Chromium, realny vite
  build do katalogu poza repo): `PASS (7 pass, 0 fail)`. Warianty PO i ZEPSUTY oba 0
  wyjątków JS, cities/units/turn identyczne przed/po roundtrip (zgodnie z jawnie
  udokumentowanym ograniczeniem tej sondy — hardkody dotyczą wyłącznie
  diplomacyRelations/negotiationTable, poza zasięgiem dumpState()).
- `node tools/forced-war-iron-era-enter-turn-save-load-test.cjs`: 20 passed, 0 failed.
- `node tools/fort-nodes-save-load-test.cjs`: 18 passed, 0 failed.
- `node tools/save-load-sort-test.cjs`: OK (4/4).
- `node tools/logic-test.cjs`: LOGIC OK (213/213).
- `node tools/tech-tree-test.cjs`: 19 pass, 0 fail.
- `node tools/research-test.cjs`: PASSED 33 / FAILED 0 / TOTAL 33.
- `node tools/unit-replace-test.cjs`: WSZYSTKIE TESTY ZIELONE (13/13).
- `node tools/combat-test.cjs`: 6/6 pass.
- `git diff --stat cb667e5d(merge-base) HEAD`: `gra/src/main.ts` (46 linii) +
  `gra/tools/hotseat-etap6d-podetap-c-live-saveload-test.cjs` (nowy, 363 linii) +
  `gra/tools/hotseat-etap6d-podetap-c-migracja-test.cjs` (nowy, 243 linii). Zero innych
  plików. Pełny `git diff` main.ts przejrzany linia po linii — 5 hunków, każdy wewnątrz
  jednej z 5 migrowanych funkcji, żaden hunk poza nimi.
- Docstring linia ~35 `live-saveload-test.cjs` porównany słowo w słowo z asercją kodu
  (linia 352) — zgodny, naprawa Obrony faktyczna i poprawna.

ZMIANY/COMMIT: worktree `/home/user/wt-6d-PODETAP-C`, gałąź
`autobot/R-HOTSEAT-ETAP6D-PODETAP-C-Q1`, HEAD `01305d64c8e5137d5fda64a3d0ce4bd1d3574dfb`
(NIE scalony do main; baza `origin/main`=`cb667e5d` przez `git merge-base`, main odjechał
dalej niezależnym deployem). Zawartość commitów: `c1532a9f` (migracja 5 funkcji + 2 nowe
bramki) + `01305d64` (naprawa docstringu, zarzut Evaluatora rundy 1).

TESTY: patrz DOWOD WLASNEJ WERYFIKACJI wyżej — wszystkie bramki zielone, zero regresji,
liczby zgodne z raportami Operatora/Evaluatora poza jedną kosmetyczną rozbieżnością
(34 vs rzeczywiste 35 w migracja-test.cjs, nieblokującą).

BLOKADY: brak. Oba wcześniej nierozstrzygnięte aliasy z dispatchu rozstrzygnięte i
zweryfikowane niezależnie (patrz WERDYKTY). Gotowość do integracji: TAK.

RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora do main (allowlist-only: `gra/src/main.ts` —
wyłącznie 5 hunków migracji, `gra/tools/hotseat-etap6d-podetap-c-migracja-test.cjs`,
`gra/tools/hotseat-etap6d-podetap-c-live-saveload-test.cjs`), rejestracja obu nowych
bramek w `docs/decyzje/R-PROC-AUTOBOT.md` §6 (wymóg: "nowa bramka istnieje dopiero
gdy jest w tej tabeli").
DEPLOY/PUSH: NIE WYKONANO
