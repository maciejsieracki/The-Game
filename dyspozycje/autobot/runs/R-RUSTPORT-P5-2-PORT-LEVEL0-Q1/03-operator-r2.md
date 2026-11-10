STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P5-2-PORT-LEVEL0-Q1
GOAL: Obrona r2. Odpowiedzi na zarzuty 1–3 Evaluatora r1 (`02-evaluator-r1.md`, commit `5b67dbb0` na `33e3c85a`). Port 15 modułów poziomu 0 na DTO, kontroler MOCK i `StaticCatalogDto`, z rejestrem zgodności z P5-0 §6.

ZMIANY-COMMIT: commit na `5b67dbb0` (SHA w raporcie końcowym orkiestratora / `git log`). Worktree: `.claude/worktrees/wf_18adcd70-aa5-3`. Ścieżki (wszystkie z allowlisty):
- `src-tauri/frontend-v2/src/viewmodel/types.ts`: usunięty `TreatyBalancePreviewDto`. Dodane `DiplomacyTreatyGateDto`, `DiplomacyBasketPreviewDto.treatyGate` i `DiplomacyTreatyBasketPreviewDto`. W `PnBalancePanelDto` opisany jako rozszerzenie i dodany wymóg dla `canAccept`.
- `src-tauri/frontend-v2/src/ui/diplomacyAcceptanceBalance.ts`: renderer traktatu i pokoju czyta `DiplomacyBasketPreviewDto` w trybie `treaty` (pola `treatyPw`, `givePn`, `receivePn` oraz `treatyGate`).
- `src-tauri/frontend-v2/tools/dom-harness/run.mjs`: `treatyDto` buduje nowy kształt DTO.
- `src-tauri/frontend-v2/PORTING-QUEUE.md`: zaktualizowane wiersze 8, 12, 13, 14 i 15 oraz notka o zmianie API.
- `dyspozycje/rust-port/p5/P5-2-PORT-LEVEL0.md`: nowa kolumna P5-0 w tabelach §3 i §4.1, nowa sekcja §3a (rejestr rozszerzeń), ZAŁOŻENIA Z9–Z17 w §8, nowa sekcja §12 (odpowiedzi na zarzuty).
- `runs/…/03-operator-r2.md`, `r2-logi/**`, `.gitattributes` (dodana linia `r2-logi/diffs`).

ZARZUTY:
1. **PRZYJMUJĘ.** Tabele §3 i §4.1 mają teraz kolumnę z sekcją P5-0. Nowy §3a to rejestr 12 rozszerzeń: każde pole z listy Evaluatora ma swój wiersz i ZAŁOŻENIE (Z2, Z6, Z9–Z15).
2. **PRZYJMUJĘ.**
   - Traktat korzysta teraz z jednego typu `DiplomacyBasketPreviewDto` (`mode: treaty`, pole `treatyPw` jak w P5-0). Rozszerzeniem jest tylko blok `treatyGate` (Z9).
   - `PnBalancePanelDto` zostaje osobnym typem, bo opisuje bilans stołu negocjacji z wieloma propozycjami, a nie podgląd jednego koszyka (Z10).
   - Dopisany wymóg: `canAccept` liczy ta sama funkcja Rust co bramka przyjęcia.
3. Częściowo **PRZYJMUJĘ**, częściowo **ODRZUCAM**.
   - `mapLoadingOverlay`: już dziś `total = phaseTotal ?? fallback` (pin `:232`, v2 `:230`), a wołający pina podają `phaseTotal` (`main.ts:37007` i dalsze). Źródłem jest więc `MapGenProgressEvent.total`; stała z katalogu działa tylko jako fallback. To zapisane w Z16.
   - `victoryScreen`: P5-0 §6.1 sam wymienia `constants.prog_dominacji_power` i `victoryScreen.ts` jako konsumenta, czyli P5-0 podaje dwa źródła. Wybór źródła i warunek jednego parametru Rust zapisane w Z17.
   - Brak ZAŁOŻEŃ i nieaktualne wiersze 13 i 15 w `PORTING-QUEUE`: poprawione.
   - Kod obu modułów bez zmian.

TESTY (`r2-logi/`, każdy log kończy się `EXIT=`):

| Bramka | Wynik |
|---|---|
| `npm ci` | EXIT=0 |
| `tsc --noEmit` | EXIT=0 |
| `npm run check` | EXIT=0: 0 trafień na 64 plikach, 0 niezgodnych kopii na 401 |
| `vite build` | EXIT=0 |
| Harness DOM | EXIT=0: 3861 przypadków, 0 różnic (w tym `diplomacyAcceptanceBalance.ts`: 1245/0) |
| Mutacje harnessu | 14/14 wykrytych, EXIT=0 (mutacja M9 w traktacie daje 416 różnic) |
| Diff `diplomacyAcceptanceBalance.ts` | 591 LOC, +69/−377 |

`node_modules` i `dist` usunięte (`07-cleanup.log`).

BLOKADY: bez nowych. Pozycje NIE_ZMIERZONO z r1 bez zmian: WebGL miniatury, piksele minimapy, zapisy FSA, okno Tauri, komendy Rust (na razie tylko MOCK). Uwagi Evaluatora bez wpływu na werdykt nie zostały w r2 zaadresowane w kodzie.

RUNDY: 2/5

NASTĘPNY KROK: Evaluator r2 weryfikuje §3a, §8 (Z9–Z17) i §12 oraz odtwarza bramki i harness.

DEPLOY/PUSH: NIE WYKONANO
