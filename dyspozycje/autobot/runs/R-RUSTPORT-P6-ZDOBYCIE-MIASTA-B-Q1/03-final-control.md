# R-RUSTPORT-P6-ZDOBYCIE-MIASTA-B-Q1 — Final Control, runda 1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-ZDOBYCIE-MIASTA-B-Q1 (#354 część B)
GOAL: domknąć kroki zdobycia miasta wpisane przez część A do `notApplied` (prawo po przejęciu, kronika i zdarzenia,
kolejka produkcji, religia) 1:1 z pinem `07d2fbd72` oraz długi DL-1…DL-7 tam, gdzie pin je rozstrzyga.
ZMIANY/COMMIT: oceniany kod `cb57ab3b2` (gałąź `rust-port-wip/zdobycie-miasta-b-q1-obrona`; kod `a1633a12b` + `9d7b21bea`
na Operatorze `b2a82e6ce`), baza `a5fdb91b8`. FC nie zmienia kodu, dodaje tylko ten raport.
TESTY: sekcja 1
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora (merge-tree na `origin/rust-port/parity-v2` = `0522ad6df` jest czysty)
DEPLOY/PUSH: NIE WYKONANO

## 1. Bramki odtworzone przez FC

Checkout `cb57ab3b2` z `dyspozycje/` w worktree FC. Ustawienia: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0
CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie `zmb-fc/target` (poza repo). Bramka uruchomiona w tle przez
`setsid nohup`, target usunięty po bramkach.

| Bramka | Wynik |
|---|---|
| `cargo fmt --all -- --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --all-targets --no-fail-fast` (pełny engine; obejmuje `bridge_contract`, `p6_zdobycie_miasta_a*`, `_b*`, `p6_k5loop_wiring_b*`, `p6_siege_transfer*`, `p6_siege_capital_plunder`, `p6_siege_capture_events`) | EXIT 0: 553 binarki, 4210 passed, 0 failed, 1 ignored. Ignorowany test był już w bazie, temat nie dodaje `#[ignore]`. Liczba zgodna z Obroną. |
| `node rust-port/engine/tests/p6_zdobycie_miasta_b_gen.mjs` | pinSha256 `f6b8e34d…60de` = strażnik. MD5 `77495a51d551cc2124c6a3ecba4f1bc7` = MD5 zacommitowanego `vectors.json`, plik po regeneracji bajtowo bez zmian. religion 441, prod 9, `dataSame` wszystkie `true` |
| `git diff --check a5fdb91b8 cb57ab3b2` | czysto |
| `git merge-tree --write-tree origin/rust-port/parity-v2 cb57ab3b2` | bez konfliktów (`d2f778d6c`). Zmiany `parity-v2` po bazie dotyczą innych plików (`p6_k5loop_wiring_a_pin*`) |

## 2. Allowlista i zakazy (sprawdzone samodzielnie)

Zmienione pliki (`git diff --name-only a5fdb91b8 cb57ab3b2`): `city_capture_apply.rs`, `playable.rs` (4 pola
`post_capture_law_by_city`, `civ_chronicle_by_owner`, `city_prod_by_city`, `capture_events`, każde z cytatem pinu,
plus 2 inicjalizatory), `eliminacja.rs` (DL-7, `eliminate_owner` to odpowiednik pozycji „war_turn.rs lub odpowiednik dla
DL-7” z dispatchu), nowe `p6_zdobycie_miasta_b.rs`, `p6_zdobycie_miasta_b_bridge.rs`, `p6_zdobycie_miasta_b_gen.mjs` i
`vectors.json`, raporty `01`/`02a`. Wszystkie są na allowliście.

Pliki zakazane (`siege_tactics_loop.rs`, `siege_battle_session.rs`, `p6_k5loop_wiring_a*`, `client`, `renderer`,
`src-tauri`, `gra/`) nie zostały ruszone. W diffie nie ma `#[ignore]` ani usuniętych asercji. Commity mają wyłącznie
trailer `Claude-Session:`, `Co-Authored-By` występuje 0 razy. Wektory części A są nietknięte.

## 3. Zgodność z pinem (tekst `07d2fbd72` przeczytany przez FC)

- `main.ts:36134-36184` (kolejka produkcji przy zdobyciu) i `:5123-5137` (`sanitizeProductionQueue`): klej generatora
  porównałem linia po linii z pinem. Zwrot legacy idzie do `oldOwner`, zwroty z sanityzacji i przepadek budynków stolicy do
  `atkOwner`, bank `slice(1)` jest zgodny. Port Rust ma tę samą kolejność.
- `civKeyForOwnerId` (`main.ts:9813-9834`): gałąź `if (!row) return ''` jest teraz pokryta wektorami (Z2). Pominięcie
  `loadCivMatrix` jest równoważne na danych pinu, co sprawdził Evaluator.
- `main.ts:36216-36258`: `runCapitalCapturePlunder` zeruje `capitalCaptureReportSlot` na wejściu (`:35561`) i ustawia go
  wyłącznie razem z `buildCityCaptureReportRows` + `recordCityCaptureEvent` (`:35630-35647` stolica, `:35691-35724`
  eliminacja). Dlatego zwracanie przez `apply_plunder_event_calls` ostatnich wierszy z `ui_calls` jest równoważne odczytowi
  slotu. Wiersz straty ludności (`popBeforeCapture - city.population`), `ludnosc` po stracie, `budynki` z
  `cityBuilt`, dedup karty po `capture-<tura>-<miasto>-<stary>-<nowy>` i strażnik `oldOwner!==0 && newOwner!==0` są zgodne.
  Równoważność E22/E23 z Obrony jest poprawna, bo dedup sprawia, że P1 jest no-opem po karcie stolicy lub eliminacji.
- `post-capture-law.ts:62-82` i strażnik barbarzyńcy `post-battle-map.ts:573`: zgodne. Gałąź odbicia rebelii jest
  niedostępna, bo `rebelState` stoi w `NOT_APPLIED_ALWAYS`, z uzasadnieniem.

## 4. Mutanty FC (własne, `scratchpad/zmb-fc/mut.py`; testy `p6_zdobycie_miasta_a*`, `_b*`, `p6_siege_capture_events`, lib; źródło przywrócone, `git status` czysty)

| # | Mutant | Wynik |
|---|---|---|
| F8 | `budynki` w karcie zwykłego miasta = 0 | ZABITY (`szturm_zapisuje_karte_zdobycia_zwyklego_miasta`) |
| F10 | `victimLabel` i `captorLabel` zamienione w wywołaniu P1 | ZABITY |
| F1 | `recordCivElimEvent` z `ui_calls` planszy ignorowane | PRZEŻYŁ, nieosiągalny na ścieżce tematu. Pin woła go tylko przy eliminacji AI↔AI (`main.ts:35758-35767`), a most obsługuje szturm gracza |
| F9 | `surowce` karty zwykłego miasta = `None` zamiast `economy.city_stock` | PRZEŻYŁ: scenariusz E2E nie ma magazynu miasta. Funkcję wierszy z surowcami pokrywa 15 wektorów pinu, niepokryte jest tylko wpięcie pola stanu |

Mutanty Operatora (32) i Obrony (25) przyjmuję. Łącznie z mutantami Evaluatora jest ich ponad 20. Przeżyły tylko mutanty
jawnie równoważne (M31, X8, E22, E23) albo F1 i F9, opisane wyżej.

## 5. Orzeczenia

| Zarzut | Orzeczenie | Uzasadnienie |
|---|---|---|
| Z1 (Evaluator): `recordCityCaptureEvent` niewpięty | ODDAL (naprawione) | Wpięty w miejscu pinu, z wektorami z generatora wykonującego wycięty tekst `main.ts` i `cities.ts`, z E2E przez most. Nie występuje w `not_applied` (asercja testu). Mutanty E1–E24, F8 i F10 zabite |
| Z2: X2 (nieznana cywilizacja) | ODDAL (naprawione) | Nowe pary w `civPairs`, 441 przypadków, MD5 odtworzony przez FC |
| Z3: X11 (strażnik barbarzyńcy w prawie) | ODDAL (naprawione) | Jest test `prawo_po_przejeciu_pominiete_dla_zdobywcy_barbarzyncy` |
| Z4: DL-3, format klucza pary `min_max` | ODDAL jako zarzut blokujący. Decyzja techniczna należy do orkiestratora | Migracja `war_turn_declare::pair_key` dotyka modułów i zapisu spoza allowlisty. Obejście D-ZMA-8 jest udokumentowane. Rekomenduję osobny temat z wpisem w `REJESTR-RUST.md` (decyzja techniczna, nie gameplay) |
| Z5: X1 i duplikat `capital_city_id_for_owner` | ODDAL (naprawione) | Test plus komentarz, dlaczego nie można użyć `city_view` |
| D-ZMB-4: `wonderGateOk` bez portu (warunkowy wpis `not_applied`) | ODDAL z długiem | Wpis jest jawny i warunkowy (tylko gdy w kolejce jest cud). `city_prod_by_city` nie jest dziś zasilane przez ekonomię, więc w grze ścieżka jest nieosiągalna. Ta sama luka jest już zarejestrowana w `siege_transfer` (predykat po stronie wołającego) |
| FC-F1: brak testu `recordCivElimEvent` z planszy | ODDAL z notą | Ścieżka AI↔AI jest poza zakresem tematu (W6–W9). Test należy dopisać z tematem eliminacji AI↔AI |
| FC-F9: wpięcie `surowce` z `economy.city_stock` bez E2E | ODDAL z notą | Mapowanie odpowiada polu `city.surowce` pinu (`playable.rs:535` „pula surowców miast”), a logikę wierszy pokrywają wektory. Rekomendacja na następną rundę dotykającą tego pliku: scenariusz E2E z magazynem miasta |

Brak orzeczeń NAPRAW. Brak spraw DO DECYZJI CZŁOWIEKA: wszystkie pozostałe kwestie są techniczne i należą do orkiestratora.

## 6. Tabela W1–W14 / DL-1…DL-7 (stan po obronie)

| # | Stan |
|---|---|
| W1, W2 | ZASTOSOWANO: szturm gracza z wyłomem przez most, z krokami B |
| W3–W9, W11–W13 | POZA ZAKRESEM (dispatch) |
| W10, W14 | n/d |
| DL-1 | ZASTOSOWANO (`religion_by_city`, 441 wektorów + E2E) |
| DL-2 | NIE: pin zapisuje `capturedFromOwnerId`, a `save_load.rs` jest poza allowlistą. Osobny temat razem z nowymi polami B |
| DL-3 | NIE: pin rozstrzyga format `min_max`, ale migracja jest poza allowlistą. Obejście D-ZMA-8 zostaje (decyzja orkiestratora) |
| DL-4 | ZASTOSOWANO: prawo, kronika, karta zdarzenia, kolejka produkcji. Pozostały warunkowy wpis `wonderGateOk` (D-ZMB-4) |
| DL-5 | POZA ZAKRESEM |
| DL-6 | NIE: wymaga generatora mocy (POWER-*) |
| DL-7 | ZASTOSOWANO u źródła (`eliminacja.rs`) |

## 7. Długi (do `REJESTR-RUST.md`)

ZMA-DL-3 / DL-3: migracja kluczy par `min-max` na `min_max` z migracją zapisu. ZMB-DL-2: pola B i `capturedFromOwnerId`
nie są w `save_load`. ZMB-DL-3: remis Hamiltona przez `localeCompare` dla kluczy spoza ASCII jest NIE_ZMIERZONY. DL-6.
ZMB-DL-6 `wonderGateOk`. D-ZMB-7: etykiety `owner{id}` zamiast `civLabelForOwner`. Kolejka produkcji nie jest zasilana
przez ekonomię (EKONOMIA-TURA). FC-F1: test `recordCivElimEvent` przy AI↔AI. FC-F9: E2E z magazynem miasta.
`gracz_kiedys_mial_miasto` ma `#[serde(skip)]` (normalizowane w teście determinizmu).

## 8. Werdykt

PASS-WITH-NOTES. Kod `cb57ab3b2` spełnia GOAL i kryteria końca dispatchu: test E2E przez most, wektory z generatora
wykonującego tekst pinu, `notApplied` kroków B pusty na ścieżce gracza poza jawnym, warunkowym `wonderGateOk`, determinizm,
brak regresji wektorów A, ponad 20 mutantów, zielone bramki. Integracja: merge na aktualny `parity-v2` (`0522ad6df`,
merge-tree czysty) i pełny `cargo test` po merge'u.
