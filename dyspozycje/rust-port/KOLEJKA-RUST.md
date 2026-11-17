# KOLEJKA-RUST — priorytety (migawka 2026-11-17 ~07:xx UTC; baza parity `f85622878`)

## P0 — aktywne Workflow (4/4)
- K5DOC-T7b odwrót: integracja r2 (`wf_22aea0c3-510`), z osobnym przebiegiem `p6_8i_pick`.
- R4 G5 normalizacja kluczy (#332, OPUS): `wf_c2dda485-691`.
- REJESTR-RUST audyt statusów ZINTEGROWANE (#356): `wf_e58137b5-6a6`.
- K5DOC-T7a falanga (#261): `wf_30e2308d-50d`.

## P1 — integracje renderera (czekają na bramkę ≥ 12 GB, bez równoległych buildów)
Bramka renderera = jedna integracja zbiorcza. Kolejność: Q5 → R1 → R3 → R5 → R2 (merge) → zbiorcza bramka i FF.
- Q5 PRIO-3D-1 ADAPTER-OVERLAYS (#269): `922300020`, FC `3d21e5679` PASS-WITH-NOTES. NIE w parity.
- R1 żetony jednostek (#316): `3dec6ac5d`, FC `c6ab07fb09a5` PASS-WITH-NOTES. NIE w parity.
- R3 wstęgi rzek (#317): `963148a78`, FC `b82ca9375` PASS-WITH-NOTES. NIE w parity.
- R5 plakietki miast (#318): `56c84ea45`, FC `84e421c57` PASS-WITH-NOTES. NIE w parity.
- R2 dekor i las (#320): merge `11d7e4763` (FC PASS, runda 2). NIE w parity; bramka renderera nie uruchomiona.
- Integracja zbiorcza (#319 / #330): po powyższych.

## P2 — Opus bez blokady, do wystartowania (po wolnym slocie)
- P4-1I BATTLE-EVENTS (#218, OPUS): zdarzenia bitwy jako snapshot wg webu (D-DTO-7). Brak blokady w rejestrze — dispatch do napisania (pin: zdarzenia bitwy, `D-DTO-7`).
- #332 R4 G5 — w toku (P0).

## P3 — zależne od integracji P1
- PRIO-3D-2 ADAPTER-UNITS (#270 / #328, OPUS): po integracji R1.
- R6 wpięcie produkcyjne RevoltRenderer::sync (#331, OPUS): po integracji R5.
- StatChipUiState ↔ MapUiState (#324 / #333, OPUS): po integracji Q5.

## P4 — zablokowane decyzją właściciela lub zależnością rdzenia
- #253 mgła fotela (decyzja) → blokuje #278/#334 TERRITORY-RANGES, #279/#337 revealAllLand, #335 FOG-VIEW.
- #327 garnizon w czasie wojny (decyzja ABC), #358 mgła i CRED-HAK (decyzja ABC).
- #280 / #336 BATTLE-ACTIONS-SIEGE (OPUS): pętla oblężnicza K5LOOP (#107/#109/#112/#113).
- #315 T4e wpięcie ruchu (koszt per jednostka, wiring ProdBody), #263/#264 (ActivateOps #284).
- #304/#310 ekonomia (wpięcie wymaga stanu PlayableState), #305/#306/#307 bridge.

## Do potwierdzenia / zamknięcia (status w liście nieaktualny)
- #321 R6 sprite — zintegrowany (`2edc808d7` ∈ parity) → zamknięty.
- #322 / #329 R4 ulepszenia — zintegrowany (`32c84d6a9` ∈ parity) → zamknięte.
- #215 OVERLAYS-VIEW (P4-1F) — prawdopodobnie pokryty przez Q5 (#269); potwierdzić przed zamknięciem.
