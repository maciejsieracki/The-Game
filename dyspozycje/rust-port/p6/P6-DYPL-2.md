# P6-DYPL-2 — profil wojny i pokoju per cywilizacja (R-RUSTPORT-P6-DYPLOMACJA-PROFIL-WOJNY-POKOJU-Q1)

Pin weba: `23dd158e9` (= `origin/main` w chwili dispatchu). Baza Rust: `origin/rust-port/parity-v2` (`66df65a1b`).
Zasada właściciela: port 1:1; odstępstwo = ZAŁOŻENIE. Decyzja właściciela (2026-11-02): dyplomacja/wojna/pokój w pełnym zakresie
(audyt `DYPLOMACJA-PODZIAL-AUDYT.md`, temat nr 2).

## 1. Tabela funkcji (100%)

Moduł: `rust-port/engine/src/domain/diplomacy_war_peace_profile.rs`. Web: `gra/src/game/diplomacy-war-peace-profile.ts` (dalej `W:`) i `gra/src/main.ts` (dalej `M:`).

| Web | Rust | Uwagi |
|---|---|---|
| `W:15 ZDROWIE_AI_PARAM_KEY` | `ZDROWIE_AI_PARAM_KEY` | stała |
| `W:17 zdrowieBazaZAiParams` | `zdrowie_baza_z_ai_params_value`, `zdrowie_baza_z_ai_params`, `embedded_zdrowie_ai_value` | `typeof number && isFinite` -> `Option<f64>` + `is_finite` |
| `W:23 WarPeaceParams`, `W:39 WAR_PEACE_PARAMS` | `WarPeaceParams` (+ 8 struktur sekcji), `war_peace_params()` | `serde`, JSON = kopia pinu (`data/derived/diplomacy-war-peace-params.json`, `cmp` bajt w bajt) |
| `W:42 WAR_WEARINESS_MAX_SHARE` | `war_weariness_max_share()` | |
| `W:44 WarPeaceProfile` | `WarPeaceProfile` | `civKey: string\|null` = `Option<String>` |
| `W:71-87 MatrixRowLite`, `findMatrixRow` | `MatrixRowLite`, `embedded_matrix_rows()`, `find_matrix_row` | wiersze z istniejącego `civ_matrix::load_civ_matrix()` |
| `W:89 clampNum` | `clamp_num` | `Math.min(hi, Math.max(lo, v))` przez `js_min/js_max` |
| `W:97 resolveWarPeaceProfile` | `resolve_war_peace_profile`, `resolve_war_peace_profile_with` | `_with` przyjmuje wiersze i wartość `ai-params` jawnie (testowalność gałęzi `?? domyślne`) |
| `W:185 warWearinessFraction` | `war_weariness_fraction` | |
| `W:195 warWearinessShare` | `war_weariness_share`, `war_weariness_share_with` | |
| `W:203 WarCityRecord`, `W:210 recordWarCityLoss` | `WarCityRecord`, `record_war_city_loss` | |
| `W:225 warStateFromRecord` | `war_state_from_record`, `WarState` | |
| `W:240 brakeRelationThreshold` | `brake_relation_threshold` | |
| `W:244-287 PeaceSignalInput`, `aiPeaceSignals` | `PeaceSignalInput`, `PeaceSignalResult`, `ai_peace_signals` | powody `a,b,d,e,c` w tej kolejności |
| `W:289 peaceStrengthPriceMultiplier` | `peace_strength_price_multiplier` | |
| `W:299 peaceCivPriceMultiplier` | `peace_civ_price_multiplier` | |
| `W:307-364 PeaceAiGate*`, `isFeelingStronger`, `evaluatePeaceAiGate` | `PeaceAiGateInput`, `PeaceGateVerdict`, `PeaceAiGateResult`, `is_feeling_stronger`, `evaluate_peace_ai_gate` | komunikaty `reason` identyczne, liczby przez `js_number_to_string` |
| `M:10257 diploArmyHealthShare` | `army_health_share`, `ArmyHealthUnit` | czysty rdzeń (suma hp/hpMax); `isCivilianUnit` i `effectiveRuntimeUnitMaxHp` podaje wywołujący |
| `M:10225 diploWarStateFor` + `M:10245 diploEnsureWarStart` | `war_state_for_pair` | rdzeń: wejście `at_war`, stempel, rekord; wyjście stan + nowy stempel |
| `M:10271 diploRelWarFields` | `rel_war_fields`, `RelWarFields` | zdrowie liczone leniwie (`FnOnce`) tylko gdy `turnsAtWar > 0` |
| `M:10278 diploProposalWarState` | `proposal_war_state`, `ProposalWarState` | |
| `M:10318 diploBrakeWarParams` | `brake_war_params` | wyższy `progWojnyRelacji` (remis i NaN -> strona b) |

Niezaportowane (zależą od stanu gry, poza zakresem czystych funkcji): `diploWarProfileOf` (`isMe`, `civKeyForOwnerId`),
`recordWarCityLossForPair` (odczyt/zapis `diplomacyPairMeta`), `diploBrakeCrisisStep`, `diploOwnerEligibleForBrake` (stan sesji;
`isAiAiEligibleOwner` już jest w `diplomacy_tick_war_brake.rs`). Podpięcie do sesji = temat integracyjny (nr 10 audytu).

## 2. ZAŁOŻENIA

* Z1. `f64` dla wszystkich liczb; `undefined` -> `Option<_>` albo NaN (skalary: `undefined` ≡ NaN, generator weryfikuje równoważność po stronie weba).
* Z2. **`premiaProfilObronny = 0.05`** portowana 1:1 jako wartość z JSON (reguła 1:1 rozstrzyga pytanie 6 audytu). JSON nazywa ją „DECYZJĄ ADMINISTRACYJNĄ
  orkiestratora"; przykłady po premii (Zulusi 0.33, Chińczycy 0.54) potwierdza test `dane_osadzone_rowne_pinowi_i_przyklady_z_opisu_jsona`.
* Z3. `ai-params.json` `dyplomacja_zdrowie_armii_pokój` (0.4) czytane z istniejącego `parse_ai_params()`; kopia danych Rust jest identyczna z pinem (`cmp`).
* Z4. `civ-matrix.json` w danych Rust jest identyczny z pinem (`cmp`); nie dodano żadnych nowych danych pochodnych poza `diplomacy-war-peace-params.json`.
* Z5. `Record<string, number>` -> `BTreeMap<String, f64>`; klucze prototypowe JS (`__proto__`, `constructor`) nie są odtwarzane.
* Z6. `toLowerCase` -> `str::to_lowercase`; różnice Unicode (np. sigma końcowa) NIE_ZMIERZONO (klucze cywilizacji są ASCII).
* Z7. Rdzenie `main.ts` w generatorze są PRZEPISANE (domknięcia nieimportowalne, zero buildu w `gra/`); funkcje modułu `W:` wołane z prawdziwego bundla.
  Ryzyko: błąd przepisania. Mitygacja: przepisane ciała są 1:1 z `M:10225-10324` (numery linii w komentarzach generatora).
* Z8. Parametry (`WarPeaceParams`) są argumentem funkcji (web: domyślny argument); `war_weariness_share` używa osadzonych (web: globalne `WAR_WEARINESS_MAX_SHARE`).

## 3. Dowody

* Wektory z URUCHOMIONEGO weba: `tests/p6_dyplomacja_profil_wojny_pokoju_vectors/*.json` (8 plików, łącznie ok. 9 MB, każdy ≤ 3,2 MB),
  generator `runs/R-RUSTPORT-P6-DYPLOMACJA-PROFIL-WOJNY-POKOJU-Q1/gen-p6-dypl2-vectors.mjs` (czysty `git archive 23dd158e9`, esbuild w `mktemp -d`;
  dane `civ-matrix.json`/`ai-params.json` podmieniane wtyczką na warianty: 10 wariantów `ai-params`, macierz syntetyczna 200+ wierszy z `null`, `±Infinity`, duplikatami kluczy, pustym `ikonaId`;
  10 zestawów parametrów: rzeczywisty, 6 zaburzonych, z zamienionymi min/max, z połówkami w `Math.round`, z ujemnymi połówkami).
  Wartości graniczne N-1/N/N+1 (±1 ULP, ±1e-9, ±1), NaN, `undefined`, ±Infinity, -0 na każdej funkcji. Porównanie BITOWE (NaN=NaN, -0 != 0).
* Liczby wektorów: profil 5761, zmęczenie 778, rejestr 6006, hamulec 140, sygnały 16680, ceny 1370, bramka 13590, rdzenie `main.ts` 5543.
* Weryfikator `python3 -I` (`verify-p6-dypl2.py`): przelicza z samych wejść własną implementacją (Fraction dla `Math.round`, ECMA-262 `Number->String`): 177 275 sprawdzeń, 0 rozbieżności; kontrola negatywna (zepsute `Math.round`) 3249 rozbieżności.
* Mutacje (`mutate-dypl2.py`, `mutacje-wynik.txt`): 91 mutacji, 91 zabitych, 0 równoważnych, 0 błędów kompilacji. Cztery mutanty przeżyły przy pierwszym podejściu
  ([03] `ikonaId` bez `lowercase` — brak wielkich liter w ikonie, [06] pusty klucz — brak wiersza z pustym `ikonaId`, [42] `round()` Rust zamiast `Math.round` — brak ujemnych połówek,
  [71] `lost == 0` -> `<= 0` — brak ujemnych miast); wektory dopracowano i mutanty zabito. Brutto 100%.
* Bramki: `gate-fmt.txt`, `gate-clippy.txt` (`-D warnings`), `gate-test-full.txt` (8 shardów, po ostatniej zmianie kodu).

## 4. Dług / uwagi

* PRZED (baza w tym samym worktree) osobnym przebiegiem: NIE_ZMIERZONO; PO = 2108/0 (10 nowych testów w `p6_dyplomacja_profil_wojny_pokoju`).
* Konflikt `domain/mod.rs` z tematem TRUCE-AGRESOR (linie `pub mod`) rozwiązuje orkiestrator.
* Poprawka Web (nie portowana): `warWearinessShare` nie przyjmuje `params` — port odtwarza literalnie.
