# P-ROSTER-ZWIADOWCA-DRIFT-DWOCH-FUNKCJI-Q1 — zgłoszenie konfliktu (C-054)

DATA: 2026-09-05 · ROLA: Operator, runda 1 · DOMAIN: GAME

Opis konfliktu, po jednym zdaniu na źródło — bez propozycji rozwiązania.

- **Dispatch** mówi, że `collectBattleRoster` nie wyklucza sąsiadującego zwiadowcy
  ze składu bitwy, wymaga 20/20 na `gra/tools/map-field-battle-test.cjs`
  (kryterium 1) i jednocześnie zakazuje zmiany, osłabienia lub usunięcia asercji
  `collectBattleRoster atk: adjacent scout excluded` (kryterium 2).
- **Kod** (`gra/src/units/battleRoster.ts:29-31`) wyklucza sąsiadującego zwiadowcę
  w `collectBattleRoster` i `collectAtkRosterNearCity` tym samym predykatem, więc
  rozjazdu opisanego w dispatchu w tym punkcie nie ma, a kontrakt bitwy w polu
  (`gra/src/main.ts:24282`) każe wliczać własne jednostki bojowe w promieniu 1 heksa.
- **Testy** — asercja `map-field-battle-test.cjs:155-157` czerwieni się wyłącznie na
  warunku `length === 2`, bo jej fixture zawiera czwartą, niecywilną jednostkę
  `warrior2` w dystansie 1 od kotwicy, podczas gdy asercja sąsiednia
  (`:152-153`) wymaga, by taka jednostka była w rosterze, a bramka
  `gra/tools/battle-roster-test.cjs:105-109` sprawdza to samo zdanie fixturem bez
  czwartej jednostki i jest zielona.

Skutek: kryterium 1 i kryterium 2 nie są jednocześnie spełnialne żadną zmianą
w `gra/src`. Warstwa ledger: `DECISION_REQUIRED` (C-051). Warstwa rejestru:
status tematu `ABC-OCZEKUJE`. Runda nie jest zużyta (C-050/C-054).

Klasyfikacja ścieżki wg C-054: rozstrzygnięcie zmienia skład bitwy w polu, więc
ma wpływ na balans — ścieżka (b), pełny turniej C-018, nie ścieżka lekka.
