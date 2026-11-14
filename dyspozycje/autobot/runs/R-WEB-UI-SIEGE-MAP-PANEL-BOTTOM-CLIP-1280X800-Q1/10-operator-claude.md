# R-WEB-UI-SIEGE-MAP-PANEL-BOTTOM-CLIP-1280X800-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-SIEGE-MAP-PANEL-BOTTOM-CLIP-1280X800-Q1
GOAL: panel oblężenia mapowego (gra/src/ui/siegeMapPanel.ts) przy 1280×800 i 1024×768 z blokiem budowy machin: przyciski „Oblegaj / Szturm / Odwrót" w pełni widoczne bez przewijania, nad dolnym banerem HUD (.civ-bottom-bar), stopka panelu nie pod banerem.
BAZA: 75e238e52 (origin/main). Gałąź robocza: detached HEAD w worktree wf_087a65c0-35e-1.

## Przyczyna (zmierzona na kodzie sprzed poprawki)
- Nakładka `.civ-smp-overlay` miała stałe `bottom:72px`, a dolny baner `.civ-bottom-bar` zaczyna się na `innerHeight-96` (1280×800: top 704). Dolne ~24 px panelu (stopka) leżało pod banerem.
- Przyciski akcji były w `.civ-smp-body` (overflow-y:auto). Przy 4 widocznych machinach treść miała scrollH 743 vs clientH 483 (1280×800): przyciski na pozycji y=814–942, czyli poza widocznym obszarem; użytkownik musiał przewinąć panel, a same przyciski nie były widoczne od razu.
- Dowód: `evidence/przed-1280x800-probe.png` (zrzut sprzed poprawki, OBEJRZANY) oraz `evidence/test-PRZED-wynik.json` (FAIL na obu viewportach).

## Zmiana (ZMIANY/COMMIT)
- `gra/src/ui/siegeMapPanel.ts`:
  1. Przyciski akcji (`.civ-smp-prompt` + `.civ-smp-actions`) przeniesione z przewijanego `.civ-smp-body` do nowego, nieprzewijanego bloku `.civ-smp-dock` (flex-shrink:0), między treścią a stopką. Treść (statystyki, machiny) nadal przewija się wewnątrz panelu.
  2. Nowa funkcja `fitOverlayAboveBottomBar()`: ustawia `bottom` nakładki tak, by kończyła się `HUD_GAP_PX` (10 px) nad górną krawędzią `.civ-bottom-bar` (mierzone przy każdym renderze i przy `resize`, hook `ensureResizeHook`). Gdy baneru brak / ma wysokość 0 lub przy szerokości ≤480 px — zostaje reguła CSS (bez zmian dla telefonu).
  3. Import `HUD_GAP_PX` z `./hudLayout` (stała już istniejąca; bez zmian w hudLayout.ts).
  Logika oblężenia, combat, dane JSON, WERSJE.md — nietknięte.
- `gra/tools/siege-map-panel-bottom-clip-1280x800-test.cjs` (nowy): Playwright, hak `__siegeBadgeTestDebug` + 10 jednostek + 3 technologie (4 pozycje w bloku budowy). Dla 1280×800 i 1024×768 sprawdza: pasek HUD widoczny, 3 przyciski akcji mają `bottom <= bar.top - 4` i `top >= 0` BEZ przewijania, stopka `bottom <= bar.top`. Exit 0 = PASS.

## Pomiary (getBoundingClientRect, surowe wyjście z `evidence/test-*.json`)
| Viewport | Wariant | bar.top | Przyciski (top–bottom) | Limit (bar.top−4) | Stopka (bottom) | Wynik |
|---|---|---|---|---|---|---|
| 1280×800 | PRZED (75e238e52) | 704 | 814–942 | 700 | 727 | FAIL |
| 1280×800 | PO | 704 | 525–653 | 700 | 693 | PASS |
| 1024×768 | PRZED | 672 | 814–942 | 668 | 695 | FAIL |
| 1024×768 | PO | 672 | 493–621 | 668 | 661 | PASS |

W bloku budowy w obu wariantach są 4 przyciski machin (Taran · 7 ¤ + 19 Drewno; Taran okuty; Katapulta; Wieża oblężnicza).

## Dowód mutacyjny (kryterium 3)
Test uruchomiony na buildzie z kodu sprzed poprawki (`dist` z 75e238e52): wynik FAIL (`test-PRZED-wynik.json`, verdict FAIL, 4 niezaliczone sprawdzenia na viewport). Ten sam test na buildzie po poprawce: PASS (`test-PO-wynik.json`, exit 0). Cofnięcie poprawki = przywrócenie kodu z 75e238e52, czyli dokładnie build PRZED.

## Pliki dowodowe
- `dyspozycje/autobot/runs/R-WEB-UI-SIEGE-MAP-PANEL-BOTTOM-CLIP-1280X800-Q1/evidence/przed-1280x800-probe.png` (przed; sprzed poprawki, panel z przyciskami poza widokiem i stopką pod banerem)
- `.../evidence/po-1280x800.png`, `.../evidence/po-1024x768.png` (po; przyciski widoczne nad banerem)
- `.../evidence/test-PRZED-wynik.json`, `.../evidence/test-PO-wynik.json`

## TESTY (bramki)
- `npx tsc --noEmit` (gra/): exit 0, brak wyjścia.
- `node tools/logic-test.cjs`: `LOGIC OK (213/213)`, RC=0.
- `node tools/tech-tree-test.cjs`: `tech-tree-test: 20 pass, 0 fail`, RC=0.
- `node tools/research-test.cjs`: `ALL GREEN`, RC=0.
- `node tools/unit-replace-test.cjs`: `WSZYSTKIE TESTY ZIELONE (21/21)`, RC=0.
- `node tools/combat-test.cjs`: `All sanity checks passed.`, RC=0.
- `node tools/siege-map-panel-bottom-clip-1280x800-test.cjs <dist-PO>`: PASS, RC=0 (1280×800 i 1024×768).
- `git diff --check`: bez wyjścia (czysto).
- Build: `node ./node_modules/vite/bin/vite.js build --outDir <scratchpad>` (nie `npm run build`); `npm ci --ignore-scripts` tylko do node_modules (ignorowane przez git).
- Nie uruchamiano `npm run build/dev` w gra/.

## BLOKADY
- Nie wszystkie testy referencyjne zostały wykonane w wersji „z przeglądarką” — wykonano 5 bramek z dispatchu (tsc + 5 skryptów). Pełnej regresji całego katalogu testów nie uruchamiano (poza zakresem).
- Mierzone wyłącznie w Chromium (swiftshader) przy deviceScaleFactor 1; nie sprawdzono innych przeglądarek ani przypadku z innym zestawem paska HUD (np. bardzo długi baner).

## RUNDY
1/5 — PASS-WITH-NOTES za pierwszym razem (bez FAIL). Nie wymagane kolejne rundy wg kryteriów tego tematu.

## UWAGI-DLA-ORKIESTRATORA
- Dispatch zakładał, że przy 1280×800 przyciski mają być widoczne także przy domyślnym przewijaniu; po poprawce są widoczne bez przewijania (dock poza przewijaną treścią). Decyzja „przewijanie vs zwężenie” wykonana jako: dock + nakładka nad banerem (bez zwężania bloku budowy).
- Bundle wewnątrz repo nie był budowany do `gra/dist` — build tylko do katalogu roboczego poza repo.
- Znalezisko poza zakresem (nie ruszane): w dispatchu brak pliku `00-dispatch.md` na `origin/main` pod tą ścieżką — jest tylko na gałęzi `claude/sprawdzenie-funkcjonalnosci-ek4ra0`; odczytano z niej.
- Dodatkowy zrzut `przed` jest z sondy (probe) z otwartym panelem imperium w tle; geometria panelu nie zależy od tego (wynik z JSON).

NASTĘPNY KROK: Evaluator (SONNET) — weryfikacja diffu (`siegeMapPanel.ts`, test), ponowny pomiar i obejrzenie zrzutów PO/PRZED; następnie Obrona (HAIKU) i Final Control (SONNET).
DEPLOY/PUSH: NIE WYKONANO
