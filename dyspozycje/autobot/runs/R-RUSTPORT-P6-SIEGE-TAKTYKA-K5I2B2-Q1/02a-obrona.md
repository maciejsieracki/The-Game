# OBRONA Operatora — R-RUSTPORT-P6-SIEGE-TAKTYKA-K5I2B2-Q1 (runda 1, odpowiedź na zarzuty Evaluatora)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-SIEGE-TAKTYKA-K5I2B2-Q1
GOAL: usunięcie zarzutu KRYTYCZNEGO (strona odbiorcy ciosu w `blow_wall_bonus_proc`) z dowodem pinu i wektorami z odwróconą stroną.
BAZA: kod operatora `ed70dd2db` na gałęzi `r-rustport-k5i2b2-wip/R-RUSTPORT-P6-SIEGE-TAKTYKA-K5I2B2-Q1` (raport `e5149489d`). Poprawka: commit obrony (SHA w sekcji DEPLOY/PUSH niżej).
RUNDY: 1/5 (obrona w ramach rundy 1, bez nowej rundy Operatora)

## Odpowiedzi na zarzuty

### 1. KRYTYCZNY — `blow_wall_bonus_proc` na sztywno przekazuje `side_def=true`
Odpowiedź: PRZYJMUJĘ. Zarzut jest trafny: pin `_wallBonusProcFor(u)` (battleScene.ts:7459-7464) czyta `u.side` przez `fortificationDefenseBonusForUnit` → `defenderInsideFortification` (city-defense.ts:113-117: `side !== 'def'` → false). Riposta (battleScene.ts:9141, `_singleBlow(defender, attacker, false)`) daje odbiorcy `side === 'atk'`, więc pin daje 0, a adapter dawał bonus muru.

Poprawka:
- `rust-port/engine/src/domain/siege_tactics_blow_env.rs`: nowe pole `BlowPlacement.defender_side_def` (strona odbiorcy ciosu, nie zawsze obrońca); `blow_wall_bonus_proc` przekazuje `p.defender_side_def` zamiast `true`. Nowy test jednostkowy `odbiorca_strony_atk_nie_dostaje_bonusu_muru` (chodnik, za linią muru → 0; obrońca za murem → 200).
- `rust-port/engine/tests/p6_siege_tactics_blow_env_gen.mjs`: strony obiektów losowane 50/50 (`struckIsAtk`): odbiorca `side 'atk'` (riposta) albo `'def'`; w wektorze zapisane `in.attacker.side` i `in.defender.side`. Generator wykonuje tekst pinu bez zmian; hashe fragmentów pinu (FRAGMENT/UNIT/UNITS/TERRAIN/ENV) pozostają identyczne.
- Mock `battleUnitDifficultyCombatMult` w generatorze zastąpiony regułą z produkcji (`battle-unit-context.ts:13`: `unit.difficultyCombatMult ?? sideFallback`). Poprzedni mock był po `bu.id` (rola), co przy odwróceniu stron dawałoby błędną trudność. Dla zwykłych ciosów wynik się nie zmienia (fallback po stronie = dotychczasowe `diffA`/`diffD`).
- `rust-port/engine/tests/p6_siege_tactics_blow_env.rs`: `placement()` czyta `defender.side` → `defender_side_def`; mnożniki trudności mapowane po stronie jak w pinie (`attacker.side==='atk' ? diffA : diffD`, `defender.side==='def' ? diffD : diffA`).
- Wektory przegenerowane (`node` z generatora, 1200 przypadków). W wektorach: 607 przypadków z odbiorcą `side 'atk'`, z czego 116 na chodniku muru. W 1200 przypadkach zachowane gałęzie: trafienia, pudła, flanka, tył, ford, brzeg, rzeka, mur, NaN/Inf.

Dowód (mutacja): tymczasowo przywrócono `true` na sztywno w `blow_wall_bonus_proc` i uruchomiono `cargo test --test p6_siege_tactics_blow_env`: test `zgodnosc_z_pinem_end_to_end` FAIL z wieloma rozbieżnościami `env wallBonus: rust=… js=0` (np. #2, #53, #77, #90, #145, #148). Po przywróceniu kodu (`p.defender_side_def`) test PASS. Mutacja potwierdza, że testy wykrywają dokładnie ten błąd.

### 2. NOTA — brak pokrycia pustej nazwy kafla atakującego przy niepustym terrainData
Odpowiedź: PRZYJMUJĘ i naprawiam. Pula nazw w generatorze nie zawierała `''`. Dodano `''` do losowania nazw kafli (komentarz w generatorze). W nowych wektorach 125 przypadków ma `atkName === ''`, a `terrainData` jest niepusty (wiersze terenu z `TERRAIN_ROWS`). Test pinu PASS.

### 3. NOTA — `combatTerrainName` nie jest wykonywane z pinu; procarz 2 przypadki; NaN/Inf w terenie i murze nieobjęte
Odpowiedź: ODRZUCAM jako blokujące (zgodnie z oceną Evaluatora: "samo nie blokuje"), PRZYJMUJĘ jako dług do zapisania. Bez zmiany kodu w tej rundzie:
- `combatTerrainName` jest wejściem mapy (TileMap) podawanym przez wektor; mapowanie nazwa→teren jest w adapterze zgodne z combat.ts:677-687 i sprawdzone wektorem z pustą nazwą (pkt 2). Nie jest to wykonanie funkcji z pinu.
- Procarz (Slinger): 5 przypadków dystansowych w wektorach (liczba z `slingerRanged`), dziedzina `rangedClass` pokryta osobnym testem. Pełne pokrycie procarza NIE_ZMIERZONO.
- NaN/Inf w wejściach terenu i muru: NIE_ZMIERZONO (wejścia terenu i `wallTotal` są skończone w generatorze; NaN/Inf losowane tylko dla pól jednostki i `u`). Dług do osobnego tematu.

### 4. Bramki odtworzone przez Evaluatora
Potwierdzone przeze mnie ponownie po poprawce (patrz niżej). Zgodne z zarzutami.

## Bramki po poprawce (środowisko: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w katalogu scratchpad, poza repo)
- `cargo fmt --check` (rust-port/engine): exit 0
- `cargo clippy --all-targets -- -D warnings`: exit 0
- `cargo test --lib`: 94 passed (93 dotychczasowe + 1 nowy `odbiorca_strony_atk_nie_dostaje_bonusu_muru`)
- `cargo test --test p6_siege_tactics_blow_env`: 3 passed (1200 przypadków z pinu, sumy fragmentów pinu bez zmian)
- `cargo test --test p6_siege_tactics_blow_full`: 3 passed
- `git diff --check`: czysto
- Cargo.lock: wygenerowany lokalnie przez cargo, NIE dodany do commita (usunięty z worktree).

## Allowlista obrony
Zmienione: `rust-port/engine/src/domain/siege_tactics_blow_env.rs`, `rust-port/engine/tests/p6_siege_tactics_blow_env.rs`, `rust-port/engine/tests/p6_siege_tactics_blow_env_gen.mjs`, `rust-port/engine/tests/p6_siege_tactics_blow_env_vectors/vectors.json`, `dyspozycje/autobot/runs/R-RUSTPORT-P6-SIEGE-TAKTYKA-K5I2B2-Q1/02a-obrona.md`.
Nie zmieniano: `mod.rs`, `siege_tactics_blow_full.rs`, `gra/**`, `rust-port/engine/data/**`, `Cargo.toml`, `Cargo.lock`, origin/main, WERSJE.md. Brak push, brak integracji.

## Co zostaje jako dług (NIE_ZMIERZONO)
- Pełne pokrycie procarza (Slinger) — tylko 5 przypadków dystansowych.
- NaN/Inf w wejściach terenu i muru — nie mierzone.
- `combatTerrainName` z pinu — nie wykonywane (mapa nazw testowa).

## DEPLOY/PUSH
NIE WYKONANO (push i integracja poza zakresem Operatora; sprzątanie worktree po commicie: SHA w raporcie orkiestratora).
