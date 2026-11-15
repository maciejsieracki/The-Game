# 03 — Final Control r1 — R-RUSTPORT-P4-1I-BATTLE-ROZP-Q1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (rozpoznanie, tylko odczyt)
TEMAT: R-RUSTPORT-P4-1I-BATTLE-ROZP-Q1
GOAL: rozpoznanie producenta zdarzeń bitwy dla renderera (#218, D-DTO-7): tabela pin → Rust, pola DTO, podział na wdrożenia, NIE_ZMIERZONO.
ZMIANY/COMMIT: oceniany commit Obrony `f8f4bfdb41ff89fd10931aacf921375c6911ca57` (rodzic `ed07607c4` Operator r1, rodzic `c3e3617b2` = baza). Ten raport: commit na gałęzi `fc/R-RUSTPORT-P4-1I-BATTLE-ROZP-Q1` (dziecko `f8f4bfdb4`).
TESTY: patrz §Bramki.
BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora (dokument + raporty run) i wpis D-DTO-7 w `REJESTR-RUST.md` (decyzja techniczna orkiestratora, §5 dokumentu).
DEPLOY/PUSH: NIE WYKONANO

## Bramki (zweryfikowane samodzielnie)

- Baza: `origin/rust-port/parity-v2` = `c3e3617b2aaaede5f708d2c425b0222c4af78549` (bez zmian od startu tematu).
- Ancestry: `c3e3617b2` → `ed07607c4` → `f8f4bfdb4` → commit FC (liniowo; `git log --oneline -4 f8f4bfdb4`).
- `git diff --stat c3e3617b2 f8f4bfdb4`: 3 pliki, wszystkie w allowliście
  (`dyspozycje/rust-port/p4/P4-1I-BATTLE-ROZPOZNANIE.md`, `runs/.../01-operator-r1.md`, `runs/.../02a-obrona.md`).
  Zmiany w `rust-port/**`, `gra/`, `Cargo.lock`: 0.
- `git diff --check`: czysto (Obrona i Evaluator; brak białych znaków w diffie).
- cargo: nie dotyczy (zero zmian kodu; drzewo `rust-port` identyczne z bazą). Wolne miejsce: 4,1 GB.
- Raport Evaluatora `02-evaluator.md` jest na osobnej gałęzi `eval/...` (`a1eb1d3e2`), poza łańcuchem Obrony —
  do dołączenia przez orkiestratora przy integracji.

## Orzeczenia

| Zarzut | Orzeczenie | Dowód |
|---|---|---|
| Z1 (4 źródła survivors, #27, I1) | ODDAL (naprawione przez Obronę) | Pin `07d2fbd72` `battleScene.ts`: `_endSurvivors =` w `:3746`, `:9474`, `:9495`, `:10237`, reset `:10542` — zgodne z §2a.1. `_skipInstantFallback` `:3715-3748`, reguła machiny `:3720-3722`, `result.log` `:3744`. `computeInstantResult` `:20389`, `resolveCombat` `:20534`, werdykt `hpA >= hpD` `:20580-20589` (brak remisu — zgodne), `_finishDraw` wołane z `:9488` i `:10202` — zgodne. Wiersz #27 przepisany, L9 i I1b dodane. |
| Z2 (zawężenie survivors do {id,hp}) | ODDAL (naprawione) | `grep` przypisań `.bu.*` w `battleScene.ts`: tylko `:8991`, `:9999`, `:11683-11684` — zgodne. Konsumenci: `main.ts:34514`, `:34537` mapują do `{id: String(id), hp}`; `post-battle-map.ts:28-31` `ManualSurvivor {id; hp?}`; `siegeDefenders.ts:375-376` czyta `id`, `hp`. `main.ts:33701/:33714`, `:34435`, `:36724` tylko przekazują. NIE_ZMIERZONO dla mutacji spoza `battleScene.ts` jest jawne w §5. |
| Z3 (cytaty) | ODDAL (naprawione) | `siege_tactics_loop.rs@c3e3617b2`: `:810` `"atak-muru"`, `:844` `def_hp_after`; `view-model/src/battle.rs:85` `pub id: UnitId`; pin `:7745-7750` (MORALE_WALL_BREACH), `:7804-7810` (MORALE_GATE_BREACH) — wszystkie zgodne z dokumentem. |
| Z4 (§0 pkt 1, addEventListener) | ODDAL (naprawione) | §0 pkt 1 doprecyzowany: brak emitera/subskrypcji zdarzeń bitwy, `addEventListener` tylko UI. |
| Z5 (proces, informacyjny) | ODDAL | Temat dokumentacyjny; brak zmian w `rust-port/**`, cargo nie wymagane. |

Zero zarzutów NAPRAW. Brak spraw do decyzji człowieka (D-DTO-7 w §5 to decyzja techniczna orkiestratora; gameplay bez zmian).

## Uwagi (nie blokują)

- N1: przy integracji dołączyć `02-evaluator.md` z gałęzi `eval/R-RUSTPORT-P4-1I-BATTLE-ROZP-Q1` (`a1eb1d3e2`).
- N2: kryteria końca dispatchu spełnione: tabela 30 wierszy (§1), pola DTO §2a/§2a.1/§2b/§2c, podział I1/I1b/I2/I3/I4/I5 z allowlistami i wektorami (§4), NIE_ZMIERZONO (§5).
