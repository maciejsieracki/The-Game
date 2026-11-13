# R-WEB-ADMIN-PANSTWO-PANEL-AND-NAMES-Q1 — raport Operatora (runda 1/5)

STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-WEB-ADMIN-PANSTWO-PANEL-AND-NAMES-Q1 (#327)
GOAL: (1) panel Państwa pokazuje administratora państwa (jeden na Państwo, tryb auto dla całego Państwa) i jego stan; (2) w tekstach gracza nazwy to „administrator państwa” (ulepszenia, zasięg całego Państwa) i „administrator miasta” (budynki w mieście), bez starej nazwy.
BAZA: origin/main bff897c9bd743bfab5c57b3d138eb37c76da7e5e (worktree detach). Kod: commit 4872980e05e4447dd95959b9a86e6461533bc040.

## Źródła dispatchu
- Plik `00-dispatch.md` NIE istnieje na origin/main (ścieżka z zadania zwraca `does not exist`). Użyto DODATKU z gałęzi `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0` (`00-dispatch-DODATEK-claude.md`), który zawiera GOAL, allowlistę, zakazy i kryteria końca.

## ZMIANY / COMMIT
Commit kodu `4872980e05e4447dd95959b9a86e6461533bc040` (7 plików, allowlista):
- `gra/src/ui/empireDetailPanel.ts` — import `stateAdministratorStatusHtml`; w `renderSkarbiecSection` wiersz `balRow('Administrator państwa', …)` po „Utrzymanie jednostek” (tylko gdy `economy.administratorPanstwa` istnieje).
- `gra/src/ui/stateAdministratorRow.ts` (NOWY) — helper HTML trzech stanów: „zatrudniony · pracuje · −N/turę”, „zatrudniony · nie pracuje (brak środków w skarbcu państwa)”, „nie zatrudniony — koszt K, utrzymanie N/turę”; podpowiedź „Jeden administrator na całe Państwo. Tryb auto ulepszeń terenu działa dla wszystkich miast Państwa.”
- `gra/src/ui/hud.ts` — pole `HudState.administratorPanstwa?` (hired, working, upkeep, hireCost, treasury).
- `gra/src/main.ts` — funkcja `stateAdministratorPanelRow(ownerId)` (czyta `stateAdmByOwner`, silnik) + wiring w `buildHudState`: `administratorPanstwa: administratorsEnabled ? stateAdministratorPanelRow(ME()) : undefined` (OFF → brak wiersza). Zmiana tylko wiringu, bez reguł.
- `gra/src/ui/cityPanel.ts`, `gra/src/ui/buildModeHud.ts`, `gra/src/ui/administratorPanel.ts` — napisy gracza „Administrator ulepszeń” → „Administrator państwa” (stan „pracuje / nie pracuje”, chip, przycisk „+/✓”, „Wybierz administratora państwa — koszt…”, adnotacja „Wymaga administratora państwa”, tytuł panelu wyboru i pytanie potwierdzenia „Zatrudnić administratora (państwa)”). Komentarze zostawiono bez zmian.
- `gra/tools/admin-panstwo-panel-names-test.cjs` (NOWY) — test (patrz TESTY).

Lista zmienionych napisów (linie po zmianie):
- cityPanel.ts:10059–10061 — `Administrator państwa: pracuje` / `Administrator państwa: nie pracuje — brak środków…` / chip `Administrator państwa`.
- buildModeHud.ts:154 — `Wymaga administratora państwa` (AUTO_IMPROVE_LOCKED_NOTE).
- buildModeHud.ts:178, 182, 183, 196 — stan, „Wybierz administratora państwa”, przycisk `Administrator państwa ✓` / `Administrator państwa +`, „Administrator państwa nie pracuje…”.
- buildModeHud.ts:684, 744, 753 — tytuły i `title=` blokad („Żadne miasto nie ma działającego administratora państwa…”, „…zatrudnieniu administratora państwa.”, „Brak działającego administratora państwa…”).
- administratorPanel.ts:82 — tytuł: `Administrator miasta` / `Administrator państwa`; :120 — „Zatrudnić administratora (miasta|państwa)”.
- Nazwa „administrator miasta” nie zmieniona.

## TESTY (surowe wyniki, uruchomione w `gra/`)
- `npm ci --ignore-scripts` — OK (tylko ostrzeżenia audytu npm, bez błędu).
- `node node_modules/typescript/bin/tsc --noEmit` → exit 0 (bez wyjścia).
- logic-test.cjs → `LOGIC OK (213/213)`, exit 0.
- tech-tree-test.cjs → `tech-tree-test: 20 pass, 0 fail`, exit 0.
- research-test.cjs → `PASSED: 33 / FAILED: 0 / TOTAL: 33`, `ALL GREEN`, exit 0.
- unit-replace-test.cjs → `[unit-replace-test] WSZYSTKIE TESTY ZIELONE (21/21)`, exit 0.
- combat-test.cjs → `COMBAT TEST: 6/6 pass`, exit 0.
- admin-panstwo-panel-names-test.cjs (nowy) → `20 pass, 0 fail`, exit 0: render 3 stanów (bundle esbuild), wiring hud/empireDetailPanel/main, 0 trafień starej nazwy w `src/ui` (poza komentarzami), 4 mutacje wykryte (stara nazwa w cityPanel i buildModeHud, usunięty wiersz, usunięty wiring main).
- `git diff --check` → OK.
- NIE_ZMIERZONO: render w przeglądarce (Playwright) panelu Państwa z żywą grą — nie wykonywano; test renderu jest na poziomie modułu HTML, a nie pełnego DOM panelu.
- NIE_ZMIERZONO: istniejące testy przeglądarkowe z dawnymi napisami (patrz BLOKADY) — nie uruchamiano.

## BLOKADY (wymagają decyzji orkiestratora: rozszerzenie allowlisty albo osobny temat)
Kryterium „teksty zawierają tylko dwie nazwy (bez starych nazw)” jest SPEŁNIONE tylko dla `gra/src/ui/`. Poza allowlistą zostały stare napisy widoczne dla gracza:
1. `gra/data/city-administrator-params.json:27` — `opis_gracza`: „Administrator ulepszeń pozwala wyłącznie na automatyczne ulepszanie terenu…”. Ten tekst jest pokazywany w panelu wyboru administratora ulepszeń (`administratorPanel.ts` → `improvementAdministratorDescription()`). Wymaga zmiany JSON (poza allowlistą; dispatch zakazuje zmian JSON balansu — to jest tekst, nie balans, więc decyzja właściciela/orkiestratora).
2. `gra/src/game/auto-build-gate.ts:112` — stała `AUTO_IMPROVE_NEEDS_ADMINISTRATOR_HINT` = „…wymagają działającego administratora ulepszeń” (podpowiedź UI; plik poza allowlistą `gra/src/ui/`).
3. `gra/src/game/city-administrator.ts` — funkcja `improvementAdministratorStatusText` zwraca tekst bez starej nazwy; stare nazwy są tam tylko w komentarzach (bez wpływu na grę).
4. `gra/src/main.ts` — 17 linii z napisami gracza ze starą nazwą, poza allowlistą (wiring only): powiadomienia „Administrator ulepszeń odszedł / wrócił do pracy / nie pracuje” (ok. :10222–10225), `'Wymaga administratora ulepszeń'` (:27114–27200, 6×), powiadomienia „Auto-ulepszenia terenu wymagają administratora ulepszeń” (:47857–47863). Napis „Zatrudniono administratora Państwa (ulepszenia terenu)” jest już zgodny z nową nazwą.
5. Istniejące testy przeglądarkowe (poza allowlistą, NIE uruchamiane) asertują stare napisy i po tej zmianie mogą czerwienić: `gra/tools/administrator-panel-real-render-test.cjs` (linie 13, 16, 309, 362: „Wymaga administratora ulepszeń”, „Administrator ulepszeń +”), `gra/tools/improvement-admin-tooltip-real-render-test.cjs` (176–204: podpowiedzi i tytuły `title`), `gra/tools/administrator-icon-everywhere-render-test.cjs` (293: etykieta chipa). Do aktualizacji potrzebna zgoda na te pliki.
6. Panel „Państwo” w `renderSkarbiecSection` (aktywna ścieżka sekcji skarbiec) — wiersz dodany; `cityEconMiniSkarbiec` (ścieżka legacy, `detailFor`) nie dostała wiersza — celowo, aby nie mieszać ścieżek; do potwierdzenia.

Ryzyka do potwierdzenia: panel pokazuje wiersz tylko przy włączonych „Administratorach” (OFF → undefined). Wartość `upkeep` to stała z JSON (`improvementAdministratorUpkeep()`), a nie suma faktycznie płaconego utrzymania; wiersz w bilansie skarbca nie jest dodawany do sumy „Netto” (nie zmieniano bilansu).

Założenia (luki rozstrzygnięte założeniem): (a) „panel Państwa” = sekcja skarbiec imperium (`renderSkarbiecSection`), bo to jej bilans pokazuje utrzymanie administratorów; (b) tekst podpowiedzi o trybie auto dla całego Państwa jest informacyjny i nie zmienia reguły.

## RUNDY
1/5 (Operator, HAIKU). Brak rundy poprawkowej.

## NASTĘPNY KROK
Decyzja orkiestratora: (A) rozszerzyć allowlistę o `gra/data/city-administrator-params.json` (opis_gracza), `gra/src/game/auto-build-gate.ts` (jedna stała), napisy w `gra/src/main.ts` (wyłącznie stringi) i testy przeglądarkowe wymienione w BLOKADACH 5; albo (B) zaakceptować obecny zakres i zapisać pozostałe napisy jako osobny temat R-WEB-ADMIN-NAMES-REST-Q1. Po decyzji: Evaluator → Final Control.

DEPLOY/PUSH: NIE WYKONANO
