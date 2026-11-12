STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-SIEGE-TAKTYKA-K5I2A4-Q1
GOAL: port 1:1 toCombatUnit (battleScene.ts:1355) z combatUnitFromDef i trzema applyXxxToCombatUnit jako czyste funkcje, wektory z pinu 07d2fbd72
ZMIANY/COMMIT: baza eee18680c + merge 4b6595876 (K5I2a2; konflikt mod.rs rozwiazany: obie rejestracje, commit e77165829). Nowe pliki w allowliscie:
  rust-port/engine/src/domain/siege_tactics_inputs_unit.rs, mod.rs (rejestracja), rust-port/engine/tests/p6_siege_tactics_inputs_unit.rs,
  p6_siege_tactics_inputs_unit_gen.mjs, p6_siege_tactics_inputs_unit_vectors/vectors.json (2447 przypadkow, 75 jednostek pinu). SHA kodu: 2f8b69ccda6496e9315536d47849174633da28d6 (galaz worktree-wf_13f586a2-9ea-1).
  Cargo.lock NIE commitowany.
TESTY (EXIT zapisany):
  cargo fmt --check EXIT=0; cargo clippy --all-targets -- -D warnings EXIT=0; cargo test --lib EXIT=0 (65 passed);
  cargo test --test p6_siege_tactics_blow/_inputs_terrain/_inputs_pos/_end/_endcheck/_inputs_unit EXIT=0 (3/7/1/8/9/2 passed; K5I/a1/a2 bez zmian i bez oslabien).
  Nowy test: wektory z wykonania TEKSTU pinu w node (new Function po stripTypeScriptTypes), straznik SHA-256 fragmentow
  (d1b401a2275ab01569dd16ec1a6a3618ae56b592dd13c4f900b82b252755016c) i calego gra/data/units.json pinu (7b509817d1c613a526ea0e8066a62f340f46a29fedd6f79f0c647195727bc6d7, 75 jednostek).
  Przypadki: combatNormField 160, unitRowStat 160, combatStatField 120, combatUnitFromDef 527, applyVeteranFrac 260, applyArmyHunger 200, applyGoldDeficit 200, toCombatUnit 820 (kazda z 75 jednostek x 8 wariantow + 220 syntetycznych).
  Porownanie bitowe f64 (-0 vs 0, NaN), wszystkie pola CombatUnit. Pokrycie galezi: ~55 licznikow, wszystkie > 0 (asertowane), w tym NaN w wyniku (231) i Inf (149).
  Test kompozycji: CombatUnitModel -> BlowInput -> single_blow (rdzen K5I), 1640 wywolan (820 trafien); wynik identyczny dla modelu z Rust i z wartosci pinu.
  Mapowanie plik:linia pinu: toCombatUnit battleScene.ts:1355-1378; combatUnitFromDef combat.ts:194-234; combatNormField :148-152; unitRowStat :158-176; combatStatField :178-184;
  applyVeteranFracToCombatUnit veteran.ts:362-385 (round4 :333-335); applyArmyHungerStatMultToCombatUnit army-starvation.ts:35-52; applyGoldDeficitStatMultToCombatUnit gold-deficit.ts:182-199.
BLOKADY: brak. Uwagi:
  1. Istniejace porty: deficyt zlota juz byl w turn_economy::gold_deficit (na podzbiorze statow) - uzyty przez mapowanie, bez duplikacji; glod armii ma identyczne cialo w pinie, wiec uzywa tego samego portu (osobna pub fn z wlasnym wywolujacym w wektorach).
     combat::CombatUnit (autobitwa, u32) to inny model niz CombatUnit z pinu - nie uzyty; nowy CombatUnitModel (f64) jest zgodny z wejsciem BlowInput rdzenia K5I (weapon_damage, piercing, melee_attack, charge_bonus, armor, missile_attack).
  2. Stale BTERRAIN_RIVER/FORD: w a1 (siege_tactics_inputs_terrain.rs) NIE ma definicji kodow kafli (tylko terrain_river_attack_multiplier po nazwie) - brak kolizji, unifikacja niepotrzebna; wartosci z pos.rs (River=3, Ford=4) zgodne z battle-terrain.ts:37-46. Nie modyfikowano pos.rs/blow_inputs.rs.
  3. Warianty "cywilizacja" i "trudnosc" NIE sa wejsciami toCombatUnit w pinie (civ i trudnosc wchodza przy skladaniu wejsc ciosu: civ_combat_stat_multipliers, battle_unit_difficulty_combat_mult z a2). Wariantami toCombatUnit sa awans/weteran (veteranBonusFrac), glod armii, deficyt zlota, flagi skip*, mnozniki, hp, brak stats, brak Jednostka - wszystkie pokryte.
  4. Uproszczenia modelu: wartosc logiczna w polu liczbowym units.json nie wystepuje w danych (w JS dalaby `true`, tu 1/0); pole unbreakable? nie jest ustawiane przez combatUnitFromDef - pominiete. Wektory zawieraja pola skalarne wierszy (bez Historia/Opis/Top3 - nieczytane).
  5. Rozbieznosci units.json Rust vs pin (zadanie 27): NIE rozstrzygane; wektory uzywaja WYLACZNIE danych pinu. Rust engine/data nie byl czytany ani zmieniany.
RUNDY: 1/5 (dispatch: runda 1/5; plik przemianowany z 01-operator-r4.md po obronie Z4)
NASTĘPNY KROK: Evaluator (ponowna ocena po obronie 02a-obrona.md)
DEPLOY/PUSH: NIE WYKONANO

## Uzupełnienie po zarzucie 5 (obrona 02a): rozbieżności units.json Rust vs pin

Porównanie: pin `gra/data/units.json` @07d2fbd72 (75 jednostek) vs `rust-port/engine/data/units.json` @2f8b69ccd (75 jednostek). Dopasowanie po polu `Nazwa EN`; zbiory nazw identyczne (0 jednostek tylko w jednym pliku). Wynik: 71 różnic pól w wierszach, rozkład po polu: Tech 27, Zastąp specjalnie 21, fieldPower 9, Top3 3, Epoka 2, Historia 2, Atak/Obrona/Przebicie/Bonus vs Spearman %/meleeAttack/meleeDefence/piercing po 1 (wszystkie: Phalanx).

Różnice liczbowe mające znaczenie bojowe (pin → Rust):
- Phalanx: Atak 7 → 6; Obrona 12 → 10; Przebicie 4 → 2; Bonus vs Spearman % 30 → 0; meleeAttack 7 → 5; meleeDefence 12 → 10; piercing 4 → 2 (Top3 pina podaje „Obrona 12”, Rust „Obrona 10”).
- Epoka: Horseman i Chinese Cavalry — pin „Żelazo”, Rust „Brąz”.
- fieldPower (pole pochodne): Phalanx 58.5 → 52.5; Slinger 16 → 12; Slinger (Huaraca) 16 → 12; Archer 19 → 17.5; Egyptian Archer 18 → 15; Nubian Archer 19 → 16; Sumerian Archer 14 → 12; Akkadian Archer 18 → 15.5; Assyrian Archer 19 → 17.

Różnice tekstowe / meta bez wpływu na funkcje portu: Tech (27 wierszy, np. „Sztuka wojenna” vs „Hutnictwo żelaza”/„Jeździectwo”/„Oblężnictwo”), Zastąp specjalnie (21), Top3 (Phalanx, Hieros Lochos, Shield Wall), Historia (Evocati, iButho with iklwa).

Ustalenie: rozbieżności NIE są rozstrzygane w tym temacie (zadanie 27, decyzja gameplay właściciela). Wektory w tym temacie używają wyłącznie danych pinu. Wniosek dla kolejnych klocków: wołający wpięty w produkcję (K5I2b / K5-LOOP) nie może czytać `rust-port/engine/data/units.json` dla Phalanxa i dwóch kawalerii, dopóki zadanie 27 nie zostanie rozstrzygnięte.
