# R-RUSTPORT-P4-411-TS-TYPES-Q1 — Evaluator r1 (adwersarialny)

STATUS: FAIL
DOMAIN: GAME (front `src-tauri/frontend-v2`, wyłącznie typy)
TEMAT: R-RUSTPORT-P4-411-TS-TYPES-Q1 (#411 = 403-D)
GOAL: typy TS komend i odpowiedzi mostu (render/bitwa/zapis) w `frontend-v2`, zgodne z JSON silnika.
ZMIANY/COMMIT: oceniany kod `d3fc9b24c` + raport `ad53a1f84` (gałąź `rust-port-wip/R-RUSTPORT-P4-411-TS-TYPES-Q1`);
baza `3f98dd284229f975e373b9c3be7a0d28232089d3` (zgodna z dispatchem; `merge-base --is-ancestor 3f98dd284 ad53a1f84` = tak).
Evaluator nie zmienia kodu; dodaje tylko ten raport.
TESTY: `npm ci` EXIT 0; `tsc --noEmit` EXIT 0; `npm run check` EXIT 0; `mutanty-411.mjs` EXIT 0 (17/17, budowniczowie 15/15);
`git diff --check` czysty; mutanty Evaluatora (systematyczne): **23 z 35 PRZEŻYŁO** (szczegóły niżej).
BLOKADY: brak infrastrukturalnych.
RUNDY: 1/5
NASTĘPNY KROK: Operator r2 (ten sam ID): domknąć czułość testu typów (zarzuty Z1–Z3), potem Evaluator r2.
DEPLOY/PUSH: NIE WYKONANO

## 1. Bramki odtworzone

| Bramka | Wynik |
|---|---|
| `npm ci` (11 GB wolnego przed; `package-lock.json` bez zmian) | EXIT 0 |
| `npx tsc --noEmit` (TS 5.9.3), cały `frontend-v2` | EXIT 0 |
| `npm run check` | EXIT 0 |
| `node …/mutanty-411.mjs` (mutanty Operatora + budowniczowie) | EXIT 0, 17/17 zabite, 15/15 OK, po przywróceniu `tsc` OK |
| `git diff --check 3f98dd284 ad53a1f84` | czysto |
| `@ts-ignore` / `@ts-nocheck` w diffie | brak (jedyne `any` w `controller/` to istniejący `k07bWiring.ts`) |
| cargo | nie dotyczy (temat bez cargo, D-411-4) |

`node_modules` usunięte po bramce.

## 2. Zgodność typów z kodem Rust (odczyt `3f98dd284`)

Sprawdzone ręcznie z `rust-port/engine/src/bridge.rs:28-130,190-273`, `domain/siege_battle_apply.rs:244-300,430-560`,
`domain/render_frame.rs:126-150`, `view-model/src/{root.rs:59-100,map.rs:112-258,owners.rs:68-76,ids.rs:180-189,battle.rs:159-170}`,
`territory_ranges_view.rs:115-124`, `dto_bridge.rs:345-358`, `playable.rs:735-743`.

- `EngineCommand`: 19 wariantów, nazwy `kind` = `COMMAND_KINDS` (`bridge_contract.rs:34-54`) — zgodne. Pola wariantów
  snake_case (enum `rename_all` nie dotyczy pól) — zgodne z `bridge_contract.rs:158-216`.
- Wymagane/opcjonalne: `attack_unit_id?`, `seat?`, `ui?`, `params?`, `clamp?` (pola `default`/`skip`), reszta wymagana — zgodne.
- `RenderUiParams`: `#[serde(default, …, deny_unknown_fields)]` → wszystkie pola `?`, `Option` → `| null` — zgodne.
- `SiegeBattlePayload`, `SiegeBattleResultDto`, `SiegeTowerShooterDto`, `SiegeBattleUnitRefDto` (`unitId: String`),
  `SiegeBattleErrorDto` (20 kodów, `tag = "code"`, `rename_all_fields = "camelCase"`), `BattleWinner`/`PlayableSiegeMachineKind`
  (lowercase) — zgodne.
- `BridgeResponse` (`siegeBattle?`, `saveGame?`), `BridgeError.siegeBattle?` — zgodne.
- `RenderLayersDto` (14 kluczy + `reveal?`), `FogRevealDto` (`riverRevealKeys: … | null`, bez skip), `FogState` (u8 0/1/2,
  własny `Serialize`), `ViewerDto`, `MapViewDto`, `TerritoryRangesDto`, `RenderLayersPayload` (`reveal` wymagane) — zgodne.
- D-411-1: brak wołania Tauri, brak logiki gry; `frontendDist`, `mock.ts`, `transport.ts`, `index.ts`, `main.ts` niezmienione.
- D-411-2: walidacja `Number.isSafeInteger` z `RangeError` (zamiast `Math.trunc`) — dopuszczone literą dispatchu
  („`Math.trunc`/walidację całkowitości”); `CONTRACT_VERSION` = 1 bez zmian. Akceptuję.
- D-411-3: `reveal?: FogRevealDto` bez `null` — zgodne.

Tabela „wariant Rust → typ TS” w raporcie Operatora jest poprawna (kryterium 1 spełnione).

## 3. Allowlista

Zmienione: `controller/bridgeTypes.ts` (nowy), `controller/bridgeTypes.typetest.ts` (nowy test typów), `controller/commands.ts`,
`viewmodel/types.ts`, `runs/…/01-operator-r1.md`, `runs/…/mutanty-411.mjs`. Wszystko w allowliście (skrypt bramki w katalogu
runu — dopuszczalne jako artefakt dowodowy). Brak zmian w `src-tauri/src`, `src-tauri/frontend`, `rust-port/*`, `gra/`,
`package-lock.json`. Sekcja „pliki spoza allowlisty”: brak.

## 4. Mutanty Evaluatora (adwersarialne) — kryterium 2 NIE spełnione

Dispatch, kryterium 2: „mutanty typów (usunięcie wymaganego pola, zmiana opcjonalności) wywalają `tsc`”. Operator dobrał 17
mutantów, które giną; systematyczny przegląd tej samej klasy mutacji na nowych typach daje **23 przeżycia na 35** (skrypt
Evaluatora: jedna mutacja → `tsc --noEmit` → przywrócenie; 2 wzorce niejednoznaczne pominięte).

Przeżyły (`tsc` EXIT 0 mimo mutacji):

| # | Mutant | Dlaczego przeżył |
|---|---|---|
| E1 | `BridgeResponse` (commands.ts) bez `siegeBattle?` | `SPEED_RESPONSE_NARROW = SPEED_RESPONSE satisfies BridgeResponse` to `satisfies` na IDENTYFIKATORZE — brak kontroli nadmiarowych kluczy; raport Operatora przedstawia to jako dowód zawężonej koperty, a ten dowód nic nie sprawdza |
| E2 | `BridgeResponse` bez `saveGame?` | brak jakiejkolwiek fikstury zapisu przez zawężoną kopertę |
| E4 | `foundCityMode?: boolean \| null` (Rust `bool` odrzuca `null`) | brak negatywu |
| E12 | `SiegeTowerShooterDto.typ` wymagane | brak fikstury bez `typ` |
| E13 | `captureRequested` wymagane | jedyna fikstura wyniku ma klucz |
| E14 | `removedUnitIds?` | brak negatywu |
| E19 | `consumedMachines: string[]` | brak negatywu |
| E20 | `SiegeUnitHpDto.hp?` | brak negatywu |
| E21 | `PositionDto.y?` | brak negatywu |
| E24 | `add_player.name?` | brak negatywu |
| E25 | `declare_war.target?` | brak negatywu |
| E26 | `TerritoryRangesDto.borders?` | brak negatywu |
| E30 | `FogRevealDto.revealAllLand?` | brak negatywu |
| E31 | `start_siege_storm.unit_id?` | brak negatywu (nowa komenda z GOAL) |
| E32 | `SiegeBattlePayload.phase?` | brak negatywu |
| E33 | `wallBreached?` | brak negatywu |
| E34 | `RenderLayersPayloadDto.territory` → nieprzezroczyste | brak negatywu |
| E35 | `move_unit.destination?` | brak negatywu |
| E36 | `EngineBridgeResponse.contractVersion?` | brak negatywu |
| E37 | `RenderLayersDto.turn?` | `_FrameKeys` porównuje tylko klucze, nie opcjonalność |
| E38 | `MapViewDto.riverRenderPaths?` | brak negatywu |
| E39 | `load_game.save?` | brak negatywu (nowa komenda z GOAL; Rust odrzuca brak `save`) |
| E40 | `step_siege_battle.wall_ms?` | brak negatywu (nowa komenda z GOAL; Rust odrzuca brak `wall_ms`) |

Zabite przez istniejące fikstury (dla porządku): E3, E5, E7, E8, E9, E10, E15, E16, E18, E22, E27, E29.

## 5. Zarzuty

- **Z1 (blokujący, kryterium 2):** test typów nie wykrywa zmiany „wymagane → opcjonalne” dla większości wymaganych pól nowych
  typów, w tym pól nowych komend mostu (`load_game.save`, `step_siege_battle.wall_ms`, `start_siege_storm.unit_id`) i
  `SiegeBattlePayload.phase`. Naprawa: dla każdego wymaganego pola komend i DTO rozpisanych w #411 dodać negatyw
  `@ts-expect-error` (literał bez tego pola `satisfies …`) albo jedną asercję typu na zbiór kluczy wymaganych, np.
  `Expect<Equal<RequiredKeys<T>, 'a' | 'b'>>` (z `RequiredKeys` liczonym z `{} extends Pick<T, K>`), osobno dla każdego wariantu
  `EngineCommand` i każdego rozpisanego DTO. Wtedy mutanty E12–E40 giną systemowo, nie wybiórczo.
- **Z2 (blokujący, fałszywy dowód):** `SPEED_RESPONSE_NARROW = SPEED_RESPONSE satisfies BridgeResponse` nie sprawdza obecności
  `siegeBattle`/`saveGame` w zawężonym `BridgeResponse` (E1, E2 przeżywają). Naprawa: fikstury-literały `satisfies BridgeResponse`
  z `siegeBattle` i z `saveGame` (kontrola nadmiarowych kluczy), albo `Expect<Equal<BridgeResponse['siegeBattle'],
  SiegeBattlePayload | undefined>>` i analogicznie `saveGame`.
- **Z3 (uwaga):** negatyw dla `null` w polach `bool` `RenderUiParams` (E4) i dla zawężenia `consumedMachines` (E19) —
  tani i zgodny z `deny_unknown_fields`/typami Rust.
- **Z4 (uwaga, bez wpływu na werdykt):** raport mówi „fikstury przepisane 1:1 z JSON testów Rust”; dla komend to prawda
  (sprawdzone `bridge_contract.rs:158-216`, `p4_364_render_frame.rs:370-398`), ale fikstury odpowiedzi z zagnieżdżonymi DTO są
  ręcznymi minimalnymi literałami (Operator to ujawnia), a `create_session` z `params: {civId, seed}` nie pochodzi z testu
  Rust (typ `params` jest nieprzezroczysty, więc bez wpływu). Poprawić opis źródeł.
- Pozostałe kryteria (1, 3, 4) spełnione; zmiany kodu typów same w sobie są poprawne — FAIL dotyczy wyłącznie czułości testu
  wymaganej literą kryterium 2 i nieprawdziwego dowodu Z2.

## 6. Sprzątanie

`node_modules` w `frontend-v2` usunięte; skrypt mutantów Evaluatora wyłącznie w scratchpadzie sesji; brak `CARGO_TARGET_DIR`.
