# R-MAPA-ETYKIETA-STOLICY-NAZWA-MIASTA-Q1 — Evaluator, runda 4

STATUS: OCENA WYDANA — 1 ZARZUT (werdykt PASS/FAIL należy do Final Control, §3c)
DOMAIN: GAME
TEMAT: R-MAPA-ETYKIETA-STOLICY-NAZWA-MIASTA-Q1
MODEL+EFFORT: Opus 5, effort high (Evaluator)
GOAL: ocena pracy Operatora rundy 4 (`60f5ba95`, baza `53b156c5`) wobec ratyfikacji R4-1
i checklisty §16a — stan FAKTYCZNY, bramki uruchomione samodzielnie, własny pomiar
w żywym Chromium i własny zrzut, nie streszczenie cudzego.

## WERYFIKACJA FAKTYCZNA (co uruchomiłem sam)

- Diff `53b156c5..60f5ba95`: 10 plików, wszystkie w allowliście rundy 4
  (`cityMapStatChip.ts`, `mapa-etykieta-stolicy-test.cjs`, `runs/<ID>/**`).
  `git diff --check` czysty, brak sekretów, brak usunięć poza tymi, których żądała
  ratyfikacja (nota G6 → asercja). `display-names.ts`, `cluster-spawn.ts`,
  `city-names-pool.ts`, `civ-names.ts`, `render/cities.ts`, dane JSON, `main.ts` nietknięte
  → kryterium 5 (praca rund 2–3 utrzymana) spełnione.
- `tsc --noEmit` zielone. Bramki uruchomione przeze mnie: `mapa-etykieta-stolicy` 47/0,
  `display-names` 27/0, `city-names-pool` 12/0, `city-names-pools` 6/0, `civ-names` 6/0,
  `rozmiar-label` 13/0, `city-map-badge` 62/0, `city-badge-growth-percent` 38/0,
  `danina-podatek-nazwa` 15/0, `diplomacy-display` 35/0, `unit-recruit-nazwa` 17/0,
  `cluster-start-q2-smoke` 16/0. Referencyjne: logic 213/213, tech-tree 19/19,
  research 33/33, unit-replace 13/13, **combat 6/6**. Czerwone z parytetem:
  `flaga-mp-nie-gasnie` 31/1, `miasta-panstwa-wylaczone` 52/3 — poziom rundy 3.
- Nietautologiczność sprawdzona przeze mnie: baza 305 → 260 daje 45/2 (czerwienieją G6 i G7);
  mutacja cofnięta, drzewo czyste.
- **Własny pomiar (żywy Chromium, prawdziwy `makeCityMapBadgeSprite` + prawdziwy
  `formatCityGrowthPercentLabel`)**: `UMGUNGUNDLOVU` = 213,877 px (`700 22px Georgia`).
  Budżety i przycięcia — baza 260: 241/221/176 px → 0, 0, **1/15**; baza 305: 286/266/221 px
  → **0, 0, 0/15**. Odczyt z geometrii sprite'a: **0/45 przyciętych**. Formatter: `−100`
  daje `−100%` (41 px), nie `−100,0%` — korekta Operatora jest trafna; `−99,9%` = 45 px,
  `−100,5%` i `−123,4%` = 52 px, więc zapas z G7 jest realny. Zakres `computeGrowthPercentV85`
  (racje ≥ −10, `zaopatrzenie` −1/surowiec) nie zbliża się do −100 → 305 ma zapas z naddatkiem.
- **Własny zrzut z żywego Chromium**, nowa partia z prawdziwego kreatora (Zulusi, Epoka Brązu),
  inny seed niż u Operatora: `dowody/eval-r4-stolica-gracza-zblizenie.png` — stolica GRACZA
  z koroną, `UMGUNGUNDLOVU` w całości bez wielokropka, `5,5%` (WZROST%), glif produkcji,
  populacja; `dowody/eval-r4-uklad-gesty.png` — trzy miasta-państwa w minimalnej odległości
  5 heksów, żadna plakietka nie dotyka drugiej. Build: `node_modules/vite/bin/vite.js`,
  `--outDir /tmp/civ-eval-r4-dist` (C-001 dochowane, także w skrypcie Operatora).

## ZARZUTY

**1. `gra/src/render/cityMapStatChip.ts:124-125`, `:150-158` (i pole „Margines do sufitu
tekstury" w `07-operator-runda-4.md`) — margines do sufitu tekstury i wynikający z niego
sufit bazy są zawyżone o 148 px, bo pomiar pominął slot tarczy obrony i nazwy przekraczające
budżet.** Komentarz twierdzi: „najszersza plakietka przy bazie 305 to 426 px CSS […] 1704 px
tekstury, margines 344 px; sufit przepuszcza bazę do 391" oraz „nazwa przycięta do
`CITY_NAME_BUDGET_BASE` + wszystkie sloty". Mój pomiar prawdziwym `makeCityMapBadgeSprite`:
426 px powstaje przy `defenseTier: 0` i nazwie NIEprzyciętej; ta sama stolica z tarczą obrony
ma **456 px**, a najszersza plakietka osiągalna na realnych danych (nazwa z pul dłuższa niż
budżet, np. „Kartagena Hiszpańska", pełen komplet slotów) ma **463 px** = dokładnie `BASE + 158`.
Stąd tekstura **1852 px**, margines **196 px** (nie 344) i sufit bazy **354** (nie 391).
Znaczenie: (a) kryterium 4 ratyfikacji żądało tej liczby wprost i podana odpowiedź jest błędna;
(b) liczba 391 jest w komentarzu przy `BADGE_MAX_TOTAL_SCALE` jako zapas na przyszłe zmiany —
baza 391 dałaby `(391+158)×4 = 2196 px > 2048`, czyli przekroczenie gwarantowanego w WebGL2
`MAX_TEXTURE_SIZE`; (c) komentarz przeczy asercji G5 z tego samego commita, która używa
poprawnego najgorszego przypadku `SLOTY_POZA_NAZWA_PX = 158` (sufit 354). Ubocznie ta sama
zaniżona szerokość weszła do liczby kolizji (najszersza plakietka 4,62 j. zamiast ≈ 5,02 j.) —
wniosek 0 kolizji przy odstępie 8,66 j. się nie zmienia. **Poprawka:** wpisać w oba komentarze
i w raport zmierzony najgorszy przypadek (463 px CSS, 1852 px tekstury, margines 196 px,
sufit bazy 354) i usunąć z opisu 426 px sformułowanie „wszystkie sloty". Wartość 305 zostaje —
zarzut nie dotyczy jej doboru, tylko udokumentowanego zapasu. **Kod działa poprawnie przy 305**
(1852 < 2048), więc to nie jest defekt runtime.

## PUNKTY §16a BEZ ZASTRZEŻEŃ

1 allowlista ✓ · 2 granice §9 ✓ (brak `npm run build`/`dev`, brak `git add -A`, dane JSON
i `docs/decyzje/**` nietknięte) · 3 bramki uruchomione niezależnie ✓ · 4 brak wpływu na
save/load i na parytet gracz/AI/MP (slot WZROST% był i pozostaje wyłącznie po stronie gracza,
`render/cities.ts:820`) · 5 brak sekretów · 6 brak zbędnych usunięć · 7 brak kolizji z tematami
równoległymi · 8 zrzut z żywej przeglądarki + mutacja czerwieniąca bramkę ✓ · 9 GOAL raportu
zgodny z R4-1 dispatchu, kryteria 1–7 nazwane tak samo · 10 temat niedzielony.

UWAGA (nie zarzut): raport podaje „combat OK" zamiast liczby wymaganej kryterium 6 —
sprawdziłem, jest 6/6.

BLOKADY: brak.
RUNDY: 4/5
NASTĘPNY KROK: Obrona Operatora do zarzutu 1, potem Final Control (Sonnet 5, effort high).
DEPLOY/PUSH: NIE WYKONANO
