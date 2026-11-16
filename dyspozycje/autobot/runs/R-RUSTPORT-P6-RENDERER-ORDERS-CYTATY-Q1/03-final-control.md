# 03 — Final Control, runda 1 — R-RUSTPORT-P6-RENDERER-ORDERS-CYTATY-Q1

STATUS: PASS
DOMAIN: GAME (renderer, tylko komentarze źródłowe)
TEMAT: R-RUSTPORT-P6-RENDERER-ORDERS-CYTATY-Q1
GOAL: cytaty `plik:linia` w `rust-port/renderer/src/battle/orders.rs` zgodne z pinem `07d2fbd72`
(`gra/src/battle/battleScene.ts`) wg wiążącej tabeli `R-RUSTPORT-P6-RENDERER-PIN-ZGODNOSC-ROZP-Q1/02a-obrona.md` §Zarzut 3; zero zmian kodu.
ZMIANY/COMMIT: kandydat do integracji = `ee1bce231` (Obrona r1, rodzic `1d766e1da` Operator r1, rodzic `7d8993c42` = baza).
Ten raport dopisany commitem na lokalnej gałęzi `rust-port-wip/R-RUSTPORT-P6-RENDERER-ORDERS-CYTATY-Q1-fc-r1` (rodzic `ee1bce231`).
Raport Evaluatora `02-evaluator.md` leży na osobnej gałęzi (`dbbae6d35`, rodzic `1d766e1da`) — nie jest w linii kandydata; do dołączenia przy integracji (tylko dokument).
TESTY: patrz §2.
BLOKADY: brak.
RUNDY: 1/5.
NASTĘPNY KROK: integracja orkiestratora (FF/merge `ee1bce231` + ten raport na `rust-port/parity-v2`).
DEPLOY/PUSH: NIE WYKONANO.

## 1. Ancestry

- `origin/rust-port/parity-v2` = `7d8993c42` (zgodne z „BAZA” dispatchu).
- `git log`: `ee1bce231` → `1d766e1da` → `7d8993c42`; baza jest przodkiem kandydata.
- `git diff --stat 7d8993c42 ee1bce231`: 3 pliki — `orders.rs` (+19/−16), `01-operator-r1.md`, `02a-obrona.md`. Allowlista dotrzymana; `Cargo.lock`, `gra/` nietknięte.

## 2. Bramki (wykonane samodzielnie na `ee1bce231`)

| bramka | wynik |
|---|---|
| `cargo fmt --check` (rust-port/renderer) | EXIT 0 |
| `git diff --check 7d8993c42 ee1bce231` | czysto |
| zmienione linie `orders.rs` niebędące komentarzem (`diff -U0`, filtr `^[+-]\s*//`) | 0 |
| `grep origin/main|601fc3baf|96d088b4d|5847|5861|5853|5881|18076|18098|16850` w `orders.rs` | 0 trafień |
| linie > 100 znaków w `orders.rs` | tylko wiersze tabeli `//!` 14, 15, 17 (w bazie analogicznie 12, 13, 15 — stan zastany) |
| cargo clippy / cargo test | nie uruchamiane (dispatch: zmiana tylko komentarzy; Evaluator na `1d766e1da` raportował EXIT 0 / 109 testów; Obrona zmieniła wyłącznie komentarze) |

## 3. Weryfikacja numerów w pinie (`git show 07d2fbd72:gra/src/battle/battleScene.ts | sed -n Np`)

| cytat (przed) | cytat (po) | treść w pinie | zgodne |
|---|---|---|---|
| `_activateNext` `:5847-5898` | `:5979` | `private _activateNext(): void {` | T |
| filtr `:5861` | `:5993` | `if (cand && !cand.dead && !cand.fadingOut && !cand.removed && !cand.acted) { ru = cand; break; }` | T |
| konsumpcja (pominięci) | `:5994` | `if (cand && this._manualMode && this._queuedOrderUnitIds.delete(cand.bu.id)) {` | T |
| konsumpcja `:5881-5883` | `:6013` | `if (this._manualMode && this._queuedOrderUnitIds.delete(u.bu.id)) {` | T |
| skan `origin/main :5853-5866` | `:5979-5993` | j.w. (zgodne z tabelą 02a „skan kandydatów 5979–5993”) | T |
| `_issueBattleAttackMove` `:18076-18096` | `:18682-18702` | 18682 `private _issueBattleAttackMove(col, row, queueOnly): void {`; 18702 `}` | T |
| `_cancelAttackMoveSelected` `:18098-18106` | `:18704-18712` | 18704 `private _cancelAttackMoveSelected(): void {`; 18712 `}` | T |
| Escape `_onKeyManual` `:16850-16856` | `:17406`, wywołanie `:17410` | 17406 `private readonly _onKeyManual = ...`; 17410 `this._cancelAttackMoveSelected();` | T |
| — (nowe, zarzut 4 z 02a) | przycisk „Anuluj marsz” `:19095` | `this._cancelAttackMoveSelected();` | T |

Linia nagłówka „Numery linii wg pinu 07d2fbd72 (gra/src/battle/battleScene.ts)” obecna.

## 4. Orzeczenia zarzutów Evaluatora

1. Hashe `601fc3baf`, `96d088b4d` (spoza pinu) w nagłówku — **ODDAL** (usterka usunięta przez Obronę w `ee1bce231`: hashe usunięte, zastąpione wskazaniem pinu `:5994, :6013, :18682`; grep = 0 trafień, numery sprawdzone w §3).
2. Komentarze > 100 znaków w l. 179 i 256 — **ODDAL** (zawinięte w `ee1bce231`; pozostałe > 100 to wyłącznie wiersze tabeli markdown, długie już w bazie; `cargo fmt --check` EXIT 0).
3. Zakres `:5979-5993` zaczyna się od sygnatury — **ODDAL** (literalnie zgodny z wiążącą tabelą 02a; dispatch zakazuje numerów spoza tabeli; Evaluator sam ocenił jako nie-błąd).

Brak NAPRAW, brak DO DECYZJI CZŁOWIEKA.

## 5. Uwaga dla integracji (nie blokuje)

Operator zgłosił, że tabela 02a podaje koniec `_activateNext` jako 6031, a w pinie funkcja kończy się w 6030 (6031 pusta). Sprawdzone: 6030 `  }`, 6031 pusta. Numer 6031 nie jest cytowany w `orders.rs` — bez wpływu.
