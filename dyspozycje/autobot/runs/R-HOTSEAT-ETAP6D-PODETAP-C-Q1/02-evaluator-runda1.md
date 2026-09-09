STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-HOTSEAT-ETAP6D-PODETAP-C-Q1
GOAL: Migracja klastra "silnik: inicjalizacja i save/load" (5 funkcji) na `isMe()`/`isHuman()`.

NIEZALEŻNA WERYFIKACJA (worktree `/home/user/wt-6d-PODETAP-C`, commit `c1532a9f`):

1. `npx tsc --noEmit` (z `gra/`) — 0 błędów. Zgodne z raportem Operatora.

2. Pełny `Read` ciał wszystkich 5 funkcji (brace-matched ekstrakcja Pythonem, nie zgadywanie
   z nazwy):
   - `applyClusterStartPlan` (36143→ nie, właściwie 8567-… — potwierdzone liniami z diffu) —
     2×`setDiploRelation(0,`/`getWiarygodnosc(0)` → `HUMAN_OWNER_PRIMARY`. Zgodne z dispatchem
     (isHuman, "stan pary").
   - `spawnPendingSameTypeRivals` — analogicznie → `HUMAN_OWNER_PRIMARY`. Zgodne.
   - `finalizeAllianceObligationRefusals` (18868-18886) — `deal.strony[0/1] === 0` →
     `isMe(deal.strony[0/1])`, `syncRelationFromDeals(0, allyId)` → `syncRelationFromDeals(ME(), allyId)`.
     Zgodne z decyzją orkiestratora (precedens `joinAllyToWar`/`applyAllianceObligationsOnWar`).
   - `resolvePendingDiplomacy` (16929-16987) — 5 miejsc → `ME()`. **Zweryfikowałem NIEZALEŻNIE
     warunek orkiestratora** (pętla wyłącznie na ofertach DO/OD aktywnego fotela): prześledziłem
     wszystkie miejsca wypełniające `pendingDiplomacyInbox` (`enqueueDiplomacyPending`,
     wołane wyłącznie z `enqueueDiplomacyPendingFromCmd`) i potwierdziłem, że jedyne wywołania
     `enqueueDiplomacyPendingFromCmd` w main.ts (linie ok. 32454-32468) siedzą pod gałęzią
     `else if (targetId === 0)` — a więc kolejka `pendingDiplomacyInbox` z definicji zawiera
     WYŁĄCZNIE oferty AI skierowane do aktywnego fotela (targetId===0/ME()), nigdy AI-vs-AI.
     Warunek orkiestratora z dispatchu POTWIERDZONY niezależnie — decyzja isMe/ME() poprawna.
     Ślad w kodzie Operatora (komentarz 16925-16928) i w raporcie 01 zgadza się z tym, co
     faktycznie znalazłem — brak podstaw by twierdzić, że Operator "zgadł z nazwy".
   - `restoreGameFromSave` (funkcja 36143-36966, oba hardkody 36843/36910 w jej wnętrzu) — oba
     → `isMe()`/`ME()`. Zgodne z dispatchem.
   - Dodatkowo: brace-matched skan wszystkich 5 ciał na pozostałości `===0`/`!==0`/
     `setDiploRelation(0,`/`getDiploRelation(0,`/`getWiarygodnosc(0)` — ZERO trafień poza
     jednym fałszywym alarmem (komentarz tekstowy "ME() === 0 zawsze", nie kod).

3. Żywa bramka save/load no-op (`hotseat-etap6d-podetap-c-live-saveload-test.cjs`, Chromium,
   realny `doStartGame`→3 tury→realny `saveLoadRoundTrip` (buildSaveGameSnapshot/
   restoreGameFromSave)→3 tury): URUCHOMIONA niezależnie, **7/7 PASS**. PRZED/PO
   (cities/units/turn) identyczne, 0 wyjątków JS w wariancie PO. Potwierdzam też ręcznie
   zweryfikowaną przez Operatora granicę tej sondy: wariant ZEPSUTY (`isMe()`→`false`) nie
   różni się na `dumpState()`, bo oba hardkody `restoreGameFromSave` dotyczą wyłącznie
   `diplomacyRelations`/`negotiationTable`, poza zasięgiem tego haka — zgodne z ujawnionym
   ograniczeniem w raporcie 01. Czerwienienie na mutacji dla całego klastra isMe/ME()
   potwierdziłem NIEZALEŻNIE inną metodą (patrz TESTY niżej: realny revert w main.ts +
   ponowne uruchomienie `hotseat-etap6d-podetap-c-migracja-test.cjs`).

4. Istniejące bramki save/load — URUCHOMIONE niezależnie:
   `forced-war-iron-era-enter-turn-save-load-test.cjs`: 20/20 PASS.
   `fort-nodes-save-load-test.cjs`: 18/18 PASS.
   `save-load-sort-test.cjs`: 4/4 PASS.
   Zgodne z raportem Operatora, bez regresji.

5. `git diff --stat` — main.ts porównany względem BEZPOŚREDNIEGO rodzica (`HEAD~1`, nie
   przeciwko `main`, bo lokalny `main`=`origin/main`=`dd9d481a` zdążył odjechać naprzód o
   niepowiązany deploy "FALA 363" dotykający `gra-robocza/*` — starsze rozwidlenie gałęzi,
   nie zmiana tego tematu). Względem `HEAD~1`: WYŁĄCZNIE `gra/src/main.ts` (46 linii) +
   2 nowe pliki `gra/tools/*-test.cjs`. Hunki diffu main.ts potwierdzone jako ograniczone
   dokładnie do ciał 5 migrowanych funkcji (brace-matched skan wyżej — zero literałów `0`
   pozostałych, zero nadmiarowych zmian). Zgodne z allowlistą dispatchu.

6. 5 bramek referencyjnych — URUCHOMIONE niezależnie: `logic-test.cjs` 213/213,
   `tech-tree-test.cjs` 19/19, `research-test.cjs` 33/33, `unit-replace-test.cjs` 13/13,
   `combat-test.cjs` 6/6. Dokładna zgodność z liczbami z raportu Operatora.

Dodatkowo, mutacja niezależna (poza tym co zrobił Operator): tymczasowo revertowałem w
`main.ts` (a) `resolvePendingDiplomacy` (`ME()`→`0`) i osobno (b) `restoreGameFromSave`
(`isMe(entry.proposerOwnerId)`→`entry.proposerOwnerId === 0`, `!isMe(oid)`→`oid === 0`),
za każdym razem uruchomiłem `hotseat-etap6d-podetap-c-migracja-test.cjs` — w obu przypadkach
dokładnie 2 FAILURE(S)/34, po przywróceniu pliku (`git diff --stat` znów pusty) ponownie
34/34. Potwierdza dokładnie to, co zgłosił Operator (rozbieżność tylko w tym, który hardkod
osobiście zrewertowałem — Operator zrewertował `restoreGameFromSave`, ja dodatkowo też
`resolvePendingDiplomacy` — oba reddenują identycznie 2/34).

ZARZUTY:

1. [Niski/kosmetyczny, niezablokowany] `gra/tools/hotseat-etap6d-podetap-c-live-saveload-test.cjs`,
   linia 35: nagłówkowy docstring pliku twierdzi, że kryterium PASS obejmuje "(5) wariant
   ZEPSUTY (isMe()=false) MUSI dać co najmniej jeden wyjątek JS albo różny wynik roundtrip --
   inaczej ta sonda byłaby tautologiczna". Faktyczny kod (linie 323-350, asercja na linii ok.
   349 `check('ZEPSUTY (isMe()=false): brak wyjątku JS/roundtrip...', runMut.jsExceptions.length
   === 0 && runMut.roundtripError === null, ...)`) sprawdza DOKŁADNIE ODWROTNOŚĆ: bramka
   przechodzi WŁAŚNIE WTEDY, gdy wariant ZEPSUTY NIE różni się (brak wyjątku), a rozbieżność
   `cities/units/turn` jest jedynie logowana jako `INFO`, nigdy jako `FAIL`. Sam kod ma
   poprawny, świadomy komentarz "UWAGA METODOLOGICZNA" (linie 323-336) tłumaczący czemu tak
   jest (hardkody dotyczą wyłącznie diplomacji, poza zasięgiem `dumpState()`) — ale nagłówek
   na górze pliku (linia 35) nie został zaktualizowany do tej samej treści i wprost obiecuje
   gwarancję, której kod nie egzekwuje. Dowód nietautologiczności semantyki isMe/ME() jest
   faktycznie dostarczony w INNYM pliku (`hotseat-etap6d-podetap-c-migracja-test.cjs`), co jest
   metodologicznie akceptowalne (potwierdzone przeze mnie niezależnie wyżej) i zgodne z
   deklarowanym wzorcem "wzorem hotseat-etap6f-start-migracja-test.cjs" w tym samym pliku (linia
   13) — ale ten fakt nie usprawiedliwia fałszywej obietnicy w docstringu tejże bramki. Nie
   wpływa na poprawność migracji ani wyników testów (wszystkie faktyczne asercje w tym pliku są
   spójne z tym, co rzeczywiście sprawdzają) — czysto dokumentacyjna niespójność w komentarzu,
   która mogłaby wprowadzić w błąd przyszłego audytora czytającego tylko nagłówek. Rekomendacja:
   drobna poprawka linii ~30-36 (usunięcie "MUSI dać..." i zastąpienie odniesieniem do
   UWAGA METODOLOGICZNA/migracja-test.cjs, analogicznie do już istniejącego wyjaśnienia w kodzie)
   — nie wymaga osobnej rundy Operatora jeśli Final Control uzna to za wystarczająco drobne do
   poprawienia przy integracji; w przeciwnym razie do poprawy w Obronie.

TESTY: Wszystkie niezależnie odtworzone wyniki zgodne z raportem Operatora — tsc --noEmit
czysto; 5/5 bramek referencyjnych identyczne liczby; 3/3 istniejące bramki save/load zielone
identyczne liczby; nowa bramka migracji 34/34 (dwukrotnie zweryfikowana mutacja: revert
resolvePendingDiplomacy → 2 FAIL, revert restoreGameFromSave → 2 FAIL, po przywróceniu 34/34);
nowa bramka żywa Chromium 7/7 PASS.

BLOKADY: brak. Warunek orkiestratora dla `resolvePendingDiplomacy` (pętla wyłącznie po
ofertach do/od aktywnego fotela) potwierdzony NIEZALEŻNYM śledzeniem wszystkich producentów
`pendingDiplomacyInbox` — decyzja isMe/ME() prawidłowa, nie wymaga DECISION_REQUIRED.

RUNDY: 1/5
NASTĘPNY KROK: Obrona (zarzut 1, kosmetyczny/niski priorytet) → Final Control → integracja
orkiestratora. Zarzut nie blokuje merytorycznie migracji — wszystkie 5 funkcji, wszystkie
bramki i allowlista potwierdzone poprawne niezależnie.
DEPLOY/PUSH: NIE WYKONANO
