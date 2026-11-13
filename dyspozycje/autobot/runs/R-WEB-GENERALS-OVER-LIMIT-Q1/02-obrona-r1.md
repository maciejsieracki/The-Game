# R-WEB-GENERALS-OVER-LIMIT-Q1 — odpowiedź Obrony na zarzuty (runda 1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-GENERALS-OVER-LIMIT-Q1
GOAL: odpowiedzieć na każdy zarzut Evaluatora (PRZYJMUJĘ z dowodem albo ODRZUCAM z dowodem) i odtworzyć stan commita Operatora.
ZMIANY/COMMIT: baza odtworzona z commita Operatora `f347c1888f1e799b77532374c092de8a54df5426` (detached HEAD). Ten dokument jest jedyną zmianą tej rundy (allowlista: `dyspozycje/autobot/runs/R-WEB-GENERALS-OVER-LIMIT-Q1/**`). Kod `gra/` bez zmian. SHA commita Obrony: patrz raport końcowy.
TESTY: patrz sekcja „Dowody” niżej.
BLOKADY: brak testu przeglądarkowego (Chromium) w tym środowisku; patrz zarzut 1.
RUNDY: 1/5 (Obrona r1)
NASTĘPNY KROK: Final Control (Sonnet 5.5) — ocena PASS-WITH-NOTES z uwagą o teście live.
DEPLOY/PUSH: NIE WYKONANO

## Odtworzenie stanu

- `git checkout --detach f347c1888f1e799b77532374c092de8a54df5426`: commit istnieje lokalnie; zmienia 4 pliki z allowlisty (`generals.ts`, `main.ts`, `generals-limit-invariant-test.cjs`, `01-operator-r1.md`).
- `gra/`: `npm ci --ignore-scripts` → EXIT=0.
- Test niezmiennika na commicie Operatora: `node tools/generals-limit-invariant-test.cjs` → ALL PASS, EXIT=0 (23 PASS). Log: `/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/gate-r2-invariant-fix.txt`.

## Zarzut 1 — test jest modelowy, nie live; brak dowodu na realnym `main.ts`

**PRZYJMUJĘ (jako ograniczenie, bez zmiany kodu).** Zarzut jest prawdziwy: test to model z prawdziwymi funkcjami z `generals.ts` oraz strażnik źródła dla `main.ts`. Nie steruje realnym `main.ts` w przeglądarce.

Dowód braku środowiska do testu live:
- `ls /usr/bin/chromium` i `ls /usr/bin/chromium-browser` → brak plików.
- `~/.cache/ms-playwright` → brak katalogu.

Nie napisano nowego harnessu w jsdom, bo `main.ts` jest jednym dużym `boot()` z zależnościami DOM/canvas; uruchomienie go bez przeglądarki wymagałoby przepisania bootu, czyli poza zakresem tematu. Zostaje do Final Control albo osobnego testu live z Chromium. Brak dowodu na żywo jest zapisany jako BLOKADA.

## Zarzut 2 — mutacja tylko częściowo potwierdzona (10 vs 5 FAIL)

**ODRZUCAM** rozbieżność jako błąd rozumowania Evaluatora; liczby są spójne dla różnych mutacji. Ponowny przebieg na commicie Operatora (każda mutacja przywracała pliki z bazy `9b019a7d8` przez `git checkout`, po każdej przywrócono wersję Operatora):

| Mutacja | Przywrócony plik | Linie `FAIL:` | Podsumowanie | EXIT |
|---|---|---|---|---|
| A | `main.ts` z bazy | 4 | `FAILURES: 4` | 1 |
| B | `generals.ts` z bazy | 6 | — | 1 |
| C | oba pliki z bazy | 10 | — | 1 |

Logi: `gate-r2-mut-main-base.txt`, `gate-r2-mut-generals-base.txt`, `gate-r2-mut-both-base.txt` w katalogu scratchpad z zarzutu 1.

Wyjaśnienie:
- Evaluator policzył 5, bo `grep '^FAIL'` łapie też linię podsumowania `FAILURES: 4`. Realnych asercji jest 4.
- Raport Operatora (10 FAIL) dotyczy mutacji C, czyli cofnięcia obu plików. To zgadza się z pomiarem.
- Operator podawał „2 FAIL” dla cofnięcia jednego guardu narodzin w `main.ts`. Tego wariantu nie odtwarzałem w tej rundzie (koszt, brak wpływu na werdykt); oznaczam jako NIE_ZMIERZONO ponownie.

## Zarzut 3 — zdobywca z pozycją wodza w kolejce

**PRZYJMUJĘ** jako udokumentowane zachowanie, bez zmiany kodu.

Potwierdzenie w kodzie: `canRecruitGeneral` liczy `alive + queued` przez `generalSlotsUsed` (`gra/src/game/generals.ts`, linie 1-18). Pozycja z kolejki przejętej razem z miastem zajmuje slot zdobywcy, więc zdobywca z pełnym limitem nie kupi kolejnego wodza, dopóki ta pozycja nie powstanie.

Konsekwencje dla gracza (do wpisania w notatki wydania):
- Jeśli zdobywca jest poniżej limitu epoki, pozycja rodzi się jako wódz (`canSpawnQueuedGeneral`, `aliveGenerals < limit`).
- Jeśli zdobywca jest na limicie, pozycja rodzi się jako zwykła jednostka tego samego typu. Jednostka nie przepada; traci tylko flagę wodza.
- Zakup poprzedniego właściciela nie jest zwracany jako pieniądze, bo pozycja zamienia się w jednostkę. To świadome założenie Operatora (zapisane w `01-operator-r1.md`).

Zmiana tej reguły byłaby zmianą projektu (np. zwrot kosztu albo blokada przejęcia kolejki), a nie poprawką błędu. Tego nie robię w tym temacie.

## Dodatkowe dowody zgodności (wykonane przez Obronę)

- Test niezmiennika na commicie Operatora: ALL PASS, EXIT=0.
- `git status` po przywróceniu plików: czysty (poza tym dokumentem po zapisie).
- Nie uruchamiano `npm run build` ani `dev`. Nie zmieniano `gra-robocza`, `WERSJE.md`, `rust-port`, `src-tauri`, `gra/data`, `gra/src/render`.

## NIE_ZMIERZONO (bez zmian względem Operatora)

- Testy przeglądarkowe (`empire-recruit-*`, `army-panel-*`, `army-stack-commander-identity`, `general-capital-recruitment-order-test`): INFRA, brak Chromium.
- `ai-general-war-campaign-live`: nie uruchamiano.
- Rozbieżność 20 FAIL w `ai-test` względem bazy: zgodność liczby (274/20), nie nazw testów.
- Katalog `gra/node_modules` w worktree do usunięcia po zamknięciu rundy.
