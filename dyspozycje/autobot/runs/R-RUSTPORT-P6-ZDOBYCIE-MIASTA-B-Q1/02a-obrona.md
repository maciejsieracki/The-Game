STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-ZDOBYCIE-MIASTA-B-Q1
GOAL: domknąć kroki P1/P9 zdobycia miasta z `notApplied` części A (prawo po przejęciu, kronika i zdarzenia, kolejka produkcji, religia) 1:1 z pinem `07d2fbd72`
ZMIANY/COMMIT: `a1633a12b` (Z1, Z2, Z3, Z5: kod, testy, generator, wektory) + `9d7b21bea` (clippy) + commit raportu (SHA w odpowiedzi Obrony); gałąź `rust-port-wip/zdobycie-miasta-b-q1-obrona`, baza tematu `b2a82e6ce` (raport Operatora r1, na `a5fdb91b8`)
TESTY: niżej, sekcja „Bramki”
BLOKADY: brak
RUNDY: 1/5 (obrona po Evaluatorze r1)
NASTĘPNY KROK: Final Control
DEPLOY/PUSH: NIE WYKONANO

# Obrona Operatora (runda 1) — odpowiedzi na zarzuty Evaluatora (`02-evaluator.md`, commit `8e2b21749`)

Pliki zmienione w obronie (wszystkie z allowlisty dispatchu): `rust-port/engine/src/domain/city_capture_apply.rs`,
`rust-port/engine/src/domain/playable.rs` (jedno pole), `rust-port/engine/tests/p6_zdobycie_miasta_b.rs`,
`rust-port/engine/tests/p6_zdobycie_miasta_b_bridge.rs`, `rust-port/engine/tests/p6_zdobycie_miasta_b_gen.mjs`,
`rust-port/engine/tests/p6_zdobycie_miasta_b_vectors/vectors.json`, ten raport.

## Z1 (blokujący): `recordCityCaptureEvent` niewpięty — PRZYJMUJĘ

Poprawka (commit `a1633a12b`):
- Pole stanu `PlayableState::capture_events: PlayableCaptureEvents`, pomijane w serde, gdy jest puste. Odpowiada polom
  webu `warEventLog`, `cityCaptureEventDetails` i `civElimEventDetails`. Logikę zapisu daje istniejący
  `siege_capture_events::CaptureEventStore` z Q7: `record_city_capture_event` z deduplikacją po
  `capture-<tura>-<miasto>-<stary>-<nowy>` i `record_civ_elim_event`. Konwersja odbywa się przez `to_store` i `from_store`.
- Port `buildCityCaptureReportRows` (`main.ts:1802`, wszystkie trzy rodzaje: `zwykle`, `stolica`, `eliminacja`),
  `capturePopLossReportRow` (`cities.ts:1255`) oraz `mocLabel()` (`ui/power-labels.ts:18`) w `city_capture_apply.rs`.
  Etykiety cywilizacji wg konwencji `NoLabels` (`owner{id}`, D-ZMB-7).
- Wpięcie w kolejności pinu (`main.ts:36222-36258`). Po `runCapitalCapturePlunder` wiersze bazowe są brane z
  `capitalCaptureReportSlot.rows`, a gdy ich brak, z `buildCityCaptureReportRows({kind:'zwykle', …})`. Do nich
  dochodzi wiersz straty ludności, a potem następuje wywołanie `recordCityCaptureEvent`.
- Wywołania z wnętrza `runCapitalCapturePlunder` (`main.ts:35647` — stolica, `:35724` — eliminacja, `:35767` —
  `recordCivElimEvent`) są wykonywane na stanie z `ui_calls` portu Q6 w miejscu pinu (`apply_plunder_event_calls`).
  Dzięki temu karta stołeczna lub eliminacyjna jest zapisywana pierwsza, a późniejsze wywołanie z P1 kończy się
  no-opem (pin: „first write wins”).
- `recordCityCaptureEvent` zniknęło z `notApplied`. W `PIN_STEPS` mapuje się na
  `apply_record_city_capture_event (PlayableState::capture_events, CaptureEventStore)`.

Dowód z generatora, który wykonuje tekst pinu (sekcja `capture` w `p6_zdobycie_miasta_b_gen.mjs`):
- Funkcje `buildCityCaptureReportRows`, `captureReportOneLine`, `captureReportShortLine`,
  `mirrorCaptureReportRowsForVictim` i `recordCityCaptureEvent` są wycinane po nazwie z tekstu `main.ts` pinu,
  a `capturePopLossReportRow` z `cities.ts`. Nie ma kopii logiki: kod jest transpilowany przez TypeScript i wykonywany.
  Moduły `building-stock-cost.ts`, `power-labels.ts` i `retained-side-panel-events.ts` są ładowane z pinu.
- 15 przypadków wierszy raportu obejmuje wszystkie gałęzie: surowce spoza listy, NaN/ujemne/zero, łup barbarzyńcy,
  żywność przejętą i utraconą, pulę pracy oraz moc ułamkową. Do tego 5 przypadków straty ludności (0, 1, 2, 2.6, −1).
- E2E: karta zwykłego miasta oraz sekwencja stolicy (dwa wywołania, dedup) jako migawki `warEventLog` i map szczegółów.

Testy:
- `p6_zdobycie_miasta_b.rs`: `wiersze_raportu_zdobycia_zgodne_z_pinem`, `wiersz_straty_ludnosci_zgodny_z_pinem`.
- `p6_zdobycie_miasta_b_bridge.rs` (przez most, szturm z wyłomem):
  - `szturm_zapisuje_karte_zdobycia_zwyklego_miasta`: stan `capture_events` jest równy wektorowi
    `capture.captureEvents.zwykle`, a `recordCityCaptureEvent` nie ma w `not_applied`;
  - `szturm_stolicy_zapisuje_karte_stoleczna_pierwsza`: stan jest równy wektorowi `captureEvents.stolica`;
  - `eliminacja_zapisuje_karte_eliminacji_bez_wiersza_straty`.

## Z2 (blokujący): mutant X2 (`civ_key_for_owner` zwraca surowy klucz) — PRZYJMUJĘ

- Do `civPairs` w generatorze doszły pary `['nieznana','nieznana']`, `['nieznana','inna_nieznana']`, `['','']` i
  `['grecy','nieznana']`. Pokrywają gałąź `if (!row) return ''` w `civKeyForOwnerId`: w pinie `sameCultureCircle('', '')`
  daje `false`. Liczba przypadków religii wynosi teraz 441.
- Nowy test `nieznane_cywilizacje_nie_dziedzicza_kregu` sprawdza, że wektor dla pary (nieznana, nieznana) ma `same == false`.
  Istniejący test `religia_po_zdobyciu_zgodna_z_pinem` przechodzi po wszystkich 441 przypadkach.
- X2 jest zabity (log `zmbo/mut.log`): `religia_po_zdobyciu_zgodna_z_pinem ... FAILED`.

## Z3 (niski): mutant X11 (brak strażnika barbarzyńcy w `apply_capture_law`) — PRZYJMUJĘ

- Test `prawo_po_przejeciu_pominiete_dla_zdobywcy_barbarzyncy`. Atakujący `-1`: przy pustej mapie
  `post_capture_law_by_city` mapa zostaje pusta, a istniejący wpis się nie zmienia. Kontrola: zdobywca `1` zmienia wpis
  (`post-battle-map.ts:573`).
- X11 jest zabity: `prawo_po_przejeciu_pominiete_dla_zdobywcy_barbarzyncy ... FAILED`.

## Z4 (decyzja orkiestratora, nie blokuje): DL-3, format klucza pary — PRZYJMUJĘ ustalenie, bez zmiany kodu w tym temacie

- Zgadzam się z Evaluatorem: pin rozstrzyga format `min_max` (`main.ts:35240-35244`, `diploPairKeyHasOwner`).
- Kodu nie zmieniam. Migracja `war_turn_declare::pair_key` (`min-max`, 32 wywołania) oznacza zmianę formatu kluczy
  zapisanych w stanie i w zapisie gry, a to dotyka modułów spoza tej allowlisty (`war_turn_declare`, dyplomacja, save).
  Dispatch dopuszcza `war_turn.rs` tylko dla samego `clear_eliminated_owner_war_state`, a zmiana jednego miejsca
  rozjechałaby format z resztą stanu.
- Obejście D-ZMA-8 (`remove_pair_meta_of_owner`) zostaje z komentarzem w kodzie (`city_capture_apply.rs`, eliminacja).
- Dług ZMA-DL-3 przekazuję orkiestratorowi do decyzji. Rekomenduję osobny temat „migracja kluczy par `min-max` →
  `min_max` + migracja zapisu”, a po nim usunięcie adaptera i wpis w `REJESTR-RUST.md`.

## Z5 (nie blokuje): mutant X1 i duplikat `capital_city_id_for_owner` — PRZYJMUJĘ

- Test `jawna_stolica_innego_wlasciciela_daje_najstarsze_miasto`. Jawny wpis stolicy (906) należy do innego właściciela,
  więc wynik przechodzi do `oldestCityOfOwner` (900) i budynek stołeczny zostaje w kolejce. Kontrola: wpis należący do
  zdobywcy (905) usuwa budynek stołeczny. X1 jest zabity.
- Duplikat ma komentarz w kodzie (`city_capture_apply.rs`, doc `capital_city_id_for_owner`). Funkcja celowo nie używa
  `city_view::capital_city_id_for_owner` (flaga `is_capital`). W chwili tego kroku zdobyte miasto ma już właściciela
  `atk`, ale nadal flagę stolicy ofiary (zdejmuje ją dopiero `runCapitalCapturePlunder`). Funkcja z `city_view` uznałaby
  więc stolicę ofiary za stolicę zdobywcy. Pin czyta `capitalCityIdByOwner` sprzed zdobycia, czyli `designated`.

## Mutanty obrony

Skrypt: `scratchpad/zmbo/mut.py`. Każdy mutant uruchamia testy `p6_zdobycie_miasta_b`, `p6_zdobycie_miasta_b_bridge`,
`p6_zdobycie_miasta_a` i `p6_zdobycie_miasta_a_bridge`. Logi: `zmbo/mut.log` i `zmbo/mut2.log`. Liczba mutantów: 25,
z czego 23 zabite, 2 równoważne, 0 żywych.

| ID | Mutacja | Wynik |
|---|---|---|
| X1 | `capital_city_id_for_owner` bez warunku właściciela | ZABITY (`jawna_stolica_innego_wlasciciela_daje_najstarsze_miasto`) |
| X2 | `civ_key_for_owner` zwraca surowy klucz dla nieznanej cywilizacji | ZABITY (`religia_po_zdobyciu_zgodna_z_pinem`) |
| X11 | brak strażnika `is_barbarian` w `apply_capture_law` | ZABITY (`prawo_po_przejeciu_pominiete_dla_zdobywcy_barbarzyncy`) |
| E1 | brak wywołania `apply_record_city_capture_event` w P1 (`#[cfg(any())]`) | ZABITY (`szturm_zapisuje_karte_zdobycia_zwyklego_miasta`) |
| E2 | `recordCityCaptureEvent` z `ui_calls` planszy ignorowane | ZABITY (karta stolicy i eliminacji) |
| E3 | wiersz straty ludności nie trafia do wierszy | ZABITY |
| E5 | `ludnosc` z populacji przed stratą | ZABITY |
| E6 | `victimLabel` = zdobywca | ZABITY |
| E8 | odwrócony warunek „łup: brak” | ZABITY |
| E9 | tekst przepadłej puli bez dopisku | ZABITY |
| E10 | wartość surowca bez `floor` | ZABITY |
| E11 | `collapsible = false` | ZABITY |
| E12 | format liczb zawsze bez części ułamkowej | ZABITY |
| E13 | `zywnoscOfiaryRazem` domyślnie 0 zamiast przejętej | ZABITY |
| E14 | etykieta mocy małymi literami | ZABITY |
| E15 | strata ludności bez `floor` | ZABITY (`wiersz_straty_ludnosci_zgodny_z_pinem`) |
| E16 | tura zapisu karty = 0 zamiast `state.turn` | ZABITY |
| E17 | `recordCityCaptureEvent` z planszy bez wierszy | ZABITY |
| E18 | gałąź puli pracy martwa | ZABITY |
| E19 | żywność przejęta poza `eliminacja` | ZABITY |
| E20 | `>= 0` zamiast `> 0` dla żywności utraconej | ZABITY |
| E21 | brak wiersza łupu barbarzyńcy | ZABITY |
| E22 | `capitalCaptureReportSlot.rows` zastąpione `None` w P1 | RÓWNOWAŻNY |
| E23 | `eliminatedCivLabel` = `None` w wywołaniu P1 | RÓWNOWAŻNY |
| E24 | surowce spoza listy pominięte | ZABITY |

Równoważność E22 i E23 (dowód z pinu): `capitalCaptureReportSlot` jest ustawiany wyłącznie razem z
`recordCityCaptureEvent` wewnątrz `runCapitalCapturePlunder` (`main.ts:35646-35647` — stolica i `:35719-35724` —
eliminacja). Ma ono te same `cityId`, `oldOwner` i `newOwner` oraz tę samą turę co wywołanie z P1 (`main.ts:36249`).
Dedup `if (cityCaptureEventDetails.has(evId)) return` (`main.ts:10673`) sprawia, że gdy slot lub etykieta eliminacji
nie są puste, wywołanie z P1 jest no-opem także w pinie. Argumenty `rows` i `eliminatedCivLabel` w tym wywołaniu są
więc nieobserwowalne. Pustość slotu (zwykłe miasto) pokrywa E1/E3/E5: karta zwykła jest zgodna z wektorem.

## Bramki (worktree `wf_4aa52724-462-3`, HEAD `9d7b21bea` + raport; target `scratchpad/zmbo/target`, usunięty po bramkach)

- `node rust-port/engine/tests/p6_zdobycie_miasta_b_gen.mjs`: pinSha256
  `f6b8e34d8df5f697637b938ccf7d233ad95d667cd715ce6901b790ab712160de` (strażnik zaktualizowany, bo doszły hashowane pliki
  pinu `building-stock-cost.ts`, `power-labels.ts`, `retained-side-panel-events.ts`, `main.ts` i `cities.ts`).
  MD5 `vectors.json` = `77495a51d551cc2124c6a3ecba4f1bc7`, równy zacommitowanemu (powtórne uruchomienie w obronie).
  religion 441, prod 9, dataSame wszystkie `true`.
- `cargo fmt --all -- --check`: EXIT 0.
- `cargo clippy --all-targets -- -D warnings`: EXIT 0 po commicie `9d7b21bea`. Clippy wskazał
  `neg_cmp_op_on_partial_ord` w dwóch miejscach. `!(v > 0.0)` zamieniłem na
  `v.partial_cmp(&0.0) != Some(Greater)`, co zachowuje semantykę JS `!(v > 0)`, także dla NaN.
- Testy dotknięte (`p6_zdobycie_miasta_a`, `p6_zdobycie_miasta_a_bridge`, `p6_zdobycie_miasta_b`,
  `p6_zdobycie_miasta_b_bridge`): 6 + 7 + 16 + 6 passed, 0 failed.
- Pełny `cargo test --all-targets --no-fail-fast`: EXIT 0, 553 binarki, 4210 passed, 0 failed, 1 ignored (ten sam, który był już w bazie). Względem Evaluatora (4202) doszło 8 nowych testów obrony. Log: `scratchpad/zmbo/full.log`.

Wektory części A są bez zmian (plik nietknięty, testy A zielone). Nie ma `#[ignore]` ani osłabionych asercji.

## Długi

- ZMA-DL-3 (Z4): migracja formatu kluczy par na `min_max` wg pinu jako osobny temat. Do tego czasu zostaje adapter
  D-ZMA-8.
- D-ZMB-7: etykiety cywilizacji w kartach zdarzeń wg konwencji `NoLabels` (`owner{id}`). Prawdziwe etykiety
  `civLabelForOwner` przyjdą z tematem UI/etykiet.
- `parity-v2` przesunęła się na `0522ad6df` (baza tematu `a5fdb91b8`), więc przed integracją potrzebne jest
  merge-tree orkiestratora.
