STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1H-COMMANDS-ROZP-Q1
GOAL: rozpoznanie komend mapy cancel_planned_march / preview_path / move_unit wieloheksowy (#217), tylko odczyt
ZMIANY/COMMIT: dyspozycje/rust-port/p4/P4-1H-COMMANDS-ROZPOZNANIE.md (poprawki), ten plik; baza 9df1d235d (Operator r1), SHA w commicie obrony
TESTY: brak cargo (temat dokumentacyjny, zero kodu); dowody git grep / git show podane niżej; git diff --check czysty
BLOKADY: decyzja techniczna orkiestratora dla cancel_planned_march na nieznanej lub obcej jednostce (zapis w REJESTR-RUST.md przed dispatchem Q2)
RUNDY: 1/5 (obrona po Evaluatorze r1)
NASTĘPNY KROK: Final Control
DEPLOY/PUSH: NIE WYKONANO

# Obrona Operatora — odpowiedzi na zarzuty Evaluatora r1

## Zarzut 1 — §0 pkt 1: „grep z dispatchu daje 0 trafień” jest nieprecyzyjne
**PRZYJMUJĘ.** Pełny wzorzec z dispatchu trafia w `moveUnitIds` (`ai.ts:4118/4339/4767/5589`,
`army-concentration.ts:21/212/387/466/522/624`), w import `./game/planned-march` (`main.ts:1233`) i w komentarze
(`ai-move-range.ts:5`, `armyMerge.ts:804`). Dowód: `git grep -n "moveUnit\|planned-march" 07d2fbd72 -- gra/src`.
Poprawka: §0 pkt 1 opisuje teraz trafienia pełnego grepu i wskazuje, że 0 trafień daje dopiero zawężony grep z §6.
Wniosek merytoryczny (brak funkcji komend o tych nazwach w webie) bez zmian.

## Zarzut 2 — §5 pkt 4: armyStackLimit() oznaczone NIE_ZMIERZONO
**PRZYJMUJĘ.** Odczyt:
- `main.ts:4358-4360`: `function armyStackLimit(): number { return BATTLE_MAX_PER_SIDE; }`
- `main.ts:908`: import `BATTLE_MAX_PER_SIDE` z `./battle/battleScene`
- `battle/battleScene.ts:721`: `const MAX_PER_SIDE = 500;`, `:723`: `export const BATTLE_MAX_PER_SIDE = MAX_PER_SIDE;`
- Rust (baza 2f9a12786): `save_migrations.rs:221` `pub const ARMY_STACK_LIMIT: i64 = 500;` (dziś używana tylko w migracji zapisu).
Poprawka: wiersz „limit stosu” w §1.3 i §2.3 podaje wartość 500 ze źródłem; §5 pkt 4 oznaczony jako ZMIERZONO;
wiersz Q6 w §4 wymaga jawnej wartości w dispatchu i wektorów granicznych 499+1 / 500+1.

## Zarzut 3 — rekomendacja `Ok` dla nieznanej/obcej jednostki nie wynika z webu
**PRZYJMUJĘ.** Wszyscy wołający `clearPlannedMarch` na pinie podają istniejącą jednostkę gracza:
`selectedId` (`main.ts:7091`, `:31077`) albo `u.id` z pętli po jednostkach (`:25920`, `:25946`, `:26013`, `:26060`, `:26085`).
Web tej ścieżki nie rozstrzyga. W Rust `move_unit` zwraca `UnitNotFound`/`UnitNotOwned` (`playable.rs:681-682`, `:919-922`).
Poprawka: rekomendacja „`Ok` jak web” wycofana. §5 pkt 1 i wiersz Q2 (test g) opisują to jako decyzję techniczną
orkiestratora z wariantami (A) `Err` spójnie z `move_unit`, (B) `Ok` bez zmian. Decyzję trzeba zapisać w
`dyspozycje/rust-port/REJESTR-RUST.md` przed dispatchem Q2. Wpisu w rejestrze nie robię, bo plik jest poza allowlistą tego tematu.

## Zarzut 4 — sugestia SONNET dla Q3 i Q6 jest sprzeczna z zasadą modeli
**PRZYJMUJĘ.** Kolumna „Model” dla Q3 i Q6 ma teraz wartość HAIKU (Sonnet tylko po 2 nieudanych rundach Haiku).
Dopisałem też ogólną regułę pod nagłówkiem §4.

## Zarzut 5 — zależność Q6 od Q2 nie wynika z logiki
**PRZYJMUJĘ.** `planMarchTo` zajmuje `main.ts:31213-31300`, a następna funkcja `planGeneralFollowMarch` zaczyna się w `:31301`.
W tym zakresie nie ma wywołań `clearPlannedMarch` ani `plannedMarches.delete/clear`. Dowód: awk po `git show 07d2fbd72:gra/src/main.ts`.
Poprawka: kolejność w §4 opisuje Q2 jako logicznie niezależny. W kolumnie zależności Q6 dopisałem, że z Q2 łączy go tylko konflikt plików `playable.rs`/`bridge.rs`.

## Weryfikacja
- Allowlista: zmienione tylko `dyspozycje/rust-port/p4/P4-1H-COMMANDS-ROZPOZNANIE.md` i ten plik. Bez kodu, bez `gra/` i bez `Cargo.lock`.
- `git diff --check`: czysty.
- Commit jawnym `git add`, bez push.
