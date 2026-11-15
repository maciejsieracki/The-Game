STATUS: PASS-WITH-NOTES
DOMAIN: GAME (rozpoznanie, tylko odczyt)
TEMAT: R-RUSTPORT-P4-1I-BATTLE-ROZP-Q1
GOAL: rozpoznanie producenta zdarzeń bitwy (`BattleEventsDto`/snapshot, #218) wg pinu `07d2fbd72`
ZMIANY/COMMIT: `dyspozycje/rust-port/p4/P4-1I-BATTLE-ROZPOZNANIE.md`, ten plik; gałąź `obrona/R-RUSTPORT-P4-1I-BATTLE-ROZP-Q1` na `ed07607c4` (Operator r1); SHA w raporcie końcowym
TESTY: nie dotyczy (dokument, bez zmian kodu); `git diff --cached --check` czysty; allowlista: 2 pliki
BLOKADY: brak
RUNDY: obrona po Evaluatorze r1 (1/5)
NASTĘPNY KROK: Final Control
DEPLOY/PUSH: NIE WYKONANO

# Obrona Operatora — odpowiedzi na zarzuty Evaluatora (02-evaluator.md, a1eb1d3e2)

Pin: `07d2fbd72`, `gra/src/battle/battleScene.ts` (odczyt `git show`). Baza Rust: `c3e3617b2`.

## Z1 (istotny) — cztery źródła survivors — PRZYJMUJĘ

Dowód (pin): `_endSurvivors` przypisywane w `:3746` (`_skipInstantFallback`), `:9474-9477` (`_finishDraw`, obie strony),
`:9495` (`_ffRoundCapResult`, strona zwycięzcy), `:10237` (`_checkEnd`, strona zwycięzcy z `:10224-10226`); reset `:10542`.
`_skipInstantFallback`: `wallEverBreached = true` przy żywej machinie atakującego (`:3720-3722`), `computeInstantResult`
(`:3723`, definicja `:20389`) woła `resolveCombat` (`:20534`), log z `result.log` (`:3744`).
W Rust brak `compute_instant_result` (`git grep -i` → 0); `combat::resolve` jest w `combat.rs:381`.

Poprawka w dokumencie:
- wiersz #27 przepisany: 4 źródła; `CombatResult` dotyczy bitwy taktycznej w ścieżce „Pomiń”; brakuje agregacji;
- §2a: `survivors`, `log`, `wall_breached` odsyłają do nowej §2a.1;
- nowa §2a.1: tabela E1 (`_checkEnd`), E2 (`_finishDraw`), E3 (PAT FF), E4 („Pomiń”) z winner/survivors/wallBreached/log
  i wejściem Rust oraz lista różnic (E2 obie strony; E4 bez `routed`, `wallBreached` z reguły machiny, HP z `resolveCombat`);
- §3: nowa luka L9 (agregacja `computeInstantResult` + reguła machiny);
- §4: I1 obsługuje E1–E3 z jawnym enumem ścieżki końca i wektorami remisu/PAT; nowy temat `R-RUSTPORT-P4-1I1B-BATTLE-INSTANT` dla E4.

## Z2 (średni) — zawężenie survivors do {id, hp} — PRZYJMUJĘ (weryfikacja dopisana, typ utrzymany z dowodem)

Dowód:
- bezpośrednie przypisania pól `bu` w `battleScene.ts`: `grep -nE "\.bu\.[A-Za-z_]+ *(=|\+=|-=|\*=)[^=]"` → tylko `hp`
  (`:8991`, `:11683-11684`) i `armyLeaderMoraleBonusFrac` (`:9999`);
- konsumenci `res.survivors` czytają tylko `id` i `hp`: `main.ts:34514`, `main.ts:34537`, `post-battle-map.ts:28-31`
  (`ManualSurvivor { id: string; hp?: number }`), `:169-172`, `siegeDefenders.ts:375-376`; reszta (`main.ts:33612`,
  `:34344`, `:36712`, `:36724`, `mapFieldBattle.ts:560`) tylko przekazuje tablicę dalej (`main.ts:33701`, `:34435`).

Poprawka: akapit „Zawężenie typu `survivors` do `{id, hp}` — weryfikacja” w §2a.1 oraz jawne NIE_ZMIERZONO w §5 dla mutacji
`bu` w funkcjach spoza `battleScene.ts`, z uzasadnieniem, że typ `{id, hp}` jest bezpieczny niezależnie od tego pomiaru.

## Z3 (drobny) — przesunięte cytaty — PRZYJMUJĘ

Sprawdzone na bazie i pinie: `def_hp_after` → `siege_tactics_loop.rs:844`; `"atak-muru"` → `:810`;
`BattleUnitSpawnDto.id` → `view-model/src/battle.rs:85`; morale wyłomu muru → `battleScene.ts:7745-7750`,
bramy → `:7804-7810`. Poprawione w wierszach #7, #16, #17, #19, w §2 i w wektorach I5 (§4). Dodatkowo `_skipInstantFallback`
`:3718-3748` → `:3715-3748` (początek funkcji).

## Z4 (drobny) — „brak dispatchEvent ani subskrypcji” — PRZYJMUJĘ

Dowód: `addEventListener` w `:3329` (`document`, klik ustawień) i `:3499-3512` (`resize`, `wheel`, klawisze). Poprawka w §0 pkt 1:
„brak emitera zdarzeń bitwy, `dispatchEvent` ani subskrypcji zdarzeń bitwy; `addEventListener` tylko dla wejścia UI”.

## Z5 (proces, informacyjny) — PRZYJMUJĘ do wiadomości, bez poprawki

Temat jest dokumentacyjny; zmiany tej rundy nie dotykają `rust-port/**` ani `gra/`, więc bramki cargo nie dotyczą.
Dysk przy starcie obrony: 6,2 GB wolnego (`df -h /`); cargo nie uruchamiane.
