# P6.6B - miasta: zakladanie, czesc B (`cities.ts`, `empire-city-defaults.ts`, `display-names.ts`)

Temat: `R-RUSTPORT-P6-6B-MIASTA-ZAKLADANIE-B-Q1` (DOMAIN: GAME), runda 1/5, rola Operator (Sonnet 5.5 medium; rozstrzygniety wyjatek rust-port R-PROC-AUTOBOT.md §5a).
Pin web: `edb8fb56`. Baza Rust: `origin/rust-port/parity-v2` @ `8eb124a6` (P6.6A zintegrowane; `a29c1657` jest jego przodkiem - `git merge-base --is-ancestor a29c1657 HEAD` = tak; baza >= `8eb124a6` spelniona).
Artefakty runu (generator, loader, weryfikator, mutacje, tabela symboli, logi bramek): `dyspozycje/autobot/runs/R-RUSTPORT-P6-6B-MIASTA-ZAKLADANIE-B-Q1/`.
Czesc A (`city-founding`, `city-hex-clear`, `conquest-stability`, `visibility`) jest zintegrowana; czesc B jej NIE dubluje: pliki czesci A importuja z `cities.ts` wylacznie typ (`import type { City }`, `city-hex-clear.ts:18`), a w plikach czesci B nie ma zadnej z zaleznosci wstrzyknietych w czesci A (§2b).

## 1. Werdykt rundy 1 (stan faktyczny)

| Pytanie | Odpowiedz |
|---|---|
| Co jest portowane? | Wszystkie eksporty i symbole prywatne trzech plikow (tabela §3): 130 wierszy = 124 PORTOWANY, 3 PORTOWANY-Z-WSTRZYKNIETYMI, 1 DANE-JUZ-W-RUST, 2 NIE-DOTYCZY, 0 RUNDA-2. Slownik statusow zamkniety i wymuszony generatorem `gen-symbols-p66b.py`. |
| Podzial na rundy (temat XL) | Wszystkie trzy grupy symboli (`display-names` 20 wierszy, `empire-city-defaults` 26, `cities` 84) zamkniete w RUNDZIE 1; zadne kryterium nie zostalo oslabione. Rundy 2+ nie sa potrzebne na kod symboli - tylko na zadania integracyjne i podmiane wejsc z innych modulow (§7). |
| Dowod "PORTOWANY" | Kod Rust + test + wektory z URUCHOMIONEGO weba (pin; PRAWDZIWY kod TS ladowany loaderem, zero stubow logiki) + niezalezny weryfikator Python (24489 sprawdzen, 0 rozbieznosci) + mutacje wykrywane (204/209, +5 rownowaznych z uzasadnieniem, 0 ocalalych; §6). |
| Wstrzykniete zaleznosci | Tylko poza plikami tej czesci: `readCityFoodBuffer` (economy-upkeep.ts), `ensureCityRationDefaults` (population-growth-v85.ts), `Date.now()` oraz (jako wejscie z danych, nie domkniecie) `freshWealthState` (wealth.ts) i stale `DEFAULT_POZIOM_RACJI` / `WYZYWIENIE_MAX` (population-growth-v85.ts). Testy SPRAWDZAJA liczbe, kolejnosc i argumenty wywolan wzgledem prawdziwego kodu weba. |
| Bramki | fmt `EXIT=0`, clippy `--all-targets -D warnings` `EXIT=0`, test `EXIT=0`: 947 przeszlo, 0 nie (902 + 45 nowych w `tests/p6_6b_*.rs`; baseline dispatchu >= 902). Surowe, pelne logi w §11 i `gate-*-r1.log`. |
| Zmiany poza allowlista | Brak (§9). `domain/mod.rs`, `terrain.rs`, `bridge.rs`, `Cargo.toml` nietkniete; widocznosc modulow rozwiazana wewnatrz `state.rs` (ZA1). |

## 2. Zrodla przeczytane w calosci (liczby linii)

Czytane w calosci (`Read` calego pliku, kolejno bez pomijania zakresow) po wyodrebnieniu `git archive edb8fb56 gra/src gra/data` do wlasnego katalogu poza repo (`mktemp -d`; nie wspoldzielone katalogi).

| Plik | Linie (`wc -l`) | Linie niepuste (`grep -c -v '^\s*$'`) | Eksporty (`grep -c '^export '`) |
|---|---|---|---|
| `gra/src/game/cities.ts` | 1393 | 1293 | 80 + 7 prywatnych symboli lacznie z pozostalymi plikami (`_budowaListaSzablonSeq`, `isLegacyBudowaListaSzablony`, `isBudowaListaSzablonArray`, `freshCityPodzial`, `CITY_NAMES`) |
| `gra/src/game/empire-city-defaults.ts` | 554 | 525 | 24 + 1 prywatny (`normalizePodzialPracy`) |
| `gra/src/game/display-names.ts` | 311 | 288 | 19 + 1 prywatny (`cleanDisplayPart`) |

Liczby w dispatchu (1293 / 525 / 288) to liczby linii NIEPUSTYCH - zgadzaja sie z kolumna 3; calkowite liczby linii (`wc -l`) wynosza 1393 / 554 / 311. Liczba wierszy tabeli symboli jest wymuszana skryptem `gen-symbols-p66b.py` (blad, gdy eksport TS nie ma wiersza albo wiersz wskazuje symbol/test spoza zrodla, Rust lub testow).

Przeczytane dodatkowo (zaleznosci - cale funkcje uzyte przez te pliki, `Read` wskazanych zakresow): `population-growth-v85.ts` (28, 29-70, 160-190, 374-395: `WYZYWIENIE_MAX`, `DEFAULT_POZIOM_RACJI`, `clampPoziomRacji`, `ensureCityRationDefaults`), `economy-upkeep.ts` (141-152: `readCityFoodBuffer`), `wealth.ts` (165-168 `WealthState`, 247-251 `freshWealthState`), `units/setup.ts` (354-359 `hexDistance`, 678-680 `isWaterTerrain`), `types/hex.ts` (12-24 `TerenBazowy`), `data/miasto-params.json` (`min_dystans_miast`), `siegeMachines`/`WorkedTile` tylko jako typy pol `City` (nieczytane - patrz ZA2).

## 2a. Dokumenty obowiazkowe z dispatchu: dowod odczytu i skutki dla portu

Odczyt: `git show origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0:<sciezka>` do plikow poza repo, nastepnie `Read` / `Grep` wskazanymi zakresami. Zakresy NIEPRZECZYTANE sa wymienione jawnie.

| Dokument | Linie | Czesci przeczytane (zakresy) | Wniosek wazny dla P6.6B | Skutek |
|---|---|---|---|---|
| `p6/P6-0-GAP-ANALYSIS.md` | 435 | `Read` 1-130 (§0 metoda, §1 wskazniki, §1a rozklad, §2 huby: `cities.ts` = hub nr 1 z 26 importujacymi, poczatek tabeli §3) oraz 296-355 (§5, §6b); `Grep` po `cities|display-names|empire-city|P6.6` (wiersze tabeli 130, 187, 192) i `sed -n` wierszy 187/192; NIE przeczytane: wiersze tabeli §3 131-295 poza trafieniami grepa, §4, §6a, §7-§9 | P6.6 = 7 plikow / 2790 LOC niepustych, `state.rs`; `cities.ts` (1293 LOC niepustych, 80 eksportow) to hub; wiersz 88: `isOwnerClusterCityState` jest logika gry (uzywana przez `power-ranking.ts`), `clearCityStateFlagOnCapture` wolane przy kazdym przejeciu; `PORTOWANE-1:1` nie przyznawane bez wektora per funkcja | Port WSZYSTKICH eksportow z wektorami z weba; `display-names` traktowane jako logika (nie UI) |
| `p3/P3-22-FLATTEN-STAGE2.md` | 441 | `Read` 1-30 (status, odpowiedzi na zarzuty) i 94-134 (dowod braku mnozników, pliki, tabela bylo/jest, zmiany testów, bramki); `Grep` po `literal|data/derived|parser|mutac|bitow` (trafienia 15, 27, 98-99, 110-111, 128, 140, 158-167, 173, 198-199, 207, 229-238, 243-244, 262-276); NIE przeczytane: sekcja 1 (status pozycji), sekcje 7-12 poza trafieniami grepa | Wzorzec: tabela edytowalna w `data/derived/*.json` + parser w `src/data/derived.rs` + test KSZTALTU (nie wartosci) + wektory z URUCHOMIONEGO kodu TS (loader `--experimental-transform-types`) + niezalezny weryfikator Python | Przyjete 1:1: `cities-params.json`, `display-names-params.json`, `gen-p66b-vectors.mjs` + loader, `verify-p66b-vectors.py`, `p6_6b_tables.rs` |
| `p2/P2-3-ENTITY-IDS.md` | 380 | `Read` 1-30 (naglowek, piny, §1.1 typy ID web); `Grep` po `foundedByOwner|foundedTurn|owner_id|ownerId|City` (trafienia 14, 25, 39-65, 85-91, 108-135); NIE przeczytane: §4-§5 (porownanie 61 pol `City` linia po linii) poza liczba pol z linii 10 | `City` web ma 61 pol (`cities.ts:835`), id miasta = `'city' + cities.length` (`:1249`, `:1286`); D-ID-3 proponuje monotoniczny licznik `CityId` | Port zachowuje web (`city<N>`, ZA6); licznik `CityId` to decyzja integracyjna (R2-4); liczba pol `City` (61) zgodna z moim wyliczeniem (§4) |
| `p2/P2-5-COMMANDS.md` | 668 | `Grep` po `found_city|FoundCity|zaloz|B6|B11` (trafienia 16, 23, 47, 99-104, 280-282, 489, 505, 529-530, 590-629; tresc wierszy B6/B7/B11 i D-CMD-14 (d) odczytana z wyniku grepa); NIE przeczytane (`Read`): reszta dokumentu | `found_city` (B6, alias B11) = `canFoundCity` + `foundCityAt`; `found_city_from_village` (B7) = `foundCityFromVillage`; `countsTowardCityFoundingLimit` ma jedno wywolanie (`canFoundCity`, `cities.ts:1225`) - limit jest czescia B6/B7 | Funkcje walidacji i tworzenia sa gotowe pod komendy; podpiecie pod `session.rs`/`bridge.rs` = zadanie integracyjne (poza allowlista) |
| `PLAN-PORT-RUST-TAURI-20261020.md` | 305 | `Read` 195-219 (§P6: lista punktow P6.1-P6.24); `Grep` po `P6.6|P6.7|literal`; NIE przeczytane: pozostale fazy | P6.6-P6.8 = Miasta (zalozenie, wzrost, ekonomia); P6.6 nie obejmuje wzrostu ani ekonomii | Zakres zgodny: czesc B nie portuje wzrostu (`population-growth-v85`, P6.7) ani ekonomii (`economy-upkeep`, P6.8) |
| `LEDGER.md` | 201 | `Read` 1-30 (scheduled task, rundy do P1); `Grep` po `P6.6|P6-6|cities|rust-port/parity|parity-v2` (wiersze >30 odczytane tylko jako trafienia); NIE przeczytane: wiersze 31-201 poza trafieniami | Gałąź robocza `rust-port/parity-v2`; decyzja wlasciciela: kod archiwum nigdy 1:1 (nie dotyczy web), Final Control nie powiela slabszego rygoru | Brak wplywu na kod; rygor dowodowy jak w P6.6A |
| Wzorce runu: `R-RUSTPORT-P3-22-FLATTEN-STAGE2-Q1/gen-loader-*.mjs`, `gen-*.mjs`, `verify-*.py` oraz `R-RUSTPORT-P6-6A-MIASTA-ZAKLADANIE-A-Q1/{gen-p66a-vectors.mjs,p66a-loader-hooks.mjs,verify-p66a-vectors.py,mutate-p66a.py,gen-symbols-p66a.py,grep-literals-p66a.py}` | - | czytane w calosci (generator 584 linii, loader 29, weryfikator 631, mutacje 159, grep-literals 41; tabela symboli 6A 50 wierszy) | Struktura: loader ESM (`resolve` dopisuje `.ts`, `.json` jako modul), generator liczb specjalnych (`NaN`/`Infinity`/`-0`/`~ulamek`), weryfikator bitowy, mutacje JEDNEGO fragmentu | Skopiowany loader (`p66b-loader-*.mjs`), ta sama kodowanie liczb, ten sam kontrakt wyjscia weryfikatora |

## 2b. Zaleznosci i statusy z P6.6A (aktualizacja WYLACZNIE w tym dokumencie)

Dokument P6.6A (`P6-6A-MIASTA-ZAKLADANIE-A.md` §7, wiersze 241-253) wymienia domkniecia wstrzykniete w czesci A oraz symbole oczekujace na czesc B. Stan po P6.6B:

| Pozycja z P6.6A | Stan po P6.6B | Dowod |
|---|---|---|
| `hexToWorkedTile` (turn-economy.ts), `sameCultureCircle` (diplomacy-display.ts), `convertCulture` / `convertViaTemple` / `cityBorderRadius` (culture-religion.ts), `clearCityCultureMix` (society-inputs.ts), `Math.random` | BEZ ZMIAN: nie leza w `cities.ts` / `empire-city-defaults.ts` / `display-names.ts`, wiec nie sa domykane przez ten temat. R2-1/R2-3 z P6.6A pozostaja otwarte. | `grep -nE "hexToWorkedTile|sameCultureCircle|convertCulture|convertViaTemple|cityBorderRadius|clearCityCultureMix|Math\.random" cities.ts empire-city-defaults.ts display-names.ts` = 0 trafien |
| `isOwnerClusterCityState` (zalezny od czesci B wg P6.6A §8) | PORTOWANY: `display_names::is_owner_cluster_city_state` | §3, test `p6_6b_display::is_owner_cluster_city_state_matches_web` |
| `canFoundCity`, `foundCityAt` (zalezne od czesci B) | PORTOWANE: `cities::can_found_city`, `cities::found_city_at` | §3, testy `p6_6b_cities_found::*` |
| `centerWorkedTile` w typie `City` (P6.6A §8) | Pole NIE jest modelowane w `cities::City` (typ `WorkedTile` pochodzi z turn-economy.ts; nie jest czytany ani zapisywany przez logike czesci B); `terrain::city_hex_clear::apply_city_founding_to_hex` z P6.6A przyjmuje `&mut Option<T>` generycznie, wiec nie wymaga pola | `grep` 0 uzyc `centerWorkedTile` poza interfejsem (§4) |

## 3. Tabela symboli (kazdy eksport i symbol prywatny ma status)

Kolumny: plik TS, linia deklaracji w pliku TS (pin `edb8fb56`), symbol, status, odpowiednik Rust (`plik:linia`), test (`plik_testu::funkcja`), uwaga. Wygenerowana skryptem `gen-symbols-p66b.py` (plik `symbols-p66b-r1.tsv`); skrypt konczy sie bledem, gdy wiersza brakuje albo wskazuje nieistniejacy symbol/test.

Podsumowanie: 130 wierszy; DANE-JUZ-W-RUST=1, NIE-DOTYCZY=2, PORTOWANY=124, PORTOWANY-Z-WSTRZYKNIETYMI=3.

| Plik TS | Linia TS | Symbol | Status | Odpowiednik Rust | Test | Uwaga |
|---|---|---|---|---|---|---|
| cities.ts | 21 | CityPodzialHandlu | PORTOWANY | rust-port/engine/src/domain/state.rs:1435 (CityPodzialHandlu); rust-port/engine/src/domain/state.rs:1443 (HandelKey) | percent::adjust_handel_split_matches_web | keyof -> enum HandelKey |
| cities.ts | 40 | CityPodzialPracy | PORTOWANY | rust-port/engine/src/domain/state.rs:1469 (CityPodzialPracy) | percent::constants_match_running_web | - |
| cities.ts | 45 | OkolicaFocus | PORTOWANY | rust-port/engine/src/domain/state.rs:1475 (OkolicaFocus) | empire::okolica_focus_functions_match_web | unia napisow -> enum + web_value/from_web |
| cities.ts | 48 | OkolicaTryb | PORTOWANY | rust-port/engine/src/domain/state.rs:1505 (OkolicaTryb) | percent::constants_match_running_web | - |
| cities.ts | 56 | DEFAULT_OKOLICA_FOCUS | PORTOWANY | rust-port/engine/src/domain/state.rs:1774 (default_okolica_focus) | percent::constants_match_running_web | dane: cities-params.json okolica |
| cities.ts | 57 | DEFAULT_OKOLICA_TRYB | PORTOWANY | rust-port/engine/src/domain/state.rs:1779 (default_okolica_tryb) | percent::constants_match_running_web | dane: cities-params.json okolica |
| cities.ts | 60 | BudowaFocus | PORTOWANY | rust-port/engine/src/domain/state.rs:1529 (BudowaFocus) | percent::budowa_priority_helpers_match_web | - |
| cities.ts | 69 | BudowaTryb | PORTOWANY | rust-port/engine/src/domain/state.rs:1566 (BudowaTryb) | cities_ensure::ensure_city_save_defaults_matches_web | dodatkowy wariant Auto = surowa wartosc legacy ('auto') czytana przez ensureCitySaveDefaults |
| cities.ts | 72 | BudowaListaSzablon | PORTOWANY | rust-port/engine/src/domain/state.rs:1655 (BudowaListaSzablon) | lists::id_generator_and_loader_match_web_sequence | budynki: Vec<serde_json::Value> (zawartosc z zapisu nie jest sprawdzana elementarnie) |
| cities.ts | 73 | BudowaListaBiblioteka | PORTOWANY | - | lists::id_generator_and_loader_match_web_sequence | alias tablicy -> Vec<BudowaListaSzablon> |
| cities.ts | 75 | EMPTY_BUDOWA_LISTA_BIBLIOTEKA | PORTOWANY | rust-port/engine/src/domain/state.rs:1769 (empty_budowa_lista_biblioteka) | percent::constants_match_running_web | - |
| cities.ts | 78 | BudowaListaSlot | PORTOWANY | - | lists::id_generator_and_loader_match_web_sequence | unia 'A'\|'B'\|'C' -> dane cities-params.json budowa.lista_slot_legacy |
| cities.ts | 80 | BudowaListaSzablonyLegacy | NIE-DOTYCZY | - | lists::id_generator_and_loader_match_web_sequence | typ Record<slot,string[]>; legacy format czytany z serde_json::Value w load_budowa_lista_biblioteka |
| cities.ts | 82 | _budowaListaSzablonSeq | PORTOWANY | rust-port/engine/src/domain/state.rs:1973 (BudowaListaIdGen) | lists::id_generator_and_loader_match_web_sequence | zmienna modulu -> jawny stan BudowaListaIdGen.seq |
| cities.ts | 84 | newBudowaListaSzablonId | PORTOWANY-Z-WSTRZYKNIETYMI | rust-port/engine/src/domain/state.rs:1973 (BudowaListaIdGen) | lists::id_generator_and_loader_match_web_sequence | WSTRZYKNIETE: Date.now() jako parametr now_ms (metoda new_id) |
| cities.ts | 90 | defaultBudowaListaNazwa | PORTOWANY | rust-port/engine/src/domain/state.rs:1991 (default_budowa_lista_nazwa) | lists::default_nazwa_matches_web | trim/toLowerCase: js_trim + to_lowercase |
| cities.ts | 99 | isLegacyBudowaListaSzablony | PORTOWANY | - | lists::id_generator_and_loader_match_web_sequence | prywatna; zaszyta w load_budowa_lista_biblioteka |
| cities.ts | 107 | isBudowaListaSzablonArray | PORTOWANY | - | lists::id_generator_and_loader_match_web_sequence | prywatna; fn is_budowa_lista_szablon_array (niepubliczna) |
| cities.ts | 119 | loadBudowaListaBiblioteka | PORTOWANY-Z-WSTRZYKNIETYMI | rust-port/engine/src/domain/state.rs:2043 (load_budowa_lista_biblioteka) | lists::id_generator_and_loader_match_web_sequence | WSTRZYKNIETE: Date.now() (domkniecie now), licznik id (BudowaListaIdGen) |
| cities.ts | 160 | dedupeBudowaLista | PORTOWANY | rust-port/engine/src/domain/state.rs:2087 (dedupe_budowa_lista) | lists::dedupe_matches_web | - |
| cities.ts | 172 | isAutoBudowaTryb | PORTOWANY | rust-port/engine/src/domain/state.rs:2100 (is_auto_budowa_tryb) | percent::budowa_priority_helpers_match_web | - |
| cities.ts | 177 | DEFAULT_BUDOWA_FOCUS | PORTOWANY | rust-port/engine/src/domain/state.rs:1785 (default_budowa_focus) | percent::constants_match_running_web | - |
| cities.ts | 178 | DEFAULT_BUDOWA_TRYB | PORTOWANY | rust-port/engine/src/domain/state.rs:1790 (default_budowa_tryb) | percent::constants_match_running_web | - |
| cities.ts | 181 | UlepszeniaFocus | PORTOWANY | rust-port/engine/src/domain/state.rs:1599 (UlepszeniaFocus) | percent::resolve_effective_ulepszenia_matches_web | - |
| cities.ts | 184 | UlepszeniaTryb | PORTOWANY | rust-port/engine/src/domain/state.rs:1629 (UlepszeniaTryb) | percent::resolve_effective_ulepszenia_matches_web | - |
| cities.ts | 200 | UlepszeniaPracaPercent | NIE-DOTYCZY | - | - | alias number -> f64 |
| cities.ts | 202 | DEFAULT_ULEPSZENIA_FOCUS | PORTOWANY | rust-port/engine/src/domain/state.rs:1795 (default_ulepszenia_focus) | percent::constants_match_running_web | - |
| cities.ts | 203 | DEFAULT_ULEPSZENIA_TRYB | PORTOWANY | rust-port/engine/src/domain/state.rs:1800 (default_ulepszenia_tryb) | percent::constants_match_running_web | - |
| cities.ts | 217 | DEFAULT_ULEPSZENIA_ONLY_WORKED | PORTOWANY | rust-port/engine/src/domain/state.rs:1805 (default_ulepszenia_only_worked) | percent::constants_match_running_web | - |
| cities.ts | 226 | DEFAULT_ULEPSZENIA_WOLNO_WYCINAC_LAS | PORTOWANY | rust-port/engine/src/domain/state.rs:1810 (default_ulepszenia_wolno_wycinac_las) | percent::constants_match_running_web | - |
| cities.ts | 229 | DEFAULT_ULEPSZENIA_PRACA_PERCENT | PORTOWANY | rust-port/engine/src/domain/state.rs:1815 (default_ulepszenia_praca_percent) | percent::constants_match_running_web | - |
| cities.ts | 232 | AI_MAJOR_ULEPSZENIA_PRACA_PERCENT | PORTOWANY | rust-port/engine/src/domain/state.rs:1820 (ai_major_ulepszenia_praca_percent) | percent::constants_match_running_web | - |
| cities.ts | 240 | MAX_ULEPSZENIA_PRACA_AUTO_PERCENT | PORTOWANY | rust-port/engine/src/domain/state.rs:1825 (max_ulepszenia_praca_auto_percent) | percent::constants_match_running_web | - |
| cities.ts | 257 | clampUlepszeniaPracaPercent | PORTOWANY | rust-port/engine/src/domain/state.rs:2132 (clamp_ulepszenia_praca_percent) | percent::clamp_functions_match_web | number\|undefined\|null -> Option<f64> (None = nie-liczba) |
| cities.ts | 279 | migrateUlepszeniaPerTurnToPercent | PORTOWANY | rust-port/engine/src/domain/state.rs:2144 (migrate_ulepszenia_per_turn_to_percent) | percent::snap_and_migrate_match_web | tabela migracja_per_turn; wartosc spoza tabeli -> ostatni wiersz (galaz `return 100`) |
| cities.ts | 291 | resolveUlepszeniaPracaPercentFromRaw | PORTOWANY | rust-port/engine/src/domain/state.rs:2155 (resolve_ulepszenia_praca_percent_from_raw) | percent::resolve_praca_percent_from_raw_matches_web | unknown -> Option<f64> (tylko typeof number ma znaczenie) |
| cities.ts | 303 | UlepszeniaEmpirePolicy | PORTOWANY | rust-port/engine/src/domain/state.rs:2182 (UlepszeniaEmpirePolicy) | percent::ulepszenia_policy_and_caps_match_web | wolnoWycinacLas: Option<bool> (kod czyta `??`) |
| cities.ts | 312 | freshUlepszeniaEmpirePolicy | PORTOWANY | rust-port/engine/src/domain/state.rs:2191 (fresh_ulepszenia_empire_policy) | percent::ulepszenia_policy_and_caps_match_web | - |
| cities.ts | 329 | freshUlepszeniaEmpirePolicyForOwner | PORTOWANY | rust-port/engine/src/domain/state.rs:2203 (fresh_ulepszenia_empire_policy_for_owner) | percent::ulepszenia_policy_and_caps_match_web | isAiImprovementOwner jest PARAMETREM weba |
| cities.ts | 339 | computeAiImprovementBudgetCap | PORTOWANY | rust-port/engine/src/domain/state.rs:2215 (compute_ai_improvement_budget_cap) | percent::ulepszenia_policy_and_caps_match_web | - |
| cities.ts | 348 | computeAiImprovementBudgetCapForOwner | PORTOWANY | rust-port/engine/src/domain/state.rs:2224 (compute_ai_improvement_budget_cap_for_owner) | percent::ulepszenia_policy_and_caps_match_web | - |
| cities.ts | 358 | EffectiveUlepszeniaSettings | PORTOWANY | rust-port/engine/src/domain/state.rs:2237 (EffectiveUlepszeniaSettings) | percent::resolve_effective_ulepszenia_matches_web | pole override -> is_override (slowo zarezerwowane) |
| cities.ts | 368 | resolveEffectiveUlepszenia | PORTOWANY | rust-port/engine/src/domain/state.rs:2247 (resolve_effective_ulepszenia) | percent::resolve_effective_ulepszenia_matches_web | - |
| cities.ts | 396 | DEFAULT_BUDOWA_PRIORYTET_TYPOW | PORTOWANY | rust-port/engine/src/domain/state.rs:1830 (default_budowa_priorytet_typow) | percent::constants_match_running_web | - |
| cities.ts | 405 | BUDOWA_TYP_FOCUS | PORTOWANY | rust-port/engine/src/domain/state.rs:1840 (budowa_typ_focus) | percent::constants_match_running_web | - |
| cities.ts | 413 | isBudowaTypFocus | PORTOWANY | rust-port/engine/src/domain/state.rs:2109 (is_budowa_typ_focus) | percent::budowa_priority_helpers_match_web | - |
| cities.ts | 418 | sanitizeBudowaPriorytetTypow | PORTOWANY | rust-port/engine/src/domain/state.rs:2114 (sanitize_budowa_priorytet_typow) | percent::budowa_priority_helpers_match_web | - |
| cities.ts | 436 | DEFAULT_PODZIAL_HANDLU | PORTOWANY | rust-port/engine/src/domain/state.rs:1850 (default_podzial_handlu) | percent::constants_match_running_web | - |
| cities.ts | 443 | DEFAULT_PODZIAL_PRACY | PORTOWANY | rust-port/engine/src/domain/state.rs:1860 (default_podzial_pracy) | percent::constants_match_running_web | - |
| cities.ts | 456 | MIN_PODZIAL_PRACY_BUDYNKI_PERCENT | PORTOWANY | rust-port/engine/src/domain/state.rs:1867 (min_podzial_pracy_budynki_percent) | percent::constants_match_running_web | - |
| cities.ts | 457 | MAX_PODZIAL_PRACY_BUDYNKI_PERCENT | PORTOWANY | rust-port/engine/src/domain/state.rs:1872 (max_podzial_pracy_budynki_percent) | percent::constants_match_running_web | - |
| cities.ts | 469 | AI_FIXED_PROCENT_BUDYNKI | PORTOWANY | rust-port/engine/src/domain/state.rs:1877 (ai_fixed_procent_budynki) | percent::constants_match_running_web | - |
| cities.ts | 478 | MAX_PROCENT_PULI_IMPERIUM | PORTOWANY | rust-port/engine/src/domain/state.rs:1882 (max_procent_puli_imperium) | percent::constants_match_running_web | wyliczane: calosc - min budynkow |
| cities.ts | 515 | MIN_PROCENT_PULI_IMPERIUM_ZASADA3_NADWYZKA | PORTOWANY | rust-port/engine/src/domain/state.rs:1887 (min_procent_puli_imperium_zasada3_nadwyzka) | percent::constants_match_running_web | - |
| cities.ts | 535 | PODZIAL_PRACY_PULA_LBL | PORTOWANY | rust-port/engine/src/domain/state.rs:1892 (podzial_pracy_pula_lbl) | percent::constants_match_running_web | dane: cities-params.json etykiety_podzialu_pracy |
| cities.ts | 537 | PODZIAL_PRACY_PULA_LBL_PELNA | PORTOWANY | rust-port/engine/src/domain/state.rs:1897 (podzial_pracy_pula_lbl_pelna) | percent::constants_match_running_web | - |
| cities.ts | 539 | PODZIAL_PRACY_PULA_TIP | PORTOWANY | rust-port/engine/src/domain/state.rs:1902 (podzial_pracy_pula_tip) | percent::constants_match_running_web | - |
| cities.ts | 543 | MIN_PROCENT_PULI_IMPERIUM | PORTOWANY | rust-port/engine/src/domain/state.rs:1907 (min_procent_puli_imperium) | percent::constants_match_running_web | wyliczane: calosc - max budynkow |
| cities.ts | 545 | clampPodzialPracyBudynkiPercent | PORTOWANY | rust-port/engine/src/domain/state.rs:2286 (clamp_podzial_pracy_budynki_percent) | percent::clamp_functions_match_web | - |
| cities.ts | 557 | procentPuliImperiumZBudynkow | PORTOWANY | rust-port/engine/src/domain/state.rs:2297 (procent_puli_imperium_z_budynkow) | percent::clamp_functions_match_web | - |
| cities.ts | 562 | podzialPracyZProcentuPuli | PORTOWANY | rust-port/engine/src/domain/state.rs:2302 (podzial_pracy_z_procentu_puli) | percent::podzial_pracy_z_procentu_puli_matches_web | - |
| cities.ts | 570 | DEFAULT_PROCENT_ROZWOJ | PORTOWANY | rust-port/engine/src/domain/state.rs:1912 (default_procent_rozwoj) | percent::constants_match_running_web | - |
| cities.ts | 573 | DEFAULT_PROCENT_ROZWOJ_WYZYWIENIE | PORTOWANY | rust-port/engine/src/domain/state.rs:1918 (default_procent_rozwoj_wyzywienie); rust-port/engine/src/domain/state.rs:1924 (default_poziom_racji); rust-port/engine/src/domain/state.rs:1931 (wyzywienie_max) | percent::constants_match_running_web | Math.round(DEFAULT_POZIOM_RACJI / WYZYWIENIE_MAX * 100); oba skladniki z population-growth-v85.ts jako WEJSCIE z danych (cities-params.json wejscia_z_innych_modulow_weba) |
| cities.ts | 578 | HANDEL_PCT_STEP | PORTOWANY | rust-port/engine/src/domain/state.rs:1936 (handel_pct_step) | percent::constants_match_running_web | - |
| cities.ts | 581 | MAX_PROCENT_NAUKA | PORTOWANY | rust-port/engine/src/domain/state.rs:1941 (max_procent_nauki) | percent::constants_match_running_web | - |
| cities.ts | 601 | AI_FIXED_PROCENT_NAUKA | PORTOWANY | rust-port/engine/src/domain/state.rs:1946 (ai_fixed_procent_nauki) | percent::constants_match_running_web | - |
| cities.ts | 603 | snapHandelPct | PORTOWANY | rust-port/engine/src/domain/state.rs:2316 (snap_handel_pct) | percent::snap_and_migrate_match_web | - |
| cities.ts | 608 | normalizePodzialHandlu | PORTOWANY | rust-port/engine/src/domain/state.rs:2322 (normalize_podzial_handlu) | percent::normalize_podzial_handlu_matches_web | - |
| cities.ts | 640 | adjustHandelSplit | PORTOWANY | rust-port/engine/src/domain/state.rs:2351 (adjust_handel_split) | percent::adjust_handel_split_matches_web | - |
| cities.ts | 723 | freshCityPodzial | PORTOWANY | - | found::found_city_at_matches_web | prywatna; fn fresh_city_podzial_pracy (niepubliczna) |
| cities.ts | 730 | ensureCityPodzialDefaults | PORTOWANY | rust-port/engine/src/domain/state.rs:2458 (ensure_city_podzial_defaults) | ensure::ensure_city_podzial_defaults_matches_web | - |
| cities.ts | 746 | ensureCitySaveDefaults | PORTOWANY-Z-WSTRZYKNIETYMI | rust-port/engine/src/domain/state.rs:2482 (ensure_city_save_defaults); rust-port/engine/src/domain/state.rs:2452 (SaveDefaultsDeps) | ensure::ensure_city_save_defaults_matches_web | WSTRZYKNIETE: readCityFoodBuffer (economy-upkeep.ts), ensureCityRationDefaults (population-growth-v85.ts); freshWealthState (wealth.ts) = wejscie z danych; testy sprawdzaja liczbe/kolejnosc/argumenty wywolan |
| cities.ts | 834 | City | PORTOWANY | rust-port/engine/src/domain/state.rs:1683 (City); rust-port/engine/src/domain/state.rs:1672 (FoodBuffer); rust-port/engine/src/domain/state.rs:1663 (WealthState) | ensure::ensure_city_save_defaults_matches_web | podzbior 38 z 61 pol interfejsu (wszystkie pola czytane lub zapisywane przez logike trzech plikow) + surowe pole legacy ulepszeniaPerTurn; pozostale 23 pola = dane bez logiki w tych plikach (grep: 0 uzyc, dokument §4) |
| cities.ts | 1120 | MIN_CITY_DISTANCE | DANE-JUZ-W-RUST | rust-port/engine/src/domain/state.rs:1952 (min_city_distance) | tables::min_city_distance_comes_from_miasto_params | data/miasto-params.json min_dystans_miast; zapasowe `?? 5` nieosiagalne (typ danych wymusza pole) |
| cities.ts | 1122 | MIN_CITY_DISTANCE_START_CITY_STATE | PORTOWANY | rust-port/engine/src/domain/state.rs:1963 (min_city_distance_start_city_state) | percent::constants_match_running_web | - |
| cities.ts | 1125 | countsTowardCityFoundingLimit | PORTOWANY | rust-port/engine/src/domain/state.rs:2583 (counts_toward_city_founding_limit) | found::city_name_and_predicates_match_web | Pick<City,'foundedByOwner'> -> Option<bool> |
| cities.ts | 1157 | wasIndependentCityStateBeforeCapture | PORTOWANY | rust-port/engine/src/domain/state.rs:2588 (was_independent_city_state_before_capture) | found::city_name_and_predicates_match_web | Pick<City,'startCityState'> -> Option<bool> |
| cities.ts | 1163 | canFoundCity | PORTOWANY | rust-port/engine/src/domain/state.rs:2647 (can_found_city); rust-port/engine/src/domain/state.rs:2602 (CanFoundCityOpts); rust-port/engine/src/domain/state.rs:2614 (GameConfig); rust-port/engine/src/domain/state.rs:2620 (CanFoundCityResult) | found::can_found_city_matches_web | hexDistance lokalnie f64; isWaterTerrain = P6.4 (pathfinding::ruch_jednostek); klucz heksu `q,r` tylko dla calkowitych (ZALOZENIE) |
| cities.ts | 1235 | foundCity | PORTOWANY | rust-port/engine/src/domain/state.rs:2767 (found_city); rust-port/engine/src/domain/state.rs:2760 (Settler) | found::found_city_matches_web | RuntimeUnit -> Settler{ownerId,q,r}; freshWealthState = wejscie z danych |
| cities.ts | 1269 | foundCityAt | PORTOWANY | rust-port/engine/src/domain/state.rs:2796 (found_city_at) | found::found_city_at_matches_web | - |
| cities.ts | 1309 | CITY_NAMES | PORTOWANY | - | found::city_name_and_predicates_match_web | prywatna; dane: cities-params.json nazwy_miast.lista |
| cities.ts | 1328 | cityName | PORTOWANY | rust-port/engine/src/domain/state.rs:2828 (city_name) | found::city_name_and_predicates_match_web | @deprecated; undefined (indeks niecalkowity w zakresie) -> None |
| cities.ts | 1343 | FoundFromVillageOpts | PORTOWANY | - | found::found_city_from_village_matches_web | jedyne pole withinTerritory = parametr within_territory |
| cities.ts | 1351 | FoundFromVillageResult | PORTOWANY | rust-port/engine/src/domain/state.rs:2845 (FoundFromVillageResult) | found::found_city_from_village_matches_web | {ok:true}&City \| {ok:false,reason} -> enum |
| cities.ts | 1374 | foundCityFromVillage | PORTOWANY | rust-port/engine/src/domain/state.rs:2851 (found_city_from_village) | found::found_city_from_village_matches_web | - |
| empire-city-defaults.ts | 59 | podzialPracyEqual | PORTOWANY | rust-port/engine/src/domain/state.rs:2945 (podzial_pracy_equal) | empire::podzial_pracy_functions_match_web | - |
| empire-city-defaults.ts | 64 | normalizePodzialPracy | PORTOWANY | - | empire::podzial_pracy_functions_match_web | prywatna; fn normalize_podzial_pracy (niepubliczna) |
| empire-city-defaults.ts | 69 | resolveCityPodzialPracy | PORTOWANY | rust-port/engine/src/domain/state.rs:2957 (resolve_city_podzial_pracy) | empire::podzial_pracy_functions_match_web | Pick<City,...> -> &City |
| empire-city-defaults.ts | 101 | PodzialPracyLocalChange | PORTOWANY | rust-port/engine/src/domain/state.rs:2982 (PodzialPracyLocalChange) | empire::podzial_pracy_functions_match_web | undefined -> None |
| empire-city-defaults.ts | 108 | applyPodzialPracyLocalChange | PORTOWANY | rust-port/engine/src/domain/state.rs:2988 (apply_podzial_pracy_local_change) | empire::podzial_pracy_functions_match_web | - |
| empire-city-defaults.ts | 123 | migratePodzialPracyOnLoad | PORTOWANY | rust-port/engine/src/domain/state.rs:3011 (migrate_podzial_pracy_on_load) | empire::podzial_pracy_migration_matches_web | Map<number,V> -> OwnerMap (kolejnosc wstawiania); delete city.podzialPracy -> None |
| empire-city-defaults.ts | 182 | freshOwnerDefaultPodzialPracy | PORTOWANY | rust-port/engine/src/domain/state.rs:3067 (fresh_owner_default_podzial_pracy) | empire::podzial_pracy_functions_match_web | - |
| empire-city-defaults.ts | 192 | resolveCityOkolicaFocus | PORTOWANY | rust-port/engine/src/domain/state.rs:3076 (resolve_city_okolica_focus) | empire::okolica_focus_functions_match_web | - |
| empire-city-defaults.ts | 207 | broadcastOkolicaFocusToOwnerCities | PORTOWANY | rust-port/engine/src/domain/state.rs:3091 (broadcast_okolica_focus_to_owner_cities) | empire::okolica_focus_functions_match_web | pin (override) pomijany |
| empire-city-defaults.ts | 219 | migrateOkolicaFocusOnLoad | PORTOWANY | rust-port/engine/src/domain/state.rs:3105 (migrate_okolica_focus_on_load) | empire::okolica_focus_functions_match_web | - |
| empire-city-defaults.ts | 250 | freshOwnerDefaultOkolicaFocus | PORTOWANY | rust-port/engine/src/domain/state.rs:3149 (fresh_owner_default_okolica_focus) | empire::okolica_focus_functions_match_web | - |
| empire-city-defaults.ts | 261 | CityBudowaProfil | PORTOWANY | rust-port/engine/src/domain/state.rs:3159 (CityBudowaProfil) | empire::budowa_profil_functions_match_web | - |
| empire-city-defaults.ts | 266 | budowaProfilEqual | PORTOWANY | rust-port/engine/src/domain/state.rs:3165 (budowa_profil_equal) | empire::budowa_profil_functions_match_web | - |
| empire-city-defaults.ts | 270 | resolveCityBudowaProfil | PORTOWANY | rust-port/engine/src/domain/state.rs:3170 (resolve_city_budowa_profil) | empire::budowa_profil_functions_match_web | - |
| empire-city-defaults.ts | 290 | broadcastBudowaProfilToOwnerCities | PORTOWANY | rust-port/engine/src/domain/state.rs:3192 (broadcast_budowa_profil_to_owner_cities) | empire::budowa_profil_functions_match_web | pin (override) pomijany |
| empire-city-defaults.ts | 303 | migrateBudowaProfilOnLoad | PORTOWANY | rust-port/engine/src/domain/state.rs:3207 (migrate_budowa_profil_on_load) | empire::budowa_profil_functions_match_web | - |
| empire-city-defaults.ts | 342 | freshOwnerDefaultBudowaProfil | PORTOWANY | rust-port/engine/src/domain/state.rs:3270 (fresh_owner_default_budowa_profil) | empire::budowa_profil_functions_match_web | - |
| empire-city-defaults.ts | 354 | AI_DEFAULT_BUDOWA_TRYB | PORTOWANY | rust-port/engine/src/domain/state.rs:3278 (ai_default_budowa_tryb) | empire::budowa_profil_functions_match_web | dane: cities-params.json budowa.domyslny_tryb_ai |
| empire-city-defaults.ts | 392 | freshOwnerDefaultBudowaProfilForOwner | PORTOWANY | rust-port/engine/src/domain/state.rs:3285 (fresh_owner_default_budowa_profil_for_owner) | empire::budowa_profil_functions_match_web | isBarbarianOwner jest PARAMETREM weba (domkniecie podawane przez wolajacego) |
| empire-city-defaults.ts | 437 | upgradeBudowaProfilAutoDefaultsOnLoad | PORTOWANY | rust-port/engine/src/domain/state.rs:3300 (upgrade_budowa_profil_auto_defaults_on_load) | empire::upgrade_budowa_profil_auto_defaults_matches_web | isBarbarianOwner = parametr weba; gracz (owner 0) pomijany; zwraca liste w kolejnosci wstawiania |
| empire-city-defaults.ts | 479 | resolveCityPoziomRacji | PORTOWANY | rust-port/engine/src/domain/state.rs:3343 (resolve_city_poziom_racji) | empire::poziom_racji_functions_match_web | PoziomRacji = number -> f64 |
| empire-city-defaults.ts | 494 | broadcastPoziomRacjiToOwnerCities | PORTOWANY | rust-port/engine/src/domain/state.rs:3355 (broadcast_poziom_racji_to_owner_cities) | empire::poziom_racji_functions_match_web | - |
| empire-city-defaults.ts | 511 | broadcastAutoWyzywienieToOwnerCities | PORTOWANY | rust-port/engine/src/domain/state.rs:3369 (broadcast_auto_wyzywienie_to_owner_cities) | empire::poziom_racji_functions_match_web | - |
| empire-city-defaults.ts | 522 | migratePoziomRacjiOnLoad | PORTOWANY | rust-port/engine/src/domain/state.rs:3379 (migrate_poziom_racji_on_load) | empire::poziom_racji_functions_match_web | - |
| empire-city-defaults.ts | 552 | freshOwnerDefaultPoziomRacji | PORTOWANY | rust-port/engine/src/domain/state.rs:3423 (fresh_owner_default_poziom_racji) | empire::poziom_racji_functions_match_web | - |
| display-names.ts | 8 | CITY_STATE_LABEL | PORTOWANY | rust-port/engine/src/domain/state.rs:1078 (city_state_label) | display::labels_match_running_web | dane: display-names-params.json etykieta_miasto_panstwo |
| display-names.ts | 9 | CITY_STATE_SEPARATOR | PORTOWANY | rust-port/engine/src/domain/state.rs:1083 (city_state_separator) | display::labels_match_running_web | dane: display-names-params.json separator |
| display-names.ts | 11 | EntityDisplayCtx | PORTOWANY | rust-port/engine/src/domain/state.rs:1089 (EntityDisplayCtx) | display::format_entity_display_name_matches_web | baseName?/isCityState? -> Option |
| display-names.ts | 17 | formatEntityDisplayName | PORTOWANY | rust-port/engine/src/domain/state.rs:1095 (format_entity_display_name) | display::format_entity_display_name_matches_web | trim = js_trim (BOM tak, U+0085 nie) |
| display-names.ts | 27 | stripCityStateSuffix | PORTOWANY | rust-port/engine/src/domain/state.rs:1107 (strip_city_state_suffix) | display::strip_city_state_suffix_matches_web | - |
| display-names.ts | 33 | isClusterCityStateSlot | PORTOWANY | rust-port/engine/src/domain/state.rs:1123 (is_cluster_city_state_slot); rust-port/engine/src/domain/state.rs:1116 (ClusterSlot) | display::is_cluster_city_state_slot_matches_web | slot: 3 pola Option<bool> (27 kombinacji w wektorze) |
| display-names.ts | 43 | OwnerCityStateOpts | PORTOWANY | rust-port/engine/src/domain/state.rs:1142 (OwnerCityStateOpts); rust-port/engine/src/domain/state.rs:1135 (OwnerCityRef) | display::is_owner_cluster_city_state_matches_web | Set -> HashSet<i64>, cities -> &[OwnerCityRef] |
| display-names.ts | 50 | isOwnerClusterCityState | PORTOWANY | rust-port/engine/src/domain/state.rs:1150 (is_owner_cluster_city_state) | display::is_owner_cluster_city_state_matches_web | ownerId jako i64 |
| display-names.ts | 88 | clearCityStateFlagOnCapture | PORTOWANY | rust-port/engine/src/domain/state.rs:1174 (clear_city_state_flag_on_capture) | display::clear_city_state_flag_on_capture_matches_web | city.startCityState -> &mut Option<bool> |
| display-names.ts | 96 | ForceCultureIconOpts | PORTOWANY | rust-port/engine/src/domain/state.rs:1184 (ForceCultureIconOpts) | display::should_force_culture_icon_matches_web | extends OwnerCityStateOpts -> pole base |
| display-names.ts | 110 | shouldForceCultureIconForOwner | PORTOWANY | rust-port/engine/src/domain/state.rs:1192 (should_force_culture_icon_for_owner) | display::should_force_culture_icon_matches_web | - |
| display-names.ts | 134 | CityMapLabelOpts | PORTOWANY | rust-port/engine/src/domain/state.rs:1212 (CityMapLabelOpts); rust-port/engine/src/domain/state.rs:1221 (CityMapLabelCity) | display::format_city_map_label_matches_web | city: podzbior pol (name, ownerId, startCityState) |
| display-names.ts | 171 | formatCityMapLabel | PORTOWANY | rust-port/engine/src/domain/state.rs:1228 (format_city_map_label) | display::format_city_map_label_matches_web | - |
| display-names.ts | 198 | formatOwnerDiploLabel | PORTOWANY | rust-port/engine/src/domain/state.rs:1259 (format_owner_diplo_label) | display::format_owner_diplo_label_matches_web | - |
| display-names.ts | 210 | isTechnicalOwnerLabel | PORTOWANY | rust-port/engine/src/domain/state.rs:1296 (is_technical_owner_label) | display::is_technical_owner_label_matches_web | regexy /^X \d+$/i -> display-names-params.json wzorce_techniczne (ASCII) |
| display-names.ts | 219 | ResolveOwnerBaseNameInput | PORTOWANY | rust-port/engine/src/domain/state.rs:1309 (ResolveOwnerBaseNameInput) | display::resolve_owner_base_name_matches_web | - |
| display-names.ts | 229 | cleanDisplayPart | PORTOWANY | - | display::resolve_owner_base_name_matches_web | prywatna; fn clean_display_part (niepubliczna) w state.rs; Some("") jest falsy, nie nullish |
| display-names.ts | 247 | foreignCapitalMapName | PORTOWANY | rust-port/engine/src/domain/state.rs:1334 (foreign_capital_map_name) | display::foreign_capital_map_name_matches_web | - |
| display-names.ts | 262 | resolveOwnerBaseName | PORTOWANY | rust-port/engine/src/domain/state.rs:1345 (resolve_owner_base_name) | display::resolve_owner_base_name_matches_web | ownerId w webie nieuzywane |
| display-names.ts | 301 | sanitizeOwnerDisplayBase | PORTOWANY | rust-port/engine/src/domain/state.rs:1397 (sanitize_owner_display_base) | display::sanitize_owner_display_base_matches_web | - |

## 4. Decyzje i zalozenia (zamiast pytan)

- **ZA1 (widocznosc modulow).** Nowe moduly leza w `domain/state.rs` jako `pub mod p6_6b { display_names, cities, empire_city_defaults }`. `state` jest modulem prywatnym `domain`, a `domain/mod.rs` i `terrain.rs` sa poza allowlista, wiec modul jest udostepniony jedna linia `pub use super::p6_6b;` wewnatrz JUZ publicznego `city_founding` (tez `state.rs`). Sciezka w testach: `civ_engine::domain::terrain::city_founding::p6_6b::{display_names, cities, empire_city_defaults}`. Przeniesienie re-eksportu do `terrain.rs`/`mod.rs` to zadanie integracyjne (R2-1).
- **ZA2 (typ `City`).** `cities::City` modeluje 38 z 61 pol interfejsu (`cities.ts:834-1118`; liczba 61 zgodna z P2-3 linia 10) - wszystkie pola czytane lub zapisywane przez logike trzech plikow - plus surowe pole legacy `ulepszeniaPerTurn` (nietypowane w webie, czytane przez migracje). Pozostale 23 pola (`maMur`, `maFort`, `maBaszta`, `maWarsztatOblezniczy`, `oblegane`, `garnizon`, `oblegajacyOwnerId`, `siegeCapitulationPending`, `siegeMachines`, `okolicaReczne`, `budowaListaUkonczonaHintShown`, `revoltGraceRemaining`, `rebelState`, `rebelPreviousOwnerId`, `rebelProtectionTurnsRemaining`, `postCaptureLawTurnsRemaining`, `wasRebellionReconquest`, `kulturaSkumulowana`, `ownCultureShare`, `foundedTurn`, `manpower`, `centerWorkedTile`, `barbGarrisonSpawnCooldown`) to dane bez logiki w tych plikach: `grep -v` komentarzy po kazdej nazwie w `cities.ts` (poza interfejsem), `empire-city-defaults.ts`, `display-names.ts` = 0 uzyc (jedyne trafienie `siegeMachines` to sciezka importu typu). Pelny DTO powstanie przy save/load lub integracji (R2-3).
- **ZA3 (liczby JS).** Wszystkie liczby to `f64` z semantyka JS: `Math.min/max/round` przez `js_min/js_max/js_round` (polowki ku +inf, `-0`, `NaN`), `typeof n !== 'number'` -> `Option<f64>` (`None` = nie-liczba), `unknown` -> `Option<f64>` (znaczenie ma tylko `typeof number` i `=== 1|2|3`). `undefined` pola -> `Option`. Porownanie z webem BITOWE (w tym `-0` i `NaN`).
- **ZA4 (`Date.now`, licznik).** `_budowaListaSzablonSeq` (stan modulu weba) -> jawny `BudowaListaIdGen`; `Date.now()` -> parametr `now_ms` / domkniecie `now`. W generatorze jedyna ingerencja w srodowisko to `Date.now` zwracajace ustalone wartosci (logika nietknieta).
- **ZA5 (wejscia z innych modulow).** Wstrzykiwane domkniecia `SaveDefaultsDeps`: `readCityFoodBuffer`, `ensureCityRationDefaults` (wynik prawdziwego kodu weba zapisany w wektorze jako delta pol `poziomRacji`/`rationMigratedV114`/`wzrostUlamkowy`/`turyBezDoplaty` liczona na kopii wejscia; test sprawdza liczbe wywolan = 1, kolejnosc po normalizacji magazynu i argument). `freshWealthState`, `DEFAULT_POZIOM_RACJI` (4) i `WYZYWIENIE_MAX` (6) to male stale cudzych plikow: trzymane w `cities-params.json` w sekcji `wejscia_z_innych_modulow_weba` z adnotacja zrodla; zgodnosc z webem pilnuje wektor `constants`, a test `cities_foreign_inputs_agree_with_engine_data` sprawdza spojnosc z tabela racji silnika (`racje.json`). Podmiana na prawdziwe porty przy `population-growth-v85`/`wealth`/`economy-upkeep` (R2-2).
- **ZA6 (id miasta).** `foundCity*` tworzy `id = "city" + liczba_miast` jak web (`cities.ts:1249`, `:1286`); monotoniczny `CityId` z P2-3 D-ID-3 to decyzja modelu ID poza zakresem (R2-4).
- **ZA7 (klucze heksow).** `canFoundCity` szuka `"q,r"`; `RuchMapa` ma klucze calkowite, wiec `q`/`r` niecalkowite, nieskonczone lub `NaN` daja `poza mapa` (web: taki klucz nie istnieje w mapie z calkowitymi kluczami). `-0` -> klucz `0`. ZALOZENIE: mapa ma wylacznie calkowite klucze (generator map).
- **ZA8 (wlasciciele).** `ownerId` jako `i64` (sentinele `-1`, `-99`).
- **ZA9 (`BudowaTryb::Auto`).** Dodatkowy wariant istnieje tylko dla surowej wartosci `'auto'` ze starych zapisow (`cities.ts:753`); `is_auto_budowa_tryb(Auto)` = `false` jak w webie.
- **ZA10 (dwa literaly o tej samej wartosci).** `AI_DEFAULT_BUDOWA_TRYB` (`empire-city-defaults.ts:354`) i `budowaTryb: 'zrownowazone'` w `foundCityAt` (`cities.ts:1303`) to dwa niezalezne literaly weba; w tabeli dwa klucze (`domyslny_tryb_ai`, `domyslny_tryb_nowe_miasto`), zeby zmiana jednego nie zmieniala drugiego.
- **ZA11 (`cityName`).** `CITY_NAMES[index] as string` dla indeksu niecalkowitego z zakresu to `undefined` -> `None`.
- **ZA12 (`migrateUlepszeniaPerTurnToPercent`).** Typ weba to `1|2|3`; wartosc spoza tabeli trafia do ostatniego wiersza (galaz `return 100`), test z wartosciami 0, 4, -1, 2.5.
- **ZA13 (`MIN_CITY_DISTANCE`).** `miastoParams.min_dystans_miast?.wartosc ?? 5`: wartosc z `data/miasto-params.json` (typ danych wymusza pole), zapasowe `5` nieosiagalne.
- **ZA14 (regexy `isTechnicalOwnerLabel`).** `/^Rywal \d+$/i`, `/^AI \d+$/i`, `/^oid-\d+$/i` -> wzorce prefiks + cyfry ASCII; flaga `i` bez `u` w JS porownuje przez `toUpperCase`, ale nie zrownuje znakow nie-ASCII z ASCII (np. `ı`, `İ`) - wektor zawiera takie napisy (`Aı 5`, `İstanbul`), a cyfry `\d` to wylacznie `0-9` (wektor: cyfry arabsko-indyjskie i pelnoszerokie daja `false`).
- **ZA15 (`OwnerMap`).** `Map<number,V>` weba iteruje w kolejnosci wstawiania; `OwnerMap` zachowuje te kolejnosc (ponowne `set` nie zmienia miejsca) - kolejnosc wynikowa `upgradeBudowaProfilAutoDefaultsOnLoad` jest zgodna bitowo.
- **ZA16 (`#[allow(clippy::too_many_arguments)]`).** `found_city_at` ma 8 argumentow jak `foundCityAt`; zachowana sygnatura weba.
- **ZA17 (rozmiar wektorow).** Wektory ~7 MB (5 plikow JSON); liczby przypadkow ograniczone tak, by repo nie rosło ponad potrzebe, a kazda galaz miala przypadki (progi w testach: m.in. galaz zapisanych domyslnych, cap Nauki, migracja `'auto'`, wszystkie powody odmowy).

## 5. Testy i wektory

- Generator: `gen-p66b-vectors.mjs` (Node 22, `--experimental-transform-types`, loader `p66b-loader-*.mjs`) laduje PRAWDZIWE `cities.ts`, `empire-city-defaults.ts`, `display-names.ts` oraz ich zaleznosci (`economy-upkeep.ts`, `population-growth-v85.ts`, `wealth.ts`, `units/setup.ts`, `types/hex.ts`, `data/miasto-params.json`) z `git archive edb8fb56`. Zero stubow i wrapperow logiki. Wyjscie deterministyczne (Mulberry32, ziarno stale; dwa uruchomienia daja identyczne sumy SHA-256).
- Wektory (`rust-port/engine/tests/p6_6b_vectors/*.json`): `display.json` (12 grup, m.in. 900 `resolveOwnerBaseName`, 900 `formatCityMapLabel`, 800 `shouldForceCultureIconForOwner`, 702 `isOwnerClusterCityState`), `percent.json` (stale, clampy, 2000+ `adjustHandelSplit`, polityka AI, `resolveEffectiveUlepszenia`), `lists.json` (sekwencja ladowania biblioteki z licznikiem id), `empire.json` (migracje, broadcasty, `upgradeBudowaProfilAutoDefaultsOnLoad`: pelne listy miast i mapy wlascicieli przed/po), `cities.json` (800 `ensureCitySaveDefaults`, 400 `ensureCityPodzialDefaults`, 1500 `canFoundCity`, po 450 `foundCity`/`foundCityAt`/`foundCityFromVillage`, `cityName`).
- Testy (`tests/p6_6b_*.rs`, 45 nowych): display 13, percent 10, lists 3, empire 6, cities_ensure 3, cities_found 5, tables 5. Porownanie BITOWE f64 (`assert_bits`, `values_eq`); testy ksztaltu tabel (`p6_6b_tables.rs`) nie pinuja wartosci balansu. Progi pokrycia w testach (np. `trues >= 50`, `oks >= 50`, wszystkie 6 powodow odmowy, wszystkie 4 rodzaje magazynu zywnosci) pilnuja, by wektor realnie obejmowal galezie.
- Niezalezny weryfikator `verify-p66b-vectors.py` (Python, bez TS/Node/Rust): semantyke trzech plikow implementuje od nowa z TEKSTU zrodel, stale czyta regexem ze zrodel TS i z `gra/data`; wynik: 24489 sprawdzen, 0 rozbieznosci (§11.5). Test negatywny (§11.6): 5 celowo zepsutych wartosci wektorow -> 5 rozbieznosci, `EXIT=1`.
- Brak literalow danych/mnoznikow w nowym kodzie: dowod §11.7 (kazda linia z literalem sklasyfikowana jako STRUKTURALNA; dane/teksty/progi w `cities-params.json`, `display-names-params.json`, `miasto-params.json`).

## 6. Mutacje (testy wykrywaja zmiany)

`mutate-p66b.py` zmienia JEDEN fragment `state.rs` albo tabeli JSON, uruchamia wlasciwe testy `p6_6b_*` i przywraca plik (obsluga SIGTERM). Wynik: 209 mutantow, wykrytych 204, ROWNOWAZNYCH 5 (zmiana nie zmienia zachowania - uzasadnienie przy kazdym w surowym wyjsciu, m.in. martwy kod weba i wtorna klamra), ocalalych 0. Mutanty ocalale na pierwszym przebiegu (brak przypadkow granicznych: limit miast na granicy, pusta biblioteka przed legacy, granica petli nazw, puste czesci nazw) doprowadzone do wykrycia przez DODANIE przypadkow stalych do generatora (`mutation-evidence-r1b.txt`), bez oslabiania testow; mutanty niekompilujace sie w przebiegu rownoleglym (brak miejsca na dysku) powtorzone na wlasciwym katalogu. Przebieg wykonano na 4 kopiach katalogu `engine` rownolegle (zakresy indeksow), potem uzupelniono na wlasciwym katalogu; nad zrodlem pracuje jedna kopia naraz. Pelne surowe wyjscie ponizej (`mutation-evidence-r1.txt`); `MUT_CHECK=1` potwierdza, ze kazdy fragment wystepuje dokladnie raz.

```text
# mutation-evidence-r1.txt
# P6.6B mutacje: wynik ostateczny na kodzie i wektorach z commitu (kolejnosc jak w mutate-p66b.py).
# Przebiegi: 4 rownolegle kopie katalogu engine (zakresy indeksow 0-69, 70-104, 105-174, 175-208), nastepnie
# doprowadzenie na wlasciwym katalogu: mutanty niekompilujace sie z powodu braku miejsca na dysku, mutanty
# przezywajace na starszych wektorach (po dodaniu przypadkow stalych) i mutanty nowe/zmienione. Dla kazdego mutanta
# liczy sie OSTATNI wynik nie-KOMPILACJA. Surowe wyjscia czesciowe: mutation-evidence-r1-part*.txt.
WYKRYTY   : disp: strip nie obcina dopisku -> 6 testow czerwonych: format_city_map_label_matches_web, foreign_capital_map_name_matches_web, format_owner_diplo_label_matches_web
WYKRYTY   : disp: format - pusta baza zwraca baze -> 3 testow czerwonych: format_entity_display_name_matches_web, format_city_map_label_matches_web, format_owner_diplo_label_matches_web
WYKRYTY   : disp: format - odwrocony isCityState -> 3 testow czerwonych: format_city_map_label_matches_web, format_owner_diplo_label_matches_web, format_entity_display_name_matches_web
WYKRYTY   : disp: format - bez trim -> 3 testow czerwonych: format_city_map_label_matches_web, format_entity_display_name_matches_web, format_owner_diplo_label_matches_web
WYKRYTY   : disp: slot - stolica gracza -> 1 testow czerwonych: is_cluster_city_state_slot_matches_web
WYKRYTY   : disp: slot - rywal tego samego typu -> 1 testow czerwonych: is_cluster_city_state_slot_matches_web
WYKRYTY   : disp: slot - stolica klastra -> 1 testow czerwonych: is_cluster_city_state_slot_matches_web
WYKRYTY   : disp: ownerCs - wlasciciel 0 -> 2 testow czerwonych: is_owner_cluster_city_state_matches_web, format_owner_diplo_label_matches_web
WYKRYTY   : disp: ownerCs - startCityState lub -> 3 testow czerwonych: format_owner_diplo_label_matches_web, is_owner_cluster_city_state_matches_web, should_force_culture_icon_matches_web
WYKRYTY   : disp: ownerCs - brak typCopy -> 3 testow czerwonych: format_owner_diplo_label_matches_web, is_owner_cluster_city_state_matches_web, should_force_culture_icon_matches_web
WYKRYTY   : disp: ownerCs - brak simplified -> 3 testow czerwonych: format_owner_diplo_label_matches_web, is_owner_cluster_city_state_matches_web, should_force_culture_icon_matches_web
WYKRYTY   : disp: clear - warunek flagi -> 1 testow czerwonych: clear_city_state_flag_on_capture_matches_web
WYKRYTY   : disp: clear - nie gasi flagi -> 1 testow czerwonych: clear_city_state_flag_on_capture_matches_web
WYKRYTY   : disp: force - brak wykluczenia stolic klastra -> 1 testow czerwonych: should_force_culture_icon_matches_web
WYKRYTY   : disp: force - klucze bez trim -> 1 testow czerwonych: should_force_culture_icon_matches_web
WYKRYTY   : disp: force - puste klucze rowne -> 1 testow czerwonych: should_force_culture_icon_matches_web
WYKRYTY   : disp: force - wlasciciel 0 -> 1 testow czerwonych: should_force_culture_icon_matches_web
WYKRYTY   : disp: mapLabel - MP tylko obce -> 1 testow czerwonych: format_city_map_label_matches_web
WYKRYTY   : disp: mapLabel - bez wykluczenia MP-wlasciciela -> 1 testow czerwonych: format_city_map_label_matches_web
WYKRYTY   : disp: mapLabel - gracz domyslnie 1 -> 1 testow czerwonych: format_city_map_label_matches_web
WYKRYTY   : disp: mapLabel - stolica niewymagana -> 1 testow czerwonych: format_city_map_label_matches_web
WYKRYTY   : disp: diplo - bez obciecia dopisku -> 1 testow czerwonych: format_owner_diplo_label_matches_web
WYKRYTY   : disp: technical - cyfry opcjonalne -> 5 testow czerwonych: is_technical_owner_label_matches_web, format_city_map_label_matches_web, foreign_capital_map_name_matches_web
WYKRYTY   : disp: technical - wielkosc liter -> 5 testow czerwonych: foreign_capital_map_name_matches_web, format_city_map_label_matches_web, is_technical_owner_label_matches_web
WYKRYTY   : disp: technical - wszystkie wzorce -> 5 testow czerwonych: foreign_capital_map_name_matches_web, format_city_map_label_matches_web, is_technical_owner_label_matches_web
WYKRYTY   : disp: technical - bez trim -> 5 testow czerwonych: foreign_capital_map_name_matches_web, is_technical_owner_label_matches_web, format_city_map_label_matches_web
WYKRYTY   : disp: technical - dowolne znaki po prefiksie -> 5 testow czerwonych: foreign_capital_map_name_matches_web, format_city_map_label_matches_web, is_technical_owner_label_matches_web
WYKRYTY   : disp: clean - bez odsiewu placeholderow -> 3 testow czerwonych: format_city_map_label_matches_web, foreign_capital_map_name_matches_web, resolve_owner_base_name_matches_web
WYKRYTY   : disp: resolve - rowne nazwy laczone -> 1 testow czerwonych: resolve_owner_base_name_matches_web
WYKRYTY   : disp: resolve - stolica klastra -> 1 testow czerwonych: resolve_owner_base_name_matches_web
WYKRYTY   : disp: resolve - nie-MP bierze kulture -> 1 testow czerwonych: resolve_owner_base_name_matches_web
WYKRYTY   : disp: resolve - cache pusty po trim -> 1 testow czerwonych: resolve_owner_base_name_matches_web
WYKRYTY   : disp: resolve - miasto pusty po trim -> 1 testow czerwonych: resolve_owner_base_name_matches_web
WYKRYTY   : disp: truthy - pusty napis prawdziwy -> 1 testow czerwonych: resolve_owner_base_name_matches_web
WYKRYTY   : disp: foreign - bez fallbacku na kulture -> 2 testow czerwonych: foreign_capital_map_name_matches_web, format_city_map_label_matches_web
WYKRYTY   : disp: sanitize - bez odsiewu placeholderow -> 1 testow czerwonych: sanitize_owner_display_base_matches_web
WYKRYTY   : disp: sanitize - civ bez odsiewu -> 1 testow czerwonych: sanitize_owner_display_base_matches_web
WYKRYTY   : tab: separator -> 8 testow czerwonych: format_city_map_label_matches_web, format_entity_display_name_matches_web, foreign_capital_map_name_matches_web
WYKRYTY   : tab: wzorzec oid- wielkosc liter -> 5 testow czerwonych: foreign_capital_map_name_matches_web, format_city_map_label_matches_web, is_technical_owner_label_matches_web
WYKRYTY   : tab: wzorzec AI bez cyfr -> 5 testow czerwonych: format_city_map_label_matches_web, foreign_capital_map_name_matches_web, is_technical_owner_label_matches_web
WYKRYTY   : pct: clamp ulepszen bez zaokraglenia -> 4 testow czerwonych: ensure_city_save_defaults_matches_web, clamp_functions_match_web, resolve_effective_ulepszenia_matches_web
WYKRYTY   : pct: clamp ulepszen domyslna -> 4 testow czerwonych: ensure_city_save_defaults_matches_web, clamp_functions_match_web, resolve_effective_ulepszenia_matches_web
WYKRYTY   : pct: clamp podzialu bez dolnej granicy -> 3 testow czerwonych: ensure_city_podzial_defaults_matches_web, ensure_city_save_defaults_matches_web, clamp_functions_match_web
WYKRYTY   : pct: clamp podzialu domyslna -> 3 testow czerwonych: ensure_city_save_defaults_matches_web, ensure_city_podzial_defaults_matches_web, clamp_functions_match_web
WYKRYTY   : pct: pula z budynkow -> 1 testow czerwonych: clamp_functions_match_web
WYKRYTY   : pct: podzial z procentu puli - brak odwrotnosci -> 1 testow czerwonych: podzial_pracy_z_procentu_puli_matches_web
ROWNOWAZNY: pct: podzial z procentu puli - gorna granica | pozniejszy clamp_podzial_pracy_budynki_percent (dolna granica budynkow 50) i tak ogranicza wynik do tego samego zakresu
WYKRYTY   : pct: migracja per-turn - ostatni wiersz -> 1 testow czerwonych: snap_and_migrate_match_web
WYKRYTY   : pct: resolve raw - nowe pole przed legacy -> 3 testow czerwonych: ensure_city_save_defaults_is_idempotent_on_web_outputs, ensure_city_save_defaults_matches_web, resolve_praca_percent_from_raw_matches_web
WYKRYTY   : pct: resolve raw - legacy tylko 1|2|3 -> 2 testow czerwonych: ensure_city_save_defaults_matches_web, resolve_praca_percent_from_raw_matches_web
WYKRYTY   : pct: cap AI - bez ograniczenia procentu -> 1 testow czerwonych: ulepszenia_policy_and_caps_match_web
WYKRYTY   : pct: cap AI - sufit -> 1 testow czerwonych: ulepszenia_policy_and_caps_match_web
WYKRYTY   : pct: polityka AI - pelna pula -> 1 testow czerwonych: ulepszenia_policy_and_caps_match_web
WYKRYTY   : pct: polityka AI - odwrocony predykat -> 1 testow czerwonych: ulepszenia_policy_and_caps_match_web
WYKRYTY   : pct: efektywne - override tylko true -> 1 testow czerwonych: resolve_effective_ulepszenia_matches_web
WYKRYTY   : pct: efektywne - procent bez clampa -> 1 testow czerwonych: resolve_effective_ulepszenia_matches_web
WYKRYTY   : pct: efektywne - wolno z imperium -> 1 testow czerwonych: resolve_effective_ulepszenia_matches_web
WYKRYTY   : pct: snap - bez zaokraglenia -> 5 testow czerwonych: ensure_city_podzial_defaults_matches_web, ensure_city_save_defaults_matches_web, adjust_handel_split_matches_web
WYKRYTY   : pct: normalize - brak limitu Nauki -> 3 testow czerwonych: ensure_city_save_defaults_matches_web, ensure_city_podzial_defaults_matches_web, normalize_podzial_handlu_matches_web
WYKRYTY   : pct: normalize - nadwyzka do Luksusu -> 3 testow czerwonych: ensure_city_podzial_defaults_matches_web, ensure_city_save_defaults_matches_web, normalize_podzial_handlu_matches_web
ROWNOWAZNY: pct: normalize - ponowny limit Nauki | po l = clamp(l + (100 - sum)) wartosc n nie moze przekroczyc limitu (sum < 100 przy l = 100 wymagaloby p + n < 0, a snap_handel_pct daje >= 0) - martwy kod weba
WYKRYTY   : pct: normalize - korekta Pieniadza -> 2 testow czerwonych: ensure_city_save_defaults_matches_web, normalize_podzial_handlu_matches_web
WYKRYTY   : pct: adjust - cap Nauki przy zmianie -> 1 testow czerwonych: adjust_handel_split_matches_web
WYKRYTY   : pct: adjust - nadmiar zeruje reszte -> 1 testow czerwonych: adjust_handel_split_matches_web
WYKRYTY   : pct: adjust - Nauka na capie -> 1 testow czerwonych: adjust_handel_split_matches_web
ROWNOWAZNY: pct: adjust - reszta pod capem Nauki | nauka = min(max, reszta) <= reszta, wiec reszta - nauka >= 0 i js_max(0, .) nie zmienia wyniku
WYKRYTY   : pct: adjust - suma pozostalych zero -> 1 testow czerwonych: adjust_handel_split_matches_web
WYKRYTY   : pct: adjust - polowa po rowno -> 1 testow czerwonych: adjust_handel_split_matches_web
WYKRYTY   : pct: adjust - proporcja -> 1 testow czerwonych: adjust_handel_split_matches_web
ROWNOWAZNY: pct: adjust - v0 ponad reszta | reszta jest wielokrotnoscia kroku (100 - wartosc po snap), wiec v0 == reszta daje floor(reszta / krok) * krok == reszta
WYKRYTY   : pct: adjust - cap Nauki k0 -> 1 testow czerwonych: adjust_handel_split_matches_web
WYKRYTY   : pct: adjust - cap Nauki k1 -> 1 testow czerwonych: adjust_handel_split_matches_web
WYKRYTY   : pct: priorytety - sanitize bez filtra -> 2 testow czerwonych: ensure_city_save_defaults_matches_web, budowa_priority_helpers_match_web
WYKRYTY   : pct: priorytety - pusta lista -> 2 testow czerwonych: ensure_city_save_defaults_matches_web, budowa_priority_helpers_match_web
WYKRYTY   : pct: isAuto - lista -> 1 testow czerwonych: budowa_priority_helpers_match_web
WYKRYTY   : pct: isAuto - domyslny tryb -> 1 testow czerwonych: budowa_priority_helpers_match_web
WYKRYTY   : pct: isTyp - zrownowazone -> 2 testow czerwonych: ensure_city_save_defaults_matches_web, budowa_priority_helpers_match_web
WYKRYTY   : pct: procent rozwoj - bez zaokraglenia -> 1 testow czerwonych: constants_match_running_web
WYKRYTY   : pct: max pula -> 2 testow czerwonych: constants_match_running_web, podzial_pracy_z_procentu_puli_matches_web
WYKRYTY   : tab: domyslny podzial pracy 70 -> 60 -> 10 testow czerwonych: ensure_city_save_defaults_matches_web, ensure_city_podzial_defaults_matches_web, found_city_at_matches_web
WYKRYTY   : tab: min budynki 50 -> 40 -> 7 testow czerwonych: ensure_city_podzial_defaults_matches_web, ensure_city_save_defaults_matches_web, podzial_pracy_functions_match_web
WYKRYTY   : tab: cap Nauki 60 -> 50 -> 6 testow czerwonych: ensure_city_save_defaults_is_idempotent_on_web_outputs, ensure_city_save_defaults_matches_web, ensure_city_podzial_defaults_matches_web
WYKRYTY   : tab: krok handlu 10 -> 5 -> 6 testow czerwonych: ensure_city_podzial_defaults_matches_web, ensure_city_save_defaults_matches_web, adjust_handel_split_matches_web
WYKRYTY   : tab: domyslny handel 20/60/20 -> 30/50/20 -> 3 testow czerwonych: ensure_city_podzial_defaults_matches_web, ensure_city_save_defaults_matches_web, constants_match_running_web
WYKRYTY   : tab: procent AI 100 -> 90 -> 2 testow czerwonych: constants_match_running_web, ulepszenia_policy_and_caps_match_web
WYKRYTY   : tab: migracja 2 -> 50 -> 3 testow czerwonych: ensure_city_save_defaults_matches_web, snap_and_migrate_match_web, resolve_praca_percent_from_raw_matches_web
WYKRYTY   : tab: focus okolicy -> 3 testow czerwonych: ensure_city_save_defaults_matches_web, okolica_focus_functions_match_web, constants_match_running_web
WYKRYTY   : tab: poziom racji 4 -> 3 -> 5 testow czerwonych: found_city_at_matches_web, found_city_from_village_matches_web, found_city_matches_web
WYKRYTY   : tab: wealth pula -> 5 testow czerwonych: ensure_city_save_defaults_matches_web, found_city_at_matches_web, found_city_from_village_matches_web
WYKRYTY   : tab: dystans MP 3 -> 4 -> 5 testow czerwonych: found_city_at_matches_web, found_city_from_village_matches_web, can_found_city_matches_web
WYKRYTY   : tab: limit miast 10 -> 12 -> 1 testow czerwonych: can_found_city_matches_web
WYKRYTY   : tab: krok epoki 5 -> 4 -> 1 testow czerwonych: can_found_city_matches_web
WYKRYTY   : tab: immunitet wealth 5 -> 4 -> 3 testow czerwonych: found_city_from_village_matches_web, found_city_at_matches_web, found_city_matches_web
WYKRYTY   : tab: nazwa miasta Ur -> 2 testow czerwonych: found_city_from_village_matches_web, city_name_and_predicates_match_web
WYKRYTY   : tab: prefiks generyczny -> 2 testow czerwonych: city_name_and_predicates_match_web, found_city_from_village_matches_web
WYKRYTY   : tab: powod morze -> 2 testow czerwonych: can_found_city_matches_web, found_city_from_village_matches_web
WYKRYTY   : tab: priorytet typow -> 3 testow czerwonych: ensure_city_save_defaults_matches_web, constants_match_running_web, budowa_priority_helpers_match_web
WYKRYTY   : tab: tryb nowego miasta -> 2 testow czerwonych: found_city_at_matches_web, found_city_from_village_matches_web
WYKRYTY   : tab: tryb AI -> 2 testow czerwonych: upgrade_budowa_profil_auto_defaults_matches_web, budowa_profil_functions_match_web
WYKRYTY   : tab: etykieta puli -> 1 testow czerwonych: constants_match_running_web
WYKRYTY   : tab: id prefiks -> 3 testow czerwonych: found_city_at_matches_web, found_city_from_village_matches_web, found_city_matches_web
WYKRYTY   : tab: prefiks listy -> 1 testow czerwonych: default_nazwa_matches_web
WYKRYTY   : list: id - licznik od 0 -> 1 testow czerwonych: id_generator_and_loader_match_web_sequence
WYKRYTY   : list: nazwa - uwzglednia wielkosc liter -> 1 testow czerwonych: default_nazwa_matches_web
WYKRYTY   : list: nazwa - bez trim -> 1 testow czerwonych: default_nazwa_matches_web
WYKRYTY   : list: nazwa - zapas -> 1 testow czerwonych: default_nazwa_matches_web
WYKRYTY   : list: nazwa - granica petli -> 1 testow czerwonych: default_nazwa_matches_web
WYKRYTY   : list: loader - szablon bez budynkow -> 1 testow czerwonych: id_generator_and_loader_match_web_sequence
WYKRYTY   : list: loader - pusta biblioteka nie jest tablica -> 1 testow czerwonych: id_generator_and_loader_match_web_sequence
WYKRYTY   : list: loader - pusty slot legacy -> 1 testow czerwonych: id_generator_and_loader_match_web_sequence
WYKRYTY   : list: loader - legacy wymaga wszystkich kluczy -> 1 testow czerwonych: id_generator_and_loader_match_web_sequence
WYKRYTY   : list: loader - legacy tablica -> 1 testow czerwonych: id_generator_and_loader_match_web_sequence
WYKRYTY   : list: loader - nazwa legacy -> 1 testow czerwonych: id_generator_and_loader_match_web_sequence
WYKRYTY   : list: dedupe - puste id -> 1 testow czerwonych: dedupe_matches_web
WYKRYTY   : list: dedupe - kolejnosc -> 1 testow czerwonych: dedupe_matches_web
WYKRYTY   : emp: podzial equal bez clampa -> 1 testow czerwonych: podzial_pracy_functions_match_web
WYKRYTY   : emp: resolve podzial - override -> 1 testow czerwonych: podzial_pracy_functions_match_web
WYKRYTY   : emp: resolve podzial - bez normalizacji -> 1 testow czerwonych: podzial_pracy_functions_match_web
WYKRYTY   : emp: resolve podzial - fallback parametrow -> 1 testow czerwonych: podzial_pracy_functions_match_web
WYKRYTY   : emp: local - rowne globalnemu -> 1 testow czerwonych: podzial_pracy_functions_match_web
WYKRYTY   : emp: local - globalny z domyslnej -> 1 testow czerwonych: podzial_pracy_functions_match_web
WYKRYTY   : emp: migracja podzialu - kasowanie pola -> 1 testow czerwonych: podzial_pracy_migration_matches_web
WYKRYTY   : emp: migracja podzialu - pominiecie z flaga -> 1 testow czerwonych: podzial_pracy_migration_matches_web
WYKRYTY   : emp: migracja podzialu - bezwarunkowa normalizacja -> 1 testow czerwonych: podzial_pracy_migration_matches_web
WYKRYTY   : emp: migracja podzialu - zapisane domyslne bez normalizacji -> 1 testow czerwonych: podzial_pracy_migration_matches_web
WYKRYTY   : emp: migracja podzialu - uzupelnienie wlascicieli -> 1 testow czerwonych: podzial_pracy_migration_matches_web
WYKRYTY   : emp: okolica resolve - override -> 1 testow czerwonych: okolica_focus_functions_match_web
WYKRYTY   : emp: okolica resolve - kolejnosc fallbackow -> 1 testow czerwonych: okolica_focus_functions_match_web
WYKRYTY   : emp: okolica broadcast - pin -> 1 testow czerwonych: okolica_focus_functions_match_web
WYKRYTY   : emp: okolica migracja - zachowanie wartosci -> 1 testow czerwonych: okolica_focus_functions_match_web
WYKRYTY   : emp: okolica migracja - nadpisanie przy braku roznicy -> 1 testow czerwonych: okolica_focus_functions_match_web
WYKRYTY   : emp: okolica migracja - pierwsze miasto -> 1 testow czerwonych: okolica_focus_functions_match_web
WYKRYTY   : emp: budowa equal - tryb -> 1 testow czerwonych: budowa_profil_functions_match_web
WYKRYTY   : emp: budowa resolve - override -> 1 testow czerwonych: budowa_profil_functions_match_web
WYKRYTY   : emp: budowa broadcast - pin -> 2 testow czerwonych: budowa_profil_functions_match_web, upgrade_budowa_profil_auto_defaults_matches_web
WYKRYTY   : emp: budowa broadcast - tryb -> 2 testow czerwonych: budowa_profil_functions_match_web, upgrade_budowa_profil_auto_defaults_matches_web
WYKRYTY   : emp: budowa migracja - brak pola -> 1 testow czerwonych: budowa_profil_functions_match_web
WYKRYTY   : emp: budowa migracja - zachowanie pary -> 1 testow czerwonych: budowa_profil_functions_match_web
WYKRYTY   : emp: budowa forOwner - ujemny sentinel -> 1 testow czerwonych: budowa_profil_functions_match_web
WYKRYTY   : emp: budowa forOwner - predykat barbarzyncow -> 1 testow czerwonych: budowa_profil_functions_match_web
WYKRYTY   : emp: upgrade - pomija gracza -> 1 testow czerwonych: upgrade_budowa_profil_auto_defaults_matches_web
WYKRYTY   : emp: upgrade - ujemni wlasciciele -> 1 testow czerwonych: upgrade_budowa_profil_auto_defaults_matches_web
WYKRYTY   : emp: upgrade - barbarzyncy -> 1 testow czerwonych: upgrade_budowa_profil_auto_defaults_matches_web
WYKRYTY   : emp: upgrade - realne ustawienia -> 1 testow czerwonych: upgrade_budowa_profil_auto_defaults_matches_web
WYKRYTY   : emp: upgrade - broadcast -> 1 testow czerwonych: upgrade_budowa_profil_auto_defaults_matches_web
WYKRYTY   : emp: upgrade - tryb AI -> 1 testow czerwonych: upgrade_budowa_profil_auto_defaults_matches_web
WYKRYTY   : emp: upgrade - kolejnosc wlascicieli -> 1 testow czerwonych: upgrade_budowa_profil_auto_defaults_matches_web
WYKRYTY   : emp: racji resolve - override -> 1 testow czerwonych: poziom_racji_functions_match_web
WYKRYTY   : emp: racji broadcast - pin -> 1 testow czerwonych: poziom_racji_functions_match_web
WYKRYTY   : emp: racji auto - pin -> 1 testow czerwonych: poziom_racji_functions_match_web
WYKRYTY   : emp: racji migracja - roznica -> 1 testow czerwonych: poziom_racji_functions_match_web
WYKRYTY   : emp: OwnerMap - ponowne set zmienia miejsce -> 5 testow czerwonych: podzial_pracy_migration_matches_web, okolica_focus_functions_match_web, budowa_profil_functions_match_web
WYKRYTY   : ens: handel - normalizacja override -> 2 testow czerwonych: ensure_city_podzial_defaults_matches_web, ensure_city_save_defaults_matches_web
WYKRYTY   : ens: handel - domyslny dla override -> 2 testow czerwonych: ensure_city_save_defaults_matches_web, ensure_city_podzial_defaults_matches_web
WYKRYTY   : ens: podzial pracy - clamp -> 2 testow czerwonych: ensure_city_podzial_defaults_matches_web, ensure_city_save_defaults_matches_web
WYKRYTY   : ens: wealth -> 1 testow czerwonych: ensure_city_save_defaults_matches_web
WYKRYTY   : ens: okolica tryb -> 1 testow czerwonych: ensure_city_save_defaults_matches_web
WYKRYTY   : ens: budowa auto -> priorytet -> 1 testow czerwonych: ensure_city_save_defaults_matches_web
WYKRYTY   : ens: budowa auto - lista typow -> 1 testow czerwonych: ensure_city_save_defaults_matches_web
WYKRYTY   : ens: budowa - domyslny tryb -> 1 testow czerwonych: ensure_city_save_defaults_matches_web
WYKRYTY   : ens: budowa - tylko zrownowazone -> 1 testow czerwonych: ensure_city_save_defaults_matches_web
WYKRYTY   : ens: budowa - przejscie na zrownowazone -> 1 testow czerwonych: ensure_city_save_defaults_matches_web
WYKRYTY   : ens: budowa - sanitize z zrownowazonym -> 1 testow czerwonych: ensure_city_save_defaults_matches_web
WYKRYTY   : ens: budowa - zrownowazone: fokus -> 1 testow czerwonych: ensure_city_save_defaults_matches_web
ROWNOWAZNY: ens: budowa - zrownowazone: pusta lista | sanitize_budowa_priorytet_typow(pusta) zwraca domyslna liste - ten sam wynik co galaz `pusta -> domyslna`
WYKRYTY   : ens: budowa - priorytet: pusta lista -> 1 testow czerwonych: ensure_city_save_defaults_matches_web
WYKRYTY   : ens: budowa lista -> 1 testow czerwonych: ensure_city_save_defaults_matches_web
WYKRYTY   : ens: ulepszenia - override tylko true -> 2 testow czerwonych: ensure_city_save_defaults_matches_web, ensure_city_save_defaults_is_idempotent_on_web_outputs
WYKRYTY   : ens: ulepszenia - onlyWorked -> 1 testow czerwonych: ensure_city_save_defaults_matches_web
WYKRYTY   : ens: ulepszenia - wyrab -> 1 testow czerwonych: ensure_city_save_defaults_matches_web
WYKRYTY   : ens: ulepszenia - procent legacy -> 1 testow czerwonych: ensure_city_save_defaults_matches_web
WYKRYTY   : ens: magazyn - zawsze liczba -> 1 testow czerwonych: ensure_city_save_defaults_matches_web
WYKRYTY   : ens: magazyn - bity -> 2 testow czerwonych: ensure_city_save_defaults_matches_web, ensure_city_save_defaults_is_idempotent_on_web_outputs
WYKRYTY   : ens: ration po magazynie -> 1 testow czerwonych: ensure_city_save_defaults_matches_web
WYKRYTY   : ens: surowce -> 1 testow czerwonych: ensure_city_save_defaults_matches_web
WYKRYTY   : ens: postep -> 1 testow czerwonych: ensure_city_save_defaults_matches_web
WYKRYTY   : found: limit miast > -> 1 testow czerwonych: can_found_city_matches_web
WYKRYTY   : found: limit - brak miast przejetych -> 1 testow czerwonych: can_found_city_matches_web
WYKRYTY   : found: limit - era minimalna -> 1 testow czerwonych: can_found_city_matches_web
WYKRYTY   : found: limit - baza zapasowa -> 1 testow czerwonych: can_found_city_matches_web
WYKRYTY   : found: limit - krok epoki -> 1 testow czerwonych: can_found_city_matches_web
WYKRYTY   : found: limit - bez ownerEra -> 1 testow czerwonych: can_found_city_matches_web
WYKRYTY   : found: dystans <= -> 4 testow czerwonych: found_city_from_village_matches_web, can_found_city_matches_web, found_city_at_matches_web
WYKRYTY   : found: dystans - MP zakladane -> 2 testow czerwonych: found_city_at_matches_web, can_found_city_matches_web
WYKRYTY   : found: dystans - MP istniejace -> 4 testow czerwonych: found_city_at_matches_web, can_found_city_matches_web, found_city_from_village_matches_web
WYKRYTY   : found: slot klastra -> 4 testow czerwonych: can_found_city_matches_web, found_city_from_village_matches_web, found_city_at_matches_web
WYKRYTY   : found: hex distance - os s -> 4 testow czerwonych: can_found_city_matches_web, found_city_from_village_matches_web, found_city_at_matches_web
WYKRYTY   : found: terytorium -> 3 testow czerwonych: can_found_city_matches_web, found_city_from_village_matches_web, found_city_matches_web
WYKRYTY   : found: gory -> 4 testow czerwonych: found_city_from_village_matches_web, found_city_at_matches_web, can_found_city_matches_web
WYKRYTY   : found: woda -> 4 testow czerwonych: can_found_city_matches_web, found_city_from_village_matches_web, found_city_at_matches_web
WYKRYTY   : found: klucz niecalkowity -> 4 testow czerwonych: found_city_from_village_matches_web, can_found_city_matches_web, found_city_at_matches_web
WYKRYTY   : found: nowe miasto - id -> 3 testow czerwonych: found_city_from_village_matches_web, found_city_at_matches_web, found_city_matches_web
WYKRYTY   : found: nowe miasto - populacja -> 3 testow czerwonych: found_city_at_matches_web, found_city_from_village_matches_web, found_city_matches_web
WYKRYTY   : found: nowe miasto - override podzialu handlu -> 3 testow czerwonych: found_city_from_village_matches_web, found_city_at_matches_web, found_city_matches_web
WYKRYTY   : found: nowe miasto - poziom racji -> 3 testow czerwonych: found_city_at_matches_web, found_city_from_village_matches_web, found_city_matches_web
WYKRYTY   : found: nowe miasto - zalozone przez wlasciciela -> 3 testow czerwonych: found_city_from_village_matches_web, found_city_at_matches_web, found_city_matches_web
WYKRYTY   : found: nowe miasto - procent rozwoj -> 3 testow czerwonych: found_city_at_matches_web, found_city_from_village_matches_web, found_city_matches_web
WYKRYTY   : found: nowe miasto - auto wyzywienie tylko w foundCityAt -> 2 testow czerwonych: found_city_from_village_matches_web, found_city_at_matches_web
WYKRYTY   : found: nowe miasto - MP flaga -> 2 testow czerwonych: found_city_at_matches_web, found_city_from_village_matches_web
WYKRYTY   : found: foundCity - pelne pola -> 1 testow czerwonych: found_city_matches_web
WYKRYTY   : found: foundCityAt - flagi -> 1 testow czerwonych: found_city_at_matches_web
WYKRYTY   : found: nazwa - poza pula -> 2 testow czerwonych: city_name_and_predicates_match_web, found_city_from_village_matches_web
WYKRYTY   : found: nazwa - niecalkowity -> 1 testow czerwonych: city_name_and_predicates_match_web
WYKRYTY   : found: nazwa - generyczna -> 2 testow czerwonych: city_name_and_predicates_match_web, found_city_from_village_matches_web
WYKRYTY   : found: wioska - nazwa z liczby miast -> 1 testow czerwonych: found_city_from_village_matches_web
WYKRYTY   : found: wioska - wlasciciel 0 -> 1 testow czerwonych: found_city_from_village_matches_web
WYKRYTY   : found: wioska - terytorium -> 1 testow czerwonych: found_city_from_village_matches_web
WYKRYTY   : found: limit predykat -> 2 testow czerwonych: can_found_city_matches_web, city_name_and_predicates_match_web
WYKRYTY   : found: proweniencja -> 1 testow czerwonych: city_name_and_predicates_match_web
mutantow=209 wykrytych=204 rownowaznych=5 przezylo/niekompilujace=0
```

## 7. NIE_ZMIERZONO / RUNDA-2 (jawna lista)

Podzial na rundy: wszystkie grupy symboli zamkniete w rundzie 1. Zostaja tylko zadania, ktore z natury leza poza allowlista lub zaleza od niezportowanych modulow:

- **R2-1: integracja.** Przeniesienie re-eksportu `p6_6b` do `terrain.rs`/`mod.rs` (ZA1) i podpiecie `can_found_city`/`found_city_at`/`found_city_from_village` pod komendy `found_city` (B6/B11) i `found_city_from_village` (B7) w `session.rs`/`bridge.rs` (P2-5). Poza allowlista.
- **R2-2: podmiana wejsc.** `readCityFoodBuffer` (economy-upkeep), `ensureCityRationDefaults` i stale `DEFAULT_POZIOM_RACJI`/`WYZYWIENIE_MAX` (population-growth-v85), `freshWealthState` (wealth) - po ich porcie zastapic domkniecia/kopie danych referencjami do prawdziwych funkcji; testy zostaja.
- **R2-3: pelny `City`.** 23 pola danych bez logiki w tych plikach (ZA2) przy save/load lub integracji z `CityDto`.
- **R2-4: schemat id.** `city<N>` vs monotoniczny `CityId` (P2-3 D-ID-3) - decyzja modelu ID.
- **NIE_ZMIERZONO:** zachowanie dla map z kluczami niecalkowitymi (ZA7); `localeCompare`-podobne efekty nie wystepuja w tych plikach (tylko `toLowerCase`/`trim`, zmierzone wektorem Unicode).
- Uruchomienie weba/przegladarki: nie dotyczy (logika czysta; zakaz `npm run build`/`dev` w `gra/` zachowany - wektory z `git archive` + Node).

## 8. Tabela bylo/jest i zmiany testow

| Element | Bylo | Jest |
|---|---|---|
| `domain/state.rs` | modul `city_founding`, `conquest_stability`, `visibility` (P6.6A) | + `p6_6b::{display_names, cities, empire_city_defaults}`; w `city_founding` jedna linia `pub use super::p6_6b;` |
| `data/derived.rs` | tabele do P6.6A | + parsery `cities_params()`, `display_names_params()` (dopisek na koncu) |
| `data/derived/*.json` | 48 plikow | + `cities-params.json`, `display-names-params.json` |
| Testy | 902 (zmierzone: suma `test result` bez nowych) | 947 (+45 w `tests/p6_6b_*.rs`) |
| Istniejace testy | zielone | zielone, BEZ ZMIAN (zero edycji istniejacych plikow w `tests/`) |

Lista zmian testow: wylacznie dodane pliki `tests/p6_6b_{display,percent,lists,empire,cities_ensure,cities_found,tables}.rs` i `tests/p6_6b_vectors/**`; zadnego usuniecia ani osłabienia asercji.

## 9. Zero zmian poza allowlista - samokontrola

Zmienione/dodane pliki (jawne `git add`, nigdy `-A`): `rust-port/engine/src/domain/state.rs`, `rust-port/engine/src/data/derived.rs`, `rust-port/engine/data/derived/{cities-params,display-names-params}.json`, `rust-port/engine/tests/p6_6b_*.rs`, `rust-port/engine/tests/p6_6b_vectors/**`, `dyspozycje/rust-port/p6/P6-6B-MIASTA-ZAKLADANIE-B.md`, `dyspozycje/autobot/runs/R-RUSTPORT-P6-6B-MIASTA-ZAKLADANIE-B-Q1/**`. NIE zmieniono: `domain/mod.rs`, `terrain.rs`, `bridge.rs`, `Cargo.toml`, `gra/**`, `rust-port/renderer/**`, `src-tauri/**`, `tests/p6_m00_skeleton.rs`. `Cargo.lock` (untracked) i `target` nie sa commitowane; katalog budowania `CARGO_TARGET_DIR` usuniety po zakonczeniu. `git diff --check` czysty (§11.4).

## 10. Jak odtworzyc

```bash
# wektory (z katalogu runu; WEB_ROOT = wypakowany git archive edb8fb56 gra/src gra/data)
node --experimental-transform-types --no-warnings --import ./p66b-loader-register.mjs ./gen-p66b-vectors.mjs <WEB_ROOT> rust-port/engine/tests/p6_6b_vectors
python3 -I verify-p66b-vectors.py <WEB_ROOT> rust-port/engine/tests/p6_6b_vectors
python3 -I gen-symbols-p66b.py <WEB_ROOT> rust-port/engine > symbols-p66b-r1.tsv
# bramki (z rust-port/engine)
export CARGO_INCREMENTAL=0 CARGO_TARGET_DIR=/home/user/cargo-target-shared/<worktree> CARGO_PROFILE_DEV_DEBUG=0
cargo fmt --check; cargo clippy --all-targets -- -D warnings; cargo test
# mutacje (MUT_CHECK=1 tylko sprawdza fragmenty; MUT_SKIP=n pomija n pierwszych)
python3 -I ../../dyspozycje/autobot/runs/R-RUSTPORT-P6-6B-MIASTA-ZAKLADANIE-B-Q1/mutate-p66b.py
python3 -I grep-literals-p66b.py rust-port/engine
```

## 11. Surowe, pelne wyjscia bramek r1 (kopie plikow `gate-*-r1.log`, bez wyciec)

### 11.1 `cargo fmt --check` (rust-port/engine; `gate-fmt-r1.log`)

```text
$ cargo fmt --check
EXIT=0
```

### 11.2 `cargo clippy --all-targets -- -D warnings` (rust-port/engine; `gate-clippy-r1.log`)

```text
$ cargo clippy --all-targets -- -D warnings
    Checking civ-engine v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_9188d0d5-3d2-1/rust-port/engine)
    Finished `dev` profile [unoptimized] target(s) in 3m 21s
EXIT=0
```

### 11.3 `cargo test` (rust-port/engine; `gate-test-r1.log`)

```text
$ cargo test
   Compiling civ-engine v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_9188d0d5-3d2-1/rust-port/engine)
    Finished `test` profile [unoptimized] target(s) in 4m 03s
     Running unittests src/lib.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/civ_engine-16aabb0664806a8f)

running 6 tests
test domain::map_generator::tests::axial_distance_and_neighbours_match_hex_contract ... ok
test domain::map_generator::tests::canonical_climate_band_vectors_match_typescript ... ok
test domain::map_generator::tests::canonical_mask_vectors_match_typescript ... ok
test domain::map_generator::tests::value_noise_and_fbm_match_typescript_golden_vectors ... ok
test domain::map_generator::tests::mulberry32_matches_typescript_first_values ... ok
test domain::map_generator::tests::terrain_bias_and_classification_match_typescript_golden_vectors ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

     Running tests/ai_turn.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/ai_turn-3ff8b634b4adc9fc)

running 13 tests
test civilian_units_do_not_receive_combat_orders ... ok
test ai_turn_input_serde_round_trip_uses_json_map_entries ... ok
test command_wire_shape_is_stable_for_engine_integration ... ok
test ai_turn_default_city_parameters_match_ai_params_json ... ok
test nearest_unreachable_enemy_city_is_skipped_for_a_reachable_target ... ok
test planner_returns_production_then_actions_and_always_ends_the_turn ... ok
test hex_city_score_enemy_penalty_follows_threat_range_option ... ok
test planner_uses_deterministic_pathfinding_and_never_walks_through_mountains ... ok
test planner_uses_dijkstra_weighted_terrain_costs_and_stable_tie_breaking ... ok
test production_matches_spec_priority_and_skips_already_built_buildings ... ok
test ranged_units_hold_back_when_an_enemy_city_is_close ... ok
test settler_founds_only_on_a_qualifying_village_and_respects_city_spacing ... ok
test wounded_units_retreat_before_attacking ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.05s

     Running tests/assets_manifest.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/assets_manifest-d56e5fd4df394dc5)

running 13 tests
test counts_per_extension_match_p1_11 ... ok
test byte_sums_per_category_match_p1_11 ... ok
test manifest_dest_paths_are_unique ... ok
test negative_parser_rejects_bad_header_and_columns ... ok
test manifest_has_header_and_428_data_rows ... ok
test negative_validator_rejects_duplicate_dest ... ok
test negative_validator_rejects_missing_file ... ok
test negative_validator_rejects_wrong_sha ... ok
test negative_validator_rejects_wrong_size ... ok
test sha1_matches_known_vectors ... ok
test no_files_outside_manifest_in_assets_dir ... ok
test every_manifest_entry_exists_with_declared_size ... ok
test every_entry_blob_sha1_matches_manifest_column ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 2.52s

     Running tests/barbarians.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/barbarians-6b7f5fd3cf04bc2a)

running 10 tests
test camp_destruction_removes_only_the_entered_camp ... ok
test barbarian_city_garrison_spawns_units_without_a_building_queue ... ok
test camp_spawning_is_deterministic_and_honours_city_and_camp_spacing ... ok
test camp_spawning_rejects_owned_and_permanently_cleared_hexes ... ok
test camp_tick_decrements_cooldown_and_respects_owned_unit_cap ... ok
test empty_city_capture_is_hard_only_and_defenders_block_barbarians ... ok
test naval_camps_are_purged_without_spawning_sea_peoples ... ok
test rally_moves_multiple_units_toward_their_shared_camp ... ok
test movement_prioritizes_retreat_then_adjacent_attack_then_nearest_target ... ok
test state_round_trip_preserves_camp_identity_and_visit_memory ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/bridge_add_player.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/bridge_add_player-29d21d45c2674db3)

running 1 test
test bridge::add_player_atomicity_tests::add_player_leaves_mock_state_untouched_when_the_game_rejects_it ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/building_costs.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/building_costs-df466ad6818fd31d)

running 10 tests
test canonical_catalog_contains_all_buildings_and_preserves_split_values ... ok
test expenditure_requires_both_work_and_all_resources ... ok
test mutable_spend_is_atomic_and_preserves_unrelated_resources ... ok
test effective_work_cost_is_raw_work_web_one_to_one ... ok
test empty_resource_cost_is_affordable_without_a_stock_map ... ok
test failed_spend_does_not_mutate_the_input_stock ... ok
test resource_cost_is_independent_and_missing_resources_are_reported ... ok
test serde_round_trip_keeps_the_split_cost_contract ... ok
test successful_spend_deducts_effective_work_and_raw_stock_atomically ... ok
test work_cost_is_linear_and_levels_are_one_based ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/city_growth.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/city_growth-be95b00ce9d4c52b)

running 10 tests
test a_threshold_multiplier_is_rounded_and_only_one_citizen_is_added_per_turn ... ok
test deficit_reduces_population_to_one_without_health_boosting_negative_food ... ok
test fractional_growth_accumulates_and_freezes_at_the_population_cap ... ok
test fractional_growth_can_cross_multiple_slots_but_is_disabled_when_unfed ... ok
test growth_slot_helpers_report_no_growth_for_invalid_or_capped_inputs ... ok
test granary_retains_food_after_growth_and_tier_two_uses_its_fixed_retention ... ok
test hunger_penalty_is_separate_and_never_drops_below_one ... ok
test population_at_cap_is_frozen_but_surplus_food_is_not_spent ... ok
test population_cap_uses_the_three_canonical_building_steps ... ok
test positive_food_is_health_adjusted_and_crossing_the_threshold_grows_once ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/city_id.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/city_id-693b1037fdbc4b08)

running 6 tests
test barbarian_city_garrison_json_keeps_numeric_city_id ... ok
test barbarian_cleared_cities_round_trip_as_numbers ... ok
test city_id_conversions_round_trip ... ok
test city_id_serializes_as_bare_number ... ok
test city_id_map_keys_stay_numeric_in_json ... ok
test city_id_ordering_matches_raw_value ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/combat.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/combat-7737db4785daf590)

running 7 tests
test canonical_counter_table_matches_confirmed_attack_rows ... ok
test effective_strength_applies_counters_terrain_and_siege_structures ... ok
test empty_attacker_side_gives_non_empty_defender_the_win ... ok
test losses_are_smaller_for_the_winner_in_a_decisive_matchup ... ok
test resolver_returns_deterministic_winner_and_per_unit_losses ... ok
test resolver_is_order_independent_and_preserves_ids ... ok
test empty_defender_side_gives_non_empty_attacker_the_win ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/combat_ai_multipliers.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/combat_ai_multipliers-52898acb951a9ad0)

running 5 tests
test accessors_return_the_table_value_not_a_constant ... ok
test city_structure_bonuses_are_positive_and_mur_is_the_largest_single_bonus ... ok
test table_has_each_row_once_with_known_class_and_status ... ok
test las_row_is_class_a_and_marked_read_by_domain ... ok
test veteran_levels_are_complete_and_non_decreasing ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/counter_multipliers.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/counter_multipliers-c944a65d0a384717)

running 5 tests
test domain_reads_table_and_unknown_types_give_no_bonus ... ok
test explicit_unit_bonus_overrides_table ... ok
test table_type_keys_are_canonical ... ok
test table_lists_each_type_pair_once_with_finite_positive_multiplier ... ok
test table_is_readable_for_every_pair_and_misses_are_none ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_buildings_tech.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/data_buildings_tech-92a54ec12302afcb)

running 3 tests
test buildings_json_parses ... ok
test tech_json_parses ... ok
test wonders_json_parses ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/data_civilizations.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/data_civilizations-c9a95e0d071840a4)

running 7 tests
test civ_params_json_parses_and_spot_checks ... ok
test city_names_pools_json_parses_and_spot_checks ... ok
test civ_ai_json_parses_and_spot_checks ... ok
test diplomacy_json_parses_and_spot_checks ... ok
test civ_matrix_json_parses_and_spot_checks ... ok
test diplomacy_acceptance_points_json_parses_and_spot_checks ... ok
test civs_json_parses_and_spot_checks ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/data_compliance.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/data_compliance-bce92961776df717)

running 40 tests
test civ_auxiliary_files_civ_ids_match_web_pin ... ok
test civs_count_and_ids_match_web_pin ... ok
test collection_counts_match_web_pin ... ok
test roundtrip_covers_all_29_data_files ... ok
test roundtrip_pins_cover_all_29_files_exactly ... ok
test rt_ai_params ... ok
test rt_auto_battle_params ... ok
test embedded_raw_counts_match_web_pin ... ok
test rt_citizen_resource_upkeep ... ok
test rt_city_names_pools ... ok
test rt_civ_ai ... ok
test collection_id_sets_match_web_pin ... ok
test all_29_data_files_parse_with_rust_modules ... ok
test rt_civ_params ... ok
test rt_combat_params ... ok
test rt_counters ... ok
test rt_civ_matrix ... ok
test rt_civs ... ok
test rt_e_start_params ... ok
test rt_diplomacy ... ok
test rt_epoka_ludnosc_manpower ... ok
test rt_diplomacy_acceptance_points ... ok
test rt_miasto_params ... ok
test rt_map_gen_params ... ok
test rt_resources ... ok
test rt_power_params ... ok
test rt_tech ... ok
test rt_terrain_combat ... ok
test rt_society_params ... ok
test rt_terrain_movement ... ok
test rt_terrain_improvements ... ok
test rt_buildings ... ok
test rt_terrain_yields ... ok
test rt_ui_params ... ok
test rt_econ_params ... ok
test terrain_improvements_parses_strict_with_farma_and_posterunek ... ok
test web_pin_constants_are_internally_consistent ... ok
test wonders_state_keys_match_web_pin ... ok
test rt_wonders ... ok
test rt_units ... ok

test result: ok. 40 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.13s

     Running tests/data_economy_society.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/data_economy_society-fd9354f0ea49ebbb)

running 9 tests
test parse_citizen_resource_upkeep_parses_and_spot_checks ... ok
test parse_e_start_params_parses_and_spot_checks ... ok
test parse_econ_params_parses_and_spot_checks ... ok
test parse_epoka_ludnosc_manpower_parses_and_spot_checks ... ok
test parse_ai_params_parses_and_spot_checks ... ok
test parse_miasto_params_parses_and_spot_checks ... ok
test parse_resources_parses_and_spot_checks ... ok
test parse_society_params_parses_and_spot_checks ... ok
test parse_ui_params_parses_and_spot_checks ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/data_loader.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/data_loader-4b1b0c97d63f2050)

running 14 tests
test data_files_list_matches_directory_contents ... ok
test neg_empty_file_is_empty ... ok
test loads_all_29_files_from_data_dir ... ok
test neg_missing_directory_is_directory_missing ... ok
test neg_missing_required_field_is_shape_mismatch_naming_field ... ok
test neg_number_where_object_expected_is_shape_mismatch_with_position ... ok
test neg_path_that_is_a_file_is_directory_missing ... ok
test neg_non_utf8_file_is_not_utf8 ... ok
test neg_syntax_error_is_invalid_json_on_second_line ... ok
test neg_missing_file_is_file_missing ... ok
test neg_unreadable_file_is_io ... ok
test neg_truncated_json_is_invalid_json_with_position ... ok
test neg_whitespace_only_file_is_empty ... ok
test neg_every_listed_file_is_required_by_load_all ... ok

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.70s

     Running tests/data_terrain_map.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/data_terrain_map-c0e779a3719f4442)

running 4 tests
test terrain_movement_parses_and_spot_checks ... ok
test terrain_yields_parses_and_spot_checks ... ok
test map_gen_params_parses_and_spot_checks ... ok
test terrain_improvements_parses_and_spot_checks ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.04s

     Running tests/data_units_combat.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/data_units_combat-013a0bd100633d2e)

running 6 tests
test combat_params_parses_and_spot_checks ... ok
test counters_parses_and_spot_checks ... ok
test auto_battle_params_parses_and_spot_checks ... ok
test terrain_combat_parses_and_spot_checks ... ok
test power_params_parses_and_spot_checks ... ok
test units_parses_and_spot_checks ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.25s

     Running tests/derived_values.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/derived_values-7eb2b3615468dd51)

running 25 tests
test building_table_has_exactly_the_42_canonical_ids_once_each ... ok
test building_gold_upkeep_has_one_row_per_building_level ... ok
test basket_and_treaty_duration_read_diplomacy_table ... ok
test building_table_key_shape_is_known_resources_and_mirrors_the_base_keys ... ok
test building_table_palac_has_no_stock_cost_and_others_do ... ok
test difficulty_is_one_type_across_domain_modules ... ok
test diplomacy_multipliers_cover_each_constant_once_with_web_values ... ok
test domain_recruitment_reads_the_unit_table_values_without_recomputing_them ... ok
test domain_building_costs_read_the_building_table_values_without_recomputing_them ... ok
test domain_recruitment_reads_the_gold_table_without_recomputation ... ok
test racje_cover_every_half_step_from_zero_to_six_once ... ok
test improvement_and_wonder_tables_cover_every_entry_once ... ok
test research_costs_cover_each_tech_tempo_and_axis_once ... ok
test storage_caps_cover_each_era_and_difficulty_once ... ok
test unit_food_has_twelve_states_per_unit_and_integer_hundredths ... ok
test trade_multipliers_cover_each_constant_once_with_values ... ok
test gold_table_has_exactly_the_75_units_once_each_and_known_eras ... ok
test unit_table_has_one_row_per_units_json_record_and_no_extra_rows ... ok
test unit_table_epoch_field_matches_units_json ... ok
test building_work_states_cover_each_building_level_and_axis_combination_exactly_once ... ok
test unit_table_key_shape_and_positive_integer_values ... ok
test work_table_has_exactly_the_42_buildings_once_each_and_positive_values ... ok
test unit_gold_states_cover_each_unit_and_axis_combination_exactly_once ... ok
test work_table_is_read_by_the_domain_without_recomputation ... ok
test unit_table_keeps_the_units_json_base_as_provenance ... ok

test result: ok. 25 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.09s

     Running tests/diplomacy.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/diplomacy-d94c0845f92f376e)

running 32 tests
test canonical_value_catalog_prices_non_quantity_basket_items ... ok
test alliance_uses_configured_hegemon_threshold ... ok
test annexation_requires_vassal_economy_orientation ... ok
test alliance_sweetener_ease_is_measured_in_points ... ok
test cyclic_resource_offer_normalizes_units_and_preserves_direction ... ok
test diplomacy_state_serializes_non_empty_pair_map ... ok
test initial_relation_treats_same_minor_type_like_same_type ... ok
test peace_price_is_independent_of_treaty_duration ... ok
test proposal_builds_treaties_with_canonical_pair_and_duration ... ok
test diplomacy_unit_prices_match_units_json_for_every_row ... ok
test production_diplomacy_api_is_public ... ok
test proposal_rejects_withdrawn_access_and_invalid_tech_exchange ... ok
test pair_state_canonicalizes_reversed_owner_ids_and_expires_deals ... ok
test quantity_catalog_multiplies_boolean_and_deposit_items ... ok
test proposal_conditions_cover_war_peace_duplicate_and_trade_fairness ... ok
test quantity_resource_valuation_uses_blocks_and_floors_requested_units ... ok
test relation_is_clamped_and_events_are_immutable ... ok
test tick_stacks_trade_and_peace_tier_but_positive_growth_stops_in_war ... ok
test tech_and_boolean_resource_transfers_are_immutable_and_idempotent ... ok
test trade_basket_valuation_uses_player_side_and_difficulty_multipliers ... ok
test serialized_proposal_round_trips_canonical_wire_names ... ok
test technology_transfer_obeys_epoch_and_tier_gates ... ok
test trade_quantity_mode_builds_cyclic_exchange_deal ... ok
test trade_basket_valuation_multiplies_per_turn_currency_only ... ok
test transfer_is_atomic_when_recipient_is_missing_and_deterministic_when_split ... ok
test trade_event_has_no_flat_trust_bonus_and_fairness_keeps_high_relation_discount ... ok
test transferred_unit_rejects_unknown_type_and_missing_capital_without_mutation ... ok
test transferred_unit_spawns_at_near_hex_or_recipient_capital ... ok
test treaty_basket_cannot_bypass_fairness_on_nap ... ok
test tribute_offer_zero_gold_once_keeps_recurring_deal ... ok
test trust_events_match_the_canonical_one_shot_deltas ... ok
test war_currency_gate_allows_only_peace_settlements ... ok

test result: ok. 32 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.03s

     Running tests/events.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/events-987aa8790b10a253)

running 8 tests
test built_in_events_map_to_their_responsible_phases ... ok
test canonical_turn_phases_are_explicit_and_stable ... ok
test deserializing_a_queue_restores_order_and_rejects_duplicate_ids ... ok
test phase_drain_is_scoped_and_preserves_the_remaining_order ... ok
test imported_queue_with_max_sequence_is_rejected_before_enqueue_can_panic ... ok
test imported_queue_below_the_sequence_ceiling_still_accepts_enqueue ... ok
test queue_round_trip_preserves_order_and_allocates_a_fresh_sequence ... ok
test queue_orders_turn_then_phase_then_insertion_sequence ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/hex_terrain.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/hex_terrain-51ccc9a6f3a95851)

running 10 tests
test axial_coordinates_keep_the_cube_invariant ... ok
test coordinates_round_trip_through_the_canonical_map_key ... ok
test coordinates_and_terrain_are_json_round_trip_safe ... ok
test distance_is_symmetric_and_uses_axial_cube_geometry ... ok
test every_coordinate_has_six_unique_reversible_neighbors ... ok
test root_reexports_are_the_same_production_api_types ... ok
test terrain_aliases_describe_the_same_source_values ... ok
test terrain_movement_costs_are_explicit ... ok
test terrain_qualification_matches_the_world_map_rules ... ok
test tile_qualification_is_a_pure_terrain_projection ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/improvements.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/improvements-74300529620b4fd5)

running 13 tests
test food_layers_allow_farm_with_irrigation_or_trzoda_but_not_without_farm ... ok
test food_layers_can_coexist_with_non_food_layers ... ok
test forest_rules_distinguish_dependent_and_compatible_improvements ... ok
test legacy_improvement_keys_and_bonus_fields_preserve_data_contract ... ok
test non_food_upgrade_dependencies_are_preserved ... ok
test production_is_pure_and_non_producers_have_zero_logistics ... ok
test livestock_requires_matching_first_deposit_or_explicit_unlock ... ok
test production_returns_field_bonuses_and_logistics_rates ... ok
test solo_food_improvements_and_duplicates_are_rejected ... ok
test terraces_are_hills_only_and_salt_works_reaches_shallow_water ... ok
test tile_and_production_are_json_round_trip_safe ... ok
test trzoda_is_not_qualifying_on_forest_but_is_on_open_flat_land ... ok
test terrain_and_deposit_gates_are_checked_before_building ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/map_generator.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/map_generator-5afcd8df74a87c12)

running 6 tests
test map_golden_vector_matches_typescript_core_contract ... ok
test invalid_dimensions_are_rejected_before_allocation ... ok
test map_dimensions_and_seed_are_stable ... ok
test repeated_generation_is_byte_for_byte_deterministic ... ok
test world_types_and_default_seed_match_typescript_contract ... ok
test river_markers_are_land_and_reach_water ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/owner_ref.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/owner_ref-92f476c7f4239a8a)

running 10 tests
test owner_ref_hash_agrees_with_equality ... ok
test owner_and_camp_fields_are_plain_numbers_in_struct_json ... ok
test owner_ref_accessors_and_player_conversion ... ok
test camp_id_is_a_transparent_newtype ... ok
test owner_ref_legacy_conversions_match_the_sentinels ... ok
test owner_ref_ordering_matches_the_legacy_i64_order ... ok
test owner_ref_refuses_player_ids_that_do_not_fit_the_legacy_number ... ok
test owner_ref_rejects_unknown_negative_numbers ... ok
test player_keyed_maps_keep_numeric_string_keys ... ok
test owner_ref_serializes_every_variant_as_the_legacy_number ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/p6_1_civ_entry_epoch.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_1_civ_entry_epoch-c29112b12d237024)

running 8 tests
test civ_availability_matches_web_vectors_for_every_game_epoch ... ok
test civ_entry_epoch_matches_web_vectors ... ok
test civ_ids_available_match_web_roster_vectors ... ok
test civ_entry_label_matches_web_vectors ... ok
test game_epoch_hud_label_matches_web_vectors ... ok
test game_epoch_order_matches_web ... ok
test game_epoch_index_matches_web_for_every_probe ... ok
test strict_epoch_ids_reject_non_canonical_spellings ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_1_first_player_city.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_1_first_player_city-e31375affc71b1c0)

running 5 tests
test denied_message_matches_web_constant ... ok
test awaiting_first_city_matches_web_for_explicit_owner_one ... ok
test hex_in_start_reveal_matches_web_vectors ... ok
test awaiting_first_city_matches_web_for_owner_zero ... ok
test validate_placement_matches_web_vectors ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/p6_1_owner_seats.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_1_owner_seats-1a3aae5c483a1e2f)

running 6 tests
test major_ai_owner_matches_web_vectors ... ok
test hot_seat_cycles_and_skips_unknown_active ... ok
test web_owner_minus_five_is_out_of_domain_and_not_representable ... ok
test human_seats_match_web_vectors ... ok
test stub_constants_are_the_web_sentinels ... ok
test human_owner_primary_matches_web ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/p6_1_rng_mulberry.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_1_rng_mulberry-617bdab005dd8b1f)

running 2 tests
test mulberry32_is_not_the_lcg_stream ... ok
test mulberry32_matches_web_make_rng_vectors_bit_for_bit ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/p6_1b_playerstate.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_1b_playerstate-7e0df28b40755091)

running 19 tests
test error_research_step_is_atomic_on_missing_cost ... ok
test error_missing_cost_for_unknown_tempo_and_mode ... ok
test hot_seat_two_human_owners_have_independent_player_states ... ok
test parity_cheapest_tie_break_uses_utf16_order ... ok
test parity_constants_and_defaults_match_web ... ok
test parity_gates_available_and_cheapest ... ok
test parity_research_costs_equal_web_scaled_research_cost ... ok
test parity_per_row_functions ... ok
test parity_vectors_use_the_engine_tech_data ... ok
test serde_missing_research_queue_defaults_to_empty ... ok
test table_constants_are_read_from_data_not_literals ... ok
test table_edit_of_research_cost_changes_the_step ... ok
test table_epoch_map_and_sentinels_come_from_data ... ok
test table_every_engine_tech_has_a_research_cost_for_every_axis ... ok
test table_player_state_params_shape ... ok
test table_research_cost_rows_agree_with_tech_json ... ok
test parity_scenarios_from_web ... ok
test parity_epoch_number ... ok
test parity_parse_prereqs_and_prereqs_met ... ok

test result: ok. 19 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 4.72s

     Running tests/p6_1c_braz_access.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_1c_braz_access-043839ba2b428854)

running 7 tests
test city_has_piec_hutniczy_matches_web ... ok
test has_braz_access_matches_web ... ok
test empire_has_kopalnia_miedzi_matches_web ... ok
test normalize_improvement_key_known_keys_equal_data_keys ... ok
test normalize_improvement_key_matches_web ... ok
test prototype_keys_are_out_of_domain_and_do_not_change_braz_outcome ... ok
test bootstrap_table_values_equal_web_constants ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.16s

     Running tests/p6_1c_llama_seed.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_1c_llama_seed-e56bbca479ca6477)

running 3 tests
test hex_keys_within_radius_matches_web_loop_order ... ok
test hash_pos_matches_web_hash_pos_verbatim ... ok
test seed_inca_llama_deposits_matches_web_for_all_cases ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.80s

     Running tests/p6_1c_start_cluster.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_1c_start_cluster-584791c0a8e00ea4)

running 8 tests
test land_hexes_filter_matches_web_rule ... ok
test display_label_for_slot_matches_web ... ok
test constants_and_start_relations_match_web ... ok
test pick_second_human_start_hex_matches_web ... ok
test build_cluster_start_plan_matches_web_for_all_cases ... ok
test vectors_cover_the_branches_of_build_cluster_start_plan ... ok
test second_human_civ_equal_to_player_civ_is_rejected_like_web ... ok
test second_human_without_legal_hex_yields_no_second_seat_derived_from_code ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.46s

     Running tests/p6_1c_tables.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_1c_tables-2a37790854995833)

running 4 tests
test start_tables_parse_with_deny_unknown_fields ... ok
test llama_table_has_sane_shape ... ok
test cluster_table_has_sane_shape ... ok
test braz_table_has_sane_shape_and_consistent_references ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_1d_city_names.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_1d_city_names-4bfda12150196ed9)

running 13 tests
test embedded_pool_data_is_byte_identical_to_data_used_for_vectors ... ok
test nazwa_klastra_at_matches_web ... ok
test collect_used_city_names_matches_web ... ok
test city_name_with_suffix_matches_web ... ok
test pool_length_constants_match_web ... ok
test resolve_state_city_name_matches_web ... ok
test rival_pool_index_matches_web ... ok
test pick_next_city_name_from_names_matches_web_for_synthetic_queues ... ok
test cluster_rival_from_pool_matches_web ... ok
test state_city_name_at_matches_web ... ok
test suggest_and_ai_founding_names_match_web ... ok
test validate_city_names_pools_matches_web ... ok
test pick_capital_foreign_regular_match_web_for_real_pools ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.28s

     Running tests/p6_1d_civ_bonuses.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_1d_civ_bonuses-30f5c7450cfc6997)

running 14 tests
test building_cost_discount_matches_web ... ok
test apply_multiplier_matches_web ... ok
test empty_bonus_list_gives_zero_multipliers ... ok
test is_combat_modifier_bonus_matches_web ... ok
test matrix_bonusy_match_web_for_every_civ_key_variant ... ok
test movement_range_siege_wall_multipliers_match_web ... ok
test embedded_data_is_byte_identical_to_data_used_for_vectors ... ok
test real_civs_bonuses_convert_without_loss ... ok
test terrain_forest_detection_matches_web ... ok
test unit_combat_category_matches_web_for_every_unit ... ok
test strip_diacritics_matches_web_function_cut_verbatim ... ok
test unit_matches_cel_matches_web_for_every_unit_and_cel ... ok
test bonus_applies_per_entry_matches_web_for_multi_entry_lists ... ok
test bonus_applies_and_stat_multipliers_match_web ... ok

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 16.15s

     Running tests/p6_1d_tables.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_1d_tables-7c67743f1f351b01)

running 4 tests
test city_name_constants_have_consistent_shape ... ok
test rules_have_known_stats_and_param_ids ... ok
test diacritics_table_maps_single_chars_outside_ascii ... ok
test matrix_specs_have_consistent_shape_and_known_param_ids ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.16s

     Running tests/p6_1e_civ_matrix.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_1e_civ_matrix-d0b7dd9cf60d4be3)

running 21 tests
test ai_params_and_diplomacy_rows_match_web ... ok
test ai_fallback_branches_are_actually_exercised ... ok
test apply_civ_matrix_param_matches_web ... ok
test civ_matrix_param_def_matches_web ... ok
test civ_matrix_param_at_difficulty_matches_web ... ok
test civ_matrix_params_at_difficulty_matches_web_order_and_values ... ok
test consumer_status_polarity_band_baseline_match_web_per_parameter ... ok
test data_files_are_byte_identical_to_web_pin ... ok
test civ_matrix_param_matches_web ... ok
test every_matrix_cell_parses_exactly_like_js ... ok
test median_matches_web ... ok
test ai_by_typ_resolvers_match_web ... ok
test proc_sum_and_apply_proc_match_web ... ok
test param_order_and_rows_match_web_for_every_scenario ... ok
test scale_parameters_are_clamped_and_shifted_only_for_skala ... ok
test every_status_for_every_parameter_matches_web_texts ... ok
test status_visibility_is_true_only_for_real_gameplay ... ok
test profile_by_key_resolution_matches_web ... ok
test ai_profiles_and_norms_match_web ... ok
test synthetic_cell_grid_matches_web ... ok
test snapshot_and_profiles_match_web ... ok

test result: ok. 21 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.23s

     Running tests/p6_1e_civ_names.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_1e_civ_names-80674a5ae9a4508e)

running 11 tests
test assign_invariants_hold_on_real_roster ... ok
test constants_match_web ... ok
test make_rng_streams_match_web_for_every_seed ... ok
test civ_ids_from_roster_matches_web ... ok
test find_klastra_display_validate_match_web ... ok
test reexports_behave_like_web ... ok
test rotate_preferred_matches_web ... ok
test assign_ai_civ_types_matches_web ... ok
test pool_views_ai_founded_and_validation_match_web ... ok
test pick_active_civ_pool_matches_web ... ok
test start_foreign_rival_state_names_match_web ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.59s

     Running tests/p6_1e_js_compat.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_1e_js_compat-08e1cb152706a259)

running 8 tests
test is_integer_and_min_max_clamp_follow_js ... ok
test math_round_matches_js_bit_for_bit ... ok
test intensity_label_matches_web ... ok
test parameter_label_matches_web ... ok
test number_to_string_matches_js_for_every_vector ... ok
test formatted_value_matches_web ... ok
test trim_matches_js_string_trim ... ok
test to_fixed_matches_js_for_every_digit_count ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.34s

     Running tests/p6_1e_tables.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_1e_tables-9dc9ef20c17d92b2)

running 7 tests
test parameter_label_dictionary_has_nonempty_entries_and_suffix_rule ... ok
test params_table_is_consistent_with_matrix_and_civs ... ok
test semantic_neutral_band_rules_cover_every_parameter_definition ... ok
test tables_parse_and_are_cached ... ok
test modules_contain_no_balance_or_data_literals ... ok
test semantic_table_has_text_for_every_status_and_placeholder ... ok
test semantic_table_sets_reference_existing_parameters_and_are_disjoint ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.09s

     Running tests/p6_23_fort.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_23_fort-324dd86b69e58eeb)

running 5 tests
test fort_rules_table_references_known_improvements ... ok
test fort_node_conversion_and_reservation_match_web ... ok
test evacuation_hex_matches_web ... ok
test territory_dependencies_match_web ... ok
test takeover_on_city_founded_matches_web ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.70s

     Running tests/p6_23_hexmove.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_23_hexmove-a546770c25695422)

running 4 tests
test foreign_city_blocks_feed_pathfinding_and_roads_use_p3_23_divisors ... ok
test city_at_hex_and_occupancy_match_web ... ok
test foreign_city_blocks_match_web ... ok
test ai_entry_into_empty_enemy_city_matches_web ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.27s

     Running tests/p6_23_improvements.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_23_improvements-2f6107250ed9d0bf)

running 10 tests
test constants_match_web ... ok
test catalog_key_order_equals_json_file_order_including_meta_rows ... ok
test era_and_cost_scaling_match_web ... ok
test hex_layer_functions_match_web ... ok
test applying_bonuses_matches_web ... ok
test rules_tables_have_consistent_shape ... ok
test normalize_and_lookup_functions_match_web ... ok
test prototype_keys_pass_normalize_like_in_web ... ok
test migration_functions_match_web ... ok
test territory_and_ore_yields_match_web ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.75s

     Running tests/p6_23_order.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_23_order-b99acb8ea5803b82)

running 11 tests
test fallback_params_equal_web_constant ... ok
test evaluate_order_matches_web ... ok
test engine_society_params_match_web_subset_used_by_vectors ... ok
test compute_order_matches_web ... ok
test order_effects_matches_web ... ok
test order_shape_invariants_hold_for_any_table_values ... ok
test order_effects_to_yield_mults_matches_web ... ok
test happiness_breakdown_matches_web ... ok
test load_order_params_matches_web ... ok
test order_tier_matches_web ... ok
test pick_revolt_migration_target_matches_web ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.84s

     Running tests/p6_23_tables.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_23_tables-6de635983c184b19)

running 3 tests
test teren_ruch_reguly_table_has_nonempty_lists ... ok
test porzadek_params_table_is_complete_and_finite ... ok
test ulepszenia_reguly_table_references_existing_improvements_only ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

     Running tests/p6_4_core.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_4_core-1b564fea4bb5288e)

running 10 tests
test hex_distance_matches_web ... ok
test constants_read_from_running_web_match_tables ... ok
test road_modifier_matches_web_including_floor_and_special_costs ... ok
test path_cost_matches_web ... ok
test stack_group_id_matches_web ... ok
test terrain_and_embark_costs_match_web_on_maps ... ok
test compute_reachable_matches_web_order_and_min_move ... ok
test compute_path_matches_web_including_ties_and_edge_destinations ... ok
test terrain_cost_combinations_match_web ... ok
test visibility_helpers_match_web ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.23s

     Running tests/p6_4_embark.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_4_embark-1585566f17a207b0)

running 4 tests
test can_unit_embark_matches_web ... ok
test apply_embark_state_after_move_matches_web ... ok
test water_hex_queries_match_web ... ok
test move_cost_fn_for_matches_web_on_every_map_hex ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.11s

     Running tests/p6_4_march.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_4_march-bae7bfc63cf555d2)

running 6 tests
test fog_frontier_and_fog_plan_match_web ... ok
test save_validation_and_round_trip_match_web ... ok
test should_stop_at_obstacle_matches_web ... ok
test truncate_path_to_budget_matches_web_including_min_move ... ok
test plan_path_turns_matches_web ... ok
test execute_march_step_matches_web ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 2.40s

     Running tests/p6_4_rally.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_4_rally-4bbcd32c03f67cc3)

running 3 tests
test load_from_save_and_number_parsing_match_web ... ok
test launch_leaders_one_per_stack_match_web ... ok
test set_clear_and_save_sequences_match_web ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

     Running tests/p6_4_scout.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_4_scout-573fb211c9224499)

running 5 tests
test explore_scores_match_web ... ok
test scout_flags_match_web ... ok
test run_scouts_auto_explore_matches_web ... ok
test pick_scout_explore_target_matches_web_including_rng_use ... ok
test advance_scout_auto_explore_matches_web ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 34.87s

     Running tests/p6_4_tables.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_4_tables-d82f71a9bfb2cdbc)

running 4 tests
test numeric_rows_have_sane_shape_without_pinning_values ... ok
test neighbour_table_is_six_distinct_adjacent_offsets ... ok
test table_parses_and_every_row_names_its_web_source ... ok
test text_rows_are_nonempty_and_distinct ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_5a_cost.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_5a_cost-a4777603b2625768)

running 4 tests
test js_round_matches_half_up_semantics ... ok
test table_constants_equal_the_running_web_object ... ok
test replace_context_keeps_every_field_and_the_required_stock ... ok
test unit_cost_pace_matches_web_bitwise ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.04s

     Running tests/p6_5a_display.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_5a_display-f61d69c84dc8b548)

running 7 tests
test hp_pool_matches_web_including_nonfinite_and_overfull_hp ... ok
test field_power_passes_roster_in_web_order_and_returns_sum ... ok
test compute_stack_display_matches_web_order_and_vitals ... ok
test badge_and_veteran_maxima_match_web ... ok
test unit_at_representative_matches_web ... ok
test stack_vitals_matches_web ... ok
test representative_matches_web_including_utf16_id_order_and_nan_attack ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.98s

     Running tests/p6_5a_ruch.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_5a_ruch-0e062d5664866c50)

running 8 tests
test adjacent_empty_and_split_destinations_match_web ... ok
test bounce_hex_assignment_matches_web_including_duplicates_and_blocking ... ok
test hud_actions_match_web ... ok
test bounce_from_origin_and_separate_return_hex_match_web ... ok
test unit_with_pooled_ruch_matches_web ... ok
test separate_return_matches_web_bitwise ... ok
test ruch_pools_match_web_bitwise ... ok
test sync_and_deduct_match_web ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 2.16s

     Running tests/p6_5a_stack.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_5a_stack-32bcaffc556db8d5)

running 10 tests
test adjacent_army_hexes_and_active_stack_match_web ... ok
test garrison_and_field_fortify_transitions_match_web ... ok
test fresh_and_shared_stack_group_ids_match_web_sequence ... ok
test stack_group_id_agrees_with_p64_port_on_the_same_unit ... ok
test all_defenders_and_wake_stack_match_web ... ok
test law_garrison_counts_match_web ... ok
test stack_group_id_and_render_key_match_web ... ok
test same_stack_group_and_stack_key_match_web ... ok
test transition_chains_match_web_including_both_fortifications_at_once ... ok
test visible_colocated_and_garrison_queries_match_web ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 3.61s

     Running tests/p6_5a_tables.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_5a_tables-c73c4ca1005ab433)

running 2 tests
test army_params_parse_and_have_sane_shape ... ok
test tempo_table_parses_and_has_distinct_keys_with_positive_multipliers ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_5b_bonuses.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_5b_bonuses-02e0bfe8577aeac4)

running 8 tests
test building_roles_and_real_game_data_match_web ... ok
test chain_depth_limit_matches_web ... ok
test gain_hint_text_matches_web_for_arbitrary_gains ... ok
test stat_multiplier_merge_is_generic_over_any_structural_type ... ok
test stat_multiplier_merge_matches_web ... ok
test unit_progress_badges_and_fractions_match_web ... ok
test city_visit_gain_progress_and_hint_match_web ... ok
test city_percentages_and_chains_match_web_including_cycles_and_trimmed_ids ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 8.78s

     Running tests/p6_5b_format.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_5b_format-8864aed56360906f)

running 5 tests
test locale_compare_table_is_the_measured_primary_order ... ok
test number_to_string_matches_web ... ok
test population_formats_match_web ... ok
test citizen_label_matches_web ... ok
test locale_compare_matches_web_for_ascii ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.19s

     Running tests/p6_5b_manpower.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_5b_manpower-0a099d61a31307ee)

running 13 tests
test empire_deduct_refund_and_spawn_mutate_like_web ... ok
test civ_bonus_multipliers_match_web ... ok
test besieged_location_sort_key_sync_and_civilian_match_web ... ok
test city_pool_functions_match_web ... ok
test game_default_params_equal_the_running_web_defaults ... ok
test opt_helpers_are_consistent ... ok
test empire_totals_match_web ... ok
test era_table_and_citizen_scalars_match_web ... ok
test heal_cost_and_cap_match_web ... ok
test pool_and_cost_scalars_match_web ... ok
test raw_param_loaders_match_web ... ok
test regen_gain_matches_web_including_default_params ... ok
test spawn_and_refund_functions_match_web ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 13.98s

     Running tests/p6_5b_replenish.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_5b_replenish-11d5c4ac4b77306b)

running 1 test
test replenishment_matches_web_state_results_and_closure_protocol ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 3.41s

     Running tests/p6_5b_tables.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_5b_tables-4f918dda2f6680dd)

running 6 tests
test civilian_set_is_resolved_from_the_table ... ok
test tables_are_loaded_from_the_embedded_json_files ... ok
test tables_parse_and_have_the_expected_shape ... ok
test era_table_rows_are_contiguous_and_cover_the_clamp_range ... ok
test p65a_badge_closures_are_closed_by_the_real_path_badge_port ... ok
test table_constants_equal_the_running_web ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.52s

     Running tests/p6_6a_conquest.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_6a_conquest-230020c5d317bb55)

running 6 tests
test clear_city_culture_mix_removes_both_fields ... ok
test revolt_multiplier_and_deprecated_penalties_match_web ... ok
test building_flags_match_web ... ok
test thresholds_match_web ... ok
test on_city_captured_culture_matches_web_with_injected_circle ... ok
test tick_city_culture_religion_matches_web_with_injected_conversions ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.32s

     Running tests/p6_6a_founding.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_6a_founding-99bc07a6ebb0028d)

running 10 tests
test costs_follow_injected_params ... ok
test cost_constants_match_running_web ... ok
test evaluate_found_city_affordance_matches_web ... ok
test first_city_is_free_for_any_params ... ok
test cost_labels_match_web ... ok
test production_params_come_from_data_tables ... ok
test read_param_accepts_only_finite_numbers ... ok
test can_afford_found_city_matches_web ... ok
test pick_source_city_matches_web_including_rand_protocol ... ok
test is_subsequent_found_city_matches_web ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.36s

     Running tests/p6_6a_hexclear.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_6a_hexclear-98167207530960b3)

running 4 tests
test apply_city_founding_to_hex_matches_web ... ok
test clearing_follows_the_editable_table_but_forest_and_mountain_rules_are_fixed ... ok
test clear_hex_for_city_center_matches_web ... ok
test keep_set_and_predicate_match_web ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.20s

     Running tests/p6_6a_tables.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_6a_tables-49f7fae6dbfdf022)

running 6 tests
test conquest_table_is_well_formed ... ok
test founding_costs_are_present_in_miasto_params ... ok
test visibility_table_is_well_formed ... ok
test hex_clear_table_is_well_formed ... ok
test default_sight_comes_from_map_gen_params_when_positive ... ok
test founding_table_is_well_formed ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.04s

     Running tests/p6_6a_visibility.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_6a_visibility-0615129695460042)

running 11 tests
test city_sight_radius_reexport_matches_web ... ok
test add_explored_and_render_sets_match_web ... ok
test compute_player_visibility_matches_web ... ok
test compute_visible_at_matches_web ... ok
test compute_visible_along_path_matches_web ... ok
test default_sight_uses_the_data_value_only_when_positive ... ok
test constants_match_running_web ... ok
test key_listings_and_terrain_predicates_match_web ... ok
test units_visible_on_map_matches_web ... ok
test compute_visible_fixed_sight_matches_web ... ok
test unit_sight_resolver_and_compute_visible_match_web ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 2.56s

     Running tests/p6_6b_cities_ensure.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_6b_cities_ensure-50bdd28ce75e4eaa)

running 3 tests
test ensure_city_podzial_defaults_matches_web ... ok
test ensure_city_save_defaults_is_idempotent_on_web_outputs ... ok
test ensure_city_save_defaults_matches_web ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.67s

     Running tests/p6_6b_cities_found.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_6b_cities_found-bf324e45fa4c28c4)

running 5 tests
test found_city_from_village_matches_web ... ok
test found_city_at_matches_web ... ok
test can_found_city_matches_web ... ok
test city_name_and_predicates_match_web ... ok
test found_city_matches_web ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 2.19s

     Running tests/p6_6b_display.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_6b_display-cf51bca517933bcf)

running 13 tests
test foreign_capital_map_name_matches_web ... ok
test format_entity_display_name_matches_web ... ok
test clear_city_state_flag_on_capture_matches_web ... ok
test format_city_map_label_matches_web ... ok
test format_owner_diplo_label_matches_web ... ok
test is_cluster_city_state_slot_matches_web ... ok
test is_technical_owner_label_matches_web ... ok
test labels_match_running_web ... ok
test sanitize_owner_display_base_matches_web ... ok
test should_force_culture_icon_matches_web ... ok
test resolve_owner_base_name_matches_web ... ok
test is_owner_cluster_city_state_matches_web ... ok
test strip_city_state_suffix_matches_web ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 2.51s

     Running tests/p6_6b_empire.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_6b_empire-0403df939c625d79)

running 6 tests
test podzial_pracy_migration_matches_web ... ok
test okolica_focus_functions_match_web ... ok
test podzial_pracy_functions_match_web ... ok
test budowa_profil_functions_match_web ... ok
test upgrade_budowa_profil_auto_defaults_matches_web ... ok
test poziom_racji_functions_match_web ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 3.74s

     Running tests/p6_6b_lists.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_6b_lists-76264e548cdf3b61)

running 3 tests
test default_nazwa_matches_web ... ok
test dedupe_matches_web ... ok
test id_generator_and_loader_match_web_sequence ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.05s

     Running tests/p6_6b_percent.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_6b_percent-1f6b6df5d7367a50)

running 10 tests
test budowa_priority_helpers_match_web ... ok
test clamp_functions_match_web ... ok
test adjust_handel_split_matches_web ... ok
test constants_match_running_web ... ok
test normalize_podzial_handlu_matches_web ... ok
test podzial_pracy_z_procentu_puli_matches_web ... ok
test resolve_effective_ulepszenia_matches_web ... ok
test resolve_praca_percent_from_raw_matches_web ... ok
test snap_and_migrate_match_web ... ok
test ulepszenia_policy_and_caps_match_web ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 2.48s

     Running tests/p6_6b_tables.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_6b_tables-30bc19375e8a4aab)

running 5 tests
test cities_defaults_are_consistent_with_each_other ... ok
test cities_foreign_inputs_agree_with_engine_data ... ok
test cities_table_is_well_formed ... ok
test min_city_distance_comes_from_miasto_params ... ok
test display_names_table_is_well_formed ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

     Running tests/p6_m00_skeleton.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_m00_skeleton-1864ffd75187226a)

running 5 tests
test mapgen_mod_declares_exactly_doc_modules ... ok
test doc_row_lists_expected_counts ... ok
test domain_mod_declares_top_level_skeleton_modules ... ok
test files_exist_and_start_with_owner_doc_header ... ok
test skeleton_headers_name_full_owner_ids_from_table ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_m01_climate.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_m01_climate-fc8a7dd62f5452ac)

running 7 tests
test climate_band_default_arguments_and_ignored_q_match_web ... ok
test forest_threshold_matches_web_bit_for_bit ... ok
test water_terrain_predicate_matches_web_for_every_terrain ... ok
test desert_assignment_predicate_matches_web ... ok
test world_type_and_climate_band_serde_literals_match_web ... ok
test polar_predicate_matches_web ... ok
test climate_band_sweep_matches_web_for_every_height_and_row ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.20s

     Running tests/p6_m01_earth_mask.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_m01_earth_mask-1779c36a54b4d8e3)

running 10 tests
test derived_mask_file_is_the_single_source_of_mask_data ... ok
test hex_to_norm_edges_match_web ... ok
test mask_dimensions_and_bbox_match_web_bit_for_bit ... ok
test bit_at_clamps_out_of_range_coordinates_like_web ... ok
test polar_rows_inner_dimensions_and_buffers_match_web_for_heights_0_to_600 ... ok
test sample_template_land_matches_web_on_thousands_of_points ... ok
test sample_template_land_nan_is_sea ... ok
test all_288000_mask_bits_match_the_web_rows ... ok
test named_constants_match_web_exports ... ok
test hex_to_template_norm_template_land_subsample_and_threshold_match_web_for_all_dims ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.91s

     Running tests/p6_m01_params_shape.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_m01_params_shape-188a388bb5a09197)

running 9 tests
test climate_is_polar_outside_the_map ... ok
test ocean_buffers_never_shrink_with_height_and_respect_their_lower_bound ... ok
test params_files_parse_and_have_the_expected_shape ... ok
test params_floats_are_parsed_exactly_from_the_raw_json_text ... ok
test subsample_and_threshold_tiers_never_decrease_resolution_for_bigger_maps ... ok
test template_sampling_is_zero_outside_the_unit_square ... ok
test climate_bands_are_ordered_north_to_south_and_cover_the_playable_rows ... ok
test mask_file_is_well_formed ... ok
test template_land_respects_border_and_polar_buffers_and_yields_binary_values ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.40s

     Running tests/p6_m01_prims.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_m01_prims-963d8aed92ec098f)

running 14 tests
test cos_lerp_matches_web_bit_for_bit ... ok
test hex_directions_match_web_in_every_implementation ... ok
test fbm_matches_web_bit_for_bit_for_all_octave_counts ... ok
test all_three_mulberry32_implementations_match_web_for_every_seed_and_step ... ok
test hex_distance_matches_web_for_large_coordinates ... ok
test hex_distance_matches_web_on_the_full_grid_in_every_implementation ... ok
test hex_key_matches_web_format ... ok
test js_cos_matches_v8_math_cos_bit_for_bit_in_the_supported_range ... ok
test js_cos_outside_the_medium_range_stays_within_one_ulp_and_keeps_special_values ... ok
test js_to_int32_follows_ecmascript_to_int32 ... ok
test mulberry32_state_is_the_seed_until_first_draw ... ok
test value_noise_matches_web_bit_for_bit_including_huge_and_negative_coordinates ... ok
test perm_table_matches_web_for_all_256_entries ... ok
test vectors_come_from_the_pinned_web_run ... ok

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.38s

     Running tests/p6_m02_deposit_river.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_m02_deposit_river-aa1b079e2438a847)

running 7 tests
test parse_helpers_cover_all_tokens ... ok
test deposit_visibility_matches_web ... ok
test ensure_meta_and_hidden_count_match_web ... ok
test metal_deposit_min_era_table_matches_web ... ok
test river_switch_keys_match_names_the_web_queried ... ok
test river_switch_matches_web ... ok
test river_switch_without_environment_matches_web ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.23s

     Running tests/p6_m02_float_parse.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_m02_float_parse-bdfe4c125f45e686)

running 1 test
test table_floats_are_read_without_rounding_error ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/p6_m02_generator.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_m02_generator-aad7149729b35309)

running 4 tests
test normalization_matches_web ... ok
test size_dims_and_order_match_web ... ok
test size_from_menu_label_and_label_to_dims_match_web ... ok
test menu_labels_match_web ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/p6_m02_new_game.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_m02_new_game-fb7bd264e697cc8f)

running 11 tests
test clamp_miasta_panstwa_count_matches_web ... ok
test constants_match_web ... ok
test density_to_label_round_trips_where_web_does ... ok
test civ_menus_with_rosters_match_web ... ok
test land_fraction_functions_match_web ... ok
test map_size_label_from_dims_matches_web ... ok
test resolve_world_gen_numbers_matches_web ... ok
test river_map_params_match_web_bitwise ... ok
test world_generation_presets_match_web ... ok
test tier_functions_match_web ... ok
test per_label_functions_match_web ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.99s

     Running tests/p6_m02_quality.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_m02_quality-07b289bbbb867c75)

running 4 tests
test per_label_functions_match_web ... ok
test constants_match_web ... ok
test web_quirk_ignores_z_with_dot ... ok
test tier_to_label_and_preset_match_web ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

     Running tests/p6_m02_tables.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_m02_tables-abfdd889c351ab6b)

running 7 tests
test every_section_names_its_web_source ... ok
test map_label_thresholds_are_ascending_and_known ... ok
test per_size_menus_cover_every_size ... ok
test land_and_toggle_tables_are_consistent ... ok
test size_tables_are_consistent ... ok
test river_rules_have_sane_ranges ... ok
test table_parses_with_deny_unknown_fields ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_m09_rivals.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_m09_rivals-3d2871a7b9753cde)

running 19 tests
test cluster_pack_radius_matches_web ... ok
test half_plane_axis_matches_web_bitwise ... ok
test group_foreign_type_clusters_matches_web ... ok
test constants_match_web_and_aliases_are_not_separate_numbers ... ok
test foreign_buffer_gate_matches_web ... ok
test is_in_half_plane_matches_web ... ok
test hexes_at_distance_matches_web ... ok
test land_pool_near_core_matches_web ... ok
test map_helpers_match_web ... ok
test nearest_legal_land_matches_web ... ok
test hub_chain_result_does_not_depend_on_seed_as_in_web ... ok
test hub_chain_matches_web ... ok
test rival_slots_degenerate_inputs_do_not_panic ... ok
test pack_rival_cities_matches_web ... ok
test shuffle_in_place_matches_web ... ok
test vectors_identify_the_same_maps_as_p6_1c ... ok
test pack_around_capital_matches_web ... ok
test rival_slots_match_web_on_real_maps ... ok
test rival_candidate_hexes_match_web_on_real_maps ... ok

test result: ok. 19 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 23.67s

     Running tests/p6_m09_tables.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_m09_tables-0380ed37b51ae447)

running 3 tests
test every_value_has_web_source_and_sane_shape ... ok
test start_city_state_distance_is_not_the_cities_ts_constant ... ok
test table_parses_with_deny_unknown_fields ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_m10_masses.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_m10_masses-1406512a25778485)

running 16 tests
test alias_constants_are_not_separate_numbers ... ok
test constants_match_web ... ok
test local_land_fraction_and_gate_match_web ... ok
test map_size_label_matches_web_and_params_table ... ok
test mass_qualifies_and_indices_match_web ... ok
test player_mass_gate_over_whole_maps_matches_web ... ok
test allocate_typy_to_masses_matches_web ... ok
test reorder_roster_by_preference_matches_web ... ok
test roster_for_start_epoch_matches_web ... ok
test spawn_habitable_terrain_matches_web ... ok
test thresholds_and_caps_match_web ... ok
test types_have_web_shape ... ok
test vectors_identify_the_maps_used ... ok
test group_habitable_masses_and_cache_match_web ... ok
test region_mass_dominance_matches_web ... ok
test development_space_and_mass_gates_match_web ... ok

test result: ok. 16 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 18.42s

     Running tests/p6_m10_placement.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_m10_placement-0ff78516c0b93780)

running 14 tests
test hooks_match_web ... ok
test pick_center_in_mass_matches_web ... ok
test balance_and_enforce_match_web ... ok
test pick_best_local_land_spawn_matches_web ... ok
test pick_center_in_mass_spread_matches_web ... ok
test pick_tied_spawn_land_candidate_matches_web ... ok
test pick_center_on_land_pool_spread_matches_web ... ok
test pick_center_in_mass_with_land_gate_matches_web ... ok
test sort_spawn_candidates_with_spread_bias_matches_web ... ok
test sort_spawn_land_candidates_matches_web ... ok
test voronoi_and_centroid_match_web ... ok
test pick_player_cluster_center_matches_web ... ok
test place_cluster_centers_across_landmasses_matches_web ... ok
test player_start_candidates_match_web ... ok

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 28.48s

     Running tests/p6_m10_start_scoring.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_m10_start_scoring-a1f4519e6663b8a9)

running 4 tests
test reveal_radius_matches_web ... ok
test score_city_start_hex_over_whole_maps_matches_web ... ok
test score_city_start_hex_matches_web ... ok
test find_best_player_start_hex_matches_web ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.30s

     Running tests/p6_m10_tables.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_m10_tables-07a2652eafb05f75)

running 3 tests
test every_value_has_a_web_source_with_file_and_line ... ok
test tables_parse_with_deny_unknown_fields ... ok
test values_have_sane_shape ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_m10_v8sort.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_m10_v8sort-d4cb86648b856051)

running 2 tests
test js_array_sort_is_stable_for_equal_keys ... ok
test js_array_sort_matches_v8_including_comparator_call_counts ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.81s

     Running tests/p6_m14_range.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_m14_range-11a976a1d8c0add9)

running 3 tests
test territory_keys_by_owner_match_web ... ok
test culture_range_matches_web ... ok
test religion_range_matches_web ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.79s

     Running tests/p6_m14_territory.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_m14_territory-ba89cbcff9a8795a)

running 8 tests
test city_territory_radius_matches_web ... ok
test city_sight_radius_matches_web ... ok
test city_range_for_population_matches_web ... ok
test owner_tie_goes_to_first_node ... ok
test axial_distance_matches_web_and_integer_variant ... ok
test is_player_territory_hex_matches_web ... ok
test territory_owner_at_matches_web ... ok
test is_in_territory_matches_web ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.33s

     Running tests/p6_m14_wonder.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_m14_wonder-96491650d658ea23)

running 4 tests
test list_for_city_matches_web ... ok
test list_for_owner_matches_web ... ok
test pick_matches_web ... ok
test shape_candidates_are_sorted_land_and_exclude_center ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 2.61s

     Running tests/p6_m14_work.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_m14_work-1ce45b3a771ecceb)

running 8 tests
test reconcile_all_matches_web ... ok
test build_territory_nodes_matches_web ... ok
test city_center_keys_match_web ... ok
test reconcile_without_reczne_is_noop ... ok
test is_territory_hex_owned_by_matches_web ... ok
test workable_filter_matches_web ... ok
test reczne_key_legal_matches_web ... ok
test reconcile_for_owner_matches_web ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.33s

     Running tests/p6_m15_roads.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_m15_roads-00c1796d2d44aacd)

running 8 tests
test has_road_matches_web ... ok
test constants_match_web ... ok
test collect_road_keys_matches_web_order ... ok
test road_table_shape_and_key_names ... ok
test is_road_key_matches_web ... ok
test roads_source_has_no_numeric_data_literals ... ok
test p64_ruch_modifier_agrees_with_roads_module ... ok
test apply_modifier_matches_web_bitwise ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.72s

     Running tests/p6_m16_divergence.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_m16_divergence-36f41f9340105fdf)

running 1 test
test web_allows_farm_irrigation_terraces_on_deposit_hexes ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 2.29s

     Running tests/p6_m16_doc.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_m16_doc-a783ecb95132fc08)

running 1 test
test document_has_a_status_row_for_every_web_symbol ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/p6_m16_gallery.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_m16_gallery-40cbda6184b177cf)

running 2 tests
test gallery_terrain_eligible_matches_web ... ok
test gallery_combo_eligible_and_show_model_match_web ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.23s

     Running tests/p6_m16_qualifier.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_m16_qualifier-54c27efc7f24500a)

running 4 tests
test forest_build_block_reason_matches_web ... ok
test api_hex_click_and_on_select_match_web ... ok
test qualifier_bits_match_web_for_every_key_and_hex ... ok
test api_qualifying_hexes_and_work_cost_match_web ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 20.81s

     Running tests/p6_m16_rules.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_m16_rules-33e7267e34428bc9)

running 15 tests
test forest_blocking_and_hints_match_web ... ok
test deposit_rules_match_web ... ok
test farm_and_owce_base_terrain_match_web ... ok
test can_add_food_layer_matches_web ... ok
test format_impact_list_matches_web ... ok
test hex_has_road_matches_web ... ok
test hex_keys_within_radius_matches_web ... ok
test legacy_farm_layer_and_strip_match_web ... ok
test improvement_meta_and_tech_gate_match_web ... ok
test livestock_dependency_matches_web ... ok
test mine_keys_tarasy_civ_and_food_keys_match_web ... ok
test plan_and_remove_legacy_farms_match_web ... ok
test replaced_by_build_and_impact_match_web ... ok
test strip_improvements_when_forest_removed_matches_web ... ok
test work_cost_scale_matches_web ... ok

test result: ok. 15 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 10.40s

     Running tests/p6_m16_tables.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_m16_tables-fd1582fd8a835964)

running 5 tests
test food_and_sector_tables_are_consistent ... ok
test rule_keys_are_known_improvements ... ok
test terrain_codes_in_tables_are_valid ... ok
test livestock_and_tech_tables_are_consistent ... ok
test improvement_build_has_no_balance_number_literals ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.05s

     Running tests/p6_m17_rebuild.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_m17_rebuild-60f4b8705aae281a)

running 5 tests
test js_keyed_map_orders_array_index_keys_first ... ok
test rebuild_errors_name_the_failing_field ... ok
test rebuild_error_class_matches_web_failure_class ... ok
test serialize_rebuild_serialize_is_stable_without_duplicate_coords ... ok
test rebuild_matches_web ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.50s

     Running tests/p6_m17_serialize.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_m17_serialize-bc527bf55aa676f5)

running 5 tests
test js_num_writes_integers_without_fraction_and_non_finite_as_null ... ok
test serialize_vectors_touch_every_branch ... ok
test serialize_text_is_byte_identical_to_web_json_stringify ... ok
test serialize_matches_web_structurally ... ok
test snapshot_shape_invariants_hold_for_every_vector ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 2.13s

     Running tests/p6_m17_validate.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/p6_m17_validate-f52da1b0e7422d55)

running 2 tests
test is_valid_matches_web_for_all_vectors ... ok
test every_serialize_vector_snapshot_has_a_web_validity_vector ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.71s

     Running tests/parity_suite.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/parity_suite-8699c8ce8b7a5315)

running 11 tests
test canonical_state_dto_vector_round_trips_through_json ... ok
test city_growth_vector_preserves_health_threshold_and_population_cap ... ok
test hex_terrain_and_pathfinding_vectors_preserve_geometry_and_costs ... ok
test improvements_and_resource_production_vectors_match_catalogue_rules ... ok
test map_generator_coordinate_vector_is_distinct_and_serializable ... ok
test map_generator_golden_vector_matches_the_public_wire_contract ... ok
test public_engine_wire_aliases_are_stable ... ok
test building_and_recruitment_vectors_keep_purchase_and_work_costs_separate ... ok
test trade_route_vector_uses_stable_hex_path_and_wire_identity ... ok
test turn_economy_vector_credits_before_spending_and_resets_work ... ok
test lcg_golden_vector_matches_the_typescript_stream ... ok

test result: ok. 11 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.04s

     Running tests/pathfinding.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/pathfinding-9421af37f99a3ae3)

running 8 tests
test dijkstra_chooses_the_same_least_cost_path_every_time ... ok
test occupied_intermediate_tiles_block_but_occupied_destination_is_final_step ... ok
test reachable_applies_min_move_to_expensive_direct_neighbours ... ok
test reachable_respects_fixed_point_budget_and_excludes_origin ... ok
test terrain_qualification_keeps_workability_separate_from_movement ... ok
test unreachable_and_missing_fields_are_rejected ... ok
test impassable_destination_is_allowed_as_the_final_step ... ok
test movement_cost_applies_terrain_overlay_river_and_road_rules ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/playable_slice.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/playable_slice-96536ec0c076f01a)

running 7 tests
test advance_turn_drains_the_canonical_phase_queue_and_refreshes_state ... ok
test create_session_is_deterministic_and_contains_playable_entities ... ok
test selected_start_values_change_the_scenario_without_claiming_unsupported_effects ... ok
test start_params_round_trip_with_frontend_camel_case_names ... ok
test frontend_non_default_payload_reaches_the_rust_start_dto ... ok
test select_and_move_unit_updates_only_the_selected_unit_position ... ok
test movement_rejects_out_of_bounds_impassable_and_out_of_range_destinations ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.05s

     Running tests/recruitment.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/recruitment-10fa19ca5709d7f0)

running 8 tests
test empty_purchase_cost_is_affordable_and_keeps_stock_unchanged ... ok
test failed_recruitment_is_atomic_and_reports_the_missing_resource ... ok
test recruitment_affordability_checks_only_the_one_time_purchase_stock ... ok
test successful_recruitment_spends_purchase_stock_but_not_future_upkeep ... ok
test canonical_unit_record_keeps_purchase_and_upkeep_separate ... ok
test upkeep_totals_are_grouped_by_resource_and_ignore_unknown_units ... ok
test canonical_catalog_contains_all_unit_rows_and_round_trips ... ok
test canonical_catalog_matches_units_json_for_all_75_rows ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.05s

     Running tests/replay.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/replay-0e0cf52d2fbdb5ec)

running 6 tests
test playback_cursor_observes_peek_remaining_and_reset ... ok
test recording_same_inputs_seed_and_rng_checkpoints_is_byte_deterministic ... ok
test replay_log_round_trips_some_snapshot_with_all_snapshot_data ... ok
test replay_rejects_missing_or_unsupported_version_and_non_contiguous_steps ... ok
test replay_validation_rejects_invalid_checkpoint_snapshots ... ok
test replay_playback_preserves_order_rng_checkpoints_and_snapshots ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.08s

     Running tests/resource_production.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/resource_production-10735877f5f8510b)

running 5 tests
test invalid_or_missing_era_is_safe_and_other_improvements_stay_flat ... ok
test lumber_mill_and_quarry_follow_the_200_300_450_era_vector ... ok
test resolver_rejects_non_producers_and_accepts_legacy_aliases ... ok
test multiple_layers_stack_additively_per_resource ... ok
test era_scaling_rounds_like_the_typescript_resolver_and_saturates ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.12s

     Running tests/rng.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/rng-044cb5e0327fdca7)

running 4 tests
test copied_state_and_forks_reproduce_independent_streams ... ok
test ranges_reject_empty_or_reversed_bounds_and_stay_inside_exclusive_end ... ok
test seeded_stream_matches_the_typescript_lcg_and_repeats ... ok
test serialized_state_round_trip_resumes_the_exact_stream ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.03s

     Running tests/road_movement_multipliers.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/road_movement_multipliers-10cca6a7ed28e576)

running 3 tests
test road_divisors_are_integers_read_from_the_table ... ok
test road_movement_table_covers_each_constant_once ... ok
test road_floor_row_is_readable_and_positive ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/save_load.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/save_load-db71f01fd33c5619)

running 6 tests
test explicit_v1_constructor_uses_the_same_migration_contract ... ok
test snapshot_parts_can_be_moved_into_a_runtime_restore ... ok
test current_snapshot_round_trips_with_state_queue_rng_and_version ... ok
test version_one_snapshot_migrates_by_adding_an_empty_queue ... ok
test future_and_incomplete_versions_are_rejected_without_silent_defaults ... ok
test invalid_state_is_rejected_during_snapshot_deserialization ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

     Running tests/smoke.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/smoke-adce5cc2d2d8a90e)

running 2 tests
test engine_state_can_be_created_advanced_and_round_tripped ... ok
test one_based_turn_invariant_is_enforced_on_construction_and_deserialization ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/state_dto.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/state_dto-327fd3dbeed98a1f)

running 10 tests
test city_rejects_empty_names_and_zero_population ... ok
test canonical_state_round_trips_through_serde ... ok
test invalid_entity_reference_is_rejected_by_state_constructor ... ok
test civilization_rejects_empty_names_and_duplicate_entity_references ... ok
test map_rejects_invalid_dimensions_tile_count_duplicate_and_out_of_bounds ... ok
test state_rejects_duplicate_civilization_city_and_unit_ids ... ok
test state_rejects_unknown_and_mismatched_entity_owners ... ok
test invalid_one_based_turn_is_rejected_during_state_deserialization ... ok
test state_rejects_city_and_unit_positions_outside_the_map ... ok
test state_rejects_unknown_unit_reference ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/steam_adapter.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/steam_adapter-f6b655412f549c74)

running 5 tests
test in_memory_adapter_round_trips_cloud_save_bytes_exactly ... ok
test in_memory_adapter_unlocks_achievements_and_reports_overlay_status ... ok
test missing_cloud_save_key_is_reported_without_fabricating_data ... ok
test production_adapter_is_explicitly_disconnected_and_side_effect_free ... ok
test unavailable_mock_rejects_every_steam_operation ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/structure_defense_max.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/structure_defense_max-97cd066d284c179b)

running 3 tests
test no_structure_gives_neutral_multiplier ... ok
test combined_structures_equal_the_strongest_single_structure ... ok
test structures_are_ignored_outside_siege ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/terrain_movement_fix.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/terrain_movement_fix-125ac22589e46124)

running 9 tests
test ai_turn_desert_movement_cost_matches_web_and_pathfinder ... ok
test barbarian_camps_never_spawn_on_tundra ... ok
test barbarians_treat_tundra_as_impassable_land ... ok
test ai_turn_movement_costs_agree_with_terrain_module_for_shared_terrains ... ok
test barbarian_camps_spawn_on_passable_land_next_to_tundra ... ok
test land_route_bfs_crosses_desert_field ... ok
test land_route_bfs_is_blocked_by_tundra_field ... ok
test owners_land_border_ignores_tundra_neighbour ... ok
test trade_routes_do_not_cross_tundra ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/trade.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/trade-4501c2b50cea3ce6)

running 12 tests
test connection_result_and_tile_helpers_are_small_and_stable ... ok
test diff_and_serialization_preserve_route_contract ... ok
test diagonal_path_uses_the_canonical_hex_neighbor_order ... ok
test grants_are_symmetric_and_disappear_with_inactive_routes ... ok
test land_and_sea_connection_follow_physical_terrain_without_distance_cap ... ok
test income_curve_is_clamped_and_sea_total_is_scaled_like_the_canonical_rule ... ok
test land_border_is_required_only_when_territory_data_is_supplied ... ok
test refresh_requires_treaty_and_war_free_route_but_allows_internal_trade ... ok
test resource_flow_moves_only_surplus_and_uses_deterministic_ledger ... ok
test route_identity_construction_and_building_limits_are_deterministic ... ok
test route_income_building_and_sea_bonuses_are_aggregated_per_city ... ok
test map_and_resource_dtos_use_json_safe_camel_case_contracts ... ok

test result: ok. 12 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/turn_economy.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/turn_economy-ecc7aeae80031bf5)

running 7 tests
test flow_helpers_are_deterministic_and_saturating ... ok
test pure_preview_does_not_mutate_input_balances ... ok
test settlement_and_balances_round_trip_through_serde ... ok
test resource_costs_are_paid_independently_and_never_underflow ... ok
test invalid_and_overflow_turn_boundaries_are_rejected_without_mutation ... ok
test settlement_credits_income_before_paying_expenses ... ok
test unused_work_is_reset_but_persistent_balances_carry_forward ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/unit_epoch.rs (/home/user/cargo-target-shared/wf_9188d0d5-3d2-1/debug/deps/unit_epoch-c52a04b91f6d1f56)

running 6 tests
test current_and_previous_epochs_are_available ... ok
test epoch_labels_round_trip_and_reject_unknown_values ... ok
test p6_1_civ_entry_api_is_exercised ... ok
test units_older_than_the_previous_epoch_are_rejected ... ok
test non_scout_from_current_epoch_is_available_but_future_unit_is_not ... ok
test scout_is_available_in_every_epoch ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

   Doc-tests civ_engine

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

EXIT=0
```

### 11.4 `git diff --cached --check` (indeks po jawnym `git add` plikow tematu; `gate-diffcheck-r1.log`)

```text
$ git diff --cached --check
EXIT=0
```

### 11.5 Weryfikator Python (`verify-p66b-r1.log`)

```text
sprawdzen=24489 rozbieznosci=0
EXIT=0
```

### 11.6 Test negatywny weryfikatora (`dowody/verify-negative-r1.txt`)

```text
ROZBIEZNOSC format[5]: py='' json='X'
ROZBIEZNOSC adjust[10]: py={'procentPieniadz': 0.0, 'procentNauka': 60.0, 'procentLuksus': 40.0} json={'procentPieniadz': 0.0, 'procentNauka': 70.0, 'procentLuksus': 40.0}
ROZBIEZNOSC dedupe[2]: py=['b', 'mur', 'a', 'dom'] json=['b', 'mur', 'a', 'dom', 'zzz']
ROZBIEZNOSC b.upgrade[3].upgraded: py=[2, 3, 7] json=[2, 3, 7, 99]
ROZBIEZNOSC ensureSave[7]: py={'id': 's7', 'ownerId': 0.0, 'q': -3.0, 'r': 1.0, 'name': 'M7', 'population': 1.0, 'magazynZywnosci': 0.0, 'podzialHandluOverride': False, 'poziomRacji': 6.0, 'okolicaTryb': 'auto', 'budowaFocus': 'zrownowazone', 'budowaTryb': 'reczny', 'budowaLista': [], 'ulepszeniaOnlyWorked': False, 'ulepszeniaWolnoWycinacLas': True, 'ulepszeniaPracaPercent': inf, 'ulepszeniaPerTurn': 4.0, 'podzialPracy': {'procentBudynki': 70.0}, 'wealthState': {'poziom': 1.0, 'pula': 0.0}, 'okolicaFocus': 'zywnosc', 'rationMigratedV114': True, 'wzrostUlamkowy': 0.0, 'turyBezDoplaty': 0.0, 'surowce': {}, 'postepBudynkowUsuniete': {}} json={'id': 's7', 'ownerId': 0.0, 'q': -3.0, 'r': 1.0, 'name': 'M7', 'population': 1234.0, 'magazynZywnosci': 0.0, 'surowce': {}, 'podzialHandluOverride': False, 'podzialPracy': {'procentBudynki': 70.0}, 'poziomRacji': 6.0, 'rationMigratedV114': True, 'wzrostUlamkowy': 0.0, 'turyBezDoplaty': 0.0, 'okolicaFocus': 'zywnosc', 'okolicaTryb': 'auto', 'budowaFocus': 'zrownowazone', 'budowaTryb': 'reczny', 'budowaLista': [], 'ulepszeniaOnlyWorked': False, 'ulepszeniaWolnoWycinacLas': True, 'ulepszeniaPracaPercent': inf, 'ulepszeniaPerTurn': 4.0, 'wealthState': {'poziom': 1.0, 'pula': 0.0}, 'postepBudynkowUsuniete': {}}
sprawdzen=24489 rozbieznosci=5
EXIT=1
```

### 11.7 Literaly w nowych modulach (`dowody/grep-literals-r1.txt`)

```text
# Literaly liczbowe i napisowe w modulach P6.6B (state.rs, derived.rs); komentarze pominiete
# Klasyfikacja: STRUKTURALNY = elementy neutralne/semantyka JS (0.0, 1.0, `+ 1.0`, `/ 2.0`, indeksy pary kluczy, nazwy
# wariantow wyliczen i pol JSON jako identyfikatory, formaty szablonow), nie dane ani mnozniki balansu.
# Dane: data/derived/{cities-params,display-names-params}.json, data/miasto-params.json.
## src/domain/state.rs od linii 1061
1096: nums=[] strs=[''] | let base = js_trim(ctx.base_name.unwrap_or(""));
1101: nums=[] strs=['{base}{}{}'] | return format!("{base}{}{}", city_state_separator(), city_state_label());
1108: nums=[] strs=['{}{}'] | let suffix = format!("{}{}", city_state_separator(), city_state_label());
1154: nums=['0'] strs=[] | if owner_id <= 0 {
1196: nums=['0'] strs=[] | if owner_id <= 0 {
1202: nums=[] strs=[''] | let player_key = js_trim(opts.and_then(|o| o.player_civ_key).unwrap_or(""));
1203: nums=[] strs=[''] | let owner_key = js_trim(opts.and_then(|o| o.owner_civ_key).unwrap_or(""));
1232: nums=['0'] strs=[] | let player_owner_id = opts.and_then(|o| o.player_owner_id).unwrap_or(0);
1297: nums=[] strs=[''] | let t = js_trim(name.unwrap_or(""));
1359: nums=[] strs=['{city}{}{civ}'] | return format!("{city}{}{civ}", city_state_separator());
1401: nums=[] strs=[''] | let trimmed = js_trim(base.unwrap_or(""));
1485: nums=[] strs=['zrownowazone'] | Self::Zrownowazone => "zrownowazone",
1486: nums=[] strs=['zywnosc'] | Self::Zywnosc => "zywnosc",
1487: nums=[] strs=['produkcja'] | Self::Produkcja => "produkcja",
1488: nums=[] strs=['podatki'] | Self::Podatki => "podatki",
1494: nums=[] strs=['zrownowazone'] | "zrownowazone" => Some(Self::Zrownowazone),
1495: nums=[] strs=['zywnosc'] | "zywnosc" => Some(Self::Zywnosc),
1496: nums=[] strs=['produkcja'] | "produkcja" => Some(Self::Produkcja),
1497: nums=[] strs=['podatki'] | "podatki" => Some(Self::Podatki),
1513: nums=[] strs=['auto'] | Self::Auto => "auto",
1514: nums=[] strs=['reczny'] | Self::Reczny => "reczny",
1520: nums=[] strs=['auto'] | "auto" => Some(Self::Auto),
1521: nums=[] strs=['reczny'] | "reczny" => Some(Self::Reczny),
1541: nums=[] strs=['zrownowazone'] | Self::Zrownowazone => "zrownowazone",
1542: nums=[] strs=['wzrost'] | Self::Wzrost => "wzrost",
1543: nums=[] strs=['wojsko'] | Self::Wojsko => "wojsko",
1544: nums=[] strs=['kultura'] | Self::Kultura => "kultura",
1545: nums=[] strs=['prawo'] | Self::Prawo => "prawo",
1546: nums=[] strs=['produkcja'] | Self::Produkcja => "produkcja",
1552: nums=[] strs=['zrownowazone'] | "zrownowazone" => Some(Self::Zrownowazone),
1553: nums=[] strs=['wzrost'] | "wzrost" => Some(Self::Wzrost),
1554: nums=[] strs=['wojsko'] | "wojsko" => Some(Self::Wojsko),
1555: nums=[] strs=['kultura'] | "kultura" => Some(Self::Kultura),
1556: nums=[] strs=['prawo'] | "prawo" => Some(Self::Prawo),
1557: nums=[] strs=['produkcja'] | "produkcja" => Some(Self::Produkcja),
1577: nums=[] strs=['reczny'] | Self::Reczny => "reczny",
1578: nums=[] strs=['priorytet'] | Self::Priorytet => "priorytet",
1579: nums=[] strs=['lista'] | Self::Lista => "lista",
1580: nums=[] strs=['zrownowazone'] | Self::Zrownowazone => "zrownowazone",
1581: nums=[] strs=['auto'] | Self::Auto => "auto",
1587: nums=[] strs=['reczny'] | "reczny" => Some(Self::Reczny),
1588: nums=[] strs=['priorytet'] | "priorytet" => Some(Self::Priorytet),
1589: nums=[] strs=['lista'] | "lista" => Some(Self::Lista),
1590: nums=[] strs=['zrownowazone'] | "zrownowazone" => Some(Self::Zrownowazone),
1591: nums=[] strs=['auto'] | "auto" => Some(Self::Auto),
1609: nums=[] strs=['zywnosc'] | Self::Zywnosc => "zywnosc",
1610: nums=[] strs=['surowce'] | Self::Surowce => "surowce",
1611: nums=[] strs=['infrastruktura'] | Self::Infrastruktura => "infrastruktura",
1612: nums=[] strs=['zrownowazone'] | Self::Zrownowazone => "zrownowazone",
1618: nums=[] strs=['zywnosc'] | "zywnosc" => Some(Self::Zywnosc),
1619: nums=[] strs=['surowce'] | "surowce" => Some(Self::Surowce),
1620: nums=[] strs=['infrastruktura'] | "infrastruktura" => Some(Self::Infrastruktura),
1621: nums=[] strs=['zrownowazone'] | "zrownowazone" => Some(Self::Zrownowazone),
1637: nums=[] strs=['auto'] | Self::Auto => "auto",
1638: nums=[] strs=['reczny'] | Self::Reczny => "reczny",
1644: nums=[] strs=['auto'] | "auto" => Some(Self::Auto),
1645: nums=[] strs=['reczny'] | "reczny" => Some(Self::Reczny),
1736: nums=['0.0'] strs=[] | js_max(0.0, js_min(pct_total(), x))
1740: nums=[] strs=['cities-params.json: okolica focus'] | OkolicaFocus::from_web(value).expect("cities-params.json: okolica focus")
1744: nums=[] strs=['cities-params.json: budowa focus'] | BudowaFocus::from_web(value).expect("cities-params.json: budowa focus")
1748: nums=[] strs=['cities-params.json: budowa tryb'] | BudowaTryb::from_web(value).expect("cities-params.json: budowa tryb")
1752: nums=[] strs=['cities-params.json: ulepszenia focus'] | UlepszeniaFocus::from_web(value).expect("cities-params.json: ulepszenia focus")
1756: nums=[] strs=['cities-params.json: ulepszenia tryb'] | UlepszeniaTryb::from_web(value).expect("cities-params.json: ulepszenia tryb")
1781: nums=[] strs=['cities-params.json: okolica tryb'] | .expect("cities-params.json: okolica tryb")
1956: nums=[] strs=['miasto-params.json must parse'] | .expect("miasto-params.json must parse")
1980: nums=['1'] strs=[] | self.seq += 1;
1982: nums=[] strs=['{}{}-{}'] | "{}{}-{}",
1998: nums=['1'] strs=[] | for i in 1..limit {
1999: nums=[] strs=['{}{i}'] | let candidate = format!("{}{i}", budowa.lista_domyslna_nazwa_prefiks);
2005: nums=[] strs=['{}{}'] | "{}{}",
2007: nums=['1'] strs=[] | biblioteka.len() + 1
2015: nums=[] strs=['id'] | matches!(o.get("id"), Some(Value::String(_)))
2016: nums=[] strs=['nazwa'] | && matches!(o.get("nazwa"), Some(Value::String(_)))
2017: nums=[] strs=['budynki'] | && matches!(o.get("budynki"), Some(Value::Array(_)))
2034: nums=[] strs=['id'] | id: s["id"].as_str().unwrap_or_default().to_owned(),
2035: nums=[] strs=['nazwa'] | nazwa: s["nazwa"].as_str().unwrap_or_default().to_owned(),
2036: nums=[] strs=['budynki'] | budynki: s["budynki"].as_array().cloned().unwrap_or_default(),
2054: nums=[] strs=['budowaListaBiblioteka'] | let raw_new = field("budowaListaBiblioteka");
2056: nums=[] strs=['checked'] | return copy_szablony(raw_new.expect("checked"));
2058: nums=[] strs=['budowaListaSzablony'] | let raw_legacy = field("budowaListaSzablony");
2069: nums=[] strs=['{}{slot}'] | "{}{slot}",
2081: nums=[] strs=['checked'] | return copy_szablony(raw_legacy.expect("checked"));
2135: nums=['0.0'] strs=[] | 0.0,
2149: nums=[] strs=['cities-params.json: migracja_per_turn'] | .expect("cities-params.json: migracja_per_turn")
2318: nums=['0.0'] strs=[] | js_max(0.0, js_min(pct_total(), js_round(n / step) * step))
2372: nums=['0.0'] strs=[] | if remainder < 0.0 {
2375: nums=['0.0'] strs=[] | next.set(*k, 0.0);
2379: nums=['0', '1'] strs=[] | let (k0, k1) = (keys[0], keys[1]);
2399: nums=['0.0'] strs=[] | next.set(nn, js_max(0.0, remainder - next.procent_nauka));
2405: nums=['0.0'] strs=[] | if sum_others <= 0.0 {
2406: nums=['2.0'] strs=[] | let half = js_round(remainder / 2.0 / step) * step;
2460: nums=[] strs=['checked'] | let current = city.podzial_handlu.expect("checked");
2636: nums=['0.0'] strs=[] | if x.is_finite() && x.fract() == 0.0 && x.abs() <= f64::from(i32::MAX) {
2727: nums=[] strs=['{}{index}'] | id: format!("{}{index}", founding.id_prefiks),
2830: nums=['0.0'] strs=[] | if index >= 0.0 && index < names.lista.len() as f64 {
2831: nums=['0.0'] strs=[] | if index.fract() != 0.0 {
2837: nums=[] strs=['{}{}'] | "{}{}",
2839: nums=['1.0'] strs=[] | js_number_to_string(index + 1.0)
2870: nums=['0'] strs=[] | match found_city_at(q, r, 0, cities, map, &name, false, false) {
3280: nums=[] strs=['cities-params.json: budowa domyslny_tryb_ai'] | .expect("cities-params.json: budowa domyslny_tryb_ai")
3289: nums=['0'] strs=[] | if owner_id < 0 || is_barbarian_owner(owner_id) {
3313: nums=['0'] strs=[] | if oid < 0 || is_barbarian_owner(oid) {
3316: nums=['0'] strs=[] | if oid == 0 {
## src/data/derived.rs od linii 3067
3071: nums=[] strs=['../../data/derived/cities-params.json'] | pub const CITIES_PARAMS_JSON: &str = include_str!("../../data/derived/cities-params.json");
3073: nums=[] strs=['../../data/derived/display-names-params.json'] | include_str!("../../data/derived/display-names-params.json");
3090: nums=[] strs=['procentNauka'] | #[serde(rename = "procentNauka")]
3092: nums=[] strs=['procentPieniadz'] | #[serde(rename = "procentPieniadz")]
3094: nums=[] strs=['procentLuksus'] | #[serde(rename = "procentLuksus")]
3242: nums=[] strs=['cities-params.json must parse'] | TABLE.get_or_init(|| parse_cities_params().expect("cities-params.json must parse"))
3272: nums=[] strs=['display-names-params.json must parse'] | .get_or_init(|| parse_display_names_params().expect("display-names-params.json must parse"))
# linii z literalami: 110
```
