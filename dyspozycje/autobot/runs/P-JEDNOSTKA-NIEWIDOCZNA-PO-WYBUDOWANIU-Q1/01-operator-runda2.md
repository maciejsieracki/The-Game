STATUS: PASS
DOMAIN: GAME
TEMAT: P-JEDNOSTKA-NIEWIDOCZNA-PO-WYBUDOWANIU-Q1
GOAL: Jednostka gracza w oknie odroczenia (`deferredPlayerUnitRevealIds`) przestaje być
filtrowana z areny renderu i jest rysowana jako PRZYCIEMNIONY token (opcja A właściciela),
wracający do pełnej widoczności przy `flushDeferredPlayerUnitReveals()` bez migotania.

ZMIANY/COMMIT: gałąź `autobot/P-JEDNOSTKA-NIEWIDOCZNA-PO-WYBUDOWANIU-Q1`, worktree
/home/user/wt-jednostka-niewidoczna, baza `f3e87ad2` (fast-forward do najnowszego
origin/main przed pracą — worktree był 3 commity w tyle, C-035).

- `gra/src/main.ts` — WYŁĄCZNIE `syncUnitsRender()`: usunięty filtr `src`
  (`rawSrc.filter(u => !deferredPlayerUnitRevealIds.has(u.id))` → `const src = rawSrc`)
  i przekazanie zbioru odroczeń jako 3. argumentu do `unitRenderer.sync(src, display,
  deferredPlayerUnitRevealIds)`. ZERO zmian w miejscach populacji/czyszczenia zbioru
  (3537, 9106, 10552-10559, 28277, 31180) — warunki odroczenia nietknięte (GOAL 4).
- `gra/src/render/units.ts` — `UnitRenderer.sync()` dostaje opcjonalny 3. parametr
  `dimmedUnitIds?: ReadonlySet<string>` + nowa prywatna metoda pomocnicza
  `_applyDeferredDim()` i stała `DEFERRED_TOKEN_OPACITY = 0.45`.
- `gra/tools/unit-deferred-reveal-dim-real-render-test.cjs` — nowy test żywego renderu.
- `dyspozycje/autobot/runs/<ID>/dowody/*.png` — 4 zrzuty (artefakty runu, nie kod).

WYBÓR PODEJŚCIA (uzasadnienie GOAL 1): dodatkowy, opcjonalny parametr `sync()` zamiast
nowego pola w `StackDisplayInfo` — bo `StackDisplayInfo` mieszka w `gra/src/game/
armyMerge.ts`, poza allowlistą, a zbiór odroczeń nie jest danymi stosu, tylko stanem
prezentacji. Zero zmian w `RuntimeUnit`, zero nowych setterów, jedno miejsce wywołania.

MECHANIZM (GOAL 2/3): `_applyDeferredDim()` ustawia `transparent = true` i
`opacity = min(bazowa, 0.45)` na materiałach WŁASNYCH żetonu (`tokenMaterials` =
`userData['mats']`: model z `buildUnitModel` + pierścienie właściciela/wojny), zapisując
stan sprzed zmiany w `material.userData['dimBase']`. Przywrócenie idzie ZAWSZE z tej bazy,
a stan trzyma flaga `group.userData['deferredDim']` — dwa kolejne `sync()` nie kumulują
przezroczystości. Po zmianie `src` jest IDENTYCZNE przed i po flushu, więc flush nie
przebudowuje ani nie dodaje żetonu — zdejmuje samo przyciemnienie (to samo `uuid` obiektu
w scenie, potwierdzone testem: brak klatki bez tokenu i brak podwójnego tokenu).

GOAL 5 — kolizje z istniejącymi przezroczystościami, sprawdzone reconem i testem:
1. `OWNER_RING_OPACITY` 0.42 / `WAR_RING_OPACITY` 0.38 SĄ w `tokenMaterials` (dopisywane
   przez `_attachOwnerRing` przed `_registerToken`). Mnożnik dałby 0.42 × 0.45 ≈ 0.19 =
   PODWÓJNE przyciemnienie i praktyczne zniknięcie pierścieni. Rozwiązane progiem
   `Math.min(bazowa, 0.45)`: materiał już bardziej przezroczysty niż próg zostaje bez
   zmian. Asercja pilnuje, że po przyciemnieniu min opacity = 0.42, a po flushu wraca
   dokładnie do 0.42 (nie do 1).
2. `STARVING_SKULL_OPACITY` 0.30 i `GOLD_DEFICIT_COIN_OPACITY` 0.46 to sprite'y tworzone
   w `_applySufferingIcons`, trzymane w osobnych mapach, SPOZA `tokenMaterials` — nie są
   dotykane, więc nie mogą się przyciemnić dwa razy.
3. Materiały odznak ulepszeń (`unitUpgradeBadges.ts`) i gwiazdek weterana
   (`unitVeteranBadges.ts`) to SINGLETONY MODUŁU współdzielone przez wszystkie jednostki
   na mapie — ich przyciemnienie przygasiłoby odznaki cudzych żetonów. Są poza
   `tokenMaterials`, a test sprawdza wprost, że pozostają nietknięte.
4. Tabliczka statystyk (`applyUnitStatPlate`) to sprite — celowo zostaje w pełnej
   czytelności: gracz ma w oknie odroczenia widzieć, CO się zbudowało.
5. Galeria (`main.ts:22815`, `sync(galleryUnits)` bez 3. argumentu) — bez zmian
   zachowania; `_applyDeferredDim(id, false)` na nieprzyciemnionym żetonie kończy się
   natychmiastowym returnem.

ŚWIADOMA KONSEKWENCJA (do wiadomości Evaluatora): odroczona jednostka wchodzi teraz do
`computeStackDisplay`, więc może zostać reprezentantem stosu i wliczać się do badge ×N w
oknie odroczenia. To jest ten sam stan, który i tak nastąpi po flushu — dzięki temu flush
nie przestawia reprezentanta i nie migocze.

TESTY (wszystkie uruchomione w worktree; `gra/node_modules` = symlink do drzewa głównego,
`tsc --version` = 5.9.3, C-029):
- NOWY `node tools/unit-deferred-reveal-dim-real-render-test.cjs` → **19 pass / 0 fail**.
  Żywy WebGL w headless Chromium (Playwright), prawdziwy `UnitRenderer`, trzy fazy na tej
  samej scenie; wartości `opacity`/`transparent` czytane z ŻYWYCH materiałów Three.js
  przez `scene.traverse`, nie z kodu.
- NIETAUTOLOGICZNOŚĆ: ten sam finalny test na kodzie SPRZED naprawy (`git stash` obu
  plików źródłowych) → **16 pass / 3 fail**, czerwienieją dokładnie trzy asercje
  przyciemnienia. Log potwierdzony w tej rundzie.
- Bramki referencyjne: `tsc --noEmit` 0 błędów; `logic-test` 213/213; `tech-tree-test`
  19/19; `research-test` 33/33; `unit-replace-test` 13/13; `combat-test` 6/6.
- Regresja renderu jednostek (znalezione greppem po `UnitRenderer|buildUnitModel|
  render/units`): `unit-card-3d-preview-coverage-test` 18/18, `city-map-badge-test` 62/62,
  `unit-info-card-contract-test` 23/23, `unit-info-card-entitycard-migration-test` 26/26,
  `zelazo-falanga-real-render-test` 40/40, `zelazo-katapulta-real-render-test` 22/22,
  `rebel-protection-live-test` 39/39 (żywa gra z buildu vite, zero console.error).
- `git diff --check` czysty; `unit-power-test` nieuruchamiany (pre-istniejąco czerwony
  4/2 wg §6 — nie regresja, nie naprawiam przy okazji, C-025).

DOWODY (side-by-side, `dyspozycje/autobot/runs/<ID>/dowody/`):
- `00-PRZED-kod-sprzed-naprawy-token-niewidoczny.png` — zrzut zrobiony PRZED napisaniem
  jednej linii naprawy, na dzisiejszym kodzie: w oknie odroczenia widać tylko jednostkę
  kontrolną, świeżo wybudowanej NIE MA (token nie istnieje w scenie).
- `01-PRZED-scenariusz-odtworzony-token-niewidoczny.png` — ten sam scenariusz odtworzony
  po naprawie ścieżką filtrującą; plik jest BAJT W BAJT identyczny z `00-...` (10853 B),
  co dowodzi, że naprawa nie zmieniła punktu odniesienia.
- `02-PO-okno-odroczenia-token-przyciemniony.png` — obie jednostki widoczne, prawa
  (odroczona) wyraźnie przygaszona, sylwetka i kolor właściciela nadal rozpoznawalne.
- `03-PO-FLUSH-token-pelna-widocznosc.png` — po flushu oba żetony identycznie pełne.

BLOKADY: brak.

RUNDY: 2/5.

NASTĘPNY KROK: Evaluator (Opus 5, effort high) — weryfikacja allowlisty, diffu, dowodów
i pełnej macierzy testów.

DEPLOY/PUSH: NIE WYKONANO
