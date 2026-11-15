# R-RUSTPORT-P4-1A-VIEW-TYPES-Q1 — Evaluator r1

```text
STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1A-VIEW-TYPES-Q1
GOAL: typy DTO z P4-1 §3 w crate rust-port/view-model (serde camelCase, JSON-safe), testy JSON (round-trip, nazwy kluczy, niezmiennik ID), pomiar rozmiaru snapshotu 3000/8000 heksów
ZMIANY/COMMIT: ocena commitów 86032cd28 (impl) + 011de8664 (pomiary), rodzic 525a2ef7b; ten raport = jedyna zmiana Evaluatora
TESTY: fmt EXIT 0, clippy -D warnings EXIT 0, cargo test --all-targets EXIT 0 (63 testy, 0 ignored); git diff --check pusty; 16 + 35 mutantów własnych Evaluatora (wynik niżej)
BLOKADY: brak technicznych; zarzuty Z1 i Z2 do poprawy przez Operatora; Z3 do decyzji orkiestratora
RUNDY: 1/5
NASTĘPNY KROK: Operator/Obrona (to samo ID): Z1, Z2 (+ opcjonalnie Z5–Z7), potem Evaluator r2
DEPLOY/PUSH: NIE WYKONANO
```

## 1. Baza, zakres i allowlista

- Dispatch przeczytany z `origin/claude/rust-sivvrn:dyspozycje/autobot/runs/R-RUSTPORT-P4-1A-VIEW-TYPES-Q1/00-dispatch.md`. **DODATKU r2 w pliku nie ma** (potwierdzam uwagę (1) Operatora).
- `git merge-base --is-ancestor 525a2ef7b 011de8664` → 0. `7817ef0cb` też jest przodkiem 011de8664. Czubek `origin/rust-port/parity-v2` to dziś `fffc5e7c6`, czyli przesunął się od dispatchu. Integracja to zadanie orkiestratora.
- `git diff --name-only 525a2ef7b..011de8664`: 27 plików, wszystkie w `rust-port/view-model/**` albo `dyspozycje/autobot/runs/R-RUSTPORT-P4-1A-VIEW-TYPES-Q1/**`. Poza allowlistą: **0**. `rust-port/Cargo.toml` nie istnieje (brak workspace), więc nie ma czego dopisywać. `Cargo.lock` nie jest commitowany. `gra/**`, `rust-port/engine/**`, `rust-port/renderer/**` i `src-tauri/**` są bez zmian.
- Commity nie podają nazwy modelu. Ostatnia linia to `Claude-Session: …`, zgodnie z dispatchem.

## 2. Bramki odtworzone przez Evaluatora

Uruchomione na drzewie `011de8664`, w katalogu `rust-port/view-model`, z czystym `CARGO_TARGET_DIR` w scratchpadzie (usunięty po bramkach), z `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0` i `--offline`. Toolchain: cargo 1.97.0.

| Bramka | Wynik |
|---|---|
| `cargo fmt --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --all-targets` | EXIT 0. Testy: id_invariant 10, json_keys 11, json_roundtrip 13, json_strict 3, pin_vectors 15, validate 11, razem 63. 0 failed, 0 ignored |
| `git diff --check 525a2ef7b 011de8664` | brak wyjścia |
| `#[ignore]`, `should_panic`, `let _ =`, `assert!(true)` w `tests/` i `src/` | 0 trafień |
| `#![forbid(unsafe_code)]` | jest, `src/lib.rs:20` |
| `cargo run --release --example snapshot_size` | bajty **identyczne** z raportem: 754 285 / 910 987 / 2 011 660 / 2 427 740 B; mapa statyczna 222 170 / 593 927 B; hexState+fog 177,2 B/heks |

## 3. Sprawdzone kryteria końca

1. **Typy §3, camelCase, round-trip każdego typu: SPEŁNIONE.** Wszystkie 50 eksportowanych typów przechodzą przez `rt()` w `tests/json_roundtrip.rs`, część pośrednio przez próbki `sample_*`. Test sprawdza tekst i `Value`, a także stabilność ponownej serializacji.
2. **Nazwy kluczy: SPEŁNIONE.** Każdy obiekt z `tests/json_keys.rs` porównałem z tabelami kontraktu P4-1 §3.1–§3.8: korzeń (15 kluczy, w tym udokumentowane `stacks`), Map/HexStatic/HexDyn, Fog, Owner (12 kluczy), City (11), Badge (17 = 19 z webu minus `hoverExpanded` i `lodLevel`), Unit, StackVitals (11), Stack, Siege, Territory, wszystkie pola Overlays oraz Battle. Dryfu nie ma.
3. **Niezmiennik ID: SPEŁNIONE.** Granica `2^53−1` jest sprawdzana przy konstrukcji i przy deserializacji. `OwnerRef` mapuje -99/-1/≥0, a kolejność wariantów odpowiada liczbom. Mutanty I1–I10 Operatora i mój E16 są zabite.
4. **Pomiar: WYKONANY, ale liczb NIE MA w dokumencie P4-1 §4.1.** Szczegóły w Z3.
5. **Brak `#[ignore]` i osłabionych asercji, `forbid(unsafe_code)`: SPEŁNIONE** (sekcja 2).
6. **Twierdzenia o webie z plik:linia na pinie `07d2fbd72`: SPEŁNIONE w zakresie sprawdzonym.** Wyciągnąłem `gra/src` z pinu przez `git archive` i ręcznie sprawdziłem około 30 cytatów, wszystkie zgodne co do linii. Sprawdzone pliki i linie:
   - `types/hex.ts:12-24`, `:30-39`, `:45-54`, `:60-64`;
   - `types/map.ts:49`;
   - `render/cityMapOutline.ts:10`;
   - `game/civ-visual.ts:84-89`;
   - `render/cities.ts:306`, `:740`, `:905-929`;
   - `render/cityMapStatChip.ts:12`, `:15`, `:17-78` (19 pól);
   - `game/production.ts:95`;
   - `game/siegeMachines.ts:6`;
   - `render/tradeRoutesOverlay.ts:23`;
   - `battle/battleScene.ts:522`, `:1074`, `:1434-1448`, `:2440`;
   - `game/city-fortification.ts:26`;
   - `battle/siegeWall.ts:1105`;
   - `main.ts:2961-2965`, `:4065-4068`, `:4080-4082`, `:10373-10384`;
   - `units/setup.ts:42-74` (każde pole `UnitViewDto`);
   - `game/armyMerge.ts:21-43`, `:1103-1126`;
   - `game/okolica.ts:206`;
   - `game/unit-building-bonuses.ts:292`;
   - `game/veteran.ts:59`;
   - `render/wonderRenderer.ts:12-19`;
   - `render/cityOkolicaOverlay.ts:47-60`;
   - `render/mapRenderStyle.ts:50`, `:52`.

   Lustro typów bitwy porównałem z `renderer/src/battle/units.rs:505-541`, `:726-733`, `:842-852` i `field.rs:353-360`, `:1978-1989` na `525a2ef7b`. Pola są zgodne 1:1. Jedyna różnica to `ammo*`: `Option` zamiast `Infinity`, i jest udokumentowana.

## 4. Mutacje własne Evaluatora (kopia crate'u w scratchpadzie, `cargo test --all-targets`)

Fala E (16 mutantów, inne niż w `01b-pomiary/mutate.py`): zabite 14 z 16.
- **E1 przeżywa.** Usunięcie `finite_opt(ammoMax)` w `validate.rs` nie łamie żadnego testu.
- E4 (długość `fog` porównana z `hexState` zamiast z `map.hexes`) przeżywa, ale jest **równoważny**: `hexState` sprawdzane jest wcześniej względem `map.hexes`.

Zabite: E2 (TowerMaterial), E3 (`#[serde(default)]` na `readyMachines`), E5 (ringHex z wielkimi literami), E6, E7 (TileYield bez `deny_unknown_fields`), E8 (BuildHighlightKind lowercase), E9, E10, E11 (`split` gubi `battle`), E12, E13 (`skip_serializing_if` na `deploy`), E14, E15, E16.

Fala V: systematyczne usunięcie **każdego** jednowierszowego i wielowierszowego wywołania `finite` / `finite_opt` / `badge` / `color` w `src/validate.rs`. Wynik: **35 mutantów, zabite 14, przeżywa 21**. Przeżywające wiersze (`src/validate.rs`):

| Linia | Usunięty check |
|---|---|
| 224 | `cities[i].level` finite |
| 226 | `cities[i].badge.population` finite |
| 238 | `cities[i].badge.era` finite |
| 245, 246 | `units[i].ruchMax`, `ruchLeft` finite |
| 254 | `units[i].softBadgeLevel` 0..=3 |
| 258–261 | `stacks.vitalsByRepId[i][1].ruchLeft/ruchMax/hp/hpMax` finite |
| 263, 264, 271 | `stacks…armorBadgeLevel/softBadgeLevel/veteranStars` 0..=3 |
| 281, 283 | `okolica.yields[i][1].zywnosc`, `handel` finite |
| 313–316 | `battle.setup.units[i].hp/maxHp/morale/moraleMax` finite |
| 318 | `battle.setup.units[i].ammoMax` finite |

Skrypty: `scratchpad/evmut.py` i `scratchpad/evmut2.py` (sesja Evaluatora, usunięte razem ze scratchpadem). Mutanty są opisane w tabeli powyżej i da się je odtworzyć ręcznie.

## 5. Zarzuty (ponumerowane)

**Z1 — luka w testach walidatora; poprawka obowiązkowa.**
`RenderViewDto::validate` / `RenderLayersDto::validate` to egzekutor niezależny od typów, realizujący kontrakt §4 pkt 3–4: `JSON.stringify(NaN)` daje `null`, który psuje deserializację po stronie webview. Tymczasem **21 z 35** jego kontroli per pole można usunąć bez czerwonego testu (sekcja 4, fala V). Test `floats_everywhere` (`tests/validate.rs:211-257`) sprawdza 9 z 23 pól `f64`. Poziomy odznak w `stacks` i `softBadgeLevel` w `units` nie są testowane wcale.

Raport Operatora („zabite 71 z 72”) jest prawdziwy dla jego zbioru mutantów. Ten zbiór nie obejmował jednak kontroli per pole, więc wynik nie mówi nic o pokryciu `validate.rs`.

Wymagane:
- test tabelaryczny, w którym **każde** pole `f64` / `Option<f64>` (23) dostaje `NaN` lub `±Inf` z oczekiwaną ścieżką JSON;
- dla każdego pola `u8` z zakresem (`veteranStars`, `armorBadgeLevel`, `softBadgeLevel` w `units` i `stacks`, `veteranLevel`, `defenseTier`, `roadMask`, `rzekaKrawedzie`) test wartości granica+1;
- dowód w raporcie: ponowne uruchomienie fali V, przeżywa 0.

**Z2 — wektory pinu przepisane ręcznie: brak generatora i SHA-256; poprawka obowiązkowa.**
`tests/pin_vectors.rs` przepisuje literały webu do dwóch ręcznych list: funkcji `web()` w `match` i tablicy `web: &[&str]`. Ma tylko cytat `plik:linia` i nie wiąże wartości z treścią pinu. Literały są dziś poprawne: sprawdziłem wszystkie 12 cytowanych unii na `07d2fbd72` (sekcja 3, pkt 6). Mimo to wymóg „wektory z pinu z generatora + SHA-256, nie ręcznie” nie jest spełniony, a przesunięcie pinu (np. przy PIN-MOVE-PLAN) nie zostanie wykryte.

Wymagane:
- mały generator w `dyspozycje/autobot/runs/R-RUSTPORT-P4-1A-VIEW-TYPES-Q1/` (np. Python uruchamiany z `-I`), który z `git show 07d2fbd72:gra/src/<plik>` wyciąga unie i enumy literałów: TerenBazowy, Nakladka, Ulepszenie, Widocznosc, riverPathKinds, CityMapOutlineKind, RelationBorderStatus, CityWallKind/CityMapWallKind, ProductionKind, SiegeMachineKind, medium, `'atk'|'def'`, CityFortificationKind, `'drewno'|'kamien'`;
- zapis SHA-256 każdego źródłowego pliku pinu i wygenerowanej fikstury (np. `tests/fixtures/pin_literals.json` w allowliście `rust-port/view-model/**`);
- `pin_vectors.rs` ma czytać fiksturę, a nie ręczne tablice, i sprawdzać jej SHA-256 zapisane w teście albo w README fikstury;
- tak samo dla 19 kluczy `CityMapBadgeInput` i 11 kluczy `StackVitals` w `web_interface_keys`.

**Z3 — kryterium 4 („liczby w P4-1 §4.1”) jest niewykonalne w allowliście; decyzja orkiestratora.**
Pomiar jest kompletny i odtworzony bajt w bajt, a gotowy tekst leży w `01b-operator-pomiary.md` §3.4. Dokument `dyspozycje/rust-port/p4/P4-1-RENDER-DTO-CONTRACT.md` jest jednak na `claude/rust-sivvrn`, poza allowlistą tematu. To nie jest wina Operatora: dispatch ma sprzeczność między kryterium 4 a allowlistą.

Orkiestrator musi wybrać jedno z dwóch:
- rozszerzyć allowlistę o ten plik w DODATKU r2;
- wpisać §3.4 do P4-1 sam przy integracji. Zasady orkiestratora dopuszczają to, bo to dokument, nie kod gry.

Do tego czasu kryterium 4 ma status NIESPEŁNIONE FORMALNIE. Kluczowy wynik merytoryczny, który trzeba przenieść: szacunek §4.1 (50–100 B/heks, 0,4–0,8 MB) jest zaniżony 3–4 razy. Pomiar daje 251–304 B/heks i 2,0–2,4 MB przy 8000 heksów, a to dotyczy rewizji D-DTO-3.

**Z4 — walidator nie sprawdza niezmienników kolejności i kształtu mapy; zalecane, nieblokujące.**
Kontrakt §3.2 i §1.4 wymaga dla `map.hexes` kolejności `r`-major, `q`-minor. Od tej kolejności zależą równoległe tablice `hexState` i `fog.state` oraz `y*width+x` po stronie silnika. `validate_map` nie sprawdza:
- czy kolejność jest `r`-major, `q`-minor;
- czy `hexes.len() == width*height` (dla równoległoboku webu);
- czy koordynaty są unikalne.

Producent z innym porządkiem heksów przejdzie walidację, a mgła i warstwy trafią na złe heksy. Podobnie nie są sprawdzane `battle.setup.units[].facing ∈ 0..=3` (`UnitSpawn.facing`, „`Dir` 0..3”, `renderer/src/battle/units.rs:524`) ani zakres kafli `grid.tiles`. Jeśli kontrolę kolejności trzeba odłożyć, to do P4-1B (test w czasie działania), z wpisem.

**Z5 — `OwnerViewDto.civIconId: String` nie ma `null` dla barbarzyńców; uwaga do adaptera, nieblokujące.**
Web podaje `civId: isBarbarian ? null : civTypeForOwner(...)` (`main.ts:10377` @ `07d2fbd72`), a renderer ma `OwnerEmblemContext.civ_id: Option<String>` (`renderer/src/units/overlay/emblem.rs:29`). Typ jest wierny kontraktowi §3.4, który podaje `String`, więc to nie jest błąd implementacji. Doc-komentarz pola powinien jednak mówić, że adapter P4-1G ustawia `civ_id = None`, gdy `isBarbarian`, a producent wpisuje dla barbarzyńców ustaloną wartość (jaką? NIE_ZMIERZONO). Tę lukę kontraktu warto dopisać do listy uwag P4-1.

**Z6 — brakujący klucz `Option` na wejściu daje `None`; uwaga (punkt (3) Operatora potwierdzony), nieblokujące.**
Wszystkie 29 pól `Option` przyjmują pominięty klucz, mimo `deny_unknown_fields`. Wejście jest więc mniej ścisłe niż wyjście. Dla webview nie ma to znaczenia, bo producentem jest Rust. Jeśli kiedyś JS będzie odsyłał snapshot, warto rozważyć `#[serde(deserialize_with)]`, które wymaga obecności klucza. Decyzja techniczna należy do orkiestratora i trafia do REJESTR-RUST.

**Z7 — nieścisły komentarz `tests/common/mod.rs:1-3`; kosmetyka.**
Komentarz mówi „empty-ish one (every `Option` as `None`)”, a Operator sam zgłosił, że 8 pól nigdy nie jest `None` w tej próbce (punkt (5) raportu). Do poprawy przy okazji Z1/Z2.

## 6. Werdykt

**FAIL.** Nie wynika z jakości typów: te są poprawne, kompletne względem §3 i wierne pinowi. Wynika z dwóch konkretnych, tanich do usunięcia braków w dowodach:
- **Z1**: 21 mutantów walidatora przeżywa;
- **Z2**: wektory pinu przepisane ręcznie zamiast generatora + SHA-256.

Z3 wymaga decyzji orkiestratora i nie jest winą Operatora. Z4–Z7 to uwagi.

Powrót do Operatora/Obrony z tym samym ID. Allowlista bez zmian wystarcza na Z1, Z2 i Z7. Z3 rozstrzyga orkiestrator.
