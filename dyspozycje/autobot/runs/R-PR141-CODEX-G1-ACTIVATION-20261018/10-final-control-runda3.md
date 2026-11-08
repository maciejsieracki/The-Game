# 10 — Final Control, runda 3

STATUS: PASS-WITH-NOTES — poprzedni Final Control uzupełniony o root finding 4 i niezależny recheck.
TEMAT: R-PR141-CODEX-G1-ACTIVATION-20261018
DATA: 2026-10-18
ZAKRES: G1 `rangedAtk` precedence w agregatorze i spójność projection/test. Bez zmian produktu i bez ponawiania testów.

## Werdykt

**Finding 4: PASS / CLOSED.** Naprawa dodaje `replacedStats.has('rangedAtk')` do końcowego składania statystyki w `civCombatStatMultipliers()`, a dedykowany test dowodzi rzeczywistego legacy parser route `dystans` z macierzą zerową i niezerową. Niezależny evaluator r3 potwierdza brak zastrzeżeń. Wcześniejsze raporty i findings pozostają historyczne; r3 je nie nadpisuje.

## Kryterium zmienione w tej rundzie

- **G1 ranged precedence — PASS.** Przy legacy `rangedAtk +30%` i oddzielnym legacy melee `atk +20%`, matrix zero daje `rangedAtk=0` przy zachowaniu `atk=+20%`; matrix `+10%` daje dokładnie `rangedAtk=+10%`, nadal z `atk=+20%`. Chiński parser path nadal daje legacy melee `atk`, a G1 `walka_dystans_lukownicy` pozostaje `missileAttack`, nie zasięgiem. UI projection używa tej samej per-stat maski.
- **Zakres sąsiedni — PASS-WITH-NOTES.** W tej poprawce zmieniono wyłącznie końcowe złożenie `rangedAtk` i dodano ograniczone asercje. Nie znalazłem podstaw do zmiany wcześniejszych wyników dotyczących rozdziału pozostałych statów, warunków, naval/ground projekcji, ani jednokrotnego canonical/fallback maxHP. Ich wcześniejsze dowody pozostają w 02–07 i 08–09; nie były ponawiane w tej rundzie.
- **Walidacja — PASS według zapisów Operatora/Evaluatora.** Target G1 PASS; `civ-bonusy-test.cjs` 54/0 PASS; `git diff --check` PASS. TSC PASS i `combat-test.cjs` 6/6 są zapisane dla poprzedniej rundy, a evaluator wyraźnie ich tu nie powtarza. Final Control nie uruchamiał testów.

## Granice i routing

To zamyka bounded G1 activation wraz z ranged stat findingiem, nie world/runtime battle, pełne PR acceptance ani READY_FOR_DEPLOY. Brak dalszej autonomicznej pracy w tym scope; root może wykonać dokładny shared-diff review i integrację. Nie wykonano builda, browsera, runtime ani publikacji.

DEPLOY/PUSH: NIE WYKONANO
