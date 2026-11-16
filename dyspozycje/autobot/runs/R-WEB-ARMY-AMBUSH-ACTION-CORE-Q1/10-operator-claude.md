# R-WEB-ARMY-AMBUSH-ACTION-CORE-Q1 — raport Operatora, RUNDA 2/5 (sekcja r2; r1 poniżej)

STATUS: PASS-WITH-NOTES (CZĘŚCIOWY — runda 2 NIE domknięta: wyzwalacz w ruchu wroga (pkt 1 dodatku) i filtr AI/pathfindingu (pkt 2) NIE zrobione; zob. BLOKADY 1–3)
DOMAIN: GAME
TEMAT: R-WEB-ARMY-AMBUSH-ACTION-CORE-Q1
GOAL (zakres r2 wg DODATKU 1): (1) wyzwalacz w ruchu wroga, (2) niewidoczność w logice AI/pathfindingu, (3) znacznik „w zasadzce” + tooltip z powodem blokady, (4) cykl życia (cancel przy fortyfikacji/czuwaniu/podziale/scaleniu/odwrocie/mieście/zmianie właściciela), (5) testy na realnych ścieżkach, (6) dokumentacja/listy, (7) pomiary.
Wynik r2: zrobiono (3) i część (4); (1), (2), reszta (4), (5), (6) NIE zrobione; (7) — tsc i bramki zmierzone, Chromium NIE ZMIERZONO.

BAZA: `9b6845ea7` (r1 obrona). `git merge-base --is-ancestor fadf21af9 HEAD` = TAK (origin/main nie przesunął się od r1).

ZMIANY-COMMIT (allowlista r2; tylko te pliki):
- `gra/src/ui/unitPanelHud.ts` — pole `UnitPanelAction.disabledReason?: string` (powód blokady dla `title`). Plik NIE był na allowliście dispatchu; zmiana addytywna, jedno pole — zgłaszam FC.
- `gra/src/ui/armyStackHud.ts` — (a) przycisk akcji: gdy `disabled` i jest `disabledReason`, `title` = powód (zamiast etykiety); (b) pole `ArmyStackHudState.ambushed`; (c) znacznik „w zasadzce” (`<span class="ash-ambush-mark">`) w nagłówku panelu armii (widoczny tylko dla właściciela — HUD dotyczy wyłącznie własnych stosów).
- `gra/src/ui/unitActionBarHtml.ts` — pasek akcji pojedynczej jednostki: `title` = `disabledReason` gdy zablokowane (zaakceptowane w allowliście r2).
- `gra/src/main.ts` (punktowo):
  - akcja `ambush`: `disabledReason` = `ambushCheck.message` (gdy zablokowana i nieaktywna);
  - `buildArmyStackHudStateInner` zwraca `ambushed: isStackAmbushed(stack)`;
  - handler `ambush` (zastawienie): przed `setAmbush` zdejmuje `sentry` i wychodzi z fortyfikacji w polu (`exitFieldFortify`) — zasadzka i czuwanie/fortyfikacja wzajemnie się wykluczają;
  - handler `fortify` (fortyfikacja w polu): `cancelAmbush(stack)` przed `enterFieldFortify`;
  - handler `sentry` (Czuwaj, wejście): `cancelAmbush(stack)`.
- NOWY `gra/tools/ambush-ui-reason-test.cjs` — test realnej funkcji `buildUnitActionBarHtml` (title = powód dla zablokowanego, etykieta dla odblokowanego/aktywnego) + realny komunikat `canSetAmbush`.

NIE zmieniano: `gra/src/game/ambush.ts` (moduł r1 bez zmian), `ai.ts`, `setup.ts`, `save.ts`, `armyMerge.ts`, `battle*`, WERSJE.md, manifest, `gra/` build, `rust-port/`.

TESTY (surowe wyniki, worktree `9b6845ea7` + zmiany r2, `npm ci --ignore-scripts` wykonany):
- `npx tsc --noEmit` → exit 0 (bez błędów wyjścia).
- `node tools/ambush-core-test.cjs` → `Wynik: 40 OK, 0 FAIL`, exit 0 (bez zmian względem r1).
- `node tools/ambush-ui-reason-test.cjs` → `Wynik: 5 OK, 0 FAIL`, exit 0 (NOWY). Powód blokady z realnego kodu: „Armia nie ma ruchu do zużycia na zasadzkę.”
- Bramki referencyjne: `logic-test` → `LOGIC OK (213/213)`, exit 0; `tech-tree-test` → `tech-tree-test: 20 pass, 0 fail`, exit 0; `research-test` → `PASSED: 33 / FAILED: 0 / TOTAL: 33`, exit 0; `unit-replace-test` → `WSZYSTKIE TESTY ZIELONE (21/21)`, exit 0; `combat-test` → `All sanity checks passed.`, exit 0.
- Regresja armii/zapisu: `load-game-regression-test` → `34 PASS / 0 FAIL`, exit 0; `army-merge-colocated-test` → `4 pass, 0 fail`, exit 0; `army-merge-besieger-only-move-test` → `WYNIK: 8 OK / 0 FAIL`, exit 0; `army-merge-dismiss-bounce-test` → `16 pass, 0 fail`, exit 0; `army-merge-bounce-test` → `4 pass, 0 fail`, exit 0.
- NIE ZMIERZONO: determinizm (`determinizm`/hash), `siege-*`, `ai-*`, pełne `battle-*-test.cjs`, Chromium (zrzuty 1280×720, znacznik, tooltip, przerwanie ruchu, okno bitwy).

BLOKADY (jawnie):
1. (dodatek pkt 1) WYZWALACZ W RUCHU WROGA — NIE ZROBIONE. `resolveAmbushTrigger` (ambush.ts) nadal nie jest wołany w żadnym kroku ruchu (grep: 0 wywołań poza ambush.ts i testem). Powód: otwarcie bitwy przy ruchu AI wymaga mechanizmu wznowienia fazy AI (`aiTurnAwaitingBattle` / `aiCmdResume`, wzór: gałąź `attack` w main.ts ~45700–45745) — a ruch gracza ma osobną ścieżkę startu bitwy (`openPlayerMapUnitAttackCore`, main.ts ~35974, wymaga osobnego rozpisania rosterów). Zrobienie tego „na pół" grozi błędną bitwą w grze, więc nie wpięto.
   Punkty wpięcia do następnej rundy: AI — `truncatePath` w wywołaniu `executeAiCityMove` (main.ts ~45530) + sprawdzenie ostatniego heksu po `moveResult.moved`; gracz — `startAnimatedMove` (main.ts ~33919) i kolejka marszu (main.ts ~34090, ~34659, ~29537).
2. (dodatek pkt 2) FILTR AI/PATHFINDINGU — NIE ZROBIONE, ŚWIADOMIE. `buildMoveOccupancy` (gra/src/units/setup.ts:774) i `occupiedExcluding` (ai.ts:947) nadal traktują heks zasadzki jako zajęty. Ukrycie zasadzki w occupancy BEZ wyzwalacza spowodowałoby, że AI/gracz wchodzi na heks z ukrytą jednostką (dwie jednostki na jednym heksie). Liczenie „sił wroga w zasięgu” w ai.ts: nie zmieniano. `isHexOccupiedForViewer` nadal bez wywołań poza testem.
3. (dodatek pkt 4) CYKL ŻYCIA — CZĘŚCIOWO. Zrobione: zastawienie/fortyfikacja/czuwanie wzajemnie się wykluczają; `cancelAmbush` przy fortyfikacji w polu i czuwaniu (r1: przy rozkazie ruchu). NIE zrobione: split i merge (polityka „scalenie/split zdejmuje zasadzkę z poruszanej części, reszta zostaje”; panele: `openSplitPanelForSelected` main.ts ~15906, `openMergePanelForSelected` ~16090, `armyMerge.ts`), odwrót po bitwie (`assignBounceHexesForUnits`, armyMerge.ts ~758), relokacja, wejście do miasta, zmiana właściciela, zasadzka a `sentry` budzone przez wroga w zasięgu (nie zmieniano — zasadzka nie jest budzona przez zbliżenie wroga; do decyzji FC).
4. (dodatek pkt 5) TESTY NA REALNYCH ŚCIEŻKACH — NIE ZROBIONE: test przez `serializeGame`/`deserializeGame` (pole `ambush` przetrwa zapis) — brak; test scalenia częściowej zasadzki — brak (pkt 4 niezrobiony); test wyzwalacza w realnym kroku ruchu — brak (pkt 1); test filtra AI — brak (pkt 2). Mutacja M7 z r1 pozostaje aktualna w `ambush-core-test.cjs`.
5. (dodatek pkt 6) DOKUMENTACJA — NIE ZROBIONE: hasło wiki/Civpedia „Zasadzka” (+ regeneracja wikiBundle) nie dodane. Lista do deployu (nowe testy): `gra/tools/ambush-core-test.cjs`, `gra/tools/ambush-ui-reason-test.cjs`.
6. (dodatek pkt 7) POMIARY — CZĘŚCIOWO: tsc i bramki zmierzone (wyżej). Chromium NIE ZMIERZONO: brak builda vite poza repo w tej rundzie; znacznik i tooltip sprawdzone wyłącznie testem funkcji renderu (`buildUnitActionBarHtml`) — panel `armyStackHud` (DOM) nie ma testu jednostkowego.
7. Dług Rust (REPIN `rust-port`, NIE zmieniano): r1 (`ambush.ts`, `RuntimeUnit.ambush`, akcja i handler, `cancelAmbush` w `startAnimatedMove`, filtr renderu, normalizacja w `save.ts`) + r2: `UnitPanelAction.disabledReason`, znacznik `ambushed` w HUD, wykluczanie sentry/fortify w handlerach `ambush`/`fortify`/`sentry`.

WAŻNE DLA INTEGRACJI (zachowanie w grze, gdyby ta runda weszła do ROBOCZEJ):
- Zasadzka gracza jest ukryta przed wrogiem w RENDERZE (r1) i jest NIEPRZEKRACZALNĄ przeszkodą dla AI (AI traktuje heks jako zajęty) — NIE ma bitwy ani wyzwalacza. Nie jest to spec (spec: wróg wchodzi i wpada w pułapkę). Zalecenie: NIE wdrażać do ROBOCZEJ jako mechaniki przed domknięciem pkt 1; albo wdrożyć z jawną notatką w rejestrze.

RUNDY: 2/5 zużyte (runda 2 = częściowa). Dispatch kontynuacji: ten sam ID, kolejna runda powinna najpierw domknąć pkt 1 (wyzwalacz gracz + AI, z bitwą), potem pkt 2 (filtr AI dopiero po działającym wyzwalaczu), potem pkt 3–5. Rozstawienie w bitwie (R3) nadal NIE zaczęte.

NASTĘPNY KROK: (a) Evaluator/FC: decyzja, czy runda 3 ma najpierw domknąć wyzwalacz (zalecane: R2a = wyzwalacz + bitwa, R2b = filtr AI + cykl życia, potem R3 = rozstawienie) — dispatch wymaga decyzji orkiestratora o podziale rund (zarzut dispatchu z r1 nadal otwarty); (b) FC: allowlista `gra/src/ui/unitPanelHud.ts` (pole typu) i `gra/src/main.ts` (punktowo).

UWAGI-DLA-ORKIESTRATORA:
- Commit obejmuje kod r2 + nowy test + ten raport (`git add` ścieżkami; bez `-A`). Brak push i brak integracji (zgodnie z dispatchem).
- Zasada z dispatchu „raport bez commita z pracą = BLOCK”: kod został zacommitowany razem z raportem.
- `npm ci --ignore-scripts` uruchomiony w worktree (katalog `gra/node_modules` ignorowany przez git); do sprzątania po rundzie.
- Testy `ambush-core-test.cjs` i `ambush-ui-reason-test.cjs` zapisują tymczasowe pliki `.ambush-*-entry.ts`/`.cjs` w `gra/tools/` i je kasują; po uruchomieniu `git status` czysty.

DEPLOY/PUSH: NIE WYKONANO

---

# (r1) R-WEB-ARMY-AMBUSH-ACTION-CORE-Q1 — raport r1 (poprzednia runda, zachowany bez zmian)

# R-WEB-ARMY-AMBUSH-ACTION-CORE-Q1 — raport Operatora, runda 1/5

STATUS: PASS-WITH-NOTES (etap 1 częściowy: rdzeń stanu, akcja w panelu, reguły blokad i testy zrobione; widoczność w renderze/pathfinding AI i wyzwalacz w ruchu NIE podłączone — patrz BLOKADY)
DOMAIN: GAME
TEMAT: R-WEB-ARMY-AMBUSH-ACTION-CORE-Q1
GOAL: nowa akcja armii „Zasadzka” (stan w jednostce, blokady z powodem, zużycie całej puli ruchu, odwołanie, zapis/wczytanie ze zgodnością wsteczną), reguły widoczności i wyzwalacza jako czyste funkcje testowane na realnym kodzie; rozstawienie w bitwie, AI i Chromium — runda 2.
ZMIANY/COMMIT: baza `fadf21af9` (origin/main). Commit z kodem i raportem: patrz sekcja SHA poniżej. Allowlista:
- NOWY `gra/src/game/ambush.ts` — stan, `canSetAmbush`, `setAmbush`, `cancelAmbush`, widoczność (`isUnitVisibleToViewer`, `unitsVisibleToViewer`, `isHexOccupiedForViewer`), wyzwalacz (`resolveAmbushTrigger`), normalizacja pola przy wczytaniu (`normalizeAmbushField`), stała `AMBUSH_FORMATION_MAX_WIDTH = 3` (użyta dopiero w rundzie 2).
- `gra/src/units/setup.ts` — pole opcjonalne `RuntimeUnit.ambush?: boolean` (brak pola = brak zasadzki).
- `gra/src/main.ts` — punktowo: import; wpis akcji „ambush” obok „Czuwaj” (blokada z `canSetAmbush`, `inBattle` = `isSaveBlockedByBattle()`); handler `actionId === 'ambush'` (zastawienie/odwołanie na całym stosie, komunikat powodu z `AMBUSH_BLOCK_MESSAGES`); w `startAnimatedMove` `cancelAmbush(stack)` (rozkaz ruchu zdejmuje zasadzkę).
- `gra/src/ui/armyStackHud.ts` — ikona akcji `ambush` w `ASH_ACTION_ICONS`.
- `gra/src/ui/unitActionBarHtml.ts` — ikona `ambush` w `ACTION_ICONS` i wpis w `COMPACT_ACTION_ORDER`. UWAGA: ten plik NIE był wprost na allowliście (allowlista wymienia `hexContextTooltip.ts`/`armyStackHud.ts`); zmiana jest czysto dodająca (ikona + pozycja w liście), zgłaszam do oceny FC.
- NOWY `gra/tools/ambush-core-test.cjs` — test regresji rdzenia.
- `dyspozycje/autobot/runs/R-WEB-ARMY-AMBUSH-ACTION-CORE-Q1/10-operator-claude.md` — ten raport.
Nie zmieniano: `gra/src/game/ai.ts`, `gra/src/battle/*`, `save.ts` (pole jest serializowane jako część obiektu jednostki; stare zapisy bez pola = brak zasadzki — potwierdzone testem), `gra/` build, WERSJE.md, manifest, `rust-port/`, `gra-robocza/`.

TESTY (surowe wyniki, uruchomione lokalnie w worktree po `npm ci --ignore-scripts`):
- `npx tsc --noEmit` → exit 0 (bez błędów).
- `node tools/ambush-core-test.cjs` → `Wynik: 38 OK, 0 FAIL`, exit 0. Pokrywa: stan i zgodność wsteczna (JSON bez pola), setAmbush zeruje cały ruch stosu, kopia niezależna, cancelAmbush usuwa pole; blokady `canSetAmbush` z komunikatami po polsku (in-city, besieging, no-movement, in-battle, already-ambushed, empty) i kolejność powodów; widoczność (właściciel widzi, AI/inni nie widzą); pathfinding wroga (heks zasadzki pusty dla AI, zajęty dla właściciela); wyzwalacz tylko w wojnie, tylko wejście NA heks (sąsiad nie odpala), po wyzwoleniu stan zdjęty, brak wyzwolenia = brak mutacji; normalizacja śmieci w polu.
- Bramki referencyjne: `logic-test` → `LOGIC OK (213/213)`, exit 0; `tech-tree-test` → `20 pass, 0 fail`, exit 0; `research-test` → `PASSED: 33 / FAILED: 0 / TOTAL: 33`, exit 0; `unit-replace-test` → `WSZYSTKIE TESTY ZIELONE (21/21)`, exit 0; `combat-test` → `All sanity checks passed.`, exit 0.
- Regresja nie-przeglądarkowa: `army-merge-colocated-test` exit 0; `army-merge-besieger-only-move-test` → `WYNIK: 8 OK / 0 FAIL`, exit 0; `army-merge-dismiss-bounce-test` exit 0; `army-merge-bounce-test` exit 0 (bez linii podsumowania — kod wyjścia 0); `load-game-regression-test` → `34 PASS / 0 FAIL`, exit 0.
- NIE ZMIERZONO: Chromium / żywa gra (zrzuty panelu armii, widoczność dla drugiego gracza, wejście wroga → bitwa). Nie uruchamiano `siege-*`, `ai-*` i pełnych `battle-*-test.cjs` (nie wymagano w tej rundzie jako zmieniających kod wyjścia; do uruchomienia w rundzie 2 wraz z integracją AI/bitwy).

BLOKADY (jawnie — to, co NIE jest w tej rundzie i NIE działa w grze):
1. WIDOCZNOŚĆ W GRZE: `isUnitVisibleToViewer` / `unitsVisibleToViewer` NIE są podpięte do renderu (`unitRenderer.sync` w main.ts ~15423) ani do mgły. Oznacza to, że po zastawieniu zasadzka gracza NADAL jest rysowana wrogowi. Przed wdrożeniem na ROBOCZĄ należy domknąć w rundzie 2 (render: filtr dla każdego widza ≠ właściciel).
2. PATHFINDING AI: `isHexOccupiedForViewer` NIE jest użyty w `ai.ts`/pathfindingu. AI nadal traktuje heks zasadzki jako zajęty. Wymaganie „AI MUSI traktować heks jako pusty” NIE spełnione w tej rundzie.
3. WYZWALACZ W RUCHU: `resolveAmbushTrigger` NIE jest wpięty w krok ruchu wroga (ścieżka gracza/AI/kolejka marszu). Wróg wchodzący na heks zasadzki nie przerywa ruchu i nie otwiera bitwy.
4. ROZSTAWIENIE W BITWIE (strefa po obu stronach, szyk ≤ 3 w długiej linii, AUTO-spójność): NIE zaimplementowane — runda 2 zgodnie z podziałem z dispatchu.
5. Scalanie/rozdzielanie stosu (`armyMerge.ts`): NIE sprawdzone pod kątem zachowania stanu zasadzki. Rozdzielenie stosu zasadzki może dać część bez pola (zdejmie stan w części), a scalenie zwykłej jednostki do stosu zasadzki może wciągnąć ją w zasadzkę — wymaga punktowej decyzji w rundzie 2 (proponowane: nie pozwalać łączyć/dzielić stosu w zasadzce).
6. Tura AI: `canSetAmbush`/`setAmbush` NIE są wołane przez AI (zgodnie z dispatchem — decyzja AI to osobny temat). API dla AI istnieje w `ambush.ts`.
7. Wiki/Civpedia (hasło „Zasadzka”): NIE dodane.
8. Dług Rust (REPIN w `rust-port`): reguła zasadzki, pole `ambush` i akcja nie są przeniesione do Rust — do zapisania jako dług po wdrożeniu weba.

DECYZJE/ZAŁOŻENIA W RUNDZIE 1 (luki rozstrzygnięte założeniem):
- Nazwa pola: `ambush` (angielski, jak `sentry`); stan boolowski, bez zapisu współrzędnych — zasadzka jest na heksie jednostki.
- „Zastawiający” = właściciel stosu; wrogość liczona przez wołającego (`isAtWar` jako parametr), żeby reguły były czyste i testowalne.
- `inBattle` w akcji = `isSaveBlockedByBattle()` (scena bitwy lub podsumowanie otwarte) — węższe niż „bitwa”, ale bezpieczne.
- Akcja „Odwołaj zasadzkę” jest zawsze aktywna dla stosu w zasadzce (nawet w mieście/oblężeniu — w tych przypadkach zasadzki nie da się zastawić, więc taki stan nie powstaje normalnie).
- Odwołanie zasadzki nie zużywa ruchu (zgodnie z decyzją ABC „odwołaj”).

NASTĘPNY KROK: runda 2 (ten sam ID, ten sam dispatch, zachowana baza): (a) widoczność w `unitRenderer.sync` i mgle dla każdego widza ≠ właściciel; (b) pathfinding wroga i `ai.ts` tylko punktowo (filtr widoczności, bez zmiany logiki AI); (c) wyzwalacz w kroku ruchu wroga (przerwanie na heksie, otwarcie bitwy, zdjęcie stanu, komunikaty „Wpadłeś w zasadzkę!” / „Zasadzka się powiodła”); (d) rozstawienie w `gra/src/battle/*` (strefa po obu stronach, długa linia ≤ 3, AUTO spójne); (e) polityka split/merge dla stosu w zasadzce; (f) live w Chromium (build vite POZA repo) z zrzutami; (g) testy `ambush-*` dopisane do stałej listy deployu.

DEPLOY/PUSH: NIE WYKONANO (operator nie pushuje ani nie integruje; sprzątanie `gra/node_modules` i plików tymczasowych po raporcie).

UWAGI-DLA-ORKIESTRATORA:
- Kolejność integracji: ta runda NIE nadaje się do deployu na ROBOCZĄ — w grze gracz zobaczy akcję „Zasadzka”, ale wróg nadal widzi i może wejść na ukrytą armię bez bitwy. Zalecam nie wdrażać przed rundą 2 albo wdrożyć z ostrzeżeniem w rejestrze.
- Zakres dispatchu sugeruje 5 rund; po rundzie 2 ocenić, czy zostają 3 (AI-use jest osobnym tematem).
