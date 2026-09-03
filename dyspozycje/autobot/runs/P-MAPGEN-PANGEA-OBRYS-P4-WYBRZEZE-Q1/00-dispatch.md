TEMAT: P-MAPGEN-PANGEA-OBRYS-P4-WYBRZEZE-Q1
RUNDA: 1/5
DATA: 2026-09-03
DOMAIN: GAME
ŚCIEŻKA: gra/src/types/hex.ts (enum TerenBazowy), wszystkie miejsca porównujące ręcznie
`=== TerenBazowy.Morze` (142 wg reconu), `gra/src/units/setup.ts` (isWaterTerrain), dane JSON
(civ-matrix.json, wonders.json), testy
MODEL+EFFORT: claude-sonnet-5, effort high (duży, mechaniczny ale rozległy diff — 33+ plików,
wymaga starannej weryfikacji że żadne z 142 porównań nie było CELOWO wyłącznie o Morze)

WYZWALACZ (ECHO właściciela, 2026-09-03, odpowiedź na Pytanie 4 dokumentu
docs/decyzje/P-MAPGEN-PANGEA-OBRYS.md)
"Zmiana nazwy + przepięcie 142 porównań na isWaterTerrain()" — wybrana litera B z tabeli
Pytania 4 tego dokumentu.

RECON (nie powtarzaj — już wykonane, patrz docs/decyzje/P-MAPGEN-PANGEA-OBRYS.md, sekcja
"PYTANIE 4")
- `TerenBazowy.Wybrzeze` JEST wodą (`hex.ts:17`, od commitu `bed3ea1` "wybrzeze jako woda"),
  ale nazwa myli — stąd błąd metryki Pangei, która policzyła Wybrzeże jako ląd.
- Identyfikator TS `TerenBazowy.Wybrzeze`: 190 wystąpień w 33 plikach (kompilator pilnuje).
- Literały stringowe `'wybrzeze'` w gra/src: 7 miejsc (ai.ts:2627, clusters.ts:331,
  battleScene.ts:538, battle-terrain.ts:253/315/337, hex.ts:17) — kompilator NIE pilnuje,
  wysokie ryzyko cichego pominięcia.
- Dane JSON: civ-matrix.json (34 wystąpienia), wonders.json (4 wystąpienia).
- Migracja zapisów gry: ZERO — teren nie jest przechowywany w save (`save.ts:35-36`, mapa
  regenerowana deterministycznie z seed).
- Helper `isWaterTerrain()` już istnieje w `gra/src/units/setup.ts` — 142 ręczne porównania
  `=== TerenBazowy.Morze` w całym repo mają zostać przepięte na wołanie tego helpera, ZAMIAST
  ręcznego porównania (który dziś pomija Wybrzeże jako wodę w niektórych miejscach — dokładnie
  ten błąd ujawniła metryka Pangei).

GOAL
1. Zmień nazwę identyfikatora `TerenBazowy.Wybrzeze` → `TerenBazowy.PlytkieMorze` (lub zbliżoną,
   uzasadnij dokładną formę w raporcie), wartość stringową na `'plytkie_morze'`. Zaktualizuj
   WSZYSTKIE 190 wystąpień identyfikatora TS + 7 literałów stringowych + dane JSON
   (civ-matrix.json, wonders.json) + etykiety UI, jeśli istnieją.
2. Przejrzyj WSZYSTKIE 142 ręczne porównania `=== TerenBazowy.Morze` w całym `gra/src` —
   dla KAŻDEGO ustal, czy semantycznie chodzi o "cała woda" (Morze+Wybrzeże/PłytkieMorze) czy
   CELOWO wyłącznie o głęboką wodę Morza (np. render głębi, efekty wizualne specyficzne dla
   pełnego morza). Przepnij na `isWaterTerrain()` WYŁĄCZNIE te pierwsze — dla drugich (jeśli
   jakieś faktycznie istnieją) zostaw porównanie z `Morze` i udokumentuj dlaczego w komentarzu.
   Nie zamieniaj hurtowo bez przeglądu każdego miejsca.
3. Zero zmian w `gra/src/map/generator.ts` (recon dokumentu: to wymóg wdrożenia, generator ma
   pozostać nietknięty).
4. Nie psuj innych wołających `groupLandMassKeys` — sprawdź wszystkie call-site.

KRYTERIA KOŃCA (binarne)
1. `tsc --noEmit` czysty po zmianie nazwy identyfikatora we wszystkich 190 miejscach.
2. Test: żywe uruchomienie `node tools/map-gen-regression-test.cjs` — determinizm A=B PASS,
   trasy bez ujścia, główne rzeki, sieć rzek bez regresji względem stanu przed zmianą.
3. Test: sekcja "Pangea nieregularna" (ten sam plik lub dedykowany) — z NOWĄ, poprawną metryką
   (PłytkieMorze liczone jako woda, nie ląd) — potwierdź że `coastRatio` dla 5 referencyjnych
   seedów wynosi teraz 5,29–5,89 (wartości z reconu dokumentu), nie 3,77–3,83.
4. Grep potwierdzający zero pozostałych literałów `'wybrzeze'` (poza ewentualnym,
   udokumentowanym miejscem kompatybilności wstecznej, jeśli recon wykaże taką potrzebę —
   nie zakładaj, sprawdź).
5. Zero regresji na istniejących testach terenu/mapy/bitwy (znajdź reconem, m.in.
   `fair-play-grid-test.cjs`, `relief-grid-coverage-test.cjs`, testy dotykające
   `battle-terrain.ts`/`battleScene.ts`).
6. 5 bramek referencyjnych (logic-test, tech-tree-test, research-test, unit-replace-test,
   combat-test) zielone.

ALLOWLISTA (nic poza tym)
- gra/src/types/hex.ts — enum TerenBazowy.
- Wszystkie pliki `gra/src/**` zawierające `TerenBazowy.Wybrzeze` lub literał `'wybrzeze'`
  (33+ plików wg reconu) — WYŁĄCZNIE zmiana nazwy/przepięcie na isWaterTerrain(), zero innych
  zmian logiki w tych plikach.
- gra/data/civ-matrix.json, gra/data/wonders.json — WYŁĄCZNIE wystąpienia 'wybrzeze'.
- Pliki testów w gra/tools/*-test.cjs dotykające TerenBazowy.Wybrzeze.
Zakazane bezwzględnie: pliki z sekretami, docs/decyzje/<ID>.md (poza aktualizacją statusu w
P-MAPGEN-PANGEA-OBRYS.md, jeśli chcesz odnotować wykonanie — dozwolone, to nie jest ID tego
tematu), .git/**, dyspozycje/WERSJE.md, gra-robocza/ROBOCZA-MANIFEST.json, playbook.json,
zmiana `gra/src/map/generator.ts`, zmiana logiki innej niż nazwa/przepięcie porównań.

IZOLACJA
worktree /home/user/wt-mapgen-pangea-wybrzeze, gałąź
autobot/P-MAPGEN-PANGEA-OBRYS-P4-WYBRZEZE-Q1, baza jawnie: origin/main (najnowszy commit na
moment dispatchu).
Zakaz npm run build/dev w gra/ (export-data nadpisuje JSON) — dozwolona komenda:
node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-dist-pangea-wybrzeze --emptyOutDir
Jedyna dozwolona kompilacja to node ./node_modules/typescript/bin/tsc --noEmit; bramki
referencyjne node tools/*-test.cjs nie są nim objęte.

REGUŁA PRZECIW SAMOOSZUKIWANIU (ANTY-HALUCYNACYJNA)
Zakaz uznania kryterium 2/miejsce "142 porównania" za spełnione bez faktycznego przejrzenia
KAŻDEGO z nich pojedynczo (grep + odczyt kontekstu) — nie zakładać że wszystkie znaczą to samo.
Zakaz uznania kryterium 3 (coastRatio) za spełnione bez żywego przeliczenia na tych samych 5
seedach referencyjnych z dokumentu decyzji, porównanego z wartościami tam podanymi.

PROCEDURA NAPRAWCZA PRZY FAIL
Evaluator wskazuje jeden konkretny defekt i poprawkę; runda N+1 idzie na TYM SAMYM ID i TEJ
SAMEJ gałęzi, nie na nowej od zera. Po 5 rundach: LIMIT-5-EXCEEDED.

GRANICE
Operator/Evaluator/Obrona nie integrują, nie deployują, nie pushują. Final Control i
integracja (allowlist-only, per plik i per hunk) dzieją się poza worktree Operatora, ręką
orkiestratora.

OBIEG
Operator (Sonnet 5, effort high) → Evaluator (Sonnet 5, effort high) → Operator (obrona, jeśli
zarzuty niepuste) → Final Control (Sonnet 5) → integracja orkiestratora → READY_FOR_DEPLOY.
