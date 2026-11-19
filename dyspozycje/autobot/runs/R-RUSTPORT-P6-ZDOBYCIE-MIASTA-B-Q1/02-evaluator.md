# R-RUSTPORT-P6-ZDOBYCIE-MIASTA-B-Q1 — Evaluator (adwersarialny), runda 1

STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-ZDOBYCIE-MIASTA-B-Q1 (#354 część B)
GOAL: domknąć kroki zdobycia miasta wpisane przez część A do `notApplied` (prawo po przejęciu, kronika i zdarzenie,
kolejka produkcji, religia) 1:1 z pinem `07d2fbd72` oraz długi DL-1…DL-7 tam, gdzie pin rozstrzyga.
OCENIANY KOD: `rust-port-wip/zdobycie-miasta-b-q1` = `b2a82e6ce` (kod `b6e220850`); baza `a5fdb91b8` =
`merge-base(origin/rust-port/parity-v2, b2a82e6ce)`. Uwaga: `origin/rust-port/parity-v2` stoi teraz na `0522ad6df`
(przesunęła się po starcie). Integracja wymaga merge-tree/rebase.
RUNDY: 1/5
DEPLOY/PUSH: NIE WYKONANO

## 1. Bramki odtworzone przez Evaluatora (checkout `b2a82e6ce`, w nim `dyspozycje/`)

Środowisko: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, własny `CARGO_TARGET_DIR`
w scratchpadzie (`zmb-ev/tgt`), usunięty po bramkach.

| Bramka | Wynik |
|---|---|
| `cargo fmt --all -- --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| Testy dotknięte (jedno wywołanie: lib, `bridge_contract`, `p6_zdobycie_miasta_a`, `_a_bridge`, `_b`, `_b_bridge`, `p6_k5loop_wiring_b`, `_b_pin`, `p6_siege_transfer`, `_effects`, `_effects_q4`, `_prod`, `_q5`, `p6_siege_capital_plunder`, `p6_siege_capture_events`) | EXIT 0. lib 144, bridge_contract 10, k5loop_b 15, k5loop_b_pin 2, capital_plunder 3, capture_events 3, transfer 2, effects 4, effects_q4 12, prod 5, q5 6, zma_a 6, zma_a_bridge 7, zmb_b 11, zmb_b_bridge 3; 0 failed |
| `cargo test --all-targets --no-fail-fast` (pełny engine) | EXIT 0: 553 binarki, 4202 passed, 0 failed, 1 ignored (ignorowany test był już w bazie) |
| Generator `node rust-port/engine/tests/p6_zdobycie_miasta_b_gen.mjs` | pinSha256 `54ef001a…b615` (= strażnik), MD5 `bf7d5307291b88c950213f4845bbae67` = MD5 zacommitowanego `vectors.json`; `dataSame` civs/society/buildingsLokalizacja = true |

Liczby testów w raporcie Operatora (§5) mają przestawione etykiety (np. `p6_siege_transfer` 3/3 zamiast 2), ale łączna liczba
w pełnej bramce zgadza się z moim pomiarem (4202 passed).

## 2. Allowlista, zakazy, uczciwość testów

- Zmienione pliki: `city_capture_apply.rs`, `playable.rs` (3 pola i 2 inicjalizatory), `eliminacja.rs` (DL-7; mieści się w
  „war_turn.rs lub odpowiednik dla DL-7”), nowe `p6_zdobycie_miasta_b*.rs`, generator, wektory, raport. Pliki zakazane
  (`siege_tactics_loop.rs`, `siege_battle_session.rs`, `p6_k5loop_wiring_a*`, client, renderer, src-tauri, `gra/`) nie są
  ruszane. Sekcja „Pliki spoza allowlisty”: brak.
- Brak `#[ignore]`, brak usuniętych lub osłabionych asercji (`git diff` bez linii `-…assert`). Wektory części A są
  bajtowo niezmienione.
- Commity: trailer `Claude-Session:`, brak `Co-Authored-By`. `git diff --check` czysty.

## 3. Zgodność z pinem (przeczytany tekst `07d2fbd72`)

- `main.ts:36034-36265`: Rust zachowuje kolejność pinu: `noteCityCapture` (pierwszy) → P9 z `applyPostCaptureLawOnCapture`
  przed zmianą właściciela → … → `recordWarCityLossForPair` → kolejka produkcji → religia →
  `playerEverOwnedCityByOwner` → `endMapSiege` → `runCapitalCapturePlunder`. Zgodne.
- Kolejka produkcji (`:36134-36184`, `sanitizeProductionQueue` `:5123-5137`): pierwszy zwrot Pracy legacy idzie do `oldOwner`,
  zwroty z sanityzacji do `atkOwner`, filtr budynków stolicy i zbankowany `postep` dla `slice(1)` zgodne;
  `capitalCityIdForOwner` jest liczone po zmianie właściciela z jawnej mapy sprzed zdobycia (D-ZMB-3), co odpowiada
  `capitalCityIdByOwner` pinu. `wonderGateOk` nie ma portu i jest jawnie wpisywany do `not_applied` (D-ZMB-4).
- `onCityCapturedReligion` (`culture-religion.ts:788-870`): port linia w linię (krąg kultury, inwersja udziału,
  Hamilton z remisem `localeCompare` zastąpionym porównaniem bajtowym, co jest długiem ZMB-DL-3 dla kluczy spoza ASCII),
  ludność po stracie P9, zawsze zapis `cityRelig.set`. Zgodne.
- D-ZMB-5 (`civKeyForOwnerId` bez kroku `loadCivMatrix`): sprawdziłem w pinie (`gra/data/civ-matrix.json` i `civs.json`).
  Każdy z 15 wierszy `civs.json` ma wiersz macierzy z tym samym `ikonaId` oraz `ikonaId == typCywilizacji`, więc pominięcie
  jest równoważne na danych pinu.
- DL-7 (`capital-capture.ts:392` `disbandOwnerUnits` usuwa obiekt jednostki): poprawka u źródła w `eliminate_owner` jest
  zgodna z pinem.
- DL-2: stwierdzenie Operatora jest prawdziwe. Pin zapisuje `capturedFromOwnerId` (`save.ts`), a Rust `save_load.rs` składa
  migawkę jawnie z pól, a nie z serde `PlayableState`. Zmiana wymaga `save_load.rs`, którego nie ma na allowliście.
- DL-3: pin rozstrzyga format, a pary to `"min_max"` (`main.ts:35240-35244`, `diploPairKeyHasOwner`). Rust
  `war_turn_declare::pair_key` zapisuje `min-max` i ma 32 wywołania. Operator nie naprawił źródła i zostawił obejście
  D-ZMA-8.

## 4. Mutanty Evaluatora (własne, `scratchpad/zmb-ev/mut.py`; bramka: `p6_zdobycie_miasta_b`, `_b_bridge`, `_a`, `_a_bridge`; źródło przywrócone, `git status` czysty)

| # | Mutant | Wynik |
|---|---|---|
| X1 | `capital_city_id_for_owner`: jawna stolica bez sprawdzenia, że nadal należy do właściciela | PRZEŻYŁ (gałąź defensywna pinu `cities.some(c.id===explicit && c.ownerId===ownerId)` nie ma testu) |
| X2 | `civ_key_for_owner`: zwraca surowy klucz zamiast `''` dla cywilizacji spoza `civs.json` | **PRZEŻYŁ**: pin daje `''`, więc `sameCultureCircle` jest false dla dwóch nieznanych cywilizacji. Mutant daje true i podmienia religię na 100% nowego właściciela. Wektory nie mają pary „nieznana, nieznana” ani „nieznana, ta sama nieznana” |
| X3 | zwrot Pracy legacy do zdobywcy zamiast do `oldOwner` | ZABITY |
| X6 | odwrócony remis Hamiltona | ZABITY |
| X8 | `is_capital_only_building` bez `kind == Budynek` | PRZEŻYŁ, RÓWNOWAŻNY na danych pinu: żaden id jednostki z `units.json` nie jest id budynku-stolicy (`mennica`, `palac`, `palac_ii`, `palac_iii`) |
| X11 | `apply_capture_law` bez strażnika barbarzyńcy (`post-battle-map.ts:573`) | PRZEŻYŁ: na ścieżce mostu nieosiągalny (`attacker_owner_id: u64`), ale funkcja jest publiczna i nie ma testu |
| X17 | usunięte wpięcie religii w `apply_storm_capture` | ZABITY (E2E) |
| X18 | usunięte wpięcie kroniki w `apply_storm_capture` | ZABITY (E2E) |
| X19 | prawo nie jest wstawiane, gdy miasto nie miało wcześniejszego wpisu | ZABITY |

Mutanty Operatora (32, w tym M31 równoważny) przyjmuję. M31 sprawdziłem: druga `sanitizeBuildQueue` działa na kolejce już
oczyszczonej, więc jest idempotentna. Łącznie: 41 mutantów, 2 realnie przeżyłe (X2, X11), 1 defensywny (X1),
2 równoważne (M31, X8).

## 5. Zarzuty

**Z1 (blokujący, GOAL 1 i KRYTERIA).** `recordCityCaptureEvent` nie jest wpięty, a dispatch wymienia go wprost w GOAL 1
(„`recordCityCaptureEvent` + `noteCityCapture` (kronika/zdarzenia) … tak by `notApplied` tych kroków było puste przy
ścieżce szturmu gracza”). Kryteria mówią też o stanie zawierającym „wpis zdarzenia/kroniki”. Pozostały wpis
`recordCityCaptureEvent` w `NOT_APPLIED_ALWAYS` nie ma uzasadnienia pinem, tylko brakiem portu. Tymczasem:
- logika magazynu już istnieje: `siege_capture_events::CaptureEventStore::record_city_capture_event` (Q7, z wektorami);
- brakuje tylko czystego `buildCityCaptureReportRows` (`main.ts:1781`) dla `kind:'zwykle'` (dla ścieżki stołecznej wiersze
  daje już `capitalReport.rows`), `capturePopLossReportRow` (`cities.ts:1255`), pola stanu na magazyn i etykiet.
  Etykiety można wziąć z istniejącej konwencji `NoLabels` (`civ_label` = `owner{id}`) albo jawnie zapisać decyzję
  techniczną;
- wszystko to mieści się w allowliście (adapter w `city_capture_apply.rs`, pole w `playable.rs`).
Wymagane: wpiąć `recordCityCaptureEvent` w miejscu pinu (po `runCapitalCapturePlunder`, z `reportRows` i wierszem straty
ludności) z wektorem z generatora wykonującego tekst pinu (`buildCityCaptureReportRows`, `capturePopLossReportRow`,
`recordCityCaptureEvent`) i asercją E2E w `p6_zdobycie_miasta_b_bridge.rs`. Jeśli Operator uzna, że to obiektywnie
wykracza poza temat, musi to rozstrzygnąć orkiestrator (zmiana zakresu w dispatchu), a nie dług Operatora.

**Z2 (blokujący, jakość wektorów).** Mutant X2 przeżył. Gałąź pinu `if (!row) return ''` w `civKeyForOwnerId`
(nieznany właściciel nie dziedziczy cudzego kręgu) jest niepokryta. Wymagane: dodać do `civPairs` generatora pary
`['nieznana','nieznana']` oraz `['nieznana','inna_nieznana']` (lub `['', '']`), zregenerować wektory (nowy MD5) i pokazać,
że X2 jest zabity.

**Z3 (niski).** X11: brak testu strażnika barbarzyńcy w `apply_capture_law` (pin `post-battle-map.ts:573`
`if (!isBarbarian(atkOwner))`). Wymagane: jeden test, w którym atakujący -1 nie zmienia `post_capture_law_by_city`
(analogicznie do `barbarzynca_zdobywca_zeruje_kolejke`).

**Z4 (decyzja techniczna, nie blokuje).** DL-3: pin rozstrzyga format `min_max`. Operator świadomie nie zmienił
`war_turn_declare::pair_key` (32 wywołania, wpływ na stan i zapis), więc obejście D-ZMA-8 zostaje. Dispatch dopuszczał
naprawę „gdy pin rozstrzyga”. Orkiestrator powinien zdecydować, czy to osobny temat (rekomendacja: osobny temat z migracją
kluczy, bo zmiana dotyka zapisu), i wpisać decyzję do `REJESTR-RUST.md`.

**Z5 (nie blokuje).** X1: gałąź defensywna `capitalCityIdForOwner` bez testu. Rekomendowany test: wpis `designated`
wskazuje miasto innego właściciela, więc wynikiem jest najstarsze miasto. Dodatkowo duplikat: istnieje już
`city_view::capital_city_id_for_owner` (oparta na `is_capital` stanu, więc tu nieużyteczna po zmianie właściciela).
Warto opisać w komentarzu, dlaczego nie została użyta.

## 6. Tabela W1–W14 / DL-1…DL-7 (ocena Evaluatora)

| # | Operator | Evaluator |
|---|---|---|
| W1, W2 | zastosowano | potwierdzam (E2E przez most zielony) |
| W3–W9, W11–W13 | poza zakresem | zgodne z dispatchem |
| W10, W14 | n/d | zgodne |
| DL-1 | zastosowano | potwierdzam, z zarzutem Z2 do wektorów |
| DL-2 | nie (pin zapisuje, `save_load.rs` poza allowlistą) | uzasadnienie prawdziwe, decyzja zgodna z allowlistą |
| DL-3 | nie (format pinu `_`, poprawka poza allowlistą) | Z4: decyzja orkiestratora |
| DL-4 | częściowo (prawo, kronika, kolejka; bez `recordCityCaptureEvent`) | **Z1: niedomknięte** |
| DL-5 | poza zakresem | zgodne |
| DL-6 | nie (wymaga generatora mocy) | akceptowalne jako dług, wymaga wpisu w rejestrze |
| DL-7 | zastosowano u źródła | potwierdzam (zgodne z `capital-capture.ts:392`) |

## 7. Długi (przejmowane do rejestru)

ZMB-DL-2 (nowe pola B i `capturedFromOwnerId` nie są w `save_load`), ZMB-DL-3 (remis `localeCompare`), DL-3, DL-6,
ZMB-DL-6 (`wonderGateOk`), `gracz_kiedys_mial_miasto` `#[serde(skip)]` (normalizowane w teście determinizmu). Kolejka
produkcji nie jest dziś zasilana przez ekonomię Rust (EKONOMIA-TURA).

## 8. Następny krok

Operator r2 (ten sam ID, baza = `b2a82e6ce` lub `b2a82e6ce` przeniesiony na aktualny `origin/rust-port/parity-v2`
`0522ad6df`): Z1, Z2, Z3 (Z5 opcjonalnie), ponowne bramki z pełnym engine. Z4 → decyzja orkiestratora.
