# 03 — Final Control r1: R-RUSTPORT-P4-1F1-OVERLAY-TYPES

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (DTO nakładek, view-model)
TEMAT: R-RUSTPORT-P4-1F1-OVERLAY-TYPES
GOAL: kształt DTO nakładek zgodny z pinem 07d2fbd72: (a) pathRoute + turnStops, (b) BuildHighlightKind rozdziela cud i ulepszenie, (c) cultureRange/religionRange jako jeden zbiór, (d) właściciel obozu per wpis campHexes; CONTRACT_VERSION podbity.
ZMIANY/COMMIT: kod ea84a130b; raporty d81eaba5a (01), 7fe36b059 (02a); ten raport na gałęzi fc/R-RUSTPORT-P4-1F1-OVERLAY-TYPES (SHA w commicie nad 7fe36b059).
TESTY: odtworzone samodzielnie (niżej), wszystkie EXIT 0.
BLOKADY: brak.
RUNDY: 1/5.
NASTĘPNY KROK: integracja orkiestratora na rust-port/parity-v2 (merge-tree czysty, niżej) + wpisy w rejestrze z listy „Do orkiestratora”.
DEPLOY/PUSH: NIE WYKONANO.

## Baza i ancestry
- Baza z dispatchu: `b90894920`. `git merge-base --is-ancestor b90894920 ea84a130b`: OK. Łańcuch: b90894920 → ea84a130b (kod) → d81eaba5a (raport 01) → 7fe36b059 (02a) → FC.
- `origin/rust-port/parity-v2` przesunął się od tego czasu na `84ec520a5` (integracja P4-1H Q2, potomek b90894920, bez zmian w `rust-port/view-model`). `git merge-tree --write-tree 84ec520a5 7fe36b059` daje czyste drzewo `79fbac9ba`, bez konfliktów.

## Allowlista (diff b90894920..ea84a130b)
overlays.rs, root.rs (tylko `CONTRACT_VERSION` 1 → 2), validate.rs (tylko blok `pathRoute.turnStops[].turn`), tests/common/mod.rs, tests/json_keys.rs, tests/json_roundtrip.rs, tests/overlay_types_f1.rs (nowy), tests/pin_vectors.rs. Renderer i Cargo.lock bez zmian. Brak nowych `#[ignore]` (jedyne trafienie to komentarz w renderer/src/raster/atlas/gpu.rs z bazy). Allowlista dotrzymana.

## Zgodność z pinem (sprawdzone na `git show 07d2fbd72:...`)
- (b) `refreshBuildHighlight` (main.ts:16351-16395): cztery gałęzie foundCity / wonder / improvement (z `IMPROVEMENT_BUILD_HIGHLIGHT_OPACITY`) / mine (osobna warstwa, krążek czyszczony). Enum z czterema wariantami odwzorowuje to 1:1; krycie wynika z wariantu.
- (c) main.ts:15631-15646: literal `0` jako właściciel, `keys.size > 0` warunkiem warstwy → `Option<Vec<HexCoord>>`, `None` = brak warstwy. Zgodne.
- (a) planned-march.ts:116-141: `turnNum = 1`, push z `turnNum`, `turnNum++` po każdym przepełnieniu, stop końcowy z bieżącym `turnNum`. Ściśle rosnąco od 1 jest gwarantowane (po każdym push następuje inkrementacja) → walidacja `turn >= 1` i ściśle rosnąco jest poprawna.
- (d) siegeCampSync.ts:30-47: właściciel = pierwsza jednostka na heksie z `ownerId !== cityOwnerId` → `SiegeCampDto {hex, ownerId}`.

## Bramki (FC, CARGO_INCREMENTAL=0, profile bez debug, CARGO_TARGET_DIR w scratchpadzie, usunięty po bramkach)
| crate | fmt --check | clippy --all-targets -D warnings | test --all-targets --no-fail-fast |
|---|---|---|---|
| rust-port/view-model | 0 | 0 | 0 (85 passed / 0 failed / 0 ignored) |
| rust-port/renderer | 0 | 0 | 0 (537 passed / 0 failed / 0 ignored) |

Build zmodyfikował `rust-port/renderer/Cargo.lock` (stan bazy, zarzut 7) — przywrócony `git checkout`, nie commitowany.

## Orzeczenia zarzutów
| # | Zarzut | Orzeczenie | Uzasadnienie |
|---|---|---|---|
| 0 | Weryfikacja Evaluatora | ODDAL (nie zarzut) | Potwierdzona niezależnie: ancestry, allowlista, bramki z tymi samymi liczbami. |
| 1 | Nowe typy bez produkcyjnego wołającego | ODDAL | Dispatch zleca same typy DTO; producenci to P4-1F2/F3/F5/F6, P4-1G Q5/Q6, P4-1H Q5 (zadania #239-#243, #236-#237, #251 już istnieją). |
| 2 | Wektory nie porównane z rustowym producentem | ODDAL | Dispatch wymaga wektorów z pinu + kształt + round-trip; engine poza allowlistą; porównanie należy do P4-1F2. |
| 3 | lib.rs bez reeksportu PathRouteDto/PathTurnStopDto/SiegeCampDto | ODDAL | lib.rs poza allowlistą (zmiana = FAIL §9); typy dostępne przez `pub mod overlays`. Do najbliższego tematu z lib.rs. |
| 4 | Kontrakt §3.5/§3.7 niezgodny z kodem po v2 | ODDAL | Plik kontraktu poza allowlistą; osobny temat dokumentacyjny. |
| 5 | Duplikaty heksu z różnymi właścicielami / scalanie między miastami | ODDAL | W pinie właściciel jest funkcją heksu w obrębie miasta (`units.find`), więc producent z konstrukcji da tego samego właściciela; scalanie `allCampOwners` (main.ts:17514-17517) jest po stronie konsumenta → reguła do dispatchu P4-1G Q5. |
| 6 | turnStops nie walidowane względem hexes | ODDAL | Dispatch ogranicza validate.rs do `turn`; pin gwarantuje przynależność przez konstrukcję. Kandydat do tematu dokumentacyjnego/walidacyjnego. |
| 7 | Cargo.lock renderera w bazie bez civ-view-model | ODDAL | Stan bazy, nie tematu; nie commitowany. |

Brak NAPRAW → werdykt PASS-WITH-NOTES (notatki = zadania dla orkiestratora poniżej).

## Do orkiestratora (poza allowlistą tematu)
1. Rejestr: zależność typów F1 od producentów P4-1F2/F3/F5/F6, P4-1G Q5/Q6, P4-1H Q5.
2. Temat dokumentacyjny: aktualizacja P4-1-RENDER-DTO-CONTRACT.md §3.5/§3.7 do CONTRACT_VERSION=2 (ewentualnie z walidacją turnStops ⊂ hexes).
3. Reeksport PathRouteDto, PathTurnStopDto, SiegeCampDto w lib.rs przy najbliższym temacie z lib.rs.
4. Dispatch P4-1G Q5: reguła scalania właścicieli obozów między miastami jak main.ts:17514-17517 (ostatnie miasto wygrywa).
5. Integracja: parity-v2 jest teraz `84ec520a5`; merge-tree z 7fe36b059 czysty.
