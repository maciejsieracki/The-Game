# HANDOFF: EKONOMIA → UI — Okolica (pola obrabiane) + Nastroje miasta

**Data:** 2026-06-25 · Odpowiedź na 2 pytania UI (panel miasta). Routing: przez mastera.
Po scaleniu MIASTO→EKONOMIA `okolica.ts` i `order.ts` są w lane EKONOMIA.

---

## ① Okolica / zasięg pól obrabianych

**Dwa RÓŻNE zasięgi — nie mylić:**
- **OKOLICA ROBOCZA** (pola obrabiane, plony): promień = `cityRangeForPopulation(pop)` [`okolica.ts:15`]:
  `pop<5 → 5` · `pop≥5 → 10` · `pop≥10 → 15`. Parametry: `data/miasto-params.json` (`zasieg_okolicy_baza/pop5/pop10`) = lane EKONOMIA.
- **GRANICA KULTUROWA** (terytorium polityczne): `cityBorderRadius(kultura)` = +0..3 pierścienie [`culture-religion.ts`], **addytywnie** nad okolicą. To **osobny overlay**, nie „Okolica".

UI dziś rysuje stałe `r=2` → zamień na realny zasięg.

**Pola obrabiane = PODZBIÓR okolicy:** `assignWorkedTiles` [`okolica.ts:72`] zwraca **N najlepszych** pól, gdzie N = populacja (reszta okolicy jest w zasięgu, ale nieobrabiana).

**HAKI (proszę OBA):**
- `getCityWorkedRange(cityId) => number` — = `cityRangeForPopulation(pop)`; promień obwódki okolicy.
- `getWorkedTiles(cityId) => {q,r}[]` — = `assignWorkedTiles`; faktycznie obrabiane (N = pop).

**(4) Tak, rozróżniaj:** wszystkie pola w promieniu (`okolicaTiles`) = „w okolicy" vs `getWorkedTiles` = „obrabiane". Render: obwódka = range; podświetlenie = worked tiles.

**UWAGA (do scalenia):** dzisiejsze liczenie plonów może jeszcze używać uproszczonego `r1` (centrum + 6) — model docelowy to okolica r5/10/15 + N najlepszych. Pogodzę to w scaleniu (mój lane). UI może już rysować wg `getCityWorkedRange`/`getWorkedTiles`.

---

## ② Nastroje (panel „Mieszkańcy")

**v0.1 = NETTO szczęście + próg (tier), NIE liczba mieszkańców wg nastroju.**
`order.ts:357` `evaluateOrder({szczescie, prawo}, params) => {order, tier:'unrest'|'neutral'|'order', effects:{productionMult, growthMult, tradeMult, revoltRisk}}`.

- **(1)** Liczymy netto + tier. Brak rozkładu 3-koszykowego w modelu.
- **(2)** Hak podstawowy: Twój `getOrderState` (opakowuje `evaluateOrder`) **WYSTARCZA**. Rozkład Zadowoleni/Kontentni/Niezadowoleni = czysta KOSMETYKA. Jeśli chcesz pasek — dorobię czysty helper `happinessBreakdown(population, szczescie) => {zadowoleni, kontentni, niezadowoleni}` (czysto wizualny, ZERO wpływu na grę).
- **(3)** Źródła szczęścia per miasto: `szczescie` składa się z: **budynki** (`baza.zadowolenie`, np. Świątynia +1) + **poziom Wealth** (`wealthZadowolenie`: W=0 kara, co +10 → +1) + **religia** (`religionHappiness`) − kary. Itemizowanego haka „+1 Świątynia" dziś nie ma; jeśli chcesz tooltip ze źródłami, dorobię `happinessSources(cityId) => {zrodlo, wartosc}[]`.

**Decyzja UI:** powiedz, czy chcesz (a) `happinessBreakdown` (pasek 3-koszykowy) i/lub (b) `happinessSources` (tooltip). Domyślnie zostaje `getOrderState` (netto + tier).

> **DECYZJA Maciela 2026-06-25: 3A** — zostaje `getOrderState` (netto + tier). `happinessBreakdown`/`happinessSources` **NIE w v0.1** (dorobię na życzenie UI później). UI: panel „Mieszkańcy" pokazuje netto szczęście + tier.
