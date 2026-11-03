# P6-DYPL-1 — Dyplomacja: rozejm, blokada pokoju, flaga agresora, casus belli, zobowiązania sojusznicze

Temat: `R-RUSTPORT-P6-DYPLOMACJA-TRUCE-AGRESOR-Q1` (nr 1 z `DYPLOMACJA-PODZIAL-AUDYT.md`). Baza: `origin/rust-port/parity-v2` `c0e8ee7d5`. Pin weba: `4bbef081d`. Zakres: czyste funkcje i serializowalny stan, bez podpięcia do `session.rs` / `diplomacy.rs`.

## 1. Mapowanie web -> Rust (100%)

| Web (pin) | Rust (`rust-port/engine/src/domain/`) |
|---|---|
| `diplomacy-peace-lock.ts:11,14,27,44` | `diplomacy_truce.rs`: `PEACE_TREATY_LOCK_TURNS`, `is_peace_treaty_locked`, `start_peace_treaty_lock`, `filter_alliance_obligations_respecting_peace_lock` |
| `diplomacy-peace-lock.ts:67-105` | `diplomacy_truce.rs`: `TRUCE_DURATION_OPTIONS`, `TRUCE_DEFAULT_TURNS`, `normalize_truce_duration`, `truce_until_turn`, `is_truce_active`, `truce_expiry_action`, `is_truce_breach` |
| `diplomacy-pn-engine.ts:69-103` (`DiploPairMeta`), `main.ts:33540` (zapis) | `diplomacy_truce.rs`: `PairMetaWeb` (serde camelCase, `extra` przechodnie), `N3Window`, `pair_meta_to_save`, `pair_meta_from_save` |
| `diplomacy-war-gates.ts:11-56` | `diplomacy_war_gates.rs` |
| `alliance-war-obligation.ts:7-57` | `alliance_war_obligation.rs`: `should_honor_alliance_war_obligation` |
| `diplomacy-treaties.ts:168-266,305,346,362,380,405` | `alliance_war_obligation.rs`: `alliance_obligations`, `alliance_obligations_for_war_declaration`, `is_defensive_alliance_war_obligation`, `treaties_broken_by_refusal`, `treaties_broken_by_war` |
| `diplomacy.ts:1791-1958`, `diplomacy-aggressor-params.json` | `diplomacy_aggressor.rs` + `data/derived/diplomacy-aggressor-params.json` (kopia z pinu, `cmp` zgodna) |
| `main.ts:33615-33616` / `:42525-42526` (zapis/odczyt `aggressorFlagUntilByOwner`, `casusBelliUntilByPair`) | `AggressorEngineState::{to_save_meta, from_save_meta}` |

## 2. Duplikat `is_currency_proposal_forbidden_during_war` (`diplomacy.rs:2726`) — rozstrzygnięcie

Reużycie 1:1 NIE jest możliwe bez edycji `diplomacy.rs` (poza allowlistą). Istniejąca funkcja różni się od pinu trzema punktami, zmierzonymi testem `war_gates_existing_rust_gate_diverges_from_pin`: (1) wymaga `is_finite()` dla `goldOnce`/`goldPerTurn` (web: `Infinity > 0`), (2) wymaga `quantity > 0` dla pozycji złoto/praca (web: liczy się tylko `typ`), (3) `ProposalAction` nie ma wariantu `rozejm` (web od `war-gates.ts:11` zezwala na walutę w rozejmie). Decyzja: nowy `diplomacy_war_gates.rs` jest wierny pinowi; stary zostaje dla `diplomacy.rs:3182`; test różnicowy dokumentuje zgodność na typowych wejściach i trzy rozbieżności. DŁUG: temat `POKOJ-ROZEJM-CESJA` przepina `evaluate_proposal` na nową funkcję (to zmienia zachowanie istniejących ścieżek, więc wymaga decyzji o repinie, nie jest robione tu).

## 3. ZAŁOŻENIA

* Z-D1-1: liczby weba = `f64` (NaN/Infinity/porównania JS zachowane); `number | null | undefined` = `Option<f64>`; wejście typu `number` z `null` (np. `lockTurns`, `trustToRequestingAlly`) nie jest modelowane (sygnatura weba tego nie dopuszcza).
* Z-D1-2: `DiploPairMeta` w `diplomacy.rs:1190` ma 2 pola i jest `Copy`; stan pary rozejmu/pokoju to NOWY `PairMetaWeb` (spread `{...meta}` odtworzony przez `#[serde(flatten)] extra`). Włączenie go do `session`/`state` — poza zakresem.
* Z-D1-3: singleton weba (`stanAgresorow`, `stanCasusBelli`) = wartość `AggressorEngineState` trzymana przez wywołującego.
* Z-D1-4: `ownerId`/`turn` w flagach agresora to `f64` (web: `Number.isFinite`), klucz mapy = `js_number_to_string` (zgodność z `String(n)` pokryta wektorami `agg.key`: całkowite, 1.5, NaN, ±Infinity, -0, 1e21).
* Z-D1-5: traktaty używają typów Rust `ActiveDeal`/`TreatyKind`/`PlayerId(u64)`. `TreatyKind` ma `Vassalization` (alias `wasal`, `diplomacy.rs:1372`; wektory generatora zawierają `wasalizacja`) — wasalizacja słusznie NIE jest w `breaks_on_war`; `rozejm` nie istnieje w `TreatyKind`, nie zrywa się wojną i nie jest sojuszem, więc wynik jest taki sam; `umowa_handlowa` = alias `umowa_szlakow` (oba w `BREAK_ON_WAR`). Pary w wektorach są kanoniczne (web: po `hydrateActiveDeals`).
* Z-D1-6: `actionId` = `&str`; `BasketItem` zredukowany do `typ`; `atWar = true` = `Option<bool>` (`None` -> `true`).
* Z-D1-7: pliki traktatów (`diplomacy-treaties.ts`) są portowane do `alliance_war_obligation.rs` (allowlista nie ma osobnego modułu traktatów).
* Z-D1-8: wektory `honor` nie obejmują `trustToRequestingAlly = null` (w JS `null < 20` = true, odmowa; w Rust `None` = brak warunku) — wejście spoza sygnatury `number | undefined`.
* Z-D1-9: `pair_meta_from_save` pomija parę, której meta nie pasuje do typów `PairMetaWeb` (np. `trustPnGainedThisTurn: null` z zapisu NaN, `n3Window` bez `turn`); web wczytuje meta dosłownie bez walidacji (`main.ts:42872-42875`). ZAŁOŻENIE: zapis z NaN/null w polach liczbowych jest poza kontraktem 1:1 tego tematu (JSON nie koduje NaN); odporność na takie zapisy należy do tematu podpięcia stanu pary do `session`/`state`.
* Z-D1-10: duplikat bramki walutowej — `diplomacy_war_gates::is_currency_proposal_forbidden_during_war` (wierna pinowi) współistnieje ze starą funkcją `diplomacy.rs:2726` (używana w `diplomacy.rs:3182`; różni się: `is_finite`, `quantity > 0`, brak `rozejm`). Edycja `diplomacy.rs` jest poza allowlistą; dług przepięcia `evaluate_proposal` przypisany tematowi `POKOJ-ROZEJM-CESJA`, do akceptacji orkiestratora.
* Z-D1-11: baza PRZED (2093/0) przyjęta z audytu podziału jako ZAŁOŻENIE; PO = 2106 (+13 nowych) + 1 test z tej rundy = 2107, zero zmian istniejących testów.

## 4. Dowody

* Wektory z URUCHOMIONEGO weba (esbuild `git archive 4bbef081d`, zakaz buildu w `gra/`): 4 pliki JSON, 5,6 MB łącznie (każdy < 2,2 MB); ok. 27 tys. przypadków: wartości graniczne N-1/N/N+1 (blokada, rozejm 5/10/15, próg zaufania, próg siły), NaN, Infinity, `undefined`/`null`, sekwencje singletonu + zapis/odczyt.
* Test Rust `tests/p6_dyplomacja_truce_aggressor.rs`: 13 testów. Weryfikator `python3 -I` (`verify-p6-dypl1.py`): niezależny model JS, 117 208 sprawdzeń, 0 rozbieżności; kontrola negatywna (2 zepsute wyniki) -> 2 wykrycia.
* Mutacje (`mutate-dypl1.py`, `mutacje-wynik.txt`): 90 mutantów, 87 zabitych (96,7% brutto), 3 równoważne: #17 (`normalize_truce_duration`: `is_finite` zbędne, bo 5/10/15 są skończone, `contains` odrzuca NaN/Inf), #48 (martwa gałąź `kind != Def && != Full` po `is_alliance()`), #66 (`ustaw_flage_agresora`: `prev >= do_tury` vs `>`: przy równości wynik ten sam stan). Netto 100%.

## 5. Dług

* Brak podpięcia: `session.rs`/`state.rs` nie trzymają `AggressorEngineState` ani `PairMetaWeb` (kolejne tematy 3-5, 8, 10).
* Przepięcie `evaluate_proposal` na `diplomacy_war_gates` (patrz sek. 2).
