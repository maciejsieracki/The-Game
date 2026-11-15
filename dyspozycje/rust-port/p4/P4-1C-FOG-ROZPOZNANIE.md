# P4-1C — rozpoznanie producenta `FogViewDto` (#212)

TEMAT: `R-RUSTPORT-P4-1C-FOG-ROZP-Q1` (rozpoznanie, tylko odczyt, zero zmian kodu).
Baza: `origin/rust-port/parity-v2` = `83f5fd6548c1d2e3d84795ea15fa9bb1ff044e01` (stan przy starcie).
Pin webu: `07d2fbd72` (`gra/src/**`, czytane `git show` / `git grep`).
Kontrakt: `dyspozycje/rust-port/p4/P4-1-RENDER-DTO-CONTRACT.md` na `origin/claude/rust-sivvrn`
(§3.1 `viewer`, §3.3 `FogViewDto`, §8 wiersz `R-RUSTPORT-P4-1C-FOG-VIEW`).

Ścieżki Rust bez prefiksu są względem `rust-port/`. `main.ts` = `gra/src/main.ts@07d2fbd72`.

## 0. Wynik w skrócie

1. Web przekazuje do `scene.setFog` **trzy** rzeczy: zbiór widocznych heksów, zbiór odkrytych heksów
   (wersja „do renderu”) i opcje `{ landReveal, riverRevealKeys }` (`main.ts:13491-13494`).
   Obecny `FogViewDto` (`view-model/src/map.rs:207-213`) ma tylko `state: Vec<FogState>`: pokrywa
   oba zbiory, ale **nie ma** `landReveal` ani `riverRevealKeys`. Bez nich renderer nie odtworzy
   tafli oceanu przy skrócie M (`scene.ts:3548`, `:3643-3655`) ani rzek w kręgu startu przed
   pierwszym miastem (`riverLod.ts:359-377`, `scene.ts:3433`).
2. Rust ma czystą funkcję `compute_player_visibility(_with_extra)` (`engine/src/domain/state.rs:1067`,
   `:1080`), ale **nie ma** odpowiednika `currentVisible()` (`main.ts:13007-13045`): brak unii z
   sojusznikami, brak źródeł fortów w jednym wywołaniu z mapą stanu, brak konwersji
   `PlayableState → RuchMapa/RuchJednostka`, brak produkcyjnego wołającego.
3. W `PlayableState` (`engine/src/domain/playable.rs:493`) **nie ma** trwałego `explored`
   (web `explored` / `exploredByHuman`, zapis v3 `exploredByHuman`, `save.ts:356-363`), heksu startu
   per fotel (`playerStartHexByOwner`, `main.ts:3023-3029`), ani flag `fogOn` / `revealAllLand`.
   To blokuje producenta: z samego stanu nie da się policzyć `state = 1` (odkryty).
4. Web **mutuje stan w ścieżce renderu** — dwa razy: `refreshFog()` woła
   `updateDiplomaticDiscovery(vis)` (`main.ts:13479`, def. `:22528-22533`, dopisuje właścicieli do
   `diplomaticallyDiscoveredOwnersSet()` fotela `ME()`) oraz dopisuje `vis` do
   `exploredByHuman.get(ME())` (`main.ts:13483`). Pięć innych miejsc dopisuje odkrycie wzdłuż ścieżki
   ruchu i przy podpisaniu traktatu (§1.3) — **zawsze do `explored` fotela 0**, nie do fotela
   aktywnego. W Rust producent musi być czysty, więc oba zapisy trzeba przenieść do silnika (§3 W2).
5. **Mgła dla fotela ≠ 0 jest w pinie ROZBIEŻNA** (§1.5): render czyta globalny `explored`
   (alias fotela 0), a `refreshFog` pisze do zbioru fotela `ME()`. Reguła per fotel nie istnieje
   w pinie; dla fotela ≠ 0 potrzebne jest pytanie ABC do właściciela (zasady 9/11), §1.5.

## 1. Tabela: wejście pinu → znaczenie → odpowiednik Rust

### 1.1 Wywołanie `setFog` i jego argumenty

| Wejście pinu (plik:linia) | Znaczenie | Odpowiednik Rust (plik:linia) / status |
|---|---|---|
| `render/scene.ts:356` (typ), `:3526` (impl.) `setFog(visible, explored, opts?)` | Mgła terenu: kolor/ukrycie pryzm, tafla oceanu, LOD dekoru, rzeki | `renderer/src/terrain/mod.rs:704-711` `TerrainScene::set_fog(visible, explored, land_reveal)` — **ROZBIEŻNE**: brak `riverRevealKeys` w sygnaturze (rzeki osobno, `renderer/src/decor/river_lod.rs:315-339`) |
| `main.ts:13478` `const vis = currentVisible()` | Widoczne heksy aktywnego fotela | **BRAK** odpowiednika `currentVisible`; składniki: §1.2 |
| `main.ts:13479` `updateDiplomaticDiscovery(vis)` (def. `:22528-22533`) | **Mutacja stanu w ścieżce renderu**: `computeDiplomaticContacts(vis, cities, units)` → `diplomaticallyDiscoveredOwnersSet()` (fotel `ME()`, `:10058-10062`), pomija `eliminatedOwners` | **BRAK** wołającego w silniku (zakres §3 W2) |
| `main.ts:13483` `addExplored(exploredByHuman.get(ME())!, vis)` | Trwałe odkrycie fotela `ME()` rośnie o widoczne heksy **w ścieżce renderu** | Funkcja jest: `state.rs:988` `add_explored`; **BRAK** stanu `explored` w `PlayableState` i wołającego |
| `main.ts:13484` `fogExploredForRender()` (def. `:12864-12866`) | `explored ∪ ALL_LAND_KEYS` gdy `revealAllLand`, inaczej `explored` — **globalny `explored` = alias fotela 0** (`:12799`, `:13759`), nie `exploredByHuman.get(ME())` | `state.rs:1029` `explored_set_for_render` — jest; **BRAK** flagi `reveal_all_land` w stanie/sesji. Dla fotela ≠ 0: **ROZBIEŻNE**, §1.5 |
| `main.ts:13485` `useFogRender = fogOn \|\| revealAllLand` | Gałąź mgły vs „wszystko widać” | **BRAK** w silniku; `viewer.fogActive` istnieje w DTO (`view-model/src/owners.rs:71-75`). Niezmiennik pinu: `revealAllLand ⇒ fogOn` (wszystkie przypisania: `main.ts:9788`, `:12870-12871`, `:13579-13580`, `:13594-13595`, `:46412`), więc `useFogRender ≡ fogOn` → `viewer.fogActive` wystarcza |
| `main.ts:13491-13494` `setFog(vis, exploredForRender, { landReveal: revealAllLand, riverRevealKeys: startRevealKeysForRiverFog() })` | Gałąź mgły | `FogViewDto.state` koduje `vis`/`exploredForRender`; **BRAK** `landReveal` i `riverRevealKeys` w DTO |
| `main.ts:13506` `setFog(ALL_KEYS, ALL_KEYS)` (bez opcji) | Mgła wyłączona (F): wszystko widoczne, `landReveal=false`, `riverRevealKeys=null` | Wyrażalne obecnym DTO: `state[i] = 2` dla każdego heksu + `fogActive=false` |
| `main.ts:12854` `ALL_KEYS = new Set(allHexKeys(map))`, odśw. `:12858-12861` `rebuildAllKeys` | Wszystkie klucze mapy | `state.rs:996` `all_hex_keys` (kolejność `BTreeMap`; web: kolejność wstawiania). Dla DTO kolejność narzuca `map.hexes` (P4-1B), więc kolejność `ALL_KEYS` nie ma znaczenia |
| `main.ts:12856` `ALL_LAND_KEYS = allRevealLandKeys(map)` | Ląd + wybrzeże (bez `Morze`) dla skrótu M | `state.rs:1006` `all_reveal_land_keys` — jest |
| `main.ts:12801` `let fogOn = true` | Flaga FoW (dev F) | **BRAK** (stan sesji/UI, nie gry) |
| `main.ts:12803` `let revealAllLand = false` | Flaga skrótu M (dev) | **BRAK** (stan sesji/UI) |
| `main.ts:12869-12873` `seedStartingFog()` | Nowa gra: `fogOn=true`, `revealAllLand=false`, `explored.clear()` | **BRAK** (brak `explored` w stanie) |
| `main.ts:13074-13080` `startRevealKeysForRiverFog()` | `undefined` gdy nie czekamy na 1. miasto albo brak heksu startu; inaczej `computeVisibleAt(start, startRevealRadius)` | Składniki są: `engine/src/domain/player.rs:96` `is_awaiting_first_player_city`, `state.rs:945` `compute_visible_at`; **BRAK** heksu startu per fotel i `startRevealRadius` sesji w stanie |
| `render/scene.ts:3531` `lastRiverRevealKeys = opts?.riverRevealKeys ?? null` + `:3433`, `:3497` | Rzeki widoczne w kręgu startu mimo mgły | `renderer/src/decor/river_lod.rs:315` `merged_river_visible_in_fog(fog_active, reveal: Option<&HashSet<String>>, …)` — jest, z rozróżnieniem `None` vs pusty zbiór (komentarz `:312-314`) |
| `render/riverLod.ts:359-377` `mergedRiverVisibleInFog` | j.w. (web) | j.w. |
| `render/scene.ts:3532`, `:3548`, `:3643-3655` `landReveal` | `showOceanBackdrop = !anyHidden \|\| landReveal`; `applyZoomLodDecor(anyHidden && !landReveal)` | `renderer/src/terrain/mod.rs:708`, `:713` — parametr jest; wejście z DTO **BRAK** |

### 1.2 Skład `currentVisible()` (`main.ts:13007-13045`)

| Wejście pinu | Znaczenie | Odpowiednik Rust / status |
|---|---|---|
| `main.ts:12968-12985` `ownPlayerVisibleHexes()` | Unia dysków: jednostki `ME()` (`unitSight`), miasta `ME()` (`citySightRadius(pop, kultura)`, pomija `sight<=0`), forty `fortSightSources(fortNodes, ME())`; **bez** fallbacku startu | `state.rs:1080-1117` `compute_player_visibility_with_extra` liczy to samo (jednostki, miasta, `extra_sight_sources`). **ROZBIEŻNE**: Rust ma fallback startu w środku (`:1110-1115`); web w `currentVisible` stosuje go **po** unii z sojusznikami (`main.ts:13008-13044`). Producent musi wołać z `start_hex: None` i fallback robić sam |
| `main.ts:12950-12967` `visibleDiskKeys` (memo) | Cache dysku; ta sama zawartość co `computeVisibleAt` | Optymalizacja, nie reguła; Rust bez memo (`state.rs:922-943` `add_disc`). Do zbiorów wynik identyczny |
| `main.ts:1971` `unitSight = buildUnitSightResolver(data.units, DEFAULT_SIGHT)` | Wzrok jednostki: miasto→`DEFAULT_SIGHT`, `widokPola`, potem `ruch`, potem domyślny | `state.rs:884-907` `build_unit_sight_resolver` — jest. `PlayableUnit.type_id: Option<String>` (`playable.rs:400-402`, `None` = `base_type_id`) — konwersja na `RuchJednostka.type_id` **BRAK** |
| `okolica.ts:55` `citySightRadius(pop, kultura)` | Promień wzroku miasta | `engine/src/domain/territory.rs:203-214` `city_sight_radius(pop, kultura, border_radius)`; `border_radius` = `order_effects_culture.rs:144` `city_border_radius` (zwraca `u8`, trzeba opakować w `Fn(f64)->f64`). `PlayableCity.population: u32`, `.culture: u32` (`playable.rs:364`, `:368`) — **NIE_ZMIERZONO**, czy `culture` = web `kultura` (skumulowana) |
| `main.ts:12982` `fortSightSources(fortNodes, ME())` | Forty/posterunki jako źródła wzroku | `engine/src/domain/fort_territory.rs:197` `fort_sight_sources`; węzły ze stanu: `turn_war_inputs.rs:594` `fort_nodes_from_state` (prywatna) |
| `main.ts:13009-13012` pętla `aiOwnerCivMap` + `allianceFormalKindBetween(activeDeals, ME(), oid) !== null` → `currentVisibleForOwner(oid)` | Unia z widocznością każdego sojusznika (obronny lub pełny) | Predykat: `city_view.rs:254` `is_alliance_deal_kind` na `state.war.diplomacy.deals` (wzorzec `city_view.rs:343`); web `diplomacy-treaties.ts:380-389`. Funkcja unii **BRAK** |
| `main.ts:13060-13072` `currentVisibleForOwner(oid)` | `computePlayerVisibility` dla `oid` (bez `startHex`) + unia `ownPlayerVisibleHexes()` gracza, gdy sojusz | Składniki jak wyżej; **BRAK** całości. Uwaga: zwrotne dołożenie widoku gracza nie zmienia wyniku `currentVisible` (już zawiera widok gracza) |
| `main.ts:13041-13044` fallback: `playerStartHexFor(ME())` → `computeVisibleAt(start, map, startRevealRadius)` | Krąg startu, gdy unia pusta | `state.rs:945` `compute_visible_at`; **BRAK** `playerStartHexByOwner` w stanie (Rust ma `start_position.rs:96`, `:110-114` tylko w planie generatora) |
| `main.ts:3033`, `:44381` `startRevealRadius = startRevealRadiusForDifficulty(diff)` | 10/8/5 (easy/normal/hard), `map/startScoring.ts:17-23` | `engine/src/domain/mapgen/cluster_mass.rs:2734` `start_reveal_radius_for_difficulty`. **ROZBIEŻNE**: domyślne `ComputePlayerVisibilityOptions.start_reveal_radius = None` bierze `visibility-params.json` (= web `START_REVEAL_RADIUS` 5, `startScoring.ts:14`), a gra używa promienia z trudności (8 dla normal). Producent musi podać jawnie |

### 1.3 Zapisy `explored` w pinie (stan, nie widok)

| Pin | Co | Rust |
|---|---|---|
| `main.ts:12799` `const explored = new Set<string>()`; `:13759` `exploredByHuman = new Map([[HUMAN_OWNER_PRIMARY, explored]])` (alias fotela 0, komentarz `:13751-13758` „runda 2”); `:10895`, `:13902` osobny `Set` dla kolejnego fotela | Trwałe odkrycie: fotel 0 = globalny `explored`; inne fotele = osobne `Set`, których render nie czyta (§1.5) | **BRAK** w `PlayableState` |
| `main.ts:13483` (w `refreshFog`) | `exploredByHuman.get(ME()) ∪= vis` (fotel aktywny) | **BRAK** |
| `main.ts:13479` (w `refreshFog`) | `updateDiplomaticDiscovery(vis)` → kontakty dyplomatyczne fotela `ME()` (to nie `explored`, ale ta sama klasa: mutacja stanu w ścieżce renderu) | **BRAK** (§3 W2) |
| `main.ts:13461` `revealAlongPathForStack`, `:31636`, `:43637`, `:44137` | `explored ∪= computeVisibleAlongPath(path, unitSight(su))` dla każdej jednostki stosu — **do `explored` fotela 0** (globalny alias), niezależnie od `ME()` | `state.rs:952` `compute_visible_along_path` jest; wołającego **BRAK** |
| `main.ts:24573-24584` | Podpisanie traktatu, w którym stroną jest **fotel 0 na sztywno** (`proposerId === 0 \|\| responderId === 0`, `:24580`), rodzaje `revealsTerritoryOnSign` (`:24573-24579`): `PaktNieagresji`, `SojuszDefensywny`, `SojuszPelny`, `UmowaSzlakow`, `UmowaWymiany` (legacy `UmowaHandlowa` — nie, `:24569-24571`): `explored` (fotel 0) `∪= currentVisibleForOwner(other)`, potem `refreshFog()` | **BRAK** |
| `main.ts:24903` `explored.clear()` w `resetFogToCurrentlyVisible` | Hak testowy (`__…TestDebug`) | Nie dotyczy (hak testowy) |
| `main.ts:28009` | Hak testowy `markExploredAndRefreshFog` | Nie dotyczy (hak testowy) |
| `main.ts:29718` `exploredByHuman.set(ownerId, new Set(opts.exploredKeys ?? []))` | Hak testowy dodania fotela (hot-seat) | Nie dotyczy (hak testowy) |
| `main.ts:45027`, `:45409-45410`, `:45658-45659`, `:45892-45893` | Czyszczenie / presety scenariuszy | **NIE_ZMIERZONO** (presety poza zakresem) |
| `main.ts:46393-46411`, `game/save.ts:356-363` | Wczytanie zapisu v3 `exploredByHuman: Array<[owner, keys[]]>`; fotel 0 przez mutację aliasu `explored`, pozostali — nowe `Set`; brak wpisu fotela 0 → pusty `explored` | **BRAK** w `engine/src/domain/save_load.rs` (`git grep explored` → 0) |
| `game/save.ts:109-116`, `:380-387`, `:695-706` | Zapis v2 (`explored`) **odrzucany** `IncompatibleSaveFormatError` (`ver < 3`), **bez migracji v2→v3** (ABC-4) | Rust musi odrzucać v2 tak samo (§3 W1) |

### 1.4 Pozostali konsumenci tych samych zbiorów (dla adaptera P4-1G, nie pola `FogViewDto`)

| Pin | Konsument | Wejście | Rust |
|---|---|---|---|
| `main.ts:13495-13497`, `:13507-13509` | `syncResourceOverlayFog`, `syncImprovementMeshFog`, `syncSettlementMeshFog` | `vis`, `exploredForRender` | Do wyprowadzenia z `state` |
| `main.ts:13498`, `:13510` | `syncWorkerFieldOverlayFog(…, fogActive)` — `true` w gałęzi mgły, `false` inaczej | j.w. + flaga | `renderer/src/cities/overlay/worker_field.rs:215-219` (`fog_active`) ← `viewer.fogActive` |
| `main.ts:13502`, `:13511` | `syncUnitsRender(visibleUnitsList(vis))` | `vis` | P4-1D (filtr jednostek w silniku) |
| `main.ts:13503-13504` (mgła), `:13512-13513` (bez mgły) | `cityRenderer.applyFogVisibility(vis, true, ME())` + `wonderRenderer.applyFogVisibility(vis, true)` w gałęzi mgły; `cityRenderer.applyFogVisibility(ALL_KEYS, false, ME())` + `wonderRenderer.applyFogVisibility(ALL_KEYS, false)` poza nią (literały, nie `fogOn`) | tylko `vis` (`state == 2`) + flaga = `useFogRender` (≡ `viewer.fogActive`) | `renderer/src/models/cities/renderer.rs:592`, `models/wonders/renderer.rs:193` |
| `main.ts:13082-13086` `cityFogVisible` | `!fogOn` → widać; własne → widać; inaczej `vis.has` | `vis` | Już w P4-1E: `city_view.rs:107-114` `CityViewInputs { fog_active, visible_hexes }` — **ten sam zbiór** musi przyjść z producenta mgły |
| `map/minimap.ts:22`, `:100-115` | Minimapa: te same zbiory co `setFog`; jednostki tylko `visible`, miasta `visible ∪ explored` | `vis`, `explored`, `fogOn` | Wyprowadzalne z `state` + `fogActive` |
| `main.ts:16005-16009` `improvementFogViewSets()` | Te same zbiory poza `refreshFog` | `vis`, `exploredForRender` | j.w. |
| `render/fogDim.ts:3`, `:16-26` | Mnożnik mgły dekoru | `vis`, `explored`, `fogActive` | `renderer/src/core/fog_dim.rs:21-37` |

### 1.5 Fotel ≠ 0 (hot-seat) — zachowanie pinu ROZBIEŻNE (wymaga pytania ABC)

Fakty z pinu:
- Render czyta wyłącznie globalny `explored` (`fogExploredForRender`, `main.ts:12864-12866`), który
  jest aliasem `exploredByHuman.get(0)` (`:12799`, `:13759`; load utrzymuje alias, `:46393-46411`).
- `refreshFog` dopisuje `vis` do `exploredByHuman.get(ME())` (`:13483`). Dla `ME() = 0` to ten sam
  obiekt co `explored`; dla `ME() ≠ 0` to osobny `Set` (`:10895`, `:13902`, `:29718`), **którego
  żaden render nie czyta**. Komentarz `:13751-13758` mówi wprost, że rozdział per fotel to
  „runda 2” — niezrobiona w pinie.
- Odkrycie ścieżką i traktatem pisze zawsze do fotela 0 (§1.3).
- Przełączenie fotela (`switchActiveHuman`, `:13896`) jest w pinie osiągalne tylko z haka
  testowego (`:29965`, komentarz `:13893`); `hotSeatEnabled()` (`:12837-12845`) jest martwym kodem
  (`:12833-12835`). W zwykłej grze `ME() ≡ 0`.

Skutek dla fotela ≠ 0 w pinie: `V` = widok fotela aktywnego, `E_r` = odkrycie **fotela 0**
(`∪ ALL_LAND_KEYS` przy M). Więc `V ⊄ E_r` jest możliwe, a odkrycie fotela aktywnego nie jest
wyświetlane. Terenowi to nie szkodzi (`scene.ts:3580` sprawdza `visible` przed `explored`), ale
komentarz w `scene.ts:3557-3563` zakłada `explored ⊇ visible`, a pozostali konsumenci (§1.4) —
**NIE_ZMIERZONO**, czy rozróżniają `k ∈ V \ E_r` od `k ∈ V ∩ E_r`.

Wniosek: reguła `E_r = (explored[viewer] ∪ V) ∪ …` i niezmiennik `V ⊆ E_r` są **wierne pinowi
tylko dla `viewer = 0`** (= jedyny osiągalny fotel w zwykłej grze pinu). Dla `viewer ≠ 0` pin nie
ma spójnej reguły (rozdział per fotel jest niedokończony). Zgodnie z zasadami 9/11 orkiestrator
musi zadać **pytanie ABC** właścicielowi przed W2/W3 dla fotela ≠ 0. Szkic opcji (do
sformułowania przez orkiestratora wg zasady 10):
- A — per fotel (`explored[viewer]` w renderze i we wszystkich zapisach, w tym ścieżka i traktat
  ze stroną = fotel ludzki): spójne, ale to **świadome odstępstwo** od pinu (dokończenie „rundy 2”).
- B — 1:1 z pinem: render z `explored[0]`, zapisy ścieżki/traktatu do fotela 0, `refreshFog` do
  `ME()`: wierne, ale przenosi do Rust niedokończony stan pinu (fotel 1 widzi mapę fotela 0).
- C — producent tylko dla `viewer = 0` (fotel ≠ 0 → błąd / poza zakresem do czasu decyzji): zero
  zgadywania, ale hot-seat w Rust zablokowany.
Rekomendacja operatora (do weryfikacji przez orkiestratora): **C** na teraz (blokuje tylko ścieżkę,
której pin nie udostępnia w zwykłej grze), z decyzją A/B przy porcie hot-seat.

## 2. Pola `FogViewDto` potrzebne rendererowi (z wejściami z modelu)

Obecnie: `FogViewDto { state: Vec<FogState> }` (`view-model/src/map.rs:207-213`), `FogState` 0/1/2
(`:159-205`), walidacja długości (`view-model/src/validate.rs:243`).

| Pole | Typ (propozycja) | Status | Reguła producenta (z pinu) | Wejścia z modelu |
|---|---|---|---|---|
| `state` | `Vec<FogState>` równoległy do `map.hexes` | JEST | Gdy `fogActive=false`: wszędzie `Visible` (`main.ts:13506`). Inaczej dla heksu `k`: `Visible` gdy `k ∈ V`; `Explored` gdy `k ∈ E_r`; inaczej `Unexplored`. `V = currentVisible(viewer)` (§1.2), `E_r = (explored[0] ∪ V) ∪ (landReveal ? ALL_LAND_KEYS : ∅)` (`main.ts:13483-13484`) — **wierne pinowi tylko dla `viewer = 0`**; dla `viewer ≠ 0` pin jest ROZBIEŻNY (render czyta `explored[0]`, a `V` dopisuje do `explored[viewer]`), reguła do decyzji ABC (§1.5) | `PlayableState.map`, `.units` (+`type_id`), `.cities` (`population`, `culture`), `.forts`, `.war.diplomacy.deals`, `explored[0]` (**BRAK**; dla `viewer ≠ 0` — §1.5), `playerStartHex[viewer]` (**BRAK**), `startRevealRadius` (trudność, `params.difficulty`), `viewer` |
| `landReveal` | `bool` | **BRAK** | `revealAllLand` (`main.ts:13492`); `false` przy `fogActive=false` (`:13506` bez opcji; niezmiennik §1.1) | Flaga sesji (dev M) — **BRAK** |
| `riverReveal` | `Option<Vec<HexCoord>>` (albo indeksy do `map.hexes`) | **BRAK** | `startRevealKeysForRiverFog()` (`main.ts:13074-13080`): `None`, gdy `!isAwaitingFirstPlayerCity()` lub brak heksu startu; inaczej dysk startu. `None` przy `fogActive=false`. **`None` ≠ `Some([])`** (`river_lod.rs:312-314`, `riverLod.ts:366-371`), więc pole musi być `Option`, nie maska równoległa | `is_awaiting_first_player_city` (`player.rs:96`; `gracz_kiedys_mial_miasto` jest w stanie, `playable.rs:526`), `playerStartHex[viewer]` (**BRAK**), `startRevealRadius` |
| (`viewer.fogActive`) | `bool` w `ViewerDto` | JEST (poza `FogViewDto`) | `fogOn` (≡ `useFogRender`, §1.1) | Flaga sesji (dev F) — **BRAK** w silniku; domyślnie `true` (`main.ts:12801`) |

Uwagi do pól:
- `FogState` zakodowany wg `Widocznosc` (D-DTO-10); adapter buduje oba `HashSet` (kontrakt §3.3, §6).
  Z `state` adapter odtwarza dokładnie zbiory webu: `visible = {state==2}`, `explored_render =
  {state>=1}` — bo w pinie `vis ⊆ explored` w chwili `setFog` (`main.ts:13483` przed `:13491`)
  **tylko dla `ME() = 0`** (wtedy `exploredByHuman.get(ME())` i `explored` to ten sam obiekt,
  `:13759`). Dla `ME() ≠ 0` niezmiennik w pinie nie zachodzi (§1.5). Bez tego niezmiennika (`explored` nie zawiera `vis`) kodowanie trójstanowe gubiłoby informację;
  producent musi więc liczyć `E_r` z `∪ V` jak web.
- Zmiana `FogViewDto` = zmiana kontraktu §3.3 i `CONTRACT_VERSION` (`view-model/src/root.rs:14`) —
  decyzja techniczna do zapisania w `REJESTR-RUST.md` (poza allowlistą tego tematu).
- Alternatywa dla `landReveal`/`riverReveal`: przenieść je do `ViewerDto`. Rekomenduję `FogViewDto`
  (to argumenty `setFog`, `scene.ts:356`), ale to wybór techniczny orkiestratora.

## 3. Propozycja podziału na wdrożenia (NIE wdrażać)

Kolejność: W1 → W2 → W3; W4 równolegle z W3 po W1. Wszystkie GAME, port 1:1 wg pinu.

### W1 `R-RUSTPORT-P4-1C-FOG-STATE-Q1` — stan mgły w `PlayableState`
- Zakres: pole `explored_by_owner: BTreeMap<PlayerId, BTreeSet<HexCoord>>` (web `exploredByHuman`),
  `player_start_hex_by_owner: BTreeMap<PlayerId, HexCoord>` (`main.ts:3023-3029`, `:10876-10885`),
  zapis/odczyt v3 `exploredByHuman` (`save.ts:356-363`; wczytanie `main.ts:46393-46411`: brak wpisu
  fotela 0 → pusty zbiór fotela 0). **Bez migracji v2→v3**: zapis `wersja < 3` (pole `explored`)
  odrzucany błędem jak `IncompatibleSaveFormatError` (`save.ts:109-116`, `:380-387`, `:695-706`, ABC-4),
  `seedStartingFog` (`main.ts:12869-12873`) przy nowej grze.
- Allowlista: `engine/src/domain/playable.rs`, `engine/src/domain/save_load.rs`, nowy test
  `engine/tests/p4_1c_fog_state.rs`, ewentualnie golden zapisu (tylko jeśli zmienia się JSON — pole
  pomijane, gdy puste, jak `forts`, `playable.rs:517-519`).
- Wektory: z pinu `save.ts` (round-trip `exploredByHuman`; brak wpisu fotela 0 → pusty; **zapis v2 → błąd**, nie migracja), `addExplored` (już `p6_4_core.rs:196`).

### W2 `R-RUSTPORT-P4-1C-FOG-EXPLORE-WRITERS-Q1` — zapisy odkrycia w silniku
- Zakres: przeniesienie **obu** mutacji z `refreshFog` do silnika — `addExplored(explored[ME()], V)`
  (`main.ts:13483`) i `updateDiplomaticDiscovery(V)` (`:13479`, def. `:22528-22533`: kontakty z
  `computeDiplomaticContacts(V, cities, units)` do `diplomaticallyDiscoveredOwnersSet()` fotela
  `ME()`, bez `eliminatedOwners`; bez tego hooka kontakty dyplomatyczne rozjadą się z pinem) (po każdej zmianie stanu, która
  w webie woła `refreshFog`, `main.ts` — 75 wywołań `refreshFog()`/`addExplored(`, lista
  **NIE_ZMIERZONO** per ścieżka), odkrycie wzdłuż ścieżki ruchu (`:13461`, `:31636`, `:43637`,
  `:44137`, bramka webu `gra/tools/mgla-sciezka-inwariant-test.cjs` jako wzorzec testu) — w pinie
  **do `explored` fotela 0**, odkrycie przy traktacie (`:24573-24584`: `PaktNieagresji`,
  `SojuszDefensywny`, `SojuszPelny`, `UmowaSzlakow`, `UmowaWymiany`; tylko gdy stroną jest
  **fotel 0** na sztywno, `:24580`; zapis do `explored` fotela 0). Fotel docelowy zapisów dla
  `viewer ≠ 0` — wg decyzji ABC z §1.5 (do tego czasu port 1:1: fotel 0).
- Allowlista: moduły ruchu i traktatów silnika (do ustalenia po W1), `engine/src/domain/fog_view.rs`
  (wspólna funkcja `current_visible`), test `engine/tests/p4_1c_fog_explore.rs`.
- Wektory: uruchomiony web — sekwencja ruchów z odkryciem ścieżką vs bez (różnica `explored`).
- Decyzja techniczna: kiedy silnik dopisuje `V` do `explored` (web robi to przy renderze). Propozycja:
  w każdej komendzie mutującej i na końcu tury, z testem równoważności z sekwencją `refreshFog`.

### W3 `R-RUSTPORT-P4-1C-FOG-VIEW-Q1` — producent `FogViewDto` (#212 właściwy)
- Zakres: `current_visible(state, viewer, start_reveal_radius) -> BTreeSet<HexCoord>` wg
  `main.ts:13007-13072` (własne + forty + unia sojuszników + fallback startu **po** unii),
  konwersja `PlayableState → RuchMapa/RuchJednostka`, `fog_view(state, viewer, flags) -> FogViewDto`
  w kolejności `map.hexes` z P4-1B, rozszerzenie `FogViewDto` o `landReveal`, `riverReveal`
  (+ walidacja, testy kluczy JSON, podbicie `CONTRACT_VERSION`), podpięcie tego samego `V` do
  `CityViewInputs.visible_hexes` (P4-1E).
- Allowlista: `engine/src/domain/fog_view.rs` (NOWY), `engine/src/domain/mod.rs` (rejestracja),
  `view-model/src/map.rs`, `view-model/src/validate.rs`, `view-model/tests/{json_keys,json_roundtrip,common/mod}.rs`,
  `engine/tests/p4_1c_fog_view.rs` (NOWY), wektory `engine/tests/p4_1c_vectors/fog.json` (NOWY) + generator.
- Wektory (z uruchomionego webu przy `07d2fbd72`): (a) jednostki+miasta+fort; (b) sojusz obronny
  i pełny vs pakt (unia tylko dla sojuszy); (c) pusta unia → krąg startu z promieniem z trudności
  8/10/5; (d) pusta unia, sojusznik ma widok → **brak** fallbacku startu; (e) `revealAllLand`
  (`state=1` dla lądu, `Morze` 0, `landReveal=true`); (f) `fogOn=false` (wszystko 2,
  `riverReveal=None`); (g) `riverReveal`: przed 1. miastem `Some(dysk)`, po — `None`;
  (h) hot-seat (fotel ≠ 0): **wstrzymane do decyzji ABC (§1.5)**; bez decyzji wektor ma tylko
  potwierdzić zachowanie wybrane przez właściciela, nie regułę per fotel.
- Zależności: P4-1B (kolejność `map.hexes`), W1, decyzja ABC §1.5 (tylko dla `viewer ≠ 0`).

### W4 `R-RUSTPORT-P4-1C-FOG-ADAPTER` — część adaptera w P4-1G (nie osobny temat)
- `state` → `HashSet<HexCoord>` (`TerrainScene::set_fog`), `HashSet<String>` `"q,r"` (miasta, cuda),
  `landReveal` → `set_fog(…, land_reveal)`, `riverReveal` → `merged_river_visible_in_fog(fog_active,
  reveal.as_ref(), …)`. Wpisać do zakresu P4-1G, nie wdrażać tutaj.

## 4. Niepewne (NIE_ZMIERZONO)

1. Czy `PlayableCity.culture` (`playable.rs:368`) to web `kultura` skumulowana z `citySightRadius`
   (`okolica.ts:55`) — nie sprawdzono pochodzenia pola.
2. Pełna lista ścieżek wołających `refreshFog()` w pinie (ok. 75 trafień razem z `addExplored(`)
   i które z nich zmieniają `V` — nie sklasyfikowano.
3. Skąd silnik ma brać flagi sesji `fogOn`/`revealAllLand` (UI dev, `civFogShortcutsEnabled`
   `main.ts:12819-12832`) — `UiState` (P4-5B) czy parametr producenta; nie zmierzono, co już jest w P4-5B.
4. Presety scenariuszy (`main.ts:45409-45410`, `:45658-45659`, `:45892-45893`) — czy Rust je ma.
5. Rozmiar `riverReveal` w JSON (dysk r=10 ≈ 331 heksów) — nie mierzono; szacunek arytmetyczny
   ~6–8 kB z kluczami `{q,r}`.
6. Kolejność zbiorów: Rust `BTreeSet` vs web kolejność wstawiania — dla `state` bez znaczenia
   (równoległe do `map.hexes`); dla `riverReveal` kolejność listy trzeba ustalić (propozycja:
   kolejność `map.hexes`).

## 5. Polecenia (odtwarzalność)

```
git fetch origin rust-port/parity-v2 claude/rust-sivvrn
git rev-parse origin/rust-port/parity-v2        # 83f5fd654…
git grep -n "setFog\|useFogRender\|landReveal\|riverRevealKeys\|ALL_KEYS\|fogOn" 07d2fbd72 -- gra/src
git show 07d2fbd72:gra/src/main.ts | sed -n '12795,12880p;12945,13090p;13470,13520p;13575,13600p'
git show 07d2fbd72:gra/src/game/visibility.ts | sed -n 185,320p
git show 07d2fbd72:gra/src/render/scene.ts | sed -n '3526,3560p;3640,3660p'
git show 07d2fbd72:gra/src/render/riverLod.ts | sed -n 350,380p
git grep -n "compute_player_visibility\|FogViewDto\|explored" -- rust-port
git show origin/claude/rust-sivvrn:dyspozycje/rust-port/p4/P4-1-RENDER-DTO-CONTRACT.md
```
