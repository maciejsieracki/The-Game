# P6-REPIN-EKONOMIA-D — dossier tematu (krok 4b, część D)

**Temat:** `R-RUSTPORT-REPIN-EKONOMIA-D-Q1` · **Rola:** Operator-impl
**Numeracja rund (jedna, ujednolicona w R3):** R1 = port work-tax `d0dfe1f89`; R2 = weryfikacja i mutacje `7ddd85a42`; **R3 = ten dokument i commity odpowiedzi na zarzuty Evaluatora R2** (ten sam ID, bez FAIL). Każde przejście Operatora tego ID to kolejna runda; limit 5.
**Baza:** `origin/rust-port/parity-v2` = `d961b14b4` (zawiera `84136f57` i `d961b14b`).
**Pin weba (cel):** `91dc998a5f1b51ad29e0f4785edfd45655445c53` · **Pin dotychczasowy:** `edb8fb56` (bez zmian w manifestach).
**Status tematu:** OTWARTY. Część D1 (`work-tax.ts`) PORTOWANA. Cel GOAL (cały REPIN krok 4b) NIEOSIĄGNIĘTY: `economy.ts` ma sklasyfikowane hunki, ale niezportowane.

## Odpowiedzi na zarzuty Evaluatora R2

| # | Zarzut | Odpowiedź | Dowód |
|---|---|---|---|
| 1 | `economy.ts` nieanalizowany, temat niezamknięty | **PRZYJMUJĘ** częściowo: klasyfikacja wszystkich 41 hunków `git diff -U0 edb8fb56 91dc998a -- gra/src/game/economy.ts` wykonana (sekcja „Klasyfikacja economy.ts"). Port hunków NIE wykonany w tej rundzie, temat zostaje otwarty z tym samym ID. | sekcja niżej; SHA commitu R3 w raporcie |
| 2 | Numeracja rund niespójna (`1/5` vs R2) | **PRZYJMUJĘ**: ujednolicono do schematu R1/R2/R3 (nagłówek i sekcja bramek). | nagłówek powyżej |
| 3 | Baseline 1272 NIE_ZMIERZONO | **PRZYJMUJĘ**: zmierzono na pełnym drzewie `d961b14b4` (czysty target): **1538 passed / 0 failed**, 212 wyników (w tym doc-tests). Log: `logs/baseline-d961b14b4-test-results.log`. Różnica: 1551 = 1538 + 13 testów `p6_repin_d_work_tax` (wszystkie 13 nowe). Liczba 1272 z dispatchu jest nieaktualna (nie odpowiada `d961b14b4`). | log baseline; 1551 − 13 = 1538 |
| 4 | Brak wektorów brzegowych (`-0`, 1e300, 2^53) w repo | **PRZYJMUJĘ**: dodano zatwierdzony podzbiór brzegowy `web-vectors-edge.json` (484 + 1024 + 22 przypadki) wygenerowany URUCHOMIENIEM weba 91dc998a, generator committed w `logs/gen-vectors-edge.mts`, test bit-w-bit `p6_repin_d_work_tax_edge.rs` (3 testy, porównanie `to_bits`, więc znak zera jest sprawdzany). | `tests/p6_repin_d_work_tax_edge.rs`; wynik testu w raporcie |

Uwaga do zarzutu 4: generator dla głównego `web-vectors.json` (zestaw 1600 + 529 + 90 + 9 + 20 + 96) nadal NIE jest w repo (pozostał w katalogu roboczym poza repo). Zapisane jako luka: zestaw brzegowy w repo zastępuje brakujący dowód na przypadki skrajne, główny zestaw pozostaje zamrożony i zweryfikowany przez `7904`-przypadkowy weryfikator R2. Dołączenie generatora głównego zestawu to zadanie na następną rundę.

## Tabela: zmiana → web → Rust → test → status (work-tax)

| Zmiana (web, pin 91dc998a) | Plik:linia weba | Plik:linia Rust | Test / wektor | Status |
|---|---|---|---|---|
| `WorkTaxConversion` (typ wyniku) | `gra/src/game/work-tax.ts:2-6` | `rust-port/engine/src/domain/work_tax.rs` (`struct WorkTaxConversion`) | `parity_convert_work_pool_to_tax`, `parity_execute_manual_work_tax_conversion` | PORTOWANE |
| `taxForWorkAmount` | `work-tax.ts:8-12` | `work_tax.rs` `tax_for_work_amount` | `parity_tax_for_work_amount` (529), `boundary_tax_floor_and_rate_defaults`, `edge_tax_for_work_amount_bitexact` (484) | PORTOWANE |
| `ownerCanConvertWorkToTax` | `work-tax.ts:14-24` | `work_tax.rs` `owner_can_convert_work_to_tax` | `parity_owner_can_convert_work_to_tax` (90), `structural_can_convert_requires_human_and_targowisko` | PORTOWANE |
| `serializePendingWorkTax` | `work-tax.ts:26-28` | `work_tax.rs` `serialize_pending_work_tax` | `parity_serialize_pending_work_tax` (9), `structural_serialize_then_restore_roundtrip`, `edge_serialize_pending_work_tax_bitexact` (22) | PORTOWANE |
| `restorePendingWorkTax` | `work-tax.ts:30-41` | `work_tax.rs` `restore_pending_work_tax` | `parity_restore_pending_work_tax` (20), `structural_restore_rejects_bad_rows_and_overwrites_in_place` | PORTOWANE |
| `convertWorkPoolToTax` | `work-tax.ts:43-58` | `work_tax.rs` `convert_work_pool_to_tax` | `parity_convert_work_pool_to_tax` (1600), `edge_convert_work_pool_to_tax_bitexact` (1024), `structural_*`, `boundary_pool_and_request_are_sanitized` | PORTOWANE |
| `executeManualWorkTaxConversion` | `work-tax.ts:60-77` | `work_tax.rs` `execute_manual_work_tax_conversion` + trait `WorkTaxDeps` | `parity_execute_manual_work_tax_conversion` (96, kolejność wywołań `set`/`tax`) | PORTOWANE |

Nowy plik `work-tax.ts` jest w całości nowy (status A w REPIN-DELTA §3, wiersz 65), więc każda linia jest zmianą behawioralną.

## Klasyfikacja economy.ts (R3, zarzut 1)

Źródło: `git diff -U0 edb8fb56 91dc998a -- gra/src/game/economy.ts` = **41 hunków**, `+116/−213`. Numery linii = strona NOWA (`91dc998a`), odczytane z `grep -n` dla kluczowych wierszy (L871-1018) i z nagłówków hunków dla pozostałych; dla hunków czysto usuniętych podano miejsce usunięcia w pliku nowym (zakres przybliżony ±2 linie). Klasyfikacja: **PORTOWANE** (nie dotyczy), **NIE-DOTYCZY** (komentarze/typy bez zachowania), **NASTĘPNA-PARTIA** (zmiana zachowania, do portu hunk po hunku w kolejnych rundach).

| Grupa hunków (linie weba) | Zmiana | Status | Uzasadnienie / Rust |
|---|---|---|---|
| L45 (import) | import `applyCivMatrixParam` | NIE-DOTYCZY | sam import; zachowanie w wierszach niżej |
| L149-166, L237 (`EconParams`, `loadEconParams`) | usunięty `targowiskoPracaMnoznik` (`targowisko_praca_na_pieniadz_mnoznik`); komentarze `mennicaMnoznikPoWalucie` | NASTĘPNA-PARTIA | usunięcie Efektu 2 (Targowisko+Waluta) — zmiana zachowania |
| L326-341 (`CityYieldResult`) | `pieniadzZPracy` = 0 (pole zdeprecjonowane); komentarze | NASTĘPNA-PARTIA | zerowanie pola to zmiana wyniku |
| L644-660 (`CityYieldContext`, `maMennica`/`walutaOdkryta`) | tylko komentarze, nowa definicja bramki Mint | NIE-DOTYCZY | opis; logika w wierszu „Mint" |
| L668-671 (`dochodTrasHandlowych` usunięty) | usunięte pole dochodu tras | NASTĘPNA-PARTIA | zmiana wejścia `handelBrutto` |
| L674-675 (`additionalTax`) | nowe pole: Praca przeliczona ręcznie na podatek, wchodzi do puli podatku | NASTĘPNA-PARTIA | połączenie z `work_tax.rs` (adapter „integracja w turze"); kluczowe dla Z-WT-5 |
| L683-690 (`walutaMnoznikOverride` usunięty) | usunięty override mnożnika Mennicy | NASTĘPNA-PARTIA | zmiana formuły Mint |
| L703-745 (`mnoznikHandelPieniadzForCiv`, `…ByDifficulty`, `civMatrixMnoznikHandelPieniadzRaw`) | fallback 2→1; civs.json nieczytany; zero z macierzy jest wartością (`Number.isFinite` zamiast `>0`) | NASTĘPNA-PARTIA | zmiana kontraktu funkcji (wektory `economy` potrzebne) |
| L782-806 (`civBonusyForCivKey`, `civEconomyYieldMultipliers`) | mnożniki z bonusów cywilizacji zawsze `{handel:1, nauka:1}` | NASTĘPNA-PARTIA | zmiana zachowania |
| L871-889 (Step 3': `pieniadzPortu`, `eko_pieniadz_port_proc`) | Port: pieniądz z portu × współczynnik cywilizacji, raz, przed mnożnikami | NASTĘPNA-PARTIA (częściowo istnieje) | Rust ma już odczyt tego klucza w `rust-port/engine/src/domain/city_growth.rs:2864-2876`; zgodność z 91dc998a wymaga porównania hunk po hunku |
| L901-902 (`pracaNetto`) | `applyCivMatrixParam(…, 'eko_praca_proc')`, zero neutralne | NASTĘPNA-PARTIA | nowy klucz macierzy, brak w Rust |
| L910-914 (`pieniadzZPracy = 0`, `handelBazowy` bez pracy) | usunięcie D5 (Praca→Handel u źródła) | NASTĘPNA-PARTIA | zmiana bazy Handlu |
| L919 (`civHandelMult`) | dla znanego właściciela macierz jest autorytatywna (także 0), legacy mnożnik tylko dla nieznanego | NASTĘPNA-PARTIA | zmiana zachowania |
| L933-936 (`eko_handel_brutto_proc`, `additionalTax`) | mnożnik brutto Handlu z macierzy; podatek z Pracy dodany PO mnożnikach tras | NASTĘPNA-PARTIA | jw. |
| L940-943 (`eko_korupcja_proc`) | korupcja z macierzy, cap `korupcjaCap` | NASTĘPNA-PARTIA | klucz macierzy brak w Rust |
| L946-947 (Mint) | `walutaMnoznikBase = params.mennicaMnoznikPoWalucie` (bez override) | NASTĘPNA-PARTIA | jw. |
| L964-965 (`eko_luksus_proc`) | luksus z macierzy | NASTĘPNA-PARTIA | klucz macierzy brak w Rust |
| L976-981 (`eko_nauka_proc`) | nauka lokalna z macierzy zamiast `civNaukaMult` | NASTĘPNA-PARTIA | klucz macierzy brak w Rust |
| L986-989 (`eko_pieniadz_proc`) | pieniądz końcowy z macierzy (Step 8) | NASTĘPNA-PARTIA | klucz macierzy brak w Rust |
| L1004-1005 (`eko_zywnosc_proc`) | żywność brutto z macierzy po Garncarni | NASTĘPNA-PARTIA | klucz macierzy brak w Rust |
| L1017-1018 (`eko_kultura_proc`) | kultura budynków z macierzy | NASTĘPNA-PARTIA | klucz macierzy brak w Rust |
| pozostałe hunki (komentarze Step 3/5/7/8, opisy pól) | tylko tekst | NIE-DOTYCZY | bez zachowania |

Wniosek R3: część `economy.ts` jest zakresem następnych rund (≈14 grup zmian zachowania; 8 nowych kluczy macierzy `eko_*`, z których w Rust istnieje tylko `eko_pieniadz_port_proc`). Klasyfikacja nie jest portem: żaden z tych hunków nie ma jeszcze kodu Rust ani wektora.

## Założenia (luki rozstrzygnięte ZAŁOŻENIEM)

- Z-WT-1: liczby JS → `f64`; `Number.isFinite` → `f64::is_finite`; identyfikatory właściciela → `f64` (zachowuje odrzucanie NaN/Infinity bez zakładania typu w silniku).
- Z-WT-2: `restorePendingWorkTax(unknown)` → `serde_json::Value`; liczba = `Value::Number`, reszta nie-liczba.
- Z-WT-3: `Map<number, number>` → `Vec<(f64, f64)>` w kolejności wstawiania; duplikat klucza nadpisuje wartość na istniejącej pozycji (jak `Map.set`).
- Z-WT-4: `deps` → trait `WorkTaxDeps` (lustro kontraktu zywej gry; adapter gry nie jest częścią tej partii).
- Z-WT-5: w tej partii NIE podpinano funkcji do silnika (brak wywołań w `state`/`session`); integracja z turą to osobna partia po `economy.ts` (`additionalTax`), bo web `work-tax.ts` nie ma wywołań turowych (`No turn automation lives here`).
- Z-WT-6 (R3): wektory brzegowe kodowane jako `{"f": String(x)}` (`-0` jako `"-0"`); Rust `f64::from_str` daje ten sam bit-pattern; wykluczono `serde_json` jako źródło liczb (liczby w edge nie przechodzą przez parser liczb JSON).

## Wektory

- `rust-port/engine/tests/p6_repin_d_work_tax_vectors/web-vectors.json` (≈317 KB, ≤10 MB): zestaw główny, zamrożony.
- `rust-port/engine/tests/p6_repin_d_work_tax_vectors/web-vectors-edge.json` (≈200 KB, R3): przypadki brzegowe `-0`, `±0.5`, `0.999999999`, `1.0000001`, `2.9999999999999996`, `±1e300`, `2^53`, `2^53+2`, `MAX_VALUE`, `MIN_VALUE`, `1.5e-300`, `129419.99999999999`, `0.1+0.2`, `±Infinity`, `NaN`. Kombinacje: tax 22×22=484, convert 8×8×8×2=1024, serialize 22 (mapy z kluczami z brzegów; duplikaty i `-0`/`+0` zgodnie z `Map`).
- Generator główny (1600/529/90/9/20/96 przypadków): URUCHOMIENIE `work-tax.ts` z `91dc998a` pod node 22 — poza repo; luka opisana w odpowiedzi na zarzut 4.
- Generator brzegowy: `logs/gen-vectors-edge.mts` (w repo, dowód odtwarzalności).
- Weryfikator niezależny R2 (7904 przypadki, poza repo): 0 rozbieżności.

## Mutacje

- M1 (R1): `candidate_tax > 0.0` → `>= 0.0` w `convert_work_pool_to_tax`: 3 testy padają. Zabite.
- M2..M7 (R2, na `d0dfe1f89`, jedna naraz, plik przywracany):
  - M2 `pool.min(request)` → `pool.max(request)`: 5 testów.
  - M3 `work_spent > 0.0` → `>= 0.0` w `execute_manual_work_tax_conversion`: 1 test.
  - M4 `amount > 0.0` → `>= 0.0` w `restore_pending_work_tax`: 2 testy.
  - M5 `is_human_owner` → `true` w `owner_can_convert_work_to_tax`: 2 testy.
  - M6 usunięty `.floor()` w `tax_for_work_amount`: 4 testy.
  - M7 `enabled` ignorowane w `convert_work_pool_to_tax`: 3 testy.
- M8 (R3, znak zera): `work.floor().max(0.0)` → `work.floor()` w `tax_for_work_amount`. Wynik: `edge_tax_for_work_amount_bitexact` pada (wejście `-0` daje `-0` zamiast `+0`), a także `boundary_tax_floor_and_rate_defaults` i `parity_tax_for_work_amount` z zestawu głównego. Zabite; `work_tax.rs` przywrócony (`git checkout`, `git diff --quiet` czysty). Log: `logs/mut-M8-negzero-edge.log`.
- M8+ (mutacje `economy.ts`): NIE_ZMIERZONO, bo kodu economy w Rust nie ma.

## Bramki (R3, na commicie z edge)

- `cargo fmt --all -- --check`: EXIT=0 (po `cargo fmt --all` na nowym pliku brzegowym).
- `cargo clippy --all-targets -- -D warnings`: EXIT=0 (czysty target po czyszczeniu).
- `cargo test --no-fail-fast` (rust-port/engine, czysty target): EXIT=0, **1554 passed / 0 failed**, 214 wyników (212 + 2 nowe pliki testów). Składnik: 1538 (baseline `d961b14b4`) + 13 (`p6_repin_d_work_tax`) + 3 (`p6_repin_d_work_tax_edge`).
- Baseline: `logs/baseline-d961b14b4-test-results.log` (1538/0, EXIT=0, pełne drzewo `d961b14b4` z `git archive`, czysty target).
- `git diff --check`: wykonany przed commitem R3 (wynik w raporcie).
- Log uruchomienia R3: `logs/test-r3-summary.log`.

## Kolejne partie (NASTĘPNA-PARTIA, ten sam ID)

1. `economy.ts` hunk po hunku wg klasyfikacji wyżej, po kolejności: (a) Mint i `walutaMnoznikOverride`, (b) `mnoznikHandelPieniadzForCiv` i `civEconomyYieldMultipliers`, (c) klucze `eko_*` w kolejności przepływu (praca, handel brutto, korupcja, luksus, nauka, pieniądz, żywność, kultura), (d) Step 3' port, (e) `additionalTax` (adapter, Z-WT-5).
2. Wektory `economy` z weba 91dc998a (pliki ≤10 MB) i generator główny work-tax dodany do `logs/`.
3. Mutacje na nowych gałęziach `economy.ts`.
4. Odświeżenie pinu / kopii bajtowych (poza tym tematem, REPIN-DELTA §6).

## Partia D2.1 (R-RUSTPORT-REPIN-EKONOMIA-D-Q1, runda 1 Operatora po R3) — mnozniki Handel→Pieniadz

Port od zera do `rust-port/engine/src/domain/economy_yield.rs` (nowy modul, `pub mod economy_yield;` w `domain/mod.rs`). W silniku NIE istnieje jeszcze odpowiednik `cityYieldPerTurn`, wiec ta partia obejmuje tylko czyste funkcje z `economy.ts@91dc998a`. Zakres: 4 zmiany zachowania z klasyfikacji R3 (pierwsza partia z grupy „mnozniki”).

| Zmiana (web, pin 91dc998a) | Plik:linia weba (`economy.ts`) | Plik:linia Rust | Test / wektor | Status |
|---|---|---|---|---|
| `mnoznikHandelPieniadzForCiv`: fallback 2→1, `civs.json` ignorowane | L704-711 | `economy_yield.rs:53` `mnoznik_handel_pieniadz_for_civ` | `parity_mnoznik_for_civ_main` (588), `parity_mnoznik_for_civ_zero_matrix` (588) | PORTOWANE |
| `civMatrixMnoznikHandelPieniadzRaw`: `>0` → `Number.isFinite` (surowe zero macierzy jest wartoscia), pusty klucz = brak | L717-728 | `economy_yield.rs:42` `civ_matrix_mnoznik_handel_pieniadz_raw` | `structural_known_raw_zero_is_authoritative_and_gets_delta`, `structural_empty_or_missing_key_is_unknown`, wektory `zero` | PORTOWANE |
| `MNOZNIK_HANDEL_TRUDNOSC_DELTA` (easy +0.5 / normal 0 / hard −0.5) | L738-742 | `economy_yield.rs:31` `mnoznik_handel_trudnosc_delta` | `boundary_trudnosc_delta_table` | PORTOWANE |
| `mnoznikHandelPieniadzForCivByDifficulty`: bez czytania `civs.json`; brak wiersza → `fallbackScaled` bez drugiej delty | L753-762 | `economy_yield.rs:63` `mnoznik_handel_pieniadz_for_civ_by_difficulty` | `parity_mnoznik_by_difficulty_main` (1029), `parity_mnoznik_by_difficulty_zero_matrix` (1029), `structural_unknown_key_returns_fallback_without_delta` | PORTOWANE |
| `civEconomyYieldMultipliers` → zawsze `{handel:1, nauka:1}` | L781-786 | `economy_yield.rs:84` `civ_economy_yield_multipliers` | `parity_civ_economy_yield_multipliers` (4) | PORTOWANE |

**Pozostale hunki `economy.ts` (z klasyfikacji R3) — NASTEPNA-PARTIA, bez zmian statusu:** `EconParams`/`targowiskoPracaMnoznik` (L149-166, L237); `CityYieldResult.pieniadzZPracy = 0` (L326-341); `dochodTrasHandlowych` (L668-671); `additionalTax` (L674-675); usuniecie `walutaMnoznikOverride` i bramka Mint (L683-690, L946-947; Mint wymaga `cityYieldPerTurn`, ktorego Rust jeszcze nie ma); Step 3' port `eko_pieniadz_port_proc` (L871-889); `pracaNetto` `eko_praca_proc` (L901-902); D5 `pieniadzZPracy` (L910-914); `civHandelMult` (L919); `eko_handel_brutto_proc` (L933-936); `eko_korupcja_proc` (L940-943); `eko_luksus_proc` (L964-965); `eko_nauka_proc` (L976-981); `eko_pieniadz_proc` (L986-989); `eko_zywnosc_proc` (L1004-1005); `eko_kultura_proc` (L1017-1018).

### Wektory i pochodzenie (D2.1)

- `rust-port/engine/tests/p6_repin_d_economy_vectors/mnoznik-main.json` (588 + 1029 + 4 przypadkow) i `mnoznik-zero.json` (ta sama siatka na kopii macierzy, patrz nizej). Generator: `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-EKONOMIA-D-Q1/logs/gen-vectors-mnoznik.mts`.
- Wykonanie: node 22.22, `--experimental-strip-types` + loader JSON (`logs/loader-hooks.mjs`, `logs/loader-register.mjs`). Kod weba uruchamiany to **doslowny wycinek** `economy.ts@91dc998a` L703-762 i L781-786 (`logs/economy-mnoznik-slice.mts`; zmiana tylko w specyfikatorze importu `./civ-matrix.ts` i aliasach typow), oraz `civ-matrix.ts@91dc998a` i `civ-matrix.json@91dc998a` (identyczny z `rust-port/engine/data/civ-matrix.json`, sprawdzone `cmp`). **Luka:** pelny `cityYieldPerTurn` nie byl uruchamiany (zaleznosci: `production.ts`, `terrain-improvements.ts`, dane terenu) — ZALOZENIE: wycinek funkcji mnoznikowych jest wystarczajacy dla tej partii; reszta w kolejnych partiach.
- Wektor `zero`: kontrolowana kopia macierzy (`logs/make-zero-matrix.mjs`): wiersz 0 (`grecy`) `meta_mnoznik_waluta = 0`, wiersz 1 (`rzymianie`) bez pola (=> domyslna `2`). Kopia poza repo, wejscie kontrolowane, nie zmiana danych gry.
- Porownanie bit-w-bit (`to_bits`), liczby jako `{"f": String(x)}`; NaN/±0/±Infinity pokryte.
- Mutacje (jedna naraz, przywracane, `logs/mut-D2-*.log`): M1 `is_finite`→`>0` (3 testy), M2 delta hard `-0.5`→`+0.5` (4 testy), M3 brak delty w `by_difficulty` (3), M4 delta dodana do fallbacku (3), M5 pominiete sprawdzenie wiersza (6). Zabite 5/5.
