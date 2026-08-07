/**
 * unit-replace-context.ts
 *
 * Budowa `AvailabilityContext` dla mechanizmu "Zastąp" (ZASTAP-JEDNOSTKI-PLAN.md,
 * `availableReplacementsFor` w production.ts) -- wyekstrahowane z main.ts
 * (`replaceAvailabilityCtxForCity` / `replaceAvailabilityCtxEmpireWide`,
 * UNIT-REPLACE-EVOCATI-Q1, nota N1 audytu AutoBot 2026-08-06/07).
 *
 * POWÓD EKSTRAKCJI: main.ts jest za duży/zależny od DOM, żeby bundlować go
 * w całości w teście (unit-replace-test.cjs bundluje wyłącznie production.ts).
 * Przez to naprawa z commitu UNIT-REPLACE-EVOCATI-Q1 (main.ts przestał gubić
 * `empireResourceStock` przy budowie ctx -- bramka `passesAvailabilityGates`
 * odrzucała WSZYSTKIE jednostki Surowiec=Brąz/Żelazo, np. Evocati, niezależnie
 * od realnego magazynu) nie miała ŻADNEGO pokrycia testowego: gdyby ktoś usunął
 * te 2 linie w main.ts, żaden test by tego nie wykrył.
 *
 * Ta funkcja to JEDYNE miejsce, które składa `AvailabilityContext` dla "Zastąp"
 * -- main.ts (`replaceAvailabilityCtxForCity`/`replaceAvailabilityCtxEmpireWide`)
 * jest teraz CIENKIM WRAPPEREM: zbiera dane z zamkniętych nad main.ts (cities,
 * player, units, cityBuilt, _menuDifficulty) i woła tę funkcję. Dzięki temu:
 *
 *   1) `ReplaceAvailabilityCtxParams` wymaga `empireResourceStock` (pole
 *      OPCJONALNE w samym `AvailabilityContext`, bo inni wołający -- productionCtxForCity
 *      itp. -- mają inne kontrakty) -- ominięcie go w main.ts przy wołaniu
 *      `buildReplaceAvailabilityCtx({...})` jest błędem TYPÓW (bramka `tsc --noEmit`),
 *      NIE cichym zgubieniem pola w runtime.
 *   2) Ta funkcja (pure, bez DOM/THREE) jest bundlowana i testowana WPROST w
 *      `tools/unit-replace-test.cjs` -- test dowodzi, że przekazane `empireResourceStock`
 *      trafia 1:1 do zwróconego `AvailabilityContext` I że `availableReplacementsFor`
 *      faktycznie odblokowuje jednostki Brąz/Żelazo tylko wtedy, gdy magazyn > 0.
 */

import type { AvailabilityContext } from './production';

/**
 * Pola przekazywane przez wołającego (main.ts) na potrzeby "Zastąp" -- reużywa
 * DOKŁADNIE typy pól z `AvailabilityContext` (production.ts, zero duplikacji typów
 * CivBonusLite/PlacedLayers itp.), z JEDNYM wyjątkiem: `empireResourceStock` jest
 * tu OBOWIĄZKOWE (w samym `AvailabilityContext` jest opcjonalne, bo inni wołający --
 * productionCtxForCity itp. -- mają inne kontrakty).
 *
 * UNIT-REPLACE-EVOCATI-Q1: bez `empireResourceStock` `passesAvailabilityGates`
 * (production.ts) odrzuca KAŻDĄ jednostkę Surowiec=Brąz/Żelazo
 * (empireStockHas(undefined, ...) = false) -- NIE USUWAĆ / NIE CZYNIĆ OPCJONALNYM
 * bez sprawdzenia noty N1 (dyspozycje/PYTANIA-OTWARTE.md, sekcja "Znaleziska AutoBot
 * 2026-08-06/07"). Dzięki temu, że pole jest tu wymagane, pominięcie go w main.ts
 * przy wołaniu `buildReplaceAvailabilityCtx({...})` jest błędem TYPÓW (bramka
 * `tsc --noEmit`), NIE cichym zgubieniem pola w runtime.
 */
export type ReplaceAvailabilityCtxParams =
  & Omit<AvailabilityContext, 'empireResourceStock'>
  & { empireResourceStock: NonNullable<AvailabilityContext['empireResourceStock']> };

/**
 * Składa `AvailabilityContext` dla `availableReplacementsFor` z już wyliczonych
 * przez wołającego wartości (main.ts zna cities/player/units/cityBuilt/mapę --
 * ta funkcja jest pure i o nich nie wie, jak reszta production.ts).
 */
export function buildReplaceAvailabilityCtx(
  params: ReplaceAvailabilityCtxParams,
): AvailabilityContext {
  return { ...params };
}
