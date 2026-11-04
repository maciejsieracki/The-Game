STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-HUD-RESOURCE-DEFICIT-RED-Q1
GOAL: Górny panel HUD — Skarbiec, Spichlerz i Surowce pokazują czerwoną czcionkę zamiast złotej, gdy zaczyna brakować pieniędzy / żywności / surowca; bez niedoboru kolor jak dotąd. Tylko prezentacja.

ZMIANY/COMMIT: SHA w nagłówku commita (patrz git log tej gałęzi; brak push).
Pliki: `gra/src/ui/hud.ts` (helpery `hudGoldShortage`/`hudFoodShortage`/`hudResourceShortage`, `HUD_SHORTAGE_RUNWAY_TURNS=5`, pole `HudState.surowceNiedoborLabels`, reguła CSS, dopiski w tooltipach), `gra/src/ui/hudChip6c.ts` (opcja `shortage` -> klasa `civ-hud-chip-short`), `gra/src/main.ts` (tylko podanie `surowceNiedoborLabels` z już liczonych `storedResourceRows`), NOWY `gra/tools/hud-resource-deficit-red-test.cjs`, run-dir. `empireDetailPanel.ts` NIE ruszony (patrz Z-notes).

POMIARY (plik:linia, stan bazy b89ecee44):
- Chipy: `hud.ts` `renderBarD1B` (Skarbiec/Spichlerz w `leftHeadChips`, Surowce w `leftTailChips`), `chip6cHtml` w `hudChip6c.ts`. Wartość chipa: `.civ-hud-chip-val` złoty (`--civ-gold-primary`/paleta `resourceColors.ts` #e8d88a). Przyrost: zielony, `.warn` pomarańczowy (`--tg-orange`) — nie czerwony.
- Dane: `buildHudState` w `main.ts` (~20270-20480).
- Definicje niedoboru istniejące: Spichlerz — `glodWojska`, `zywnoscKarencjaZaTur`, `zywnoscMiastNiedokarmionych` (rateWarn). Surowce — alert chipu = `ratePerTurn<0 || stock>=cap` (komentarz main.ts "niedoborze (ratePerTurn<0)"). `resourceDeficitKeysForOwner` (main.ts:21057) to definicja POTRZEB HANDLOWYCH AI (kolejki/koszt), nie HUD — nie użyta. Złoto: gra NIE ma progu „bankructwa"/alertu (zero trafień), skarbiec może schodzić poniżej 0.

ZAŁOŻENIA (rozstrzygnięte bez ABC):
- Z1/Surowce: niedobór = ta sama składowa co alert chipu: `ratePerTurn<0` (bez „na limicie magazynu" — pełny magazyn nie jest brakiem, test `resCapOnly`).
- R-GOLD: czerwony gdy zapas<=0 (przy bilansie<=0) albo bilans netto<0 i zapas starcza na <=5 tur (N=5, wybrane przeze mnie — brak istniejącego progu; stała jedna, łatwa do zmiany).
- R-FOOD: czerwony gdy istniejące ostrzeżenia głodu (głód wojska / karencja / niedokarmione miasta) LUB to samo okno zapasu 5 tur / zapas<=0.
- Z2: chip „Surowce" nie ma liczby ani listy w HUD (value=''), więc czerwienią się etykieta+„⚠" przy choć jednym niedoborze; nazwy surowców w niedoborze w tooltipie („Niedobór (czerwony): …"). Rozwinięta lista = panel imperium, który ma już własny stan 'bad' (empireDetailPanel.ts:3142) i alarm spichlerza (:2980) — bez zmian.
- Z3/Z4: istniejący token `--tg-red` #c84040 daje na pasku tylko 3,9:1 (<4,5 AA). Dla spełnienia AA dodany lokalnie `--civ-hud-shortage:#e05a5a` (5,3:1) — ten sam odcień czerwieni, jaśniejszy; mutacja z #c84040 jest zabijana przez test AA. DO DECYZJI Final Control/właściciela, jeśli ma zostać ściśle #c84040 (wtedy AA nie spełnione).
- Z5: `buildHudState` czerpie zasoby surowców z `buildEmpireResourceRows(0)` (istniejący dług hot-seat opisany w main.ts:20240; nie rozszerzałem). Skarbiec/Spichlerz po stanie fotela jak dotąd.
- Cztery krawędzie: zapas 0 przy bilansie >0 nie jest niedoborem (odbudowa).

TESTY:
- Nowy `hud-resource-deficit-red-test.cjs` (realny renderBarD1B + ensureStyles, Chromium, getComputedStyle, kontrast): PRZED (kod bazowy) 20 pass / 15 fail (RED), PO 35 pass / 0 fail. Logi: gate-przed-deficit-test-RED.txt, gate-po-deficit-test.txt.
- Scenariusze: normalny (złoty), runway, zapas 0, granica 5/6 tur, dalekie zapasy (nie czerwone), głód samym alertem, niedokarmione, 1 i wiele surowców, sam limit magazynu (nie czerwony), powrót do złotego, izolacja klas, tooltip, brak błędów JS.
- Mutacje (gate-mutacje.txt): runway 0, runway 9, resource-never, ignore-hunger, kolor złoty, kolor #c84040(AA) — wszystkie 6 zabite.
- Zrzuty PRZED/PO 1280×720 i 360×640 (6 stanów): `zrzuty/`.
- tsc --noEmit: EXIT=0 (gate-tsc.txt).
- Regresje (gate-regresje-po.txt vs gate-regresje-przed.txt): 28 testów PASS; 8 testów czerwonych (citizen-resource-upkeep, hud-moc-warstwa, hud-obywatele-chip, hud-skarbiec 33/1, hud-tooltip-body-mounted-panels, resource-usage-breakdown, sidepanel-hud-deadzone, unit-resource-upkeep) + horse-resource-terrain (timeout 120 s) + saveload-hud-cache-hotseat-live (vite build, EXIT=2) — IDENTYCZNIE czerwone/niedostępne na bazie PRZED (zmierzone na czystym HEAD); brak regresji. hud-number-abbrev-test PASS przed/po. Do oceny Evaluatora: pre-existing hud-skarbiec 1 fail (nie mój).

BLOKADY: brak (pre-existing czerwone jw.; testy `hud-moc-warstwa`/`hud-obywatele-chip` zwracają EXIT=1 po ~5 ms także przed zmianą).
REPIN UI: `hud.ts`/`hudChip6c.ts` mają kopie bajtowe w Rust (`src-tauri/frontend-v2/src/ui/`, UI-2-A/C) — zanotować REPIN UI w LEDGER przy integracji (nie ruszano Rust).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (weryfikacja żywa w grze: realne wejście gracza w niedobór złota/żywności; decyzja o odcieniu #e05a5a vs #c84040 i progu N=5).
DEPLOY/PUSH: NIE WYKONANO
