STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1F-OVERLAYS-ROZP-Q1
GOAL: rozpoznanie producenta OverlaysViewDto (#215), tylko odczyt, zero zmian kodu
ZMIANY/COMMIT: dyspozycje/rust-port/p4/P4-1F-OVERLAYS-ROZPOZNANIE.md (poprawki), ten plik; baza = commit Operatora r1 8108971d7 (baza tematu c3e3617b2); SHA w raporcie Workflow
TESTY: git diff --check = 0; zmiany wyłącznie w 2 plikach .md z allowlisty; bez .rs, bez gra/, bez Cargo.lock; cargo nie dotyczy (brak kodu)
BLOKADY: brak
RUNDY: obrona r1/5
NASTĘPNY KROK: Final Control
DEPLOY/PUSH: NIE WYKONANO

# Odpowiedzi na zarzuty Evaluatora (02-evaluator.md, commit ab2282a71)

## 1. Religia państwowa jako NIE_ZMIERZONO — PRZYJMUJĘ
Dowód: `rust-port/engine/src/domain/playable.rs:578-583` (komentarz: religia państwowa = religia cywilizacji
właściciela z `players`, web `ownerReligionForOwnerId` `main.ts:5535`); w pinie `main.ts:5535-5537`
`civReligionForKey(ownerCivKeyForReligion(ownerId), …)`; producent wzorcowy `turn_war_inputs.rs:383-393`
(`religion_of` = `civ_religion_for_key(player.civilization)`), użycie `:404`; funkcja publiczna
`order_effects_culture.rs:325`.
Poprawka: §1 R → JEST, §2 religionRange → JEST, §3 pkt 6 skreślony (nie jest brakującym stanem; rekomendacja
`OverlaysViewInputs` zawężona do 1–5), §6 pkt 1 zamknięty.

## 2. armyStackLimit jako NIE_ZMIERZONO — PRZYJMUJĘ
Dowód: `save_migrations.rs:219-221` `pub const ARMY_STACK_LIMIT: i64 = 500;` z komentarzem cytującym web
`armyStackLimit()` = `BATTLE_MAX_PER_SIDE`; pin `main.ts:4358-4360`.
Poprawka: §1 RE → JEST, §6 pkt 6 zamknięty.

## 3. Błędny odczyt main.ts:17810 — PRZYJMUJĘ
Dowód: pin `main.ts:17808-17810`: `surrenderEntered = enterCityAfterSurrender(units, city, newOwner, …)`;
`setSelectionHex(city.q, city.r, newOwner)` tylko gdy `surrenderEntered.some(u => u.id === selectedId)`.
Pierścień dostaje zaznaczona jednostka, która weszła do miasta (heks miasta, właściciel `newOwner`).
Poprawka: §1 S (wejścia i status), §2 selection, §6 pkt 5 zamknięty.

## 4. Niepełna lista nieaktualnych numerów linii — PRZYJMUJĘ (z rozszerzeniem)
Dowód: `sasiedztwo.rs:128` cytuje `okolica.ts:690`, w pinie `collectWorkedHexOwnerMap` jest na `:811`
(`git grep -n "export function collectWorkedHexOwnerMap" 07d2fbd72`). Ten sam plik ma jeszcze dwa nieaktualne
odnośniki: `:97` `collectWorkedHexKeysForOwner` `:662` → pin `:782`; `:11` `computeLostToNearerSiblingByCity`
`:800` → pin `:859`. W `territory.rs` `range-hexes.ts:13` i `:28` są zgodne z pinem.
Poprawka: dopisane do zakresu 1F-4 (sasiedztwo.rs, trzy odnośniki) i doprecyzowane w 1F-2 (territory.rs).

## 5. Brak widza przy workerFields — PRZYJMUJĘ
Dowód: pin `main.ts:15441` `syncWorkerFieldOverlay(scene, null, map, workedByOwner, ME())`;
`render/workerFieldOverlay.ts:133`, `:163` (`playerOwnerId`), `:59`, `:69` (pierścień „własny”
`ownerId === playerOwnerId`); `WorkerFieldDto` = `hex`, `owner_id` (`view-model/src/overlays.rs:127-132`);
korzeń ma `viewer: ViewerDto` (`view-model/src/root.rs:28-29`).
Poprawka: §2 workerFields — wejście „widz” i wymóg dla renderera (P4-1G): widz z korzenia DTO.

## 6. Bramki Evaluatora — przyjmuję jako informację (brak zarzutu)
