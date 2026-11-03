# P6 — źródła stanu ticku ekonomii (R-RUSTPORT-P6-ECON-TICK-STATE-SOURCES-Q1)

Pin weba `4bbef081d`, baza Rust `a262bd553`. Dług -Q7 pkt 3 z `P6-ADVANCE-CITY-ECONOMY-Q6.md` sek. 8 i sek. 9.
Zasada właściciela: port 1:1; odstępstwo = ZAŁOŻENIE do akceptacji.

## 1. Tabela: wejście -> web -> Rust -> status

| Wejście `run_economy_tick_for_game` | Web (plik:linia) | Rust (stan przed) | Rust (po) | Status |
|---|---|---|---|---|
| `ownerCivMap` | `main.ts:34435-34440` (+ `:1828`, `:8395`) | brak | `turn_economy_inputs_civ::build_owner_civ_map` | ZAPORTOWANE |
| `orderMultMap` | zapis `main.ts:35789` (`orderEffectsToYieldMults`), pętla porządku `:35400-35800` | `types::order_effects_to_yield_mults`, `society_breakdown::order::*` (tylko człony); brak pętli per miasto | bez zmian | DŁUG (sek. 3) |
| `ownerDefaultPodzialHandlu` | `:5516-5540`, `:5655-5680`, `empire-handel-split.ts:82` | `default_podzial_handlu`, `ai_fixed_procent_nauki` | `turn_economy_inputs_podzial::{init_owner_default_podzial_handlu, seed_city_owner_defaults_podzial}` | ZAPORTOWANE |
| `ownerDefaultPodzialPracy` | `:5548-5590`, `:5655-5680`, `empire-city-defaults.ts:182` | `fresh_owner_default_podzial_pracy`, `ai_fixed_procent_budynki` | `..._podzial::{init_owner_default_podzial_pracy, seed_...}` | ZAPORTOWANE |
| `placedImprovementsForOwner` | `:5030-5050` (+ `buildAllTerritoryNodes :4991-5003`) | `territory::territory_owner_at` | `turn_economy_inputs_native::{build_all_territory_nodes, placed_improvements_for_owner}` | ZAPORTOWANE |
| `empireActiveResourceLabelsForOwner` | `:3234-3258` | `active_access::get_city_resource_access_for_city` (8H2) | `..._native::empire_active_resource_labels_for_owner` | ZAPORTOWANE |
| `ownerHasNativeResourceAccess` braz/żelazo/cegła/złoto/koń | `:5088-5121`, `:5071-5080` | `empire_has_kopalnia_miedzi`, `..._na_zlozu_zelaza`, `empire_has_kopalnia_zlota`, `compute_empire_livestock_unlocks` | `..._native::{owner_has_native_resource_access, empire_has_glinianka}` | ZAPORTOWANE |
| `computeTradeRouteResourceGrants` (wywołanie) | `:5125` | `trade::compute_trade_route_resource_grants` (TRADE-INCOME-PIN) | `..._native::recompute_trade_route_resource_grants` | ZAPORTOWANE |
| `ownerHasZlotoAccessNow` (natywny OR grant) | `:5180-5184` | `owner_has_zloto_stock` (zapas liczy wiązanie) | `..._native::owner_native_or_trade_zloto_access`, `StateSources::native_zloto_access` | ZAPORTOWANE (dług Q6 sek. 9 „natywny dostęp do złota / grant z trasy” DOMKNIĘTY) |
| `computeEmpireLivestockUnlocks` | `livestock-unlock.ts:113` | `active_access::compute_empire_livestock_unlocks` | reużyte w gałęzi `kon` | ISTNIAŁO |
| `placed_improvements_with_zloto_trade_grant` (dług 8H2) | `zloto-access.ts` (@deprecated, no-op) | `resource_access.rs:266` (no-op 1:1) | bez zmian | ISTNIAŁO, brak potrzeby portu |
| `fortTerritoryNodes(fortNodes)` | `:5001` | `fort_territory.rs` | wejście wołającego (`extra_territory_nodes`) | ZAŁOŻENIE Z-SS-1 |

## 2. Wiązanie

`StateSources::new(world, routes, owner_era, border_radius)` liczy granty raz (jak `recomputeTradeRouteResourceGrants` zaraz po
odświeżeniu tras), a `native_zloto_access(o)` i `empire_active_labels(o)` to dokładnie wejścia `GameEconomyContext`
(`&|o| src.native_zloto_access(o)`). `turn_economy_wire.rs` NIE zmieniony (pole kontekstu już były closure).

## 3. Dług z dowodem

* `orderMultMap`: mapa jest PRODUKTEM pętli porządku publicznego (`main.ts:35400-35800`) liczonej PO ticku z `econTick`
  (`wealthZadowolenie`, `garncarniaSurplusZadowolenie`, `maSpichlerz*`), `citizenUpkeepDrainForOwner` (mutuje magazyn),
  `lawGarrisonCountForCity`, mieszanki kultury/religii, `isOwnerAtWar`, `rng()` (bunt) i `orderEffectsWithCivMatrix`.
  `grep -rn "fn order_effects_with_civ_matrix\|fn citizen_upkeep_drain\|fn law_garrison" rust-port/engine/src` = 0.
  Port bez wektorów byłby nieweryfikowalny. Proponowany osobny temat `R-RUSTPORT-P6-ECON-TICK-ORDER-LANE-Q1`.
  Do tego czasu wołający podaje `order_mult_by_city` (puste = `orderMultMap.get(id) ?? null`, jak web w turze 1).
* `fortTerritoryNodes`/stan fortów i `city.kultura` (pole dynamiczne): wejścia wołającego (Z-SS-1, Z-SS-2).

## 4. Znalezisko 1:1 (do wiadomości właściciela)

`ownerHasNativeResourceAccess(.,'zelazo')` w webie jest ZAWSZE `false`: `main.ts:5107` wywołuje `hasZelazoAccess(hasKopalniaZelazo, ...)`
z `boolean` w miejscu `empireStock`; `zelazo-access.ts` (`hasZelazoAccess`) traktuje `boolean` jak brak zapasu => `hasStock=false`.
Skutek: grant z trasy na żelazo nigdy nie powstaje. Port odtwarza to literalnie (nie „naprawia”); decyzja o poprawce webu poza zakresem.

## 5. Założenia (do akceptacji)

* Z-SS-1 stan fortów (`extra_territory_nodes`) podaje wołający. Z-SS-2 `city.kultura` -> `kultura_by_city` (brak = 0).
* Z-SS-3 `hex.wlasciciel` -> `hex_owners` (`BuildHex` nie ma pola). Z-SS-4 epoka całkowita (`Math.max(1, Math.min(10, era))`, `main.ts:2218`).
* Z-SS-5 `border_radius` wstrzykiwane (jak Z2 w `active_access.rs`); w testach tabela z uruchomionego `cityBorderRadius`.
* Z-SS-6 `isHuman` i `aiStartHexes` dostarcza wołający. Z-SS-7 `PlayerId` jest bez znaku: owner ujemny nie ma grantu z trasy
  (trasy tworzone tylko dla ownerów >= 0), gałąź `owner_id >= 0`.
* Z-SS-8 generator przepisuje sklejkę `main.ts` (zamknięcia, nieimportowalne); funkcje modułowe (territory, braz/zelazo/zloto-access,
  livestock-unlock, trade-routes, resource-access, cities, empire-*) uruchamiane są z pinu.
* Z-SS-9 e2e: tick ze źródłami Rust == tick z wartościami wejść policzonymi przez web; samo wiązanie == web bit-w-bit (Q6).
  Dowód składany, nie jeden przebieg weba przez cały `main.ts` (nieuruchamialny bez DOM).

## 6. Dowody

* Wektory: `tests/p6_state_src_vectors/state_src.json` (4,8 MB; 260 scenariuszy natywnych, 120 civ, 80 podział), generator
  `runs/.../gen-p6-state-src-vectors.mjs` (czysty `git archive 4bbef081d`, esbuild w `/dev/shm`, zero buildu w `gra/`).
* Test: `tests/p6_state_src.rs` 4/4. Weryfikator `verify-p6-state-src.py` (`python3 -I`): 9684 sprawdzeń, 0 rozbieżności; kontrola
  negatywna 2/2 wykryta.
* Mutacje: 36, zabitych 32, równoważnych 4, brutto 88,9%, netto 100%. Równoważne z dowodem:
  [06] zelazo bez bramki kopalni — wynik i tak `false` (sek. 4, `zelazo-access.ts` `hasZelazoAccess`);
  [20] epoka etykiet = 1 i [24] epoka ownera 0 — `era` wchodzi tylko do `collect_deposit_potential` (`active_access.rs:466`), pole `active` go nie czyta (`resource-access.ts:330-343`);
  [22] `built_ids: None` — `built_ids` czytane wyłącznie przy `empire_stock` (`active_access.rs:443`), tu `None`.
* Bramki: `gate-fmt.txt`, `gate-clippy.txt` (`-D warnings`), `gate-test-full.txt` 2072/0 w 8 shardach (baza 2068 + 4).
