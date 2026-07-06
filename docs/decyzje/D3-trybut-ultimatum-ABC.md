# D3 — Trybut (8) i Ultimatum (9) — ZAMKNIĘTE

| Pole | Wartość |
|------|---------|
| **Status** | 🟢 ZAMKNIĘTE — Maciej 2026-06-30 |
| **Powiązane** | T1A (trybut ze skarbca), `diplomacy-proposals.ts`, `diplomacy.json` params |
| **Typ umów** | **Przymus** — bez progu Relacji (G1–G4); decyduje siła + kwota |

## Odpowiedzi Macieja

| ID | Wybór | Skutek |
|----|-------|--------|
| **D3-TRYB-SILA** | **A + próg 70** | Żądanie trybutu: **Respekt proponenta > 70** (Power); min **10 ¤/turę** |
| **D3-TRYB-WOJNA** | **A** | W wojnie: tylko **oferta trybutu**; płatność **jednorazowa ¤** (reparacje za pokój) |
| **D3-ULT-WARUNKI** | **A** | Ultimatum v1.0: tylko **reparacje ¤** (min 20); wycofanie wojsk / miasto → **v1.1+** |

---

## Co to jest „Respekt” (siła imperium)

**Respekt** = udział Twojej **Mocy (Power)** w sumie obu imperiów:

```
Respekt_mój = round(100 × Power_mój ÷ (Power_mój + Power_partner))
```

**Power** liczy: wojsko (M na mapie), miasta, terytorium, budynki, tech, ekonomia, wygrane bitwy — kanon `computeObjectivePower` / `computeRespekt`.

| Power Ty | Power oni | Twój Respekt | Możesz **żądać** trybutu? |
|----------|-----------|--------------|---------------------------|
| 800 | 200 | **80** | ✅ tak |
| 710 | 290 | **71** | ✅ tak (minimalnie) |
| 700 | 300 | **70** | ❌ za mało (nie powyżej 70) |
| 550 | 450 | **55** | ❌ za słaby |

**Reguła żądania:** `Respekt_proponenta > 70` (`progTrybutZadanieMinRespekt` — **powyżej** 70, nie włącznie).

**Ultimatum** używa **osobnego** wskaźnika: **M armii** (ratio wojsk na mapie), nie Power — patrz sekcja Ultimatum.

---

## Akcja 8 — Trybut

### A) Żądanie trybutu (spokój — nie trwa wojna)

| Warunek | Wartość | Parametr JSON |
|---------|---------|---------------|
| Kto może żądać | **Respekt proponenta > 70** | `progTrybutZadanieMinRespekt` |
| Minimalna kwota | **≥ 10 ¤ / turę** | `progTrybutMinGoldPerTurn` |
| Płatność | Co turę ze **skarbca państwa** (T1A) | T1A |
| Brak ¤ u płatnika | Zerwanie traktatu + casus belli | T1A |
| Skutek relacji | Akceptacja: **+10 Respekt**; odmowa: **−10 Relacja**, casus belli | Excel / events |

**AI samo żąda** przy tym samym progu: `round(100 × Power/(Power+partner)) > 70` + umiarkowana agresja.

### B) Oferta trybutu (uniknij wojny / kup pokój)

| Sytuacja | Reguła |
|----------|--------|
| **W wojnie** | ✅ dozwolone; **jednorazowe ¤** (reparacje) → pokój po akceptacji |
| **W spokoju** | ¤/turę (traktat) **lub** jednorazowe przy „blisko wojny” |

**Progi akceptacji oferty (spokój / presja):**

| Warunek | Próg | Parametr |
|---------|------|----------|
| Absolutne minimum | **≥ 5 ¤** | `progTrybutOfertaMinGold` |
| Spokojnie (bez presji) | **≥ 10 + 5×epoka ¤/turę** | `progTrybutOfertaBaseGold` + `progTrybutOfertaEpokaGold` |
| „Blisko wojny” (niższa oferta może przejść) | **M_armii > 1,2×** partner **lub** Zaufanie **< 30** | `progTrybutOfertaNearWarRatio`, `progTrybutOfertaNearWarZaufanie` |

**Przykład w wojnie:** oferujesz **80 ¤ jednorazowo** → AI słabsze wojsko może przyjąć → pokój + transfer ze skarbca.

**Uwaga implementacyjna:** modal UI (akcja 8) dziś pokazuje głównie ¤/turę — w wojnie UI powinno domyślnie **jednorazowe reparacje** (handoff UI).

---

## Akcja 9 — Ultimatum

**Tylko w wojnie.** Gracz dyktuje warunki pod groźbą dalszej wojny.

| Warunek | Wartość | Parametr JSON |
|---------|---------|---------------|
| Przewaga militarnej **M** (armia na mapie) | **≥ 1,3×** siła partnera | `progUltimatumMilitaryRatio` |
| Reparacje (v1.0) | **≥ 20 ¤** jednorazowo | `progUltimatumMinGold` |
| Inne warunki v1.0 | **Brak** (wycofanie wojsk, oddanie miasta → odłożone) | — |

**Przykład:** Twoje M=130, ich M=100 → ratio **1,3** ✅; żądasz **50 ¤** reparacji → AI może zaakceptować.

**Odmowa:** casus belli (kontynuacja wojny).  
**Bezpodstawne ultimatum** (ratio < 1,3): odrzucone + kara reputacyjna (`ultimatum_bezpodstawne`).

---

## Podsumowanie — dwa różne „siły”

| Akcja | Co liczy „przewagę” | Próg |
|-------|---------------------|------|
| **Trybut żądanie** | **Power (Respekt) > 70** | Respekt **> 70** |
| **Trybut oferta (presja)** | Często **M armii** (blisko wojny) | M **> 1,2×** lub Zauf. < 30 |
| **Ultimatum** | **M armii** | M **≥ 1,3×** + min **20 ¤** |

---

## Stan w kodzie

| Element | Stan |
|---------|------|
| `evaluateProposal` trybut / ultimatum | ✅ zgodne z tą decyzją |
| Tick trybutu T1A (EKO) | ✅ moduł gotowy |
| UI modal akcja 8 w wojnie (jednorazowe ¤) | 🟡 do dopięcia — dziś formularz ¤/turę |
| Ultimatum — tylko ¤ v1.0 | ✅ zgodne |

Handoff UI (opcjonalny): `CYWILIZACJE-do-UI_trybut-oferta-wojna-jednorazowa.md` — przy wdrożeniu v1.1 batch.
