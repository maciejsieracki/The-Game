# P4.7 — Specyfikacja nowych modeli 3D: miasta (brąz, żelazo), 5 cudów parkowanych, porty modeli „nieużywanych”, reguła modelu jednostki

**Temat:** `R-RUSTPORT-P4-7-NEW-MODELS-SPEC-Q1` · **Domena:** GAME · **Rola:** Operator (Opus 5.5 medium, wyjątek graficzny R-PROC-AUTOBOT §5a) · **Runda:** 1/5
**Decyzje wejściowe właściciela (LEDGER 2026-10-21, po P4.4):** D-MOD-4 = C (dorobić brakujące modele miast teraz), D-MOD-5 = B (proste modele 5 cudów parkowanych), D-MOD-3 = B (portować wszystkie istniejące modele, także nieużywane), D-MOD-9 = A (jedna jednostka = jeden model wszędzie).
**Charakter dokumentu:** specyfikacja projektowa. Nie powstał żaden kod Rust/TS ani grafika. Nie uruchamiano buildu, `npm` ani weba. Nie zmieniono `gra/**`, `rust-port/**`, `src-tauri/**`.
**Pin web (tylko odczyt):** `edb8fb56`, wyłącznie `git show edb8fb56:<ścieżka>` / `git grep … edb8fb56`. **Baza dokumentu:** `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0` @ `da03ce40`.
**Wejście:** `p4/P4-4-MODEL-CATALOG.md` (§2.1–§2.3, §4.2, §5, D-MOD-1..9), `p4/P4-3-RUST-RENDERER-ARCH.md` (§3.2 kamera, §4 potok modeli, §8 tematy RR-T*), `gra/data/civs.json`, `gra/data/wonders.json`, `gra/data/buildings.json`, `gra/data/tech.json`, `gra/src/render/{cities,miasto-kamien,miasto-braz,bronzeCity,bronzeCityRoblox,wonderModels,wonderRenderer,units}.ts`, `gra/src/game/{civ-entry-epoch,owner-epoch,era-gate-ui}.ts`, `p1/P1-16F-CIVPEDIA-CYWILIZACJE.md`, `p1/P1-16F-CIVPEDIA-CUDA.md`.

**Legenda dowodów.** `plik:linia` = blob `edb8fb56` (ścieżki względem `gra/src/`, o ile nie podano inaczej). „cmd → wynik” = wynik z tej sesji. `NIE_ZMIERZONO` = nie sprawdzono; nie wnioskuję z nazw. `[zewn.]` = wiedza historyczno-kulturowa spoza repo, **niezweryfikowana** — używana wyłącznie jako referencja wizualna, nigdy jako twierdzenie o danych gry. „**propozycja**” = treść projektowa do akceptacji właściciela (wymiary, palety, kompozycje nowych modeli nie mają w repo wzorca 1:1).

**Pomiary (odtwarzalne).** Liczby meshy, trójkątów, materiałów i gabarytów żywych modeli policzyłem, a nie przepisałem z komentarzy: `python3 -I dyspozycje/autobot/runs/R-RUSTPORT-P4-7-NEW-MODELS-SPEC-Q1/skrypty/run_measure.py` (z katalogu repo). Skrypt bierze pliki z `git show edb8fb56:`, kopiuje je do katalogu tymczasowego poza repo, podstawia `three` ręcznym mockiem (`skrypty/three-mock.js`, reguły liczenia trójkątów generatorów three r169 opisane w nagłówku) i uruchamia `skrypty/measure.ts` przez `node --experimental-strip-types`. Bez `npm`, bez buildu, bez uruchamiania weba. Wynik: `wyniki/measure.txt`, `wyniki/loc.txt`. **Walidacja mocka:** zmierzone trójkąty 30 konfiguracji miast są identyczne z wartościami zapisanymi w kodzie (`MIASTO_KAMIEN_LAYOUT.triPoziomy`, `MIASTO_BRAZ_LAYOUT.triPoziomy`, `miasto-kamien.ts:651`, `miasto-braz.ts:881-884`), a przyrost muru = 324/344 zgodnie z `miasto-braz.ts:886` (`wyniki/measure.txt`, wiersze `DEKLAROWANE`/`ZMIERZONE`, `MUR KAMIENNY`).

---

## 0. Streszczenie (dla właściciela)

1. **Luka miast jest większa, niż sugeruje „2 zestawy”.** W grze epoki są 3 (Kamień, Brąz, Żelazo — `tech.json` ma tylko te 3 wartości `Epoka`). Osiągalnych kombinacji „państwo × epoka” jest **37** (kaskada `epokaWejscia`). Dedykowany model ma **10**: 8 × wspólny Kamień (wspólny z założenia projektu) + Grecy/Brąz + Rzymianie/Brąz. **27 kombinacji jedzie na fallbacku**: 12 w Brązie (zestaw grecki) i wszystkie 15 w Żelazie (model Brązu) — §1.2.
2. **Rekomendacja: wariant B — 8 nowych zestawów Brązu według kręgów kulturowych + 10 „nakładek Żelaza”** (po jednej na każdy krąg, łącznie z Grecją i Rzymem). Razem 18 nazwanych zestawów miast, koszt ≈ **13 J** (1 J = jeden pełny zestaw 10 poziomów ≈ 300 linii TS w webie, zmierzone). Wariant minimum A ≈ 10 J, wariant pełny C (1 zestaw na państwo) ≈ 19,5 J → `D-NM-1`.
3. **Kanon stylu jest zmierzony** (§2): wyłącznie Box / Cylinder seg 3–8 / Cone seg 4–6 / Circle 6, Lambert `flatShading`, zero tekstur, zero losowości, 10 poziomów w 3 fazach, budżet na poziom = średnia 3 żywych zestawów + 10% (L1 ≤ 207 tri / 17 mesh … L10 ≤ 1087 tri / 86 mesh), mur kamienny ≤ 368 tri.
4. **5 cudów parkowanych** dostaje proste modele w budżecie ≤ 320 tri / ≤ 25 mesh (średnia 19 istniejących + 10%); dziś wszystkie wpadłyby w `default` (walec + stożek, 36 tri). Dane mają sprzeczność przy „Kopcu grobowym” (nazwa vs `nazwaAlt` Monks Mound vs cywilizacja `celtowie`) → `D-NM-7`.
5. **Porty „nieużywanych” (D-MOD-3 = B):** 11 geometrii bez rekordu w danych (5 modeli nazwanych, 2 martwe funkcje w `units.ts`, 4 martwe eksporty `jednostki-p1-rdzen.ts`) wchodzą do paczek P4.4 MOD-04/06/07 jako modele dostępne z rejestru i galerii, nie z danych gry (§4.1).
6. **Reguła modelu jednostki (D-MOD-9 = A):** model wybiera **wyłącznie identyfikator typu** (`Jednostka` z `units.json`, 75/75 unikalnych) przez statyczną tabelę `UnitTypeId → ModelId` wyliczoną raz z dzisiejszej ścieżki PL. Nazwy wyświetlane (PL/EN) nigdy nie biorą udziału w wyborze modelu. Usuwa to 3 rozjazdy bitwy (§4.2).
7. **Paczki:** 10 nowych paczek `R-RUSTPORT-P4-NM-00..09` (§5.2). 9 z nich wymaga oceny wizualnej właściciela po każdej paczce. Twarde zależności: P4.6 (szkielet crate'a), RR-T4 (prymitywy), RR-T5 (materiały), P4.4 MOD-09 (port 1:1 miast — dostarcza helpery i referencję Grecja/Rzym/Kamień) oraz MOD-12 dla cudów.
8. **Największe ryzyka:** brak wzorca 1:1 i subiektywność oceny, brak GPU w środowisku agentów (zrzuty tylko na maszynie z GPU), anachronizmy kulturowe (Zulusi, Inkowie, Harappa w Żelazie), pomylenie centrum miasta z cudem tej samej kultury (§5.4). Do decyzji: **15 punktów `D-NM-n`** (§6).

---

## 1. Lista brakujących modeli (zadanie 1)

### 1.1 Jak web wybiera model miasta (łańcuch z dowodami)

| Krok | Dowód |
|---|---|
| Epoka miasta = epoka właściciela | `main.ts:2593` `getEra: (ownerId) => empireEpochForOwner(ownerId)`; `main.ts:2090-2093` (człowiek: `playerStateByHuman…era`, AI: `ownerEraByOwner`) |
| Liczba epok w grze = 3 | `git show edb8fb56:gra/data/tech.json` + `Counter(Epoka)` → `{'Kamień': 12, 'Brąz': 12, 'Żelazo': 8}`; `game/era-gate-ui.ts:24` `ERA_LABELS = ['Kamień', 'Brąz', 'Żelazo']`; `game/owner-epoch.ts:92-99` `maxDefinedEra` = maks. epoka z `tech.json` |
| Klucz cywilizacji modelu | `main.ts:2599` `getCiv: (ownerId) => ikonaIdToBronzeCiv(civTypeForOwner(ownerId))`; `render/bronzeCity.ts:23-40` mapuje 15 `ikonaId` na 11 kluczy `BronzeCiv` (babilonia/harappa/asyria → `sumer`, slowianie → `germanie`, fenicjanie → `hetyci`, fallback `grecja`) |
| Poziom 1..10 = ludność | `main.ts:2600-2603` `Math.max(1, Math.min(10, c.population ?? 1))` |
| Rodzaj muru | `main.ts:2605-2609`: budynek `mury`/`fort` → `stone`, `palisada` → `palisada`, inaczej `none` |
| Wybór buildera (styl gry `roblox`) | `render/cities.ts:229-249`: era ≥ 2 → `buildMiastoBraz(civ, level, {mur, palisada, color})`; era 1 → `buildMiastoKamien(level, {mur, color})`. Komentarz `cities.ts:240` „era 3+ (Żelazo, brak modelu) [fallback do czasu partii Żelaza]” |
| Router Brązu | `render/miasto-braz.ts:866-873`: `civ === 'rzym'` → `buildMiastoBrazRzym`, każdy inny klucz → `buildMiastoBrazGrecja` |
| Kamień wspólny z założenia | `render/miasto-kamien.ts:69-70` „Epoka kamienia wspolna dla cywilizacji (roznice per-cyw od Brazu) — parametr civ zbedny” |
| Przebudowa modelu | `cities.ts:481` `visualKey` = styl, era, civ, poziom, rodzaj muru (łączone znakiem pionowej kreski); `cities.ts:490-527` buduje nowy model tylko przy zmianie klucza |
| Osiągalność państwa w epoce | `game/civ-entry-epoch.ts:1-8,46-51` (kaskada: wejście w X → dostępne w X i później); `civs.json` `epokaWejscia`: 8 × `kamien`, 6 × `braz`, 1 × `zelazo` (odczyt skryptem, tabela §1.2) |

### 1.2 Tabela 15 państw × 3 epoki — co dostają dziś

Legenda statusu: **D** = model dedykowany, **W** = wspólny z założenia (Kamień), **F** = fallback (cudzy model), **—** = kombinacja nieosiągalna (państwo wchodzi później). Źródło wierszy: `civs.json` (`Cywilizacja`, `ikonaId`, `epokaWejscia`).

| # | Państwo | `ikonaId` | klucz `BronzeCiv` dziś | `epokaWejscia` | Kamień (era 1) | Brąz (era 2) | Żelazo (era 3) |
|---:|---|---|---|---|---|---|---|
| 1 | Grecy | grecy | grecja | kamien | W `buildMiastoKamien` | **D** Grecja | F Grecja (Brąz) |
| 2 | Rzymianie | rzymianie | rzym | kamien | W | **D** Rzym | F Rzym (Brąz) |
| 3 | Chińczycy | chinczycy | chiny | kamien | W | F Grecja | F Grecja (Brąz) |
| 4 | Inkowie | inkowie | inka | kamien | W | F Grecja | F Grecja (Brąz) |
| 5 | Zulusi | zulusi | zulu | kamien | W | F Grecja | F Grecja (Brąz) |
| 6 | Egipt | egipt | egipt | kamien | W | F Grecja | F Grecja (Brąz) |
| 7 | Sumerowie | sumer | sumer | kamien | W | F Grecja | F Grecja (Brąz) |
| 8 | Celtowie | celtowie | celtowie | braz | — | F Grecja | F Grecja (Brąz) |
| 9 | Germanie | germanie | germanie | braz | — | F Grecja | F Grecja (Brąz) |
| 10 | Harappa | harappa | sumer | kamien | W | F Grecja | F Grecja (Brąz) |
| 11 | Hetyci | hetyci | hetyci | braz | — | F Grecja | F Grecja (Brąz) |
| 12 | Słowianie | slowianie | germanie | zelazo | — | — | F Grecja (Brąz) |
| 13 | Babilonia | babilonia | sumer | braz | — | F Grecja | F Grecja (Brąz) |
| 14 | Asyria | asyria | sumer | braz | — | F Grecja | F Grecja (Brąz) |
| 15 | Fenicjanie | fenicjanie | hetyci | braz | — | F Grecja | F Grecja (Brąz) |

**Liczby (z tabeli):** osiągalne kombinacje 8 + 14 + 15 = **37**. Model dedykowany lub wspólny-z-założenia: **10** (8 × W + 2 × D). Fallback: **27** = 12 (Brąz) + 15 (Żelazo). Brak modelu Żelaza jest całkowity (0/15).
**Uwaga do D-MOD-4:** dispatch mówi o „Grecji jako fallbacku dla 13 pozostałych państw” — to 13 z 15 państw w danych; w Brązie osiągalnych fallbacków jest 12, bo Słowianie wchodzą dopiero w Żelazie.
**Kamień:** nie traktuję jako luki — wspólny zestaw jest decyzją projektową w kodzie (`miasto-kamien.ts:69-70`). Rozszerzenie na kręgi to opcja `D-NM-5`.
**Ghost założenia miasta** (`settlementModel.ts:20-23` → `bronzeCityRoblox.ts`) ma już 11 wariantów per klucz `BronzeCiv` (`bronzeCityRoblox.ts:212-317` świątynie, `:319-381` domy), ale to tylko podgląd przy zakładaniu (P4.4 §2.2). Jego relacja do nowych zestawów → `D-NM-11`.

### 1.3 Propozycja liczby zestawów (kręgi kulturowe) i koszt

**Jednostka kosztu J** = jeden pełny zestaw miasta (10 poziomów, 3 fazy budynku centralnego, 4–6 typów domów/rekwizytów, mur). Proxy z webu (`wyniki/loc.txt`): sekcja GRECJA w `miasto-braz.ts` = **299 linii**, sekcja RZYM = **308 linii**, wspólne API/router/layout = 116 linii, cały `miasto-kamien.ts` = 667 linii (z palisadą). Przyjmuję **1 J ≈ 300 linii TS**. „Nakładka Żelaza” (ten sam szkielet 10 poziomów i te same pozycje, wymienione budynki centralne fazy 2–3, część domów i mur) szacuję na **0,5 J** — to założenie, a nie pomiar (`NIE_ZMIERZONO` do pierwszej paczki). Koszt w liniach Rust: `NIE_ZMIERZONO`.

| Wariant | Brąz — nowe zestawy | Żelazo — nakładki | Zestawy razem | Koszt | Uwagi |
|---|---|---|---:|---:|---|
| **A — minimum** | 6 kręgów: Bliski Wschód (sumer, babilonia, asyria, harappa, egipt), Anatolia-Lewant (hetyci, fenicjanie), Europa Płn. (celtowie, germanie), Azja Wsch. (chinczycy), Andy (inkowie), Afryka Płd. (zulusi) | 8 (Grecja, Rzym + 6 kręgów) | 14 | 6 + 4 = **10 J** | Egipt i Harappa w jednym zestawie z Mezopotamią — tracą najsilniejsze wyróżniki (pylon/obelisk, siatka ulic) |
| **B — rekomendacja** | 8 kręgów: Mezopotamia (sumer, babilonia, asyria), Egipt, Indus (harappa), Anatolia-Lewant (hetyci, fenicjanie), Europa Płn. (celtowie, germanie), Azja Wsch. (chinczycy), Andy (inkowie), Afryka Płd. (zulusi) | 10 (Grecja, Rzym + 8 kręgów; Słowianie w nakładce Europy Płn.) | 18 | 8 + 5 = **13 J** | Zgodne z podziałem, który web już stosuje w ghost (`BronzeCiv`), z dwiema zmianami: Harappa wydzielona z `sumer`, Celtowie i Germanie złączeni |
| C — pełny | 12 (każde państwo osiągalne w Brązie bez Grecji/Rzymu) | 15 | 27 | 12 + 7,5 = **19,5 J** | Najwyższa wierność, koszt ×1,5 względem B, 15 ocen wizualnych Żelaza |

**Uzasadnienie B.** (1) Egipt i Harappa mają w danych własne cuda i jednostki (Piramidy, Stupa w Sanchi; Medżaj, Strażnik bram Harappy — `wonders.json → panstwa`, P4.4 §2.1b), a ich architektura ma wyróżniki, których nie da się oddać paletą (pylony i obeliski; ortogonalna siatka ulic z wypalanej cegły) `[zewn.]`. (2) Sumer/Babilonia/Asyria dzielą ten sam zestaw środków (cegła mułowa, ziggurat) i web już je zwija w jeden klucz (`bronzeCity.ts:29-30`). (3) Celtowie i Germanie dzielą drewno, strzechę i palisadę; różnicę (dom okrągły vs długi) oddaje proporcja typów domów, nie osobny zestaw (§3.2, B-EP). (4) Hetyci i Fenicjanie są już zwinięci w webie (`bronzeCity.ts:33`). Akcent palety per państwo wewnątrz kręgu → `D-NM-15`.

### 1.4 Epoka Żelaza — modele miasta

Wariant B: **10 nakładek Żelaza** (Z-GR, Z-RZ, Z-ME, Z-EG, Z-IN, Z-AL, Z-EP, Z-AZ, Z-AN, Z-AF; spec w §3.3). Każda nakładka używa szkieletu swojego zestawu Brązu (te same pozycje azymut/promień, te same progi faz), wymienia budynek centralny faz 2–3, podnosi materiał części domów i wymienia mur kamienny. Grecja i Rzym dostają nakładki na zestawy istniejące w webie (port 1:1 w P4.4 MOD-09). Słowianie (`epokaWejscia = zelazo`) potrzebują wyłącznie modelu Żelaza — dostają Z-EP (ewentualny osobny gród → `D-NM-4`).

### 1.5 Pięć cudów „parkowanych” (D-MOD-5 = B)

Dane: `wonders.json → parkowane_epoka4plus` (5 rekordów, wszystkie `aktywne: false`). Dziś: `wonderModels.ts:427-486` nie ma `case` dla tych id, więc dostałyby `default` (`:473-478`: walec seg 6 + stożek seg 6, **2 mesh / 36 tri**, `wyniki/measure.txt` wiersz `cud default`). Strona podglądu cudów pisze wprost: „5 parkowanych (Średniowiecze+): … — bez modelu v1” (`wonderpreview/index.html:105`). Hasła CivPedii dla nich **nie ma** (`p1/P1-16F-CIVPEDIA-CUDA.md` audytował 19 haseł; `git grep -l -i -E 'nalanda|angkor|teodoryk|monks mound' edb8fb56 -- gra` → tylko `wonders.json`, `wonderpreview/index.html`, `Gra-podglad-POLE-BITWY.html`), więc opis pochodzi z pól danych + `[zewn.]`.

| id | `nazwa` (dane) | `cywilizacje` | `epokaDocelowa` / opis (dane) | `wymagaTerenu` | `uwagi` (dane) | Co przedstawia `[zewn.]` | Jak rozpoznać na mapie |
|---|---|---|---|---|---|---|---|
| `nalanda` | Nalanda | harappa | 4 — „V–XIII w. n.e. — średniowiecze; uniwersytet Guptów/Harszy” | rownina | przeniesione z Antyku 2026-06-26 | buddyjski klasztor-uniwersytet z ceglanych bloków-klasztorów (vihara) z dziedzińcami i wysoką schodkową świątynią | rząd kwadratowych ceglanych bloków z ciemnym dziedzińcem + jedna wysoka schodkowa wieża z narożnymi wieżyczkami |
| `angkor_wat` | Angkor Wat | harappa | 5 — „ok. 1113–1150 n.e. — Khmer; przypisanie państwa do ustalenia” | rzeka_sasiad | przeniesione z Antyku | khmerska świątynia-góra: 5 wież w układzie kwinkunksu na tarasach, fosa, grobla | 5 wież (1 wyższa w środku) na schodkowym tarasie otoczonym wodą |
| `wielki_dzwon` | Wielki dzwón (Yongle / Emile Bell) | chinczycy | 6 — „Dzwon Ming (1403–1424, Yongle); świątynia Qing (1733) — poza Antykiem” | trudny_teren | przeniesione z Antyku | wielki brązowy dzwon wiszący w otwartym pawilonie z czerwonymi kolumnami i dachem czterospadowym | brązowy dzwon widoczny pod dachem otwartego pawilonu |
| `mauzoleum_teodoryka` | Mauzoleum Teodoryka | germanie | 4 — „VI w. n.e. — Ostrogoci, Ravenna; poza Antykiem” | plytkie_morze | zastąpione w Antyku przez Osadę Aschaffenburg | dwukondygnacyjna dziesięcioboczna kamienna rotunda nakryta płaską monolityczną kopułą z „uchami” | niski, gruby, wielokątny kamienny walec z płaską kopułą — jedyny „rotundowy” cud |
| `kopiec_grobowy` | Kopiec grobowy (`nazwaAlt`: Monks Mound (Mississippian)) | celtowie | 1 — „Kultura missisipiańska — historycznie nie Galowie” | rzeka_sasiad | zastąpione przez Roquepertuse; placeholder Monks Mound | ziemny kopiec-platforma z tarasami i drewnianym budynkiem na szczycie (Monks Mound) — **albo** celtycki kurhan (sprzeczność danych → `D-NM-7`) | trawiasty, ścięty, tarasowy kopiec z rampą i małym budynkiem na szczycie |

---

## 2. Kanon stylu „roblox” — słownik formy z liczbami (zadanie 2)

Źródła: żywe modele mapy `miasto-kamien.ts`, `miasto-braz.ts`, `wonderModels.ts` (P4.4 §2.2–2.3) + wszystkie liczby z `wyniki/measure.txt`.

### 2.1 Prymitywy i helpery

| Model | Prymitywy użyte (zmierzone, liczba meshy na L10 bez muru) | Helpery |
|---|---|---|
| Kamień L10 | Box 67, Cone4 5, Cone5 1, Cone6 3, Cyl6 4, Cyl8 1, Circle 1 | `B` (box ze środkiem i obrotem), `CYL`, `CONE` — `miasto-kamien.ts:98-136` |
| Grecja L10 | Box 56, Cyl5 7, Cyl3 2 (pryzma dachu), Cyl4 3, Cyl6 1, Cone4 1, Circle 1 | `B`, `CYL` (seg 6 domyślnie), `CONE` (seg 4), `PRISM_X`/`PRISM_Z` = walec seg 3 — `miasto-braz.ts:108-161` |
| Rzym L10 | Box 65, Cyl5 2, Cyl6 5, Cone4 3, Cone6 4, Circle 1 | j.w. |
| 19 cudów | Box, Cyl4/6/8/10/12/24, Cone4/6/8/10 | `box/cyl/cone` z `y` liczonym od podstawy (`wonderModels.ts:33-62`) |

**Słownik:** dozwolone bryły nowych modeli = Box, Cylinder seg 3 (pryzma dachu), 4 (ścięty ostrosłup po obrocie o 45°, gdy `rt ≠ rb`), 5, 6, 8 (10–12 tylko dla dużych okręgów cudów), Cone seg 4/5/6/8, Circle seg 6 (plac). **Nieużywane w żywych miastach i cudach:** Sphere, Torus, Ico/Dodeca/Octa, Extrude, Shape, Tube, Lathe, `BufferGeometry` (`wyniki/measure.txt`: `EXTRUDE_HITS=0`; kolumna R3 P4.4 §1.1 dla `miasto-*`, `wonderModels`). Nowe modele **nie mogą** ich wprowadzać — dzięki temu korzystają wyłącznie z RR-T4 bez triangulacji 2D.
**Trójkąty prymitywów (r169, reguły w `skrypty/three-mock.js`):** Box 12, Cyl(seg n) 4n, Cone(seg n) 2n, Circle(n) n — zgodne z tabelą w komentarzu `miasto-kamien.ts:38-40`.

### 2.2 Skala, układ, proporcje względem heksa

| Parametr | Wartość | Dowód |
|---|---|---|
| Promień heksa | `HEX_R = 1.0` (wierzchołek) | `hexutil.ts:24` |
| Skala miasta w świecie | `CITY_MODEL_SCALE = 1.38`; model niesie dziecko w skali `1/1.38`, więc współrzędne wewnętrzne = świat | `cities.ts:140,525`; `miasto-braz.ts:98-99,798-806`; `miasto-kamien.ts:46-50` |
| Skala cudu | `WONDER_SCALE = 1.15`, uniesienie `0.004·R` | `wonderRenderer.ts:26-27,101` |
| Spód / przód | spód na `y = 0`, przód = `+x`, brama muru w azymucie 58–122° (Grecja/Rzym), 72–108° (Kamień) | `miasto-braz.ts:59,336,646`; `miasto-kamien.ts:44-45` |
| Azymut | 0 = N (−z), 90 = E (+x); `x = r·sin(az)`, `z = −r·cos(az)`; drzwi domów „ku środkowi” | `miasto-braz.ts:65-66,163-170` |
| Rezerwa środka heksa | bez muru r ≤ 0,42, z murem r ≤ 0,49; pas ulepszeń r 0,50–0,82 wolny | `miasto-braz.ts:63-64`; `miasto-kamien.ts:52-53` |
| Oś muru wg fazy | 0,37 / 0,42 / 0,445 (małe/średnie/duże) | `miasto-braz.ts:809`; `miasto-kamien.ts:598` |
| Granice footprintu (deklarowane, per wierzchołek) | Grecja/Rzym bez muru 0,35–0,42, z murem 0,42–0,49; Kamień 0,35–0,42 / 0,42–0,49 | `miasto-braz.ts:888-899`; `MIASTO_KAMIEN_LAYOUT.granice` |
| Gabaryt zmierzony (górna granica z rogów AABB, świat) | L10 bez muru: Kamień 0,460, Grecja 0,416, Rzym 0,418; z murem 0,485–0,489 | `wyniki/measure.txt` (`maxR_swiat_rogiAABB`) |
| Wysokość zmierzona (świat, z masztem/proporcem) | L10: Kamień 0,479, Grecja **0,535**, Rzym 0,296 | `wyniki/measure.txt` (`maxY_swiat`) |
| Proporcje modułów | dom ≈ 0,155 × 0,115 × 0,135 (Grecja), 0,16 × 0,115 × 0,14 (Rzym); budynek centralny ≈ 0,30–0,37 × 0,20–0,25 podstawy, kalenica 0,19–0,33; domy na pierścieniu r 0,245–0,31 | `miasto-braz.ts:230-283,564-596,399-479` |
| Cuda: gabaryt | podstawa ≤ 0,50·R (wewn.), wysokość świat 0,18–0,78 (`terakotowa_armia` 0,184 … `wielka_stela` 0,782) | `wyniki/measure.txt` (`cud …`) |

### 2.3 Paleta i kolor gracza

- **Materiał:** `MeshLambertMaterial({ color, flatShading: true })`, `castShadow = true` (`miasto-braz.ts:103-118`; `wonderModels.ts:28-41`). Materiały tworzone **na każdą budowę modelu** (`makeMatsG/makeMatsR` `miasto-braz.ts:212-227,514-530`), bo mgła wojny mnoży `material.color` (P4.4 §3.3) — w Rust: tint per obiekt (P4.3 §4.2).
- **Palety żywe (wzorzec tonacji):** Grecja `PG` (`miasto-braz.ts:187-197`: biel 0xf6f1e4, terakota 0xc96f45, kamień 0x9aa5b1, morze 0x3f7fae, oliwka 0x9fb886…), Rzym `PR` (`:485-498`: strzecha 0xcda45c, tuf 0xc4693a, terakota 0xb5502f, podium 0xb3a591…), Kamień `P` (`miasto-kamien.ts:148-160`), cuda (`wonderModels.ts:430-451`, 20 kolorów). Tonacja: **przygaszone, ziemiste barwy**, jasne mury, nasycenie tylko na akcentach (ogień, woda, kolor gracza). Palety ghost `bronzeCityRoblox.ts:115-171` są bardziej nasycone (kolory Material) — traktuję je wyłącznie jako wskazówkę odcienia per kultura, nie jako kanon.
- **Kolor gracza (reguła):** pełny kolor na proporcu/vexillum na maszcie budynku centralnego + kalenica budynku centralnego jako `lerp(kolor dachu, kolor gracza, 0,40)` (`miasto-braz.ts:52-56,213,515`; Kamień 0,45 — `miasto-kamien.ts:56-59`). Cuda: osobny sztandar `ownerBanner` (2 boxy, `wonderModels.ts:420-424`) i wariant ruiny `grey()` (`:17-26`).

### 2.4 Poziomy rozwoju i reakcja na `visualKey`

- **Fazy:** P1–3 „małe”, P4–6 „średnie”, P7–10 „duże” (`rozmiarDlaPoziomu`, `miasto-kamien.ts:584-590`; `MIASTO_BRAZ_LAYOUT.progi` `:879`). Budynek centralny rośnie skokowo na **P1, P4, P7** (Rzym dodatkowo P9 skala 1,15 → 1,22, `miasto-braz.ts:759`). Wewnątrz fazy każdy poziom **dokłada** elementy w stałych pozycjach (`skladFaza*`). P7+ = 2 ulice (E-W długość 0,72, N-S 0,55; `miasto-braz.ts:387-388,699-700`).
- **Wzrost trójkątów ściśle monotoniczny** (deklaracja `miasto-braz.ts:49-50`, potwierdzona pomiarem: każdy kolejny poziom ma więcej tri — tabela §2.6).
- **Mur:** niezależny od poziomu, dostępny na każdym poziomie; mur kamienny per zestaw (Grecja cyklopowy + Lwia Brama, Rzym wał agger), palisada wspólna `buildPalisadaWal` (Biskupin, `miasto-kamien.ts:636-642`).
- **`visualKey`** = `styl|era|civ|poziom|rodzajMuru` (`cities.ts:481`) — model przebudowuje się tylko przy zmianie klucza. Nowe zestawy wymagają, by składowa `civ` rozróżniała zestaw (dziś 11 kluczy `BronzeCiv`; Harappa jest zwinięta do `sumer`) → paczka NM-00 (§5.2).
- **LOD geometrii: brak.** Modele miast i cudów nie mają wariantów LOD (P4.4 §3.3: jedyny LOD w plikach MIA dotyczy tekstury chipa, `cities.ts:594`). Nowe modele: **też bez LOD** (ten sam budżet niezależnie od odległości).
- **Determinizm:** `rnd(`/`Math.random` w `miasto-kamien.ts`, `miasto-braz.ts`, `wonderModels.ts` → **0 wystąpień** (`grep -c`). Nowe modele: pozycje stałe, zero losowości.

### 2.5 Ograniczenia twarde

1. Wszystko proceduralne z prymitywów §2.1; **zero tekstur** (0 × `CanvasTexture` w `miasto-*`/`wonderModels`, P4.4 §1.1), zero plików modeli, zero shaderów własnych.
2. Bez tone mappingu (styl `roblox`, P4.3 §4.1) — kolory palety są kolorami wynikowymi oświetlenia Lambert.
3. Bez animacji (modele mapy statyczne, P4.4 §2.6) — dym/ogień jako bryły.
4. Granice footprintu i sektor bramy jak §2.2 (kolizja z ulepszeniami na pierścieniu 0,50–0,82).

### 2.6 Wydajność — pomiar i budżet nowych modeli

Komenda: `python3 -I …/skrypty/run_measure.py` → `wyniki/measure.txt`, sekcja `BUDZET MIAST NA POZIOM`.

| Poziom | tri Kamień / Grecja / Rzym | średnia | **budżet tri** = ⌈śr. × 1,10⌉ | mesh Kamień / Grecja / Rzym | średnia | **budżet mesh** |
|---:|---|---:|---:|---|---:|---:|
| L1 | 176 / 190 / 196 | 187,3 | **207** | 16 / 15 / 15 | 15,3 | **17** |
| L2 | 296 / 258 / 298 | 284,0 | **313** | 26 / 20 / 23 | 23,0 | **26** |
| L3 | 468 / 418 / 522 | 469,3 | **517** | 39 / 33 / 41 | 37,7 | **42** |
| L4 | 528 / 474 / 622 | 541,3 | **596** | 44 / 37 / 49 | 43,3 | **48** |
| L5 | 608 / 602 / 682 | 630,7 | **694** | 49 / 46 / 54 | 49,7 | **55** |
| L6 | 784 / 710 / 778 | 757,3 | **834** | 64 / 55 / 61 | 60,0 | **66** |
| L7 | 832 / 746 / 838 | 805,3 | **886** | 68 / 57 / 66 | 63,7 | **71** |
| L8 | 892 / 850 / 898 | 880,0 | **969** | 73 / 65 / 71 | 69,7 | **77** |
| L9 | 964 / 886 / 922 | 924,0 | **1017** | 77 / 68 / 73 | 72,7 | **80** |
| L10 | 1024 / 922 / 1018 | 988,0 | **1087** | 82 / 71 / 80 | 77,7 | **86** |

- 30 konfiguracji bez muru: średnio **646,7 tri / 51,3 mesh**, maks. 1024 tri / 82 mesh.
- **Mur kamienny:** Grecja +324, Rzym +344 (zmierzone = deklarowane) → budżet nowego muru kamiennego **≤ 368 tri** (⌈334 × 1,1⌉). Palisada wspólna (+1428/1608/1644 tri wg fazy, `miasto-kamien.ts:33,653`) — bez zmian, nowe zestawy jej nie projektują.
- **Cuda (19):** tri min 16 / maks. 2676 (Koloseum) / średnia **290,1** / mediana 80; mesh min 2 / maks. 216 / średnia **22,4** / mediana 6 → budżet cudu parkowanego **≤ 320 tri i ≤ 25 mesh**.
- **Materiały:** żywe miasta używają 11–32 materiałów na model (`mat=` w `wyniki/measure.txt`); nowe zestawy: paleta ≤ 25 kolorów (Grecja `MG` ma 25 pól, `miasto-braz.ts:199-210`).
- Liczba draw calli = liczba meshy (miasta nie są scalane: `grep merge|collapse cities.ts wonderRenderer.ts` → 0). Instancjonowanie/scalanie w Rust to decyzja architektury (P4.3), nie spec modeli.

---

## 3. Specyfikacja nowych modeli (zadanie 3)

### 3.0 Szablon wspólny wszystkich nowych zestawów miast (obowiązuje każdą pozycję §3.2–3.3)

**API (wymóg):** `build_city(set: CitySetId, poziom: 1..=10, opts { mur: bool, palisada: bool, kolor: u32 }) -> ModelNode`. Konwencje §2.2 bez wyjątków (spód y=0, przód +x, azymut, rezerwa środka, osie muru 0,37/0,42/0,445, sektor bramy 58–122° wolny od budynków przy `mur`). `palisada` = wspólna `buildPalisadaWal` (port 1:1 z MOD-09), nowy zestaw jej nie przerabia.

**Harmonogram poziomów (wymóg, wzorowany na `skladFaza*` Grecji/Rzymu):**

| Poziom | Zawartość |
|---|---|
| L1 | budynek centralny v1 + plac (Circle seg 6, r ≈ 0,125–0,135) + ścieżka do bramy (box 0,16 × 0,01 × 0,07 przy x ≈ 0,26) |
| L2 | + 1 dom + 1 rekwizyt |
| L3 | + 2 domy + 2–3 rekwizyty (koniec fazy małej) |
| L4 | budynek centralny **v2** (większy, s ≈ 1,12) + przestawienie na szerszy pierścień (r 0,265–0,29) + 2–3 domy |
| L5 | + 1 dom + 1 rekwizyt (np. studnia/cysterna) |
| L6 | + 1 dom piętrowy + 1 rekwizyt (koniec fazy średniej) |
| L7 | budynek centralny **v3** (s ≈ 1,15) + 2 ulice (E-W 0,72, N-S 0,55) + 4–5 domy + budynek drugoplanowy fazy dużej |
| L8 | + 1 dom piętrowy + rekwizyt |
| L9 | + 1 dom przy bramie (opcjonalnie wzrost budynku centralnego do s ≈ 1,22 jak Rzym) |
| L10 | + 1 dom kwartału SW — pełne miasto |

**Budżet (wymóg):** tri i mesh na poziom ≤ tabela §2.6; wzrost tri ściśle monotoniczny L1→L10; mur kamienny ≤ 368 tri; wysokość świat ≤ 0,59 (= ⌈0,535 × 1,1⌉ do 0,01 — najwyższe żywe miasto Grecja L10); footprint bez muru ≤ 0,42, z murem ≤ 0,49.
**Kolor gracza (wymóg):** proporzec/sztandar w pełnym kolorze na maszcie budynku centralnego od L1 + kalenica/akcent budynku centralnego `lerp(·, kolor gracza, 0,40)`.
**Rozróżnialność od cudów (wymóg):** budynek centralny miasta ma podstawę ≤ 0,34 i wysokość ≤ 0,45 (bez masztu); cuda tej samej kultury mają podstawę 0,44–0,50 (`wonderModels.ts`), więc centrum miasta nie może kopiować sylwetki cudu w tej skali (dotyczy: ziggurat ↔ B-ME, piramida ↔ B-EG, `mundo_perdido` ↔ B-AN, `palac_weiyang` ↔ B-AZ, `roquepertuse`/`osada_aschaffenburg` ↔ B-EP, `yerkapi` ↔ B-AL, `stupa_sanchi` ↔ B-IN).

**Kryteria akceptacji wspólne (każdy zestaw):**
- **K1 (CPU, automatyczne):** budżet tri/mesh per poziom, monotoniczność, footprint, wysokość, sektor bramy, 2 budowy = identyczne drzewo (determinizm), brak prymitywów spoza §2.1. Test w paczce, wynik w raporcie z `EXIT`.
- **K2 (wizualne, właściciel):** z kamery gry (elewacja 52°, yaw 0, fov 50° — P4.3 §3.2) na odległości **d = 11** (granica MID/FAR LOD chipa, `zoomLod.ts:161-163`) zestaw jest odróżnialny od Grecji, Rzymu i każdego innego zestawu z tej samej fazy (test „zgadnij krąg” na zrzutach bez podpisów); na **d = 5,5** widoczne są wszystkie 3 punkty rozpoznawcze z karty zestawu.
- **K3 (wizualne):** spójność z kanonem — ta sama tonacja i „klockowość” co Grecja/Rzym na tym samym zrzucie (zestawienie obok siebie).

**Metoda oceny (wymóg):** zrzuty z renderera Rust (RR-T11 harness), jednakowa kamera i światło jak w grze, `pixelRatio = 1`, neutralny heks trawy, kolor gracza `0xffd54a` (domyślny, `miasto-braz.ts:101`). Siatka zrzutów na zestaw: poziomy **L1, L3, L4, L6, L7, L10** × mury **none / palisada / mur** × odległości **d = 8/3 (min), 5,5, 11** = 54 zrzuty + 1 plansza porównawcza „wszystkie zestawy na L6 bez muru, d = 11”. Werdykt właściciela per zestaw: PASS / FAIL z listą poprawek (`D-NM-9`).

### 3.1 Karta zestawu — format

Każda karta: **ID** · państwa · referencja (`[zewn.]`) + 3 punkty rozpoznawcze · kompozycja (bryły z proporcjami, wartości wewnętrzne = świat; `s` = skala modułu) · paleta (**propozycja**, hex) · warianty poziomów (odstępstwa od szablonu §3.0) · mur kamienny · kryteria akceptacji specyficzne (K2 dopełnione o punkty rozpoznawcze). Budżet = §3.0 (wspólny dla wszystkich kart).

### 3.2 Brąz — 8 nowych zestawów (wariant B)

#### B-ME — Mezopotamia (Sumerowie, Babilonia, Asyria)

- **Referencja `[zewn.]`:** miasta-państwa Ur/Uruk: domy z cegły mułowej z płaskimi dachami-tarasami, ciasna zabudowa, w centrum świątynia na tarasie, później ziggurat z rampą schodów; palmy daktylowe i kanały.
- **Punkty rozpoznawcze:** (1) schodkowy ziggurat z frontową rampą (od fazy 2); (2) kubiczne domy bez dachów spadzistych, z ciemnym gzymsem; (3) palmy i pas wody kanału.
- **Kompozycja:** v1 (L1–3) świątynka na tarasie: taras box 0,26 × 0,04 × 0,22 + cella box 0,14 × 0,10 × 0,12 + drzwi box 0,013 × 0,06 × 0,04 + maszt z proporcem. v2 (L4–6) ziggurat 2-stopniowy: box 0,30 × 0,07 × 0,26 + box 0,22 × 0,07 × 0,18 + cella na szczycie 0,10 × 0,06 × 0,08 + rampa box 0,05 × 0,02 × 0,16 pochylona (rx ≈ 0,45) od +x. v3 (L7–10) ziggurat 3-stopniowy 0,34 / 0,26 / 0,18 (h 0,065 każdy) + cella + rampa środkowa + 2 rampy boczne; wysokość bez masztu ≤ 0,30. Dom: box 0,15 × 0,10 × 0,13 + gzyms box 0,155 × 0,015 × 0,135 (ciemny) + drzwi (≈ 36 tri); dom piętrowy: + box 0,09 × 0,07 × 0,08. Rekwizyty: palma (Cyl5 0,012 × 0,11 + 2 skrzyżowane boxy liści 0,07 × 0,012 × 0,02), kanał (box wody 0,20 × 0,008 × 0,04), piec garncarski (Cyl6 + Cone6), spichrz (Cone6 kopułka na Cyl6).
- **Paleta (propozycja):** cegła mułowa 0xc9a372, cegła ciemna 0xa98a63, gzyms/bitum 0x4a3a2c, trzcina 0xc9b77a, taras 0xb89a70, palma 0x6f8f3e, pień 0x8a6a42, woda 0x5a8bb0, plac 0xbfa678, czerń drzwi 0x14100b (odcień ściany jak ghost `sumer` 0xd4a574, przygaszony).
- **Mur kamienny:** mur z cegły mułowej: 16–18 bloków 0,12 × 0,11 × 0,06 na osi muru + 2 prostokątne wieże bramne 0,06 × 0,16 × 0,07 z gzymsem (≤ 368 tri).
- **K2 specyficzne:** na d = 11 ziggurat (v2/v3) ma czytelny schodkowy profil i rampę od strony bramy; brak dachów spadzistych w całym mieście.

#### B-EG — Egipt

- **Referencja `[zewn.]`:** miasto nad Nilem z bielonej cegły mułowej; świątynia z pylonem (dwie ścięte wieże bramne), maszty z proporcami przed pylonem, obeliski; domy z tarasem i przybudówką na dachu; palmy.
- **Punkty rozpoznawcze:** (1) para ściętych pylonów z belką bramy (od fazy 2); (2) para obelisków ze złotym szczytem (faza 3); (3) białe kubiczne domy z płaskim dachem i małą nadbudówką.
- **Kompozycja:** v1 kapliczka: box 0,16 × 0,10 × 0,12 + 2 mini-pylony Cyl4 (rt 0,035, rb 0,05, h 0,12, obrót 45°) + maszt z proporcem. v2 świątynia pylonowa: 2 pylony Cyl4 (rt 0,055, rb 0,075, h 0,20, obrót 45°) rozstawione o 0,15 w osi z, belka bramy box 0,05 × 0,03 × 0,10 z akcentem lapis, za nimi sala box 0,18 × 0,11 × 0,16, 2 maszty z proporcami gracza przed pylonem. v3 = v2 × 1,15 + 2 obeliski (box 0,025 × 0,16 × 0,025 + Cone4 złoty 0,02 × 0,035) przed pylonem + sala hypostylowa (box 0,20 × 0,02 dach na 4 × Cyl5 0,014 × 0,09). Dom: box 0,15 × 0,11 × 0,13 biały + nadbudówka box 0,05 × 0,04 × 0,05 + drzwi. Rekwizyty: palma (jak B-ME), spichrze kopułkowe (Cyl6 0,03 × 0,04 + Cone6), studnia-żuraw (szaduf: słup + skośna belka), pas Nilu (opcjonalnie, box wody).
- **Paleta (propozycja):** wapno/biel 0xefe3c4, cegła 0xc9a26b, piaskowiec 0xe0c48a, piaskowiec ciemny 0xc2a46e, złoto 0xd9b13b, lapis 0x2e5aa8, palma 0x6f8f3e, woda 0x4f9bb5.
- **Mur kamienny:** mur z cegły mułowej z falującą (naprzemiennie wyższą/niższą) koroną bloków + brama z mini-pylonami (≤ 368 tri).
- **K2 specyficzne:** pylony czytelne jako dwie ścięte wieże po bokach bramy; **żadnej piramidy** w mieście (rozróżnienie od cudu `piramidy`).

#### B-IN — Indus (Harappa)

- **Referencja `[zewn.]`:** Mohendżo-Daro/Harappa: ortogonalna siatka ulic, jednolite domy z wypalanej cegły z płaskim dachem, podwyższona cytadela z Wielką Łaźnią i spichlerzem, studnie.
- **Punkty rozpoznawcze:** (1) prostopadła siatka ulic N-S/E-W **od L1** (wyjątek od szablonu, gdzie ulice są od L7); (2) podwyższona ceglana platforma-cytadela z prostokątnym basenem wody; (3) jednolite czerwono-ceglane domy, rzędami, drzwiami do ulicy (nie „ku środkowi”).
- **Kompozycja:** v1 studnia ceglana (Cyl6 0,03 × 0,04) + mała platforma box 0,18 × 0,03 × 0,14 + maszt z proporcem; ulice: 2 boxy 0,60 × 0,01 × 0,06 (E-W) i 0,06 × 0,01 × 0,45 (N-S). v2 cytadela: platforma box 0,30 × 0,05 × 0,24 + łaźnia: obrzeże 4 boxy 0,12 × 0,02 × 0,015 + woda box 0,10 × 0,008 × 0,07 + schodki. v3 = v2 × 1,12 + spichlerz (3 boxy 0,05 × 0,05 × 0,12 na cokole 0,18 × 0,02 × 0,14) + wieża narożna cytadeli. Dom: box 0,15 × 0,10 × 0,12 + attyka box 0,155 × 0,012 × 0,125 + drzwi; domy ustawione **rzędami wzdłuż ulic** (rotY ∈ {0, π/2}). Rekwizyty: studnia, kanał odpływowy (box 0,20 × 0,006 × 0,02), pieczęć-stela? nie — zbyt drobne; dzban (Cyl5).
- **Paleta (propozycja):** cegła wypalana 0xb5603f, cegła ciemna 0x8f4a32, cegła jasna 0xd08a5f, tynk 0xe6d3b0, woda 0x5a8bb0, plac 0xbfa678, ulica 0xc9a57a.
- **Mur kamienny:** ceglany mur z prostokątnymi bastionami co 45° + brama z dwiema wieżami (≤ 368 tri).
- **K2 specyficzne:** na d = 11 widoczna regularna siatka; miasto nie wygląda jak B-ME (inny kolor cegły, zero zigguratu); nie przypomina cudu `stupa_sanchi` (brak kopuły).

#### B-AL — Anatolia-Lewant (Hetyci, Fenicjanie)

- **Referencja `[zewn.]`:** Hattusa: kamienne cokoły murów, prostokątne wieże, bramy z lwami, domy z płaskim dachem i belkami; miasta fenickie (Tyr, Byblos): kamienne domy, świątynie z dziedzińcem, cedr.
- **Punkty rozpoznawcze:** (1) szary kamień dolnych partii i ciemne pasy belek drewnianych na ścianach; (2) świątynia z prostokątnym dziedzińcem otoczonym murkiem (faza 2+); (3) prostokątne wieże z blankami (mur i brama cytadeli).
- **Kompozycja:** v1 dom władcy: cokół box 0,22 × 0,035 × 0,16 kamień + korpus box 0,18 × 0,10 × 0,13 cegła + pas belki box 0,185 × 0,012 × 0,135 + maszt. v2 świątynia z dziedzińcem: obwód 4 murki (2 × 0,26 × 0,05 × 0,015 + 2 × 0,015 × 0,05 × 0,20) + sala box 0,13 × 0,12 × 0,12 przy tylnej ścianie + brama dziedzińca (2 boxy wieżyczek 0,035 × 0,09 × 0,035). v3 = v2 × 1,15 + cytadela: 2 wieże z blankami (box 0,06 × 0,18 × 0,06 + 4 blanki box 0,015 × 0,02 × 0,015 — w budżecie liczyć). Dom: cokół kamienny + ściana + pas belki + dach płaski (≈ 48 tri). Rekwizyty: cedr (Cone5 ciemnozielony warstwowo ×2 na pniu), stągiew (Cyl5), ołtarz.
- **Paleta (propozycja):** kamień 0x9a9a92, kamień ciemny 0x74746c, cegła 0xb89a78, belka 0x5d4a36, dach 0x8c7b66, cedr 0x3f6b45, akcent (fenicka purpura — tylko przy `D-NM-15` = tak) 0x7b2a5a.
- **Mur kamienny:** mur „cyklopowy” z kamiennych bloków na cokole + prostokątne wieże co 60° z blankami + brama z dwiema wieżami (≤ 368 tri). **Nie** kopiować `yerkapi` (rampa ziemna z tunelem).
- **K2 specyficzne:** szarość kamienia wyraźnie inna niż biel Grecji; na d = 5,5 widoczne blanki wież i pas belek.

#### B-EP — Europa Północna (Celtowie, Germanie)

- **Referencja `[zewn.]`:** celtyckie domy okrągłe ze stożkową strzechą, germańskie długie domy z dachem do ziemi, święty gaj/nemeton, drewniany słup-idol.
- **Punkty rozpoznawcze:** (1) stożkowe strzechy (zielono-brązowe) domów okrągłych; (2) długi dom z dachem dwuspadowym schodzącym nisko; (3) zero kamienia w zabudowie (poza murem) — drewno, glina, strzecha.
- **Kompozycja:** v1 duża chata okrągła wodza: Cyl8 0,09 × 0,06 + Cone8 0,12 × 0,13 strzecha + drzwi + maszt z proporcem. v2 długi dom: korpus box 0,26 × 0,07 × 0,12 + 2 połacie box 0,27 × 0,02 × 0,09 (rx ±0,75) + kalenica w kolorze gracza (lerp 0,40) + szczytowe deski (2 boxy skrzyżowane). v3 hala (długi dom × 1,2) + nemeton: krąg 6 słupków box 0,02 × 0,07 × 0,02 + słup-idol Cyl6 0,02 × 0,16 + głowica box. Domy: okrągły (Cyl6 + Cone6, ≈ 36 tri), długi mały (box + 2 połacie, ≈ 36 tri). **Proporcja typów domów jest parametrem państwa:** Celtowie 3 okrągłe : 1 długi, Germanie 1 okrągły : 3 długie (ten sam zestaw pozycji, inny typ w slocie — koszt 0,05 J). Rekwizyty: stóg (Cone6), zagroda (jak `zagroda` Rzymu), drewutnia.
- **Paleta (propozycja):** strzecha 0xa89a52, strzecha ciemna 0x7f7640, glina-plecionka 0xc9b08a, drewno 0x7a5a38, drewno ciemne 0x5a4128, mech/darń 0x6f8a4a, plac 0xa99064.
- **Mur kamienny:** wał ziemny z kamiennym licem i drewnianą koroną (bloki ziemi + kamienne płyty frontu + słupki) + brama-wieża drewniana (≤ 368 tri). Nie budować pełnego pierścienia murowanego jak `roquepertuse`/`osada_aschaffenburg` (te cuda mają mur zawsze; miasto — tylko przy `mur`).
- **K2 specyficzne:** Celtowie i Germanie na tej samej planszy odróżnialni proporcją dachów okrągłych do długich; brak bieli/terakoty.

#### B-AZ — Azja Wschodnia (Chińczycy)

- **Referencja `[zewn.]`:** Shang/Zhou: hale drewniane na platformach z ubitej ziemi, czerwone kolumny, szerokie okapy dachów czterospadowych, zamknięte dziedzińce na osi, mury z ubitej ziemi warstwami.
- **Punkty rozpoznawcze:** (1) czerwone kolumny pod szerokim ciemnym okapem; (2) zamknięty prostokątny dziedziniec na osi (brama → hala); (3) ochrowy mur z ubitej ziemi z poziomymi pasami.
- **Kompozycja:** v1 hala na platformie: platforma box 0,24 × 0,04 × 0,18 ochra + korpus box 0,16 × 0,08 × 0,11 + dach czterospadowy = Cyl4 (rt 0,06, rb 0,14, h 0,06, obrót 45°, skala z 0,75) + 2 czerwone Cyl5 przed fasadą + maszt. v2 dziedziniec: obwód 4 murki + hala główna (v1 × 1,12) na osi N + 2 hale boczne (½ skali) + brama (box + mały dach). v3 = v2 × 1,15, hala główna z podwójnym okapem (drugi Cyl4 mniejszy nad pierwszym). Dom: korpus box + dach Cyl4 ścięty (≈ 28 tri). Rekwizyty: drzewo (Cone5 ×2), studnia, stojak na broń? nie — dzban ceramiczny (Cyl5).
- **Paleta (propozycja):** ubita ziemia 0xc2a06a, ziemia ciemna 0xa3834f, ściana 0xe8dcc4, kolumna 0xb23a2e, dach ciemny 0x4a4642, dach ciemniejszy 0x34312e, złoto 0xd9b13b. (Ghost `chiny`: ściana 0xfff3e0, dach 0x424242, akcent 0xd32f2f — `bronzeCityRoblox.ts:147-148`.)
- **Mur kamienny:** mur z ubitej ziemi (bloki z 2 pasami odcieni) + brama z daszkiem (≤ 368 tri).
- **K2 specyficzne:** okapy dachów wyraźnie szersze niż ściany; nie kopiować sylwetki `palac_weiyang` (czerwony cokół 0,48 × 0,08 z ciemnym dachem) — hala miasta ≤ 0,30 szerokości.

#### B-AN — Andy (Inkowie)

- **Referencja `[zewn.]`:** zabudowa inkaska: szare mury z dopasowanych kamieni, trapezowe drzwi, strome strzechy, zagrody `kancha` (dziedziniec otoczony domami), tarasy uprawne, platforma `ushnu`.
- **Punkty rozpoznawcze:** (1) bardzo strome strzechy (wysokie pryzmy/stożki) nad szarymi ścianami; (2) trapezowe ciemne otwory drzwi; (3) zielone tarasy schodkowe na skraju miasta (faza 3).
- **Kompozycja:** v1 kancha: 4 domy-moduły wokół placyku (2 w L1) + maszt z proporcem. v2 ushnu: 3 stopnie box 0,22 / 0,16 / 0,10 × 0,035 + kancha przy placu. v3 świątynia (Coricancha): długa sala box 0,26 × 0,10 × 0,12 kamień + złoty pas box 0,265 × 0,012 × 0,125 + stroma strzecha (pryzma Cyl3 r 0,09) + ushnu obok; tarasy: 3 boxy zieleni schodkowo (0,30 × 0,02 × 0,05, przesunięcie 0,05) w kwadrancie W. Dom: ściana box 0,13 × 0,08 × 0,11 + stroma strzecha Cyl3 (r 0,075, długość 0,14) + drzwi trapezowe = Cyl4 (rt 0,012, rb 0,018, h 0,05, spłaszczony z 0,3). Rekwizyty: lama (jak `pastwisko-modele` w skali ½ — tylko bryły box), kosz (Cyl5).
- **Paleta (propozycja):** kamień 0x8f969a, kamień ciemny 0x6f767a, strzecha 0xc9a24e, strzecha ciemna 0xa3823e, złoto 0xd4a017 (kolor danych Inków `civs.json kolorHex`), taras 0x6f9a4a, plac 0xb59d74.
- **Mur kamienny:** mur kamienny o zygzakowatym obrysie (bloki naprzemiennie przesunięte o 0,02 w promieniu) + trapezowa brama (≤ 368 tri).
- **K2 specyficzne:** dachy wyraźnie wyższe niż ściany; ushnu niskie (≤ 0,11 wysokości) i bez świątyni na szczycie — nie mylić z `mundo_perdido`; tarasy nie kopiują modelu ulepszenia `tarasy-model.ts`.

#### B-AF — Afryka Południowa (Zulusi)

- **Referencja `[zewn.]`:** zuluskie `umuzi`/`ikhanda`: kolisty układ, kopulaste chaty z trawy (`indlu`) drzwiami ku środkowi, centralna zagroda bydła (`isibaya`), chata wodza naprzeciw wejścia, ogrodzenie z pali.
- **Punkty rozpoznawcze:** (1) kopulaste chaty (ścięty walec + niski stożek, bez ścian pionowych); (2) koncentryczny, kolisty układ z pustą środkową zagrodą bydła; (3) największa chata naprzeciw bramy (po stronie −x).
- **Kompozycja:** v1 isibaya: krąg 8 pali box 0,012 × 0,05 × 0,012 r 0,10 + 2 krowy (bryły z `pastwisko-modele` w skali ½) + chata wodza na −x + maszt z proporcem przy chacie. v2 + wielka chata (`indlu enkulu`): Cyl8 (rt 0,07, rb 0,10, h 0,07) + Cone8 (r 0,075, h 0,05) + isibaya z 12 pali r 0,13. v3 ikhanda: druga obręcz chat (r 0,30), oddzielne ogrodzenie królewskie (`isigodlo`) za chatą wodza (8 pali). Chata: Cyl6 (rt 0,04, rb 0,06, h 0,05) + Cone6 (r 0,045, h 0,035) + drzwi (≈ 40 tri). Rekwizyty: spichrz na palach, tarcze-stojak (box w kolorze gracza — **nie**, kolor gracza tylko w proporcu), ognisko (jak Kamień).
- **Paleta (propozycja):** trawa sucha 0xc2a35e, trawa ciemna 0x9e8446, pal 0x6b5034, ziemia placu 0xa98a5e, bydło 0x5a3f2a / 0xe8dcc8, czerń 0x14100b.
- **Mur kamienny:** kamienny cokół z suchego muru (niskie bloki) + gęste pale na koronie + brama z dwóch grubszych pali i belki (≤ 368 tri). Uwaga: kamienny mur jest umowny dla tej kultury `[zewn.]` → `D-NM-13`.
- **K2 specyficzne:** zero kątów prostych w zabudowie mieszkalnej; środkowa zagroda pusta i czytelna na d = 11.

### 3.3 Żelazo — 10 nakładek (wariant B)

**Zasada nakładki (wymóg):** szkielet = zestaw Brązu tego samego kręgu (pozycje, progi faz, plac, ulice). Nakładka: (a) budynek centralny v2 i v3 zastąpiony wersją Żelaza; (b) co najmniej 1/3 domów w fazach 2–3 w wariancie „Żelazo” (wyższe/piętrowe albo inny dach); (c) mur kamienny Żelaza (te same osie, ≤ 368 tri); (d) v1 (L1–3) może zostać z Brązu. Budżet = §2.6 (te same limity; ewentualny wyższy margines → `D-NM-10`). K2 dodatkowe: **na d = 11 Żelazo odróżnialne od Brązu tego samego kręgu** (zestawienie obok siebie, L7 i L10).

| ID | Państwa | Referencja `[zewn.]` | Wymiana v2 / v3 (bryły) | Domy Żelaza | Mur Żelaza | Punkt rozpoznawczy Żelaza |
|---|---|---|---|---|---|---|
| **Z-GR** | Grecy | polis klasyczna: dorycki peripteros, teatr, agora | v2: świątynia z kolumnadą 4+4 (Cyl5 0,016 × 0,10) na 3-stopniowej krepidomie; v3: peripteros 6 kolumn frontu (+ 2 boczne pary) z pryzmą dachu terakota + teatr: 3 łukowate rzędy z boxów w wachlarzu (r 0,10–0,16, 5 segmentów na rząd) w kwadrancie SW | domy z dachem dwuspadowym terakota zamiast płaskiego | mur z kwadratowymi wieżami co 45° | kolumnada dookoła świątyni + wachlarz teatru |
| **Z-RZ** | Rzymianie | republika: forum z bazyliką, insule, akwedukt | v2: większa świątynia na podium (Rzym s 1,22) + forum (płyta box 0,22 × 0,008 × 0,16 jasna) + bazylika box 0,18 × 0,09 × 0,10 z dachem; v3: + segment akweduktu przez kwadrant N: 4 filary box 0,02 × 0,14 × 0,03 + koryto box 0,26 × 0,02 × 0,03 | insule 2–3 kondygnacje (box 0,14 × 0,18 × 0,12 tuf + dach terakota) | mur kamienny z prostokątnymi wieżami i bramą łukową (2 filary + belka) | łuki akweduktu; **żadnej areny** (rozróżnienie od `koloseum`) |
| **Z-ME** | Sumerowie, Babilonia, Asyria | Neo-Asyria/Neo-Babilonia: pałac na platformie, brama z glazurowanej cegły | v2: pałac na platformie (box 0,30 × 0,05 × 0,24 + korpus 0,22 × 0,10 × 0,16) z 2 lamassu (box 0,03 × 0,05 × 0,06) przy bramie; v3: ziggurat 4-stopniowy + brama miejska z 2 wież z glazurowanym licem (box akcent 0x2f5fa8) przy +x | domy piętrowe 1/3 | mur podwójny (2 pierścienie bloków o 0,03 różnicy) + niebieska brama | niebieska glazurowana brama; nie kopiować `dur_sharrukin` (kwadrat 0,46 z 4 wieżami) ani `wiszace_ogrody` |
| **Z-EG** | Egipt | Okres Późny: rozbudowane świątynie, aleje sfinksów | v2: pylon × 1,2 + dziedziniec kolumnowy (6 × Cyl5); v3: + aleja sfinksów: 2 rzędy × 3 sfinksy (box 0,04 × 0,025 × 0,02 + głowa box 0,015) od bramy do pylonu | domy piętrowe 1/3 | mur z cegły z wieżami narożnymi | aleja sfinksów na osi bramy |
| **Z-IN** | Harappa | **anachronizm** `[zewn.]` (kultura Indusu zanikła przed Żelazem); gra ma Garnizon Harappy w Żelazie (P4.4 §2.1b #59) — propozycja umowna: ufortyfikowana cytadela | v2: cytadela z 4 narożnymi wieżami (box 0,05 × 0,12 × 0,05); v3: + duży spichlerz (5 boxów) + druga platforma | domy piętrowe 1/3 | podwójny mur ceglany z bastionami | wieże narożne cytadeli (`D-NM-3`) |
| **Z-AL** | Hetyci, Fenicjanie | Neo-Hetyci/Fenicja: świątynia z dwoma wolnostojącymi filarami, ortostaty | v2: świątynia z 2 wolnostojącymi filarami (Cyl6 0,02 × 0,14 + głowice box) przed wejściem; v3: + pałac z ortostatami (pas box jasny 0,20 × 0,03 × 0,01 przy cokole) | domy piętrowe z belkami | mur z wieżami półokrągłymi (Cyl6 ½ wtopiony) | dwa wolnostojące filary przed świątynią |
| **Z-EP** | Celtowie, Germanie, **Słowianie** | oppidum (murus gallicus), hala; gród słowiański z wieżą | v2: hala × 1,15 z gontem (ciemniejszy dach) + kuźnia (box + Cone4 komin + ogień); v3: + drewniana wieża strażnicza (4 słupy box + platforma + dach Cone4) | domy zrębowe prostokątne (box z „belkami” 2 pasy) 1/3 | murus gallicus: kamienne lico z wystającymi belkami (krótkie boxy) + brama z wieżą | wieża strażnicza + kuźnia (`D-NM-4` dla Słowian) |
| **Z-AZ** | Chińczycy | Zhou/Han: bramy `que`, hale z podwójnym okapem, dachówka | v2: hala z podwójnym okapem (2 × Cyl4) + dziedziniec × 1,12; v3: + para wież `que` przy bramie (box 0,05 × 0,16 × 0,05 + dach Cyl4) | domy z szarą dachówką (dach 0x5e5a56) | mur z ubitej ziemi z wieżami bramnymi | para wież `que` na osi bramy; nie kopiować `palac_weiyang` |
| **Z-AN** | Inkowie | imperium Inków: mur zygzakowaty, złocona świątynia | v2: kancha × 2 + ushnu 4-stopniowe; v3: świątynia z szerszym złotym pasem + mur zygzakowaty wewnętrzny (3 segmenty) | domy piętrowe kamienne 1/3 | mur zygzakowaty wyższy (+30%) z trapezową bramą | zygzakowaty mur wewnętrzny |
| **Z-AF** | Zulusi | królewski `ikhanda` | v2: druga obręcz chat + większa isibaya; v3: trzecia obręcz (r 0,38, gęściej) + ogrodzone `isigodlo` z 3 chatami | chaty × 1,1 | wyższy cokół + podwójny rząd pali | trzy obręcze chat wokół pustej zagrody |

Paleta nakładek = paleta Brązu kręgu + najwyżej 3 nowe kolory (wymienione w tabeli), żeby Żelazo pozostało rozpoznawalne jako ta sama kultura.

### 3.4 Pięć cudów parkowanych — karty

**Wspólne (wymóg):** API i konwencje jak `buildWonderModel` (`wonderModels.ts:427`): `box/cyl/cone` z `y` od podstawy, `R = HEX_R`, skala świata 1,15, wariant ruiny przez `grey()`, sztandar `ownerBanner` (+2 mesh / +24 tri — nie wlicza się do budżetu, tak jak w pomiarze 19 cudów). Budżet: **≤ 320 tri, ≤ 25 mesh** (§2.6). Podstawa ≤ 0,50·R, wysokość świat ≤ 0,78 (= najwyższy istniejący, `wielka_stela`). Paleta: wyłącznie istniejące `mats` cudów (`wonderModels.ts:430-451`, 20 kolorów) + najwyżej 2 nowe na cud. **Styl epoki 4+:** sylwetka zgodna z realnym obiektem `[zewn.]`, wykonana środkami kanonu §2 (prostota jak `stupa_sanchi`/`ziggurat`, nie jak `koloseum`) → `D-NM-6`.

| id | Kompozycja (propozycja; wymiary × R) | Liczba brył → tri (policzone regułami §2.1) | Paleta | Kryteria akceptacji (d = 5,5 i 11) |
|---|---|---|---|---|
| `nalanda` | 3 bloki vihara box 0,15 × 0,10 × 0,15 w rzędzie wzdłuż z (x = −0,10) z ciemnym dziedzińcem box 0,07 × 0,012 × 0,07 na każdym; świątynia schodkowa (x = +0,14): 3 boxy 0,16/0,12/0,08 × 0,08 + 4 wieżyczki narożne box 0,03 × 0,06 × 0,03 na 1. stopniu | 3 + 3 + 3 + 4 = 13 box → **156 tri / 13 mesh** | brick, dark, clay (istniejące) | rząd 3 kwadratowych bloków z ciemnymi środkami + wyraźnie wyższa schodkowa wieża |
| `angkor_wat` | taras 3 stopnie box 0,44 / 0,34 / 0,24 × 0,05; 5 wież: Cyl6 (rt 0,025, rb 0,04, h 0,10) + Cone6 (r 0,03, h 0,06) — narożne na 2. stopniu, środkowa wyższa (h 0,14) na 3.; fosa: 4 boxy wody 0,50 × 0,01 × 0,04 wokół; grobla box 0,06 × 0,012 × 0,10 od +x | 3 box + 5 × (Cyl6 + Cone6) + 4 box + 1 box = 36 + 180 + 48 + 12 = **276 tri / 18 mesh** | stone, dark, water (+ szarozielony 0x7d8a6a nowy) | 5 wież w kwinkunksie, środkowa najwyższa; woda wokół |
| `wielki_dzwon` | cokół box 0,30 × 0,04 × 0,30; 4 czerwone kolumny Cyl5 (0,015 × 0,20) w narożnikach kwadratu 0,20; dach czterospadowy Cyl4 (rt 0,05, rb 0,20, h 0,08, obrót 45°) + szczyt Cone4 złoty; belka box 0,22 × 0,02 × 0,02; dzwon Cyl8 (rt 0,035, rb 0,055, h 0,09) brąz + korona box 0,02 | 1 box + 4 × Cyl5 (20) + Cyl4 (16) + Cone4 (8) + box + Cyl8 (32) + box = 12 + 80 + 16 + 8 + 12 + 32 + 12 = **172 tri / 10 mesh** | red, roof, gold, bronze, stone | dzwon w kolorze brązu wyraźnie widoczny pod dachem z boku (yaw 0, elewacja 52°) |
| `mauzoleum_teodoryka` | dolna kondygnacja Cyl10 (r 0,20, h 0,12); górna Cyl10 (r 0,15, h 0,08); kopuła płaska Cyl10 (rt 0,10, rb 0,17, h 0,04); 4 „ucha” box 0,03 × 0,025 × 0,02 na obwodzie kopuły; schody 2 boxy 0,08 × 0,02 × 0,06 od +x | 3 × Cyl10 (40) + 4 box + 2 box = 120 + 48 + 24 = **192 tri / 9 mesh** | stone, white, dark | niski gruby wielokąt z płaską kopułą — jedyna rotunda wśród cudów; wymagany teren `plytkie_morze` (brzeg) bez wpływu na model |
| `kopiec_grobowy` (wariant wg `nazwaAlt` Monks Mound — do `D-NM-7`) | kopiec: Cyl4 (rt 0,30, rb 0,44, h 0,12, obrót 45°) + 2. taras Cyl4 (rt 0,16, rb 0,24, h 0,08, obrót 45°) przesunięty w −x; rampa box 0,08 × 0,02 × 0,20 pochylona od +x; budynek na szczycie: box 0,10 × 0,06 × 0,08 + pryzma dachu Cyl3 (r 0,06, dł. 0,11) | Cyl4 (16) × 2 + box + box + Cyl3 (12) = 32 + 12 + 12 + 12 = **68 tri / 5 mesh** | earth, leaf (darń), wood, thatch | trawiasty ścięty kopiec z rampą i chatą na szczycie; nie mylić z `mundo_perdido` (kamienne stopnie, złota świątynia) |

Średnia 5 kart: (156 + 276 + 172 + 192 + 68) / 5 = **172,8 tri**, maks. 276 ≤ 320; mesh maks. 18 ≤ 25.

---

## 4. Modele istniejące „nieużywane” i reguła modelu jednostki (zadanie 4)

### 4.1 Porty modeli nieużywanych (D-MOD-3 = B)

Status „bez rekordu” = żadna z 75 pozycji `units.json` nie prowadzi do funkcji na ścieżce PL ani EN (P4.4 §2.1 `route.py` → `UNUSED`, `UNUSED_BY_PL_AND_EN`). „Martwy” = brak wywołania w `gra/src`.

| # | Funkcja | Plik źródłowy (geometria) | Status (dowód) | Opis z kodu | Paczka P4.4 (przydział i podstawa) |
|---:|---|---|---|---|---|
| 1 | `buildCeltWarrior` | `units.ts:2724` | bez rekordu; reguły nazw `units.ts:1496,1547` nie łapią żadnego rekordu | „long iron sword, tall oval Celtic shield … bronze torc” (`:2718-2723`) | **MOD-07** Żelazo — wg epoki rekordów Celtów (P4.4 §2.1b #41–43, 75: Żelazo) |
| 2 | `buildCrossbowman` | `units.ts:2595` | bez rekordu; reguła `units.ts:1586` (`kusznik`/`crossbowman`) | „Chinese-flavoured crossbowman … lacquer-red lamellar” (`:2587-2594`) | **MOD-06** Brąz — wg epoki rekordów Chińczyków (#15, #16, #38, #39: Brąz); epoka własna: `NIE_ZMIERZONO` (brak rekordu) |
| 3 | `buildGermanWarrior` | `units.ts:3037` | bez rekordu; reguły `:1509,1552`; rekord „Wojownik germański” jest Super → `buildGermanSuper` | „framea … fur cloak … simple cap” (`:3031-3036`) | **MOD-07** Żelazo (#44, #45: Żelazo) |
| 4 | `buildHierosLochos` | `units.ts:1811` | bez rekordu; reguła `:1686`, rekord Super poza białą listą `SUPER_Z_MODELEM_NAZWANYM` (`units.ts:1068-1069`) → `buildSuperGreece` | „Święty Zastęp … szkarłatny płaszcz … koryncki hełm” (`:1800-1810`) | **MOD-07** Żelazo (#12: Żelazo) |
| 5 | `buildLegionRzymski` | `jednostki-p8b-rozni.ts` (eksport; import `units.ts:166`) | bez rekordu; reguła `units.ts:1676` | nagłówek pliku „Legion Rzymski (Rzym, Braz)” (`jednostki-p8b-rozni.ts:10`) | **MOD-06** Brąz (plik Brązu, P4.4 §2.1d) |
| 6 | `buildHastati` (opakowanie) → `hastati-falangita.ts:327` `buildHastati` | `units.ts:2143-2146` deleguje do `hastati-falangita.ts:327` | **martwy**: 0 wywołań; rekord Hastati idzie do `buildHastatiOpus5` (`units.ts:1664-1665`, komentarz „buildHastati poniżej zostaje jako rezerwa”) | „kolczuga … owalny scutum … pilum + gladius” (`units.ts:2136-2141`) | **MOD-07** (plik `hastati-falangita.ts` już w MOD-07) |
| 7 | `buildBerserker` | `units.ts:3098` | **martwy**: rekord idzie do `buildBerserkerZ3` (`units.ts:1508`, komentarz `:1504-1507` „zostaje jako martwy”) | „bare-chested … animal pelt … axe, NO shield” (`:3094-3097`) | **MOD-07** Żelazo (#45) |
| 8–11 | `buildWojownikKamien`, `buildOszczepnik`, `buildLucznik`, `buildZwiadowca` | `jednostki-p1-rdzen.ts:255,341,415,514` | **martwe eksporty**: `units.ts:127-131` importuje tylko Procarz/Wlocznik/Miecznik; zastąpione przez `kamien-bazowe-opus5.ts` (P4.4 §2.1) | rdzeń kamienny v1 | **MOD-04** (plik `jednostki-p1-rdzen.ts` już w MOD-04) |

**Razem 11 geometrii** do portu 1:1 (bez nowej grafiki). **Wymóg osiągalności:** każda z 11 dostaje stały `ModelId` w rejestrze modeli i jest renderowana w galerii/harnessie zrzutów (RR-T11), ale **nie** jest osiągalna z danych gry (brak rekordu; reguła §4.2 nie używa nazw). Kryterium paczki: zrzut 1:1 z webu (P4.4 §5) — referencję webu da się wygenerować tylko wywołując funkcję bezpośrednio (np. narzędzia `gra/tools/*-real-render-test.cjs`, D-MOD-7), bo gra ich nie rysuje. Czy któryś ma wrócić do gry → `D-NM-12`.
**Zapasowe gałęzie kategorii** (`buildCategoryModel`, 20 `case`, `units.ts:3700`; m.in. `topor`, `wlocznik` → `newBuildWlocznik`) są już w zakresie MOD-04 (P4.4 §4.2). Po regule §4.2 nie są osiągalne z 75 rekordów; ich rola → `D-NM-14`.

### 4.2 Reguła „jedna jednostka = jeden model” (D-MOD-9 = A)

**Reguła (wymóg dla MOD-04):**
1. **Klucz modelu = identyfikator typu jednostki** = pole `Jednostka` z `units.json` (PL; unikalne 75/75 — `git show edb8fb56:gra/data/units.json` + `len(set(...))` → `75 unikalnych PL`, `75 unikalnych EN`) oraz 2 typy cywilne `osadnik`, `robotnik` (`units/setup.ts:193` `CIVILIAN_TYPE_IDS`).
2. **Statyczna tabela `UnitTypeId → ModelId`** (77 wpisów) wygenerowana raz z dzisiejszej ścieżki PL (P4.4 §2.1b, 73 różne wywołania builderów; 3 rydwany = `decorateChariot` z różnym dekorem, czyli 3 różne `ModelId`). Tabela jest danymi (plik w crate renderera), nie dopasowaniem tekstu w runtime.
3. **Nazwy wyświetlane (PL/EN) nigdy nie biorą udziału w wyborze modelu.** Wszyscy konsumenci — mapa, bitwa, miniatura, podgląd — wołają `model_for(UnitTypeId, owner_color)`. Dzisiejsze wołania z nazwą: mapa `units.ts:6075,6093` (typeId PL), miniatura `unitMiniPreview.ts:90` (PL), bitwa `battleScene.ts:4197,4365,5101,16261` (`stats['Jednostka'] ?? bu.nazwa` — fallback EN).
4. **Brak wpisu = błąd testu**, nie cichy fallback. W runtime (dane spoza tabeli, np. przyszły rekord) → model kategorii + ostrzeżenie w logu (`D-NM-14`).
5. **Test akceptacyjny (CPU):** dla wszystkich 77 typów `model_for` zwraca ten sam `ModelId` niezależnie od konsumenta; tabela pokrywa 75 rekordów + 2 cywilne; 11 modeli §4.1 nie występuje w tabeli (osiągalne tylko z galerii).

**3 przypadki rozjazdu (P4.4 §2.1c, `route.py` → `EN_DIFF_COUNT 3`) i model docelowy:**

| Jednostka (PL / EN) | Epoka | Dziś: mapa (PL) | Dziś: bitwa przy pustym `stats['Jednostka']` (EN) | **Docelowo wszędzie** |
|---|---|---|---|---|
| Wojownik z toporem / Axe Warrior | Brąz | `buildAxeWarriorInka` (`units.ts:1684`, `jednostki-p2-inka.ts`) | `buildCategoryModel('topor')` (`units.ts:4033`) | `buildAxeWarriorInka` |
| Strażnik bram Harappy / Harappan Gate Guard | Brąz | `buildStraznikHarappy` (`units.ts:1674`, `jednostki-p8b-rozni.ts`) | `buildCategoryModel('wlocznik')` → `newBuildWlocznik` (`jednostki-p1-rdzen.ts`) | `buildStraznikHarappy` |
| Wojownik z żelaznym khopesh / Iron Khopesh Warrior | Żelazo | `buildZelaznyKhopesh` (`units.ts:1750`, `jednostki-z2-srodziemne.ts`) | `buildKhopeshWarrior` (reguła `units.ts:1576`, model **brązowy**; błąd opisany `units.ts:1725-1745`) | `buildZelaznyKhopesh` |

Pozostałe 72 rekordy mają dziś ten sam model na obu ścieżkach — reguła ich nie zmienia. Zmiana zachowania względem webu dotyczy wyłącznie bitwy przy pustym `stats['Jednostka']`; zrzuty porównawcze 1:1 bitwy (P4.4 §5) muszą dla tych 3 jednostek porównywać z modelem mapy, nie z wynikiem ścieżki EN.

---

## 5. Wycena, paczki, kolejność, ryzyka (zadanie 5)

### 5.1 Ile modeli

| Grupa | Liczba modeli | Konfiguracje wizualne | Koszt |
|---|---:|---|---|
| Zestawy Brązu (B-ME, B-EG, B-IN, B-AL, B-EP, B-AZ, B-AN, B-AF) | 8 | 8 × 10 poziomów × 3 mury = 240 | 8 J |
| Nakładki Żelaza (Z-GR … Z-AF) | 10 | 10 × 30 = 300 | 10 × 0,5 = 5 J (założenie, §1.3) |
| Cuda parkowane | 5 | 5 × (normalny + ruina) = 10 | proxy: 19 cudów = 493 linii pliku → ≈ 26 linii/cud; 5 × ≈ 26 ≈ 130 linii TS-ekwiwalentu |
| Porty „nieużywanych” jednostek | 11 | 11 | port 1:1 w MOD-04/06/07 (bez nowej grafiki) |
| Reguła modelu jednostki | 1 tabela (77 wpisów) + test | — | w MOD-04 |
| **Nowa grafika razem** | **23 modele** (18 zestawów miast + 5 cudów) | **550** konfiguracji | ≈ 13 J + 5 cudów |

Czas w dniach: `NIE_ZMIERZONO` (brak kalibracji; P4.4 §4.1, P4.3 §8). Pierwsza paczka NM-01 kalibruje J w Rust.

### 5.2 Paczki (temat = paczka)

Model i wysiłek każdej paczki: Opus 5.5 medium (grafika, R-PROC-AUTOBOT §5a). Izolowany worktree. Ścieżki zgodne z modułem `models` szkieletu P4.6 (`rust-port/renderer/src/models/**`, RR-T7) — dokładny podział podkatalogów potwierdzić po integracji P4.6 (`NIE_ZMIERZONO` dziś: P4.6 równolegle).

| # | ID (propozycja) | Zakres | Allowlista Rust (propozycja) | Zależy od | Ocena wizualna właściciela |
|---:|---|---|---|---|---|
| NM-00 | `R-RUSTPORT-P4-NM-00-CITY-SET-KEY` | klucz zestawu miasta: tabela (ikonaId, epoka) → `CitySetId` (§1.2 wariant B), składowa `visualKey`, rejestr builderów; test tabeli 15 × 3 | `rust-port/renderer/src/models/cities/set_key.rs`, `rust-port/renderer/src/models/cities/registry.rs`, `rust-port/renderer/tests/city_set_key.rs` | P4.6, MOD-09 (szkielet `cities`) | nie (CPU) |
| NM-01 | `R-RUSTPORT-P4-NM-01-BRONZE-ME-EG` | B-ME, B-EG | `rust-port/renderer/src/models/cities/sets/{b_me,b_eg}/**` | NM-00, RR-T4, RR-T5, MOD-09 (helpery B/CYL/CONE/PRISM, `buildPalisadaWal`, referencja Grecja/Rzym) | **tak** |
| NM-02 | `R-RUSTPORT-P4-NM-02-BRONZE-IN-AL` | B-IN, B-AL | `…/sets/{b_in,b_al}/**` | NM-00 (+ wnioski z NM-01) | **tak** |
| NM-03 | `R-RUSTPORT-P4-NM-03-BRONZE-EP-AF` | B-EP, B-AF | `…/sets/{b_ep,b_af}/**` | NM-00 | **tak** |
| NM-04 | `R-RUSTPORT-P4-NM-04-BRONZE-AZ-AN` | B-AZ, B-AN | `…/sets/{b_az,b_an}/**` | NM-00 | **tak** |
| NM-05 | `R-RUSTPORT-P4-NM-05-IRON-GR-RZ` | Z-GR, Z-RZ | `…/sets/{z_gr,z_rz}/**` | NM-00, MOD-09 (Grecja/Rzym Brązu 1:1) | **tak** |
| NM-06 | `R-RUSTPORT-P4-NM-06-IRON-ME-EG-IN` | Z-ME, Z-EG, Z-IN | `…/sets/{z_me,z_eg,z_in}/**` | NM-01, NM-02 | **tak** |
| NM-07 | `R-RUSTPORT-P4-NM-07-IRON-AL-EP-AF` | Z-AL, Z-EP, Z-AF | `…/sets/{z_al,z_ep,z_af}/**` | NM-02, NM-03 | **tak** |
| NM-08 | `R-RUSTPORT-P4-NM-08-IRON-AZ-AN` | Z-AZ, Z-AN | `…/sets/{z_az,z_an}/**` | NM-04 | **tak** |
| NM-09 | `R-RUSTPORT-P4-NM-09-WONDERS-PARKED` | 5 cudów §3.4 | `rust-port/renderer/src/models/wonders/parked/**` | MOD-12 (port 19 cudów: helpery, `mats`, `grey`, `ownerBanner`), RR-T4, RR-T5 | **tak** |
| — | (w MOD-04/06/07) | 11 portów §4.1, reguła §4.2 | allowlisty P4.4 §4.2 paczek 4/6/7 | wg P4.4 | jak P4.4 §5 (1:1) |

Allowlisty NM-01..NM-08 są rozłączne (osobne podkatalogi `sets/<id>`); wspólne pliki (`set_key.rs`, `registry.rs`) zmienia tylko NM-00 — kolejne paczki dopisują się przez rejestr zgodnie z kontraktem NM-00 (bez edycji wspólnych plików; jeśli rejestr wymaga dopisu, robi to orkiestrator przy integracji).

### 5.3 Kolejność

`P4.6 → RR-T4 ∥ RR-T5 → MOD-02 (prymitywy) → MOD-09 (miasta 1:1) → NM-00 → NM-01 (kalibracja J i procesu oceny) → (NM-02 ∥ NM-03 ∥ NM-04) → NM-05 → (NM-06 ∥ NM-07 ∥ NM-08)`; `MOD-12 → NM-09` niezależnie od miast. Równoległość ograniczają przepustowość oceny właściciela (9 sesji ocen) i dostęp do maszyny z GPU, nie allowlisty.

### 5.4 Ryzyka

| # | Ryzyko | Skutek | Mitygacja w spec |
|---:|---|---|---|
| R1 | Brak wzorca 1:1 (nowa grafika) | brak obiektywnego „PASS”; pętle poprawek | K1 automatyczne (budżet, gabaryt, determinizm) oddzielone od K2/K3; karty z 3 punktami rozpoznawczymi; NM-01 jako paczka kalibrująca |
| R2 | Subiektywność oceny | rozbieżne werdykty Evaluator vs właściciel | ostateczny werdykt wyglądu = właściciel (`D-NM-9`); Evaluator ocenia K1 + zgodność z kartą |
| R3 | Brak GPU w środowisku agentów (P4.6 dispatch: „brak `/dev/dri`”) | zrzuty niemożliwe w worktree agenta | zrzuty na maszynie właściciela/CI z GPU (RR-T1, RR-T11); paczka bez zrzutów kończy się `BLOCK` (nie `PASS`) |
| R4 | Anachronizmy (Zulusi, Inkowie, Harappa w Żelazie) | „nieprawdziwy” wygląd | jawne oznaczenie `[zewn.]`, decyzje `D-NM-3`, `D-NM-13` |
| R5 | Centrum miasta podobne do cudu tej kultury | mylenie miasta z cudem na mapie | wymóg rozróżnialności §3.0 (podstawa ≤ 0,34, wysokość ≤ 0,45) + K2 na planszy z cudem |
| R6 | Wzrost liczby draw calli (miasta niescalane) | spadek FPS przy wielu miastach | budżet mesh ≤ średnia + 10%; scalanie statycznych miast jako decyzja P4.3 |
| R7 | Rozjazd kluczy (`visualKey` dziś 11 kluczy `BronzeCiv`) | błędny zestaw dla Harappy | NM-00 z testem pełnej tabeli 15 × 3 |
| R8 | Zależność od RR-T4/RR-T5 i MOD-09 | blokada startu NM | NM-00 może ruszyć zaraz po MOD-09; karty nie zależą od Rust |

---

## 6. Decyzje właściciela `D-NM-n` (NIE rozstrzygam po cichu)

- **D-NM-1 — Liczba zestawów miast.** A: 6 kręgów Brązu + 8 nakładek Żelaza (≈ 10 J); **B (rekomendacja): 8 + 10 (≈ 13 J)**; C: 1 zestaw na państwo, 12 + 15 (≈ 19,5 J). §1.3.
- **D-NM-2 — Żelazo jako nakładka na Brąz** (ten sam szkielet, wymiana centrum, części domów i muru; rekomendacja) czy pełne niezależne zestawy Żelaza (koszt Żelaza ×2).
- **D-NM-3 — Harappa:** osobny zestaw B-IN (rekomendacja) czy w Mezopotamii; oraz czy akceptujesz umowną „cytadelę Żelaza” Z-IN mimo anachronizmu.
- **D-NM-4 — Słowianie:** wspólna nakładka Z-EP z Celtami i Germanami (rekomendacja) czy własny wariant „gród” (+0,5 J).
- **D-NM-5 — Epoka Kamienia:** zostaje wspólna dla wszystkich (rekomendacja; decyzja projektowa w `miasto-kamien.ts:69-70`) czy warianty kręgów (+≈ 0,3 J na krąg przy wymianie samego centrum — założenie).
- **D-NM-6 — Styl cudów parkowanych:** sylwetka zgodna z realnym obiektem epoki 4+ wykonana środkami kanonu (rekomendacja) czy uproszczenie „pod Antyk”. Uwaga: wszystkie 5 ma `aktywne: false`, więc w grze dziś ich nie widać — modele zobaczy się w podglądzie i po odblokowaniu.
- **D-NM-7 — „Kopiec grobowy”:** dane są sprzeczne (`nazwa` „Kopiec grobowy”, `nazwaAlt` „Monks Mound (Mississippian)”, `cywilizacje: [celtowie]`, opis „historycznie nie Galowie”). Model wg Monks Mound (karta §3.4) czy celtycki kurhan?
- **D-NM-8 — Angkor Wat przypisany Harappie** („przypisanie państwa do ustalenia” w danych): model khmerski niezależnie od przypisania (rekomendacja) — potwierdź.
- **D-NM-9 — Kto zatwierdza wygląd:** właściciel po każdej paczce NM-01..NM-09 (rekomendacja) czy Evaluator (Opus) wg kart z wyrywkową kontrolą właściciela.
- **D-NM-10 — Margines budżetu:** +10% do średniej istniejących (rekomendacja) czy inny; czy Żelazo dostaje wyższy margines (np. +20%).
- **D-NM-11 — Ghost założenia miasta** (`bronzeCityRoblox.ts`, 11 wariantów, żywy tylko jako podgląd): port 1:1 (P4.4 MOD-09) czy zastąpić podglądem L1 nowego zestawu (spójność wyglądu).
- **D-NM-12 — 11 modeli „nieużywanych”:** tylko rejestr + galeria (rekomendacja) czy przywrócić część do gry (np. Kusznik, Legion Rzymski jako nowe rekordy danych — to zmiana danych, osobny temat).
- **D-NM-13 — Mur kamienny dla kultur bez murów kamiennych** (Zulusi, częściowo Europa Płn.): umowny kamienny cokół + pale (rekomendacja) czy mur = zawsze palisada dla tych kręgów.
- **D-NM-14 — Gałęzie kategorii po regule §4.2:** zostają jako runtime-fallback z ostrzeżeniem dla typów spoza tabeli (rekomendacja) czy usunięte (test wymusza pełne pokrycie).
- **D-NM-15 — Akcent palety per państwo wewnątrz kręgu** (np. purpura Fenicjan w B-AL, proporcja domów Celtowie/Germanie w B-EP): tak (≈ 0,05 J na państwo; rekomendacja) czy jeden wygląd na krąg.

---

## 7. `NIE_ZMIERZONO`

1. Koszt nakładki Żelaza (0,5 J) i J w liniach Rust — do kalibracji w NM-01.
2. Czas paczek w dniach.
3. Dokładny podział podkatalogów `rust-port/renderer/src/models/**` (P4.6 równolegle, nieintegrowany na bazie `da03ce40`).
4. Epoka własna `buildCrossbowman` (brak rekordu) — przydział do MOD-06 według kultury.
5. Rzeczywisty wygląd kart §3 (brak renderu; spec nie generuje grafiki) — wszystkie wymiary i palety nowych modeli są propozycją.
6. Footprint per wierzchołek zmierzyłem tylko jako górną granicę z rogów AABB (`maxR_swiat_rogiAABB`); wartości per wierzchołek cytuję z deklaracji `MIASTO_*_LAYOUT.granice`.
7. Trójkąty `ExtrudeGeometry` (mur ghost `bronzeCityRoblox`) — nieliczone (mock zwraca `null`); nie dotyczą żywych miast mapy ani cudów (`EXTRUDE_HITS=0` w zmierzonych konfiguracjach).
8. Częstość ścieżki EN w bitwie (P4.4 §7 pkt 8) — nadal wymaga uruchomienia gry; nie wpływa na regułę §4.2.

## 8. Odtwarzalność

| Plik | Rola |
|---|---|
| `dyspozycje/autobot/runs/R-RUSTPORT-P4-7-NEW-MODELS-SPEC-Q1/skrypty/run_measure.py` | punkt wejścia: `git show edb8fb56:` → katalog tymczasowy poza repo → `node --experimental-strip-types measure.ts`; zapisuje `wyniki/measure.txt`, `wyniki/loc.txt` |
| `…/skrypty/three-mock.js` | ręczny mock `three` (klasy używane przez 7 plików modeli), reguły trójkątów r169, AABB w świecie |
| `…/skrypty/measure.ts` | konfiguracje: Kamień L1–10 (+mur L3/6/10), Grecja i Rzym L1–10 (+mur, +palisada L3/6/10), 19 cudów + `default` + sztandar, ghost 11 × L1; budżety |
| `…/wyniki/measure.txt`, `…/wyniki/loc.txt` | wyniki z tej sesji (node v22.22.0) |

Pozostałe twierdzenia: komendy i `plik:linia` w tekście (odczyt `git show edb8fb56:…`, `git grep … edb8fb56`).
