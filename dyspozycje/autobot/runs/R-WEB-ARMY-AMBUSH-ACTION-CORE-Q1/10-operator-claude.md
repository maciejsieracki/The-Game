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
