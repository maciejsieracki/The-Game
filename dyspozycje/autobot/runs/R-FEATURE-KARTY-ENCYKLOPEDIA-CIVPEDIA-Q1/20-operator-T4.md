STATUS: PASS
TEMAT: R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1, podtemat T4 „MIGRACJA-KARTA-JEDNOSTKI-MAPA"
GOAL: `unitInfoCard.ts` (`buildUnitInfoCard`/`showUnitInfoCardDialog`) zaczyna budować treść
przez `unitAdapter.ts` i renderować przez wspólny `renderer.ts`, zamiast własnego
DOM-buildera — bez zmiany publicznej sygnatury, bez utraty 3D-podglądu jednostki.

## Co zostało zrobione

1. `gra/src/ui/entityCards/unitAdapter.ts` — wypełniony prawdziwą treścią, czytając
   `units.json` 1:1 jak dawny `unitInfoCard.ts::buildUnitInfoCard`: sekcje „Statystyki
   bojowe" (Atak/Obrona/HP/Ruch/Zasięg [emphasize]/Atak dystansowy [emphasize]/Pancerz/
   Przebicie), „Koszty i utrzymanie" (koszt Pieniądza, koszt surowca × ilość, utrzymanie
   Pieniądza/turę, utrzymanie surowca/turę × ilość, Ludność, Żywność/turę), „Wymagania i
   kontry" (Technologia/Kultura/Zastępuje + **„Kontry"** — czyta `counters.json`
   bezpośrednio, samodzielnie jak `technologyAdapter.ts` czyta swoje pliki, 1:1 z dawnym
   `collectCounters()`), „Statusy" (status wymogu technologii jako `section.badges`).
   Medalion domyślny: `unitInfographicSvg()` (ten sam SVG co dawny nagłówek przed
   zamontowaniem 3D) — **nie** `{kind:'unit3d'}` w samym adapterze, bo `ownerColor`/
   fallback zależą od KONKRETNEGO wywołania (opcje wołającego), nie od danych jednostki
   — dokładnie ten sam podział odpowiedzialności co nagłówek karty technologii w T3
   (adapter = treść niezależna od trybu otwarcia, wołający dopełnia resztę).
2. `gra/src/ui/unitInfoCard.ts` — `buildUnitInfoCard(unit, data, options)` (sygnatura BEZ
   ZMIAN): woła `unitAdapter(unit, {})`, nadpisuje `medallion` na
   `{kind:'unit3d', mount: (slot) => mountUnitMiniPreview(slot, unit, ownerColor,
   fallbackMsg)}` i dopełnia sekcję „Statusy" o `options.statusLines`, potem
   `renderEntityCard(cardData)`. Zachowuje `dataset.unitName`/`dataset.unit3dHook` (parytet
   z markerami testowanymi string-matchem w innych testach) i dopisuje przycisk zamknięcia
   (✕) do `.entity-card-header` po zbudowaniu DOM (bo `renderer.ts` go nie rysuje — ten sam
   wzorzec co T3 dla `techDiscoveryNotice.ts`). Cała ścieżka owinięta w `try/catch`:
   wyjątek → `console.error` + fallback do **`_legacyBuildUnitInfoCard`** (stara
   implementacja przeniesiona 1:1 pod prywatną nazwą, zero zmian treści — wzorem
   `_legacyShowTechDiscoveryNotice` z T3). `showUnitInfoCardDialog` bez zmian logiki
   (nadal woła `buildUnitInfoCard` wewnątrz, ten sam backdrop/dismiss/`escapeOverlayStack`).
3. `ensureUnitInfoCardStyles()` (sygnatura bez zmian, wołana przez `main.ts` bez zmian)
   teraz wstrzykuje DODATKOWO `ENTITY_CARD_CSS` (reeksport `renderer.ts`) obok
   `UNIT_INFO_CARD_CSS`, plus kilka lokalnych nadpisań w `UNIT_INFO_CARD_CSS`
   dopasowujących canvas miniatury 3D do rozmiaru medalionu kontraktowego (34×34,
   `.entity-card-unit .entity-card-medallion` + `.unit-mini-canvas`/`.unit-mini-fallback`/
   `.unit-mini-loading`) — bez edycji `renderer.ts`.

## KRYTYCZNE — mechanizm 3D: kolejność mount() zweryfikowana

Przeczytany `entityCards/renderer.ts` (NIE zmieniony w tym kroku) — `renderEntityCard()`:
buduje `medallionEl`, robi `header.appendChild(medallionEl)`, `card.appendChild(header)`,
i DOPIERO na samym końcu funkcji, tuż przed `return card`, wywołuje
`data.medallion.mount(medallionEl)` (kod: `if (data.medallion.kind === 'unit3d') {
data.medallion.mount(medallionEl); }` z komentarzem w źródle potwierdzającym intencję:
„Musi być wywołane PO appendChild sekcji medalionu w DOM"). To dokładnie odtwarza
kolejność z dawnego `unitInfoCard.ts:150-162` (`commitSection()` PRZED
`mountUnitMiniPreview()`) — **renderer.ts nie wymagał poprawki**, kolejność była już
poprawna od T1/T1b.

Dodatkowo (bo dispatch żąda realnej weryfikacji, nie tylko czytania kodu): nowy test
`unit-info-card-entitycard-migration-test.cjs` stubuje `mountUnitMiniPreview` i rejestruje
`container.parentElement !== null` W MOMENCIE wywołania — asercja
„medalion JUŻ osadzony w nagłówku w momencie wywołania mount()" PRZESZŁA na prawdziwym
zbudowanym DOM (nie fixture). Zbadano też samą implementację 3D
(`gra/src/ui/unitMiniPreview.ts`): renderuje na WŁASNYM, odłączonym od dokumentu canvasie
WebGL (nie na przekazanym `container`), wynik rysuje na osobny `<canvas>` 2D i dopiero ten
gotowy canvas wstawia do `container` asynchronicznie (`requestAnimationFrame`) — więc
mechanizm w ogóle nie jest wrażliwy na to, czy `container` jest podłączony do
`document`, tylko na to, czy istnieje w chwili wywołania (zawsze istnieje, bo to ten sam
element co przekazany do `mount()`). Ryzyko z dispatch („cichy fail bez błędu w konsoli
gdy element odłączony") dotyczyłoby scenariusza gdyby `mount()` dostał element USUNIĘTY
z drzewka PO zbudowaniu, co się nie dzieje ani w starej, ani w nowej implementacji.

## Ograniczenie realnej weryfikacji WebGL (zgłoszone explicite, jak nakazuje dispatch)

To środowisko (headless/node, ten worktree) nie ma `gl`/`node-canvas`/przeglądarki z
realnym WebGL ani narzędzia do „uruchom grę + kliknij jednostkę na mapie + zrzut ekranu"
(`run` niedostępny w tej sesji subagenta). `gra/tools/smoke.cjs` ma fake WebGL2 context
(cały plik, wzorzec możliwy do reużycia), ale to smoke test CAŁEGO bootu gry na
zbudowanym `dist/index.html` — nie ma dedykowanego testu klikającego kartę jednostki.
Zamiast pełnego realnego renderu WebGL, zweryfikowano:
- że `mountUnitMiniPreview`/`buildUnitModel`/`renderer.domElement`-łańcuch pozostaje
  DOKŁADNIE tym samym kodem co przed T4 (zero zmian w `unitMiniPreview.ts`/
  `render/units.ts`) — `unit-info-card-contract-test.cjs` (istniejący, string-match na
  źródle) nadal przechodzi bez zmian;
- kolejność wywołania mount() względem osadzenia w DOM (opisane wyżej);
- że zwrócona przez `buildUnitInfoCard` karta jest DOKŁADNIE tym elementem, na którym
  `mount()` wykonał efekt uboczny (test: `medallion.textContent === 'STUB-3D-PREVIEW'`
  po zbudowaniu karty — potwierdza że mount dostaje żywy element z finalnego drzewka,
  nie kopię/odłączony fragment).
Właściciel, jeśli chce realnego zrzutu ekranu z klikniętej jednostki na mapie w
przeglądarce, powinien to zlecić osobno (np. przez `run` w sesji z takim narzędziem) —
poza możliwościami tego środowiska subagenta.

## Znane, świadome delty (jak nakazuje dispatch — analogia do T3)

- **„Kontry"**: kontrakt `EntityCardRow.badge` (T1b) niesie JEDEN badge na wiersz, nie
  listę pigułek pod jednym wierszem (jak dawny `appendBadgeRow()`). Zamiast rozszerzać
  `types.ts`/`renderer.ts` (poza allowlistą T4), wartości kontr trafiają jako pojedynczy
  wiersz `{label:'Kontry', value: 'Cel: Bonus, Cel: Bonus, ...'}` — treść identyczna (te
  same pary cel/bonus z `counters.json`), układ inny (brak osobnych pigułek per kontra).
  Zweryfikowane testem (`unit-info-card-entitycard-migration-test.cjs`, sekcja „Kontry"):
  wszystkie wartości z `counters.json` dla realnej jednostki obecne w treści karty.
- Medalion 3D mieści się teraz w małym okrągłym slocie nagłówka (34×34px,
  `.entity-card-medallion`, kontrakt T1/T1b wspólny dla 4 kinds), NIE w osobnej dużej
  sekcji „Model 3D" (150px wysokości) jak dawniej — to zamierzony kształt kontraktu
  (medalion = mały nagłówkowy podgląd), nie regresja T4. Lokalne nadpisania CSS w
  `unitInfoCard.ts` dopasowują canvas/fallback do rozmiaru slotu, ale wizualnie miniatura
  jest teraz mniejsza niż przed T4 — świadomy kompromis wynikający z kontraktu T1
  ograniczonego allowlistą (zero zmian `types.ts`/`renderer.ts`).
- Super-jednostka: dawny osobny badge obok tytułu (`unit-info-card-super-badge`) zastąpiony
  ogólnym `EntityCardData.statusBadges` (`renderer.ts` renderuje go już identycznie obok
  `<h2>`) — informacja zachowana, styl inny (brak dedykowanego złotego tła), bo
  `statusBadges` jest generycznym mechanizmem współdzielonym z pozostałymi 3 kinds.

## Znany problem testów odziedziczony po T3 (zgłoszony explicite, nie przemilczany)

`unit-info-card-contract-test.cjs`/`unit-info-card-wiring-test.cjs`/
`unit-info-card-army-interaction-test.cjs` weryfikują TYLKO string-match na źródle
(`cardSource.includes(...)`) — nie budują ani nie renderują realnego DOM nowej ścieżki,
więc **nie testują aktywnej ścieżki** wprowadzonej w T4 (dokładnie ten sam problem co
`P-TECH-CARD-TEST-NIE-TESTUJE-AKTYWNEJ-SCIEZKI-Q1` z T3). Nowy
`unit-info-card-entitycard-migration-test.cjs` (26 asercji, bunduje PRAWDZIWY
`unitInfoCard.ts` przez esbuild+jsdom, wzorem `entity-card-contract-test.cjs`) jest
PIERWSZYM testem który faktycznie renderuje i sprawdza aktywną ścieżkę T4 na realnych
danych z `units.json`/`counters.json` — ale sam nie naprawia trzech istniejących
string-match testów (poza allowlistą T4 do zmiany ich zakresu; nie dotykałem ich treści,
tylko potwierdziłem że nadal przechodzą).

## ZMIANY/COMMIT

Pliki zmienione (poza tym raportem):
- `gra/src/ui/entityCards/unitAdapter.ts` (pełna treść zamiast szkieletu T1)
- `gra/src/ui/unitInfoCard.ts` (nowa ścieżka T4 + fallback prywatny `_legacyBuildUnitInfoCard`
  + wstrzyknięcie `ENTITY_CARD_CSS` w `ensureUnitInfoCardStyles()`)
- `gra/tools/unit-info-card-entitycard-migration-test.cjs` (nowy test, 26 asercji)
- `gra/tools/.stubs/unit-info-card-migration-unitMiniPreview-stub.ts` (nowy stub prywatny)

Zero zmian w: `main.ts`, `cityPanel.ts`, `entityCards/{types,renderer,registry,slug}.ts`
— potwierdzone `git diff --stat` (puste) dla tych 6 plików. `main.ts:18799` (jedyny
wołający `showUnitInfoCardDialog`) bez zmian. Commit lokalny na branchu
`autobot/R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1` (SHA — patrz `git log -1` po commicie
tego raportu razem z kodem).

## TESTY

- `cd gra && npx tsc --noEmit` → czysto poza tym samym pre-istniejącym błędem
  konfiguracyjnym co w T3 (`tsconfig.json(15,5): TS5101 baseUrl deprecated`, niezwiązany
  z T4).
- `node gra/tools/unit-info-card-contract-test.cjs` → **23 PASS, 0 FAIL** (bez zmian,
  string-match na źródle nadal trafia — patrz „Znany problem testów" wyżej).
- `node gra/tools/unit-info-card-wiring-test.cjs` → **6 PASS, 0 FAIL**.
- `node gra/tools/unit-info-card-army-interaction-test.cjs` → **7 PASS, 0 FAIL**.
- `node gra/tools/entity-card-contract-test.cjs` (T1, bunduje realny `renderer.ts`+
  `unitAdapter.ts` przez esbuild+jsdom) → **75 pass, 0 fail** (bez regresji na pozostałych
  3 kinds; `unit` kind nadal zwraca poprawny `EntityCardData`/DOM z NOWĄ treścią
  adaptera).
- `node gra/tools/unit-info-card-entitycard-migration-test.cjs` (NOWY, bunduje
  PRAWDZIWY `unitInfoCard.ts` przez esbuild+jsdom, real `units.json`/`counters.json`,
  stub WYŁĄCZNIE `mountUnitMiniPreview`) → **26 pass, 0 fail**: klasa/atrybuty
  `entity-card`/`data-entity-kind`, parytet `dataset.unitName`/`dataset.unit3dHook`,
  kolejność mount() (`hadParent===true`), efekt uboczny mount() na żywym elemencie karty,
  `statusLines` scalone z badge'em danych, przycisk zamknięcia dopisany, parytet „Kontry"
  (realna jednostka + realne `counters.json`), `showUnitInfoCardDialog` backdrop/dismiss,
  fallback do starej implementacji przy wymuszonym błędzie (`Jednostka: undefined` →
  `unitToSlug` rzuca → `console.error` + `_legacyBuildUnitInfoCard` zwraca kartę klasy
  `unit-info-card`, nie `entity-card`).
- Build weryfikacyjny: `node ./node_modules/vite/bin/vite.js build --outDir dist
  --emptyOutDir` (z `gra/`) → **✓ built in 30.67s**, 844 modułów, brak błędów.
  (Uwaga proceduralna identyczna jak w T3: worktree bez `node_modules` — tymczasowy
  symlink do `node_modules` głównego repo, zweryfikowany identyczny `package.json`/
  `package-lock.json` diff-em przed użyciem; symlink, `dist/` i tymczasowe pliki
  bundli esbuild [`.entity-card-contract-*`, `.unit-info-card-migration-*`] usunięte po
  weryfikacji — `git status` czyste poza plikami produkcyjnymi/testowymi tego kroku.)

## BLOKADY

Brak. Kontrakt T1/T1b (`EntityCardMedallion {kind:'unit3d', mount}`, sekcje/wiersze/
badges/statusBadges) w pełni wystarczył do migracji treści i 3D-podglądu bez potrzeby
dalszego rozszerzania `types.ts`/`renderer.ts`. `renderer.ts` już wywoływał
`medallion.mount()` w poprawnej kolejności (po `appendChild`) — nie wymagał poprawki.
Jedyne delty są udokumentowane wyżej jako świadome, akceptowalne redukcje kosmetyczne
(kontry bez osobnych pigułek, mniejszy medalion 3D, generyczny statusBadge zamiast
dedykowanego złotego), zgodne z kryterium T3 „treść równoważna, nie identyczny HTML".

## NASTĘPNY KROK

Evaluator → Final Control tego kroku (T4) → integracja orkiestratora. Rozważyć dla
właściciela (poza zakresem T4): (a) osobny temat na realną weryfikację WebGL w
przeglądarce (klik na jednostkę na mapie + zrzut ekranu) skoro to środowisko subagenta
nie ma takiego narzędzia; (b) osobny temat naprawiający string-match testy
`unit-info-card-*.cjs` (odziedziczony problem z T3) — teraz częściowo pokryty nowym
`unit-info-card-entitycard-migration-test.cjs`, ale trzy stare testy nadal nie renderują
aktywnej ścieżki.

DEPLOY/PUSH: NIE WYKONANO
