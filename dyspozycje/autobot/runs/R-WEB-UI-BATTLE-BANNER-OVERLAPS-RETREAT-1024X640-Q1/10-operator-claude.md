# R-WEB-UI-BATTLE-BANNER-OVERLAPS-RETREAT-1024X640-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES (kod + test zacommitowane; czeka na Evaluatora)
DOMAIN: GAME (UI bitwy)
TEMAT: R-WEB-UI-BATTLE-BANNER-OVERLAPS-RETREAT-1024X640-Q1
GOAL: W bitwie przy 1024×640, 1280×720 i 1440×900 żaden element UI nie zasłania przycisku „WYCOFAJ SIĘ”, wyniku/licznika ani innych przycisków gornego paska; układ nie psuje większych rozdzielczości.
BAZA: 87eeecbded76ce7034a35a7bf11cef899094d537 (origin/main), praca w detached HEAD w worktree.

## ZMIANY / COMMIT
- `gra/src/battle/battleScene.ts` — baner dowodcow (`commanderPanel`):
  - nowa metoda `_syncCommanderPanelLayout()` liczy pozycję i skalę z realnych rectów bloków gornego paska (lewy blok `_topBar.children[0]`, prawy `children[last]`) i z naturalnej szerokości banera;
  - jeśli baner w gornym wierszu da się wycentrować przy skali >= 0,7 (max 760 px), zostaje w gornym wierszu (`transform: translateX(-50%) scale(s)`);
  - w przeciwnym razie schodzi pod pasek (top = dolna krawędź paska + 6 px), od prawej krawędzi lewej kolumny rostera (`_rosterBar`) do prawej krawędzi okna, skala dopasowana do tej szerokości (`transform: scale(s)`, origin left-top);
  - wywołania: rAF po konstrukcji, `_onResize`, koniec `_syncBattleRosterPanelLayout`.
  - Przyczyna (zmierzona): baner był wycentrowany z `max-width: min(760px, 100% − 360px)`, a jego treść (dwie karty + zegar) ma ~795 px; przy 1024 wchodził na przycisk „Wycofaj się” i zebatkę/„Pomiń”, przy 1280 i 1440 treść wychodziła poza ramkę na zebatkę/„Wycofaj się”.
- `gra/tools/battle-banner-retreat-overlap-live-test.cjs` (NOWY) — driver Chromium (wzorzec: battle-damage-colors-live-test.cjs): start walki 28 vs 28 na mapie `?playtest=mapa`, pomiar prostokąta banera jako SUMY prostokątów jego potomków (wyjście treści poza ramkę też się liczy), sprawdza: brak przecięcia z „Wycofaj się”; `elementFromPoint` w środku przycisku = przycisk; brak przecięcia z żadnym elementem gornego paska (przyciski, etykiety, emblemat); baner w viewporcie; brak błędów konsoli. Tryb `--mutant` wyłącza funkcję dopasowania (tylko w pamięci buildu, bez zmian w repo).
- `dyspozycje/autobot/runs/R-WEB-UI-BATTLE-BANNER-OVERLAPS-RETREAT-1024X640-Q1/10-operator-claude.md` — ten raport.
- Commit: patrz sekcja SHA w odpowiedzi Operatora (czubek brancha detached).
- Nie zmieniano: `gra/data`, `gra-robocza`, `WERSJE.md`, logika bitwy, balans.

## TESTY (liczby z surowego wyjścia)
- `npx tsc --noEmit` (`node ./node_modules/typescript/bin/tsc --noEmit`): exit 0, 0 × `error TS`.
- Live driver `battle-banner-retreat-overlap-live-test.cjs`, build po poprawce (dist poza repo):
  - 1024×640: WYNIK 6 PASS / 0 FAIL; banner x 396–1001, y 82–157 (w 605, h 75); 0 nakładających się elementów; „Wycofaj się” x 796–918, y 22–48, `elementFromPoint` = BUTTON.
  - 1280×720: WYNIK 6 PASS / 0 FAIL; banner x 341–939, y 12–86 (w 597); 0 nakładających się elementów.
  - 1440×900: WYNIK 6 PASS / 0 FAIL; banner x 342–1098, y 12–106 (w 757); 0 nakładających się elementów.
- Przed poprawką (build bazowy, ten sam test): 1024×640 → 4 PASS / 2 FAIL (baner x 180–975 przecina „Wycofaj się” 796–918 oraz „Ustawienia” 696–736, „Pomiń” 746–786, etykietę „x1”); 1280×720 → 4 PASS / 2 FAIL (baner 260–1055 przecina „Wycofaj się” 1052–1174, „Ustawienia”, „Pomiń”); 1440×900 → 5 PASS / 1 FAIL (baner 340–1100 przecina „Ustawienia” 1112–1152).
- Mutant (poprawka wyłączona) w 1024×640: 4 PASS / 2 FAIL — test czerwienieje po regresji.
- Testy towarzyszące (exit codes z surowego wyjścia):
  - `battle-tempo-minimap-brand-test.cjs`: exit 0, „OK (A: 3 grupy stylu, B: 9 tokenów, C: wiązanie sceny)”.
  - `battle-hp-display-test.cjs`: exit 0, „PASS — 7 / 7”.
  - `battle-damage-colors-test.cjs`: exit 0, „WYNIK: 28 PASS / 0 FAIL”.
  - `ambush-ui-reason-test.cjs`: exit 0, „Wynik: 10 OK, 0 FAIL”.
- NIE ZMIERZONO: pozostałe bramki z §6 R-PROC (poza czterema z dispatchu); pełny `npm test`-owy zestaw; wizualna ocena w 1440 (zrzut zapisany, nie oglądany przez Operatora — weryfikacja liczbowa).
- Zrzuty (poza repo): `/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/banner/shots/` — `banner-retreat-1024x640.png` (po poprawce; obejrzany: baner pod paskiem, obok rostera, całe karty i zegar widoczne, „Wycofaj się” czysty), `banner-retreat-1280x720.png` (po poprawce; obejrzany: baner w gornym wierszu, przyciski czyste), `banner-retreat-1024x640-mutant.png`. Zrzut bazowy został nadpisany zrzutem po poprawce (ta sama nazwa pliku).

## BLOKADY
- Brak DODATKU (`00-dispatch-DODATEK-claude.md`): w gałęzi `claude/sprawdzenie-funkcjonalnosci-ek4ra0` (b0c413f6) jest tylko `00-dispatch.md` (cały zakres w nim). Zakres z dispatchu wykonany; DODATEK nie był dostępny.
- `origin/main` (87eeecbde) nie zawiera katalogu runu — dispatch odczytany z gałęzi `claude/sprawdzenie-funkcjonalnosci-ek4ra0`.

## UWAGI (założenia Operatora)
- Rozwiązanie „schodzi pod pasek” przy 1024×640 zasłania górną część pola bitwy (y 82–157) — zamiast przysłaniać przyciski. Skala treści ~0,77 (1024), ~0,75 (1280), ~0,95 (1440). Do oceny przez Evaluatora/właściciela wizualnie.
- Test wymaga zmiany rozdzielczości przez `--vp`; kolejne viewporty z `--dist <build> --reuse`.
- W worktree zainstalowano `gra/node_modules` (`npm ci`, tylko zależności; bez `npm run build`/`dev`). Build testowy: wywołanie `vite` przez API, outDir poza repo (zgodnie z C-001).
- Poza zakresem (nie wpisywano do repo): w katalogu nadrzędnym worktreów zostały pliki logów `scratchpad-*.log` (npm/tsc/bramki) — poza repo, do sprzątnięcia przez orkiestratora.

## NASTĘPNY KROK
Evaluator: odtworzyć test (`node gra/tools/battle-banner-retreat-overlap-live-test.cjs --vp 1024x640` oraz `--reuse` dla 1280x720 i 1440x900) i tryb `--mutant`; ocenić zrzuty; sprawdzić diff `gra/src/battle/battleScene.ts` (zakres: tylko baner dowodcow i jego wywołania).

DEPLOY/PUSH: NIE WYKONANO
