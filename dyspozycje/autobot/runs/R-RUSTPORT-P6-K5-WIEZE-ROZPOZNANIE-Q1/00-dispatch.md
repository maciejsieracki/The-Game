# DISPATCH R-RUSTPORT-P6-K5-WIEZE-ROZPOZNANIE-Q1 (runda 1) — TYLKO ODCZYT

STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: #96 K5-LOOP-WIEZE — ustalić, co z wież oblężniczych z pinu (`_fireSiegeTowers`, harmonogram 180 ms, `pickTowerTarget`) jest już na parity, a czego brakuje. Bez kodu.
MODEL: Operator HAIKU 5.5; Obrona HAIKU 5.5; Evaluator SONNET 5.5; Final Control SONNET 5.5.

ZASADA: NAJPIERW WEB. Pin `07d2fbd72`: `gra/src/battle/battleScene.ts` — `_fireSiegeTowers` (ok. :4208), wywołanie `pickTowerTarget` (ok. :4230), wywołanie z pętli (ok. :5643), `gra/src/game/city-towers.ts:141` (pickTowerTarget). Numery linii sprawdź sam.

BAZA: `origin/rust-port/parity-v2` = `62ff9de35`. Worktree z tej bazy. Nie zmieniaj kodu.

CO USTALIĆ (tabela w `01-rozpoznanie.md`):
1. Krok po kroku `_fireSiegeTowers` z pinu: warunki wejścia, wybór celu, strzał, harmonogram 180 ms (`_schedule`) — plik:linia webu.
2. Odpowiednik w Rust na `62ff9de35`: `siege_tactics_loop.rs` (`fire_siege_towers` ok. :436, `plan_tower_shots`), `siege_tactics_tower.rs` (`pick_tower_target` ok. :486), `siege_tactics_turnseq.rs` (:138, :240). Plik:linia.
3. Co jest OK, co jest BRAK, co jest ROZBIEŻNE (np. harmonogram 180 ms, kolejność wystrzałów, zdarzenia).
4. Które luki są w zakresie #96/#146 (pick_tower_target w fire_siege_towers), a które należą do innych tematów (#97 AUTO, #98 wyłom, #113 wiring).
5. Dla każdej luki: czy web rozstrzyga (wtedy można wdrożyć 1:1), czy to decyzja gameplay (wtedy NIE_ZMIERZONO i zostaw w czacie).

ALLOWLISTA: wyłącznie `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5-WIEZE-ROZPOZNANIE-Q1/**`. Zero zmian w `gra/`, `rust-port/`.

PROCES: Operator → Evaluator → (Obrona jeśli zarzuty) → Final Control. Commit tylko katalogu runu (jawne git add). Bez push na parity. Commit z `Co-Authored-By: Claude Haiku 5.5 <noreply@anthropic.com>` i `Claude-Session: https://claude.ai/code/session_01Eq7NKGj1PasjUCd7VCtYbZ`.
