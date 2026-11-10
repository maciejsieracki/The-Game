STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P5-0-VIEWMODEL-CATALOG-Q1
GOAL: Katalog modelu widoku dla 49 modułów `gra/src/ui/**` importujących logikę/dane gry: co UI czyta/liczy lokalnie + docelowe DTO z Rust (nazwa, pola, typy, konsument, reguły do przeniesienia wg P5.13), przy UI-Q1=A, UI-Q2=A, UI-Q3=B, D-UI-9.
ZMIANY/COMMIT: ocena commitu Operatora `85cbd531` (baza `88df6493` = tip `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0`). Evaluator dodaje wyłącznie ten plik.
RUNDY: 1/5
DEPLOY/PUSH: NIE WYKONANO

## Bramki powtórzone w czystym targecie

- `git diff --name-status 88df6493 85cbd531` → 2 × `A`, oba w allowliście (`dyspozycje/rust-port/p5/P5-0-VIEWMODEL-CATALOG.md`, `dyspozycje/autobot/runs/R-RUSTPORT-P5-0-VIEWMODEL-CATALOG-Q1/01-operator-r1.md`). Zero zmian w `gra/**`, `rust-port/**`, `src-tauri/**`.
- `git diff --check 88df6493 85cbd531` → brak wyjścia, EXIT 0.
- Pin web: `git archive -o <scratch>/web.tar edb8fb56 gra/src` + `tar -x` do katalogu scratch (EXIT 0); własny parser `python3 -I` (skrypt poza drzewem danych).
  - `ui/`: 438 plików, 117 `.ts`, 0 testów.
  - Importy logiki/danych: **212 linii / 49 plików**: `src/game` 142 (31 plików), `gra/data` 28, `src/data` 13, `src/map` 13 (8), `src/render` 8 (7), `src/units` 6 (6), `src/battle` 2 (2). **Zgodne z §1.**
  - Lista 49 plików z mojego parsera = lista §3.1 (17) + §3.2 (32). **Żaden plik nie pominięty.** Liczby linii importu per plik zgodne (np. `cityPanel.ts` 41, `diplomacyTradeBasket.ts` 17, `registry.ts` 6).
  - Importy typów inline `import('../game/…')`: 6 trafień (`cityPanel.ts:571,573,575,577`, `diplomacyAudience.ts:282,283`). **Zgodne.**
  - Symbole: moje liczenie daje 498 (typy 128 ✓), a Operator 496. Rozbieżność 2 wynika prawdopodobnie z deduplikacji `validateTradeBasketSides` (import `diplomacyTradeBasket.ts:9` + re-eksport `:2833`); metoda deduplikacji nie jest opisana.
  - Martwe importy (6 symboli + 2 typy) potwierdzone grep-iem: 1 wystąpienie każdego symbolu w pliku.
  - `CityPanelConfig` (`cityPanel.ts:314-606`): 58 hooków `get*/is*` i 35 hooków `on*/set*`. **Zgodne.**
  - Próbki plik:linia, wszystkie zgodne z treścią: `cityPanel.ts:6277,6131,6284,6133,8522,8284,633-643,1263,1527,1434,10206,896,5040,8432,6309,594,555,3281,1108,1075,10192-10198,8910,6305,8507`; `siegeMapPanel.ts:217-220`; `diplomacyAcceptanceBalance.ts:704,765-795`; `render/cities.ts:392,774,784,802,809-811,821`; `hexContextTooltip.ts:818,252,137,338`; `unitCardStatus.ts:145-147`; `sciencePicker.ts:1179`; `techTreeView.ts:268`; `victoryScreen.ts:48`; `preBattle.ts:713`; `newGameFlow.ts:1150,2009,763,1250`; `empireDetailPanel.ts:1496,1453,3292,129`; `diplomacyTradeBasket.ts:219,1923,1077,2545,430,436,442`; `buildingAdapter.ts:278-280,296`.

## Zarzuty

1. **Brama P5.1 (§9) przepuszcza `../data/loader`.** Regex 9.1 obejmuje tylko `game|map|units|battle|render`, a 9.2 tylko `data/.*\.json`. 12 linii `from '…/data/loader'` przejdzie bramę jako „0”, w tym runtime `loadGameData`: `cityPanel.ts:81`, `newGameFlow.ts:20`, a także `unitRecruitCard.ts:6`, `unitMiniPreview.ts:7`, `icons/brandAssets.ts:8`, `unitInfographic.ts:5`, `unitInfoCard.ts:27`, `entityCards/buildingAdapter.ts:35`, `entityCards/unitAdapter.ts:39`, `entityCards/registry.ts:20`, `leaderPortraits.ts:18` i `scienceHubHud.ts:10`. Brama „mierzalna” nie mierzy celu, który sam dokument liczy w §1 (13 linii `src/data`).
2. **Niekompletne reguły w `siegeMapPanel.ts`.** Dokument podaje tylko `:219-220`. Ten sam blok zawiera jeszcze dwie reguły gry wpisane w UI:
   - `:221-222` `milicjaEst = garnizon<=0 ? 0 : max(1, floor(population*0.2))`;
   - `:223` `playerCanStorm = oblegajacyOwnerId === 0`, czyli stała tożsamość gracza zamiast reguły silnika.

   `SiegePanelDto` (§6.12) nie ma pól `milicja_est` ani `player_can_storm`, a §8 ich nie wymienia. Operator czytał ten kontekst (§11: `siegeMapPanel.ts:210-220`), ale zatrzymał się linię przed nimi.
3. **D-UI-9 niekompletne: stan buntu na plakietce i w panelu pochodzi z dwóch różnych źródeł.**
   - Renderer: `render/cities.ts:309` (`getRevolt`), wpięty w `main.ts:2611-2613` jako `cityOrderState.bunt || revoltWarning`.
   - Panel: liczy lokalnie `revoltWarning = !isPostCaptureLawActive(city) && grace>0` (`cityPanel.ts:3228-3229`) i przekazuje `rebelState` (`:3251-3253`).

   Tabela §5 tego pola nie ma. `CityPanelDto.order` (§6.2) nie ma pola buntu ani ostrzeżenia, a `CityMapBadge.revolt` (§5) nie jest powiązany z żadnym polem panelu. To ten sam wzorzec ryzyka co `P-WZROSTPROCENT-PLAKIETKA-ROZJAZD`.
4. **`MinimapDto` (§6.14) ma pola bez dowodu i niezgodne z kontraktem web.** Dokument podaje `{width, height, tiles:{teren,fog,owner}, viewport}`. Realny `MinimapData` (`minimapHud.ts:44-50`) to `cols, rows, hexes[], viewport` oraz `markers`. Elementy `hexes` mają postać `MinimapHexData {q, r, teren, ownerColor, fog}` (`:25-33`), a markery `MinimapMarkerData {q,r,kind,color}` (`:36-41`). W DTO brakuje `q/r` i `markers`, a nazwy zmieniono bez plik:linia. Przy UI-Q1=A (kopia paneli) DTO powinno odwzorować kontrakt 1:1.
5. **`UnitCardDto` (§6.8) ma wymyślone pola.**
   - `hp:{cur,max}`, `moves:{cur,max}` i `thumbnail` nie mają dowodu plik:linia.
   - `hp.max` dubluje `UnitCardCombatDisplay.hpMaxBase/hpMaxEffective` (`game/unit-card-stats.ts:42-43`).
   - Pominięto realne wejście karty `UnitCardStatusInput` (`unitCardStatus.ts:76-92`): `inGarnizon`, `sentry`, `ufortyfikowanyWPolu`, `oblegaCityName`, `veteranBadgeLabel`, `veteranStarsTooltip`, `veteranExperienceLine`, `veteranPanelExplanation` oraz `UnitSufferingStatusFields`.
6. **Brak surowych logów z EXIT; klasyfikacji nie da się odtworzyć.**
   - Raport nie zawiera surowego wyjścia skryptów ani kodów EXIT.
   - `imp.py`/`use.py`/`cls.py` i pełna lista 496 symboli z klasami zostały wyłącznie w scratchpadzie Operatora (§3 wiersz „Pełna lista symboli…”, §11), choć `runs/<ID>/**` jest na allowliście.
   - Liczby R181/M11/IO6/F56/K46/S42/X26 nie dają się zweryfikować symbol po symbolu.

   Wymagane: commit skryptów i wyniku TSV (symbol, plik, linia importu, klasa, linie użyć) do `runs/<ID>/` oraz log z EXIT.
7. **Niespójna liczba rodzin DTO.** §0 pkt 5 i komunikat commitu podają „20 rodzin DTO”, a raport „17 sekcji DTO (§6.1–6.17)”. Dokument nie wylicza tych 20.
8. **Dowody wskazujące na komentarze zamiast użyć.**
   - `promoteToFront` `cityPanel.ts:8383`: to komentarz; wywołania są w `:8400` i `:8408`.
   - `civWideSixStatsFromEmpireSnap` `:10427` (§3.1, §4, §6.4): to JSDoc; wywołanie jest w `:10456`.
9. **`CityPanelDto` gubi wartości z `CityView`** (`cityPanel.ts:1039-1072`), które panel dziś ma: `wzrostUlamkowy` (`:1050`) i `zywnoscNetto` (`:1042`). Przy UI-Q1=A panel potrzebuje tych samych liczb. Do pola `bilans_lokalny` trzeba jawnie dopisać, że jest równe `zywnoscNetto`, albo dodać brakujące pole.
10. **`01-operator-r1.md`: pole ZMIANY/COMMIT bez SHA** („SHA — w komunikacie zwrotnym”). Kontrakt raportu wymaga SHA w pliku.

## Sprawdzone bez zarzutu

Kompletność listy 49 modułów, rozbicie 212 linii, 6 importów inline, martwe importy, liczby hooków, sumy klas (8 plików = 174/181 R; 15 plików z R/M), konsumenci wskazani dla każdej sekcji §6, decyzje UI-Q1..3 i D-UI-9 zgodne z `LEDGER.md:134` i `P4-5-UI-SHELL-AUDIT.md:222`, komendy §7 istnieją w P2-5 (B1, B3, B12 `city_set_paused`, R5 `recruit_cancel`, pkt 14 `set_trade_split`/`set_labor_split`; `camera_focus` = O1 „WIDOK (bez komendy)”).

NASTĘPNY KROK: powrót do Operatora (runda 2/5, to samo ID) z zarzutami 1–10, potem Evaluator.
