# P4.13 — MOD-04: rdzeń modeli jednostek w Rust (CPU), 1:1 z webem + reguła D-MOD-9 = A

STATUS dokumentu: Operator r1 + obrona r1 (odpowiedzi na zarzuty Evaluatora r1 — §12)
TEMAT: R-RUSTPORT-P4-13-MOD04-UNIT-CORE-Q1 · DOMAIN: GAME · baza kodu: `origin/rust-port/parity-v2` @ `69f432ba` · commit kodu: `1b52238d`
Web źródłowy: `edb8fb56` (wyłącznie `git archive` do katalogu scratch poza repo; bez `npm run build/dev`; zero zmian w `gra/**`).
Wejście: `P4-4-MODEL-CATALOG.md` (§2.1, §4.2 paczka 4, D-MOD-1..9), `P4-7-NEW-MODELS-SPEC.md` (§4.1, §4.2), `P4-3`, `P4-6`, `P4-8` + `src/geom/**`, `P4-11` (wzorzec weryfikacji).

## 0. Streszczenie

- **Nowy moduł** `rust-port/renderer/src/models/unit_core/` (13 plików, ok. 5,7 tys. linii; jedyna zmiana istniejącego pliku: `src/models.rs` += `pub mod unit_core;`).
  Model = drzewo węzłów (odpowiednik `THREE.Group`: `position`/`rotation`/`quaternion`/`scale`, `updateMatrixWorld`) + opis geometrii
  (część katalogu albo prymityw `geom`) + parametry materiału jako dane (kolor, metalness, roughness, transparent, opacity, flatShading)
  + lista `userData['mats']`. Bez GPU.
- **Port 1:1:** 88 `getGeo*` (`units.ts:487-740`), 20 `getGeoNH*` (konia), `buildBaseAvatar` + 15 helperów wyposażenia,
  `buildCategoryModel` (wszystkie **20** etykiet `case`), `decorateChariot` (3 warianty), `applyCultureOverrides` (8 kultur + pomijanie),
  `attachEmbarkBoat`, `kon-nowy-model.ts` (`buildHorse`, `addRiderLegs`, `buildZlozeKonie`), `galera-model.ts` (obie pozy),
  `jednostki-p1-rdzen.ts` (**7/7** eksportów, w tym 4 nieużywane — D-MOD-3 = B) oraz 5 modeli nazwanych z `units.ts` bez rekordu
  `units.json` (P4-7 §4.1 #1–4, #7: Hieros Lochos, Kusznik, Wojownik celtycki, Wojownik germański, martwy Berserker).
- **Routing:** `normName`, `cultureFromName`, `SUPER_Z_MODELEM_NAZWANYM`, `buildNamedUnit` (wszystkie reguły), `buildSuperUnit`, `buildUnitModel`
  przeniesione 1:1 jako `legacy_route` (parytet i generator tabeli). **Naprawa D-MOD-9 = A:** w grze wyłącznie `model_for(UnitTypeId)` —
  statyczna tabela **77 wierszy** (75 rekordów + Osadnik, Robotnik), nazwy PL/EN nie biorą udziału; 3 rozjazdy ścieżki EN znikają (§4).
- **Delegacje do paczek 5–7:** rejestr `Base` (97 builderów); **73** oczekujących zwraca jawny `NotYetPorted` z nazwą funkcji, plikiem i paczką (§7).
- **Weryfikacja bitowa vs uruchomiony web** (three 0.169.0, node v22.22.0, `to_bits()`, zero tolerancji):
  **61 przypadków / 111 368 wartości: 0 rozbieżności** (drzewo, kwaterniony, macierze świata, hashe geometrii, materiały, bbox, sygnatury);
  katalogi części 88 + 20 + 65: 0 rozbieżności; routing **175 wywołań** (75×PL, 75×EN, 2 cywilne, 23 sondy `super`): klasy sygnatur web ≡ klasy `ModelId` Rust;
  nazwy 403 wartości: 0 rozbieżności. 7 przypadków = jawne stuby paczek 5/7 (sprawdzone, że to stub właściwego buildera).
- **Odkrycie numeryczne:** `Math.sin/cos` V8 ≠ `f64::sin/cos` (glibc 2.39) na **792/11 226** próbek (1 ulp) — bez tego 1-ulp różnice
  w kwaternionach i pozycjach jednostek. Przeniesiono fdlibm (`base::ieee754::sin/cos` V8) → **0/11 226** (`jstrig.rs`, test `unit_core_trig`).
- Mutacje: **20/20 wykrytych** (§6; po obronie r1 **22/22**, §12). Bramki: fmt/clippy/clippy+gpu/test — **EXIT=0** (§9). Zero nowych zależności, `Cargo.toml`/`Cargo.lock` bez zmian, `forbid(unsafe_code)` zachowane.

## 1. Zakres, decyzje i ZAŁOŻENIA

| # | Pozycja | Rozstrzygnięcie |
|---|---|---|
| Z1 | Dispatch: „w `models/mod.rs` dopisz linię modułu” | **ZAŁOŻENIE:** w bazie `69f432ba` moduł to plik `src/models.rs` (nie katalog). Linia `pub mod unit_core;` dopisana tam; podmoduł leży w `src/models/unit_core/` (reguła Rust 2018) — równoważne, w allowliście (`models/unit_core/**` + „linia modułu”). `lib.rs` bez zmian (już ma `pub mod models;`). |
| Z2 | Nazwa testu reguły (P4-7 §4.2 pkt 5: `tests/unit_model_rule.rs`) | **ZAŁOŻENIE:** allowlista dispatchu to `tests/unit_core_*.rs` → `tests/unit_core_model_rule.rs`. Wspólny parser JSON: `tests/unit_core_json.rs` (włączany `#[path]`; jako osobny cel testowy ma 0 testów). |
| Z3 | D-MOD-9 = A | `model_for(&UnitTypeId) -> Option<ModelId>`; `model_for_or_category` dla danych spoza tabeli: model kategorii + zwrócone ostrzeżenie `UnknownUnitType` (crate nie ma loggera — wywołujący loguje; D-NM-14). `legacy_route` zostaje tylko do parytetu/generatora tabeli. Pole `unit_type` w bitwie = MOD-14/RR-T10 (poza zakresem). |
| Z4 | `ModelId` | para `(Base, Culture)` w postaci kanonicznej: kultura `Neutral`, gdy nakładka `applyCultureOverrides` nic nie dodaje (kategoria pomijana albo `neutral`/`germanie`), więc „ta sama bryła ⇔ ten sam `ModelId`” (sprawdzone na 175 wywołaniach, §5.3). |
| Z5 | Modele nazwane bez rekordu (P4-7 §4.1) | 5 funkcji z `units.ts` przypisanych do MOD-04 — **przeniesione** (galeria; brak w tabeli). `buildHastati` (geometria `hastati-falangita.ts`, MOD-07) i `buildLegionRzymski` (`jednostki-p8b`, MOD-06) — stuby swoich paczek. |
| Z6 | `perTokenGeos` | nie modelowane (to wyłącznie lista do `dispose()` na GPU). `userData['mats']` = `UnitModel::tracked` (kolejność 1:1, sprawdzana). |
| Z7 | Trygonometria | własny `jstrig` w module (nie zmieniam `geom/**`, `terrain/**`); `geom::Quat::from_euler` zastąpiony w drzewie modelu przez `model::quat_from_euler` (te same formuły co `geom` dla **wszystkich 6** porządków Eulera — obrona r1, §12 zarzut 5 — z `Math.sin/cos` V8; buildery jednostek używają wyłącznie `XYZ`). Geometrie prymitywów nadal z `geom` (std trig) — 173 części i wszystkie siatki przypadków zgodne bitowo (§5). |
| Z8 | Styl | tylko `roblox` (D-MOD-1, P4-4 §6) — modele jednostek nie mają gałęzi stylu. |
| Z9 | Dispatch: „min. po jednej [jednostce z `units.json`] na kategorię” (dopisane w obronie r1, zarzut 1 Evaluatora) | **ZAŁOŻENIE:** kryterium czytam jako „każda kategoria modelu ma porównanie z webem na poziomie, który MOD-04 jest w stanie dostarczyć”. Dosłownie (pełne drzewo rekordu `units.json` w każdej z 17 kategorii) jest **niewykonalne w tej paczce**: z 75 rekordów + 2 cywilnych tylko 6 trafia w builder MOD-04 (`galera`: Galera; `rydwan`: Rydwan mykeński/Shang/celtycki; `osadnik`, `robotnik`) — pozostałe 71 kończy się na builderze paczek 5–7 (`NotYetPorted`, §7), więc w Rust nie ma jeszcze drzewa do porównania. Rozkład (z `UNIT_MODEL_TABLE` × `registry::package()` × `records[].category` fixture): `miecznik` 20 (MOD-05 1, MOD-06 8, MOD-07 11), `wlocznik` 10 (6:7, 7:3), `super` 9 (6:5, 7:4), `lucznik` 6 (5:3, 6:3), `konnica` 5 (6:2, 7:3), `rydwan` 5 z 8 (6:5), `obleznicza` 4 (5:1, 6:2, 7:1), `oszczepnik` 3 (5:3), `maczuga` 2, `topor` 2, `procarz` 2 (MOD-05/06), `falanga` 1, `legionista` 1 (MOD-07), `zwiadowca` 1 (MOD-05). Pokrycie zastępcze w MOD-04: (a) **pełne drzewo** generyka `buildCategoryModel('<kat>')` dla każdej etykiety `case` portowanej tu (§5.2; 7 etykiet = stuby, bo ich `case` deleguje do paczek 5/7); (b) **każdy** z 77 rekordów (PL i EN) bierze udział w teście klas sygnatur `unit_core_model_rule` (175 wywołań, §5.3) — routing rekordu do właściwego `ModelId` jest więc zweryfikowany dla wszystkich kategorii; (c) sygnatury web wszystkich 77 typów leżą w fixture (`records[].sigPl/sigEn`) — paczki 5–7 domkną pełne drzewa per rekord (§7). |

## 2. Architektura modułu (`rust-port/renderer/src/models/unit_core/`)

| Plik | Zawartość | Źródło web (`edb8fb56`) |
|---|---|---|
| `model.rs` | `UnitModel` (arena węzłów, `traverse`, `world_matrices`, `bbox`, `signature`), `Node` (Euler→kwaternion), `Material`, `Prim` (Box/Cylinder/Cone/Sphere/Torus/Icosahedron/HexRing/LeafBlade), `Geo`, `geo_hash`, `quat_from_unit_vectors`, `quat_from_euler`, `retint` | `Object3D`/`Quaternion.setFromUnitVectors`/`setFromEuler` (three r169), `makeLeafBladeGeo` `jednostki-p1-rdzen.ts:580-598`, `appendPointyTopHex` `units.ts:475-508` |
| `consts.rs` | `HEX_R`, `AV_*`, `COLOR_*`, rozmiary pierścieni | `units.ts:251-439`, `hexutil.ts:24` |
| `parts.rs` | `UnitPart` (88), `HorsePart` (20) + dokładne argumenty konstruktorów | `units.ts:487-740`, `kon-nowy-model.ts:63-82` |
| `avatar.rs` | `build_base_avatar`, `add_owner_helm_stripe`, `add_greaves`, `add_pteruges`, `add_hip_sword`, `add_boots`, `add_hands`, `add_belt`, `add_tunic_hem`, `add_torc`, `add_tall_oval_shield`, `add_long_sword_right`, `add_spear_right`, `add_mustache`, `add_long_hair`, `add_super_banner` | `units.ts:763-979, 1145-1279, 4782-4800` |
| `category.rs` | `UnitCategory` (20 etykiet), `build_category_model`, `decorate_chariot`/`build_decorated_chariot`, `apply_culture_overrides`, `attach_embark_boat` | `units.ts:3700-4768, 1389-1488, 5559-5683, 5700-5752` |
| `horse.rs` | `build_horse`, `add_rider_legs`, `build_zloze_konie` | `kon-nowy-model.ts:94-342` |
| `galera.rs` | `build_galera(owner, GaleraPoza)` | `galera-model.ts:63-273` |
| `p1.rs` | 7 eksportów + `p1Seg/p1Span/p1BuildLeg/p1BuildArm/p1BuildCore/...` | `jednostki-p1-rdzen.ts:35-833` |
| `named_unused.rs` | Hieros Lochos, Kusznik, Wojownik celtycki, Wojownik germański, Berserker (stary) | `units.ts:1811, 2595, 2724, 3037, 3098` |
| `routing.rs` | `Culture`, `norm_name`, `culture_from_name`, `super_has_named_model`, `named_rule`, `super_unit`, `category_route`, `legacy_route`, `ModelId`, `build_model`, `UnitTypeId`, `UNIT_MODEL_TABLE`, `model_for`, `model_for_or_category` | `units.ts:994-1126, 1492-1764, 4807-4825` |
| `registry.rs` | `Base` (97 builderów: funkcja web, plik, paczka), `Package`, `NotYetPorted`, `pending()`, `build_base` | P4-4 §2.1b, §4.2 |
| `jstrig.rs` | `js_sin`, `js_cos` (fdlibm `__kernel_sin/cos`, `__ieee754_rem_pio2`) | V8 `base::ieee754` |

Uwagi wierności: kolejność tworzenia materiałów (także `mat(...)` w argumencie konstruktora `Mesh`) i kolejność `add()` odwzorowane dosłownie —
test porównuje listę `mats` i indeks materiału każdej siatki. Podgrupy dodawane po zbudowaniu (`sh` w p1, łódź, `sub` złoża) są tworzone
„odłączone” i doczepiane w tym samym miejscu co w webie. `normName`: NFD zaimplementowane tablicą (497 znaków z bloków Latin-1, Latin
Extended-A/B, Latin Extended Additional; wygenerowane z `unicodedata` 14.0) + usuwanie U+0300–U+036F + `Ł/ł→l` + `to_lowercase`.

## 3. Wyprowadzenie z weba (kluczowe miejsca)

- `buildUnitModel` (`units.ts:1086-1126`): `super` + nazwa → biała lista (`:1068-1069`) → `buildNamedUnit` → inaczej `buildSuperUnit(cultureFromName)`;
  pozostałe: `buildNamedUnit(normName)` → inaczej `buildCategoryModel` + `applyCultureOverrides` (tylko gdy nazwa podana).
- `buildSuperUnit` (`:4807-4825`): `rzym` → Triari jeśli `normName(name)` zawiera `triari`, inaczej SuperRome; `grecja` → SuperGreece; `germanie` → GermanSuper; reszta → `buildCategoryModel('super')` **bez** nakładki kultury.
- `buildNamedUnit` (`:1492-1764`): reguły w kolejności źródła, w tym jawne `return null` dla `legion` bez `hastati` (`:1681`) — przeniesione 1:1 (mutacja M14 wykrywana sondą `Legion z maczugą (Chaska)`).
- `buildCategoryModel` — delegacje: `miecznik/wlocznik/procarz` → `jednostki-p1-rdzen` (MOD-04, przeniesione), `galera` → `galera-model` (MOD-04),
  `lucznik/oszczepnik/zwiadowca/domyslny` → `kamien-bazowe-opus5` (MOD-05), `obleznicza` → `buildBatteringRam` → `kamien-zulu-taran-opus5` (MOD-05), `falanga` → `hastati-falangita` (MOD-07).
- `applyCultureOverrides` (`:5559-5683`): wyjście dla `neutral`, `konnica|rydwan|galera` i `NEW_BESPOKE_CATEGORIES` (`:5573`); emblemat w kolorze domu (`cultureHouseColor` `:1034-1045`) + nakrycie wg kultury.
- `decorateChariot` (`:1389-1488`): podgrupa obrócona o π; wariant celtycki przebarwia materiały **listy `mats`** (brąz→żelazo, lakier→urzet, czerwień→spodnie) i zapisuje `celticRetint` (sprawdzane).
- `attachEmbarkBoat` (`:5700-5752`): skaluje ×0,78 i podnosi +0,10 bezpośrednie dzieci korzenia, dokleja łódź; materiały łodzi trafiają do `mats`.

## 4. Reguła „jedna jednostka = jeden model” (D-MOD-9 = A)

- `UNIT_MODEL_TABLE: [(&str, Base); 77]` — klucz = `Jednostka` z `units.json` (PL) + `Osadnik`, `Robotnik`; 77 różnych builderów.
  Podział: MOD-04 6 (Galera, 3 rydwany `decorateChariot`, 2 cywilne), MOD-05 10, MOD-06 37, MOD-07 24 — zgodnie z P4-4 §4.2 (`rule_table_covers_exactly_the_77_unit_types`).
- Każdy wiersz = `legacy_route(categoryOf(web), PL)` (`table_equals_the_legacy_pl_route_and_names_never_matter`); 11 modeli galerii z P4-7 §4.1 nie występuje w tabeli.
- Rozjazdy ścieżki EN (fallback bitwy `stats['Jednostka'] ?? bu.nazwa`), potwierdzone uruchomieniem weba (sygnatura EN ≠ PL dokładnie dla 3 rekordów) i odtworzone przez `legacy_route`:

| Jednostka (PL / EN) | Web PL | Web EN | `model_for` (docelowo wszędzie) |
|---|---|---|---|
| Wojownik z toporem / Axe Warrior | `buildAxeWarriorInka` | `buildCategoryModel('topor')` (Rust buduje — sygnatura = web EN) | `AxeWarriorInka` |
| Strażnik bram Harappy / Harappan Gate Guard | `buildStraznikHarappy` | `case 'wlocznik'` → p1 `buildWlocznik` (Rust buduje — sygnatura = web EN) | `StraznikHarappy` |
| Wojownik z żelaznym khopesh / Iron Khopesh Warrior | `buildZelaznyKhopesh` | `buildKhopeshWarrior` (brązowy) | `ZelaznyKhopesh` |

- Brak mapy EN → typ: `model_for(UnitTypeId("Axe Warrior"))` = `None` (test). Nieznany typ → model kategorii + `UnknownUnitType`.

## 5. Weryfikacja (wzorzec P4.11)

### 5.1 Metoda
Generator `tests/fixtures/unit_core/gen.ts` (+ `build.mjs`, `gen_trig.mjs`) uruchamia **niezmienione** moduły `edb8fb56`; jedyna adaptacja: esbuild dopisuje
w czasie bundlowania linię `export {…}` do `units.ts`, `kon-nowy-model.ts`, `jednostki-p1-rdzen.ts` (funkcje wewnętrzne; pliki na dysku nietknięte).
Wszystkie liczby zmiennoprzecinkowe zapisane jako **bity binary64** (hex), porównanie `to_bits()`; hashe geometrii i sygnatury: FNV-1a 32 po tych samych bajtach w JS i Rust.
Fixture deterministyczny (dwa przebiegi → ten sam SHA-256).

### 5.2 Przypadki (`unit_core_web_parity.rs`)
68 przypadków: 21 etykiet kategorii (20 `case` + nieznana) + 2 z drugim kolorem właściciela, 4 rekordy paczki (Galera, Rydwan mykeński/Shang/celtycki)
+ celtycki z drugim kolorem, 2 cywilne przez `buildUnitModel`, galera ×2 pozy, p1 ×7, 5 modeli nazwanych, koń ×2 (z uprzężą i bez), złoże koni ×2 (`hexR` 1 i 0,5),
nogi jeźdźca, łódź na 3 modelach, nakładki kultury (9 kultur na `topor` + 7 kombinacji kategoria×kultura, w tym pomijane `konnica`, `miecznik`).
Wynik: **61 porównanych, 111 368 wartości, 0 rozbieżności**; 7 = jawne stuby (`cat:falanga|lucznik|oszczepnik|zwiadowca|obleznicza|domyslny|nieznana-kategoria`), test sprawdza, że stub wskazuje właściwy builder.
**Zakres rekordów `units.json` (ZAŁOŻENIE Z9):** pełnym drzewem porównano tylko rekordy, które w MOD-04 mają builder — 6 wywołań PL (Galera, Rydwan mykeński/Shang/celtycki,
Osadnik, Robotnik) i 6 odpowiadających EN; pozostałe 71 rekordów kończy się na stubach paczek 5–7 i jest tu pokryte generykiem kategorii (pełne drzewo albo jawny stub)
oraz testem klas sygnatur §5.3 (wszystkie 77 typów). Kryterium „min. jedna jednostka z `units.json` na kategorię” w sensie pełnego drzewa przechodzi na paczki 5–7.
Na każdy węzeł: rodzaj, nazwa, rodzic, `position`, `quaternion`, `scale`, `matrixWorld`; na siatkę: liczba wierzchołków/trójkątów, hash geometrii,
materiał (hex, kolor liniowy przez `terrain::color::Color::from_hex`, metalness, roughness, transparent, opacity, flatShading) i indeks w `mats`;
na model: lista `mats`, bbox świata, liczba siatek/trójkątów, sygnatura, `celticRetint`.

Liczby siatek/trójkątów (web = Rust), wybrane: legionista 46/756, osadnik 24/388, maczuga 26/516, topór 26/552, konnica 44/636, rydwan 95/1304,
super 37/580, robotnik 19/228, galera 63/740, rydwan mykeński/Shang 97/1384, rydwan celtycki 101/1612, koń 29/380 (z uprzężą 31/406),
p1: wojownik 26/360, oszczepnik 27/332, łucznik 37/460, zwiadowca 25/320, procarz 27/348, włócznik 28/404, miecznik 28/416.

### 5.3 Routing i nazwy (`unit_core_model_rule.rs`)
175 wywołań `buildUnitModel` w webie (75×PL, 75×EN, 2 cywilne, 23 sondy kategorii `super` — biała lista, Triari/Evocati, germanie, kultura domyślna, pusta nazwa):
dla każdej pary wywołań „ta sama sygnatura web” ⇔ „ten sam `ModelId` Rust” (30 625 par), a dla 19 wywołań kończących się na builderze MOD-04 — równość sygnatury.
`normName`/`cultureFromName`/`buildNamedUnit` (trafienie/brak + sygnatura): **403 wartości web, 0 rozbieżności** (w tym wejścia już zdekomponowane: `Évocati`, `Łąka`).

### 5.4 Katalogi części (`part_catalogues_match_the_web_singletons`)
88 `getGeo*` + 20 `getGeoNH*`: wierzchołki, trójkąty i hash identyczne; 65 kluczy rejestru `p1Geos` — każda geometria web występuje wśród siatek Rust.

### 5.5 Trygonometria (`unit_core_trig.rs`)
11 226 próbek (`k·0,01` i połówki dla k∈[−800,800], wartości graniczne, 6 000 jednostajnych w [−10,10], 2 000 log-jednostajnych do 1e5):
`js_sin/js_cos` **0** rozbieżności, `f64::sin/cos` (glibc 2.39) **792**. Uwaga dla orkiestratora: P4.10/P4.11 zmierzyły 0 rozbieżności sin/cos „na swoich danych”;
tu dane modeli dają rozbieżności — `camera`/`pick`/`terrain`/`geom` używają std trig (poza moją allowlistą) → proponuję osobny temat „przełączenie na `jstrig`” (ryzyko utajone).

**Duplikat portu fdlibm po integracji (Evaluator r1, zarzut 4):** na `origin/rust-port/parity-v2` @ `d925acb3` leży już `src/models/wonders/js_trig.rs` (P4.14,
ten sam zakres: `__kernel_sin/cos` + mała/średnia gałąź `__ieee754_rem_pio2`, fallback na libm powyżej 2¹⁹·π/2 — `git show origin/rust-port/parity-v2:rust-port/renderer/src/models/wonders/js_trig.rs`, linie 1–15).
`wonders/**` jest poza allowlistą tego tematu, więc konsolidacji tu nie robię. **Rekomendacja dla orkiestratora:** osobny temat (roboczo `R-RUSTPORT-P4-JSTRIG-SHARED-Q1`):
jedna implementacja np. w `src/geom/jstrig.rs`, `unit_core::jstrig` i `wonders::js_trig` jako reeksporty, test bitowy na `tests/fixtures/unit_core/trig.json` dla obu ścieżek,
a następnie przełączenie `geom`/`camera`/`pick`/`terrain` (propozycja wyżej).

## 6. Test mutacyjny (`dyspozycje/autobot/runs/R-RUSTPORT-P4-13-MOD04-UNIT-CORE-Q1/mutate.py`, log `logi/mutate.txt`)
**20/20 wykrytych:** stała fdlibm, libm w Euler→kwaternion, przesunięcie pięści p1, kolejność materiałów galery, kolejność reguł taran okuty/taran,
`ink` w `cultureFromName`, lista pomijania bez `miecznik`, skala łodzi, brak przebarwienia kity, wiersz tabeli, zachowanie znaków łączących w `normName`,
długość nogi konia, brak obrotu podgrupy rydwanu, usunięty fall-through `legion`, wpis białej listy `qurubuti`, oko awatara, człon `w` w `setFromUnitVectors`,
grubość klingi liściastej, kolor nakładki sumeryjskiej, lotka kusznika. (Wcześniejsze przebiegi: M06, M11, M14, M15 przeżywały — M15 najpierw jako błąd
kompilacji, M06 nie trafiała w kod po `rustfmt`; dodano do fixture sondy nazw (`Wojownik Inków`, wejścia zdekomponowane, `Legion z maczugą (Chaska)`)
i 23 sondy `super`, poprawiono fragmenty mutacji → 20/20.)
**Obrona r1:** dodano M21 (znak w gałęzi `ZYX` `quat_from_euler`) i M22 (porządek Eulera ignorowany = dawne zachowanie release przy `debug_assert`);
skrypt odróżnia teraz `BUILD-ERROR` (niezerowy kod bez żadnego `FAILED` testu — np. ENOSPC linkera; nieliczony jako wykrycie), sprawdza przywrócenie
pliku bajt w bajt i kończy się kodem 0 tylko przy komplecie wykryć; log kończy się linią `EXIT=`. Wynik — patrz §12.

## 7. Delegacje — rejestr oczekujących (`registry::pending()`, 73)

| Paczka | Buildery (`Base`) |
|---|---|
| MOD-05 Kamień (10) | WojownikOpus5, OszczepnikOpus5, LucznikOpus5, ZwiadowcaOpus5, MaceWarrior, InkaJavelineer, ZuluJavelineer, BatteringRam, EgyptianArcher, SumerianArcher |
| MOD-06 Brąz (38) | 9× `braz-*-opus5`, AxeWarriorInka, InkaSlinger, AkkadianArcher, AssyrianArcher, Sherden, Tyrrhenian, Shekelesh, MycenaeanWarrior, ShangHalberdier, KhopeshWarrior, Impi, SumerianSpearman, SiegeTower, PiechotaHetycka, GwardiaIshtar, WojownikBabilonski, WojownikFenicki, StraznikHarappy, PiechotaInduska, LegionRzymski, GwardzistaChampi + 8 z `units.ts` (ChineseCavalry, HuBenWei, UThulwana, InkaRoyalGuard, EgyptianChariot, Medjay, SumerianChariot, SumerianRoyalGuard) |
| MOD-07 Żelazo (25) | Falangita, HastatiOld, HastatiOpus5, SuperGreece, SuperRome, 4× z1, 5× z2 (z Triari), 5× z3 (z GermanSuper, BerserkerZ3), 3× `zelazo-*`, Gaesatae, Soldurii, Catapult |

Paczki 5–7 podmieniają tylko gałąź `build_base` dla swoich `Base` (rejestr, tabela i routing już gotowe); ich weryfikacja może użyć tych samych sygnatur
z `records` w fixture (sygnatury web wszystkich 77 typów są już zapisane).

## 8. Fixture i skrypty (`rust-port/renderer/tests/fixtures/unit_core/`, 3,0 MB < 8 MB, nic nie pominięto)

| Plik | SHA-256 |
|---|---|
| `unit_core.json` | `6bb8b2a448aae33c1d30b986313ba6bef732ebe8d84de6e443c808fcc6c28e48` |
| `trig.json` | `66c841d910bf18e5964a688e43233d7ac4edf6feb3de3bb8776779236c577df0` |
| `gen.ts` | `bd9aedb363bba88132e4227692d019117ee041677c604ce8aa51c9db918cbf92` |
| `build.mjs` | `19aea5cf8bc92bf97135db7b8bf0b12b66fae902ac782e63fb629aab88b1f24d` |
| `gen_trig.mjs` | `648ad680bfc1de4391904496b84ae52391b9766ff0c3cabc20c40e846898c0aa` |

Odtworzenie: `README.md` w tym katalogu (npm `three@0.169.0` + `esbuild@0.24.0` w scratch, `git archive edb8fb56 gra/src gra/data`, `node build.mjs && node gen.mjs`, `node gen_trig.mjs`).
Wyjście generatora: `unit_core cases=68 records=77 names=33`, `trig samples=11226`. Katalog scratch usunięty po pracy.

## 9. Bramki (na drzewie = commit `1b52238d`; pełne surowe logi: `dyspozycje/autobot/runs/R-RUSTPORT-P4-13-MOD04-UNIT-CORE-Q1/logi/`)

```text
$ cargo fmt --all -- --check; echo "EXIT=$?"
EXIT=0
$ cargo clippy --locked --all-targets --features gpu -- -D warnings; echo "EXIT=$?"
    Checking civ-renderer v0.1.0 (<repo>/rust-port/renderer)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 2.31s
EXIT=0
$ cargo clippy --locked --all-targets -- -D warnings; echo "EXIT=$?"
    Checking civ-renderer v0.1.0 (<repo>/rust-port/renderer)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 1.68s
EXIT=0
$ cargo test --locked --all-targets; echo "EXIT=$?"      (206 linii, logi/test.txt; podsumowanie celów:)
unittests src/lib.rs 0 · assets_nturns 6 · assets_registry 14 · camera_web_parity 5 · cpu_sanity 1 · geom_three_parity 17 · gpu_probe 0
pick_golden 7 · terrain_web_parity 5 · unit_core_json 0 · unit_core_model_rule 7 · unit_core_trig 1 · unit_core_web_parity 3 — wszystkie "ok", 0 failed
EXIT=0
```
Wydruki diagnostyczne (`--nocapture`): `unit_core parity: 68 cases, 61 compared (111368 values bit-exact checked), 7 pending stubs`,
`model rule: 175 calls (152 records PL+EN), 19 ported signatures compared`, `names: 403 web values checked`, `trig: n=11226 port_mismatch=0 libm_mismatch=792`.
`git diff --check` czysty; `Cargo.lock` bez zmian; zmiany wyłącznie w allowliście (§11).
**Obrona r1:** wszystkie logi bramek w `logi/` nadpisane przebiegiem na drzewie obrony (każdy kończy się `EXIT=0`), dodany surowy log
`logi/test-nocapture.txt` (`cargo test --locked --all-targets -- --nocapture`, `EXIT=0`) z powyższymi wydrukami oraz nowym
`quat_from_euler orders: 5 angle triples x 6 orders checked`; `unit_core_trig` ma teraz 2 testy (razem 67 testów, 0 nieudanych).

## 10. NIE_ZMIERZONO i lista „co ocenić wzrokiem po RR-T5”

NIE_ZMIERZONO:
1. **Wygląd 1:1** (wymaga GPU i shaderów RR-T5) — zgodność geometrii/transformacji/parametrów materiału jest bitowa, piksele nie były renderowane.
2. Zgodność `geom` (std trig) z V8 dla argumentów innych niż w tych modelach i na innych platformach (Windows/macOS) — tu 173 części + wszystkie siatki zgodne na Linux/glibc 2.39.
3. `js_sin/js_cos` dla |x| > 2¹⁹·π/2 (ścieżka `__kernel_rem_pio2` nieprzeniesiona; fallback na libm; kąty modeli są < 8 rad).
4. `normName` dla znaków spoza bloków łacińskich z rozkładem kanonicznym (np. greka z akcentami) — dane gry ich nie zawierają.
5. Wydajność budowy (liczba modeli/klatkę) i współdzielenie siatek na GPU (instancjonowanie po `Geo`) — temat RR-T5/RR-T7.

Co ocenić wzrokiem po RR-T5 (zrzut web vs Rust, ta sama kamera gry, kolor `0xd03030`): galera (oko apotropaiczne, żagiel, wiosła ×2 pozy);
rydwan bazowy i 3 warianty (tarcza mykeńska/Shang z boku, celtycka tarcza owalna + kabłąki + przebarwienie na żelazo, orientacja zaprzęgu do kamery);
konnica (obrót 180°, lanca z grotem i proporczykiem na osi); osadnik, robotnik (kilof na ramieniu); legionista, maczuga, topór, super (generyki kategorii);
p1: procarz (sznur procy nad głową), włócznik, miecznik (klinga liściasta, dwustronna), 4 nieużywane; koń (szyja w łuku, nogi w wykroku), złoże koni;
łódź zaokrętowania na figurce pieszej i rydwanie; nakładki kultury (9 kultur); 5 modeli galerii (Hieros Lochos, Kusznik, Wojownik celtycki, germański, Berserker).

## 11. Pliki (allowlista)

- `rust-port/renderer/src/models.rs` (+1 linia `pub mod unit_core;`), `rust-port/renderer/src/models/unit_core/*.rs` (13 plików, nowe)
- `rust-port/renderer/tests/unit_core_{json,model_rule,trig,web_parity}.rs`, `rust-port/renderer/tests/fixtures/unit_core/**`
- `dyspozycje/rust-port/p4/P4-13-MOD04-UNIT-CORE.md` (ten dokument), `dyspozycje/autobot/runs/R-RUSTPORT-P4-13-MOD04-UNIT-CORE-Q1/**` (raport, logi, skrypt mutacji)
- Bez zmian: `gra/**`, `src-tauri/**`, `rust-port/engine/**`, `rust-port/renderer/src/{geom,pick,assets,camera,terrain}/**`, `lib.rs`, `Cargo.toml`, `Cargo.lock`.

## 12. Obrona r1 — odpowiedzi na zarzuty Evaluatora r1 (`02-evaluator-r1.md`, commit `6da7fc13`)

Stan odtworzony z commita Operatora `9c30aff8` (kod `1b52238d`). Zmiany obrony: `src/models/unit_core/model.rs`, `tests/unit_core_trig.rs`,
ten dokument, `mutate.py`, `logi/*`, `03-operator-obrona-r1.md` — wyłącznie allowlista.

| # | Zarzut | Odpowiedź | Dowód |
|---|---|---|---|
| 1 | „Min. jedna jednostka z `units.json` na kategorię” niespełnione dosłownie; brak ZAŁOŻENIA | **PRZYJMUJĘ** | Z9 w §1 (z rozkładem 71 rekordów na paczki 5–7 per kategoria) i akapit w §5.2. |
| 2 | `logi/test.txt` bez `--nocapture` | **PRZYJMUJĘ** | `logi/test-nocapture.txt` (surowy, `EXIT=0`) z liczbami §0/§9: 68/61/111368/7, 175/19, 403, trig 0/792. |
| 3 | `logi/mutate.txt` bez `EXIT=` | **PRZYJMUJĘ** | Log ponownie wygenerowany z `; echo "EXIT=$?"`: `detected 22/22, build errors 0`, `EXIT=0`. Skrypt wzmocniony (§6). |
| 4 | Dwie kopie portu fdlibm po integracji (`unit_core/jstrig.rs`, `wonders/js_trig.rs`) | **ODRZUCAM jako zakres tej rundy, rekomendację PRZYJMUJĘ** | `wonders/**` poza allowlistą tego tematu (dispatch §ALLOWLISTA), a plik P4.14 nie istnieje w bazie `69f432ba`; konsolidacja = osobny temat, opisany w §5.5 (`R-RUSTPORT-P4-JSTRIG-SHARED-Q1`, roboczo). Duplikat nie wpływa na poprawność: oba porty są testowane niezależnie. |
| 5 | `quat_from_euler` sprawdza porządek XYZ tylko w debug | **PRZYJMUJĘ** | `model.rs`: `debug_assert` usunięty, obsługa wszystkich 6 `EulerOrder` (formuły jak `geom::Quat::from_euler`/three r169). Test `quat_from_euler_honours_every_order` (bitowo = `geom` na kątach, gdzie V8 ≡ libm; brak zapadania na `XYZ`). Mutanty M21 (znak `ZYX`) i M22 (porządek ignorowany = dawne zachowanie release) — wykryte. Parytet 61 przypadków bez zmian (buildery używają tylko `XYZ`). |

Uwaga środowiskowa: pierwszy przebieg mutacji w obronie padł na ENOSPC (dysk współdzielony przez równoległe worktree) — linker kończył się błędem,
a stary skrypt liczył to jako „DETECTED”; przebieg odrzucono, plik źródłowy przywrócono z `git`, skrypt poprawiono (`BUILD-ERROR` nieliczony, kontrola przywrócenia), przebieg powtórzono z wolnym miejscem.
