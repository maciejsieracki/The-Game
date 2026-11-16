# NAN-INF-AMUNICJA-ROZPOZNANIE — NaN / Inf / ułamki w amunicji i `maxRounds`

Temat: `R-RUSTPORT-P6-NAN-INF-AMUNICJA-ROZP-Q1` (dispatch: `00-dispatch.md`, runda 1; powiązane: `COMBAT-HARNESS`, #137, #68 `p6_ranged_damage_nan`).
Rodzaj: **rozpoznanie, tylko odczyt, bez kodu.** Bez commitów kodu, bez push do `parity-v2`.

Źródła:
- Pin: `07d2fbd72`, `gra/src/game/combat.ts` (`resolveCombat`, `resolveAmmo`), `gra/data/combat-params.json`, `gra/data/units.json`.
- Rust: `origin/rust-port/parity-v2` = `3a8f068f6`, `rust-port/engine/src/domain/combat.rs`, `rust-port/engine/tests/p6_combat_harness*`, `p6_ranged_damage_nan.rs`.

**NIE_ZMIERZONO:** pin nie został uruchomiony (ani `node`, ani harness), Rust nie został skompilowany ani uruchomiony (`cargo test` nie był wykonany). Wszystkie poniższe wyniki to czytanie kodu z numerami linii. Zachowania oznaczone „statycznie” wymagają potwierdzenia uruchomieniem.

---

## 0. Wnioski w skrócie

1. **W produkcji pinu NaN / Inf / ułamek nie wchodzą do amunicji ani do `maxRounds`.** Amunicja z danych to liczba całkowita 2–20 dla 18 jednostek dystansowych, a dla pozostałych 57 jednostek `—`, co daje 0 (patrz §1a). Override `attackerAmmo` / `defenderAmmo` nie jest podawany przez żadnego wołającego w `gra/src`. `maxRounds` to `30` (`battleScene.ts:20535`, `manualBattle.ts:1063`) albo domyślne `200` (`tw_v3`). Przypadki NaN / Inf / ułamek są więc **hipotetyczne** (testy lub przyszłe wołania).
2. **Rozjazd leży w zakresie typów, nie w logice pętli.** Rust trzyma amunicję jako `i64` (`combat.rs:1074`) i limit jako `u32` (`combat.rs:1130`). Dla wartości całkowitych logika pętli jest 1:1 z pinem, a porównanie już istnieje w `p6_combat_harness` (700 przypadków).
3. **Dwa rozjazdy przy konwersji JS → Rust** (przy założeniu rzutowania `as`, czyli nasycenie):
   - (a) **amunicja ułamkowa**: pin strzela `ceil(x)` razy (np. 2,5 → 3 strzały), Rust `as i64` daje 2 (obcięcie), a dla 0,5 daje 0 zamiast 1 strzału.
   - (b) **`maxRounds = NaN`**: pin nie nakłada żadnego limitu (`T > NaN` jest zawsze fałszem), Rust `as u32` daje 0, czyli limit już w rundzie 1.
   - Pozostałe przypadki (NaN amunicja, ±Inf, wartości ujemne, ułamkowe `maxRounds`) są przy `as` zgodne albo zgodne praktycznie.
4. **Rust `resolve` / `resolve_combat` (`combat.rs:321`, `:381`) nie mają w ogóle parametrów amunicji ani `maxRounds`** i nie zawierają fazy dystansowej. To inny model (zbiorcza siła stron), a sam kod Rust to komentuje (`siege_tactics_instant.rs:21-24`). Nie da się więc porównać ich wyniku z pinem dla tych wejść.
5. **Ryzyko zawieszenia (statycznie, NIE_ZMIERZONO):** przy `maxRounds = NaN` albo `+Inf` nie działa limit także w pętli zwarcia. Jeśli trafienie jest niemożliwe (`hitPct = NaN`, bo `roll < NaN` jest fałszem), HP nie spada i pętla nie kończy się. Przy produkcyjnym `maxRounds` (30 / 200) ta ścieżka jest nieosiągalna.
6. **Brak wołającego produkcyjnego** dla `ranged_phase::resolve_ranged_phase` i `melee_phase::resolve_melee_phase`. Wołają je tylko testy. Rozjazd nie jest więc dziś obserwowalny w grze. Trzeba go rozstrzygnąć przy podpinaniu (§4).

---

## 1. Pytanie 1 — pin (`gra/src/game/combat.ts`)

### 1a. `resolveAmmo` (`combat.ts:784-789`) i dane wejściowe

Dane wejściowe przechodzą przez `combatStatField` (`combat.ts:178-183`), który zamienia `'---'`, `'—'`, `null`, `undefined` i `''` na `undefined`, a następnie `?? null` (`combat.ts:225`). `resolveAmmo` widzi więc `null` dla każdej wartości `—`.

| Wejście (`ammo`, override lub dane) | Wynik `resolveAmmo` | Strzały w fazie dystansowej | Miejsce |
|---|---|---|---|
| override `undefined`, dane `—` / `---` / `null` / `''` | `0` | 0 (`0 > 0` jest fałszem) | `combat.ts:787` |
| surowy `'—'` (wiersz danych podany wprost, bez `combatStatField`) | `NaN` (`parseInt('—')`) | 0, bez dekrementu | `combat.ts:788` |
| liczba całkowita `n` (dane produkcyjne: 2…20) | `n` | `n`, limitowane rundami | `combat.ts:788` (passthrough) |
| override `NaN` | `NaN` (override zwracany bez walidacji) | 0, `NaN - 1` nie zmienia wyniku | `combat.ts:785`, warunek `ammo > 0` w `:1021`, `:1033` |
| override `+Inf` | `+Inf` | bez limitu amunicji; strzały do końca limitu rund, HP albo rout | `combat.ts:785`, `Inf - 1 = Inf` |
| override `-Inf`, ujemna, `-0` | tak samo | 0 | `combat.ts:785` |
| override `0.5` | `0.5` | **1** (`0.5 > 0` → strzał → `-0.5`) | `combat.ts:1033-1034` |
| override `2.5` | `2.5` | **3** (2,5 → 1,5 → 0,5 → strzał, potem -0,5) | `combat.ts:1033-1034` |
| surowy napis `'abc'` | `NaN` | 0 | `combat.ts:788` |

Obserwacja w pinie: `resolveAmmo` sprawdza `'---'`, a dane mają `'—'` (U+2014). Gałąź `'---'` jest dla danych produkcyjnych martwa, bo normalizuje ją `combatStatField`. Nie powoduje to błędu, ale kod nie jest taki, jak sugeruje jego komentarz.

Dane produkcyjne (`gra/data/units.json` przy pinie, 75 rekordów):
- 18 jednostek z `Atak dystansowy > 0` ma liczbową amunicję 2…20: Procarz 15, Oszczepnik 6, Łucznik 12, Hastati 2, Rydwan egipski 14, Konnica łucznicza asyryjska 20 i inne.
- 57 jednostek ma `—` (efektywnie `0`).
- **Uwaga:** `missileAttack > 0` (pole używane w `isRangedUnit`, `combat.ts:791-792`) obejmuje **22** jednostki, nie 18. Cztery dodatkowe to Drużynnik (`missileAttack` 7), Thorakites (6), Evocati (6) i Gwardzista z champi (5). Mają `Atak dystansowy = 0` i amunicję `—`, czyli `0`. Są więc „dystansowe” w fladze, ale bez amunicji: nagłówek `=== Faza dystansowa ===` trafia do logu, a strzałów nie ma. Rust musi to odwzorować tak samo (flaga `is_ranged = true`, `ammo = 0`).

### 1b. `maxRounds` (`combat.ts:891`, `:1020-1029`, `:1099-1105`, `:1217-1240`)

- `const maxRounds = opts.maxRounds ?? TW.max_rounds;` (`combat.ts:891`). `TW = combatParamsRaw.tw_v3` (`combat.ts:19`), a `tw_v3.max_rounds = 200` (`gra/data/combat-params.json:15`). Operator `??` nie łapie `NaN`, więc `NaN` trafia do pętli.
- Faza dystansowa: `totalRounds++` (`:1026`), potem `if (totalRounds > maxRounds) break` (`:1027-1029`). Limit działa **przed** strzałem w rundzie `T`.
- Zwarcie: `meleeRound++; totalRounds++` (`:1100-1101`), potem `if (totalRounds > maxRounds)` z komunikatem `Limit rund osiagniety -> remis.` (`:1103-1105`). Liczniki są wspólne dla obu faz.
- Wynik przy limicie: `winner = 'draw'` (`:1224` albo `:1230`, komentarz `// max rounds`). Komunikat `REMIS`.
- Rundy w logu (`:1240`) to `totalRounds`, który przy trafieniu w limit wynosi **maxRounds + 1** (licznik zwiększono przed sprawdzeniem). Dotyczy to obu faz.

| `maxRounds` | Efekt w pinie | Liczba pełnych rund | Uwagi |
|---|---|---|---|
| `undefined` / `null` | `200` (`TW.max_rounds`) | 200 | produkcja: domyślne |
| `30` | limit 30 | 30 | produkcja: `battleScene.ts:20535`, `manualBattle.ts:1063` |
| `NaN` | `T > NaN` zawsze fałsz, **brak limitu** w obu fazach | nieograniczone, kończy się amunicją / HP / routem | statycznie: możliwe zawieszenie, §1c |
| `+Inf` | brak limitu | j.w. | jak wyżej |
| `-Inf`, `-1`, `-0`, `0` | `T = 1 > m`: 0 rund strzeleckich i 0 rund zwarcia | 0 | wynik `REMIS`, licznik `m+1` |
| `0.5` | `T = 1 > 0.5`: jak dla 0 | 0 | |
| `2.5` | rundy 1 i 2 dozwolone, `T = 3 > 2.5` odrzuca | `floor(m)` = 2 | ogólnie dla `m >= 0` skończonego: `floor(m)` |

### 1c. Ryzyko zawieszenia (statycznie, NIE_ZMIERZONO)

Pętla zwarcia (`combat.ts:1099`) kończy się, gdy `hpAtk <= 0`, `hpDef <= 0`, `routed` jest niepuste albo przekroczono limit. Przy `maxRounds` równym `NaN` lub `+Inf` zostają tylko dwa warunki: zmiana HP albo rout. Jeśli `hitPct` jest `NaN` (`roll < NaN` zawsze fałszem, komentarz w pinie i w Rust), żaden cios nie trafia, HP się nie zmienia i pętla nie kończy się. Przy losowaniu z `Math.random` i skończonych `hitPct` (minimum `hit_min` 15, `tw_v3`) postęp jest prawdopodobny. Scenariusz zawieszenia wymaga więc jednocześnie `maxRounds` nieskończonego i `hitPct = NaN`. W produkcji `maxRounds` nigdy nie jest `NaN`, więc to tylko ostrzeżenie dla testów (wektory z `rng` stałym mogą wpaść w pętlę; generator musi mieć twardy limit kroków).

---

## 2. Pytanie 2 — Rust

### 2a. Faza dystansowa: `ranged_phase::resolve_ranged_phase` (`rust-port/engine/src/domain/combat.rs`)

- Moduł `pub mod ranged_phase` od `:1061`. `RangedSide` od `:1066`, pole `pub ammo: i64` w `:1074`.
- `RangedPhaseInput`: `max_rounds: u32` (`:1130`), `start_rounds: u32` (`:1132`).
- Pętla: `while` z warunkami `ammo > 0`, `hp > 0`, `routed.is_empty()` (`:1153-1155`), licznik `total_rounds += 1` i limit `if total_rounds > max_rounds { break; }` (`:1159-1162`), dekrement amunicji (`:1164-1165`, obrońca `:1197-1198` z `hp > 0`), trafienie `roll < hit_pct` (NaN daje pudło), warunek wyjścia (`:1252-1254`). Logika jest zgodna z pinem linia po linii.
- `rounds: total_rounds` (zwracane) ma tę samą semantykę co pinowe `totalRounds` (wartość `m+1` po trafieniu w limit).

### 2b. Zwarcie: `melee_phase::resolve_melee_phase` (`combat.rs:1278`, `:1386`)

- Limit `if total_rounds > max_rounds` z flagą `limit_reached` (`:1423-1425`), `max_rounds: u32`. Ta sama semantyka co pin.

### 2c. `resolve_combat` / `resolve` (`combat.rs:321`, `:381`)

- `CombatInput` (`:103-112`): `attacker`, `defender`, `terrain`, `structures`, `is_siege`, `seed`. **Brak** amunicji i `maxRounds`.
- Model: `effective_strength` i `loss_fractions` (zbiorcza siła, HP `u32`, deterministyczny, bez logu). To nie jest port `resolveCombat` (`siege_tactics_instant.rs:21-24` mówi to wprost). Dla NaN / Inf / ułamków tego wejścia nie ma, więc ta funkcja nie ma „wyniku Rust” do porównania.

### 2d. Konwersja JS number → typ Rust (tabela)

Założenie: konwersja `as` (saturating). Ta konwersja **nie istnieje w kodzie**, bo nie ma produkcyjnego wołającego. Tabela pokazuje, co dałoby pierwsze podpięcie bez specjalnej reguły.

| Wejście (pin) | Typ Rust | Wynik `as` | Strzały / rundy Rust | Pin | Zgodność |
|---|---|---|---|---|---|
| ammo `NaN` | `i64` | `0` | 0 strzałów | 0 strzałów | zgodne |
| ammo `+Inf` | `i64` | `i64::MAX` | ~bez limitu, ograniczone rundami / HP | bez limitu | zgodne praktycznie |
| ammo `-Inf`, ujemna, `-0` | `i64` | ≤ 0 | 0 | 0 | zgodne |
| ammo `0.5` | `i64` | `0` | **0** | **1** | **ROZJAZD** |
| ammo `2.5` | `i64` | `2` | **2** | **3** | **ROZJAZD** |
| maxRounds `NaN` | `u32` | `0` | **0 rund** (limit już w rundzie 1) | **bez limitu** | **ROZJAZD (duży)** |
| maxRounds `+Inf` | `u32` | `u32::MAX` | praktycznie bez limitu | bez limitu | zgodne praktycznie |
| maxRounds `-Inf`, ujemna, `-0`, `0.5` | `u32` | `0` | 0 rund | 0 rund | zgodne |
| maxRounds `2.5` | `u32` | `2` | 2 rundy | `floor` = 2 | zgodne |

Przy konwersji trzeba więc jawnie zdefiniować regułę dla `NaN` i ułamków (§4). Samo `as` nie wystarczy.

---

## 3. Pytanie 3 — gdzie są rozbieżności

1. **Nie w logice pętli.** Dla całkowitych wejść porównanie już istnieje: `p6_combat_harness` ma 700 przypadków z pinu (`vectors.json`), a generator (`p6_combat_harness_gen.mjs:174-178`) losuje amunicję `ri(-1, 6)` i `maxRounds` `ri(0, 8)`. Warunki `while`, kolejność limitu przed strzałem, dekrement i `roll < hitPct` są zgodne.
2. **W zakresie typów.** `i64` i `u32` nie reprezentują NaN, ±Inf ani ułamków. Harness potwierdza to ograniczeniem: `build_input` czyta `ammoAtk` przez `as_i64().expect`, a `maxRounds` przez `as_u64().expect`. Generator w ogóle nie produkuje tych wartości.
3. **Kod do naprawy dziś: brak.** Brak produkcyjnego wołającego oznacza brak obserwowalnego rozjazdu w grze. Przy podpinaniu (`COMBAT-RESOLVE-PETLA`, `COMBAT-WEJSCIA` #135/#167) trzeba jednak zdefiniować regułę konwersji (§4).
4. **Gdzie NIE ma rozbieżności:** wartości ujemne i `0` (0 strzałów, 0 rund), ułamkowe `maxRounds` (`floor`), `NaN` amunicji (0 strzałów), `+Inf` amunicji (limit rund) i obrażenia / trafienia NaN (już pokryte przez `p6_ranged_damage_nan.rs`).

---

## 4. Propozycja reguły konwersji (decyzja techniczna, nie pytanie ABC)

Ta reguła nie jest jeszcze wdrożona. Zgodnie z zasadą 9 w `CLAUDE.md` to decyzja techniczna orkiestratora, zapisywana w `dyspozycje/rust-port/REJESTR-RUST.md`, nie pytanie do właściciela.

- **Amunicja** (JS number → `i64`): `NaN` lub `x <= 0` → `0`; `+Inf` → `i64::MAX`; w pozostałych przypadkach `x.ceil() as i64` (2,5 → 3; 0,5 → 1).
- **`maxRounds`** (JS number → `u32`): `NaN` → `u32::MAX` (brak limitu jak w pinie); `+Inf` → `u32::MAX`; `x <= 0` → `0`; w pozostałych przypadkach `x.floor() as u32`.

Wariant `NaN → u32::MAX` jest zgodny z pinem tylko dla faz, w których limit nie jest osiągalny przed końcem HP. Przy `NaN` i `hitPct = NaN` zostaje ryzyko zawieszenia z §1c (dla `u32::MAX` rund pętla też nie skończy się w rozsądnym czasie). Dlatego wdrożenie musi mieć twardy limit kroków w harnessie albo osobną gałąź `hitPct` z walidacją.

---

## 5. Pytanie 4 — wektory do napisania (lista, bez pisania)

Nowe wektory generuje się z wykonania pinu (generator `.mjs` z kontrolą SHA), a nie ręcznie. Istniejący generator nie produkuje NaN, Inf ani ułamków, więc potrzebna jest osobna sekcja.

| ID | Wejście | Oczekiwany wynik (wg czytania pinu) | Uwaga |
|---|---|---|---|
| V-A1 | `ammoAtk` ∈ {NaN, +Inf, -Inf, -0, 0, 0.5, 1, 2.5}, obrońca bez dystansu | strzały: 0, limit, 0, 0, 0, 0, 1, 3 | +Inf: limit rund, nie amunicja |
| V-A2 | `ammoAtk = NaN`, `ammoDef = 3` (obrońca dystansowy) | atakujący 0 strzałów, obrońca 3 | sprawdza warunek w `:1085` i `while` |
| V-A3 | `ammoAtk = +Inf`, `maxRounds = 5` | 5 strzałów, log `Limit rund osiagniety w fazie dystansowej.` | |
| V-M1 | `maxRounds` ∈ {NaN, +Inf, -Inf, -1, -0, 0, 0.5, 2.5, 30, 200}, długa walka | rundy: `floor(m)` albo bez limitu; licznik `m+1` przy limicie | NaN / +Inf: tylko z twardym limitem kroków |
| V-M2 | granica `T == maxRounds` (strzał w rundzie `m`, brak w `m+1`) | zgodne z `:1026-1029` | już częściowo w generatorze 0…8; potwierdzić jawnie |
| V-M3 | `maxRounds = NaN` w zwarciu z `hitPct = NaN` | **nie jako zwykły wektor** | ryzyko zawieszenia §1c; tylko z limitem kroków i timeoutem |
| V-K1 | funkcje konwersji z §4: NaN, ±Inf, -0, 0.5, 2.5 | ammo: 0, i64::MAX, 0, 1, 3; maxRounds: u32::MAX, u32::MAX, 0, 0, 2 | Rust, po decyzji z §4 |
| V-K2 | cztery jednostki z `missileAttack > 0` i amunicją `—` (§1a) | 0 strzałów, nagłówek logu `=== Faza dystansowa ===`, flaga dystansowa `true` | zgodność flagi, nie tylko strzałów |
| V-K3 | mutacje: `>` → `>=` w limicie, `ammo > 0` → `ammo >= 0` | muszą dać FAIL na V-A*, V-M* | test czułości (wzorzec `p6_harness_mutacje.sh`) |

---

## 6. Ograniczenia i zastrzeżenia

- **NIE_ZMIERZONO:** pin ani Rust nie zostały uruchomione. Zachowania NaN / Inf opisane wyżej wynikają z semantyki JS (`NaN > x` jest fałszem, `Inf - 1 = Inf`, `parseInt('—') = NaN`) i z czytania kodu.
- Wynik `hitChanceTw(NaN)` i `roll < NaN` potwierdza tylko komentarz w pinie i test `p6_ranged_damage_nan_roll_mniejsze_od_nan_to_pudlo`, nie uruchomienie pinu w tym temacie.
- **Baza worktree:** HEAD worktree to `8265bbec0`, a nie `parity-v2` = `3a8f068f6`. Kod Rust czytano z `origin/rust-port/parity-v2` (`3a8f068f6`), zgodnie z dispatchem. Commit tego rozpoznania dotyczy tylko dwóch plików (dokument i raport w runie).
- Tematy, które nie są w zakresie: `hitChanceTw` przy `NaN` stat, `counter_multiplier`, `resolveSiege*`.
