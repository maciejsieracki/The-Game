STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1-RENDER-DTO-CONTRACT-Q1
GOAL: Kontrakt modelu widoku (DTO) silnik Rust `civ-engine` → renderer Rust `civ-renderer` oraz komendy zwrotne z mapy (zakres „tylko RUST”, DODATEK r2).
ZMIANY/COMMIT: `dyspozycje/rust-port/p4/P4-1-RENDER-DTO-CONTRACT.md` (poprawki po zarzutach 1–7) + ten plik. Baza: `4a3df2453` (Evaluator r1) na `0d6d70cff` (Operator r1) na `8f2f43a83`. SHA commitu Obrony w raporcie końcowym workflow. Bez push.
TESTY: `git diff --check` — pusty; `git status --short` — tylko 2 pliki z allowlisty. Zero cargo, zero npm, zero buildu. Odczyty: `git archive 07d2fbd72 gra/src`, `git archive edb8fb56 gra/src`, `git archive f2bb1197 rust-port/engine/src rust-port/renderer/src` do scratchpadu, potem `grep`/`sed`/`diff`.
BLOKADY: brak. Uwaga dla orkiestratora: dispatch r1 narzuca web `edb8fb56`, a CLAUDE.md zasada 9 — `07d2fbd72`. Dokument przyjmuje `07d2fbd72` jako pin danych parytetu i zostawia odpowiedniki `edb8fb56`, bo z tego pinu przeniesiono `civ-renderer`.
RUNDY: 1/5 (Obrona po Evaluatorze r1)
NASTĘPNY KROK: Final Control (ten sam ID) albo Evaluator r2 na commicie Obrony.
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

### 1 (WYSOKI) — pin `edb8fb56` zamiast `07d2fbd72`: PRZYJMUJĘ, z jednym wyjątkiem (ODRZUCAM osobną nakładkę pierścienia)

Dowód: `git merge-base edb8fb56 07d2fbd72` → exit 1. `git diff --stat edb8fb56 07d2fbd72 -- gra/src/render` → **26 plików, +1812/−105** (Evaluator podał 27 i +2049/−116; moja komenda ogranicza się do `gra/src/render`). Z 8 plików spoza `render/**` zmieniły się 4: `battleScene.ts`, `manualBattle.ts`, `siegeWall.ts`, `main.ts`. Importy logiki w `render/**`: na obu pinach 31 linii w 17 plikach, te same symbole (`diff` po usunięciu numerów linii jest pusty). Na `07d2fbd72` `render/units.ts:6208-6210` czyta `vitals.hasCommander` i `unit.isGeneral`. `hasCommander` pochodzi z `game/armyMerge.ts:1124-1125` i `:1153`, a `isGeneral` z `units/setup.ts:45-46`. Na `edb8fb56` `grep -rn "isGeneral\|hasCommander\|CommanderStar" render/ units/setup.ts` daje 0.

Poprawki:
- nagłówek: pin danych parytetu = `07d2fbd72`, legenda `@07`/`@edb`; każde `main.ts:N` ma teraz jawny pin w postaci `main.ts@07:N` z odpowiednikiem `@edb:M`. `grep -n "main\.ts:[0-9]"` po zmianie → 0 trafień;
- nowy §1.5: §1.5.1 to tabela różnic Δ1–Δ11 ograniczona do pól czytanych przez renderer: wódz, `hasCommander`, gwiazda, obwódka, `wallKind` przez `cityFortificationKind`, źródło `ringHex`, filtr podświetlenia budowy, pola bitwy, granice, `clearPlannedMarch`, zasoby GPU. §1.5.2 to przesunięcia linii `render/*.ts` cytowanych w §2–§3;
- §3.5: `UnitViewDto.isGeneral` i `StackVitalsDto.hasCommander`, plus brakujące `count` i `veteranLevel` (zgodnie z `recruitment.rs:726-738`). Wiersz `commanderStar` z NIE_ZMIERZONO usunięty, §9 pkt 3 zamknięty;
- §1.2: flaga wodza w Rust istnieje tylko w zapisie (`types.rs:418-422`), `StackVitals` nie ma `has_commander`; P4-1D ma te zależności.

**ODRZUCAM** wymóg osobnej nakładki „pierścień wodza (`ownerId`, `hex`)” jako pola DTO. Web wylicza pierścień z pól, które DTO już ma: `_syncGeneralRing(unit, hasCmd)` w `render/units.ts@07:6915-6931` bierze heks `unit.q/r`, kolor `_ringColorForOwner(ownerId)` = `_resolveOwnerColor` (`:5906-5907`) i wysokości z terenu przez `topYAt` po `GENERAL_RING_HEX_OFFSETS`. Widoczność pierścienia = widoczność żetonu (`:6260-6262`). Szerokość zależy od kamery (`:5787-5791`). `generalHexRing.ts` importuje wyłącznie `three` i `./hexutil`. Osobne pole DTO powieliłoby `units[]` + `owners[].color`. W kontrakcie to geometria renderera (R-czysta, w `civ-renderer` BRAK: `grep -rn "general_ring\|GeneralHexRing" renderer/src` → 0). Opisane w §1.5.1 Δ4 i w §3.5.

### 2 (WYSOKI) — `deselect_unit` sprzeczne z D-CMD-12: PRZYJMUJĘ

Dowód: `P2-5-COMMANDS.md:661` stwierdza, że zaznaczenie jest efemerycznym stanem UI, a brak komendy odznaczenia nie jest luką. `clearPlannedMarch` usuwa wpisy z `plannedMarches` i `marchAttackTargets` (`main.ts@07:31053-31054` / `@edb:25158-25159`), a na `@07` także z `marchStopNotified` i `marchStopDetail` (`:31055-31056`).

Poprawki: `deselect_unit` zniknął z całego dokumentu (`grep deselect_unit` → 0). §3.7 `selection` = stan UI (D-CMD-12). §5.1 i §5.2 opisują komendę gry `cancel_planned_march { unit_id, force }` z semantyką 1:1 z gałęzią `unitId !== undefined`: `force=false` przy `attackUnitId` nic nie zmienia, w pozostałych przypadkach kasowane są 4 mapy. D-DTO-8 przepisany. Bez wniosku o rewizję D-CMD-12, ale z adnotacją dla rejestru: uzasadnienie „nic nie wymaga roundtrip” pomija skasowanie planu. P4-1H przepisany, ma testy `attackUnitId`, braku planu i podwójnego wywołania.

### 3 (ŚREDNI) — brak stanu planów marszu w `PlayableState` i pominięta bramka: PRZYJMUJĘ

Dowód: `grep -rln planned_march engine/src` (na `f2bb1197`) → `save_load.rs`, `pathfinding.rs`, `general_quick_follow.rs`. `PlayableState` = `playable.rs:493-531`, bez tych pól. Bramka: `dismissPlayerUnitSelectionIfAny` (`main.ts@07:7139` / `@edb:6216`) → `!isWorldMapUnitMode()`, z definicją w `@07:6733-6750` / `@edb:5833-5850`. `diff` treści na obu pinach jest pusty. Funkcja zwraca `false` przy 9 panelach i scenach UI.

Poprawki: §1.2 ma jawną informację, że stan gry nie zawiera planów marszu. §5.2 pkt 3 opisuje kolejność bramek kontrolera, w tym `isWorldMapUnitMode()` jako warunek z `UiState`. §5.2 pkt 5 opisuje warunek wstępny. Dodany kandydat `R-RUSTPORT-P4-1J-PLANNED-MARCH-STATE` (allowlista: `playable.rs`, `save_load.rs`, testy) jako zależność P4-1H. Kolejność w §8 zaktualizowana.

### 4 (ŚREDNI) — zmyślone `HexDynDto.wlasciciel` i `wioska.ludnosc`: PRZYJMUJĘ

Dowód: `grep -n "\.wlasciciel\b" render/*.ts` → 0; `grep -c "\.wlasciciel\b" main.ts` → 0 na obu pinach. Wioskę czytają wyłącznie odwołania `hex.wioska.istnieje` w `main.ts@07:3353`, `:3366` / `@edb:2978`, `:2991`. Odczytów `wioska.ludnosc` jest 0.

Poprawki: `wlasciciel` i `ludnosc` usunięte. W ich miejsce jest `villagePresent: bool` z dowodem odczytu oraz regułą „miasto zastępuje wioskę” (`@07:3368`), którą liczy producent. §9 pkt 2 skreślony z uzasadnieniem.

### 5 (ŚREDNI) — terytorium bez reguły mgły; relacje NIE_ZMIERZONO: PRZYJMUJĘ

Dowód: `main.ts@07:15582-15616` / `@edb:12757-12778`. Warunek pokazania jest w `@07:15583`, filtr w `@07:15595-15601`. `relationColorFn` jest w `@07:4065-4068` / `@edb:3632-3635`. Statusy `'wojna' | 'pokoj' | 'sojusz' | 'neutralni'` są w `game/civ-visual.ts:89`, kolory w `:84-86` i `:100-104`.

Poprawki: §3.6 dostał regułę mgły jako obowiązek producenta oraz warunek pokazania `territoryBorderVisible || isCityPanelOpen()` jako stan UI. §3.4 `relationToViewer` = `enum { self, wojna, pokoj, sojusz, neutralni }` ze źródłem `getDiploRelation(ME(), ownerId).status` (`@07:10312`), a mapowanie na kolor ląduje w adapterze (w rendererze `RELATION_BORDER` → 0). §9 pkt 4 zamknięty.

### 6 (NISKI) — numery linii: PRZYJMUJĘ

`render/cities.ts:806` → `:804` (`sed -n 804p`: `const playerId = options?.playerOwnerId ?? HUMAN_OWNER_PRIMARY;`). `isAwaitingFirstPlayerCity` `:13593` → `@edb:13594` / `@07:16532`. `selected_unit_id` → `playable.rs:501`. `PlayableState` → `playable.rs:493-531` (komentarz typu `:490`).

### 7 (NISKI) — kodowanie mgły 0/1/2 przypisane webowi: PRZYJMUJĘ

Dowód: `types/hex.ts:60-64` to enum tekstowy. Poprawka: §3.3 nazywa kodowanie „nowym, ustalanym przez kontrakt”. Dodany punkt decyzji **D-DTO-10** z wariantami A (`Vec<u8>` 0/1/2), B (dwie listy `HexCoord`) i C (enum tekstowy), z zaletami, wadami i rekomendacją A. Wcześniejsze odwołanie „alternatywa w D-DTO-3” było niespójne, bo D-DTO-3 jej nie zawierał, i zostało poprawione.

## Uwagi

- Pin Rust w dokumencie zostaje `f2bb1197` (jawnie przypięty). `origin/rust-port/parity-v2` = `95930b446` w chwili Obrony; zmian w przytoczonych liniach nie weryfikowałem (NIE_ZMIERZONO). Przed integracją potrzebny rebase dokumentu na aktualną bazę dokumentacyjną.
- Mapowanie linii `@edb → @07` wykonał skrypt porównujący treść linii i kontekst ±3. Trafienia niejednoznaczne (`_cityRenderOpts`, granice, `setHighlight` budowy, `clearPlannedMarch`) sprawdziłem ręcznie przez `sed -n`.
