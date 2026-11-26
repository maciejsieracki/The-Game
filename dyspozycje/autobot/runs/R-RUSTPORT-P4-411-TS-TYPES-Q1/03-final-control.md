# R-RUSTPORT-P4-411-TS-TYPES-Q1 — 03 Final Control (runda 1)

STATUS: PASS
DOMAIN: GAME (front `src-tauri/frontend-v2`, wyłącznie typy TS)
TEMAT: R-RUSTPORT-P4-411-TS-TYPES-Q1 (#411 = 403-D)
GOAL: typy TS komend i odpowiedzi mostu (19 wariantów `EngineCommand`, `siegeBattle`, `saveGame`, `speedIdx`/`speedMul`, `RenderLayersDto.reveal?`) w `frontend-v2`, zgodne z JSON silnika, z testem typów wykrywającym mutanty wymagane/opcjonalne.
ZMIANY/COMMIT: oceniany tip `a2a7d5a88` (gałąź `obrona-411`): kod Operatora `d3fc9b24c` + raport `ad53a1f84` + raport Evaluatora `4055237f5` + obrona `a2a7d5a88`. Baza `3f98dd284229f975e373b9c3be7a0d28232089d3` = baza z dispatchu; `merge-base --is-ancestor 3f98dd284 a2a7d5a88` = tak. FC dodaje tylko ten raport.
TESTY (odtworzone samodzielnie przez FC na `a2a7d5a88`, wolne 11 GB przed `npm ci`):
- `npm ci` EXIT 0; `package-lock.json` bez zmian;
- `node_modules/.bin/tsc --noEmit` (TS 5.9.3, `include: ["src"]` — obejmuje `bridgeTypes.typetest.ts`) EXIT 0;
- `npm run check` EXIT 0;
- `mutanty-411.mjs` EXIT 0: MUTANTY 17/17 zabite, BUDOWNICZOWIE 15/15 OK;
- `mutanty-411-ewaluator.mjs` EXIT 0: 45 × ZABITY, `PRZEZYLO 0 / 45`;
- `git diff --check 3f98dd284 a2a7d5a88` czysto; `@ts-ignore`/`@ts-nocheck`/`as any` w dodanych liniach: 0;
- `node_modules` usunięte po bramce. Cargo: nie dotyczy (D-411-4).
BLOKADY: brak
RUNDY: 1/5 (Operator r1 → Evaluator FAIL → Obrona r1 → FC PASS)
NASTĘPNY KROK: integracja orkiestratora (FF/merge `a2a7d5a88` + ten raport na `rust-port/parity-v2`); przełączenie okna na `frontend-v2` i klej Tauri = #410.
DEPLOY/PUSH: NIE WYKONANO

## 1. Allowlista

`git diff --stat 3f98dd284 a2a7d5a88`: `controller/bridgeTypes.ts` (nowy), `controller/bridgeTypes.typetest.ts` (nowy, test typów),
`controller/commands.ts`, `viewmodel/types.ts`, oraz w katalogu runu `01-operator-r1.md`, `02-evaluator.md`, `02a-obrona.md`,
`mutanty-411.mjs`, `mutanty-411-ewaluator.mjs`. Brak zmian w `src-tauri/src`, `src-tauri/frontend`, `rust-port/*`, `gra/`,
`package-lock.json`. Skrypty mutantów w katalogu runu traktuję jako artefakty dowodowe raportu — w granicach allowlisty.
Obrona zmieniła wyłącznie `bridgeTypes.typetest.ts` (`git diff --stat d3fc9b24c a2a7d5a88 -- src-tauri`: 1 plik) — typy produkcyjne
bez zmian względem wersji zweryfikowanej przez Evaluatora.

## 2. Weryfikacja kontraktu (wyrywkowo, FC przeciw `rust-port/engine/src/bridge.rs` przy bazie)

- `GetRenderFrame { seat: Option<u64> (default, skip), ui: Option<RenderUiParams> (default, skip) }` → `seat?`, `ui?` — zgodne.
- `StepSiegeBattle { wall_ms: WallMs }` (`WallMs(pub f64)`, `siege_battle_apply.rs:436`) → `wall_ms: number` wymagane; budowniczy odrzuca nieskończone (JSON nie niesie NaN/Inf) — zgodne.
- `SetSiegeBattleSpeed { idx: i64, #[serde(default)] clamp: bool }` → `idx: number`, `clamp?: boolean`; budowniczy `Number.isSafeInteger` + `RangeError` (D-411-2 dopuszcza „walidację całkowitości”); `CONTRACT_VERSION = 1` (`commands.ts:16`).
- `LoadGame { save: String }` → `save: string` wymagane.
- `RenderLayersDto.reveal?: FogRevealDto` bez `null` (D-411-3), `RenderLayersPayload.reveal` wymagane — zgodne z opisem serde.
- D-411-1: brak wołań Tauri i logiki gry; `bridgeTypes.typetest.ts` nie jest importowany przez aplikację (importuje go wyłącznie `tsc`), MOCK/transport bez zmian.

## 3. Orzeczenia w sprawie zarzutów Evaluatora

| Zarzut | Treść | Orzeczenie FC | Dowód |
|---|---|---|---|
| Z1 (blok.) | 23/35 mutantów wymagane→opcjonalne przeżywa | ODDAL (naprawione w obronie) | sekcja §6 testu: `Expect<Equal<…>>` per wariant `EngineCommand` i per DTO; FC odtworzył `PRZEZYLO 0 / 45`, w tym E31/E32/E39/E40 |
| Z2 (blok.) | `SPEED_RESPONSE_NARROW` nie dowodzi kluczy koperty | ODDAL (naprawione) | `_NarrowResponse`/`_NarrowSiege`/`_NarrowSave` + literały `satisfies`; E1, E2 ZABITE w przebiegu FC |
| Z3 (uwaga) | brak negatywu `null` w bool `RenderUiParams`, `consumedMachines` | ODDAL (naprawione) | E4, E19, O1, O2 ZABITE w przebiegu FC |
| Z4 (uwaga) | opis źródeł fikstur nieścisły | ODDAL (naprawione w nagłówku testu i w `02a-obrona.md`) | uwaga: korekta opisu żyje w `02a`, `01-operator-r1.md` nie przepisany — bez wpływu na kod |

Własne zarzuty FC: brak. NAPRAW: 0; DO DECYZJI CZŁOWIEKA: 0.

## 4. Kryteria końca

1. Pokrycie 19 wariantów + pól `siegeBattle`/`saveGame`/`speedIdx`/`speedMul`/`reveal`, tabela w `01-operator-r1.md` — SPEŁNIONE.
2. Fikstury z JSON silnika (komendy 1:1 z testów Rust; odpowiedzi — ręczne literały zgodne z serde, jawnie opisane) + mutanty giną (17/17, 45/45) — SPEŁNIONE.
3. `tsc --noEmit` czysto na całym `frontend-v2`; runtime MOCK bez zmian — SPEŁNIONE.
4. Raport: pokrycie, decyzja `idx`, stan `npm ci`, #410 — SPEŁNIONE.

## 5. Sprzątanie

`node_modules` usunięte; logi mutantów FC w scratchpadzie sesji; brak `CARGO_TARGET_DIR`.
