# DLUG-TESTOWY-Q16 (R-WEB-TEST-DEBT-Q16) — bramka końca tury, skan rodziny

## Stan wiążący

- Baza: `481e0ebf9` (origin/main), `merge-base --is-ancestor` potwierdzone.
- Kod gry (`gra/src`, `gra/data`) NIE zmieniony. Zmieniono wyłącznie piny testów w `gra/tools/`.
- Czerwony test `no-negative-stocks-endturn-test.cjs` (asercja f) jest ZIELONY (19/0) po poprawce pinu.
  Mutacja (wyłączenie bramki NNS w `canPlayerInitiateEndTurn`) czerwieni test. Po przywróceniu zielony.
- Klasyfikacja: (A) pin przestarzały, NIE regresja gry.
- NIE ZMIERZONO: stanu rozgrywki na żywo (przeglądarka). Testy są tekstowymi pinami wzorców, nie runtime.

## Przyczyna (asercja f)

- Commit `7fd21ed0c` (ENDQUIET, FALA 934) zmienił sygnaturę na `canPlayerInitiateEndTurn(quiet = false): boolean {`.
  Zmiana była zamierzona (komunikat commita: wersja cicha dla cyklu HUD, klik gracza zostaje głośny).
- Pin w teście szukał `function canPlayerInitiateEndTurn(): boolean {`, więc wycinek był pusty i asercja (f) padała.
- Logika bramki (`if (nnsGateForPlayer().blokada) { ...; return false; }`) pozostała na miejscu.

## Zmiany w pinach (allowlista)

| Plik | Zmiana |
|---|---|
| `gra/tools/no-negative-stocks-endturn-test.cjs` | nagłówek wycinka `canPlayerInitiateEndTurn(quiet = false): boolean {` (wzorzec bez zmian, nadal wymaga `return false` w gałęzi blokady) |
| `gra/tools/endturn-battle-deadlock-test.cjs` | ten sam nagłówek w pinie [A4] (przed poprawką 37/1, po 38/0) |
| `gra/tools/endturn-battle-deadlock-exec-test.cjs` | lista nagłówków `FN_HEADERS` przyjmuje oba podpisy (historyczna baza `fcd86933` ma stary); needle M4 z `if (!quiet) console.warn(...)` (przed: abort, po: 49/0) |

Wzorce pozostają szczegółowe. Nic nie zostało rozluźnione do dowolnego dopasowania.

## Skan rodziny (PRZED / PO)

Pełna tabela: `dyspozycje/autobot/runs/R-WEB-TEST-DEBT-Q16/scan-PRZED-PO.txt`.

- Zielone bez zmian: end-turn-gate-projection-only (49), no-negative-stocks-ai-from-turn1 (27), no-negative-stocks-ai-t2 (11), no-negative-stocks-ai (8), no-negative-stocks-c2 (44), no-negative-stocks-end-turn-gate-levers (34), no-negative-stocks-projection (49), no-negative-stocks (25), endturn-quiet (PASS), endturn-aria-sync (5 PASS, 0 FAIL).
- Naprawione pinami: no-negative-stocks-endturn (18/1 → 19/0), endturn-battle-deadlock (37/1 → 38/0), endturn-battle-deadlock-exec (abort → 49/0).
- Pominięte (wymagają bundla `--dist`, ciężkie): end-turn-gate-live, no-negative-stocks-ai-t2-behavior, no-negative-stocks-c3-turn.

## Poza allowlistą (NIE zmieniano, do decyzji orkiestratora)

Te pliki mają ten sam przestarzały nagłówek `function canPlayerInitiateEndTurn(): boolean {` i prawdopodobnie są czerwone. NIE URUCHOMIONO ich w tym temacie:

- `gra/tools/diplo-forced-peace-pending-test.cjs:182`
- `gra/tools/diplomacy-sensible-deals-main-guard-test.cjs:32`
- `gra/tools/koniec-tury-f1-f4-runda3-test.cjs:168`
- `gra/tools/koniec-tury-g1-g2-runda4-test.cjs:130`
- `gra/tools/load-game-blockers-exec-test.cjs:73`

Naprawa to ta sama, jednowierszowa zmiana nagłówka. Wymaga osobnego tematu z własną allowlistą.

## Bramki

- `tsc --noEmit`: RC 0
- `ai-test`: 297 passed, 0 failed
- `logic-test`: LOGIC OK (213/213)
