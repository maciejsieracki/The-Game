# 01-operator-runda2.md — R-WOJNA-WYMUSZONA-PAROWANIE-ZAMIAST-DOMINA-Q1, Operator runda 2/5

STATUS: PASS
DOMAIN: GAME
TEMAT: R-WOJNA-WYMUSZONA-PAROWANIE-ZAMIAST-DOMINA-Q1
GOAL: Naprawić dwie czerwone bramki wskazane przez Final Control rundy 1 — mutacje probe'a
Żelaza na NOWYM kodzie pre-pass oraz asercje D/E/F live-testu domina pod nowy kształt
algorytmu (cel tylko jednej stronie pary) — bez osłabiania pokrycia mutacyjnego.

## ZMIANY/COMMIT
Worktree `/home/user/wt-wojny-domino`, HEAD startowy `041b8a01` (potwierdzone `git log -1`
przed pracą). Zmienione WYŁĄCZNIE dwa pliki z allowlisty:
- `gra/tools/forced-war-iron-mutant-probe.cjs`
- `gra/tools/forced-war-trojstronna-domino-live-test.cjs`
Zero zmian w `forced-war-common.ts`/`forced-war-{bronze,stone,iron}.ts`/`main.ts` (zgodnie
z zakazem tej rundy — naprawiamy WYŁĄCZNIE bramki, nie logikę).

## MAPOWANIE USUNIĘTA→NOWA (reguła przeciw samooszukiwaniu, każda dead mutation ma następcę)

Dead M38-M44/M56 celowały w usunięty w rundzie 1 kod per-owner (`ironCandidates`,
`ironBlockedOwnerIds`, `pickIronForcedWarTargetId` w pętli `ownerLoop`). Zastąpione
mutacjami na NOWYM, wspólnym kodzie pre-pass (`assignForcedWarPairings` i punkt wywołania,
main.ts ok. 1949-1958 / 30383-30532 / 31283-31289):

| Dead (usunięta) | Cel dead (własność) | Następca (nowa) | Cel następcy (ta sama własność, nowy kod) |
|---|---|---|---|
| M38 | wyzwalacz podmieniony na próg tury | **M38a** | to samo, na trigger blocku `isIronEraEntry` (main.ts ~1949) |
| — (nigdy nie istniała) | — | **M38b** | wyzwalacz przestaje wykluczać miasta-państwa/kopie |
| — (nigdy nie istniała) | — | **M38c** | wyzwalacz przestaje zapamiętywać `ironEraEnterTurnByOwner.set` |
| M39 | barbarzyńca dopuszczony jako napastnik | **M39** | to samo, na wspólnej pętli pre-pass (guard `isBarbarian` usunięty z bloku Brąz/Kamień/Żelazo naraz) |
| M40 | kwalifikacja omija `isEligibleForIronForcedWar` | **M40a** | to samo, wywołanie zastąpione `!alreadyAtWarAnyRole` w pre-pass |
| — (nigdy nie istniała) | — | **M40b** | wywołanie traci `currentTurn`/`eraEnterTurn` (próg 25 tur nigdy nie sprawdzany) |
| M41 | cykl po odpoczynku nie sprawdza wojny | **M41** | to samo, na `searchingAfterRest` w pre-pass (usunięte `!alreadyAtWarAnyRole`) |
| M42 | gracz wykluczony z puli (regresja odwrotna) | **M42** | ECHO krok 1: gracz dołącza BEZWARUNKOWO (usunięty warunek `totalActiveForcedWarsByOwner(0)===0`) |
| M43 | blokada pokoju nie wyklucza celu | **M43** | to samo, na `isForcedWarPairBlocked` (usunięte `isPeaceLockedBetween`) |
| M44 | wybór celu bez `blockedOwnerIds` | **M44a** | `assignForcedWarPairings` wołane bez `hexDistanceFn` |
| — (nigdy nie istniała) | — | **M44b** | wynik Żelaza czytany spod etykiety `'bronze'` zamiast `'iron'` (`forcedWarAssignmentByOwner`) |
| M56 | reset nowej gry gubi CAŁY blok 4 rejestrów | **M56a** | reset gubi WYŁĄCZNIE `ironEraEnterTurnByOwner.clear()` |
| — (nigdy nie istniała) | — | **M56b** | reset gubi `ironForceWarActiveByPairKey.clear()` (licznik clear<2 łapie "eliminacja i nowa gra") |
| — (nigdy nie istniała) | — | **M56c** | deklaracja `ironEraEnterTurnByOwner` przemianowana |
| — (nigdy nie istniała) | — | **M56d** | save snapshot gubi `ironEraEnterTurnByOwner` |
| — (nigdy nie istniała) | — | **M56e** | restore traci guard `?.length` |

Dodatkowo: M09/M10 (Final Control: pre-istniejące, poza zakresem tej rundy — zerwane przez
WCZEŚNIEJSZY temat R-WOJNA-WYMUSZONA-ZELAZO-PROG-TURY-Q1, dodanie `turnThresholdMet` do
`isEligibleForIronForcedWar`) miały martwą kotwicę tekstową. Skoro binarne kryterium tej
rundy wymaga probe'a W PEŁNI zielonego, poprawiłem WYŁĄCZNIE kotwicę (treść/cel mutacji bez
zmian) — nie jest to praca w zakresie tej rundy nad logiką, tylko domknięcie bramki. Dopisana
też **M04b** (próg startu 25→10 tur) — jedyna pozostała, nigdy nieistniejąca dziura w
pokryciu kontraktu czystego po naprawie M09/M10.

Razem: 16 nowych/poprawionych mutacji w probie (M38a/b/c, M39, M40a/b, M41, M42, M43, M44a/b,
M56a/b/c/d/e, M04b) + 2 poprawki kotwic (M09, M10) — w granicach zapowiedzianych ~15-20 przez
Final Control.

## LIVE-TEST DOMINA — ASERCJE D/E/F PRZEPISANE

Zweryfikowano w `forced-war-common.ts`: `chosenSide = Math.min(pair.attackerId, pair.targetId)`
(krok 4 dołączania leftover). Hak `forceBronzeForcedWarDominoOnPlayer()` ustawia
`targetId = max(wszystkie ownerId) + 1000`, więc `attackerId < targetId` ZAWSZE —
deterministycznie wybraną stroną jest attacker.
- **D**: attacker WYPOWIADA wojnę (bez zmian sensu), target **NIE** (nowość — stare domino
  dawało obu).
- **E/F**: bez zmian sensu (żadna strona), ale dodana asercja: DOKŁADNIE jeden log
  `DECISION_REQUIRED[0]` na scenariusz — to SPODZIEWANE zachowanie (ECHO: brzegowy przypadek
  "wszystkie pary zablokowane" → `unresolvedOwnerIds`/DECISION_REQUIRED, nie zgadywanie), nie
  regresja.
- **G**: przepisana na "zero NIEOCZEKIWANYCH console.error" (dopuszcza dokładnie 2 oczekiwane
  logi DECISION_REQUIRED[0] łącznie z E+F), zamiast tautologicznego "zero wszystkich błędów"
  które fałszywie czerwieniłoby się na poprawnym, udokumentowanym zachowaniu ECHO.

## TESTY (wszystkie z `gra/`)
- `npx tsc --noEmit` → 0 błędów.
- 5 referencyjnych: logic 213/213, tech-tree 19/19, research 33/33, unit-replace 13/13,
  combat 6/6.
- Cała rodzina (`find tools -iname "*forced-war*" -o -iname "*wojna*wymuszona*"`, wykluczając
  `.forced-war-bronze-bundle.cjs`/`.forced-war-bronze-entry.ts` — nie są bramkami): 17 plików,
  wszystkie PASS:
  bronze-test 56/56, bronze-main-guard 28/28, bronze-new-game-reset 34/34, stone-test 38/38,
  stone-main-guard 19/19, iron-test 55/55, iron-main-guard **37/37**,
  iron-era-enter-turn-save-load 20/20, trojstronna-test 23/23, trojstronna-main-guard 14/14,
  reguly-multi-turn-simulation 39/39, p-wojna-wymuszona-trzy-naprawy 13/13,
  wojna-wymuszona-parowanie-test 47/47, player-target-live 11/11 (Playwright),
  iron-player-target-live 11/11 (Playwright),
  **forced-war-iron-mutant-probe.cjs: PEŁNY PASS (kontrakt czysty 55/55, bramka main/ai
  37/37, exit 0)**, **forced-war-trojstronna-domino-live-test.cjs: PEŁNY PASS (28/28, exit
  0)** — dwie bramki blokujące rundę 1 są teraz zielone.

## BLOKADY
Brak.

## RUNDY: 2/5
## NASTĘPNY KROK: Evaluator rundy 2.
## DEPLOY/PUSH: NIE WYKONANO
