# R-RUSTPORT-P6-K5LOOP-WIRING-A-Q1 — Operator r1 (raport roboczy, uzupełniany)

```text
STATUS: W TOKU (raport wczesny)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5LOOP-WIRING-A-Q1
GOAL: SiegeBattleSession (start/step/skip/finish) nad SiegeLoop+ProdBody z adaptera T6 i pola T5
BAZA: origin/rust-port/parity-v2 = 32006733ba65bb22ff7776b104d1afb329841491
GAŁĄŹ: rust-port-wip/k5loop-wiring-a-q1
```

Ustalenia wstępne (pin 07d2fbd72):
- R5: `_updateStallWatch` (`battleScene.ts:5568-5571`) w oblężeniu wraca od razu (`siegeWallCol >= 0`), więc w czasie
  rzeczywistym NIE ma licznika PAT; sufit tur `_roundCapVerdict` (`:9449-9465`) jest wspólny dla `_checkEnd` (czas
  rzeczywisty i AUTO) i `_runFastForward` (`:9424`). W Rust: `siege_tactics_endcheck.rs:229` (`round_cap_verdict` w
  `_checkEnd`) + `FfHost::round_cap` w przewijaniu.
