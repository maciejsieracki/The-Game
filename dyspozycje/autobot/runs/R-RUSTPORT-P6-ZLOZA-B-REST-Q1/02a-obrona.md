# OBRONA Operatora — R-RUSTPORT-P6-ZLOZA-B-REST-Q1 (runda 2)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: ZLOZA-B-REST: pozostałe gałęzie transferBasketItems (zloto, praca, zywnosc, tech, surowiec, miasto)
GOAL: port gałęzi koszyka do odpowiedników stanu Rust (pin `07d2fbd72`, `gra/src/main.ts:12566`); brak stanu = NIE_ZMIERZONO z listą pól.
BAZA: `0ca58770e` (detached), worktree `wf_6615211b-a5e-3`. Gałąź `wip/R-RUSTPORT-P6-ZLOZA-B-REST-Q1` była zajęta przez inną worktree, commit idzie na detached HEAD.
COMMIT: SHA w sekcji ZMIANY/COMMIT poniżej (commit po wpisaniu tego pliku).
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

### Z1. GOAL nie osiągnięty, Operator r1 bez kodu — PRZYJMUJĘ
Kod dodany w tej rundzie. Zakres zrealizowany: `zloze` (bez zmian), `tech`, `surowiec_boolean`, `surowiec_ilosc`, `praca`. Niezrealizowane z powodów opisanych w Z3 i Z5: `zywnosc`, `zloto`, `miasto`. `jednostka` pozostaje no-op zgodnie z pinem.

### Z2. Helpery istnieją, blokada „wymaga zmiany sygnatury” była samozadana — PRZYJMUJĘ
Sygnatura zmieniona w `rust-port/engine/src/domain/diplomacy_basket.rs` (allowlista). Nowa funkcja `transfer_basket_items` przyjmuje `BasketTransferState` (kontekst badań, `cities`, mapę Pracy, `capital_city_for`, skalę `pn_praca`). Użyte helpery z `diplomacy.rs`, bez zmian w tym pliku: `grant_tech_to_owner`, `grant_surowiec_boolean_access`, `normalize_resource_quantity`, `transfer_surowiec_ilosc`.

### Z3. Gałąź zywnosc: „brak zapasyPanstwa w Rust” oparte tylko na grepie — PRZYJMUJĘ zarzut o badanie, wynik: NIE_ZMIERZONO
Badanie wykonane: stan istnieje w `rust-port/engine/src/domain/city_growth.rs` (`OwnerFoodStates`, `EmpireFoodState.zapasy_panstwa`, `fresh_empire_food_state`). Powód NIE_ZMIERZONO: `OwnerFoodStates` ma pole prywatne `entries` i nie ma API zapisu poza tym modułem. Wpięcie wymaga zmiany `city_growth.rs`, a ten plik nie jest na allowliście. Dodatkowo pin czyści `_maxSafeRationCache` (`main.ts:12603`); odpowiednik cache nie został zbadany. Gałąź zywnosc jest w `skipped_kinds`, z opisem w dokumentacji funkcji.

### Z4. Gałąź praca: `set_owner_praca_pool` istnieje — PRZYJMUJĘ
Zaimplementowane w `transfer_basket_items` na `praca_pool_by_owner` (`BTreeMap<u64, f64>`, to samo pole co `set_owner_praca_pool` w `playable.rs:873`). Sekwencja jak na pinie: `from = max(0, from − praca)`, potem `to = max(0, to + praca)`, z odczytem `to` po zapisie `from`. Kwota `praca = max(0, round(qty × skala))` jak `diplomacyPnPraca`. Uwaga: pin rozdziela pulę gracza (`pracaPoolByHuman`) od AI (`aiPracaPoolByOwner`); w Rust jest jedna mapa, co odpowiada komentarzowi `set_owner_praca_pool` („także gracza ludzkiego”). To różnica modelu stanu, nie zachowania koszyka. Brak osobnego gettera `owner_praca_pool` był niepotrzebny: czytam mapę bezpośrednio.

### Z5. Gałęzie zloto i miasto: kryterium 2 spełnione tylko opisem w md — PRZYJMUJĘ
- `zloto`: NIE_ZMIERZONO, brak stanu jednorazowego transferu złota (potwierdzone Evaluatorem). Test `non_zloze_kinds_are_reported_not_applied` rozszerzony o `Food` i sprawdza listę `skipped_kinds = [Gold, Unit, Food]`.
- `miasto`: NIE_ZMIERZONO, brak wariantu `BasketItemKind` dla `miasto` i brak `transfer_city_by_treaty` w Rust. Dowód: nowy test `miasto_item_has_no_port_and_does_not_deserialize` (`serde_json` odrzuca `typ: "miasto"`). Raportowanie „miasto” w `skipped_kinds` nie jest możliwe, bo rodzaju nie ma w typie. Zamiast tego test dowodzi braku reprezentacji.
- Dodatkowo `tech` dla gracza `0`: efekty `zbadane` i `reconcilePlayerEraFromResearch` raportowane w `unported_side_effects` (tylko gdy `granted`).

### Z6. Generator i wektory pinu nie rozszerzone; kryterium 1 niespełnione — PRZYJMUJĘ jako OTWARTE
Nie zrobiono w tej rundzie. Wektory pinu dla `tech`, `surowiec_boolean`, `surowiec_ilosc` i `praca` NIE są wygenerowane. Powód techniczny: w fragmencie pina te gałęzie wołają helpery (`grantTechToOwnerWithSideEffects`, `grantSurowiecBooleanAccess`, `transferSurowiecIlosc`), a ich działanie zmienia stan (`basketTransferCtx`, `cities`, pule Pracy). Rzetelny wektor wymaga harnessu rejestrującego te zmiany, a nie stubów rzucających wyjątek. Testy w `p6_zloza_basket.rs` dla nowych gałęzi sprawdzają wrapper względem helperów Rust (te same argumenty, ta sama kolejność zapisów) i ustalone reguły z pina (clamp, skala, kolejność `from`/`to`). NIE są to wektory pinu. Proponowany zakres r3: rozszerzyć `p6_zloza_basket_gen.mjs` o rejestrujący harness stanu i wygenerować wektory z pinu dla czterech gałęzi. Pozostałe gałęzie zostają NIE_ZMIERZONO (Z3, Z5).

### Z7. Równoważność normalizacji i pin-wrappera nie zmierzona — ODRZUCAM w części, PRZYJMUJĘ w części
Zmierzone w tej rundzie:
- Zbiór surowców o kroku 10: pin `HANDEL_SUROWCE_KROK10` (`diplomacy-value-catalog.ts:309-312`) i Rust `STEP_TEN_RESOURCES` (`diplomacy.rs:1932-1946`) mają te same 13 kluczy (drewno, glina, kamien, ruda, ruda_zelaza, ruda_cyny, cegla, sol, kon, ceramika, braz, zelazo, stal).
- Logika: pin `!(capped>0)→0`, `krok<=1 → floor(capped)`, inaczej `floor(capped/krok)*krok`; Rust `normalize_resource_quantity(_, requested, None)`: `!finite→0`, `capped<=0→0`, `floor(capped/step)*step`. Dla `max = undefined` są równoważne.
- Test `quantity_resource_floors_to_step_before_transfer` sprawdza 7.9 → 7 (krok 1 dla `zboze`).
NIE_ZMIERZONO w tej rundzie: normalizacja klucza (pin `trim().toLowerCase()` vs Rust `normalized_key`) dla kluczy z białymi znakami lub wielkimi literami; nie dodano testu na krok 10 (np. `zelazo`).

### Z8. STATUS=BLOCK bez kodu po rundzie 1 — PRZYJMUJĘ
Zgoda, że BLOCK bez kodu nie był decyzją właściciela ani ABC. Ta runda zawiera kod i testy dla realnie portowalnych gałęzi. Pytań ABC nie zgłaszam.

## ZMIANY/COMMIT
- `rust-port/engine/src/domain/diplomacy_basket.rs`: nowa sygnatura `transfer_basket_items` i `BasketTransferState`; gałęzie `tech`, `surowiec_boolean`, `surowiec_ilosc`, `praca`; `zloze` bez zmian logiki.
- `rust-port/engine/tests/p6_zloza_basket.rs`: aktualizacja wywołań do nowej sygnatury; nowe testy (tech, boolean, ilosc, praca z clampem i skalą, from==to, miasto nie deserializuje, rozszerzony `skipped_kinds`).
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-ZLOZA-B-REST-Q1/02a-obrona.md`: ten raport.
- Nie zmieniano: `diplomacy.rs`, `city_growth.rs`, `playable.rs`, `gra/**`, `Cargo.toml`, `Cargo.lock` (untracked, nie commitowany), `vectors.json`, `p6_zloza_basket_gen.mjs`.

## TESTY
- `cargo fmt -- --check`: EXIT=0
- `cargo clippy --all-targets -- -D warnings`: EXIT=0 (bez ostrzeżeń)
- `cargo test --test p6_zloza_basket`: 12 passed / 0 failed / 0 ignored (EXIT=0)
- Pełny `cargo test --no-fail-fast` (crate civ-engine): EXIT=0, suma 3308 passed / 0 failed / 1 ignored. Baseline 0ca58770e (3284/0/1 z dispatchu) NIE_ZMIERZONO ponownie na tym samym checkoucie; różnica liczby testów nie została rozliczona.

## BLOKADY
- Wektory pinu dla tech, surowiec_boolean, surowiec_ilosc, praca: NIE_ZROBIONE (Z6).
- zywnosc: NIE_ZMIERZONO, brak zapisu `OwnerFoodStates` poza allowlistą (Z3).
- zloto: NIE_ZMIERZONO, brak stanu jednorazowego transferu złota (Z5).
- miasto: NIE_ZMIERZONO, brak `BasketItemKind` dla miasta i `transfer_city_by_treaty` (Z5).
- tech dla gracza 0: efekty `zbadane` i epoki poza portem (raport w `unported_side_effects`).
- jednostka: no-op zgodnie z pinem (TODO A1).

## RUNDY
2/5 (poprzednia: 1/5, BLOCK bez kodu)

## NASTĘPNY KROK
Evaluator r2: weryfikacja testów wrappera względem helperów Rust i dowodów NIE_ZMIERZONO (Z3, Z5). Przed FC: wektory pinu dla czterech gałęzi (Z6), jeśli właściciel zleci je w tym temacie; w przeciwnym razie osobny temat r3.

## DEPLOY/PUSH
NIE WYKONANO (Operator nie pushuje; push tylko na wip/*, bez parity-v2).
