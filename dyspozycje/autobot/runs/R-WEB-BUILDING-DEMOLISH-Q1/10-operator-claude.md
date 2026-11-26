# R-WEB-BUILDING-DEMOLISH-Q1 — raport Operatora, RUNDA 2/5 (HAIKU 5.5): weryfikacja NA ŻYWO przed deployem

STATUS: PASS-WITH-NOTES (żywa weryfikacja w Chromium wykonana i zielona; kod NIE zmieniany w rundzie 2; wyjątki strukturalne Pałac/cuda/mury nadal czekają na decyzję właściciela — nie blokują kodu)
DOMAIN: GAME
TEMAT: R-WEB-BUILDING-DEMOLISH-Q1 (WYBURZ, #175; odp. 22C)
GOAL: gracz wyburza budynek z panelu miasta i dostaje połowę surowców z kosztu budynku (w dół); Pieniądz i Praca nie wracają; AI bez zmian.
BAZA/KANDYDAT: b8d28d17fad563e90003370e743dc1f958cc6293 (FC r1 tip; kod 3a00fd6ca43e0cb0c61693ed8e3740009b90f699). Runda 2 nie dodaje commitów z kodem; commit zawiera tylko ten raport i katalog `zrzuty/`.
ZMIANY-COMMIT: `dyspozycje/autobot/runs/R-WEB-BUILDING-DEMOLISH-Q1/10-operator-claude.md` (runda 2 na górze, runda 1 zachowana niżej) oraz `dyspozycje/autobot/runs/R-WEB-BUILDING-DEMOLISH-Q1/zrzuty/` (4 zrzuty PNG + `wyburz-live.json`). Brak zmian w gra/src, gra/tools, gra-robocza, gra-kanon, WERSJE.md, rust-port.

## Bramki (liczby z surowego wyjścia, worktree na b8d28d17f)
- `node ./node_modules/typescript/bin/tsc --noEmit`: exit 0
- `tools/building-demolish-test.cjs`: RESULT 36 pass / 0 fail
- `tools/mint-orphan-test.cjs`: 28 PASS / 0 FAIL; `tools/mint-capital-only-test.cjs`: 8 PASS / 0 FAIL
- `tools/logic-test.cjs`: LOGIC OK (213/213)
- `tools/tech-tree-test.cjs`: 20 pass, 0 fail
- `tools/research-test.cjs`: PASSED 33 / FAILED 0 / TOTAL 33
- `tools/unit-replace-test.cjs`: WSZYSTKIE TESTY ZIELONE (21/21)
- `tools/combat-test.cjs`: COMBAT TEST 6/6 pass
- `tools/ai-test.cjs`: ai-test: 297 passed, 0 failed

Build do testów live (NIE `npm run build`): `node ./node_modules/vite/bin/vite.js build --outDir <scratchpad>/dist-wyburz --emptyOutDir` — "✓ built in 14.33s", exit 0. (Katalog wyjściowy w scratchpadzie zamiast /tmp/<unikalny>, zgodnie z zasadami sesji.)

## Żywy test w Chromium (Playwright, /opt/pw-browsers/chromium, headless, --no-sandbox)
Jeden bieg bez awarii przeglądarki (brak SIGSEGV w tym biegu); `errors` w JSON: 0. Ścieżka: nowa gra (normal, 2 państwa-miasta, ziarno domyślne) → założenie stolicy „Rzym” (realna ścieżka) → zamknięcie ekranu powitalnego (helper `_live-ready.cjs`) → hak `civTest.adminSetup` (budynki: Pałac, Koszary, Mennica; zapas 200/200/200; skarbiec 500) → klik w hex stolicy, wybór „Miasto” → panel miasta.

| Krok | Wynik (z surowego JSON `zrzuty/wyburz-live.json`) |
|---|---|
| Panel miasta | „Budynki w mieście (3)”; przy każdym wierszu przycisk „Wyburz” (3 przyciski). Zrzut `zrzuty/01-panel-miasta-przycisk-wyburz.png` |
| Start | budynki `["palac","koszary","mennica"]`, skarbiec 500, „Dostępne do budowy” = 200 / 200 / 200 |
| A: Wyburz Pałac → Anuluj | potwierdzenie: „Zwrot surowców: brak (połowa kosztu, w dół). Pieniądz i Praca nie wracają.”; po anulowaniu budynki bez zmian (`unchanged: true`). Zrzut `02-potwierdzenie-odrzucone-palac.png` |
| B: Wyburz Koszary → OK | potwierdzenie: „drewno: +80, kamien: +80”; budynki `["palac","mennica"]`; zapas 200/200/200 → **280/280/200** (dokładnie +80 i +80 jak w podglądzie); skarbiec 500 → 500 (Pieniądz nie wraca). Zrzut `03-po-wyburzeniu-koszary.png` |
| C: Wyburz Mennicę → OK | potwierdzenie: „drewno: +80, kamien: +80, cegla: +80”; budynki `["palac"]`; wiersz Mennicy zniknął z panelu („Budynki w mieście (1)”, sekcja „Podatek i pieniądz” ukryta); zapas na zrzucie 360 / 360 / 280 (zgodnie z 280+80 / 280+80 / 200+80). Zrzut `04-po-wyburzeniu-mennicy.png` |
| D: Wyburz Pałac → OK | potwierdzenie: „Zwrot surowców: brak”; budynki `[]`; Pałac usunięty bez zwrotu (w danych brak kosztu surowcowego). |

Zgodność z regułą 22C: zwrot = połowa (w dół) surowców z kosztu budynku wg `buildingStockCost` (ta sama funkcja, którą panel pokazuje jako koszt budowy); Koszary/Mennica mają koszt 160 na surowiec, więc zwrot 80. Pieniądz i Praca nie są zwracane (potwierdzone: skarbiec 500 → 500).

## NIE ZMIERZONO (jawnie)
- Efekt ekonomiczny Mennicy po zakończeniu tury (bonus znika „od następnej tury”): NIE wykonano końca tury. Zmierzono tylko: `builtIds` bez „mennica”, wiersz Mennicy zniknął z panelu.
- Liczby HUD „Skarbiec” netto przed/po (w zrzutach było +4 / −1, po wyburzeniach +3 / −1) — NIE interpretowano, bez końca tury nie wiadomo, co z tego wynika.
- Zapis i wczytanie gry po wyburzeniu — NIE ZMIERZONO (kod nie dodaje stanu, więc zapis bit-w-bit powinien pozostać bez zmian; to tylko wnioskowanie).
- Hotseat (aktywny gracz inny niż 0) — NIE ZMIERZONO.
- AI nie wyburza — kod nie ma ścieżki do hooka; NIE ZMIERZONO w biegu live.
- Okno potwierdzenia to natywny `window.confirm`: w headless nie da się zrobić jego zrzutu; dowodem jest tekst okna przechwycony przez Playwright (podany wyżej).

## Uwagi i założenia Operatora (runda 2)
- Pałac można wyburzyć bez zwrotu (brak kosztu surowcowego w danych) — zgodne z obecnym kodem; pytanie o wyjątki strukturalne (Pałac/cuda/mury w oblężeniu) pozostaje otwarte jako decyzja właściciela (#181, Q28). Kodu nie zmieniałem.
- Zrzuty 02 i 01 mają ten sam rozmiar pliku: obie migawki pokazują ten sam stan panelu (po anulowaniu nic się nie zmieniło), więc to nie błąd zapisu.

## BLOKADY
- Techniczne: brak.
- Decyzyjne (poza zakresem Operatora): Pałac/cuda/mury — pytanie Q28 do właściciela (#181), nie blokuje deployu tej funkcji wg dispatchu.

RUNDY: 2/5 (runda 1: Operator → FC PASS-WITH-NOTES; runda 2: ten raport)
NASTĘPNY KROK: integracja po FC (orkiestrator); deploy na ROBOCZĄ tylko po osobnej autoryzacji orkiestratora.
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA: Nie uruchamiałem żadnych nowych sesji ani tworzonych zadań (zakaz w dispatchu). `gra/node_modules` zainstalowane przez `npm ci --ignore-scripts` (katalog ignorowany przez git) i usunięte po pracy; katalog zrzutów przygotowany w scratchpadzie. Zrzut z kliknięciem przycisku „Wyburz” wykonano na tej samej wersji kodu co FC r1 (b8d28d17f).

---

# Runda 1 (archiwum, bez zmian)

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
