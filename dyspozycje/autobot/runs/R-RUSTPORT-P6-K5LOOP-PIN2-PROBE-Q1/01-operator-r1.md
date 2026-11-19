# R-RUSTPORT-P6-K5LOOP-PIN2-PROBE-Q1 — Operator r1

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-PIN2-PROBE-Q1 (B-WIRA-PIN-2: sonda morale t. 86 + scenariusze dla mutantów B03/B06/B07)
GOAL: ROZBIEZNE_B_WIRA_PIN_1/2 puste albo jawnie uzasadnione; sonda morale a0 t. 86 (pin vs Rust) zmierzona;
      >= 3 nowe scenariusze zabijające B03/B06/B07; dotychczasowe 7 scenariuszy bajt w bajt; MD5 generatora odtwarzalne
BAZA: origin/rust-port/parity-v2 = 2e5bf370a434eb81eeaf0e82d104faaf5f40b57d (zgodnie z linią BAZA dispatchu)
GAŁĄŹ: rust-port-wip/k5loop-pin2-probe-q1-r1 (lokalna, worktree wf_40925a79-57f-1)
ZMIANY/COMMIT: §6 (SHA w §9)
TESTY: §7
BLOKADY: B-WIRA-PIN-2 zawężona do remisu klatki 16 ms (FRAME-QUANT, D-PIN2-2) z testem pilnującym; B06 bez wektora
         rozróżniającego (§5, dług); 11/293 losowych kandydatów rozbieżnych także w granicy klatki (§4.3, NOWY dług)
RUNDY: 1/5
NASTĘPNY KROK: Evaluator r1
DEPLOY/PUSH: NIE WYKONANO
```

## 1. Web najpierw (pin `07d2fbd72`, `gra/src/battle/battleScene.ts`)

| Miejsce pinu | Treść istotna dla sondy |
|---|---|
| `:2552`, `:9416-9435` | `BATTLE_FRAME_WALL_MS = 16`; przewijanie (`skip`) robi kroki `FF_STEP_MS = _scaledWallDelta(16)`: zegary (`_drainTimers`), pociski, zaniki, potem kolejka `_raf`. Model PRODUKCYJNY = klatka 16 ms (także AUTO z rAF). |
| `:9616-9634` | `_drainTimers` odpala zegary z `due <= vNow` klatki PRZED krokami animacji (`_raf`) tej samej klatki. |
| `:6064`, `:6103-6117` | `_activateUnit`: `_applyTerrainRange`, okrążenie: `ru.morale -= MORALE_SURROUND_HIT` od razu, `_checkRout`. |
| `:9019-9068`, `:9722-9735`, `:9783-9797` | `_resolveBlowOutcome` → `_applyMoraleDamage` (strata z HP, aura upadku armii x1,3 przy `ratio < 0,40`) → `_checkRout` (próg obniżony na terenie obronnym). Każde trafienie (także pocisk wieży w trakcie marszu) odejmuje od BIEŻĄCEGO `ru.morale`; `done()` niczego nie przywraca. |
| `:7699-7741` | Wyburzony kafel muru: obrońca z korony cofa się o pole i `_applyTerrainRange(u)` od razu (`:7740`). |
| `:4718`, `:4730`, `:6125-6168` | Wszyscy obrońcy murowi startują `onWallWalkway: true` z przeliczonym zasięgiem; na koronie NIGDY nie schodzą dobrowolnie (bez kroków). |
| `:7924-7960` | `_siegeShooterThreats` (z `_applyTerrainRange(d)`) wołane tylko, gdy `_siegeApproachRestricted(ru)`: przed wyłomem (piechota) / przed wyłomem kafla lub bramy (jazda). |

## 2. Sonda morale (pomiar, nie hipoteza)

Narzędzia (tylko diagnostyka, bez wpływu na wektory): generator — `WIRING_A_TRACE=<scenariusz>` + `WIRING_A_FF_STEP=<ms>`
(krok przewijania pinu = model klatki N ms bez kosztu pętli renderu; zmiana wyłącznie wartości statycznej
`BATTLE_FRAME_WALL_MS`, tekst pinu i strażnik SHA nietknięte) + ślad `OUTCOME`/`CHECKROUT`/`GAIN` ze stanem morale celu
przed/po `_resolveBlowOutcome`; Rust — `slad_diagnostyczny_na_zadanie` z `WIRING_A_TRACE_STEP=1` i zrzutem morale
wszystkich jednostek po każdym kroku z obrażeniami/rozbiciem.

Kontrola: pin przewijanie @2 ms daje dokładnie wynik obrony r2 dla czasu rzeczywistego @2 ms (obrońca, t. 400, **48**
rzutów); @1 ms = @2 ms (te same zdarzenia DMG/ROUT/KILL); @16 ms = wektor (46 rzutów).

### 2.1 Ślad a0 (Konnica) — pin @1 ms vs Rust PRZED poprawką

| Chwila | pin @1 ms (`OUTCOME`/`GAIN`) | Rust (zrzut morale po kroku) |
|---|---|---|
| t. 72, `a0 → d2` (zabicie) | `GAIN 5`, `GAIN 6`: 56,643 → **67,643** | 67,643 |
| t. 73, wieża rz. 86 → a0 (tył, extra 15) w trakcie marszu a0 | 67,643 → **50,857** | 50,857 (147 760 ms) |
| t. 73, `complete` aktywacji a0 (po marszu, ~148 016 ms) | bez zmian: **50,857** | **67,643** ← cofnięte |
| t. 74, wieża rz. 82 → a0 | 50,857 → 41,071 | 67,643 → 57,857 |
| t. 78, t. 79, t. 80 (zabicie d0), t. 83 | … → 22,714 | … → 49,286 |
| t. 86, `d1 → a0` dmg 17 | 22,714: projekcja ≤ `fleeMorale` 10 → **ROUT a0** | 49,286 → 18,929, bez rozbicia |

**Wniosek sondy:** rozjazd t. 86 NIE był remisem czasowym, tylko realną różnicą logiki Rust: `ProdBody::complete`
(`siege_tactics_loop.rs`) bezwarunkowo przepisywał `c.morale = pend.morale`, gdzie `pend.morale` to morale z chwili
`start` aktywacji (po ewentualnym okrążeniu). Trafienie wieży w oknie start..complete (marsz wielokrokowy, D-WIRA-18)
było cofane. Pin (`:6103-6117`, `:9722-9735`) takiej operacji nie ma.

### 2.2 Po poprawce D-PIN2-1

- Rust `mur_jazda_rzeka`: obrońca, t. 400, wyłom, **48** rzutów, HP a0/a3 = **31/15** — identycznie jak pin @2 ms i @1 ms.
- Sekwencja zdarzeń (`DMG`/`ROUT`/`KILL` z turą) Rust vs pin @1 ms: **identyczna przez całą bitwę** (23 zdarzenia, `diff` pusty).
  Rust vs pin @16 ms: pierwszy rozjazd w t. 70 (`KILL d2` @16 ms, pudło @1 ms i w Rust).
- Bliźniak `mur_jazda_rzeka_klatka1` (pin z krokiem 1 ms) w wektorach: **bajt w bajt**.
- Pozostałe 7 scenariuszy WIRING-A: nadal bajt w bajt (rekordy w `vectors.json` niezmienione bajtowo — sprawdzone
  porównaniem JSON 8/8).

## 3. Decyzje techniczne (do rejestru — wpisuje orkiestrator)

- **D-PIN2-1** (`siege_tactics_loop.rs`, `ProdPending::morale_before`, `complete`): morale z aktywacji zapisywane tylko,
  gdy aktywacja je zmieniła (okrążenie), a stan sterownika w oknie start..complete NIE zmienił morale; aktywacja bez
  zmiany morale zostawia wartość sterownika (trafienia wież); obie zmiany naraz = jawny tag `morale-konflikt-zegara`
  (konwencja `ucieczka-konflikt-zegara`, wartość sterownika). Uzasadnienie: pin `:6103-6117`, `:9722-9735`, brak
  przywracania morale w `done()`. Mutanty P01 (stara reguła) / P02 (okrążenie gubione) — §5.
- **D-PIN2-2** (B-WIRA-PIN-2): wybrano drogę **(b) FRAME-QUANT jako osobny temat**; droga (a) „oracle = pin @2 ms”
  ODRZUCONA, bo @2 ms NIE jest modelem produkcyjnym: pin przewija krokami `FF_STEP_MS = BATTLE_FRAME_WALL_MS = 16`
  (`:2552`, `:9419`), a AUTO czasu rzeczywistego jedzie klatkami rAF (~16 ms); obrona r2 zmierzyła @16 skip = @16 rt.
  W tym temacie: jawny, zmierzony wyjątek z testem pilnującym — `mur_jazda_rzeka` (@16) zostaje na liście
  `ROZBIEZNE_B_WIRA_PIN_2`, a test wymaga bliźniaka `mur_jazda_rzeka_klatka1` (@1 ms) zgodnego bajt w bajt, z tym samym
  wejściem i ziarnem. Rust jest więc zgodny z pinem w granicy klatki; jedyna różnica to kwantyzacja klatki 16 ms
  (remis t. 70: cios `localT >= 150` → klatka t0+160, pocisk wieży `due` t0+156 → ta sama klatka, `_drainTimers` przed
  `_raf`). Zakres FRAME-QUANT: kwantyzacja chwil kroków animacji (`_raf`) do siatki 16 ms jako parametr sesji;
  kryterium: `mur_jazda_rzeka` @16 bajt w bajt + 12 kandydatów z §4.3 (rozbieżnych tylko @16).
- **D-PIN2-3** (generator): pole scenariusza `ffStepMs` (tylko `skip`, tylko bliźniak `_klatka1` — pilnuje test
  `vectors()`), tryb kandydatów `WIRING_A_EXTRA`/`WIRING_A_OUT` (nie zapisuje do katalogu wektorów), ślad morale,
  `WIRING_A_FF_STEP`, `WIRING_A_STOP_ROUND`, `WIRING_A_DUMP_TERRAIN` — wszystko tylko w trybie śladu/kandydatów.

## 4. Pomiar na losowych kandydatach (293 bitwy pinu, `WIRING_A_EXTRA`)

| Partia | Treść | Zgodne @16 bajt w bajt |
|---|---|---|
| c1 (128) | 4 światy × 4 składy ataku (łucznicy, jazda, mieszany, z machinami) × 4 obrony × mury+baszta / palisada | **105** |
| c2 (72) | bez machin (sufit 150), 9–12 obrońców, 3–8 łuczników atakujących, jazda | **72** |
| c3 (96) | obrońcy konni-strzelcy za murem (Konnica łucznicza, Rydwan egipski, Jeździec z oszczepami), jazda atakująca | **96** |

### 4.1 Mutant B03 (trafienie strzału o `RANGED_GAP_MS` później)
Zabity przez 12 zgodnych kandydatów c1. Do wektorów wzięte 3 (różne światy/fortyfikacje):
`b03_las_lucznicy_mury_baszta`, `b03_wzgorza_palisada_katapulta` (dodatkowo: wyłom + sufit 400 bajt w bajt przy
klatce 16 ms — pierwsze pokrycie gałęzi FF_MAX_ROUNDS z wyłomem modelem produkcyjnym), `b03_gory_lucznicy_mury_baszta`.

### 4.2 Mutanty B06/B07 — 0 zabić na 273 zgodnych kandydatach
Analiza pinu (§1): przed pierwszym wyłomem (jedyne okno `_siegeShooterThreats`) obrońcy murowi nie zmieniają pola
(`:6125-6168`), korona zmienia się tylko przy wyburzeniu kafla (`:7739`), a wtedy `_siegeApproachRestricted` jest już
fałszem → B06 i B07 nie zmieniają WYNIKU bitwy w AUTO dla żadnego z 293 scenariuszy.
- **B07** zabity TESTEM niezmiennika pinu (`zejscie_z_korony_od_razu_przelicza_zasieg`): w kroku zejścia strzelca z
  korony jego `range` = `apply_terrain_range` bez korony na nowym kaflu (`:7740`); 2 nowe wektory z zejściem przy życiu:
  `b07_las_katapulta_zejscie_z_korony` (d2), `b07_wzgorza_katapulta_zejscie_z_korony` (d4); test wymaga >= 1 zejścia.
- **B06** — BRAK wektora i testu rozróżniającego (dług, §8): jedyna teoretyczna droga to obrońca-strzelec spoza korony
  (konny, `:4735-4741`, bez `_applyTerrainRange` przy rozstawieniu) zmieniający kafel z Δ ≠ 0 przed wyłomem, gdy
  związany atakujący jest w strefie ostrzału; 96 kandydatów c3 celowanych w ten przypadek: 0 zabić.

### 4.3 NOWE rozbieżności (poza zakresem, dług — nie były znane)
23 z 128 kandydatów c1 rozbieżnych @16. Ponownie z krokiem pinu 1 ms: **12 zgodnych** (sama kwantyzacja klatki →
FRAME-QUANT), **11 rozbieżnych** także @1 ms i @0,25 ms (wyniki identyczne @1/@0,25 → realne różnice logiki Rust, NIE
zmierzone przyczynowo w tym temacie): `k_las_jazda_d6l_mury_111`, `k_las_mix_d3l_palisada_118`, `k_las_mix_d6l_palisada_120`,
`k_las_mix_d5_mury_123`, `k_las_lucz2_d5_palisada_132`, `k_wzg_mix_d5_palisada_156`, `k_gory_lucz2_d3l_palisada_190`,
`k_gory_lucz2_d5_palisada_196`, `k_rown_mix_d8l_mury_217`, `k_rown_mix_d8l_palisada_218`, `k_rown_lucz2_d3l_mury_221`.
Wspólny mianownik większości: jazda atakująca (`mix`, `jazda`) lub palisada z taranem. Definicje scenariuszy:
generator `mk.py` (seed 100+i, kolejność iloczynu world×atk×def×built) — odtwarzalne; proponowany temat następczy
`R-RUSTPORT-P6-K5LOOP-PIN3-PROBE` (ta sama metoda: ślad pin @1 ms vs Rust, pierwsze zdarzenie rozjazdu).

## 5. Mutanty (`01-operator-r1-mutanty.py`, test `cargo test --release --test p6_k5loop_wiring_a_pin`)

Baza EXIT 0; źródła przywrócone po każdym mutancie (`git status` czysty po przebiegu). **4/5 ZABITYCH testem.**

| Mutant | Wynik | Czym zabity |
|---|---|---|
| B03 trafienie strzału na końcu (FLY+GAP) | ZABITY | wektory `b03_*` (3 scenariusze) |
| B06 `_siegeShooterThreats` bez `_applyTerrainRange` | **PRZEŻYŁ** | brak wektora/testu rozróżniającego (§4.2; 0/273 kandydatów) — dług |
| B07 zejście z korony bez `_applyTerrainRange` | ZABITY | test `zejscie_z_korony_od_razu_przelicza_zasieg` na wektorach `b07_*` |
| P01 `complete`: morale bezwarunkowo z `start` (stan sprzed D-PIN2-1) | ZABITY | `mur_jazda_rzeka_klatka1` (+ złoty skrót `p6_k5loop_wiring_a`) |
| P02 `complete`: morale z aktywacji nigdy (okrążenie gubione) | ZABITY | wektory pinu (okrążenie występuje w wektorach) |

## 6. Zmiany (allowlista)

| Plik | Zmiana |
|---|---|
| `engine/src/domain/siege_tactics_loop.rs` | D-PIN2-1: `ProdPending::morale_before`; `complete` nie cofa morale zmienionego przez sterownik; tag `morale-konflikt-zegara`. |
| `engine/tests/p6_k5loop_wiring_a_gen.mjs` | 6 nowych scenariuszy (`mur_jazda_rzeka_klatka1`, 3 × `b03_*`, 2 × `b07_*`), `ffStepMs`, tryb kandydatów, ślad morale, diagnostyka (§3 D-PIN2-3). |
| `engine/tests/p6_k5loop_wiring_a_pin.rs` | `ROZBIEZNE_B_WIRA_PIN_2` + wymóg bliźniaka `_klatka1`; strażnik `frameMs`; test `zejscie_z_korony_od_razu_przelicza_zasieg`; `kandydaci_z_pliku_na_zadanie`; ślad z krokiem i zrzutem morale. |
| `engine/tests/p6_k5loop_wiring_a_pin_vectors/vectors.json` | 8 → 14 wektorów (8 dawnych bez zmian bajtowych). |
| `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5LOOP-PIN2-PROBE-Q1/` | ten raport, skrypt mutantów. |

Nie ruszano: `siege_battle_session.rs` (nie było potrzeby), `p6_k5loop_wiring_a.rs`, `bridge.rs`, `renderer/`, `gra/**`,
`Cargo.*`, `REJESTR-RUST.md`. Brak `#[ignore]`.

## 7. Testy / bramki

`CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie (usunięty
po bramkach; dysk po: 11 GB wolne). Pełny test w tle (`setsid nohup`, EXIT w logu), kod końcowy (c8ac1b655 + raport).

| Bramka | Wynik |
|---|---|
| `cargo fmt --all -- --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 (dwukrotnie: po zmianach testów i na kodzie końcowym) |
| `p6_k5loop_wiring_a_pin` | 5/5 ok: wektory 13/14 bajt w bajt + `mur_jazda_rzeka` jawna (bliźniak `_klatka1` zgodny), pokrycie, zejście z korony (d2, d4) |
| `p6_k5loop_wiring_a` | 22/22 ok (złoty skrót zaktualizowany: `9b17cd8895ee7c0b` → `3ca52823eb0e4d81`, przyczyna D-PIN2-1 — przy pierwszym pełnym przebiegu PRZED aktualizacją test padał właśnie na tym skrócie, wszystkie inne cele zielone) |
| `p6_k5loop_tags_rest`, `p6_k5loop_adapter`, `p6_k5loop_siege_atk_a/_b/_def`, `p6_battle_setup`, `p6_battle_setup_units`, `bridge_contract` | wszystkie ok (5, 27, 8, 10, 10, 15, 7, 9) |
| `cargo test --all-targets --no-fail-fast` (kod końcowy) | **FULL_EXIT=0**: 547 × `test result: ok`, 4155 passed / 0 failed / 1 ignored (istniejący, spoza diffu) |
| Generator (pełna regeneracja, dwukrotnie) | EXIT 0, strażnik SHA-256 tekstu pinu przeszedł; `vectors.json` MD5 **`7048c640aa6aeba3e148d0aca4e2f164`**, `pin_data.json` MD5 `432eed76e34a0e8cc96ec548e88eae64` (bez zmian) — odtworzone identycznie; 8 dawnych rekordów wektorów identycznych z bazą (porównanie JSON) |
| Mutanty (§5) | 4/5 zabitych (B03, B07, P01, P02); B06 przeżył |
| `git diff --check 2e5bf370a` | czysto |
| `#[ignore]` w diffie / `Co-Authored-By` w commitach | brak / brak |

## 8. Długi

| ID | Stan |
|---|---|
| B-WIRA-PIN-2 / FRAME-QUANT | jawny wyjątek z testem bliźniaka (D-PIN2-2); temat następczy: kwantyzacja kroków `_raf` do klatki 16 ms; kryterium: `mur_jazda_rzeka` @16 + 12 kandydatów c1 rozbieżnych tylko @16 |
| B-WIRA-PIN-3 (nowe, §4.3) | 11/128 kandydatów c1 rozbieżnych także w granicy klatki — realne różnice logiki, przyczyny NIE_ZMIERZONO |
| B06 | bez wektora/testu rozróżniającego; 0/273 zabić; argument pinu §4.2 |
| `morale-konflikt-zegara` | jednoczesna zmiana morale przez okrążenie (start) i sterownik (wieża w oknie start..complete): wartość sterownika + tag; dokładna kolejność pinu (okrążenie przed trafieniem) NIE_ZMIERZONO na wektorze (w 14 wektorach tag nie występuje — `unported` puste) |
| pozostałe (FC WIRING-A r2 §4) | bez zmian |

## 9. Commity (gałąź `rust-port-wip/k5loop-pin2-probe-q1-r1`, nad `2e5bf370a`)

| SHA | Treść |
|---|---|
| `9c641aefb` | sonda (ślad pinu z krokiem FF, zrzut morale Rust) + D-PIN2-1 |
| `434035195` | wektory `_klatka1`, 3 × B03, 2 × B07; test bliźniaka i zejścia z korony; kandydaci z pliku; skrypt mutantów |
| `c8ac1b655` | złoty skrót sesji po D-PIN2-1; generatory kandydatów c1–c3 |
| (commit raportu) | ten raport — SHA końcowy podaje wynik Workflow |

## 10. Kryteria końca dispatchu

| Kryterium | Stan |
|---|---|
| Raport z pomiarem sondy (ślady pin vs Rust) | spełnione (§2: ślad morale a0 t. 72–86 pin @1 ms vs Rust; przyczyna znaleziona i naprawiona) |
| `mur_jazda_rzeka` bajt w bajt albo jawny, zmierzony wyjątek z testem pilnującym | spełnione drogą wyjątku: rozbieżność @16 ms wyłącznie z kwantyzacji klatki (D-PIN2-2), test wymaga bliźniaka @1 ms bajt w bajt |
| >= 3 nowe scenariusze zabijające B03/B06/B07 | 5 nowych scenariuszy: 3 zabijają B03 (wektorami), 2 zasilają test zabijający B07; **B06 bez zabójcy** (dług, §4.2) |
| Dotychczasowe 7 scenariuszy bajt w bajt | spełnione (+ 6 nowych zgodnych) |
| MD5 generatora odtwarzalne | spełnione (2 regeneracje, identyczne MD5) |
