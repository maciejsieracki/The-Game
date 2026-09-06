# R-BUDYNEK-GARNIZON-NOWY-Q1 — Operator, runda 1/5

STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-BUDYNEK-GARNIZON-NOWY-Q1
GOAL: Nowy budynek Garnizon — kompletny, na równi z każdym innym budynkiem w grze (bez wpinania do Prawa i bez obrony cywilnej).
ZMIANY/COMMIT: `gra/data/buildings.json` (+42 linie, 0 usunięć — wyłącznie nowy rekord `garnizon`), `gra/src/ui/icons/brand/building-icon-map.json` (+1), `gra/src/ui/icons/brand/buildings/bld-garnizon.svg` (NOWY), `gra/tools/budynek-garnizon-test.cjs` (NOWY), `runs/.../dowody/*.png` (3). Commit **`c326f8eadf9334d90d564e2ac22a4b724a900f9d`** na gałęzi `autobot/R-BUDYNEK-GARNIZON-NOWY-Q1` (baza `d2bbd5481ea9bb6297d1e2eed1a635e2d7c06f5d`, potwierdzona `git log -1` przed pracą).
TESTY: bramka tematu **55/55**; `tsc --noEmit` **0 błędów**; pięć bramek referencyjnych bez zmian (213/213, 19/19, 33/33, 13/13, 6/6). Rodzina budynków i kart — 23 bramki, pełna tabela w §Bramki. **Jedyna pozycja, która zmieniła wynik: `grupy-budynkow-test` 80/3 → 79/4** (patrz DECISION_REQUIRED #1). Każdy pozostały czerwony jest pre-istniejący i zmierzony na OBU stanach drzewa (moje pliki chwilowo cofnięte) — identyczny.
BLOKADY: 3 pliki spoza allowlisty (niżej). Zero naruszeń granic §9; zero zmian w plikach zakazanych.
UWAGA DO §11: raport przekracza ~400 słów, bo dispatch wprost zamawia dwie treści obszerne z natury — listę reconu (G1) i tabelę pomiarową z uzasadnieniem per liczba (G3). Kontrakt i wyniki są skondensowane; rozwlekłe są wyłącznie te dwie zamówione sekcje.
RUNDY: 1/5
NASTĘPNY KROK: decyzja orkiestratora o rozszerzeniu allowlisty, potem Evaluator.
DEPLOY/PUSH: NIE WYKONANO

## DECISION_REQUIRED — pliki spoza allowlisty

| # | Plik | Dlaczego | Waga |
|---|---|---|---|
| 1 | `gra/tools/grupy-budynkow-test.cjs` | Ma zaszyte liczniki z 2026-07-27: `buildings.length === 40` i `'Prawo i administracja': 8`. Bramka była **czerwona już przed moją pracą** (41 budynków vs. 40) — mój rekord dokłada czwarty fail tej samej klasy (grupa 8→9). Każdy nowy budynek wymaga bumpu tych liczb. | wymagane |
| 2 | `docs/encyklopedia/budynki/garnizon.md` + `gra/src/data/wikiBundle.json` | Przycisk „Więcej informacji (Civpedia)" jest na karcie zawsze; bez hasła klik jest no-opem. Dotyczy **17 z 42** budynków, w tym wszystkich trzech wzorców (`dom_starszyzny`, `dwor_zarzadcy`, `trybunal`) — Garnizon nie jest tu regresem, tylko dołącza do istniejącej luki. | opcjonalne |
| 3 | `gra/src/game/ai.ts` | AI wybiera budynki z zaszytej listy (`infraOrder`, linia ~1471), nie z `availableProduction` — **AI nigdy nie zbuduje Garnizonu**. Parytet gracz/AI. Sensowniej razem z tematem Prawa (bez wartości Prawa AI nie ma czego wyceniać). | osobny temat |

## G1 — RECON: gdzie w tym repo żyje budynek

Prześledzone przez `grep` po `dom_starszyzny` / `dwor_zarzadcy` / `trybunal` w całym repo.

**Było w dispatchu:** `gra/data/buildings.json`; ikona (`gra/src/ui/icons/brand/buildings/bld-*.svg` + `building-icon-map.json`); karta encji (`gra/src/ui/entityCards/buildingAdapter.ts` → `renderer.ts`, host `cityPanel.ts::buildBuildingDetailCard`); `historia` (pole w `buildings.json`); kolejka budowy (`cityPanel.ts::renderBuildList`); lista budynków w panelu miasta.

**NIE było w dispatchu — znalezione reconem:**

| Miejsce | Rola | Czy wymaga wpisu per budynek |
|---|---|---|
| `gra/src/game/production.ts` — `availableProduction`, `eraBuildingCatalog`, `buildingLocationAllowed`, `CITY_BUILDING_PREREQ` | dostępność w produkcji, bramki tech/lokalizacja/prereq | NIE (dane), chyba że budynek ma prereq miejski |
| `gra/src/game/building-upgrades.ts` — `BUILDING_GROUP_ORDER`, `STRUCTURAL_DEFENSE_PARAM_KEY` | kolejność 8 grup panelu, obrona strukturalna | NIE (grupa z `BuildingDef.grupa`) |
| `gra/src/game/{building-stock-cost,economy-upkeep,unit-building-bonuses,building-resource-gate}.ts` | koszt z magazynu, utrzymanie, bonusy pancerza, bramka surowcowa | NIE (dane) |
| `gra/data/tech.json` — kolumna „Odblokowuje budynek" | drzewko: co odblokowuje technologia | TAK, **ale tylko przy realnym `techUnlock`** — omijam wpisując `"-"` |
| `docs/encyklopedia/budynki/*.md` + `gra/src/data/wikiBundle.json` (generowany) | hasło CivPedii | opcjonalnie (17/42 nie ma) |
| `gra/src/game/ai.ts` | priorytety budowy AI | TAK, ręcznie — **luka parytetu** |
| `gra/tools/grupy-budynkow-test.cjs` | zaszyte liczniki 40 / per grupa | TAK, ręcznie |
| `gra/tools/koszty-surowcowe-test.cjs` | reguła A: epoka 1 = **wyłącznie drewno** | NIE, ale narzuca kształt `koszt_surowce` |
| `gra/data/society-params.json`, `society-breakdown.ts`, `main.ts`, `cityPanel.ts` (`hasDomStarszyzny…`) | wartość Prawa | osobny temat (zakazane) |
| `gra/src/game/{siege,siegeDefenders}.ts` | obrona cywilna | osobny temat (zakazane) |
| `Gra-FINALNA.html`, `gra-robocza/*.html` | zbudowane bundle | powstają przy deployu, nie ręcznie |

**Trzy niespójności zastane (nie moje, nie ruszam):** `trybunal` w ogóle nie ma wpisu w `building-icon-map.json` (leci na heurystykę kategorii → `bld-admin`); plik `bld-pretorium.svg` istnieje, ale mapa kieruje `pretorium` na `bld-palac`; **`civpedia-gra-id-mostek-test.cjs` przy uruchomieniu nadpisuje śledzony `gra/src/data/wikiBundle.json`** — treść bez zmian, ale stempel `"generated"` dostaje dzisiejszą datę, więc bramka brudzi `git status` plikiem spoza allowlisty tematu (wykryłem i cofnąłem `git checkout --`; drzewo czyste).

## G2–G5, G7 — rekord, liczby, bramka tech, ikona

Rekord wstawiony za `trybunal`; komplet 20 pól (18 wspólnych dla `dwor_zarzadcy` i `trybunal` + `lokalizacja` + `dajeSzczescie`). `id: garnizon`, `nazwa: Garnizon`, `kategoria: Administracja`, `grupa: Prawo i administracja`, `epokaWejscia: 1`, `lokalizacja: region`, `maksPoziom: 1`, **`dajeSzczescie: false`**, **`upgradeFrom` nieobecne**.

`baza` i `przyrost` = **same zera, świadomie**: cała wartość Garnizonu to Prawo (25/35/47), a tego temat celowo nie wpina. Dopisanie tu kultury czy pieniądza byłoby wymyślaniem balansu.

**G4 — `techUnlock: "-"` (bez bramki badań).** Uzasadnienie: `"-"` to udokumentowany marker „dostępny od startu" (`production.ts:815`), używany przez oba pozostałe budynki Prawa epoki 1 — Pałac i Dom Starszyzny. Prawo jest potrzebne od pierwszej tury, a każda realna technologia epoki 1 (Garncarstwo 40, Murarstwo 56, Mistycyzm 40) odsunęłaby Garnizon o kilkanaście tur. Efekt uboczny: **żadnej zmiany w `tech.json`** (spoza allowlisty).

**G5 — ikona:** `gra/src/ui/icons/brand/buildings/bld-garnizon.svg` (viewBox 24, `stroke="#e8d88a"`, `stroke-width 1.5` — kanon zestawu) + wpis własny w `building-icon-map.json`. Motyw: baszta strażnicza z blankami i wartownią przy bramie — porządek, nie oblężenie (odróżnia od `bld-koszary` z włócznią i tarczą).

**G7 — `historia`:** 5 zdań, rejestr jak u sąsiadów — mezopotamskie i egipskie oddziały wartownicze, Medżaj, scytyjscy łucznicy na agorze, rzymskie *cohortes urbanae* i *vigiles*; puenta wprost pod uzasadnienie właściciela (wojsko odchodzi, garnizon zostaje).

## G3 — PROPOZYCJA liczb (do zatwierdzenia przez właściciela)

Pomiar sąsiadów — w nawiasie wartość efektywna w grze (silnik mnoży ×2 wszystkim tak samo):

| Budynek | ep. | kosztBudowy | przyrostKosztu | utrzymanie | koszt_surowce | maksPoziom |
|---|---|---|---|---|---|---|
| Dom Starszyzny | 1 | 25 (50 Pracy) | 5 | 1 (2 zł, 5 drew./t) | drewno 30 (60) | 1 |
| Pałac (stolica) | 1 | 40 (80) | 12 | 2 (4 zł) | — | 1 |
| Trybunał | 2 | 30 (60) | 10 | 1 (2 zł) | drewno 30 + kamień 40 | 2 |
| Dwór Zarządcy | 2 | 45 (90) | 9 | 2 (4 zł) | drewno 30 + kamień 30 | 1 |
| Sąd / Pretorium | 3 | 55 / 75 | 12 / 15 | 2 / 3 | drewno+cegła | 1 |
| **GARNIZON (propozycja)** | **1** | **30 (60 Pracy)** | **6** | **2 (4 zł, 5 drew./t)** | **drewno 30 (60)** | **1** |

Uzasadnienie, jedno zdanie na liczbę:
- **kosztBudowy 30** — droższy od Domu Starszyzny (25), bo to kwatery i posterunek, a nie izba obrad; tańszy od każdego urzędu epoki 2, bo ma być realnie osiągalny w pierwszych turach.
- **przyrostKosztu 6** — trzyma proporcję 1/5 kosztu budowy, tę samą co Dom Starszyzny (25/5), Dwór Zarządcy (45/9) i Pretorium (75/15); pole i tak martwe przy `maksPoziom 1`.
- **utrzymanie 2** — dokładnie punkt odniesienia z dispatchu („waga jak Dwór Zarządcy"); strażnicy biorą żołd, rada starszych nie.
- **przyrostUtrzymania 1** — wartość jednolita dla wszystkich budynków administracyjnych.
- **koszt_surowce: drewno 30** — epoka Kamienia dopuszcza wyłącznie drewno (reguła A `koszty-surowcowe-test`), a 30 to stawka Domu Starszyzny i Targowiska.
- **maksPoziom 1** — Garnizon nie awansuje poziomem; jego wartość rośnie tablicą epok (25/35/47), tak jak `prawo_max_epoka`.

## Reguła przeciw samooszukiwaniu — dowody

- **Tryb 1 (budynek-widmo):** zrzuty z żywego Chromium w `dowody/` — obejrzane. `garnizon-kolejka-budowy.png`: „Garnizon" z aktywnym przyciskiem **Buduj** w sekcji „Dostępne do budowy" miasta regionalnego epoki 1, tuż pod Domem Starszyzny. `garnizon-karta-encji.png`: pełna karta — medalion z własną ikoną, nazwa, „Administracja", rys historyczny kursywą, Charakterystyka (Kamień, unikalny w mieście), Koszty (60 pkt Pracy, +6/poziom, 4 Pieniądza + −5 Drewno/t, 60 Drewno z magazynu), stopka Civpedii, „Technologia: Brak wymogu (startowa)".
- **Tryb 2 (kopiuj-wklej):** `upgradeFrom` nieobecne; asercje na obie strony relacji + dowód zachowaniem silnika (`applyCompletedBuildingIds`): awans Dom Starszyzny → Dwór Zarządcy **zostawia** Garnizon, a ukończenie Garnizonu **nie kasuje** Domu Starszyzny.
- **Tryb 3 (ciche liczby):** cała tabela G3 oznaczona jako propozycja; bramka celowo **nie zamraża** wartości (asercje na typ i regułę surowca, nie na `30`/`2`), żeby decyzja właściciela nie wymagała poprawki testu.
- **Tryb 4 (tautologia):** mutacja **M1** — usunięcie pola `historia` z rekordu → **52 pass / 3 fail** (`[A2]` komplet pól, `[K]` treść, `[E5]` sekcja na karcie). Mutacja **M2** — wstawienie dokładnie tej pułapki, przed którą ostrzega dispatch (`upgradeFrom: "dom_starszyzny"`) → **51 pass / 4 fail**, w tym Garnizon **znika z listy budowy** w żywym renderze. Obie cofnięte, `git diff --stat` z powrotem 42 wstawienia / 0 usunięć.
- **C-001:** zero `npm run build`/`dev`; jedyna kompilacja `node ./node_modules/typescript/bin/tsc --noEmit`. Po każdej zmianie `git diff --stat gra/data/` — **stale 42 wstawienia, 0 usunięć, wyłącznie rekord `garnizon`**.

## Nowa bramka

`gra/tools/budynek-garnizon-test.cjs` — 55 asercji w trzech częściach: [A] dane + ikona, [B] silnik produkcji (esbuild→node), [C] żywe Chromium (`renderBuildList` + `buildBuildingDetailCard`, realne funkcje `cityPanel.ts` eksportowane tylko w buforze esbuild, plik w repo nietknięty). Stuby ikon generowane do katalogu tymczasowego systemu — bramka nie dokłada plików do repo. Stub `buildingIconSvg` czyta **realną** mapę i **realną** treść SVG, więc medalion na zrzucie to prawdziwa ikona, a usunięcie wpisu z mapy czerwieni asercję `[I4]`.

## Bramki — wyniki (przed → po; „=" gdy bez zmiany)

| Bramka | Wynik | | Bramka | Wynik |
|---|---|---|---|---|
| budynek-garnizon (NOWA) | **55/0** | | civpedia-budynki-historia | 136/0 |
| tsc --noEmit | **0 błędów** | | civpedia-gra-id-mostek | PASS |
| logic | 213/0 = | | entity-card-contract | 75/0 |
| tech-tree | 19/0 = | | entity-card-historia-section | 31/0 |
| research | 33/0 = | | building-detail-card-hover-layout | 11/0 |
| unit-replace | 13/0 = | | building-detail-card-entitycard-migr. | 51/1 = (pre-ist.) |
| combat | 6/0 = | | owned-building-detail-side | 17/0 |
| koszty-surowcowe | 125/3 → **126/3** | | owned-building-inactive | 4/0 |
| plony-budynkow | 68/0 = | | panel-kolejka-pasek-postepu | 82/0 |
| prereq-budynkow | 51/8 = (pre-ist.) | | building-gate-audit | OK (informacyjna) |
| upgrade-budynki | 48/1 = (pre-ist.) | | building-tech-gate | 89/0 |
| building-queue-refund | 2/3 = (pre-ist.) | | building-cost-tempo | 6/0 |
| administracja-stolica | 52/1 = (pre-ist.) | | building-happiness | 8/0 |
| deposit-building-gate | 46/1 = (pre-ist.) | | unit-building-bonuses | 82/0 |
| prawo-siatka-v2 | 55/0 = | | szczescie-skala-normalizacja | 132/0 = |
| **grupy-budynkow** | **80/3 → 79/4** | | ai-buduje-budynki | **42/0** (zielona) |

`koszty-surowcowe` zyskuje jeden PASS — Garnizon przechodzi regułę „epoka Kamienia = wyłącznie drewno". Pre-istniejące czerwone (`prereq`, `upgrade`, `queue-refund`, `administracja-stolica`, `deposit-building-gate`, `entitycard-migration`) zmierzone dwukrotnie: z moimi plikami i po ich chwilowym cofnięciu — te same nazwy i liczby, zero związku z Garnizonem.

`ai-buduje-budynki` jest **zielona (42/0)** i to NIE unieważnia DECISION_REQUIRED #3: ta bramka sprawdza, czy miasta AI mają w ogóle jakiś budynek, a nie czy AI potrafi postawić KAŻDY budynek. Luka parytetu przy Garnizonie jest niewidoczna dla tej bramki. Uczciwa nota: pierwszy przebieg tej bramki wywalił się na `Target page ... has been closed` — była to moja własna kolizja (dwa równoległe uruchomienia tego samego testu dzielą artefakty `.entry.ts`/`.bundle.cjs` w `gra/tools/`), nie defekt gry; wynik 42/0 pochodzi z przebiegu w pojedynkę.
