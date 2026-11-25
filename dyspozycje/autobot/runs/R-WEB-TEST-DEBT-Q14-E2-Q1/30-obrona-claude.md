# R-WEB-TEST-DEBT-Q14-E2-Q1 — obrona Operatora (runda 2/5)

STATUS: FAIL (kryterium binarne z dispatchu nadal niespełnione: z trzech testów przewidzianych do naprawy zielony jest jeden — autoimprove-irrigation-after-farms; earth-template i map-coast-buffer zostają czerwone z udokumentowaną przyczyną; odpowiedź na wszystkie 6 zarzutów wykonana, bramki zielone)
DOMAIN: GAME (testy) — bez zmian w gra/src, gra/data (mutacja w danych użyta wyłącznie do dowodu i cofnięta), bez zmian w gra/tools poza trzema plikami testów
TEMAT: R-WEB-TEST-DEBT-Q14-E2-Q1
GOAL: odpowiedzieć na 6 zarzutów Evaluatora; naprawić do obowiązującej reguły testy STARY-PIN z mutacją czerwoną; zweryfikować bramki
BAZA: kandydat 76dee827c (detached) → zmiany rundy 2 na tym SHA
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

1. PRZYJMUJĘ (naprawione częściowo, zgodnie z zarzutem nie w pełni). Operator r1 nie zmienił żadnego testu — poprawione teraz:
   - autoimprove-irrigation-after-farms-test.cjs: GREEN 42 OK / 0 FAIL (poprzednio 40 OK / 2 FAIL). Mutacja: `koszt_praca` irygacji 30 → 40 w `gra/data/terrain-improvements.json` (linia 40) daje FAIL „koszt irygacji = 1,5 x farma wg epoki 3 (160 = 1,5 x 80)” i 41 OK / 1 FAIL. Dane cofnięte (`git checkout`), `git status` czysty poza testami.
   - earth-template-test.cjs: płytkie morze (PlytkieMorze, woda wg decyzji P4) pominięte w liczniku „lądu poza szablonem”. Wynik: found 1668 → found 72 (wyłącznie `laka`). Test nadal CZERWONY (72 `laka` + Antarktyda, patrz zarzut 4 i 5). Nie jest to zielone, więc nie spełnia kryterium „naprawione zielone”.
   - map-coast-buffer-test.cjs: asercje „ląd w buforze brzegu” (dwa miejsca) liczą tylko suchy ląd (helper `borderDryLand`, bez Morze i PlytkieMorze). Sprawdzenie na 10 mapach (poniżej): suchy ląd w buforze = 0 na wszystkich. Test jako całość nadal CZERWONY (patrz zarzut 2 i pętla ziemia).

2. PRZYJMUJĘ. Pomiary r1 były pod obciążeniem (load 3,4–31,9). W tej rundzie:
   - autoimprove: 167 s przy load 7,8 → 9,2 (uptime przed i po).
   - earth-template: 351 s (5 min 51 s) przy load 7,6 → 6,0.
   - map-coast-buffer: przerwany `timeout 1200` (20 min) przy load 2–6; w logu brak podsumowania, przetworzone: pętla typów kontynenty/pangea/wyspy/ziemia (seed 1..2026 dla ziemi), reszta niewykonana.
   - Klasyfikacja ZA-CIĘŻKI dla pozostałych 7 testów NIE została potwierdzona na cichej maszynie. Oznaczam jako NIE-ZMIERZONO na cichej maszynie (potwierdzona w r1 tylko deposit-coast; map-coast w tej rundzie potwierdzone jako >20 min przy load 2–6).

3. PRZYJMUJĘ — NIE-ZMIERZONO. map-gen-regression i horse-resource-terrain nie były powtórzone w tej rundzie (koszt czasu: 20 min na test przy load 5–9, a limit rundy). Źródła SIGTERM (143) nie ustalono. Klasyfikacja tych dwóch pozostaje NIE-ZMIERZONO z r1.

4. PRZYJMUJĘ (bez rozstrzygnięcia przyczyn, z wyjątkiem wskazanych dowodów):
   - stranded-land 15/3 vs 16/2: NIE-ZMIERZONO przyczyna trzeciego FAIL („Mały wyspy seed=42”). Nie powtórzono.
   - world-density (monotonia low ≤ med ≤ high, linie 141–142): NIE-ZMIERZONO, czy zmiana gęstości jest celowa.
   - river-sea-buffer „bufor 2 hex (10 złych)”: NIE-ZMIERZONO przyczyna; potwierdzony tylko limit ujścia (MAIN_RIVER_COAST_MOUTH_MAX_GAP = 7 w `gra/src/map/gen-helpers.ts:5727`, zweryfikowane grep-em w tej rundzie).
   - earth-template Antarktyda (found 0 przy r=85): asercja używa wyłącznie `M.earthTemplateLandAt` (szablon maski, nie wygenerowana mapa; `gra/tools/earth-template-test.cjs:81`), więc przyczyną jest dane maski/szablonu, nie generator. Historia: `c94a78eaa` („bez Antarktydy”) przed `e9c4c965d` („przywroc Antarktyde”). Kto zmienił maskę między nimi — NIE-ZMIERZONO (nie zrobiono git log -S na pliku maski).
   - git log -S dla earth-template i map-coast-buffer (żądanie r1): `git log -S "terenBazowy === 'morze') continue"` i `-S findLandInMapBorder` zwracają tylko snapshot `f2df10f2a` („stan 2026-07-06”), bez historii przed nim. `git log -S plytkie_morze` w obu plikach zwraca `6be6be373` (P-MAPGEN-PANGEA-OBRYS-P4): w tych plikach zmienia `Wybrzeze` na `PlytkieMorze` i dotyczy `isWaterTerrain`. To jest źródło zmiany znaczenia płytkiej wody.

5. PRZYJMUJĘ — uzupełnienie dla kandydatów BŁĄD-GRY:
   - (1) Ziemia 72 `laka` poza maską: ODTWORZONE w tej rundzie: `M.generujSwiat(777,'standardowy','ziemia', genOpts)` (opcje jak w earth-template-test.cjs:33–38), wynik: found 72 w pętli `outsideLand` po wykluczeniu `morze`/`plytkie_morze`. Reguła: nagłówek testu „ląd tylko w masce mockupu” (decyzja A).
   - (2) Antarktyda: patrz zarzut 4 — odtworzenie: `earthTemplateLandAt(q, 85, W, H)` dla q ∈ [0,35·W; 0,65·W) = 0. Reguła: `e9c4c965d` „przywroc Antarktyde”.
   - (3) Ujścia 18 i 15 hex: z r1 (nie powtórzono w tej rundzie); reguła: `MAIN_RIVER_COAST_MOUTH_MAX_GAP = 7`, FALA 170, commit `853c0e320`.
   - (4) stranded-land 7/42: NIE-ZMIERZONO odtworzenie w tej rundzie (brak czasu); reguła z dispatchu (lądy na otwartym oceanie).
   - (5) world-density: NIE-ZMIERZONO odtworzenie i cytat reguły.

6. PRZYJMUJĘ — propozycja (NIE wdrożona w teście): nazwa zmiennej trybu skróconego dla testów ZA-CIĘŻKI: `CIV_TEST_MAPY_SKROCONE=1` — ogranicza listę map do seed 42 i typów `kontynenty`/`ziemia` (dla deposit-coast, relief-grid-coverage, river-grid-coverage, river-map-scale, map-continents-rivers, land-sea-ratio, horse-resource-terrain sekcja B). Zmiana kodu testów pod tę zmienną nie była w zakresie tej rundy.

## Zmiany w tej rundzie (pliki)

- `gra/tools/autoimprove-irrigation-after-farms-test.cjs`: koszt irygacji czytany wg epoki właściciela (`getImprovementMeta('irygacja', ERA)`, jak w `pickAutoImprovements` z `playerEra: ERA`); pin 60 (sprzed skalowania) zastąpiony regułą danych „1,5 × farma” (dane: irygacja 30, farma 20; po skalowaniu epoki 3: 120 = 1,5 × 80). Progi puli (362 NIE / 365 TAK) wyliczane z tej wartości. Asercje nie osłabione (dodano sprawdzenie stosunku, usunięto pin 60).
- `gra/tools/earth-template-test.cjs`: `outsideLand` pomija `plytkie_morze` (woda wg P4). Asercje Antarktydy i buforów bez zmian.
- `gra/tools/map-coast-buffer-test.cjs`: helper `borderDryLand` (liczy tylko suchy ląd w buforze brzegu), użyty w dwóch miejscach zamiast `M.findLandInMapBorder`. Komunikaty asercji doprecyzowane („suchy ląd”).

## Dowody

### autoimprove-irrigation-after-farms (zielony + mutacja czerwona)
- Przed: `40 OK, 2 FAIL` (`koszt irygacji = 60 [jest 30]`, `pula 92 (>= 91)`), czas 167 s, load 7,8 → 9,2.
- Po poprawce (`irr-fix2.log`): `42 OK, 0 FAIL`.
- Mutacja (`data/terrain-improvements.json` linia 40: 30 → 40, `irr-mut.log`): `41 OK, 1 FAIL` — `koszt irygacji = 1,5 x farma wg epoki 3 (160 = 1,5 x 80)`. Dane cofnięte: `git checkout -- gra/data/terrain-improvements.json`.

### earth-template (czerwony, zawężony)
- Przed: `8 pass, 2 fail`, found 1668 (w tym `plytkie_morze` 1596, `laka` 72).
- Po: `8 pass, 2 fail`: `ziemia: 0 heksów lądu poza szablonem (found 72)` — tylko `laka`; `ziemia: Antarktyda w szablonie … (found 0 heksów przy r=85)`. Czas 351 s.

### map-coast-buffer (czerwony, ZA-CIĘŻKI)
- Run `timeout 1200` (log `mcb-fix1.log`): przerwany po 20 min, bez podsumowania. Błędy zaobserwowane: `ziemia seed=1/7/42/99/2026: morze w środku lądu (21,13, 19,14, 20,14)` — identyczne heksy dla pięciu ziaren, co wskazuje na stałą cechę maski Ziemi (nie generator losowy). Ta asercja nie była częścią zarzutu r1; jej przyczyna NIE-ZMIERZONO. Zero błędów „suchy ląd w buforze” do przerwania.
- Probe bufora (`mcbprobe.cjs`, ten sam bundle co test, ten sam `findLandInMapBorder` + filtr suchego lądu): liczba heksów nie-Morze w buforze, z czego suchy ląd:
  - kontynenty seed 1: 53 (suchy 0); seed 42: 72 (0); seed 99: 76 (0); seed 2026: 68 (0)
  - pangea seed 7: 56 (0); seed 2026: 51 (0)
  - wyspy seed 1: 297 (0); seed 42: 314 (0)
  - ziemia seed 777: 0; seed 7: 0
  Wszystkie nie-Morze heksy w buforze to `plytkie_morze` (potwierdzenie P4).

### Bramki (ta runda, na `gra/` po zmianach w `tools/`; zmiany tylko w testach)
- `npx tsc --noEmit`: exit 0.
- `logic-test`: `LOGIC OK (213/213)`.
- `tech-tree-test`: `20 pass, 0 fail`.
- `research-test`: `ALL GREEN` (33/33).
- `combat-test`: `All sanity checks passed.` (6/6).
- `unit-replace-test`: `WSZYSTKIE TESTY ZIELONE (21/21)`.
- `ai-test`: `297 passed, 0 failed`.
- `climate-band-test`: `PASS`.

## Blokady
- map-coast-buffer nie został dokończony w limicie 20 min (ZA-CIĘŻKI potwierdzone), więc pełny wynik NIE-ZMIERZONO poza bufor-lądem.
- earth-template: Antarktyda i 72 `laka` — BŁĄD-GRY (kandydaci), test czerwony, nie w zakresie tego tematu do naprawy (zakaz zmiany gra/src).
- map-gen-regression i horse-resource-terrain: nie powtórzone (NIE-ZMIERZONO).

## Uwagi dla orkiestratora
- W worktree zainstalowano `gra/node_modules` (`npm ci`, 2 s; katalog ignorowany przez git). Bez tego testy nie startują (`Cannot find module esbuild`).
- Pliki bundli testów (`gra/tools/.*-bundle.cjs`, `.*-entry.ts`) są ignorowane przez git; nie commitowane.
- Probe i logi są w scratchpad sesji (`/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/q14e2r2/`), nie w repo.
- Kandydat do decyzji właściciela: nie dotyczy (zmiany testowe, bez wpływu na grę). Zaobserwowano jedynie, że asercja Antarktydy zależy od danych maski Ziemi — to może wymagać decyzji o tym, czy Antarktyda ma być w szablonie (pytanie o grę, do wyboru przez orkiestratora według ZASAD ABC).

NASTĘPNY KROK: runda 3 — (a) R-WEB dla BŁĄD-GRY: 72 `laka` poza maską Ziemi (seed 777), ujścia rzek 18/15 hex (`MAIN_RIVER_COAST_MOUTH_MAX_GAP`), Antarktyda w szablonie; (b) map-coast-buffer: rozbić pętlę ziemia (inland sea w masce) i uruchomić w wielu przebiegach <20 min każdy, po tabeli CIV_TEST_MAPY_SKROCONE; (c) pomiar load przed/po dla pozostałych ZA-CIĘŻKI testów na cichszej porze.
