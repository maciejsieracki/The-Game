STATUS: PASS
DOMAIN: INFRA
TEMAT: R-HOTSEAT-ETAP-2-MGLA-WOJNY-Q1
GOAL: Refaktor mgły wojny/widoczności na per-człowiek (Etap 2 planu hot-seat), behawioralny no-op przy jednym fotelu.

ZMIANY-COMMIT: `gra/src/main.ts` (niescommitowane, allowlist-only, jedyny zmieniony plik poza runem). Poprawka rundy: `cityFogVisible` (main.ts:9727-9731) — `city.ownerId === 0` → `city.ownerId === ME()`. Poza tym plikiem brak zmian; `dyspozycje/autobot/runs/P-MGLA-ODKRYCIE-SCIEZKA-INWARIANT-Q1/dowody/*.png` nadpisane przez uruchomienie `mgla-sciezka-live-test.cjs` podczas weryfikacji, przywrócone `git checkout --` (potwierdzone `git diff --quiet`).

TESTY:
- `npx tsc --noEmit`: 0 błędów (bez zmian względem rundy 1).
- 8 bramek mgły/widoczności, uruchomione po poprawce: `mgla-sciezka-inwariant-test` 42/0, `mgla-sciezka-rzeka-test` 14/0, `mgla-teleport-koniec-tury-test` 16/0, `river-fog-visibility-test` 31/0, `ai-fog-test` 8/8, `mgla-odkrycie-wzdluz-sciezki-test` 16/1, `mgla-odkrycie-wzdluz-sciezki-live-render-test` 5/0, `mgla-sciezka-live-test` 10/1 — oba FAIL identyczne co do treści z rundą 1/oceną Evaluatora (currentVisible() liczy wyłącznie z bieżącej pozycji jednostek — pre-istniejące, nietknięte; DECISION_REQUIRED „Wojna wymuszona" w logu konsoli — niezwiązane, temat wojny wymuszonej). Zero nowych FAIL-i po poprawce.
- 5 bramek referencyjnych po poprawce: `logic-test` 213/213, `tech-tree-test` 19/19, `research-test` 33/33, `unit-replace-test` 13/13, `combat-test` 6/6.
- `HUMAN_OWNER_PRIMARY = 0` (gra/src/game/human-owners.ts:21) i `ME()` zwraca `humanSeats.activeHumanOwnerId` zawsze `HUMAN_OWNER_PRIMARY` dziś → poprawka jest dowiedzionym behawioralnym no-op (0 === ME() identycznie jak 0 === 0 wcześniej), nie tylko deklarowanym.

BLOKADY: brak DECISION_REQUIRED.

RUNDY: 1/5 — obrona po zarzucie Evaluatora, poprawka wykonana w tej samej rundzie.

OBRONA:
1 -> PRZYJMUJE. Dowód trafności zarzutu: `cityFogVisible` (main.ts:9727, w tym samym bloku 9708-9758 co migrowane `ownPlayerVisibleHexes()`/`currentVisible()`/`currentVisibleForOwner()`) miał hardkodowany `city.ownerId === 0` — dokładnie ten sam predykat semantyczny ("czy to moje miasto") co `c.ownerId === ME()` w `ownPlayerVisibleHexes()` 25 linii wyżej, migrowany w rundzie 1. Zasila `_cityRenderOpts()`/`isVisible` (main.ts:2400), czyli tę samą warstwę renderu widoczności miast, której dwa inne wywołania (`cityRenderer.applyFogVisibility(..., ME())`) w tej rundzie już poprawiono — niespójność w obrębie jednego mechanizmu, zgodna z GOAL pkt 5 (`ownPlayerVisibleHexes()/currentVisible()/refreshFog()` i to, co je otacza w tym samym bloku). Poprawiłem: `city.ownerId === ME()`. Dowód no-op: `HUMAN_OWNER_PRIMARY = 0` (human-owners.ts:21), `ME()` dziś zawsze zwraca tę wartość — `tsc --noEmit` czysto, wszystkie 8 bramek mgły/widoczności i 5 bramek referencyjnych identyczne (te same 2 pre-istniejące, niezwiązane FAIL-e) PRZED/PO poprawce.

DEPLOY/PUSH: NIE WYKONANO
