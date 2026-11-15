STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1-RENDER-DTO-CONTRACT-Q1
GOAL: Kontrakt modelu widoku (DTO) silnik Rust `civ-engine` → renderer Rust `civ-renderer` oraz komendy zwrotne z mapy (zakres „tylko RUST”, DODATEK r2); web wyłącznie jako dowód parytetu pól.
ZMIANY/COMMIT: ocena commitu Obrony `3f8fb53d3` (baza `8f2f43a83`, ancestry: `git merge-base --is-ancestor 8f2f43a83 3f8fb53d3` → OK). Zmienione wyłącznie pliki z allowlisty: `dyspozycje/rust-port/p4/P4-1-RENDER-DTO-CONTRACT.md`, `dyspozycje/autobot/runs/R-RUSTPORT-P4-1-RENDER-DTO-CONTRACT-Q1/{01-operator,02-evaluator,02a-obrona}.md` (`git diff --name-only 8f2f43a83 3f8fb53d3`). Ten raport = jedyny nowy plik FC, commit na `3f8fb53d3`.
TESTY: `git diff --check 8f2f43a83 3f8fb53d3` czysty. Zero cargo/npm/buildu. Weryfikacja na dowodzie: `git archive 07d2fbd72 gra/src`, `git archive edb8fb56 gra/src`, `git archive origin/rust-port/parity-v2 rust-port/engine/src rust-port/renderer/src` do scratchpadu, potem `sed -n`/`grep` (szczegóły niżej).
BLOKADY: brak.
RUNDY: 1/5 (Operator r1 → Evaluator r1 FAIL → Obrona r1 → FC r1).
NASTĘPNY KROK: integracja orkiestratora (dokument na gałąź dokumentacyjną), wpis D-DTO-1..10 w `REJESTR-RUST.md` jako decyzje techniczne orkiestratora.
DEPLOY/PUSH: NIE WYKONANO

## Orzeczenia po zarzutach Evaluatora r1

| Nr | Orzeczenie | Dowód FC |
|---|---|---|
| 1 (pin danych, pola wodza/dowódcy) | ODDAL (naprawione) | Dokument ma pin `@07` = `07d2fbd72` jako pin danych, tabelę różnic §1.5.1 Δ1–Δ11 i mapowanie linii §1.5.2. Sprawdzone `@07`: `units/setup.ts:45-46` (`isGeneral?: boolean`), `game/armyMerge.ts:1124-1125`, `:1153` (`hasCommander = stack.some(u => u.isGeneral === true)`), `render/units.ts:6208-6210` (`hasCmd = vitals ? vitals.hasCommander : unit.isGeneral === true` → `applyUnitCommanderStar`, `_syncGeneralRing`). `UnitViewDto.isGeneral` i `StackVitalsDto.hasCommander` są w §3.5. `main.ts` cytowane z jawnym `@07`/`@edb`. |
| 1 (osobna nakładka pierścienia wodza) | ODDAL (odrzucenie Obrony słuszne) | `render/units.ts@07:6915-6931`: `_syncGeneralRing` liczy pierścień wyłącznie z `unit.q/r`, `unit.ownerId` (`_ringColorForOwner` → `_resolveOwnerColor`, `:5906-5907`), wysokości terenu 7 heksów i widoczności żetonu; `render/generalHexRing.ts` importuje tylko `three` i `./hexutil` (`grep -n '^import'` → `:15`, `:16`). Wszystkie wejścia są już w DTO, więc to geometria renderera. |
| 2 (`deselect_unit` vs D-CMD-12) | ODDAL (naprawione) | `deselect_unit` usunięty; §5.2 pkt 1: zaznaczenie = `UiState` zgodnie z `P2-5-COMMANDS.md:661`. Nowa komenda `cancel_planned_march { unit_id, force }` zgodna z `main.ts@07:31050-31056` (sprawdzone: `if (!force && plannedMarches.get(unitId)?.attackUnitId) return;` potem `delete` w `plannedMarches`, `marchAttackTargets`, `marchStopNotified`, `marchStopDetail`). |
| 3 (brak stanu planów marszu, bramka `isWorldMapUnitMode`) | ODDAL (naprawione) | `grep -rln planned_march engine/src` → tylko `save_load.rs`, `pathfinding.rs`, `general_quick_follow.rs`; `PlayableState` `playable.rs:493-531` bez tego pola. Dokument §5.2 pkt 5 i kandydat `P4-1J-PLANNED-MARCH-STATE` jako zależność P4-1H. Bramka: `main.ts@07:7139` (`selectedId === null \|\| !isWorldMapUnitMode()`), definicja `@07:6733-6750` (9 warunków UI) — zgodne z dokumentem. |
| 4 (`wlasciciel`, `wioska.ludnosc`) | ODDAL (naprawione) | `grep '\.wlasciciel\b'` w `render/*.ts` i `main.ts` → 0 na obu pinach. `villagePresent` z odczytów `main.ts@07:3353`, `:3366`, reguła „miasto zastępuje wioskę” `:3368` — zgodne. Uwaga N1 niżej (wadliwy wzorzec `grep` dla `ludnosc`). |
| 5 (mgła granic, relacje) | ODDAL (naprawione) | `main.ts@07:15583` (warunek pokazania = UI), `:15595-15601` (filtr `isMe` / `!fogOn` / `visOnce`/`exploredOnce`), `:15602` (pusty wynik). `relationColorFn` `@07:4065-4068` — zgodne z §3.4/§3.6. |
| 6 (numery linii) | ODDAL (naprawione) | `render/cities.ts@edb:804` = `const playerId = options?.playerOwnerId ?? HUMAN_OWNER_PRIMARY;`; `main.ts@edb:13594` = `isAwaitingFirstPlayerCity`; `playable.rs:501` = `selected_unit_id`; `PlayableState` od `:493`. |
| 7 (kodowanie mgły 0/1/2) | ODDAL (naprawione) | §3.3 oznacza kodowanie jako nowe, D-DTO-10 z wariantami A/B/C, za/przeciw i rekomendacją. |

Brak zarzutu z orzeczeniem NAPRAW. Brak punktu DO DECYZJI CZŁOWIEKA: D-DTO-1..10 to wybory techniczne portu, żaden nie odstępuje od zachowania webu (CLAUDE.md zasada 9 → rozstrzyga orkiestrator i zapisuje w `REJESTR-RUST.md`).

## Uwagi (nie blokują)

- **N1 (NISKI, dowód).** Wzorzec `grep -rn "wioska\??\.ludnosc"` z §3.2 jest w GNU BRE wadliwy (szuka dosłownego `?`), więc „0” niczego nie dowodzi. Poprawny `grep -rn 'wioska?\?\.ludnosc'` daje 2 trafienia `@07` (`main.ts:31798`, `:46714`) i 2 `@edb` (`:25801`, `:38765`). To **zapisy** `= 0` w logice gry, a nie odczyty renderera; `grep -rn ludnosc render/` → 0. Wniosek dokumentu (pole poza DTO) się utrzymuje. Do poprawy komendy przy najbliższej edycji dokumentu.
- **N2 (NISKI).** §5.2: `clearPathRoute` wywołuje się przy `selectedId === null || unitId === selectedId || unitId === undefined` (`main.ts@07:31071`), nie tylko „gdy dotyczy zaznaczonej jednostki”. Dla kontraktu silnika bez znaczenia (stan widoku).
- **N3 (pin Rust).** Dokument cytuje `f2bb1197`; `origin/rust-port/parity-v2` = `95930b446`. `git diff --stat f2bb11970 origin/rust-port/parity-v2 -- engine/src/bridge.rs engine/src/domain/{playable,recruitment,ids}.rs renderer/src/view.rs` → brak zmian; linie sprawdzone przez FC na `95930b446` (`playable.rs:493-531`, `:501`, `types.rs:418-422`, `recruitment.rs:726-738`) się zgadzają. Pozostałe cytaty Rust na nowym pinie: NIE_ZMIERZONO.
- **N4 (liczby diffu).** `git diff --stat edb8fb56 07d2fbd72 -- gra/src/render` → 26 plików, +1812/−105 — potwierdza Obronę; liczby Evaluatora (27, +2049/−116) nie odtworzone.
- **N5 (proces).** Commit Obrony ma linię `Co-Authored-By` z nazwą modelu, a DODATEK r2 prosił o treść bez nazwy modelu. Linia pochodzi z wymaganej atrybucji harnessu; do rozstrzygnięcia przez orkiestratora przy integracji (ewentualnie squash), merytorycznie bez wpływu.
