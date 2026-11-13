# R-RUSTPORT-P6-COMBAT-WEJSCIA-ROZPOZNANIE-R2-Q1 — rozpoznanie wejść fazy zwarcia (COMBAT-WEJSCIA, #167)

**Domena:** GAME (rozpoznanie, bez zmian kodu).
**Baza:** `5e8b116e8` (czubek `origin/rust-port/parity-v2`, `R-RUSTPORT-P6-COMBAT-RESOLVE-PETLA-Q1 r1 FC`).
**SHA operatora R1 (ZMIANY/COMMIT):** `f9d5a2915` (rozpoznanie, bez zmian kodu).
**Pin (tylko odczyt):** `07d2fbd72:gra/src/game/combat.ts` (`resolveCombat` 842–1251; zamknięcie funkcji: linia 1251).
**Poprzednia runda:** R1 (baza `fc2ed160f`) padła na złej bazie; jej wnioski o „niezportowanym melee” są NIEAKTUALNE.
**Konwencja ścieżek Rust (poprawka R2-Q1-O, zarzut 5):** `combat.rs` w tym dokumencie oznacza `rust-port/engine/src/domain/combat.rs`. Testy to `rust-port/engine/tests/*.rs` (np. `tests/combat.rs`), osobne pliki.

Legenda statusu: **jest** (port istnieje i zgadza się semantycznie), **częściowo** (helper istnieje, brak wiązania w kolejności pinu), **brak** (brak odpowiednika w bazie), **rozbieżny** (istnieje, ale semantyka różni się od pinu), **NIE_ZMIERZONO** (nie sprawdzono w tej rundzie).

---

## 1. Ustalenia strukturalne (najważniejsze)

1. **Brak portu orkiestratora `resolveCombat`.** Pin `resolveCombat` (combat.ts:842–1240) to jedna funkcja: pre-loop (wejścia), faza dystansowa (`// ---------- Phase 0: Ranged`, 1012–1087), faza zwarcia (`// ---------- Phase 1 & 2: Melee`, 1089–~1220). W bazie:
   - `combat.rs:319 resolve_combat` to **inny, uproszczony model** (siła ważona + `loss_fractions`, bez rund, bez trafień) — NIE odpowiada `resolveCombat` z pinu.
   - `combat.rs:379 pub fn resolve(input)` tylko wywołuje `resolve_combat` (`combat.rs:379–381`). Brak w produkcji wywołania `ranged_phase::resolve_ranged_phase` ani `melee_phase::resolve_melee_phase` poza testami (grep po `rust-port/engine/src` zwraca wyłącznie definicje `combat.rs:1134` i `combat.rs:1384`).
   - Porty faz są więc **izolowanymi modułami** (`combat.rs:1059 pub mod ranged_phase`, `combat.rs:1276 pub mod melee_phase`), wołanymi tylko przez testy wektorowe.
2. **Sprzeczność w historii.** Log tematu #136 („COMBAT-RESOLVE-PETLA: port pętli dystansu do combat::resolve”) i commit `848e77a7e` („port fazy zwarcia melee_phase”) są w historii pliku `combat.rs`, ale `combat::resolve` w `5e8b116e8` nadal deleguje do modelu siłowego. **Doprecyzowanie (poprawka R2-Q1-O, zarzut 3):** `848e77a7e` (tytuł: „port fazy zwarcia melee_phase”) dodaje `resolve_melee_phase` i test `tests/p6_combat_melee.rs`; jego jedyna zmiana w `domain/combat.rs` to dodanie `pub fn resolve_melee_phase`, bez zmiany `pub fn resolve`. Faza dystansowa jest w osobnym commicie `83bc866e6` (`R-RUSTPORT-REPIN-WALKA-DYSTANS-PETLA-Q1`, dodaje `pub fn resolve_ranged_phase`), też bez zmiany `resolve`. Według `git log -- domain/combat.rs` na `f9d5a2915` jedynym commitem z ID COMBAT-RESOLVE-PETLA jest `848e77a7e`. Rozbieżność to więc treść tematu #136 („port pętli dystansu do combat::resolve”) wobec stanu kodu, a nie sprzeczność w samym kodzie. Rozstrzygnięcie, czy #136 był zamknięty błędnie, należy do orkiestratora.
3. **Zgodność prymitywów.** Prymitywy trafienia/obrażeń/strzału mają porty zgodne z pinem (szczegóły w tabeli §2, wiersze 14–20).

---

## 2. Tabela wejść: pin → Rust

Pin: `07d2fbd72:gra/src/game/combat.ts`. Rust: `5e8b116e8:rust-port/engine/src/…`.

| # | Wejście / krok | Pin (plik:linia) | Rust (plik:linia) | Status |
|---|---|---|---|---|
| 1 | Weterani: `applyVeteranFracToCombatUnit` (wejście opcjonalne, „już zastosowane”) | 847–871 | `domain/siege_tactics_inputs_unit.rs:312` `apply_veteran_frac_to_combat_unit` | częściowo (helper jest; brak logiki „already applied” i wiązania w `resolve`) |
| 2 | Głód armii `applyArmyHungerStatMultToCombatUnit`, domyślnie 0.75 | 873–879 | `siege_tactics_inputs_unit.rs:360`; domyślne 0.75 w `:400` | częściowo (helper i domyślna wartość zgodne) |
| 3 | Deficyt złota `applyGoldDeficitStatMultToCombatUnit`, domyślnie 0.75 | 881–887 | `siege_tactics_inputs_unit.rs:368` (wrapper na `weaken_stats`); **drugi, osobny duplikat** `domain/turn_economy.rs:637` (inny typ `GoldDeficitCombatStats`, ta sama semantyka: `mult` poza (0,1) → bez zmian); domyślne 0.75 w `siege_tactics_inputs_unit.rs:402` | częściowo (j.w.); ryzyko podpięcia złej funkcji (jak R3) |
| 4 | Mnożniki cywilizacji `civCombatStatMultipliers` (atk/obrona/pancerz/zdrowie; `isChargeRound` per runda) | 900–925 | `domain/civ_bonuses.rs:359` `civ_combat_stat_multipliers` | częściowo (helper jest; w pinie wołany 2× — pre-loop i per runda — brak wiązania) |
| 5 | Mnożniki budynków `mergeBuildingBonusIntoStatMultipliers` | 909–912, 922–925 | `combat.rs:1030` `unit_building_bonuses::merge_building_bonus_into_stat_multipliers` | częściowo |
| 6 | Mnożniki różniczki `attackerDifficultyCombatMult` / `defenderDifficultyCombatMult` (domyślnie 1) | 927–928 | brak w `combat.rs`; wejście caller-supplied | brak (w orkiestratorze) |
| 7 | Bazowe statystyki po mnożnikach (`atkMelee0`, `atkObrona0`, `atkPanc0`, `atkMissile0`, `defObrona0`, `defMelee0`, `defPanc0`, `defMissile0`) | 930–938 | `applyMultiplier` = `civ_bonuses.rs:375`; składanie w pinie brak w Rust | brak (składanie w orkiestratorze); `apply_multiplier` jest |
| 8 | HP startowe, ścieżka kanoniczna: `Math.round(clamp(current, applyMultiplier(canonicalMax, civHealth)))` | 940–960 | brak odpowiednika; `domain/unit_health.rs:158` `effective_max_hp` to tylko ścieżka legacy | brak (ścieżka kanoniczna); legacy częściowo |
| 9 | HP startowe, ścieżka legacy: `effectiveMaxHp(health/(1+vet) * civHealth, other, vet)` | 949–955, 962–968 | `unit_health.rs:158` (sygnatura zgodna) | częściowo |
| 10 | `hpAtkStart` / `hpDefStart` = wartości po zaokrągleniu; używane do progów rozpadu | 970–971 | brak | brak |
| 11 | Amunicja `resolveAmmo` (override > `Ilosc pociskow`; `'---'`/pusty → 0; string → `parseInt`) | 784–789, 973–974 | brak funkcji; `RangedPhaseInput`/`RangedSide.ammo: i64` (`combat.rs:1064`–) — wartość od caller | **rozbieżny** (parsowanie i obsługa `NaN` po stronie caller; #137) |
| 12 | Próg rozpadu `routThreshold` = `Prog dezercji (% health)` × **hpStart** (nie current) | 778–782, 976–977 | `RangedSide.rout_threshold` / `MeleePhaseInput.rout_atk` — wartości caller | **rozbieżny ryzykiem**: pin przelicza na `hpAtkStart`, Rust nie ma wiązania; wymagany test |
| 13 | `isRangedUnit` = `(missileAttack ?? 0) > 0` | 791–793, 1012–1013 | `RangedSide.is_ranged` (caller-supplied, `combat.rs:1070`) | częściowo |
| 14 | Flank/rear: `flankRearDefensePenalty` (0 dla `front`; reszta z pola `Flank/Rear`) | 589–606, 984 | `domain/siege_tactics_inputs_pos.rs:286` `flank_rear_defense_penalty` (JsVal) | jest semantycznie (helper); wiązanie brak |
| 15 | `defEffObrona = max(0, defObrona0 × (1 − penalty))` | 985 | brak | brak |
| 16 | Kontry: `ctrAtkVsDef`, `ctrDefVsAtk` = `counterMultiplier(...)` | 988–989; funkcja 553–580 | `combat.rs:188` `counter_multiplier` | **rozbieżny** — patrz §3, R1 |
| 17 | Teren obrony `terrDefMult` = `defenderTerrainDefMultOverride ?? terrainDefenseMultiplier(...)` | 994; funkcja 639–671 | `siege_tactics_inputs_terrain.rs:115` (`&str, &str, &[TerrainEntry]`, zgodna z pinem); **osobna** `combat.rs:215` `terrain_defense_multiplier(Terrain, bool)` o innej sygnaturze | **rozbieżny ryzykiem** — dwie funkcje o tej samej nazwie; `defenderTerrainDefMultOverride` (C-COMBAT-Q2) BRAK w Rust (grep: 0 trafień) |
| 18 | Teren rzeka `terrRiverMult` = `terrainRiverAttackMultiplier` (0.75 z `combat-params`) | 997; funkcja 677–687 | `siege_tactics_inputs_terrain.rs:148` (parametr `river_attack_mult` zamiast czytania `combat-params`); `siege_tactics_blow_inputs.rs:21` | jest semantycznie (wartość jako parametr) |
| 19 | Mnożnik konstrukcji `structMult = 1 + max(0, pct)/100` | 1002–1003 | brak | brak (caller-supplied) |
| 20 | Mur: `wallCivMult` = `civWallDefenseMultiplier` gdy `defenderOnWallWalkway` | 1004–1006 | `domain/civ_bonuses.rs:594` `civ_wall_defense_multiplier` | jest (helper); wiązanie brak |
| 21 | `atkEffMelee = atkMelee0 × terrRiverMult`; `defFinalObrona = defEffObrona × terrDefMult × structMult × wallCivMult` | 1009–1010 | brak; `MeleePhaseInput.def_final_obrona` (`combat.rs:1320`) i `RangedPhaseInput.def_final_obrona` przyjmują gotową wartość | częściowo (wejście przyjęte, składanie brak) |
| 22 | Faza dystansowa: pętla `while (...)` z warunkiem ammo/hp/routed | 1012–1087 | `combat.rs:1134` `ranged_phase::resolve_ranged_phase` | jest semantycznie wg komentarzy portu; **brak produkcyjnego wołającego**; wektory NIE_ZMIERZONO w tej rundzie |
| 23 | Strzał atakującego: `hitChanceTw(rangedShotAccuracy(atkMelee0, atkMissile0) × terrRiverMult, defFinalObrona)` | 1035–1037 | `unit_power.rs:66` `ranged_shot_accuracy` (js_max) + `unit_power.rs:94` `hit_chance_tw` | jest (prymitywy zgodne) |
| 24 | Strzał obrońcy: `hitChanceTw(rangedShotAccuracy(defMelee0, defMissile0), atkObrona0)` — **bez** `terrRiverMult`, obrona = `atkObrona0` | 1056 | `ranged_phase` (wiązanie wejść po stronie caller) | jest semantycznie wg komentarza portu; **do weryfikacji**: pole `RangedSide.melee_defence` opisane niejednoznacznie (`combat.rs:1080`) |
| 25 | Obrażenia strzału: `rangedShotDamage(shooter, missile, armor, counter)` = `max(1, round(rangeDamageTw × counter × rangedDamageMultFor))` | 485–496, 1041, 1059 | `unit_power.rs:79` `ranged_shot_damage_f64` (js_round, js_max) | jest (zgodne NaN/Inf wg komentarzy) |
| 26 | Pancerz celu w strzale: atakujący→`defPanc0`, obrońca→`atkPanc0` | 1041, 1059 | parametr `armor` w `RangedSide` | jest (wiązanie caller) |
| 27 | Rozpad po strzale: `hpDef < routDef` → `routed.push('defender')`, `break` | 1087+ (fragment) | `resolve_ranged_phase` | NIE_ZMIERZONO (pełna gałąź nie czytana w tej rundzie) |
| 28 | Warunek wyjścia z pętli dystansu, gałąź `if (!atkIsRanged || ammoAtk<=0) { if (!defIsRanged || ammoDef<=0) break; }` | 1085 | `resolve_ranged_phase` | NIE_ZMIERZONO (nie zweryfikowano w tej rundzie) |
| 29 | Faza zwarcia: wejście `if (hpAtk>0 && hpDef>0 && routed.length===0)` | 1091 | `combat.rs:1413` (`if hp_atk > 0.0 && hp_def > 0.0 && routed.is_empty()`) | jest |
| 30 | `defBracing = attackerMoved && negatesCharge(defender)`; `negatesCharge` = `counterTyp.toLowerCase()` ∈ {spearman, falangite} | 1095, 798–802 | `combat.rs:1363` `negates_charge`, `:1414` `def_bracing` | jest (zgodne, w tym brak trim) |
| 31 | Licznik rund: `meleeRound++`, `totalRounds++`, `totalRounds > maxRounds` → remis | 1100–1104 | `combat.rs:1417–1421` | jest (zgodne) |
| 32 | `isCharge = meleeRound===1 && !defBracing` | 1107 | `combat.rs:1426` | jest |
| 33 | Mnożniki rundy (szarża vs zwykła) per strona | 1108–1140 | `MeleePhaseInput.mods_*_charge` / `mods_*_round` (wejście) | jest (kontrakt); produkcyjne wyliczenie brak |
| 34 | `roundAtkMelee = applyMultiplier(meleeAttack, atk) × atkDiffMult × terrRiverMult` | 1130–1131 (ok.) | `combat.rs:1438–1440` | jest |
| 35 | `roundAtkCharge = applyMultiplier(chargeBonus, uderzenie)`; trafienie szarży `chargeHitBonus` | 1131–1149 | `combat.rs:1438–1452` | jest |
| 36 | `roundDefObrona` zadeklarowana w pinie (1137), **nieużywana** (martwa zmienna) | 1137 | brak | zgodne funkcjonalnie |
| 37 | Trafienie atakującego: `hitChanceTw(roundAtkMelee, defFinalObrona, chargeHitBonus)` | 1149 | `combat.rs:1452–1453` | jest |
| 38 | Obrażenia atakującego: `damageTw(weaponDamage, roundDefPanc, piercing, roundAtkCharge, isCharge)`; `Math.round(raw × ctrAtkVsDef)` | 1150–1160 | `combat.rs:1463–1464` (`js_round`, `damage_tw` z `siege_tactics_blow.rs:217`) | jest (`js_round` zgodne ze znakiem zera) |
| 39 | Trafienie obrońcy: `hitChanceTw(roundDefMelee, roundAtkObrona)` | 1171 | `combat.rs:1488` (`round_atk_obrona`) | jest |
| 40 | Obrażenia obrońcy: `damageTw(weaponDamage, roundAtkPanc, piercing, 0, false)`; `Math.round(raw × ctrDefVsAtk)` | 1172–1185 | `combat.rs:1498` | jest |
| 41 | Rozpad/śmierć po rundzie: `defRoutCheck = !unbreakable && routDef>0 && hpDef<routDef`, analogicznie atakujący | 1192–1197+ | `combat.rs:1524–1526` | jest |
| 42 | Końcowy wynik: `winner`, log, `totalRounds` | 1234–1251 (`return` w 1243–1250, zamknięcie `}` w 1251) | `MeleePhaseResult` (`combat.rs:1353`) | częściowo (winner poza portem) |

---

## 3. Rozbieżności semantyczne

**R1 — `counterMultiplier` (krytyczna).**
- Pin (`combat.ts:553–580`): iteruje po `counters` (plik `counters.json`), filtruje `Status === 'potwierdzone'` i `Rodzaj (Atak/Obrona) === 'Atak'`, dopasowuje **substring w obie strony** (`aLow.includes(cAtk) || cAtk.includes(aLow)`), obsługuje alternatywy w `Cel (typ)` przez `/`, zwraca `1 + parseCounterBonusFrac(Bonus)`, a przy nieparsowalnym `Bonus` — `COUNTER_MULT` z `combat-params.json`. Brak dopasowania → `1.0`.
- Rust (`combat.rs:188–204`): najpierw szuka w `CombatUnit.bonuses_vs_type` (dokładne dopasowanie `canonical_type`), potem w **macierzy** `data/derived/counter-multipliers.json` (`data/derived.rs:689` `counter_multiplier_value`, dokładna para kanoniczna). Brak → `1.0`. Brak fallbacku `COUNTER_MULT` i brak filtra `Status`.
- Różnice: (a) **źródło danych** (counters.json vs derived matrix); (b) **dopasowanie** (substring vs dokładne po `canonical_type`, gdzie `spear→spearman`); (c) **priorytet** (Rust: lista per jednostka przed macierzą; pin: jedna lista); (d) **fallback** (pin `COUNTER_MULT`, Rust brak); (e) **filtr statusu** (pin pomija niepotwierdzone, Rust nie ma pojęcia statusu). **Zmierzone (poprawka R2-Q1-O, zarzut 1):** emulacja `counterMultiplier` z pinu (dopasowanie substring, jak `combat.ts:553–580`) na `gra/data/counters.json` @ `07d2fbd72` (18 wierszy, 16 z `Rodzaj=Atak`; wartości `Bonus` mają format `±NN%`, fallback `COUNTER_MULT` nieużyty) względem `rust-port/engine/data/derived/counter-multipliers.json` @ `5e8b116e8` (8 typów × 8 = 64 pary). **Jedyna rozbieżność: `falangite → spearman`: pin 1.30 (wiersz „Falangite | Spearman | +30%”), Rust 1 (wpis jawny `mnoznik: 1`).** Pozostałe 63 pary zgodne. Komentarz `combat.rs:185–187` („mirrors every confirmed attack counter”) jest dla tej pary nieprawdziwy. Wariant dokładnego dopasowania po typie daje ten sam wynik, więc przyczyna leży w danych macierzy, a nie w dopasowaniu.

**R2 — Brak orkiestratora `resolveCombat`.** Patrz §1 pkt 1. Porty faz są poprawne lokalnie, ale nie wiążą się w produkcji; `combat::resolve` to model siłowy.

**R3 — Dwie funkcje `terrain_defense_multiplier`.** `combat.rs:215` (`Terrain` enum, `bool` rola) vs `siege_tactics_inputs_terrain.rs:115` (`&str`, `&str`, dane — zgodne z pinem `combat.ts:639`). Ryzyko podpięcia złej funkcji w orkiestratorze.

**R4 — Obejście `defenderTerrainDefMultOverride` (C-COMBAT-Q2, pin ~994).** Brak w Rust (grep: 0 trafień w `rust-port`). Wpływa na miasta (obrona w mieście).

**R5 — Progi rozpadu liczone od `hpStart`.** Pin: `routThreshold({...unit, health: hpAtkStart})` (976–977). Rust przyjmuje `rout_atk`/`rout_def` jako gotowe liczby; brak testu, że caller przekazuje wartość od HP startowego, a nie bieżącego.

**R6 — HP startowe, dwie ścieżki.** Pin rozróżnia `canonicalEffectiveMaxHp` (clamp `current`) od legacy (`effectiveMaxHp`). Rust nie ma pierwszej ścieżki w `combat.rs`.

**R7 — Amunicja.** Pin: `resolveAmmo` z `parseInt` na stringach i fallback 0 dla `'---'`/pusty. Rust: `i64` od caller. Obsługa `NaN`/`Inf` w `maxRounds` i amunicji — temat #137, NIE_ZMIERZONO.

**R8 — Strzał obrońcy (pin 1056).** Obrona celu to `atkObrona0` (bez flanki i terenu), a `terrRiverMult` NIE wchodzi do celności obrońcy. Rust: semantyka pola `RangedSide.melee_defence` opisana w komentarzu niejednoznacznie (`combat.rs:1080`) — wymaga jawnego wiązania w orkiestratorze.

**R9 — Wejście `attackerMoved` (domyślnie `true`, pin 892).** Rust `MeleePhaseInput.attacker_moved` (bez domyślnej wartości) — caller musi jawnie przekazać `true` przy domyślnym przypadku.

---

## 4. Plan wykonawczy (T1..Tn, z zależnościami)

Szacunki rund są **szacunkiem, nie pomiarem** (NIE_ZMIERZONO w tej rundzie).

| ID | Zakres | Zależy od | Szacunek rund | Uwagi |
|---|---|---|---|---|
| T0 | Decyzja właściciela (ABC): kanoniczne źródło counter (`counters.json` vs `counter-multipliers.json`) i fallback `COUNTER_MULT` | — | 0 (decyzja) | R1; bez tego T1 nie startuje |
| T1 | Port `counterMultiplier` zgodny z pinem (filtr statusu, substring/alternatywy, `Bonus`, fallback) + wektory | T0 | 1–2 | R1; test na 1:1 z pinem |
| T2 | Usunięcie lub przemianowanie `combat.rs:215` (ujednolicenie `terrain_defense_multiplier`), wiązanie z `siege_tactics_inputs_terrain.rs:115` | — | 1 | R3 |
| T3 | Port wejść pre-loop `resolveCombat` (pin 847–1010): weterani, głód, deficyt, civ, budynki, HP (obie ścieżki), amunicja, progi od hpStart, flank, teren z override, struct, mur, `defFinalObrona` | T1, T2 | 2–3 | R4, R5, R6, R7; największy kawałek |
| T4 | Wiązanie faz: `resolve_combat_pin` = T3 → `resolve_ranged_phase` → `resolve_melee_phase` z zachowaniem `routed` i limitu rund | T3 | 2 | R2; decyzja, czy zastępuje `resolve_combat`, czy jest równoległym wejściem (decyzja właściciela) |
| T5 | Wektory pinu dla wejść (combat-level harness, #100, #135, #137), mutacje | T4 | 2 | weryfikacja R5, R8, R9 |
| T6 | Produkcyjne wywołanie (scena bitwy / most web) — poza zakresem tego rozpoznania | T4, T5 | NIE_ZMIERZONO | wymaga osobnego tematu |

Kolejność sugerowana: T0 (decyzja) ∥ T2 → T1 → T3 → T4 → T5 → T6. T1 i T2 mogą iść równolegle na 4 operatorach (zasada 7 orkiestratora).

---

## 5. NIE_ZMIERZONO (jawna lista)

- Nie uruchomiono `cargo` ani testów (zgodnie z dispatchem: TESTY NIE DOTYCZY).
- Porównanie macierzy `counter-multipliers.json` z `counters.json` wykonano (patrz R1, jedna rozbieżność). Nie zbadano, czy `falangite → spearman: 1` jest błędem danych, czy świadomą decyzją: to decyzja właściciela (T0).
- Pokrycie testami (wskazanie, bez pomiaru asercji): `rust-port/engine/tests/p6_combat_harness.rs`, `p6_repin_dystans_petla.rs`, `p6_combat_melee.rs`, `p6_ranged_damage_nan.rs` zawierają wywołania `resolve_ranged_phase`/`resolve_melee_phase`. Nie czytano ich asercji ani nie uruchamiano ich w tej rundzie (wiersze 22, 24, 27, 28).
- Nie przeczytano pełnych gałęzi rozpadu i warunku wyjścia fazy dystansowej (wiersze 27–28).
- Nie zweryfikowano, czy `RangedSide.river_mult` jest stosowany wyłącznie po stronie atakującego (R8).
- Nie zweryfikowano wpisu #136 w historii innej gałęzi (§1 pkt 2).
- Szacunki rund w §4 nie są pomiarem.
