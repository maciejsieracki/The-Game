# R-RUSTPORT-P6-K5LOOP-WIRING-A-Q1 — Operator r2

```text
STATUS: W TOKU (raport wczesny, uzupełniany)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-WIRING-A-Q1 (#369 część A)
GOAL r2: generator TS wykonujący tekst pinu 07d2fbd72 dla PEŁNEJ bitwy AUTO z murem + wektory (≥ 6 scenariuszy) + test Rust bajt w bajt
BAZA: origin/rust-port-wip/k5loop-wiring-a-q1-fc @ 43ecdb162 (DODATEK r2)
GAŁĄŹ: rust-port-wip/k5loop-wiring-a-q1-r2
RUNDY: 2/5
DEPLOY/PUSH: NIE WYKONANO
```

## 1. Droga (najkrótsza)

Generator `rust-port/engine/tests/p6_k5loop_wiring_a_gen.mjs` wykonuje CAŁY moduł `battleScene.ts` pinu z drzewem
importów (mechanizm ładowania jak `p6_k5loop_adapter_gen.mjs`), z atrapą wyłącznie renderu/DOM/audio (THREE, document,
window, zasoby) i jedną podmianą tekstu: rzut `_singleBlow` `:8960` na LCG `domain/rng.rs` (D-WIR-5). Klatki
`requestAnimationFrame` prowadzi sterownik (16 ms). Logika bitwy (konstruktor, tury, zegary, przewijanie, cios, mur,
wieże, sufit) = tekst pinu bez atrap.

(uzupełniane)
