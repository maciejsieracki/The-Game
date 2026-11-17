# 30 — Obrona Operatora (runda 2), R-WEB-UI-BATTLE-PLAYER-ALWAYS-BLUE-ALL-PATHS-Q1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (UI/render bitwy)
TEMAT: R-WEB-UI-BATTLE-PLAYER-ALWAYS-BLUE-ALL-PATHS-Q1
GOAL: kolor strony w bitwie = gracz (niebieski, BATTLE_PLAYER) / przeciwnik (czerwony, BATTLE_ENEMY) niezależnie od roli atakujący/obrońca.
BAZA: 38a119268622d9dffca17231a91f77def6744e0d (operator r1). Kod obrony: 055c3de3e (SHA końcowy tej rundy = commit raportu, patrz pole sha).

## Odpowiedzi na zarzuty Evaluatora (eval-claude-playerblue-q1)

| Nr | Zarzut | Werdykt | Dowód |
|---|---|---|---|
| 1 | Brak żywego Chromium i zrzutów (kryterium b) | PRZYJMUJĘ (częściowo) | Nowy driver `gra/tools/battle-player-always-blue-live-test.cjs`: zywa mapa `?playtest=mapa`, bitwa `bitwa_duza_pole`, role atk i def, viewporty 1024x640 i 1280x720. Wynik: 6 PASS / 0 FAIL (`WYNIK: 6 PASS / 0 FAIL`). 8 zrzutów w `/tmp/pb1-shots/` (pb-{atk,def}-{1024x640,1280x720}-{t0,t4s}.png), 3 obejrzane (def 1024x640 t4s, atk 1024x640 t4s, def 1280x720 t4s); kolor potwierdzony na minimapie (def: Rzym czerwony, Grecja niebieska; atk: odwrotnie) i zgodnie z kierunkiem na jednostkach 3D. Pozostałe 5 zrzutów (t0 i atk 1280x720) NIE OBEJRZANE w tej rundzie. |
| 2 | Test statyczny, brak behawioralnego i mutacji 'atk' | PRZYJMUJĘ (częściowo) | Live test sprawdza runtime: `scene._deployPlayerSideOpt` i `_playerControlSide()` = rola z launchera, dla atk i def. Mutacja behawioralna `--mutant` (launcher ignoruje rolę, zawsze 'atk'): `FAIL [def-1024x640] ... deployPlayerSide = def` oraz `FAIL ... _playerControlSide() = def`, wynik `4 PASS / 2 FAIL`. endDetails1E i siegeHud1E NIE są uruchamiane behawioralnie (brak harnessu DOM dla tych modułów) — pozostają w teście statycznym. |
| 3 | Domyślne 'atk' w playtest (main.ts ~40114) i oblezenie/main.ts nie zbadane | PRZYJMUJĘ | Jawne `deployPlayerSide: 'atk'` z komentarzem w bOpts playtest (`gra/src/main.ts`, blok `const bOpts: BattleOpts`) i w `new BattleScene` podglądu (`gra/src/oblezenie/main.ts` ~l. 46). Test D4/D5 w `battle-player-always-blue-test.cjs` pilnuje obu. Domyślna wartość konstruktora (`battleScene.ts:3567`) pozostaje 'atk' (nie zmieniana — wszystkie wywołania `new BattleScene` w src/ przekazują teraz rolę jawnie, poza `createBattleScene` w main.ts ~39521, które przekazuje `opts` z wywołującego). |
| 4 | Kolor werdyktu w postBattleSummary wg roli | PRZYJMUJĘ | `gra/src/ui/postBattleSummary.ts` `winnerColor`: zwycięzca-gracz = BATTLE_PLAYER_TEXT, zwycięzca-przeciwnik = BATTLE_ENEMY_TEXT, remis bez zmian (#a08030). Dawna zielona `#7ad0a0` dla atakującego usunięta. Test F1/F2 w teście statycznym. Brak live-zrzutu werdyktu (NIE ZMIERZONO). |
| 5 | Panel „Siły oblężnicze” (siegeHud1E) neutralny/złoty | ODRZUCAM (opis w inwentarzu, bez zmiany kodu) | Tytuł panelu w fazie poza szturmem to `BATTLE_GOLD` (`siegeHud1E.ts:183`) — złoty nie jest znacznikiem strony, lecz neutralnym nagłówkiem; ten sam tytuł w fazie szturmu to `defColor` (l. 183). Wiersze garnizonu/murów (l. 150, 163, 170) używają `defColor` = wg gracza (`defenderIsPlayer`). |
| 6 | preBattle.ts isPlayerSide (fallback po canRetreat) i wiki/legendy/tooltipy nie zinwentaryzowane | PRZYJMUJĘ jako uwaga, BEZ poprawki | `preBattle.ts:606-609`: gdy `side.ownerId === undefined`, rola gracza wyprowadzana z `canRetreat` (heurystyka). Nie zmierzono, czy produkcyjna ścieżka zawsze podaje ownerId (NIE ZMIERZONO). Wiki/legendy/tooltipy: NIE ZMIERZONO. Do decyzji orkiestratora (UWAGI). |
| 7 | Dług Rust REPIN palety stron nie wymieniony | PRZYJMUJĘ | Dług: REPIN palety stron bitwy (BATTLE_PLAYER/BATTLE_ENEMY, werdykt, panel oblężniczy) po stronie Rust — do wpisu w rejestrze przez orkiestratora. |
| 8 | Brak SHA i dokładnych linii w ZMIANY-COMMIT | PRZYJMUJĘ | Patrz sekcja ZMIANY-COMMIT poniżej. |

## ZMIANY-COMMIT

Commit kodu: `055c3de3e` (gałąź robocza `r-web-playerblue-q1-obrona`, baza 38a119268).

Pliki (allowlista dispatchu w nawiasie):
- `gra/src/main.ts` (allowlista: punktowo, tylko przekazanie roli) — +1 linia, ~l. 40079: `deployPlayerSide: 'atk'` w bOpts preset playtest.
- `gra/src/ui/postBattleSummary.ts` — **POZA ALLOWLISTĄ** (allowlista: battle/**, main.ts punktowo, render/*, tools, raporty) — `winnerColor` ~l. 369-375 (po zmianie: wg `data.playerSide`).
- `gra/src/oblezenie/main.ts` — **POZA ALLOWLISTĄ** — +1 linia ~l. 46: `deployPlayerSide: 'atk'` w `new BattleScene` podglądu oblężenia.
- `gra/tools/battle-player-always-blue-test.cjs` (allowlista: tools) — dopisane kontrole D4, D5, F0-F2.
- `gra/tools/battle-player-always-blue-live-test.cjs` (nowy; allowlista: tools) — driver Chromium (plugin vite w pamięci, zadne źródło w repo nie zmienione w runtime).

Poprzednie zmiany r1 (battle/endDetails1E.ts, battle/siegeHud1E.ts, battle/battleScene.ts, battleMinimap) bez zmian.

**Do decyzji orkiestratora:** dwa pliki (`postBattleSummary.ts`, `oblezenie/main.ts`) są poza allowlistą. Jeśli orkiestrator nie rozszerza allowlisty, należy cofnąć te dwie zmiany (`winnerColor` i linia w oblezenie) — wtedy zarzut 4 wraca jako NIE ZMIERZONO/ODRZUCONY, a zarzut 3 tylko dla playtest.

## TESTY (surowe wyniki, ten worktree, po zmianach r2)

- `node tsc --noEmit -p tsconfig.json` → EXIT=0 (bez wyjścia)
- `node tools/battle-player-always-blue-test.cjs` → `battle-player-always-blue-test: OK (A minimap 4/4, B end-details, C siege HUD, D deployPlayerSide, E sideColor, F verdict)` EXIT=0
- `node tools/battle-player-always-blue-live-test.cjs --vp 1024x640 --dist /tmp/pb1-dist --shots /tmp/pb1-shots` → `WYNIK: 6 PASS / 0 FAIL` (build vite: OK; mapa ready; atk i def)
- `... --reuse --vp 1280x720 ...` → `WYNIK: 6 PASS / 0 FAIL`
- `... --mutant --vp 1024x640 --dist /tmp/pb1-mut --shots /tmp/pb1-shots-mut` → `WYNIK: 4 PASS / 2 FAIL` (dowód, że test łapie regresję roli def)
- Bramki referencyjne: logic-test `LOGIC OK (213/213)`; tech-tree-test `20 pass, 0 fail`; research-test `ALL GREEN`; unit-replace-test `WSZYSTKIE TESTY ZIELONE (21/21)`; combat-test `All sanity checks passed.` (EXIT=0 każdy).
- Testy tematu i pokrewne: battle-side-colors-3d-test OK; battle-tempo-minimap-brand-test OK; battle-hp-display-test `PASS — 7 / 7`; battle-damage-colors-test `WYNIK: 28 PASS / 0 FAIL`; map-field-battle-test `24 ok, 0 fail`; battle-minimap-side-colors-test OK (wszystkie EXIT=0).
- `git diff --check` przed commitem: czysto.

## INWENTARZ — stan po r2 (tylko zmienione lub zweryfikowane w tej rundzie)

| Element | Ścieżka | Kolor po r2 | Weryfikacja |
|---|---|---|---|
| Jednostki 3D, minimapa | atk / def | gracz niebieski | live (zrzuty, runtime role) |
| Werdykt po bitwie | postBattleSummary winnerColor | gracz niebieski / przeciwnik czerwony | statyczna (F1/F2), NIE ZMIERZONO live |
| Szczegóły bitwy | endDetails1E buildSideColumn | wg isPlayer (r1) | statyczna, NIE ZMIERZONO live |
| Oblężenie HUD mur/garnizon | siegeHud1E defColor (r1) | wg defenderIsPlayer | statyczna, NIE ZMIERZONO live |
| Preset playtest / podgląd oblężenia | main.ts / oblezenie/main.ts | jawne atk | statyczna D4/D5; live tylko playtest |
| Okno przed bitwą | preBattle isPlayerSide | fallback po canRetreat | NIE ZMIERZONO (zarzut 6) |

## BLOKADY

- Allowlista: dwa pliki poza allowlistą (patrz ZMIANY-COMMIT). Wymaga decyzji orkiestratora.
- Brak żywego zrzutu werdyktu po bitwie, endDetails1E i siegeHud1E (NIE ZMIERZONO).
- Przeglądarka: /usr/bin/chromium działa z `--no-sandbox`; pliki w /tmp/pb1-* (dist i zrzuty) zostawione — zakaz rm w dispatchu, sprzątanie po stronie orkiestratora.

## RUNDY

RUNDY: 2/5 (obrona r2; po odpowiedzi na zarzuty Evaluator r2 powinien ocenić ponownie).

## UWAGI-DLA-ORKIESTRATORA (poza zakresem, bez wykonania)

- Zarzut 6: `preBattle.ts:606-609` — fallback `canRetreat` przy braku ownerId; sprawdzić, czy produkcja zawsze podaje ownerId.
- Top bar (ikony obu cywilizacji w `battleScene.ts` ~3076-3097, `#battle-top-civ-emblem`) — na zrzutach obie obwódki są zielone/neutralne, nie niebieska/czerwona; czy to element „strony”, do decyzji (NIE ZMIERZONO w kodzie).
- Dług REPIN Rust: palety stron (zarzut 7).
- Domyślne `deployPlayerSide = 'atk'` w konstruktorze `battleScene.ts:3567` nadal istnieje; rozważyć wymóg jawnej roli (test kompilacji) w osobnym temacie.

## NASTĘPNY KROK

Evaluator: ponowna ocena r2 (zarzut 5 i 6 jako odrzucone/uwaga, zarzut 1 częściowo); Final Control: decyzja o allowliście dla dwóch plików i o ewentualnym wymaganiu obejrzenia pozostałych zrzutów.

DEPLOY/PUSH: NIE WYKONANO
