STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS / GAME (odczyt, bez zmian kodu)
TEMAT: R-RUSTPORT-P6-RENDERER-PIN-ZGODNOSC-ROZP-Q1 (runda 1, obrona Operatora, Haiku)
GOAL: odpowiedzieć na każdy zarzut z listy (PRZYJMUJĘ z dowodem albo ODRZUCAM z dowodem) i uzupełnić rozpoznanie tak, aby tabela cytatów miała numery docelowe w pinie 07d2fbd72.
BAZA: `origin/rust-port/parity-v2` = `de88d9d55` (wejście Operatora `72711a1b1`, ancestor potwierdzony: `git merge-base --is-ancestor de88d9d55 72711a1b1`). Worktree przełączony detached na `72711a1b1`.
PIN: `07d2fbd72:gra/src/battle/battleScene.ts`, 20771 linii.

## 1. Odpowiedzi na zarzuty

### Zarzut 0 (niezależne potwierdzenie 0/7)
PRZYJMUJĘ. Sprawdzone niezależnie (`git show 07d2fbd72:gra/src/battle/battleScene.ts | sed -n 'Np'`): wiersze pinu pod cytowanymi numerami nie zawierają cytowanych funkcji/wartości (5853 `ru.moraleBarBg,`; 5861 `}`; 5866 `let completed = false;`; 5881 `return;`; 5883 `if (ru.routed) {`; 5898 `}`; 16850 `if (units.length === 0) return;`; 16856 `const discGeo = ...`; 18076 `} else {`; 18096 `}`; 18098 `const adj = this._pickAdjacentTargetByPriority(ru);`; 18106 `return true;`). Wniosek Operatora: 0/7 zgodnych potwierdzony.

### Zarzut 1 (nie ustalono źródła numerów)
PRZYJMUJĘ, że źródło pozostaje NIE_ZMIERZONO. Dodatkowy pomiar (ograniczony):
- `git log --format=%h -G "private _issueBattleAttackMove" -- gra/src/battle/battleScene.ts` zwraca jeden commit, `aac34b521` (wave 608, 2026-11-10). W nim `_activateNext` jest w linii 5966, `_onKeyManual` 17333, `_issueBattleAttackMove` 18609, `_cancelAttackMoveSelected` 18631. Żadna z cytowanych par (18076/18098, 5847/5861, 16850) nie pasuje, więc to nie jest źródło.
- Wcześniej (Operator): `601fc3baf` i `96d088b4d` nie są przodkami pina (`merge-base --is-ancestor` = nie), `601fc3baf` jest przodkiem `origin/main`.
- NIE_ZMIERZONO: pełny przegląd wszystkich commitów pliku pod kątem numerów 18076/18098 (nie zrobiono; pomiar objął tylko commity wprowadzające funkcje).

### Zarzut 2 (dispatch pkt 3: `git grep` po `rust-port` i `dyspozycje`)
PRZYJMUJĘ i uzupełniam pomiar. Wykonano na ref `origin/rust-port/parity-v2` (worktree HEAD nie zawiera tych plików, więc `git grep` bez refa zwraca 0):
- `rust-port`: 501 plików z `edb8fb56` (zgodne z Operatorem),
- `dyspozycje`: 850 plików z `edb8fb56` (pominięte przez Operatora),
- razem `rust-port` + `dyspozycje`: 1351 (bez części wspólnej, bo katalogi są rozłączne).
- `rust-port/renderer/src`: 120 plików z `edb8fb56` (Operator podał 120 w sumie z `renderer/src`, 119 bez `orders.rs`; zgodne).
- Uwaga: `edb8fb56` jest commitem w repo (`git cat-file -t edb8fb56` = commit), ale NIE jest przodkiem ani potomkiem pina (`merge-base` w obu kierunkach = nie). Wiersze w `edb8fb56` (19493 linii) nie są wiarygodną podstawą dla numerów pina.

### Zarzut 3 (sekcja 5 bez docelowych numerów)
PRZYJMUJĘ. Pełna tabela docelowa w sekcji 2 niniejszego pliku. Dla każdego cytatu z `orders.rs`:

| orders.rs (wiersz, cytat) | poprawny zakres w pinie 07d2fbd72 | treść wiersza w pinie |
|---|---|---|
| :13 kolejka `_activateNext` (`:5847-5898`) | funkcja `_activateNext` 5979–6031; konsumpcja kolejki 5994 i 6013 | 5994 `if (cand && this._manualMode && this._queuedOrderUnitIds.delete(cand.bu.id)) {`; 6013 `if (this._manualMode && this._queuedOrderUnitIds.delete(u.bu.id)) {` |
| :14 / :198 `_issueBattleAttackMove` (`:18076-18096`) | 18682–18702 (funkcja) | 18682 `private _issueBattleAttackMove(...)` |
| :15 / :252 `_cancelAttackMoveSelected` (`:18098-18106`) | 18704 (funkcja); wywołania: 17410 i 19095 | 18704 `private _cancelAttackMoveSelected(): void {` |
| :15 Escape w `_onKeyManual` (`:16850-16856`) | `_onKeyManual` 17406–~17421; Escape → 17410 | 17406 `private readonly _onKeyManual = ...` |
| :122 filtr kandydatów (`:5861`) | 5993 | 5993 `if (cand && !cand.dead && !cand.fadingOut && !cand.removed && !cand.acted) { ru = cand; break; }` |
| :142 zakres skanu `_activateNext` (`origin/main :5853-5866`) | skan kandydatów 5979–5993 | 5853–5866 w pinie leży w innej funkcji (`ru.moraleBarBg`, `let completed`), NIE w `_activateNext` |
| :176 konsumpcja (`:5881-5883`) | 5994 (cand) i 6013 (u) | j.w.; 5881–5883 w pinie = `return;` / `if (ru.routed) {` w innej funkcji |
| :198 nagłówek `_issueBattleAttackMove` (`origin/main :18076-18096`) | 18682–18702 | j.w. |
| :252 nagłówek `_cancelAttackMoveSelected` (`origin/main :18098-18106`) | 18704 | j.w. |

Uwaga do pozycji :13, :142 i :176: zakres `5847-5898` w pinie zaczyna się od `_disposeAutoBatchPlanningRoster` (wiersz 5847), czyli innej funkcji niż `_activateNext` (5979). Cytowane zakresy `5853-5866` i `5881-5883` także nie leżą w `_activateNext`. Poprawne odpowiedniki queue-części `_activateNext` to wyłącznie 5993/5994/6013.

### Zarzut 4 (drugie wywołanie `_cancelAttackMoveSelected` w l. 19095)
PRZYJMUJĘ. Zweryfikowane: `git show 07d2fbd72:gra/src/battle/battleScene.ts | sed -n '19088,19098p'` pokazuje, że 19095 `this._cancelAttackMoveSelected();` jest w callbacku przycisku `mkBtn('Anuluj marsz', ...)` w pasku wyboru jednostek (klik „Anuluj marsz”, obok `_showOrderFeedback('Atakuj-marszem anulowane')` i `_updateBattleSelectionBar()`). Operator wymienił tylko Escape (17410). Obserwacja do dopisania w nagłówku `orders.rs` przy `cancel_attack_move_selected` (dwa wywołania: Escape 17410, przycisk 19095). Nie zmienia wniosku o numerach.

### Zarzut 5 (171 plików i klaster `siege_*` niezmierzone)
PRZYJMUJĘ częściowo i uzupełniam liczenie:
- `git grep -l battleScene origin/rust-port/parity-v2 -- rust-port` = 171 plików (potwierdzone).
- `git grep -l battleScene origin/rust-port/parity-v2 -- 'rust-port/engine/src/domain/siege_*'` = 27 plików.
- NIE_ZMIERZONO: czy numery linii w tych 171 plikach są zgodne z pinem (weryfikacja zakresu wykonana tylko dla `orders.rs`, 7 cytatów). Ta część zostaje otwarta jako osobny temat rozpoznania.

## 2. Wniosek (po obronie)
Wniosek Operatora pozostaje: numery w `orders.rs` NIE są zgodne z pinem `07d2fbd72` (0/7). Korekta: źródło numerów jest NIE_ZMIERZONO (nie `edb8fb56`, nie `601fc3baf`/`96d088b4d`, nie `aac34b521`). Poprawne numery docelowe są w tabeli sekcji 1 (zarzut 3). Plik `orders.rs` nie został zmieniony.

## 3. Zmiany i commit
- Zmieniono wyłącznie: `dyspozycje/autobot/runs/R-RUSTPORT-P6-RENDERER-PIN-ZGODNOSC-ROZP-Q1/02a-obrona.md` (ten plik).
- Brak zmian kodu, brak cargo, brak push, brak integracji. Cargo.lock nie dotknięty.

ZMIANY/COMMIT: `02a-obrona.md` w katalogu runu; SHA podany w odpowiedzi orkiestratora (commit na detached HEAD worktree, na bazie `72711a1b1`).
TESTY: nie dotyczy (tryb odczytu, bez cargo); pomiary: `git show 07d2fbd72:...` (19 wierszy), `git grep ... origin/rust-port/parity-v2` (rust-port 501, dyspozycje 850, siege_* 27, battleScene w rust-port 171), `git log -G` (aac34b521), `merge-base --is-ancestor` (de88d9d55 ⊂ 72711a1b1; 601fc3baf ⊂ main; edb8fb56 ↔ pin: brak relacji).
BLOKADY: NIE_ZMIERZONO: (a) źródło numerów `orders.rs`; (b) zgodność numerów w 171 plikach `rust-port` z numerami battleScene i w 119 plikach `renderer/src` z `edb8fb56`; (c) zgodność treści funkcji w pinie z `601fc3baf`/`96d088b4d`.
RUNDY: 1/5 (runda obrony Operatora r1).
NASTĘPNY KROK: Evaluator (Sonnet) weryfikuje odpowiedzi i tabelę poprawnych numerów; po PASS orkiestrator decyduje o temacie poprawy `orders.rs` (zakres: tabela z sekcji 1).
DEPLOY/PUSH: NIE WYKONANO (brak push do `rust-port/parity-v2`, brak integracji).
