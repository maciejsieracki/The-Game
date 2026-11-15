# 01 — Operator, runda 1 — R-RUSTPORT-P4-1C-FOG-ROZP-Q1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1C-FOG-ROZP-Q1 (rozpoznanie P4-1C / #212, tylko odczyt)
GOAL: Rozpoznanie producenta `FogViewDto` z `compute_player_visibility`: co web przekazuje do `setFog`, co ma Rust, luki i podział na wdrożenia.
ZMIANY/COMMIT: `dyspozycje/rust-port/p4/P4-1C-FOG-ROZPOZNANIE.md` (NOWY), ten raport. Zero zmian kodu. Gałąź robocza `op/R-RUSTPORT-P4-1C-FOG-ROZP-Q1` od bazy `origin/rust-port/parity-v2` = `83f5fd6548c1d2e3d84795ea15fa9bb1ff044e01`. SHA commitu: podany w odpowiedzi Operatora (commit zawiera ten plik, więc SHA nie może być wpisany w niego samego).
TESTY: nie dotyczy (zero kodu, bez `cargo`). `git diff --check` czysty; dodane wyłącznie 2 pliki z allowlisty.
BLOKADY: brak dla rozpoznania. Dla wdrożenia: brak `explored` per fotel i heksu startu per fotel w `PlayableState`, brak pól `landReveal`/`riverReveal` w `FogViewDto` (zmiana kontraktu §3.3, `CONTRACT_VERSION`), zależność od kolejności `map.hexes` z P4-1B.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator r1.
DEPLOY/PUSH: NIE WYKONANO

## Kryteria końca

| Kryterium | Gdzie |
|---|---|
| 1. Tabela wejście pinu → znaczenie → Rust / BRAK / ROZBIEŻNE | dokument §1.1–§1.4 |
| 2. Pola `FogViewDto` z wejściami z modelu | dokument §2 |
| 3. Podział na wdrożenia (nazwa, allowlista, wektory), bez wdrażania | dokument §3 (W1 stan, W2 zapisy odkrycia, W3 producent, W4 część P4-1G) |
| 4. Niepewne jako NIE_ZMIERZONO | dokument §4 (6 pozycji) |

## Najważniejsze ustalenia

1. `FogViewDto { state }` nie wystarcza: web przekazuje też `landReveal` (tafla oceanu, LOD dekoru, `scene.ts:3548`, `:3643-3655`) i `riverRevealKeys` (rzeki w kręgu startu, `riverLod.ts:359-377`; `None` ≠ pusty zbiór).
2. `compute_player_visibility` w Rust ma fallback startu w środku; web (`main.ts:13007-13045`) stosuje go dopiero po unii z sojusznikami. Domyślny promień w Rust (5) ≠ promień gry z trudności (8 dla normal, `main.ts:3033`).
3. Web dopisuje `explored` w `refreshFog` (ścieżka renderu) i w 5 innych miejscach; w Rust trzeba to przenieść do silnika (W2), bo producent widoku ma być czysty.
4. `viewer.fogActive` wystarcza zamiast `useFogRender`: w pinie zawsze `revealAllLand ⇒ fogOn` (wszystkie przypisania zebrane w §1.1).

## Polecenia

Wg dokumentu §5. Baza: `git fetch origin rust-port/parity-v2 && git checkout -b op/R-RUSTPORT-P4-1C-FOG-ROZP-Q1 origin/rust-port/parity-v2`.
