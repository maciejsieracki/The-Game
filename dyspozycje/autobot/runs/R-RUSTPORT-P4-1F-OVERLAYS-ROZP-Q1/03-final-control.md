# 03 — Final Control r1: R-RUSTPORT-P4-1F-OVERLAYS-ROZP-Q1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (rozpoznanie, tylko odczyt)
TEMAT: R-RUSTPORT-P4-1F-OVERLAYS-ROZP-Q1
GOAL: rozpoznanie producenta `OverlaysViewDto` (#215): tabela nakładek pin → Rust, pola DTO z wejściami, podział na wdrożenia, NIE_ZMIERZONO.
ZMIANY/COMMIT: oceniany SHA obrony `32f0c724eac46ae8823ada32337757055e9fe1e1` (rodzic: Operator `8108971d7`, a jego rodzic to baza `c3e3617b2`). Commit FC dodaje tylko ten plik.
TESTY: zob. „Bramki”.
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: integracja przez orkiestratora (FF dokumentacji). Potem rozpisanie dispatchów 1F-1 … 1F-6 według §4 dokumentu.
DEPLOY/PUSH: NIE WYKONANO

## Ancestry

- Baza z dispatchu: `origin/rust-port/parity-v2` = `c3e3617b2aaaede5f708d2c425b0222c4af78549`. Bez zmian w chwili FC (sprawdzone `git fetch` i `git rev-parse`).
- `git merge-base c3e3617b2 32f0c724e` daje `c3e3617b2…`, więc baza jest przodkiem.
- Łańcuch: `c3e3617b2` → `8108971d7` (Operator) → `32f0c724e` (Obrona) → commit FC.

## Bramki (sprawdzone samodzielnie)

- `git diff --name-only c3e3617b2 32f0c724e` zwraca 3 pliki, wszystkie z allowlisty:
  - `dyspozycje/rust-port/p4/P4-1F-OVERLAYS-ROZPOZNANIE.md` (nowy),
  - `dyspozycje/autobot/runs/R-RUSTPORT-P4-1F-OVERLAYS-ROZP-Q1/01-operator-r1.md`,
  - `dyspozycje/autobot/runs/R-RUSTPORT-P4-1F-OVERLAYS-ROZP-Q1/02a-obrona.md`.
- Nie ma zmian w `.rs`, `gra/`, `Cargo.lock` ani `origin/main`.
- `git diff --check c3e3617b2 32f0c724e` nic nie zwraca (OK).
- Cargo: nie uruchamiano. Temat nie zmienia kodu, więc bramka cargo zmierzyłaby bazę, a nie pracę tematu. Evaluator i tak podaje fmt/clippy/test view-model = 0.

## Zarzuty Evaluatora — orzeczenia

| # | Zarzut | Orzeczenie | Dowód FC |
|---|---|---|---|
| 1 | Religia państwowa oznaczona NIE_ZMIERZONO, choć ma źródło | ODDAL (naprawione przez Obronę w 32f0c724e) | `playable.rs:578-583` (komentarz: web `ownerReligionForOwnerId`, main.ts:5535, liczona z `players`). `turn_war_inputs.rs:383-404` (`religion_of` → `civ_religion_for_key`). W dokumencie: §1 R i §2 `religionRange` = JEST, §3 pkt 6 skreślony, §6 pkt 1 zamknięty. |
| 2 | `armyStackLimit` oznaczony NIE_ZMIERZONO | ODDAL (naprawione) | `save_migrations.rs:219-221` `ARMY_STACK_LIMIT: i64 = 500`. Komentarz powołuje się na web `armyStackLimit()` = `BATTLE_MAX_PER_SIDE`, co potwierdza pin `main.ts:4358-4360`. Wiersz RE ma JEST, §6 pkt 6 zamknięty. |
| 3 | Błędny odczyt `main.ts:17810` | ODDAL (naprawione) | Pin `:17808-17810`: `surrenderEntered.some(u => u.id === selectedId)` → `setSelectionHex(city.q, city.r, newOwner)`. Chodzi o zaznaczoną jednostkę na heksie miasta. Poprawione §1 S, §2 `selection`, §6 pkt 5. |
| 4 | Niepełna lista nieaktualnych linii w komentarzach Rust | ODDAL (naprawione i rozszerzone) | Pin `okolica.ts`: `collectWorkedHexKeysForOwner` :782, `collectWorkedHexOwnerMap` :811, `computeLostToNearerSiblingByCity` :859. Baza `sasiedztwo.rs:11/97/128` cytuje :800/:662/:690, a wszystkie trzy są w zakresie 1F-4. Pin `range-hexes.ts`: :28/:79/:101. Baza `territory.rs:492/520` cytuje :53/:75, co jest w zakresie 1F-2. |
| 5 | Brak wejścia widza przy `workerFields` | ODDAL (naprawione) | Pin `main.ts:15441` `syncWorkerFieldOverlay(..., ME())` oraz `workerFieldOverlay.ts:59,69,133,163`. `WorkerFieldDto` ma tylko `hex` i `owner_id` (`overlays.rs:127-132`). Widz pochodzi z korzenia DTO (`root.rs:28-29` `viewer: ViewerDto`). W §2 dopisano widza. |
| 6 | Bramki (informacja Evaluatora) | ODDAL (to nie zarzut) | Potwierdzone samodzielnie, zob. wyżej. |

Liczba NAPRAW: 0. Liczba DO DECYZJI CZŁOWIEKA: 0.

## Kryteria końca dispatchu

1. Tabela nakładka → pin → wejścia → Rust (JEST/BRAK/ROZBIEŻNE): §1, OK.
2. Lista pól `OverlaysViewDto` z wejściami: §2, OK.
3. Podział na wdrożenia (nazwa, allowlista, wektory), bez wdrażania: §4 (1F-1 … 1F-6), OK.
4. NIE_ZMIERZONO: §6 (otwarte pkt 2, 3, 4, 7, 8, 10), OK.

## Uwagi (bez wpływu na werdykt)

- Raport Evaluatora `02-evaluator.md` (lokalny commit `ab2282a71`) nie leży w łańcuchu `8108971d7 → 32f0c724e`. Przy integracji orkiestrator powinien go dołączyć osobno (cherry-pick pliku), żeby katalog runu był kompletny.
- Operator przekazał orkiestratorowi trzy decyzje techniczne: (1) 4 rozbieżności kształtu DTO, (2) kolejność `BTree*` vs web (D-DTO-5 = A), (3) `ownerId 0` na sztywno w webie. Punkt (3) to parytet z webem (zasada 9). Pytanie ABC wolno zadać tylko wtedy, gdy rozważane jest świadome odstępstwo.
