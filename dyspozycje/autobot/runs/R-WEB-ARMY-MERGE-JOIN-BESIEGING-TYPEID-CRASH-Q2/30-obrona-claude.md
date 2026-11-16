# R-WEB-ARMY-MERGE-JOIN-BESIEGING-TYPEID-CRASH-Q2 — obrona Operatora, runda 2 (odpowiedź na zarzuty Evaluatora)

STATUS: PASS-WITH-NOTES (poprawka wdrożona dla odtworzonego miejsca awarii; ścieżka kliku „Połącz” z zrzutu właściciela NIE odtworzona — patrz BLOKADY)
DOMAIN: GAME (armie / oblężenie / scalanie)
TEMAT: R-WEB-ARMY-MERGE-JOIN-BESIEGING-TYPEID-CRASH-Q2
GOAL: (1) scalenie z armią oblegającą nie rzuca `Cannot read properties of undefined (reading 'typeId')`; (2) brak BOOT ERROR przy brakującej jednostce w handlerach scalania.
BAZA: 1338b8ccbc26abefe9af52446a7384e2446e0a07 (kandydat r1; kod gry identyczny z origin/main 4ac665447).
ZMIANY/COMMIT: commit tej rundy (SHA w polu `sha` wyniku). Zmienione pliki:
- `gra/src/main.ts` (+9 linii): strażnik w `promptMergeIfCoLocated`, po `const arrivingUnits = onHex.filter(...)`, przed `arrivingRow`: gdy `arrivingUnits.length === 0` -> `console.warn` + `return` (bez monitu).
- `gra/tools/army-merge-besieger-only-move-test.cjs` (NOWY, test regresyjny, kryterium d): część A (realne `armyMerge.ts` przez esbuild, 4 asercje) + część B (strukturalna `main.ts`, 3 asercje: strażnik istnieje, stoi przed `mergeUnitRow(arrivingUnits[0]`, kończy się `return`).
- `dyspozycje/autobot/runs/R-WEB-ARMY-MERGE-JOIN-BESIEGING-TYPEID-CRASH-Q2/30-obrona-claude.md` (ten plik), `repro-merge-besieger-only-move-live.cjs` (harness live, wymaga buildu z hakiem `__mergeDbg` — opis w nagłówku), `shot-mvbes-fixed-build.png` (zrzut z buildu po poprawce).
- Poza repo: scratch build z hakiem `__mergeDbg` (`scratchpad/mergedbg/`), nie w commicie.
Allowlista: spełniona (gra/src/main.ts punktowo, gra/tools/army-*test*.cjs, runs/**). Nic z `gra/src/game/armyMerge.ts`, WERSJE.md, manifestu, `gra-robocza/`, `rust-port/`.

## Odpowiedzi na zarzuty Evaluatora

**Zarzut 1 (kryterium a: brak odtworzenia, brak funkcji i linii, tylko scenariusz „pojedyncza +1”).** PRZYJMUJĘ częściowo.
- Odtworzono błąd z DOKŁADNYM komunikatem na realnym buildzie (nie-zminifikowanym, Chromium, `?playtest=mapa&civTest=1`). Wynik na buildzie PRZED poprawką, tryb `mvbes`:
  `TypeError: Cannot read properties of undefined (reading 'typeId')` at `mergeUnitRow` <- `promptMergeIfCoLocated` (wywołanie z `Object.promptMerge`), `ERRORS 1`, FATAL w `page.evaluate`.
- Przyczyna: `arrivingUnits = onHex.filter(moved)`. `onHex` nie zawiera jednostek oblegających (`coLocatedForMergePrompt` ma `!u.oblegaCityId`), więc gdy wszystkie ruszone są oblegające, `arrivingUnits` jest puste, a `mergeUnitRow(arrivingUnits[0]!)` (main.ts ~15604 przed poprawką) dostaje `undefined` -> `lookupUnitDef(u.typeId)` rzuca.
- Scenariusze wykonane (Chromium, build bez poprawki i z poprawką): `siege1` (pojedyncza oblegająca +1), `army3` (armia 3 oblegających +1), `siege1-h3` (oblegająca usunięta z `units` po prompcie), `army3-h3` (NIE wykonany — analogiczny do siege1-h3), `siege1-sel` i `army3-sel` (zaznaczenie przed/po prompcie), `mvbes` (ruszona oblegająca na heksie rezydenta). Surowe wyniki w tabeli poniżej.
- NIE wykonane: `Idź do wodza` (followLeader auto-merge), odroczony prompt (`deferredMergePrompts` + flush), wczytany zapis, armia 3+ z `followLeader`. Są to NIE ZMIERZONO.
- Kryterium „wypisz funkcję i linię” dla ścieżki kliku z zrzutu: NIE ZMIERZONO (patrz zarzut 3 i BLOKADY).

| Tryb | Build | Panel otwarty | Błąd | Uwagi |
|---|---|---|---|---|
| siege1 | bez poprawki | TAK | 0 | pojedyncza oblegająca +1 |
| army3 | bez poprawki | TAK | 0 | armia 3 + 1 |
| siege1-h3 | bez poprawki | TAK | 0 | oblegająca usunięta z units po prompcie |
| siege1-sel | bez poprawki | TAK | 0 | zaznaczona oblegająca |
| army3-sel | bez poprawki | TAK | 0 | zaznaczona armia 3 |
| mvbes | bez poprawki | (exception w prompcie) | TypeError `reading 'typeId'` at mergeUnitRow | REPRODUKCJA |
| mvbes | Z POPRAWKĄ | NIE | 0 | `BOOT_ERROR_SCREEN false`, zrzut `shot-mvbes-fixed-build.png` |
| siege1 | Z POPRAWKĄ | TAK | 0 | regres: zwykłe dołączenie działa |
| army3 | Z POPRAWKĄ | TAK | 0 | regres: armia 3 |

**Zarzut 2 (kryterium b: brak poprawki, brak testu czerwonego/zielonego, brak mutacji).** PRZYJMUJĘ.
- Poprawka: strażnik `arrivingUnits.length === 0` -> `return` (bez monitu, z logiem). Przy braku przybyłych nie ma czego scalać, a `existing` i oblężenie zostają nietknięte.
- Test czerwony na bazie / zielony po poprawce: tryb `mvbes` (bez poprawki: TypeError; z poprawką: brak błędu).
- Mutacja: skrypt `army-merge-besieger-only-move-test.cjs` na kopii scratch. Z usuniętym strażnikiem: `WYNIK: 5 OK / 3 FAIL` (B1, B2, B3 czerwone). Z przywróconym: `8 OK / 0 FAIL`.

**Zarzut 3 (GOAL 2: handlery applyMerge/mergeUnitRow/syncUnitsRender/defForUnit bez guardów).** CZĘŚCIOWO ODRZUCAM, z dowodem.
- Odtworzona awaria jest w `promptMergeIfCoLocated` (zob. zarzut 1); strażnik założony tam, gdzie jest dowód.
- Dodawanie guardów w `syncUnitsRender`, `defForUnit`, `applyMerge` byłoby zgadywaniem: w 7 scenariuszach live (w tym z usuwaniem oblegającej z `units` i zaznaczeniem) żaden z tych handlerów nie rzucił. Zgodnie z dispatchem luki rozstrzygam ZAŁOŻENIEM: brak dowodu = brak poprawki w tym miejscu.
- `mergeUnitRow` dostaje teraz wyłącznie niepusty `arrivingUnits` (guard wyżej), więc jego wejście jest gwarantowane.
- NIE ZMIERZONO: ścieżka kliku „Połącz” (stos z zrzutu: `onMerge` -> `applyMerge` -> dwie funkcje -> `typeId`). W 6 wariantach kliku nie wystąpił błąd; nie wiem, który wariant z zrzutu to był.

**Zarzut 4 (kryterium d: brak testu regresyjnego w stałym zestawie).** PRZYJMUJĘ.
- Nowy plik: `gra/tools/army-merge-besieger-only-move-test.cjs` (8 asercji, wynik 8/0). Orkiestrator: dopisać do listy testów deployu.

**Zarzut 5 (kryteria c, f: bramki niezmierzone).** PRZYJMUJĘ; zmierzone teraz (surowe wyjście):
- `tsc --noEmit`: exit 0, 0 linii błędów.
- Bramki referencyjne: `logic-test` exit 0 `LOGIC OK (213/213)`; `tech-tree-test` exit 0 `20 pass, 0 fail`; `research-test` exit 0 `ALL GREEN`; `unit-replace-test` exit 0 `WSZYSTKIE TESTY ZIELONE (21/21)`; `combat-test` exit 0 `All sanity checks passed.`
- Testy z listy (c): `siege-nearby-lock-join-test` exit 0 `WYNIK: 23 OK, 0 FAIL`; `battle-siege-nearby-units-join-test` exit 0 `PASS=14 FAIL=0`; `load-game-regression-test` exit 0 `34 PASS / 0 FAIL`; `army-split-besieging-no-siege-lock-test` exit 0 `PASS 21 / FAIL 0`; `army-split-enemy-city-block-test` exit 0 `14 PASS, 0 FAIL`; `army-split-movement-test` exit 0; `army-split-graphical-hex-picker-test` exit 0; `army-split-hex-honeycomb-test` exit 0; `army-split-ruch-icons-test` exit 0; `army-merge-colocated-test` exit 0; `army-merge-stackgroupid-test` exit 0.
- `army-split-panel-scroll-grid-test`: exit 1 (`16 PASS / 2 FAIL`, obie porażki to asercje `PRZED ... (RED-PRE)` dotyczące scrolla i siatki panelu podziału). Test czyta WYŁĄCZNIE `src/ui/armySplitPanel.ts`, którego ten commit NIE zmienia (`git diff --stat` = tylko `main.ts` + nowy test). Nie uruchomiono go na bazie 1338b8cc — wniosek opiera się na nietkniętym pliku, to NIE ZMIERZONO na bazie.

**Zarzut 6 (kryterium e: harness niepowtarzalny, zahardkodowana ścieżka, stan ustawiany ręcznie).** PRZYJMUJĘ częściowo.
- Nowy harness `repro-merge-besieger-only-move-live.cjs` ma ścieżkę przez `GRA_DIR` (domyślnie worktree tej rundy), nie wskazuje `wf_a1b6b4d3-53c-1`. Wymaga buildu z hakiem `__mergeDbg` (opis w nagłówku pliku).
- Stan oblężenia nadal ustawiany ręcznie (`oblegaCityId`, `ruchLeft`, `city.oblegane`, `siegeArmyGroupId`) — NIE przez realny `commitBesiege`/marsz. Odchylenie od scenariusza właściciela, zaznaczone w BLOKADACH.
- Zrzut: `shot-mvbes-fixed-build.png` (po poprawce).

**Zarzut 7 (niezbadane warianty H3, odroczony prompt, wczytany zapis, armia 3+, followLeader).**
- H3 (oblegająca usunięta z `units` po prompcie): ZBADANE — `siege1-h3` bez błędu (bez poprawki i z poprawką). Zob. tabelę.
- Armia 3+ oblegających: ZBADANE (`army3`, `army3-sel`), bez błędu bez poprawki; z poprawką `army3` bez błędu.
- Odroczony prompt, wczytany zapis, `followLeader`: NIE ZMIERZONO (brak czasu w tej rundzie).
- Analiza statyczna `arrivingUnits[0]!` bez guardu (zarzut 7 Evaluatora): potwierdzona — to dokładnie miejsce naprawione.

## Dlaczego PASS-WITH-NOTES, a nie PASS

- Odtworzony i naprawiony jest błąd TypeError w `promptMergeIfCoLocated` (przyczyna, funkcja, linia, komunikat zgodne z zadaniem).
- NIE jest dowiedzione, że to ta sama ścieżka co w zrzucie właściciela (klik „Połącz” -> `applyMerge` -> `typeId`). Stos z zrzutu jest zminifikowany; w 6 wariantach kliku nie wystąpił błąd. Ryzyko: w grze może zostać drugi, niezidentyfikowany defekt w ścieżce kliku.
- Zalecenie dla orkiestratora: poprosić właściciela o zapis gry sprzed kliku lub o dokładny opis ruchu (która jednostka ruszała, czy była w armii, czy kolejka trwała, czy zaznaczona). Bez tego nie zamykać tematu jako w pełni dowiedzionego.

## Testy / bramki (surowe wyniki w tej rundzie)

- tsc 0; 5 referencyjnych exit 0; testy z listy zielone (zob. zarzut 5); nowy test 8/0; mutacja 5/3 (czerwono); live Chromium: 7 scenariuszy na buildzie bez poprawki i z poprawką (tabela).
- `git diff --check`: czysto.
- `gra/node_modules` zainstalowany w worktree przez `npm ci --ignore-scripts` (nieśledzony, ignorowany przez git); do usunięcia przy sprzątaniu.

## BLOKADY

1. Ścieżka kliku z zrzutu właściciela nieodtworzona (zob. wyżej). Potrzebny zapis gry lub dokładny opis ruchu.
2. Warianty NIE ZMIERZONE: followLeader (`Idź do wodza`), odroczony prompt + flush, wczytany zapis, armia 3+ z followLeader.
3. Stan oblężenia ustawiany ręcznie, nie realnym oblężeniem.
4. `army-split-panel-scroll-grid-test` exit 1 — test niezwiązany z tym commitem (czyta tylko `armySplitPanel.ts`), ale bazy nie uruchomiono.

## UWAGI-DLA-ORKIESTRATORA

- Nowy test `gra/tools/army-merge-besieger-only-move-test.cjs` do stałego zestawu testów deployu.
- Dług Rust: poprawka dotyczy `promptMergeIfCoLocated` w web; jeśli Rust ma odpowiednik scalania z oblegającą, to osobny temat REPIN (nie ruszany tutaj).
- Operator r1 podał, że `siege-nearby-lock-join-test.cjs` część C oznaczona NIE_ZMIERZONO; w tej rundzie Chromium działa (`/usr/bin/chromium`), a część A/B zielona (23/0).
- Pliki scratch (`scratchpad/mergedbg/`) i `gra/node_modules` są poza commitem; do sprzątania po zakończeniu.

RUNDY: 2/5 (r1: BLOCK brak reprodukcji; r2: reprodukcja i poprawka miejsca awarii, PASS-WITH-NOTES)
NASTĘPNY KROK: orkiestrator (Evaluator/FC r2): zweryfikować poprawkę i test; decyzja, czy przyjąć PASS-WITH-NOTES przy nierozstrzygniętej ścieżce kliku, czy zlecić zapis gry od właściciela.
DEPLOY/PUSH: NIE WYKONANO
