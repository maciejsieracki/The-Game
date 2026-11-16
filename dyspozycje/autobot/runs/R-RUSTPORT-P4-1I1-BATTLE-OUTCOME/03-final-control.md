# R-RUSTPORT-P4-1I1-BATTLE-OUTCOME — Final Control r1

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1I1-BATTLE-OUTCOME
GOAL: BattleOutcomeDto (view-model) + producent wyniku bitwy E1–E3 (E4 z danymi z zewnątrz) 1:1 z pinem 07d2fbd72
ZMIANY/COMMIT: kod oceniany = 0f29d1a86 (Obrona) ← 69c2b7eb9 (Evaluator) ← 475b795a5 (Operator) ← 84ec520a5 (baza z dispatchu);
               ten raport = commit FC na 0f29d1a86 (bez zmian w kodzie)
TESTY: wszystkie bramki odtworzone samodzielnie, EXIT 0 (tabela niżej)
BLOKADY: brak blokujących; uwagi do decyzji orkiestratora niżej
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora (merge-tree względem aktualnego origin/rust-port/parity-v2)
DEPLOY/PUSH: NIE WYKONANO
```

## Ancestry i allowlista

- `git merge-base --is-ancestor 84ec520a5 0f29d1a86` → OK (łańcuch liniowy: baza → Operator → Evaluator → Obrona).
- `git diff --stat 84ec520a5 0f29d1a86`: 15 plików, wszystkie na allowliście (`view-model/src/battle.rs`, `view-model/tests/**`,
  `engine/src/domain/siege_tactics_outcome.rs` NOWY, `engine/src/domain/mod.rs` = 1 linia `pub mod siege_tactics_outcome;`,
  `engine/tests/p4_1i1_battle_outcome.rs` NOWY, `dyspozycje/autobot/runs/R-RUSTPORT-P4-1I1-BATTLE-OUTCOME/**`).
- `git diff --check` czysty; brak `#[ignore]` w dodanych liniach kodu; brak usuniętych asercji; `Cargo.lock` nie w commicie.
- Uwaga integracyjna: `origin/rust-port/parity-v2` = `1bacc7621` w chwili FC (dalej niż `02a1560e3` z raportu Evaluatora) —
  merge-tree przy integracji obowiązkowy.

## Bramki (FC, samodzielnie, CARGO_TARGET_DIR poza repo, usunięty po bramkach)

| Crate | fmt --check | clippy --all-targets -D warnings | test --all-targets --no-fail-fast |
|---|---|---|---|
| view-model | EXIT 0 | EXIT 0 | EXIT 0 — 80 passed, 0 failed, 0 ignored |
| engine | EXIT 0 | EXIT 0 | build `--no-run` EXIT 0; 484 binarki uruchomione bezpośrednio (2 partie < 590 s): 484× rc 0, 3550 passed, 0 failed, 1 ignored (istniejące, poza tematem) |

- `p4_1i1_battle_outcome`: 19/19.
- Mutacje dispatchu (FC, na 0f29d1a86): M1 (kolejność E2 def→atk) rc 101, 3 FAIL; M2 (winner bez `_endWinner ??`) rc 101, 1 FAIL;
  M3 (`wall_breached` zawsze false) rc 101, 3 FAIL; M4 (hp 0 w survivors) rc 101, 6 FAIL; po przywróceniu 19/19, `git status` czysty.

## Zgodność z pinem (odczyt FC)

Sprawdzone bezpośrednio w `gra/src/battle/battleScene.ts@07d2fbd72`: `onFinish` `:10720-10729` (winner `?? winner`,
`wallBreached` tylko przy `siegeWallCol >= 0`), `_finishDraw` (atk potem def), `_ffRoundCapResult` (remis → `_finishDraw`),
`_battleUnitsForMapExport` (`hp > 0 && (!dead || routed)`, `Math.max(0, hp)`), `_sideEndStats`, `_skipInstantFallback`
(założony wyłom przy żywej machinie). Producent odwzorowuje każdą z nich 1:1.

## Orzeczenia zarzutów

| # | Zarzut | Orzeczenie | Uzasadnienie |
|---|---|---|---|
| 1 | Raport Operatora: placeholder SHA, fałszywe „usunięto target” | ODDAL (naprawione) | Obrona poprawiła §6 (475b795a5…) i §4 (jawna korekta); katalog usunięty przez Evaluatora. Wada procesowa raportu, nie kodu. |
| 2 | Brak wołającego w produkcji / źródła maxHp | ODDAL | Dispatch nie obejmuje wpięcia (allowlista nie zawiera `siege_tactics_loop.rs`); Obrona dodała `from_seq_with_setup` (maxHp ze spawnu; pin nie przypisuje `bu.maxHp` w bitwie) z testem i sekcję „Wpięcie” wskazującą #113. Indeks NIEPODPIETE-MODULY poza allowlistą — regeneracja po integracji (orkiestrator). |
| 3 | Walidacja nie w validate.rs, brak hp > 0, brak re-eksportu | ODDAL | `validate.rs`/`lib.rs` poza allowlistą — obejście uczciwe. hp > 0 dodane w `BattleOutcomeDto::validate` (granica dokładna, test 0/-0/-0.5/-3/0.25). Re-eksport → osobny drobny temat (decyzja techniczna orkiestratora, nie gameplay). |
| 4 | `wallBreached: null` vs brak klucza w webie | ODDAL | Konwencja crate'a, przypięta `json_keys.rs`, opisana w doc-u dla konsumenta. |
| 5 | end_stats z migawki onFinish, NIE_ZMIERZONO | ODDAL | Założenie jawne (doc + raport); pin pokazuje, że po `finished` pętla nie zmienia rosteru; wektor wymaga pętli z #113. |

Brak zarzutu NAPRAW. Brak spraw DO DECYZJI CZŁOWIEKA (gameplay rozstrzyga web).

## Uwagi dla orkiestratora (techniczne, nie blokują)

1. Re-eksport typów `battle::*` z `view-model/src/lib.rs` i ewentualny dedykowany wariant `ViewError` — drobny temat.
2. Regeneracja `NIEPODPIETE-MODULY.md` po integracji (moduł `siege_tactics_outcome` → #113).
3. Merge-tree względem `origin/rust-port/parity-v2` = `1bacc7621` przed FF.
