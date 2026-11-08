# AutoBot Operator — ograniczenie churnu ikon w synchronizacji armii

**Status:** kandydat operatora gotowy do niezależnej kontroli; niecommitowany, nieintegrowany i niewdrożony.

## Problem i zmiana

Audyt wskazał, że każda synchronizacja `UnitRenderer` usuwała i tworzyła ponownie tekstury Canvas dla badge’a liczebności stosu i ikon głodu/deficytu złota, także gdy ich widoczny stan pozostawał taki sam. Zasoby były zwalniane, więc sam wzorzec nie dowodził wycieku, ale powodował zbędne alokacje, uploady tekstur i pracę GC.

W `gra/src/render/units.ts` ikony są teraz zachowywane, gdy reprezentant, wartość badge’a, stan przyczyn oraz relacja sparowanych ikon się nie zmieniły. Tekstura powstaje ponownie przy zmianie liczebności, przyczyny lub układu pojedyncza/para. Ukrycie reprezentanta zwalnia nakładki. Po przebudowie modelu żetonu stary sprite jest odpinany i wymieniany, aby nie pozostał na poprzednim obiekcie. Test potwierdza tożsamość sprite’ów oraz liczbę wywołań tworzących canvasy.

## Weryfikacja

- `node tools/unit-renderer-overlay-sync-test.cjs` — **17/17**. Obejmuje stan niezmieniony (0 nowych canvasów), zmianę liczby (tylko badge), dodanie/usunięcie przyczyny, ukrycie/pokazanie i podmianę modelu żetonu.
- `node tools/web-memory-leaks-test.cjs` — **55/55**.
- `npm run typecheck` — PASS.
- `npm run build` — PASS, Vite zbudował 915 modułów.
- `git diff --check` — PASS.

## Zakres dowodu i ryzyko

To potwierdza eliminację ponownego tworzenia tych overlayów w niezmienionym stanie oraz zachowanie ich aktualizacji. Nie jest to test 100 tur ani pomiar RAM/VRAM na komputerze gracza. Nie dowodzi, że ten churn odpowiada za wzrost do 2 GB lub że sam usunie wszystkie lagi. Po niezależnym przeglądzie należy sprawdzić ten kandydat w teście długiej gry i porównać liczniki tekstur oraz czas `syncUnitsRender()`.

## Pliki zmienione

- `gra/src/render/units.ts`
- `gra/tools/unit-renderer-overlay-sync-test.cjs`
