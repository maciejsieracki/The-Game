STATUS: PASS-WITH-NOTES
DOMAIN: GAME (renderer, wyłącznie komentarze źródłowe)
TEMAT: R-RUSTPORT-P6-RENDERER-ORDERS-CYTATY-Q1 (runda 1, Operator)
GOAL: każdy cytat `plik:linia` w `rust-port/renderer/src/battle/orders.rs` wskazuje numer z pinu `07d2fbd72` (`gra/src/battle/battleScene.ts`) wg tabeli docelowej z `R-RUSTPORT-P6-RENDERER-PIN-ZGODNOSC-ROZP-Q1/02a-obrona.md` §1 „Zarzut 3”; cytaty `origin/main`/`edb8fb56` usunięte lub zastąpione pinem.
BAZA: `origin/rust-port/parity-v2` = `7d8993c429b26089ac2dbeebd6e7fc970cb2995d` (worktree detached, potem lokalna gałąź robocza). PIN: `07d2fbd72` (battleScene.ts: 20771 linii).

## 1. Tabela weryfikacji

Każdy numer sprawdzony: `git show 07d2fbd72:gra/src/battle/battleScene.ts | sed -n 'Np'`.

| orders.rs | cytat (przed) | cytat (po) | treść w pinie (sed) | zgodne |
|---|---|---|---|---|
| nagłówek :3 | `origin/main` | pin `07d2fbd72` | — | T |
| nagłówek :5 | „Pin `edb8fb56`” | „earlier baseline `edb8fb56` (… not an ancestor of pin `07d2fbd72`)” | — (nie cytat linii; relacja wg 02a zarzut 2) | T |
| nagłówek (tabela) | `web (origin/main)` | `web (pin 07d2fbd72)` | — | T |
| :13 kolejka `_activateNext` | `:5847-5898` | `:5979`; `:5993-5994`, `:6013` | 5979 `private _activateNext(): void {`; 5993 `if (cand && !cand.dead && !cand.fadingOut && !cand.removed && !cand.acted) { ru = cand; break; }`; 5994 `if (cand && this._manualMode && this._queuedOrderUnitIds.delete(cand.bu.id)) {`; 6013 `if (this._manualMode && this._queuedOrderUnitIds.delete(u.bu.id)) {` | T |
| :14 `_issueBattleAttackMove` | `:18076-18096` | `:18682-18702` | 18682 `private _issueBattleAttackMove(col: number, row: number, queueOnly: boolean): void {`; 18702 `}` (koniec funkcji) | T |
| :15 `_cancelAttackMoveSelected` | `:18098-18106` | `:18704-18712` | 18704 `private _cancelAttackMoveSelected(): void {`; 18712 `}` (koniec funkcji) | T |
| :15 Escape w `_onKeyManual` | `:16850-16856` | `:17406`, call `:17410` | 17406 `private readonly _onKeyManual = (e: KeyboardEvent): void => {`; 17410 `this._cancelAttackMoveSelected();` (gałąź `e.key === 'Escape' && this._attackMoveMode`) | T |
| :15 (nowe, zarzut 4) przycisk | — | „Anuluj marsz” `:19095` | 19095 `this._cancelAttackMoveSelected();` | T |
| :122 `can_act` | `:5861` | `:5993` | 5993 j.w. | T |
| :142 skan `next_activation` | `origin/main :5853-5866` | `:5979-5993` | 5979 / 5993 j.w. | T |
| :176 `consume_on_activation` | `:5881-5883` | `:6013`; skipped `:5994` | 6013 / 5994 j.w. | T |
| :198 `issue_attack_move` | `origin/main :18076-18096` | `:18682-18702` | j.w. | T |
| :252 `cancel_attack_move_selected` | `origin/main :18098-18106` (+ „Escape branch”) | `:18704-18712`; Escape `:17410`, przycisk `:19095` | j.w. | T |

Dopisano w nagłówku linię: „Numery linii wg pinu 07d2fbd72 (gra/src/battle/battleScene.ts)”.

## 2. Uwagi (rozbieżności z tabelą 02a — bez wpływu na użyte cytaty)
- Tabela 02a podaje zakres `_activateNext` 5979–6031. W pinie 6031 jest pustą linią; funkcja kończy się `}` w 6030. Końca zakresu nie cytuję — w `orders.rs` jest początek funkcji `:5979` i wiersze kolejki 5993/5994/6013 (zgodne z 02a i pinem). Nie BLOCK: żaden numer użyty w pliku nie jest sprzeczny z pinem.
- Tabela 02a podaje dla `_cancelAttackMoveSelected` tylko 18704; dopisałem koniec funkcji 18712 (sed: `}` po `this._refreshQueuedOrderVisuals();`).
- Tabela 02a podaje `_onKeyManual` 17406–~17421; końca nie cytuję (17420 `};`, 17421 pusta), tylko 17406 i 17410.
- Zgodnie z zarzutem 4 (02a) dopisano drugie wywołanie `_cancelAttackMoveSelected` (przycisk „Anuluj marsz”, 19095).
- Wzmianki o commitach `601fc3baf`/`96d088b4d` (nazwy commitów webu, nie cytaty linii) pozostawione bez zmian.

## 3. Kontrola zakresu
- `git diff --stat`: wyłącznie `rust-port/renderer/src/battle/orders.rs` (15+/12−) + ten raport.
- Zmienione linie niebędące komentarzem: 0 (`git diff -U0 | grep -E '^[+-][^+-]' | grep -vcE '^[+-]\s*//'` = 0).
- `grep -nE 'origin/main|5847|5898|18076|18096|18098|18106|16850|16856|5861|5853|5866|5881|5883' orders.rs` = brak trafień (EXIT 1).
- `git diff --check`: czysto.

ZMIANY/COMMIT: `rust-port/renderer/src/battle/orders.rs` (tylko komentarze), `dyspozycje/autobot/runs/R-RUSTPORT-P6-RENDERER-ORDERS-CYTATY-Q1/01-operator-r1.md`; commit na lokalnej gałęzi `rust-port-wip/R-RUSTPORT-P6-RENDERER-ORDERS-CYTATY-Q1-op-r1`, rodzic `7d8993c42`; SHA w odpowiedzi Operatora (raport nie może zawierać własnego SHA).
TESTY: `cargo fmt --check` w `rust-port/renderer` → EXIT 0. Bez kompilacji i cargo test (zgodnie z dispatchem; zmiana tylko komentarzy). Weryfikacja pinu sed: 5979, 5993, 5994, 6013, 6030, 6031, 17406, 17410, 17420, 18682, 18702, 18704, 18712, 19095.
BLOKADY: brak. NIE_ZMIERZONO: źródło pierwotnych numerów (jak w 02a).
RUNDY: 1/5.
NASTĘPNY KROK: Evaluator (weryfikacja tabeli sed i diffu tylko-komentarze).
DEPLOY/PUSH: NIE WYKONANO (brak push, brak integracji; Cargo.lock nietknięty).
