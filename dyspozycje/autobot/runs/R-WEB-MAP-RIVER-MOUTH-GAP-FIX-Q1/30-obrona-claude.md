# R-WEB-MAP-RIVER-MOUTH-GAP-FIX-Q1 — OBRONA r3 (odpowiedź na zarzuty Evaluatora, commit d4725b030)

STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-WEB-MAP-RIVER-MOUTH-GAP-FIX-Q1
GOAL: ujścia głównych rzek co <= 7 hex wzdłuż wybrzeża (Standard), <= 5 (Mała); kontynenty 42 i pangea 7 oraz 3 dodatkowe mapy.
ZMIANY/COMMIT: kod gry BEZ zmian w tej obronie (kandydat f78516bed). Zmiana: gra/tools/river-mouth-gap-enforce-test.cjs (tylko komentarz przy grupie A: asercja pangea nie dowodzi odnogi). Dowody w tym raporcie. SHA: patrz pole `sha` w odpowiedzi strukturalnej.
BAZA: f78516bed (kandydat r3, zgodnie z dispatchem).

## Odpowiedzi na zarzuty

1. PRZYJMUJĘ. Grupa B testu `river-mouth-gap-enforce-test.cjs` nadal czerwona: moje uruchomienie na kandydacie: `2 pass, 2 fail`; kontynenty seed 42: złe masy 3, worst 15; pangea seed 7: złe masy 1, worst 10. Cel <= 7 NIE jest osiągnięty. Naprawa tego wymaga zmiany reguły (wariant A/B/C z 10-operator §4), więc nie jest poprawką w tej rundzie. Patrz zarzut 8.

2. PRZYJMUJĘ. Dodatkowe mapy poza limitem (dane z 10-operator §5, raw-extra-after-1.txt; mój pomiar kandydata wyspy 99 zgodny): wyspy 42 108x74 worst 20 (bez zmiany); wyspy 42 84x60 worst 21, złe masy 5 -> 6; wyspy 99 168x120 worst 9 (4 złe masy). Binarne kryterium „3 dodatkowe mapy <= limit” NIE spełnione.

3. PRZYJMUJĘ. `river-sea-buffer-test.cjs`: kandydat 6 pass / 3 fail, baza 4ec8fe4b4 6 pass / 3 fail (dane Evaluatora i raw-river-sea-buffer-after.txt; nie powtarzałem). Bramka „zielony na mapach nie-Ziemia” NIE spełniona. Poprawa liczby złych buforów (10 -> 5 na kontynenty 42), ale bez zielonego.

4. PRZYJMUJĘ. Piny generatora NIE przepięte. Próba w tej rundzie: `map-gen-regression-test.cjs` przerwany limitem 580 s w sekcji „Rzeki bez ujścia” (tuż po pomiarze czasów: mała 17,84 s; standardowa 42,34 s; duża 138,95 s). Pozostałe piny (determinism*, cluster-plan-name, river-density, river-loop, river-yield-both-sides, earth-template) NIE ZMIERZONO. Nic nie przepięto, żeby nie „dopasować” testu do wyniku.

5. PRZYJMUJĘ i UZUPEŁNIAM dowodem. `river-path-adjacency-test.cjs` w jednym przebiegu nie mieści się w 580 s (sam test, rc=124, 7 z 15 map). Przebieg rozbity wg rozmiaru i ziarna — ta sama logika asercji (`assertRiverPathAdjacent` na każdej trasie), jedynie filtr map przez zmienne środowiskowe w kopii tymczasowej (usuniętej po pomiarze); plik testu NIE zmieniony:
   - 84x60, ziarna 1,7,42,99,2026: 784 pass, 0 fail
   - 168x120, ziarna 42,7,1: 1394 pass, 0 fail
   - 168x120, ziarna 99,2026: 968 pass, 0 fail
   - 240x168, ziarna 1,7: 1636 pass, 0 fail
   - 240x168, ziarna 42,99: 1628 pass, 0 fail
   - 240x168, ziarno 2026: 846 pass, 0 fail
   - SUMA: 7256 pass, 0 fail. Trasy z odnogi ujściowej (3 hex) spełniają regułę sąsiedztwa.

6. PRZYJMUJĘ. Grupa A nie dowodzi naprawy pangea (na bazie też PASS dla pangea; mutacja tego nie wykrywa). Nie dodaję asercji bez dowodu. Zmieniono komentarz w `river-mouth-gap-enforce-test.cjs` (grupa A dowodzi tylko kontynenty 42; wkład odnogi 15 -> 10 jest tylko pomiarem). Mutacja `if (nd < 1) continue;` czerwona na kontynenty 42 — wynik Evaluatora (raw-enforce-test-mutation.txt), nie powtarzałem.

7. PRZYJMUJĘ — REGRESJA POTWIERDZONA (nie szum). Wydajność Standard, wyspy seed 99, 168x120, `r3-permass.cjs` (ten sam skrypt, ten sam generator, różny tylko `gen-helpers.ts`):
   - baza 4ec8fe4b4: 156 289 ms; 157 616 ms (poprzedni pomiar) -> średnio 156,9 s
   - kandydat f78516bed: 173 006 ms; 179 013 ms (poprzedni pomiar) -> średnio 176,0 s = +12,1%
   - kandydat z `allowForkMouth: false` (czyli bez odnogi, nd<1 zostaje): 180 095 ms
   Próg „nie gorzej o >10%” przekroczony. Przyczyna nie jest w odnodze (bez niej jest tak samo wolno), więc źródłem jest zmiana `if (nd < 1) continue;` w collectInlandDrainGrowCandidates (zmienia kolejność/liczbę kroków drenażu). Nie naprawiono w tej rundzie (wymaga profilowania; kandydat do osobnego tematu lub do decyzji, patrz zarzut 8).

8. PRZYJMUJĘ. Zgadzam się z oceną Evaluatora: kandydat to częściowa naprawa (kontynenty 42: worst 18 -> 15, złe masy 8 -> 3; pangea 7: 15 -> 10; wyspy 99: 12 -> 9). Pozostałe luki (masy 265, 590, 1011 na kontynenty 42; pangea 7; małe wyspy bez wnętrza) wymagają zmiany reguły lub kolejności etapów. Operator NIE zwraca PASS.

## Co wiem na pewno (dowód)
- `tsc --noEmit` (gra/): exit 0.
- `npm ci --ignore-scripts` w gra/: exit 0 (node_modules usunięte po bramkach).
- Kod kandydata nie został zmieniony w tej obronie (git diff tylko na komentarzu testu; `git diff --check` czysty).

## Dla orkiestratora (DECISION_REQUIRED, bez mojej rekomendacji)
Pytanie do właściciela (skutek dla gry, bez mechanizmu) — warianty z 10-operator-claude.md §4:
- A: rzeki trochę gęstsze/bliższe sobie przy ujściach (dopuszczenie bliższego sąsiedztwa tylko przy ujściu w luce);
- B: odcinki wybrzeża bez ujścia rzeki do 15 pól na części map polarnych i wąskich pasów (obecny stan po r3);
- C: ujścia rezerwowane z góry zmieniają układ rzek na wszystkich mapach.
Dodatkowo: wydajność (+12% na wyspy 99 Standard) wymaga decyzji „akceptować” albo osobnego tematu optymalizacji.
Piny generatora i pełne bramki (logic 213, tech-tree 20, research 33, unit-replace, combat 6, ai-test 297/0, climate-band, river-density/loop/yield-both-sides, earth-template) — NIE ZMIERZONO w tej rundzie. Kolejna runda po decyzji: przepięcie pinów jawnie + pełne bramki.

## Mapa NIE ZMIERZONO
Piny generatora, logic/tech-tree/research/unit-replace/combat/ai-test/climate-band, river-density, river-loop, river-yield-both-sides, earth-template, river-sea-buffer (poza danymi Evaluatora), mutacja grupy A (poza danymi Evaluatora).

RUNDY: 3/5 (obrona rundy 3; bez nowej poprawki kodu)
NASTĘPNY KROK: orkiestrator: pytanie ABC do właściciela (A/B/C + ewentualnie wydajność); po decyzji nowa runda Operatora (przepięcie pinów, bramki, wydajność).
DEPLOY/PUSH: NIE WYKONANO
