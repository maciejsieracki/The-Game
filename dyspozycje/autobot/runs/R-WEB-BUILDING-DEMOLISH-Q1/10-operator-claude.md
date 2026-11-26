# R-WEB-BUILDING-DEMOLISH-Q1 — raport Operatora (runda 1/5, HAIKU 5.5)

STATUS: PASS-WITH-NOTES (kod gotowy; wyjątki strukturalne czekają na decyzję właściciela, patrz BLOKADY)
DOMAIN: GAME
TEMAT: R-WEB-BUILDING-DEMOLISH-Q1 (WYBURZ, #175; odp. 22C właściciela: wyburzanie każdego budynku ze zwrotem połowy surowców)
GOAL: gracz (także w hotseat, dla aktywnego gracza) wyburza każdy swój budynek z panelu miasta i dostaje połowę surowców z kosztu budynku; Mennica wg reguł właściciela; AI bez zmian.
BAZA: 1bb77a7a0cf44ffc135c546b3d441c67dcff5516 (origin/main), detach w worktree wf_07721440-021-1.
ZMIANY-COMMIT: patrz sekcja „Pliki” niżej; SHA commita z kodem i raportem = czubek gałęzi wf (zwrócony w polu sha).

## Pliki (allowlista)
- gra/src/game/building-demolish.ts (nowy): `demolishBuilding(state, cityId, buildingId) -> {removed, refund}`, `demolishRefundFor(buildingId)`, `paidStockCostForBuilding(buildingId)`.
- gra/src/ui/cityPanel.ts: przycisk „Wyburz” w wierszu budynku (tylko tryb nie-compact, gdy hook podany); potwierdzenie `window.confirm` z podglądem zwrotu; hook `onDemolishBuilding` w `CityPanelConfig`.
- gra/src/main.ts (tylko okablowanie): import `demolishBuilding` i hook `onDemolishBuilding` w OBU wywołaniach `configureCityPanel` (start i przebudowa po zmianie trudności). Hook woła `demolishBuilding({ cities, builtByCity: cityBuilt }, ...)` i po sukcesie `updateHud()`.
- gra/tools/building-demolish-test.cjs (nowy): 31 asercji.

## Reguła zwrotu (założenie Operatora)
- Miasto trzyma ID BIEŻĄCEGO poziomu (awans podmienia ID). Koszt poniesiony = suma `buildingStockCost` poziomów łańcucha `upgradeFrom` od bieżącego w dół; łańcuch przerywa się na poziomie z `upgradeSkip` (budowany od zera, poprzedników nie płacono).
- Zwrot = `floor(suma / 2)` per surowiec; wpisy 0 pomijane.
- Pieniądz i Praca NIE wracają (dane `koszt_surowce` ich nie zawierają). Budynki bez `koszt_surowce` (np. `palac`, `palac_ii`, `palac_iii`: palac ma pusty koszt surowcowy; palac_ii i palac_iii mają koszt) — `palac` daje zwrot pusty.
- Zwrot dopisywany do puli ownera przez istniejące `refundBuildingStockCostAcrossCities` (ta sama pula, z której pobierany jest koszt budowy).
- Przykłady z danych (wynik probe na surowym kodzie): stolarnia 50 drewna -> zwrot 25; mennica 160/160/160 -> 80/80/80; mury (łańcuch mury_kamienne) 320 -> 160; kuznia_zelaza 520/520/400 -> 260/260/200.

## Wyburzenie
- Usuwa WSZYSTKIE wpisy ID z `builtByCity` miasta przez istniejące `demolishBuildingIds` (mennica-orphan.ts). Nie rusza kolejki produkcji (zostaje). Efekty znikają od następnej tury, bo silnik czyta `builtByCity`.
- Mennica: wolno w każdym mieście; po usunięciu z `builtByCity` bonus znika (`ownersWithMennica` w turn-economy.ts, test 7 zielony). Reguły MINTORPHAN/MINTCAPITAL bez zmian.
- Brak budynku lub miasta: `removed:false`, zero zmian stanu (test 4 zielony, bit-w-bit).
- AI nie wyburza: żaden plik `src/game/ai*.ts` nie importuje modułu (test 8).
- Zapis/wczytanie: brak nowego stanu; format zapisu bez zmian (budynek po prostu nie istnieje).

## BLOKADY
- DECISION_REQUIRED (dla właściciela, nie rozstrzygnięte przez Operatora): czy wyburzanie ma być zablokowane dla budynków strukturalnych. Kandydaci z danych: Obrona (palisada, mury_kamienne, mury, fort, baszta) — wyburzenie w trakcie oblężenia/bitwy; Palac / Palac II / Palac III (siedziba władzy; palac bez kosztu surowcowego). Skutek per wariant:
  - A (rekomendowane przez dispatch do rozważenia): bez wyjątków — każdy budynek wyburzalny, także mury w oblężeniu (gracz może się rozbroić w trakcie oblężenia).
  - B: mury/fort/baszta/palisada wyburzalne tylko poza oblężeniem i bitwą (wymaga stanu oblężenia w `cityPanel`, osobny hook).
  - C: siedziby władzy (Palac, Palac II/III) niewyburzalne (chroni przed utratą zarządu/stolicy).
  Do czasu decyzji: BEZ blokady w kodzie (zgodnie z dispatch: blokada tylko dla budynków, które na pewno nie są zwykłymi — w danych takich nie ma; żaden budynek nie ma kategorii „cud”).
- Live w przeglądarce (zrzut panelu z przyciskiem i potwierdzeniem): NIE ZMIERZONO (nie uruchamiano Chromium w tej rundzie).
- Ryzyko: przycisk jest dodany tylko w nie-compact wierszu budynku, potwierdzenie to natywny `window.confirm` (prosty, bez nowego UI). Zrzut UI do weryfikacji przez Evaluatora/właściciela.

## TESTY (liczby z surowego wyjścia, uruchomione w worktree po zmianach)
- `node node_modules/typescript/bin/tsc --noEmit -p .` (w gra/): exit 0, 0 linii błędów.
- `node tools/building-demolish-test.cjs`: RESULT: 31 pass / 0 fail.
- Mutacje czerwone (na kopii, przywrócone i zweryfikowane `cmp`):
  - zwrot 100% (`const half = v;`): 15 pass / 8 fail;
  - brak usunięcia wpisu (`void next;` zamiast `builtByCity.set`): 17 pass / 6 fail;
  - brak zwrotu (`refund = {}`): 20 pass / 3 fail.
  - Po przywróceniu: 23/0 (przed dodaniem sekcji 7–8), finalnie 31/0.
- `node tools/logic-test.cjs`: LOGIC OK (213/213)
- `node tools/tech-tree-test.cjs`: 20 pass, 0 fail
- `node tools/research-test.cjs`: PASSED 33 / FAILED 0 / TOTAL 33
- `node tools/unit-replace-test.cjs`: WSZYSTKIE TESTY ZIELONE (21/21)
- `node tools/combat-test.cjs`: COMBAT TEST 6/6 pass
- `node tools/ai-test.cjs`: ai-test: 297 passed, 0 failed
- `node tools/mint-capital-only-test.cjs`: 8 PASS / 0 FAIL
- `node tools/mint-orphan-test.cjs`: 28 PASS / 0 FAIL
- `git diff --check`: czysto.
- Żadnego `npm run build`/`dev`; `npm ci --ignore-scripts` w gra/ tylko do testów (node_modules usunięty po pracy).

## UWAGI-DLA-ORKIESTRATORA
- Wcięcie hooka `onDemolishBuilding` w drugim wywołaniu `configureCityPanel` (main.ts ~linia 50417) jest o 2 spacje płycej niż reszta bloku — kosmetyka, do poprawy przy integracji (nie wpływa na zachowanie).
- Prośba relayowana w harness (rzeki: 1 duża : 4 średnie : 16 małych) NIE dotyczy tego tematu i nie została tu zaimplementowana. Odpowiada jej temat RIVERS3B r3 (#160, kolejka rzek), który orkiestrator już ma w TaskList.
- Nie wykonano: deploy, push, integracja (zgodnie z dispatch).

NASTĘPNY KROK: Evaluator (testy wg allowlisty + ocena reguły zwrotu) → Final Control; decyzja właściciela o wyjątkach strukturalnych (ABC: A/B/C wyżej) przed wdrożeniem na ROBOCZĄ.
DEPLOY/PUSH: NIE WYKONANO
