# R-RUSTPORT-P4-411-TS-TYPES-Q1 — 02a Obrona Operatora (runda 1)

STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-411-TS-TYPES-Q1
GOAL: typy TS komend i odpowiedzi mostu (19 wariantów `EngineCommand`, `siegeBattle`, `saveGame`, `speedIdx`/`speedMul`, `RenderLayersDto.reveal?`) w `src-tauri/frontend-v2`, z testem typów, który wykrywa mutanty wymagane/opcjonalne.
ZMIANY/COMMIT: baza obrony = `4055237f5` (raport Evaluatora; kod Operatora `d3fc9b24c`, raport `ad53a1f84`; baza tematu `3f98dd284`). Commit obrony: patrz SHA w odpowiedzi Workflow (gałąź `obrona-411` w worktree `wf_0bd2238e-651-3`). Pliki: `src-tauri/frontend-v2/src/controller/bridgeTypes.typetest.ts` (allowlista: test typów), `dyspozycje/autobot/runs/R-RUSTPORT-P4-411-TS-TYPES-Q1/mutanty-411-ewaluator.mjs` (nowy), `02a-obrona.md`. BEZ zmian w `bridgeTypes.ts`, `commands.ts`, `viewmodel/types.ts` (typy produkcyjne były poprawne, co Evaluator potwierdził; poprawka dotyczy wyłącznie testu), BEZ zmian w `src-tauri/src`, `src-tauri/frontend`, `rust-port/*`, `gra/`, `package-lock.json`.
TESTY: `npm ci` EXIT 0; `tsc --noEmit` EXIT 0; `npm run check` EXIT 0; `mutanty-411.mjs` (Operator) EXIT 0: 17/17 zabite, budowniczowie 15/15; `mutanty-411-ewaluator.mjs` (zestaw Evaluatora + 8 nowych) EXIT 0: **45/45 zabite, 0 przeżyło**; `git diff --check` czysto; `@ts-ignore` = 0. `node_modules` usunięte po bramce. Bez cargo (D-411-4).
BLOKADY: brak
RUNDY: 1/5 (obrona po FAIL Evaluatora r1)
NASTĘPNY KROK: Final Control (ponowna weryfikacja mutantów skryptem `mutanty-411-ewaluator.mjs`).
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

### Z1 (blokujący, kryterium 2: przeżywające mutanty wymagane → opcjonalne) — PRZYJMUJĘ

Diagnoza Evaluatora jest trafna: fikstury `satisfies` z kluczem pasują także do typu z `?:`, więc
zmiana wymagane → opcjonalne nie była wykrywana (23/35 przeżyło).

Poprawka: nowa sekcja §6 w `bridgeTypes.typetest.ts` — asercja DOKŁADNEJ równości
`Expect<Equal<T, {…}>>` (relacja identyczności TS) dla:
- każdego z 19 wariantów `EngineCommand` osobno (`Cmd<'load_game'>`, `Cmd<'step_siege_battle'>`,
  `Cmd<'start_siege_storm'>`, `Cmd<'move_unit'>`, `Cmd<'add_player'>`, `Cmd<'declare_war'>`, …);
- `PositionDto`, `RenderUiParams`, `SiegeBattleUnitRefDto`, `SiegeUnitHpDto`,
  `CityCaptureRequestedDto`, `SiegeBattleMachineKindDto`, `SiegeBattleResultDto`,
  `SiegeTowerShooterDto`, `SiegeBattlePhaseDto`, `SiegeBattlePayload`, `SiegeBattleErrorDto`
  (pełna unia 20 wariantów z polami);
- `EngineBridgeResult`, `EngineBridgeResponse`, zawężonej `BridgeResponse`, `BridgeError`;
- `RenderHexCoordDto`, `FogStateCode`, `FogViewDto`, `FogRevealDto`, `ViewerDto`, `MapViewDto`,
  `RenderLayersDto`, `TerritoryRangesDto`, `RenderLayersPayloadDto`.

Kształt oczekiwany zapisany niezależnie wg reguły serde (brak `Option`/`default` = wymagane;
`Option` + `skip_serializing_if` = `?:`; `Option` bez niego = `| null`; `#[serde(default)]` na
polu komendy = `?:`). `Equal` odróżnia `a: T` od `a?: T`, `T` od `T | null`, zawężenie/poszerzenie
unii oraz dodanie/usunięcie klucza — rozwiązanie zaproponowane przez Evaluatora („Expect<Equal<…>>
per wariant i per DTO”), w wersji mocniejszej niż `RequiredKeys` (łapie też typy pól).

Dowód: skrypt Evaluatora `evmut.mjs` skopiowany 1:1 do
`dyspozycje/autobot/runs/R-RUSTPORT-P4-411-TS-TYPES-Q1/mutanty-411-ewaluator.mjs`; wszystkie
wymienione w zarzucie mutanty zabite, m.in.:

| mutant | wynik | gdzie łapie |
|---|---|---|
| E39 `load_game.save?` | ZABITY | `_CmdLoad` (TS2344) |
| E40 `step_siege_battle.wall_ms?` | ZABITY | `_CmdStep` |
| E31 `start_siege_storm.unit_id?` | ZABITY | `_CmdStartStorm` |
| E32 `SiegeBattlePayload.phase?` | ZABITY | `_Payload` |
| E35 `move_unit.destination?` | ZABITY | `_CmdMoveUnit` |
| E24 `add_player.name?` | ZABITY | `_CmdAddPlayer` |
| E25 `declare_war.target?` | ZABITY | `_CmdDeclareWar` |
| E21 `PositionDto.y?` | ZABITY | `_Position` |
| E30 `FogRevealDto.revealAllLand?` | ZABITY | `_FogReveal` |
| E37 `RenderLayersDto.turn?` | ZABITY | `_Frame` |
| E38 `MapViewDto.riverRenderPaths?` | ZABITY | `_MapView` |
| E26 `TerritoryRangesDto.borders?` | ZABITY | `_TerritoryRanges` |
| E34 `RenderLayersPayloadDto.territory` luzne | ZABITY | `_LayersPayload` |
| E33/E14/E20/E19 wynik bitwy | ZABITY | `_Result` / `_UnitHp` |
| E13 `captureRequested` wymagane, E12 `towerShooter.typ` wymagane | ZABITY | `_Result` / `_TowerShooter` |
| E36 `EngineBridgeResponse.contractVersion?` | ZABITY | `_EngineResponse` |

Wynik całości: `PRZEZYLO 0 / 45`, EXIT 0 (log:
`/tmp/claude-0/-home-user-The-Game/b3259bfd-6985-5166-9861-4edd4aa89b33/scratchpad/mut411ev.log`).

Uwaga dla FC: w `evmut.mjs` dwa mutanty (E11 `MapViewDto bez seed`, E23 `ui luzny`) miały kotwicę
występującą 2× i były POMIJANE (`SKRYPT … 2`, nie wliczane do „35”). W kopii kotwice zawężono do
jednego miejsca i oba są teraz uruchamiane i ZABITE; dodatkowo skrypt traktuje kotwicę ≠ 1 jako
porażkę (nie po cichu pomija) i kończy się EXIT 1, gdy cokolwiek przeżyje.

### Z2 (blokujący, fałszywy dowód `SPEED_RESPONSE_NARROW`) — PRZYJMUJĘ

Racja: `identyfikator satisfies T` nie włącza kontroli nadmiarowych kluczy, więc nie dowodzi
obecności `siegeBattle?`/`saveGame?` w zawężonej kopercie. Poprawki:
- `_NarrowResponse` = `Equal<BridgeResponse, {contractVersion; requestId; result: {kind:'state'; state: unknown}; siegeBattle?: SiegeBattlePayload; saveGame?: string}>`;
- `_NarrowSiege` = `Equal<BridgeResponse['siegeBattle'], SiegeBattlePayload | undefined>`,
  `_NarrowSave` = `Equal<BridgeResponse['saveGame'], string | undefined>` (dokładnie wg propozycji);
- literały `SPEED_RESPONSE_NARROW_LITERAL` i `SAVE_RESPONSE_NARROW_LITERAL` z `satisfies BridgeResponse`
  (kontrola nadmiarowych kluczy działa) + negatywny `BAD_NARROW_MAP` (`render_map` w zawężonej kopercie);
- stary `SPEED_RESPONSE_NARROW` zostaje jako test przypisywalności, z komentarzem, że NIE jest dowodem
  kluczy (korekta opisu).

Dowód: E1 (bez `siegeBattle?`) i E2 (bez `saveGame?`) ZABITE (`_NarrowResponse`, TS2344); dodatkowe
O3 (`siegeBattle?: unknown`) ZABITY.

### Z3 (uwaga: brak negatywnego testu `null` w polach bool `RenderUiParams`; E19) — PRZYJMUJĘ

- `_RenderUi` wymusza dokładny kształt: pola `bool` bez `null`, pola `Option` z `| null`.
- Negatywne `@ts-expect-error`: `foundCityMode: null`, `buildModeOpen: null`, `wonderActive: null`,
  `unitSelectedAfterBuildOpen: null`; pozytywny `OK_UI_OPTION_NULL` (`selectedUnitId`, `hover`,
  `activeImprovementKey` = `null` przechodzą — `Option` w Rust).
- `consumedMachines`: `_Result` porównuje z `('taran' | 'wieza')[]` (literał, nie alias), plus
  `_MachineKind` i negatywny `BAD_MACHINE = ['katapulta']`.

Dowód: E4 (`foundCityMode?: boolean | null`) ZABITY, E19 (`consumedMachines: string[]`) ZABITY,
dodatkowe O1 (`wonderActive` z `null`) i O2 (`selectedUnitId` bez `null`) ZABITE.

### Z4 (uwaga: opis „przepisane 1:1 z testów Rust” nieścisły) — PRZYJMUJĘ

Nagłówek `bridgeTypes.typetest.ts` przepisany: rozdziela (a) komendy i kopertę żądania — 1:1 z
`json!`/`from_value` testów Rust (`bridge_contract.rs:158-216`, `:391-395`,
`p4_364_render_frame.rs:349-398`, `p4_save_load_bridge.rs:278-283`); (b) WYJĄTEK `create_session`
z `params: {civId, seed}` — ręczny literał z kluczy DTO z testu deserializacji samego
`StartGameParams` (`bridge_contract.rs:405,415`), w teście mostu Rust używa
`StartGameParams::default()` (`:345`); oznaczone też komentarzem przy fiksturze; (c) odpowiedzi z
zagnieżdżonymi DTO — ręczne minimalne literały zgodne z serde, nie zrzut JSON silnika; (d) kody
błędów — 1:1 z `p4_1i6_dlugi.rs:573-664`, wartości liczbowe ręczne. Ta sama korekta obowiązuje
opis w `01-operator-r1.md` (raport Operatora nie jest przepisywany; korekta w tym pliku).

### „Verified OK” Evaluatora

Bez sporu. Typy produkcyjne (`bridgeTypes.ts`, `commands.ts`, `viewmodel/types.ts`) nie zmienione;
atrapa MOCK bez zmian (plik testu nie jest importowany przez aplikację); D-411-1/2/3/4 bez zmian;
przełączenie okna na `frontend-v2` i klej Tauri nadal = #410.

## Nowe mutanty obrony (O1–O8, wszystkie ZABITE)

O1 `wonderActive` z `null`; O2 `selectedUnitId` bez `null`; O3 `BridgeResponse.siegeBattle?: unknown`;
O4 `saveGame?: string | null`; O5 `not_siege_anchor.besiegerId?`; O6 `cancel_planned_march.force?`;
O7 `FogRevealDto.riverRevealKeys?`; O8 `RenderLayersDto.battle` bez `null`.

## Polecenia weryfikacji (dla FC)

```bash
cd src-tauri/frontend-v2 && npm ci
node_modules/.bin/tsc --noEmit                                   # EXIT 0
npm run check                                                    # EXIT 0
node ../../dyspozycje/autobot/runs/R-RUSTPORT-P4-411-TS-TYPES-Q1/mutanty-411.mjs            # 17/17, 15/15
node ../../dyspozycje/autobot/runs/R-RUSTPORT-P4-411-TS-TYPES-Q1/mutanty-411-ewaluator.mjs  # PRZEZYLO 0 / 45
rm -rf node_modules
```
