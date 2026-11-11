# Plan portu Rust — aktualizacja 2026-11-11 (wznowienie pracy nad Rust)

Źródła: `LEDGER.md` (ostatni wpis 2026-11-09), `PLAN-PORT-RUST-TAURI-20261020.md` §0a–0c (stan 2026-11-07), `git log origin/rust-port/parity-v2`, `REJESTR-PROSB-I-ZADAN.md`. Liczby testów NIE przeliczane (NIE_ZMIERZONO od 2026-11-03 pełnego `cargo test`).

## 1. Stan: ZROBIONE od 2026-11-07 (zintegrowane na `origin/rust-port/parity-v2`, HEAD `43f4064b0`)
- REPIN-EKONOMIA-F (FALA 500–517) + STATESRC-REGEN, REPIN-EKONOMII-JEDNA-WERSJA, RESPROD-DUPLIKAT
- REPIN-AUTOIMPROVE-ZYWNOSC-RZEKA (z odstępstwem mutacyjnym wg decyzji właściciela)
- DYPLOMACJA-MULTIWAR, MULTIWAR-2 (A+B+C), MULTIWAR-3 (D/E/F/G)
- ZAPIS-ERAWAR-MIGRACJE (pola/migracje wojen epoki)
- REPIN-AI-PRIORYTETY-CEL (planHomeWar, pula wojen epoki), AI-PEACE-CITY-OFFER (oferta miasta za pokój)
- REPIN-OBLEZENIE-GLOD-COOLDOWN (555 `siege_defender_units`, 557 cooldown odrzuceń) — kod martwy do czasu podpięcia
- FORCED-WAR-MODULES G1–G3 (wojny wymuszone: fale, trigger, ICU; wektory z weba)
- WIRE-WAR-TURN-PLAN (dokument: 8 partii W1–W8, ~4230 LOC, ABC D1–D8)
- REKON, AIZAKUP (moduł zakupu AI), UI/3D: REPIN-UI-3 A–E + INTEGRACJA, RENDER-3-RUST

## 2. Stan: DALEJ DO ZROBIENIA
- **P6 dopięcie:** podpięcie wojny/dyplomacji/oblężenia do tury (W1–W8) — większość logiki jest, brak produkcyjnej pętli tury (P7).
- **REPIN dryf weba po pinach logiki** — web zmienił się znacząco od 2026-11-07/08: FALA 563–606 (m.in. Respekt, rozejm 5/10/15 po końcu → propozycja pokoju, mnożniki Łucznik ×2 / Procarz ×3, ceramika w utrzymaniu 4 budynków, Garncarstwo, Ha'amonga, oblężenie bez wyłomu = remis po 150 turach, blokada/dołączanie do armii oblegającej, drogi gracza = AI, AI zakup wg realnego stanu surowców, karty/etykiety). Zakres liczbowy dryfu: **NIE_ZMIERZONO** → temat DELTA-6.
- P6: zapis/migracje (autoBuildEnabled, wodzowie, stos, cuda), hot-seat, zwycięstwo/porażka, handel (bramki), kultura/religia, aneksja państw-miast, mapgen (konie, Pangea).
- P7 integracja Rust↔Tauri↔frontend (hooki kontrolera v2), P8 parity pass (bramka seedów), P9, P10, P11 — nierozpoczęte.
- UI po `9b019a7d8` (REPIN-UI-4) i L3 renderera (po porcie kompozytora jednostek).

## 3. Decyzje właściciela czekające (blokują W1/W2)
- WIRE-WAR **D1** (nosiciel stanu świata: A osobny `WarWorldView`+`WarTurnState` / B rozszerzenie `PlayableState` / C czekać na `GameWorld`) i **D2** (kolejność kroków tury) — do ponownego zadania z wadami/zaletami. D3=1:1 z webem, D4=własny format + migracja (zapisane); D5–D8 domyślnie A.

## 4. Zasady prowadzenia (bez zmian)
Operator/Obrona Haiku 5.5, Evaluator/FC Sonnet 5.5, Sonnet na Operatorze tylko z uzasadnieniem lub po 2 nieudanych rundach; Opus tylko pamięć/GPU/grafika. Rust: do 4 operatorów równolegle, worktree `--no-checkout` + sparse-checkout, `CARGO_INCREMENTAL=0`, cargo target w worktree i sprzątanie po bramce; start nowych tematów z kodem Rust przy ≥ 8 GB wolnego (obecnie 27 GB). Dispatch zapisany i wypchnięty przed Workflow; każdy temat ma ID, GOAL, allowlistę, bramki (fmt, clippy `-D warnings`, testy celowane).

## 5. Kolejka: 10 najbliższych tematów (w kolejności)
| # | ID | Co | Zależność | Model |
|---|---|---|---|---|
| 1 | `R-RUSTPORT-REPIN-DELTA-6-Q1` | pomiar dryfu weba FALA 563–606 → moduły Rust i wektory (tylko dokumentacja) | brak | Haiku (Sonnet po 2 rundach) |
| 2 | `R-RUSTPORT-DECYZJA-WIRE-WAR-D1-D2` | ABC D1/D2 do właściciela (wady/zalety) | brak | orkiestrator |
| 3 | `R-RUSTPORT-P6-WIRE-WAR-STATE-Q1` (W1) | `WarTurnState`: agregat stanu wojny | #2 | Haiku |
| 4 | `R-RUSTPORT-P6-WIRE-WAR-WORLDVIEW-Q1` (W2) | `WarWorldView` + adaptery | #2, #3 | Sonnet (uzasadnione: adaptery wielu typów) |
| 5 | `R-RUSTPORT-REPIN-DYPLOMACJA-ROZEJM-5-10-15-Q1` | rozejm 5/10/15, propozycja pokoju po końcu, akceptacja wg siły 20% (FALA 605) | #1 | Haiku |
| 6 | `R-RUSTPORT-REPIN-WALKA-DYSTANS-MULT-Q1` | Łucznik ×2 / Procarz ×3, celność max(wręcz, dystans), `ranged_damage_mult` (603) | #1 | Haiku |
| 7 | `R-RUSTPORT-REPIN-OBLEZENIE-LIMIT-150-BLOKADA-Q1` | oblężenie: limit 150 tur → remis, blokada rekrutacji/dołączania do armii oblegającej (600, 606) | #1 | Haiku |
| 8 | `R-RUSTPORT-REPIN-EKONOMIA-CERAMIKA-GARNCARSTWO-Q1` | `utrzymanie_surowce` (ceramika), Garncarstwo, Ha'amonga, etykiety danych (594/597/598) | #1 | Haiku |
| 9 | `R-RUSTPORT-P6-ZAPIS-MIGRACJE-FALA509-Q1` | pola/migracje zapisu (autoBuildEnabled, wodzowie, stos, cud, forcedWarWaves…) | #3 | Haiku |
| 10 | `R-RUSTPORT-REPIN-AI-ZAKUP-REALNY-STAN-DROGI-Q1` | AI zakup wg realnego stanu surowców jak gracz (589+), drogi gracza = AI (596) | #1 | Haiku |
Następne po tej dziesiątce: W3–W8, OBLEZENIE P3–P5, REPIN-UI-4, P7 (kontroler v2), P8.
