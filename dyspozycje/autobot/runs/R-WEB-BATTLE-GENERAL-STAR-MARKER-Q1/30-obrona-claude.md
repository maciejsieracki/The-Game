# R-WEB-BATTLE-GENERAL-STAR-MARKER-Q1 — raport obrony (Operator, runda 1, odpowiedź na zarzuty Evaluatora)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (render sceny bitwy taktycznej)
TEMAT: R-WEB-BATTLE-GENERAL-STAR-MARKER-Q1
GOAL: w scenie bitwy generał (wódz armii, `BattleUnit.isArmyCommander === true`) po obu stronach ma jasną złotą gwiazdkę nad jednostką; gwiazdka podąża za jednostką, nie zasłania paska HP/morale/flagi, znika razem z jednostką (śmierć, usunięcie z sceny), nie pojawia się przy zwykłych jednostkach ani w armii bez generała. Zero zmian reguł bitwy, walki, balansu i danych.
BAZA: origin/main = b160459c9dea67e082ec59dc7770d10cc59c08d4 (ancestor OK). Kod operatora: commit w gałęzi roboczej tego worktree (SHA w sekcji ZMIANY-COMMIT).

## Odpowiedź na zarzuty Evaluatora

| Zarzut | Decyzja | Dowód |
|---|---|---|
| 1. Kandydat == baza, brak zmiany w kodzie, brak znacznika w `battleScene.ts` | PRZYJMUJĘ | Dodano moduł `gra/src/battle/battleCommanderStar.ts` i cztery wywołania `_attachCommanderStar(group, bu)` w `battleScene.ts` (miejsca tworzenia jednostki: 4 sites, `scene.add(group)`). `git diff --stat` po zmianie: `battleScene.ts +19`, dwa nowe pliki. |
| 2. Brak testu stanu/mutacyjnego (kryt. a) | PRZYJMUJĘ | `gra/tools/battle-commander-star-test.cjs`: 14 PASS / 0 FAIL na realnym module (bundle esbuild). Mutacja KOPII źródła (warunek celu zastąpiony `return true;`) daje wynik czerwony (zwykłe jednostki dostają gwiazdkę). |
| 3. Brak zrzutów Chromium 1280x720 i 1400x900 (kryt. b) | PRZYJMUJĘ | Żywa bitwa w Chromium (vite dev server z `gra/`, playwright, `/usr/bin/chromium`), obie strony, oba rozmiary. Zrzuty skopiowane do `evidence/` tego runu (patrz niżej). |
| 4. Brak raportu operatora i commita z pracą | PRZYJMUJĘ | Ten raport + commit kodu i testu (`git add` ścieżek, bez `-A`). |

## ZMIANY-COMMIT

- `gra/src/battle/battleCommanderStar.ts` (nowy): `isBattleCommanderStarTarget`, `battleCommanderStarIds`, `getBattleCommanderStarTexture` (DataTexture 64×64 rysowany kodem, bez canvas), `attachBattleCommanderStar(group, unit, localY)` (Sprite, dziecko `ru.group`, `depthTest:false`, `raycast` no-op, `renderOrder 10`, rozmiar 0,26).
- `gra/src/battle/battleScene.ts` (+19): import; stała `BATTLE_COMMANDER_STAR_Y = HPBAR_Y + AMMOBAR_Y + BAR_OUTLINE_PAD + 0.22 + 0.16` (nad flagą-masztem z `makeUnitBars`); metoda `_attachCommanderStar` (materiał trafia do `ownedMats` do zwolnienia); 4 wywołania po `this.scene.add(group)`.
- `gra/tools/battle-commander-star-test.cjs` (nowy): test stanu + mutacja kopii + sprawdzenie braku zależności od `barsVisible`.
- `dyspozycje/autobot/runs/R-WEB-BATTLE-GENERAL-STAR-MARKER-Q1/30-obrona-claude.md` (ten plik) + `evidence/*.png`, `evidence/live-zoom-atk-result.json`.

Źródło danych: `isArmyCommander` już jest w `BattleUnit` i ustawiane w `main.ts:35567` (`isArmyCommander: u.isGeneral === true`). Dlatego **nie zmieniono `main.ts`** (zgodnie z allowlistą).

## Wybory wizualne (wypisane wg dispatchu)

- Kolor: gwiazdka **złota** (#FFD84A) z **ciemnobrązowym obrysem** (#3A2300) — ta sama dla obu stron. Barwa strony zostaje na pasku i fladze, a nie na gwiazdce, bo obrys w kolorze strony (np. czerwony/niebieski) był słabo czytelny na zielonej trawie i brązowym terenie. Wybór do akceptacji przez orkiestratora.
- Położenie: środek gwiazdki ~1,19 j. nad punktem stania, czyli nad flagą (szczyt flagi ~1,03), bez zasłaniania HP/morale/ammo.
- Widoczność: niezależna od przełącznika „Paski HP / Morale” (gwiazdka nie chowa się razem z paskami).
- Brak nowych tekstów UI, więc kryterium (d) nie dotyczy.

## TESTY (surowe wyniki)

- `npx tsc --noEmit` (w `gra/`): exit 0 (po poprawce typu w `pointInPolygon`; ostatni przebieg po wszystkich zmianach: rc=0).
- Bramki referencyjne (exit codes, `node tools/<x>.cjs`): logic-test 0, tech-tree-test 0, research-test 0, unit-replace-test 0, combat-test 0.
- Nowy test: `node tools/battle-commander-star-test.cjs` → `Wynik: 14 PASS, 0 FAIL` (dwa przebiegi: przed i po poprawce typu).
- Żywy bieg Chromium (`/tmp` poza repo nie użyto; skrypt w scratchpad, entry tymczasowy usunięty): 2 sprite'y `battleCommanderStar` w scenie (po jednym na stronę), `visible: true`, brak błędów `pageerror`. Zrzuty zbliżone (kamera nad gwiazdką): atak 1280×720 i 1400×900, obrona 1280×720 i 1400×900 — gwiazdka wyraźnie widoczna, nad flagą, bez zasłaniania pasków. Pliki w `evidence/`.
- Testy bitwy (regresja), `gra/tools/battle-*-test.cjs`:
  - nie-przeglądarkowe, uruchomione: 33 × rc=0; `battle-standoff-two-warriors-test.cjs` rc=1 — **ta sama awaria na baseline (origin/main battleScene.ts): TypeError w `_computeManualArbitrationClaims` → PRZED-ISTNIEJĄCA, nie regresja** (sprawdzone podmianą pliku na HEAD i przywróceniem).
  - `battle-collision-arbitration-test.cjs` część `BCA_PART=pure`: **14 OK, 0 FAIL** (test pełnego ruchu/arbitrażu). Części `live` (`det`, `mutRev`, pełny przebieg z Chromium) NIE ZMIERZONO w limicie czasu (>190 s / >580 s bez wyniku końcowego; w pierwszym przebiegu 17 znaczników `ok` bez błędu).
  - `battle-pace-equal-line-live-test.cjs`: NIE ZMIERZONO (przekroczenie 60 s, test przeglądarkowy).
  - `battle-dead-unit-disappearance-browser-test.cjs` (rc=1), `battle-defeat-survivor-retreat-browser-test.cjs` (rc=1), `battle-dead-unit-e2e-browser-test.cjs` (rc=124 @100 s), `battle-attack-move-pointer-test.cjs` (rc=124 @100 s): NIE ZMIERZONO na baseline — nie wiadomo, czy są przed-istniejące; do sprawdzenia przez FC.

## BLOKADY

- Brak. Zarzut Evaluatora 3 (zrzuty) zamknięty dowodem żywym; części live testów collision/pace nie zostały ukończone w czasie (patrz TESTY, NIE ZMIERZONO).

## RUNDY

1/5 (runda obrony na zarzuty Evaluatora z raportu 20-evaluator-claude.md).

## NASTĘPNY KROK

1. Evaluator: przegląd diffu (`git diff b160459c9..<SHA>`, pliki z ZMIANY-COMMIT) i powtórzenie testu + bramek.
2. Final Control: część `live` testu arbitrażu kolizji (`BCA_PART=det`, `mutRev`) w osobnym przebiegu, plus ocena wizualna gwiazdki przez właściciela (kolor/obrys — decyzja, czy zostawić złoto dla obu stron).
3. Dług Rust: REPIN znacznika generała w scenie bitwy (port Rust) — osobny temat, poza tym tematem.

UWAGI-DLA-ORKIESTRATORA:
- Nie dotyczy tego tematu, ale w zgłoszeniu właściciela padło pytanie o łuczników (zwykli vs egipscy): to temat #448/R-WEB-DATA-ARCHERS-HEALTH-20-DIST-EGYPT-6-Q1, nie ten; nie ruszałem danych jednostek.
- Testy bitwy z przeglądarką (`battle-*-live*`, `*-browser-*`) zapisują artefakty do śledzonych plików w `dyspozycje/autobot/runs/*/evidence*` (np. `R-BITWA-DEAD-UNIT-DISAPPEARS-Q2/evidence`, `R-BITWA-BTF-MIXED-ARMY-DOCTRINES-Q1/01-matrix.json`). Przy uruchamianiu w worktree trzeba je przywracać `git checkout --`; w tym worktree przywrócono, a nieśledzone artefakty usunięto.
- `gra/node_modules` zainstalowano lokalnie (`npm ci --ignore-scripts`) na potrzeby testów; usuwam po zakończeniu zgodnie z dispatchem.

DEPLOY/PUSH: NIE WYKONANO
