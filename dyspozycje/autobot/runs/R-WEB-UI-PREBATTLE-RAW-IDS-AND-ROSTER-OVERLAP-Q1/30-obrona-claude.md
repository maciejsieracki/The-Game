# R-WEB-UI-PREBATTLE-RAW-IDS-AND-ROSTER-OVERLAP-Q1 — raport Obrony (runda 1/5, odpowiedź na zarzuty Evaluatora 7cf2e2c35)

STATUS: PASS-WITH-NOTES (Obrona; wiążący werdykt wystawia Final Control; jedna kwestia układu oznaczona DECISION_REQUIRED)
DOMAIN: GAME (UI, błędy web)
TEMAT: R-WEB-UI-PREBATTLE-RAW-IDS-AND-ROSTER-OVERLAP-Q1
GOAL: (1) okno „Rozstawienie bitwy” bez surowych ID w tekście dla gracza — ZROBIONE (kandydat f782b0a21 + poprawki tej rundy); (2) lista wojsk gracza przy 12 jednostkach w 1024×640 nie zasłonięta — ZMIERZONE, spełnione wg kryterium dispatchu (lista ma własne przewijanie, koniec listy i przyciski w viewport); gęstość listy = DECISION_REQUIRED (patrz zarzut 1).
BAZA: b1eff89eef58ac911940ea4a1a60f76dc858d3b4 (origin/main). KANDYDAT Operatora: f782b0a2158601d70f1fcf8f758283279f0e0f75. Obrona startuje od kandydata.

## ZMIANY-COMMIT

Commit obrony: patrz sekcja „SHA” na końcu (commit na gałęzi worktree-wf_29e9167e-ed8-3, nie pushowany).

Zmienione pliki tej rundy (względem kandydata f782b0a21):
- `gra/src/game/civ-matrix-semantic.ts` — cofnięte globalne zmiany zlaczenia i `%` (`civMatrixParameterLabelPl`); `obleczenie` → `oblężniczych` (było `oskrzydlenia`); `bitwa` → `bitwy`; filtr pustych fragmentów zostaje. Zakres: 12 z 93 etykiet różni się od bazy (było 48), wszystkie 12 to ID zawierające surowe pozostałości identyfikatora (`w`, `wlasne`, `szarzy`, `morze`, `obleczenie`, `bitwa`). Wszystkie `*_proc` wróciły bit-w-bit do bazy.
- `gra/tools/prebattle-rawids-roster-q1.cjs` — dodane asercje (exit 1 przy naruszeniu), pomiar ostatniej karty po przewinięciu, tryb mutacji `PB_MUTATE=more-offscreen`, pole `cardsScrollable`.
- `gra/tools/prebattle-labels-q1.cjs` (nowy) — test etykiet Matrix/chipów/terenu i źródeł `terenLabelPl`/`terrainLabelPl`.
- `dyspozycje/.../evidence/obrona-r1-*` — zrzuty i JSON-y live (po 1024/1280/1920, przed 1024).
- `dyspozycje/.../30-obrona-claude.md` — ten raport.

Poza zmianami tej rundy (bez zmian względem kandydata): `gra/src/ui/preBattle.ts`, `gra/src/main.ts`, `gra/src/game/civ-bonuses.ts`, `gra/src/game/defenseBreakdown.ts`, `gra/tools/civ-bonusy-test.cjs`.

## ODPOWIEDZI NA ZARZUTY

1. **Układ (GOAL 2, kryt. c) — ODRZUCAM jako niespełnione kryterium; zgłaszam DECISION_REQUIRED dla gęstości listy.**
   Dowód (live, Chromium, bundle vite zbudowany poza repo, `evidence/obrona-r1-probe-po.json`, obejrzane zrzuty):
   - 1024×640, 12 jednostek: 8 kart + „+4 więcej…” (linia „+N” w viewport, bottom 454 < 640), przyciski akcji w viewport, brak nakładania listy/„+N” na panel rozstawienia, brak poziomego scrolla strony, ostatnia karta po przewinięciu do końca w viewport i w kontenerze listy (`lastCardAfterScroll` inViewport=true, inCards=true).
   - Lista jest przewijana wewnętrznie tylko przy 640 px wysokości (`cardsScrollable: true`); karta 6 jest uścięta na krawędzi przewijania — to zachowanie przewijanej listy, nie zasłonięcie przez okno. Dispatch dopuszcza „lista ma własne przewijanie z widocznym końcem listy i przyciskami akcji”; ten wariant jest spełniony.
   - 1280×800 i 1920×1080: wszystkie 8 kart widoczne bez przewijania (`cardsScrollable: false`), „+N” i przyciski w viewport.
   - Zasłonięcia z hunger-stack (04706c109) NIE odtworzono ani na kandydacie, ani na bazie b1eff89 (geometria `probe-przed` identyczna z `probe-po`). Nie zmieniałem układu (dispatch: zmiana układu bez jasnej reguły → DECISION_REQUIRED).
   - DECISION_REQUIRED (właściciel): czy przy 640 px lista ma mieścić wszystkie 8 kart bez przewijania (wymaga zmniejszenia kart lub wysokości panelu albo mniejszej liczby kart w podglądzie), czy zostaje przewijanie z uciętą kartą na krawędzi.

2. **Testy nie są testami — PRZYJMUJĘ.**
   - `prebattle-rawids-roster-q1.cjs` ma teraz asercje i kod wyjścia 1 (`checkRun`): surowe ID w tekście, liczba kart (8), linia „+4 więcej…”, nakładanie, viewport, przyciski, ostatnia karta po przewinięciu, poziomy scroll, błędy strony.
   - Mutacje (wykonane):
     - baza b1eff89 zbudowana poza repo (`git archive` do scratchpadu) i zmierzona tym samym narzędziem: **FAIL 3/3 rozdzielczości** (surowe ID: `Matrix:`, `walka_`, `atak_piechota`, `pancerz_piechota`, `plytkie_morze`), kandydat/obrona: **OK 3/3**. Dowód czerwieni na defekcie z dispatchu (`probe-przed.json`).
     - `PB_MUTATE=more-offscreen` (linia „+N” wypchnięta poza viewport) na 1024×640: **FAIL** („linia „+N” poza viewportem”, `ASSERT mut FAIL 1`, exit 1).
     - `PB_MUTATE=deploy-wide` (z poprzedniej rundy) — nie powtarzane w tej rundzie.
   - Nowy `prebattle-labels-q1.cjs`: **297 pass / 0 fail** na obronie. Mutacje na kopii pliku, przywrócone i sprawdzone `cmp` (RESTORED_OK):
     - `obleczenie: 'obleczenie'` (cofnięcie etykiety) → **FAIL 4** (etykieta zawiera pozostałość + oczekiwano „oblężniczych”),
     - `terenLabelPl` zwraca surowe id (cofnięcie poprawki z `preBattle.ts`) → **FAIL 1** (asercja źródła; test źródłowy, nie runtime — zaznaczam).
   - Test Evaluatora o zaczerwienieniu po cofnięciu „plytkie_morze” w `terrainLabelPl` (main.ts): pokryty asercją źródłową (`terrainLabelPl` czyta `TEREN_LABEL_PL`); pełnego runtime-mutanta main.ts nie budowałem.

3. **`obleczenie` → „oskrzydlenia” — PRZYJMUJĘ.**
   Kategoria `obleczenie` = jednostki oblężnicze (`civ-bonuses.ts:75` rola `oblez-nicza` → `'obleczenie'`, `:128`). Etykieta: `walka_atak_obleczenie` → „Walka · atak · oblężniczych”, `walka_obrona_obleczenie` → „Walka · obrona · oblężniczych” (forma jak „piechoty”, „łuczników”). Pokryte asercją w `prebattle-labels-q1.cjs` (mutacja → FAIL).

4. **Zakres zmian globalnych etykiet — PRZYJMUJĘ (zawężone).**
   - Cofnięte: zmiana zlaczenia `' · '`, usunięte `.replace(' · %','%')`, wszystkie `*_proc` wróciły do bazy. Mój audyt wszystkich 93 ID (base vs nowa funkcja, skrypt esbuild, `scratchpad/labels/diff.txt`): **12 różnic** (było 48), wszystkie na ID z surowymi pozostałościami w bazie lub z `obleczenie`:
     - `walka_atak_obleczenie`, `walka_obrona_obleczenie` (oblężniczych),
     - `walka_ruch_bitwa_proc` (`bitwy · %` zamiast `bitwa · %`),
     - `walka_atak/obrona_piechota_terytorium_wlasne` (usunięte `wlasne`),
     - `walka_atak/obrona_piechota_w_murze` (usunięte `w`; zostaje „w murze”),
     - `walka_atak/obrona_piechota_runda_szarzy` (usunięte `szarzy`),
     - `walka_*_piechota_teren_plytkie_morze` ×3 (usunięte `morze`).
   - Brak duplikatów etykiet (audyt: 0 kolizji), brak surowych `_` i `Matrix:` w 93 etykietach.
   - Konfigurator nowej gry (`newGameFlow.ts:1249/1268/1274`) dostaje te same 12 etykiet; pozostałe 81 bez zmian.
   - Sformułowanie „w murze” (przypadek miejscownikowy bez rzeczownika nadrzędnego) zostaje jako świadoma decyzja — do oceny FC; alternatywa to ponowne rozszerzenie słownika.

5. **Chipy bez wartości liczbowej — ODRZUCAM (poza zakresem tematu).**
   Dispatch wymaga polskiej, czytelnej nazwy, nie decyzji o pokazywaniu wartości premii. Brak decyzji właściciela, więc nic nie zmieniam. Ryzyko deduplikacji w `Set`: sprawdzone w tej rundzie — **0 kolizji etykiet** po zmianie (audyt 93 ID). Pozycja do decyzji właściciela (DECISION_REQUIRED, niska pilność).

6. **Dowód live niepełny — PRZYJMUJĘ (uzupełnione).**
   - Live Chromium wykonany w tej rundzie na 3 rozdzielczościach dla kandydata i bazy: zrzuty przed (`obrona-r1-przed-1024x640.png`) i po (`obrona-r1-po-1024x640/1280x800/1920x1080.png`), wszystkie **obejrzane** (Read) i opisane w zarzutach 1 i 2. 1920×1080 obejrzane (deploy na dole, 8 kart + „+4” widoczne, bez nakładania).
   - Defekt zasłoniętej listy: NIE ZREPRODUKOWANY (także na bazie) — patrz zarzut 1.
   - Fallback `'Rownina'` (main.ts:34868) — ODRZUCAM jako błąd: `dTeren4` idzie do `fieldBattlePlaceInfo(...)` (main.ts:34877), tam `terrainLabelPl(terrain)` (main.ts:11293–11322) mapuje przez `TEREN_LABEL_PL`, który ma etykietę dla każdego `TerenBazowy` (asercja w `prebattle-labels-q1.cjs`, pkt 4). Tytuł i „Teren:” dostają etykietę, nie surowe id. Dowód kodowy + test, NIE dowód live tej ścieżki (fallback wymagałby brakującego heksu).

## TESTY (liczby z surowego wyjścia tej rundy)

- `npx tsc --noEmit`: exit 0.
- logic-test: `LOGIC OK (213/213)`, exit 0.
- tech-tree-test: `20 pass, 0 fail`, exit 0.
- research-test: `ALL GREEN`, exit 0.
- unit-replace-test: `WSZYSTKIE TESTY ZIELONE (21/21)`, exit 0.
- combat-test: `All sanity checks passed.`, exit 0.
- civ-bonusy-test: `56 passed, 0 failed`, exit 0.
- civ-matrix-semantic-labels-test: `PASS 490; FAIL 0`, exit 0.
- population-civ-matrix-wiring-test: `122 passed, 0 failed`, exit 0.
- pr141-f04-cost-activation-defense-test: `64 passed, 0 failed`, exit 0.
- pr141-f04-cost-activation-test: `20 passed, 0 failed`, exit 0.
- pr141-g1-combat-activation-test: `PASS`, exit 0.
- pre-battle-defender-retreat-test: `OK`, exit 0.
- pre-battle-retreat-exhausted-test: `33 pass, 0 fail`, exit 0.
- pre-battle-save-test: `OK`, exit 0.
- barbarzyncy-podwojny-atak-prebattle-test: `18 pass, 0 fail`, exit 0.
- prebattle-labels-q1 (nowy): `297 pass / 0 fail`, exit 0.
- prebattle-rawids-roster-q1 (live, 3 rozdzielczości, kandydat+obrona): `ASSERT cand OK []`, exit 0.
- defense-breakdown-test: exit 1 — **dług bazowy, identyczny na b1eff89** (`TypeError: Cannot read properties of undefined (reading 'find')`, `grecy.bonusy`), nie z tego tematu.
- `git diff --check`: do wykonania przy commicie (patrz poniżej).

## BLOKADY

Brak blokad technicznych. Dwie kwestie do decyzji (DECISION_REQUIRED, nie blokują commitu): gęstość listy wojsk przy 640 px (zarzut 1) oraz pokazywanie wartości premii w chipach (zarzut 5).

## UWAGI-DLA-ORKIESTRATORA

- Allowlista: `gra/src/game/civ-matrix-semantic.ts` jest etykietą matrix, której źródłem są ID (dozwolone wg dispatchu); `civ-bonuses.ts`, `defenseBreakdown.ts`, `main.ts` to miejsca wywołań etykiet — poza ścisłą allowlistą, FC do rozstrzygnięcia (zmiany są minimalne: wywołanie `civBonusOpisPl` i `TEREN_LABEL_PL`).
- Dług bazowy do osobnego tematu: `defense-breakdown-test` (TypeError `grecy.bonusy`), również czerwony na b1eff89.
- Zrzuty i dane live zapisane w `evidence/obrona-r1-*`; buildy (`dist-cand`, `dist-base`) i kopia bazy są poza repo w scratchpadzie.
- Nie integrowano, nie deployowano, nie pushowano. Brak `spawn_task`/sesji/harmonogramów.

RUNDY: 1/5
NASTĘPNY KROK: Final Control rozstrzyga zarzuty 1 i 5 jako DECISION_REQUIRED (układ 640 px, wartości chipów) oraz zatwierdza zawężenie etykiet (zarzut 4) i allowlistę (sekcja UWAGI); po FC PASS — integracja orkiestratora.
DEPLOY/PUSH: NIE WYKONANO
