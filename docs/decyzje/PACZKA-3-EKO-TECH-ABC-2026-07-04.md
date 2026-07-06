# Paczka 3/5 — EKO-TECH (ABC-12, ABC-13, ABC-15)

> **Data:** 2026-07-04 · **Status:** 🔵 **W TRAKCIE** (lane wdrożone, czeka F + main.ts wire)  
> **Potwierdzenie:** formularz ABC + uwagi własne ABC-13

## Odpowiedzi Macieja

| ID | Decyzja | Uwagi Macieja |
|----|---------|---------------|
| **ABC-12** | **A** | Kuźnia **tylko wojsko** (mnożnik siły); brąz **wyłącznie** w budynku przetwórczym (Odlewnia/Piec), nie w Kuźni |
| **ABC-13** | **A** + **WŁASNY** | Nazwa: **Piec hutniczy**. Jeden piec obsługuje brąz **i** (po upgrade) żelazo. **Dostęp do brązu** dopiero gdy są **oba**: Popalnia brązu (mapa) **oraz** Piec hutniczy (miasto) — sama ruda na mapie ≠ brąz. Prośba: sprawdzić implementowalność i kolizje z innymi regułami. |
| **ABC-15** | **A** | Handel surowcem tylko przy stock **≥ 2**; **1 sztuka zostaje** = dostęp (nie handlowalna) |

## Wpięcie main.ts ✅ (2026-07-05)

- `configureCityPanel` → `getPlacedImprovements: () => placedImprovements`
- `autoManageCity` ctx → `placedImprovements`
- Panel miasta: `productionCtxForCity()` przekazuje mapę do `buildableProduction` / `purchasableUnits`

**Testy:** paczka1 9/9 · paczka2 9/9 · paczka3 10/10

| Element | Stan dziś | Co trzeba |
|---------|-----------|-----------|
| Nazwa Piec hutniczy | `odlewnia_brazu` / „Odlewnia brązu” w JSON | Zmiana `nazwa` (+ opcjonalnie `id` → `piec_hutniczy` w batchu DANE) |
| Kuźnia bez brązu | `converters.ts` — Kuźnia nie ma receptury | ✅ zgodne z ABC-12 A |
| Receptura brąz | `odlewnia_brazu`: ruda+paliwo→brąz | ✅ jest |
| Upgrade żelazo | `odlewnia_zelaza` `upgradeFrom: odlewnia_brazu` | ✅ pasuje do „piec robi brąz i żelazo” przez upgrade |
| **AND Popalnia + Piec** | Popalnia odblokowuje `ruda` w panelu; brak twardej bramki „brąz” | **Nowa bramka** EKONOMIA: `hasBrazAccess = empireMaPopalnie && miastoMaPiecHutniczy` |
| Handel ≥ 2 | Brak licznika stocku (v0.1 boolean) | ABC-15 = **zapis na v2 handlu**; nie blokuje paczki 3 |

**Kolizje:** brak reguły blokującej AND-gate. Jedyna uwaga: `resource-access.ts` dziś pokazuje złoża w zasięgu **zanim** gracz zbuduje ulepszenie — to temat **ABC-19** (paczka 5/5).

## Powiązane

- Paczka 1–2: `PACZKA-1-EKO-TECH-ABC-2026-07-04.md`, `PACZKA-2-EKO-TECH-ABC-2026-07-04.md`
- Następna paczka ABC: **4/5** (ABC-16, 17, 18)
