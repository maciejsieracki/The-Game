# R-WALKA-PRZEWAGA-LICZEBNA-Q1-W2 — 02-evaluator (runda 1/5)

STATUS: ZARZUTY (2) — bez werdyktu PASS/FAIL, §3c pkt 1; lista niepusta → Obrona Operatora
DOMAIN: GAME
TEMAT: R-WALKA-PRZEWAGA-LICZEBNA-Q1-W2
MODEL+EFFORT: Sonnet 5, effort high
GOAL: zgodny z 00-dispatch (§16a pkt 9 sprawdzony, bez rozjazdu) — (1) kontratak tylko dla
PIERWSZEGO atakującego w turze, bez wyjątku dla fortyfikacji/miasta; (2) startowa kara morale
min(65%, 50%·log10(r)), r = MOC ważona bieżącym HP, liczona RAZ.

ZMIANY-COMMIT: baza `487b0cfc`, commit `b6318798`. 6 plików, 929+/0−, wszystkie w allowliście.
`auto-battle-power.ts`, `auto-battle-params.json`, `main.ts`, `WERSJE.md`, `docs/decyzje/**`,
`gra-robocza/**`, `playbook.json` — 0 trafień. `git diff --check` czysto, zero sekretów,
zero usunięć. `resolveCombat` nietknięty (zmiany w `combat.ts` to wyłącznie dopisek za `:1128`).

TESTY (uruchomione przeze mnie, nie odczytane z raportu; tsc 5.9.3 — C-029):
- czysta baza (`git checkout 487b0cfc --` na 3 źródłach): oba nowe gate'y exit=1.
- HEAD: kontratak 24/24, morale 68/68, tsc 0, logic 213/213, tech-tree 19/19, research 33/33,
  unit-replace 13/13, combat 6/6, battle-roster 7/7, battle-summary OK, battle-hp-display 7/7,
  teren-walki-etapy 33/33, army-hunger-combat 13/13.
- MUTACJE WŁASNE: usunięcie `canCounter` → 23/24; usunięcie `beginTurn()` → dodatkowy FAIL;
  dopisanie `u.moraleMax = …` → 63/68 i ułamek wraca do **100.0%**; `sufit_proc` 65→99 w JSON
  → 63/68 (parametr faktycznie czytany z pliku, nie magiczna liczba w kodzie).
- (i) POZIOM WPIĘCIA: `resolveCombat` bez zmian; CZĘŚĆ E gate'u odpala prawdziwy `resolveCombat`
  → DEF 12 = ATK 12 linii. Budżet resetowany w `_beginTurn` (`:5264`), jedyne wejście w turę.
  Parytet gracz/AI: obie ścieżki idą przez `_doAttack`→`_doMeleeAttack`.
- (ii) Własny przelicznik na zbundlowanym `combat.ts`: cała tabela GOAL 2 odtworzona
  (1,5→8,80 / 2→15,05 / 3→23,86 / 5→34,95 / 10→50,00 / 20→65,00 / 100→65,00 p.p.), r≤1→0.
  `moraleMax`=100 i `fleeMorale`=30 nietknięte, ułamek słabszej strony 50%, silniejszej 100%.
  Kryterium 5: 20 jednostek na 10% HP → r dokładnie 10,00; przy pełnym HP
  `hpWeightedFieldPower` === `sumRosterFieldM` (1640).
- Sprawdzone i ODDALONE noty Operatora: `export-c.py:364/388` czyta i zapisuje ten sam dict
  (`params[sec][key]=val`), więc `morale_przewaga_mocy` PRZEŻYWA regenerację — nota (1) bezprzedmiotowa.

BLOKADY: `map-field-battle-test` exit=1 (`import_meta.glob is not a function`) — sam potwierdziłem
identyczną czerwień na czystej bazie; INFRA `P-BRAMKA-MAP-FIELD-BATTLE-INFRA-CZERWONA-Q1`.

## ZARZUTY

**1. `battleScene.ts:2566` + `:5222` + `:9202` — GOAL 2 znika po „Rozegraj ponownie".**
Flaga `_startMoralePenaltyApplied` nie jest resetowana w `_resetBattleRuntimeState()` (`:9202-9230`
— resetuje `roundNo`, `engaged`, `turnOrder`, ale nie ją). `_replayBattle()` (`:9233`, podpięte pod
przycisk `onReplay` `:9374`) woła kolejno `_resetBattleRuntimeState()` → `_placeUnits(clony)`, gdzie
`:5097-5098` nadaje świeże `morale: moraleBaseFor(bu), moraleMax: moraleBaseFor(bu)`, → `_startBattle()`
(`:9273`, ścieżka deploy `:15912`). `_applyStartingMoralePowerPenalty()` wychodzi natychmiast na
guardzie `:5222`. Skutek: w powtórce słabsza strona startuje z ułamkiem morale **100%** — dokładnie
stan, który kryterium 4 dispatchu uznaje za niedomknięcie tematu, tylko wywołany innym wejściem.
GOAL 1 tej wady nie ma (`_counterBudget` czyści się w każdym `_beginTurn`). Naprawa: dopisać
`this._startMoralePenaltyApplied = false;` do `_resetBattleRuntimeState()`.

**2. `combat.ts:applyStartingMoralePenalty` — kara nieklampowana do `fleeMorale`; 4 jednostki
startują PONIŻEJ własnego progu ucieczki (kandydat na DO DECYZJI CZŁOWIEKA, nie błąd wykonania).**
Tabela GOAL 2 zakłada bazę morale 100, ale `data/units.json` ma `Morale bazowe` w zakresie 30–120.
Przy sufitowej karze 65% cztery rekordy schodzą na start do wartości ≤ własnego `Morale ucieczki`:
`mb=50/fm=22→18`, `mb=40/fm=25→14`, `mb=30/fm=25→11`, `mb=60/fm=22→21`. Taka jednostka jest złamana,
zanim padnie pierwszy cios. Dispatch tego nie rozstrzyga („startuje BLIŻEJ progu", nie „poniżej"),
a Operator zostawił to jako wolną notę (2) — §3b/§16b pkt 4 zakazują chowania w nocie uwagi
dotyczącej kryterium GOAL. Wytwór sam nie rozstrzyga intencji: czy przy r≥20 natychmiastowy rout
najsłabszych jednostek to zamierzony efekt „słabsza strona ucieka", czy przestrzelenie.

RUNDY: 1/5
NASTĘPNY KROK: Obrona Operatora (§3c pkt 2) — odpowiedź PRZYJMUJĘ/ODRZUCAM z dowodem z wytworu
na każdy zarzut z osobna; następnie Final Control (Sonnet 5 High) → `03-final-control.md`.
DEPLOY/PUSH: NIE WYKONANO
