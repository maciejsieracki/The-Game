STATUS: FAIL
DOMAIN: GAME + INFRA
TEMAT: R-WOJNA-WYMUSZONA-PROG-TURY-GRACZ-Q1
GOAL: (1) próg tury gracza w Kroku C main.ts (turn>=25, jak AI); (2) usunięcie
bezterminowego hooka console.error w index.html, window.onerror/unhandledrejection
nietknięte.

ZMIANY-COMMIT: BRAK COMMITU — worktree nadal na `235a88cc`, zmiany niezacommitowane:
`gra/src/main.ts` (+9/-4, Krok C), `gra/index.html` (-5, override console.error usunięty),
nowe `gra/tools/wojna-wymuszona-prog-tury-gracz-test.cjs`,
`gra/tools/boot-error-catcher-console-error-test.cjs`.

TESTY (uruchomione samodzielnie):
- `git diff --stat -- gra/src/game/` — pusty (progi AI nietknięte); jeden hunk w main.ts
  dodaje `turn >= WOJNA_KAMIEN_WYMUSZONA_START_TURY` (stała=25, forced-war-stone.ts:19).
- `node tools/boot-error-catcher-console-error-test.cjs` → 8/8 PASS (zwykły console.error
  już nie tworzy banera, wymuszony window.onerror nadal tworzy).
- Grep `__boot_err__`/`showBootErr`/`console.error\s*=` w całym repo — jedyny inny
  konsument: `gra/src/wonderpreview/index.html`, nigdy nie miał override'u console.error.
- Cała rodzina `forced-war-*-test.cjs` uruchomiona samodzielnie — **4 pliki RED**:
  `forced-war-iron-main-guard-test.cjs` (36/1), `forced-war-iron-mutant-probe.cjs` (36/1),
  `forced-war-iron-player-target-live-test.cjs` (9/2), `forced-war-player-target-live-test.cjs`
  (9/2). Wszystkie 4 potwierdzone przez `git stash`/`stash pop`: PASS na bazowym kodzie,
  RED z diffem. `wojna-wymuszona-parowanie-test.cjs` (47/47) i pozostałe 11 plików rodziny
  — zielone.
- `node tools/wojna-wymuszona-prog-tury-gracz-test.cjs` → 9/9 PASS w izolacji.

BLOKADY: Zarzuty #1-4 blokują PASS. Naprawa wymaga zapisu poza literalną allowlistą
dispatchu (4 pliki niewymienione z nazwy) — wymaga decyzji orkiestratora/Final Control
zamiast milczącego domysłu Operatora.

RUNDY: 1/5
NASTĘPNY KROK: Obrona, potem decyzja o rozszerzeniu allowlisty, potem runda 2.

ZARZUTY:

1. `gra/tools/forced-war-iron-main-guard-test.cjs` (regex dopasowujący STARY,
   dwuwarunkowy blok Kroku C) — RED (36/1). Test literalnie oczekuje kodu bez `turn >=`.
   Na bazowym kodzie: 37/0. Bezpośredni, zamierzony skutek GOAL pkt 1, ale plik nie jest
   na allowliście.
2. `gra/tools/forced-war-iron-mutant-probe.cjs` (ten sam regex, mutant
   `M42-main-gracz-zawsze-w-puli`, linia 407) — RED (36/1), identyczna przyczyna jak #1.
3. `gra/tools/forced-war-iron-player-target-live-test.cjs` — RED (9/2). Bootstrap
   `?playtest=mapa` @ turn=1, oczekuje że gracz zostaje celem wymuszonej wojny Żelaza W
   TURZE 1 — po naprawie próg turn>=25 blokuje to z definicji. Bazowy kod: 11/0.
4. `gra/tools/forced-war-player-target-live-test.cjs` (wariant Brązu) — RED (9/2),
   identyczny wzorzec i przyczyna jak #3. Bazowy kod: 11/0.

DEPLOY/PUSH: NIE WYKONANO
