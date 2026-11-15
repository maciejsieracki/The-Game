# 02 — Evaluator r1: R-RUSTPORT-P4-1I1-BATTLE-OUTCOME

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1I1-BATTLE-OUTCOME
GOAL: `BattleOutcomeDto` (web `BattleResult` + `_sideEndStats`) w `view-model` i producent w silniku dla ścieżek końca E1–E3, E4 z danymi z zewnątrz; `log` pusty z jawnym NIE_ZMIERZONO do I3.
ZMIANY/COMMIT: oceniany kod Operatora `475b795a5583582dd93e9c94c1d281105bfb47a0` (rodzic `84ec520a5` = baza z dispatchu). Ten commit Evaluatora dodaje tylko ten plik.
TESTY: §2 (wszystkie bramki EXIT 0 w obu crate'ach, w tym pełny `cargo test` silnika; 10/10 mutacji FAIL).
BLOKADY: brak blokujących; zarzuty w §5 (wszystkie niskiej wagi, do noty).
RUNDY: 1/5
NASTĘPNY KROK: Obrona / Final Control.
DEPLOY/PUSH: NIE WYKONANO.

Uwaga: `origin/rust-port/parity-v2` przesunęła się w międzyczasie na `02a1560e3`. Dispatch wskazuje bazę `84ec520a5`
i ją sprawdziłem (`git merge-base --is-ancestor 84ec520a5 475b795a5` = tak). Rebase/merge-tree względem nowego parity
należy do integracji.

## 1. Allowlista i zakres

`git diff --stat 84ec520a5 475b795a5`: 13 plików, +2019/-0. Wszystkie leżą na allowliście:
`view-model/src/battle.rs`, `view-model/tests/{battle_outcome.rs (NOWY), common/mod.rs, json_keys.rs, validate.rs}`,
`engine/src/domain/siege_tactics_outcome.rs` (NOWY), `engine/src/domain/mod.rs` (dokładnie 1 linia `pub mod`),
`engine/tests/p4_1i1_battle_outcome.rs` (NOWY) oraz `dyspozycje/autobot/runs/<ID>/**`. Nie ma `Cargo.lock` w commicie.
`git diff --check` jest czysty. Dodane linie nie zawierają `#[ignore]`. Nie usunięto żadnej asercji, bo diff ma 0 linii
usuniętych. Jedyny `ignored` w pełnym teście silnika to istniejący wcześniej `p6_order_lane.rs:1530`
(`dump_tick1_econ_for_web_generator`), spoza tematu.

## 2. Bramki odtworzone przez Evaluatora (worktree detached na `475b795a5`, `CARGO_TARGET_DIR` w scratchpadzie, usunięty)

| Crate | `cargo fmt --check` | `cargo clippy --all-targets -- -D warnings` | `cargo test --all-targets --no-fail-fast` |
|---|---|---|---|
| `rust-port/view-model` | EXIT 0 | EXIT 0 | EXIT 0: 79 passed, 0 failed, 0 ignored |
| `rust-port/engine` | EXIT 0 | EXIT 0 | **EXIT 0: 484 binarki/`test result`, 3549 passed, 0 failed, 1 ignored (istniejący wcześniej)** |

Test tematu `cargo test --test p4_1i1_battle_outcome` dał EXIT 0 (18 passed). To zamyka blokadę 1 Operatora, bo pełny
test silnika teraz został zmierzony do końca.

## 3. Wektory pinu (zbadane niezależnie)

- Wektory odtworzyłem sam: `git show 07d2fbd72:gra/src/battle/battleScene.ts` i `…:gra/src/units/battleRoster.ts`, potem
  `node gen-p4-1i1-vectors.mjs` (node v22.23.4) z rc 0. Wynik jest **identyczny** (porównanie JSON) z
  `p4-1i1-vectors.json` i z `PIN_VECTORS` wklejonym w test (11 wektorów).
- Sprawdziłem zakresy wycinków w pinie: `3715/3748` to granice `_skipInstantFallback`. `9467/9479` to `_finishDraw`.
  `9485/9497` to `_ffRoundCapResult`. `10208` to `if (aliveA && aliveD) return false;` / `10240` to `}`. `10246/10250` to
  `_battleUnitsForMapExport`. `10257/10269` to `_sideEndStats`. `10719/10730` to blok `onFinishCb`. Generator wykonuje
  tekst pinu i nic tu nie jest wpisane ręcznie. Podstawione są tylko `computeInstantResult`, `isSiegeUnit`,
  `_roundCapVerdict` i minimalne `_showEndScreen`, jawnie i zgodnie z opisem.
- Przeczytałem producenta linia po linii względem pinu. Zgadzają się: filtr `hp > 0 && (!dead || routed)` +
  `Math.max(0,hp)`, kolejność E2 atk→def, `_endWinner ?? winner` (z `end: None` = null), `uniqueUnitIds` (pierwsze
  wystąpienie), `wallBreached` tylko przy `siegeWallCol >= 0` (także 0), reguła E4 `:3720-3722`, `_sideEndStats`
  (`out = dead||routed`, `hp` tylko z nie-out, `hpMax` z całego rosteru, `Math.max(0, …)`). E4 `winner` jako
  `BattleSide` bez remisu potwierdza pin `:20580-20589`.

## 4. Mutacje (Evaluator, każda na czystej kopii, test `p4_1i1_battle_outcome`)

| Mutacja | rc | Wynik |
|---|---|---|
| M1 kolejność survivors E2 def→atk | 101 | 3 failed |
| M2 `winner` bez `_endWinner ??` | 101 | 1 failed |
| M3 `wall_breached` zawsze `Some(false)` | 101 | 3 failed |
| M4 brak filtra `hp > 0` (hp 0 w survivors) | 101 | 6 failed |
| M5 (dodatkowa) E4 bez reguły „żywa machina = wyłom” | 101 | 1 failed |
| M6 (dodatkowa) `unique_unit_ids` bez dedupu | 101 | 12 failed |
| M7 (dodatkowa) `hp_max` bez `Math.max(0, …)` | 101 | 1 failed |
| M8 (dodatkowa) `hp` w endStats także z out | 101 | 12 failed |
| M9 (dodatkowa) oblężenie `> 0` zamiast `>= 0` | 101 | 1 failed |
| M10 (dodatkowa) E1/E3 roster przegranego | 101 | 4 failed |
| przywrócony kod | 0 | 18 passed |

Cztery mutacje wymagane przez dispatch dają FAIL. Sześć dodatkowych też daje FAIL, więc testy reagują na zmianę zachowania.

## 5. Zarzuty (ponumerowane)

1. **[niska, dokumentacja] Raport Operatora jest niespójny ze stanem faktycznym.** W §6 `01-operator-r1.md` zamiast SHA
   jest placeholder `COMMIT_SHA` (prawdziwy: `475b795a5`). W §4 jest zdanie „`CARGO_TARGET_DIR` … usunięty po
   bramkach”, a katalog `tgt-en` (3,1 GB) został na dysku. Evaluator usunął go, bo nikt go nie używał. Do poprawy w
   rejestrze przy integracji. Nie dotyczy kodu.
2. **[niska, wpięcie] Producent nie ma wołającego w produkcji ani adaptera z `SiegeLoop`.** `build_battle_outcome` jest
   wołany tylko w teście. Rozpoznanie §4 wiersz I1 mówi „producent … z `SiegeLoop`”, a temat dostarcza wejście ogólne
   `OutcomeInput`/`OutcomeUnit`. `OutcomeUnit::from_seq` wymaga `max_hp` z zewnątrz, bo `SeqUnit`/`CombatUnit` nie
   ma `maxHp`. Brakuje też konstruktora z `SiegeEnv.wall_ever_breached`. Dispatch nie wymaga wpięcia, ale raport
   nie wskazuje tematu, który je zrobi. Rekomendacja: dopisać zależność do indeksu niepodpiętych modułów (#119)
   z tematem wpięcia (K5LOOP-WIRING #113 / P4-1I2 #246) i wskazać źródło `maxHp` w rosterze pętli.
3. **[niska, zakres dispatchu] Dispatch żąda „walidacji `validate.rs` dla nowych pól”, ale `src/validate.rs` nie jest
   na allowliście.** Operator zrobił `BattleOutcomeDto::validate` w `battle.rs` na istniejących wariantach `ViewError`.
   Nie sprawdza `hp > 0` ocalałych (niezmiennik E1–E3), a typy nie są re-eksportowane z `lib.rs`. To uczciwie opisane
   obejście konfliktu dispatch/allowlista. Do decyzji orkiestratora: osobny drobny temat na `validate.rs` + `lib.rs`.
4. **[informacyjna, kontrakt JSON] `wallBreached: None` serializuje się jako jawne `null`, a web pomija klucz.** Jest to
   zgodne z konwencją crate'a (`view-model/src/lib.rs:15-19`) i przypięte testem `json_keys.rs`. Adapter
   (P4-1G/I4) musi traktować `null` jako „brak oblężenia”. Bez zmian w kodzie.
5. **[informacyjna, NIE_ZMIERZONO] `end_stats` liczone są z migawki w chwili `onFinish`, a web liczy je w
   `_showEndScreen`.** Jest to założenie zgodności migawek przy zmianach rosteru między ekranem końca a kliknięciem,
   jawnie opisane w §5.6 raportu Operatora i w doc-u modułu. Bez wektora dla takiego przypadku, ale opis jest uczciwy.

Żaden zarzut nie dotyczy poprawności parytetu E1–E3/E4 ani bramek.

## 6. Werdykt

PASS-WITH-NOTES. Kod `475b795a5` spełnia kryteria końca 1–3 dispatchu. Bramki w obu crate'ach dają EXIT 0, w tym pełny
`cargo test` silnika (3549/0/1 istniejący wcześniej ignore). Wektory pinu są odtwarzalne i zielone, mutacje dają FAIL,
allowlista jest czysta. Zarzuty 1–3 trzeba zapisać w rejestrze przy integracji.
