STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-DTO-DECYZJE-4-10-Q1
GOAL: zapisać decyzje D-DTO-4 i D-DTO-10 kontraktu DTO renderera zgodnie z webem (pin 07d2fbd72), z dowodami plik:linia i wpływem na typy w rust-port/view-model.
ZMIANY/COMMIT: oceniany commit Operatora `903ab3a37` (rodzic `f7baa3848` = origin/rust-port/parity-v2). Evaluator dopisuje tylko ten plik (commit bez push).
TESTY: patrz §1. Cargo nie uruchomione: diff `f7baa3848..903ab3a37` nie dotyka `rust-port/**` (3 pliki .md), więc fmt/clippy/test dają wynik bazy. Dispatch nie wymaga cargo (temat dokumentacyjny).
BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: Obrona / Final Control.
DEPLOY/PUSH: NIE WYKONANO

## 1. Bramki odtworzone

| Bramka | Polecenie | Wynik |
|---|---|---|
| Baza | `git rev-parse origin/rust-port/parity-v2` | `f7baa3848…` = rodzic `903ab3a37` |
| Allowlista | `git diff --name-status f7baa3848 903ab3a37` | 3×A: `dyspozycje/autobot/runs/R-RUSTPORT-P4-DTO-DECYZJE-4-10-Q1/00-dispatch.md`, `01-operator-r1.md`, `dyspozycje/rust-port/p4/D-DTO-4-D-DTO-10-DECYZJE.md` (zgodna) |
| Whitespace | `git diff --check f7baa3848 903ab3a37` | pusto, exit 0 |
| Kopia dispatchu | `git diff origin/claude/rust-sivvrn 903ab3a37 -- …/00-dispatch.md` | brak różnic |
| gra/**, rust-port/**, REJESTR-RUST.md | z listy wyżej | nietknięte |
| Cargo.lock | z listy wyżej | nietknięty |

## 2. Weryfikacja cytatów (próbka niezależna, `git show`)

Web (pin `07d2fbd72`), wszystkie potwierdzone treścią:
- `map/road-network.ts:32-34` ROAD_DIRS, `:75-86` computeRoadMask;
- `main.ts:3144-3147` hexHasRoadAt (bez mgły), `:15836` i `:17083` computeRoadMask, `:17492-17511` refreshSiegeMarkers z `siegeAllowedBetween` (`:17503`) i `camps.push` per jednostka;
- `game/terrain-improvements.ts:358`, `:382`, `:388-392`; `map/gen-helpers.ts:5411`, `:5445`, `:8194-8203` (trimMediumTailAlongMain `:7623`, nieeksportowana);
- `types/hex.ts:60-64` Widocznosc; `render/scene.ts:356`, `:1306-1333`, `:3230-3231`, `:3526-3548`, `:3580`;
- `main.ts:12800-12806`, `:12864-12866`, `:13074-13080`, `:13483-13494`, `:13505-13506`, `:13577-13580`.

Rust (`f7baa3848`), `git grep`: `improvements.rs:1021`, `:1049`, `roads.rs:40`, `:46`, `improvement_build.rs:1001`, `rivers_a.rs:260`, `:317`, `:397`, `:436`, `diplomacy_siege_war_gate.rs:67` — zgodne. `compute_road_mask` i `trim_medium*` w `rust-port` → 0 trafień (BRAK potwierdzony). `view-model/src/map.rs:129-131`, `:152-156`, `:159-212`, `validate.rs:243`, `:247`, brak `river` w walidacji, `tests/pin_vectors.rs` test `fog_codes_follow_widocznosc_order`, `overlays.rs:22-28`, `renderer/.../droga.rs:21-22` — zgodne.

Merytorycznie: D-DTO-4 = A i D-DTO-10 = A wynikają z webu (reguły w `game/`, `map/`, `main.ts`; semantyka 3 stanów z pierwszeństwem visible > explored). Klasyfikacja jako decyzje techniczne (zasady 9 i 11) poprawna, brak wymyślonych reguł gameplay. Przekazane luki (P4-1B/C/F) są prawdziwe.

## 3. Zarzuty

1. **NIE_ZMIERZONO tam, gdzie wynik jest w kodzie pinu (§1.5, wiersz `camp_hexes`; raport Operatora pkt 3).** `render/siegeCampSync.ts:14-27` `machinesByCampHex` rozdziela maszyny `campHexes[i % campHexes.length]`, więc duplikaty heksów zmieniają rozdział: przy 2 gotowych maszynach `camps=[A,A,B]` daje A:2, B:0, a po deduplikacji `[A,B]` daje A:1, B:1. Zależność jest więc **zmierzalna i potwierdzona**: duplikaty są częścią semantyki webu. Wniosek dokumentu („zachować duplikaty”) jest dobry, ale powinien być wymaganiem z dowodem, a nie NIE_ZMIERZONO. Do poprawy jednym zdaniem (dokument lub notatka do P4-1F). Nie zmienia decyzji.
2. **D-DTO-10 to ratyfikacja stanu kodu, nie nowa decyzja.** `view-model/src/map.rs:159-161` już mówi „Encoding fixed by the contract (D-DTO-10 = A)”. Dokument to przyznaje (§2.3 „Stan wdrożenia”); uwaga dla rejestru: decyzja została wdrożona w P4-1A przed formalnym zapisem — orkiestrator powinien to odnotować w `REJESTR-RUST.md` jako potwierdzenie, a nie zmianę.
3. **Drobne: `landReveal` przy `fogOn=false`.** Dokument (§2.4) słusznie wskazuje brak flagi; warto dodać, że przy wyłączonej mgle web woła `setFog(ALL_KEYS, ALL_KEYS)` bez opcji (`main.ts:13505-13506`), więc `landReveal` ma znaczenie tylko przy `useFogRender` (`:13484`). Informacja dla P4-1C, nie wada decyzji.

Brak zarzutów blokujących. Werdykt: PASS-WITH-NOTES.
