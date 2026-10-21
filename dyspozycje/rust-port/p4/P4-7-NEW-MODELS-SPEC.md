# P4.7 — Specyfikacja nowych modeli 3D: miasta (brąz, żelazo), 5 cudów parkowanych, porty modeli „nieużywanych”, reguła modelu jednostki

**Temat:** `R-RUSTPORT-P4-7-NEW-MODELS-SPEC-Q1` · **Domena:** GAME · **Rola:** Operator (Opus 5.5 medium, wyjątek graficzny R-PROC-AUTOBOT §5a) · **Runda:** 2/5 (poprawki po Evaluatorze r1, zarzuty E1–E12 — mapa zmian w §9)
**Decyzje wejściowe właściciela (LEDGER 2026-10-21, po P4.4):** D-MOD-4 = C (dorobić brakujące modele miast teraz), D-MOD-5 = B (proste modele 5 cudów parkowanych), D-MOD-3 = B (portować wszystkie istniejące modele, także nieużywane), D-MOD-9 = A (jedna jednostka = jeden model wszędzie).
**Charakter dokumentu:** specyfikacja projektowa. Nie powstał żaden kod Rust/TS ani grafika. Nie uruchamiano buildu, `npm` ani weba. Nie zmieniono `gra/**`, `rust-port/**`, `src-tauri/**`.
**Pin web (tylko odczyt):** `edb8fb56`, wyłącznie `git show edb8fb56:<ścieżka>` / `git grep … edb8fb56`. **Baza dokumentu:** `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0` @ `da03ce40`.
**Wejście:** `p4/P4-4-MODEL-CATALOG.md` (§2.1–§2.3, §4.2, §5, D-MOD-1..9), `p4/P4-3-RUST-RENDERER-ARCH.md` (§3.2 kamera, §4 potok modeli, §8 tematy RR-T*), `gra/data/civs.json`, `gra/data/wonders.json`, `gra/data/buildings.json`, `gra/data/tech.json`, `gra/src/render/{cities,miasto-kamien,miasto-braz,bronzeCity,bronzeCityRoblox,wonderModels,wonderRenderer,units}.ts`, `gra/src/game/{civ-entry-epoch,owner-epoch,era-gate-ui}.ts`, `p1/P1-16F-CIVPEDIA-CYWILIZACJE.md`, `p1/P1-16F-CIVPEDIA-CUDA.md`.

**Pomiary r2 (dodane):** `skrypty/three-mock.js` liczy też promień **per wierzchołek** (dokładne wierzchołki Box/Cylinder/Cone/Circle r169 — kolumny `maxR_swiat_wierzch`, `maxR_wewn_wierzch`), `measure.ts` mierzy ghost `bronzeCityRoblox` 11 × L1–L10 i moduły centrum/domów Grecji i Rzymu; nowy `skrypty/budzet_kart.py` liczy budżet każdej karty (`wyniki/budzet_kart.txt`). Wszystkie wiersze r1 w `measure.txt` są niezmienione (porównanie wierszy r1 vs r2 po usunięciu nowych kolumn → 0 różnic).

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
7. **Paczki:** 10 nowych paczek `R-RUSTPORT-P4-NM-00..09` (§5.2). 9 z nich wymaga oceny wizualnej właściciela po każdej paczce. Twarde zależności: P4.6 (szkielet crate'a), RR-T4 (prymitywy), RR-T5 (materiały), RR-T2 + RR-T11 (kamera i harness zrzutów), P4.4 MOD-09 (port 1:1 miast — dostarcza helpery i referencję Grecja/Rzym/Kamień) oraz MOD-12 dla cudów.
8. **Największe ryzyka:** brak wzorca 1:1 w kanonie `miasto-*` (web ma natomiast projekty koncepcyjne per cywilizacja — §1.6, wariant B′ ≈ 11,4 J) i subiektywność oceny, brak GPU w środowisku agentów (zrzuty tylko na maszynie z GPU), anachronizmy kulturowe (Zulusi, Inkowie, Harappa w Żelazie), pomylenie centrum miasta z cudem tej samej kultury (§5.4). Do decyzji: **19 punktów `D-NM-n`** (§6).

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
| Kamień wspólny z założenia | `render/miasto-kamien.ts:73-74` „Epoka kamienia wspolna dla cywilizacji (roznice per-cyw od Brazu) — parametr civ zbedny” |
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
**Kamień:** nie traktuję jako luki — wspólny zestaw jest decyzją projektową w kodzie (`miasto-kamien.ts:73-74`). Rozszerzenie na kręgi to opcja `D-NM-5`.
**Ghost założenia miasta** (`settlementModel.ts:20-23` → `bronzeCityRoblox.ts`) ma już 11 wariantów per klucz `BronzeCiv` i 10 poziomów (`bronzeCityRoblox.ts:398-433`; świątynie `:212-317`, domy `:319-381`), ale to tylko podgląd przy zakładaniu (P4.4 §2.2). Istnieje też klasyczny `buildBronzeCity` per cywilizacja (wyłączony przez D-MOD-1). Oba jako wzorce kształtu → §1.6; relacja ghosta do nowych zestawów → `D-NM-11`.

### 1.3 Propozycja liczby zestawów (kręgi kulturowe) i koszt

**Jednostka kosztu J** = jeden pełny zestaw miasta (10 poziomów, 3 fazy budynku centralnego, 4–6 typów domów/rekwizytów, mur). Proxy z webu (`wyniki/loc.txt`): sekcja GRECJA w `miasto-braz.ts` = **299 linii**, sekcja RZYM = **308 linii**, wspólne API/router/layout = 116 linii, cały `miasto-kamien.ts` = 667 linii (z palisadą). Przyjmuję **1 J ≈ 300 linii TS**. „Nakładka Żelaza” (ten sam szkielet 10 poziomów i te same pozycje, wymienione budynki centralne fazy 2–3, część domów i mur) szacuję na **0,5 J** — to założenie, a nie pomiar (`NIE_ZMIERZONO` do pierwszej paczki). Koszt w liniach Rust: `NIE_ZMIERZONO`.

| Wariant | Brąz — nowe zestawy | Żelazo — nakładki | Zestawy razem | Koszt | Uwagi |
|---|---|---|---:|---:|---|
| **A — minimum** | 6 kręgów: Bliski Wschód (sumer, babilonia, asyria, harappa, egipt), Anatolia-Lewant (hetyci, fenicjanie), Europa Płn. (celtowie, germanie), Azja Wsch. (chinczycy), Andy (inkowie), Afryka Płd. (zulusi) | 8 (Grecja, Rzym + 6 kręgów) | 14 | 6 + 4 = **10 J** | Egipt i Harappa w jednym zestawie z Mezopotamią — tracą najsilniejsze wyróżniki (pylon/obelisk, siatka ulic) |
| **B — rekomendacja** | 8 kręgów: Mezopotamia (sumer, babilonia, asyria), Egipt, Indus (harappa), Anatolia-Lewant (hetyci, fenicjanie), Europa Płn. (celtowie, germanie), Azja Wsch. (chinczycy), Andy (inkowie), Afryka Płd. (zulusi) | 10 (Grecja, Rzym + 8 kręgów; Słowianie w nakładce Europy Płn.) | 18 | 8 + 5 = **13 J** | Zgodne z podziałem, który web już stosuje w ghost (`BronzeCiv`), z dwiema zmianami: Harappa wydzielona z `sumer`, Celtowie i Germanie złączeni |
| B′ — B z wzorców webu (r2) | jak B; centrum i typ domu przeniesione z `bronzeCity.ts`/`bronzeCityRoblox.ts` (§1.6) | 10 | 18 | 8 × 0,8 + 5 = **≈ 11,4 J** (0,8 J = założenie) | Mniejsze ryzyko „braku wzorca”; ograniczenie: sylwetki kolidujące z cudami (ziggurat, piramida) nie są przenoszone |
| C — pełny | 12 (każde państwo osiągalne w Brązie bez Grecji/Rzymu) | 15 | 27 | 12 + 7,5 = **19,5 J** | Najwyższa wierność, koszt ×1,5 względem B, 15 ocen wizualnych Żelaza |

**Uzasadnienie B.** (1) Egipt i Harappa mają w danych własne cuda i jednostki (Piramidy, Stupa w Sanchi; Medżaj, Strażnik bram Harappy — `wonders.json → panstwa`, P4.4 §2.1b), a ich architektura ma wyróżniki, których nie da się oddać paletą (pylony i obeliski; ortogonalna siatka ulic z wypalanej cegły) `[zewn.]`. (2) Sumer/Babilonia/Asyria dzielą ten sam zestaw środków (cegła mułowa, ziggurat) i web już je zwija w jeden klucz (`bronzeCity.ts:30-31`). (3) Celtowie i Germanie dzielą drewno, strzechę i palisadę; różnicę (dom okrągły vs długi) oddaje proporcja typów domów, nie osobny zestaw (§3.2, B-EP). (4) Hetyci i Fenicjanie są już zwinięci w webie (`bronzeCity.ts:34`). Akcent palety per państwo wewnątrz kręgu → `D-NM-15`.

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

### 1.6 Istniejące projekty miast per cywilizacja w webie (r2, zarzut E1) — wzorce kształtu, nie modele mapy

Runda 1 zawęziła to do „ghost L1”. To było za wąsko. Web ma **dwie** rodziny projektów per cywilizacja. Żadna z nich nie jest dziś modelem miasta na mapie (mapa używa `miasto-kamien`/`miasto-braz`, `cities.ts:229-249`):

| Rodzina | Plik i funkcje (blob `edb8fb56`) | Status | Co zawiera per cywilizacja |
|---|---|---|---|
| Klasyczna (styl `civ`) | `render/bronzeCity.ts:399` `buildBronzeCity(civ, level 1..10, …)`; centra: `ziggurat` `:238`, `pylonTemple` `:249` (+ `obelisk` `:195`), `incaTemple` `:273` (Coricancha), `aztecPyramid` `:260`, `chineseHall` `:285`, `zuluGreatHut` `:303` (kraal), `celticNemeton` `:313`, `hittiteGate` `:325`, `germanHof` `:348`, `greekTemple` `:217`, `romanTemple` `:227`; domy: `longhouse` `:77`, `roundhouse` `:88`, `beehiveHut` `:97`, `chineseHouse` `:117`, `celticHouse` `:127`; mury: `murusGallicus` `:137`, `rampartPalisade` `:160`; opis stylów `bronzeCity.ts:1-15`. Kamień: `stoneCity.ts:371-373` `buildStoneAgeCity(civ?, …)` | **poza portem**: D-MOD-1 rozstrzygnięte = tylko styl `roblox` (LEDGER `dyspozycje/rust-port/LEDGER.md:128`; P4.4 §6 D-MOD-1); dobór przez `settlementModel.ts` gałąź `style !== 'roblox'` | 10 poziomów, centrum + typy domów + mur per kultura |
| Ghost Roblox (podgląd zakładania) | `render/bronzeCityRoblox.ts:398-433` `buildBronzeCityRoblox(civ, level, …)`: `hutCount = [2,3,5,7,9,12,15,18,22,26][L-1]`, `temple(civ, …)`, `house(civ, …)`, `walls(civ, …)` — 11 kluczy `BronzeCiv` | żywy tylko jako podgląd (P4.4 §2.2; port 1:1 w MOD-09) | 10 poziomów, ale układ to pierścienie `spread = 0.13 + L·0.05` z `rnd` |

**Pomiar ghost na mapie (r2, `wyniki/measure.txt`, sekcja `GHOST … L1..L10`):** L10 ma promień per wierzchołek **0,89–0,92** (wewn.) wobec rezerwy miasta 0,42 i pasa ulepszeń 0,50–0,82 (§2.2). Ma też **852–1776 tri** wobec budżetu L10 = 1087: przekraczają go `rzym` 1148, `sumer` 1564, `egipt` 1584, `aztek` 1588, `chiny` 1536, `zulu` 1776, `germanie` 1236 i `hetyci` 1648. Na L1 ghost ma 180–384 tri wobec budżetu 207. Mieszczą się w nim tylko `inka` 180 i `germanie` 204. **Wniosek:** ghost ani klasycznego buildera nie da się wziąć jako zestawu mapy 1:1 (inne gabaryty, inny budżet, układ pierścieni zamiast stałych slotów, a klasyczny jest wyłączony przez D-MOD-1). Oba są natomiast **gotowym projektem koncepcyjnym**: centrum, typ domu i mur każdej kultury już istnieją.

**Konsekwencja dla spec (r2):**
- Twierdzenie „brak wzorca” zawężam do: brak wzorca **1:1 w kanonie `miasto-*`** (stałe sloty, budżet, rezerwa środka). Każda karta §3.2 ma teraz wiersz **„Wzorzec w webie”** z funkcją i linią. Punkty rozpoznawcze kart pokrywają się z tymi projektami celowo. Nie jest to nowa grafika „z głowy” — to przeniesienie istniejącego projektu do kanonu.
- **Wariant kosztowy B′ („B z wzorców webu”)** to ten sam zakres co B, ale centrum v1–v3 i typ domu są przenoszone z `bronzeCity.ts`/`bronzeCityRoblox.ts` (z przeskalowaniem do slotów i budżetu §2.6), a nie projektowane od zera. Szacuję **≈ 0,8 J na zestaw Brązu** zamiast 1 J (−20% na projekcie centrum i domów). To założenie (`NIE_ZMIERZONO`), zweryfikuje je NM-01. Razem B′ ≈ 8 × 0,8 + 5 = **11,4 J**. Nakładki Żelaza nie mają wzorca w webie, więc ich koszt się nie zmienia. **Ograniczenie wzorca:** klasyczny `sumer` = ZIGGURAT (`bronzeCity.ts:7,238`) i `aztek` = piramida schodkowa koliduje z cudem tej samej kultury (`wonderModels.ts:216-230` `ziggurat`). Przy B′ obowiązuje reguła rozróżnialności §3.0, więc z wzorca bierzemy materiał i typ domu, ale nie wielostopniową sylwetkę (§3.2 B-ME). Wybór → `D-NM-16`.

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
| Gabaryt zmierzony **per wierzchołek** (r2; świat) | L10 bez muru: Kamień **0,420**, Grecja 0,416, Rzym 0,418 (= deklaracje `granice` ≤ 0,42); z murem 0,485–0,486 | `wyniki/measure.txt` (`maxR_swiat_wierzch`) |
| Gabaryt z rogów AABB (r1; górna granica, **nie** metryka akceptacji) | L10 bez muru: Kamień 0,460, Grecja 0,416, Rzym 0,418; z murem 0,485–0,489 | `wyniki/measure.txt` (`maxR_swiat_rogiAABB`) |
| Wysokość zmierzona (świat, z masztem/proporcem) | L10: Kamień 0,479, Grecja **0,535**, Rzym 0,296 | `wyniki/measure.txt` (`maxY_swiat`) |
| Proporcje modułów | dom ≈ 0,155 × 0,115 × 0,135 (Grecja), 0,16 × 0,115 × 0,14 (Rzym); budynek centralny ≈ 0,30–0,37 × 0,20–0,25 podstawy, kalenica 0,19–0,33; domy na pierścieniu r 0,245–0,31 | `miasto-braz.ts:230-283,564-596,399-479` |
| Cuda: gabaryt (r2: per wierzchołek, wewn. przed `WONDER_SCALE`) | promień poziomy 0,099–0,549·R; **18/19 ≤ 0,50** (wyjątek `osada_aschaffenburg` 0,549; dalej `roquepertuse` 0,480, `koloseum` 0,450); wysokość świat 0,18–0,78 (`terakotowa_armia` 0,184 … `wielka_stela` 0,782) | `wyniki/measure.txt` (`cud …`, `maxR_wewn_wierzch`) |

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
| L1 | budynek centralny v1 + plac (Circle seg 6, r ≈ 0,125–0,135) + ścieżka do bramy (box 0,16 × 0,01 × 0,07 przy x ≈ 0,26) + maszt (Cyl5) z proporcem (box) |
| L2 | + 1 dom + 1 rekwizyt |
| L3 | + 1 dom + 1 rekwizyt (koniec fazy małej) |
| L4 | budynek centralny **v2** (większy, s ≈ 1,12) + przestawienie na szerszy pierścień (r 0,265–0,29) + 1 dom |
| L5 | + 1 dom + 1 rekwizyt (np. studnia/cysterna) |
| L6 | + 1 dom piętrowy + 1 rekwizyt (koniec fazy średniej) |
| L7 | budynek centralny **v3** (s ≈ 1,15) + 2 ulice (E-W 0,72, N-S 0,55) + 2 domy + budynek drugoplanowy fazy dużej |
| L8 | + 1 dom piętrowy + 1 rekwizyt |
| L9 | + 1 dom przy bramie (opcjonalnie wzrost budynku centralnego do s ≈ 1,22 jak Rzym) |
| L10 | + 1 dom kwartału SW + 1 rekwizyt — pełne miasto |

**Liczby harmonogramu (r2, wymóg; skumulowane L1…L10):** domy zwykłe `0,1,2,3,4,4,6,6,7,8`; domy piętrowe `0,0,0,0,0,1,1,2,2,2`; rekwizyty `0,1,2,2,3,4,4,5,5,6`; budynek drugoplanowy od L7. Dla porównania Grecja L10 ma 71 mesh (zmierzone), a wg `skladFazaDuzaG` (`miasto-braz.ts:447-479`) 7 domów (3 piętrowe) + stoa + 7 rekwizytów. Runda 1 dopuszczała „4–5 domów” na L7 i wtedy karty przekraczały budżet od L7 (zarzut E2, odtworzone `budzet_kart.py` przy starym harmonogramie).

**Budżet (wymóg):** tri i mesh na poziom ≤ tabela §2.6; wzrost tri ściśle monotoniczny L1→L10; mur kamienny ≤ 368 tri; wysokość świat ≤ 0,59 (= ⌈0,535 × 1,1⌉ do 0,01 — najwyższe żywe miasto Grecja L10); footprint bez muru ≤ 0,42, z murem ≤ 0,49.
**Definicje metryk K1 (r2, zarzut E9):** *footprint* = `max po wszystkich wierzchołkach wszystkich meshy modelu √(x² + z²)` we współrzędnych świata względem środka heksa (bez muru/palisady dla progu 0,42; z nimi dla 0,49). To ta sama miara co `MIASTO_*_LAYOUT.granice` („per wierzchołek”). Metryka z rogów AABB **nie** jest kryterium (Kamień L10: AABB 0,460, per wierzchołek 0,420 — `wyniki/measure.txt`). *Wysokość* = `max y` wierzchołków w świecie bez masztu i proporca dla limitu centrum (≤ 0,45), z nimi dla limitu modelu (≤ 0,59). *Szerokość centrum* (rozróżnialność niżej) = maks. wymiar X albo Z prostopadłościanu obejmującego budynek centralny w jego własnym układzie.
**Budżet każdej karty jest policzony (r2, zarzut E2):** `python3 -I …/skrypty/budzet_kart.py` → `wyniki/budzet_kart.txt`, `EXIT=0` = wszystkie karty §3.2–3.4 w budżecie na każdym poziomie, monotoniczne, z murem ≤ 368. Wyniki podaję w tabeli §3.5. Karta zmieniana w paczce musi przejść ten sam rachunek (K1).
**Kolor gracza (wymóg):** proporzec/sztandar w pełnym kolorze na maszcie budynku centralnego od L1 + kalenica/akcent budynku centralnego `lerp(·, kolor gracza, 0,40)`.
**Rozróżnialność od cudów (wymóg):** budynek centralny miasta ma szerokość ≤ 0,34 i wysokość ≤ 0,45 (bez masztu); cuda tej samej kultury mają podstawę 0,44–0,50 (`wonderModels.ts`). Centrum miasta **nie może kopiować sylwetki cudu** w żadnej skali. Operacyjnie: centrum nie powtarza znaku rozpoznawczego cudu, czyli liczby stopni bryły schodkowej, kopuły, piramidy ani układu wież (r2, zarzut E3: `ziggurat` = 4 stopnie 0,48/0,38/0,28/0,18 ze schodami, `wonderModels.ts:216-230`, więc żadne centrum Mezopotamii nie ma więcej niż 1 stopnia tarasu) (dotyczy: ziggurat ↔ B-ME, piramida ↔ B-EG, `mundo_perdido` ↔ B-AN, `palac_weiyang` ↔ B-AZ, `roquepertuse`/`osada_aschaffenburg` ↔ B-EP, `yerkapi` ↔ B-AL, `stupa_sanchi` ↔ B-IN).

**Kryteria akceptacji wspólne (każdy zestaw):**
- **K1 (CPU, automatyczne):** budżet tri/mesh per poziom, monotoniczność, footprint, wysokość, sektor bramy, 2 budowy = identyczne drzewo (determinizm), brak prymitywów spoza §2.1. Test w paczce, wynik w raporcie z `EXIT`.
- **K2 (wizualne, właściciel):** z kamery gry (elewacja 52°, yaw 0, fov 50° — P4.3 §3.2) na odległości **d = 11** (granica MID/FAR LOD chipa, `zoomLod.ts:161-163`) zestaw jest odróżnialny od Grecji, Rzymu i każdego innego zestawu z tej samej fazy (test „zgadnij krąg” na zrzutach bez podpisów); na **d = 5,5** widoczne są wszystkie 3 punkty rozpoznawcze z karty zestawu.
- **K3 (wizualne):** spójność z kanonem — ta sama tonacja i „klockowość” co Grecja/Rzym na tym samym zrzucie (zestawienie obok siebie).

**Metoda oceny (wymóg):** zrzuty z renderera Rust (RR-T11 harness), jednakowa kamera i światło jak w grze, `pixelRatio = 1`, neutralny heks trawy, kolor gracza `0xffd54a` (domyślny, `miasto-braz.ts:101`). Siatka zrzutów na zestaw: poziomy **L1, L3, L4, L6, L7, L10** × mury **none / palisada / mur** × odległości **d = 8/3 (min), 5,5, 11** = 54 zrzuty + 1 plansza porównawcza „wszystkie zestawy na L6 bez muru, d = 11”. Werdykt właściciela per zestaw: PASS / FAIL z listą poprawek (`D-NM-9`).

### 3.1 Karta zestawu — format

Każda karta: **ID** · państwa · referencja (`[zewn.]`) + 3 punkty rozpoznawcze · kompozycja (bryły z proporcjami, wartości wewnętrzne = świat; `s` = skala modułu) · paleta (**propozycja**, hex) · warianty poziomów (odstępstwa od szablonu §3.0) · mur kamienny · kryteria akceptacji specyficzne (K2 dopełnione o punkty rozpoznawcze). Budżet = §3.0 (wspólny dla wszystkich kart).

### 3.2 Brąz — 8 nowych zestawów (wariant B)

#### B-ME — Mezopotamia (Sumerowie, Babilonia, Asyria)

- **Wzorzec w webie (r2):** `bronzeCity.ts:7` „sumer — mulobrick + ZIGGURAT”, `ziggurat` `:238`; ghost `bronzeCityRoblox.ts` `temple('sumer')` (`:212-317`), paleta ghost `sumer` (`:115-171`). Z wzorca bierzemy cegłę mułową, kubiczny dom i świątynię na tarasie. **Nie** bierzemy wielostopniowej sylwetki — koliduje z cudem `ziggurat` (§3.0, zarzut E3).
- **Referencja `[zewn.]`:** miasta-państwa Ur/Uruk: domy z cegły mułowej z płaskimi dachami-tarasami, ciasna zabudowa, w centrum świątynia na wysokim tarasie (typ „Białej Świątyni” z Uruk), przypory ścian; palmy daktylowe i kanały.
- **Punkty rozpoznawcze (r2):** (1) **jednostopniowy** wysoki taras świątynny o pochyłych ścianach, z frontową rampą i cellą z przyporami (od fazy 2); (2) kubiczne domy bez dachów spadzistych, z ciemnym gzymsem; (3) palmy i pas wody kanału.
- **Kompozycja (r2):** v1 (L1–3) świątynka na tarasie: taras box 0,26 × 0,04 × 0,22 + cella box 0,14 × 0,10 × 0,12 + drzwi box 0,013 × 0,06 × 0,04 (3 mesh / 36 tri). v2 (L4–6) świątynia na wysokim tarasie: taras = Cyl4 ścięty (rt 0,12, rb 0,16, h 0,08, obrót 45° → kwadrat o boku rb·√2 = 0,23) + cella box 0,12 × 0,08 × 0,10 na szczycie + drzwi + rampa box 0,05 × 0,02 × 0,16 pochylona (rx ≈ 0,45) od +x + 2 przypory box 0,02 × 0,07 × 0,03 (6 mesh / 76 tri). v3 (L7–10): taras rt 0,13, rb 0,17, h 0,09 (bok 0,24 ≤ 0,34) + cella + drzwi + rampa + 4 przypory (8 mesh / 100 tri); wysokość bez masztu ≤ 0,24. **Zero** drugiego stopnia (cud `ziggurat` ma 4). Dom: box 0,15 × 0,10 × 0,13 + gzyms box 0,155 × 0,015 × 0,135 (ciemny) + drzwi (≈ 36 tri); dom piętrowy: + box 0,09 × 0,07 × 0,08. Rekwizyty: palma (Cyl5 0,012 × 0,11 + 2 skrzyżowane boxy liści 0,07 × 0,012 × 0,02), kanał (box wody 0,20 × 0,008 × 0,04), piec garncarski (Cyl6 + Cone6), spichrz (Cone6 kopułka na Cyl6).
- **Paleta (propozycja):** cegła mułowa 0xc9a372, cegła ciemna 0xa98a63, gzyms/bitum 0x4a3a2c, trzcina 0xc9b77a, taras 0xb89a70, palma 0x6f8f3e, pień 0x8a6a42, woda 0x5a8bb0, plac 0xbfa678, czerń drzwi 0x14100b (odcień ściany jak ghost `sumer` 0xd4a574, przygaszony).
- **Mur kamienny:** mur z cegły mułowej: 18 bloków 0,12 × 0,11 × 0,06 na osi muru + 2 prostokątne wieże bramne 0,06 × 0,16 × 0,07 z gzymsem (22 mesh / 264 tri ≤ 368).
- **K2 specyficzne (r2):** na d = 11 taras świątynny (v2/v3) jest czytelny jako **jeden** wysoki stopień z rampą od strony bramy; na planszy obok cudu `ziggurat` (4 stopnie) centrum nie jest mylone z cudem; brak dachów spadzistych w całym mieście.

#### B-EG — Egipt

- **Wzorzec w webie (r2):** `bronzeCity.ts:8` „egipt — mulobrick + swiatynia PYLONOWA (2 pylony + brama) + obeliski”, `pylonTemple` `:249`, `obelisk` `:195`; ghost `temple('egipt')`.
- **Referencja `[zewn.]`:** miasto nad Nilem z bielonej cegły mułowej; świątynia z pylonem (dwie ścięte wieże bramne), maszty z proporcami przed pylonem, obeliski; domy z tarasem i przybudówką na dachu; palmy.
- **Punkty rozpoznawcze:** (1) para ściętych pylonów z belką bramy (od fazy 2); (2) para obelisków ze złotym szczytem (faza 3); (3) białe kubiczne domy z płaskim dachem i małą nadbudówką.
- **Kompozycja:** v1 kapliczka: box 0,16 × 0,10 × 0,12 + 2 mini-pylony Cyl4 (rt 0,035, rb 0,05, h 0,12, obrót 45°) + maszt z proporcem. v2 świątynia pylonowa: 2 pylony Cyl4 (rt 0,055, rb 0,075, h 0,20, obrót 45°) rozstawione o 0,15 w osi z, belka bramy box 0,05 × 0,03 × 0,10 z akcentem lapis, za nimi sala box 0,18 × 0,11 × 0,16, 2 maszty z proporcami gracza przed pylonem. v3 = v2 × 1,15 + 2 obeliski (box 0,025 × 0,16 × 0,025 + Cone4 złoty 0,02 × 0,035) przed pylonem + sala hypostylowa (box 0,20 × 0,02 dach na 4 × Cyl5 0,014 × 0,09). Rachunek: v1 4 mesh / 56 tri, v2 7 / 100, v3 16 / 232. Dom: box 0,15 × 0,11 × 0,13 biały + nadbudówka box 0,05 × 0,04 × 0,05 + drzwi. Rekwizyty: palma (jak B-ME), spichrze kopułkowe (Cyl6 0,03 × 0,04 + Cone6), studnia-żuraw (szaduf: słup + skośna belka), pas Nilu (opcjonalnie, box wody).
- **Paleta (propozycja):** wapno/biel 0xefe3c4, cegła 0xc9a26b, piaskowiec 0xe0c48a, piaskowiec ciemny 0xc2a46e, złoto 0xd9b13b, lapis 0x2e5aa8, palma 0x6f8f3e, woda 0x4f9bb5.
- **Mur kamienny:** mur z cegły mułowej z falującą (naprzemiennie wyższą/niższą) koroną: 18 bloków + belka + brama z 2 mini-pylonami Cyl4 (21 mesh / 260 tri ≤ 368).
- **K2 specyficzne:** pylony czytelne jako dwie ścięte wieże po bokach bramy; **żadnej piramidy** w mieście (rozróżnienie od cudu `piramidy`).

#### B-IN — Indus (Harappa)

- **Wzorzec w webie (r2):** brak osobnego — Harappa jest zwinięta do `sumer` (`bronzeCity.ts:31`), więc ghost i klasyczny builder pokazują dla niej ziggurat. Karta jest nowa (stąd `D-NM-3`).
- **Referencja `[zewn.]`:** Mohendżo-Daro/Harappa: ortogonalna siatka ulic, jednolite domy z wypalanej cegły z płaskim dachem, podwyższona cytadela z Wielką Łaźnią i spichlerzem, studnie.
- **Punkty rozpoznawcze:** (1) prostopadła siatka ulic N-S/E-W **od L1** (wyjątek od szablonu, gdzie ulice są od L7); (2) podwyższona ceglana platforma-cytadela z prostokątnym basenem wody; (3) jednolite czerwono-ceglane domy, rzędami, drzwiami do ulicy (nie „ku środkowi”).
- **Kompozycja:** v1 studnia ceglana (Cyl6 0,03 × 0,04) + mała platforma box 0,18 × 0,03 × 0,14 + maszt z proporcem; ulice: 2 boxy 0,60 × 0,01 × 0,06 (E-W) i 0,06 × 0,01 × 0,45 (N-S). v2 cytadela: platforma box 0,30 × 0,05 × 0,24 + łaźnia: obrzeże 4 boxy 0,12 × 0,02 × 0,015 + woda box 0,10 × 0,008 × 0,07 + schodki. v3 = v2 × 1,12 + spichlerz (3 boxy 0,05 × 0,05 × 0,12 na cokole 0,18 × 0,02 × 0,14) + wieża narożna cytadeli. Dom: box 0,15 × 0,10 × 0,12 + attyka box 0,155 × 0,012 × 0,125 + drzwi; domy ustawione **rzędami wzdłuż ulic** (rotY ∈ {0, π/2}). Rekwizyty: studnia, kanał odpływowy (box 0,20 × 0,006 × 0,02), dzban (Cyl5). Ulice od L1 liczone w v1 (szablonowych ulic L7 nie dodaje się drugi raz). Rachunek: v1 4 mesh / 60 tri (z ulicami), v2 7 / 84, v3 12 / 144.
- **Paleta (propozycja):** cegła wypalana 0xb5603f, cegła ciemna 0x8f4a32, cegła jasna 0xd08a5f, tynk 0xe6d3b0, woda 0x5a8bb0, plac 0xbfa678, ulica 0xc9a57a.
- **Mur kamienny:** ceglany mur: 16 bloków + 8 prostokątnych bastionów co 45° + 2 wieże bramne (26 mesh / 312 tri ≤ 368).
- **K2 specyficzne:** na d = 11 widoczna regularna siatka; miasto nie wygląda jak B-ME (inny kolor cegły, zero zigguratu); nie przypomina cudu `stupa_sanchi` (brak kopuły).

#### B-AL — Anatolia-Lewant (Hetyci, Fenicjanie)

- **Wzorzec w webie (r2):** `hittiteGate` `bronzeCity.ts:325` (brama z lwami); ghost `temple('hetyci')`; Fenicjanie zwinięci do `hetyci` (`bronzeCity.ts:34`).
- **Referencja `[zewn.]`:** Hattusa: kamienne cokoły murów, prostokątne wieże, bramy z lwami, domy z płaskim dachem i belkami; miasta fenickie (Tyr, Byblos): kamienne domy, świątynie z dziedzińcem, cedr.
- **Punkty rozpoznawcze:** (1) szary kamień dolnych partii i ciemne pasy belek drewnianych na ścianach; (2) świątynia z prostokątnym dziedzińcem otoczonym murkiem (faza 2+); (3) prostokątne wieże z blankami (mur i brama cytadeli).
- **Kompozycja:** v1 dom władcy: cokół box 0,22 × 0,035 × 0,16 kamień + korpus box 0,18 × 0,10 × 0,13 cegła + pas belki box 0,185 × 0,012 × 0,135 + maszt. v2 świątynia z dziedzińcem: obwód 4 murki (2 × 0,26 × 0,05 × 0,015 + 2 × 0,015 × 0,05 × 0,20) + sala box 0,13 × 0,12 × 0,12 przy tylnej ścianie + brama dziedzińca (2 boxy wieżyczek 0,035 × 0,09 × 0,035). v3 = v2 × 1,15 + cytadela: 2 wieże z blankami (box 0,06 × 0,18 × 0,06 + 4 blanki box 0,015 × 0,02 × 0,015). Rachunek: v1 4 mesh / 48 tri, v2 8 / 96, v3 18 / 216. Dom: cokół kamienny + ściana + pas belki + dach płaski (≈ 48 tri). Rekwizyty: cedr (Cone5 ciemnozielony warstwowo ×2 na pniu), stągiew (Cyl5), ołtarz.
- **Paleta (propozycja):** kamień 0x9a9a92, kamień ciemny 0x74746c, cegła 0xb89a78, belka 0x5d4a36, dach 0x8c7b66, cedr 0x3f6b45, akcent (fenicka purpura — tylko przy `D-NM-15` = tak) 0x7b2a5a.
- **Mur kamienny:** mur „cyklopowy”: 12 bloków + 6 prostokątnych wież co 60° (2 z nich = brama), każda z 1 pasem blanków (box) (24 mesh / 288 tri ≤ 368). **Nie** kopiować `yerkapi` (rampa ziemna z tunelem).
- **K2 specyficzne:** szarość kamienia wyraźnie inna niż biel Grecji; na d = 5,5 widoczne blanki wież i pas belek.

#### B-EP — Europa Północna (Celtowie, Germanie)

- **Wzorzec w webie (r2):** `bronzeCity.ts:13-14` (celtowie: okrągłe chaty + nemeton; germanie: longhouse + hof), `roundhouse` `:88`, `longhouse` `:77`, `celticHouse` `:127`, `celticNemeton` `:313`, `germanHof` `:348`, `murusGallicus` `:137`.
- **Referencja `[zewn.]`:** celtyckie domy okrągłe ze stożkową strzechą, germańskie długie domy z dachem do ziemi, święty gaj/nemeton, drewniany słup-idol.
- **Punkty rozpoznawcze:** (1) stożkowe strzechy (zielono-brązowe) domów okrągłych; (2) długi dom z dachem dwuspadowym schodzącym nisko; (3) zero kamienia w zabudowie (poza murem) — drewno, glina, strzecha.
- **Kompozycja:** v1 duża chata okrągła wodza: Cyl8 0,09 × 0,06 + Cone8 0,12 × 0,13 strzecha + drzwi + maszt z proporcem. v2 długi dom: korpus box 0,26 × 0,07 × 0,12 + 2 połacie box 0,27 × 0,02 × 0,09 (rx ±0,75) + kalenica w kolorze gracza (lerp 0,40) + szczytowe deski (2 boxy skrzyżowane). v3 hala (długi dom × 1,2) + nemeton: krąg 6 słupków box 0,02 × 0,07 × 0,02 + słup-idol Cyl6 0,02 × 0,16 + głowica box. Domy: okrągły (Cyl6 + Cone6, ≈ 36 tri), długi mały (box + 2 połacie, ≈ 36 tri). **Proporcja typów domów jest parametrem państwa:** Celtowie 3 okrągłe : 1 długi, Germanie 1 okrągły : 3 długie (ten sam zestaw pozycji, inny typ w slocie — koszt 0,05 J). Rekwizyty: stóg (Cone6), zagroda (4 boxy), drewutnia (2 boxy). Rachunek (budżet liczony wariantem droższym: dom długi 4 mesh / 48 tri): v1 3 / 60, v2 7 / 84, v3 15 / 192.
- **Paleta (propozycja):** strzecha 0xa89a52, strzecha ciemna 0x7f7640, glina-plecionka 0xc9b08a, drewno 0x7a5a38, drewno ciemne 0x5a4128, mech/darń 0x6f8a4a, plac 0xa99064.
- **Mur kamienny:** wał ziemny z kamiennym licem (12 bloków) i drewnianą koroną (12 boxów) + brama-wieża drewniana (box + Cone4) (26 mesh / 308 tri ≤ 368). Nie budować pełnego pierścienia murowanego jak `roquepertuse`/`osada_aschaffenburg` (te cuda mają mur zawsze; miasto — tylko przy `mur`).
- **K2 specyficzne:** Celtowie i Germanie na tej samej planszy odróżnialni proporcją dachów okrągłych do długich; brak bieli/terakoty.

#### B-AZ — Azja Wschodnia (Chińczycy)

- **Wzorzec w webie (r2):** `chineseHall` `bronzeCity.ts:285`, `chineseHouse` `:117`, `pagodaRoof` `:104`; ghost `temple('chiny')`.
- **Referencja `[zewn.]`:** Shang/Zhou: hale drewniane na platformach z ubitej ziemi, czerwone kolumny, szerokie okapy dachów czterospadowych, zamknięte dziedzińce na osi, mury z ubitej ziemi warstwami.
- **Punkty rozpoznawcze:** (1) czerwone kolumny pod szerokim ciemnym okapem; (2) zamknięty prostokątny dziedziniec na osi (brama → hala); (3) ochrowy mur z ubitej ziemi z poziomymi pasami.
- **Kompozycja:** v1 hala na platformie: platforma box 0,24 × 0,04 × 0,18 ochra + korpus box 0,16 × 0,08 × 0,11 + dach czterospadowy = Cyl4 (rt 0,06, rb 0,14, h 0,06, obrót 45°, skala z 0,75) + 2 czerwone Cyl5 przed fasadą + maszt. v2 dziedziniec: obwód 4 murki + hala główna (v1 × 1,12) na osi N + 2 hale boczne (½ skali) + brama (box + mały dach). v3 = v2 × 1,15, hala główna z podwójnym okapem (drugi Cyl4 mniejszy nad pierwszym). Dom: korpus box + dach Cyl4 ścięty (≈ 28 tri). Rekwizyty: drzewo (pień Cyl5 + Cone5 ×2), studnia (Cyl6), dzban ceramiczny (Cyl5). Rachunek: v1 6 mesh / 92 tri, v2 16 / 224, v3 17 / 240.
- **Paleta (propozycja):** ubita ziemia 0xc2a06a, ziemia ciemna 0xa3834f, ściana 0xe8dcc4, kolumna 0xb23a2e, dach ciemny 0x4a4642, dach ciemniejszy 0x34312e, złoto 0xd9b13b. (Ghost `chiny`: ściana 0xfff3e0, dach 0x424242, akcent 0xd32f2f — `bronzeCityRoblox.ts:147-148`.)
- **Mur kamienny:** mur z ubitej ziemi: 12 bloków + 12 pasów drugiego odcienia + brama (box + dach Cyl4) (26 mesh / 316 tri ≤ 368).
- **K2 specyficzne:** okapy dachów wyraźnie szersze niż ściany; nie kopiować sylwetki `palac_weiyang` (czerwony cokół 0,48 × 0,08 z ciemnym dachem) — hala miasta ≤ 0,30 szerokości.

#### B-AN — Andy (Inkowie)

- **Wzorzec w webie (r2):** `incaTemple` `bronzeCity.ts:273` (`:9` „kamienne tarasy + thatch + platforma-swiatynia (zloty trapez, Coricancha)”); ghost `temple('inka')`.
- **Referencja `[zewn.]`:** zabudowa inkaska: szare mury z dopasowanych kamieni, trapezowe drzwi, strome strzechy, zagrody `kancha` (dziedziniec otoczony domami), tarasy uprawne, platforma `ushnu`.
- **Punkty rozpoznawcze:** (1) bardzo strome strzechy (wysokie pryzmy/stożki) nad szarymi ścianami; (2) trapezowe ciemne otwory drzwi; (3) zielone tarasy schodkowe na skraju miasta (faza 3).
- **Kompozycja:** v1 kancha: 4 domy-moduły wokół placyku (2 w L1) + maszt z proporcem. v2 ushnu: 3 stopnie box 0,22 / 0,16 / 0,10 × 0,035 + kancha przy placu. v3 świątynia (Coricancha): długa sala box 0,26 × 0,10 × 0,12 kamień + złoty pas box 0,265 × 0,012 × 0,125 + stroma strzecha (pryzma Cyl3 r 0,09) + ushnu obok; tarasy: 3 boxy zieleni schodkowo (0,30 × 0,02 × 0,05, przesunięcie 0,05) w kwadrancie W. Dom: ściana box 0,13 × 0,08 × 0,11 + stroma strzecha Cyl3 (r 0,075, długość 0,14) + drzwi trapezowe = Cyl4 (rt 0,012, rb 0,018, h 0,05, spłaszczony z 0,3). Rekwizyty: lama **uproszczona do 3 boxów** (tułów, szyja, głowa = 3 mesh / 36 tri; r2, zarzut E2 — `buildLama` z `pastwisko-modele` ma 204 tri, `pastwisko-modele.ts:12`, i nie jest używany), kosz (Cyl5). Rachunek: dom/moduł kanchy 3 mesh / 40 tri; v1 (2 moduły) 6 / 80, v2 15 / 196, v3 22 / 284.
- **Paleta (propozycja):** kamień 0x8f969a, kamień ciemny 0x6f767a, strzecha 0xc9a24e, strzecha ciemna 0xa3823e, złoto 0xd4a017 (kolor danych Inków `civs.json kolorHex`), taras 0x6f9a4a, plac 0xb59d74.
- **Mur kamienny:** mur kamienny o zygzakowatym obrysie (19 bloków naprzemiennie przesuniętych o 0,02 w promieniu) + trapezowa brama Cyl4 (20 mesh / 244 tri ≤ 368).
- **K2 specyficzne:** dachy wyraźnie wyższe niż ściany; ushnu niskie (≤ 0,11 wysokości) i bez świątyni na szczycie — nie mylić z `mundo_perdido`; tarasy nie kopiują modelu ulepszenia `tarasy-model.ts`.

#### B-AF — Afryka Południowa (Zulusi)

- **Wzorzec w webie (r2):** `zuluGreatHut` `bronzeCity.ts:303`, `beehiveHut` `:97` (`:12` „kraal: pierscien kopulastych chat + centralna wielka chata + zagroda”); ghost `temple('zulu')`.
- **Referencja `[zewn.]`:** zuluskie `umuzi`/`ikhanda`: kolisty układ, kopulaste chaty z trawy (`indlu`) drzwiami ku środkowi, centralna zagroda bydła (`isibaya`), chata wodza naprzeciw wejścia, ogrodzenie z pali.
- **Punkty rozpoznawcze:** (1) kopulaste chaty (ścięty walec + niski stożek, bez ścian pionowych); (2) koncentryczny, kolisty układ z pustą środkową zagrodą bydła; (3) największa chata naprzeciw bramy (po stronie −x).
- **Kompozycja (r2, zarzut E2 — runda 1 miała 2 krowy z `pastwisko-modele` po 252 tri i 8 pali, czyli ≈ 600 tri przy budżecie L1 = 207):** v1 isibaya: krąg **6 pali** box 0,012 × 0,05 × 0,012 r 0,10 + **1 krowa z 2 boxów** (tułów 0,05 × 0,025 × 0,02 + głowa 0,015) + chata wodza na −x + maszt z proporcem przy chacie; z elementami wspólnymi L1 to **15 mesh / 194 tri ≤ 17 / 207**. v2: wielka chata (`indlu enkulu`) Cyl8 (rt 0,07, rb 0,10, h 0,07) + Cone8 (r 0,075, h 0,05) + drzwi + isibaya z **10 pali** r 0,13 + 2 krowy (2 × 2 boxy) (17 mesh / 228 tri). v3 ikhanda: domy fazy dużej tworzą drugą obręcz (r 0,30) + osobne ogrodzenie królewskie (`isigodlo`) za chatą wodza (**5 pali**) (22 mesh / 288 tri). Bez ulic (układ kolisty). Chata: Cyl6 (rt 0,04, rb 0,06, h 0,05) + Cone6 (r 0,045, h 0,035) + drzwi (≈ 40 tri). Rekwizyty: spichrz na palach (2 boxy + Cone6), ognisko (Cone4 + box). Kolor gracza wyłącznie w proporcu.
- **Paleta (propozycja):** trawa sucha 0xc2a35e, trawa ciemna 0x9e8446, pal 0x6b5034, ziemia placu 0xa98a5e, bydło 0x5a3f2a / 0xe8dcc8, czerń 0x14100b.
- **Mur kamienny:** kamienny cokół z suchego muru (10 niskich bloków) + 14 pali na koronie + brama z dwóch grubszych pali i belki (27 mesh / 324 tri ≤ 368). Uwaga: kamienny mur jest umowny dla tej kultury `[zewn.]` → `D-NM-13`.
- **K2 specyficzne:** zero kątów prostych w zabudowie mieszkalnej; środkowa zagroda pusta i czytelna na d = 11.

### 3.3 Żelazo — 10 nakładek (wariant B)

**Zasada nakładki (wymóg):** szkielet = zestaw Brązu tego samego kręgu (pozycje, progi faz, plac, ulice). Nakładka: (a) budynek centralny v2 i v3 zastąpiony wersją Żelaza; (b) co najmniej 1/3 domów w fazach 2–3 w wariancie „Żelazo” (wyższe/piętrowe albo inny dach); (c) mur kamienny Żelaza (te same osie, ≤ 368 tri); (d) v1 (L1–3) może zostać z Brązu. **Liczba domów Żelaza (r2):** `⌈(domy + piętrowe)/3⌉` na każdym poziomie L4–L10. Budżet = §2.6 (te same limity; ewentualny wyższy margines → `D-NM-10`). Dla Z-GR/Z-RZ, czyli nakładek na zestawy webu, limit poziomu = `max(budżet §2.6, pomiar zestawu bazowego)`, bo Rzym Brązu sam przekracza średnią+10% na L3 (522 > 517) i L4 (622 > 596, 49 > 48 mesh — `wyniki/measure.txt`). Z-GR i Z-RZ mieszczą się mimo to w §2.6 na każdym poziomie (§3.5). K2 dodatkowe: **na d = 11 Żelazo odróżnialne od Brązu tego samego kręgu** (zestawienie obok siebie, L7 i L10).

| ID | Państwa | Referencja `[zewn.]` | Wymiana v2 / v3 (bryły) | Domy Żelaza | Mur Żelaza | Punkt rozpoznawczy Żelaza |
|---|---|---|---|---|---|---|
| **Z-GR** | Grecy | polis klasyczna: dorycki prostyl, teatr, agora | v2 (zastępuje `megaron(1.12,4)` 15 mesh / 212 tri): świątynia z kolumnadą 4+4 (8 × Cyl5 0,016 × 0,10) na 3-stopniowej krepidomie + cella + drzwi + pryzma dachu = 14 / 232; v3 (zastępuje `swiatyniaMykenska(1.15)` 14 / 200): **heksastyl prostyl** (6 kolumn frontu, bez bocznych; r2) + krepidoma 3 + cella + drzwi + pryzma terakota + teatr **3 rzędy × 2 segmenty** (6 boxów, r 0,10–0,16) w kwadrancie SW = 18 / 264 | domy z dachem dwuspadowym terakota zamiast płaskiego (3 / 36 = `domGrecki` 3 / 36) | mur z kwadratowymi wieżami co 45° | kolumnada frontu + wachlarz teatru |
| **Z-RZ** | Rzymianie | republika: forum z bazyliką, insule, akwedukt | v2: świątynia na podium (Rzym s 1,22; ten sam `swiatynkaEtruska` 15 / 196) + forum (płyta box 0,22 × 0,008 × 0,16 jasna) + bazylika box 0,18 × 0,09 × 0,10 z dachem-pryzmą; **2 capanny fazy średniej (7 / 96 każda) zastąpione insulami** (3 / 36); v3: + segment akweduktu przez kwadrant N: 4 filary box 0,02 × 0,14 × 0,03 + koryto box 0,26 × 0,02 × 0,03; 2 z capann fazy dużej → insule | insule 2–3 kondygnacje (box 0,14 × 0,18 × 0,12 tuf + drzwi + dach-pryzma terakota = 3 / 36) | mur kamienny z prostokątnymi wieżami i bramą łukową (2 filary + belka) | łuki akweduktu; **żadnej areny** (rozróżnienie od `koloseum`) |
| **Z-ME** | Sumerowie, Babilonia, Asyria | Neo-Asyria/Neo-Babilonia: pałac na platformie, brama z glazurowanej cegły | v2: pałac na platformie (box 0,30 × 0,05 × 0,24 + korpus 0,22 × 0,10 × 0,16 + drzwi) z 2 lamassu (box 0,03 × 0,05 × 0,06) przy bramie (5 / 60); v3 (r2, zarzut E3 — **bez zigguratu**): pałac × 1,15 + brama miejska z 2 wież z glazurowanym licem (2 box korpus + 2 box lico akcent 0x2f5fa8 + belka) przy +x (10 / 120) | domy piętrowe | mur podwójny (2 pierścienie po 12 bloków o 0,03 różnicy) + niebieska brama (2 box) | niebieska glazurowana brama; nie kopiować `ziggurat` (4 stopnie), `dur_sharrukin` (kwadrat 0,46 z 4 wieżami) ani `wiszace_ogrody` |
| **Z-EG** | Egipt | Okres Późny: rozbudowane świątynie, aleje sfinksów | v2: pylon × 1,2 + dziedziniec kolumnowy (6 × Cyl5); v3: + aleja sfinksów: 2 rzędy × 2 sfinksy (box 0,04 × 0,025 × 0,02 + głowa box 0,015) od bramy do pylonu (21 / 316) | domy piętrowe | mur z cegły (16 bloków) z 4 wieżami narożnymi + belka + 2 mini-pylony bramy | aleja sfinksów na osi bramy |
| **Z-IN** | Harappa | **anachronizm** `[zewn.]` (kultura Indusu zanikła przed Żelazem); gra ma Garnizon Harappy w Żelazie (P4.4 §2.1b #59) — propozycja umowna: ufortyfikowana cytadela | v2: cytadela z 4 narożnymi wieżami (box 0,05 × 0,12 × 0,05) + łaźnia (10 / 120); v3: + duży spichlerz (5 boxów) + cokół + druga platforma (17 / 204) | domy piętrowe | podwójny mur ceglany (2 × 10 bloków) z 6 bastionami | wieże narożne cytadeli (`D-NM-3`) |
| **Z-AL** | Hetyci, Fenicjanie | Neo-Hetyci/Fenicja: świątynia z dwoma wolnostojącymi filarami, ortostaty | v2: świątynia (sala + drzwi + 4 murki dziedzińca) z 2 wolnostojącymi filarami (Cyl6 0,02 × 0,14 + głowice box) przed wejściem (10 / 144); v3: + pałac z ortostatami (korpus + pas box jasny 0,20 × 0,03 × 0,01 przy cokole + drzwi) (13 / 180) | domy piętrowe z belkami | 13 bloków + 6 wież Cyl6 wtopionych do połowy | dwa wolnostojące filary przed świątynią |
| **Z-EP** | Celtowie, Germanie, **Słowianie** (domyślnie, `D-NM-4`) | oppidum (murus gallicus), hala | v2: hala × 1,15 z gontem (ciemniejszy dach) + kuźnia (box + Cone4 komin + Cone4 ogień) (10 / 112); v3: + drewniana wieża strażnicza (korpus box + platforma box + dach Cone4; r2: zamiast 4 słupów) (13 / 144) | domy zrębowe prostokątne (box + 1 pas „belki” + 2 połacie + drzwi = 5 / 60) | murus gallicus: kamienne lico (12) z wystającymi belkami (12 krótkich boxów) + brama-wieża | wieża strażnicza + kuźnia |
| **Z-SL** (r2, wariant `D-NM-4` = gród) | Słowianie | gród słowiański: wał drewniano-ziemny, majdan, kącina (świątynia), półziemianki `[zewn.]` | v2: kącina (korpus + 2 połacie + drzwi) + kuźnia (7 / 76); v3: + wewnętrzny wał grodu (6 boxów łukiem wokół majdanu) + brama-wieża (box + Cone4) (15 / 168). **Nie** stawiać posągu-idola (to cud `posag_peruna`, `wonders.json:517`) | półziemianki: niski box + 2 połacie do ziemi (3 / 36) | wał drewniano-ziemny: 16 bloków + 8 boxów częstokołu + brama-wieża (26 / 308) | wał pierścieniowy grodu wewnątrz miasta + półziemianki |
| **Z-AZ** | Chińczycy | Zhou/Han: bramy `que`, hale z podwójnym okapem, dachówka | v2: hala z podwójnym okapem (2 × Cyl4) + dziedziniec × 1,12 (= B-AZ v3, 17 / 240); v3: + para wież `que` przy bramie (box 0,05 × 0,16 × 0,05 + dach Cyl4) (21 / 296) | domy z szarą dachówką (dach 0x5e5a56) | mur z ubitej ziemi z wieżami bramnymi | para wież `que` na osi bramy; nie kopiować `palac_weiyang` |
| **Z-AN** | Inkowie | imperium Inków: mur zygzakowaty, złocona świątynia | v2: kancha (4 moduły) + ushnu 4-stopniowe (16 / 208; r2: jedna kancha zamiast dwóch); v3: świątynia z szerszym złotym pasem + ushnu 4 + kancha + mur zygzakowaty wewnętrzny (2 segmenty) + tarasy (25 / 320) | domy piętrowe kamienne | mur zygzakowaty wyższy (+30%) z trapezową bramą | zygzakowaty mur wewnętrzny |
| **Z-AF** | Zulusi | królewski `ikhanda` | v2: większa isibaya (12 pali) + 2 krowy + wielka chata (19 / 252); v3 (r2): isibaya 8 pali + 2 krowy + wielka chata + ogrodzone `isigodlo` (4 pale) z 1 chatą (22 / 300); domy fazy dużej = obręcze chat (r 0,30 i 0,38) | chaty × 1,1 | wyższy cokół (8) + 16 pali + brama (27 / 324) | obręcze chat wokół pustej zagrody + `isigodlo` |

Paleta nakładek = paleta Brązu kręgu + najwyżej 3 nowe kolory (wymienione w tabeli), żeby Żelazo pozostało rozpoznawalne jako ta sama kultura.

### 3.4 Pięć cudów parkowanych — karty

**Wspólne (wymóg):** API i konwencje jak `buildWonderModel` (`wonderModels.ts:427`): `box/cyl/cone` z `y` od podstawy, `R = HEX_R`, skala świata 1,15, wariant ruiny przez `grey()`, sztandar `ownerBanner` (+2 mesh / +24 tri — nie wlicza się do budżetu, tak jak w pomiarze 19 cudów). Budżet: **≤ 320 tri, ≤ 25 mesh** (§2.6). **Gabaryt (r2, zarzut E9 — definicja):** `maxR_wewn_wierzch` = maks. po wierzchołkach √(x² + z²) we współrzędnych cudu przed `WONDER_SCALE` (jednostki R) **≤ 0,50**. Wśród istniejących cudów mieści się w tym 18/19 (wyjątek `osada_aschaffenburg` 0,549 — `wyniki/measure.txt`). Wysokość świat ≤ 0,78 (= najwyższy istniejący, `wielka_stela`). Pozycje brył każdej karty są zapisane w `skrypty/budzet_kart.py` (`cards`) i stamtąd pochodzi rachunek tri/mesh/promienia. Paleta: wyłącznie istniejące `mats` cudów (`wonderModels.ts:430-451`, 20 kolorów) + najwyżej 2 nowe na cud. **Styl epoki 4+:** sylwetka zgodna z realnym obiektem `[zewn.]`, wykonana środkami kanonu §2 (prostota jak `stupa_sanchi`/`ziggurat`, nie jak `koloseum`) → `D-NM-6`.

| id | Kompozycja (propozycja; wymiary × R) | Liczba brył → tri (policzone regułami §2.1) | Paleta | Kryteria akceptacji (d = 5,5 i 11) |
|---|---|---|---|---|
| `nalanda` | 3 bloki vihara box 0,15 × 0,10 × 0,15 w rzędzie wzdłuż z (x = −0,10) z ciemnym dziedzińcem box 0,07 × 0,012 × 0,07 na każdym; świątynia schodkowa (x = +0,14): 3 boxy 0,16/0,12/0,08 × 0,08 + 4 wieżyczki narożne box 0,03 × 0,06 × 0,03 na 1. stopniu | 3 + 3 + 3 + 4 = 13 box → **156 tri / 13 mesh**; promień 0,293 | brick, dark, clay (istniejące) | rząd 3 kwadratowych bloków z ciemnymi środkami + wyraźnie wyższa schodkowa wieża |
| `angkor_wat` | taras 3 stopnie box 0,44 / 0,34 / 0,24 × 0,05; 5 wież: Cyl6 (rt 0,025, rb 0,04, h 0,10) + Cone6 (r 0,03, h 0,06) — narożne na 2. stopniu, środkowa wyższa (h 0,14) na 3.; fosa: 4 boxy wody (2 × 0,52 × 0,01 × 0,04 w z = ±0,25; 2 × 0,04 × 0,01 × 0,44 w x = ±0,25); grobla box 0,10 × 0,012 × 0,06 w x = 0,30 | 3 box + 5 × (Cyl6 + Cone6) + 4 box + 1 box = 36 + 180 + 48 + 12 = **276 tri / 18 mesh**; promień 0,375 | stone, dark, water (+ szarozielony 0x7d8a6a nowy) | 5 wież w kwinkunksie, środkowa najwyższa; woda wokół |
| `wielki_dzwon` | cokół box 0,30 × 0,04 × 0,30; 4 czerwone kolumny Cyl5 (0,015 × 0,20) w narożnikach kwadratu 0,20; dach czterospadowy Cyl4 (rt 0,05, rb 0,20, h 0,08, obrót 45°) + szczyt Cone4 złoty; belka box 0,22 × 0,02 × 0,02; dzwon Cyl8 (rt 0,035, rb 0,055, h 0,09) brąz + korona box 0,02 | 1 box + 4 × Cyl5 (20) + Cyl4 (16) + Cone4 (8) + box + Cyl8 (32) + box = 12 + 80 + 16 + 8 + 12 + 32 + 12 = **172 tri / 10 mesh**; promień 0,212 | red, roof, gold, bronze, stone | dzwon w kolorze brązu wyraźnie widoczny pod dachem z boku (yaw 0, elewacja 52°) |
| `mauzoleum_teodoryka` | dolna kondygnacja Cyl10 (r 0,20, h 0,12); górna Cyl10 (r 0,15, h 0,08); kopuła płaska Cyl10 (rt 0,10, rb 0,17, h 0,04); 4 „ucha” box 0,03 × 0,025 × 0,02 na obwodzie kopuły; schody 2 boxy 0,08 × 0,02 × 0,06 od +x | 3 × Cyl10 (40) + 4 box + 2 box = 120 + 48 + 24 = **192 tri / 9 mesh**; promień 0,282 | stone, white, dark | niski gruby wielokąt z płaską kopułą — jedyna rotunda wśród cudów; wymagany teren `plytkie_morze` (brzeg) bez wpływu na model |
| `kopiec_grobowy` — **wariant 1** wg `nazwaAlt` Monks Mound (`D-NM-7`) | kopiec: Cyl4 (rt 0,27, rb **0,40**, h 0,12, obrót 45°; r2: rb z 0,44, bok kwadratu 0,57) + 2. taras Cyl4 (rt 0,14, rb 0,21, h 0,08, obrót 45°) przesunięty o −0,06 w x; rampa box 0,18 × 0,02 × 0,08 w x = 0,32 pochylona ku +x; budynek na szczycie (x = −0,06): box 0,10 × 0,06 × 0,08 + pryzma dachu Cyl3 (r 0,06, dł. 0,11) | Cyl4 (16) × 2 + box + box + Cyl3 (12) = 32 + 12 + 12 + 12 = **68 tri / 5 mesh**; promień 0,412 | earth, leaf (darń), wood, thatch | trawiasty ścięty kopiec z rampą i chatą na szczycie; nie mylić z `mundo_perdido` (kamienne stopnie, złota świątynia) |
| `kopiec_grobowy` — **wariant 2** kurhan celtycki (r2, zarzut E11; `D-NM-7`) `[zewn.]`: okrągły kopiec ziemny nad grobem książęcym (typ Hochdorf/Glauberg), krąg kamieni u podstawy, stela z wojownikiem | kopiec Cyl8 (rt 0,18, rb 0,34, h 0,10) + czapa Cyl8 (rt 0,06, rb 0,18, h 0,06); krąg 8 kamieni box 0,04 × 0,03 × 0,04 na r 0,37; stela box 0,025 × 0,12 × 0,012 w x = 0,36 (od strony +x); drzewo-strażnik: pień Cyl5 0,012 × 0,06 + Cone5 (r 0,05, h 0,10) w (−0,30; 0,22) | 2 × Cyl8 (32) + 8 box + box + Cyl5 (20) + Cone5 (10) = 64 + 96 + 12 + 20 + 10 = **202 tri / 13 mesh**; promień 0,420 | earth, leaf (darń), stone, wood | niski okrągły zielony kopiec z kręgiem kamieni i stelą od frontu; nie mylić z `roquepertuse` (sanktuarium z portykiem) ani z kopcem Monks Mound (ten jest okrągły, bez tarasu i budynku) |

Średnia 5 kart (wariant 1 kopca): (156 + 276 + 172 + 192 + 68) / 5 = **172,8 tri**, maks. 276 ≤ 320; mesh maks. 18 ≤ 25. Z wariantem 2 kopca: 202 tri / 13 mesh. Wszystkie karty mają promień ≤ 0,420 ≤ 0,50 (`wyniki/budzet_kart.txt`, sekcja `CUDA PARKOWANE`).

**Kryteria i metoda oceny cudów (r2, zarzut E10; wymóg dla NM-09):**
- **K1 (CPU, automatyczne, test paczki):** mesh ≤ 25, tri ≤ 320 bez sztandaru, `maxR_wewn_wierzch` ≤ 0,50, wysokość świat ≤ 0,78, 2 budowy = identyczne drzewo, prymitywy tylko z §2.1. Do tego: wariant ruiny `grey()` ma ten sam układ brył co normalny (ten sam mesh/tri), a `ownerBanner` dodaje dokładnie +2 mesh / +24 tri.
- **K2 (wizualne, właściciel):** z kamery gry (52°, yaw 0, fov 50°) na d = 11 cud jest rozpoznawalny po cechach z kolumny „Kryteria akceptacji” i odróżnialny od każdego z 19 istniejących cudów oraz od centrum miasta L7 tej samej kultury. Na d = 5,5 widoczne są wszystkie wymienione elementy. Wariant ruiny jest czytelny jako ten sam obiekt.
- **K3 (wizualne):** spójność z kanonem cudów (`wonderModels.ts`) — ta sama „klockowość” i tonacja na wspólnym zrzucie.
- **Siatka zrzutów na cud** (harness RR-T11, jak §3.0: `pixelRatio = 1`, neutralny heks, kolor gracza `0xffd54a`): {normalny, ruina} × {bez sztandaru, ze sztandarem} × d ∈ {8/3, 5,5, 11} = **12 zrzutów**. Do tego 2 plansze: (a) 5 nowych + 19 istniejących cudów na d = 11 bez podpisów (test „który to?”), (b) każdy nowy cud obok centrum miasta L7 swojej kultury (zestaw z §3.2/3.3).
- **Kto ocenia:** K1 — Evaluator i Final Control na wyniku testu (`EXIT`). K2/K3 — właściciel, werdykt PASS / FAIL z listą poprawek per cud (`D-NM-9`). Paczka bez zrzutów kończy się `BLOCK` (R3).

### 3.5 Budżet kart — rachunek (r2, zarzut E2)

Komenda: `python3 -I dyspozycje/autobot/runs/R-RUSTPORT-P4-7-NEW-MODELS-SPEC-Q1/skrypty/budzet_kart.py` → `EXIT=0`, `wyniki/budzet_kart.txt`. Rachunek = kompozycja karty × harmonogram §3.0 × reguły trójkątów §2.1 (1 bryła = 1 mesh). Elementy wspólne: plac Circle6 + ścieżka + maszt Cyl5 + proporzec = 4 mesh / 50 tri. Wartości mesh/tri:

| Zestaw | L1 | L3 | L4 | L6 | L7 | L10 | Mur |
|---|---|---|---|---|---|---|---|
| **budżet §2.6** | **17 / 207** | **42 / 517** | **48 / 596** | **66 / 834** | **71 / 886** | **86 / 1087** | **— / 368** |
| B-ME | 7 / 86 | 17 / 214 | 23 / 290 | 34 / 446 | 46 / 590 | 60 / 766 | 22 / 264 |
| B-EG | 8 / 106 | 19 / 258 | 25 / 338 | 35 / 458 | 54 / 710 | 69 / 910 | 21 / 260 |
| B-IN | 8 / 110 | 16 / 218 | 22 / 278 | 31 / 406 | 43 / 550 | 55 / 702 | 26 / 312 |
| B-AL | 8 / 98 | 20 / 254 | 28 / 350 | 41 / 510 | 63 / 774 | 78 / 962 | 24 / 288 |
| B-EP | 7 / 110 | 20 / 266 | 28 / 338 | 40 / 482 | 61 / 746 | 80 / 974 | 26 / 308 |
| B-AZ | 10 / 142 | 20 / 286 | 33 / 458 | 44 / 610 | 55 / 758 | 67 / 934 | 26 / 316 |
| B-AN | 10 / 130 | 20 / 266 | 32 / 422 | 43 / 570 | 60 / 798 | 74 / 986 | 20 / 244 |
| B-AF | 15 / 194 | 26 / 346 | 35 / 478 | 46 / 642 | 60 / 858 | 74 / 1070 | 27 / 324 |
| Z-GR (na zmierzonej Grecji) | = Grecja | = Grecja | 36 / 494 | 54 / 730 | 61 / 810 | 75 / 986 | ≤ 368 |
| Z-RZ (na zmierzonym Rzymie) | = Rzym | = Rzym | 44 / 538 | 56 / 694 | 66 / 814 | 80 / 994 | ≤ 368 |
| Z-ME | = B-ME | = B-ME | 23 / 286 | 35 / 454 | 51 / 646 | 66 / 834 | 26 / 312 |
| Z-EG | = B-EG | = B-EG | 32 / 470 | 43 / 602 | 62 / 830 | 78 / 1042 | 23 / 284 |
| Z-IN | = B-IN | = B-IN | 26 / 326 | 36 / 466 | 51 / 646 | 64 / 810 | 26 / 312 |
| Z-AL | = B-AL | = B-AL | 31 / 410 | 45 / 582 | 61 / 774 | 77 / 974 | 19 / 300 |
| Z-EP | = B-EP | = B-EP | 32 / 378 | 45 / 534 | 62 / 734 | 82 / 974 | 26 / 308 |
| Z-SL (wariant `D-NM-4`) | = B-EP | = B-EP | 27 / 318 | 38 / 450 | 58 / 686 | 76 / 902 | 26 / 308 |
| Z-AZ | = B-AZ | = B-AZ | 34 / 474 | 45 / 626 | 59 / 814 | 71 / 990 | 28 / 340 |
| Z-AN | = B-AN | = B-AN | 34 / 446 | 46 / 606 | 66 / 870 | 81 / 1070 | 20 / 244 |
| Z-AF | = B-AF | = B-AF | 37 / 502 | 48 / 666 | 60 / 870 | 74 / 1082 | 27 / 324 |

Pełne L1–L10 i monotoniczność: `wyniki/budzet_kart.txt`. Najciaśniejsze miejsca: B-AF L10 1070 / 1087 i Z-AF L10 1082 / 1087 (zapas < 2%), Z-EP L10 82 / 86 mesh. Paczka, która dokłada bryłę do karty, musi ponownie przejść ten rachunek. Rachunek jest CPU-owy i niezależny od wyglądu.

---

## 4. Modele istniejące „nieużywane” i reguła modelu jednostki (zadanie 4)

### 4.1 Porty modeli nieużywanych (D-MOD-3 = B)

Status „bez rekordu” = żadna z 75 pozycji `units.json` nie prowadzi do funkcji na ścieżce PL ani EN (P4.4 §2.1 `route.py` → `UNUSED`, `UNUSED_BY_PL_AND_EN`). „Martwy” = brak wywołania w `gra/src`.

| # | Funkcja | Plik źródłowy (geometria) | Status (dowód) | Opis z kodu | Paczka P4.4 (przydział i podstawa) |
|---:|---|---|---|---|---|
| 1 | `buildCeltWarrior` | `units.ts:2724` | bez rekordu; reguły nazw `units.ts:1496,1547` nie łapią żadnego rekordu | „long iron sword, tall oval Celtic shield … bronze torc” (`:2718-2723`) | **MOD-04** (reszta `units.ts`; alternatywa wg epoki kultury: MOD-07 → `D-NM-18`) |
| 2 | `buildCrossbowman` | `units.ts:2595` | bez rekordu; reguła `units.ts:1586` (`kusznik`/`crossbowman`) | „Chinese-flavoured crossbowman … lacquer-red lamellar” (`:2587-2594`) | **MOD-04** (alternatywa: MOD-06 → `D-NM-18`; epoka własna `NIE_ZMIERZONO`, brak rekordu) |
| 3 | `buildGermanWarrior` | `units.ts:3037` | bez rekordu; reguły `:1509,1552`; rekord „Wojownik germański” jest Super → `buildGermanSuper` | „framea … fur cloak … simple cap” (`:3031-3036`) | **MOD-04** (alternatywa: MOD-07 → `D-NM-18`) |
| 4 | `buildHierosLochos` | `units.ts:1811` | bez rekordu; reguła `:1686`, rekord Super poza białą listą `SUPER_Z_MODELEM_NAZWANYM` (`units.ts:1068-1069`) → `buildSuperGreece` | „Święty Zastęp … szkarłatny płaszcz … koryncki hełm” (`:1800-1810`) | **MOD-04** (alternatywa: MOD-07 → `D-NM-18`) |
| 5 | `buildLegionRzymski` | `jednostki-p8b-rozni.ts` (eksport; import `units.ts:166`) | bez rekordu; reguła `units.ts:1676` | nagłówek pliku „Legion Rzymski (Rzym, Braz)” (`jednostki-p8b-rozni.ts:10`) | **MOD-06** Brąz (plik Brązu, P4.4 §2.1d) |
| 6 | `buildHastati` (opakowanie) → `hastati-falangita.ts:327` `buildHastati` | `units.ts:2143-2146` deleguje do `hastati-falangita.ts:327` | **martwy**: 0 wywołań; rekord Hastati idzie do `buildHastatiOpus5` (`units.ts:1664-1665`, komentarz „buildHastati poniżej zostaje jako rezerwa”) | „kolczuga … owalny scutum … pilum + gladius” (`units.ts:2136-2141`) | opakowanie `units.ts:2143-2146` → **MOD-04**; geometria `hastati-falangita.ts:327` → **MOD-07** (plik już w MOD-07, P4.4 §4.2 #7) |
| 7 | `buildBerserker` | `units.ts:3098` | **martwy**: rekord idzie do `buildBerserkerZ3` (`units.ts:1508`, komentarz `:1504-1507` „zostaje jako martwy”) | „bare-chested … animal pelt … axe, NO shield” (`:3094-3097`) | **MOD-04** (alternatywa: MOD-07 → `D-NM-18`) |
| 8–11 | `buildWojownikKamien`, `buildOszczepnik`, `buildLucznik`, `buildZwiadowca` | `jednostki-p1-rdzen.ts:255,341,415,514` | **martwe eksporty**: `units.ts:127-131` importuje tylko Procarz/Wlocznik/Miecznik; zastąpione przez `kamien-bazowe-opus5.ts` (P4.4 §2.1) | rdzeń kamienny v1 | **MOD-04** (plik `jednostki-p1-rdzen.ts` już w MOD-04) |

**Przydział (r2, zarzut E5):** w rundzie 1 funkcje z `units.ts` (#1–4, #6 opakowanie, #7) przypisałem do MOD-06/07 według epoki kultury. To była **niezadeklarowana zmiana zakresu P4.4**: P4.4 §4.2 przypisuje do MOD-06 wyłącznie 8 wymienionych funkcji `units.ts`, do MOD-07 — 3, a resztę `units.ts` paczce 4 (`P4-4-MODEL-CATALOG.md`, `P4-4-MODEL-CATALOG.md:570`, akapit „Kontrola pokrycia 100%”: `units.ts (4: rdzeń, 6: 8 modeli Brązu, 7: 3 modele Żelaza)`). Wycofuję to: spec trzyma się P4.4 (MOD-04). Pliki spoza `units.ts` zostają w paczce swojego pliku (#5 → MOD-06, #6 geometria → MOD-07, #8–11 → MOD-04). Przeniesienie wg epoki to osobna decyzja `D-NM-18`.
**Razem 11 geometrii** do portu 1:1 (bez nowej grafiki). **Wymóg osiągalności:** każda z 11 dostaje stały `ModelId` w rejestrze modeli i jest renderowana w galerii/harnessie zrzutów (RR-T11), ale **nie** jest osiągalna z danych gry (brak rekordu; reguła §4.2 nie używa nazw). Kryterium paczki: zrzut 1:1 z webu (P4.4 §5) — referencję webu da się wygenerować tylko wywołując funkcję bezpośrednio (np. narzędzia `gra/tools/*-real-render-test.cjs`, D-MOD-7), bo gra ich nie rysuje. Czy któryś ma wrócić do gry → `D-NM-12`.
**4.1b Modele miast „nieużywane” (r2, zarzut E4).** D-MOD-3 = B w LEDGER brzmi „portować WSZYSTKIE istniejące modele, także nieużywane” (`LEDGER.md:128`), a dispatch wylicza wyłącznie jednostki. Poza §4.1 istnieją nieużywane buildery miast:

| Builder | Plik:linia | Status | Rozstrzygnięcie w spec |
|---|---|---|---|
| `buildBronzeCity(civ, …)` (11 kultur + `aztek`) | `bronzeCity.ts:399` | styl `civ`, nieosiągalny (`settlementModel.ts` gałąź `style !== 'roblox'`) | **poza portem** — D-MOD-1 jest już rozstrzygnięte (tylko `roblox`, `LEDGER.md:128`). Kolizja D-MOD-3 ↔ D-MOD-1: przyjmuję pierwszeństwo D-MOD-1 jako decyzji szczegółowej, ale **nie po cichu** → `D-NM-17`. Wykorzystanie jako wzorca kształtu: §1.6 |
| `buildStoneAgeCity(civ?, …)` | `stoneCity.ts:371-373` | j.w. (styl `civ`) | j.w. → `D-NM-17` |
| `buildRobloxCity`, `buildRobloxRomeCity` | `robloxCity.ts:62,213` | martwe (jedyny importer to martwy `robloxScene.ts:12`, P4.4 D-MOD-2) | D-MOD-2 **nierozstrzygnięte** (`LEDGER.md:128`) — D-MOD-3 = B sugeruje port, D-MOD-2 pyta o wyłączenie → `D-NM-17`. Jeśli port: paczka P4.4 MOD-13 (plik `robloxCity.ts` już tam), bez nowej grafiki |

**Zapasowe gałęzie kategorii** (`buildCategoryModel`, 20 `case`, `units.ts:3700`; m.in. `topor`, `wlocznik` → `newBuildWlocznik`) są już w zakresie MOD-04 (P4.4 §4.2). Po regule §4.2 nie są osiągalne z 75 rekordów; ich rola → `D-NM-14`.

### 4.2 Reguła „jedna jednostka = jeden model” (D-MOD-9 = A)

**Reguła (wymóg dla MOD-04):**
1. **Klucz modelu = identyfikator typu jednostki** = pole `Jednostka` z `units.json` (PL; unikalne 75/75 — `git show edb8fb56:gra/data/units.json` + `len(set(...))` → `75 unikalnych PL`, `75 unikalnych EN`) oraz 2 typy cywilne `osadnik`, `robotnik` (`units/setup.ts:193` `CIVILIAN_TYPE_IDS`).
2. **Statyczna tabela `UnitTypeId → ModelId`** (77 wpisów) wygenerowana raz z dzisiejszej ścieżki PL (P4.4 §2.1b, 73 różne wywołania builderów; 3 rydwany = `decorateChariot` z różnym dekorem, czyli 3 różne `ModelId`). Tabela jest danymi (plik w crate renderera), nie dopasowaniem tekstu w runtime.
3. **Nazwy wyświetlane (PL/EN) nigdy nie biorą udziału w wyborze modelu.** Wszyscy konsumenci — mapa, bitwa, miniatura, podgląd — wołają `model_for(UnitTypeId, owner_color)`. Dzisiejsze wołania z nazwą: mapa `units.ts:6075,6093` (typeId PL), miniatura `unitMiniPreview.ts:90` (PL), bitwa `battleScene.ts:4197,4365,5101,16261` (`stats['Jednostka'] ?? bu.nazwa` — fallback EN).
3a. **Skąd bitwa bierze `UnitTypeId` (r2, zarzut E6).** Źródłem jest **identyfikator typu jednostki na mapie**, a nie nazwa:
   - ścieżka gry: `runtimeToBattleUnit` ustawia `nazwa: u.typeId` (`main.ts:27154`), a `stats` = `unitDefFor(u)` = `lookupUnitDef(u.typeId)`, który wyszukuje rekord równością `u['Jednostka'] === typeId` (`main.ts:26996`). Fallback tworzy rekord z `'Jednostka': typeId` (`:27000`). `RuntimeUnit.typeId` jest więc polską wartością `Jednostka`, a `stats['Jednostka']` na tej ścieżce nigdy nie jest puste. Wyjątek: `militiaDefOverrides` (`main.ts:27020-27021`) — czy te definicje mają `Jednostka`, to `NIE_ZMIERZONO`;
   - bitwa testowa: `testBattle.ts:358` ustawia `nazwa` = „Nazwa EN” (wyświetlanie), ale `stats: row` (`:372`) niesie `row['Jednostka']`, a kategorię liczy z nazwy PL (`:363`).
   - **Wymóg Rust:** `BattleUnit` ma pole `unit_type: UnitTypeId` (newtype, nie `String`). Wypełnia je granica silnik → bitwa z `RuntimeUnit.type_id` albo z `row.jednostka`. Pole wyświetlane `nazwa` (PL/EN) jest osobne i nie ma ścieżki do `model_for`. Przy braku `unit_type` (literał syntetyczny) bitwa dostaje model kategorii i ostrzeżenie w logu (`D-NM-14`). **Nie ma mapy EN → typ**, więc reguła 3 nie jest łamana.
   - **Gdzie to wchodzi:** struktura `BattleUnit` i wywołanie modelu → paczka bitwy RR-T10 / P4.4 MOD-14 (allowlista `rust-port/renderer/src/battle/**`, P4.3 §8); tabela i `model_for` → MOD-04 (`<renderer>/units/core/**`); test akceptacyjny pkt 5 → `rust-port/renderer/tests/unit_model_rule.rs` (w allowliście MOD-04). Konwersja runtime → bitwa (odpowiednik `runtimeToBattleUnit`) leży poza rendererem (powłoka P4.5 / dane P3) — jej ścieżka to `NIE_ZMIERZONO`. Wymóg kontraktu: przekazuje `UnitTypeId`, nigdy nazwy.
4. **Brak wpisu = błąd testu**, nie cichy fallback. W runtime (dane spoza tabeli, np. przyszły rekord) → model kategorii + ostrzeżenie w logu (`D-NM-14`).
5. **Test akceptacyjny (CPU):** dla wszystkich 77 typów `model_for` zwraca ten sam `ModelId` niezależnie od konsumenta; tabela pokrywa 75 rekordów + 2 cywilne; 11 modeli §4.1 nie występuje w tabeli (osiągalne tylko z galerii).

**3 przypadki rozjazdu (P4.4 §2.1c, `route.py` → `EN_DIFF_COUNT 3`) i model docelowy:**

| Jednostka (PL / EN) | Epoka | Dziś: mapa (PL) | Dziś: bitwa przy pustym `stats['Jednostka']` (EN) | **Docelowo wszędzie** |
|---|---|---|---|---|
| Wojownik z toporem / Axe Warrior | Brąz | `buildAxeWarriorInka` (`units.ts:1684`, `jednostki-p2-inka.ts`) | `buildCategoryModel('topor')` (`units.ts:4033`) | `buildAxeWarriorInka` |
| Strażnik bram Harappy / Harappan Gate Guard | Brąz | `buildStraznikHarappy` (`units.ts:1674`, `jednostki-p8b-rozni.ts`) | `buildCategoryModel('wlocznik')` → `newBuildWlocznik` (`jednostki-p1-rdzen.ts`) | `buildStraznikHarappy` |
| Wojownik z żelaznym khopesh / Iron Khopesh Warrior | Żelazo | `buildZelaznyKhopesh` (`units.ts:1750`, `jednostki-z2-srodziemne.ts`) | `buildKhopeshWarrior` (reguła `units.ts:1576`, model **brązowy**; błąd opisany `units.ts:1725-1745`) | `buildZelaznyKhopesh` |

Pozostałe 72 rekordy mają dziś ten sam model na obu ścieżkach — reguła ich nie zmienia. Zmiana zachowania względem webu dotyczy wyłącznie bitwy przy pustym `stats['Jednostka']`. Według 3a ścieżka gry i bitwa testowa zawsze niosą `Jednostka`, więc w praktyce dotyczy to tylko literałów syntetycznych i ewentualnie milicji (`NIE_ZMIERZONO`); zrzuty porównawcze 1:1 bitwy (P4.4 §5) muszą dla tych 3 jednostek porównywać z modelem mapy, nie z wynikiem ścieżki EN.

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
| **Nowa grafika razem** | **23 modele** (18 zestawów miast + 5 cudów) | **550** konfiguracji | ≈ 13 J (B) albo ≈ 11,4 J (B′, §1.6) + 5 cudów |
| Warianty warunkowe (r2) | Z-SL (`D-NM-4`), kurhan zamiast Monks Mound (`D-NM-7`) | +30 / ±0 | +0,5 J / ±0 |

Czas w dniach: `NIE_ZMIERZONO` (brak kalibracji; P4.4 §4.1, P4.3 §8). Pierwsza paczka NM-01 kalibruje J w Rust.

### 5.2 Paczki (temat = paczka)

Model i wysiłek każdej paczki: Opus 5.5 medium (grafika, R-PROC-AUTOBOT §5a). Izolowany worktree. Ścieżki zgodne z modułem `models` szkieletu P4.6 (`rust-port/renderer/src/models/**`, RR-T7) — dokładny podział podkatalogów potwierdzić po integracji P4.6 (`NIE_ZMIERZONO` dziś: P4.6 równolegle).

| # | ID (propozycja) | Zakres | Allowlista Rust (propozycja; r2: z testami) | Zależy od | Ocena wizualna właściciela |
|---:|---|---|---|---|---|
| NM-00 | `R-RUSTPORT-P4-NM-00-CITY-SET-KEY` | **nowa** tabela `(ikonaId, Epoka) → CitySetId` (§1.2 wariant B; `ikonaIdToBronzeCiv` z MOD-01 **zostaje bez zmian** — służy ghostowi 1:1); składowa `visualKey`; rejestr builderów z **18 wpisami od razu**, każdy wskazuje na `sets/<id>/mod.rs::build`. Tworzy 18 zaślepek `sets/<id>/mod.rs`, które delegują do Grecji (stan = web, zero regresji). Podpięcie w punkcie wyboru buildera miasta z MOD-09 | `rust-port/renderer/src/models/cities/set_key.rs`, `rust-port/renderer/src/models/cities/registry.rs`, `rust-port/renderer/src/models/cities/sets/*/mod.rs` (tylko zaślepki), **funkcja wyboru buildera** w `rust-port/renderer/src/models/cities/mod.rs` (jedna funkcja, odpowiednik `cities.ts:229-249`), `rust-port/renderer/tests/city_set_key.rs` (test pełnej tabeli 15 × 3) | P4.6, MOD-01, MOD-09 (szkielet `cities`) | nie (CPU) |
| NM-01 | `R-RUSTPORT-P4-NM-01-BRONZE-ME-EG` | B-ME, B-EG | `rust-port/renderer/src/models/cities/sets/{b_me,b_eg}/**`, `rust-port/renderer/tests/city_set_{b_me,b_eg}.rs` (K1: budżet §3.5, footprint/wysokość wg definicji §3.0, monotoniczność, determinizm) | NM-00, RR-T4, RR-T5, MOD-09 (helpery B/CYL/CONE/PRISM, `buildPalisadaWal`, referencja Grecja/Rzym), **RR-T2** (kamera i światło gry do zrzutów), **RR-T11** (harness zrzutów) | **tak** |
| NM-02 | `R-RUSTPORT-P4-NM-02-BRONZE-IN-AL` | B-IN, B-AL | `…/sets/{b_in,b_al}/**`, `…/tests/city_set_{b_in,b_al}.rs` | NM-00, RR-T2, RR-T11 (+ wnioski z NM-01) | **tak** |
| NM-03 | `R-RUSTPORT-P4-NM-03-BRONZE-EP-AF` | B-EP, B-AF | `…/sets/{b_ep,b_af}/**`, `…/tests/city_set_{b_ep,b_af}.rs` | NM-00, RR-T2, RR-T11 | **tak** |
| NM-04 | `R-RUSTPORT-P4-NM-04-BRONZE-AZ-AN` | B-AZ, B-AN | `…/sets/{b_az,b_an}/**`, `…/tests/city_set_{b_az,b_an}.rs` | NM-00, RR-T2, RR-T11 | **tak** |
| NM-05 | `R-RUSTPORT-P4-NM-05-IRON-GR-RZ` | Z-GR, Z-RZ | `…/sets/{z_gr,z_rz}/**`, `…/tests/city_set_{z_gr,z_rz}.rs` | NM-00, MOD-09 (Grecja/Rzym Brązu 1:1), RR-T2, RR-T11 | **tak** |
| NM-06 | `R-RUSTPORT-P4-NM-06-IRON-ME-EG-IN` | Z-ME, Z-EG, Z-IN | `…/sets/{z_me,z_eg,z_in}/**`, `…/tests/city_set_{z_me,z_eg,z_in}.rs` | NM-01, NM-02, RR-T2, RR-T11 | **tak** |
| NM-07 | `R-RUSTPORT-P4-NM-07-IRON-AL-EP-AF` | Z-AL, Z-EP (lub Z-SL wg `D-NM-4`), Z-AF | `…/sets/{z_al,z_ep,z_af}/**` (+ `z_sl` przy `D-NM-4` = gród), `…/tests/city_set_{z_al,z_ep,z_af}.rs` | NM-02, NM-03, RR-T2, RR-T11 | **tak** |
| NM-08 | `R-RUSTPORT-P4-NM-08-IRON-AZ-AN` | Z-AZ, Z-AN | `…/sets/{z_az,z_an}/**`, `…/tests/city_set_{z_az,z_an}.rs` | NM-04, RR-T2, RR-T11 | **tak** |
| NM-09 | `R-RUSTPORT-P4-NM-09-WONDERS-PARKED` | 5 cudów §3.4 | `rust-port/renderer/src/models/wonders/parked/**`, **dispatch cudów** `rust-port/renderer/src/models/wonders/mod.rs` (wyłącznie 5 nowych gałęzi `match` dla id parkowanych — odpowiednik `case` w `buildWonderModel`, `wonderModels.ts:427-486`), `rust-port/renderer/tests/wonders_parked.rs` (K1 §3.4) | MOD-12 (port 19 cudów: helpery, `mats`, `grey`, `ownerBanner`, dispatch), RR-T4, RR-T5, RR-T2, RR-T11 | **tak** |
| — | (w MOD-04/06/07/13/14) | 11 portów §4.1, reguła §4.2 (tabela + test `rust-port/renderer/tests/unit_model_rule.rs` w MOD-04; pole `unit_type` w bitwie w MOD-14/RR-T10) | allowlisty P4.4 §4.2 paczek 4/6/7/13/14 | wg P4.4 | jak P4.4 §5 (1:1) |

**Wspólne pliki (r2, zarzut E7).** NM-00 tworzy rejestr od razu z 18 wpisami i zaślepkami, więc NM-01..NM-08 **nie edytują** `registry.rs`, `set_key.rs` ani `mod.rs`. Zmieniają tylko własne `sets/<id>/**` (podmiana zaślepki na model) i własny plik testu. Allowlisty NM-01..NM-08 są przez to rozłączne i mogą iść równolegle. Zapis z rundy 1 („rejestr dopisuje orkiestrator przy integracji”) **wycofuję**: każda zmiana pliku przechodzi Operator → Evaluator → Final Control w paczce, której allowlista ten plik obejmuje. NM-09 jest jedyną paczką po MOD-12, która dotyka dispatchu cudów, więc nie ma konfliktu. Dokładne nazwy plików zależą od podziału modułu `models` w P4.6 (`NIE_ZMIERZONO`, §7). Zasada „jedna paczka = jeden właściciel pliku” obowiązuje niezależnie od nazw.

### 5.3 Kolejność

`P4.6 → RR-T4 ∥ RR-T5 → MOD-02 (prymitywy) → MOD-09 (miasta 1:1) → NM-00 → NM-01 (kalibracja J i procesu oceny) → (NM-02 ∥ NM-03 ∥ NM-04) → NM-05 → (NM-06 ∥ NM-07 ∥ NM-08)`; `MOD-12 → NM-09` niezależnie od miast. **Bramka zrzutów (r2, zarzut E8):** NM-01..NM-09 wymagają RR-T2 (kamera, światło i teren gry) i RR-T11 (harness zrzutów). Bez nich K2 jest niewykonalne, a paczka kończy się `BLOCK`. Wg P4.3 §8 kolejność to `… → RR-T5 → RR-T11 → RR-T7 …`, więc RR-T11 jest gotowe przed partiami modeli RR-T7 (w tym MOD-09; `P4-3-RUST-RENDERER-ARCH.md:403,411`) i nie przesuwa harmonogramu. NM-00 (CPU) od nich nie zależy. Równoległość ograniczają przepustowość oceny właściciela (9 sesji ocen) i dostęp do maszyny z GPU, nie allowlisty.

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
| R8 | Zależność od RR-T2/RR-T4/RR-T5/RR-T11 i MOD-09 | blokada startu NM | zależności jawnie w kolumnie „Zależy od” §5.2 (r2); NM-00 może ruszyć zaraz po MOD-09; karty i rachunek §3.5 nie zależą od Rust |

---

## 6. Decyzje właściciela `D-NM-n` (NIE rozstrzygam po cichu)

- **D-NM-1 — Liczba zestawów miast.** A: 6 kręgów Brązu + 8 nakładek Żelaza (≈ 10 J); **B (rekomendacja): 8 + 10 (≈ 13 J)**; C: 1 zestaw na państwo, 12 + 15 (≈ 19,5 J). §1.3.
- **D-NM-2 — Żelazo jako nakładka na Brąz** (ten sam szkielet, wymiana centrum, części domów i muru; rekomendacja) czy pełne niezależne zestawy Żelaza (koszt Żelaza ×2).
- **D-NM-3 — Harappa:** osobny zestaw B-IN (rekomendacja) czy w Mezopotamii; oraz czy akceptujesz umowną „cytadelę Żelaza” Z-IN mimo anachronizmu.
- **D-NM-4 — Słowianie:** wspólna nakładka Z-EP z Celtami i Germanami (rekomendacja) czy własny wariant **Z-SL „gród”** (r2: karta w §3.3, budżet w §3.5; +0,5 J, +30 konfiguracji, w paczce NM-07).
- **D-NM-5 — Epoka Kamienia:** zostaje wspólna dla wszystkich (rekomendacja; decyzja projektowa w `miasto-kamien.ts:73-74`) czy warianty kręgów (+≈ 0,3 J na krąg przy wymianie samego centrum — założenie).
- **D-NM-6 — Styl cudów parkowanych:** sylwetka zgodna z realnym obiektem wykonana środkami kanonu (rekomendacja) czy uproszczenie „pod Antyk”. **Korekta r2 (zarzut E11):** „epoka 4+” to nazwa grupy `parkowane_epoka4plus`, a nie cecha każdego rekordu. `epokaDocelowa` wynosi: `nalanda` 4, `angkor_wat` 5, `wielki_dzwon` 6, `mauzoleum_teodoryka` 4, **`kopiec_grobowy` 1** (odczyt `wonders.json`). Dla kopca „styl epoki docelowej” oznacza więc pradzieje, nie średniowiecze. Wszystkie 5 ma `aktywne: false`, więc w grze dziś ich nie widać — modele będą widoczne w podglądzie i po odblokowaniu.
- **D-NM-7 — „Kopiec grobowy”:** dane są sprzeczne (`nazwa` „Kopiec grobowy”, `nazwaAlt` „Monks Mound (Mississippian)”, `cywilizacje: [celtowie]`, `epokaDocelowa: 1`, opis „historycznie nie Galowie”). Wariant 1: Monks Mound (karta §3.4, 68 tri / 5 mesh). Wariant 2: celtycki kurhan (r2: karta §3.4, 202 tri / 13 mesh). Oba w budżecie; koszt implementacji ten sam (1 karta).
- **D-NM-8 — Angkor Wat przypisany Harappie** („przypisanie państwa do ustalenia” w danych): model khmerski niezależnie od przypisania (rekomendacja) — potwierdź.
- **D-NM-9 — Kto zatwierdza wygląd:** właściciel po każdej paczce NM-01..NM-09 (rekomendacja) czy Evaluator (Opus) wg kart z wyrywkową kontrolą właściciela.
- **D-NM-10 — Margines budżetu:** +10% do średniej istniejących (rekomendacja) czy inny; czy Żelazo dostaje wyższy margines (np. +20%).
- **D-NM-11 — Ghost założenia miasta** (`bronzeCityRoblox.ts`, 11 wariantów, żywy tylko jako podgląd): port 1:1 (P4.4 MOD-09) czy zastąpić podglądem L1 nowego zestawu (spójność wyglądu).
- **D-NM-12 — 11 modeli „nieużywanych”:** tylko rejestr + galeria (rekomendacja) czy przywrócić część do gry (np. Kusznik, Legion Rzymski jako nowe rekordy danych — to zmiana danych, osobny temat).
- **D-NM-13 — Mur kamienny dla kultur bez murów kamiennych** (Zulusi, częściowo Europa Płn.): umowny kamienny cokół + pale (rekomendacja) czy mur = zawsze palisada dla tych kręgów.
- **D-NM-14 — Gałęzie kategorii po regule §4.2:** zostają jako runtime-fallback z ostrzeżeniem dla typów spoza tabeli (rekomendacja) czy usunięte (test wymusza pełne pokrycie).
- **D-NM-15 — Akcent palety per państwo wewnątrz kręgu** (np. purpura Fenicjan w B-AL, proporcja domów Celtowie/Germanie w B-EP): tak (≈ 0,05 J na państwo; rekomendacja) czy jeden wygląd na krąg.
- **D-NM-16 — Wzorce z webu (§1.6, wariant B′):** czy karty §3.2 mają przenosić centrum i typ domu z `bronzeCity.ts`/`bronzeCityRoblox.ts` (≈ 11,4 J zamiast ≈ 13 J — założenie), z wyłączeniem sylwetek kolidujących z cudami (ziggurat, piramida). Rekomendacja: tak, jako obowiązkowa referencja kształtu dla Operatora paczki NM.
- **D-NM-17 — Nieużywane buildery miast vs D-MOD-3 = B (§4.1b):** `buildBronzeCity`/`buildStoneAgeCity` (styl `civ`) są wyłączone przez D-MOD-1, a `buildRobloxCity`/`buildRobloxRomeCity` wiszą na otwartym D-MOD-2. Rekomendacja: D-MOD-1 ma pierwszeństwo (klasyczne poza portem, tylko jako wzorzec §1.6); `robloxCity` — rozstrzygnąć razem z D-MOD-2.
- **D-NM-18 — Przydział 6 funkcji `units.ts` bez rekordu (5 modeli + opakowanie `buildHastati`) (§4.1):** zgodnie z P4.4 do MOD-04 (rekomendacja, bez zmiany zakresu P4.4) czy wg epoki kultury do MOD-06/07 (zmiana zakresu P4.4 — wymaga aktualizacji allowlist tych paczek).
- **D-NM-19 — Limit nakładek na zestawy webu (§3.3):** `max(budżet §2.6, pomiar zestawu bazowego)` (rekomendacja; Rzym Brązu sam przekracza średnią+10% na L3–L4) czy twardo §2.6 (dziś Z-RZ i tak się mieści — §3.5).

---

## 7. `NIE_ZMIERZONO`

1. Koszt nakładki Żelaza (0,5 J) i J w liniach Rust — do kalibracji w NM-01.
2. Czas paczek w dniach.
3. Dokładny podział podkatalogów `rust-port/renderer/src/models/**` (P4.6 równolegle, nieintegrowany na bazie `da03ce40`).
4. Epoka własna `buildCrossbowman` (brak rekordu) — przydział do MOD-06 według kultury.
5. Rzeczywisty wygląd kart §3 (brak renderu; spec nie generuje grafiki) — wszystkie wymiary i palety nowych modeli są propozycją.
6. ~~Footprint per wierzchołek~~ — **zmierzone w r2** (`maxR_swiat_wierzch`, §2.2). Nadal niezmierzone: promień ghosta w świecie po skali nadawanej przez `settlementModel`/`cities.ts` (podaję promień wewnętrzny).
9. Koszt wariantu B′ (0,8 J na zestaw — założenie) i obecność `Jednostka` w definicjach milicji (`main.ts:27020-27021`, §4.2 pkt 3a).
10. Wygląd rachunku §3.5: rachunek liczy bryły z kart, nie gotowy model. Rzeczywisty model może mieć inne liczby, dlatego wynik sprawdza K1 w paczce.
7. Trójkąty `ExtrudeGeometry` (mur ghost `bronzeCityRoblox`) — nieliczone (mock zwraca `null`); nie dotyczą żywych miast mapy ani cudów (`EXTRUDE_HITS=0` w zmierzonych konfiguracjach).
8. Częstość ścieżki EN w bitwie (P4.4 §7 pkt 8) — nadal wymaga uruchomienia gry; nie wpływa na regułę §4.2.

## 8. Odtwarzalność

| Plik | Rola |
|---|---|
| `dyspozycje/autobot/runs/R-RUSTPORT-P4-7-NEW-MODELS-SPEC-Q1/skrypty/run_measure.py` | punkt wejścia: `git show edb8fb56:` → katalog tymczasowy poza repo → `node --experimental-strip-types measure.ts`; zapisuje `wyniki/measure.txt`, `wyniki/loc.txt` |
| `…/skrypty/three-mock.js` | ręczny mock `three` (klasy używane przez 7 plików modeli), reguły trójkątów r169, AABB w świecie |
| `…/skrypty/measure.ts` | konfiguracje: Kamień L1–10 (+mur L3/6/10), Grecja i Rzym L1–10 (+mur, +palisada L3/6/10), 19 cudów + `default` + sztandar, ghost 11 × L1; budżety |
| `…/skrypty/budzet_kart.py` (r2) | rachunek budżetu kart §3.2–3.4 (tri/mesh per poziom, mur, promień cudów); `EXIT=1` przy przekroczeniu |
| `…/wyniki/measure.txt`, `…/wyniki/loc.txt`, `…/wyniki/budzet_kart.txt` | wyniki (node v22.22.0; r2 dopisuje kolumny per wierzchołek, ghost L1–L10 i moduły Grecji/Rzymu — wiersze r1 bez zmian) |

Pozostałe twierdzenia: komendy i `plik:linia` w tekście (odczyt `git show edb8fb56:…`, `git grep … edb8fb56`).

## 9. Mapa zmian rundy 2 (zarzuty Evaluatora r1 → miejsce w dokumencie)

| Zarzut | Decyzja | Gdzie |
|---|---|---|
| E1 wzorce per cywilizacja pominięte | PRZYJĘTY | §1.6 (klasyczny i ghost, pomiar ghost L1–L10), wariant B′ w §1.3, wiersz „Wzorzec w webie” w każdej karcie §3.2, `D-NM-16` |
| E2 karty bez policzonego budżetu | PRZYJĘTY | harmonogram z liczbami §3.0, `budzet_kart.py` → §3.5; B-AF (krowy 2 boxy, 6/10/5 pali), B-AN (lama 3 boxy), Z-GR (heksastyl, teatr 3×2), Z-RZ (capanny → insule) |
| E3 sprzeczność ziggurat ↔ B-ME/Z-ME | PRZYJĘTY | §3.0 reguła operacyjna (liczba stopni), B-ME v2/v3 = 1 stopień, Z-ME v3 bez zigguratu |
| E4 klasyczne buildery vs D-MOD-3 | PRZYJĘTY | §4.1b, `D-NM-17` |
| E5 przydział `units.ts` niezgodny z P4.4 | PRZYJĘTY | §4.1 (MOD-04), `D-NM-18` |
| E6 źródło `UnitTypeId` w bitwie | PRZYJĘTY | §4.2 pkt 3a (dowody `main.ts`, `testBattle.ts`, allowlista MOD-14/RR-T10, test) |
| E7 allowlisty niekompletne | PRZYJĘTY | §5.2 (testy, dispatch cudów, nowa tabela zamiast zmiany `ikonaIdToBronzeCiv`, rejestr z zaślepkami, wycofanie „dopisuje orkiestrator”) |
| E8 brak zależności RR-T2/RR-T11 | PRZYJĘTY | §5.2 kolumna „Zależy od”, §5.3, R8 |
| E9 metryki K1 niezdefiniowane | PRZYJĘTY | §3.0 definicje, §2.2 (pomiar per wierzchołek: Kamień 0,420), §3.4 (`maxR_wewn_wierzch` ≤ 0,50; 18/19 istniejących), kopiec rb 0,40 |
| E10 brak metody oceny cudów | PRZYJĘTY | §3.4 „Kryteria i metoda oceny cudów” |
| E11 D-NM-7/D-NM-4/epoka kopca | PRZYJĘTY | karta kurhanu §3.4, karta Z-SL §3.3/§3.5, korekta `D-NM-6` |
| E12 cytat `miasto-kamien.ts:69-70` | PRZYJĘTY | → `:73-74` (3 miejsca); przy okazji poprawione `bronzeCity.ts:29-30` → `:30-31` i `:33` → `:34` |
