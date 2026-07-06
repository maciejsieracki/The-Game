# MASTER → EKONOMIA (Grupa B): B2-D18 balans start × trudność

| Pole | Wartość |
|------|---------|
| **Status** | 🟢 **DO WDROŻENIA** |
| **Batch** | `D18-BALANS-TRUDNOSC` |
| **Decyzja Macieja** | **2026-07-02** — formularz ABC (pełny pakiet) · `docs/decyzje/B2-D18-ABC-MACIEJ.md` |
| **Warstwa** | 🟢 lane B — `society-params.json`, `econ-params.json`, `society-breakdown.ts`, `turn-economy.ts`, `wealth.ts`, `culture-religion.ts` · **bez `main.ts`** |

---

## Decyzje (kanon)

| ID | Wybór | Skutek implementacji |
|----|-------|---------------------|
| **D18-0** | **A** | Pełny pakiet §3–§7 propozycji + progi buntu z kodu → JSON |
| **D18-1** | **A** | Hard: bonus osady +2, próg buntu 10%, grace 2 (jak propozycja hard) |
| **D18-2** | **A** | Religia: `religia_kara_brak_religii` **tylko ze świątynią** (easy/normal/hard) |
| **D18-3** | **B** | Immunitet Wealth utrzymania: **10 / 5 / 3** tur (`wealth_immunitet_utrzymania_tur`) |
| **D18-4** | **A+C** | Easy stolica (pierwsze miasto gracza) T1–T10: **+1 Sz + +1 Prawo** |
| **D18-5** | **A** | Wagi Porządku: **55/45 · 50/50 · 45/55** |
| **D18-6** | **A** | Bonus osady: **+4 / +3 / +2** (pop ≤ 4) |

**Zasada UX (Maciej):** na **żadnej** trudności fałszywy **„Bunt skrajny” w T1** przy pierwszym mieście pop=1.

---

## AC — JSON (`society-params.json` + `econ-params.json`)

Wdrożyć tabele z `docs/decyzje/B2-D18-start-balans-trudnosc-PROPOZYCJA.md` §3–§8, z korektami decyzji powyżej:

1. **`prawo_bonus_osada`:** 4 / 3 / 2 · **`prawo_osada_prog_pop`:** 4
2. **`wealth_immunitet_utrzymania_tur`:** **10 / 5 / 3** (D18-3=B)
3. **`porzadek_waga_szczescie` / `porzadek_waga_prawo`:** 0,55/0,45 · 0,50/0,50 · 0,45/0,55
4. **`porzadek_prog_bunt_skrajny_pct`:** **5 / 8 / 10** (easy/normal/hard)
5. **`porzadek_grace_tur_bunt`:** **3 / 2 / 2**
6. **`wealth_utrzymanie_*`**, **`zdrowie_*`**, **`prawo_garnizon_*`** — jak §4–§8 propozycji
7. **`religia_kara_brak_religii`**, **`wealth_kara_zero`** — spójnie z D16 + D18-2=A

Eksport panelu B jeśli dotyczy — **targeted**, nie pełny export.

---

## AC — kod

1. **`society-breakdown.ts`:** progi buntu + grace **czytane z JSON per difficulty** (nie hardcoded 10%/2).
2. **Bonus stolica easy (D18-4 A+C):** pierwsze miasto gracza (`capital` lub founding order), `turn ≤ 10`, difficulty easy → **+1 netto Sz + +1 netto Prawo** w breakdown (linie UI widoczne).
3. **Immunitet Wealth:** founding immunitet z JSON per difficulty (10/5/3 tur).
4. **Regresja D16–D17:** `cityHasWaterAccess`, religia bez świątyni, D16 start — **bez regresji**.

---

## Testy (PASS przed meldunkiem)

```
node gra/tools/society-breakdown-test.cjs   — rozszerzyć: easy/normal/hard T1 pop=1, progi, stolica
node gra/tools/wire-ekonomia-test.cjs
node gra/tools/wealth-test.cjs              — immunitet 10/5/3
```

**DoD playtest scenariusz (Master):** T1 pop=1 · easy PorPct ≥30% · normal ≥22% · hard ≥15% (bez „Bunt skrajny” T1).

---

## Meldunek

Append `EKONOMIA-DO-MASTERA.md`:

```
→ MASTER: GOTOWE · batch D18-BALANS-TRUDNOSC · testy X/X
Handoff: lista kluczy JSON + scenariusze testów
```

**NIE** edytuj `main.ts` · **NIE** publikuj ROBOCZA (Integrator F po ACK Master, jeśli wymagane wpięcie).

**Powiązane:** `B2-D18-ABC-MACIEJ.md` · D16–D17 ✅ · `REJESTR-DECYZJI.md` B2-D18
