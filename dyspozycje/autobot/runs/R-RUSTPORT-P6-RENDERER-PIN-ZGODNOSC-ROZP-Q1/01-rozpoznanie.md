STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS / GAME (odczyt, bez zmian kodu)
TEMAT: R-RUSTPORT-P6-RENDERER-PIN-ZGODNOSC-ROZP-Q1 (runda 1, Operator, Haiku)
GOAL: sprawdzić, czy `rust-port/renderer/src/battle/orders.rs` cytuje numery linii webu zgodne z pinem `07d2fbd72`, a jeśli nie, wskazać źródło rozjazdu i pliki do aktualizacji.
BAZA: `origin/rust-port/parity-v2` = `de88d9d55` (worktree przełączony detached na tę bazę, zgodnie z dispatchem).
PIN: `07d2fbd72` (`gra/src/battle/battleScene.ts`, 20771 linii).
ORIGIN/MAIN: `c284fe02d` (`gra/src/battle/battleScene.ts`, 21399 linii).
EDB: `edb8fb56` (`gra/src/battle/battleScene.ts`, 19493 linii).

## 1. Co cytuje orders.rs

Plik nagłówka `orders.rs` deklaruje w komentarzu źródło: „CURRENT web `battle/battleScene.ts` (`origin/main`)”. Nie cytuje `edb8fb56` jako źródła numerów linii; `edb8fb56` pojawia się tylko historycznie (linie 5–7: „Pin `edb8fb56` ... had no attack-move order”). Premisa dispatchu („cytuje commit edb8fb56”) jest więc tylko częściowo potwierdzona: numery są oznaczone jako `origin/main`, a sprawdzenie pokazuje, że nie zgadzają się też z nim.

## 2. Tabela cytatów (orders.rs)

Wiersz pinu = zawartość linii cytowanej w `07d2fbd72`. „Faktyczna pozycja” = gdzie funkcja naprawdę leży w pinie.

| orders.rs (wiersz) | cytowane (źródło) | zawartość wiersza w pinie 07d2fbd72 | faktyczna pozycja w pinie | zgodne |
|---|---|---|---|---|
| :13 kolejka w `_activateNext` | `:5847-5898` (origin/main) | `_disposeAutoBatchPlanningRoster` (5847), `}` (5898) | `_activateNext` 5979–6031; konsumpcja kolejki 5994 i 6013 | N |
| :14 / :198 `_issueBattleAttackMove` | `:18076-18096` (origin/main) | `} else {` (18076), `}` (18096) | 18682–18702 | N |
| :15 / :252 `_cancelAttackMoveSelected` | `:18098-18106` (origin/main) | `const adj = this._pickAdjacentTargetByPriority(ru);` (18098), `return true;` (18106) | 18704–18713 | N |
| :15 Escape w `_onKeyManual` | `:16850-16856` (origin/main) | `if (units.length === 0) return;` (16850), `const discGeo = ...` (16856) | `_onKeyManual` 17406–~17421; wywołanie `_cancelAttackMoveSelected` w 17410 | N |
| :122 filtr kandydatów `!cand.dead && !cand.fadingOut && !cand.removed && !cand.acted` (`:5861`) | `:5861` | `}` | właściwy filtr w pinie: wiersz 5993 (`if (cand && !cand.dead && !cand.fadingOut && !cand.removed && !cand.acted)`) | N |
| :142 zakres `_activateNext` (`origin/main :5853-5866`) | `:5853-5866` (origin/main) | `ru.moraleBarBg,` (5853), `let completed = false;` (5866) | jw. (5979–6031) | N |
| :176 `:5881-5883` (przy konsumpcji) | `:5881-5883` (origin/main) | `return;` (5881), `if (ru.routed) {` (5883) | konsumpcja w 5994 i 6013 | N |

Wynik: 0 z 7 cytowanych zakresów zgadza się z pinem 07d2fbd72. Ten sam wynik daje porównanie z `origin/main` (`c284fe02d`) — tam cytowane numery też nie wskazują właściwych funkcji (`_activateNext` 6163, `_onKeyManual` 18025, `_issueBattleAttackMove` 19301, `_cancelAttackMoveSelected` 19323) — oraz z `edb8fb56` (`_activateNext` 5675, `_onKeyManual` 16463; brak `_issueBattleAttackMove`, zgodnie z historycznym opisem w nagłówku).

Przesunięcia między wersjami nie są stałe (pin vs cytat: -132 dla `_activateNext`, -606 dla `_issueBattleAttackMove`, -556 dla `_onKeyManual`; main vs cytat: +316, -1225, -1175), więc nie da się ich poprawić jedną korektą. Numery w `orders.rs` pochodzą z innej wersji pliku niż wszystkie trzy porównywane.

## 3. Historia commitów cytowanych w nagłówku

- `601fc3baf` („Add manual attack-move battle order”) i `96d088b4d` („clear stale queued order ids after activation”) istnieją w repo.
- Oba są przodkami `origin/main`.
- Oba NIE są przodkami pina `07d2fbd72`, mimo że funkcje (`_issueBattleAttackMove`, `_cancelAttackMoveSelected`) występują w pinie. Pin zawiera więc tę logikę innym drogą niż te dwa commity. Wymaga to osobnego sprawdzenia przed jakimkolwiek przesunięciem pinu; NIE_ZMIERZONO, czy treść pina jest bajt-w-bajt równa treści z tych commitów.

## 4. Inne pliki rust-port cytujące edb8fb56

`git grep -l edb8fb56 -- rust-port` zwraca 501 plików:
- `rust-port/engine/tests`: 194
- `rust-port/renderer/src`: 120
- `rust-port/renderer/tests`: 80
- `rust-port/engine/data`: 63
- `rust-port/engine/src`: 43
- `rust-port/assets/MANIFEST.tsv`: 1

Większość to nagłówki pochodzenia danych (`derived/*.json`, testy wektorów), a nie numery linii battleScene. `orders.rs` nie jest na tej liście jako cytujący edb8fb56 w numerach linii (tylko w historii w nagłówku, linia 5). W `rust-port/renderer/src` pozostałe 119 plików należy zweryfikować osobno, jeśli temat ma objąć cały renderer.

Dodatkowo w `rust-port/engine/src/domain/` jest wiele komentarzy z numerami linii `battleScene.ts` (np. `siege_tactics_activate.rs:2` cytuje `battleScene.ts:6048-6299` jako pin `07d2fbd72`; `siege_tactics_approach.rs`, `siege_no_breach.rs`, `siege_city_fortification.rs` cytują `battleScene.ts:7924`–`9456`). Nie zostały sprawdzone w tym temacie; wymagają osobnego przeglądu w tym samym stylu.

## 5. Lista plików do aktualizacji numerów linii (bez zmiany kodu, dla kolejnego tematu)

1. `rust-port/renderer/src/battle/orders.rs`: nagłówek (linie 3, 13–15), komentarze przy `122`, `142`, `176`, `198`, `252` (cytaty `:5847`, `:18076`, `:18098`, `:16850`, `:5853`, `:5861`, `:5881`).
2. Pozostałe pliki z numerami linii battleScene do przeglądu (nie objęte tym rozpoznaniem w całości): `rust-port/engine/src/domain/siege_*.rs` (wg wyniku grep, 171 plików z odwołaniem do `battleScene`).

## 6. Wniosek

Numery linii w `orders.rs` NIE są zgodne z pinem `07d2fbd72` (0/7 zgodnych), ani z `origin/main`, ani z `edb8fb56`. Wymagają poprawy: każdy cytat trzeba przepisać na pozycje z pina po wyszukaniu funkcji po nazwie. Nie zmieniano kodu. Ustalenie „cytuje edb8fb56” jest nieprecyzyjne, bo nagłówek deklaruje `origin/main`; w obu przypadkach wynik jest ten sam: numery są błędne.

## 7. Ograniczenia

- NIE_ZMIERZONO: czy treść funkcji w pinie jest identyczna z tą z `601fc3baf`/`96d088b4d` (nie porównywano diffów).
- NIE_ZMIERZONO: pełne pokrycie 119 plików `renderer/src` i 171 plików `siege_*`/`battleScene` z numerami linii.
- Dla każdego cytatu sprawdzono zawartość jednej linii oraz położenie funkcji po nazwie, bez pełnej weryfikacji semantycznej każdego zdania komentarza.

ZMIANY/COMMIT: tylko `dyspozycje/autobot/runs/R-RUSTPORT-P6-RENDERER-PIN-ZGODNOSC-ROZP-Q1/01-rozpoznanie.md` (commit na gałęzi roboczej, SHA w odpowiedzi).
TESTY: nie dotyczy (tryb odczytu, bez cargo).
BLOKADY: brak.
RUNDY: 1/5. Ostatni werdykt: brak (runda Operatora).
NASTĘPNY KROK: Evaluator (Sonnet) weryfikuje tabelę cytatów; po PASS osobny temat poprawy numerów w `orders.rs`.
DEPLOY/PUSH: NIE WYKONANO (brak push, brak integracji, zgodnie z dispatchem).
