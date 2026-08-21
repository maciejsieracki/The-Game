# 02-evaluator — R-PRACA-MIASTO-SPLIT-BUDZET-AUTOMAT-Q1

TIMESTAMP: 2026-08-20 22:32:36 Europe/Warsaw  
CHECKOUT: `Civ-clean-main-2026-08-20`  
HEAD: `47cdca15757efb89d5e634e9e9ddff370925708d` (`47cdca15`)  
RUN: runda 1/5; ten sam pełny ID, bez duplikatu  
ROLA: niezależny Evaluator  
INTEGRACJA/COMMIT/DEPLOY/PUSH: NIE WYKONANO

## Materiał i kontrakt

Przeczytano `00-dispatch.md` i `01-operator.md` właściwego runu. Potwierdzam kontrakt: globalny podział ulepszenia `0–50%`, budynki `100% − ulepszenia`; automatyczne ulepszenia miasta `0–100%`; lokalny podział miasta budynki/pula `0–100%`. Operator rozdzielił pojęcia poprawnie; nie stwierdzono funkcjonalnej sprzeczności.

## Bramy

| Bramka | Wynik |
|---|---|
| `npm run typecheck` (`tsc --noEmit`, `gra/`) | PASS, exit 0 |
| `node tools/praca-split-ui-test.cjs` | PASS, 7/7 |
| `node tools/auto-improvements-test.cjs` | PASS, 43/43 |
| `node tools/wire-ekonomia-test.cjs` | PASS, 37/37 |
| `node tools/empire-city-defaults-test.cjs` | PASS, 49/49 |
| `node tools/praca-miasto-limit-50-test.cjs` | PASS, 4/4 |
| `node tools/praca-panel-parity-test.cjs` | PASS, 16/16 |
| `git diff --check HEAD` | PASS, brak błędów whitespace |

Pierwsza próba testów dynamicznych dostała sandboxowe `EPERM` przy zapisie tymczasowego entrypointu; ponowienie z wymaganym dostępem zakończyło się wynikami powyżej. Nie traktuję pierwszej próby jako FAIL funkcjonalnego.

## Allowlista i izolacja

Niepotwierdzone. `git status --short` pokazuje obcy, zastany dirty worktree poza allowlistą, m.in. pliki procesu AutoBot, dokumentację, `gra/src/game/ai.ts`, `economy-upkeep.ts`, `main.ts`, scenę bitwy, inne panele i testy oraz nieśledzone runy. W allowlistowanych plikach występują również niepowiązane zmiany, m.in. dodatkowe hunki rekrutacji w `cityPanel.ts` oraz zmiany testów niebędące dowodem tego runu. Nie da się potwierdzić odseparowanego diffu względem HEAD `47cdca15`.

To blokada procesowa, nie przypisanie obcych zmian do tego tematu i nie funkcjonalny FAIL testów.

## Werdykt

**BLOCK — funkcjonalnie PASS, procesowo brak potwierdzonej izolacji i zgodności rzeczywistego diffu z allowlistą.**

`PASS-WITH-NOTES` nie wystarcza, ponieważ izolacja jest kryterium dispatchu. Nie wystawiono `READY_FOR_DEPLOY`.

## Routing

Przy `BLOCK` wrócić po guardzie rund do **tego samego Operatora i tego samego pełnego ID**; nie tworzyć duplikatu. Następny Operator ma przygotować odseparowany diff zgodny z allowlistą, rozstrzygnąć niepowiązane hunki i przedstawić dokładnie nazwaną macierz testów. Po korekcie ponowić Evaluator.

Guard limitu: obecnie `1/5`; po pięciu nieudanych/niezamkniętych rundach obowiązuje `LIMIT-5-EXCEEDED` i zakaz kolejnego dispatchu bez jawnej decyzji. Limit nie został przekroczony.

STATUS: BLOCK  
TEMAT: R-PRACA-MIASTO-SPLIT-BUDZET-AUTOMAT-Q1  
GOAL: rozdzielenie globalnego splitu Pracy, automatu ulepszeń i lokalnego splitu miasta  
ZMIANY/COMMIT: zapisano wyłącznie ten raport; brak commita  
TESTY: patrz tabela; `tsc` i `diff-check` PASS  
BLOKADY: obcy dirty diff, niepotwierdzona izolacja/allowlista  
NASTĘPNY KROK: ten sam Operator i ID po guardzie rund  
DEPLOY/PUSH: NIE WYKONANO
