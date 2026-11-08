# R-WEB-NEWGAME-MENU-REORDER-Q1 — Operator, runda 1, odpowiedź na zarzuty (obrona)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB, `gra/`)
TEMAT: R-WEB-NEWGAME-MENU-REORDER-Q1
GOAL: układ kroku 4 „Ustawienia Rozgrywki" wg WERSJI OSTATECZNEJ z dispatchu (12 kart, 2 kolumny; okno „Zaawansowane" wg KOREKTY 6; etykieta „Wojna epoki").
Baza: 5ab3d58e2. Ocenany commit Operatora: 0a8876f13 (kod 877f6d5fa + wip runu).

ZMIANY/COMMIT: SHA poprawki obrony — patrz wiadomość końcowa orkiestratorowi (commit obejmuje: `gra/tools/newgame-menu-reorder-layout-test.cjs`, `evidence/*.png`, `00-dispatch.md`, ten raport). Kod `gra/src/**` i `ui-params.json` NIE zmienione w tej obronie.

## Odpowiedzi na zarzuty

1. Brak raportu Operatora i dispatchu w katalogu runu — PRZYJMUJĘ. Dodano `00-dispatch.md` (treść z `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0`) oraz ten raport. Tabela „gdzie była → gdzie jest" poniżej.
2. Zrzuty z bundla ze stubami ikon — PRZYJMUJĘ. Test `newgame-menu-reorder-layout-test.cjs` używał atrapy `brandAssets` (ikony SVG = puste). Zmieniono harness: ikony SVG (`icons/brandAssets`, `import.meta.glob` emulowany z plików `brand/**/*.svg`), `*.svg?raw` i tokeny marki/tooltip idą z realnych modułów; atrapa zostaje tylko dla `data/loader` (dane gry). Zrzuty w `evidence/` przegenerowane (13 PNG + okno zaawansowane). Widać realne ikony (Ld, TM, Wo, Ba, Zw, Ch oraz SVG dla kluczy z `setting-icon-map.json`). Zrzuty nie są już przyciemnione atrapą tokenów. Test: PASS, 6 konfiguracji.
3. Brak pomiaru bazowego PRZED zmianą — PRZYJMUJĘ. Zmierzono na snapshocie `5ab3d58e2` (git archive, scratch poza repo, ten sam `node_modules`):
   - newgame-bottom-navigation: baza 270/0; po zmianie 270/0.
   - newgame-adv-tooltip: baza 31/0; po zmianie 30/0 (Operator zmienił zestaw asercji pod nowy układ, 0 fail).
   - newgame-sett-grid-layout: baza 6 pass / 8 fail; po zmianie 74/0. Baza nie była zielona przed zmianą: test w bazie oczekuje 6 kart, a baza ma 8 (difficulty, map_size, world_type, game_speed, city_states_count, deals_end_turn_gate, civ_types_count, landFraction). Niepowodzenie jest sprzed zmiany (nieaktualna asercja), nie regresja.
   - newgame-settings-layout-reposition: baza NIE_ZMIERZONO (run na bazie przekroczył 280 s; test asercjonuje nowy układ, więc na bazie nie ma sensu oczekiwać PASS); po zmianie PASS.
   - diplo-truce-r1: baza 30/0; po zmianie 30/0.
   - diplomacy-test: baza 148/0; po zmianie 148/0.
   - war-era-counter-test: baza 82/0; po zmianie 82/0.
4. Komentarze „Wojna epoki z udziałem gracza" w `main.ts`/`newGameFlow.ts:179` — ODRZUCAM. Dowód: `git grep "z udziałem gracza" -- gra` zwraca wyłącznie linie komentarzy (`//`, `/**`, ` *`) w `main.ts`, `newGameFlow.ts:179`, `sidePanelHud.ts:50`, `diplomacy-layers.ts:317` i jednym komentarzu testu; etykieta widoczna dla gracza pochodzi z `ui-params.json` (zmienione na „Wojna epoki") i jest jedyną wartością UI. Nie zmieniano komentarzy poza allowlistą.

## Weryfikacja poprawionego harnessu i bramki

- `tsc --noEmit`: PASS (exit 0).
- `newgame-menu-reorder-layout-test.cjs`: PASS, 6 konfiguracji (1280×800, 1600×1000, 1920×1080 × zoom 100%/150%); 12 kart, 2 kolumny, brak nakładania, „Dalej" (`.nav .next`) osiągalne.
- Uwaga (ZAŁOŻENIE): na kroku 4 przy wyłączonym hot-seat przycisk `.nav .next` ma etykietę „Rozpocznij grę" (`newGameFlow.ts:2384/2405`, bez zmian względem bazy). Dispatch „Dalej" rozumiem jako ten przycisk.
- Kolejność kart i okna zaawansowanego (asercje po etykietach, 12 i 13 pozycji, bez duplikatów): `newgame-settings-layout-reposition-test.cjs` PASS.

## Tabela „gdzie była → gdzie jest" (z diffu 5ab3d58e2..877f6d5fa, zgodna z KOREKTĄ 6)

- siatka → siatka (nowa kolejność): difficulty L5, map_size L1, world_type L2, game_speed L4, city_states_count P2, civ_types_count P1, landFraction L3.
- zaawansowane/poza siatką → siatka: cityStateDifficulty P3, victory_mode L6, barbariansLevel P5, player_epoch_war P4, village_rewards_enabled P6.
- deals_end_turn_gate: była w siatce → teraz zaawansowane, pozycja 4 (widoczna, bez filtra).
- zaawansowane → zaawansowane (nowa kolejność): ruchSwiataPace 1, cityLimitBase 2, battleAlwaysManual 3, wzrostLudnosciPace 5, buildingCostPace 6, kosztJednostekPace 7, map_quality 8, resources_density 9, rivers_density 10, desert_density 11, forest_density 12, relief_density 13.
- Żadna opcja nie zgubiona; klucze, `advOpts` i wartości domyślne bez zmian.

## Zakres ikon (ZAŁOŻENIE)

`SETTING_SVG_KEYS` (6 kluczy) odpowiada dokładnie wpisom `setting-icon-map.json` (difficulty, map_size, world_type, game_speed, city_states_count, civ_types_count). Pozostałe karty dostają glif tekstowy z `SETTING_GLYPHS`. Brak hardkodowanej ikony `landFraction`.

BLOKADY: brak (poza pozycją 3 — NIE_ZMIERZONO dla bazy reposition).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet 5.5) ponownie na nowym SHA obrony; Final Control po PASS Evaluatora.
DEPLOY/PUSH: NIE WYKONANO
