# R-RUSTPORT-P6-K5LOOP-WIRING-A-Q1 — Obrona Operatora (r1)

```text
STATUS: BLOCK (częściowy: Z2, Z3 i Z4 zamknięte poprawkami i testami; Z1 — wektory pinu pełnej bitwy — nadal
        niespełnione, wymaga decyzji orkiestratora o wydzieleniu B1 albo rundy r2 z generatorem)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-WIRING-A-Q1 (#369 część A)
GOAL: SiegeBattleSession (start/step/skip/finish) nad SiegeLoop+ProdBody z adaptera T6 i pola T5, bez mostu
BAZA: Evaluator 003e02a2a (= Operator r1 9cb5c8b31 + raport 02-evaluator.md); parity-v2 nadal 32006733b
GAŁĄŹ: obrona-wiring-a (lokalna, worktree wf_06892f8f-ee4-3)
ZMIANY/COMMIT: §5 (SHA końcowy w StructuredOutput)
TESTY: §4
BLOKADY: Z1 / B1 (§1)
RUNDY: 1/5 (obrona po Evaluatorze r1)
NASTĘPNY KROK: Final Control albo decyzja orkiestratora w sprawie B1
DEPLOY/PUSH: NIE WYKONANO
```

## 1. Odpowiedzi na zarzuty

### Z1 (blokujący) — brak generatora TS pełnej bitwy i wektorów ≥ 6 scenariuszy — PRZYJMUJĘ (bez poprawki w tej rundzie)

Fakt jest bezsporny: `p6_k5loop_wiring_a_gen.mjs` nie istnieje, a `zlote_wyniki_sesji` to skrót FNV liczony z Rusta
(zamrożenie regresji, nie dowód parytetu). Zarzut Z2 pokazał przy tym, że takie zamrożenie potrafi utrwalić wynik
rozbieżny z pinem — po poprawce Z2 skrót zmienił się z `dcd224435100671a` na `619d9ea6ba687f71`, a wyniki scenariuszy
z wieżami przesunęły się (`mur_machiny`: obrońca w turze 38 zamiast 19; `mur_taran_katapulta`: atakujący w turze 50
zamiast 43). Generator pełnej bitwy wymaga wykonania tekstu pinu od konstruktora `BattleScene` (`:2717-3490`: teren,
`_carveWallTiles`, `_placeSiegeTowers`, `_placeUnits`) przez `_startBattle`, pętlę tur, zegary, `_fireSiegeTowers`,
pełne `_singleBlow`/`_resolveBlowOutcome` i wszystkie gałęzie `_activateUnit` z deterministycznym `Math.random`. Tej
pracy nie da się wiarygodnie wykonać w rundzie obrony. Nie wydzielam B1 sam — to decyzja orkiestratora (zgodnie z
uwagą Evaluatora). Rekomendacja bez zmian: osobny temat `R-RUSTPORT-P6-K5LOOP-WIRING-A-PIN-Q1` (harness = złożenie
istniejących wycinków T1–T6 + konstruktor sceny, wejście = te same stany gry co `scenarios()`), albo runda r2 tego ID
z generatorem jako jedynym zakresem. STATUS pozostaje BLOCK.

### Z2 (blokujący) — trafienie wieży na neutralnym szablonie — PRZYJMUJĘ (poprawka + testy + mutanty)

Poprawka (pin `_fireOneTower` `:4222-4269` → `_singleBlow(shooter, target, true)` `:8811-8960`, `main.ts:36994-37013`):

- `BlowComposer::compose_tower(&TowerBlowSite)` (nowa metoda z domyślnym `None`) i `TowerBlowSite` w
  `siege_tactics_loop.rs`; `ProdBody::tower_blow_full` przy kompozytorze składa wejście jak każdy cios:
  realny `cuD` celu (Obrona, Pancerz, `maxHp` → `defender_state.max_hp`, więc `apply_morale_damage` dostaje prawdziwe
  `maxHp`), łuk `relativeHit(target.facing, wallCol, t.row, target.q, target.r)` (`:8880`), teren kafla celu i
  `cityGatedTerrainMultiplier`/bonus muru przez `blow_env_for` (`isCityDefenseBattle = true`), `civCombatStatMultipliers`
  strony strzelca z `defenderCivBonusy` (`battleUnitCivBonusy(shooter.bu, this.defenderCivBonusy)`, syntetyczny `bu` nie
  ma `civBonusy`), trudność `defenderDifficultyCombatMult` dla strzelca i trudność właściciela celu, kontra
  `counterMultiplier(cuA.counterTyp, cuD.counterTyp)`, `isCharge = false` (strzał), bonusy budynkowe strzelca `{0, 0}`.
  Strzelec `cuA` = `toCombatUnit` z `towerShooterRow` (nowe `tower_shooter_cu`, wspólne z `tower_shot_from_row`; bez
  weterana/głodu/deficytu — syntetyczny `bu` ich nie ma, `:1355-1377`).
- Właściciel strony obrońcy = `defRosterRef[0].ownerId` (`rosters.def.first()`), jak `main.ts:36995/37011`.
- Gdy kompozytor nie zna strzelca (`compose_tower` = `None`): jawny tag `wieza-bez-kompozytora` w `unported`, nigdy
  cichy szablon. W sesji produkcyjnej `None` jest możliwe tylko bez wiersza strzelca (wtedy wieże w ogóle nie strzelają,
  `:4209`) albo bez kontekstu właściciela obrońcy (adapter odrzuca taki stan wcześniej: `MissingOwnerContext`).
- Ścieżka bez kompozytora (testy T1–T6, `tower_outcome_effects = false`/szablony) bez zmian; wektory `p4_1i3`/`p4_1i2`
  nietknięte.

Skutek: `zlote_wyniki_sesji` przeliczony (nowy skrót `619d9ea6ba687f71`, uzasadnienie: zmiana składania trafienia
wieży z neutralnego szablonu na `_singleBlow` pinu). `unported` puste w 6 scenariuszach przewijania i 2 w czasie
rzeczywistym (test `pelna_bitwa_auto_z_murem_unported_puste_skip`) oraz w sondzie §3.

Testy: `wieza_sklada_cios_z_realnym_celem` (cuD = cuD każdego innego ciosu w tę jednostkę, Obrona > 0, `maxHp` ≠ 10,
strzelec = `towerShooterRow`, trudność 1,25 strony obrońcy dla strzelca i 0,8 właściciela celu, obrona miasta, kontra
`counter_multiplier_pin`), `wieza_bonusy_cywilizacji_strony_obroncy` (bonus `walka_atak_wszystkie` właściciela miasta
działa na strzelca, ten sam bonus atakującego nie działa).

Korekta asercji testu własnego tej rundy (nie testu istniejącego przed tematem): `wynik_jako_dane` zakładał
„`dead` ⇒ HP ≤ 0”. Po Z2 pojawił się uciekinier zdjęty z pola (`dead = removed = routed = true`, HP 14). Pin
`_removeUnitFromScene` `:9910-9913` ustawia `dead = true` także uciekinierowi z HP > 0, więc asercja dotyczy teraz
poległych bez ucieczki (`dead && !routed`).

### Z3 (uwaga) — mutanty `tower_blow_full` i M16/M23 — PRZYJMUJĘ (testy, wszystkie zabite)

- E2 (bez `kill_ripples.push(tref)`): test `wieza_zabicie_ripple_i_padl` — trafienie wieży zabija cel, `kill_ripples ==
  [cel]`, `Clash { Tower(row), Padl }`.
- E3 (bez gałęzi `routed => Rout`): test `wieza_trafienie_uciekajacego_tag_rout` — cel, który uciekł w czasie lotu
  pocisku (`_fireOneTower` `:4263-4264` sprawdza tylko `dead`/`fadingOut`), dostaje nieśmiertelne trafienie; pin
  `_pushClash(..., defender.routed ? 'rout' : '')` (`:9066`) → tag `Rout`.
- M16: test `kompozytor_mur_cywilizacji_obroncy` (`hetyci`, `walka_obrona_piechota_w_murze` = 0,15): na koronie
  `def_on_wall = true` i `def_wall_civ_mult > 1`, poza koroną 1.
- M23: test `kompozytor_las_cywilizacji_obroncy`. Ustalenie z danych: bonus „leśny” (`_teren_las`) stosuje się, gdy nazwa
  terenu zawiera `las`/`dzungl`/`gor` (`terrain_is_forest_or_jungle`); `Plaskie (rownina/laka)` zawiera „las”, więc
  działa także na równinie (zachowanie portu `bonusApplies`, nie zmieniam). Jedyny kafel bez bonusu to `Rzeka`, stąd
  test na polu z rzeką (`worldTerrain.rzeka = true`, `slowianie`): Obrona na równinie > Obrona w rzece. Mutant „teren
  zawsze płaski” daje równość → zabity.

### Z4 (uwaga) — PRZYJMUJĘ wszystkie cztery punkty

(a) D-WIRA-10 — POPRAWIONE. `BlowComposer::terrain_defence_mult(unit, cell)`; `ProdBody::current_tdm` liczy
`terrainDefenseMultiplier(combatTerrainName(q, r), cu.rola)` z BIEŻĄCEGO kafla (`_checkRout` `:9790-9792`) w
`check_rout` ciała i w `ActivateUnit::terrain_defence_mult` przed `_activateUnit` (sprawdzenie okrążenia). Bez
kompozytora — wartość adaptera (stare testy). Test `checkrout_z_biezacego_kafla`: ripple `_shakeAlliesOnLoss`
(strata 12) zostawia sojusznika z morale 18 przy progu 20; na kaflu startowym ucieka, po przejściu na wzgórza
(+50% dla każdej roli; las tylko vs `dystans`/`flanka`) nie ucieka. Dodatkowo na kaflu startowym wartość kompozytora =
wartość adaptera.

(b) `attack_pre` E8/E22/E30 — ZMIERZONE sondą (§3).

(c) `step` — POPRAWIONE: walidacja `wall_delta_ms` przed `play()`. Test `step_niepoprawny_czas_nie_startuje_bitwy`
(NaN, −1, +∞ → błąd, faza `Prepared`, brak tury 0).

(d) D-WIRA-12 (nowa decyzja): `speedMul = 1`. W pinie `speedMul` zmienia wyłącznie UI (`_setSpeedIdx` `:9517-9526`,
domyślnie 1, `:2555`); sesja nie ma UI, więc `_scaledWallDelta(dw) = min(dw, BATTLE_FRAME_MAX_WALL_DELTA_MS) · 1`.
Klatki sesji mają 16 ms, więc clamp (`BATTLE_FRAME_MAX_WALL_DELTA_MS` ≥ 16) nie działa. Zmiana prędkości przez gracza =
część B (komenda mostu), gdy będzie potrzebna.

## 2. Decyzje techniczne (dopisane do listy D-WIRA)

- D-WIRA-2 (uzupełnienie): trafienie wieży składa `BlowComposer::compose_tower` (Z2); szablon `tower_shot_from_row`
  służy tylko ścieżce bez kompozytora.
- D-WIRA-10 (zmiana): `terrain_defence_mult` z bieżącego kafla (Z4a), nie dług.
- D-WIRA-12: `speedMul = 1`, clamp bez znaczenia przy klatkach 16 ms (Z4d).
- D-WIRA-13: brak strzelca w kompozytorze = jawny tag `wieza-bez-kompozytora`.

## 3. Sonda (Z4b oraz `unported` w szerszym zbiorze)

WYNIK_SONDY

## 4. Testy i bramki

BRAMKI

## 5. Mutanty obrony

Skrypt: `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5LOOP-WIRING-A-Q1/02a-obrona-mutanty.py` (zabity = `cargo test --test
p6_k5loop_wiring_a` FAIL; plik przywracany po każdym).

MUTANTY

## 6. Długi (zmiany względem §7 raportu Operatora)

| ID | Stan |
|---|---|
| D-WIRA-T / Z2 | ZROBIONE (kompozytor trafienia wieży) |
| D-WIRA-10 | ZROBIONE (bieżący kafel) |
| `attack_pre` E8/E22/E30 | ZMIERZONE (§3) |
| B1 / Z1 | OTWARTE — decyzja orkiestratora |
| pozostałe | bez zmian |

## 7. Commit

Gałąź lokalna `obrona-wiring-a` na `003e02a2a`: SHA w StructuredOutput. Push: NIE WYKONANO (Operator nie pushuje).
