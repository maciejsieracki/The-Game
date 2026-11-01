# P6.8H2 — Dostęp do zasobów, partia B (stolica gracza + etykiety + dostęp miasta)

Status: CZĘŚCIOWO — runda 4/5 (Operator, odpowiedź na zarzuty FC r3 `0b918c971`).
Zakres `resource-access.ts` (16 funkcji) portowany i pinowany wektorami. Kryteria końca NIE są w pełni
spełnione: pozostają NASTĘPNA-PARTIA (Z7, duplikat `clear_city_culture_mix`) oraz rozbieżność Z5 w
`mapgen/params.rs` (poza allowlistą). Zarzut FC r3 pkt 1 (`isForeignReligionDominant`) i pkt 2 (Z1) — zamknięte.

Pin wektorów: `91dc998a` (`tests/p6_8h2_vectors/gen-vectors.sh 91dc998a`).

Historia SHA:
- `598da6429` — runda 1 (stolica + etykiety);
- `93815cafc` — runda 2 (FC FAIL `099296ace`);
- `0b918c971` — runda 3 (kod; FC r3 FAIL);
- `9b158a55a` — runda 4, KOD (zarzuty FC r3 pkt 1–4 i 6–7 odpowiedziane kodem/dowodem);
- gałąź `p6-8h2-dostep-zasobow-b` (lokalnie, bez push) wskazuje commit raportu rundy 4 (`git rev-parse p6-8h2-dostep-zasobow-b`).
  Ten dokument nie podaje SHA własnego commitu (samoodniesienie); SHA kodu jest powyżej.

## Symbole `society-inputs.ts` i `resource-access.ts` — status per symbol

| Symbol web | Symbol Rust | Status | Dowód |
|---|---|---|---|
| `resource-access.ts` — 16 funkcji (`labelForHex`, `hexDepositDisplayLabel`, `hexHiddenDepositHint`, `labelsForImprovementUnlock`, `parseSurowiecOdblokowany`, `improvementUnlockActiveOnHex`, `collectActiveAccess`, `collectDepositPotential`, `getCityResourceAccessForCity`, `getResourceAccessForCity`, `ERA_UI_NAMES`, `sortLabels`, `filterCityPanelRangeLabels`, `CITY_PANEL_RANGE_DEPOSIT_LABELS`, `activeLabelsForImprovementOnHex`, `labelsForKopalniaMiedziOnHex`) | `resource_access/active_access.rs` | PORTED (Z1 zamknięte r4, Z4, Z5 jako rozbieżność jawna) | `p6_8h2_active_access.rs` (11 testów), wektory city/hex/unlock/labelsUnlock/plPairs |
| `computeEmpireLivestockUnlocks` (`livestock-unlock.ts:113`) | `active_access.rs` `compute_empire_livestock_unlocks` | PORTED r4 (Z1 zamknięte) | `city_access_matches_pinned_web_vectors` — 360 przypadków domyślnej ścieżki (`livestock: UNDEF`, mapa z wlascicielami, `ownerId` null/A/B); M33–M36 |
| `isForeignReligionDominant` (`society-inputs.ts:11`) | `resource_access/society_inputs.rs` `is_foreign_religion_dominant` | PORTED r4 (Z6 zamknięte) | `p6_8h2_society_inputs.rs` (5 testów), wektory `religion` (560 przypadków); S01–S11 |
| `dominantReligion` / `leadingReligion` (`culture-religion.ts:673-713`) | `society_inputs.rs` `dominant_religion` | PORTED r4 (pole `share` NIE — Z6a) | jw.; `territory.rs:481-488` przyjmowało ją jako parametr — implementacja dostępna do przekazania |
| `isPlayerCapitalCity`, `stolicaEasyBonusActive` | `capital_labels.rs` | PORTED (partia B, r1) | `p6_8h2_capital_labels.rs` (11), M08–M13 tabel (7/7 KILLED, r3) |
| `clearCityCultureMix` (`society-inputs.ts`) | `state.rs:546` (produkcja, `:581`); duplikat `resource_access.rs:320` | DUPLIKAT → NASTĘPNA-PARTIA (Z7b) | grep niżej |
| `placedImprovementsWithZlotoTradeGrant` (`zloto-access.ts:140`, no-op `@deprecated`) | `resource_access.rs:266` `placed_improvements_with_zloto_trade_grant` | PORTED (no-op) — brak produkcyjnego wywołującego → NASTĘPNA-PARTIA (Z7) | grep niżej |

Podsumowanie: 16/16 funkcji `resource-access.ts` + `computeEmpireLivestockUnlocks` + `isForeignReligionDominant`
+ `dominantReligion` w Rust. Otwarte: Z7 (hak bez wywołującego), Z7b (duplikat), Z5 (źródło w `mapgen`).

### Grep wywołujących (stan `9b158a55a` / pin `91dc998a`)

- Web `placedImprovementsWithZlotoTradeGrant`: definicja `gra/src/game/zloto-access.ts:140`; jedyne wywołanie
  `gra/src/main.ts:4894` (w `placedImprovementsWithTradeGrants`, main.ts:4888). Ten wrapper ma 10 wywołań:
  main.ts:6415, 6448, 7131, 8172, 15136, 24717, 32272, 33401, 34692, 36336 (`grep -c 'placedImprovementsWithTradeGrants(' gra/src/main.ts` = 11 linii, w tym definicja).
  Import: `gra/src/main.ts:602`.
- Rust `placed_improvements_with_zloto_trade_grant`: `grep -rn` w `rust-port/engine/src` = tylko definicja `resource_access.rs:266`;
  użycia w `rust-port/engine/tests/p6_8h_access.rs:284` (test). Produkcyjnego wywołującego brak → NASTĘPNA-PARTIA
  (zgodnie z lekcją nr 3: opis z dowodem, bez wpinania na siłę; wpięcie wymaga portu `placedImprovementsWithTradeGrants`).
- `clearCityCultureMix`: web `gra/src/game/conquest-stability.ts:51` (import z `society-inputs`). Rust produkcja:
  `state.rs:546` (definicja) i `state.rs:581` (wywołanie); reeksport w `terrain::conquest_stability`
  (testy `p6_6a_conquest.rs:11`). Duplikat `resource_access.rs:320` (`clear_city_culture_mix(&mut CultureMixFields)`)
  ma tylko wywołanie testowe `tests/p6_8h_access.rs:425`. Usunięcie duplikatu wymaga przepięcia testu i jest
  NASTĘPNA-PARTIĄ (poza zakresem tej odpowiedzi; `state.rs` w allowliście tylko do odczytu).

## Założenia i rozbieżności (jawne)

- **Z1 — ZAMKNIĘTE (r4).** `computeEmpireLivestockUnlocks` portowane (`active_access.rs`). Domyślna gałąź web
  (`resource-access.ts:307`: `options.empireLivestockUnlocks ?? (placedImprovements ? compute(placed, map, ownerId) : undefined)`)
  w `collect_active_access`. Właściciel heksu: `ResourceAccessOptions::hex_owners` (klucz "q,r"; brak wpisu = web `undefined`),
  `owner_id` = `None` dla web `null`/`undefined`. Wektory: 360 przypadków domyślnej ścieżki.
- **Z4 — `sortLabels` (`localeCompare 'pl'`) — przybliżenie, pinowane.** r4: `pl_collation_cmp` ignoruje znaki ICU
  (U+00AD, U+200B–U+200D, U+2060, U+FEFF); remis pierwszego i drugiego poziomu = `Equal` (web 0), bez tiebreaku
  bajtowego. Pełna tabela ICU nie jest portowana. Weryfikacja: `plPairs` = 51 etykiet, 2601 par z pinu (57 remisów).
  ZAŁOŻENIE: produkcyjne etykiety nie zawierają znaków ignorowanych, więc remis nie zmienia wyniku w grze.
- **Z5 — prototypy JS `constructor` / `__proto__` (zmienione r4).** Web: `ZLOZE_LABEL[z]` /
  `METAL_DEPOSIT_MIN_ERA[z]` dla `z` po `trim().toLowerCase()` ∈ {`constructor`, `__proto__`} zwraca wartość z
  `Object.prototype`. Skutki w webie: `hexDepositDisplayLabel` = null (zgodnie z Rust), `hexHiddenDepositHint` =
  artefakt JS (`function Object() { [native code] } — ukryte …` / `[object Object] — ukryte …`; 270 przypadków w
  wektorach). Rust: `is_js_prototype_key` → `labelForHex` = None i hint = None (świadome odejście od artefaktu).
  Test pinuje: web hint zaczyna się od `function Object()` lub `[object Object]`, display = null, Rust = None (`hex_labels_match_pinned_web_vectors_except_documented_prototype_keys`, asercja liczby 270).
  **Źródło rozbieżności poza allowlistą:** `rust-port/engine/src/domain/mapgen/params.rs:1341` (`zloze_min_era_for`,
  odpowiednik `zlozeMinEraFor`, deposit-era.ts:11) nadal odczytuje tabelę metali bez ochrony prototypu. Nie zmieniane
  w tej rundzie (plik spoza allowlisty). Efekt w `resource_access` zneutralizowany guardem.
- **Z6 — `isForeignReligionDominant` / `dominantReligion` — ZAMKNIĘTE (r4), z Z6a.** `share` (pole
  `DominantReligionResult`) nieportowane: `territory::DominantReligion` go nie niesie, a `isForeignReligionDominant`
  go nie czyta (territory.rs poza allowlistą). Z6b: porządek kluczy `Object.keys().sort()` (UTF-16) = `BTreeMap` (UTF-8),
  różnica tylko dla znaków poza BMP vs U+E000–U+FFFF; brak takich nazw w wektorach. Z6c: `NaN` progu przechodzi
  przez `clamp` jak w web → status `mixed`. Pusta nazwa religii (`""`) = brak dominacji obcej (web `!dom.religion`).
- **Z7 — `placedImprovementsWithZlotoTradeGrant` — NASTĘPNA-PARTIA.** Port no-op (zgodny z web, `@deprecated`), bez
  produkcyjnego wywołującego w Rust; wywołujący web: 10 miejsc przez `placedImprovementsWithTradeGrants` (main.ts).
  Wpięcie wymaga portu wrappera z `main.ts:4888` (poza tym tematem).
- **Z7b — duplikat `clear_city_culture_mix` — NASTĘPNA-PARTIA.** Patrz grep wyżej.
- **Z8 — numer rundy.** Dispatch (sekcja RUNDA 3/5) i zarzuty FC r3 wskazują rundę 4; raporty
  `01-operator-r1.md`, `04-operator-r3.md` nietknięte, raport rundy 4: `04-operator-r4.md`.
- Pin wektorów `91dc998a` przez `git archive gra`; `gra/` nie jest budowane; bundle w `mktemp -d`.
- Szkielet mapgen (`R-RUSTPORT-P6-M00-MAPGEN-SZKIELET-Q1`) nie dotyczy tego tematu (testy w tym tematu bez sparse worktree).

## Wektory z pinu `91dc998a`

Generator: `tests/p6_8h2_vectors/gen_cases.py` (przypadki, deterministyczne) + `entry.ts.in` (bundle esbuild 0.28.2
i three 0.160.0 w `mktemp -d`) przez `gen-vectors.sh 91dc998a`.

| Sekcja | Liczba | Uwagi |
|---|---|---|
| `city` | 8476 | w tym 360 domyślnej ścieżki livestock (r4) |
| `hexLabel` | 1710 | w tym era 0 (era_ui_name(1), r4) |
| `unlock` | 3960 | bez zmian |
| `labelsUnlock` | 22 | bez zmian |
| `plPairs` | 2601 | 51 etykiet, w tym ogonki i remisy ICU (r4) |
| `religion` | 560 | dominantReligion + isForeignReligionDominant (r4) |
| `borderTable` | — | `cityBorderRadius` (P6.16) |

Sumy kontrolne (`md5sum`): `cases.json` = `6d91015f910738759da400c2579b5b5d`, `vectors.json` = `0b64624dab20a5f0f8571ebef8e7738d`.
Regeneracja z pinu odtwarza te pliki (ta sama wersja generatora i pin).

## Mutacje (gałęzie sterujące)

Skrypty (ścieżki względne do korzenia repo): `dyspozycje/autobot/runs/R-RUSTPORT-P6-8H2-DOSTEP-ZASOBOW-B-Q1/mutacje-p6-8h2-b-r4.py`
(`--target active|society`), wyniki append-only w `mutacje-wyniki-r4.txt`. Mutanty M02–M29 z runu r3 są importowane z
`mutacje-p6-8h2-b-active.py` (M01 i M03 zastąpione wersjami r4 z nowymi kotwicami).

### `active_access.rs` — 44 mutanty: 41 KILLED, 3 SURVIVED = RÓWNOWAŻNE

| Id | Gałąź / operator | Wynik | Uwaga |
|---|---|---|---|
| M01 | guard widoczności + prototyp (`label_for_hex`) | KILLED | |
| M02–M07, M09–M16, M17–M20, M23–M29 | (jak w r3) | KILLED | |
| M08 | `labels_for_kopalnia_miedzi_on_hex` `||`→`&&` | SURVIVED = RÓWNOWAŻNY | obie gałęzie dają `["Ruda"]` (r3, dowód w historii) |
| M21 | filtr pustych etykiet | SURVIVED = RÓWNOWAŻNY | `surowiec_label_or_capitalized(k)` nie daje `""` dla niepustego `k` (r3) |
| M22 | filtr pustego klucza | SURVIVED = RÓWNOWAŻNY | `""` nie jest kluczem `terrain-improvements.json` (r3) |
| M03 | guard widoczności hintu + prototyp | KILLED | |
| M30, M31, M32 | prototyp `constructor`/`__proto__` (label, hint, zakres kluczy) | KILLED | Z5 |
| M33 | filtr właściciela `computeEmpireLivestockUnlocks` | KILLED | Z1 |
| M34 | warunek nakładki konia (`stadnina`) | KILLED | Z1 |
| M35 | domyślna gałąź `computeEmpireLivestockUnlocks` | KILLED | Z1 |
| M36 | porównanie właściciela odwrócone | KILLED | Z1 |
| M37–M41 | ł, ć, ę, ń, ź — ogonek → litera bazowa (`pl_primary_key`) | KILLED (5/5) | zarzut FC r3 pkt 3(b) |
| M42 | remis wielkości liter → tiebreak bajtowy | KILLED | zarzut FC r3 pkt 3(c) |
| M43 | pominięcie ignorowanych znaków ICU | KILLED | |
| M44 | `era_ui_name(1)` `Kamień` → None | KILLED | zarzut FC r3 pkt 3(a); wektory era 0 |

Uwaga: mutacje r4 uruchomiono przed uproszczeniem `match cases(a).cmp(&cases(b)) { Equal => Equal, other => other }`
do `cases(a).cmp(&cases(b))` (wymagane przez `clippy::needless_match`); zmiana jest semantycznie identyczna.

### `society_inputs.rs` — 11 mutantów: 7 KILLED, 4 SURVIVED = RÓWNOWAŻNE

| Id | Mutant | Wynik | Uwaga |
|---|---|---|---|
| S01 | `js_clamp` NaN → dolna granica | KILLED | |
| S02 | `js_clamp` `x > hi` → `x >= hi` | SURVIVED = RÓWNOWAŻNY | `hi` zwracane w obu wariantach |
| S03 | remis lidera (`count <= best` → `<`) | KILLED | |
| S04 | `total_adherents` filtr `> 0` → tylko skończone | KILLED | wektor `{"a":-5,"b":3}` |
| S05 | filtr skończoności lidera wyłączony | KILLED | |
| S06 | próg `>` → `>=` | KILLED | N/N±1 |
| S07 | `total > 0` → `>= 0` | KILLED | `{"a":0}` → none |
| S08 | `status != Dominant` → `== Mixed` | SURVIVED = RÓWNOWAŻNY | `dominant_religion` zwraca `religion = None` dla none/mixed, więc gałąź `let Some(religion)` kończy `false` |
| S09 | pusta nazwa religii nie odfiltrowana | KILLED | web `!dom.religion` |
| S10 | `None \| Some("")` → `None` | SURVIVED = RÓWNOWAŻNY | po filtrze nazwa niepusta, więc `religion != ""` = true |
| S11 | `total_adherents` `> 0` → `>= 0` | SURVIVED = RÓWNOWAŻNY | dodanie 0.0 nie zmienia sumy |

### `capital_labels.rs` — tabele i gałąź `if let Some` (r3, bez zmian)

7/7 KILLED (C01–C07), `mutacje-p6-8h2-b-capital.py`, `mutacje-wyniki-r3-capital.txt`. M13 na teście sprzed poprawki:
SURVIVED (surowy log `mutacja-m13-bez-testu-wynik.txt`); z testem: KILLED.

## Bramki (surowe logi w katalogu runu, każdy z jednym `EXIT=`, bez pustej linii przed nim)

- `gate-fmt-r4.txt` — `cargo fmt --all -- --check`: EXIT=0.
- `gate-clippy-r4.txt` — `cargo clippy -p civ-engine --all-targets -- -D warnings`: EXIT=0.
- `gate-test-p6_8h2-r4.txt` — `p6_8h2_active_access` 11/11, `p6_8h2_capital_labels` 11/11, `p6_8h2_society_inputs` 5/5: EXIT=0.
- `gate-test-regression-r4.txt` — `p6_8h2_active_access`, `p6_8h2_capital_labels`, `p6_8h_access` 13/13: EXIT=0.
- `gate-test-full-r4.txt` — `cargo test -p civ-engine`: 1967 passed, 0 failed, EXIT=0 (r3: 1962).
- `gate-diffcheck-r4.txt` — `git diff --cached --check` na zakresie commitu kodu: pusto, EXIT=0.

## Pozostałe kryteria końca — status

- Tabela symboli per status: SPEŁNIONE (ten dokument).
- Wektory z pinu `91dc998a`, generator w repo: SPEŁNIONE (sumy kontrolne wyżej).
- Mutacje na KAŻDEJ gałęzi sterującej lub dowód równoważności plik:linia: SPEŁNIONE dla `active_access.rs`,
  `society_inputs.rs` i tabel `capital_labels.rs` (równoważne: M08/M21/M22, S02/S08/S10/S11).
- Brzegi N-1/N/N+1 dla progów i capów: SPEŁNIONE (`sight_boundary_*`, `potential_sight_boundary_*`,
  `threshold_boundaries_n_minus_1_n_n_plus_1`, `clamp_and_nan_threshold`).
- NaN / brakujące klucze / prototypy: SPEŁNIONE w zakresie wektorów (populacja, kultura, skarb, progi religii, `wlasciciel`
  undefined, klucz spoza mapy, `zloze` undefined/null, `constructor`/`__proto__`, nazwy `""`).
- Komparatory zgodne z V8: `localeCompare` częściowo (Z4, ogonki + remisy ICU); `Object.keys().sort()` (Z6b).
- NIE SPEŁNIONE: Z7 (hak bez wywołującego), Z7b (duplikat), Z5 źródło w `mapgen/params.rs` (poza allowlistą).

## Nieśledzone (poza allowlistą, nie commitowane)

- `rust-port/engine/Cargo.lock` (artefakt builda) — usunięty.
- Gałąź `p6-8h2-dostep-zasobow-b` — lokalnie na commicie raportu rundy 4 (bez push); integracja/merge: krok orkiestratora.
