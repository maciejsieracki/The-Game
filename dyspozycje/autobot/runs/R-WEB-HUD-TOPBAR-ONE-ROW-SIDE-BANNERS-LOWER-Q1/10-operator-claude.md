# R-WEB-HUD-TOPBAR-ONE-ROW-SIDE-BANNERS-LOWER-Q1 — raport Operatora (runda 2/5)

STATUS: DECISION_REQUIRED
DOMAIN: GAME (HUD, wizualne)
TEMAT: R-WEB-HUD-TOPBAR-ONE-ROW-SIDE-BANNERS-LOWER-Q1
GOAL: 11 żetonów surowców w jednym rzędzie na górze, boczne bloki obniżone; zero przeskoku pionowego monet przy zmianie liczb (1280 px i huge); brak dwóch pięter przy 1920/1600/1366.
BAZA/KANDYDAT: 57473d9ed (origin/main po r1). Bez merge origin/main (nie był wymagany).
ZAŁOŻENIA:
- Dispatch źródłowy odczytany z `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0` (`dyspozycje/autobot/runs/.../00-dispatch.md`); w `origin/main` ścieżki nie ma.
- DODATEK orkiestratora (`00-dispatch-DODATEK-claude.md`) odczytany z tej samej gałęzi.
- „Przed” na zrzutach = baza przed tematem `4905bac05:gra/src/ui/hud.ts` (ta sama, której używa test `bigger-numbers`), a nie kandydat 57473d9ed.

## Zmiana w tej rundzie (ZMIANY-COMMIT)

Jedyny zmieniony plik kodu: `gra/src/ui/hud.ts`, dwie reguły CSS po `.hud-left-fallback .hud-chip-grid`:
- `.civ-hud .civ-hud-banner-left:not(.hud-left-fallback)>.civ-hud-banner-shell>.hud-chip-grid{height:100%;grid-template-rows:100%;align-items:center;}`
- `.civ-hud .civ-hud-banner-left:not(.hud-left-fallback) .civ-hud-chip-cell{height:54px;}`

Przyczyna (zmierzona): pozycja Y komórki zależała od wysokości treści, a ta zmienia się ze skalą `--hud-k` i liczbami. Środek monety sam był już stabilny (44 px), ale pudełko komórki przesuwało się o 3,6 px. Stałe pudełko 54 px (52 px treści + 2 px paddingu klikalnego) wysrodkowane w wierszu 44 px usuwa przesunięcie. Wiersz nie rośnie, bo ma stałą wysokość. Tryb 2×3 (`.hud-left-fallback`) nie jest zmieniany.

Nie zmieniono: testów, asercji, JSON balansu, WERSJE.md, rust-port, gra-robocza.

## Odpowiedź na regresje z FC r1 (surowe wyniki, ta sama maszyna, Chromium)

| Test | r1 (FC) | r2 (ten kandydat) |
|---|---|---|
| hud-topbar-grid-gross-net-test | 1142 ok / 1 fail | **OK: 1150 ok, 0 fail** |
| hud-topbar-no-labels-test | 93 ok / 1 fail | **PASS: 94 ok, 0 fail** |
| hud-topbar-bigger-numbers-real-render-test | 60 ok / 4 fail | **FAIL: 63 ok, 1 fail** (patrz niżej) |

Pozostałe bramki HUD (surowe wyniki):
- hud-topbar-one-row-test (K1–K5, 1920/1600/1366): PASS (84 ok, 0 fail)
- hud-topbar-layout-a-test: PASS (144 ok, 0 fail)
- hud-panels-below-banner-test: PASS (130 ok, 0 fail)
- hud-gross-net-rest-test: OK (820 ok, 0 fail)
- left-banner-overflow-narrow-test (1024): PASS (brak błędów strony)
- hud-number-abbrev-test: OK

Bramki referencyjne i typy:
- `npx tsc --noEmit` (gra/): rc=0
- logic-test: LOGIC OK (213/213)
- tech-tree-test: 20 pass, 0 fail
- research-test: PASSED 33 / FAILED 0 / TOTAL 33
- unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21)
- combat-test: All sanity checks passed.

## Pomiar pozycji monet (probe Chromium, środek `.civ-hud-chip-med`, osie Y w px)

| szer. | small | big | huge | maxw |
|---|---|---|---|---|
| 1280 | 43,99 | 44,00 | 43,99 | 43,99 (2×3, tryb fallback) |
| 1366 | 44,00 | 43,99 | 44,00 | 44,00 |
| 1920 | 44,00 | 44,00 | 44,00 | 44,00 |

Zmiana Y między stanami przy 1280 px i huge: **0 px** (zakres 0,01 px). Stan przed zmianą (ten sam probe, bez poprawki): 1920 small 44,77 / huge 44,00, a pudełko komórki 27,8 → 31,4 px przy 1280.

## Otwarte: B1 w bigger-numbers przy 1366 px — konflikt wymagań (DECYZJA ABC)

Pozostałe 1 fail to `1366: B1 font głównej liczby >= 1,25x PRZED (min 0.778)`. Przy 1366 px jeden rząd sześciu żetonów wymusza skalę `--hud-k` 0,42–0,64 dla wartości mid/huge. Font liczby wynosi wtedy 0,98× (mid) i 0,78× (huge) bazy. Warunek B1 (≥1,25×) i warunek K1 (jeden rząd przy 1366) wykluczają się przy obecnej liczbie i szerokości żetonów. Nie zmieniam asercji B1 bez decyzji właściciela.

Opcje do ABC (rekomendacja zaznaczona):
- (a) **Rekomendacja:** zaakceptować mniejszą czcionkę liczb przy 1366 i zaktualizować B1 z uzasadnieniem (jeden rząd jest wymogiem właściciela #308).
- (b) Przy wąskim oknie wrócić do 2×3 — łamie K1 dla 1366 px.
- (c) Skrócić format liczb (k/M bez dziesiątych) — wymaga osobnej zgody na zmianę formatowania.

Baza 8c447758 przechodziła B1 62/0, bo nie miała jeszcze jednego rzędu.

## Dowody wizualne (2×, Chromium)

Katalog: `dyspozycje/autobot/runs/R-WEB-HUD-TOPBAR-ONE-ROW-SIDE-BANNERS-LOWER-Q1/evidence/`
- `topbar-przed-{1920,1366}-{small,huge}.png` — baza 4905bac05.
- `topbar-po-{1920,1366}-{small,huge}.png` — ten kandydat.

Obejrzany `topbar-po-1920-huge.png`: sześć monet lewego banera w jednym rzędzie, prawy baner w tym samym rzędzie na górze. Zrzuty pochodzą z harnessu testowego, nie z gry na żywo.

## NIE_ZMIERZONO
- Wygląd w grze na żywo i interakcje (kliknięcia przycisków po obniżeniu klastra prawego).
- Zrzuty 1600 px i 1280 px (tylko 1920 i 1366 wykonane).
- Mutacja trwała w repo dla K6 (przywrócenie 2×3 → test czerwienieje) — nie dodano, w tej rundzie wykonano tylko zmiany wymagane przez regresje.
- Panel wydarzeń przesunięty w dół o ~30 px (konsekwencja wyższego klastra prawego, z r1) — nie ponownie zmierzone.

## Stan repo
- Gałąź: detached HEAD (worktree wf_c74d2e66-9c9-1), od 57473d9ed + commit tej rundy.
- `gra/node_modules` zainstalowane (`npm ci --ignore-scripts`), nie commitowane.
- Tymczasowe `gra/src/ui/hud.__base.ts` usunięte przed commitem.

NASTĘPNY KROK: decyzja właściciela (B1 w 1366, opcje a/b/c). Po decyzji ewentualna runda 3 Operatora (aktualizacja asercji B1 albo zmiana formatu liczb). Brak PASS do tego czasu.
DEPLOY/PUSH: NIE WYKONANO
