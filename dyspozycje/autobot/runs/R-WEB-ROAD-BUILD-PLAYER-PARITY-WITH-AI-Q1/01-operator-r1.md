STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ROAD-BUILD-PLAYER-PARITY-WITH-AI-Q1
GOAL: Gracz buduje drogi tak samo jak AI: przez heksy z ulepszeniami (farma, trzoda…) i do heksów przy mieście; teren niedozwolony nadal odrzucony z czytelnym powodem.
BAZA: gałąź robocza worktree `wf_59b30a09-667-1` (HEAD dcca72b78, linia main FALA 592). Dispatch nie zawiera DODATKU dla tej rundy.

## 1. Diagnoza (plik:linia)

| Obszar | Reguła dla `droga` | Skutek |
|---|---|---|
| Gracz — `main.ts:~15908` (`refreshBuildApi`) | przekazuje `placedKeys: collectPlacedImprovementKeys()` (KAŻDY heks z jakimkolwiek ulepszeniem) | `improvement-build.ts` (dawny wiersz 1026) `if (key === 'droga' && placedKeys.has(hexKey)) return false;` odrzuca każdy heks z farmą/trzodą/irygacją itd. — to jest „nie można przez ulepszenia terenu” |
| Gracz — `improvement-build.ts` `isRoadQualified` | sąsiad = droga albo miasto gracza, albo heks w odległości 1 od miasta | Połączenie z miastem działa tylko przez heks przylegający do miasta; gdy ten heks ma farmę, jest odrzucany przez regułę wyżej — stąd „nie może prowadzić dróg do miast” |
| AI / automatyzacja — `auto-improvements.ts:1340-1371` (`buildImprovementQualifier`) | NIE podaje `placedKeys` ani `roadKeys`; wybór heksu drogi: `roadPlanHexes` (MST między miastami, `road-network-plan.ts`) | AI kwalifikuje farmy pod drogę (rozjazd: ta sama funkcja `qualifies`, inny stan wejściowy) |
| Zgodna z dokumentacją warstwa | `docs/...`/`dyspozycje/PYTANIA-OTWARTE.md` (opis „Równina z warstwami ['farma','droga']”) | Farma+droga to dozwolony stos — blokada na `placedKeys` nie jest decyzją właściciela, tylko rozbieżnością (bug) |
| Komunikat | `main.ts:15519` i `main.ts:31452` — jeden tekst „Droga musi łączyć się…” dla każdej przyczyny | Gracz nie widzi, czy problem to woda, terytorium, już istniejąca droga, czy brak połączenia |

Wniosek: nie było zamierzonej reguły gry zakazującej drogi na ulepszeniu. Rozbieżność: wejście `placedKeys` dla gracza, którego AI nie dostaje. Heks miasta jako cel nie jest osobnym przypadkiem — droga zawsze kończy się na heksie sąsiednim do miasta (AI: plan wyklucza heksy miast, `road-network-plan.ts` nagłówek); z naprawy farmy wynika połączenie do miasta.

## 2. Zmiany (commit — SHA w sekcji „ZMIANY-COMMIT”)

1. `gra/src/map/improvement-build.ts`
   - nowa funkcja wspólna `roadAdjacencyOk(state, q, r)` (~L959) — sąsiedztwo drogi/miasta; `createQualifier.isRoadQualified` (~L1019) deleguje do niej;
   - reguła `droga` (~L1057): blokada TYLKO gdy heks ma już drogę (`existing.some(isRoadImprovementKey)` lub `ulepszenie` = Droga/DrogaBrukowana). Usunięty warunek `placedKeys.has(hexKey)`; usunięte nieużywane lokalne `placedKeys`/`roadKeys` w `createQualifier`;
   - nowy eksport `roadBuildBlockReason(state, q, r)` (~L981) — powód po polsku, ta sama reguła (woda / poza terytorium / już droga / brak połączenia); nie zmienia wyniku `qualifies`;
   - `ImprovementBuildCallbacks.roadBlockReason?` (~L152) i wpięcie w `createImprovementBuildApi` (~L1699).
   Jedna definicja dla gracza, AI i automatyzacji: gracz i AI używają tej samej funkcji `qualifies`; po zmianie różnią się wyłącznie wejściem `placedKeys`, którego już nie czytają.
2. `gra/src/main.ts` — dwa miejsca (~L15522 podpowiedź przy kursorze, ~L31456 komunikat przy kliknięciu) biorą powód z `buildApi.roadBlockReason` zamiast jednego stałego tekstu.
3. `gra/tools/road-build-player-parity-test.cjs` (nowy) — test realnego `createImprovementBuildApi` i `roadBuildBlockReason` na syntetycznej mapie.

AI i automatyzacja: zachowanie bez zmian w wyniku (ich stan nie miał `placedKeys`, więc farmy już kwalifikowały; `roadPlanHexes` i `planRoadNetwork` nietknięte). Koszty, ruch i balans drogi nietknięte.

## 3. Testy

- `tsc --noEmit -p gra/tsconfig.json`: exit 0, 0 linii błędów.
- Nowy `node tools/road-build-player-parity-test.cjs`: **15 OK / 0 FAIL** — m.in. (P) parzystość gracz==AI na 127 heksach (rozjazdy 0, dozwolonych 9); (F) droga na farmie przy mieście akceptowana; (R) trasa dalej przez farmę akceptowana, ten sam heks z drogą odrzucony; (D) powód „Tu już jest droga.”; (W) woda z powodem o lądzie; (T) poza terytorium z powodem o terytorium; (C) brak połączenia z komunikatem o łączeniu; (M) zgodność powodu z API UI.
- Regresja (wszystkie exit 0, bez FAIL):
  - map-improvement-qualify-test 133/0; road-connectivity-test 99/0; road-hook-mainguard-test 19/0; roads-city-links-only-test 57/0 (symulacja 100 tur, AI); map-road-movement-test 26/0; farma-lesie-usun-istniejace-test 143/0; terrain-improve-farm-availability-test 36/0; improvement-era-scaling-test 144/0; simple-food-rule-no-toggles-test 36/0; oboz-lowiecki-las-test 94/0;
  - autoimprove-stages-q1-test 299/0; autoimprove-irrigation-after-farms-test 42/0; ai2-heks-po-heksie-test 39/0; river-terrain-move-test OK (17).
- Chromium / gra w przeglądarce: NIE_ZMIERZONO (w tej rundzie nie uruchamiano przeglądarki ani `npm run dev`; zakaz build w gra/).
- Mutacja (przywrócenie `placedKeys` w regule): NIE_ZMIERZONO w tej rundzie. Test (P) i (F) powinny wtedy paść (farma → gracz=false, AI=true).

## 4. Założenia (decyzje Operatora, do przeglądu przez FC)

- Z1: droga NIE jest kładziona na heksie miasta (AI też tego nie robi — heks miasta to węzeł). Połączenie „przez miasto” = dwa heksy sąsiednie do miasta, każdy kwalifikuje się przez sąsiedztwo. Nie zmieniono zachowania `qualifies` dla heksu miasta.
- Z2: przy braku połączenia komunikat „Droga musi łączyć się…” pozostaje (bez zmiany tekstu), dodane są powody dla wody, terytorium i istniejącej drogi.
- Z3: nie zmieniano `placedKeys` w `main.ts` (nadal używane do kandydatów i `pendingUndo`).

## 5. Blokady / ryzyko

- Brak blokad procesu. Przy FC: sprawdzić, czy zachowanie AI na mapach z farmami nie zmieniło się w ścieżce `roadPlanHexes` (wynik `roads-city-links-only-test` i `autoimprove-*` zielony).
- Chromium NIE_ZMIERZONO (patrz 3).
- W worktree dodano symlink `gra/node_modules` do istniejącego `wf_7aea9d5e-ab6-1/gra/node_modules` (tylko do testów/tsc; nie w commicie).

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet 5.5): przegląd diffu, weryfikacja mutacji i Chromium na żywej grze (heks farmy na trasie + heks miasta) — dla tematu wizualnego wymagany realny dowód w przeglądarce.
DEPLOY/PUSH: NIE WYKONANO
