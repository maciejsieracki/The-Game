# R-RUSTPORT-P4-371-T2-CLIENT-CORE-E2E — Obrona Operatora (r1)

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-371-T2-CLIENT-CORE-E2E
GOAL: crate civ-client (stan UI + reguła odświeżania + cache DTO + MapScene) i test e2e engine → most → adapter → renderer CPU
ZMIANY/COMMIT: rust-port/client/tests/engine_bridge_renderer.rs (+3 testy, FaultySource), ten raport;
       baza = 390770fa4 (raport Evaluatora) ← 23476e97c (Operator r1) ← e4ffbc342 (parity-v2); src/lib.rs BEZ zmian
TESTY: w rust-port/client: generate-lockfile 0 (Cargo.lock bajtowo identyczny), fmt --check 0,
       clippy --locked --all-targets -D warnings 0, test --locked --all-targets 0 (8 passed / 0 failed / 0 ignored);
       mutanty Evaluatora E1, E6, E7: 3/3 ZABITE
BLOKADY: brak
RUNDY: 1/5 (obrona po Evaluatorze r1)
NASTĘPNY KROK: Final Control
DEPLOY/PUSH: NIE WYKONANO
```

Wolny dysk przed bramką: 13 GB, brak innego buildu (bramkę uruchomiono dopiero po zakończeniu testu siegedef i spadku
zajętości; przy 8,6 GB czekano). `CARGO_TARGET_DIR` = scratchpad `t2client-obr/target` (usunięty po bramkach).
Allowlista: zmieniony wyłącznie `rust-port/client/tests/**` i ten raport. Brak `#[ignore]`.

## Odpowiedzi na zarzuty

### Z1 (E1: `MapScene::new` przy każdej ramce) — PRZYJMUJĘ

Poprawka: test `scene_is_built_once_per_session_and_keeps_caller_state`. Po pierwszej ramce wołający ustawia przez
`scene_mut().units_mut()` resolvery z DŁUG-T1-RESOLVERS (`set_ring_stance_resolver(|_| Neutral)`,
`set_owner_color_fn(|_| 0x123456)`; pin `setRingStanceResolver`/`setOwnerColorFn`, `units.ts:5884-5891`). Asercja na żetonie
wojownika (`ring_stance`, `overlays.plate_vitals.owner_color`) po każdej ścieżce do `present_ref`:
`on_state_changed` po `SelectUnit`, `set_frame_ui`, `set_map_ui`, `set_siege_map_panel_open`, `AdvanceTurn`. Odbudowana
scena wraca do `default_ring_stance` / `default_owner_color` — test to sprawdza (wartości domyślne ≠ ustawione). Dodatkowo:
nowa sesja (`on_session_created`) ma znów wartości domyślne (scena odrzucona zgodnie z dokumentacją).
Dowód: mutant E1 (`self.scene.insert(MapScene::new(..))`) → `scene_is_built_once_per_session_and_keeps_caller_state ... FAILED`.

### Z2 (E6: cache zapisany przed `present_ref`; brak testu zachowania poprzedniej ramki) — PRZYJMUJĘ

Poprawka: `FaultySource` (opakowanie prawdziwego mostu z wstrzykiwanym błędem) i test
`errors_after_a_frame_keep_the_previous_frame`: dobra ramka → zmiana stanu (`SelectUnit` + `MoveUnit` wojownika, więc
nowa ramka różniłaby się) → trzy błędy po kolei:
- `ClientError::Source` (nieznany fotel 99, błąd mostu),
- `ClientError::Frame(FrameError::ContractVersion { expected: 2, actual: 3 })` (prawdziwa ramka z innym `contract_version`),
- `ClientError::Frame(FrameError::View(_))` (`fog.state` krótszy od `map.hexes`).

Po każdym: `last_frame()` == dobra ramka, `frame_inputs()` == wejścia dobrej ramki, żeton wojownika na starym heksie.
Następnie `set_map_ui` składa ramkę z cache bez wołania silnika (licznik) i nadal na dobrej ramce; powrót do `Fault::None`
→ nowa ramka zastępuje cache, wojownik na heksie docelowym (w DTO i w scenie).
Dowód: mutant E6 (zapis `self.frame` przed `present_ref`) → `errors_after_a_frame_keep_the_previous_frame ... FAILED`.

### Z3 (E7: `MapDetailQuality` bez asercji) — PRZYJMUJĘ

Poprawka: test `detail_quality_reaches_the_terrain`: dla `Low` i `High` teren sceny klienta == teren sceny zbudowanej ręcznie
(`MapScene::new(map, inputs, detail)` + `apply(inputs)`, bo mgła zmienia pryzmaty), `roblox_lite` == `roblox_lite(detail, hexes)`
(pin `mapRenderStyle.ts:114-127`); mapa startowa ≤ `LARGE_MAP_LITE_HEX_THRESHOLD`, więc `Low` = lite, `High` ≠ lite i tereny
różne. Dowód: mutant E7 (stałe `High`) → `detail_quality_reaches_the_terrain ... FAILED`.

### Uwaga E8 (`VIEWER_SEAT = Some(1)` równoważny) — PRZYJMUJĘ jako dług, bez zmiany kodu

Zgadzam się z analizą: most ma jeden fotel ludzki i nie ma komendy zmiany aktywnego fotela, więc mutant jest dziś
nierozróżnialny. Decyzja `VIEWER_SEAT = None` (= `ME()`, aktywny fotel) zostaje, bo pin ma hot-seat
(`isHotSeat`, `main.ts:26699`). Nowy dług: **DŁUG-T2-HOTSEAT-SEAT** — test zmiany aktywnego fotela po dodaniu do mostu
komendy przełączenia fotela (hot-seat); wtedy asercja `assert_active_seat_frame` dla fotela 2.

### Uwaga: pełny test engine NIE WYKONANO — PRZYJMUJĘ (bez sprzeciwu)

Diff w `rust-port/engine` jest pusty także po obronie; dispatch wymienia bramki tylko w `rust-port/client`. Engine (lib +
`bridge.rs` przez `#[path]`) kompiluje się i działa w teście klienta (8/8, w tym 2 testy jednostkowe `bridge.rs`).

## Mutanty (scratchpad `t2client-obr/mut/{mutate.py,run.sh}`, logi `E1.log`, `E6.log`, `E7.log`)

| ID | Mutacja w `src/lib.rs` | Wynik | Test |
|---|---|---|---|
| E1 | `self.scene.insert(MapScene::new(map, &inputs, detail))` | ZABITY | `scene_is_built_once_per_session_and_keeps_caller_state` |
| E6 | `self.frame = Some(frame.clone())` przed `present_ref` | ZABITY | `errors_after_a_frame_keep_the_previous_frame` |
| E7 | `let detail = MapDetailQuality::High;` | ZABITY | `detail_quality_reaches_the_terrain` |

`src/lib.rs` przywrócony po mutantach (`git status`: zmieniony tylko plik testu). Mutanty a–e z dispatchu: testy, które je
zabijały, nie zostały zmienione (dopisano tylko nowe testy).

## Długi

Bez zmian względem Operatora i Evaluatora: DŁUG-T1-NOT-SYNCED, DŁUG-T1-RESOLVERS (teraz z testem trwałości stanu ustawionego
przez `scene_mut()`), DŁUG-T2-CITIES-E2E, DŁUG-T2-FRAME-TIME (NIE_ZMIERZONO), DŁUG-T2-PARTIAL-SCENE, DŁUG-T1-LOCK, brak CI
`rust-client.yml`; dopisany **DŁUG-T2-HOTSEAT-SEAT** (E8).
