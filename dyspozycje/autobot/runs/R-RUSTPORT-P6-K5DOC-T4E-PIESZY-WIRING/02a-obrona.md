# 02a-obrona — R-RUSTPORT-P6-K5DOC-T4E-PIESZY-WIRING (Operator, obrona, runda 1)

STATUS: BLOCK (potwierdzony; bez zmian w kodzie)
DOMAIN: GAME (Rust, engine)
TEMAT: R-RUSTPORT-P6-K5DOC-T4E-PIESZY-WIRING
GOAL: wpięcie ruchu pieszego (advance_step_decide -> do_move_effects) w ProdBody
ZMIANY/COMMIT: brak zmian w kodzie. Commit tylko z tym plikiem obrony (SHA w sekcji „Wynik”).
BAZA: `origin/rust-port/parity-v2` = `760be518775254a030ca252d7b43bba667689050` (wg dispatchu)
RUNDY: 1/5 (obrona r1, bez DODATKU r2)

## Uwaga o bazie worktree (rozbieżność z dispatchem)

Worktree tej rundy jest odłączony (detached) na `d44d5b982` (`ROBOCZA 2bff7522`), a nie na `760be5187`.
Nie przełączałem go, bo runda obrony nie wprowadza kodu, a dispatch każe bazę traktować jako jedyną.
Wszystkie wskazania kodu poniżej sprawdzono przez `git show origin/rust-port/parity-v2:...` (czyli na `760be5187`).
Orkiestrator powinien przy DODATKU r2 podać, czy worktree ma być przełączony na `760be5187`.

## Odpowiedzi na zarzuty

### Zarzut 1 — Brak dostarczonego kodu (kryteria końca 1–2 niespełnione)
**PRZYJMUJĘ.** Potwierdzam fakt: operator nie dostarczył wiringu, wektorów, testu end-to-end, mutacji ani commitu kodu.
Dowód: commit operatora `71df05d55` zmienia wyłącznie `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5DOC-T4E-PIESZY-WIRING/01-operator-r1.md` (42 wiersze dodane, 1 plik).
Poprawka w tej rundzie: niemożliwa bez rozstrzygnięć technicznych D1–D4 (patrz zarzuty 2–5). Pisanie wiringu „na zgadywanie” naruszyłoby regułę 8 (decyzje techniczne należą do orkiestratora).
Bramki (fmt, clippy, test p6_k5doc_t4e, all-targets, mutacje a/b/c) NIE uruchomione — nie ma zmian do sprawdzenia.

### Zarzut 2 — BLOK D1: brak danych terenu w ProdBody
**PRZYJMUJĘ (potwierdzone w kodzie).**
- `siege_tactics_move_effects.rs:41–53`: trait `MoveWorld` wymaga `occ_mut()`, `move_cost(col,row)`, `is_ford(col,row)`, `update_facing(unit_id)`.
- `siege_tactics_loop.rs:1092–1110`: struct `ProdBody<R>` ma pola `units`, `scene`, `rolls`, `unported`, `trace`, `blows`, `engaged`, `counters`, `budżet kontrataków` — żadnego pola terenu, mnożnika kawalerii ani `isFord`.
- `siege_tactics_loop.rs:1148`: `ProdBody::new(units, scene, rolls)` — brak wejścia terenu.
- NIE_ZMIERZONO: pełnej zawartości `ActivateScene` nie przeczytałem w całości; operator twierdzi, że też nie ma tam danych terenu. Do potwierdzenia przed DODATKIEM r2.

### Zarzut 3 — BLOK D3: właściciel occByKey
**PRZYJMUJĘ (potwierdzone).**
`git grep occByKey` w `rust-port/engine/src` na `760be5187`: w `siege_tactics_loop.rs` tylko dwa trafienia, oba w komentarzach: linia 961 („brak konsumenta w ProdBody”) i linia 1817 („Nieportowane: occByKey”). `ProdBody` nie ma pola zajętości. Pozostałe trafienia (`autobatch`, `approach`, `kite`, `cavalry`) to wejścia jawne predykatów, nie stan ProdBody.

### Zarzut 4 — BLOK D2: czas kroku (`_advanceStep` łączy kroki przez STEP_GAP_MS)
**PRZYJMUJĘ (zweryfikowane częściowo).**
Pin `07d2fbd72`, `gra/src/battle/battleScene.ts`: `STEP_GAP_MS = 70` (linia 1011); w `_advanceStep` kroki są łączone przez `this._schedule(STEP_GAP_MS, () => this._advanceStep(ru, done))` w liniach ok. 8225 i 8280 (odpowiednio offset 28 i 83 od linii 8198).
NIE_ZMIERZONO: `LoopBody::fire` (`siege_tactics_loop.rs:797–803`) nie został przeze mnie ponownie przeczytany; wniosek o jednym `BodyDone(u)` na aktywację przyjmuję z raportu operatora.
Uwaga: dispatch wskazywał pin `battleScene.ts:8198–8285`, zgodnie z tym sprawdzonym zakresem.

### Zarzut 5 — Decyzje techniczne należą do orkiestratora (reguła 8)
**PRZYJMUJĘ.** Zgadzam się, że D1–D4 i rekomendacje operatora (trait `MoveTerrain` z domyślnym `None`, `move_ms` w adapterze, `occByKey` jako pole `ProdBody`, podział na T4e-0/T4e-1) są propozycjami, a nie decyzjami operatora.
Dispatch częściowo rozstrzyga D2 wyłącznie co do kosztu per jednostka (`mounted`); reszta pozostaje otwarta.
Rekomendacje przekazuję do orkiestratora jako wejście do DODATKU r2, bez ich przyjęcia w tej rundzie.

### Zarzut 6 — Infra: wolne miejsce poniżej progu 8 GB
**PRZYJMUJĘ.** Pomiar `df -h /` przy obronie: **5,9 GB wolne** (85% zajęte). Na starcie operatora było 8,8 GB, po jego rundzie 7,4 GB, teraz 5,9 GB. Jest to poniżej progu 8 GB z dispatchu i poniżej progu 8 GB z zasady 5/7 w CLAUDE.md.
Nie usuwałem niczego: nie znam bezpiecznie stanu cudzych worktrees i targetów (reguła 4: sprawdzić `/proc/<pid>/cwd` i `CARGO_TARGET_DIR`), a w tej rundzie nie ma własnego targetu do usunięcia. Mój worktree jest czysty przed zapisem tego pliku.
Efekt: kolejna runda Operatora nie może ruszyć, dopóki wolne miejsce nie przekroczy 8 GB; przed DODATKIEM r2 orkiestrator musi posprzątać dysk zgodnie z regułą 4.

## Wnioski dla orkiestratora (do DODATKU r2)

1. Rozstrzygnąć D1 (źródło danych terenu dla `ProdBody`), D2 (czas kroku wobec pojedynczego `BodyDone`), D3 (właściciel `occByKey`), D4 (zakres generatora wektorów T4e).
2. Rozważyć podział na T4e-0 (wiring bez zależności od sceny) i T4e-1 (pełny `_advanceStep`), jak rekomendował operator.
3. Przełączyć worktree na bazę `760be5187` (zgodnie z dispatchem) albo potwierdzić inną bazę.
4. Posprzątać dysk do ≥ 8 GB przed startem r2.

## Wynik

- Werdykt obrony: BLOCK potwierdzony, bez poprawki kodu; 6 z 6 zarzutów przyjętych, żaden nie odrzucony.
- Bramki: NIE_ZMIERZONO (brak zmian; infra poniżej progu).
- Wolne miejsce na dysku w chwili obrony: 5,9 GB.
- Push: NIE WYKONANO.
