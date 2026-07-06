# D-START-OSIEDLE — bonus malejący pop 1→4

> **Status:** ✅ **ZAMKNIĘTE** — Maciej **2026-07-02** („Wdrażamy w takiej formie. Jest super.”)  
> **Lane:** EKONOMIA · `society-params.json`, `society-breakdown.ts`, `turn-economy.ts`  
> **Tuner:** `docs/balans/D-START-OSIEDLE-tuner.xlsx` · import: `python tools/import-osiedle-tuner-xlsx.py`  
> **Cel:** łagodny start Porządku T1 **bez** darmowego wojska — bonus osiedla maleje wraz ze wzrostem populacji.

---

## Decyzja

Zamiast jednostki w garnizonie na starcie: **ekstra bonusy dla małego miasta (pop 1–4)**, malejące co poziom populacji. Od pop 5 — jak dziś (kary zagęszczenia).

Etykieta w panelu: **„Osiedle (N mieszk.)”**.

D-START-UNIT (darmowe wojsko na starcie) — **odłożone / niepotrzebne** przy tym fixie.

---

## Tabele kanon (Maciej, Excel final)

### Prawo

| Pop | Easy | Normal | Hard |
|-----|------|--------|------|
| 1 | +9 | +7 | +5 |
| 2 | +7 | +5 | +3 |
| 3 | +5 | +3 | +2 |
| 4 | +3 | +1 | +1 |

### Szczęście

| Pop | Easy | Normal | Hard |
|-----|------|--------|------|
| 1 | +4 | +3 | +1 |
| 2 | +3 | +2 | +1 |
| 3 | +2 | +1 | +0 |
| 4 | +1 | +0 | +0 |

### Zdrowie *(bez zmian vs propozycja)*

| Pop | Easy | Normal | Hard |
|-----|------|--------|------|
| 1 | +3 | +2 | +1 |
| 2 | +2 | +1 | +1 |
| 3 | +1 | +1 | +0 |
| 4 | +1 | +0 | +0 |

---

## Symulacja PorPct (T1, kult+rel, bez garnizonu)

| Pop | Easy | Normal | Hard |
|-----|------|--------|------|
| 1 | **80%** Spokój | **58%** Napięcie | **34%** Niepokój |
| 2 | **68%** Napięcie | **46%** Niepokój | **25%** Bunt |
| 3 | **55%** Napięcie | **33%** Niepokój | **17%** Bunt |
| 4 | **43%** Niepokój | **21%** Bunt | **12%** Bunt |

Wagi PorPct: easy 55/45 · normal 50/50 · hard 45/55.

---

## JSON

Klucze: `prawo_bonus_osiedle_pop`, `szczescie_bonus_osiedle_pop`, `zdrowie_bonus_osiedle_pop` — tablice `[pop1, pop2, pop3, pop4]` per trudność.

Legacy (fallback): `prawo_bonus_osada`, `szczescie_male_miasto_bonus`, `zdrowie_male_miasto_bonus`.

---

## Kod

- `pickOsiedlePopBonus()` + `osiedlePopLabel()` — `gra/src/game/society-breakdown.ts`
- Zdrowie — `turn-economy.ts` (`osiedlePopBonus` w `HealthParams`)
- **Bez `main.ts`**

---

## Powiązane

- D16-A (bonus osady — zastąpiony skalą pop)
- D3-LUKSUS-USUN (Zamożność ≠ Luksus surowiec)
