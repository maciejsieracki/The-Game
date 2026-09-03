TEMAT: P-MGLA-ODKRYCIE-WZDLUZ-SCIEZKI-Q1
RUNDA: 1/5
DATA: 2026-09-03
DOMAIN: GAME
ŚCIEŻKA: gra/src/game/visibility.ts (nowa funkcja pomocnicza), gra/src/main.ts
(zakończenie animacji ruchu ~31363-31424, applyMarchSegmentInstant ~21654-21711,
refreshFog ~9578-9616)
MODEL+EFFORT: claude-sonnet-5, effort high (bug deterministyczny, dobrze
zlokalizowany, ale wymaga starannego dopięcia w silniku ruchu)

WYZWALACZ (dosłownie od właściciela, zrzut ekranu mapy z częściowo nieodkrytym lasem)
"Czasem, zwłaszcza przy starszych komputerach, jeżeli jednostka szybko się porusza, na
przykład Scout, na duże tereny, to pomimo tego, że przeszła przez jakiś teren, nie
odkrywa go i pozostaje nieodkryty. Tak jakby w ogóle tam nie było, a przecież przez
niego przechodziła." + doprecyzowanie: "Tu chodzi chyba o jakieś renderowanie, że system
za każdym razem sprawdza każdą klatkę, a jeżeli jest opóźnienie, to po prostu nie
zaznacza odkrytego terenu."

RECON (nie powtarzaj — już wykonane przez orkiestratora tej sesji, subagent Explore)
- Hipoteza właściciela o klatkach/wydajności NIE POTWIERDZONA — przyczyna jest
  DETERMINISTYCZNA, niezależna od FPS/sprzętu.
- `computeVisible`/`computeVisibleAt` (`gra/src/game/visibility.ts:64-139`) liczą
  widoczność WYŁĄCZNIE z aktualnej pozycji `unit.q, unit.r` w promieniu `sight` — brak
  jakiegokolwiek pojęcia "ścieżki".
- `currentVisible()` (`main.ts:9235-9252`) — to samo, iteruje po BIEŻĄCYCH `u.q, u.r`.
- `refreshFog()` (`main.ts:9578-9616`) — jedyne miejsce wołające `addExplored(explored,
  vis)` (linia 9583) z `vis = currentVisible()`.
- `startAnimatedMove` (`main.ts:21501-21557`) — animacja wieloheksowa przesuwa WYŁĄCZNIE
  wizualną pozycję tokena (`unitRenderer.setTokenWorldPosition`), dane logiczne `u.q`/
  `u.r` NIE zmieniają się przez całą animację.
- `renderLoop` (`main.ts:31334-31495`): gałąź "w trakcie" (31474-31494) — tylko wizualny
  ruch tokena, klatka po klatce, ZERO wywołań fog reveal. Gałąź "koniec animacji"
  (31363-31424) — DOPIERO TU, RAZ, `su.q = destQ; su.r = destR` (31380-31381), zaraz
  potem `refreshFog()` (31424) — widoczność liczona WYŁĄCZNIE z pozycji KOŃCOWEJ.
- Wniosek: przez CAŁY wieloheksowy marsz fog-of-war nie odświeża się ani razu. Heks
  pośredni w zasięgu widzenia W TRAKCIE przejścia, ale poza zasięgiem widzenia z pozycji
  KOŃCOWEJ (typowe dla Zwiadowcy: duży `ruch` > `sight`, marsz w linii) — NIGDY nie
  zostaje odkryty. Efekt 100% powtarzalny, zależny od stosunku długości ścieżki do
  promienia widzenia, NIE od wydajności komputera.
- `anim.t += dt / ANIM_SEG_DUR` z pętlą `while` (31353-31359) poprawnie obsługuje
  overshooting klatek — throttling/pomijanie klatek NIE jest przyczyną (obalona
  hipoteza właściciela o mechaniźmie, trafna obserwacja samego objawu).
- Teren (las/góry) NIE ogranicza dziś promienia widzenia w żaden sposób
  (`computeVisible`/`computeVisibleAt` to czysty promień heksowy) — to nie jest
  zamierzone zachowanie tłumaczące zrzut.
- ISTNIEJĄCY WZORZEC do naśladowania: `checkVillageRewardsAlongPath` (`main.ts:22006`) i
  `checkBarbCampDestructionAlongPath` (`main.ts:22054`) już poprawnie iterują po
  `anim.pathHexes`/`result.movePath` PO zakończeniu animacji — ten sam wzorzec "przetwórz
  wszystkie heksy ścieżki" ma zostać zastosowany do fog reveal.

GOAL
1. Nowa funkcja pomocnicza w `gra/src/game/visibility.ts` (np.
   `computeVisibleAlongPath(pathHexes, map, sight)`) zwracająca UNIĘ widoczności ze
   WSZYSTKICH heksów ścieżki ruchu (nie tylko z punktu końcowego) — czysta funkcja, bez
   side-effectów, budowana na istniejącym `computeVisibleAt`.
2. W miejscu zakończenia animowanego ruchu wieloheksowego (`main.ts` ok. 31363-31424) —
   PRZED lub W TRAKCIE wołania `refreshFog()`, dołóż widoczność policzoną wzdłuż CAŁEJ
   przebytej ścieżki (`anim.pathHexes`/analogiczne pole — potwierdź dokładną nazwę
   reconem, użyj tego samego źródła co `checkVillageRewardsAlongPath`), nie tylko z
   pozycji końcowej.
3. To samo dla `applyMarchSegmentInstant` (`main.ts` ok. 21654-21711) — ścieżka
   pokonywana BEZ animacji (np. przy przewijaniu tury/instant move) też musi odkrywać
   WSZYSTKIE mijane heksy, nie tylko końcowy.
4. `refreshFog()` (main.ts:9578) — rozważ rozszerzenie o opcjonalny parametr (np.
   `extraVisible?: ReadonlySet<string>`) do wstrzyknięcia dodatkowej widoczności ze
   ścieżki przed `addExplored`, JEŚLI to najczystsze podpięcie; jeśli recon Operatora
   wskaże lepsze miejsce integracji bez zmiany sygnatury `refreshFog`, wybierz je i
   uzasadnij w raporcie.
5. Zero zmian w zasięgu widzenia (`sight`) jednostek, w logice ostatecznej widoczności z
   pozycji spoczynkowej (ma działać dokładnie jak dziś — DODATKOWO do tego, nie zamiast),
   ani w animacji wizualnej ruchu tokena — WYŁĄCZNIE dodanie odkrywania wzdłuż ścieżki.
6. Wydajność: iteracja po heksach ścieżki ma być tania (typowa ścieżka to kilka-kilkanaście
   heksów) — bez zauważalnego wpływu na FPS, zwłaszcza że to jednorazowe obliczenie PO
   zakończeniu ruchu, nie per-klatka.

KRYTERIA KOŃCA (binarne)
1. Test: Zwiadowca (duży `ruch`, mały `sight`) porusza się w linii prostej przez N heksów
   w jednym ruchu — WSZYSTKIE heksy leżące w promieniu `sight` OD KTÓREGOKOLWIEK punktu
   ścieżki (nie tylko od punktu końcowego) są oznaczone jako odkryte (`explored`) po
   zakończeniu ruchu.
2. Ten sam test dla ruchu wykonanego BEZ animacji (instant/przewijanie tury) —
   `applyMarchSegmentInstant` — te same heksy odkryte.
3. Regresja: widoczność z pozycji KOŃCOWEJ (dzisiejsze zachowanie) pozostaje bez zmian —
   test PRZED i PO pokazuje IDENTYCZNY zestaw heksów widocznych z samej końcowej pozycji,
   plus DODATKOWO heksy ze ścieżki.
4. Żywy render w headless Chromium: Zwiadowca przechodzi przez duży obszar w jednej
   turze — teren na trasie widoczny jako odkryty (nie czarny/nieodkryty) po ruchu,
   porównanie zrzutu PRZED (bug odtworzony) i PO.
5. Zero regresji na istniejących testach widoczności/fog/ruchu (znajdź reconem, np.
   visibility-*-test.cjs, fog-*-test.cjs, movement-*-test.cjs w gra/tools/).
6. `tsc --noEmit` czysty, 5 bramek referencyjnych (logic-test, tech-tree-test,
   research-test, unit-replace-test, combat-test) zielone.

ALLOWLISTA (nic poza tym)
- gra/src/game/visibility.ts — nowa funkcja pomocnicza, bez zmiany istniejących
  `computeVisible`/`computeVisibleAt`.
- gra/src/main.ts — WYŁĄCZNIE: zakończenie animowanego ruchu (ok. 31363-31424),
  `applyMarchSegmentInstant` (ok. 21654-21711), `refreshFog()` (ok. 9578-9616, jeśli
  wymaga rozszerzenia sygnatury).
- Nowe lub rozszerzone testy w gra/tools/*-test.cjs.
Zakazane bezwzględnie: pliki z sekretami, docs/decyzje/<ID>.md, .git/**,
dyspozycje/WERSJE.md, gra-robocza/ROBOCZA-MANIFEST.json, playbook.json, zmiana `sight`
jednostek, zmiana animacji wizualnej ruchu tokena, zmiana logiki
`checkVillageRewardsAlongPath`/`checkBarbCampDestructionAlongPath` (tylko wzorzec do
naśladowania, nie do modyfikacji).

IZOLACJA
worktree /home/user/wt-mgla-odkrycie-sciezka, gałąź
autobot/P-MGLA-ODKRYCIE-WZDLUZ-SCIEZKI-Q1, baza jawnie: origin/main (najnowszy commit na
moment dispatchu).
Zakaz npm run build/dev w gra/ (export-data nadpisuje JSON) — dozwolona komenda:
node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist-mgla-sciezka --emptyOutDir
Jedyna dozwolona kompilacja to node ./node_modules/typescript/bin/tsc --noEmit; bramki
referencyjne node tools/*-test.cjs nie są nim objęte.

REGUŁA PRZECIW SAMOOSZUKIWANIU (ANTY-HALUCYNACYJNA)
Zakaz uznania kryterium 1 za spełnione bez żywego testu z KONKRETNYM scenariuszem
(jednostka o znanym `ruch`/`sight`, znana mapa, znana ścieżka) i JAWNYM porównaniem
zbioru odkrytych heksów PRZED i PO — nie ogólnikowe "działa". Zakaz uznania kryterium 3
(regresja widoczności końcowej) za spełnione bez faktycznego testu na tej samej fixture
sprzed zmiany — nie zakładać że dodanie ścieżki "na pewno nie psuje" istniejącego
zachowania.

PROCEDURA NAPRAWCZA PRZY FAIL
Evaluator wskazuje jeden konkretny defekt i poprawkę; runda N+1 idzie na TYM SAMYM ID i
TEJ SAMEJ gałęzi, nie na nowej od zera. Po 5 rundach: LIMIT-5-EXCEEDED.

GRANICE
Operator/Evaluator/Obrona nie integrują, nie deployują, nie pushują. Final Control i
integracja (allowlist-only, per plik i per hunk) dzieją się poza worktree Operatora,
ręką orkiestratora.

OBIEG
Operator (Sonnet 5, effort high) → Evaluator (Sonnet 5, effort high) → Operator (obrona,
jeśli zarzuty niepuste) → Final Control (Sonnet 5) → integracja orkiestratora →
READY_FOR_DEPLOY.
