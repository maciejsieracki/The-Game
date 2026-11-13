# OBRONA Operatora r3 — R-RUSTPORT-P6-ZLOZA-B-REST-Q1 (odpowiedź na EVAL r3)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: ZLOZA-B-REST: pozostałe gałęzie transferBasketItems (tech, surowiec_boolean, surowiec_ilosc, praca)
GOAL: wektory pinu `07d2fbd72` dla czterech gałęzi z rejestrującym harnessem stanu; zarzuty EVAL r3 zamknięte dowodem.
BAZA: `ae8a76c10` (Operator r3, detached). Obrona r3 = commity na tym samym detached HEAD (kod + dokumentacja).
COMMIT KODU: `056d8e493` (kod, wektory, testy; na detached HEAD po `ae8a76c10`).
COMMIT DOKUMENTACJI: osobny commit po kodzie (ten plik i `01-operator-r3.md`).
Wip-branch `wip/R-RUSTPORT-P6-ZLOZA-B-REST-Q1-r3` NIE został przesunięty (zostaje na `ae8a76c10`). Nic nie wypchnięto.
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

### Z1. Słabe pokrycie surowiec_ilosc (5 z 160 przypadków zmienia cities) — PRZYJMUJĘ
Poprawka w generatorze `p6_zloza_basket_gen.mjs`:
- 6 przypadków nazwanych (`addStateCase`): remis dawców wg id (biorca = pierwszy bez stolicy),
  remis dawców z biorcą-stolicą, zbiórka z trzech miast (30/50/90), zbiórka częściowa z trzech miast
  (60/60/60, ilość 250), normalizacja klucza, normalizacja klucza z zapasem tylko w kluczu znormalizowanym.
- 60 przypadków wymuszonych `ilosc-fokus` (zapasy z małego zbioru z remisami, 2–4 dawców, 1–3 biorców,
  losowa stolica).
- Zbiór stanu: 160 -> 226 przypadków. Przypadki `surowiec_ilosc` ze zmianą `cities`: 5 -> 58.
Asercje w `p6_zloza_basket.rs` (`state_branches_match_pin_vectors`): co najmniej 40 przypadków
`surowiec_ilosc` ze zmianą miast; co najmniej 10 zbiórek z co najmniej dwóch miast dawcy; nazwane
przypadki obecne i ze zmianą miast.
Mutacja (sprawdzona): odwrócenie tie-break id dawców w `diplomacy.rs:2559` -> FAIL na przypadku
`ilosc: remis dawcow wg id, biorca = pierwszy bez stolicy` (surowce miast). Plik przywrócony, `git diff` czysty.

### Z2. Normalizacja klucza słabo widoczna w stanie — PRZYJMUJĘ (z korektą faktów)
Korekta: klucze po normalizacji (`trim`+`lowercase`) to `ruda_zelaza`, `zboze`, `drewno`, `sol`, `zelazo`,
czyli są w `CITY_KEYS`. Efekt w stanie miast istniał już dla `Ruda_Zelaza` i `SOL`; brakowało przypadków z
kluczami surowymi o białych znakach i wielkich literach.
Poprawka: przypadki nazwane z kluczami `' Drewno '`, `'ZBOZE'`, `' Ruda_Zelaza '`, `'Sol'`, `'  ZELAZO  '`
oraz pula `FOCUS_ITEM_KEYS` (`' ZBOZE '`, `'Drewno'`, `'drewno '`, `'Ruda_Zelaza'`, ...).
Asercja: co najmniej 6 przypadków `surowiec_ilosc` z niekanonicznym kluczem i zmianą miast.
Mutacja (sprawdzona): usunięcie `trim()` w `normalized_key` (`diplomacy.rs:32`) -> FAIL w
`state_branches_match_pin_vectors` (dostęp do surowca, stan 9). Plik przywrócony.
NIE_ZMIERZONO: nie zmierzono osobno mutacji obejmującej wyłącznie ścieżkę miast (tylko pierwsza
porażka asercji została zgłoszona).

### Z3. Pula Pracy nie jest wykonywana z pina; harness odtwarza ją — PRZYJMUJĘ (poprawka wykonana)
Pin (`main.ts:34876-34880`, odczyt `07d2fbd72`) sprawdzony: `ownerPracaPool` = `pracaPoolByHuman.get(ownerId)!.praca`
dla gracza, `aiPracaPoolByOwner.get(ownerId) ?? 0` dla AI; `setOwnerPracaPool` = `max(0, value)`, dla gracza `get!`.
Rozbieżność znaleziona przy tej odpowiedzi: harness dawał 0 dla gracza 0 bez wpisu, pin rzuca wyjątek.
Poprawka: (a) generator zawsze daje właścicielowi 0 wpis puli (także w domyślnym `pool` przypadków nazwanych);
(b) harness rzuca `brak wpisu puli Pracy gracza 0 (pin: get!)` w `ownerPracaPool` i `setOwnerPracaPool`,
zamiast cicho dawać 0. Wektory po zmianie: 0 przypadków stanu bez wpisu dla właściciela 0.
Pozostaje: pula jest odtworzona w harnessie, nie transpilowana z pina (NIE_ZMIERZONO, jak w r3).

### Z4. Harness wstrzykuje capitalCityIdForOwner — PRZYJMUJĘ jako ograniczenie (NIE_ZMIERZONO)
Test dowodzi wrappera (użycie stolicy jako biorcy w `transfer_surowiec_ilosc`), nie reguły wyboru stolicy
(`capitalCityIdForOwner` z fallbackiem `oldestCityOfOwner`, `main.ts:34999`). Reguły nie testowano.
Zmiany kodu nie robiono. Przypadki z `capital` pokrywają tylko przypadek „stolica obecna w mapie”.

### Z5. Tech dla AI: efekty uboczne pina nie są raportowane — PRZYJMUJĘ (poprawka wykonana)
Pin `grantTechToOwnerWithSideEffects` (`main.ts:12483-12516`, odczyt `07d2fbd72`): gałąź `else` dla
`toOwnerId != 0` wykonuje `aiResearchDone.set`, `syncOwnerEraFromResearch` i `refreshCityRenderIfEraChanged`.
Poprawka w `diplomacy_basket.rs`: po przyznaniu techu dla właściciela != 0 dopisywany jest wpis
`tech_ai: aiResearchDone, syncOwnerEraFromResearch, refreshCityRenderIfEraChanged` do `unported_side_effects`
(dla właściciela 0 bez zmian: `tech_owner0: ...`). Dokumentacja pola i funkcji zaktualizowana.
Nowy test `tech_for_ai_owner_reports_ai_side_effects_only_when_granted` (asercja, że `t1` daje się przyznać AI).
`tech_wrapper_passes_context_like_helper` dostosowany do nowego kontraktu (efekt tylko przy przyznaniu).
Zmiana nie zmienia zachowania stanu, tylko raportowanie.

### Z6. Trailer Co-Authored-By w commicie ae8a76c10 wbrew dispatchowi — PRZYJMUJĘ jako fakt, decyzja orkiestratora
Dispatch r1 mówi „commit BEZ linii Co-Authored-By z nazwą modelu (CLAUDE.md)”. CLAUDE.md tej reguły nie zawiera.
Atrybucja z systemu wymaga trailera. Konflikt zostaje do decyzji orkiestratora. Historii `ae8a76c10` nie przepisywano.
Commit Obrony r3 ma ten sam trailer co Operator r3, żeby nie rozjeżdżać serii. Do zmiany jednym poleceniem,
jeśli orkiestrator wybierze wariant bez trailera.

### Z7. 01-operator-r3.md nie zapisany na dysk — PRZYJMUJĘ (naprawione)
Plik `01-operator-r3.md` zapisany w tej samej rundzie, z treści raportu Operatora r3 (bez dopisków od Obrony
poza adnotacją o zapisie po fakcie). Dispatch wymaga go w `dyspozycje/autobot/runs/<ID>/**` (allowlista).

### Z8. Pełny `cargo test --no-fail-fast` nie odtworzony (Operator r3: 3309/0/1 niezweryfikowane) — PRZYJMUJĘ
Wynik pełnego runu na `056d8e493`: exit 0, 3310 passed, 0 failed, 1 ignored (sekcja TESTY). Porównania liczby
testów z bazą `5a6adf3fb` (dispatch podaje 3284 dla `0ca58770e`) NIE_ZMIERZONO: nie uruchamiano pełnego runu na bazie.
Przy budowaniu wystąpiły dwa przebiegi zepsute przez środowisko, nie przez kod: pliki binariów testów znikały
z katalogu `target` w scratchpadzie (błąd `No such file or directory`, 210 i 333 „error: test failed”).
Przebieg na prywatnym katalogu `target` poza scratchpadem (`/root/civ-r3-obrona-target`) przeszedł bez błędów.
W jednym przebiegu pośrednim `p6_stan_ulepszenia::new_fields_roundtrip_and_default_is_omitted` padł
(`gracz_kiedys_mial_miasto`, plik `victory.rs` nietknięty); po przebudowaniu przechodzi, a w przebiegu końcowym
przeszedł. Przyczyny nie ustalono (NIE_ZMIERZONO); do obserwacji w kolejnym przebiegu.

## Ryzyko znalezione przy obronie (poza zarzutami, NIE_ZMIERZONO)
Rust sortuje dawców i biorców po `id` porównaniem bajtowym (`diplomacy.rs:2559`, `cmp`), pin używa
`localeCompare` (ICU). Dla identyfikatorów `c1_0` i `c10_0` kolejność się różni (zmierzone w node:
`localeCompare` daje `c1_0 < c10_0`, bajtowo `c10_0 < c1_0`). Rozbieżność wychodzi tylko przy remisie zapasu
i takich identyfikatorach. Żaden wektor jej nie pokrywa; nowe przypadki używają identyfikatorów o tej samej
strukturze znaków. Poza allowlistą r3 (`diplomacy.rs`), nie naprawiano. Do osobnego tematu.

## TESTY (Obrona r3, kody wyjścia; `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, target poza repo)
- `cargo fmt -- --check`: 0
- `cargo clippy --all-targets -- -D warnings`: 0
- `cargo test --lib`: 0 (110 passed, 0 failed)
- `cargo test --test p6_zloza_basket`: 0 (14 passed, 0 failed) — po poprawkach
- `cargo test --no-fail-fast` (pełny, na `056d8e493`): exit 0; 3310 passed, 0 failed, 1 ignored (Operator r3: 3309; +1 to test `tech_for_ai_owner_reports_ai_side_effects_only_when_granted`).
- Mutacje: trim w `normalized_key` -> FAIL; tie-break dawców odwrócony -> FAIL; plik przywrócony.
- Regeneracja: `node p6_zloza_basket_gen.mjs <pin>/gra/src/main.ts ...` — pliki pina z `git show 07d2fbd72` (SHA-256 strażników zgodne).

## Allowlista r3 (sprawdzona)
Zmienione pliki: `rust-port/engine/src/domain/diplomacy_basket.rs`, `rust-port/engine/tests/p6_zloza_basket.rs`,
`rust-port/engine/tests/p6_zloza_basket_gen.mjs`, `rust-port/engine/tests/p6_zloza_basket_vectors/vectors.json`,
`dyspozycje/autobot/runs/R-RUSTPORT-P6-ZLOZA-B-REST-Q1/*`. `diplomacy.rs` tylko tymczasowo (mutacje), przywrócony.
`Cargo.lock` wygenerowany przez cargo, nie commitowany.

## RUNDY
3/5 (Obrona r3 po EVAL r3). NASTĘPNY KROK: Evaluator r4 (weryfikacja nowych przypadków i asercji względem pina).
