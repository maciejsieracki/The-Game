STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P3-4B-IDS-NEWTYPE-REFACTOR-Q1
GOAL: Wdrożyć konsekwentne stosowanie newtypów `PlayerId`/`CityId`/`UnitId` (istniejących w `ids.rs`)
w strukturach, które dziś używają surowego `u64`/`i64`: `PlayablePlayer.id`, `CombatUnit.id`, pola
`AiUnit`/`BarbUnit`. Kontynuacja P3.4 (zamkniętego jako PASS-WITH-NOTES częściowy — tylko
`SCHEMA_VERSION` — z powodu błędnej bazy startowej i niewyjaśnionej struktury dwóch gałęzi w
pierwszym dispatchu; pełna diagnoza: `dyspozycje/autobot/runs/R-RUSTPORT-P3-4-IDS-VERSIONING-Q1/
04-orchestrator-disposition.md`).
RUNDA: 1/5
MODEL+EFFORT: Operator: Haiku 5.5 medium. Evaluator: Haiku 5.5 medium. Final Control: Sonnet 5.5
  medium. Wszystko wyłącznie przez agent() w Workflow, Operator w izolowanym worktree.

KONTEKST — PRZECZYTAJ TO PRZED JAKĄKOLWIEK INNĄ CZYNNOŚCIĄ
Repozytorium ma DWIE gałęzie o różnym przeznaczeniu: `rust-port/parity-v2` (WYŁĄCZNIE kod —
`rust-port/engine/**`, `src-tauri/**`; TU pracujesz) i `claude/sprawdzenie-funkcjonalnosci-ek4ra0`
(WYŁĄCZNIE dokumentacja — `dyspozycje/**`; żaden plik stamtąd NIE jest przodkiem Twojej bazy kodu —
to oczekiwana, zamierzona struktura, NIE błąd ani niespójność procesu do zgłaszania). Dokument
kontekstowy `dyspozycje/rust-port/p2/P2-3-ENTITY-IDS.md` (potrzebny niżej) istnieje WYŁĄCZNIE na
gałęzi dokumentacyjnej. Odczytaj go przez:
```
git fetch origin claude/sprawdzenie-funkcjonalnosci-ek4ra0
git show origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0:dyspozycje/rust-port/p2/P2-3-ENTITY-IDS.md
```
PIERWSZY KROK, przed czymkolwiek innym:
```
git fetch origin rust-port/parity-v2
git checkout --detach origin/rust-port/parity-v2
```
Potwierdź, że jesteś na commicie zawierającym `df8d8592` lub nowszym (`git log --oneline -1` powinien
pokazać historię z P3.5A-E i P3.4-SCHEMA_VERSION) — jeśli nie, baza jest zła, zatrzymaj się i popraw
PRZED dalszą pracą.

Przeczytaj OBOWIĄZKOWO (przez `git show` jak wyżej, z gałęzi dokumentacyjnej):
`dyspozycje/rust-port/p2/P2-3-ENTITY-IDS.md` CAŁY (§9 — schemat ID ROZSTRZYGNIĘTY: newtype `u64` per
typ, `OwnerRef` enum zamiast liczb ujemnych; §4 tabela pól RuntimeUnit z przykładami niekonsekwencji;
punkt 10(a)-(c) Final Control: "zakaz surowego u64/i64 jako ID w GameState/DTO — wymaga przepisania
PlayablePlayer/CombatUnit/AiUnit/BarbUnit na newtypy w fazie implementacji" — TA FAZA TRWA TERAZ).

ZADANIE
1. `git grep` w `rust-port/engine/src/` dla miejsc gdzie `PlayablePlayer.id`, `CombatUnit.id` i
   analogiczne pola w `AiUnit`/`BarbUnit` są typu `u64`/`i64` zamiast `PlayerId`/`CityId`/`UnitId`
   (z `ids.rs`). Zamień typ pola na odpowiedni newtype.
2. Napraw WSZYSTKIE miejsca użycia (konstrukcja, porównania, arytmetyka jeśli istnieje — newtype
   prawdopodobnie nie wspiera arytmetyki wprost, użyj `.0` albo metody pomocniczej — minimalnie, bez
   budowania API na zapas).
3. Zastąp liczby ujemne oznaczające "brak właściciela"/"barbarzyńca" przez `OwnerRef` z P2.3 §9,
   JEŚLI da się bez przebudowy większych fragmentów logiki — jeśli zbyt duże, opisz jako zakres
   przyszłej pracy, nie rób połowicznie.
4. Upewnij się, że WSZYSTKIE istniejące testy (stan po P3.5A-E, baza `df8d8592` — sprawdź faktyczną
   liczbę `cargo test` PRZED zmianami) nadal przechodzą po refaktorze typów — to refaktor, nie zmiana
   zachowania.

ANTY-HALUCYNACYJNA REGUŁA
Zakaz częściowego refaktoru bez jawnego zaznaczenia zakresu pominiętego — jeśli jakieś użycie
surowego ID zostanie celowo pominięte, WYPISZ je jawnie z uzasadnieniem. Zakaz twierdzenia "testy
przechodzą" bez wklejonego surowego logu `cargo test` Z PRZECHWYCONYM KODEM WYJŚCIA (`echo "EXIT=$?"`
zaraz po komendzie, wklejone do dokumentu dosłownie, nie przepisane ręcznie).

BINARNE KRYTERIUM SUKCESU
`PlayablePlayer.id`, `CombatUnit.id` używają newtypów (nie `u64`/`i64`) z dowodem (`git grep` przed/
po), `cargo build`+`cargo test` zielone (exit 0, wszystkie testy PASS, liczba nie niższa niż baseline
przed zmianą) z surowym logiem, w nowym pliku `dyspozycje/rust-port/p3/P3-4B-IDS-NEWTYPE-REFACTOR.md`.

ALLOWLISTA
Dokument: `dyspozycje/rust-port/p3/P3-4B-IDS-NEWTYPE-REFACTOR.md` (NOWY), `dyspozycje/autobot/runs/
R-RUSTPORT-P3-4B-IDS-NEWTYPE-REFACTOR-Q1/**`. Worktree (`rust-port/parity-v2`, baza `df8d8592` lub
nowsza): `rust-port/engine/src/domain/playable.rs`, `combat.rs`, plik(i) z `AiUnit`/`BarbUnit`
(sprawdź który — `git grep AiUnit BarbUnit`). Zero zmian w `src/data/**` (zakres P3.5A-E/P3.9). Zero
zmian w `lib.rs` poza tym co już jest (nie dotykaj deklaracji modułów — to zakres P3.9). Zero zmian
w `gra/**`.

IZOLACJA
`isolation: worktree`. Baza: `origin/rust-port/parity-v2`, jawnie zweryfikowana jako pierwszy krok
(patrz KONTEKST wyżej). Commit w worktree dozwolony, PUSH zdalny NIE — integracja po PASS Final
Control, osobny krok orkiestratora.

PROCEDURA NAPRAWCZA PRZY FAIL
Jak w poprzednich tematach. Po 5 rundach: LIMIT-5-EXCEEDED.

OGRANICZENIA WYJŚCIA
Raport max ok. 400 słów (pełne logi cargo w pliku docelowym, liczą się osobno).

FORMAT ODPOWIEDZI
STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK
DEPLOY/PUSH: NIE WYKONANO
