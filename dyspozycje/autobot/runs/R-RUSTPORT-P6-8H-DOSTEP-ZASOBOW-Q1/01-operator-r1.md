# R-RUSTPORT-P6-8H-DOSTEP-ZASOBOW-Q1 - Operator (impl), runda 1/5, partia A

STATUS: PASS-WITH-NOTES (partia A zamknieta; reszta tematu 8H otwarta, patrz BLOKADY)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-8H-DOSTEP-ZASOBOW-Q1
GOAL: port `zloto-access.ts`, `cyna-access.ts`, `zelazo-access.ts`, `society-inputs.ts` i `resource-access.ts` do `rust-port/engine/src/domain/resource_access.rs`. W TEJ RUNDZIE: pelne zloto/cyna/zelazo (P2 w calosci + cyna P1 w calosci), pomocniki kultury miasta z society-inputs (P1, 5 funkcji) oraz `improvementKeysOnPlacedHex`.

## ZMIANY / COMMIT

- BAZA: `origin/rust-port/parity-v2` @ `74b81339e` (zawiera 8A, 8D, 8F, 8G, 8J). Worktree startowal z `7164f7ca1` (bez 8G) - przelaczony na baze (ZALOZENIE Z-1).
- Branch lokalny: `op-R-RUSTPORT-P6-8H-DOSTEP-ZASOBOW-Q1` (bez push).
- COMMIT KODU: `3b332b80eb4a98614beb0ce3b38d8801ad74afcd` - `feat(rust-port): P6.8H partia A ...`
- COMMIT RAPORTU: patrz wiadomosc koncowa orkiestratora (raport nie moze zawierac wlasnego SHA).
- ALLOWLISTA uzyta:
  - NOWE: `rust-port/engine/src/domain/resource_access.rs` (~300 LOC), `rust-port/engine/tests/p6_8h_access.rs`, `rust-port/engine/tests/p6_8h_vectors/{zloto,cyna,zelazo,society}.json`, run `dyspozycje/autobot/runs/R-RUSTPORT-P6-8H-DOSTEP-ZASOBOW-Q1/**`.
  - ZMIENIONE: `rust-port/engine/src/domain/mod.rs` (dopisek `pub mod resource_access;`), `rust-port/engine/src/domain/building_costs.rs` (jedno slowo: `fn empire_zloto_stock` -> `pub fn`, zloto `:913`; logika bez zmian).
- NIE ZMIENIANO: `state.rs` (society-inputs `:544-581`), `economy_society.rs`, `gra/**`, `renderer/**`, `src-tauri/**`, `Cargo.toml`, `WERSJE.md`, `domain/mapgen/**`.
- Pliki spoza allowlisty: brak (Cargo.lock wygenerowany przez cargo usuniety przed commitem).

## TABELA SYMBOLI (partia A, stan po R1)

Dokument tematu `dyspozycje/rust-port/p6/P6-8-MIASTA-PODZIAL.md` NIE istnieje na `parity-v2` ani na galezi zlecenia (ZALOZENIE Z-2). Tabela ponizej zastepuje aktualizacje dokumentu; zrodlo wierszy: §11 z commitu `6c4f2b1fa` (galaz `backup/unpushed/keep_p68-rekon-final`).

P2 (21 sym.):

| symbol web | status | Rust |
|---|---|---|
| zelazo `improvementKeysOnPlaced` (prywatna) | PORT (posrednio) | `keys_with_legacy_migration` (przez `empire_has_kopalnia_na_zlozu_zelaza`) |
| zelazo `ZlozeHexMapLike` (typ) | PORT | `HexZlozeMap` |
| zelazo `isKopalniaZelazaKey` | PORT (inline) | porownanie `key == KOPALNIA_ZELAZA_KEY` (ZALOZENIE Z-4) |
| zelazo `empireHasKopalniaNaZlozuZelaza` | PORT | `empire_has_kopalnia_na_zlozu_zelaza` |
| zelazo `cityHasOdlewniaZelaza` | PORT | `city_has_odlewnia_zelaza` |
| zelazo `hasZelazoAccess` | PORT | `has_zelazo_access` |
| zloto `KOPALNIA_ZLOTA_KEY` | PORT | const |
| zloto `ZLOTO_STOCK_KEY` | PORT | const |
| zloto `ZLOTO_LABEL` | PORT (const) | const; wywolujacy `building-resource-gate.ts` - NASTEPNA-PARTIA |
| zloto `KOPALNIA_ZLOTA_YIELD_PER_TURN` | PORT (const) | const; `git grep 91dc998a -- gra/src` pokazuje tylko definicje (brak importerow) |
| zloto `MENNICA_ZLOTO_DRAIN_PER_TURN` | PORT | const `MENNICA_ZLOTO_DRAIN_PER_TURN` |
| zloto `improvementKeysOnPlaced` (prywatna) | PORT (posrednio) | `keys_normalized_only` (przez `count_kopalnie_zlota`) |
| zloto `countKopalnieZlota` | PORT | `count_kopalnie_zlota` |
| zloto `empireHasKopalniaZlota` | PORT | `empire_has_kopalnia_zlota` |
| zloto `empireZlotoStock` | REUZYCIE | `building_costs::p6_7b::empire_zloto_stock` (teraz `pub`) |
| zloto `ownerHasZlotoStock` | PORT | `owner_has_zloto_stock` |
| zloto `ownerCanFeedMennica` | REUZYCIE | `building_costs::p6_7b::owner_can_feed_mennica` |
| zloto `resolveOwnerZlotoFromStock` | PORT | `resolve_owner_zloto_from_stock` |
| zloto `deductMennicaZlotoDrain` | PORT | `deduct_mennica_zloto_drain` |
| zloto `TRADE_GRANT_ZLOTO_SYNTHETIC_KEY` | PORT (const) | const |
| zloto `placedImprovementsWithZlotoTradeGrant` | PORT (no-op) | `placed_improvements_with_zloto_trade_grant`; wywolujacy w webie (main.ts) NIE sprawdzony w tej rundzie - NASTEPNA-PARTIA |

P1 (51 sym.), w tej rundzie:

| symbol web | status |
|---|---|
| cyna: `KOPALNIA_CYNY_KEY`, `ZLOZE_CYNY_KEY`, `improvementKeysOnPlaced`, `ZlozeHexMapLike`, `isKopalniaCynyKey`, `empireHasKopalniaNaZlozuCyny`, `cityHasOdlewniaForCyna`, `hasCynaAccess` | PORT (8/8; `isKopalniaCynyKey` inline, Z-4) |
| society-inputs: `resolveOwnCultureShare`, `cityCultureMixActive`, `clearCityCultureMix`, `CultureMixLine`, `cultureMixBreakdown` | PORT (5/5) |
| resource-access: `improvementKeysOnPlacedHex` | PORT (`keys_normalized_only`); funkcja prywatna w webie, bez wlasnego wektora (pokrycie posrednie przez ta sama logike w zloto) |

NASTEPNA-PARTIA (otwarte, bez zmian w kodzie):
- resource-access.ts (P1, ok. 24 sym.): `HexZloze`, `parseSurowiecOdblokowany`, etykiety (`labelForHex`, `hexDepositDisplayLabel`, `hexHiddenDepositHint`, `labelsForImprovementUnlock`, `labelsForKopalniaMiedziOnHex`, `activeLabelsForImprovementOnHex`, `sortLabels`, `filterCityPanelRangeLabels`), `improvementUnlockActiveOnHex` (wymaga `improvement_build::deposit_allows_player_improvement`, istnieje), `hexesInCitySight` (`territory::city_sight_radius`, `improvement_build::hex_keys_within_radius`, istnieja), `collectDepositPotential`, `collectActiveAccess` (wymaga `braz-access`: Rust `start_position::has_braz_access`, do weryfikacji; `livestock-unlock`: brak portu w Rust - sprawdzic `grep`), `getCityResourceAccessForCity`, `getResourceAccessForCity`.
- society-inputs.ts: `isForeignReligionDominant` (wymaga `dominantReligion`), `isPlayerCapitalCity` i `stolicaEasyBonusActive` (wymagaja `cityFoundOrder`/stolicy).
- Wywolujacy `clearCityCultureMix` w webie: `conquest-stability.ts` (grep pinu) - wiring poza zakresem tej partii.
- `ZLOTO_LABEL`: wywolujacy `building-resource-gate.ts` - poza zakresem.

## TESTY (dokladne wyniki, pin 91dc998a)

- Wektory: `gen-p6-8h-access-vectors.mjs` uruchomiony na `git archive 91dc998a gra/src gra/data` (Node 22, loader `repin-b-loader-register/hooks.mjs` z runu 8A; `three@0.169.0` podlinkowany tylko dla lancucha `resource-access.ts`, ktorego ten run jeszcze nie portuje). Wynik: `EXIT=0`. Liczba przypadkow: zloto 154 wpisy `out`, cyna 221, zelazo 221, society 78.
- `gate-cargo-test-p6-8h-access.txt`: 11/11 passed, `EXIT=0`.
- `gate-clippy-all-targets.txt`: `cargo clippy --all-targets -- -D warnings`, `EXIT=0`.
- `gate-cargo-test-full-engine.txt`: pelny `cargo test` silnika: 252 binarek `test result: ok`, brak FAILED, `EXIT=0`.
- `git diff --cached --check`: `EXIT=0` (przed commitem kodu).
- Build: `CARGO_TARGET_DIR=/dev/shm/p6-8h-target CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`; zadnych buildow `gra/`.

## MUTACJE (kontrola galezi sterujacych)

Runner: `mutacje/run.py` (podmienia jeden `old` -> `new` w `resource_access.rs`, odpala `cargo test --test p6_8h_access`, przywraca plik). Pliki wynikow: `mutacje/wynik-1-bazowy-przed-zmiana-clamp.txt` (M01-M38; M25/M26 z poprzedniej wersji `js_clamp_unit`), `mutacje/wynik-2-clamp-M25-M26-finalny.txt` (M25/M26 dla finalnej wersji `x.clamp(0.0, 1.0)`).

Wynik koncowy: 38 mutantow, 34 zabite, 4 przezyte - wszystkie 4 z dowodem rownowaznosci:
- M03 (cyna: usuniety strazak `placed.is_empty()`): `any()` na pustej kolekcji daje `false`, wiec strazak jest zbedny.
- M30 (`foreign_pct <= 0.0` -> `< 0.0`): roznica tylko dla `foreign == 0`; wtedy obie sciezki daja jedna linie wlasciciela `pct 100` (brak linii obcej, bo `0 > 0` jest falszem).
- M32 (usuniety filtr `!key.is_empty()`): pusty klucz nigdy nie rowna sie zadnej stalej porownania (wszystkie niepuste), wiec predykaty sa bez zmian.
- M33 (usuniety fallback `migrate_legacy_kopalnia_key`): dla `hex=None` migracja zwraca `raw` albo `kopalnia_miedzi`; zadna z tych wartosci nie rowna sie `kopalnia_cyny`/`kopalnia_zelaza`, a katalogowe klucze normalizuja sie same (wektor `cynaNaZlozu` przezyl mutanta).

Zabite (kluczowe): zamiana `==`/`!=` na bramkach zloza (M01, M12), zamiana kluczy kopalni (M02, M15), usuniecie galezi legacy `kopalnia` (M13, M14), progi `> 0` -> `>= 0` dla stocku cyny, zelaza i zlota (M08, M11, M17, M18; wektory brzegowe `ruda_cyny`/`zelazo` 0, 0.5, 1, NaN, Infinity, -1), usuniecie `None =>` w `has_*_access` (M06, M37), `||`/`&&` (M07, M10), odwrocenie resolvera laski (M19, M38), progi i odejmowanie `deductMennicaZlotoDrain` (M20-M22), NaN i clamp udzialu kultury (M23-M26), `is_some` vs `&&` dla pol kultury (M27), usuniecie czyszczenia pol (M28), galezie `cultureMixBreakdown` (M29, M31), `.trim()`/`.to_lowercase()` na zlozu (M35, M36), filtr `kopalnia_zlota` (M16), prefiksy kluczy migracji (M34).

Brzegi N-1/N/N+1 (progi): stock 0 / 0.5 / 1 / -1 dla `ruda_cyny` i `zelazo` (wektory cynaZero/cynaUlamek/cynaJeden/cynaMinus, zelazoZero/Ulamek/Jeden); zloto 0 / 0.5 / 1 / 2 (zloto0/zloto05/zloto1/zloto2) dla `MENNICA_ZLOTO_DRAIN_PER_TURN = 1`; udzial kultury 0 / 0.0049 / 0.125 / 0.9951 / 1 / 1.5 / -0.5 (SHARES).

NaN / brakujace klucze: `NaN`, `Infinity`, `-Infinity` w stocku i w udziale kultury; `undefined`/`null` dla `ownCultureShare`/`kulturaOwnShare`; brak klucza `zloto`/`ruda_cyny` w stocku; `null` jako mapa heksow i placedImprovements.

## ZALOZENIA (luki rozstrzygniete w dokumencie, nie pytania)

- Z-1: baza = `origin/rust-port/parity-v2` (74b81339e); worktree przelaczony (detached, potem branch lokalny). Brak push.
- Z-2: dokument tematu P6-8 nieobecny w drzewie baz; uzyto kopii z `6c4f2b1fa`; aktualizacja tabeli wykonana w tym raporcie.
- Z-3: legacy `boolean` jako `empireStock` (galaz `typeof === 'boolean'` w TS) = `None` w Rust (ten sam wynik: brak stocku).
- Z-4: `isKopalniaCynyKey`/`isKopalniaZelazaKey` (jednolinijkowe prywatne predykaty) zrealizowane inline; zachowanie identyczne, osobny symbol nie jest potrzebny do wektorow.
- Z-5: `map` w `empireHasKopalniaNaZlozu*` podawany jako `HexZlozeMap` (= `map.hexes`); `null` mapy = `None`. Wektor generator opakowuje hexy w `{hexes: ...}` (poprawka R1, patrz generator).
- Z-6 (ryzyko resztkowe, bez wektora): JS `String.prototype.trim` usuwa U+FEFF, Rust `str::trim` nie. Pole `zloze` w danych mapy nie zawiera BOM; nie testowane.
- Z-7: `-0` vs `+0` z `Math.min/max` w clampie udzialu kultury: porownania `==` i wynik liczbowy identyczne; nie rozrozniane.

## RUNDY

1/5 (Operator-impl). Brak FAIL/BLOCK w tej rundzie.

## NASTEPNY KROK

Operator r2 / kolejna partia 8H-P1b: `resource-access.ts` (etykiety, `collectActiveAccess`, `getCityResourceAccessForCity`, `getResourceAccessForCity`) i pozostale funkcje `society-inputs.ts` (religia, stolica), wraz z wektorami z pinu 91dc998a, mutacjami i przeglad wywolujacych (`building-resource-gate.ts`, `turn-economy.ts`, `conquest-stability.ts`, `main.ts`). Potem bramki: `cargo clippy --all-targets -- -D warnings`, pelny `cargo test`, `git diff --check`.

## DEPLOY/PUSH: NIE WYKONANO
