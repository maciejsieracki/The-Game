STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1D-UNIT-ROZP-Q1
GOAL: Rozpoznanie (tylko odczyt) producentów UnitViewDto/StackViewDto (#213, compute_stack_display): tabela pin → Rust, lista pól DTO, propozycja podziału, NIE_ZMIERZONO.
ZMIANY/COMMIT: ocena c6aad20a190f211b57142715e0711b6128efab69 (Obrona r1) + ten raport. Baza 83f5fd6548c1d2e3d84795ea15fa9bb1ff044e01 (origin/rust-port/parity-v2 przy starcie) jest przodkiem (`git merge-base --is-ancestor` OK). Łańcuch: 83f5fd654 → 2c78fa153 (Operator) → 2e04178ff (Evaluator) → c6aad20a1 (Obrona) → commit FC.
TESTY: `git diff --stat 83f5fd654 c6aad20a1` = 4 pliki, wyłącznie z allowlisty (`dyspozycje/rust-port/p4/P4-1D-UNIT-ROZPOZNANIE.md` NOWY, `dyspozycje/autobot/runs/R-RUSTPORT-P4-1D-UNIT-ROZP-Q1/{01-operator-r1,02-evaluator,02a-obrona}.md`); `git diff --check` czysto. Cargo nie uruchamiano: zero zmian kodu (dispatch: tylko odczyt), bramka kodu nie dotyczy. Brak zmian w `gra/`, `Cargo.lock`, kodzie Rust.
BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora (dokument rozpoznania) i dispatch Q1–Q4 wg §3 dokumentu.
DEPLOY/PUSH: NIE WYKONANO

## Orzeczenia (zweryfikowane samodzielnie na pinie 07d2fbd72, `git show 07d2fbd72:gra/src/main.ts`, `render/units.ts`)

1. forceVisibleUnitId else-if — zarzut zasadny, w c6aad20a1 NAPRAWIONY → ODDAL (brak zaległości).
   Dowód: main.ts:14513-14517 `if (anim?.movingStackIds?.length) {…} else if (forceVisibleUnitId) {…}`; main.ts:14550 `setForceVisibleUnitId` bezwarunkowo; render/units.ts:6275 `show = visible.has(unit.id) || unit.id === this.forceVisibleUnitId`. Dokument: §0 pkt 5, §2.1 (luka kontraktu §3.5 i skutek braku ikon cierpienia z pętli :14528), §2.2 `visibleIds`, Q4 z wektorem „animacja + forceVisible ≠ animowany” i „forceVisible bez animacji”, §4 pozycja przekreślona jako ROZSTRZYGNIĘTE.

2. Normalizacja HP syncAllRuntimeUnitHpState — zarzut zasadny, NAPRAWIONY → ODDAL.
   Dowód: main.ts:14445 wywołanie; :33101-33106 effectiveRuntimeUnitMaxHp; :33110-33118 hpMax := max efektywne, hp undefined pozostaje, hp skończone przycięte do [0,hpMax], nieskończone/NaN → hpMax; :33120-33122 pętla po wszystkich `units`. Dokument: §0 pkt 6, wiersz 15a, §2.1 hp/hpMax, zakres i wektory Q4; dwie nowe pozycje NIE_ZMIERZONO (hp undefined vs `UnitViewDto.hp: f64`; hpMaxEffective vs effectiveRuntimeUnitMaxHp) — poprawnie oznaczone, nie są brakiem rozpoznania.

3. Trzy źródła listy — zarzut zasadny, NAPRAWIONY → ODDAL.
   Dowód: main.ts:14452 `list ?? (fogOn ? visibleUnitsList(sharedVis!) : units)`. Uściślenie Obrony potwierdzone: wywołania z argumentem tylko :13502 (`visibleUnitsList(vis)`) i :13511 (`visibleUnitsList(ALL_KEYS)`); `syncUnitsRender()` bez argumentu — 63 wystąpienia (zmierzone `grep -c`). Dokument: §0 pkt 7, wiersze #15/#16, Q4 z wariantami ExplicitList / Fog / NoFog, każdy z wektorem.

Zarzuty NAPRAWIAJ: 0. DO DECYZJI CZŁOWIEKA: 0 (rozstrzygnięcia luki kontraktu §3.5 i trybu normalizacji HP są technikalne — zasada 9, zapis w REJESTR-RUST.md przy Q4).

## Uwaga informacyjna (nie zarzut)
Od startu tematu `origin/rust-port/parity-v2` przesunęło się do c3e3617b2; temat zmienia wyłącznie nowe pliki dokumentacyjne, więc integracja nie powinna kolidować — do potwierdzenia merge-tree przez orkiestratora.
