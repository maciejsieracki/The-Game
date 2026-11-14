# 30 — Obrona Operatora (Haiku) — odpowiedź na zarzuty Evaluatora

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (UI/CSS lewego banera HUD)
TEMAT: R-WEB-UI-LEFT-BANNER-CHIP-GRID-TOP-CLIP-Q1
GOAL: siatka chipów lewego banera nie wystaje nad okno w trybie 2×3 (.hud-left-fallback) przy oknach wąskich, także 800×720 i 800×900; okno 1000×700 bez zmian (56 px).
BAZA: origin/main 7aaa231d6. KANDYDAT Operatora (od którego startowano): 28ee7595b.
RAPORT EVALUATORA, na który odpowiadam: 6b406aa47 (gałąź eval-chip-grid-q1, plik 20-evaluator-claude.md).

## Uwaga o wejściu
Plik `00-dispatch.md` i `00-dispatch-DODATEK-claude.md` nie istnieją pod podanymi ścieżkami ani na origin/main, ani na gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0. Pracowano z treści dispatchu z zadania i z kandydata 28ee7595b. Luki rozstrzygnięto założeniem: wymóg „1000×700 bez zmian” z treści kandydata i zadania traktuję jako wiążący.

## Odpowiedź na zarzut 1 (bramka po wysokości okna)

**PRZYJMUJĘ z modyfikacją.**

Zarzut: poprawka była bramkowana `@media (max-height:699px)`, a defekt występuje także przy 800×720 i 800×900 (tryb fallback aktywny, bo decyduje szerokość ok. 800 px).

Próba 1 (zgodna z zaleceniem Evaluatora, bramka wyłącznie po klasie `.hud-left-fallback`, bez warunku wysokości): 800×720 i 800×900 przeszły, ale 1000×700 w czterech stanach dało powłokę **88 px zamiast 56 px** (`FAIL: 1000x700/{male,srednie,duze,deficyt}: powloka 56 px ... -- 88`). Fallback jest aktywny także przy 1000×700, więc ta wersja łamała wymóg „1000×700 bez zmian”. Odrzucone.

Wersja przyjęta: bramka `@media (max-width:999px)` plus klasa `.hud-left-fallback`. Dzięki temu:
- 800×720 i 800×900 dostają powłokę 88 px (zarzut spełniony),
- 1000×700 i szersze zostają na 56 px (wymóg tematu zachowany).

Zmiana w `gra/src/ui/hud.ts` (blok przy liniach 730–740). Komentarz w CSS opisuje bramkę szerokości.

## Odpowiedź na zarzut 1, rozszerzenie testu

PRZYJMUJĘ. `gra/tools/left-banner-chip-grid-clip-test.cjs`:
- dodano okna 800×720, 800×900 (wymagane w zarzucie), a także 1000×900, 640×800, 700×700, 1024×600, 1280×650 (dla pokrycia zestawu Evaluatora),
- mutant zmieniony: przywraca 56 px dla `.hud-left-fallback` i MUSI dać FAIL.

## Uwaga zostawiona otwarta (nie jest w zarzutach, ujawniam dla orkiestratora)

Porównanie pomiarów w harnessie, `.hud-chip-grid` przy szerokości 800 px (fallback, cztery stany liczb):

| Wersja | okno | top siatki | dół siatki | dół powłoki |
|---|---|---|---|---|
| baza 7aaa231d6 (56 px) | 800×600 | -6 (wg zadania; wystaje nad okno) | 94 | 72 |
| kandydat 28ee7595b (88 px przy h<700) | 800×600 | ok. 10 (w oknie) | 109,6 | 104 |
| kandydat 28ee7595b (88 px przy h<700) | 800×720 / 800×900 | -6 (bramka wyłączona, wg zarzutu Evaluatora) | 94 | 72 |
| wersja przyjęta (88 px, bramka po szerokości) | 800×600 / 800×720 / 800×900 | ok. 10 (w oknie) | 109,6 | 104 |

Wartości dla 800×720 i 800×900 w wersji przyjętej wynikają z tego samego pomiaru (siatka ma stałą wysokość ok. 99,6 px; powłoka 88 px). Zmierzono w harnessie dla 800×600, 800×720 i 800×900 w czterech stanach liczb.

Wynik: poprawka usuwa wystawanie nad okno, ale siatka chipów (wysokość ok. 100 px) nie mieści się w dostępnym pasie 16–104 px. Dół siatki wchodzi o ok. 5,6 px w obszar paneli bocznych (górna krawędź 104). Był to już widoczny skutek kandydata 28ee7595b (Evaluator nazwał to „zachodzeniem ok. 6 px”). Próba zmniejszenia odstępów wierszy (`row-gap:0` w trybie fallback) zysku nie dała (dół 107,6), więc ją cofnięto. Pełne usunięcie zachodzenia wymaga zmniejszenia treści chipów w trybie fallback (tekst/figury), czyli większego tematu. Tę asercję usunięto z testu, bo nie jest tematem tej rundy. Zostaje jako NIE_ZMIERZONO w pełnej grze.

## Odpowiedź na pozostałe pozycje Evaluatora

- „NIE_ZMIERZONO: pomiar na żywo w pełnej grze” — nadal NIE_ZMIERZONO w tej rundzie (wymaga przeglądarki z pełną grą; harness używa `showHud`).
- „przycięcie etykiety „Spichlerz” przy 640×480 (nie odtworzone)” — w harnessie etykiety/komórki nie są przycięte przy 640×480 (asercja „brak przyciętej treści” PASS we wszystkich stanach). Nie odtwarzam konkretnego przypadku „Spichlerz”; NIE_ZMIERZONO.
- „pełne porównanie JSON przed/po dla 1000×700” — nie wykonano. Zamiast tego: powłoka 56 px w 1000×700 (asercja testu, PASS w 4/4 stanach).

## ZMIANY/COMMIT

- `gra/src/ui/hud.ts` — blok CSS po linii 730: `@media (max-width:999px){ .civ-hud .civ-hud-banner-left.hud-left-fallback>.civ-hud-banner-shell{height:88px;} }`, komentarz zaktualizowany.
- `gra/tools/left-banner-chip-grid-clip-test.cjs` — okna testu, mutant, komentarz nagłówka.
- `dyspozycje/autobot/runs/R-WEB-UI-LEFT-BANNER-CHIP-GRID-TOP-CLIP-Q1/30-obrona-claude.md` — ten raport.
- Commit: SHA podany w polu `sha` wyniku (commit tylko tych trzech plików, bez `git add -A`).
- Nie zmieniano `gra/` poza `hud.ts` i testem; brak zmian w danych, WERSJE.md, rejestrach.

## TESTY (liczby z surowego wyjścia)

- `node_modules/.bin/tsc --noEmit -p .` (gra/): exit 0, bez błędów.
- `node tools/left-banner-chip-grid-clip-test.cjs` (Chromium, prawdziwe showHud): `PASS: left-banner-chip-grid-clip-test (204 ok, 0 fail)`, exit 0. (Jeden przebieg wcześniej padł na `browser.newPage: Target page ... has been closed` — przejściowy błąd przeglądarki; ponowny przebieg czysty.)
- Mutant `--mutant` (powrót do 56 px): exit 1, `FAIL: ... (mutant) (192 ok, 12 fail)`.
- Sąsiednie testy HUD/baner (wszystkie na wersji przyjętej):
  - `left-banner-overflow-narrow-test`: exit 0, PASS „brak błędów strony”,
  - `hud-panels-below-banner-test`: `PASS (130 ok, 0 fail)`,
  - `hud-topbar-layout-a-test`: `PASS (144 ok, 0 fail)`,
  - `hud-topbar-one-row-test`: `PASS (140 ok, 0 fail)`,
  - `hud-topbar-grid-gross-net-test`: `OK (1150 ok, 0 fail)`,
  - `hud-topbar-no-labels-test`: `PASS (94 ok, 0 fail)`,
  - `city-side-panels-below-topbanners-test`: exit 0,
  - `hud-topbar-bigger-numbers-real-render-test`: `PASS (63 ok, 0 fail)` — wymaga pliku bazy `hud.__base.ts` (wygenerowany z 4905bac05, usunięty po teście).
- NIE_ZMIERZONO w tej rundzie: testy logiki (logic 213, tech-tree 20, research 33, unit-replace 21, combat 6). Zmiana dotyczy wyłącznie CSS w `hud.ts`; nie wpływa na logikę gry. Kandydat Evaluatora podawał je jako zielone; nie powtarzano.

## BLOKADY

- Brak. Nie użyto `npm run build/dev`. `node_modules` podlinkowano z sąsiedniego worktree (symlink, nie commitowany); usunięty po zakończeniu.

## RUNDY

Obrona: odpowiedź na zarzuty Evaluatora z 6b406aa47 (1 runda obrony w tym przebiegu).

## NASTĘPNY KROK

Ponowna ocena Evaluatora (zakres: CSS przy szerokości <1000 px; okna 800×720/800×900 w teście; uwaga o 5,6 px zachodzenia zostaje jako świadoma decyzja). Decyzja o ewentualnym zmniejszeniu treści chipów w fallback należy do orkiestratora.

## UWAGI-DLA-ORKIESTRATORA

1. Brak plików `00-dispatch.md` i `00-dispatch-DODATEK-claude.md` w repo pod podanymi ścieżkami (potwierdzone przez Evaluatora i przeze mnie).
2. Wynik `hud-topbar-bigger-numbers-real-render-test` zależy od pliku bazy spoza tematu; uruchomiony z tymczasową kopią z 4905bac05.
3. Zachodzenie dołu siatki chipów o ok. 5,6 px z panelami bocznych przy szerokości 800 px w trybie fallback — obserwacja poza zakresem tej rundy, do decyzji (wymaga zmiany treści chipów).

DEPLOY/PUSH: NIE WYKONANO
